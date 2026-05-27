#!/bin/sh
set -e

CONFIG_TEMPLATE="${CONFIG_TEMPLATE_PATH:-/app/config.template.json}"
# Bifrost v1.5+ loads runtime config from /app/data/config.json by default.
CONFIG_OUTPUT="${CONFIG_PATH:-/app/data/config.json}"

if [ "$BIFROST_RESET_CONFIG" = "true" ]; then
  rm -f /app/data/config.db /app/data/config.db-shm /app/data/config.db-wal
  echo "[bifrost-init] Cleared config store (BIFROST_RESET_CONFIG=true)"
fi

mkdir -p /app/data

if [ -f "$CONFIG_TEMPLATE" ]; then
  sed \
    -e "s|\${ANTHROPIC_API_KEY}|${ANTHROPIC_API_KEY:-}|g" \
    -e "s|\${OPENROUTER_API_KEY}|${OPENROUTER_API_KEY:-}|g" \
    -e "s|\${OPENAI_API_KEY}|${OPENAI_API_KEY:-}|g" \
    -e "s|\${GOOGLE_API_KEY}|${GOOGLE_API_KEY:-}|g" \
    -e "s|\${SEED_VIRTUAL_KEY}|${SEED_VIRTUAL_KEY:-}|g" \
    "$CONFIG_TEMPLATE" > "$CONFIG_OUTPUT"
  echo "[bifrost-init] Config generated from template"
fi

if [ "$BIFROST_BOOTSTRAP" = "true" ] && [ -f /app/bootstrap.sh ]; then
  BIFROST_URL="${BIFROST_URL:-http://127.0.0.1:8080}" \
    OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
    SEED_VIRTUAL_KEY="${SEED_VIRTUAL_KEY}" \
    sh /app/bootstrap.sh &
fi

exec /app/docker-entrypoint.sh /app/main "$@"
