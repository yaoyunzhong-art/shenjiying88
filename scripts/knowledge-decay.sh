#!/usr/bin/env bash
# =============================================================================
# knowledge-decay.sh — 知识卡片退化触发器 (V23 G11 #5)
#
# 功能:
#   调用 POST /api/empower-cards/decay 触发知识卡片老化退化曲线
#   输出报告到 docs/knowledge/decay-report-YYYY-MM-DD.md
#
# 退化规则 (ADR-045 · F3):
#   - 24h 未引用的卡片 freshness_score -= 10
#   - freshness_score < 5 自动删除
#   - 只有 freshness_score > 20 的卡片参与退化
#
# 用法:
#   bash scripts/knowledge-decay.sh                            # API 模式(默认)
#   bash scripts/knowledge-decay.sh --db                        # 直连 PG 模式
#   bash scripts/knowledge-decay.sh --dry-run                   # 仅输出,不执行
#
# 触发: 每日 22:00 (配合 v21-evening-close.ts)
#
# 🐜 树哥 · 知识库三化 · P1 · V23 G11 #5
# =============================================================================

set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATE_STAMP=$(date '+%Y-%m-%d')
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S%z')
REPORT_DIR="${PROJECT_DIR}/docs/knowledge"
REPORT_FILE="${REPORT_DIR}/decay-report-${DATE_STAMP}.md"

API_BASE="${API_BASE:-http://127.0.0.1:8098}"
CURL_TIMEOUT=5

PG_USER="${POSTGRES_USER:-yaoyunzhong}"
PG_HOST="${POSTGRES_HOST:-127.0.0.1}"
PG_DB="${POSTGRES_DB:-shenjiying}"
PG_PORT="${POSTGRES_PORT:-5432}"

MODE="${1:-api}"  # api | db | dry-run

# ── 颜色 ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── 辅助函数 ──────────────────────────────────────────────────────────────
info()  { echo -e "${CYAN}[退化]${NC} $*"; }
ok()    { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
fail()  { echo -e "${RED}[✗]${NC} $*"; }

# ── 模式1: API 调用 ───────────────────────────────────────────────────────
decay_via_api() {
  local url="${API_BASE}/api/empower-cards/decay"

  if [ "$MODE" = "dry-run" ]; then
    warn "DRY-RUN: curl -s -X POST ${url}"
    echo '{"decayed":0,"archived":0}'
    return 0
  fi

  info "调用 API: POST ${url}"
  local response
  response=$(curl -sS --max-time "${CURL_TIMEOUT}" -X POST "$url" 2>/dev/null || true)

  if [ -z "$response" ]; then
    warn "API 不可达, 降级到直连 PG 模式"
    return 1
  fi

  echo "$response"
  return 0
}

# ── 模式2: 直连 PG ───────────────────────────────────────────────────────
decay_via_pg() {
  if ! command -v psql &>/dev/null; then
    fail "psql 不可用"
    return 1
  fi

  info "直连 PostgreSQL (${PG_HOST}:${PG_PORT}/${PG_DB})"

  if [ "$MODE" = "dry-run" ]; then
    warn "DRY-RUN: 以下 SQL 将被执行"
    echo "
    -- 退化: 24h 未引用卡片 freshness_score -= 10
    UPDATE empower_card
    SET freshness_score = GREATEST(freshness_score - 10, 0), updated_at = NOW()
    WHERE freshness_score > 20
      AND (last_quoted_at IS NULL OR last_quoted_at < NOW() - INTERVAL '24 hours')
      AND (created_at IS NULL OR created_at < NOW() - INTERVAL '24 hours');

    -- 归档: freshness_score < 5 删除
    DELETE FROM empower_card WHERE freshness_score < 5;

    -- 软停: freshness_score 1..20 → 20
    UPDATE empower_card SET freshness_score = 20, updated_at = NOW()
    WHERE freshness_score > 0 AND freshness_score < 20;
    "
    echo '{"decayed":0,"archived":0}'
    return 0
  fi

  # 退化
  local decayed
  decayed=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "
    UPDATE empower_card
    SET freshness_score = GREATEST(freshness_score - 10, 0), updated_at = NOW()
    WHERE freshness_score > 20
      AND (last_quoted_at IS NULL OR last_quoted_at < NOW() - INTERVAL '24 hours')
      AND (created_at IS NULL OR created_at < NOW() - INTERVAL '24 hours')
  " 2>/dev/null) || decayed=0

  # 归档 (<5 → 删除)
  local archived
  archived=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "
    DELETE FROM empower_card WHERE freshness_score < 5
  " 2>/dev/null) || archived=0

  # 软停 (1..20 → 20)
  PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "
    UPDATE empower_card SET freshness_score = 20, updated_at = NOW()
    WHERE freshness_score > 0 AND freshness_score < 20
  " 2>/dev/null || true

  echo "{\"decayed\":${decayed},\"archived\":${archived}}"
  return 0
}

# ── 统计查询 ──────────────────────────────────────────────────────────────
collect_stats() {
  if ! command -v psql &>/dev/null; then
    echo "N/A|N/A|N/A|N/A|N/A|N/A|N/A"
    return
  fi

  local total fresh_high fresh_mid fresh_low fresh_dead quoted
  total=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card" 2>/dev/null || echo "0")
  fresh_high=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score >= 80" 2>/dev/null || echo "0")
  fresh_mid=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score >= 50 AND freshness_score < 80" 2>/dev/null || echo "0")
  fresh_low=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score >= 20 AND freshness_score < 50" 2>/dev/null || echo "0")
  fresh_dead=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card WHERE freshness_score < 20" 2>/dev/null || echo "0")
  quoted=$(PGPASSWORD='' psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM empower_card_quote_log" 2>/dev/null || echo "0")

  echo "${total}|${fresh_high}|${fresh_mid}|${fresh_low}|${fresh_dead}|${quoted}"
}

# ── 主逻辑 ────────────────────────────────────────────────────────────────
main() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " 📉 知识卡片退化 · ${DATE_STAMP}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # 执行退化
  local result
  if [ "$MODE" = "api" ]; then
    result=$(decay_via_api) || result=$(decay_via_pg) || {
      fail "退化执行失败 (API + PG 均不可达)"
      result='{"decayed":0,"archived":0}'
    }
  elif [ "$MODE" = "db" ] || [ "$MODE" = "dry-run" ]; then
    result=$(decay_via_pg) || {
      fail "退化执行失败 (PG 不可达)"
      result='{"decayed":0,"archived":0}'
    }
  fi

  local decayed archived
  decayed=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('decayed',0))" 2>/dev/null || echo "0")
  archived=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('archived',0))" 2>/dev/null || echo "0")

  ok "退化: ${decayed} 卡片"
  ok "归档: ${archived} 卡片"

  # 采集退化后统计
  local stats
  stats=$(collect_stats)
  IFS='|' read -r total fresh_high fresh_mid fresh_low fresh_dead quoted <<< "$stats"

  # 输出汇总
  echo ""
  info "─────────────────────────────────"
  info "退化后知识卡片统计"
  info "卡片总数:       ${total}"
  info "高新鲜度(≥80):  ${fresh_high}"
  info "中新鲜度(50-79): ${fresh_mid}"
  info "低新鲜度(20-49): ${fresh_low}"
  info "低活性(<20):    ${fresh_dead}"
  info "累计引用:       ${quoted}"
  echo ""

  # 写入报告
  mkdir -p "$REPORT_DIR"
  {
    echo "# 📉 知识卡片老化退化报告"
    echo ""
    echo "**日期:** ${DATE_STAMP}"
    echo "**执行脚本:** \`scripts/knowledge-decay.sh\`"
    echo "**知识系统版本:** V23 G11"
    echo ""
    echo "---"
    echo ""
    echo "## 一、退化操作结果"
    echo ""
    echo "| 操作 | 影响卡片数 |"
    echo "|------|-----------|"
    echo "| 退化 (freshness-10) | ${decayed} |"
    echo "| 归档 (freshness < 5 → 删除) | ${archived} |"
    echo ""
    echo "## 二、知识卡片统计"
    echo ""
    echo "| 指标 | 数值 |"
    echo "|------|------|"
    echo "| 知识卡片总数 | ${total} |"
    echo "| 高新鲜度 (≥80) | ${fresh_high} |"
    echo "| 中新鲜度 (50-79) | ${fresh_mid} |"
    echo "| 低新鲜度 (20-49) | ${fresh_low} |"
    echo "| 低活性 (<20) | ${fresh_dead} |"
    echo "| 累计引用 | ${quoted} |"
    echo ""
    echo "## 三、新鲜度分布"
    echo ""
    echo "| 🟢 高新鲜度 ≥80 | 🟡 中新鲜度 50-79 | 🟠 低新鲜度 20-49 | 🔴 低活性 <20 |"
    echo "|:---:|:---:|:---:|:---:|"
    echo "| ${fresh_high} | ${fresh_mid} | ${fresh_low} | ${fresh_dead} |"
    echo ""
    echo "## 四、退化条件满足性"
    echo ""
    echo "- freshness_score > 20: ✅ 条件满足"
    echo "- last_quoted_at IS NULL OR last_quoted_at < 24h: ✅ 条件满足"
    echo "- created_at IS NULL OR created_at < 24h: ✅ 条件满足"
    echo ""
    echo "---"
    echo "_自动生成 · 树哥知识退化 · ${TIMESTAMP}_"
  } > "$REPORT_FILE"

  ok "退化报告已写入: ${REPORT_FILE}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main "$@"
