-- 005_apex_and_public_signal.sql
--
-- Schema changes for the apex tier (Yggdrasil HQ) and the Public Signal
-- pipeline. Tracks the architectural mechanisms added in docs/system-design.md
-- §10-13 and docs/charter.md.
--
-- What this migration does:
--   1. Extends finding_source_type enum with 'apex' and 'public_signal'
--   2. Extends finding_confidence enum with 'contested' and 'informational'
--   3. Relaxes findings.root_id / findings.category_id to nullable
--      (apex and public_signal findings don't belong to a single tier)
--   4. Adds findings.spans_roots (which roots a cross-root finding touches)
--   5. Adds findings.kind (typed finding discriminator, e.g.
--      'contested_tension', 'cross_root_pattern', 'contention_map',
--      'mission_drift_flag', 'signal_digest')
--   6. Adds findings.payload (structured type-specific data; mirrors
--      knowledge_events.payload)
--   7. Creates indexes for common apex queries
--   8. Creates the contention_map view (system-design §12.2)
--
-- knowledge_events.event_type remains free-form text; new event types
-- (mission_drift_flagged, cross_root_pattern_detected, potential_conflict,
-- collaboration_required, contested_tension, signal_submitted,
-- signal_digested, signal_routed, signal_decided, knowledge_available,
-- finding_retracted) are documented in docs/system-design.md, not enforced
-- at the schema level.
--
-- This migration is backward-compatible: all existing findings have
-- non-null root_id/category_id, so relaxing the NOT NULL constraints
-- leaves existing rows valid. New columns have defaults.

-- =====================================================================
-- 1. Extend enums
-- =====================================================================

-- Source types for apex tier and public signal intake
ALTER TYPE finding_source_type ADD VALUE IF NOT EXISTS 'apex';
ALTER TYPE finding_source_type ADD VALUE IF NOT EXISTS 'public_signal';

-- Confidence values for contested findings (under or post collaboration)
-- and informational findings (digests, maps — not quality-gated the same way)
ALTER TYPE finding_confidence ADD VALUE IF NOT EXISTS 'contested';
ALTER TYPE finding_confidence ADD VALUE IF NOT EXISTS 'informational';

-- =====================================================================
-- 2. Relax tier-binding on findings
-- =====================================================================

-- Apex findings span roots or the whole tree. Public signal digests have
-- no tier at all. Force-pinning every finding to a single root_id /
-- category_id no longer models reality.
ALTER TABLE findings ALTER COLUMN root_id DROP NOT NULL;
ALTER TABLE findings ALTER COLUMN category_id DROP NOT NULL;

-- =====================================================================
-- 3. New columns on findings
-- =====================================================================

-- spans_roots: which roots a cross-root finding touches. Empty for
-- single-tier findings (seed/category/root-level work). Populated (2+
-- entries) for apex cross_root_pattern findings and contested_tension
-- findings that span roots.
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS spans_roots text[] NOT NULL DEFAULT '{}';

-- kind: typed finding discriminator for apex and collaboration outputs.
-- Null for regular research findings. Values used by apex:
--   'cross_root_pattern'   — apex synthesizer, spans 2+ roots
--   'contested_tension'    — collaboration protocol irreconcilable output
--   'contention_map'       — apex aggregation of all contested tensions
--   'mission_drift_flag'   — apex mission guardian output
--   'signal_digest'        — public signal aggregation output
--   'signal_routing'       — apex routing decision on a signal theme
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS kind text;

-- payload: structured type-specific data. Mirrors knowledge_events.payload.
-- Examples:
--   contested_tension:  { position_a, position_b, structural_reason, parties }
--   mission_drift_flag: { charter_section, observation, severity, root_id }
--   cross_root_pattern: { pattern_kind, shared_driver, evidence_trail }
--   signal_digest:      { themes: [{ cluster, mass, keywords, sample_quotes }] }
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;

-- =====================================================================
-- 4. Indexes
-- =====================================================================

-- GIN index for "which findings touch root X" queries
CREATE INDEX IF NOT EXISTS findings_spans_roots_gin_idx
  ON findings USING GIN (spans_roots);

-- Partial index for kind-based lookups (most findings have null kind)
CREATE INDEX IF NOT EXISTS findings_kind_idx
  ON findings (kind)
  WHERE kind IS NOT NULL;

-- Optimized index for contention map queries (contested + tension, newest first)
-- Partial condition only on kind — casting confidence to text is not
-- IMMUTABLE and cannot be used in an index predicate. By application
-- invariant, any row with kind='contested_tension' also has
-- confidence='contested', so the kind filter alone suffices.
CREATE INDEX IF NOT EXISTS findings_contested_tension_idx
  ON findings (created_at DESC)
  WHERE kind = 'contested_tension';

-- =====================================================================
-- 5. Contention Map view
-- =====================================================================
--
-- Public view aggregating irreconcilable tensions from the Collaboration
-- Protocol. Ranked by times-referenced (importance) and age-unresolved
-- (hardness). See docs/system-design.md §12.2.

DROP VIEW IF EXISTS contention_map;

CREATE VIEW contention_map WITH (security_invoker=on) AS
SELECT
  f.id,
  f.title,
  f.summary,
  f.source_type,
  f.source_id,
  f.root_id,
  f.category_id,
  f.spans_roots,
  f.payload->>'position_a'         AS position_a,
  f.payload->>'position_b'         AS position_b,
  f.payload->>'structural_reason'  AS structural_reason,
  f.payload->'parties'             AS parties,
  f.created_at,
  f.updated_at,
  (now() - f.created_at)           AS age_unresolved,
  COALESCE(refs.times_referenced, 0) AS times_referenced
FROM findings f
LEFT JOIN (
  SELECT cited_finding_id, count(*)::int AS times_referenced
  FROM citations
  GROUP BY cited_finding_id
) refs ON refs.cited_finding_id = f.id
-- Text casts on confidence avoid the same-transaction new-enum-value
-- problem: if this migration runs in one tx, the newly-added 'contested'
-- enum value may not be usable as a literal until commit. The cast
-- compares the string representation instead.
WHERE f.confidence::text = 'contested'
  AND f.kind = 'contested_tension'
ORDER BY times_referenced DESC, age_unresolved DESC;

COMMENT ON VIEW contention_map IS
  'Public aggregate of irreconcilable tensions from the Collaboration Protocol. See docs/system-design.md §12.';

-- =====================================================================
-- 6. Column comments (aid future readers)
-- =====================================================================

COMMENT ON COLUMN findings.spans_roots IS
  'Which roots a cross-root finding touches. Empty for single-tier findings.';

COMMENT ON COLUMN findings.kind IS
  'Typed finding discriminator for apex / collaboration outputs. Null for regular research findings.';

COMMENT ON COLUMN findings.payload IS
  'Structured type-specific data. See migration 005 header for shapes per kind.';
