#!/usr/bin/env node

/**
 * End-to-End Vertical Slice Test
 *
 * Exercises the full knowledge pipeline against the live Supabase project:
 *
 * 1. Seed publishes a test finding → finding_ready event
 * 2. Category event processor validates → promotes to validated → finding_promoted event
 * 3. Context assembler reads the finding from the world tree
 * 4. Root event processor acknowledges the promoted finding
 * 5. Cleans up test data
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node infrastructure/scripts/test-vertical-slice.js
 *
 * Offline smoke test:
 *   node infrastructure/scripts/test-vertical-slice.js --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import {
  postKnowledgeEvent,
  publishFinding,
  queryTreeFindings,
} from "@komatik/shared/supabase";
import { createDryRunSupabase } from "./lib/dry-run-supabase.js";

const DRY_RUN = process.argv.includes("--dry-run") || process.env.VERTICAL_SLICE_DRY_RUN === "1";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars, or pass --dry-run");
  process.exit(1);
}

// The event processor reads its identity at import time. Default this smoke
// test to the MVP vertical slice so it exercises the real category/root
// handlers without requiring callers to export processor-specific env vars.
process.env.PROCESSOR_TYPE ??= "category";
process.env.PROCESSOR_ID ??= "housing";
process.env.CATEGORY_ID ??= "housing";
process.env.ROOT_ID ??= "basic-needs";

const { HANDLERS } = await import("@komatik/event-processor");

const supabase = DRY_RUN
  ? createDryRunSupabase()
  : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

const TEST_TAG = "e2e-test-" + Date.now();
const cleanup = {
  findingIds: [],
  eventIds: [],
};

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  PASS: ${message}`);
}

async function fetchById(table, id) {
  const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
  assert(!error && data, `${table}/${id} fetched`);
  return data;
}

// ── Step 1: Seed publishes a finding ───────────────────────────────────

async function step1_seedPublishes() {
  console.log("\n--- Step 1: Seed publishes a finding ---");

  const finding = await publishFinding(supabase, {
    sourceType: "seed",
    sourceId: "002-homelessness-la",
    categoryId: "housing",
    rootId: "basic-needs",
    title: `LA Homelessness Point-in-Time Count Analysis (${TEST_TAG})`,
    summary:
      "LAHSA 2024 count shows 75,312 unhoused individuals in LA County, a 2.2% increase. " +
      "Key driver: 67% cite economic hardship (job loss, rent burden) as primary cause.",
    content:
      "# LA Homelessness Point-in-Time Count Analysis\n\n" +
      "## Methodology\nAnalysis of LAHSA 2024 Greater Los Angeles Homeless Count data, " +
      "cross-referenced with HUD AHAR national trends and local economic indicators.\n\n" +
      "## Key Findings\n- 75,312 unhoused individuals in LA County (2.2% YoY increase)\n" +
      "- 67% cite economic hardship as primary cause\n" +
      "- Chronic homelessness up 18% over 5 years\n" +
      "- Measure H funded 27,000 permanent supportive housing placements since 2017\n\n" +
      "## Implications\nPrevention programs targeting economic hardship may be more " +
      "cost-effective than emergency shelter expansion alone.",
    methodology: "LAHSA PIT count analysis, HUD AHAR cross-reference, economic indicator correlation",
    confidence: "preliminary",
    tags: [TEST_TAG, "pit-count", "lahsa", "economic-hardship"],
    sdgs: [1, 11],
    geographicScope: ["los-angeles-county"],
  });

  assert(finding?.id, `Finding inserted: ${finding?.id}`);
  cleanup.findingIds.push(finding.id);

  const event = await postKnowledgeEvent(supabase, {
    eventType: "finding_ready",
    sourceType: "seed",
    sourceId: "002-homelessness-la",
    categoryId: "housing",
    targetType: "category",
    targetId: "housing",
    payload: {
      finding_id: finding.id,
      title: `LA Homelessness Point-in-Time Count Analysis (${TEST_TAG})`,
      summary: "LAHSA 2024 count shows 75,312 unhoused individuals...",
    },
  });

  assert(event?.id, `finding_ready event posted: ${event?.id}`);
  cleanup.eventIds.push(event.id);

  return { findingId: finding.id, eventId: event.id };
}

// ── Step 2: Category validates and promotes ────────────────────────────

async function step2_categoryValidates(findingId, eventId) {
  console.log("\n--- Step 2: Category validates and promotes ---");

  const event = await fetchById("knowledge_events", eventId);
  assert(!event.processed, "Event is unprocessed");
  assert(event.payload.finding_id === findingId, "Event references correct finding");

  await HANDLERS.category.finding_ready(supabase, event);

  const promotedFinding = await fetchById("findings", findingId);
  assert(promotedFinding.confidence === "validated", "Category handler promoted finding to validated");
  assert(promotedFinding.promoted_at, "Promoted finding has promoted_at timestamp");

  const processedEvent = await fetchById("knowledge_events", eventId);
  assert(processedEvent.processed, "Category handler marked finding_ready processed");

  const { data: reviews, error: reviewErr } = await supabase
    .from("quality_reviews")
    .select("id, decision, reason")
    .eq("finding_id", findingId)
    .eq("reviewer_type", "category")
    .eq("reviewer_id", "housing")
    .order("created_at", { ascending: false })
    .limit(1);

  assert(!reviewErr && reviews?.[0]?.decision === "approved", "Category handler wrote approved quality review");

  const { data: promoEvents, error: promoErr } = await supabase
    .from("knowledge_events")
    .select("*")
    .eq("event_type", "finding_promoted")
    .eq("source_type", "category")
    .eq("source_id", "housing")
    .eq("target_type", "root")
    .eq("target_id", "basic-needs")
    .eq("payload->>finding_id", findingId)
    .order("created_at", { ascending: false })
    .limit(1);

  assert(!promoErr && promoEvents?.[0]?.id, `finding_promoted event posted: ${promoEvents?.[0]?.id}`);
  cleanup.eventIds.push(promoEvents[0].id);

  return promoEvents[0].id;
}

// ── Step 3: Context assembler reads from tree ──────────────────────────

async function step3_contextAssemblerReads(findingId) {
  console.log("\n--- Step 3: Context assembler reads tree knowledge ---");

  const treeFindings = await queryTreeFindings(supabase, {
    categoryId: "housing",
    rootId: "basic-needs",
    geographicScope: ["los-angeles-county"],
    limit: 50,
  });

  assert(Array.isArray(treeFindings.category), "Category findings query returned an array");
  assert(Array.isArray(treeFindings.root), "Root findings query returned an array");
  assert(Array.isArray(treeFindings.geographic), "Geographic findings query returned an array");
  assert(Array.isArray(treeFindings.superseded), "Superseded findings query returned an array");

  const ourFinding = treeFindings.category.find((f) => f.id === findingId);
  assert(ourFinding, "Our finding appears in category context query");
  assert(ourFinding.confidence === "validated", "Context query sees finding as validated");

  console.log(
    `  Context assembler would see ${treeFindings.category.length} category findings, ` +
      `${treeFindings.root.length} root findings, ` +
      `${treeFindings.geographic.length} geographic findings, ` +
      `${treeFindings.superseded.length} superseded/retracted findings`
  );
}

// ── Step 4: Root acknowledges promoted finding ─────────────────────────

async function step4_rootAcknowledges(promoEventId) {
  console.log("\n--- Step 4: Root acknowledges promoted finding ---");

  const event = await fetchById("knowledge_events", promoEventId);

  assert(!event.processed, "Promoted event is unprocessed");
  assert(event.event_type === "finding_promoted", "Correct event type");
  assert(event.target_id === "basic-needs", "Targeted at correct root");

  await HANDLERS.root.finding_promoted(supabase, event);

  const processedEvent = await fetchById("knowledge_events", promoEventId);
  assert(processedEvent.processed, "Root handler marked finding_promoted processed");
}

// ── Cleanup ────────────────────────────────────────────────────────────

async function deleteWhere(table, column, value) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) {
    console.warn(`  WARN: Failed to clean ${table} where ${column}=${value}: ${error.message}`);
  } else {
    console.log(`  Cleaned ${table} where ${column}=${value}`);
  }
}

async function cleanupTestData() {
  console.log("\n--- Cleanup ---");

  for (const findingId of cleanup.findingIds) {
    await deleteWhere("citations", "citing_finding_id", findingId);
    await deleteWhere("citations", "cited_finding_id", findingId);
    await deleteWhere("quality_reviews", "finding_id", findingId);
  }

  for (const eventId of [...new Set(cleanup.eventIds)].reverse()) {
    await deleteWhere("knowledge_events", "id", eventId);
  }

  for (const findingId of cleanup.findingIds.reverse()) {
    await deleteWhere("findings", "id", findingId);
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Yggdrasil Vertical Slice E2E Test ===");
  console.log(`Supabase: ${DRY_RUN ? "dry-run in-memory adapter" : SUPABASE_URL}`);
  console.log(`Test tag: ${TEST_TAG}`);

  try {
    const { findingId, eventId } = await step1_seedPublishes();
    const promoEventId = await step2_categoryValidates(findingId, eventId);
    await step3_contextAssemblerReads(findingId);
    await step4_rootAcknowledges(promoEventId);

    console.log("\n=== ALL STEPS PASSED ===");
    console.log("The vertical slice is wired: Seed → Category → Root → Context Assembly");
  } catch (err) {
    process.exitCode = 1;
    console.error("\n=== TEST FAILED ===");
    console.error(err.message);
  } finally {
    await cleanupTestData();
  }
}

main();
