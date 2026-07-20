#!/usr/bin/env bash
# 🐜 fail-safe-meltdown.sh — Gate6-C1 恶化熔断机制
#
# 读取最近3天的L3评分文件，判断是否需要触发开发降级/阻断
#
# 熔断条件:
#   1. 连续3天总评分下降≥20% → 🔴 meltdown
#   2. 3天内安全基线/测试通过分/TSC稳定分从绿色变红色 → 🔴 meltdown
#   3. 连续2天下降≥10%但不足20% → 🟡 warning
#   4. 其他情况 → 🟢 pass
#
# 输出: pass(绿)/warning(黄)/meltdown(红)
#
# Usage: bash scripts/fail-safe-meltdown.sh
#
# V23审计条件: V23-G6-C1 (2026-07-27截止)
# 责任人: E38沈监管+E2李安全

set -euo pipefail

PROJECT="$(cd "$(git rev-parse --show-toplevel 2>/dev/null)" && pwd)"
[ -n "$PROJECT" ] || PROJECT="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
cd "$PROJECT"

NOW="$(date '+%Y-%m-%d %H:%M')"
TODAY="$(date +%Y-%m-%d)"
YESTERDAY="$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d '-1 day' +%Y-%m-%d)"
DAY2="$(date -v-2d +%Y-%m-%d 2>/dev/null || date -d '-2 day' +%Y-%m-%d)"
SCORE_DIR="docs/knowledge/evolution"

STATUS="PASS"
REASONS=""

# ── 辅助函数 ──────────────────────────────────────────────────────

# 读取单日评分文件
# 输出: "日期|总评分|测试分|合规分|TSC分|闭环分"
# 失败返回空
parse_score_file() {
  local date="$1"
  local file="${SCORE_DIR}/score-${date}.md"
  [ -f "$file" ] || return 1

  local total
  local test_score compliance_score tsc_score closure_score

  total="$(grep -oE '评分:\s*[0-9]+/100' "$file" | grep -oE '[0-9]+' | head -1 || echo "")"
  [ -n "$total" ] || return 1

  # 表格: | 测试通过分 | 40% | 40 |  → awk -F'|'  $1=空 $2=维度 $3=权重 $4=分数
  test_score="$(awk -F'|' '/测试通过分/ {gsub(/^[ \t]+|[ \t]+$/, "", $4); print $4}' "$file" | head -1 || echo "")"
  compliance_score="$(awk -F'|' '/树哥合规分/ {gsub(/^[ \t]+|[ \t]+$/, "", $4); print $4}' "$file" | head -1 || echo "")"
  tsc_score="$(awk -F'|' '/TSC稳定分/ {gsub(/^[ \t]+|[ \t]+$/, "", $4); print $4}' "$file" | head -1 || echo "")"
  closure_score="$(awk -F'|' '/闭环率分/ {gsub(/^[ \t]+|[ \t]+$/, "", $4); print $4}' "$file" | head -1 || echo "")"

  # fallback
  if [ -z "$test_score" ]; then
    test_score="$(grep -oE '测试通过分.*?[0-9]+' "$file" | grep -oE '[0-9]+' | tail -1 || echo "")"
  fi
  if [ -z "$compliance_score" ]; then
    compliance_score="$(grep -oE '树哥合规分.*?[0-9]+' "$file" | grep -oE '[0-9]+' | tail -1 || echo "")"
  fi
  if [ -z "$tsc_score" ]; then
    tsc_score="$(grep -oE 'TSC稳定分.*?[0-9]+' "$file" | grep -oE '[0-9]+' | tail -1 || echo "")"
  fi
  if [ -z "$closure_score" ]; then
    closure_score="$(grep -oE '闭环率分.*?[0-9]+' "$file" | grep -oE '[0-9]+' | tail -1 || echo "")"
  fi

  echo "${date}|${total}|${test_score:-0}|${compliance_score:-0}|${tsc_score:-0}|${closure_score:-0}"
}

# 判断某维度是否从绿色变为红色
# 绿色=满分(>=80%), 红色=低分(<=20%满分)
is_green_to_red() {
  local prev="$1"
  local curr="$2"
  local max="$3"

  [ -n "$prev" ] && [ -n "$curr" ] || return 1
  [ "$prev" -ge $((max * 80 / 100)) ] 2>/dev/null || return 1
  [ "$curr" -le $((max * 20 / 100)) ] 2>/dev/null || return 1
  return 0
}

# 检查安全基线: 从 security-baseline-check.md 检测恶化项
# 输出: 恶化项目数(>0时有恶化), 空字符串表示无
check_security_baseline_degradation() {
  local baseline_file="docs/knowledge/security-baseline-check.md"
  [ -f "$baseline_file" ] || { echo ""; return 0; }

  # 在汇总评分表中查找有恶化趋势的行
  # 汇总评分表格式:
  # | # | 基线项目 | 状态 | 风险等级 | 7日趋势 |
  # 恶化检测: 7日趋势列包含 ⬇️
  local worsened
  worsened=0

  # 提取汇总评分表格后的行, 检查每行
  while IFS= read -r line; do
    # 7日趋势列(第5列, awk $5) 有 ⬇️ 或 恶化 标记
    local trend
    trend="$(echo "$line" | awk -F'|' '{print $5}' | tr -d '[:space:]' || echo "")"
    if echo "$trend" | grep -q '⬇'; then
      worsened=$((worsened + 1))
    fi
  done <<< "$(sed -n '/## 汇总评分/,/^###/p' "$baseline_file" 2>/dev/null | grep '|.*|.*|.*|' | grep -v '^|.*基线' | grep -v '^|.*---' || true)"

  [ "$worsened" -gt 0 ] || { echo ""; return 0; }
  echo "安全基线有 ${worsened} 项恶化"
  return 0
}

# ── 主逻辑 ────────────────────────────────────────────────────────

echo ""
echo "========================================="
echo "  [Gate6-C1] 恶化熔断检查 ${NOW}"
echo "========================================="
echo ""

# 1. 收集最近3天评分
SCORES=("" "" "")
TEST_SCORES=("" "" "")
COMPLIANCE_SCORES=("" "" "")
TSC_SCORES=("" "" "")
CLOSURE_SCORES=("" "" "")
DAYS=("$TODAY" "$YESTERDAY" "$DAY2")
FOUND=0

for i in 0 1 2; do
  d="${DAYS[$i]}"
  result="$(parse_score_file "$d" || true)"
  if [ -n "$result" ]; then
    IFS='|' read -r date total test_s comp_s tsc_s clos_s <<< "$result"
    SCORES[$i]="$total"
    TEST_SCORES[$i]="$test_s"
    COMPLIANCE_SCORES[$i]="$comp_s"
    TSC_SCORES[$i]="$tsc_s"
    CLOSURE_SCORES[$i]="$clos_s"
    FOUND=$((FOUND + 1))
    echo "  L3 ${d}: ${total}/100 (测试=${test_s} 合规=${comp_s} TSC=${tsc_s} 闭环=${clos_s})"
  else
    SCORES[$i]=""
    echo "  L3 ${d}: (无评分文件)"
  fi
done

echo ""

# ── 熔断条件1: 连续3天总评分下降>=20%
if [ "$FOUND" -ge 3 ]; then
  S0="${SCORES[0]:-}"
  S1="${SCORES[1]:-}"
  S2="${SCORES[2]:-}"

  if [ -n "$S0" ] && [ -n "$S1" ] && [ -n "$S2" ]; then
    DROP1=$((S1 - S0))
    DROP2=$((S2 - S1))
    PCT1=0; PCT2=0
    [ "$S1" -gt 0 ] && PCT1=$((DROP1 * 100 / S1))
    [ "$S2" -gt 0 ] && PCT2=$((DROP2 * 100 / S2))

    echo "  Trend: ${S2} -> ${S1} (${PCT2}%) -> ${S0} (${PCT1}%)"

    if [ "$DROP1" -lt 0 ] && [ "$DROP2" -lt 0 ]; then
      PCT1_ABS=$((-PCT1))
      PCT2_ABS=$((-PCT2))
      if [ "$PCT1_ABS" -ge 20 ] && [ "$PCT2_ABS" -ge 20 ]; then
        STATUS="MELTDOWN"
        REASONS="${REASONS}连续3天总评分下降${PCT2_ABS}%/${PCT1_ABS}%; "
        echo "  [FAIL] 条件1触发: 连续3天评分下降>=20%"
      elif [ "$PCT1_ABS" -ge 10 ] || [ "$PCT2_ABS" -ge 10 ]; then
        [ "$STATUS" = "PASS" ] && STATUS="WARNING"
        REASONS="${REASONS}连续2天评分下降${PCT2_ABS}%/${PCT1_ABS}%; "
        echo "  [WARN] 连续2天评分下降>=10%: warning"
      else
        echo "  [OK] 下降幅度<10%"
      fi
    else
      echo "  [OK] 未出现连续2天下降"
    fi
  fi
else
  echo "  [OK] 仅${FOUND}/3天评分，跳过3天连续下降检查"
fi

# ── 熔断条件2: 3天内维度从绿色变红色
echo ""
echo "  --- 条件2: 维度恶化检查 ---"
DIMENSION_MELTDOWN=false

T1="${TEST_SCORES[1]:-}"
T0="${TEST_SCORES[0]:-}"
if [ -n "$T1" ] && [ -n "$T0" ]; then
  if is_green_to_red "$T1" "$T0" 40; then
    DIMENSION_MELTDOWN=true
    REASONS="${REASONS}测试通过分从绿色变红色(${T1}->${T0}); "
    echo "  [FAIL] 测试通过分恶化: ${T1}->${T0}"
  fi
fi

T1="${TSC_SCORES[1]:-}"
T0="${TSC_SCORES[0]:-}"
if [ -n "$T1" ] && [ -n "$T0" ]; then
  if is_green_to_red "$T1" "$T0" 20; then
    DIMENSION_MELTDOWN=true
    REASONS="${REASONS}TSC稳定分从绿色变红色(${T1}->${T0}); "
    echo "  [FAIL] TSC稳定分恶化: ${T1}->${T0}"
  fi
fi

BASELINE_OUT="$(check_security_baseline_degradation)"
if [ -n "$BASELINE_OUT" ]; then
  DIMENSION_MELTDOWN=true
  REASONS="${REASONS}${BASELINE_OUT}; "
  echo "  [FAIL] 安全基线有项目恶化"
fi

C1="${CLOSURE_SCORES[1]:-}"
C0="${CLOSURE_SCORES[0]:-}"
if [ -n "$C1" ] && [ -n "$C0" ]; then
  if is_green_to_red "$C1" "$C0" 20; then
    DIMENSION_MELTDOWN=true
    REASONS="${REASONS}闭环率分从绿色变红色(${C1}->${C0}); "
    echo "  [FAIL] 闭环率分恶化: ${C1}->${C0}"
  fi
fi

if [ "$DIMENSION_MELTDOWN" = true ]; then
  STATUS="MELTDOWN"
  echo "  [FAIL] 条件2触发: 存在维度从绿色变红色"
else
  echo "  [OK] 所有维度稳定"
fi

# ── 最终输出
echo ""
echo "========================================="
case "$STATUS" in
  "PASS")
    echo "  Result: PASS"
    echo "========================================="
    echo ""
    echo "STATUS=pass"
    echo "COLOR=green"
    ;;
  "WARNING")
    echo "  Result: WARNING"
    echo "========================================="
    echo ""
    echo "STATUS=warning"
    echo "COLOR=yellow"
    echo "REASONS=${REASONS%??}"
    echo ""
    echo "Reason: ${REASONS%??}"
    ;;
  "MELTDOWN")
    echo "  Result: MELTDOWN"
    echo "========================================="
    echo ""
    echo "STATUS=meltdown"
    echo "COLOR=red"
    echo "REASONS=${REASONS%??}"
    echo ""
    echo "Reason: ${REASONS%??}"
    echo ""
    echo "Gate6-C1 triggered!"
    echo "  1. 暂停新功能开发, 优先修复恶化项"
    echo "  2. 通知 E38沈监管+E2李安全 启动熔断复核"
    echo "  3. 熔断期间仅允许修复性PR合并"
    echo "  4. 恢复条件: 连续24h评分稳定/回升"
    ;;
esac

exit 0
