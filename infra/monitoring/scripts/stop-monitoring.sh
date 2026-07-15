#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# M5 Platform — 监控栈停止脚本
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
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 停止监控栈
stop_monitoring() {
    log_info "停止监控栈..."
    cd "$MONITORING_DIR"
    
    if [ -f "docker-compose.monitoring.yml" ]; then
        docker compose -f docker-compose.monitoring.yml down || {
            log_warn "停止监控栈时出现问题"
        }
        log_success "监控栈已停止"
    else
        log_warn "监控栈配置文件不存在"
    fi
}

# 停止基础设施
stop_infrastructure() {
    log_info "停止基础设施服务..."
    cd "$PROJECT_ROOT"
    
    if [ -f "docker-compose.yml" ]; then
        docker compose -f docker-compose.yml down || {
            log_warn "停止基础设施时出现问题"
        }
        log_success "基础设施已停止"
    else
        log_warn "基础设施配置文件不存在"
    fi
}

# 显示当前状态
show_status() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                服务停止完成                                 ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  当前运行的容器:                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "无运行中的容器"
    echo ""
}

# 主函数
main() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     M5 Platform 监控栈停止脚本                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    # 询问是否停止基础设施
    read -p "是否同时停止基础设施服务 (PostgreSQL, Redis)? [y/N]: " stop_infra
    
    stop_monitoring
    
    if [[ "$stop_infra" =~ ^[Yy]$ ]]; then
        stop_infrastructure
    fi
    
    show_status
    log_success "操作完成!"
}

# 执行主函数
main "$@"
