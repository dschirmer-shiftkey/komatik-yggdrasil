/**
 * Context Assembly Engine
 *
 * Builds the session context document from database state + config.
 * Reads context-budget.yaml for per-role token limits, then queries
 * decisions, runs, tasks, and messages to assemble a markdown context
 * that fits within the budget.
 *
 * Equivalent to komatik-agents' assemble-learnings.sh + assemble-context.sh,
 * but driven from Postgres rather than flat files.
 */

import fs from "node:fs";
import yaml from "js-yaml";

import path from "node:path";

const CHARS_PER_TOKEN = 4;
const BRANCH_FINDINGS_PATH = "/workspace/branch/SHARED-FINDINGS.md";

function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function truncateToTokens(text, maxTokens) {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[...truncated to fit context budget...]";
}

export function loadContextBudget(configPath) {
  if (!fs.existsSync(configPath)) {
    console.warn(`[context] Budget config not found at ${configPath}, using defaults`);
    return {
      defaults: {
        max_context_tokens: 8000,
        max_memory_tokens: 2000,
        compaction_lookback_days: 7,
        max_active_tasks: 5,
        max_recent_runs: 10,
      },
    };
  }
  return yaml.load(fs.readFileSync(configPath, "utf-8"));
}

export function getBudgetForRole(budgetConfig, role) {
  const defaults = budgetConfig.defaults || {};
  const override = budgetConfig.overrides?.[role] || {};
  return { ...defaults, ...override };
}

// ── DB Queries ──────────────────────────────────────────────────────────

async function queryLearnings(pool, agentId, lookbackDays) {
  const result = await pool.query(
    `SELECT decision_type, description, reasoning, confidence, outcome, created_at
     FROM decisions
     WHERE agent_id = $1
       AND (retracted = false OR retracted IS NULL)
       AND outcome IN ('success', 'failure')
       AND created_at > now() - make_interval(days => $2)
     ORDER BY created_at DESC`,
    [agentId, lookbackDays]
  );
  return result.rows;
}

async function queryRecentRuns(pool, agentId, limit) {
  const result = await pool.query(
    `SELECT job_name, status, summary, tokens_used, cost_usd,
            duration_seconds, created_at
     FROM agent_runs
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [agentId, limit]
  );
  return result.rows;
}

async function queryActiveTasks(pool, agentId, limit) {
  const result = await pool.query(
    `SELECT title, description, status, priority, created_at
     FROM tasks
     WHERE assigned_to = $1 AND status NOT IN ('done')
     ORDER BY
       CASE priority
         WHEN 'critical' THEN 0
         WHEN 'high'     THEN 1
         WHEN 'medium'   THEN 2
         WHEN 'low'      THEN 3
       END,
       created_at DESC
     LIMIT $2`,
    [agentId, limit]
  );
  return result.rows;
}

async function queryUnreadMessages(pool, agentId) {
  const result = await pool.query(
    `SELECT from_agent, subject, body, created_at
     FROM agent_messages
     WHERE to_agent = $1 AND read = false
     ORDER BY created_at DESC
     LIMIT 10`,
    [agentId]
  );
  return result.rows;
}

async function queryPendingSteps(pool, agentId) {
  const result = await pool.query(
    `SELECT ws.task, ws.input, w.name AS workflow_name
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
     LIMIT 5`,
    [agentId]
  );
  return result.rows;
}

async function queryRetractions(pool, agentId, lookbackDays) {
  const result = await pool.query(
    `SELECT decision_type, description, retracted_reason, retracted_by, retracted_at
     FROM decisions
     WHERE agent_id = $1
       AND retracted = true
       AND retracted_at > now() - make_interval(days => $2)
     ORDER BY retracted_at DESC
     LIMIT 5`,
    [agentId, lookbackDays]
  );
  return result.rows;
}

// ── Formatters ──────────────────────────────────────────────────────────

function formatLearnings(learnings) {
  if (learnings.length === 0) return "";
  let md = "## Learnings from Previous Sessions\n\n";
  for (const l of learnings) {
    const icon = l.outcome === "success" ? "✓" : "✗";
    md += `- ${icon} **${l.decision_type}**: ${l.description}\n`;
    if (l.reasoning) md += `  - Reasoning: ${l.reasoning}\n`;
    md += `  - Confidence: ${l.confidence}, Outcome: ${l.outcome}\n`;
  }
  return md + "\n";
}

function formatRetractions(retractions) {
  if (retractions.length === 0) return "";
  let md = "## Recent Retractions (avoid repeating these)\n\n";
  for (const r of retractions) {
    md += `- **${r.decision_type}**: ${r.description}\n`;
    md += `  - Retracted by ${r.retracted_by}: ${r.retracted_reason}\n`;
  }
  return md + "\n";
}

function formatRecentRuns(runs) {
  if (runs.length === 0) return "";
  let md = "## Recent Run History\n\n";
  for (const r of runs) {
    const icon = r.status === "success" ? "✓" : r.status === "failure" ? "✗" : "◐";
    md += `- ${icon} **${r.job_name || "unnamed"}** — ${r.status}`;
    if (r.summary) md += `: ${r.summary}`;
    if (r.tokens_used) md += ` (${r.tokens_used} tokens, $${parseFloat(r.cost_usd || 0).toFixed(4)})`;
    md += "\n";
  }
  return md + "\n";
}

function formatTasks(tasks) {
  if (tasks.length === 0) return "";
  let md = "## Active Tasks\n\n";
  for (const t of tasks) {
    md += `- [${t.status}] **${t.title}** (${t.priority})\n`;
    if (t.description) md += `  ${t.description}\n`;
  }
  return md + "\n";
}

function formatMessages(messages) {
  if (messages.length === 0) return "";
  let md = "## Unread Messages\n\n";
  for (const m of messages) {
    md += `### From ${m.from_agent}: ${m.subject}\n`;
    md += `${m.body}\n\n`;
  }
  return md;
}

function formatWorkflowSteps(steps) {
  if (steps.length === 0) return "";
  let md = "## Pending Workflow Steps\n\n";
  for (const s of steps) {
    md += `### ${s.workflow_name}\n`;
    md += `**Task**: ${s.task}\n`;
    if (s.input && Object.keys(s.input).length > 0) {
      md += `**Input**: ${JSON.stringify(s.input, null, 2)}\n`;
    }
    md += "\n";
  }
  return md;
}

// ── Branch Context ─────────────────────────────────────────────────────

/**
 * Loads shared findings from the branch-level knowledge base.
 * The file is mounted read-only at /workspace/branch/SHARED-FINDINGS.md
 * by the seedling's compose override. Returns empty string if not available.
 */
export function loadBranchFindings(findingsPath = BRANCH_FINDINGS_PATH) {
  try {
    if (!fs.existsSync(findingsPath)) return "";
    const content = fs.readFileSync(findingsPath, "utf-8").trim();
    // Skip placeholder files that have no real findings
    if (!content || content.includes("No shared findings yet")) return "";
    return "## Branch Shared Knowledge\n\n" +
      "> Cross-seedling findings from the branch knowledge base. " +
      "Treat as validated context — do not re-research these topics.\n\n" +
      content + "\n\n";
  } catch (err) {
    console.warn(`[context] Could not load branch findings: ${err.message}`);
    return "";
  }
}

// ── Main Assembly ───────────────────────────────────────────────────────

/**
 * Assembles the full session context for an agent role.
 * @returns {{ context: string, tokenCount: number, budget: object }}
 */
export async function assembleContext(pool, agentId, configPath) {
  const budgetConfig = loadContextBudget(configPath);
  const budget = getBudgetForRole(budgetConfig, agentId);

  const lookback = budget.compaction_lookback_days || 7;
  const maxRuns = budget.max_recent_runs || 10;
  const maxTasks = budget.max_active_tasks || 5;

  const [learnings, runs, tasks, messages, steps, retractions] =
    await Promise.all([
      queryLearnings(pool, agentId, lookback),
      queryRecentRuns(pool, agentId, maxRuns),
      queryActiveTasks(pool, agentId, maxTasks),
      queryUnreadMessages(pool, agentId),
      queryPendingSteps(pool, agentId),
      queryRetractions(pool, agentId, lookback),
    ]);

  const memorySection = [
    formatLearnings(learnings),
    formatRetractions(retractions),
    formatRecentRuns(runs),
  ].join("");

  const taskSection = [
    formatWorkflowSteps(steps),
    formatTasks(tasks),
    formatMessages(messages),
  ].join("");

  const memoryBudget = budget.max_memory_tokens || 2000;
  const branchBudget = budget.max_branch_findings_tokens || 1500;
  const totalBudget = budget.max_context_tokens || 8000;
  const taskBudget = totalBudget - memoryBudget - branchBudget;

  const truncatedMemory = truncateToTokens(memorySection, memoryBudget);
  const truncatedTasks = truncateToTokens(taskSection, Math.max(taskBudget, 1000));

  // Load branch-level shared findings (file-based, no DB query)
  const branchFindings = loadBranchFindings();
  const truncatedBranch = branchFindings
    ? truncateToTokens(branchFindings, branchBudget)
    : "";

  let context = "# Session Context\n\n";
  context += `> Agent: ${agentId} | Budget: ${totalBudget} tokens | Memory: ${memoryBudget} tokens\n\n`;

  if (truncatedMemory.trim()) {
    context += "---\n# Memory\n\n" + truncatedMemory;
  }

  if (truncatedBranch.trim()) {
    context += "---\n# Branch Knowledge\n\n" + truncatedBranch;
  }

  if (truncatedTasks.trim()) {
    context += "---\n# Current Work\n\n" + truncatedTasks;
  }

  const tokenCount = estimateTokens(context);
  const branchTokens = estimateTokens(truncatedBranch);
  console.log(
    `[context] Assembled ${tokenCount} tokens for ${agentId} ` +
      `(budget: ${totalBudget}, memory: ${memoryBudget}, branch: ${branchTokens}) ` +
      `[${learnings.length} learnings, ${runs.length} runs, ${tasks.length} tasks, ` +
      `${messages.length} messages, ${steps.length} steps, ${retractions.length} retractions]`
  );

  return { context, tokenCount, budget };
}
