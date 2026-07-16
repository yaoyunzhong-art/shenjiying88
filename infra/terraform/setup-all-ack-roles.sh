#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# 创建所有 ACK 所需的服务角色（含正确的信任策略）
# ═══════════════════════════════════════════════════════════════════════

set -e

export ALICLOUD_ACCESS_KEY="${ALICLOUD_ACCESS_KEY:-LTAI5t6B41tAFonNwUU12b6L}"
export ALICLOUD_SECRET_KEY="${ALICLOUD_SECRET_KEY:-6dmolJLTp3ZrSNhmH3nCU8QNMv8P1p}"
export ALICLOUD_REGION="${ALICLOUD_REGION:-cn-hangzhou}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo "  创建所有 ACK 服务角色"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 所有 ACK 需要的服务角色
ROLES=(
    "AliyunCSDefaultRole"
    "AliyunCSManagedKubernetesRole"
    "AliyunCSManagedLogRole"
    "AliyunCSManagedCmsRole"
    "AliyunCSManagedCsiRole"
    "AliyunCSManagedCsiProvisionerRole"
    "AliyunCSManagedCsiPluginRole"
    "AliyunCSManagedNetworkRole"
    "AliyunCSManagedArmsRole"
    "AliyunCSKubernetesAuditRole"
    "AliyunCSServerlessKubernetesRole"
    "AliyunCISDefaultRole"
)

# ACK 信任策略（同时信任 cs.aliyuncs.com 和 ack.aliyuncs.com）
TRUST_POLICY='{"Statement":[{"Action":"sts:AssumeRole","Effect":"Allow","Principal":{"Service":["cs.aliyuncs.com","ack.aliyuncs.com"]}}],"Version":"1"}'

SUCCESS_COUNT=0
EXIST_COUNT=0
FAILED_COUNT=0

for ROLE_NAME in "${ROLES[@]}"; do
    echo -n "🔍 ${ROLE_NAME}... "
    
    # 检查角色是否存在
    CHECK_RESULT=$(aliyun ram GetRole --RoleName "${ROLE_NAME}" 2>&1 || true)
    
    if echo "${CHECK_RESULT}" | grep -q "EntityNotExist.Role"; then
        echo -n "创建中... "
        
        CREATE_RESULT=$(aliyun ram CreateRole \
            --RoleName "${ROLE_NAME}" \
            --AssumeRolePolicyDocument "${TRUST_POLICY}" \
            --Description "ACK managed service role" 2>&1 || true)
        
        if echo "${CREATE_RESULT}" | grep -q "RoleName"; then
            echo -e "${GREEN}✓ 创建成功${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        elif echo "${CREATE_RESULT}" | grep -q "InvalidParameter.AssumePolicy"; then
            echo -e "${YELLOW}⚠ 需要特殊策略，跳过${NC}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        else
            echo -e "${RED}✗ 失败: $(echo "${CREATE_RESULT}" | head -1)${NC}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        echo -e "${GREEN}✓ 已存在${NC}"
        EXIST_COUNT=$((EXIST_COUNT + 1))
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  结果: 新建${SUCCESS_COUNT} | 已存在${EXIST_COUNT} | 失败${FAILED_COUNT}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 列出所有 ACK 角色确认
echo "📋 现有 ACK 相关角色:"
aliyun ram ListRoles --MaxItems 100 2>&1 | grep -o '"RoleName": "AliyunCS[^"]*"' | sort -u
echo ""