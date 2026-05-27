# VPS production runbook (stub)

> **Status:** Stub only — requires staging sign-off and [README.md](./README.md) open decisions.

Goal: always-on Seed 002 with publisher enabled, sane cycle cadence, and outputs on GitHub + Supabase.

## Differences from staging

| Item | Staging (dry-run) | Production (stub) |
|------|-------------------|-------------------|
| Compose files | `compose.dry-run.yaml` | `compose.prod.yaml` |
| Publisher | Disabled (`replicas: 0`) | **TODO:** enabled |
| `CYCLE_INTERVAL_MINUTES` | ~1 year (single-shot) | **TODO:** e.g. 60–1440 |
| Bifrost config | `config/dry-run/bifrost.json` | **TODO:** `config/bifrost.json` |
| Agent YAMLs | `config/dry-run/*.yaml` | `config/agents/*.yaml` |
| `GITHUB_TOKEN` | May be empty | **Required** |
| Public ports | Often bound for local dev | **TODO:** bind to loopback only on VPS |

## Prerequisites (additional to staging)

- [ ] `GITHUB_TOKEN` with write access to **TODO:** `GITHUB_REPO` / branch
- [ ] Publisher branch strategy agreed (PR vs direct push)
- [ ] Bifrost budget and model allowlist set for production spend
- [ ] **TODO:** housing `event-processor` — same VPS or separate; image builds in CI
- [ ] Backup plan for `pgdata` volume documented

## Boot command (stub)

```bash
cd /opt/cairn   # TODO: install path
# TODO: verify .env uses production values (see .env.production.example)

bash infrastructure/scripts/preflight-seed-dry-run.sh
# TODO: add preflight-prod.sh when publisher + prod compose are finalized

docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.prod.yaml \
  up -d --build
```

## Firewall / exposure (stub)

**Recommended default (TODO: confirm):**

| Port | Service | Exposure |
|------|---------|----------|
| 22 | SSH | Your IP / bastion only |
| 5432 | Postgres | **Not** public |
| 8080 | Bifrost | **Not** public (or reverse proxy + auth) |
| 18789 | Gateway | **Not** public |

## Operations (stub)

| Task | Command / note |
|------|----------------|
| Logs | `docker compose ... logs -f scheduler agent-research` |
| Workflow DB | `docker compose ... exec db psql -U seedling -d seedling` |
| Prune dup workflows | `bash infrastructure/scripts/clean-seed-workflows.sh` |
| Restart stack | `docker compose ... up -d --force-recreate` |
| Update code | `git pull` + rebuild — **TODO:** maintenance window policy |

## Monitoring (TODO)

- [ ] Disk usage on Docker volumes
- [ ] `llm_usage` / Bifrost cost metrics
- [ ] Supabase finding rate
- [ ] Scheduler “circuit breaker” / failed workflows
- [ ] **TODO:** alerting channel (email, Slack, etc.)

## Not in scope for this stub

- Multi-seed on one host (002 + 001-energy)
- Apex + signal-aggregator stack (see [apex/README.md](../../apex/README.md))
- Kubernetes / Terraform — Compose-only for now
