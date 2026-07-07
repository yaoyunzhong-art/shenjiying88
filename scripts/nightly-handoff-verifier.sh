#!/bin/bash
# nightly-handoff-verifier.sh · 龙虾哥昨夜 handoff 存在性验证
#
# 用法:
#   bash scripts/nightly-handoff-verifier.sh [日期]
#   # 默认日期为昨天
#
# 出口码:
#   0 = handoff 存在且正常
#   1 = handoff 缺失（昨夜未完成）
#   2 = 参数错误
#
# 依赖: 无外部依赖，纯文件检查
#
# 调用场景:
#   - morning-dev-jobs.sh 开头发起检查
#   - 或手动: bash scripts/nightly-handoff-verifier.sh 2026-07-02

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 默认：检查昨天
TARGET_DATE="${1:-$(date -v-1d '+%Y-%m-%d')}"

if ! [[ "$TARGET_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "❌ 日期格式错误，应为 YYYY-MM-DD，实际: $TARGET_DATE" >&2
  exit 2
fi

HANDOFF_FILE="$PROJECT_ROOT/docs/monitoring/handoff-${TARGET_DATE}.md"
HEALTH_REPORT_DIR="$PROJECT_ROOT/docs/monitoring/nightly/${TARGET_DATE}"

echo "=== Foundation11 昨夜 handoff 验证 ==="
echo "目标日期: $TARGET_DATE"
echo "handoff:  $HANDOFF_FILE"
echo "health dir: $HEALTH_REPORT_DIR"
echo ""

if [ -f "$HANDOFF_FILE" ]; then
  FILE_SIZE=$(wc -c < "$HANDOFF_FILE")
  echo "✅ handoff 存在 (${FILE_SIZE} bytes)"

  # 检查关键段落
  if grep -q "## 自动化健康" "$HANDOFF_FILE"; then
    echo "✅ handoff 包含自动化健康段落"
  else
    echo "⚠️  handoff 缺少自动化健康段落"
  fi

  if grep -q "## 昨夜影响范围" "$HANDOFF_FILE"; then
    echo "✅ handoff 包含昨夜影响范围"
  else
    echo "⚠️  handoff 缺少昨夜影响范围"
  fi

  # 检查 health report dir
  if [ -d "$HEALTH_REPORT_DIR" ]; then
    HEALTH_COUNT=$(find "$HEALTH_REPORT_DIR" -name "*.md" -o -name "*.log" 2>/dev/null | wc -l | tr -d ' ')
    echo "✅ health 日志目录存在 (${HEALTH_COUNT} 个文件)"
  else
    echo "⚠️  health 日志目录不存在: $HEALTH_REPORT_DIR"
  fi

  echo ""
  echo "✅ 龙虾哥昨夜自动化正常完成"
  exit 0
else
  echo "❌ handoff 文件不存在"
  echo ""
  echo "=== 龙虾哥昨夜未完成告警 ==="
  echo "龙虾哥 (launchd) 昨夜未生成 handoff 报告。"
  echo "可能原因:"
  echo "  1. launchd agent 未激活 → 运行: bash scripts/install-nightly-launchd.sh install"
  echo "  2. nightly-jobs.sh 执行中崩溃 → 检查: $HEALTH_REPORT_DIR"
  echo "  3. handoff 文件被人为删除"
  echo ""
  echo "立即补救:"
  echo "  bash scripts/nightly-foundation11-dry-run.sh $TARGET_DATE"
  echo ""
  exit 1
fi
