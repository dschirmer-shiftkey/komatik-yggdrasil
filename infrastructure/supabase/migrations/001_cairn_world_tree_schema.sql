-- 001_cairn_world_tree_schema.sql
--
-- Greenfield world-tree schema for the Cairn Supabase project.
-- Replaces legacy Yggdrasil project migrations 001-005 (never committed).
-- Service-role infrastructure writes; public read via RLS.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- Enums
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE finding_source_type AS ENUM (
    'seed', 'category', 'root', 'apex', 'public_signal'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE finding_confidence AS ENUM (
    'preliminary', 'validated', 'superseded', 'retracted',
    'contested', 'informational'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- Findings
-- =====================================================================

CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type finding_source_type NOT NULL,
  source_id text NOT NULL,
  category_id text,
  root_id text,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  methodology text,
  confidence finding_confidence NOT NULL DEFAULT 'preliminary',
  tags text[] NOT NULL DEFAULT '{}',
  sdgs integer[] NOT NULL DEFAULT '{}',
  geographic_scope text[] NOT NULL DEFAULT '{}',
  workflow_id uuid,
  cycle_number integer,
  agent_role text,
  tokens_used integer NOT NULL DEFAULT 0,
  cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  kind text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  spans_roots text[] NOT NULL DEFAULT '{}',
  superseded_by uuid REFERENCES findings(id) ON DELETE SET NULL,
  promoted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS findings_category_id_idx ON findings (category_id);
CREATE INDEX IF NOT EXISTS findings_root_id_idx ON findings (root_id);
CREATE INDEX IF NOT EXISTS findings_source_idx ON findings (source_type, source_id);
CREATE INDEX IF NOT EXISTS findings_confidence_idx ON findings (confidence);
CREATE INDEX IF NOT EXISTS findings_spans_roots_gin_idx ON findings USING GIN (spans_roots);
CREATE INDEX IF NOT EXISTS findings_kind_idx ON findings (kind) WHERE kind IS NOT NULL;
CREATE INDEX IF NOT EXISTS findings_contested_tension_idx
  ON findings (created_at DESC)
  WHERE kind = 'contested_tension';

-- =====================================================================
-- Knowledge events
-- =====================================================================

CREATE TABLE IF NOT EXISTS knowledge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  source_type finding_source_type NOT NULL,
  source_id text NOT NULL,
  category_id text,
  target_type text,
  target_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_events_poll_idx
  ON knowledge_events (target_type, target_id, processed, created_at);

-- =====================================================================
-- Citations & quality reviews
-- =====================================================================

CREATE TABLE IF NOT EXISTS citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citing_finding_id uuid NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  cited_finding_id uuid NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  context text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS citations_cited_idx ON citations (cited_finding_id);

CREATE TABLE IF NOT EXISTS quality_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id uuid NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL,
  reviewer_id text NOT NULL,
  decision text NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quality_reviews_finding_idx ON quality_reviews (finding_id);

-- =====================================================================
-- Sponsorships & token usage (budget enforcement — Phase B+)
-- =====================================================================

CREATE TABLE IF NOT EXISTS sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id text NOT NULL UNIQUE,
  sponsor_name text,
  monthly_budget_usd numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id text NOT NULL,
  agent_id text,
  model text,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS token_usage_seed_month_idx
  ON token_usage (seed_id, recorded_at);

-- =====================================================================
-- Contention map view
-- =====================================================================

DROP VIEW IF EXISTS contention_map;

CREATE VIEW contention_map WITH (security_invoker = on) AS
SELECT
  f.id,
  f.title,
  f.summary,
  f.source_type,
  f.source_id,
  f.root_id,
  f.category_id,
  f.spans_roots,
  f.payload->>'position_a' AS position_a,
  f.payload->>'position_b' AS position_b,
  f.payload->>'structural_reason' AS structural_reason,
  f.payload->'parties' AS parties,
  f.created_at,
  f.updated_at,
  (now() - f.created_at) AS age_unresolved,
  COALESCE(refs.times_referenced, 0) AS times_referenced
FROM findings f
LEFT JOIN (
  SELECT cited_finding_id, count(*)::int AS times_referenced
  FROM citations
  GROUP BY cited_finding_id
) refs ON refs.cited_finding_id = f.id
WHERE f.confidence::text = 'contested'
  AND f.kind = 'contested_tension'
ORDER BY times_referenced DESC, age_unresolved DESC;

-- =====================================================================
-- RLS — public read, service role writes (via bypass)
-- =====================================================================

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS findings_public_read ON findings;
CREATE POLICY findings_public_read ON findings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS knowledge_events_public_read ON knowledge_events;
CREATE POLICY knowledge_events_public_read ON knowledge_events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS citations_public_read ON citations;
CREATE POLICY citations_public_read ON citations
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS quality_reviews_public_read ON quality_reviews;
CREATE POLICY quality_reviews_public_read ON quality_reviews
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS sponsorships_public_read ON sponsorships;
CREATE POLICY sponsorships_public_read ON sponsorships
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS token_usage_public_read ON token_usage;
CREATE POLICY token_usage_public_read ON token_usage
  FOR SELECT TO anon, authenticated USING (true);
