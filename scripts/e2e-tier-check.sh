#!/usr/bin/env bash
# ============================================================================
# 🎯 E2E链分级检查脚本 — e2e-tier-check.sh
#
# 功能:
#   1. 读取 apps/api/src/modules/cross-module/cross-module-e2e-*.test.ts
#   2. 按文件名/描述自动分级 (L0/L1/L2)
#   3. 输出分级明细
#   4. 可指定级别运行 (--tier L0|L1|L2)
#   5. 校验一致性 (--verify)
#
# 分级标准:
#   L0: 收银/支付/退款/对账/租户 (生命线, 每次PR前)
#   L1: 核心业务链 (每日)
#   L2: 全量链 (每周)
#
# 用法:
#   bash scripts/e2e-tier-check.sh [--tier L0|L1|L2] [--list] [--verify]
#
# 铁律:
#   - 圈梁第五道箍: 知识赋能
#   - 禁止: as any / describe.skip / it.only
# ============================================================================

set -uo pipefail

# --- 定位仓库根目录 ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
E2E_DIR="$REPO_DIR/apps/api/src/modules/cross-module"
DOC_FILE="$REPO_DIR/docs/knowledge/e2e-tier-grading.md"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- 日志函数 ---
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; }
title() { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

# --- 退出 ---
trap 'echo -e "\n${RED}✗ 脚本异常退出${NC}"' ERR

# ============================================================================
# 分级定义
# ============================================================================

# L0 文件名模式 (或包含关键词)
declare -a L0_FILE_RULES=(
  'cross-module-e2e-8-reservation-queue-cashier'   # #8 预约→排队→收银→完成
  'cross-module-e2e-13-daily-settlement'            # #13 日清结算: 对账
  'cross-module-e2e-24-member-coupon-payment-loyalty' # #24 会员→优惠券→支付→积分/储值
  'cross-module-e2e-45-finance-transactions'         # #45 财务对账→交易全链路
  'cross-module-e2e-50-tenant-rls-auth'             # #50 多租户全链 (RLS+Auth)
)

declare -a L0_KEYWORDS=(
  '收银' 'cashier'
  '支付' 'payment'
  '退款' 'refund'
  '对账' 'reconciliation' 'settlement'
  '租户' 'tenant' 'rls' 'auth'
)

declare -a L1_FILE_RULES=(
  'cross-module-e2e-1-admin-to-consumer'            # #1
  'cross-module-e2e-2-sdk-to-api'                   # #2
  'cross-module-e2e-3-governance-chain'             # #3
  'cross-module-e2e-4-multi-client-consistency'     # #4
  'cross-module-e2e-5-campaign-loyalty-analytics'   # #5
  'cross-module-e2e-9-inventory-finance'            # #9
  'cross-module-e2e-10-ai-recommend-loyalty-campaign-cashier' # #10
  'cross-module-e2e-19-multi-tenant-isolation'      # #19
  'cross-module-e2e-23-tenant-market-bootstrap-portal' # #23
  'cross-module-e2e-25-sdk-domain-api-contract'     # #25
  'cross-module-e2e-36-tenant-isolation-governance' # #36
  'cross-module-e2e-41-member-coupon-payment-loyalty' # #41
  'cross-module-e2e-42-sdk-domain-api-storefront'   # #42
  'cross-module-e2e-44-brand-logistics'             # #44
  'cross-module-e2e-46-brand-storefront'            # #46
  'cross-module-e2e-51-store-management'            # #51
  'cross-module-e2e-52-competitor-track'            # #52
  'cross-module-e2e-53-alliance'                    # #53
  'cross-module-e2e-54-crm'                         # #54
  'cross-module-e2e-55-campaign'                    # #55
  'cross-module-e2e-56-schedule'                    # #56
  'cross-module-e2e-57-giftcard'                    # #57
  'cross-module-e2e-58-membership'                  # #58
  'cross-module-e2e-59-merchant'                    # #59
  'cross-module-e2e-60-quality'                     # #60
  'cross-module-e2e-61-leave'                       # #61
)

# ============================================================================
# 函数: 判定文件的级别
# ============================================================================
classify_file() {
  local filepath="$1"
  local basename
  basename="$(basename "$filepath" .test.ts)"

  # 先检查 L0
  for rule in "${L0_FILE_RULES[@]}"; do
    if [[ "$basename" == *"$rule"* ]]; then
      echo "L0"
      return
    fi
  done

  # 再检查 L1
  for rule in "${L1_FILE_RULES[@]}"; do
    if [[ "$basename" == *"$rule"* ]]; then
      echo "L1"
      return
    fi
  done

  # 其余为 L2
  echo "L2"
}

# ============================================================================
# 函数: 扫描并分级
# ============================================================================
scan_and_grade() {
  local files
  # Use numeric sort based on the chain number extracted from the filename
  files=$(ls "$E2E_DIR"/cross-module-e2e-*.test.ts 2>/dev/null | sort -t- -k5n) || {
    err "未找到 E2E 测试文件: $E2E_DIR/cross-module-e2e-*.test.ts"
    exit 1
  }

  local l0_files l1_files l2_files
  l0_files=()
  l1_files=()
  l2_files=()
  local total_l0=0 total_l1=0 total_l2=0 total_it=0

  title "E2E 链分级扫描"
  echo -e "${BLUE}源目录:${NC} $E2E_DIR"

  while IFS= read -r file; do
    [[ -z "$file" || ! -f "$file" ]] && continue

    local basename
    basename="$(basename "$file" .test.ts)"
    local tier
    tier=$(classify_file "$file")
    local it_count
    it_count=$(grep -cE "^\s*it\(" "$file" 2>/dev/null || echo 0)
    local desc
    desc=$(grep -E "^\s*\*\s+(E2E|测试链)" "$file" 2>/dev/null | head -1 | sed 's/^\s*\*\s*//')

    # 统计
    total_it=$((total_it + it_count))

    case "$tier" in
      L0)
        l0_files+=("$basename|$it_count|$desc")
        total_l0=$((total_l0 + 1))
        ;;
      L1)
        l1_files+=("$basename|$it_count|$desc")
        total_l1=$((total_l1 + 1))
        ;;
      L2)
        l2_files+=("$basename|$it_count|$desc")
        total_l2=$((total_l2 + 1))
        ;;
    esac
  done <<< "$files"

  # --- 输出 L0 ---
  echo -e "\n${RED}■ L0 — 生命线 ($total_l0条)${NC}"
  echo -e "${RED}  每次PR前执行${NC}"
  for entry in "${l0_files[@]}"; do
    IFS='|' read -r name icnt d <<< "$entry"
    echo -e "  ${RED}▶${NC} $name"
    echo -e "     it数: $icnt  |  ${d:-(无摘要)}"
  done

  # --- 输出 L1 ---
  echo -e "\n${YELLOW}■ L1 — 核心业务链 ($total_l1条)${NC}"
  echo -e "${YELLOW}  每日执行${NC}"
  for entry in "${l1_files[@]}"; do
    IFS='|' read -r name icnt d <<< "$entry"
    echo -e "  ${YELLOW}▶${NC} $name"
    echo -e "     it数: $icnt  |  ${d:-(无摘要)}"
  done

  # --- 输出 L2 ---
  echo -e "\n${GREEN}■ L2 — 全量链 ($total_l2条)${NC}"
  echo -e "${GREEN}  每周执行${NC}"
  for entry in "${l2_files[@]}"; do
    IFS='|' read -r name icnt d <<< "$entry"
    echo -e "  ${GREEN}▶${NC} $name"
    echo -e "     it数: $icnt  |  ${d:-(无摘要)}"
  done

  # --- 汇总 ---
  title "汇总"
  echo -e "  ${RED}L0: $total_l0/$((total_l0 + total_l1 + total_l2))${NC}  (${#l0_files[@]}条)"
  echo -e "  ${YELLOW}L1: $total_l1/$((total_l0 + total_l1 + total_l2))${NC}  (${#l1_files[@]}条)"
  echo -e "  ${GREEN}L2: $total_l2/$((total_l0 + total_l1 + total_l2))${NC}  (${#l2_files[@]}条)"
  echo -e "  总计:  $((total_l0 + total_l1 + total_l2)) 个文件, $total_it 个 it 用例"

  # 导出变量供其他函数使用
  export GRADED_L0_COUNT=$total_l0
  export GRADED_L1_COUNT=$total_l1
  export GRADED_L2_COUNT=$total_l2
  export GRADED_L0_FILES=("${l0_files[@]}")
  export GRADED_L1_FILES=("${l1_files[@]}")
  export GRADED_L2_FILES=("${l2_files[@]}")
}

# ============================================================================
# 函数: 按级别运行测试
# ============================================================================
run_by_tier() {
  local tier="$1"

  # 先扫一遍
  scan_and_grade > /dev/null 2>&1

  # 获取当前级别文件列表
  # 注意: 上面的 scan_and_grade 已经把分级打出来了, 但变量传递复杂
  # 我们直接在这里重新扫描构建列表
  local files
  files=$(ls "$E2E_DIR"/cross-module-e2e-*.test.ts 2>/dev/null | sort -t- -k5n)

  local selected
  selected=()
  while IFS= read -r file; do
    [[ -z "$file" || ! -f "$file" ]] && continue
    local ftier
    ftier=$(classify_file "$file")

    # 如果是 L0 要包括 L0+L1+L2, 如果是 L1 包括 L1+L2, 如果是 L2 只包括 L2
    case "$tier" in
      L0) [[ "$ftier" == "L0" ]] && selected+=("$file") ;;
      L1) [[ "$ftier" == "L1" || "$ftier" == "L0" ]] && selected+=("$file") ;;
      L2) selected+=("$file") ;;  # L2 = 全量
    esac
  done <<< "$files"

  if [[ ${#selected[@]} -eq 0 ]]; then
    warn "级别 $tier 没有匹配的测试文件"
    exit 0
  fi

  title "运行 $tier 测试 (${#selected[@]} 个文件)"

  local test_argv=()
  for f in "${selected[@]}"; do
    test_argv+=("$f")
  done

  echo -e "${CYAN}执行命令:${NC} npx vitest run --config vitest.config.ts ${test_argv[*]}"
  echo ""

  # 尝试查找 vitest config
  local vitest_config="$REPO_DIR/vitest.config.ts"
  if [[ ! -f "$vitest_config" ]]; then
    vitest_config="$REPO_DIR/vitest.config.js"
  fi
  if [[ ! -f "$vitest_config" ]]; then
    vitest_config="$REPO_DIR/vitest.config.mjs"
  fi
  if [[ ! -f "$vitest_config" ]]; then
    vitest_config="$REPO_DIR/apps/api/vitest.config.ts"
  fi

  if [[ -f "$vitest_config" ]]; then
    cd "$REPO_DIR" && npx vitest run --config "$vitest_config" "${test_argv[@]}" || {
      err "E2E 测试失败 (tier=$tier)"
      exit 1
    }
  else
    warn "未找到 vitest.config, 尝试直接运行..."
    cd "$REPO_DIR" && npx vitest run "${test_argv[@]}" || {
      err "E2E 测试失败 (tier=$tier)"
      exit 1
    }
  fi
}

# ============================================================================
# 函数: 校验一致性 (文档 vs 脚本)
# ============================================================================
verify_consistency() {
  title "校验一致性: docs/knowledge/e2e-tier-grading.md vs 脚本分级"

  if [[ ! -f "$DOC_FILE" ]]; then
    warn "文档 $DOC_FILE 不存在，跳过文档校验"
    return
  fi

  local issues=0
  local files
  files=$(ls "$E2E_DIR"/cross-module-e2e-*.test.ts 2>/dev/null | sort -t- -k5n)

  while IFS= read -r file; do
    [[ -z "$file" || ! -f "$file" ]] && continue

    local basename
    basename="$(basename "$file" .test.ts)"
    local script_tier
    script_tier=$(classify_file "$file")

    # 从文档的附录 7.2 文件列表表中查找该文件的级别
    # 匹配格式: | N | \`basename\` | **L0** | ... 或 | N | \`basename\` | L1 | ...
    local doc_tier
    doc_tier="?"

    # 尝试从附录 7.2 文件列表表精确匹配 (行中包含 basename + L0/L1/L2)
    # 格式: | N | \`basename\` | **L0** | N |  或  | N | \`basename\` | L1 | N |
    local table_line
    table_line=$(grep "$basename" "$DOC_FILE" 2>/dev/null \
      | grep -E '\|.*L[012].*\|' \
      | head -1)
    if [[ -n "$table_line" ]]; then
      if echo "$table_line" | grep -Eq '\*\*L0\*\*'; then
        doc_tier="L0"
      elif echo "$table_line" | grep -Eq '\*\*L1\*\*|\|\s*L1\s*\|'; then
        doc_tier="L1"
      elif echo "$table_line" | grep -Eq '\*\*L2\*\*|\|\s*L2\s*\|'; then
        doc_tier="L2"
      fi
    fi

    if [[ "$doc_tier" == "?" ]]; then
      warn "文档中未找到 $basename 的分级"
      issues=$((issues + 1))
      continue
    fi

    if [[ "$script_tier" != "$doc_tier" ]]; then
      err "不匹配: $basename | 脚本=$script_tier | 文档=$doc_tier"
      issues=$((issues + 1))
    fi
  done <<< "$files"

  if [[ $issues -eq 0 ]]; then
    ok "一致性校验通过 — 脚本与文档全匹配! ✅"
  else
    warn "发现 $issues 处不匹配, 请检查分级定义"
  fi
}

# ============================================================================
# 函数: 质量控制检查 (anti-pattern)
# ============================================================================
quality_check() {
  title "质量检查: 禁止模式扫描"

  local as_any_count=0
  local desc_skip_count=0
  local it_only_count=0

  while IFS= read -r file; do
    [[ -z "$file" || ! -f "$file" ]] && continue
    local bn
    bn="$(basename "$file")"

    local a
    a=$(grep -cE '\bas\b.*\bany\b' "$file" 2>/dev/null || true)
    a=${a:-0}; a=$((a+0))
    as_any_count=$((as_any_count + a))
    [ "$a" -gt 0 ] 2>/dev/null && err "$bn: 发现 $a 处 as any"

    local s
    s=$(grep -c 'describe\.skip' "$file" 2>/dev/null || true)
    s=${s:-0}; s=$((s+0))
    desc_skip_count=$((desc_skip_count + s))
    [ "$s" -gt 0 ] 2>/dev/null && err "$bn: 发现 $s 处 describe.skip"

    local o
    o=$(grep -c 'it\.only' "$file" 2>/dev/null || true)
    o=${o:-0}; o=$((o+0))
    it_only_count=$((it_only_count + o))
    [ "$o" -gt 0 ] 2>/dev/null && err "$bn: 发现 $o 处 it.only"
  done < <(ls "$E2E_DIR"/cross-module-e2e-*.test.ts 2>/dev/null)

  echo ""
  if [[ $as_any_count -eq 0 && $desc_skip_count -eq 0 && $it_only_count -eq 0 ]]; then
    ok "质量检查通过 — 未发现禁止模式 ✅"
  else
    warn "质量检查: as any=$as_any_count, describe.skip=$desc_skip_count, it.only=$it_only_count"
  fi
}

# ============================================================================
# 函数: 输出报表 (JSON)
# ============================================================================
report_json() {
  local files
  files=$(ls "$E2E_DIR"/cross-module-e2e-*.test.ts 2>/dev/null | sort -t- -k5n)

  echo "["
  local first=true
  while IFS= read -r file; do
    [[ -z "$file" || ! -f "$file" ]] && continue
    local basename it_count tier desc
    basename="$(basename "$file" .test.ts)"
    it_count=$(grep -cE "^\s*it\(" "$file" 2>/dev/null || echo 0)
    tier=$(classify_file "$file")
    desc=$(grep -E "^\s*\*\s+(E2E|测试链)" "$file" 2>/dev/null | head -1 | sed 's/^\s*\*\s*//')

    $first || echo ","
    first=false
    echo "  {"
    echo "    \"id\": \"$basename\","
    echo "    \"tier\": \"$tier\","
    echo "    \"tests\": $it_count,"
    echo "    \"description\": \"${desc:-(no description)}\""
    echo "  }"
  done <<< "$files"
  echo "]"
}

# ============================================================================
# 主流程
# ============================================================================
main() {
  local mode="scan"

  # 解析参数
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tier)
        shift
        if [[ "$1" != "L0" && "$1" != "L1" && "$1" != "L2" ]]; then
          err "无效级别: $1 (支持 L0|L1|L2)"
          exit 1
        fi
        export RUN_TIER="$1"
        mode="run"
        shift
        ;;
      --list)
        mode="list"
        shift
        ;;
      --verify)
        mode="verify"
        shift
        ;;
      --quality|-q)
        mode="quality"
        shift
        ;;
      --json|-j)
        mode="json"
        shift
        ;;
      --help|-h)
        echo "用法: bash scripts/e2e-tier-check.sh [选项]"
        echo ""
        echo "选项:"
        echo "  --tier L0|L1|L2   按级别运行测试 (L0=5条生命线, L1=26条核心, L2=全量58条)"
        echo "  --list             列出分级明细"
        echo "  --verify           校验文档 vs 脚本分级一致性"
        echo "  --quality, -q      质量检查 (as any / describe.skip / it.only)"
        echo "  --json, -j         输出 JSON 报表"
        echo "  --help, -h         显示帮助"
        exit 0
        ;;
      *)
        err "未知参数: $1 (使用 --help 查看帮助)"
        exit 1
        ;;
    esac
  done

  case "$mode" in
    list)   scan_and_grade ;;
    verify) scan_and_grade > /dev/null 2>&1; verify_consistency ;;
    quality) quality_check ;;
    json)   report_json ;;
    run)
      if [[ -n "${RUN_TIER:-}" ]]; then
        run_by_tier "$RUN_TIER"
      fi
      ;;
    scan)
      scan_and_grade
      verify_consistency
      quality_check
      ;;
  esac
}

# 执行
main "$@"
