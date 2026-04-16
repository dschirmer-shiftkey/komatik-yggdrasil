/**
 * Decision Logging & Retraction
 *
 * Write path into the decisions audit trail. Every significant agent
 * decision gets logged so future sessions can learn from past outcomes.
 * Supports the full lifecycle: log → update outcome → retract.
 */

export async function logDecision(pool, {
  agentId,
  decisionType,
  description,
  reasoning,
  confidence,
  outcome = "pending",
}) {
  const result = await pool.query(
    `INSERT INTO decisions
       (agent_id, decision_type, description, reasoning, confidence, outcome)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at`,
    [agentId, decisionType, description, reasoning, confidence, outcome]
  );
  return result.rows[0];
}

export async function updateDecisionOutcome(pool, decisionId, outcome) {
  await pool.query(
    "UPDATE decisions SET outcome = $1 WHERE id = $2",
    [outcome, decisionId]
  );
}

export async function retractDecision(pool, decisionId, { retractedBy, reason }) {
  await pool.query(
    `UPDATE decisions
     SET retracted = true,
         retracted_reason = $1,
         retracted_by = $2,
         retracted_at = now(),
         outcome = 'superseded'
     WHERE id = $3 AND (retracted = false OR retracted IS NULL)`,
    [reason, retractedBy, decisionId]
  );
}

export async function getRecentDecisions(pool, agentId, {
  limit = 20,
  includeRetracted = false,
  lookbackDays = 7,
} = {}) {
  const retractedClause = includeRetracted
    ? ""
    : "AND (retracted = false OR retracted IS NULL)";
  const result = await pool.query(
    `SELECT id, decision_type, description, reasoning, confidence, outcome,
            retracted, retracted_reason, created_at
     FROM decisions
     WHERE agent_id = $1
       AND created_at > now() - make_interval(days => $2)
       ${retractedClause}
     ORDER BY created_at DESC
     LIMIT $3`,
    [agentId, lookbackDays, limit]
  );
  return result.rows;
}

export async function getDecisionsByType(pool, agentId, decisionType, { limit = 10 } = {}) {
  const result = await pool.query(
    `SELECT id, description, reasoning, confidence, outcome, retracted, created_at
     FROM decisions
     WHERE agent_id = $1
       AND decision_type = $2
       AND (retracted = false OR retracted IS NULL)
     ORDER BY created_at DESC
     LIMIT $3`,
    [agentId, decisionType, limit]
  );
  return result.rows;
}
