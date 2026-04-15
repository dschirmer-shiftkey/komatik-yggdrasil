/**
 * Seedling Gateway — slim OpenClaw-compatible MCP server
 *
 * Extracted from the full komatik-agents MCP server for portable,
 * containerized Seedling deployments. Provides:
 *
 * - Agent identity registration and RBAC
 * - Workflow engine (create, advance, complete/fail steps)
 * - Rate limiting (per-agent, per-tier sliding window)
 * - Health endpoint for Docker health checks
 * - LLM proxy routing through Bifrost
 *
 * Full implementation requires extracting and adapting:
 *   - mcp-server/server.js (tool registration, RBAC wrapper)
 *   - mcp-server/workflow-engine.js (step orchestration)
 *   - mcp-server/rbac.js (YAML policy enforcement)
 *   - mcp-server/rate-limiter.js (sliding window throttle)
 *
 * Environment:
 *   WORKSPACE_PATH  — mounted workspace root
 *   DATABASE_URL    — PostgreSQL connection string
 *   BIFROST_URL     — Bifrost AI gateway for LLM calls
 *   PORT            — HTTP port (default 18789)
 */

import http from "node:http";
import { Pool } from "pg";

const PORT = parseInt(process.env.PORT || "18789", 10);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const healthServer = http.createServer(async (req, res) => {
  if (req.url === "/health") {
    try {
      await pool.query("SELECT 1");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", service: "seedling-gateway" }));
    } catch (err) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "unhealthy", error: err.message }));
    }
    return;
  }
  res.writeHead(404);
  res.end();
});

healthServer.listen(PORT, () => {
  console.log(`[seedling-gateway] Health endpoint listening on :${PORT}`);
});

// TODO: Extract and mount the full MCP server tooling from komatik-agents:
//   - server.js tool registrations (register_identity, create_workflow, etc.)
//   - workflow-engine.js (advanceWorkflow, getReadySteps, backpressure)
//   - rbac.js (YAML policy loader, authorize function)
//   - rate-limiter.js (sliding window per agent per tier)
//   - StdioServerTransport for OpenClaw agent connections
//
// For now this is the gateway skeleton with health checks and DB connectivity.
// The full extraction is tracked as GOAL-YG1 in the Yggdrasil roadmap.

process.on("SIGTERM", async () => {
  console.log("[seedling-gateway] Shutting down...");
  healthServer.close();
  await pool.end();
  process.exit(0);
});
