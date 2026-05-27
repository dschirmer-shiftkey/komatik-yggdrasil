#!/usr/bin/env bash
# Merge Komatik platform secrets into infrastructure/.env for Cairn local boot.
# Does NOT copy Komatik SUPABASE_* — Cairn uses its own world-tree project.
#
# Usage (from repo root):
#   bash infrastructure/scripts/bootstrap-env-from-komatik.sh [path-to-.env.local]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
KOMATIK_ENV="${1:-${KOMATIK_WEB_ENV:-$REPO_ROOT/../komatik/platform/web/.env.local}}"
CAIRN_ENV="${REPO_ROOT}/infrastructure/.env"
EXAMPLE="${REPO_ROOT}/infrastructure/.env.example"

read_env() {
  local key="$1"
  grep -E "^${key}=" "$KOMATIK_ENV" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"\(.*\)"$/\1/' || true
}

if [[ ! -f "$KOMATIK_ENV" ]]; then
  echo "ERROR: Komatik env not found at $KOMATIK_ENV"
  exit 1
fi

if [[ ! -f "$CAIRN_ENV" ]]; then
  cp "$EXAMPLE" "$CAIRN_ENV"
  echo "Created $CAIRN_ENV from .env.example"
fi

upsert() {
  local key="$1" value="$2"
  [[ -z "$value" ]] && return 0
  local tmp
  tmp="$(mktemp)"
  grep -v "^${key}=" "$CAIRN_ENV" >"$tmp" 2>/dev/null || true
  printf '%s=%s\n' "$key" "$value" >>"$tmp"
  mv "$tmp" "$CAIRN_ENV"
}

ANTHROPIC_API_KEY="$(read_env ANTHROPIC_API_KEY)"
OPENROUTER_API_KEY="$(read_env OPENROUTER_API_KEY)"
OPENAI_API_KEY="$(read_env OPENAI_API_KEY)"
GOOGLE_API_KEY="$(read_env GOOGLE_API_KEY)"
GEMINI_API_KEY="$(read_env GEMINI_API_KEY)"
GITHUB_TOKEN="$(read_env GITHUB_TOKEN)"

upsert "OPENROUTER_API_KEY" "${OPENROUTER_API_KEY:-}"
if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "WARN: OPENROUTER_API_KEY unset in Komatik env — dry-run needs it in infrastructure/.env"
fi
upsert "ANTHROPIC_API_KEY" "${ANTHROPIC_API_KEY:-}"

upsert "OPENAI_API_KEY" "${OPENAI_API_KEY:-}"
upsert "GOOGLE_API_KEY" "${GOOGLE_API_KEY:-${GEMINI_API_KEY:-}}"
upsert "GITHUB_TOKEN" "${GITHUB_TOKEN:-}"

# Strip any Komatik platform Supabase vars if present
tmp="$(mktemp)"
grep -v '^SUPABASE_URL=' "$CAIRN_ENV" | grep -v '^SUPABASE_SERVICE_ROLE_KEY=' >"$tmp" || true
mv "$tmp" "$CAIRN_ENV"

# Cairn project (set after provisioning — override via second arg or env)
CAIRN_REF="${CAIRN_SUPABASE_REF:-aiszfddbzrhksqkaxmur}"
upsert "SUPABASE_URL" "https://${CAIRN_REF}.supabase.co"

echo ""
echo "Bootstrap done (Komatik LLM/GitHub keys merged where present)."
echo "Set Cairn service role in infrastructure/.env:"
echo "  SUPABASE_SERVICE_ROLE_KEY=<Project Settings → API → service_role>"
echo "  Dashboard: https://supabase.com/dashboard/project/${CAIRN_REF}/settings/api"
echo ""
echo "Schema should already be applied (001_cairn_world_tree_schema)."
echo "Then: bash infrastructure/scripts/preflight-seed-dry-run.sh"
