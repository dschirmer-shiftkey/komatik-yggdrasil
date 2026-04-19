/**
 * Knowledge Event Processor
 *
 * Lightweight service that runs at category, root, and apex tiers.
 * Polls Supabase knowledge_events for unprocessed events, processes them:
 *
 * Category tier:
 *   - finding_ready → validate seed finding → promote to validated → post finding_promoted
 *   - knowledge_available → mark processed (context assembler reads on next cycle)
 *
 * Root tier:
 *   - finding_promoted → acknowledge (synthesis is future work)
 *   - Posts knowledge_available events when new root findings are created
 *
 * Apex tier (Yggdrasil HQ):
 *   - finding_promoted (from any root)       → acknowledge; queued for the
 *                                               daily synthesizer cycle
 *   - signal_digested (from signal-aggregator)→ acknowledge; queued for
 *                                               Stage 3 routing in next cycle
 *   - potential_conflict (root-vs-root)      → acknowledge; queued for
 *                                               collaboration mediation
 *   - knowledge_available                    → acknowledge
 *
 *   Apex does not do synthesis work on the event path — the daily LLM
 *   cycle (agent-synthesis) reads `findings` directly. The event-processor's
 *   role here is to keep the queue drained and log what's accumulating so
 *   the cycle has an accurate picture of pending work.
 *
 * Environment:
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key
 *   PROCESSOR_TYPE            — "category", "root", or "apex"
 *   PROCESSOR_ID              — e.g., "housing", "basic-needs", "apex"
 *   CATEGORY_ID               — category ID (for category tier)
 *   ROOT_ID                   — root ID (for root tier)
 *   POLL_INTERVAL_SECONDS     — how often to poll (default: 60)
 */

import {
  getSupabase,
  pollKnowledgeEvents,
  markEventProcessed,
  postKnowledgeEvent,
} from "@komatik/shared/supabase";

const PROCESSOR_TYPE = process.env.PROCESSOR_TYPE || "category";
const PROCESSOR_ID = process.env.PROCESSOR_ID || "unknown";
const CATEGORY_ID = process.env.CATEGORY_ID || "";
const ROOT_ID = process.env.ROOT_ID || "";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || "60", 10) * 1000;

// ── Quality Validation ─────────────────────────────────────────────────

/**
 * Basic quality checks for a finding before promotion.
 * Returns { approved: boolean, reason: string }.
 */
function validateFindingQuality(finding) {
  if (!finding.title || finding.title.trim().length < 5) {
    return { approved: false, reason: "Title too short or missing" };
  }

  if (!finding.summary || finding.summary.trim().length < 20) {
    return { approved: false, reason: "Summary too short — need at least a substantive sentence" };
  }

  if (!finding.content || finding.content.trim().length < 100) {
    return { approved: false, reason: "Content too short — findings need substantive detail" };
  }

  // Methodology is encouraged but not required for preliminary findings
  if (finding.methodology && finding.methodology.trim().length > 0) {
    console.log(`[processor] Finding has methodology — good quality signal`);
  }

  return { approved: true, reason: "Passes basic quality checks" };
}

// ── Event Handlers ─────────────────────────────────────────────────────

/**
 * Category handler: validate a seed's finding and promote if quality passes.
 */
async function handleFindingReady(supabase, event) {
  const findingId = event.payload?.finding_id;
  if (!findingId) {
    console.warn(`[processor] finding_ready event missing finding_id:`, event.id);
    await markEventProcessed(supabase, event.id);
    return;
  }

  // Fetch the full finding
  const { data: finding, error } = await supabase
    .from("findings")
    .select("*")
    .eq("id", findingId)
    .single();

  if (error || !finding) {
    console.error(`[processor] Could not fetch finding ${findingId}:`, error?.message);
    await markEventProcessed(supabase, event.id);
    return;
  }

  console.log(`[processor] Reviewing finding: "${finding.title}" from ${finding.source_id}`);

  // Check for duplicates — same title from a different seed in this category
  const { data: duplicates } = await supabase
    .from("findings")
    .select("id, title, source_id")
    .eq("category_id", finding.category_id)
    .neq("id", findingId)
    .neq("source_id", finding.source_id)
    .ilike("title", `%${finding.title.substring(0, 40)}%`)
    .limit(5);

  if (duplicates && duplicates.length > 0) {
    console.log(
      `[processor] Found ${duplicates.length} possible duplicate(s) — ` +
        `linking as corroborating evidence`
    );

    // Link as citations (corroborating evidence)
    for (const dup of duplicates) {
      await supabase.from("citations").insert({
        citing_finding_id: findingId,
        cited_finding_id: dup.id,
        context: `Corroborating evidence — similar finding from ${dup.source_id}`,
      });
    }
  }

  // Run quality validation
  const review = validateFindingQuality(finding);

  // Write quality review record
  await supabase.from("quality_reviews").insert({
    finding_id: findingId,
    reviewer_type: PROCESSOR_TYPE,
    reviewer_id: PROCESSOR_ID,
    decision: review.approved ? "approved" : "needs_revision",
    reason: review.reason,
  });

  if (review.approved) {
    // Promote: update confidence to validated, set promoted_at
    await supabase
      .from("findings")
      .update({
        confidence: "validated",
        promoted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", findingId);

    console.log(`[processor] Promoted finding "${finding.title}" to validated`);

    // Notify root that a finding has been promoted
    await postKnowledgeEvent(supabase, {
      eventType: "finding_promoted",
      sourceType: "category",
      sourceId: PROCESSOR_ID,
      categoryId: CATEGORY_ID,
      targetType: "root",
      targetId: ROOT_ID,
      payload: {
        finding_id: findingId,
        title: finding.title,
        summary: finding.summary,
        category_id: finding.category_id,
      },
    });
  } else {
    console.log(`[processor] Finding needs revision: ${review.reason}`);
  }

  await markEventProcessed(supabase, event.id);
}

/**
 * Root handler: acknowledge a promoted finding.
 * Full synthesis is future work — for now just makes it available for read-down.
 */
async function handleFindingPromoted(supabase, event) {
  const { title, category_id } = event.payload || {};
  console.log(
    `[processor] Root received promoted finding: "${title}" from category ${category_id}`
  );

  // For now, just acknowledge. Root synthesis (spotting cross-category
  // patterns, producing root-level findings) is the next phase.
  await markEventProcessed(supabase, event.id);
}

/**
 * Generic handler: mark knowledge_available events as processed.
 * Seeds/categories pick these up via context assembler on next cycle.
 */
async function handleKnowledgeAvailable(supabase, event) {
  console.log(
    `[processor] Knowledge available from ${event.source_type}/${event.source_id}`
  );
  await markEventProcessed(supabase, event.id);
}

// ── Apex handlers ──────────────────────────────────────────────────────
//
// Apex synthesis is LLM-driven on a daily cycle (agent-synthesis reads
// findings directly). The event-processor's job is to drain the queue
// and log signals the next cycle should attend to.

/**
 * Apex: a root has promoted a finding. Candidate input for cross-root
 * pattern detection and mission drift review on the next daily cycle.
 */
async function handleApexFindingPromoted(supabase, event) {
  const { title, category_id } = event.payload || {};
  console.log(
    `[processor] Apex queued finding_promoted "${title}" from root=${event.source_id} category=${category_id}`
  );
  await markEventProcessed(supabase, event.id);
}

/**
 * Apex: the signal-aggregator has published a Signal Digest. Apex's
 * daily cycle runs Stage 3 routing — tags each theme with a target tier.
 */
async function handleApexSignalDigested(supabase, event) {
  const digestFindingId = event.payload?.finding_id;
  const themeCount = event.payload?.theme_count;
  console.log(
    `[processor] Apex queued signal_digested finding=${digestFindingId} themes=${themeCount}`
  );
  await markEventProcessed(supabase, event.id);
}

/**
 * Apex: two roots have produced opposed findings. Queued for
 * root-vs-root collaboration mediation (Collaboration Protocol §11).
 */
async function handleApexPotentialConflict(supabase, event) {
  const parties = event.payload?.parties || [];
  console.log(
    `[processor] Apex queued potential_conflict parties=${parties.join(",")}`
  );
  await markEventProcessed(supabase, event.id);
}

// ── Event Router ───────────────────────────────────────────────────────

export const HANDLERS = {
  category: {
    finding_ready: handleFindingReady,
    knowledge_available: handleKnowledgeAvailable,
  },
  root: {
    finding_promoted: handleFindingPromoted,
    knowledge_available: handleKnowledgeAvailable,
  },
  apex: {
    finding_promoted: handleApexFindingPromoted,
    signal_digested: handleApexSignalDigested,
    potential_conflict: handleApexPotentialConflict,
    knowledge_available: handleKnowledgeAvailable,
  },
};

async function processEvents() {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[processor] Supabase not configured — cannot process events");
    return;
  }

  const handlers = HANDLERS[PROCESSOR_TYPE];
  if (!handlers) {
    console.error(`[processor] Unknown processor type: ${PROCESSOR_TYPE}`);
    return;
  }

  const events = await pollKnowledgeEvents(supabase, {
    targetType: PROCESSOR_TYPE,
    targetId: PROCESSOR_ID,
  });

  if (events.length === 0) return;

  console.log(`[processor] Processing ${events.length} events for ${PROCESSOR_TYPE}/${PROCESSOR_ID}`);

  for (const event of events) {
    const handler = handlers[event.event_type];
    if (handler) {
      try {
        await handler(supabase, event);
      } catch (err) {
        console.error(
          `[processor] Error handling ${event.event_type} (${event.id}):`,
          err.message
        );
        // Don't mark as processed on error — retry on next poll
      }
    } else {
      console.warn(`[processor] No handler for event type: ${event.event_type}`);
      await markEventProcessed(supabase, event.id);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `[processor] Starting ${PROCESSOR_TYPE} event processor for ${PROCESSOR_ID}`
  );
  console.log(`[processor] Poll interval: ${POLL_INTERVAL / 1000}s`);

  // Initial poll
  await processEvents();

  // Continuous polling
  setInterval(processEvents, POLL_INTERVAL);

  process.on("SIGTERM", () => {
    console.log("[processor] Shutting down...");
    process.exit(0);
  });
}

// Only start the polling loop when this file is the CLI entry point
// (so tests and scripts can import HANDLERS without side effects).
import { fileURLToPath } from "url";
const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  main().catch((err) => {
    console.error("[processor] Fatal error:", err);
    process.exit(1);
  });
}
