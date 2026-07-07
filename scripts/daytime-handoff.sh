#!/bin/bash
# daytime-handoff.sh · 白天交接报告 (7:00 自动输出)
#
# 用途: 7:00 用户起床时,自动输出夜间成果 + 白天任务清单
# 调用: 由 cron 7:00 触发
#
# 设计: 用户起床第一眼看到的状态报告,3 分钟内可理解全局

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

NOW=$(date '+%Y-%m-%d %H:%M CST')
NIGHTLY_DATE=$(date '+%Y-%m-%d')
HANDOFF_FILE="$PROJECT_ROOT/docs/monitoring/handoff-${NIGHTLY_DATE}.md"
NIGHTLY_LOG_DIR="$PROJECT_ROOT/docs/monitoring/nightly/$NIGHTLY_DATE"

echo "═══════════════════════════════════════════════════════"
echo "  🌅 神机营 SaaS · 日间 Handoff 报告"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "⏰ 时间: $NOW"
echo "📄 完整报告: $HANDOFF_FILE"
echo ""

# ─── 夜间成果摘要 ───────────────────────────────────────────────────────

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧠 夜间成果 (0:00-7:00 自动)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 知识库变化
if [[ -f "$NIGHTLY_LOG_DIR/03-stats.log" ]]; then
  echo "📚 知识库:"
  tail -5 "$NIGHTLY_LOG_DIR/03-stats.log" 2>/dev/null || echo "  (stats 缺失)"
  echo ""
fi

# 测试结果
if [[ -f "$NIGHTLY_LOG_DIR/05-vitest.log" ]]; then
  PASS=$(grep -oE "[0-9]+ passed" "$NIGHTLY_LOG_DIR/05-vitest.log" | tail -1 || echo "?")
  FAIL=$(grep -oE "[0-9]+ failed" "$NIGHTLY_LOG_DIR/05-vitest.log" | tail -1 || echo "?")
  COVERAGE=$(grep -oE "[0-9.]+%" "$NIGHTLY_LOG_DIR/05-coverage.json" 2>/dev/null | tail -1 || echo "?")
  echo "🧪 测试: $PASS / fail=$FAIL / 覆盖率=$COVERAGE"
fi

# TSC 结果
TSC_API=$(grep -c "error TS" "$NIGHTLY_LOG_DIR/06-tsc-api.log" 2>/dev/null | head -1 || echo "?")
TSC_ADMIN=$(grep -c "error TS" "$NIGHTLY_LOG_DIR/07-tsc-admin.log" 2>/dev/null | head -1 || echo "?")
echo "📘 TSC: api=$TSC_API errors / admin-web=$TSC_ADMIN errors"

# Lint 结果
LINT_API=$(grep -c "error" "$NIGHTLY_LOG_DIR/08-lint-api.log" 2>/dev/null | head -1 || echo "0")
echo "🔍 Lint: api=$LINT_API errors"
echo ""

# ─── 关键产出 ───────────────────────────────────────────────────────────

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 关键产出"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 最新 commits
echo "📝 昨夜 commits:"
git log --since="midnight" --oneline | head -10 || echo "  (无)"
echo ""

# Git status
echo "🔄 Git 状态:"
git status --short | head -10 || echo "  (clean)"
echo ""

# RFC 状态
echo "🗳️ RFC 状态:"
if [[ -f "$NIGHTLY_LOG_DIR/14-rfc-monitor.log" ]]; then
  tail -10 "$NIGHTLY_LOG_DIR/14-rfc-monitor.log" 2>/dev/null || echo "  (无)"
fi
echo ""

# ─── 白天任务 ───────────────────────────────────────────────────────────

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ☀️ 白天任务建议 (7:00-23:00)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ -f "$PROJECT_ROOT/docs/monitoring/daytime-tasks.md" ]]; then
  head -30 "$PROJECT_ROOT/docs/monitoring/daytime-tasks.md"
else
  echo "📌 默认白天节奏:"
  echo "  07:00-08:00 早晨 review + standup"
  echo "  08:00-12:00 上午开发 (T1-T4 主任务)"
  echo "  12:00-13:00 午休"
  echo "  13:00-18:00 下午开发 (T5-T10 + Approver review)"
  echo "  18:00-19:00 晚餐"
  echo "  19:00-22:00 晚开发 (T11-T13 + Champion 签字)"
  echo "  22:00-23:00 复盘 + 明日计划"
fi
echo ""

# ─── 待用户决策 ─────────────────────────────────────────────────────────

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ⚠️  需要用户决策"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 RFC 待用户直批
if [[ -f "rfcs/voting/R7-approver-appointment.md" ]] && [[ ! -f "docs/operations/approver-appointment-certificate.md" ]]; then
  echo "  🟡 R7 (Approver 招募): 等待用户直批 8 checkbox"
fi
if [[ -f "rfcs/voting/R8-champion-appointment.md" ]] && [[ ! -f "docs/operations/champion-appointment-certificate.md" ]]; then
  echo "  🟡 R8 (Champion 任命): 等待用户直批"
fi

# 测试失败
if [[ "$FAIL" != "0" ]] && [[ -n "$FAIL" ]]; then
  echo "  🔴 测试失败: $FAIL → 优先修复"
fi

# TSC 错误
if [[ "$TSC_API" != "0" ]] && [[ -n "$TSC_API" ]]; then
  echo "  🔴 TSC api errors: $TSC_API → 优先修复"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🚀 准备开始今日开发"
echo "═══════════════════════════════════════════════════════"