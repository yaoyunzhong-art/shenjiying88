#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# M5 Platform - 阿里云 ACK 集群部署脚本
# ═══════════════════════════════════════════════════════════════════════

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
TERRAFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
CLUSTER_NAME="m5-prod-cluster"
REGION="cn-hangzhou"

# ═══════════════════════════════════════════════════════════════════════
# 打印函数
# ═══════════════════════════════════════════════════════════════════════

print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════════════════════════════════"
    echo ""
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ═══════════════════════════════════════════════════════════════════════
# 检查函数
# ═══════════════════════════════════════════════════════════════════════

check_prerequisites() {
    print_header "Phase 0: 环境检查"
    
    # 检查 terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform 未安装"
        print_info "安装命令: brew install terraform (Mac) 或访问 https://developer.hashicorp.com/terraform/install"
        exit 1
    fi
    
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    print_success "Terraform 已安装: v${tf_version}"
    
    # 检查阿里云 CLI
    if ! command -v aliyun &> /dev/null; then
        print_warning "阿里云 CLI 未安装 (可选，用于验证)"
    else
        print_success "阿里云 CLI 已安装"
    fi
    
    # 检查 jq
    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装 (用于JSON解析)"
        print_info "安装命令: brew install jq (Mac)"
    else
        print_success "jq 已安装"
    fi
    
    # 检查环境变量
    if [[ -z "${ALICLOUD_ACCESS_KEY}" || -z "${ALICLOUD_SECRET_KEY}" ]]; then
        print_warning "阿里云环境变量未设置"
        print_info "需要设置: ALICLOUD_ACCESS_KEY 和 ALICLOUD_SECRET_KEY"
        
        # 尝试从用户输入获取
        echo ""
        read -p "请输入 AccessKey ID: " access_key
        read -s -p "请输入 AccessKey Secret (输入时不显示): " secret_key
        echo ""
        
        export ALICLOUD_ACCESS_KEY="${access_key}"
        export ALICLOUD_SECRET_KEY="${secret_key}"
        export ALICLOUD_REGION="${REGION}"
        
        print_success "环境变量已设置"
    else
        print_success "阿里云环境变量已配置"
    fi
    
    echo ""
    read -p "环境检查完成，是否继续? (yes/no): " confirm
    if [[ "${confirm}" != "yes" ]]; then
        print_info "部署已取消"
        exit 0
    fi
}

# ═══════════════════════════════════════════════════════════════════════
# Terraform 部署函数
# ═══════════════════════════════════════════════════════════════════════

terraform_init() {
    print_header "Phase 1: Terraform 初始化"
    
    cd "${TERRAFORM_DIR}"
    
    print_info "执行 terraform init..."
    terraform init -upgrade
    
    if [[ $? -ne 0 ]]; then
        print_error "Terraform 初始化失败"
        exit 1
    fi
    
    print_success "Terraform 初始化完成"
}

terraform_plan() {
    print_header "Phase 2: 预览部署计划"
    
    cd "${TERRAFORM_DIR}"
    
    print_info "生成部署计划..."
    terraform plan -out=tfplan
    
    if [[ $? -ne 0 ]]; then
        print_error "部署计划生成失败"
        exit 1
    fi
    
    print_success "部署计划已生成"
    
    # 显示关键资源
    print_info "将要创建的资源摘要:"
    terraform show -json tfplan | jq -r '.resource_changes[] | select(.change.actions[] | contains("create")) | ". 创建: \(.type) - \(.name)"' 2>/dev/null || true
}

terraform_apply() {
    print_header "Phase 3: 执行部署"
    
    cd "${TERRAFORM_DIR}"
    
    echo ""
    read -p "确认执行部署? 这将创建阿里云资源并产生费用! (yes/no): " confirm
    if [[ "${confirm}" != "yes" ]]; then
        print_info "部署已取消"
        exit 0
    fi
    
    print_info "开始部署 (大约需要 10-15 分钟)..."
    terraform apply tfplan
    
    if [[ $? -ne 0 ]]; then
        print_error "部署失败"
        exit 1
    fi
    
    print_success "部署完成!"
}

# ═══════════════════════════════════════════════════════════════════════
# 输出结果函数
# ═══════════════════════════════════════════════════════════════════════

show_outputs() {
    print_header "部署结果"
    
    cd "${TERRAFORM_DIR}"
    
    print_info "集群信息:"
    terraform output -raw cluster_id 2>/dev/null && echo ""
    terraform output -raw cluster_endpoint 2>/dev/null && echo ""
    terraform output -raw cluster_public_endpoint 2>/dev/null && echo ""
    
    print_info "网络信息:"
    terraform output -raw vpc_id 2>/dev/null && echo ""
    terraform output -raw eip_address 2>/dev/null && echo ""
    
    print_info "KubeConfig 已保存到: ~/.kube/m5-prod-config"
    terraform output -raw kubeconfig > ~/.kube/m5-prod-config 2>/dev/null || true
    
    echo ""
    print_success "Phase 1 部署完成!"
    print_info "下一步: Phase 2 - 数据库与缓存部署"
}

# ═══════════════════════════════════════════════════════════════════════
# 主函数
# ═══════════════════════════════════════════════════════════════════════

main() {
    print_header "M5 Platform - 阿里云 ACK 集群部署脚本"
    print_info "集群名称: ${CLUSTER_NAME}"
    print_info "部署区域: ${REGION}"
    print_info "工作目录: ${TERRAFORM_DIR}"
    
    # 执行各阶段
    check_prerequisites
    terraform_init
    terraform_plan
    terraform_apply
    show_outputs
    
    print_header "全部完成!"
}

# 运行主函数
main "$@"
