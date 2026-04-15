/**
 * Seedling Gateway — slim OpenClaw-compatible MCP server
 *
 * On startup:
 *   1. Bind the health endpoint (returns 503 until migrations complete)
 *   2. Run schema migrations so existing Docker volumes get updates
 *   3. Report healthy — downstream containers (agents, scheduler) can start
 *
 * Provides:
 *   - Schema migration on every boot (not just first boot)
 *   - Agent identity registration and RBAC (TODO: GOAL-YG1)
 *   - Workflow engine (TODO: GOAL-YG1)
 *   - Rate limiting (TODO: GOAL-YG1)
 *   - Health endpoint for Docker health checks
 *   - LLM proxy routing through Bifrost (TODO: GOAL-YG1)
 *
 * Environment:
 *   WORKSPACE_PATH  — mounted workspace root
 *   DATABASE_URL    — PostgreSQL connection string
 *   BIFROST_URL     — Bifrost AI gateway for LLM calls
 *   PORT            — HTTP port (default 18789)
 */

import http from "node:http";
import { Pool } from "pg";
import { runMigrations } from "./migrate.js";

const PORT = parseInt(process.env.PORT || "18789", 10);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let migrationsDone = false;

const healthServer = http.createServer(async (req, res) => {
  if (req.url === "/health") {
    if (!migrationsDone) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "starting", reason: "migrations pending" })
      );
      return;
    }
    try {
      await pool.query("SELECT 1");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "healthy", service: "seedling-gateway" })
      );
    } catch (err) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "unhealthy", error: err.message }));
    }
    return;
  }
  res.writeHead(404);
  res.end();
});

async function startup() {
  console.log("[seedling-gateway] Running schema migrations...");
  const result = await runMigrations(pool);
  migrationsDone = true;
  console.log(
    `[seedling-gateway] Ready (${result.applied} applied, ${result.skipped} skipped)`
  );
}

healthServer.listen(PORT, () => {
  console.log(`[seedling-gateway] Health endpoint listening on :${PORT}`);
  startup().catch((err) => {
    console.error("[seedling-gateway] Startup failed:", err.message);
    process.exit(1);
  });
});

process.on("SIGTERM", async () => {
  console.log("[seedling-gateway] Shutting down...");
  healthServer.close();
  await pool.end();
  process.exit(0);
});
