/**
 * Seed Gateway — MCP-compatible tool server with RBAC
 *
 * On startup:
 *   1. Bind the HTTP server (health returns 503 until ready)
 *   2. Run schema migrations for existing Docker volumes
 *   3. Load RBAC policies from config
 *   4. Register all tool handlers
 *   5. Report healthy — downstream containers can start
 *
 * Provides:
 *   - POST /api/tool — execute a tool with RBAC enforcement
 *   - GET /health — liveness probe for Docker healthchecks
 *   - Schema migration on every boot
 *   - 17 tools matching rbac-policies.yaml definitions
 *
 * Environment:
 *   WORKSPACE_PATH  — mounted workspace root
 *   DATABASE_URL    — PostgreSQL connection string
 *   PORT            — HTTP port (default 18789)
 */

import http from "node:http";
import path from "node:path";
import { Pool } from "pg";
import { runMigrations } from "./migrate.js";
import { loadPolicies, authorize } from "./rbac.js";
import { TOOL_HANDLERS } from "./tools.js";

const PORT = parseInt(process.env.PORT || "18789", 10);
const WORKSPACE = process.env.WORKSPACE_PATH || "/workspace";
const RBAC_CONFIG_PATH = path.join(WORKSPACE, "config", "rbac-policies.yaml");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let ready = false;

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  // Health endpoint
  if (req.url === "/health" && req.method === "GET") {
    if (!ready) {
      return sendJson(res, 503, { status: "starting", reason: "migrations pending" });
    }
    try {
      await pool.query("SELECT 1");
      return sendJson(res, 200, { status: "healthy", service: "seed-gateway", tools: Object.keys(TOOL_HANDLERS).length });
    } catch (err) {
      return sendJson(res, 503, { status: "unhealthy", error: err.message });
    }
  }

  // Tool execution endpoint
  if (req.url === "/api/tool" && req.method === "POST") {
    if (!ready) {
      return sendJson(res, 503, { error: "Gateway not ready" });
    }

    let body;
    try {
      body = await parseBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }

    const { agent_id, tool, args } = body;

    if (!agent_id || !tool) {
      return sendJson(res, 400, { error: "agent_id and tool are required" });
    }

    if (!TOOL_HANDLERS[tool]) {
      return sendJson(res, 404, { error: `Unknown tool: ${tool}` });
    }

    const auth = authorize(agent_id, tool);
    if (!auth.allowed) {
      console.warn(`[gateway] RBAC denied: ${agent_id} -> ${tool}: ${auth.reason}`);
      return sendJson(res, 403, { error: `Access denied: ${auth.reason}` });
    }

    try {
      const result = await TOOL_HANDLERS[tool](pool, { agent_id, ...args });
      return sendJson(res, 200, { tool, result });
    } catch (err) {
      console.error(`[gateway] Tool '${tool}' failed:`, err.message);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Tool listing endpoint
  if (req.url === "/api/tools" && req.method === "GET") {
    return sendJson(res, 200, { tools: Object.keys(TOOL_HANDLERS) });
  }

  sendJson(res, 404, { error: "Not found" });
});

async function startup() {
  console.log("[seed-gateway] Running schema migrations...");
  const migrationResult = await runMigrations(pool);
  console.log(
    `[seed-gateway] Migrations: ${migrationResult.applied} applied, ${migrationResult.skipped} skipped`
  );

  loadPolicies(RBAC_CONFIG_PATH);

  ready = true;
  console.log(
    `[seed-gateway] Ready — ${Object.keys(TOOL_HANDLERS).length} tools registered`
  );
}

server.listen(PORT, () => {
  console.log(`[seed-gateway] Listening on :${PORT}`);
  startup().catch((err) => {
    console.error("[seed-gateway] Startup failed:", err.message);
    process.exit(1);
  });
});

process.on("SIGTERM", async () => {
  console.log("[seed-gateway] Shutting down...");
  server.close();
  await pool.end();
  process.exit(0);
});
