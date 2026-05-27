#!/bin/sh
# Optional post-start bootstrap for Bifrost v1.5+ (config_store + API registration).
# Runs in background from entrypoint when BIFROST_BOOTSTRAP=true.

set -e

BIFROST_URL="${BIFROST_URL:-http://127.0.0.1:8080}"
MAX_WAIT=60

wait_for_health() {
  i=0
  while [ "$i" -lt "$MAX_WAIT" ]; do
    if wget -qO- "${BIFROST_URL}/health" >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done
  echo "[bifrost-bootstrap] Timed out waiting for ${BIFROST_URL}/health"
  return 1
}

delete_provider() {
  provider="$1"
  wget -qO- --method=DELETE "${BIFROST_URL}/api/providers/${provider}" >/dev/null 2>&1 || true
}

register_openrouter() {
  if [ -z "${OPENROUTER_API_KEY}" ]; then
    echo "[bifrost-bootstrap] OPENROUTER_API_KEY not set — skipping openrouter registration"
    return 1
  fi

  delete_provider anthropic
  delete_provider openai
  delete_provider openrouter

  payload=$(cat <<EOF
{
  "provider": "openrouter",
  "keys": [
    {
      "name": "openrouter-dry-run",
      "value": "${OPENROUTER_API_KEY}",
      "models": ["*"],
      "weight": 1.0
    }
  ],
  "concurrency_and_buffer_size": { "concurrency": 100, "buffer_size": 500 }
}
EOF
)

  wget -qO- \
    --header="Content-Type: application/json" \
    --post-data="$payload" \
    "${BIFROST_URL}/api/providers" >/dev/null 2>&1 || true

  # Provider-level keys (PUT is more reliable than POST on some builds).
  wget -qO- \
    --header="Content-Type: application/json" \
    --post-data="$payload" \
    "${BIFROST_URL}/api/providers/openrouter" >/dev/null 2>&1 || true
}

ensure_virtual_key() {
  if [ -z "${SEED_VIRTUAL_KEY}" ]; then
    echo "[bifrost-bootstrap] SEED_VIRTUAL_KEY not set — skipping virtual key"
    return 0
  fi

  existing=$(wget -qO- "${BIFROST_URL}/api/governance/virtual-keys" 2>/dev/null || echo "")
  case "$existing" in
    *"${SEED_VIRTUAL_KEY}"*) return 0 ;;
  esac

  payload=$(cat <<EOF
{
  "name": "seed-dry-run",
  "key": "${SEED_VIRTUAL_KEY}",
  "provider_configs": [
    {
      "provider": "openrouter",
      "allowed_models": ["*"]
    }
  ]
}
EOF
)

  wget -qO- \
    --header="Content-Type: application/json" \
    --post-data="$payload" \
    "${BIFROST_URL}/api/governance/virtual-keys" >/dev/null 2>&1 || true
}

wait_for_health
register_openrouter
ensure_virtual_key
echo "[bifrost-bootstrap] Bootstrap complete"
