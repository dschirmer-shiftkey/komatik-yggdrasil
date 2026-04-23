#!/bin/sh
set -e

CONFIG_TEMPLATE="${CONFIG_TEMPLATE_PATH:-/app/config.template.json}"
CONFIG_OUTPUT="${CONFIG_PATH:-/app/config.json}"

if [ -f "$CONFIG_TEMPLATE" ]; then
  sed \
    -e "s|\${ANTHROPIC_API_KEY}|${ANTHROPIC_API_KEY:-}|g" \
    -e "s|\${OPENAI_API_KEY}|${OPENAI_API_KEY:-}|g" \
    -e "s|\${GOOGLE_API_KEY}|${GOOGLE_API_KEY:-}|g" \
    -e "s|\${SEED_VIRTUAL_KEY}|${SEED_VIRTUAL_KEY:-}|g" \
    "$CONFIG_TEMPLATE" > "$CONFIG_OUTPUT"
  echo "[bifrost-init] Config generated from template"
fi

exec bifrost "$@"
