#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 快速启动压测
# 用法: bash scripts/run-load-test.sh
# 前置: 安装 k6 (brew install k6 或 https://k6.io/docs/get-started/installation/)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

if ! command -v k6 &>/dev/null; then
  echo -e "${YELLOW}k6 未安装。请先安装: brew install k6${NC}"
  echo "或者访问 https://k6.io/docs/get-started/installation/"
  exit 1
fi

BASE_URL="${1:-https://api.sportsant.net}"
echo -e "${GREEN}🚀 神机营 SaaS 压测${NC}"
echo "  目标: $BASE_URL"
echo "  并发: 10 VUs"
echo "  时长: 30s"
echo ""

k6 run \
  -e BASE_URL="$BASE_URL" \
  -e VUS=10 \
  -e DURATION=30s \
  -e RAMP_UP=5s \
  scripts/load-test.js

echo ""
echo -e "${GREEN}✅ 压测完成。详细结果: load-test-results.json${NC}"
