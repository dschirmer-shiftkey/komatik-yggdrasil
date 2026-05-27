# VPS staging runbook (stub)

> **Status:** Stub only — do not treat as executable until [README.md](./README.md) open decisions are filled in.

Goal: prove the Seed 002 stack runs on a remote host the same way it does on your laptop (dry-run profile: publisher off, long cycle interval).

## Prerequisites checklist

- [ ] VPS provisioned (see open decision #1–#2 in [README.md](./README.md))
- [ ] SSH access and non-root deploy user (optional but recommended)
- [ ] Docker Engine + Compose plugin installed on the host
- [ ] Firewall: SSH allowed; **TODO:** confirm whether any other ports are public
- [ ] Repo cloned at `main` (or tagged release)
- [ ] `infrastructure/.env` created from [.env.production.example](../../infrastructure/.env.production.example) — **never commit**
- [ ] Supabase Cairn project reachable from VPS egress
- [ ] OpenRouter key valid from VPS (some networks block outbound API calls)

## Suggested host layout

```
/opt/cairn/                    # git clone root
  infrastructure/.env          # secrets (chmod 600)
  ... compose files unchanged from repo
```

## Install commands (stub)

```bash
# TODO: pin OS version (e.g. Ubuntu 24.04)
# sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# TODO: deploy user + docker group
# sudo usermod -aG docker "$USER"

git clone https://github.com/KomatikAI/cairn.git /opt/cairn
cd /opt/cairn
git checkout main   # TODO: tag pin?

cp infrastructure/.env.production.example infrastructure/.env
# TODO: edit .env — all required keys

bash infrastructure/scripts/preflight-seed-dry-run.sh
```

## Boot (staging = dry-run profile)

```bash
cd /opt/cairn
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml \
  up -d --build
```

## Verification (stub)

- [ ] `curl -s http://127.0.0.1:18789/health` → 200 (from SSH session on host)
- [ ] `curl -s http://127.0.0.1:8080/health` → 200
- [ ] Bifrost chat smoke with `SEED_VIRTUAL_KEY` (see dry-run README)
- [ ] One workflow reaches `completed` with 6/6 steps
- [ ] At least one finding in Supabase for `source_id=002-homelessness-la`
- [ ] `bash infrastructure/scripts/clean-seed-workflows.sh` if duplicate workflows appear

## Optional: boot on reboot

See [systemd example](../../infrastructure/deploy/systemd/cairn-seed-002.service.example) — adjust paths and compose file list before enabling.

## Exit criteria for staging

When these pass, consider moving to [vps-production.md](./vps-production.md):

- [ ] Stack survives host reboot (manual or systemd)
- [ ] No duplicate workflow rows after scheduler restart
- [ ] LLM spend within expected band for one cycle
- [ ] Mission agent returns parseable `{"approved": ...}` JSON

## Rollback

```bash
docker compose --project-directory infrastructure \
  -f infrastructure/compose.yaml \
  -f seeds/002-homelessness-la/config/compose.override.yaml \
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml \
  down
# TODO: document whether to keep volumes for debugging
```
