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

## Supporting Infrastructure

All pre-boot dependencies are in place:

1. **DB schema** — migration 005 adds apex/public_signal enum values,
   `findings.spans_roots`, `findings.kind`, `findings.payload`, and the
   `contention_map` view
2. **Event processor** — `PROCESSOR_TYPE=apex` in
   [`infrastructure/event-processor/index.js`](../infrastructure/event-processor/index.js)
   drains `finding_promoted`, `signal_digested`, `potential_conflict`,
   and `knowledge_available` events
3. **Bifrost** — [`config/bifrost.json`](config/bifrost.json) adds
   Opus + Sonnet to the provider models and virtual key allowlist; the
   compose override mounts it over the base template
4. **Public Signal intake** — GitHub issue template with `public-signal`
   label at [`.github/ISSUE_TEMPLATE/public-signal.yml`](../.github/ISSUE_TEMPLATE/public-signal.yml)
5. **Public Signal aggregator** — [`infrastructure/signal-aggregator/`](../infrastructure/signal-aggregator/)
   polls GitHub issues, LLM-clusters them via Bifrost, writes Signal
   Digest findings + emits `signal_digested` events to apex. Boots with
   the apex stack.

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
