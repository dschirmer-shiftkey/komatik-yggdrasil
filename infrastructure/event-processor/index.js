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
 *   - signal_digested (from signal-aggregator)→ route digest themes to target tiers
 *                                               with signal_routed events
 *   - potential_conflict (root-vs-root)      → emit collaboration_required events
 *                                               for both root parties
 *   - knowledge_available                    → acknowledge
 *
 *   Apex does not do LLM synthesis work on the event path — the daily LLM
 *   cycle (agent-synthesis) still reads `findings` directly. The
 *   event-processor performs deterministic routing/mediation fan-out so
 *   downstream tiers can react on their next cycles.
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

import { randomUUID } from "node:crypto";

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

const SIGNAL_ROUTE_RULES = [
  {
    targetType: "category",
    targetId: "housing",
    categoryId: "housing",
    rootId: "basic-needs",
    keywords: ["los angeles", "la county", " la ", "homeless", "housing", "shelter", "rent", "tenant", "encampment"],
    rationale: "Housing or LA homelessness signal; route to the Housing category for seed-level triage.",
  },
  {
    targetType: "category",
    targetId: "energy",
    categoryId: "energy",
    rootId: "basic-needs",
    keywords: ["energy", "power", "electric", "microgrid", "solar", "grid"],
    rationale: "Energy-access signal; route to the Energy category.",
  },
  {
    targetType: "category",
    targetId: "health",
    categoryId: "health",
    rootId: "basic-needs",
    keywords: ["health", "clinic", "hospital", "medical", "mental health", "addiction"],
    rationale: "Health-service signal; route to the Health category.",
  },
  {
    targetType: "category",
    targetId: "hunger",
    categoryId: "hunger",
    rootId: "basic-needs",
    keywords: ["food", "hunger", "nutrition", "meal", "grocery"],
    rationale: "Food-security signal; route to the Hunger category.",
  },
  {
    targetType: "category",
    targetId: "water",
    categoryId: "water",
    rootId: "basic-needs",
    keywords: ["water", "sanitation", "sewer", "clean water"],
    rationale: "Water/sanitation signal; route to the Water category.",
  },
  {
    targetType: "category",
    targetId: "economic-opportunity",
    categoryId: "economic-opportunity",
    rootId: "human-growth",
    keywords: ["job", "wage", "income", "employment", "poverty", "workforce"],
    rationale: "Economic-opportunity signal; route to that category.",
  },
];

function signalText(theme) {
  return [
    theme?.cluster,
    theme?.summary,
    ...(theme?.keywords || []),
    ...(theme?.sample_quotes || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferSignalRoute(theme) {
  const text = ` ${signalText(theme)} `;
  const route = SIGNAL_ROUTE_RULES.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword))
  );

  if (route) return route;

  return {
    targetType: "root",
    targetId: "basic-needs",
    categoryId: null,
    rootId: "basic-needs",
    rationale: "No specific route matched; default to Basic Needs root triage.",
  };
}

function sharedQuestionForConflict(event) {
  if (event.payload?.shared_question) return event.payload.shared_question;

  const parties = event.payload?.parties || [];
  const claimA = event.payload?.claim_a || "the first position";
  const claimB = event.payload?.claim_b || "the second position";

  if (parties.length >= 2) {
    return `Under what conditions can ${parties[0]} and ${parties[1]} both be correct about ${claimA} versus ${claimB}?`;
  }

  return "Under what conditions can the opposed findings both be correct, and where is the disagreement structural?";
}

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
 * Target-tier handler: acknowledge an apex-routed public signal and publish
 * a transparent signal_decided event so the public feedback loop can see that
 * the route reached a tier queue. Deeper task creation is handled by the
 * target tier's next agent cycle.
 */
async function handleSignalRouted(supabase, event) {
  const route = event.payload?.route || {};
  console.log(
    `[processor] ${PROCESSOR_TYPE}/${PROCESSOR_ID} received signal_routed theme=${event.payload?.theme_index} route=${route.target_type}/${route.target_id}`
  );

  await postKnowledgeEvent(supabase, {
    eventType: "signal_decided",
    sourceType: PROCESSOR_TYPE,
    sourceId: PROCESSOR_ID,
    categoryId: CATEGORY_ID || event.category_id || null,
    payload: {
      routed_event_id: event.id,
      digest_finding_id: event.payload?.digest_finding_id,
      theme_index: event.payload?.theme_index,
      decision: "worth_researching",
      disposition: "queued_for_next_cycle",
      reason: "Apex-routed public signal reached the target tier queue.",
    },
  });

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
    `[processor] Apex routing signal_digested finding=${digestFindingId} themes=${themeCount}`
  );

  if (!digestFindingId) {
    console.warn(`[processor] signal_digested event missing finding_id:`, event.id);
    await markEventProcessed(supabase, event.id);
    return;
  }

  const { data: digest, error } = await supabase
    .from("findings")
    .select("id, title, payload")
    .eq("id", digestFindingId)
    .single();

  if (error || !digest) {
    console.error(`[processor] Could not fetch signal digest ${digestFindingId}:`, error?.message);
    await markEventProcessed(supabase, event.id);
    return;
  }

  const themes = Array.isArray(digest.payload?.themes) ? digest.payload.themes : [];
  for (const [index, theme] of themes.entries()) {
    const route = inferSignalRoute(theme);
    await postKnowledgeEvent(supabase, {
      eventType: "signal_routed",
      sourceType: "apex",
      sourceId: PROCESSOR_ID,
      categoryId: route.categoryId,
      targetType: route.targetType,
      targetId: route.targetId,
      payload: {
        digest_finding_id: digestFindingId,
        digest_title: digest.title,
        theme_index: index,
        theme,
        route: {
          target_type: route.targetType,
          target_id: route.targetId,
          root_id: route.rootId,
          category_id: route.categoryId,
        },
        rationale: route.rationale,
        source_event_id: event.id,
      },
    });
  }

  console.log(`[processor] Routed ${themes.length} signal theme(s) from digest=${digestFindingId}`);
  await markEventProcessed(supabase, event.id);
}

/**
 * Apex: two roots have produced opposed findings. Queued for
 * root-vs-root collaboration mediation (Collaboration Protocol §11).
 */
async function handleApexPotentialConflict(supabase, event) {
  const parties = event.payload?.parties || [];
  console.log(
    `[processor] Apex mediating potential_conflict parties=${parties.join(",")}`
  );

  if (parties.length < 2) {
    console.warn(`[processor] potential_conflict event missing two parties:`, event.id);
    await markEventProcessed(supabase, event.id);
    return;
  }

  const collaborationId = event.payload?.collaboration_id || randomUUID();
  const sharedQuestion = sharedQuestionForConflict(event);

  for (const party of parties) {
    await postKnowledgeEvent(supabase, {
      eventType: "collaboration_required",
      sourceType: "apex",
      sourceId: PROCESSOR_ID,
      targetType: "root",
      targetId: party,
      payload: {
        collaboration_id: collaborationId,
        parties,
        assigned_party: party,
        shared_question: sharedQuestion,
        originating_event_id: event.id,
        conflict_payload: event.payload || {},
      },
    });
  }

  console.log(
    `[processor] Emitted collaboration_required for ${parties.length} parties collaboration=${collaborationId}`
  );
  await markEventProcessed(supabase, event.id);
}

// ── Event Router ───────────────────────────────────────────────────────

export const HANDLERS = {
  category: {
    finding_ready: handleFindingReady,
    signal_routed: handleSignalRouted,
    knowledge_available: handleKnowledgeAvailable,
  },
  root: {
    finding_promoted: handleFindingPromoted,
    signal_routed: handleSignalRouted,
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
