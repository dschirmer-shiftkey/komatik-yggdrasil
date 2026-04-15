/**
 * Seedling Agent Runner
 *
 * Boots a single agent role within a Seedling. The runner:
 * 1. Registers identity with the gateway
 * 2. Loads the role's SOUL.md and mission context
 * 3. Checks the workflow queue for pending steps
 * 4. Executes assigned work via LLM calls through Bifrost
 * 5. Writes outputs to the shared /output volume
 * 6. Reports completion back to the gateway
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

const ROLE = process.env.AGENT_ROLE;
const AGENT_ID = process.env.AGENT_ID || ROLE;
const GATEWAY_URL = process.env.GATEWAY_URL || "http://gateway:18789";
const WORKSPACE = process.env.WORKSPACE_PATH || "/workspace";

if (!ROLE) {
  console.error("[agent] AGENT_ROLE is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

async function registerSession() {
  await pool.query(
    `INSERT INTO agent_sessions (agent_id, status, context)
     VALUES ($1, 'active', $2)`,
    [AGENT_ID, JSON.stringify({ role: ROLE, started: new Date().toISOString() })]
  );
}

async function main() {
  console.log(`[agent:${ROLE}] Starting...`);

  await waitForGateway();
  console.log(`[agent:${ROLE}] Gateway is healthy`);

  const soul = loadSoul();
  const mission = loadMission();
  console.log(`[agent:${ROLE}] Loaded SOUL.md (${soul.length} chars), MISSION.md (${mission.length} chars)`);

  await registerSession();
  console.log(`[agent:${ROLE}] Session registered`);

  // TODO: Full agent loop implementation (GOAL-YG1):
  //   1. Check workflow queue for steps assigned to this role
  //   2. Assemble context (soul + mission + memory + step input)
  //   3. Call LLM via Bifrost with assembled prompt
  //   4. Parse and validate output
  //   5. Write artifacts to /workspace/output
  //   6. Complete the workflow step via gateway
  //   7. Sleep until next scheduled cycle

  console.log(`[agent:${ROLE}] Agent runner skeleton ready — awaiting full implementation`);

  const keepAlive = setInterval(() => {}, 60_000);
  process.on("SIGTERM", async () => {
    console.log(`[agent:${ROLE}] Shutting down...`);
    clearInterval(keepAlive);
    await pool.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(`[agent:${ROLE}] Fatal error:`, err);
  process.exit(1);
});
