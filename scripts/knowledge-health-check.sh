#!/usr/bin/env bash
# =============================================================================
# knowledge-health-check.sh — 知识仪表盘存活监控 (V23 G11)
#
# 功能:
#   1. 探测知识仪表盘 (http://127.0.0.1:8098) 是否存活
#   2. 探测知识 API 健康端点 (http://127.0.0.1:3000/api/v1/empower-cards/health) 是否可达
#   3. 输出日采可观测性报告 docs/knowledge/knowledge-health-YYYY-MM-DD.md
#
# 用法:
#   ./scripts/knowledge-health-check.sh
#   ./scripts/knowledge-health-check.sh --once   仅输出到 stdout, 不写文件
#
# V23 §G11-条件#2: 知识API存活监控 (health check端点 + 日采可观测性)
# =============================================================================

set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────
KNOWLEDGE_DASHBOARD_URL="http://127.0.0.1:8098"
KNOWLEDGE_API_HEALTH_URL="http://127.0.0.1:3000/api/v1/empower-cards/health"
CURL_TIMEOUT=5
DATE_STR=$(date +%Y-%m-%d)
DATE_FILE=$(date +%Y-%m-%d)
REPORT_DIR="${PROJECT_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}/docs/knowledge"
REPORT_FILE="${REPORT_DIR}/knowledge-health-${DATE_FILE}.md"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── 颜色 ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── 辅助函数 ──────────────────────────────────────────────────────────────

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
pass()  { echo -e "${GREEN}[PASS]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }

check_dashboard() {
  local url="$1"
  local label="$2"

  if curl -sS --max-time "${CURL_TIMEOUT}" -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -qE '^[2-3]'; then
    pass "${label} — 可达 (${url})"
    return 0
  else
    warn "${label} — 不可达 (${url})"
    return 1
  fi
}

check_api_health() {
  local url="$1"
  local label="$2"

  local response
  response=$(curl -sS --max-time "${CURL_TIMEOUT}" "$url" 2>/dev/null || true)

  if [ -z "$response" ]; then
    warn "${label} — 无响应 (${url})"
    return 1
  fi

  # 尝试解析 JSON
  local status_val
  status_val=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "parse-fail")

  if [ "$status_val" = "ok" ]; then
    pass "${label} — status=ok (${url})"
    echo "$response"
    return 0
  elif [ "$status_val" = "degraded" ]; then
    warn "${label} — status=degraded (${url})"
    echo "$response"
    return 1
  elif [ "$status_val" = "down" ]; then
    fail "${label} — status=down (${url})"
    echo "$response"
    return 1
  else
    warn "${label} — 解析失败或异常状态 (${url})"
    echo "$response"
    return 1
  fi
}

# ── 主流程 ─────────────────────────────────────────────────────────────────

main() {
  local once_mode=false
  if [ "${1:-}" = "--once" ]; then
    once_mode=true
  fi

  info "知识仪表盘存活监控 — ${DATE_STR}"
  echo ""

  local dashboard_pass=true
  local api_pass=true
  local api_response=""

  # 1) 探测知识仪表盘
  info "探针 #1: 知识仪表盘"
  echo "  URL: ${KNOWLEDGE_DASHBOARD_URL}"
  if ! check_dashboard "$KNOWLEDGE_DASHBOARD_URL" "知识仪表盘"; then
    dashboard_pass=false
  fi
  echo ""

  # 2) 探测知识 API 健康端点
  info "探针 #2: 知识 API 健康端点"
  echo "  URL: ${KNOWLEDGE_API_HEALTH_URL}"
  local health_output
  health_output=$(check_api_health "$KNOWLEDGE_API_HEALTH_URL" "知识API健康端点" 2>&1) || true
  api_response=$(echo "$health_output" | tail -1)
  if echo "$health_output" | grep -qE '^\[PASS\]'; then
    api_pass=true
  else
    api_pass=false
  fi
  echo ""

  # 3) 整体判定
  local overall_status="PASS"
  local checks_passed=2
  if [ "$dashboard_pass" = false ]; then
    overall_status="WARN"
    checks_passed=$((checks_passed - 1))
  fi
  if [ "$api_pass" = false ]; then
    overall_status="WARN"
    checks_passed=$((checks_passed - 1))
  fi
  if [ "$checks_passed" -eq 0 ]; then
    overall_status="FAIL"
  fi

  echo "───────────────────────────────────────────"
  case "$overall_status" in
    PASS) pass "整体: ${overall_status} (${checks_passed}/2 通过)" ;;
    WARN) warn "整体: ${overall_status} (${checks_passed}/2 通过)" ;;
    FAIL) fail "整体: ${overall_status} (${checks_passed}/2 通过)" ;;
  esac

  # ── 日采报告 ────────────────────────────────────
  if [ "$once_mode" = true ]; then
    return 0
  fi

  mkdir -p "$REPORT_DIR"

  cat > "$REPORT_FILE" <<REPORT
# 知识仪表盘存活报告 — ${DATE_STR}

> 自动检测时间: $(date '+%Y-%m-%d %H:%M:%S %Z')
> 来源: scripts/knowledge-health-check.sh (V23 G11 条件#2)

## 探针结果

| 探针 | 端点 | 状态 |
|:-----|:-----|:-----|
| 知识仪表盘 | \`${KNOWLEDGE_DASHBOARD_URL}\` | $([ "$dashboard_pass" = true ] && echo "✅ PASS" || echo "⚠️ WARN") |
| 知识API健康 | \`${KNOWLEDGE_API_HEALTH_URL}\` | $([ "$api_pass" = true ] && echo "✅ PASS" || echo "⚠️ WARN") |

## 整体判定

- **结果**: **${overall_status}** ($([ "$checks_passed" -eq 2 ] && echo "全部通过" || echo "部分异常"))
- **通过**: ${checks_passed}/2

## API 健康响应

\`\`\`json
${api_response:-无响应}
\`\`\`

## 备注

- 本报告由 \`scripts/knowledge-health-check.sh\` 自动生成
- 知识仪表盘端口 \`8098\` 由知识仪表盘服务监听
- 知识 API 健康端点挂载于 \`/api/empower-cards/health\`
- V23 G11 审计条件 #2: 知识API存活监控 (health check + 日采可观测性)
REPORT

  info "日采报告已写入: ${REPORT_FILE}"
  echo ""
  cat "$REPORT_FILE"
}

main "$@"
