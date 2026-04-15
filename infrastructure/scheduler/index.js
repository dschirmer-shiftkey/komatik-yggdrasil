/**
 * Seedling Scheduler — portable cycle loop manager
 *
 * Replaces OS-level cron with a container-native scheduling service.
 * Triggers research cycles by creating workflows in the gateway and
 * advancing them through the 6-agent pipeline.
 *
 * Cycle flow:
 *   1. Create a new workflow with steps for each agent role
 *   2. Trigger the Research agent (step 1)
 *   3. Poll for step completion and advance to next step
 *   4. After Documentation completes, trigger Mission review
 *   5. If approved, signal Publisher to commit outputs
 *   6. Wait for CYCLE_INTERVAL_MINUTES, then repeat
 *
 * Environment:
 *   GATEWAY_URL              — gateway HTTP endpoint
 *   CYCLE_INTERVAL_MINUTES   — minutes between research cycles (default: 60)
 *   DATABASE_URL             — PostgreSQL connection string
 */

import { Pool } from "pg";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://gateway:18789";
const CYCLE_INTERVAL_MS = (parseInt(process.env.CYCLE_INTERVAL_MINUTES || "60", 10)) * 60 * 1000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CYCLE_STEPS = [
  { agent_id: "research",      task: "Discover new sources, datasets, and prior art relevant to the mission. Synthesize into structured summaries." },
  { agent_id: "analysis",      task: "Model the research findings. Identify patterns, quantify impact, rank approaches by feasibility." },
  { agent_id: "prototype",     task: "Build proof-of-concepts from the top-ranked analysis recommendations." },
  { agent_id: "documentation", task: "Structure all outputs for public readability. Update FINDINGS.md with this cycle's discoveries." },
  { agent_id: "mission",       task: "Review all cycle outputs against MISSION.md. Approve for publication or return with feedback." },
  { agent_id: "community",     task: "Triage any external contributions received since last cycle. Route quality inputs to appropriate agents." },
];

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

async function createCycleWorkflow() {
  const cycleNumber = (await pool.query("SELECT COUNT(*) FROM workflows")).rows[0].count;

  const result = await pool.query(
    `INSERT INTO workflows (name, description, created_by, status, context)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING id`,
    [
      `research-cycle-${parseInt(cycleNumber) + 1}`,
      `Automated research cycle #${parseInt(cycleNumber) + 1}`,
      "scheduler",
      JSON.stringify({ cycle: parseInt(cycleNumber) + 1, started: new Date().toISOString() }),
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

  console.log(`[scheduler] Created workflow ${workflowId} with ${CYCLE_STEPS.length} steps`);
  return workflowId;
}

async function runCycle() {
  console.log(`[scheduler] Starting new research cycle...`);
  try {
    const workflowId = await createCycleWorkflow();
    console.log(`[scheduler] Workflow ${workflowId} created — agents will pick up steps from the queue`);

    // TODO: Full orchestration loop (GOAL-YG1):
    //   - Advance workflow via gateway API as steps complete
    //   - Handle failures with circuit breaker pattern
    //   - Signal publisher when mission agent approves

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
