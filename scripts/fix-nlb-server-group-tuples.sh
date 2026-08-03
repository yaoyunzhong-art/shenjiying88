#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — NLB listener 重新挂载后端 ECS
#
# 2026-07-29 23:50 事故中诊断发现:
#   - NLB listener 80 + 443 ServerGroupTuples: []
#   - ServerGroup 内有 2 ECS 都 Available
#   - 但 listener 角度 "未关联任何后端" = 流量不转
#
# 用法: bash scripts/fix-nlb-server-group-tuples.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

REGION="cn-hangzhou"
NLB_ID="nlb-gjgd785d7s4albohcx"
SERVER_GROUPS=("sgp-gqfwwrgds3drahi6e5" "sgp-kzem760l7hwlqtnjz2")  # 80/443
ECS_SERVERS=("i-bp1i0e6hs589ifkvxgue:31409" "i-bp1bpu6a86zjunic4i1k:31409")  # 80 后端
ECS_SERVERS_443=("i-bp1i0e6hs589ifkvxgue:31826" "i-bp1bpu6a86zjunic4i1k:31826")  # 443 后端

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 神机营 · NLB listener 重新挂载后端 ECS$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# 1. 当前 NLB 状态
echo -e "${YELLOW}━━━ 1. NLB 当前状态 ━━━${NC}"
perl -e 'alarm 30; exec @ARGV' aliyun nlb GetLoadBalancerAttribute --LoadBalancerId $NLB_ID --RegionId $REGION 2>&1 | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Status: {d.get(\"LoadBalancerStatus\")}')
print(f'  BizStatus: {d.get(\"LoadBalancerBusinessStatus\", \"-\")}')
"
echo

# 2. 列出当前 listener 状态
echo -e "${YELLOW}━━━ 2. Listener 状态 ━━━${NC}"
perl -e 'alarm 30; exec @ARGV' aliyun nlb ListListeners --LoadBalancerIds "[\"$NLB_ID\"]" --RegionId $REGION 2>&1 | python3 -c "
import json, sys
d = json.load(sys.stdin)
for l in d.get('Listeners', []):
    print(f'  {l.get(\"ListenerId\")}: port={l.get(\"ListenerPort\")}, status={l.get(\"ListenerStatus\")}, serverGroup={l.get(\"ServerGroupId\")}, tuples={l.get(\"ServerGroupTuples\")}')
"
echo

# 3. 列出 server group 后端
echo -e "${YELLOW}━━━ 3. Server Group 后端 ECS ━━━${NC}"
for sg in "${SERVER_GROUPS[@]}"; do
  echo "  ServerGroup: $sg"
  perl -e 'alarm 30; exec @ARGV' aliyun nlb ListServerGroupServers --ServerGroupId $sg --RegionId $REGION 2>&1 | python3 -c "
import json, sys
d = json.load(sys.stdin)
for s in d.get('Servers', []):
    print(f'    ECS={s.get(\"ServerId\")}, port={s.get(\"Port\")}, ip={s.get(\"ServerIp\")}, status={s.get(\"Status\")}')
"
done
echo

# 4. 修复方案：调用 AssociateAdditionalCertificatesWithListener
# 实际阿里云 NLB: listener ServerGroup 已关联, 但 ServerGroupTuples=[] 通常因:
#   - 后端 ECS 在启动中, health check 失败
#   - NLB 在 cooldown 中
# 修复: 停掉 listener 再启动
echo -e "${YELLOW}━━━ 4. 修复方案: 重启 listener ━━━${NC}"
echo "  ⚠️ 此操作会短时间断流 (~30s)"
echo
echo "  步骤:"
echo "  1. StopListener 80"
echo "  2. StopListener 443"
echo "  3. 等待 10s"
echo "  4. StartListener 80"
echo "  5. StartListener 443"
echo "  6. 等待 30s, 验证 ServerGroupTuples 是否填充"
echo

# 5. 验证
echo -e "${YELLOW}━━━ 5. 验证 4 域名 HTTPS ━━━${NC}"
echo "  bash scripts/aliyun-prod-status.sh"
echo "  for d in api admin store tob; do"
echo "    r=\$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 https://\$d.sportsant.net/)"
echo "    echo \"\$d: \$r\""
echo "  done"
echo

# 6. 大飞哥手工操作
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  强烈建议: 在阿里云控制台手工重启 NLB listener${NC}"
echo -e "${YELLOW}  1. https://nlb.console.aliyun.com${NC}"
echo -e "${YELLOW}  2. 找到 nlb-gjgd785d7s4albohcx${NC}"
echo -e "${YELLOW}  3. 监听 80 → 停止 → 启动${NC}"
echo -e "${YELLOW}  4. 监听 443 → 停止 → 启动${NC}"
echo -e "${YELLOW}  5. 等待 30s, 验证 4 域名 HTTPS 200${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
