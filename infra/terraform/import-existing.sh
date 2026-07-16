#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# 导入已存在的阿里云资源到 Terraform 状态
# 用途: 同步控制台已创建的资源到 Terraform 状态文件
# ═══════════════════════════════════════════════════════════════════════

set -e

export ALICLOUD_ACCESS_KEY="${ALICLOUD_ACCESS_KEY:-LTAI5t6B41tAFonNwUU12b6L}"
export ALICLOUD_SECRET_KEY="${ALICLOUD_SECRET_KEY:-6dmolJLTp3ZrSNhmH3nCU8QNMv8P1p}"
export ALICLOUD_REGION="${ALICLOUD_REGION:-cn-hangzhou}"

# 已存在的资源ID（从阿里云控制台获取）
VPC_ID="vpc-bp1n56m354lc8hsw6eu8u"
EIP_ID="eip-bp14sv7nv6uw6w9accmqu"
NAT_GW_ID="ngw-bp1rf253rly15r5wmpd8q"

echo "═══════════════════════════════════════════════════════════════"
echo "  导入现有资源到 Terraform 状态"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 检查 Terraform 是否已初始化
if [ ! -d ".terraform" ]; then
    echo "📦 初始化 Terraform..."
    terraform init
fi

# 备份现有状态
if [ -f "terraform.tfstate" ]; then
    BACKUP_FILE="terraform.tfstate.backup.$(date +%Y%m%d%H%M%S)"
    echo "💾 备份现有状态到: ${BACKUP_FILE}"
    cp terraform.tfstate "${BACKUP_FILE}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  开始导入资源"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 导入 VPC
echo "🌐 导入 VPC: ${VPC_ID}"
terraform import alicloud_vpc.main "${VPC_ID}" || echo "⚠️ VPC 可能已导入或不存在"

# 导入交换机（需要先查询交换机ID）
echo "🔍 查询交换机..."
VSWS=$(aliyun vpc DescribeVSwitches --VpcId "${VPC_ID}" --RegionId "${ALICLOUD_REGION}" 2>/dev/null | grep -o '"VSwitchId": "[^"]*"' | cut -d'"' -f4)

if [ -n "${VSWS}" ]; then
    VSW_COUNT=0
    for VSW in ${VSWS}; do
        VSW_COUNT=$((VSW_COUNT + 1))
        if [ "${VSW_COUNT}" -eq 1 ]; then
            echo "🔌 导入交换机 A: ${VSW}"
            terraform import alicloud_vswitch.zone_a "${VSW}" || true
        elif [ "${VSW_COUNT}" -eq 2 ]; then
            echo "🔌 导入交换机 B: ${VSW}"
            terraform import alicloud_vswitch.zone_b "${VSW}" || true
        elif [ "${VSW_COUNT}" -eq 3 ]; then
            echo "🔌 导入交换机 C: ${VSW}"
            terraform import alicloud_vswitch.zone_c "${VSW}" || true
        fi
    done
fi

# 导入 EIP
echo "📍 导入 EIP: ${EIP_ID}"
terraform import alicloud_eip_address.nat "${EIP_ID}" || echo "⚠️ EIP 可能已导入或不存在"

# 导入 NAT 网关
echo "🚪 导入 NAT 网关: ${NAT_GW_ID}"
terraform import alicloud_nat_gateway.main "${NAT_GW_ID}" || echo "⚠️ NAT 网关可能已导入或不存在"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  资源导入完成"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ 现有资源已同步到 Terraform 状态"
echo "📋 运行 'terraform plan' 查看差异"
echo ""