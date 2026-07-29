#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — NLB listener 重建 (生产事故恢复)
#
# 2026-07-29 23:03 50 VU 压测事故后编制
# 用途: 充值后 NLB Inactive 时, 自动重建 listener
#
# 用法: bash scripts/restore-nlb-listeners.sh
# 前提: 阿里云账户已充值 + SLB 已解锁
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

REGION="${REGION:-cn-hangzhou}"
NLB_ID="${NLB_ID:-nlb-gjgd785d7s4albohcx}"
CLUSTER_ID="${CLUSTER_ID:-c3df2dbc1188143aa86de3bc47335e063}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 神机营 · NLB listener 重建 ($(date '+%Y-%m-%d %H:%M:%S'))${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# 1. 检查 NLB 状态
echo -e "${YELLOW}━━━ 1. NLB 状态检查 ━━━${NC}"
nlb_info=$(aliyun nlb GetLoadBalancerAttribute --LoadBalancerId $NLB_ID --RegionId $REGION 2>&1)
status=$(echo "$nlb_info" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('LoadBalancerStatus','-'))" 2>/dev/null || echo "?")
echo "  NLB: $NLB_ID"
echo "  Status: $status"

if [ "$status" != "Active" ] && [ "$status" != "Inactive" ]; then
  echo -e "  ${RED}❌ NLB 状态异常, 退出${NC}"
  exit 1
fi
echo

# 2. 启动 NLB
if [ "$status" = "Inactive" ]; then
  echo -e "${YELLOW}━━━ 2. 启动 NLB ━━━${NC}"
  aliyun nlb StartLoadBalancer --LoadBalancerId $NLB_ID --RegionId $REGION 2>&1
  sleep 10
  status=$(aliyun nlb GetLoadBalancerAttribute --LoadBalancerId $NLB_ID --RegionId $REGION 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('LoadBalancerStatus','-'))" 2>/dev/null)
  echo "  NLB Status: $status"
  if [ "$status" != "Active" ]; then
    echo -e "  ${RED}❌ NLB 启动失败, 退出${NC}"
    exit 1
  fi
  echo -e "  ${GREEN}✅ NLB 启动成功${NC}"
else
  echo -e "${YELLOW}━━━ 2. NLB 已在 Active, 跳过启动 ━━━${NC}"
fi
echo

# 3. 检查 listener
echo -e "${YELLOW}━━━ 3. Listener 状态 ━━━${NC}"
listeners=$(aliyun nlb ListListeners --LoadBalancerId $NLB_ID --RegionId $REGION 2>&1)
listener_count=$(echo "$listeners" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('Listeners',[])))" 2>/dev/null || echo "?")
echo "  Listener count: $listener_count"

if [ "$listener_count" = "0" ]; then
  echo -e "  ${YELLOW}⚠️ 0 listener, 需要重建${NC}"
else
  echo -e "  ${GREEN}✅ $listener_count listener 已存在, 跳过重建${NC}"
  exit 0
fi
echo

# 4. 创建 listener (TCP 80)
echo -e "${YELLOW}━━━ 4. 创建 TCP 80 listener ━━━${NC}"
echo "  ⚠️ 需要确认 nginx-ingress service 端口 + 后端服务器组 ID"
echo "  本步骤需手动执行, 因为 NLB 后端组需要与 K8s service 关联"
echo
echo "  手动步骤:"
echo "    1. 在阿里云控制台 NLB 控制台: https://nlb.console.aliyun.com"
echo "    2. 找到 m5-nlb ($NLB_ID)"
echo "    3. 创建监听器:"
echo "       协议: TCP, 端口: 80, 后端端口: 80"
echo "       后端服务器组: 创建新组, 类型: ECS"
echo "       关联节点: m5 集群 4 个 ECS (47.97.x.x 系列)"
echo "    4. 同样创建 TCP 443 监听器"
echo
echo "  或者用 CLI:"
echo "    aliyun nlb CreateListener \\"
echo "      --LoadBalancerId $NLB_ID \\"
echo "      --ListenerProtocol TCP \\"
echo "      --ListenerPort 80 \\"
echo "      --BackendServerGroupId <server-group-id>"
echo

# 5. 验证 (用户操作后)
echo -e "${YELLOW}━━━ 5. 验证 (用户操作后执行) ━━━${NC}"
echo "  bash scripts/aliyun-prod-status.sh  ← 查全栈状态"
echo "  curl -s -o /dev/null -w \"%{http_code}\\n\" https://api.sportsant.net/  ← 验证 200"
echo
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
