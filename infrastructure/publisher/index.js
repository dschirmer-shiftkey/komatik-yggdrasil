/**
 * Seed Publisher — Git output pipeline + TOKENS.md generator
 *
 * Responsibilities:
 * 1. Wait for mission-approved publish signal from scheduler
 * 2. Validate artifacts in /workspace/output (non-empty, no secrets)
 * 3. Batch-commit validated artifacts to the public GitHub repo
 * 4. Generate/update TOKENS.md from cumulative LLM usage
 * 5. Single point of GitHub auth (no per-agent PAT sprawl)
 *
 * Environment:
 *   GITHUB_TOKEN            — PAT with repo write access
 *   GITHUB_REPO             — owner/repo
 *   GITHUB_BRANCH           — target branch (default: main)
 *   SEED_NAME               — human name for commit messages
 *   SEED_DIR                — path within repo
 *   BIFROST_METRICS_URL     — Bifrost Prometheus metrics endpoint
 *   DATABASE_URL            — PostgreSQL connection string
 *   PUBLISH_INTERVAL_MINUTES — how often to check (default: 30)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { Pool } from "pg";
import { getSupabase, publishFinding, postKnowledgeEvent } from "@komatik/shared/supabase";

const OUTPUT_DIR = "/workspace/output";
const STAGING_DIR = "/tmp/publisher-staging";
const INTERVAL_MS = parseInt(process.env.PUBLISH_INTERVAL_MINUTES || "30", 10) * 60 * 1000;
const SEED_NAME = process.env.SEED_NAME || "Unknown Seed";
const SEED_DIR = process.env.SEED_DIR || "seeds/unknown";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
// Token usage is sourced from the DB (llm_usage table), not Bifrost metrics.
// Bifrost metrics scraping was removed because the publisher and Bifrost are
// on isolated Docker networks — the DB is the single source of truth.

// World tree identity — where this container sits in the hierarchy
const SOURCE_TYPE = process.env.SOURCE_TYPE || "seed";
const SOURCE_ID = process.env.SOURCE_ID || "unknown";
const CATEGORY_ID = process.env.CATEGORY_ID || "unknown";
const ROOT_ID = process.env.ROOT_ID || "unknown";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Mission review gate ─────────────────────────────────────────────────

async function checkPublishApproval() {
  const result = await pool.query(
    `SELECT id, body, created_at
     FROM agent_messages
     WHERE to_agent = 'publisher'
       AND subject = 'publish_approved'
       AND read = false
     ORDER BY created_at DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) return null;

  const msg = result.rows[0];
  await pool.query("UPDATE agent_messages SET read = true WHERE id = $1", [msg.id]);
  console.log(`[publisher] Publish approval received from scheduler`);

  try {
    return JSON.parse(msg.body);
  } catch {
    return { approved: true };
  }
}

// ── Artifact validation ─────────────────────────────────────────────────

function getNewArtifacts() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs.readdirSync(OUTPUT_DIR, { recursive: true })
    .filter((f) => !f.startsWith(".") && !f.startsWith("TOKENS"))
    .map((f) => path.join(OUTPUT_DIR, f))
    .filter((f) => {
      try { return fs.statSync(f).isFile(); } catch { return false; }
    });
}

function validateArtifact(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  if (content.trim().length === 0) return { valid: false, reason: "empty file" };
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{20,}/,
    /ghp_[a-zA-Z0-9]{36}/,
    /AKIA[A-Z0-9]{16}/,
    /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) return { valid: false, reason: "possible secret detected" };
  }
  return { valid: true };
}

// ── Git pipeline ────────────────────────────────────────────────────────

function gitExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 30_000 }).trim();
  } catch (err) {
    console.error(`[publisher] Git command failed: ${cmd}`);
    throw err;
  }
}

async function publishToGithub(artifacts) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.warn("[publisher] GITHUB_TOKEN or GITHUB_REPO not set — skipping git push");
    return false;
  }

  const repoUrl = `https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;
  const repoDir = path.join(STAGING_DIR, "repo");

  fs.mkdirSync(STAGING_DIR, { recursive: true });

  if (!fs.existsSync(path.join(repoDir, ".git"))) {
    console.log(`[publisher] Cloning ${GITHUB_REPO}...`);
    gitExec(`git clone --depth 1 --branch ${GITHUB_BRANCH} ${repoUrl} ${repoDir}`, STAGING_DIR);
  } else {
    gitExec(`git pull --rebase origin ${GITHUB_BRANCH}`, repoDir);
  }

  gitExec('git config user.email "seed-publisher@komatik.ai"', repoDir);
  gitExec('git config user.name "Seed Publisher"', repoDir);

  const seedPath = path.join(repoDir, SEED_DIR);
  fs.mkdirSync(seedPath, { recursive: true });

  let copiedCount = 0;
  for (const artifact of artifacts) {
    const relativePath = path.relative(OUTPUT_DIR, artifact);
    const destPath = path.join(seedPath, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(artifact, destPath);
    copiedCount++;
  }

  const tokensPath = path.join(OUTPUT_DIR, "TOKENS.md");
  if (fs.existsSync(tokensPath)) {
    fs.copyFileSync(tokensPath, path.join(seedPath, "TOKENS.md"));
    copiedCount++;
  }

  gitExec("git add -A", repoDir);

  const status = gitExec("git status --porcelain", repoDir);
  if (!status) {
    console.log("[publisher] No changes to commit");
    return false;
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const commitMsg = `${SEED_NAME}: publish cycle outputs (${timestamp})`;
  gitExec(`git commit -m "${commitMsg}"`, repoDir);
  gitExec(`git push origin ${GITHUB_BRANCH}`, repoDir);

  console.log(`[publisher] Pushed ${copiedCount} files to ${GITHUB_REPO}/${SEED_DIR}`);
  return true;
}

// ── TOKENS.md generation ────────────────────────────────────────────────

async function getDbTokenSummary() {
  const result = await pool.query(`
    SELECT
      provider, model,
      COUNT(*) as calls,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      SUM(cost_usd) as total_cost_usd
    FROM llm_usage
    GROUP BY provider, model
    ORDER BY total_cost_usd DESC
  `);
  return result.rows;
}

function generateTokensMd(usage) {
  const now = new Date().toISOString().split("T")[0];
  const totalCost = usage.reduce((sum, r) => sum + parseFloat(r.total_cost_usd || 0), 0);
  const totalTokens = usage.reduce((sum, r) => sum + parseInt(r.total_input_tokens || 0) + parseInt(r.total_output_tokens || 0), 0);

  let md = `# TOKENS.md — ${SEED_NAME} Compute Ledger\n\n`;
  md += `> Last updated: ${now}\n`;
  md += `> All compute donated by Komatik under the Pledge 1% Compute commitment.\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total tokens**: ${totalTokens.toLocaleString()}\n`;
  md += `- **Total cost**: $${totalCost.toFixed(4)}\n`;
  md += `- **LLM calls**: ${usage.reduce((sum, r) => sum + parseInt(r.calls || 0), 0).toLocaleString()}\n\n`;
  md += `## Breakdown by Model\n\n`;
  md += `| Provider | Model | Calls | Input Tokens | Output Tokens | Cost (USD) |\n`;
  md += `|----------|-------|-------|-------------|--------------|------------|\n`;

  for (const row of usage) {
    md += `| ${row.provider} | ${row.model} | ${parseInt(row.calls).toLocaleString()} `;
    md += `| ${parseInt(row.total_input_tokens || 0).toLocaleString()} `;
    md += `| ${parseInt(row.total_output_tokens || 0).toLocaleString()} `;
    md += `| $${parseFloat(row.total_cost_usd || 0).toFixed(4)} |\n`;
  }

  md += `\n---\n*Auto-generated by the Seed Publisher service.*\n`;
  return md;
}

// ── World Tree Publishing ──────────────────────────────────────────────

/**
 * Extract finding metadata from a FINDINGS.md artifact.
 * Expects YAML frontmatter or structured markdown with title/summary.
 * Falls back to filename-derived title if no structure found.
 */
function extractFindingFromArtifact(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const basename = path.basename(filePath, path.extname(filePath));

  // Try to extract structured finding (## Title\n\nSummary paragraph)
  const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^##\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : basename.replace(/[-_]/g, " ");

  // First non-heading paragraph as summary
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith(">") && !p.startsWith("---"));
  const summary = paragraphs[0] || title;

  // Look for methodology section
  const methMatch = content.match(/##\s*Methodology\s*\n+([\s\S]*?)(?=\n##|\n---|\Z)/i);
  const methodology = methMatch ? methMatch[1].trim() : null;

  return { title, summary, content, methodology };
}

/**
 * Publish validated artifacts to the Supabase world tree.
 * Each FINDINGS-related artifact becomes a finding + knowledge event.
 */
async function publishToWorldTree(artifacts, approval) {
  const supabase = getSupabase();
  if (!supabase) {
    console.log("[publisher] Supabase not configured — skipping world tree publish");
    return;
  }

  // Filter to finding-type artifacts (markdown files in RESEARCH/ or root output)
  const findingArtifacts = artifacts.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ext === ".md" && !path.basename(f).startsWith("TOKENS");
  });

  if (findingArtifacts.length === 0) {
    console.log("[publisher] No finding artifacts to publish to world tree");
    return;
  }

  console.log(`[publisher] Publishing ${findingArtifacts.length} findings to world tree`);

  for (const artifact of findingArtifacts) {
    try {
      const { title, summary, content, methodology } = extractFindingFromArtifact(artifact);

      // Write finding to Supabase
      const finding = await publishFinding(supabase, {
        sourceType: SOURCE_TYPE,
        sourceId: SOURCE_ID,
        categoryId: CATEGORY_ID,
        rootId: ROOT_ID,
        title,
        summary,
        content,
        methodology,
        confidence: "preliminary",
        tags: [],
        sdgs: [],
        geographicScope: [],
        workflowId: approval?.workflow_id || null,
        cycleNumber: approval?.cycle_number || null,
        agentRole: approval?.agent_role || null,
      });

      // Post knowledge event — notify category that a finding is ready
      await postKnowledgeEvent(supabase, {
        eventType: "finding_ready",
        sourceType: SOURCE_TYPE,
        sourceId: SOURCE_ID,
        categoryId: CATEGORY_ID,
        targetType: "category",
        targetId: CATEGORY_ID,
        payload: {
          finding_id: finding.id,
          title,
          summary,
        },
      });
    } catch (err) {
      console.error(`[publisher] Failed to publish ${path.basename(artifact)} to world tree:`, err.message);
      // Non-fatal — GitHub publish already succeeded
    }
  }
}

// ── Publish cycle ───────────────────────────────────────────────────────

async function publishCycle() {
  console.log(`[publisher] Checking for publish signals...`);

  const approval = await checkPublishApproval();

  const usage = await getDbTokenSummary();
  if (usage.length > 0) {
    const tokensMd = generateTokensMd(usage);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const tokensPath = path.join(OUTPUT_DIR, "TOKENS.md");
    fs.writeFileSync(tokensPath, tokensMd);
    console.log(`[publisher] Updated TOKENS.md (${usage.length} model entries)`);
  }

  const artifacts = getNewArtifacts();
  if (artifacts.length === 0) {
    console.log(`[publisher] No artifacts to publish`);
    return;
  }

  console.log(`[publisher] Found ${artifacts.length} artifacts`);

  const validated = [];
  for (const artifact of artifacts) {
    const result = validateArtifact(artifact);
    if (result.valid) {
      validated.push(artifact);
    } else {
      console.warn(`[publisher] Rejected ${path.basename(artifact)}: ${result.reason}`);
    }
  }

  if (validated.length === 0) {
    console.log(`[publisher] No valid artifacts to publish`);
    return;
  }

  if (!approval) {
    console.log(`[publisher] ${validated.length} artifacts ready but no publish approval yet`);
    return;
  }

  await publishToGithub(validated);

  // Feed findings up the world tree (non-fatal if Supabase unavailable)
  await publishToWorldTree(validated, approval);
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[publisher] Starting for ${SEED_NAME} (${SEED_DIR})`);
  console.log(`[publisher] Publish interval: ${INTERVAL_MS / 60000} minutes`);

  await publishCycle();

  setInterval(publishCycle, INTERVAL_MS);

  process.on("SIGTERM", async () => {
    console.log("[publisher] Shutting down...");
    await pool.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[publisher] Fatal error:", err);
  process.exit(1);
});
