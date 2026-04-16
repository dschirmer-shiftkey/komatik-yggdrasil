-- Adds retraction columns to the decisions table.
-- Complements the existing outcome='superseded' value with explicit
-- retraction tracking: who retracted, why, and when.

ALTER TABLE decisions ADD COLUMN IF NOT EXISTS retracted BOOLEAN DEFAULT false;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS retracted_reason TEXT;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS retracted_at TIMESTAMPTZ;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS retracted_by TEXT;

-- Indexes for the context assembler's hot queries
CREATE INDEX IF NOT EXISTS idx_decisions_agent_created
  ON decisions(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decisions_active
  ON decisions(agent_id, created_at DESC)
  WHERE retracted = false;

CREATE INDEX IF NOT EXISTS idx_decisions_outcome
  ON decisions(agent_id, outcome, created_at DESC);
