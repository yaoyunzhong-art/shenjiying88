#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# M5 Platform — 监控栈启动脚本
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$MONITORING_DIR/../.." && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker"
        exit 1
    fi
    log_success "Docker 运行正常"
}

# 创建必要的网络
create_networks() {
    log_info "创建 Docker 网络..."
    
    # 检查 m5-network 是否存在
    if ! docker network ls | grep -q "m5-network"; then
        log_warn "m5-network 不存在，尝试创建..."
        docker network create --driver bridge --subnet 172.28.0.0/16 m5-network || {
            log_error "创建 m5-network 失败"
            exit 1
        }
        log_success "创建 m5-network 成功"
    else
        log_success "m5-network 已存在"
    fi
}

# 启动基础设施服务
start_infrastructure() {
    log_info "启动基础设施服务 (PostgreSQL, Redis, RabbitMQ)..."
    cd "$PROJECT_ROOT"
    
    # 检查是否已经在运行
    if docker ps --format '{{.Names}}' | grep -q "m5-postgres"; then
        log_warn "基础设施服务已在运行"
        return 0
    fi
    
    docker compose -f docker-compose.yml up -d postgres redis || {
        log_error "启动基础设施服务失败"
        exit 1
    }
    
    # 等待 PostgreSQL 就绪
    log_info "等待 PostgreSQL 就绪..."
    for i in {1..30}; do
        if docker exec m5-postgres pg_isready -U m5 > /dev/null 2>&1; then
            log_success "PostgreSQL 已就绪"
            break
        fi
        sleep 1
        echo -n "."
    done
    
    log_success "基础设施服务启动成功"
}

# 启动监控栈
start_monitoring() {
    log_info "启动监控栈 (Prometheus, Grafana, Loki, AlertManager)..."
    cd "$MONITORING_DIR"
    
    docker compose -f docker-compose.monitoring.yml up -d || {
        log_error "启动监控栈失败"
        exit 1
    }
    
    # 等待 Prometheus 就绪
    log_info "等待 Prometheus 就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
            log_success "Prometheus 已就绪"
            break
        fi
        sleep 1
        echo -n "."
    done
    
    # 等待 Grafana 就绪
    log_info "等待 Grafana 就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:3005/api/health > /dev/null 2>&1; then
            log_success "Grafana 已就绪"
            break
        fi
        sleep 1
        echo -n "."
    done
    
    log_success "监控栈启动成功"
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║             M5 Platform 监控栈已启动                        ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  服务访问地址:                                              ║"
    echo "║  ─────────────────────────────────────────────────────────   ║"
    echo "║  Grafana:        http://localhost:3005                     ║"
    echo "║  用户名: admin, 密码: admin (请在 .env 中修改)                ║"
    echo "║  ─────────────────────────────────────────────────────────   ║"
    echo "║  Prometheus:     http://localhost:9090                     ║"
    echo "║  AlertManager:   http://localhost:9093                     ║"
    echo "║  Loki:           http://localhost:3100                     ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  常用命令:                                                  ║"
    echo "║  ─────────────────────────────────────────────────────────   ║"
    echo "║  查看监控栈状态:  docker compose -f infra/monitoring/       ║"
    echo "║                   docker-compose.monitoring.yml ps         ║"
    echo "║  ─────────────────────────────────────────────────────────   ║"
    echo "║  停止监控栈:     ./infra/monitoring/scripts/                 ║"
    echo "║                  stop-monitoring.sh                          ║"
    echo "║  ─────────────────────────────────────────────────────────   ║"
    echo "║  查看日志:       docker logs -f m5-grafana                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

# 主函数
main() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     M5 Platform 监控栈启动脚本                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_docker
    create_networks
    start_infrastructure
    start_monitoring
    show_access_info
    
    log_success "所有服务已启动完成!"
}

# 执行主函数
main "$@"
