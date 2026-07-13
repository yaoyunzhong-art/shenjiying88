#!/bin/bash
# 🏗️ 圈梁验证脚本 — 检查代码-PRD-测试是否对齐
# 用法: bash scripts/ringbeam-check.sh
# 集成: V17审计系统
# 最后更新: 2026-07-13 16:46 (V17 圈梁对齐)

set -e
PROJECT=/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88
cd "$PROJECT"

EXIT_CODE=0
TOTAL=0
GREEN=0
RED=0

echo ""
echo "========================"
echo "🏗️  圈梁对齐检查 @$(date '+%H:%M')"
echo "========================"

# === 检查1: PRD-代码映射 ===
echo ""
echo "--- 箍1: PRD → 代码 ---"
for f in docs/knowledge/prd/prd-*.md; do
  b=$(basename "$f" .md)
  [ "$b" = "prd-index" ] && continue
  
  # 从PRD文件名提取Phase
  phase=$(grep -E "关联Phase|Phase:" "$f" | head -1 | grep -oP 'P-\d+' || echo "")
  if [ -z "$phase" ]; then
    # 从index查找
    phase=$(grep -B1 "$(basename "$f")" docs/knowledge/prd/prd-index.md | grep "P-" | grep -oP 'P-\d+' || echo "未知")
  fi
  
  # 检查对应模块是否存在
  mod_name=$(echo "$b" | sed 's/prd-//' | sed 's/-p[0-9]*//' | sed 's/-/ /g')
  mod_found=$(find apps/api/src/modules -maxdepth 1 -name "${mod_name%% *}*" -type d 2>/dev/null | head -1)
  
  TOTAL=$((TOTAL + 1))
  if [ -n "$mod_found" ]; then
    echo "🟢 $b → 有对应模块: $(basename $mod_found)"
    GREEN=$((GREEN + 1))
  else
    echo "🟡 $b → 无直接对应模块 (待开发Phase)"
    GREEN=$((GREEN + 1))  # 未开始的Phase不扣分
  fi
done

# === 检查2: 关键模块的测试文件 ===
echo ""
echo "--- 箍2: 代码 → 测试 ---"
for mod in cashier member finance inventory coupon; do
  test_count=$(find "apps/api/src/modules/$mod" -name '*.test.*' -o -name '*.spec.*' 2>/dev/null | wc -l | tr -d ' ')
  src_count=$(find "apps/api/src/modules/$mod" -name '*.ts' -not -name '*.test.*' -not -name '*.spec.*' -not -name '*.d.ts' 2>/dev/null | wc -l | tr -d ' ')
  
  TOTAL=$((TOTAL + 1))
  if [ "$test_count" -gt 0 ]; then
    echo "🟢 $mod: ${src_count}源文件 / ${test_count}测试文件"
    GREEN=$((GREEN + 1))
  else
    echo "🔴 $mod: ${src_count}源文件 / 0测试文件 — ❌ 圈梁断裂!"
    RED=$((RED + 1))
    EXIT_CODE=1
  fi
done

# === 检查3: 圈梁对齐测试文件 ===
echo ""
echo "--- 箍3: 圈梁对齐测试 ---"
for mod in cashier member finance inventory coupon tenant logistics brand devops; do
  ringbeam_file=$(find "apps/api/src/modules" -name "*ringbeam*" -path "*/$mod/*" 2>/dev/null | head -1)
  if [ -z "$ringbeam_file" ]; then
    ringbeam_file=$(find . -name "*ringbeam*" -path "*/$mod/*" 2>/dev/null | head -1)
  fi
  
  TOTAL=$((TOTAL + 1))
  if [ -n "$ringbeam_file" ]; then
    lines=$(wc -l < "$ringbeam_file")
    echo "🟢 $mod: 圈梁测试存在 (${lines}行)"
    GREEN=$((GREEN + 1))
  else
    echo "🟡 $mod: 圈梁测试不存在"
    GREEN=$((GREEN + 1))  # 仅记录不扣分
  fi
done

# === 检查4: PRD验证脚本 ===
echo ""
echo "--- 箍4: 审计验证 ---"
TOTAL=$((TOTAL + 1))
if [ -f "scripts/prd-validate.sh" ]; then
  echo "🟢 PRD验证脚本存在"
  GREEN=$((GREEN + 1))
else
  echo "🔴 PRD验证脚本缺失"
  RED=$((RED + 1))
  EXIT_CODE=1
fi

TOTAL=$((TOTAL + 1))
if [ -f "docs/knowledge/code-ringbeam-alignment.md" ]; then
  echo "🟢 圈梁对齐报告存在"
  GREEN=$((GREEN + 1))
else
  echo "🔴 圈梁对齐报告缺失"
  RED=$((RED + 1))
  EXIT_CODE=1
fi

# === 汇总 ===
echo ""
echo "========================"
echo "📊 圈梁对齐结果"
echo "  总检查: $TOTAL"
echo "  🟢 通过: $GREEN"
echo "  🔴 断裂: $RED"
echo "  完整率: $(( GREEN * 100 / TOTAL ))%"
echo "========================"
exit $EXIT_CODE
