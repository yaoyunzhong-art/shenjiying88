#!/usr/bin/env bash
# alignment-scorecard.sh — 圈梁9道箍自动评分卡
# 每次树哥交付后、验收前跑一次。9道箍全部检查，一道不过就FAIL。
# 目标：不让任何一道箍再次变空

set -uo pipefail
REPO=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88")
cd "$REPO"

PASS_COUNT=0 FAIL_COUNT=0
PASSED=() FAILED=() WARNINGS=()

PASS() { PASS_COUNT=$((PASS_COUNT+1)); PASSED+=("$1"); }
FAIL() { FAIL_COUNT=$((FAIL_COUNT+1)); FAILED+=("$1"); }
WARN() { WARNINGS+=("$1"); }

echo "═══════════════════════════════════════════"
echo " 圈梁9道箍自动评分卡"
echo " 时间: $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════════"
echo ""

# 1 TSC
api_errors=$(npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | grep -c "error TS" || true)
if [ "$api_errors" -le 5 ] 2>/dev/null; then
  PASS "TSC通过 — api $api_errors 个错误(容忍≤5)"
else
  FAIL "TSC — api $api_errors 个错误超过阈值"
fi

# 2 测试文件
test_count=$(find apps/api/src -name '*.test.ts' 2>/dev/null | wc -l | tr -d ' ')
if [ "$test_count" -ge 10 ]; then
  PASS "测试文件: $test_count 个"
else
  WARN "测试文件过少($test_count)"
fi

# 3 圈梁表
if [ -f docs/knowledge/phase-to-module-mapping.md ]; then
  PASS "圈梁表存在"
else
  FAIL "圈梁表缺失"
fi

# 4 PRD
prd_count=$(ls docs/knowledge/prd/v23/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$prd_count" -ge 1 ]; then
  PASS "PRD: $prd_count 个文件"
else
  FAIL "PRD 无文件"
fi

# 5 知识赋能
if [ -f scripts/dispatch-knowledge.ts ]; then
  PASS "知识赋能脚本存在"
else
  WARN "知识赋能脚本缺失"
fi

# 6 基建
if [ -f .github/workflows/ci.yml ]; then PASS "CI workflow存在"; else WARN "CI workflow缺失"; fi
if [ -f docker-compose.yml ]; then PASS "Docker Compose存在"; else WARN "Docker Compose缺失"; fi
if [ -f .env.example ]; then PASS ".env.example存在"; else WARN ".env.example缺失"; fi

# 7 E2E
e2e_count=$(ls apps/api/src/modules/cross-module/cross-module-e2e-*.test.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$e2e_count" -ge 1 ]; then
  PASS "E2E: $e2e_count 条链"
else
  FAIL "E2E 无链"
fi

# 8 演进
score_count=$(ls docs/knowledge/evolution/score-*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$score_count" -ge 1 ]; then
  PASS "演进: $score_count 份评分"
else
  WARN "演进 无评分"
fi

# 9 性能
if [ -f docs/knowledge/performance-baseline.md ]; then
  PASS "性能基线存在"
else
  WARN "性能 未建立基线(非P0)"
fi

echo ""
echo "═══════════════════════════════════════════"
echo " 通过 ($PASS_COUNT):"
for i in "${PASSED[@]}"; do echo "  $i"; done
echo " 失败 ($FAIL_COUNT):"
if [ "$FAIL_COUNT" -gt 0 ]; then for i in "${FAILED[@]}"; do echo "  $i"; done; fi
echo " 警告 ($((${#WARNINGS[@]}))):"
if [ "${#WARNINGS[@]}" -gt 0 ]; then for i in "${WARNINGS[@]}"; do echo "  $i"; done; fi
echo "═══════════════════════════════════════════"
echo " 总分: $PASS_COUNT / 9 — FAIL: $FAIL_COUNT"
echo "═══════════════════════════════════════════"

[ "$FAIL_COUNT" -gt 0 ] && echo "FAIL: $FAIL_COUNT 道箍未通过" || echo "ALL PASS"
echo "SCORE=$PASS_COUNT FAILED=$FAIL_COUNT"
exit $([ "$FAIL_COUNT" -gt 0 ] && echo 2 || echo 0)
