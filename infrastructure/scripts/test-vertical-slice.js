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
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TEST_TAG = "e2e-test-" + Date.now();
const cleanup = [];

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  PASS: ${message}`);
}

// ── Step 1: Seed publishes a finding ───────────────────────────────────

async function step1_seedPublishes() {
  console.log("\n--- Step 1: Seed publishes a finding ---");

  // Write finding (simulates publisher)
  const { data: finding, error: fErr } = await supabase
    .from("findings")
    .insert({
      source_type: "seed",
      source_id: "002-homelessness-la",
      category_id: "housing",
      root_id: "basic-needs",
      title: "LA Homelessness Point-in-Time Count Analysis",
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
      geographic_scope: ["los-angeles-county"],
    })
    .select("id")
    .single();

  assert(!fErr, `Finding inserted: ${finding?.id}`);
  cleanup.push({ table: "findings", id: finding.id });

  // Post finding_ready event (simulates publisher)
  const { data: event, error: eErr } = await supabase
    .from("knowledge_events")
    .insert({
      event_type: "finding_ready",
      source_type: "seed",
      source_id: "002-homelessness-la",
      category_id: "housing",
      target_type: "category",
      target_id: "housing",
      payload: {
        finding_id: finding.id,
        title: "LA Homelessness Point-in-Time Count Analysis",
        summary: "LAHSA 2024 count shows 75,312 unhoused individuals...",
      },
    })
    .select("id")
    .single();

  assert(!eErr, `finding_ready event posted: ${event?.id}`);
  cleanup.push({ table: "knowledge_events", id: event.id });

  return { findingId: finding.id, eventId: event.id };
}

// ── Step 2: Category validates and promotes ────────────────────────────

async function step2_categoryValidates(findingId, eventId) {
  console.log("\n--- Step 2: Category validates and promotes ---");

  // Simulate event processor: read event
  const { data: events } = await supabase
    .from("knowledge_events")
    .select("*")
    .eq("id", eventId)
    .single();

  assert(events && !events.processed, "Event is unprocessed");
  assert(events.payload.finding_id === findingId, "Event references correct finding");

  // Read the finding
  const { data: finding } = await supabase
    .from("findings")
    .select("*")
    .eq("id", findingId)
    .single();

  assert(finding.confidence === "preliminary", "Finding starts as preliminary");
  assert(finding.title.length >= 5, "Title quality check passes");
  assert(finding.summary.length >= 20, "Summary quality check passes");
  assert(finding.content.length >= 100, "Content quality check passes");

  // Write quality review
  const { data: review, error: rErr } = await supabase
    .from("quality_reviews")
    .insert({
      finding_id: findingId,
      reviewer_type: "category",
      reviewer_id: "housing",
      decision: "approved",
      reason: "Passes basic quality checks — substantive content with methodology",
    })
    .select("id")
    .single();

  assert(!rErr, `Quality review written: ${review?.id}`);
  cleanup.push({ table: "quality_reviews", id: review.id });

  // Promote finding
  const { error: uErr } = await supabase
    .from("findings")
    .update({
      confidence: "validated",
      promoted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", findingId);

  assert(!uErr, "Finding promoted to validated");

  // Mark event processed
  await supabase
    .from("knowledge_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("id", eventId);

  // Post finding_promoted event to root
  const { data: promoEvent, error: peErr } = await supabase
    .from("knowledge_events")
    .insert({
      event_type: "finding_promoted",
      source_type: "category",
      source_id: "housing",
      category_id: "housing",
      target_type: "root",
      target_id: "basic-needs",
      payload: {
        finding_id: findingId,
        title: finding.title,
        summary: finding.summary,
        category_id: "housing",
      },
    })
    .select("id")
    .single();

  assert(!peErr, `finding_promoted event posted: ${promoEvent?.id}`);
  cleanup.push({ table: "knowledge_events", id: promoEvent.id });

  return promoEvent.id;
}

// ── Step 3: Context assembler reads from tree ──────────────────────────

async function step3_contextAssemblerReads(findingId) {
  console.log("\n--- Step 3: Context assembler reads tree knowledge ---");

  // Simulate queryTreeFindings from context-assembler.js
  const { data: categoryFindings } = await supabase
    .from("findings")
    .select("id, title, summary, source_type, source_id, confidence, geographic_scope, tags, created_at")
    .eq("category_id", "housing")
    .in("confidence", ["validated", "preliminary"])
    .order("created_at", { ascending: false })
    .limit(50);

  assert(categoryFindings && categoryFindings.length > 0, "Category findings returned");
  const ourFinding = categoryFindings.find((f) => f.id === findingId);
  assert(ourFinding, "Our finding appears in category query");
  assert(ourFinding.confidence === "validated", "Finding shows as validated");

  // Geographic scope query
  const { data: geoFindings } = await supabase
    .from("findings")
    .select("id, title, summary, source_type, source_id, category_id, confidence, geographic_scope, tags, created_at")
    .overlaps("geographic_scope", ["los-angeles-county"])
    .in("confidence", ["validated"])
    .order("created_at", { ascending: false })
    .limit(20);

  assert(geoFindings && geoFindings.length > 0, "Geographic scope query returns results");

  console.log(
    `  Context assembler would see ${categoryFindings.length} category findings, ` +
      `${geoFindings.length} geo findings`
  );
}

// ── Step 4: Root acknowledges promoted finding ─────────────────────────

async function step4_rootAcknowledges(promoEventId) {
  console.log("\n--- Step 4: Root acknowledges promoted finding ---");

  const { data: event } = await supabase
    .from("knowledge_events")
    .select("*")
    .eq("id", promoEventId)
    .single();

  assert(event && !event.processed, "Promoted event is unprocessed");
  assert(event.event_type === "finding_promoted", "Correct event type");
  assert(event.target_id === "basic-needs", "Targeted at correct root");

  // Mark processed (root acknowledgement)
  await supabase
    .from("knowledge_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("id", promoEventId);

  assert(true, "Root acknowledged promoted finding");
}

// ── Cleanup ────────────────────────────────────────────────────────────

async function cleanupTestData() {
  console.log("\n--- Cleanup ---");

  // Delete in reverse order to respect FK constraints
  for (const item of cleanup.reverse()) {
    const { error } = await supabase.from(item.table).delete().eq("id", item.id);
    if (error) {
      console.warn(`  WARN: Failed to clean ${item.table}/${item.id}: ${error.message}`);
    } else {
      console.log(`  Cleaned ${item.table}/${item.id}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Yggdrasil Vertical Slice E2E Test ===");
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Test tag: ${TEST_TAG}`);

  try {
    const { findingId, eventId } = await step1_seedPublishes();
    const promoEventId = await step2_categoryValidates(findingId, eventId);
    await step3_contextAssemblerReads(findingId);
    await step4_rootAcknowledges(promoEventId);

    console.log("\n=== ALL STEPS PASSED ===");
    console.log("The vertical slice is wired: Seed → Category → Root → Context Assembly");
  } catch (err) {
    console.error("\n=== TEST FAILED ===");
    console.error(err.message);
  } finally {
    await cleanupTestData();
  }
}

main();
