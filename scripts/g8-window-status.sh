#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/g8-window-status.sh \
    [--window-id <id>] \
    [--log-root infra/k8s/cutover-logs]

Behavior:
  1. Inspect the target or latest G8 window directory
  2. Detect readiness, apply, verify, rollback, and summary artifacts
  3. Generate WINDOW-STATUS.md inside that window directory
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

WINDOW_ID=""
LOG_ROOT="$ROOT_DIR/infra/k8s/cutover-logs"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --window-id)
      WINDOW_ID="${2:-}"
      shift 2
      ;;
    --log-root)
      LOG_ROOT="${2:-}"
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

if [[ ! -d "$LOG_ROOT" ]]; then
  echo "Log root does not exist: $LOG_ROOT" >&2
  exit 1
fi

if [[ -z "$WINDOW_ID" ]]; then
  latest_dir="$(find "$LOG_ROOT" -maxdepth 1 -type d -name 'formal-window-*' | sort | tail -n 1)"
  if [[ -z "$latest_dir" ]]; then
    echo "No formal-window directories found under $LOG_ROOT" >&2
    exit 1
  fi
  WINDOW_ID="$(basename "$latest_dir")"
else
  latest_dir="$LOG_ROOT/$WINDOW_ID"
fi

if [[ ! -d "$latest_dir" ]]; then
  echo "Window directory does not exist: $latest_dir" >&2
  exit 1
fi

FORMAL_READY_LOG="$latest_dir/00-formal-ready.log"
READINESS_BLOCKERS="$latest_dir/READINESS-BLOCKERS.md"
RECHECK_SUMMARY="$latest_dir/RECHECK-SUMMARY.md"
PREFLIGHT_LOG="$latest_dir/01-preflight.log"
SERVER_DRY_RUN_LOG="$latest_dir/02-server-dry-run.log"
APPLY_LOG="$latest_dir/03-apply.log"
VERIFY_LOG="$latest_dir/04-verify.log"
ROLLBACK_LOG="$latest_dir/05-rollback.log"
SUMMARY_LOG="$latest_dir/SUMMARY.md"
STATUS_MD="$latest_dir/WINDOW-STATUS.md"

readiness_status="unknown"
formal_status="not_started"
verify_status="not_started"
rollback_status="not_requested"
overall_status="unknown"

if [[ -f "$READINESS_BLOCKERS" ]]; then
  readiness_status="blocked"
elif [[ -f "$FORMAL_READY_LOG" ]]; then
  readiness_status="passed"
fi

if [[ -f "$APPLY_LOG" ]]; then
  formal_status="applied"
elif [[ -f "$SERVER_DRY_RUN_LOG" ]]; then
  formal_status="dry_run_only"
fi

if [[ -f "$VERIFY_LOG" ]]; then
  verify_status="present"
fi

if [[ -f "$ROLLBACK_LOG" ]]; then
  rollback_status="present"
fi

if [[ "$readiness_status" == "blocked" ]]; then
  overall_status="blocked"
elif [[ "$formal_status" == "applied" && "$verify_status" == "present" ]]; then
  overall_status="formal_executed"
elif [[ "$readiness_status" == "passed" ]]; then
  overall_status="ready_for_formal"
elif [[ "$formal_status" == "dry_run_only" ]]; then
  overall_status="evidence_only"
fi

{
  echo "# G8 Window Status"
  echo
  echo "- window_id: \`$WINDOW_ID\`"
  echo "- overall_status: \`$overall_status\`"
  echo "- readiness_status: \`$readiness_status\`"
  echo "- formal_status: \`$formal_status\`"
  echo "- verify_status: \`$verify_status\`"
  echo "- rollback_status: \`$rollback_status\`"
  echo
  echo "## Artifacts"
  echo
  [[ -f "$FORMAL_READY_LOG" ]] && echo "- [00-formal-ready.log](file://$FORMAL_READY_LOG)"
  [[ -f "$READINESS_BLOCKERS" ]] && echo "- [READINESS-BLOCKERS.md](file://$READINESS_BLOCKERS)"
  [[ -f "$RECHECK_SUMMARY" ]] && echo "- [RECHECK-SUMMARY.md](file://$RECHECK_SUMMARY)"
  [[ -f "$PREFLIGHT_LOG" ]] && echo "- [01-preflight.log](file://$PREFLIGHT_LOG)"
  [[ -f "$SERVER_DRY_RUN_LOG" ]] && echo "- [02-server-dry-run.log](file://$SERVER_DRY_RUN_LOG)"
  [[ -f "$APPLY_LOG" ]] && echo "- [03-apply.log](file://$APPLY_LOG)"
  [[ -f "$VERIFY_LOG" ]] && echo "- [04-verify.log](file://$VERIFY_LOG)"
  [[ -f "$ROLLBACK_LOG" ]] && echo "- [05-rollback.log](file://$ROLLBACK_LOG)"
  [[ -f "$SUMMARY_LOG" ]] && echo "- [SUMMARY.md](file://$SUMMARY_LOG)"
  echo
  echo "## Next Action"
  echo
  if [[ "$overall_status" == "blocked" ]]; then
    echo "- Window is still blocked. Resolve blockers first, then rerun \`pnpm g8:gate\` or at least \`pnpm g8:recheck\`."
  elif [[ "$overall_status" == "ready_for_formal" ]]; then
    echo "- Readiness is green. Move to [G8-SUCCESS-CHECKLIST.md](file://$latest_dir/G8-SUCCESS-CHECKLIST.md) and run \`pnpm g8:formal\`."
  elif [[ "$overall_status" == "formal_executed" ]]; then
    echo "- Formal window evidence exists. Review apply/verify/rollback logs and complete closeout."
  elif [[ "$overall_status" == "evidence_only" ]]; then
    echo "- Only non-mutating evidence exists. Use \`pnpm g8:formal\` during the real window, or rerun \`pnpm g8:gate\` if you want a fresh full check."
  else
    echo "- State is incomplete. Inspect this window directory manually."
  fi
} > "$STATUS_MD"

echo "==> G8 window status generated"
echo "window_id=$WINDOW_ID"
echo "status_file=$STATUS_MD"
echo "overall_status=$overall_status"
