# Seed 001 Dry-Run Runbook

> First live research cycle for seed 001 (Energy), publisher disabled, tight
> budget cap. Mirrors the phase-2 dry-run pattern from seed-002.

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

1. Copy and fill in the `.env` file:
   ```bash
   cp infrastructure/.env.example infrastructure/.env
   # Edit to set:
   #   ANTHROPIC_API_KEY=sk-ant-xxx
   #   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   #   POSTGRES_PASSWORD=some-strong-password
   #   SEED_VIRTUAL_KEY=svk-energy-001-dryrun
   #   SOURCE_TYPE=seed
   #   SOURCE_ID=001-energy
   #   CATEGORY_ID=energy
   #   ROOT_ID=basic-needs
   ```

2. Verify the two required keys:
   ```bash
   grep -E "^(ANTHROPIC|SUPABASE_SERVICE)" infrastructure/.env
   ```

## Boot

From repo root:

```bash
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/001-energy/config/compose.override.yaml \
  -f seeds/001-energy/config/compose.dry-run.yaml \
  up
```

## Verifying a successful cycle

After boot, watch for:
1. `seed-scheduler: Running first cycle...` in logs
2. Each agent container logging task execution
3. Supabase `findings` table gains at least one row from this seed
4. `seed-gateway: health OK` continues throughout

## After the dry-run

- Review findings in Supabase: check `findings` table for `source_id='001-energy'`
- Check token usage in Bifrost Prometheus metrics (port 9090 on the bifrost container)
- If everything looks good, create a task for the coordinator to:
  1. Merge the container image pin + bifrost fix PRs
  2. Provision a VPS for production Seed 001 deployment
  3. Set up production `.env` with full API keys and $50/month budget

## Blockers addressed by this dry-run pattern

- **No VPS required** — runs on the NUC or any Docker host
- **No OpenAI/Google keys** — Anthropic only during dry-run
- **No GitHub PAT** — publisher is disabled
- **Cost capped at $5** — safe for experimentation
