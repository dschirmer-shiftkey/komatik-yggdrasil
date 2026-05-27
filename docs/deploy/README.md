# Cairn deployment stubs

Deployment docs and config stubs for work that is not ready to execute yet.
Fill in the **Open decisions** sections before running anything on a VPS.

## What “production” means in this repo

| Surface | Technology | Doc |
|---------|------------|-----|
| Public marketing / charter site | GitHub Pages → `cairn.komatik.xyz` | [dns-and-public-surfaces.md](./dns-and-public-surfaces.md) |
| Seed agent stack (Seed 002) | Docker Compose on a VPS | [vps-staging.md](./vps-staging.md), [vps-production.md](./vps-production.md) |
| Shared world tree | Supabase (Cairn project) | [../supabase/migrations/README.md](../../infrastructure/supabase/migrations/README.md) |

## Open decisions (fill in before VPS work)

| # | Question | Your answer | Notes |
|---|----------|-------------|-------|
| 1 | VPS provider / region | _TBD_ | e.g. Hetzner, DO, Linode |
| 2 | Host size (RAM / vCPU) | _TBD_ | README suggests ~4 GB RAM, 3–4 vCPU per seed |
| 3 | Staging vs production: one host or two? | _TBD_ | Dry-run on staging first is recommended |
| 4 | Expose Bifrost / gateway / Postgres to the internet? | _TBD_ | Default stub: **no** public ports except SSH |
| 5 | `GITHUB_BRANCH` for publisher output | _TBD_ | `main`, `dev`, or dedicated branch |
| 6 | Cycle interval on production VPS | _TBD_ | e.g. 60–1440 minutes |
| 7 | Monthly LLM budget cap (Bifrost) | _TBD_ | See seed `config/bifrost.json` vs dry-run |
| 8 | DNS for seed status / API (if any) | _TBD_ | Optional subdomain; site stays on Pages |
| 9 | Run housing `event-processor` on same VPS? | _TBD_ | Needs Dockerfile + compose wiring |
| 10 | Backup strategy for local Postgres volume | _TBD_ | `pgdata` volume on host |

## Config stubs (repo)

| Path | Purpose |
|------|---------|
| [seeds/002-homelessness-la/config/compose.prod.yaml](../../seeds/002-homelessness-la/config/compose.prod.yaml) | Production compose override (TODOs; not wired until decisions made) |
| [infrastructure/.env.production.example](../../infrastructure/.env.production.example) | Env template for VPS (copy to `.env` on server) |
| [infrastructure/event-processor/Dockerfile](../../infrastructure/event-processor/Dockerfile) | Build stub for category/root processors |
| [infrastructure/deploy/systemd/cairn-seed-002.service.example](../../infrastructure/deploy/systemd/cairn-seed-002.service.example) | Optional boot-on-reboot unit |

## Boot profiles (reference)

**Local / Phase 2 dry-run** (current default):

```bash
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml up -d
```

**VPS staging** (stub — see [vps-staging.md](./vps-staging.md)):

Same as dry-run until `compose.prod.yaml` is finalized.

**VPS production** (stub — see [vps-production.md](./vps-production.md)):

```bash
# TODO: confirm file list after open decisions
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.prod.yaml up -d
```

## Related runbooks

- Seed 002 dry-run: [seeds/002-homelessness-la/config/dry-run/README.md](../../seeds/002-homelessness-la/config/dry-run/README.md)
- Preflight: `bash infrastructure/scripts/preflight-seed-dry-run.sh`
- Workflow cleanup: `bash infrastructure/scripts/clean-seed-workflows.sh`
