#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Environment Health Check · 环境健康检查与自愈 V1.0
# 
# 功能:
# - 测试环境资源巡检
# - 服务健康检查
# - 异常自动修复
# - 测试数据准备
# ═══════════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
LOG_DIR="testing-system/logs/health"
REPORT_FILE="testing-system/reports/health-$(date +%Y%m%d).json"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_DIR/health-error-${DATE}.log"
}

# ═══════════════════════════════════════════════════════════════════════
# 健康检查项
# ═══════════════════════════════════════════════════════════════════════

check_api_service() {
    log "━━━ API服务健康检查 ━━━"
    
    local api_url="http://localhost:3000"
    local health_endpoint="/health"
    
    # 检查服务是否响应
    if curl -sf "${api_url}${health_endpoint}" > /dev/null 2>&1; then
        log "✓ API服务正常"
        return 0
    else
        log_error "API服务无响应: ${api_url}${health_endpoint}"
        return 1
    fi
}

check_database() {
    log "━━━ 数据库健康检查 ━━━"
    
    # 检查PostgreSQL
    if pgrep -x "postgres" > /dev/null; then
        log "✓ PostgreSQL运行中"
    else
        log_error "PostgreSQL未运行"
        try_restart_postgres
    fi
}

check_redis() {
    log "━━━ Redis健康检查 ━━━"
    
    if pgrep -x "redis-server" > /dev/null; then
        log "✓ Redis运行中"
    else
        log_error "Redis未运行"
        try_restart_redis
    fi
}

check_disk_space() {
    log "━━━ 磁盘空间检查 ━━━"
    
    local threshold=90
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt "$threshold" ]; then
        log_error "磁盘空间不足: ${usage}%"
        cleanup_old_logs
        return 1
    else
        log "✓ 磁盘空间充足: ${usage}%"
        return 0
    fi
}

check_memory() {
    log "━━━ 内存检查 ━━━"
    
    local threshold=85
    local usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ "$usage" -gt "$threshold" ]; then
        log_error "内存使用率过高: ${usage}%"
        return 1
    else
        log "✓ 内存使用率正常: ${usage}%"
        return 0
    fi
}

check_cpu() {
    log "━━━ CPU检查 ━━━"
    
    local threshold=80
    local usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    
    if [ "$usage" -gt "$threshold" ]; then
        log_error "CPU使用率过高: ${usage}%"
        return 1
    else
        log "✓ CPU使用率正常: ${usage}%"
        return 0
    fi
}

check_test_data() {
    log "━━━ 测试数据检查 ━━━"
    
    # 检查必要的数据文件
    local data_dir="testing-system/testdata"
    
    if [ -d "$data_dir" ]; then
        local file_count=$(find "$data_dir" -type f | wc -l)
        log "✓ 测试数据文件: ${file_count} 个"
    else
        log "⚠ 测试数据目录不存在,将创建..."
        mkdir -p "$data_dir"
    fi
}

# ═══════════════════════════════════════════════════════════════════════
# 自愈操作
# ═══════════════════════════════════════════════════════════════════════

try_restart_postgres() {
    log "尝试重启PostgreSQL..."
    
    if pgrep -x "postgres" > /dev/null; then
        log "PostgreSQL已在运行"
        return 0
    fi
    
    # 尝试启动
    if command -v pg_ctl > /dev/null; then
        pg_ctl start -D /usr/local/var/postgres 2>/dev/null || true
    fi
    
    sleep 3
    
    if pgrep -x "postgres" > /dev/null; then
        log "✓ PostgreSQL已恢复"
        return 0
    else
        log_error "PostgreSQL恢复失败"
        return 1
    fi
}

try_restart_redis() {
    log "尝试重启Redis..."
    
    if pgrep -x "redis-server" > /dev/null; then
        log "Redis已在运行"
        return 0
    fi
    
    # 尝试启动
    if command -v redis-server > /dev/null; then
        redis-server --daemonize yes 2>/dev/null || true
    fi
    
    sleep 2
    
    if pgrep -x "redis-server" > /dev/null; then
        log "✓ Redis已恢复"
        return 0
    else
        log_error "Redis恢复失败"
        return 1
    fi
}

cleanup_old_logs() {
    log "清理旧日志..."
    
    local days=7
    local log_dirs=(
        "testing-system/logs"
        "logs"
    )
    
    for dir in "${log_dirs[@]}"; do
        if [ -d "$dir" ]; then
            find "$dir" -name "*.log" -mtime +${days} -delete 2>/dev/null || true
            find "$dir" -name "*.tmp" -delete 2>/dev/null || true
        fi
    done
    
    log "✓ 日志清理完成"
}

cleanup_node_modules() {
    log "检查node_modules缓存..."
    
    local cache_dir="node_modules/.cache"
    
    if [ -d "$cache_dir" ]; then
        local cache_size=$(du -sh "$cache_dir" 2>/dev/null | cut -f1)
        log "缓存大小: $cache_size"
        
        if [ -n "$cache_size" ]; then
            # 超过500MB清理
            local size_num=$(echo "$cache_size" | sed 's/[A-Z]//')
            if [ "$size_num" -gt 500 ]; then
                rm -rf "$cache_dir"/* 2>/dev/null || true
                log "✓ 缓存已清理"
            fi
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════
# 健康报告
# ═══════════════════════════════════════════════════════════════════════

generate_health_report() {
    local status=$1
    local details=$2
    
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": $(date +%s),
    "date": "$DATE",
    "status": "$status",
    "checks": {
        "api": $(pgrep -x "node" > /dev/null && echo "UP" || echo "DOWN"),
        "postgres": $(pgrep -x "postgres" > /dev/null && echo "UP" || echo "DOWN"),
        "redis": $(pgrep -x "redis-server" > /dev/null && echo "UP" || echo "DOWN"),
        "disk": $(df / | tail -1 | awk '{print $5}' | sed 's/%//'),
        "memory": $(free | grep Mem | awk '{print int($3/$2 * 100)}')
    },
    "details": $details,
    "hostname": "$(hostname)"
}
EOF
    
    log "健康报告已生成: $REPORT_FILE"
}

# ═══════════════════════════════════════════════════════════════════════
# 主流程
# ═══════════════════════════════════════════════════════════════════════

main() {
    log "═══════════════════════════════════════════════════════════"
    log "环境健康检查开始"
    log "═══════════════════════════════════════════════════════════"
    
    local all_passed=true
    local check_results="{}"
    
    # 执行各项检查
    check_api_service || all_passed=false
    check_database || all_passed=false
    check_redis || all_passed=false
    check_disk_space || all_passed=false
    check_memory || all_passed=false
    check_cpu || all_passed=false
    check_test_data
    
    # 自愈操作 (如果有问题)
    if [ "$all_passed" = "false" ]; then
        log "检测到异常,执行自愈操作..."
        cleanup_old_logs
        cleanup_node_modules
    fi
    
    # 生成报告
    if [ "$all_passed" = "true" ]; then
        generate_health_report "HEALTHY" "{}"
        log "✓ 所有检查通过"
    else
        generate_health_report "UNHEALTHY" "{}"
        log_error "部分检查失败,请关注"
    fi
    
    log "═══════════════════════════════════════════════════════════"
    log "健康检查完成"
    log "═══════════════════════════════════════════════════════════"
}

# 执行
main
