#!/usr/bin/env bash
set -euo pipefail

# ======================================================================
# authguard-coverage-check.sh
# G2 安全审计 · AuthGuard 覆盖率基线检查脚本
#
# 扫描 apps/api/src/modules/ 下所有 *.controller.ts，
# 统计 @UseGuards 装饰器的覆盖率（类级或方法级）。
#
# 例外列表（无需 @UseGuards）：
#   - auth 模块  —— 认证模块自身不需要认证
#
# 判定标准：
#   pass    (≥80%)
#   warning (≥50%)
#   fail    (<50%)
#
# 使用：bash scripts/authguard-coverage-check.sh
# ======================================================================

readonly CONTROLLER_DIR="apps/api/src/modules"
readonly BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
readonly PROJECT_ROOT="$BASE_DIR"

# ── 颜色 ──
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── 例外名单 ──
# 这些 controller 文件路径中的模块视为"免检"
readonly EXEMPT_MODULES=(
  auth
)

# ── 格式化辅助 ──
print_header() {
  echo -e "\n${BOLD}$1${NC}"
  echo "────────────────────────────────────────────────"
}

# ── 统计开始 ──
print_header "🔐 AuthGuard 覆盖率检查"

# 收集所有 controller 文件（在模块根目录下，不递归过深）
ALL_CONTROLLERS=()
while IFS= read -r f; do
  ALL_CONTROLLERS+=("$f")
done < <(find "$PROJECT_ROOT/$CONTROLLER_DIR" -name '*.controller.ts' -type f | sort)

TOTAL=${#ALL_CONTROLLERS[@]}

GUARDED_CONTROLLERS=()
UNGUARDED_CONTROLLERS=()
EXEMPTED_CONTROLLERS=()

for controller in "${ALL_CONTROLLERS[@]}"; do
  # 提取相对路径用于显示
  rel="${controller#$PROJECT_ROOT/}"

  # 检查是否在例外模块中
  exempt=false
  for mod in "${EXEMPT_MODULES[@]}"; do
    if [[ "$rel" == *"/$mod/"* ]]; then
      exempt=true
      break
    fi
  done

  if $exempt; then
    EXEMPTED_CONTROLLERS+=("$rel")
    continue
  fi

  # 检查是否有 @UseGuards 装饰器（类级或方法级，不含注释中的）
  # 匹配 '@UseGuards(' 作为装饰器调用（非注释中的文档引用）
  if grep -qE '^\s*@UseGuards\(' "$controller" 2>/dev/null; then
    GUARDED_CONTROLLERS+=("$rel")
  else
    UNGUARDED_CONTROLLERS+=("$rel")
  fi
done

# ── 汇总 ──
NUM_GUARDED=${#GUARDED_CONTROLLERS[@]}
NUM_UNGUARDED=${#UNGUARDED_CONTROLLERS[@]}
NUM_EXEMPTED=${#EXEMPTED_CONTROLLERS[@]}
# 统计基数：除去例外的 controller
NUM_TARGET=$((TOTAL - NUM_EXEMPTED))

echo ""
echo "  总 Controllers:    ${BOLD}${TOTAL}${NC}"
echo "  例外（auth）:      ${CYAN}${NUM_EXEMPTED}${NC}"
echo "  ─────────────────────────"
echo "  应检查:             ${BOLD}${NUM_TARGET}${NC}"
echo "  有 @UseGuards:     ${GREEN}${NUM_GUARDED}${NC}"
echo "  缺失 @UseGuards:   ${RED}${NUM_UNGUARDED}${NC}"

# ── 计算百分比 / 判定 ──
if [ "$NUM_TARGET" -eq 0 ]; then
  PCT="N/A"
  RESULT_MSG="${YELLOW}⚠  无有效 controller 可检查${NC}"
  RESULT_LABEL="N/A"
else
  PCT=$(echo "scale=2; $NUM_GUARDED * 100 / $NUM_TARGET" | bc)
  PCT_DISPLAY="${PCT}%"

  if [ "$(echo "$PCT >= 80" | bc)" -eq 1 ]; then
    RESULT_MSG="${GREEN}✅ PASS${NC}  （覆盖率 >= 80%）"
    RESULT_LABEL="pass"
  elif [ "$(echo "$PCT >= 50" | bc)" -eq 1 ]; then
    RESULT_MSG="${YELLOW}⚠️  WARNING${NC}（覆盖率 >= 50%，但 < 80%）"
    RESULT_LABEL="warning"
  else
    RESULT_MSG="${RED}❌ FAIL${NC}  （覆盖率 < 50%）"
    RESULT_LABEL="fail"
  fi

  echo ""
  echo -e "  覆盖率:           ${BOLD}${PCT_DISPLAY}${NC}"
fi

echo ""
echo -e "  判定:             ${RESULT_MSG}"

# ── 例外清单 ──
if [ "$NUM_EXEMPTED" -gt 0 ]; then
  print_header "📋 例外免检清单"
  for c in "${EXEMPTED_CONTROLLERS[@]}"; do
    echo "  ${CYAN}[豁免]${NC} $c"
  done
fi

# ── 有 @UseGuards 的 controller ──
if [ "$NUM_GUARDED" -gt 0 ]; then
  print_header "✅ 有 @UseGuards 装饰器的 controller"
  for c in "${GUARDED_CONTROLLERS[@]}"; do
    echo "  ${GREEN}[✓]${NC} $c"
  done
fi

# ── 缺失 @UseGuards 的 controller 清单 ──
print_header "❌ 缺失 @UseGuards 的 controller（需优先处理）"
if [ "$NUM_UNGUARDED" -eq 0 ]; then
  echo -e "  ${GREEN}很好，全部已覆盖！${NC}"
else
  echo ""
  echo -e "  共 ${RED}${NUM_UNGUARDED}${NC} 个 controller 未添加 @UseGuards："
  echo ""
  for c in "${UNGUARDED_CONTROLLERS[@]}"; do
    echo "  ${RED}[✗]${NC} $c"
  done
fi

# ── 退出码 ──
echo ""
echo -e "${BOLD}━━━ 审计结果 ━━━${NC}"
case "$RESULT_LABEL" in
  pass)
    echo -e "${GREEN}✅ PASS — AuthGuard 覆盖率达标${NC}"
    exit 0
    ;;
  warning)
    echo -e "${YELLOW}⚠️  WARNING — 覆盖率需提升至 80%${NC}"
    exit 1
    ;;
  fail)
    echo -e "${RED}❌ FAIL — AuthGuard 覆盖率严重不足${NC}"
    exit 2
    ;;
  *)
    echo -e "${YELLOW}⚠  无法判定，检查 controller 是否为空${NC}"
    exit 3
    ;;
esac
