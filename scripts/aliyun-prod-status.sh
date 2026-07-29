#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 阿里云生产状态诊断 (5min 全栈)
#
# 2026-07-29 23:03 50 VU 压测事故后编制
#
# 用法: bash scripts/aliyun-prod-status.sh
# 作用: 5 min 内输出：
#   1. ACK 集群 + 4 节点状态
#   2. 全部 SLB / NLB / ALB 状态
#   3. 4 域名连通性
#   4. EIP 状态
#   5. 诊断结论
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

CLUSTER_ID="${CLUSTER_ID:-c3df2dbc1188143aa86de3bc47335e063}"
REGION="${REGION:-cn-hangzhou}"
DOMAINS=(api.sportsant.net admin.sportsant.net store.sportsant.net tob.sportsant.net)

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 神机营 · 阿里云生产状态诊断 ($(date '+%Y-%m-%d %H:%M:%S'))${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# 1. ACK 集群
echo -e "${YELLOW}━━━ 1. ACK 集群状态 ━━━${NC}"
cluster_info=$($(perl -e 'alarm 30; exec @ARGV') aliyun cs DescribeClusters --output json 2>/dev/null | python3 -c "
import json, sys
d = json.load(sys.stdin)
for c in d:
    if c.get('cluster_id') == '$CLUSTER_ID':
        print(json.dumps(c))
        break
" 2>/dev/null)
if [ -n "$cluster_info" ]; then
  state=$(echo "$cluster_info" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('state','-'))" 2>/dev/null)
  version=$(echo "$cluster_info" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('current_version','-'))" 2>/dev/null)
  echo "  Cluster: m5-prod-cluster ($CLUSTER_ID)"
  echo "  State:   $state"
  echo "  Version: $version"

  if [ "$state" = "running" ]; then
    echo -e "  Status:  ${GREEN}✅ 运行中${NC}"
  else
    echo -e "  Status:  ${RED}❌ 异常: $state${NC}"
  fi
fi
echo

# 2. 节点
echo -e "${YELLOW}━━━ 2. ACK 节点状态 ━━━${NC}"
nodes=$($(perl -e 'alarm 30; exec @ARGV') aliyun cs DescribeClusterNodes --ClusterId $CLUSTER_ID --output json 2>/dev/null)
if [ -n "$nodes" ]; then
  echo "$nodes" | python3 -c "
import sys, json
d = json.load(sys.stdin)
nodes = d.get('nodes', [])
total = len(nodes)
running = sum(1 for n in nodes if n.get('state') == 'running')
print(f'  Total: {total}  Running: {running}')
for n in nodes:
    state = n.get('state','-')
    name = n.get('node_name','-')
    color = '\033[0;32m' if state == 'running' else '\033[0;31m'
    print(f'    {color}{state:10s}\033[0m {name}')
"
fi
echo

# 3. SLB
echo -e "${YELLOW}━━━ 3. SLB 状态 (内网/公网) ━━━${NC}"
slbs=$($(perl -e 'alarm 30; exec @ARGV') aliyun slb DescribeLoadBalancers --RegionId $REGION --PageSize 50 --output json 2>/dev/null)
if [ -n "$slbs" ]; then
  echo "$slbs" | python3 -c "
import sys, json
d = json.load(sys.stdin)
lbs = d.get('LoadBalancers', {}).get('LoadBalancer', [])
print(f'  Total: {len(lbs)}')
for lb in lbs:
    name = lb.get('LoadBalancerName','-')[:50]
    status = lb.get('LoadBalancerStatus','-')
    biz = lb.get('BusinessStatus', '-')
    addr = lb.get('Address','-')
    color = '\033[0;32m' if (status == 'active' and biz != 'FinancialLocked') else '\033[0;31m'
    flag = '🔒' if biz == 'FinancialLocked' else ('✅' if status == 'active' else '⚠️')
    print(f'    {color}{flag} {status:10s} {biz:15s}\033[0m {name} ({addr})')
"
fi
echo

# 4. NLB
echo -e "${YELLOW}━━━ 4. NLB 状态 (公网入口) ━━━${NC}"
nlbs=$($(perl -e 'alarm 30; exec @ARGV') aliyun nlb ListLoadBalancers --RegionId $REGION --output json 2>/dev/null)
if [ -n "$nlbs" ]; then
  echo "$nlbs" | python3 -c "
import sys, json
d = json.load(sys.stdin)
lbs = d.get('LoadBalancers', [])
print(f'  Total: {len(lbs)}')
for lb in lbs:
    name = lb.get('LoadBalancerName','-')[:50]
    status = lb.get('LoadBalancerStatus','-')
    lid = lb.get('LoadBalancerId','-')
    color = '\033[0;32m' if status == 'Active' else '\033[0;31m'
    print(f'    {color}{status:10s}\033[0m {lid} {name}')
    if status == 'Inactive':
        print('         ⚠️  NLB 已停服, listener 可能为 0')
"
fi
echo

# 5. ALB
echo -e "${YELLOW}━━━ 5. ALB 状态 ━━━${NC}"
alb_count=$($(perl -e 'alarm 15; exec @ARGV') aliyun alb ListLoadBalancers --RegionId $REGION --output json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('TotalCount', 0))" 2>/dev/null || echo "?")
echo "  ALB Count: $alb_count"
echo

# 6. 4 域名连通性
echo -e "${YELLOW}━━━ 6. 4 域名连通性 ━━━${NC}"
for d in "${DOMAINS[@]}"; do
  result=$(curl -s -o /dev/null -w "HTTP=%{http_code} TIME=%{time_total}s" --max-time 8 "https://$d/" 2>&1 || echo "TIMEOUT")
  if echo "$result" | grep -q "HTTP=200"; then
    color="$GREEN"; icon="✅"
  elif echo "$result" | grep -q "HTTP=000"; then
    color="$RED"; icon="❌"
  else
    color="$YELLOW"; icon="⚠️"
  fi
  echo -e "  ${color}${icon} $d → $result${NC}"
done
echo

# 7. EIP 状态
echo -e "${YELLOW}━━━ 7. 公网 EIP 状态 ━━━${NC}"
eips=$($(perl -e 'alarm 30; exec @ARGV') aliyun vpc DescribeEipAddresses --RegionId $REGION --output json 2>/dev/null)
if [ -n "$eips" ]; then
  echo "$eips" | python3 -c "
import sys, json
d = json.load(sys.stdin)
es = d.get('EipAddresses', {}).get('EipAddress', [])
for e in es:
    ip = e.get('IpAddress','-')
    name = e.get('Name','-') or '-'
    status = e.get('Status','-')
    color = '\033[0;32m' if status == 'InUse' else '\033[0;33m'
    print(f'    {color}{status:10s}\033[0m {ip:20s} {name}')
"
fi
echo

# 8. 诊断结论
echo -e "${BLUE}━━━ 诊断结论 ━━━${NC}"
domain_fail=0
for d in "${DOMAINS[@]}"; do
  if ! curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$d/" | grep -qE "200|301|302"; then
    domain_fail=$((domain_fail+1))
  fi
done

if [ $domain_fail -eq 4 ]; then
  echo -e "  ${RED}🚨 4 域名全挂${NC}"
  echo -e "  ${YELLOW}建议:${NC}"
  echo "    1. 检查阿里云账户余额（aliyun.com → 费用中心）"
  echo "    2. SLB FinancialLocked 时充值会自动解锁"
  echo "    3. NLB Inactive 时需要手动启动 + 重建 listener"
  echo "    4. 重建 listener: bash scripts/restore-nlb-listeners.sh"
elif [ $domain_fail -gt 0 ]; then
  echo -e "  ${YELLOW}⚠️ $domain_fail / 4 域名不可达${NC}"
  echo "    进一步诊断见上文各段"
else
  echo -e "  ${GREEN}✅ 4 域名全部可达${NC}"
fi

echo
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
