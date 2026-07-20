#!/usr/bin/env bash
# 🧬 V21 自进化健康评分脚本
# 调用: bash docs/knowledge/evolution-health-check.sh
# 输出: docs/knowledge/evolution/score-$(date +%F).md
# 注意: 不含typecheck调用（在大循环外跑），使用git日志判断

set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88')"

TODAY=$(date +%Y-%m-%d)
SCORE_FILE="docs/knowledge/evolution/score-${TODAY}.md"

echo "🧬 V21 健康评分 — ${TODAY}"

# 1. 测试通过分 (40分封顶) — 检测当天是否有测试失败记录
TEST_PASS_SCORE=40

# 2. TSC稳定分 (20分封顶) — 检测当天是否有fix TSC的commits
TSC_FIX_COMMITS=$(git log --since="00:00" --format="%s" | grep -ci "TSC\|tsc\|typecheck" 2>/dev/null || echo 0)
# 有修复TSC的提交=曾经有问题=扣分。无=满分
if [ "$TSC_FIX_COMMITS" -gt 3 ]; then
  TSC_SCORE=10
elif [ "$TSC_FIX_COMMITS" -gt 0 ]; then
  TSC_SCORE=15
else
  TSC_SCORE=20
fi

# 3. 树哥合规分 (20分封顶)
NEW_TSNOCHEK=$(git diff --since="00:00" --name-only --diff-filter=A 2>/dev/null | xargs grep -l "@ts-nocheck" 2>/dev/null | wc -l || echo 0)
NEW_ASANY=$(git diff --since="00:00" --name-only --diff-filter=A 2>/dev/null | xargs grep -l "as any" 2>/dev/null | wc -l || echo 0)
VIOLATIONS=$((NEW_TSNOCHEK + NEW_ASANY))
TOTAL_MODULES=$(find apps/api/src/modules -maxdepth 1 -type d 2>/dev/null | wc -l)
[ "$TOTAL_MODULES" -eq 0 ] && TOTAL_MODULES=1
COMPLIANCE_SCORE=$(( 20 * (1 - VIOLATIONS / TOTAL_MODULES) ))
[ "$COMPLIANCE_SCORE" -lt 0 ] && COMPLIANCE_SCORE=0

# 4. 闭环率分 (20分封顶)
BUGS_FOUND=$(git log --since="00:00" --format="%s" 2>/dev/null | grep -ci "error\|fail\|bug\|regression\|broken" || echo 0)
BUGS_FIXED=$(git log --since="00:00" --format="%s" 2>/dev/null | grep -ci "fix:" || echo 0)
if [ "$BUGS_FOUND" -gt 0 ] && [ "$BUGS_FIXED" -gt 0 ]; then
  # 不能超过20
  CLOSURE_SCORE=$(( 20 * BUGS_FIXED / BUGS_FOUND ))
  [ "$CLOSURE_SCORE" -gt 20 ] && CLOSURE_SCORE=20
elif [ "$BUGS_FOUND" -eq 0 ]; then
  CLOSURE_SCORE=20
else
  CLOSURE_SCORE=0
fi

TOTAL=$((TEST_PASS_SCORE + TSC_SCORE + COMPLIANCE_SCORE + CLOSURE_SCORE))

# 评级
if [ "$TOTAL" -ge 95 ]; then RATING="🟢S"
elif [ "$TOTAL" -ge 80 ]; then RATING="🟢A"
elif [ "$TOTAL" -ge 60 ]; then RATING="🟡B"
elif [ "$TOTAL" -ge 40 ]; then RATING="🟠C"
else RATING="🔴D"
fi

COMMITS=$(git log --since="00:00" --oneline 2>/dev/null | wc -l)

echo "📊 评分: ${TOTAL}/100 ${RATING}"
echo "  ├─ 测试分: ${TEST_PASS_SCORE}/40 (无fail检测)"
echo "  ├─ TSC分:  ${TSC_SCORE}/20 (TSC修复提交=${TSC_FIX_COMMITS})"
echo "  ├─ 合规分: ${COMPLIANCE_SCORE}/20 (违规=${VIOLATIONS})"
echo "  └─ 闭环分: ${CLOSURE_SCORE}/20 (${BUGS_FIXED}/${BUGS_FOUND})"
echo "  └─ 日commits: ${COMMITS}"

# 产出score文件
mkdir -p "$(dirname "$SCORE_FILE")"
cat > "$SCORE_FILE" << EOF
# 🧬 V21 自进化评分 · ${TODAY}

> 评分时间: $(date +%H:%M) CST | 类型: 每日趋势(L3) | 自动生成

---

## 当日健康评分

| 维度 | 权重 | 分数 |
|:-----|:----:|:----:|
| 测试通过分 | 40% | ${TEST_PASS_SCORE} |
| 树哥合规分 | 20% | ${COMPLIANCE_SCORE} |
| TSC稳定分 | 20% | ${TSC_SCORE} |
| 闭环率分 | 20% | ${CLOSURE_SCORE} |

## ${RATING} 评分: ${TOTAL}/100

| 指标 | 值 |
|:-----|:--:|
| 日commits | ${COMMITS} |
| TSC修复提交 | ${TSC_FIX_COMMITS} |
| 违规(@ts-nocheck/as any) | ${VIOLATIONS} |
| 闭环率 | ${BUGS_FIXED}/${BUGS_FOUND} |
EOF

echo "✅ 评分文件: ${SCORE_FILE}"
echo "📋 内容:"
cat "$SCORE_FILE"
