#!/usr/bin/env node

/**
 * Apex Cycle Smoke Test
 *
 * Exercises migration 005 schema and the apex event-processor handlers
 * against the live Supabase project. What this covers:
 *
 *   1. Writing apex-tier findings (source_type='apex', null root_id,
 *      spans_roots, kind, payload) — fails if migration 005 isn't applied
 *   2. Writing a contested_tension finding and reading it back via the
 *      contention_map view
 *   3. Writing a public_signal Signal Digest finding
 *   4. Posting apex-targeted knowledge_events (finding_promoted,
 *      signal_digested, potential_conflict) and confirming pollKnowledgeEvents
 *      returns them for targetType='apex'
 *   5. Invoking the apex handlers from infrastructure/event-processor
 *      directly and confirming the events are marked processed
 *
 * What this does NOT cover:
 *   - The LLM synthesis cycle (that needs the apex container booted via
 *     docker compose; this is a schema/wiring smoke test, not a full E2E)
 *
 * Usage:
 *   cd infrastructure/scripts && npm install     # one-time
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npm run test:apex-cycle
 *
 *   (npm script passes --preserve-symlinks so the workspace-linked
 *   @komatik/event-processor resolves its @komatik/shared dep.)
 */

import { createClient } from "@supabase/supabase-js";
import { HANDLERS } from "@komatik/event-processor";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TEST_TAG = "apex-e2e-" + Date.now();
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

async function cleanup() {
  console.log("\n[cleanup] Removing test rows...");
  // Delete events first (FK to findings via payload is loose; delete both by tag)
  await supabase.from("knowledge_events").delete().ilike("payload->>tag", `${TEST_TAG}%`);
  await supabase.from("findings").delete().ilike("title", `[${TEST_TAG}]%`);
  // Any orphan events targeting apex with our tag
  await supabase.from("knowledge_events").delete().eq("source_id", TEST_TAG);
}

async function main() {
  console.log(`\n=== Apex Cycle Smoke Test (${TEST_TAG}) ===\n`);

  // ── Step 1: Schema — apex findings ────────────────────────────────
  console.log("Step 1: Write apex-tier findings (cross_root_pattern, mission_drift_flag)");

  const { data: crossRootFinding, error: crError } = await supabase
    .from("findings")
    .insert({
      source_type: "apex",
      source_id: "apex",
      root_id: null,
      category_id: null,
      title: `[${TEST_TAG}] Cross-root: wage stagnation across Housing + Economic Opportunity`,
      summary: "Two root tiers report the same underlying driver",
      content:
        "Housing (basic-needs) and economic-opportunity (human-growth) " +
        "both cite wage stagnation as the primary driver of their respective " +
        "failure modes. This is a cross-root pattern no single root can see.",
      confidence: "preliminary",
      spans_roots: ["basic-needs", "human-growth"],
      kind: "cross_root_pattern",
      payload: {
        tag: TEST_TAG,
        pattern_kind: "shared_driver",
        shared_driver: "wage_stagnation",
      },
    })
    .select("id")
    .single();

  assert(!crError, `cross_root_pattern insert (${crError?.message || "ok"})`);
  assert(!!crossRootFinding?.id, "cross_root_pattern returned an id");

  const { data: driftFinding, error: drError } = await supabase
    .from("findings")
    .insert({
      source_type: "apex",
      source_id: "apex",
      root_id: "basic-needs",
      category_id: null,
      title: `[${TEST_TAG}] Drift flag: basic-needs/housing producing policy recommendations`,
      summary: "Charter §4.7 — findings drifting into positions",
      content: "A recent housing finding recommended specific LA city council " +
        "action. The charter prohibits the tree from producing advocacy.",
      confidence: "informational",
      kind: "mission_drift_flag",
      payload: {
        tag: TEST_TAG,
        charter_section: "§4.7",
        severity: "moderate",
        root_id: "basic-needs",
      },
    })
    .select("id")
    .single();

  assert(!drError, `mission_drift_flag insert (${drError?.message || "ok"})`);
  assert(!!driftFinding?.id, "mission_drift_flag returned an id");

  // ── Step 2: Contested tension + contention_map view ──────────────
  console.log("\nStep 2: Write contested_tension finding and query contention_map view");

  const { data: tensionFinding, error: tsError } = await supabase
    .from("findings")
    .insert({
      source_type: "apex",
      source_id: "apex",
      root_id: null,
      category_id: null,
      title: `[${TEST_TAG}] Tension: degrowth vs. decarbonized growth`,
      summary: "Climate root and Economic Opportunity root disagree structurally",
      content: "Planet-and-life favors degrowth framing; human-growth favors " +
        "decarbonized growth. The disagreement is about value weighting, not evidence.",
      confidence: "contested",
      spans_roots: ["planet-and-life", "human-growth"],
      kind: "contested_tension",
      payload: {
        tag: TEST_TAG,
        position_a: "Degrowth is required to stay within planetary limits",
        position_b: "Decarbonized growth preserves development gains",
        structural_reason: "Value weighting on ecological vs. human welfare timescales",
        parties: ["planet-and-life", "human-growth"],
      },
    })
    .select("id")
    .single();

  assert(!tsError, `contested_tension insert (${tsError?.message || "ok"})`);

  const { data: contentionRows, error: cvError } = await supabase
    .from("contention_map")
    .select("id, title, position_a, position_b, structural_reason, parties")
    .eq("id", tensionFinding?.id);

  assert(!cvError, `contention_map view queryable (${cvError?.message || "ok"})`);
  assert(contentionRows?.length === 1, "contention_map returns the test tension");
  assert(
    contentionRows?.[0]?.position_a?.includes("Degrowth"),
    "contention_map extracts position_a from payload"
  );

  // ── Step 3: Public signal digest ─────────────────────────────────
  console.log("\nStep 3: Write public_signal Signal Digest");

  const { data: digestFinding, error: dgError } = await supabase
    .from("findings")
    .insert({
      source_type: "public_signal",
      source_id: "signal-aggregator",
      root_id: null,
      category_id: null,
      title: `[${TEST_TAG}] Signal Digest — week of 2026-04-19`,
      summary: "Weekly public signal aggregation",
      content: "Aggregated themes from 42 public-signal submissions.",
      confidence: "informational",
      kind: "signal_digest",
      payload: {
        tag: TEST_TAG,
        themes: [
          {
            cluster: "Support-services cliff in LA housing placements",
            mass: 18,
            keywords: ["housing", "LA", "support services", "6-month cliff"],
            sample_quotes: ["People lose housing 6 months after services end"],
          },
          {
            cluster: "Rural clinic availability",
            mass: 12,
            keywords: ["health", "rural", "clinic access"],
            sample_quotes: [],
          },
        ],
      },
    })
    .select("id")
    .single();

  assert(!dgError, `signal_digest insert (${dgError?.message || "ok"})`);
  assert(!!digestFinding?.id, "signal_digest returned an id");

  // ── Step 4: Apex-targeted events + handler routing ────────────────
  console.log("\nStep 4: Post apex-targeted knowledge_events");

  const eventTypes = [
    {
      event_type: "finding_promoted",
      payload: { tag: TEST_TAG, title: "test promoted finding", category_id: "housing" },
    },
    {
      event_type: "signal_digested",
      payload: { tag: TEST_TAG, finding_id: digestFinding?.id, theme_count: 2 },
    },
    {
      event_type: "potential_conflict",
      payload: { tag: TEST_TAG, parties: ["planet-and-life", "human-growth"] },
    },
  ];

  const eventIds = [];
  for (const { event_type, payload } of eventTypes) {
    const { data, error } = await supabase
      .from("knowledge_events")
      .insert({
        event_type,
        source_type: "root",
        source_id: TEST_TAG,
        target_type: "apex",
        target_id: "apex",
        payload,
      })
      .select("id")
      .single();
    assert(!error, `post ${event_type} event (${error?.message || "ok"})`);
    if (data?.id) eventIds.push({ id: data.id, event_type });
  }

  // ── Step 5: Poll + handler invocation ─────────────────────────────
  console.log("\nStep 5: Poll apex queue and invoke handlers");

  const { data: pendingEvents, error: pollError } = await supabase
    .from("knowledge_events")
    .select("*")
    .eq("processed", false)
    .eq("target_type", "apex")
    .eq("source_id", TEST_TAG);

  assert(!pollError, `poll apex queue (${pollError?.message || "ok"})`);
  assert(
    (pendingEvents?.length || 0) === eventTypes.length,
    `apex queue returns all ${eventTypes.length} test events`
  );

  const apexHandlers = HANDLERS.apex;
  assert(!!apexHandlers, "HANDLERS.apex is registered");

  for (const event of pendingEvents || []) {
    const handler = apexHandlers[event.event_type];
    assert(!!handler, `HANDLERS.apex has handler for ${event.event_type}`);
    if (handler) {
      await handler(supabase, event);
    }
  }

  // Confirm all events are now processed
  const { data: stillUnprocessed } = await supabase
    .from("knowledge_events")
    .select("id, event_type")
    .eq("processed", false)
    .eq("target_type", "apex")
    .eq("source_id", TEST_TAG);

  assert(
    (stillUnprocessed?.length || 0) === 0,
    "all apex test events marked processed by handlers"
  );

  // ── Cleanup ──────────────────────────────────────────────────────
  await cleanup();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup().catch(() => {});
  process.exit(1);
});
