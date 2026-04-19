/**
 * Public Signal Aggregator
 *
 * Stage 2 of the Public Signal Pipeline (docs/system-design.md §13.2).
 *
 * On each cycle:
 *   1. Poll GitHub issues with the configured label (default "public-signal")
 *   2. Pass all currently-open signals to Bifrost with a clustering prompt
 *   3. Parse the JSON response (themes: [{ cluster, mass, keywords,
 *      sample_quotes, signal_issue_numbers }])
 *   4. Write a Signal Digest finding to Supabase
 *      (source_type='public_signal', confidence='informational',
 *       kind='signal_digest')
 *   5. Emit a `signal_digested` knowledge_event targeting apex
 *
 * Stage 3 (routing) is handled by the apex synthesizer on its next cycle.
 *
 * Environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  — world tree DB
 *   GITHUB_REPO                              — owner/repo (e.g. dschirmer-shiftkey/komatik-yggdrasil)
 *   GITHUB_TOKEN                             — optional, raises rate limits
 *   BIFROST_URL                              — default http://bifrost:8080
 *   SEED_VIRTUAL_KEY                         — Bifrost auth
 *   DIGEST_MODEL                             — default claude-sonnet-4-20250514
 *   SIGNAL_ISSUE_LABEL                       — default "public-signal"
 *   AGGREGATION_INTERVAL_MINUTES             — default 10080 (weekly)
 *   MIN_SIGNALS_FOR_DIGEST                   — default 3
 *   MIN_HOURS_BETWEEN_DIGESTS                — default 24 (idempotency guard)
 *   RUN_ONCE                                 — "true" exits after one cycle
 */

import { getSupabase, postKnowledgeEvent } from "@komatik/shared/supabase";

const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const BIFROST_URL = process.env.BIFROST_URL || "http://bifrost:8080";
const BIFROST_API_KEY = process.env.SEED_VIRTUAL_KEY || "";
const DIGEST_MODEL = process.env.DIGEST_MODEL || "claude-sonnet-4-20250514";
const SIGNAL_ISSUE_LABEL = process.env.SIGNAL_ISSUE_LABEL || "public-signal";
const AGGREGATION_INTERVAL_MS =
  parseInt(process.env.AGGREGATION_INTERVAL_MINUTES || "10080", 10) * 60 * 1000;
const MIN_SIGNALS = parseInt(process.env.MIN_SIGNALS_FOR_DIGEST || "3", 10);
const MIN_HOURS_BETWEEN_DIGESTS = parseInt(
  process.env.MIN_HOURS_BETWEEN_DIGESTS || "24",
  10
);
const RUN_ONCE = process.env.RUN_ONCE === "true";

// ── GitHub intake ──────────────────────────────────────────────────────

/**
 * Fetch open issues with the configured label.
 * Returns normalized { number, title, body, url, geography, category_hint }.
 */
async function fetchOpenSignals() {
  if (!GITHUB_REPO) {
    console.warn("[aggregator] GITHUB_REPO unset — cannot fetch signals");
    return [];
  }

  const headers = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

  const all = [];
  let page = 1;
  while (true) {
    const url =
      `https://api.github.com/repos/${GITHUB_REPO}/issues` +
      `?labels=${encodeURIComponent(SIGNAL_ISSUE_LABEL)}` +
      `&state=open&per_page=100&page=${page}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub ${res.status}: ${await res.text()}`);
    }
    const batch = await res.json();
    // Filter out PRs (GitHub returns them via /issues too)
    all.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) break;
    page += 1;
  }

  return all.map((i) => ({
    number: i.number,
    title: i.title,
    body: i.body || "",
    url: i.html_url,
    author: i.user?.login || "anon",
    created_at: i.created_at,
  }));
}

// ── LLM clustering via Bifrost ─────────────────────────────────────────

const CLUSTERING_SYSTEM_PROMPT = `You are a semantic clustering agent for the Yggdrasil public signal pipeline. You receive raw submissions from the public and cluster them by underlying theme.

Rules:
- Cluster by the problem they describe, not by geography or category hint.
- One submitter posting 20 near-duplicates is ONE signal. Dedupe by semantic similarity.
- Each cluster must have at least 1 signal. Clusters of 1 are allowed but should be rare — prefer merging over splitting.
- Return ONLY valid JSON matching the schema below. No prose, no markdown fences.

Schema:
{
  "themes": [
    {
      "cluster": "short label (under 80 chars)",
      "mass": <integer: number of distinct signals in this cluster>,
      "signal_issue_numbers": [<int>, ...],
      "keywords": ["3-6 keywords capturing the theme"],
      "sample_quotes": ["1-3 short verbatim quotes that best exemplify the theme"],
      "geographic_scope": ["optional list of geographies if signals are place-specific"]
    }
  ],
  "noise_issue_numbers": [<int>, ...]
}

noise_issue_numbers are submissions too generic/incoherent to cluster. Do not force them into themes.`;

function buildClusteringUserPrompt(signals) {
  const lines = [
    "Cluster the following public signal submissions:",
    "",
    "<signals>",
  ];
  for (const s of signals) {
    lines.push(
      `[#${s.number}] title: ${s.title}\nbody: ${s.body.slice(0, 1500)}\n`
    );
  }
  lines.push("</signals>");
  lines.push("");
  lines.push("Return JSON only.");
  return lines.join("\n");
}

async function clusterSignalsViaBifrost(signals) {
  const headers = { "Content-Type": "application/json" };
  if (BIFROST_API_KEY) headers["Authorization"] = `Bearer ${BIFROST_API_KEY}`;

  const body = {
    model: DIGEST_MODEL,
    messages: [
      { role: "system", content: CLUSTERING_SYSTEM_PROMPT },
      { role: "user", content: buildClusteringUserPrompt(signals) },
    ],
    max_tokens: 4096,
  };

  const res = await fetch(`${BIFROST_URL}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Bifrost error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const usage = data.usage || {};

  // Claude sometimes wraps JSON in ```json ... ``` despite instructions.
  const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `LLM returned unparseable JSON: ${err.message}\nContent: ${cleaned.slice(0, 500)}`
    );
  }

  if (!Array.isArray(parsed.themes)) {
    throw new Error("LLM response missing 'themes' array");
  }

  return {
    themes: parsed.themes,
    noise_issue_numbers: parsed.noise_issue_numbers || [],
    usage: {
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      cost_usd: usage.total_cost || 0,
      model: data.model || DIGEST_MODEL,
    },
  };
}

// ── Idempotency guard ──────────────────────────────────────────────────

async function findMostRecentDigest(supabase) {
  const { data, error } = await supabase
    .from("findings")
    .select("id, created_at")
    .eq("source_type", "public_signal")
    .eq("kind", "signal_digest")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn(`[aggregator] Could not check for recent digest: ${error.message}`);
    return null;
  }
  return data;
}

// ── Digest write ───────────────────────────────────────────────────────

async function writeDigest(supabase, { signals, themes, noise, usage }) {
  const now = new Date();
  const weekLabel = now.toISOString().slice(0, 10);

  const { data: finding, error: fErr } = await supabase
    .from("findings")
    .insert({
      source_type: "public_signal",
      source_id: "signal-aggregator",
      root_id: null,
      category_id: null,
      title: `Signal Digest — ${weekLabel}`,
      summary: `Aggregated ${signals.length} public signal submissions into ${themes.length} themes`,
      content: buildDigestContent({ signals, themes, noise, weekLabel }),
      confidence: "informational",
      kind: "signal_digest",
      agent_role: "signal-aggregator",
      tokens_used: usage.input_tokens + usage.output_tokens,
      cost_usd: usage.cost_usd,
      payload: {
        themes,
        noise_issue_numbers: noise,
        signal_count: signals.length,
        window_start: signals
          .map((s) => s.created_at)
          .sort()[0] || null,
        window_end: now.toISOString(),
        llm_model: usage.model,
      },
    })
    .select("id")
    .single();

  if (fErr) throw new Error(`Digest insert failed: ${fErr.message}`);

  await postKnowledgeEvent(supabase, {
    eventType: "signal_digested",
    sourceType: "public_signal",
    sourceId: "signal-aggregator",
    targetType: "apex",
    targetId: "apex",
    payload: {
      finding_id: finding.id,
      theme_count: themes.length,
      signal_count: signals.length,
    },
  });

  return finding;
}

function buildDigestContent({ signals, themes, noise, weekLabel }) {
  const lines = [
    `# Public Signal Digest — ${weekLabel}`,
    "",
    `Aggregated ${signals.length} open public-signal submissions into ${themes.length} themes. ${noise.length} submissions flagged as noise.`,
    "",
    "## Themes",
    "",
  ];
  for (const t of themes) {
    lines.push(`### ${t.cluster} (mass: ${t.mass})`);
    if (t.keywords?.length) lines.push(`**Keywords:** ${t.keywords.join(", ")}`);
    if (t.geographic_scope?.length)
      lines.push(`**Geography:** ${t.geographic_scope.join(", ")}`);
    lines.push(`**Source issues:** ${(t.signal_issue_numbers || []).map((n) => `#${n}`).join(", ")}`);
    if (t.sample_quotes?.length) {
      lines.push("");
      for (const q of t.sample_quotes) lines.push(`> ${q}`);
    }
    lines.push("");
  }
  if (noise.length > 0) {
    lines.push(`## Noise`);
    lines.push(`Issues flagged as noise: ${noise.map((n) => `#${n}`).join(", ")}`);
  }
  return lines.join("\n");
}

// ── Cycle ──────────────────────────────────────────────────────────────

async function runCycle() {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[aggregator] Supabase not configured — skipping cycle");
    return;
  }

  // Idempotency: skip if a digest was just published
  const recent = await findMostRecentDigest(supabase);
  if (recent) {
    const ageHours =
      (Date.now() - new Date(recent.created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours < MIN_HOURS_BETWEEN_DIGESTS) {
      console.log(
        `[aggregator] Most recent digest is ${ageHours.toFixed(1)}h old ` +
          `(threshold: ${MIN_HOURS_BETWEEN_DIGESTS}h) — skipping`
      );
      return;
    }
  }

  console.log(`[aggregator] Fetching open "${SIGNAL_ISSUE_LABEL}" issues from ${GITHUB_REPO}`);
  const signals = await fetchOpenSignals();
  console.log(`[aggregator] Got ${signals.length} open signals`);

  if (signals.length < MIN_SIGNALS) {
    console.log(
      `[aggregator] Below minimum (${MIN_SIGNALS}) — no digest this cycle`
    );
    return;
  }

  console.log(`[aggregator] Clustering via Bifrost (model=${DIGEST_MODEL})`);
  const { themes, noise_issue_numbers, usage } = await clusterSignalsViaBifrost(
    signals
  );
  console.log(
    `[aggregator] Got ${themes.length} themes, ${noise_issue_numbers.length} noise, ` +
      `tokens=${usage.input_tokens + usage.output_tokens}, cost=$${usage.cost_usd.toFixed(4)}`
  );

  const finding = await writeDigest(supabase, {
    signals,
    themes,
    noise: noise_issue_numbers,
    usage,
  });
  console.log(`[aggregator] Published Signal Digest: ${finding.id}`);
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `[aggregator] Starting. Interval: ${AGGREGATION_INTERVAL_MS / 60000} min. Repo: ${GITHUB_REPO || "UNSET"}`
  );

  try {
    await runCycle();
  } catch (err) {
    console.error(`[aggregator] Cycle failed: ${err.message}`);
  }

  if (RUN_ONCE) {
    console.log("[aggregator] RUN_ONCE set, exiting");
    return;
  }

  setInterval(async () => {
    try {
      await runCycle();
    } catch (err) {
      console.error(`[aggregator] Cycle failed: ${err.message}`);
    }
  }, AGGREGATION_INTERVAL_MS);

  process.on("SIGTERM", () => {
    console.log("[aggregator] Shutting down");
    process.exit(0);
  });
}

import { fileURLToPath } from "url";
const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  main().catch((err) => {
    console.error("[aggregator] Fatal:", err);
    process.exit(1);
  });
}

// Exports for testing
export {
  fetchOpenSignals,
  clusterSignalsViaBifrost,
  buildDigestContent,
  runCycle,
};
