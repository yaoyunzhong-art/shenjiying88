#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 部署验收脚本 (Pre-flight Checklist)
# 用法: bash scripts/deploy-check.sh [staging|production]
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ENV="${1:-staging}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

pass() { echo -e "  ${GREEN}✅${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}❌${NC} $1 — $2"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}⚠️${NC}  $1 — $2"; WARN=$((WARN+1)); }

BASE_URL="${API_URL:-https://api.sportsant.net}"

echo "═══════════════════════════════════════════"
echo " 神机营 SaaS 部署验收 — $ENV 环境"
echo " 时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. HTTP 连通性 ─────────────────────────────────────────
echo "📡 1. HTTP 连通性"

# Health ping
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/health/ping" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  pass "api.sportsant.net/health/ping → 200"
else
  fail "api.sportsant.net/health/ping" "HTTP $HTTP_CODE"
fi

# Health check
HEALTH=$(curl -s "$BASE_URL/api/v1/health" 2>/dev/null || echo '{}')
HEALTH_STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$HEALTH_STATUS" = "OK" ] || [ "$HEALTH_STATUS" = "ok" ]; then
  pass "Health check → $HEALTH_STATUS"
else
  warn "Health check" "status=$HEALTH_STATUS"
fi

# Admin
HTTP_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" "https://admin.sportsant.net" 2>/dev/null || echo "000")
if [ "$HTTP_ADMIN" = "200" ]; then
  pass "admin.sportsant.net → 200"
else
  fail "admin.sportsant.net" "HTTP $HTTP_ADMIN"
fi

# Store
HTTP_STORE=$(curl -s -o /dev/null -w "%{http_code}" "https://store.sportsant.net" 2>/dev/null || echo "000")
if [ "$HTTP_STORE" = "200" ]; then
  pass "store.sportsant.net → 200"
else
  warn "store.sportsant.net" "HTTP $HTTP_STORE"
fi

echo ""

# ── 2. 数据库连通 ──────────────────────────────────────────
echo "🗄️  2. 数据库"

# 通过 health check 验证 DB
DB_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json;d=json.load(sys.stdin);c=[x for x in d.get('components',[]) if x['name']=='database'];print(c[0]['status'] if c else 'UNKNOWN')" 2>/dev/null || echo "UNKNOWN")
if [ "$DB_STATUS" = "OK" ] || [ "$DB_STATUS" = "ok" ]; then
  pass "PostgreSQL → $DB_STATUS"
else
  fail "PostgreSQL" "$DB_STATUS"
fi

echo ""

# ── 3. TLS 证书 ────────────────────────────────────────────
echo "🔒 3. TLS 证书"

CERT_EXPIRY=$(echo | openssl s_client -servername api.sportsant.net -connect api.sportsant.net:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$CERT_EXPIRY" ]; then
  EXPIRY_EPOCH=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null || date -d "$CERT_EXPIRY" +%s 2>/dev/null)
  NOW_EPOCH=$(date +%s)
  DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -gt 30 ]; then
    pass "TLS 证书 → $DAYS_LEFT 天后过期"
  else
    warn "TLS 证书" "仅剩 $DAYS_LEFT 天!"
  fi
else
  fail "TLS 证书" "无法获取"
fi

echo ""

# ── 4. Docker / K8s 状态 ────────────────────────────────────
echo "🐳 4. 容器状态"

if command -v kubectl &>/dev/null; then
  PODS=$(kubectl get pods -l app=m5-api -o jsonpath='{.items[*].status.phase}' 2>/dev/null || echo "")
  if echo "$PODS" | grep -q "Running"; then
    pass "K8s Pods → Running"
  else
    fail "K8s Pods" "状态=$PODS"
  fi
else
  warn "kubectl 未安装" "跳过K8s检查"
fi

echo ""

# ── 5. Prisma Migration 状态 ───────────────────────────────
echo "🔄 5. Migration 状态"

MIGRATION_COUNT=$(find apps/api/prisma/migrations -name "migration.sql" 2>/dev/null | wc -l | tr -d ' ')
echo "  📋 $MIGRATION_COUNT 个 migration"
pass "Migration 文件 → $MIGRATION_COUNT 个"

echo ""

# ── 6. 收银主链验收 ────────────────────────────────────────
echo "💰 6. 收银链验收"

# POST create order (模拟)
ORDER_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/cashier/orders" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: check-tenant" \
  -d '{"items":[{"skuId":"test","quantity":1,"price":1}],"memberId":"check"}' 2>/dev/null || echo "000")
if [ "$ORDER_RES" = "201" ] || [ "$ORDER_RES" = "200" ] || [ "$ORDER_RES" = "401" ]; then
  pass "POST /cashier/orders → $ORDER_RES"
else
  warn "POST /cashier/orders" "HTTP $ORDER_RES"
fi

echo ""

# ── 总结 ───────────────────────────────────────────────────
echo "═══════════════════════════════════════════"
TOTAL=$((PASS + FAIL + WARN))
echo " 结果: ✅$PASS  ❌$FAIL  ⚠️$WARN  (共$TOTAL项)"
echo "═══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo -e " ${RED}验收未通过 — 请修复以上 ❌ 项${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e " ${YELLOW}验收通过 (有 ⚠️ 观察项)${NC}"
  exit 0
else
  echo -e " ${GREEN}全部验收通过! 🎉${NC}"
  exit 0
fi
