#!/bin/bash
# PRD验证检查脚本 - 用于验收脉冲和每小时审计
set -e

PROJECT=/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88
cd "$PROJECT"

PRD_DIR="docs/knowledge/prd"
PHASE_FILE="docs/knowledge/phase-progress.md"
PRD_INDEX="$PRD_DIR/prd-index.md"
EXIT_CODE=0

echo ""
echo "--- PRD验证检查 ---"

# 检查1: prd-index.md 存在?
if [ -f "$PRD_INDEX" ]; then
  echo "OK  prd-index.md 存在"
else
  echo "FAIL prd-index.md 不存在"
  EXIT_CODE=1
fi

# 检查2: 活跃Phase vs PRD映射
echo ""
echo "--- 活跃Phase映射 ---"
MISSING=0
if [ -f "$PHASE_FILE" ]; then
  while IFS='|' read -r _ phase name owner status rest; do
    phase=$(echo "$phase" | tr -d ' ')
    status=$(echo "$status" | tr -d ' ')
    if [ -z "$phase" ]; then continue; fi
    if echo "$phase" | grep -q "^P-"; then
      if echo "$status" | grep -vq "未开始"; then
        found=$(grep -c "$phase" "$PRD_INDEX" 2>/dev/null || echo "0")
        if [ "$found" -gt 0 ]; then
          echo "OK  $phase -> 有PRD"
        else
          echo "FAIL $phase -> 无PRD"
          MISSING=$((MISSING + 1))
        fi
      fi
    fi
  done < "$PHASE_FILE"
  echo "缺PRD: $MISSING"
  if [ "$MISSING" -gt 0 ]; then EXIT_CODE=1; fi
else
  echo "FAIL phase-progress.md 不存在"
  EXIT_CODE=1
fi

# 检查3: PRD文件完整性
echo ""
echo "--- PRD完整性 ---"
for f in "$PRD_DIR"/prd-*.md; do
  b=$(basename "$f")
  [ "$b" = "prd-index.md" ] && continue
  lines=$(wc -l < "$f")
  rq=$(grep 'RQ-' "$f" 2>/dev/null | wc -l | tr -d ' ')
  ac=$(grep 'AC-' "$f" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$rq" -gt 0 ] && [ "$ac" -gt 0 ]; then
    echo "OK  $b (${lines}行 RQ:${rq} AC:${ac})"
  else
    echo "WARN $b (${lines}行 RQ:${rq} AC:${ac}) 缺少需求或验收卡"
  fi
done

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "OK  全部通过"
else
  echo "WARN 有 $MISSING 个Phase缺PRD"
fi
exit $EXIT_CODE
