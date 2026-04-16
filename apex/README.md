# Apex — Yggdrasil HQ

> The top of the tree. Cross-root synthesis, mission guarding against
> the charter, Contention Map aggregation, Public Signal routing.

## Purpose

One container sits above the four Root HQs. It is the only tier with a
tree-wide view and the only tier that reads `docs/charter.md` into agent
context.

See:
- [MISSION.md](MISSION.md) — this container's mission
- [../docs/charter.md](../docs/charter.md) — the constitutional document
  the apex guards and executes
- [../docs/system-design.md](../docs/system-design.md) §10-13 — full
  architectural specs for apex tier, Collaboration Protocol, Contention
  Map, and Public Signal Pipeline

## Agents

Two agents share one container, matching the Root HQ pattern:

| Agent | Role | Model |
|---|---|---|
| Mission Guardian | Flags Root HQ drift from the charter | Opus |
| Synthesizer | Cross-root patterns + Contention Map + Public Signal routing + root-vs-root mediation | Opus |

Agent configs live under [config/agents/](config/agents/).

## Cycle

- **Frequency:** Daily (`CYCLE_INTERVAL_MINUTES=1440`), or on significant
  upstream event
- **Steps:** `synthesis` → `mission` (synthesizer produces, guardian
  reviews — same pattern as Root HQ)

## Boot

```bash
docker compose --project-directory . \
  -f infrastructure/compose.yaml \
  -f apex/config/compose.override.yaml up
```

## Dependencies Not Yet in Place

The apex container spec is **planned**, not yet operational. Before it
can boot in production, these must land:

1. **DB migrations** — add to Supabase:
   - `findings.source_type` enum: `apex`, `public_signal`
   - `findings.confidence` enum: `contested`, `informational`
   - New event types: `mission_drift_flagged`,
     `cross_root_pattern_detected`, `potential_conflict`,
     `collaboration_required`, `contested_tension`, `signal_submitted`,
     `signal_digested`, `signal_routed`, `signal_decided`
2. **Event processor** — add `PROCESSOR_TYPE=apex` support in
   `infrastructure/event-processor/index.js` (currently only handles
   `category` and `root` types)
3. **Bifrost** — confirm Opus model entry in the project bifrost config
4. **Public Signal intake** — GitHub issue template with `public-signal`
   label, plus aggregation job (can land after apex boot)

## Cost

| Component | Est. monthly |
|---|---|
| Compute (0.5 vCPU, 2 GB, ~1 hr/day) | $1-2 |
| LLM API (Opus + Sonnet) | $15-40 |
| **Total** | **$16-42/mo** |

Komatik-funded (apex is infrastructure, not sponsor-funded like seeds).

## Testing

End-to-end smoke test script at
[`infrastructure/scripts/test-apex-cycle.js`](../infrastructure/scripts/test-apex-cycle.js).
Runs a single apex cycle against the live Supabase project, exercises
cross-root synthesis and mission-drift detection on seed data, then
cleans up.
