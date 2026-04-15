/**
 * Seedling Agent Runner
 *
 * Boots a single agent role within a Seedling. Implements the full
 * session protocol from AGENTS.md:
 *
 *   Session Start:
 *     1. Register identity with the gateway
 *     2. Load SOUL.md, MISSION.md, and role config YAML
 *     3. Assemble context (memory, learnings, tasks) from DB
 *     4. Check workflow queue for pending steps
 *
 *   Agent Loop:
 *     5. Atomically claim workflow steps (FOR UPDATE SKIP LOCKED)
 *     6. Execute via Bifrost LLM calls
 *     7. Log decisions, record telemetry, propagate output to next step
 *     8. Write file artifacts to /workspace/output
 *     9. Refresh context after each step
 *     10. Circuit breaker: 5 consecutive failures -> hard stop
 *
 *   Session End:
 *     11. Update session status and summary
 *     12. Close DB pool
 *
 * Environment:
 *   AGENT_ROLE        — one of: mission, research, analysis, prototype, documentation, community
 *   AGENT_ID          — agent identifier (usually same as role)
 *   GATEWAY_URL       — gateway HTTP endpoint
 *   WORKSPACE_PATH    — mounted workspace root
 *   DATABASE_URL      — PostgreSQL connection string
 *   BIFROST_URL       — Bifrost AI gateway for LLM calls
 *   BIFROST_API_KEY   — Bifrost virtual key for auth
 */

import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import yaml from "js-yaml";
import { assembleContext } from "./lib/context-assembler.js";
import { logDecision } from "./lib/decisions.js";

const ROLE = process.env.AGENT_ROLE;
const AGENT_ID = process.env.AGENT_ID || ROLE;
const GATEWAY_URL = process.env.GATEWAY_URL || "http://gateway:18789";
const WORKSPACE = process.env.WORKSPACE_PATH || "/workspace";
const BIFROST_URL = process.env.BIFROST_URL || "http://bifrost:8080";
const BIFROST_API_KEY = process.env.BIFROST_API_KEY || "";
const CONTEXT_BUDGET_PATH = path.join(WORKSPACE, "config", "context-budget.yaml");
const AGENT_CONFIG_PATH = path.join(WORKSPACE, "config", "agent.yaml");
const OUTPUT_DIR = path.join(WORKSPACE, "output");

const MAX_CONSECUTIVE_FAILURES = 5;
const POLL_INTERVAL_MS = 30_000;

if (!ROLE) {
  console.error("[agent] AGENT_ROLE is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Config loaders ──────────────────────────────────────────────────────

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

function loadAgentConfig() {
  if (!fs.existsSync(AGENT_CONFIG_PATH)) {
    console.warn(`[agent:${ROLE}] No agent config at ${AGENT_CONFIG_PATH}`);
    return {};
  }
  try {
    return yaml.load(fs.readFileSync(AGENT_CONFIG_PATH, "utf-8")) || {};
  } catch (err) {
    console.warn(`[agent:${ROLE}] Failed to parse agent config: ${err.message}`);
    return {};
  }
}

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
  try {
    await pool.query(
      `UPDATE agent_sessions
       SET ended_at = now(), status = $1, result = $2
       WHERE id = $3`,
      [status, summary, sessionId]
    );
  } catch (err) {
    console.error(`[agent:${ROLE}] Failed to end session: ${err.message}`);
  }
}

async function recordRun(jobName, status, summary, tokensUsed, costUsd, durationSeconds) {
  await pool.query(
    `INSERT INTO agent_runs
       (agent_id, job_name, status, summary, tokens_used, cost_usd, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [AGENT_ID, jobName, status, summary, tokensUsed, costUsd, durationSeconds]
  );
}

// ── Atomic workflow step management ─────────────────────────────────────

async function claimNextStep() {
  const result = await pool.query(
    `UPDATE workflow_steps
     SET status = 'running', started_at = now()
     WHERE id = (
       SELECT ws.id
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
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, task, input,
       (SELECT w.id FROM workflows w
        JOIN workflow_steps ws2 ON ws2.workflow_id = w.id
        WHERE ws2.id = workflow_steps.id) AS workflow_id,
       (SELECT w.name FROM workflows w
        JOIN workflow_steps ws2 ON ws2.workflow_id = w.id
        WHERE ws2.id = workflow_steps.id) AS workflow_name`,
    [AGENT_ID]
  );

  if (result.rows.length === 0) return null;

  const step = result.rows[0];

  await pool.query(
    `UPDATE workflows SET status = 'running', updated_at = now()
     WHERE id = $1 AND status = 'pending'`,
    [step.workflow_id]
  );

  return step;
}

async function completeStep(stepId, output) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE workflow_steps SET status = 'completed', output = $1, completed_at = now() WHERE id = $2",
      [JSON.stringify(output), stepId]
    );

    await client.query(
      `UPDATE workflow_steps
       SET input = $1
       WHERE id IN (
         SELECT dep_step.id
         FROM workflow_steps dep_step
         WHERE $2 = ANY(dep_step.depends_on)
           AND dep_step.status = 'pending'
       )`,
      [JSON.stringify(output), stepId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function failStep(stepId, error) {
  await pool.query(
    "UPDATE workflow_steps SET status = 'failed', output = $1, completed_at = now() WHERE id = $2",
    [JSON.stringify({ error }), stepId]
  );
}

// ── File artifact output ────────────────────────────────────────────────

function writeArtifact(stepTask, content) {
  const roleDir = path.join(OUTPUT_DIR, ROLE);
  fs.mkdirSync(roleDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = stepTask.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  const filename = `${timestamp}-${slug}.md`;
  const filePath = path.join(roleDir, filename);

  fs.writeFileSync(filePath, content);
  console.log(`[agent:${ROLE}] Wrote artifact: ${ROLE}/${filename}`);
  return filePath;
}

// ── Bifrost LLM integration ────────────────────────────────────────────

async function callBifrost(systemPrompt, userPrompt) {
  const headers = { "Content-Type": "application/json" };
  if (BIFROST_API_KEY) {
    headers["Authorization"] = `Bearer ${BIFROST_API_KEY}`;
  }

  const res = await fetch(`${BIFROST_URL}/v1/chat/completions`, {
    method: "POST",
    headers,
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
    costUsd: usage.total_cost || 0,
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
  const totalTokens = response.inputTokens + response.outputTokens;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO decisions
         (agent_id, decision_type, description, reasoning, confidence, outcome)
       VALUES ($1, 'workflow_step', $2, $3, 0.8, 'success')`,
      [
        AGENT_ID,
        `Completed step: ${step.task.slice(0, 200)}`,
        `Part of workflow ${step.workflow_name}`,
      ]
    );

    await client.query(
      `INSERT INTO llm_usage
         (agent_id, provider, model, task_type, input_tokens, output_tokens, cost_usd, latency_ms)
       VALUES ($1, 'bifrost', $2, 'workflow_step', $3, $4, $5, $6)`,
      [AGENT_ID, response.model, response.inputTokens, response.outputTokens, response.costUsd, durationSeconds * 1000]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.warn(`[agent:${ROLE}] Failed to record telemetry: ${err.message}`);
  } finally {
    client.release();
  }

  return {
    content: response.content,
    tokensUsed: totalTokens,
    costUsd: response.costUsd,
    durationSeconds,
  };
}

// ── Agent loop ──────────────────────────────────────────────────────────

async function agentLoop(sessionId, soul, mission, sessionContext) {
  const systemPrompt = [soul, "\n---\n", mission].join("");
  let context = sessionContext;
  let consecutiveFailures = 0;

  while (true) {
    const step = await claimNextStep();

    if (!step) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    console.log(`[agent:${ROLE}] Claimed step: ${step.task.slice(0, 80)}`);

    try {
      const result = await executeStep(step, systemPrompt, context);

      await completeStep(step.id, { content: result.content });

      writeArtifact(step.task, result.content);

      await recordRun(
        `${step.workflow_name}/${step.task.slice(0, 50)}`,
        "success",
        `Completed in ${result.durationSeconds}s, ${result.tokensUsed} tokens`,
        result.tokensUsed,
        result.costUsd,
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
        0, 0, 0
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

let sessionId = null;

async function main() {
  console.log(`[agent:${ROLE}] Starting...`);

  await waitForGateway();
  console.log(`[agent:${ROLE}] Gateway is healthy`);

  const soul = loadSoul();
  const mission = loadMission();
  const agentConfig = loadAgentConfig();
  console.log(
    `[agent:${ROLE}] Loaded SOUL.md (${soul.length} chars), MISSION.md (${mission.length} chars), config keys: [${Object.keys(agentConfig).join(", ")}]`
  );

  sessionId = await registerSession();
  console.log(`[agent:${ROLE}] Session registered: ${sessionId}`);

  const { context: sessionContext, tokenCount, budget } = await assembleContext(
    pool, AGENT_ID, CONTEXT_BUDGET_PATH
  );
  console.log(
    `[agent:${ROLE}] Context assembled: ${tokenCount} tokens (budget: ${budget.max_context_tokens})`
  );

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
  if (sessionId) {
    await endSession(sessionId, "failed", `Fatal: ${err.message}`);
  }
  await pool.end().catch(() => {});
  process.exit(1);
});
