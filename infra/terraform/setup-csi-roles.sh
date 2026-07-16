#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# CSI 插件服务角色创建脚本
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
echo "  CSI 插件服务角色创建"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 需要创建的CSI角色
ROLES=(
    "AliyunCSManagedCsiRole:cs.aliyuncs.com:CSI存储插件角色"
    "AliyunCSManagedCsiProvisionerRole:cs.aliyuncs.com:CSI provisioner角色"
    "AliyunCSManagedCsiPluginRole:cs.aliyuncs.com:CSI plugin角色"
    "AliyunCSManagedCsiAgentRole:cs.aliyuncs.com:CSI agent角色"
)

SUCCESS_COUNT=0
EXIST_COUNT=0
FAILED_COUNT=0

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
        else
            echo -e "${RED}✗ 创建失败: ${CREATE_RESULT}${NC}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        echo -e "${GREEN}✓ 已存在${NC}"
        EXIST_COUNT=$((EXIST_COUNT + 1))
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CSI 角色创建完成"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}✓ 新建成功: ${SUCCESS_COUNT}${NC}"
echo -e "  ${GREEN}✓ 已存在: ${EXIST_COUNT}${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "  ${RED}✗ 失败: ${FAILED_COUNT}${NC}"
fi
echo ""
