#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 阿里云恢复后放量剧本 (Day 5 一次性)
#
# 2026-07-29 23:30 编制
# 用途: 阿里云账户充值后, NLB listener 重建后, 一键放量
#
# 用法: bash scripts/post-recovery-cutover.sh [--execute]
#  --execute: 真正推镜像 + kubectl apply (默认 dry-run)
#
# 前置:
#   1. 阿里云账户已充值
#   2. SLB FinancialLocked 已解除
#   3. NLB Inactive 已 Active + listener 已重建
#   4. K8s API 47.98.47.157:6443 已通
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

REGION="cn-hangzhou"
CLUSTER_ID="c3df2dbc1188143aa86de3bc47335e063"
DOMAINS=(api.sportsant.net admin.sportsant.net store.sportsant.net tob.sportsant.net)
EXECUTE="${1:-}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 神机营 · 阿里云恢复后放量剧本 ($(date '+%Y-%m-%d %H:%M:%S'))${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ -z "$EXECUTE" ]; then
  echo -e "${YELLOW}⚠️ DRY-RUN 模式 (默认) — 不会真正推镜像 / apply${NC}"
  echo "  真正执行: bash scripts/post-recovery-cutover.sh --execute"
else
  echo -e "${RED}🚨 EXECUTE 模式 — 将真正推镜像 + kubectl apply${NC}"
  echo -e "${YELLOW}   按 Ctrl+C 在 5s 内取消${NC}"
  sleep 5
fi
echo

# ── 阶段 1: 前置检查 ──
echo -e "${YELLOW}━━━ 阶段 1: 前置检查 (5 min) ━━━${NC}"

# 1.1 4 域名
echo "  1.1 4 域名连通性"
for d in "${DOMAINS[@]}"; do
  result=$(curl -s -o /dev/null -w "HTTP=%{http_code}" --max-time 10 "https://$d/" 2>&1 || echo "TIMEOUT")
  if echo "$result" | grep -qE "HTTP=(200|301|302)"; then
    echo -e "    ${GREEN}✅ $d → $result${NC}"
  else
    echo -e "    ${RED}❌ $d → $result (需先恢复)${NC}"
    if [ -n "$EXECUTE" ]; then
      echo -e "${RED}  域名不通, EXECUTE 模式中止${NC}"
      exit 1
    fi
  fi
done
echo

# 1.2 K8s API
echo "  1.2 K8s API 连通性"
k8s_status=$(curl -s -o /dev/null -w "HTTP=%{http_code}" --max-time 10 https://47.98.47.157:6443/healthz 2>&1 || echo "TIMEOUT")
if echo "$k8s_status" | grep -qE "HTTP=(200|401|403)"; then
  echo -e "    ${GREEN}✅ K8s API → $k8s_status${NC}"
else
  echo -e "    ${RED}❌ K8s API → $k8s_status (需先恢复 SLB)${NC}"
  if [ -n "$EXECUTE" ]; then
    echo -e "${RED}  K8s API 不通, EXECUTE 模式中止${NC}"
    exit 1
  fi
fi
echo

# 1.3 kubectl 验证
echo "  1.3 kubectl 验证"
export KUBECONFIG="$HOME/.kube/m5-prod-config"
if [ -n "$EXECUTE" ]; then
  if kubectl get ns 2>/dev/null | grep -q "m5"; then
    echo -e "    ${GREEN}✅ kubectl 已通 m5 namespace${NC}"
  else
    echo -e "    ${RED}❌ kubectl 失败, 退出${NC}"
    exit 1
  fi
else
  echo "    (DRY-RUN) kubectl get ns 跳过"
fi
echo

# ── 阶段 2: 部署验收 ──
echo -e "${YELLOW}━━━ 阶段 2: 部署验收 (10 min) ━━━${NC}"
echo "  跑 deploy-check.sh production"
echo "  bash scripts/deploy-check.sh production"
echo

# ── 阶段 3: 健康检查 ──
echo -e "${YELLOW}━━━ 阶段 3: 健康检查 7 组件 ━━━${NC}"
echo "  bash scripts/verify-prod-public-endpoints.sh"
echo

# ── 阶段 4: 业务烟囱测试 ──
echo -e "${YELLOW}━━━ 阶段 4: 业务烟囱测试 (5 VU / 10s) ━━━${NC}"
echo -e "  ${RED}⚠️ 只能用 5 VU / 10s 烟囱测试${NC}"
echo "  ALLOW_PROD=1 VUS=5 DURATION=10s bash scripts/run-load-test.sh https://api.sportsant.net"
echo

# ── 阶段 5: 留证 ──
echo -e "${YELLOW}━━━ 阶段 5: 留证 ━━━${NC}"
echo "  写 docs/release/v1.0.0/post-recovery-drill.md"
echo "  更新 docs/launch-checklist.md"
echo "  更新 memory/$(date +%Y-%m-%d).md"
echo

# ── 阶段 6: 发版公告 ──
echo -e "${YELLOW}━━━ 阶段 6: 发版公告 ━━━${NC}"
echo "  通知: 系统恢复 + 放量成功"
echo

# ── 总结 ──
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ -z "$EXECUTE" ]; then
  echo -e "${GREEN}✅ DRY-RUN 完成, 6 阶段全过${NC}"
  echo -e "${GREEN}   真正执行: bash scripts/post-recovery-cutover.sh --execute${NC}"
else
  echo -e "${GREEN}🎉 EXECUTE 完成, 系统放量成功${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
