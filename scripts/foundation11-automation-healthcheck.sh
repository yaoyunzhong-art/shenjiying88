#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGE="${1:-general}"
DATE="${2:-$(date '+%Y-%m-%d')}"
REPORT_FILE="${AUTOMATION_HEALTH_REPORT:-$PROJECT_ROOT/docs/monitoring/automation-health-${DATE}-${STAGE}.md}"

mkdir -p "$(dirname "$REPORT_FILE")"

FAILURES=()
WARNINGS=()
PASSES=()

add_failure() {
  FAILURES+=("$1")
}

add_warning() {
  WARNINGS+=("$1")
}

add_pass() {
  PASSES+=("$1")
}

check_file_exists() {
  local file_path="$1"
  local label="$2"
  if [[ -f "$PROJECT_ROOT/$file_path" ]]; then
    add_pass "$label"
  else
    add_failure "$label 缺失: $file_path"
  fi
}

check_contains() {
  local file_path="$1"
  local pattern="$2"
  local label="$3"
  if grep -q "$pattern" "$PROJECT_ROOT/$file_path" 2>/dev/null; then
    add_warning "$label 命中过期标记: $pattern"
  else
    add_pass "$label 未发现过期标记"
  fi
}

check_required_command() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    add_pass "依赖命令可用: $cmd"
  else
    add_failure "依赖命令缺失: $cmd"
  fi
}

check_required_command git
check_required_command pnpm
check_required_command python3

check_file_exists "scripts/rfc-monitor.py" "RFC 监控脚本"
check_file_exists "scripts/foundation11-commit.sh" "基础开发11提交流程脚本"
check_file_exists "scripts/race-safe-commit.sh" "竞态安全提交脚本"

check_contains "scripts/morning-dev-jobs.sh" "Pulse-68" "上午自动开发脚本"
check_contains "scripts/morning-dev-jobs.sh" "2026-06-26" "上午自动开发脚本"
check_contains "scripts/afternoon-dev-jobs.sh" "Phase-17" "下午自动开发脚本"

if [[ "$STAGE" == "nightly" ]]; then
  check_file_exists "scripts/auto-standup.py" "夜间 standup 生成脚本"
  check_file_exists "scripts/phase-progress-report.py" "夜间阶段进度报告脚本"
  check_file_exists "scripts/champion-decision-helper.py" "夜间 champion 决策脚本"
  check_file_exists "scripts/ai-lesson-applicator.py" "夜间 lessons 应用脚本"
  check_file_exists "scripts/nightly-summary.py" "夜间总结脚本"
  check_file_exists "scripts/daytime-task-planner.py" "白天任务规划脚本"
  check_file_exists "apps/api/src/modules/ai-review/llm/cost-report.py" "LLM 成本报告脚本"
fi

if [[ "$STAGE" == "morning" ]]; then
  local_handoff="$PROJECT_ROOT/docs/monitoring/handoff-${DATE}.md"
  if [[ -f "$local_handoff" ]]; then
    add_pass "已存在夜间 handoff: docs/monitoring/handoff-${DATE}.md"
  else
    add_warning "缺少夜间 handoff: docs/monitoring/handoff-${DATE}.md"
  fi
fi

{
  echo "# Foundation11 自动化健康检查"
  echo
  echo "- 日期: $DATE"
  echo "- 阶段: $STAGE"
  echo "- 仓库: $PROJECT_ROOT"
  echo
  echo "## 通过项"
  if [[ ${#PASSES[@]} -eq 0 ]]; then
    echo "- 无"
  else
    for item in "${PASSES[@]}"; do
      echo "- $item"
    done
  fi
  echo
  echo "## 警告项"
  if [[ ${#WARNINGS[@]} -eq 0 ]]; then
    echo "- 无"
  else
    for item in "${WARNINGS[@]}"; do
      echo "- $item"
    done
  fi
  echo
  echo "## 阻塞项"
  if [[ ${#FAILURES[@]} -eq 0 ]]; then
    echo "- 无"
  else
    for item in "${FAILURES[@]}"; do
      echo "- $item"
    done
  fi
} > "$REPORT_FILE"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  exit 2
fi

exit 0
