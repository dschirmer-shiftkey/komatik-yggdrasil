/**
 * Shared Supabase Client — World Tree Knowledge Layer
 *
 * All cross-tier knowledge (findings, knowledge_events, citations,
 * quality_reviews) lives in the shared Supabase project. Per-seed
 * operational data (sessions, workflows, decisions) stays in local Postgres.
 *
 * Uses the service role key for server-side operations (bypasses RLS).
 * This is appropriate because all callers are trusted infrastructure
 * services, not end-user clients.
 *
 * Environment:
 *   SUPABASE_URL              — Project URL (https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client = null;

export function getSupabase() {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — " +
        "world tree queries will be unavailable"
    );
    return null;
  }

  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[supabase] Connected to world tree at ${SUPABASE_URL}`);
  return _client;
}

// ── Knowledge Event Helpers ────────────────────────────────────────────

/**
 * Post a knowledge event to the world tree.
 */
export async function postKnowledgeEvent(supabase, {
  eventType,
  sourceType,
  sourceId,
  categoryId = null,
  targetType = null,
  targetId = null,
  payload = {},
}) {
  const { data, error } = await supabase
    .from("knowledge_events")
    .insert({
      event_type: eventType,
      source_type: sourceType,
      source_id: sourceId,
      category_id: categoryId,
      target_type: targetType,
      target_id: targetId,
      payload,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[supabase] Failed to post ${eventType} event:`, error.message);
    throw error;
  }

  console.log(`[supabase] Posted ${eventType} event: ${data.id}`);
  return data;
}

/**
 * Poll for unprocessed knowledge events targeting this tier.
 */
export async function pollKnowledgeEvents(supabase, { targetType, targetId = null, limit = 20 }) {
  let query = supabase
    .from("knowledge_events")
    .select("*")
    .eq("processed", false)
    .eq("target_type", targetType)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (targetId) {
    query = query.eq("target_id", targetId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[supabase] Failed to poll events:`, error.message);
    throw error;
  }

  return data || [];
}

/**
 * Mark a knowledge event as processed.
 */
export async function markEventProcessed(supabase, eventId) {
  const { error } = await supabase
    .from("knowledge_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    console.error(`[supabase] Failed to mark event ${eventId} processed:`, error.message);
    throw error;
  }
}

// ── Finding Helpers ────────────────────────────────────────────────────

/**
 * Write a finding to the world tree.
 */
export async function publishFinding(supabase, {
  sourceType,
  sourceId,
  categoryId,
  rootId,
  title,
  summary,
  content,
  methodology = null,
  confidence = "preliminary",
  tags = [],
  sdgs = [],
  geographicScope = [],
  workflowId = null,
  cycleNumber = null,
  agentRole = null,
  tokensUsed = 0,
  costUsd = 0,
}) {
  const { data, error } = await supabase
    .from("findings")
    .insert({
      source_type: sourceType,
      source_id: sourceId,
      category_id: categoryId,
      root_id: rootId,
      title,
      summary,
      content,
      methodology,
      confidence,
      tags,
      sdgs,
      geographic_scope: geographicScope,
      workflow_id: workflowId,
      cycle_number: cycleNumber,
      agent_role: agentRole,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[supabase] Failed to publish finding:`, error.message);
    throw error;
  }

  console.log(`[supabase] Published finding: ${data.id} — "${title}"`);
  return data;
}

/**
 * Query validated findings from the world tree for context assembly.
 * Returns findings from the category, root, and geographic scope.
 */
export async function queryTreeFindings(supabase, {
  categoryId,
  rootId,
  geographicScope = [],
  excludeSourceId = null,
  limit = 50,
}) {
  const results = { category: [], root: [], geographic: [], superseded: [] };

  // 1. Category findings — what does this category already know?
  {
    let query = supabase
      .from("findings")
      .select("id, title, summary, source_type, source_id, confidence, geographic_scope, tags, created_at")
      .eq("category_id", categoryId)
      .in("confidence", ["validated", "preliminary"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (excludeSourceId) {
      query = query.neq("source_id", excludeSourceId);
    }

    const { data, error } = await query;
    if (!error && data) results.category = data;
  }

  // 2. Root findings — cross-category synthesis
  {
    const { data, error } = await supabase
      .from("findings")
      .select("id, title, summary, source_type, source_id, category_id, confidence, tags, created_at")
      .eq("root_id", rootId)
      .eq("source_type", "root")
      .eq("confidence", "validated")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) results.root = data;
  }

  // 3. Geographic overlap — what do nearby seeds in other categories know?
  if (geographicScope.length > 0) {
    const { data, error } = await supabase
      .from("findings")
      .select("id, title, summary, source_type, source_id, category_id, confidence, geographic_scope, tags, created_at")
      .overlaps("geographic_scope", geographicScope)
      .neq("category_id", categoryId)
      .in("confidence", ["validated"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) results.geographic = data;
  }

  // 4. Superseded/retracted — don't re-research stale findings
  {
    const { data, error } = await supabase
      .from("findings")
      .select("id, title, summary, confidence, superseded_by, created_at")
      .eq("category_id", categoryId)
      .in("confidence", ["superseded", "retracted"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) results.superseded = data;
  }

  return results;
}
