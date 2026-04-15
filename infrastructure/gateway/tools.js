/**
 * Gateway Tool Handlers
 *
 * Implements the 17 tools defined in rbac-policies.yaml.
 * Each handler takes (pool, args) and returns a result object.
 * The gateway server wraps these with RBAC enforcement.
 */

import fs from "node:fs";
import path from "node:path";
import { getAgentRole } from "./rbac.js";

const WORKSPACE = process.env.WORKSPACE_PATH || "/workspace";
const OUTPUT_DIR = path.join(WORKSPACE, "output");

// ── Identity ────────────────────────────────────────────────────────────

export async function register_identity(pool, { agent_id }) {
  const role = getAgentRole(agent_id);
  if (!role) {
    return { error: `Agent '${agent_id}' not recognized in RBAC policies` };
  }

  await pool.query(
    `INSERT INTO agent_sessions (agent_id, status, context)
     VALUES ($1, 'active', $2)
     ON CONFLICT DO NOTHING`,
    [agent_id, JSON.stringify({ role, registered: new Date().toISOString() })]
  );

  return { agent_id, role, status: "registered" };
}

// ── Workflow ────────────────────────────────────────────────────────────

export async function create_workflow(pool, { name, description, steps, created_by }) {
  const result = await pool.query(
    `INSERT INTO workflows (name, description, created_by, status, context)
     VALUES ($1, $2, $3, 'pending', '{}')
     RETURNING id`,
    [name, description || "", created_by]
  );
  const workflowId = result.rows[0].id;

  const stepIds = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const depends = i > 0 ? [stepIds[i - 1]] : [];
    const stepResult = await pool.query(
      `INSERT INTO workflow_steps (workflow_id, step_order, agent_id, task, depends_on, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [workflowId, i + 1, s.agent_id, s.task, depends]
    );
    stepIds.push(stepResult.rows[0].id);
  }

  return { workflow_id: workflowId, steps_created: stepIds.length };
}

export async function get_workflow(pool, { workflow_id }) {
  const wf = await pool.query(
    "SELECT * FROM workflows WHERE id = $1",
    [workflow_id]
  );
  if (wf.rows.length === 0) return { error: "Workflow not found" };

  const steps = await pool.query(
    "SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order",
    [workflow_id]
  );

  return { workflow: wf.rows[0], steps: steps.rows };
}

export async function advance_workflow(pool, { workflow_id }) {
  const steps = await pool.query(
    "SELECT id, status FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order",
    [workflow_id]
  );

  const allCompleted = steps.rows.every((s) => s.status === "completed");
  const anyFailed = steps.rows.some((s) => s.status === "failed");

  if (allCompleted) {
    await pool.query(
      "UPDATE workflows SET status = 'completed', updated_at = now() WHERE id = $1",
      [workflow_id]
    );
    return { workflow_id, status: "completed" };
  }

  if (anyFailed) {
    await pool.query(
      "UPDATE workflows SET status = 'failed', updated_at = now() WHERE id = $1",
      [workflow_id]
    );
    return { workflow_id, status: "failed" };
  }

  return { workflow_id, status: "running", steps: steps.rows };
}

export async function get_agent_queue(pool, { agent_id }) {
  const result = await pool.query(
    `SELECT ws.id, ws.task, ws.input, ws.status, w.name AS workflow_name
     FROM workflow_steps ws
     JOIN workflows w ON w.id = ws.workflow_id
     WHERE ws.agent_id = $1
       AND ws.status IN ('pending', 'running')
       AND w.status IN ('pending', 'running')
     ORDER BY ws.step_order
     LIMIT 10`,
    [agent_id]
  );
  return { agent_id, queue: result.rows };
}

export async function complete_step(pool, { step_id, output }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE workflow_steps SET status = 'completed', output = $1, completed_at = now() WHERE id = $2",
      [JSON.stringify(output), step_id]
    );

    await client.query(
      `UPDATE workflow_steps
       SET input = $1
       WHERE $2 = ANY(depends_on) AND status = 'pending'`,
      [JSON.stringify(output), step_id]
    );

    await client.query("COMMIT");
    return { step_id, status: "completed" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function fail_step(pool, { step_id, error }) {
  await pool.query(
    "UPDATE workflow_steps SET status = 'failed', output = $1, completed_at = now() WHERE id = $2",
    [JSON.stringify({ error }), step_id]
  );
  return { step_id, status: "failed" };
}

// ── Messaging ───────────────────────────────────────────────────────────

export async function send_agent_message(pool, { from_agent, to_agent, subject, body }) {
  const result = await pool.query(
    `INSERT INTO agent_messages (from_agent, to_agent, subject, body)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [from_agent, to_agent, subject, body]
  );
  return { message_id: result.rows[0].id };
}

export async function get_messages(pool, { agent_id, mark_read = true }) {
  const result = await pool.query(
    `SELECT id, from_agent, subject, body, created_at
     FROM agent_messages
     WHERE to_agent = $1 AND read = false
     ORDER BY created_at DESC
     LIMIT 50`,
    [agent_id]
  );

  if (mark_read && result.rows.length > 0) {
    const ids = result.rows.map((r) => r.id);
    await pool.query(
      "UPDATE agent_messages SET read = true WHERE id = ANY($1)",
      [ids]
    );
  }

  return { agent_id, messages: result.rows };
}

// ── Tasks ───────────────────────────────────────────────────────────────

export async function create_task(pool, { title, description, assigned_to, priority, created_by }) {
  const result = await pool.query(
    `INSERT INTO tasks (title, description, assigned_to, priority, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [title, description || "", assigned_to, priority || "medium", created_by]
  );
  return { task_id: result.rows[0].id };
}

export async function update_task(pool, { task_id, status, assigned_to, priority }) {
  const sets = [];
  const params = [];
  let idx = 1;

  if (status) { sets.push(`status = $${idx++}`); params.push(status); }
  if (assigned_to) { sets.push(`assigned_to = $${idx++}`); params.push(assigned_to); }
  if (priority) { sets.push(`priority = $${idx++}`); params.push(priority); }
  sets.push(`updated_at = now()`);
  params.push(task_id);

  if (sets.length === 1) return { task_id, status: "no changes" };

  await pool.query(
    `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${idx}`,
    params
  );
  return { task_id, status: "updated" };
}

// ── Files ───────────────────────────────────────────────────────────────

export async function write_output(pool, { agent_id, filename, content }) {
  const agentDir = path.join(OUTPUT_DIR, agent_id);
  fs.mkdirSync(agentDir, { recursive: true });

  const safeName = path.basename(filename);
  const filePath = path.join(agentDir, safeName);
  fs.writeFileSync(filePath, content);

  return { path: `${agent_id}/${safeName}`, bytes: Buffer.byteLength(content) };
}

export async function read_project_file(pool, { filepath }) {
  const safePath = path.resolve(WORKSPACE, filepath);
  if (!safePath.startsWith(WORKSPACE)) {
    return { error: "Path traversal denied" };
  }

  if (!fs.existsSync(safePath)) {
    return { error: "File not found" };
  }

  const stat = fs.statSync(safePath);
  if (stat.size > 1024 * 1024) {
    return { error: "File too large (>1MB)" };
  }

  return { filepath, content: fs.readFileSync(safePath, "utf-8") };
}

export async function search_codebase(pool, { query }) {
  const results = [];
  const searchDir = path.join(OUTPUT_DIR);

  if (!fs.existsSync(searchDir)) return { query, results: [] };

  function searchFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        searchFiles(fullPath);
      } else if (entry.isFile() && !entry.name.startsWith(".")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              path: path.relative(WORKSPACE, fullPath),
              snippet: content.slice(
                Math.max(0, content.toLowerCase().indexOf(query.toLowerCase()) - 100),
                content.toLowerCase().indexOf(query.toLowerCase()) + query.length + 100
              ),
            });
          }
        } catch {}
      }
      if (results.length >= 20) return;
    }
  }

  searchFiles(searchDir);
  return { query, results };
}

// ── System ──────────────────────────────────────────────────────────────

export async function get_system_health(pool) {
  const sessions = await pool.query(
    "SELECT status, COUNT(*) as count FROM agent_sessions GROUP BY status"
  );
  const workflows = await pool.query(
    "SELECT status, COUNT(*) as count FROM workflows GROUP BY status"
  );
  const usage = await pool.query(
    "SELECT SUM(input_tokens + output_tokens) as total_tokens, SUM(cost_usd) as total_cost FROM llm_usage"
  );

  return {
    sessions: Object.fromEntries(sessions.rows.map((r) => [r.status, parseInt(r.count)])),
    workflows: Object.fromEntries(workflows.rows.map((r) => [r.status, parseInt(r.count)])),
    tokens: parseInt(usage.rows[0]?.total_tokens || 0),
    cost_usd: parseFloat(usage.rows[0]?.total_cost || 0),
  };
}

export async function get_circuit_breaker_status(pool, { agent_id }) {
  const result = await pool.query(
    `SELECT status, created_at
     FROM agent_runs
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [agent_id]
  );

  let consecutiveFailures = 0;
  for (const run of result.rows) {
    if (run.status === "failure") consecutiveFailures++;
    else break;
  }

  return {
    agent_id,
    consecutive_failures: consecutiveFailures,
    tripped: consecutiveFailures >= 5,
    recent_runs: result.rows,
  };
}

export async function reset_circuit_breaker(pool, { agent_id }) {
  await pool.query(
    `INSERT INTO agent_runs (agent_id, job_name, status, summary)
     VALUES ($1, 'circuit_breaker_reset', 'success', 'Manual reset')`,
    [agent_id]
  );
  return { agent_id, status: "reset" };
}

// ── Tool registry ───────────────────────────────────────────────────────

export const TOOL_HANDLERS = {
  register_identity,
  create_workflow,
  get_workflow,
  advance_workflow,
  get_agent_queue,
  complete_step,
  fail_step,
  send_agent_message,
  get_messages,
  create_task,
  update_task,
  write_output,
  read_project_file,
  search_codebase,
  get_system_health,
  get_circuit_breaker_status,
  reset_circuit_breaker,
};
