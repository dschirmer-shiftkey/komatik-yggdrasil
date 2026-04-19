# Seed 002 Dry-Run Runbook (Phase 2)

> First live research cycle for seed 002 (Homelessness LA), publisher
> disabled, tight budget cap. Phase 2 of the first-live-cycle plan.

## What this does

Boots the full seed stack — 6 agents, scheduler, gateway, local postgres,
Bifrost, event-processor — against the live Yggdrasil Supabase, runs
**one research cycle**, then idles. Nothing gets pushed to GitHub.

## Constraints

| Control | Value | Enforced by |
|---|---|---|
| Monthly spend cap | **$5** | [bifrost.json](bifrost.json) `virtualKeys.budget.maxCostPerMonth` |
| Allowed models | **claude-sonnet-4-20250514 only** | [bifrost.json](bifrost.json) `providers[].models` + `allowedModels` |
| Publisher | **Disabled** | [../compose.dry-run.yaml](../compose.dry-run.yaml) `publisher.replicas: 0` |
| Cycle cadence | **~1 year** (= effectively single-cycle) | [../compose.dry-run.yaml](../compose.dry-run.yaml) `CYCLE_INTERVAL_MINUTES` |
| Required credentials | `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` only | dry-run bifrost has no OpenAI/Google providers |

## Pre-flight

Verify `infrastructure/.env` has the two required keys. GITHUB_TOKEN can
be empty (publisher is off).

```bash
grep -E "^(ANTHROPIC|SUPABASE_SERVICE)" infrastructure/.env
```

## Boot

From repo root:

```bash
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml \
  up
```

Leave the terminal running to watch logs. Expect startup to take
30-60 seconds for Bifrost, gateway, postgres, then agents to come up.

## Watch

The scheduler fires `runCycle()` immediately on startup. You should see
in the logs (roughly in order):

1. `[gateway] listening on :18789`
2. `[bifrost-init] Config generated from template` (or similar)
3. `[scheduler] Starting new research cycle...`
4. `[scheduler] Created workflow <uuid> — cycle #1`
5. `[agent-research] claimed step ...` → `[agent-research] completed step ...`
6. `[agent-analysis] ...` → `[agent-prototype] ...` → `[agent-documentation] ...`
7. `[agent-mission] ...` with a JSON approval block in its output
8. `[agent-community] ...`
9. `[scheduler] Cycle finished: completed`

In a second terminal you can tail just the agents:

```bash
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml \
  logs -f agent-research agent-analysis agent-prototype agent-documentation agent-mission agent-community
```

## Inspect — during or after

**Local workflow state** (postgres inside the stack):

```bash
docker compose --project-directory infrastructure exec db \
  psql -U seedling -d seedling \
  -c "SELECT agent_id, status, started_at, completed_at FROM workflow_steps ORDER BY step_order;"
```

**LLM spend so far** (local `llm_usage` table):

```bash
docker compose --project-directory infrastructure exec db \
  psql -U seedling -d seedling \
  -c "SELECT agent_id, model, sum(input_tokens) AS in_t, sum(output_tokens) AS out_t, sum(cost_usd)::numeric(10,4) AS cost FROM llm_usage GROUP BY agent_id, model ORDER BY cost DESC;"
```

**Findings produced** (on the shared world tree via Supabase MCP):

```
mcp query:
  SELECT id, title, confidence, created_at FROM findings
  WHERE source_id = '002-homelessness-la' AND created_at > now() - interval '1 hour'
  ORDER BY created_at DESC;
```

**Bifrost metrics** (Prometheus on localhost):

```bash
curl -s http://localhost:9090/metrics | grep -E "bifrost_cost|bifrost_request"
```

## Abort

Any of the following. Containers shut down gracefully.

```bash
# In the terminal running `up`:  Ctrl+C

# Or from another terminal:
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml \
  down
```

Bifrost will refuse new LLM calls if `$5` is exceeded — that's a hard
stop independent of aborting manually.

## Trigger an abort if

- Total spend in `llm_usage` approaches $4 without the workflow finishing
- A single agent shows `error` status with circuit-breaker trip in logs
- Any workflow step stuck `running` for > 30 minutes
- Mission agent output has no parseable `{"approved": ...}` JSON block
- Bifrost logs repeated 5xx errors

## Tear down (after success)

```bash
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml \
  down --volumes
```

`--volumes` wipes the local postgres + agent workspace volumes so the
next dry-run starts clean.

## Phase 2 success criteria

Go to Phase 3 (full publisher-enabled cycle) if all of:

- [ ] All 6 steps reach `completed` status
- [ ] Mission agent emitted a parseable `{"approved": true/false}` block
- [ ] At least one finding lands in Supabase `findings` with
      `source_type='seed'`, `source_id='002-homelessness-la'`
- [ ] Total spend is under $3 (leaves headroom for Phase 3 publish path)
- [ ] Agent outputs pass a human sniff-test — on-topic, well-sourced,
      not hallucinated

## Phase 2 no-go signals

Do not proceed to Phase 3 until fixed:

- Circuit breaker tripped on any agent
- Supabase writes silently dropped (finding_ready event but no finding row)
- Mission agent repeatedly returned JSON-invalid output
- Workflow had to retry > 1 step to reach completion
- Total spend >$3 for a single cycle (Phase 3 adds publisher overhead)
