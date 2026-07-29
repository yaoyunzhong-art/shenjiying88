#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — aliyun CLI 幂等连接检查
#
# 用途: 检查 aliyun CLI 配置 + 网络 + 关键 API 可用性
# 幂等: 可重复执行，无副作用
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 神机营 · aliyun 幂等连接检查 ($(date '+%Y-%m-%d %H:%M:%S'))${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# 1. aliyun CLI 安装
echo -e "${YELLOW}━━━ 1. aliyun CLI 安装检查 ━━━${NC}"
if ! command -v aliyun &>/dev/null; then
  echo -e "  ${RED}❌ aliyun CLI 未安装${NC}"
  echo "  安装: brew install aliyun-cli"
  exit 1
fi
version=$(aliyun --version 2>&1 | head -1)
echo "  ✅ aliyun: $version"
echo

# 2. aliyun 配置
echo -e "${YELLOW}━━━ 2. aliyun 配置检查 ━━━${NC}"
config_file="$HOME/.aliyun/config.json"
if [ ! -f "$config_file" ]; then
  echo -e "  ${RED}❌ $config_file 不存在${NC}"
  echo "  配置: aliyun configure set --profile default --mode AK --region cn-hangzhou --access-key-id <AK> --access-key-secret <SK>"
  exit 1
fi
ak=$(python3 -c "import json; print(json.load(open('$config_file'))['profiles'][0]['access_key_id'][:8])" 2>/dev/null)
region=$(python3 -c "import json; print(json.load(open('$config_file'))['profiles'][0]['region_id'])" 2>/dev/null)
echo "  ✅ AccessKey: ${ak}***"
echo "  ✅ Region: $region"
echo

# 3. macOS timeout 兼容
echo -e "${YELLOW}━━━ 3. macOS timeout 兼容检查 ━━━${NC}"
if ! command -v timeout &>/dev/null; then
  echo -e "  ${YELLOW}⚠️ macOS 无 GNU timeout${NC}"
  echo "  替代: perl -e 'alarm N; exec @ARGV'  <cmd>"
  if ! command -v perl &>/dev/null; then
    echo -e "  ${RED}❌ perl 也不可用${NC}"
    exit 1
  fi
  echo "  ✅ perl 可用"
fi
echo

# 4. 网络端点连通性
echo -e "${YELLOW}━━━ 4. aliyun 端点连通性 ━━━${NC}"
for endpoint in cs.aliyuncs.com slb.aliyuncs.com nlb.aliyuncs.com; do
  result=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$endpoint/" 2>&1)
  if echo "$result" | grep -qE "200|400|403|404"; then
    echo "  ✅ $endpoint: $result"
  else
    echo "  ⚠️ $endpoint: $result"
  fi
done
echo

# 5. 关键 API 探活（用 perl alarm 防止 hang）
echo -e "${YELLOW}━━━ 5. 关键 API 探活 ━━━${NC}"
check_api() {
  local api_name=$1
  local cmd=$2
  local result
  result=$(perl -e 'alarm 20; exec @ARGV' sh -c "$cmd" 2>&1 || echo "TIMEOUT")
  if echo "$result" | grep -qE "TIMEOUT|Error"; then
    echo "  ❌ $api_name: TIMEOUT/Error"
  elif [ -n "$result" ] && [ ${#result} -gt 5 ]; then
    echo "  ✅ $api_name: ${#result} bytes"
  else
    echo "  ⚠️ $api_name: empty"
  fi
}

check_api "cs DescribeClusters" "aliyun cs DescribeClusters 2>&1 | head -20"
check_api "slb DescribeLoadBalancers" "aliyun slb DescribeLoadBalancers --RegionId $region 2>&1 | head -10"
check_api "nlb ListLoadBalancers" "aliyun nlb ListLoadBalancers --RegionId $region 2>&1 | head -10"
check_api "vpc DescribeEipAddresses" "aliyun vpc DescribeEipAddresses --RegionId $region 2>&1 | head -10"
echo

# 6. K8s 连接
echo -e "${YELLOW}━━━ 6. K8s 连接检查 ━━━${NC}"
if [ -f "$HOME/.kube/m5-prod-config" ]; then
  export KUBECONFIG="$HOME/.kube/m5-prod-config"
  result=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://47.98.47.157:6443/healthz" 2>&1)
  echo "  K8s API (47.98.47.157:6443): $result"
else
  echo "  ⚠️ m5-prod-config 不存在"
fi
echo

# 7. 4 域名连通
echo -e "${YELLOW}━━━ 7. 4 域名连通性 ━━━${NC}"
for d in api.sportsant.net admin.sportsant.net store.sportsant.net tob.sportsant.net; do
  result=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$d/" 2>&1)
  if echo "$result" | grep -qE "200|301|302"; then
    echo -e "  ${GREEN}✅ $d: $result${NC}"
  else
    echo -e "  ${RED}❌ $d: $result${NC}"
  fi
done
echo

# 8. 总结
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "  完成。如有 ❌ 项，请参考 docs/incidents/2026-07-29-load-test/aliyun-diagnosis.md"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
