#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# ACK 服务角色自动创建脚本
# 用途: 自动创建 ACK Pro 所需的 7 个 RAM 服务角色
# ═══════════════════════════════════════════════════════════════════════

set -e

export ALICLOUD_ACCESS_KEY="${ALICLOUD_ACCESS_KEY:-LTAI5t6B41tAFonNwUU12b6L}"
export ALICLOUD_SECRET_KEY="${ALICLOUD_SECRET_KEY:-6dmolJLTp3ZrSNhmH3nCU8QNMv8P1p}"
export ALICLOUD_REGION="${ALICLOUD_REGION:-cn-hangzhou}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  ACK Pro 服务角色自动创建"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 需要创建的服务角色列表
# 格式: 角色名称:信任的服务:描述
ROLES=(
    "AliyunCSDefaultRole:cs.aliyuncs.com:ACK默认角色，用于创建和管理集群资源"
    "AliyunCSManagedLogRole:cs.aliyuncs.com:ACK托管日志服务角色"
    "AliyunCSManagedCmsRole:cs.aliyuncs.com:ACK云监控服务角色"
    "AliyunCSManagedCsiRole:cs.aliyuncs.com:ACK存储插件服务角色"
    "AliyunCSManagedNetworkRole:cs.aliyuncs.com:ACK网络插件服务角色"
    "AliyunCSManagedKubernetesRole:cs.aliyuncs.com:ACK托管版服务角色"
)

echo "📋 需要创建/检查的 RAM 服务角色:"
echo ""
for ROLE_INFO in "${ROLES[@]}"; do
    ROLE_NAME=$(echo "${ROLE_INFO}" | cut -d':' -f1)
    echo "   • ${ROLE_NAME}"
done
echo ""

# 检查并创建每个角色
SUCCESS_COUNT=0
EXIST_COUNT=0
FAILED_COUNT=0

echo "═══════════════════════════════════════════════════════════════"
echo "  开始创建/检查服务角色"
echo "═══════════════════════════════════════════════════════════════"
echo ""

for ROLE_INFO in "${ROLES[@]}"; do
    ROLE_NAME=$(echo "${ROLE_INFO}" | cut -d':' -f1)
    TRUSTED_SERVICE=$(echo "${ROLE_INFO}" | cut -d':' -f2)
    DESCRIPTION=$(echo "${ROLE_INFO}" | cut -d':' -f3-)
    
    echo -n "🔍 检查角色 ${ROLE_NAME}... "
    
    # 检查角色是否存在
    ROLE_EXISTS=$(aliyun ram GetRole --RoleName "${ROLE_NAME}" 2>&1 || true)
    
    if echo "${ROLE_EXISTS}" | grep -q "EntityNotExist.Role"; then
        echo -e "${YELLOW}不存在，需要创建${NC}"
        
        # 创建角色信任策略
        TRUST_POLICY=$(cat <<EOF
{
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "${TRUSTED_SERVICE}"
                ]
            }
        }
    ],
    "Version": "1"
}
EOF
)
        
        # 创建角色
        CREATE_RESULT=$(aliyun ram CreateRole \
            --RoleName "${ROLE_NAME}" \
            --AssumeRolePolicyDocument "${TRUST_POLICY}" \
            --Description "${DESCRIPTION}" 2>&1 || true)
        
        if echo "${CREATE_RESULT}" | grep -q "RoleName"; then
            echo -e "${GREEN}✓ 创建成功${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            
            # 为关键角色附加系统策略
            attach_system_policies "${ROLE_NAME}"
        else
            echo -e "${RED}✗ 创建失败: ${CREATE_RESULT}${NC}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        echo -e "${GREEN}✓ 已存在${NC}"
        EXIST_COUNT=$((EXIST_COUNT + 1))
    fi
done

# 附加系统策略函数
attach_system_policies() {
    local ROLE_NAME=$1
    
    # 定义角色需要的策略
    declare -A ROLE_POLICIES
    ROLE_POLICIES[AliyunCSDefaultRole]="AliyunECSFullAccess,AliyunVPCFullAccess,AliyunSLBFullAccess,AliyunEIPFullAccess,AliyunNATGatewayFullAccess"
    ROLE_POLICIES[AliyunCSManagedLogRole]="AliyunLogFullAccess"
    ROLE_POLICIES[AliyunCSManagedCmsRole]="AliyunCloudMonitorFullAccess"
    ROLE_POLICIES[AliyunCSManagedCsiRole]="AliyunECSFullAccess,AliyunNASFullAccess,AliyunOSSFullAccess"
    ROLE_POLICIES[AliyunCSManagedNetworkRole]="AliyunVPCFullAccess,AliyunSLBFullAccess"
    ROLE_POLICIES[AliyunCSManagedKubernetesRole]="AliyunECSFullAccess,AliyunVPCFullAccess"
    
    local POLICIES="${ROLE_POLICIES[$ROLE_NAME]}"
    if [ -n "$POLICIES" ]; then
        IFS=',' read -ra POLICY_ARRAY <<< "$POLICIES"
        for POLICY in "${POLICY_ARRAY[@]}"; do
            aliyun ram AttachPolicyToRole --PolicyName "$POLICY" --RoleName "$ROLE_NAME" --PolicyType System 2>/dev/null || true
        done
    fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  角色创建/检查完成"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}✓ 新建成功: ${SUCCESS_COUNT}${NC}"
echo -e "  ${GREEN}✓ 已存在: ${EXIST_COUNT}${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "  ${RED}✗ 失败: ${FAILED_COUNT}${NC}"
fi
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $((SUCCESS_COUNT + EXIST_COUNT)) -ge ${#ROLES[@]} ]; then
    echo -e "${GREEN}✓ 所有 ACK 服务角色已就绪${NC}"
    echo ""
    echo "🚀 现在可以继续部署 ACK 集群:"
    echo "   terraform apply -auto-approve"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠ 部分角色创建失败，请检查权限${NC}"
    exit 1
fi