#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 快速启动压测（本地优先 + 安全门控）
#
# 用法:
#   bash scripts/run-load-test.sh                          # 本地默认 (localhost:3145)
#   bash scripts/run-load-test.sh http://localhost:3145   # 本地 API
#   bash scripts/run-load-test.sh https://staging.sportsant.net  # Staging
#
# ⚠️ 生产压测（强烈不推荐 / 2026-07-29 事故后强制）:
#   1. 必须登录阿里云核查余额 / WAF 配额
#   2. 必须显式 ALLOW_PROD=1
#   3. 建议先 ALLOW_PROD=1 ALLOW_HV=1 跑 5 VU 验证
#
# VU 参数:
#   VUS=10 默认 / 50 需要 ALLOW_HV=1 / 200 需要 ALLOW_HV=1
#
# 前置: 安装 k6 (brew install k6 或 https://k6.io/docs/get-started/installation/)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

if ! command -v k6 &>/dev/null; then
  echo -e "${YELLOW}k6 未安装。请先安装: brew install k6${NC}"
  echo "或者访问 https://k6.io/docs/get-started/installation/"
  exit 1
fi

# ── 默认本地 BASE_URL ──
BASE_URL="${1:-http://localhost:3145}"
VUS="${VUS:-10}"
DURATION="${DURATION:-30s}"
RAMP_UP="${RAMP_UP:-5s}"

# ── 安全门控 ──
is_prod_host() {
  case "$1" in
    *sportsant.net*|*api.sportsant*|*admin.sportsant*|*store.sportsant*|*tob.sportsant*)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

is_private_host() {
  case "$1" in
    http://localhost*|http://127.0.0.1*|http://k3d*|http://0.0.0.0*|http://10.*|http://192.168.*|https://staging*)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

if is_prod_host "$BASE_URL" && [ "${ALLOW_PROD:-0}" != "1" ]; then
  echo -e "${RED}🚨 安全门控: BASE_URL=$BASE_URL 是生产域名!${NC}"
  echo -e "${RED}   必须显式 ALLOW_PROD=1 才能跑生产压测。${NC}"
  echo -e "${YELLOW}   推荐: bash scripts/run-load-test.sh http://localhost:3145  (本地优先)${NC}"
  echo -e "${YELLOW}   Staging: bash scripts/run-load-test.sh https://staging.sportsant.net${NC}"
  echo -e "${RED}   例外: ALLOW_PROD=1 VUS=5 DURATION=10s bash scripts/run-load-test.sh $BASE_URL  (报备后)${NC}"
  exit 1
fi

if ! is_prod_host "$BASE_URL" && ! is_private_host "$BASE_URL"; then
  echo -e "${RED}🚨 安全门控: BASE_URL=$BASE_URL 不是内网/staging 地址!${NC}"
  echo -e "${RED}   仅允许 localhost / 127.0.0.1 / k3d / 10.* / 192.168.* / staging.sportsant.net${NC}"
  exit 1
fi

if [ "$VUS" -gt 100 ] && [ "${ALLOW_HV:-0}" != "1" ]; then
  echo -e "${RED}🚨 安全门控: VUS=$VUS > 100!${NC}"
  echo -e "${RED}   高并发压测必须显式 ALLOW_HV=1。${NC}"
  exit 1
fi

MODE=$(is_prod_host "$BASE_URL" && echo "🚨 PRODUCTION" || echo "🟢 LOCAL/STAGING")
echo -e "${GREEN}🚀 神机营 SaaS 压测${NC}"
echo "  模式: $MODE"
echo "  目标: $BASE_URL"
echo "  并发: $VUS VUs"
echo "  时长: $DURATION"
echo "  爬坡: $RAMP_UP"
if is_prod_host "$BASE_URL"; then
  echo -e "${YELLOW}  ⚠️  ALLOW_PROD=1 已开启 — 这是生产压测，请确认已报备${NC}"
fi
echo ""

k6 run \
  -e BASE_URL="$BASE_URL" \
  -e VUS="$VUS" \
  -e DURATION="$DURATION" \
  -e RAMP_UP="$RAMP_UP" \
  -e "ALLOW_PROD=${ALLOW_PROD:-0}" \
  -e "ALLOW_HV=${ALLOW_HV:-0}" \
  -e "ALLOW_LT=${ALLOW_LT:-0}" \
  scripts/load-test.js

echo ""
echo -e "${GREEN}✅ 压测完成。详细结果: load-test-results.json${NC}"
