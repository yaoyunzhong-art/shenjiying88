#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 全自动 NLB listener 修复 (Stop/Start 强制重挂)
#
# 2026-07-29 23:50 事故:
#   - NLB listener 80/443 ServerGroupTuples: []
#   - 后端 ECS 都 Available
#   - 但 listener 实际未关联后端, 流量被 NLB 丢弃
#
# 修复: stop-listener → wait → start-listener → 验证
# 耗时: ~60-90s
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

REGION="cn-hangzhou"
NLB_ID="nlb-gjgd785d7s4albohcx"
LISTENER_80="lsn-79koy4ijdjzz6z5ami@80"
LISTENER_443="lsn-aburnxhakbecam1aw8@443"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 神机营 · 全自动 NLB listener 修复 ($(date '+%Y-%m-%d %H:%M:%S'))${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# 1. 修复前状态
echo -e "${YELLOW}━━━ 1. 修复前状态 (23:55 之前) ━━━${NC}"
for d in api admin store tob; do
  r=$(curl -s -o /dev/null -w "%{http_code} t=%{time_total}s" --max-time 5 \
    --resolve $d.sportsant.net:443:121.41.69.154 https://$d.sportsant.net/ 2>&1 || echo "TIMEOUT")
  echo "  $d.sportsant.net HTTPS: $r"
done
echo

# 2. Stop Listener 80
echo -e "${YELLOW}━━━ 2. StopListener 80 ━━━${NC}"
out=$(perl -e 'alarm 30; exec @ARGV' aliyun nlb stop-listener --listener-id $LISTENER_80 --region $REGION 2>&1)
echo "$out" | head -3
echo
sleep 5

# 3. Stop Listener 443
echo -e "${YELLOW}━━━ 3. StopListener 443 ━━━${NC}"
out=$(perl -e 'alarm 30; exec @ARGV' aliyun nlb stop-listener --listener-id $LISTENER_443 --region $REGION 2>&1)
echo "$out" | head -3
echo

# 4. 等待 10s
echo -e "${YELLOW}━━━ 4. 等待 10s (让 NLB 真正停止 listener) ━━━${NC}"
sleep 10
echo "  done"
echo

# 5. Start Listener 80
echo -e "${YELLOW}━━━ 5. StartListener 80 ━━━${NC}"
out=$(perl -e 'alarm 30; exec @ARGV' aliyun nlb start-listener --listener-id $LISTENER_80 --region $REGION 2>&1)
echo "$out" | head -3
echo
sleep 5

# 6. Start Listener 443
echo -e "${YELLOW}━━━ 6. StartListener 443 ━━━${NC}"
out=$(perl -e 'alarm 30; exec @ARGV' aliyun nlb start-listener --listener-id $LISTENER_443 --region $REGION 2>&1)
echo "$out" | head -3
echo

# 7. 等待 30s (NLB 重新挂载后端)
echo -e "${YELLOW}━━━ 7. 等待 30s (NLB 重新挂载后端 ECS) ━━━${NC}"
sleep 30
echo "  done"
echo

# 8. 验证 NLB listener 状态
echo -e "${YELLOW}━━━ 8. NLB listener 状态 (修复后) ━━━${NC}"
out=$(perl -e 'alarm 30; exec @ARGV' aliyun nlb list-listeners --load-balancer-ids "[\"$NLB_ID\"]" --region $REGION 2>&1)
echo "$out" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for l in d.get('Listeners', []):
    print(f'  {l.get(\"ListenerId\")}: port={l.get(\"ListenerPort\")}, status={l.get(\"ListenerStatus\")}, serverGroup={l.get(\"ServerGroupId\")}, tuples={l.get(\"ServerGroupTuples\")}')
" 2>&1 || echo "  (解析失败, 但不致命)"
echo

# 9. 验证 4 域名
echo -e "${YELLOW}━━━ 9. 4 域名 HTTPS 验证 ━━━${NC}"
for d in api admin store tob; do
  r=$(curl -s -o /dev/null -w "%{http_code} t=%{time_total}s" --max-time 8 \
    --resolve $d.sportsant.net:443:121.41.69.154 https://$d.sportsant.net/ 2>&1 || echo "TIMEOUT")
  echo "  $d.sportsant.net HTTPS: $r"
done
echo

# 10. 总结
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 --resolve admin.sportsant.net:443:121.41.69.154 https://admin.sportsant.net/ | grep -qE "^[23]"; then
  echo -e "${GREEN}🎉 修复成功! admin HTTPS 通${NC}"
  echo
  echo "下一步:"
  echo "  bash scripts/post-recovery-cutover.sh --execute"
else
  echo -e "${RED}❌ 修复失败, 需进一步排查${NC}"
  echo
  echo "可能原因:"
  echo "  1. NLB 内部 health check 还未恢复 (等 1-2 min)"
  echo "  2. 后端 ECS nginx-ingress pod 异常 (需 kubectl 检查)"
  echo "  3. WAF 触发黑名单 (需查阿里云安全告警)"
  echo
  echo "进一步诊断:"
  echo "  bash scripts/aliyun-prod-status.sh"
  echo "  perl -e 'alarm 30; exec @ARGV' aliyun nlb list-server-group-servers --server-group-id sgp-kzem760l7hwlqtnjz2 --region $REGION"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
