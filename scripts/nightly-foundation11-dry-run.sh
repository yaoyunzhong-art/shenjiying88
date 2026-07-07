#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

TARGET_DATE="${1:-$(date '+%Y-%m-%d')}"
LOG_DIR="$PROJECT_ROOT/docs/monitoring/nightly/$TARGET_DATE"
HANDOFF_FILE="$PROJECT_ROOT/docs/monitoring/handoff-${TARGET_DATE}-dry-run.md"
HEALTH_REPORT="$LOG_DIR/00-foundation11-health.md"

mkdir -p "$LOG_DIR"

echo "=== Foundation11 Nightly Dry Run ==="
echo "date: $TARGET_DATE"
echo "log_dir: $LOG_DIR"
echo ""

AUTOMATION_HEALTH_REPORT="$HEALTH_REPORT" bash "$SCRIPT_DIR/foundation11-automation-healthcheck.sh" nightly "$TARGET_DATE"

python3 scripts/auto-standup.py > "$LOG_DIR/13-standup.log" 2>&1
python3 scripts/rfc-monitor.py > "$LOG_DIR/14-rfc-monitor.log" 2>&1
python3 scripts/phase-progress-report.py > "$LOG_DIR/15-progress.log" 2>&1
python3 scripts/champion-decision-helper.py > "$LOG_DIR/16-champion-sim.log" 2>&1
python3 scripts/ai-lesson-applicator.py > "$LOG_DIR/17-ai-lessons.log" 2>&1
python3 apps/api/src/modules/ai-review/llm/cost-report.py > "$LOG_DIR/10-llm-cost.log" 2>&1

python3 scripts/nightly-summary.py "$TARGET_DATE" > "$HANDOFF_FILE"
python3 scripts/daytime-task-planner.py "$TARGET_DATE" >> "$HANDOFF_FILE"

echo "[$TARGET_DATE dry-run] Foundation11 nightly rehearsal completed" > "$LOG_DIR/18-notify.log"

echo "✅ handoff: $HANDOFF_FILE"
echo "✅ logs:"
ls "$LOG_DIR" | sed 's/^/ - /'
