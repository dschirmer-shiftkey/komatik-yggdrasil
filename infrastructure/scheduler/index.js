/**
 * Seedling Scheduler — portable cycle loop manager
 *
 * Replaces OS-level cron with a container-native scheduling service.
 * Triggers research cycles and monitors them through completion.
 *
 * Cycle flow:
 *   1. Dedup check — skip if a cycle is already running or recently completed
 *   2. Create a new workflow with steps for each agent role
 *   3. Poll for step completions and advance workflow status
 *   4. Retry failed steps up to MAX_STEP_RETRIES before giving up
 *   5. Circuit breaker: abort workflow after MAX_WORKFLOW_FAILURES total failures
 *   6. Signal publisher when mission agent approves
 *   7. Wait for CYCLE_INTERVAL_MINUTES, then repeat
 *
 * Environment:
 *   GATEWAY_URL              — gateway HTTP endpoint
 *   CYCLE_INTERVAL_MINUTES   — minutes between research cycles (default: 60)
 *   DATABASE_URL             — PostgreSQL connection string
 */

import { Pool } from "pg";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://gateway:18789";
const CYCLE_INTERVAL_MS = parseInt(process.env.CYCLE_INTERVAL_MINUTES || "60", 10) * 60 * 1000;
const STEP_POLL_INTERVAL_MS = 15_000;
const MAX_STEP_RETRIES = 2;
const MAX_WORKFLOW_FAILURES = 5;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CYCLE_STEPS = [
  { agent_id: "research",      task: "Discover new sources, datasets, and prior art relevant to the mission. Synthesize into structured summaries." },
  { agent_id: "analysis",      task: "Model the research findings. Identify patterns, quantify impact, rank approaches by feasibility." },
  { agent_id: "prototype",     task: "Build proof-of-concepts from the top-ranked analysis recommendations." },
  { agent_id: "documentation", task: "Structure all outputs for public readability. Update FINDINGS.md with this cycle's discoveries." },
  { agent_id: "mission",       task: "Review all cycle outputs against MISSION.md. Approve for publication or return with feedback. You MUST include a JSON block with {\"approved\": true} or {\"approved\": false, \"reason\": \"...\"} in your response." },
  { agent_id: "community",     task: "Triage any external contributions received since last cycle. Route quality inputs to appropriate agents." },
];

// ── Gateway readiness ───────────────────────────────────────────────────

async function waitForGateway(maxRetries = 60, intervalMs = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${GATEWAY_URL}/health`);
      if (res.ok) return true;
    } catch {}
    console.log(`[scheduler] Waiting for gateway... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Gateway did not become healthy");
}

// ── Dedup check ─────────────────────────────────────────────────────────

async function shouldStartNewCycle() {
  const running = await pool.query(
    "SELECT id, name, status FROM workflows WHERE status IN ('pending', 'running') ORDER BY created_at DESC LIMIT 1"
  );
  if (running.rows.length > 0) {
    console.log(`[scheduler] Skipping — workflow '${running.rows[0].name}' is still ${running.rows[0].status}`);
    return false;
  }

  const recent = await pool.query(
    `SELECT id, name, status, created_at
     FROM workflows
     WHERE status = 'completed'
       AND created_at > now() - interval '10 minutes'
     ORDER BY created_at DESC LIMIT 1`
  );
  if (recent.rows.length > 0) {
    console.log(`[scheduler] Skipping — cycle '${recent.rows[0].name}' completed recently`);
    return false;
  }

  return true;
}

// ── Workflow creation ───────────────────────────────────────────────────

async function createCycleWorkflow() {
  const cycleNumber = parseInt(
    (await pool.query("SELECT COUNT(*) FROM workflows")).rows[0].count
  ) + 1;

  const result = await pool.query(
    `INSERT INTO workflows (name, description, created_by, status, context)
     VALUES ($1, $2, 'scheduler', 'pending', $3)
     RETURNING id`,
    [
      `research-cycle-${cycleNumber}`,
      `Automated research cycle #${cycleNumber}`,
      JSON.stringify({ cycle: cycleNumber, started: new Date().toISOString() }),
    ]
  );
  const workflowId = result.rows[0].id;

  const stepIds = [];
  for (let i = 0; i < CYCLE_STEPS.length; i++) {
    const step = CYCLE_STEPS[i];
    const depends = i > 0 ? [stepIds[i - 1]] : [];
    const stepResult = await pool.query(
      `INSERT INTO workflow_steps (workflow_id, step_order, agent_id, task, depends_on, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [workflowId, i + 1, step.agent_id, step.task, depends]
    );
    stepIds.push(stepResult.rows[0].id);
  }

  console.log(`[scheduler] Created workflow ${workflowId} — cycle #${cycleNumber}`);
  return workflowId;
}

// ── Step retry logic ────────────────────────────────────────────────────

async function retryFailedStep(stepId, workflowId) {
  const step = await pool.query("SELECT * FROM workflow_steps WHERE id = $1", [stepId]);
  if (!step.rows[0]) return false;

  const retryCount = step.rows[0].output?.retry_count || 0;
  if (retryCount >= MAX_STEP_RETRIES) {
    console.log(`[scheduler] Step ${stepId} (${step.rows[0].agent_id}) exhausted ${MAX_STEP_RETRIES} retries`);
    return false;
  }

  console.log(`[scheduler] Retrying step ${stepId} (${step.rows[0].agent_id}), attempt ${retryCount + 1}/${MAX_STEP_RETRIES}`);
  await pool.query(
    `UPDATE workflow_steps
     SET status = 'pending', started_at = NULL, completed_at = NULL,
         output = jsonb_build_object('retry_count', $1::int, 'last_error', output->'error')
     WHERE id = $2`,
    [retryCount + 1, stepId]
  );

  return true;
}

// ── Orchestration loop ──────────────────────────────────────────────────

async function monitorWorkflow(workflowId) {
  const startTime = Date.now();
  const MAX_WORKFLOW_DURATION_MS = 4 * 60 * 60 * 1000;
  let totalFailures = 0;

  while (true) {
    const steps = await pool.query(
      "SELECT id, agent_id, task, status, step_order, output FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order",
      [workflowId]
    );

    const completed = steps.rows.filter((s) => s.status === "completed").length;
    const failed = steps.rows.filter((s) => s.status === "failed");
    const running = steps.rows.filter((s) => s.status === "running").length;
    const total = steps.rows.length;

    console.log(
      `[scheduler] Workflow ${workflowId}: ${completed}/${total} completed, ${running} running, ${failed.length} failed`
    );

    if (completed === total) {
      await pool.query(
        "UPDATE workflows SET status = 'completed', updated_at = now(), result = $1 WHERE id = $2",
        [JSON.stringify({ completed_at: new Date().toISOString(), duration_ms: Date.now() - startTime }), workflowId]
      );
      console.log(`[scheduler] Workflow ${workflowId} COMPLETED`);

      const missionStep = steps.rows.find((s) => s.agent_id === "mission");
      if (missionStep) {
        await signalPublisher(workflowId, missionStep.id);
      }
      return "completed";
    }

    if (failed.length > 0) {
      let allExhausted = true;
      for (const failedStep of failed) {
        const retried = await retryFailedStep(failedStep.id, workflowId);
        if (retried) {
          allExhausted = false;
        }
        totalFailures++;
      }

      if (totalFailures >= MAX_WORKFLOW_FAILURES) {
        console.error(`[scheduler] Circuit breaker: ${totalFailures} total failures in workflow — aborting`);
        await pool.query(
          "UPDATE workflows SET status = 'failed', updated_at = now(), result = $1 WHERE id = $2",
          [JSON.stringify({ circuit_breaker: true, total_failures: totalFailures }), workflowId]
        );
        return "circuit_breaker";
      }

      if (allExhausted) {
        const agents = failed.map((s) => s.agent_id).join(", ");
        console.error(`[scheduler] Workflow ${workflowId} failed — steps exhausted retries: ${agents}`);
        await pool.query(
          "UPDATE workflows SET status = 'failed', updated_at = now(), result = $1 WHERE id = $2",
          [JSON.stringify({ failed_steps: failed.map((s) => s.agent_id), failed_at: new Date().toISOString() }), workflowId]
        );
        return "failed";
      }
    }

    if (Date.now() - startTime > MAX_WORKFLOW_DURATION_MS) {
      console.error(`[scheduler] Workflow ${workflowId} timed out after ${MAX_WORKFLOW_DURATION_MS / 60000} minutes`);
      await pool.query(
        "UPDATE workflows SET status = 'failed', updated_at = now(), result = $1 WHERE id = $2",
        [JSON.stringify({ timeout: true, duration_ms: Date.now() - startTime }), workflowId]
      );
      return "timeout";
    }

    await new Promise((r) => setTimeout(r, STEP_POLL_INTERVAL_MS));
  }
}

// ── Publisher signaling ─────────────────────────────────────────────────

function parseMissionApproval(output) {
  if (!output) return false;

  const text = typeof output === "string" ? output : JSON.stringify(output);

  const jsonMatch = text.match(/\{\s*"approved"\s*:\s*(true|false)[^}]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.approved === true;
    } catch {}
  }

  const content = (output.content || text).toLowerCase();
  if (content.includes("approved for publication") || content.includes("approve for publication")) return true;
  if (content.includes("publication approved")) return true;
  if (content.includes("not approved") || content.includes("do not approve")) return false;

  return true;
}

async function signalPublisher(workflowId, missionStepId) {
  const missionOutput = await pool.query(
    "SELECT output FROM workflow_steps WHERE id = $1",
    [missionStepId]
  );

  const output = missionOutput.rows[0]?.output;
  const approved = parseMissionApproval(output);

  if (approved) {
    await pool.query(
      `INSERT INTO agent_messages (from_agent, to_agent, subject, body)
       VALUES ('scheduler', 'publisher', 'publish_approved', $1)`,
      [JSON.stringify({ workflow_id: workflowId, approved_at: new Date().toISOString() })]
    );
    console.log(`[scheduler] Publication approved — signaled publisher`);
  } else {
    await pool.query(
      `INSERT INTO agent_messages (from_agent, to_agent, subject, body)
       VALUES ('scheduler', 'publisher', 'publish_rejected', $1)`,
      [JSON.stringify({ workflow_id: workflowId, reason: "Mission agent did not approve" })]
    );
    console.log(`[scheduler] Mission agent did not approve — skipping publication`);
  }
}

// ── Main cycle ──────────────────────────────────────────────────────────

async function runCycle() {
  console.log(`[scheduler] Starting new research cycle...`);

  if (!(await shouldStartNewCycle())) return;

  try {
    const workflowId = await createCycleWorkflow();

    await pool.query(
      "UPDATE workflows SET status = 'running', updated_at = now() WHERE id = $1",
      [workflowId]
    );

    const result = await monitorWorkflow(workflowId);
    console.log(`[scheduler] Cycle finished: ${result}`);
  } catch (err) {
    console.error(`[scheduler] Cycle failed:`, err.message);
  }
}

async function main() {
  console.log(`[scheduler] Starting with ${CYCLE_INTERVAL_MS / 60000}-minute cycle interval`);

  await waitForGateway();
  console.log(`[scheduler] Gateway is healthy`);

  await runCycle();

  setInterval(runCycle, CYCLE_INTERVAL_MS);

  process.on("SIGTERM", async () => {
    console.log("[scheduler] Shutting down...");
    await pool.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[scheduler] Fatal error:", err);
  process.exit(1);
});
