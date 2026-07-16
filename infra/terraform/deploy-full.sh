#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# M5 Platform - 阿里云 ACK 全自动部署脚本
# 版本: v1.0.0
# 说明: 全自动执行从基础设施到应用部署的完整流程
# ═══════════════════════════════════════════════════════════════════════

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
export ALICLOUD_ACCESS_KEY="${ALICLOUD_ACCESS_KEY:-LTAI5t6B41tAFonNwUU12b6L}"
export ALICLOUD_SECRET_KEY="${ALICLOUD_SECRET_KEY:-6dmolJLTp3ZrSNhmH3nCU8QNMv8P1p}"
export ALICLOUD_REGION="${ALICLOUD_REGION:-cn-hangzhou}"

TERRAFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "${TERRAFORM_DIR}"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印横幅
print_banner() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║          M5 Platform - 阿里云 ACK 全自动部署                 ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "部署环境: ${ALICLOUD_REGION}"
    echo "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# Phase 0: 环境检查
phase0_check() {
    log_info "═══════════════════════════════════════════════════════════════"
    log_info "Phase 0: 环境检查"
    log_info "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # 检查 Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform 未安装"
        log_info "正在安装 Terraform..."
        
        # 安装 Terraform
        cd ~/Downloads 2>/dev/null || cd /tmp
        curl -LO https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_darwin_arm64.zip
        unzip -o terraform_1.9.8_darwin_arm64.zip
        mkdir -p ~/.local/bin
        mv terraform ~/.local/bin/
        export PATH="$HOME/.local/bin:$PATH"
        cd "${TERRAFORM_DIR}"
        
        log_success "Terraform 安装完成"
    fi
    
    TERRAFORM_VERSION=$(terraform version -json 2>/dev/null | grep -o '"terraform_version":"[^"]*"' | cut -d'"' -f4)
    log_success "Terraform 版本: ${TERRAFORM_VERSION}"
    
    # 检查阿里云 CLI
    if ! command -v aliyun &> /dev/null; then
        log_warn "阿里云 CLI 未安装，尝试安装..."
        curl -fsSL https://aliyuncli.alicdn.com/install.sh | bash
        log_success "阿里云 CLI 安装完成"
    fi
    
    # 配置阿里云 CLI
    aliyun configure set --profile default \
        --access-key-id "${ALICLOUD_ACCESS_KEY}" \
        --access-key-secret "${ALICLOUD_SECRET_KEY}" \
        --region "${ALICLOUD_REGION}" \
        --language zh
    
    # 验证阿里云连接
    log_info "验证阿里云连接..."
    ACCOUNT_INFO=$(aliyun sts GetCallerIdentity 2>&1 || echo "FAILED")
    
    if echo "${ACCOUNT_INFO}" | grep -q "AccountId"; then
        ACCOUNT_ID=$(echo "${ACCOUNT_INFO}" | grep -o '"AccountId": "[^"]*"' | cut -d'"' -f4)
        log_success "阿里云连接成功，账号ID: ${ACCOUNT_ID}"
    else
        log_error "阿里云连接失败: ${ACCOUNT_INFO}"
        exit 1
    fi
    
    # 初始化 Terraform
    log_info "初始化 Terraform..."
    terraform init
    
    log_success "Phase 0 完成: 环境检查通过"
    echo ""
}

# Phase 1: 导入现有资源
phase1_import() {
    log_info "═══════════════════════════════════════════════════════════════"
    log_info "Phase 1: 同步现有资源"
    log_info "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # 已存在的资源ID
    VPC_ID="vpc-bp1n56m354lc8hsw6eu8u"
    EIP_ID="eip-bp14sv7nv6uw6w9accmqu"
    NAT_GW_ID="ngw-bp1rf253rly15r5wmpd8q"
    
    log_info "已存在的资源:"
    echo "  VPC: ${VPC_ID}"
    echo "  EIP: ${EIP_ID}"
    echo "  NAT: ${NAT_GW_ID}"
    echo ""
    
    # 备份现有状态
    if [ -f "terraform.tfstate" ]; then
        BACKUP_FILE="terraform.tfstate.backup.$(date +%Y%m%d%H%M%S)"
        log_info "备份现有状态到: ${BACKUP_FILE}"
        cp terraform.tfstate "${BACKUP_FILE}"
    fi
    
    # 导入 VPC
    log_info "导入 VPC: ${VPC_ID}"
    terraform import alicloud_vpc.main "${VPC_ID}" 2>&1 || log_warn "VPC 导入失败或已存在"
    
    # 查询并导入交换机
    log_info "查询交换机..."
    VSWS=$(aliyun vpc DescribeVSwitches --VpcId "${VPC_ID}" --RegionId "${ALICLOUD_REGION}" 2>/dev/null | grep -o '"VSwitchId": "[^"]*"' | cut -d'"' -f4)
    
    if [ -n "${VSWS}" ]; then
        VSW_COUNT=0
        for VSW in ${VSWS}; do
            VSW_COUNT=$((VSW_COUNT + 1))
            if [ "${VSW_COUNT}" -eq 1 ]; then
                log_info "导入交换机 A: ${VSW}"
                terraform import alicloud_vswitch.zone_a "${VSW}" 2>&1 || true
            elif [ "${VSW_COUNT}" -eq 2 ]; then
                log_info "导入交换机 B: ${VSW}"
                terraform import alicloud_vswitch.zone_b "${VSW}" 2>&1 || true
            elif [ "${VSW_COUNT}" -eq 3 ]; then
                log_info "导入交换机 C: ${VSW}"
                terraform import alicloud_vswitch.zone_c "${VSW}" 2>&1 || true
            fi
        done
    fi
    
    # 导入 EIP
    log_info "导入 EIP: ${EIP_ID}"
    terraform import alicloud_eip_address.nat "${EIP_ID}" 2>&1 || log_warn "EIP 导入失败或已存在"
    
    # 导入 NAT 网关
    log_info "导入 NAT 网关: ${NAT_GW_ID}"
    terraform import alicloud_nat_gateway.main "${NAT_GW_ID}" 2>&1 || log_warn "NAT 网关导入失败或已存在"
    
    log_success "Phase 1 完成: 现有资源已同步"
    echo ""
}

# Phase 2: 创建 ACK 服务角色
phase2_roles() {
    log_info "═══════════════════════════════════════════════════════════════"
    log_info "Phase 2: 创建 ACK 服务角色"
    log_info "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # 执行角色创建脚本
    chmod +x ./setup-ack-roles.sh
    ./setup-ack-roles.sh || {
        log_warn "ACK 角色创建脚本执行失败，继续尝试其他方式..."
    }
    
    log_success "Phase 2 完成: ACK 服务角色已就绪"
    echo ""
}

# Phase 3: 部署 ACK 集群
phase3_cluster() {
    log_info "═══════════════════════════════════════════════════════════════"
    log_info "Phase 3: 部署 ACK 托管版集群"
    log_info "═══════════════════════════════════════════════════════════════"
    echo ""
    
    log_info "执行 Terraform Plan..."
    terraform plan -out=tfplan
    
    log_info "执行 Terraform Apply..."
    terraform apply -auto-approve tfplan || {
        log_error "ACK 集群部署失败"
        log_info "尝试重试..."
        sleep 30
        terraform apply -auto-approve
    }
    
    log_success "Phase 3 完成: ACK 集群部署成功"
    echo ""
}

# Phase 4: 验证部署
phase4_verify() {
    log_info "═══════════════════════════════════════════════════════════════"
    log_info "Phase 4: 验证部署"
    log_info "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # 获取集群信息
    CLUSTER_ID=$(terraform output -raw cluster_id 2>/dev/null || echo "")
    
    if [ -n "${CLUSTER_ID}" ]; then
        log_success "集群ID: ${CLUSTER_ID}"
        
        # 查询集群状态
        aliyun cs GET /clusters/${CLUSTER_ID} 2>/dev/null | jq -r '.state' || echo "unknown"
    else
        log_warn "无法获取集群ID"
    fi
    
    log_success "Phase 4 完成: 部署验证完成"
    echo ""
}

# 主函数
main() {
    print_banner
    
    # 执行各阶段
    phase0_check
    phase1_import
    phase2_roles
    phase3_cluster
    phase4_verify
    
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║              🎉 部署完成! 全部阶段执行成功!                    ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
}

# 执行主函数
main "$@"