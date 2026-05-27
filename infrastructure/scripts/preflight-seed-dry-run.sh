#!/usr/bin/env bash
# Preflight checks before seed-002 Phase B dry-run boot.
# Usage (from repo root):
#   bash infrastructure/scripts/preflight-seed-dry-run.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/infrastructure/.env"
COMPOSE=(docker compose --project-directory "${REPO_ROOT}/infrastructure"
  -f infrastructure/compose.yaml
  -f seeds/002-homelessness-la/config/compose.override.yaml
  -f seeds/002-homelessness-la/config/compose.dry-run.yaml)

errors=0
warn() { echo "WARN: $*"; }
fail() { echo "ERROR: $*"; errors=$((errors + 1)); }
ok() { echo "OK: $*"; }

read_env_file() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"\(.*\)"$/\1/' || true
}

echo "=== Seed 002 dry-run preflight ==="

if ! command -v docker >/dev/null 2>&1; then
  fail "docker CLI not found"
else
  if ! docker info >/dev/null 2>&1; then
    fail "Docker daemon is not running"
  else
    ok "Docker daemon reachable"
  fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
  fail "Missing ${ENV_FILE} — run: cp infrastructure/.env.example infrastructure/.env"
else
  ok "Found infrastructure/.env"

  POSTGRES_PASSWORD="$(read_env_file POSTGRES_PASSWORD)"
  OPENROUTER_API_KEY="$(read_env_file OPENROUTER_API_KEY)"
  SUPABASE_URL="$(read_env_file SUPABASE_URL)"
  SUPABASE_SERVICE_ROLE_KEY="$(read_env_file SUPABASE_SERVICE_ROLE_KEY)"
  SEED_VIRTUAL_KEY="$(read_env_file SEED_VIRTUAL_KEY)"
  SOURCE_ID="$(read_env_file SOURCE_ID)"
  CATEGORY_ID="$(read_env_file CATEGORY_ID)"
  ROOT_ID="$(read_env_file ROOT_ID)"

  [[ -z "$POSTGRES_PASSWORD" || "$POSTGRES_PASSWORD" == "change-me-to-a-strong-password" ]] \
    && fail "Set POSTGRES_PASSWORD in infrastructure/.env"

  if [[ -z "$OPENROUTER_API_KEY" || "$OPENROUTER_API_KEY" == sk-or-xxx ]]; then
    fail "Set OPENROUTER_API_KEY in infrastructure/.env (dry-run routes LLM via OpenRouter)"
  fi

  [[ -z "$SUPABASE_URL" || "$SUPABASE_URL" == *"xxx"* ]] \
    && fail "Set SUPABASE_URL in infrastructure/.env"

  if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" || "$SUPABASE_SERVICE_ROLE_KEY" == eyJ*your* ]]; then
    fail "Set SUPABASE_SERVICE_ROLE_KEY in infrastructure/.env (save the file if you added it in the editor)"
  fi

  [[ -z "$SEED_VIRTUAL_KEY" ]] && fail "Set SEED_VIRTUAL_KEY in infrastructure/.env"

  if [[ "$SOURCE_ID" != "002-homelessness-la" ]]; then
    warn "SOURCE_ID is '${SOURCE_ID:-}' — expected 002-homelessness-la for this dry-run"
  fi
  if [[ "$CATEGORY_ID" != "housing" ]]; then
    warn "CATEGORY_ID is '${CATEGORY_ID:-}' — expected housing"
  fi
  if [[ "$ROOT_ID" != "basic-needs" ]]; then
    warn "ROOT_ID is '${ROOT_ID:-}' — expected basic-needs"
  fi

  ok "Required env vars present (values not printed)"
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  if "${COMPOSE[@]}" config --quiet >/dev/null 2>&1; then
    ok "Compose stack config validates"
  else
    fail "Compose config failed — run: ${COMPOSE[*]} config"
  fi
fi

if [[ -d "${REPO_ROOT}/infrastructure/scripts/node_modules" ]]; then
  if (cd "${REPO_ROOT}/infrastructure/scripts" && npm run test:vertical-slice:dry >/dev/null 2>&1); then
    ok "Offline vertical-slice smoke test passes"
  else
    warn "Offline vertical-slice smoke failed — run: cd infrastructure/scripts && npm ci && npm run test:vertical-slice:dry"
  fi
else
  warn "Skip offline smoke (run: cd infrastructure/scripts && npm ci first)"
fi

echo ""
if [[ $errors -gt 0 ]]; then
  echo "Preflight FAILED ($errors error(s)). Fix the items above before booting."
  exit 1
fi

echo "Preflight passed. Boot with:"
echo "  docker compose --project-directory infrastructure \\"
echo "    -f infrastructure/compose.yaml \\"
echo "    -f seeds/002-homelessness-la/config/compose.override.yaml \\"
echo "    -f seeds/002-homelessness-la/config/compose.dry-run.yaml up"
exit 0
