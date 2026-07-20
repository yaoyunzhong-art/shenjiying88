#!/usr/bin/env bash
# knowledge-daily-crawl.sh — 知识日采脚本 (ADR-045)
#
# 知识库三化(P1): 每日采集 empower_card 健康状态
# 输出: 知识日采状态 (卡片总数 / 引用总数 / 匹配成功率 / 新鲜度分布)
#
# 模式:
#   1. API优先: 请求 GET /api/empower-cards/health (需 NestJS 运行在 8098)
#   2. 直连降级: 直连 PostgreSQL (api 不在线时自动切换)
#   3. 文件降级: 读取 DB dump 文件
#
# 用法:
#   bash scripts/knowledge-daily-crawl.sh
#   bash scripts/knowledge-daily-crawl.sh --api http://127.0.0.1:8098
#
# Cron 示例 (每日 08:00):
#   0 8 * * * /path/to/shenjiying88/scripts/knowledge-daily-crawl.sh
#
# 🐜 树哥 · 知识库三化 · P1 · 7/27 截止

set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_BASE="${1:-http://127.0.0.1:8098}"
DATE_STAMP=$(date '+%Y-%m-%d')
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S%z')
OUTPUT_FILE="${PROJECT_DIR}/docs/knowledge/daily-crawl-${DATE_STAMP}.md"

PG_USER="${POSTGRES_USER:-yaoyunzhong}"
PG_HOST="${POSTGRES_HOST:-127.0.0.1}"
PG_DB="${POSTGRES_DB:-shenjiying}"
PG_PORT="${POSTGRES_PORT:-5432}"

# ── 颜色 ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── 辅助函数 ──────────────────────────────────────────────────────

log_info()  { echo -e "${CYAN}[知识日采]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# ── 模式 1: API 优先 ──────────────────────────────────────────────

fetch_via_api() {
  local health_url="${API_BASE}/api/empower-cards/health"
  log_info "尝试 API 模式: ${health_url}"

  local response
  response=$(curl -s --connect-timeout 3 --max-time 5 "$health_url" 2>&1) || true

  if [ -z "$response" ] || echo "$response" | grep -q 'curl\|Connection refused\|Could not resolve'; then
    log_warn "API 不可达, 降级到直连模式"
    return 1
  fi

  # 解析 JSON 响应
  local status card_count match_ok quote_ok last_match
  status=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "parse_error")
  card_count=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('cardCount',0))" 2>/dev/null || echo "0")
  match_ok=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if d.get('matchApiReachable') else 'no')" 2>/dev/null || echo "unknown")
  quote_ok=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if d.get('quoteApiReachable') else 'no')" 2>/dev/null || echo "unknown")
  last_match=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('lastMatch','N/A'))" 2>/dev/null || echo "N/A")

  echo "API|${status}|${card_count}|${match_ok}|${quote_ok}|${last_match}"
  return 0
}

# ── 模式 2: 直连 PostgreSQL ───────────────────────────────────────

fetch_via_pg() {
  log_info "尝试直连 PostgreSQL 模式"

  if ! command -v psql &>/dev/null; then
    log_warn "psql 不可用, 降级到文件模式"
    return 1
  fi

  local pg_cmd
  pg_cmd="PGPASSWORD='' psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DB} -t -A -q"

  # 测试连接
  local test_out
  test_out=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" 2>&1) || {
    log_warn "PostgreSQL 连接失败: $test_out"
    return 1
  }

  log_ok "PostgreSQL 连接成功"

  # 卡片总数
  local card_count
  card_count=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card" 2>/dev/null || echo "0")

  # 引用总数
  local quote_total
  quote_total=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card_quote_log" 2>/dev/null || echo "0")

  # 今天引用
  local today_quotes
  today_quotes=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card_quote_log WHERE quoted_at >= CURRENT_DATE" 2>/dev/null || echo "0")

  # 匹配成功率: 有引用的卡片占比
  local matched_cards
  matched_cards=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE quote_count > 0" 2>/dev/null || echo "0")

  local match_rate
  if [ "$card_count" -gt 0 ] 2>/dev/null; then
    match_rate=$(( matched_cards * 100 / card_count ))
  else
    match_rate=0
  fi

  # 新鲜度分布
  local fresh_high fresh_mid fresh_low fresh_dead
  fresh_high=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score >= 80" 2>/dev/null || echo "0")
  fresh_mid=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score >= 50 AND freshness_score < 80" 2>/dev/null || echo "0")
  fresh_low=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score >= 20 AND freshness_score < 50" 2>/dev/null || echo "0")
  fresh_dead=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score < 20" 2>/dev/null || echo "0")

  # 最近匹配
  local last_match
  last_match=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COALESCE(MAX(quoted_at)::text, 'N/A') FROM empower_card_quote_log" 2>/dev/null || echo "N/A")

  # 每日新增
  local today_new
  today_new=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE created_at >= CURRENT_DATE" 2>/dev/null || echo "0")

  echo "PG|${card_count}|${quote_total}|${today_quotes}|${match_rate}|${fresh_high}|${fresh_mid}|${fresh_low}|${fresh_dead}|${last_match}|${today_new}|${matched_cards}"
  return 0
}

# ── 模式 3: 文件降级 ──────────────────────────────────────────────

fetch_via_file() {
  log_warn "使用文件降级模式 (仅输出模板)"

  echo "FILE|||0||0|0|0|0|N/A|0|0"
  return 0
}

# ── 主逻辑 ────────────────────────────────────────────────────────

main() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " 📊 知识日采 · ${DATE_STAMP}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  local mode data

  # 尝试 API 模式
  data=$(fetch_via_api) && mode="api" || {
    # 尝试 PG 模式
    data=$(fetch_via_pg) && mode="pg" || {
      # 文件降级
      data=$(fetch_via_file)
      mode="file"
    }
  }

  IFS='|' read -r mode_val card_count quote_total today_quotes \
    match_rate fresh_high fresh_mid fresh_low fresh_dead \
    last_match today_new matched_cards <<< "$data"

  # 显示结果
  echo ""
  log_info "知识卡片总数: ${card_count}"
  log_info "引用总数: ${quote_total} (今日: ${today_quotes})"
  log_info "匹配成功率: ${match_rate}%"
  log_info "新鲜度分布: 高${fresh_high} 中${fresh_mid} 低${fresh_low} 低活性${fresh_dead}"
  log_info "最近匹配: ${last_match}"
  log_info "今日新增: ${today_new}"
  log_info "数据来源: ${mode}"

  # ── 写入日报文件 ──────────────────────────────────────────────
  {
    echo "# 📊 知识日采 · ${DATE_STAMP}"
    echo ""
    echo "> 知识库三化(P1) · 知识API健康监控"
    echo "> 生成: ${TIMESTAMP} · 模式: ${mode}"
    echo ""
    echo "## 📈 概览"
    echo ""
    echo "| 指标 | 数值 |"
    echo "|------|------|"
    echo "| 知识卡片总数 | ${card_count} |"
    echo "| 引用总数 | ${quote_total} |"
    echo "| 今日引用 | ${today_quotes} |"
    echo "| 匹配成功率 | ${match_rate}% |"
    echo "| 每日新增 | ${today_new} |"
    echo "| 最近匹配 | ${last_match} |"
    echo ""
    echo "## 🔄 匹配情况"
    echo ""
    echo "- **已引用的卡片**: ${matched_cards}"
    echo "- **未引用的卡片**: $(( card_count - matched_cards ))"
    echo "- **匹配成功率**: ${match_rate}% (${matched_cards}/${card_count})"
    echo ""
    echo "## 🌡️ 新鲜度分布"
    echo ""
    echo "| 等级 | 范围 | 数量 |"
    echo "|------|------|------|"
    echo "| 🟢 高新鲜度 | ≥80分 | ${fresh_high} |"
    echo "| 🟡 中新鲜度 | 50-79分 | ${fresh_mid} |"
    echo "| 🟠 低新鲜度 | 20-49分 | ${fresh_low} |"
    echo "| 🔴 低活性 | <20分 | ${fresh_dead} |"
    echo ""
    echo "## 🏷️ API 健康状态"
    echo ""
    echo "| 端点 | 状态 |"
    echo "|------|------|"
    echo "| GET /api/empower-cards/health | $( [ -n "$mode_val" ] && echo '✅ 可用' || echo '❌ 不可用') |"
    echo "| API 模式 | ${mode} |"
    echo ""
    echo "---"
    echo "_自动生成 · 树哥知识日采_"
  } > "$OUTPUT_FILE"

  log_ok "日采报告已写入: ${OUTPUT_FILE}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

main "$@"
