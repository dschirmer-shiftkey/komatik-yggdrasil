#!/usr/bin/env node

/**
 * Apex Cycle Smoke Test (STUB)
 *
 * Exercises a single apex-tier cycle against the live Supabase project:
 *
 * 1. Seed cross-root test findings (one in basic-needs/housing,
 *    one in human-growth/economic-opportunity) that share an
 *    underlying driver — this is the pattern the Synthesizer should
 *    detect.
 * 2. Seed a drifting finding (one that violates Charter §4.7 —
 *    a policy recommendation rather than a proposition) in a root —
 *    this is what the Mission Guardian should flag.
 * 3. Invoke the apex event processor / synthesis cycle.
 * 4. Assert that:
 *    - a cross_root_pattern_detected event was emitted
 *    - a mission_drift_flagged event was emitted
 *    - both apex-generated findings are visible in Supabase with
 *      source_type = 'apex'
 * 5. Clean up test data.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node infrastructure/scripts/test-apex-cycle.js
 *
 * STATUS: STUB. Waits on these dependencies before it can run:
 *   - Supabase migration adding `apex` to findings.source_type enum
 *   - Supabase migration adding `mission_drift_flagged` and
 *     `cross_root_pattern_detected` event types
 *   - infrastructure/event-processor/index.js support for
 *     PROCESSOR_TYPE=apex
 *   - Apex container booted (apex/config/compose.override.yaml)
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

const TEST_TAG = "apex-e2e-" + Date.now();
const cleanup = [];

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

async function main() {
  console.log(`\n=== Apex Cycle Smoke Test (${TEST_TAG}) ===\n`);

  console.log("NOT YET RUNNABLE. Waits on dependencies listed in file header.");
  console.log("See apex/README.md 'Dependencies Not Yet in Place'.");
  console.log("");
  console.log("Planned flow:");
  console.log("  1. Seed cross-root test findings (housing + econ-opportunity)");
  console.log("  2. Seed a drift-test finding (policy recommendation)");
  console.log("  3. Trigger apex event processor");
  console.log("  4. Assert cross_root_pattern_detected emitted");
  console.log("  5. Assert mission_drift_flagged emitted");
  console.log("  6. Assert source_type='apex' findings exist");
  console.log("  7. Clean up test data");

  // TODO: Implement once dependencies land.
  //
  // Sketch:
  //
  // await supabase.from("findings").insert([
  //   {
  //     source_type: "category",
  //     root_id: "basic-needs",
  //     category_id: "housing",
  //     title: `[${TEST_TAG}] LA housing cost driver`,
  //     confidence: "validated",
  //     payload: { driver: "wage_stagnation", evidence: "..." },
  //   },
  //   {
  //     source_type: "category",
  //     root_id: "human-growth",
  //     category_id: "economic-opportunity",
  //     title: `[${TEST_TAG}] LA wage trend`,
  //     confidence: "validated",
  //     payload: { driver: "wage_stagnation", evidence: "..." },
  //   },
  //   {
  //     source_type: "root",
  //     root_id: "basic-needs",
  //     title: `[${TEST_TAG}] Drift: LA council should ban rent hikes`,
  //     confidence: "validated",
  //     payload: {
  //       kind: "recommendation",  // §4.7 violation
  //       target_actor: "LA city council",
  //     },
  //   },
  // ]);
  //
  // // ... trigger apex cycle, poll for events, assert ...
  // // ... cleanup via `delete from findings where title like '[${TEST_TAG}]%'` ...
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
