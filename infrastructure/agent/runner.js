/**
 * Seedling Agent Runner
 *
 * Boots a single agent role within a Seedling. Implements the full
 * session protocol from AGENTS.md:
 *
 *   Session Start:
 *     1. Register identity with the gateway
 *     2. Load SOUL.md and MISSION.md
 *     3. Assemble context (memory, learnings, tasks) from DB
 *     4. Check workflow queue for pending steps
 *
 *   Agent Loop:
 *     5. Claim and execute workflow steps via Bifrost LLM calls
 *     6. Log every decision to the decisions audit trail
 *     7. Record run telemetry (tokens, cost, duration)
 *     8. Refresh context after each step to absorb new learnings
 *     9. Circuit breaker: 5 consecutive failures → hard stop
 *
 *   Session End:
 *     10. Update session status and summary
 *     11. Close DB pool
 *
 * Environment:
 *   AGENT_ROLE       — one of: mission, research, analysis, prototype, documentation, community
 *   AGENT_ID         — agent identifier (usually same as role)
 *   GATEWAY_URL      — gateway HTTP endpoint
 *   WORKSPACE_PATH   — mounted workspace root
 *   DATABASE_URL     — PostgreSQL connection string
 *   BIFROST_URL      — Bifrost AI gateway for LLM calls
 */

import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { assembleContext } from "./lib/context-assembler.js";
import { logDecision } from "./lib/decisions.js";

const ROLE = process.env.AGENT_ROLE;
const AGENT_ID = process.env.AGENT_ID || ROLE;
const GATEWAY_URL = process.env.GATEWAY_URL || "http://gateway:18789";
const WORKSPACE = process.env.WORKSPACE_PATH || "/workspace";
const BIFROST_URL = process.env.BIFROST_URL || "http://bifrost:8080";
const CONTEXT_BUDGET_PATH = path.join(WORKSPACE, "config", "context-budget.yaml");

const MAX_CONSECUTIVE_FAILURES = 5;
const POLL_INTERVAL_MS = 30_000;

if (!ROLE) {
  console.error("[agent] AGENT_ROLE is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Gateway readiness ───────────────────────────────────────────────────

async function waitForGateway(maxRetries = 30, intervalMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${GATEWAY_URL}/health`);
      if (res.ok) return true;
    } catch {}
    console.log(`[agent:${ROLE}] Waiting for gateway... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Gateway did not become healthy");
}

// ── Static context loaders ──────────────────────────────────────────────

function loadSoul() {
  const soulPath = path.join(WORKSPACE, "souls", `${ROLE}.md`);
  if (fs.existsSync(soulPath)) {
    return fs.readFileSync(soulPath, "utf-8");
  }
  console.warn(`[agent:${ROLE}] No SOUL.md found at ${soulPath}`);
  return "";
}

function loadMission() {
  const missionPath = path.join(WORKSPACE, "mission", "MISSION.md");
  if (fs.existsSync(missionPath)) {
    return fs.readFileSync(missionPath, "utf-8");
  }
  console.warn(`[agent:${ROLE}] No MISSION.md found`);
  return "";
}

// ── Session lifecycle ───────────────────────────────────────────────────

async function registerSession() {
  const result = await pool.query(
    `INSERT INTO agent_sessions (agent_id, status, context)
     VALUES ($1, 'active', $2)
     RETURNING id`,
    [AGENT_ID, JSON.stringify({ role: ROLE, started: new Date().toISOString() })]
  );
  return result.rows[0].id;
}

async function endSession(sessionId, status, summary) {
  await pool.query(
    `UPDATE agent_sessions
     SET ended_at = now(), status = $1, result = $2
     WHERE id = $3`,
    [status, summary, sessionId]
  );
}

async function recordRun(jobName, status, summary, tokensUsed, costUsd, durationSeconds) {
  await pool.query(
    `INSERT INTO agent_runs
       (agent_id, job_name, status, summary, tokens_used, cost_usd, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [AGENT_ID, jobName, status, summary, tokensUsed, costUsd, durationSeconds]
  );
}

// ── Workflow step management ────────────────────────────────────────────

async function getPendingSteps() {
  const result = await pool.query(
    `SELECT ws.id, ws.task, ws.input, w.id AS workflow_id, w.name AS workflow_name
     FROM workflow_steps ws
     JOIN workflows w ON w.id = ws.workflow_id
     WHERE ws.agent_id = $1
       AND ws.status = 'pending'
       AND w.status IN ('pending', 'running')
       AND NOT EXISTS (
         SELECT 1 FROM workflow_steps dep
         WHERE dep.id = ANY(ws.depends_on)
           AND dep.status != 'completed'
       )
     ORDER BY ws.step_order
     LIMIT 1`,
    [AGENT_ID]
  );
  return result.rows;
}

async function claimStep(stepId) {
  await pool.query(
    "UPDATE workflow_steps SET status = 'running', started_at = now() WHERE id = $1",
    [stepId]
  );
  await pool.query(
    `UPDATE workflows SET status = 'running', updated_at = now()
     WHERE id = (SELECT workflow_id FROM workflow_steps WHERE id = $1)
       AND status = 'pending'`,
    [stepId]
  );
}

async function completeStep(stepId, output) {
  await pool.query(
    "UPDATE workflow_steps SET status = 'completed', output = $1, completed_at = now() WHERE id = $2",
    [JSON.stringify(output), stepId]
  );
}

async function failStep(stepId, error) {
  await pool.query(
    "UPDATE workflow_steps SET status = 'failed', output = $1, completed_at = now() WHERE id = $2",
    [JSON.stringify({ error }), stepId]
  );
}

// ── Bifrost LLM integration ────────────────────────────────────────────

async function callBifrost(systemPrompt, userPrompt) {
  const res = await fetch(`${BIFROST_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bifrost error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const usage = data.usage || {};
  return {
    content: data.choices?.[0]?.message?.content || "",
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    model: data.model || "unknown",
  };
}

// ── Step execution ──────────────────────────────────────────────────────

async function executeStep(step, systemPrompt, sessionContext) {
  const userPrompt = [
    "# Your Current Task\n",
    `**Workflow**: ${step.workflow_name}`,
    `**Task**: ${step.task}`,
    step.input && Object.keys(step.input).length > 0
      ? `**Input from previous step**:\n\`\`\`json\n${JSON.stringify(step.input, null, 2)}\n\`\`\``
      : "",
    "\n---\n",
    sessionContext,
    "\n---\n",
    "Complete the task above. Be thorough and specific.",
    "Structure your output clearly so the next agent in the pipeline can use it.",
  ]
    .filter(Boolean)
    .join("\n");

  const startTime = Date.now();
  const response = await callBifrost(systemPrompt, userPrompt);
  const durationSeconds = Math.round((Date.now() - startTime) / 1000);

  const decision = await logDecision(pool, {
    agentId: AGENT_ID,
    decisionType: "workflow_step",
    description: `Completed step: ${step.task.slice(0, 200)}`,
    reasoning: `Part of workflow ${step.workflow_name}`,
    confidence: 0.8,
    outcome: "success",
  });

  await pool.query(
    `INSERT INTO llm_usage
       (agent_id, provider, model, task_type, input_tokens, output_tokens, cost_usd, latency_ms)
     VALUES ($1, 'bifrost', $2, $3, $4, $5, 0, $6)`,
    [
      AGENT_ID,
      response.model,
      "workflow_step",
      response.inputTokens,
      response.outputTokens,
      durationSeconds * 1000,
    ]
  );

  return {
    content: response.content,
    decision,
    tokensUsed: response.inputTokens + response.outputTokens,
    durationSeconds,
  };
}

// ── Agent loop ──────────────────────────────────────────────────────────

async function agentLoop(sessionId, soul, mission, sessionContext) {
  const systemPrompt = [soul, "\n---\n", mission].join("");
  let context = sessionContext;
  let consecutiveFailures = 0;

  while (true) {
    const steps = await getPendingSteps();

    if (steps.length === 0) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    const step = steps[0];
    console.log(`[agent:${ROLE}] Claiming step: ${step.task.slice(0, 80)}`);
    await claimStep(step.id);

    try {
      const result = await executeStep(step, systemPrompt, context);
      await completeStep(step.id, { content: result.content });
      await recordRun(
        `${step.workflow_name}/${step.task.slice(0, 50)}`,
        "success",
        `Completed in ${result.durationSeconds}s, ${result.tokensUsed} tokens`,
        result.tokensUsed,
        0,
        result.durationSeconds
      );

      console.log(
        `[agent:${ROLE}] Step completed (${result.tokensUsed} tokens, ${result.durationSeconds}s)`
      );
      consecutiveFailures = 0;

      const refreshed = await assembleContext(pool, AGENT_ID, CONTEXT_BUDGET_PATH);
      context = refreshed.context;
    } catch (err) {
      console.error(`[agent:${ROLE}] Step failed:`, err.message);
      await failStep(step.id, err.message);

      await logDecision(pool, {
        agentId: AGENT_ID,
        decisionType: "workflow_step_failure",
        description: `Failed step: ${step.task.slice(0, 200)}`,
        reasoning: err.message,
        confidence: 0,
        outcome: "failure",
      });

      await recordRun(
        `${step.workflow_name}/${step.task.slice(0, 50)}`,
        "failure",
        err.message.slice(0, 500),
        0,
        0,
        0
      );

      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        const msg = `Circuit breaker: ${MAX_CONSECUTIVE_FAILURES} consecutive failures`;
        console.error(`[agent:${ROLE}] ${msg} — stopping`);
        await endSession(sessionId, "failed", msg);
        return;
      }
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[agent:${ROLE}] Starting...`);

  await waitForGateway();
  console.log(`[agent:${ROLE}] Gateway is healthy`);

  // Session start protocol (AGENTS.md §Session Start)
  const soul = loadSoul();
  const mission = loadMission();
  console.log(
    `[agent:${ROLE}] Loaded SOUL.md (${soul.length} chars), MISSION.md (${mission.length} chars)`
  );

  const sessionId = await registerSession();
  console.log(`[agent:${ROLE}] Session registered: ${sessionId}`);

  const { context: sessionContext, tokenCount, budget } = await assembleContext(
    pool,
    AGENT_ID,
    CONTEXT_BUDGET_PATH
  );
  console.log(
    `[agent:${ROLE}] Context assembled: ${tokenCount} tokens (budget: ${budget.max_context_tokens})`
  );

  // Wire up graceful shutdown before entering the loop
  process.on("SIGTERM", async () => {
    console.log(`[agent:${ROLE}] Shutting down...`);
    await endSession(sessionId, "completed", "Graceful shutdown via SIGTERM");
    await pool.end();
    process.exit(0);
  });

  await agentLoop(sessionId, soul, mission, sessionContext);
}

main().catch(async (err) => {
  console.error(`[agent:${ROLE}] Fatal error:`, err);
  process.exit(1);
});
