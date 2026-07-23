#!/usr/bin/env bash
# =============================================================================
# compliance-quarterly-simulate.sh — WP-COMPLIANCE BS-0248
# 用途: 季度全系统模拟 — 检查覆盖率 == TSC == 测试 == 偏离单清单
#
# 圈梁: 代码✅ 配置✅ 证据✅ 回滚✅
# 用法:
#   ./scripts/compliance-quarterly-simulate.sh                    # 全量默认
#   ./scripts/compliance-quarterly-simulate.sh --coverage=95      # 自定义覆盖率输入
#   ./scripts/compliance-quarterly-simulate.sh --tsc-pass=100     # 自定义 TSC 通过率
#   ./scripts/compliance-quarterly-simulate.sh --test-pass=100    # 自定义测试通过率
#   ./scripts/compliance-quarterly-simulate.sh --deviation-only   # 只检查偏离单
#   ./scripts/compliance-quarterly-simulate.sh --verbose          # 详细输出
#
# 退出码: 0 = 全部通过, 1 = 存在失败项
# =============================================================================

set -euo pipefail

# ── 初始化默认值 ──────────────────────────────────────────────────────────────
COVERAGE=${COVERAGE:-90}
TSC_PASS=${TSC_PASS:-100}
TEST_PASS=${TEST_PASS:-100}
DEVIATION_ONLY=false
VERBOSE=false

# ── 颜色配置 ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── 参数解析 ──────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --coverage=*)    COVERAGE="${1#*=}" ;;
    --tsc-pass=*)    TSC_PASS="${1#*=}" ;;
    --test-pass=*)   TEST_PASS="${1#*=}" ;;
    --deviation-only) DEVIATION_ONLY=true ;;
    --verbose)       VERBOSE=true ;;
    --help)
      echo "用法: $0 [选项]"
      echo "  --coverage=N    代码审查完成率 (默认 90)"
      echo "  --tsc-pass=N    TSC 通过率 (默认 100)"
      echo "  --test-pass=N   测试通过率 (默认 100)"
      echo "  --deviation-only 只检查偏离单"
      echo "  --verbose        详细输出"
      echo "  --help           本帮助"
      exit 0
      ;;
    *)
      echo "未知参数: $1"
      exit 1
      ;;
  esac
  shift
done

# ── 路径 ──────────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVIATION_REGISTRY="${REPO_ROOT}/.trae/compliance/deviation-registry.json"
TIMESTAMP="$(date +%Y-%m-%dT%H:%M:%S%z)"

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  ║  季度合规模拟 — Q${QUARTER:-$(date +%Y-Q$(( ($(date +%-m)-1)/3+1 )))}               ║${NC}"
echo -e "${CYAN}  ║  时间: ${TIMESTAMP}  ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

PASSED=0
FAILED=0
TOTAL=0

# ── 辅助函数 ──────────────────────────────────────────────────────────────────
check_gate() {
  local name="$1"
  local value="$2"
  local threshold="$3"
  TOTAL=$((TOTAL + 1))

  if (( $(echo "$value >= $threshold" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "  ${GREEN}✅${NC} $name: $value% ≥ ${threshold}%"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "  ${RED}❌${NC} $name: $value% < ${threshold}%"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# ── 1. 代码审查完成率 ─────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[1/4] 代码审查完成率 (COVERAGE)${NC}"
if [ "$DEVIATION_ONLY" = false ]; then
  check_gate "代码审查完成率" "$COVERAGE" "90"
else
  echo -e "  ${YELLOW}⚠ 已跳过 (--deviation-only)${NC}"
fi

# ── 2. TSC 类型检查通过率 ─────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/4] TSC 类型检查通过率 (TSC_PASS)${NC}"
if [ "$DEVIATION_ONLY" = false ]; then
  check_gate "TSC 类型检查通过率" "$TSC_PASS" "100"
else
  echo -e "  ${YELLOW}⚠ 已跳过 (--deviation-only)${NC}"
fi

# ── 3. 测试通过率 ──────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] 测试通过率 (TEST_PASS)${NC}"
if [ "$DEVIATION_ONLY" = false ]; then
  check_gate "测试通过率" "$TEST_PASS" "100"
else
  echo -e "  ${YELLOW}⚠ 已跳过 (--deviation-only)${NC}"
fi

# ── 4. 偏离单完整性检查 ───────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] 偏离单检查 (DEVIATION_REGISTRY)${NC}"

DEV_ISSUES=0

if [ -f "$DEVIATION_REGISTRY" ]; then
  echo -e "  ${GREEN}✅${NC} 偏离注册表存在: $DEVIATION_REGISTRY"

  # 检查偏离单是否有待处理的 P0 阻塞项
  if command -v jq &>/dev/null; then
    OPEN_P0=$(jq '[.deviations[] | select(.severity == "P0" and (.status == "open" or .status == "in_progress"))] | length' "$DEVIATION_REGISTRY" 2>/dev/null || echo 0)
    OPEN_P1=$(jq '[.deviations[] | select(.severity == "P1" and (.status == "open" or .status == "in_progress"))] | length' "$DEVIATION_REGISTRY" 2>/dev/null || echo 0)
    closed=$(jq '[.deviations[] | select(.status == "closed")] | length' "$DEVIATION_REGISTRY" 2>/dev/null || echo 0)
    total=$(jq '.deviations | length' "$DEVIATION_REGISTRY" 2>/dev/null || echo 0)

    echo -e "    总偏离单: $total  (关闭: $closed  P0开放: $OPEN_P0  P1开放: $OPEN_P1)"

    if [ "$OPEN_P0" -gt 0 ]; then
      echo -e "    ${RED}❌ 存在 $OPEN_P0 个待处理的 P0 偏离项${NC}"
      DEV_ISSUES=$((DEV_ISSUES + 1))
    else
      echo -e "    ${GREEN}✅ 无待处理 P0 偏离项${NC}"
    fi

    # 列出所有开放偏离
    if [ "$VERBOSE" = true ] && [ "$total" -gt 0 ]; then
      jq -r '.deviations[] | select(.status == "open" or .status == "in_progress") | "    [\(.severity)] \(.id): \(.title)"' "$DEVIATION_REGISTRY" 2>/dev/null || true
    fi

    TOTAL=$((TOTAL + 1))
    if [ "$DEV_ISSUES" -eq 0 ]; then
      PASSED=$((PASSED + 1))
    else
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠  未安装 jq, 跳过偏离单内容检查${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠  偏离注册表不存在: $DEVIATION_REGISTRY${NC}"
  echo -e "    可运行以下命令初始化:"
  echo -e "    mkdir -p .trae/compliance && cat > .trae/compliance/deviation-registry.json << 'JSON'"
  echo -e '    {"meta":{"version":"1.0","lastUpdated":"'$(date +%Y-%m-%d)'","source":"r18-bs-catalog"},"deviations":[]}'
  echo -e "    JSON"
fi

# ── 汇总 ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "  总检查项: $TOTAL  |  ${GREEN}通过: $PASSED${NC}  |  ${RED}失败: $FAILED${NC}"
if [ "$FAILED" -eq 0 ]; then
  echo -e "  ${GREEN}✅ 季度合规模拟: 全部通过${NC}"
else
  echo -e "  ${RED}❌ 季度合规模拟: 存在 $FAILED 项失败${NC}"
fi
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

exit $(( FAILED > 0 ? 1 : 0 ))
