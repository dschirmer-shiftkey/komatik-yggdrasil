-- Fix partial index to include NULL retracted rows.
-- Pre-migration rows have retracted IS NULL (column didn't exist yet),
-- but the original index only covered retracted = false.

DROP INDEX IF EXISTS idx_decisions_active;

CREATE INDEX IF NOT EXISTS idx_decisions_active
  ON decisions(agent_id, created_at DESC)
  WHERE retracted = false OR retracted IS NULL;
