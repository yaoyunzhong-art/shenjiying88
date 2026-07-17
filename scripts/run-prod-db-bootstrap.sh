#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_DIR="$ROOT_DIR/infra/sql/prod-db"

EXECUTE=false
FROM_STEP=""
TO_STEP=""

STEPS=(
  "foundation-verify.sql"
  "foundation-wave0.sql"
  "foundation-wave1.sql"
  "foundation-verify.sql"
  "foundation-wave2-wave3.sql"
  "foundation-verify.sql"
  "remaining-wave0.sql"
  "phase-a-master-data.sql"
  "remaining-verify.sql"
  "phase-b-regional-portal.sql"
  "remaining-verify.sql"
  "phase-c-member-domain.sql"
  "remaining-verify.sql"
  "phase-d-ops-audit.sql"
  "remaining-verify.sql"
)

usage() {
  cat <<'EOF'
Usage:
  scripts/run-prod-db-bootstrap.sh [--execute] [--from FILE] [--to FILE]

Options:
  --execute    Actually run psql. Default is dry-run and only prints commands.
  --from FILE  Start from the first matching SQL file in the plan.
  --to FILE    Stop after the first matching SQL file in the plan.

Examples:
  scripts/run-prod-db-bootstrap.sh
  scripts/run-prod-db-bootstrap.sh --execute
  scripts/run-prod-db-bootstrap.sh --execute --from phase-a-master-data.sql
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute)
      EXECUTE=true
      shift
      ;;
    --from)
      FROM_STEP="${2:-}"
      shift 2
      ;;
    --to)
      TO_STEP="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$EXECUTE" == true && -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required when using --execute" >&2
  exit 1
fi

PSQL_DATABASE_URL="${DATABASE_URL:-<DATABASE_URL>}"

should_run=false
if [[ -z "$FROM_STEP" ]]; then
  should_run=true
fi

found_from=false
found_to=false

echo "Root dir: $ROOT_DIR"
echo "SQL dir:  $SQL_DIR"
echo "Mode:     $([[ "$EXECUTE" == true ]] && echo execute || echo dry-run)"
echo

for step in "${STEPS[@]}"; do
  if [[ -n "$FROM_STEP" && "$step" == "$FROM_STEP" ]]; then
    should_run=true
    found_from=true
  fi

  if [[ "$should_run" != true ]]; then
    continue
  fi

  sql_file="$SQL_DIR/$step"
  if [[ ! -f "$sql_file" ]]; then
    echo "Missing SQL file: $sql_file" >&2
    exit 1
  fi

  cmd=(psql "$PSQL_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql_file")

  if [[ "$EXECUTE" == true ]]; then
    echo "[EXECUTE] ${cmd[*]}"
    "${cmd[@]}"
  else
    echo "[DRY-RUN] ${cmd[*]}"
  fi

  if [[ -n "$TO_STEP" && "$step" == "$TO_STEP" ]]; then
    found_to=true
    break
  fi
done

if [[ -n "$FROM_STEP" && "$found_from" != true ]]; then
  echo "Start step not found: $FROM_STEP" >&2
  exit 1
fi

if [[ -n "$TO_STEP" && "$found_to" != true ]]; then
  echo "End step not found: $TO_STEP" >&2
  exit 1
fi

echo
echo "Plan complete."
