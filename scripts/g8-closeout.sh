#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/g8-closeout.sh \
    [--window-id <id>] \
    [--log-root infra/k8s/cutover-logs]

Behavior:
  1. Inspect the target or latest G8 window directory
  2. Check apply, verify, rollback, and summary artifacts
  3. Generate CLOSEOUT-SUMMARY.md for acceptance writeback
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
else
  latest_dir="$LOG_ROOT/$WINDOW_ID"
fi

if [[ ! -d "$latest_dir" ]]; then
  echo "Window directory does not exist: $latest_dir" >&2
  exit 1
fi

WINDOW_ID="$(basename "$latest_dir")"
APPLY_LOG="$latest_dir/03-apply.log"
VERIFY_LOG="$latest_dir/04-verify.log"
ROLLBACK_LOG="$latest_dir/05-rollback.log"
SUMMARY_LOG="$latest_dir/SUMMARY.md"
STATUS_LOG="$latest_dir/WINDOW-STATUS.md"
CLOSEOUT_MD="$latest_dir/CLOSEOUT-SUMMARY.md"

apply_status="missing"
verify_status="missing"
rollback_status="not_requested"
summary_status="missing"
closeout_status="not_ready"

if [[ -f "$APPLY_LOG" ]]; then
  apply_status="present"
fi

if [[ -f "$VERIFY_LOG" ]]; then
  verify_status="present"
fi

if [[ -f "$ROLLBACK_LOG" ]]; then
  rollback_status="present"
fi

if [[ -f "$SUMMARY_LOG" ]]; then
  summary_status="present"
fi

if [[ "$apply_status" == "present" && "$verify_status" == "present" && "$summary_status" == "present" ]]; then
  closeout_status="ready_for_writeback"
fi

{
  echo "# G8 Closeout Summary"
  echo
  echo "- window_id: \`$WINDOW_ID\`"
  echo "- closeout_status: \`$closeout_status\`"
  echo "- apply_status: \`$apply_status\`"
  echo "- verify_status: \`$verify_status\`"
  echo "- rollback_status: \`$rollback_status\`"
  echo "- summary_status: \`$summary_status\`"
  echo
  echo "## Evidence"
  echo
  [[ -f "$STATUS_LOG" ]] && echo "- [WINDOW-STATUS.md](file://$STATUS_LOG)"
  [[ -f "$APPLY_LOG" ]] && echo "- [03-apply.log](file://$APPLY_LOG)"
  [[ -f "$VERIFY_LOG" ]] && echo "- [04-verify.log](file://$VERIFY_LOG)"
  [[ -f "$ROLLBACK_LOG" ]] && echo "- [05-rollback.log](file://$ROLLBACK_LOG)"
  [[ -f "$SUMMARY_LOG" ]] && echo "- [SUMMARY.md](file://$SUMMARY_LOG)"
  echo
  echo "## Writeback Decision"
  echo
  if [[ "$closeout_status" == "ready_for_writeback" ]]; then
    echo "- This window has enough evidence to update G8 acceptance, resign checklist, weekly RYG board, and resign bundle."
    if [[ "$rollback_status" != "present" ]]; then
      echo "- Rollback evidence is not present in this window. Only mention rollback if it was intentionally omitted by window policy."
    fi
  else
    echo "- Do not write back final success yet. Formal window evidence is incomplete."
    if [[ "$apply_status" != "present" ]]; then
      echo "- Missing apply evidence: \`03-apply.log\`"
    fi
    if [[ "$verify_status" != "present" ]]; then
      echo "- Missing verify evidence: \`04-verify.log\`"
    fi
    if [[ "$summary_status" != "present" ]]; then
      echo "- Missing formal summary: \`SUMMARY.md\`"
    fi
  fi
  echo
  echo "## Next Action"
  echo
  if [[ "$closeout_status" == "ready_for_writeback" ]]; then
    echo "- Update [2026-07-19-g8-cutover-drill-acceptance.md](file://$ROOT_DIR/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md)"
    echo "- Update [V7.2-RESIGN-CHECKLIST.md](file://$ROOT_DIR/V7.2-RESIGN-CHECKLIST.md)"
    echo "- Update [WEEKLY-RYG-STATUS-BOARD.md](file://$ROOT_DIR/WEEKLY-RYG-STATUS-BOARD.md)"
    echo "- Update [2026-07-19-v72-resign-bundle.md](file://$ROOT_DIR/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md)"
  else
    echo "- Complete the formal window first, then rerun \`pnpm g8:closeout\`."
  fi
} > "$CLOSEOUT_MD"

echo "==> G8 closeout summary generated"
echo "window_id=$WINDOW_ID"
echo "closeout_file=$CLOSEOUT_MD"
echo "closeout_status=$closeout_status"
