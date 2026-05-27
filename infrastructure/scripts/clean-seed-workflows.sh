#!/usr/bin/env bash
# Remove duplicate/orphan seed workflows from local Postgres.
# Keeps one workflow by default (newest completed, else newest).
#
# Usage:
#   bash infrastructure/scripts/clean-seed-workflows.sh
#   bash infrastructure/scripts/clean-seed-workflows.sh --keep-id <uuid>
#   bash infrastructure/scripts/clean-seed-workflows.sh --dry-run

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
KEEP_ID=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep-id) KEEP_ID="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--keep-id <uuid>] [--dry-run]"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

COMPOSE=(docker compose --project-directory "${ROOT}/infrastructure"
  -f "${ROOT}/infrastructure/compose.yaml")

psql_exec() {
  "${COMPOSE[@]}" exec -T db psql -U seedling -d seedling -v ON_ERROR_STOP=1 "$@"
}

if [[ -z "$KEEP_ID" ]]; then
  KEEP_ID="$(psql_exec -t -A -c "
    SELECT id FROM workflows
    ORDER BY (status = 'completed') DESC, created_at DESC
    LIMIT 1;
  " | tr -d '[:space:]')"
fi

if [[ -z "$KEEP_ID" ]]; then
  echo "No workflows in database."
  exit 0
fi

echo "Keeping workflow: ${KEEP_ID}"
psql_exec -c "SELECT id, name, status, created_at FROM workflows ORDER BY created_at;"

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run — would delete all workflows except ${KEEP_ID} (steps cascade)."
  exit 0
fi

psql_exec -c "DELETE FROM workflows WHERE id <> '${KEEP_ID}'::uuid;"
echo "Done. Remaining workflows:"
psql_exec -c "SELECT id, name, status, created_at FROM workflows ORDER BY created_at;"
