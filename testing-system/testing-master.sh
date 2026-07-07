#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Testing Master · 测试体系主入口 V1.0
# 
# 功能:
# - 一键启动完整测试体系
# - 7×16小时不间断运行
# - 后台静默执行
# ═══════════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# 配置
SYSTEM_DIR="testing-system"
LOG_DIR="$SYSTEM_DIR/logs"
PID_DIR="$SYSTEM_DIR/.pids"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARN:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

# ═══════════════════════════════════════════════════════════════════════
# 前置检查
# ═══════════════════════════════════════════════════════════════════════

preflight_check() {
    log "━━━ 前置检查 ━━━"
    
    # 检查必要目录
    mkdir -p "$LOG_DIR" "$PID_DIR" "$SYSTEM_DIR/testdata"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装"
        exit 1
    fi
    log "✓ Node.js: $(node --version)"
    
    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        error "pnpm 未安装"
        exit 1
    fi
    log "✓ pnpm: $(pnpm --version)"
    
    # 检查必要的测试脚本
    if [ ! -d "apps/api/src/modules" ]; then
        error "apps/api/src/modules 目录不存在"
        exit 1
    fi
    log "✓ API模块目录存在"
    
    # 检查测试框架
    if [ ! -f "$SYSTEM_DIR/scheduler/testing-scheduler.sh" ]; then
        error "测试调度脚本不存在"
        exit 1
    fi
    log "✓ 测试调度脚本存在"
    
    log "━━━ 前置检查完成 ━━━"
}

# ═══════════════════════════════════════════════════════════════════════
# 启动服务
# ═══════════════════════════════════════════════════════════════════════

start_scheduler() {
    log "━━━ 启动测试调度中心 ━━━"
    
    # 检查是否已在运行
    if [ -f "$PID_DIR/scheduler.pid" ]; then
        local old_pid=$(cat "$PID_DIR/scheduler.pid")
        if kill -0 "$old_pid" 2>/dev/null; then
            warn "测试调度中心已在运行 (PID: $old_pid)"
            return 0
        fi
    fi
    
    # 使脚本可执行
    chmod +x "$SYSTEM_DIR/scheduler/testing-scheduler.sh"
    chmod +x "$SYSTEM_DIR/health/run-health-check.sh"
    
    # 后台启动调度中心
    nohup bash "$SYSTEM_DIR/scheduler/testing-scheduler.sh" \
        >> "$LOG_DIR/scheduler.out.log" 2>&1 &
    
    local pid=$!
    echo $pid > "$PID_DIR/scheduler.pid"
    
    sleep 2
    
    if kill -0 "$pid" 2>/dev/null; then
        log "✓ 测试调度中心已启动 (PID: $pid)"
        return 0
    else
        error "测试调度中心启动失败"
        return 1
    fi
}

start_health_monitor() {
    log "━━━ 启动健康监控 ━━━"
    
    # 每5分钟运行一次健康检查
    (
        while true; do
            bash "$SYSTEM_DIR/health/run-health-check.sh" >> "$LOG_DIR/health.log" 2>&1
            sleep 300  # 5分钟
        done
    ) &
    
    local pid=$!
    echo $pid > "$PID_DIR/health.pid"
    
    log "✓ 健康监控已启动 (PID: $pid)"
}

start_report_generator() {
    log "━━━ 启动报告生成器 ━━━"
    
    # 每天23:00生成日报
    (
        while true; do
            local current_hour=$(date +%H)
            if [ "$current_hour" = "23" ]; then
                # 生成日报
                local report_file="$SYSTEM_DIR/reports/daily-$(date +%Y%m%d).md"
                echo "# 测试日报 $(date '+%Y-%m-%d')" > "$report_file"
                echo "" >> "$report_file"
                echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
                
                # 汇总日志
                echo "" >> "$report_file"
                echo "## 测试执行摘要" >> "$report_file"
                tail -100 "$LOG_DIR/scheduler.log" 2>/dev/null >> "$report_file" || true
                
                log "✓ 日报已生成: $report_file"
            fi
            sleep 3600  # 每小时检查一次
        done
    ) &
    
    local pid=$!
    echo $pid > "$PID_DIR/reporter.pid"
    
    log "✓ 报告生成器已启动 (PID: $pid)"
}

# ═══════════════════════════════════════════════════════════════════════
# 停止服务
# ═══════════════════════════════════════════════════════════════════════

stop_all() {
    log "━━━ 停止所有服务 ━━━"
    
    # 停止调度中心
    if [ -f "$PID_DIR/scheduler.pid" ]; then
        local pid=$(cat "$PID_DIR/scheduler.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            sleep 1
            log "✓ 调度中心已停止 (PID: $pid)"
        fi
        rm -f "$PID_DIR/scheduler.pid"
    fi
    
    # 停止健康监控
    if [ -f "$PID_DIR/health.pid" ]; then
        local pid=$(cat "$PID_DIR/health.pid")
        kill "$pid" 2>/dev/null || true
        rm -f "$PID_DIR/health.pid"
        log "✓ 健康监控已停止"
    fi
    
    # 停止报告生成器
    if [ -f "$PID_DIR/reporter.pid" ]; then
        local pid=$(cat "$PID_DIR/reporter.pid")
        kill "$pid" 2>/dev/null || true
        rm -f "$PID_DIR/reporter.pid"
        log "✓ 报告生成器已停止"
    fi
    
    log "━━━ 所有服务已停止 ━━━"
}

# ═══════════════════════════════════════════════════════════════════════
# 状态检查
# ═══════════════════════════════════════════════════════════════════════

status() {
    log "━━━ 服务状态 ━━━"
    
    local running=0
    local stopped=0
    
    # 检查调度中心
    if [ -f "$PID_DIR/scheduler.pid" ]; then
        local pid=$(cat "$PID_DIR/scheduler.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "✓ 测试调度中心: ${GREEN}运行中${NC} (PID: $pid)"
            ((running++))
        else
            echo -e "✗ 测试调度中心: ${RED}已停止${NC} (PID文件存在但进程不存在)"
            ((stopped++))
        fi
    else
        echo -e "○ 测试调度中心: ${YELLOW}未启动${NC}"
        ((stopped++))
    fi
    
    # 检查健康监控
    if [ -f "$PID_DIR/health.pid" ]; then
        local pid=$(cat "$PID_DIR/health.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "✓ 健康监控: ${GREEN}运行中${NC} (PID: $pid)"
            ((running++))
        else
            echo -e "✗ 健康监控: ${RED}已停止${NC}"
            ((stopped++))
        fi
    else
        echo -e "○ 健康监控: ${YELLOW}未启动${NC}"
    fi
    
    # 检查报告生成器
    if [ -f "$PID_DIR/reporter.pid" ]; then
        local pid=$(cat "$PID_DIR/reporter.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "✓ 报告生成器: ${GREEN}运行中${NC} (PID: $pid)"
            ((running++))
        else
            echo -e "✗ 报告生成器: ${RED}已停止${NC}"
            ((stopped++))
        fi
    else
        echo -e "○ 报告生成器: ${YELLOW}未启动${NC}"
    fi
    
    echo ""
    echo "运行中: $running | 已停止: $stopped"
    echo ""
    
    # 显示最新日志
    if [ -f "$LOG_DIR/scheduler.out.log" ]; then
        echo "━━━ 最新调度日志 ━━━"
        tail -5 "$LOG_DIR/scheduler.out.log" 2>/dev/null || echo "(无日志)"
        echo ""
    fi
}

# ═══════════════════════════════════════════════════════════════════════
# 手动执行测试
# ═══════════════════════════════════════════════════════════════════════

run_tests() {
    log "━━━ 手动执行测试 ━━━"
    
    local module=${1:-"all"}
    
    case "$module" in
        "unit")
            log "执行单元测试..."
            cd apps/api && pnpm test -- --run 2>&1 | tail -50
            ;;
        "cashier")
            log "执行收银台测试..."
            cd apps/api && pnpm test -- cashier --run 2>&1 | tail -50
            ;;
        "member")
            log "执行会员测试..."
            cd apps/api && pnpm test -- member --run 2>&1 | tail -50
            ;;
        "smoke")
            log "执行冒烟测试..."
            cd apps/api && pnpm test -- cashier/member/coupon --run 2>&1 | tail -50
            ;;
        "all")
            log "执行完整测试套件..."
            cd apps/api && pnpm test -- --run 2>&1 | tail -100
            ;;
        *)
            error "未知模块: $module"
            echo "可用模块: unit, cashier, member, smoke, all"
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════
# 查看日志
# ═══════════════════════════════════════════════════════════════════════

show_logs() {
    local lines=${1:-50}
    
    echo "━━━ 测试调度日志 (最后 $lines 行) ━━━"
    if [ -f "$LOG_DIR/scheduler.out.log" ]; then
        tail -$lines "$LOG_DIR/scheduler.out.log"
    else
        echo "(日志文件不存在)"
    fi
    
    echo ""
    echo "━━━ 健康检查日志 (最后 $lines 行) ━━━"
    if [ -f "$LOG_DIR/health.log" ]; then
        tail -$lines "$LOG_DIR/health.log"
    else
        echo "(日志文件不存在)"
    fi
}

# ═══════════════════════════════════════════════════════════════════════
# 安装cron定时任务
# ═══════════════════════════════════════════════════════════════════════

install_cron() {
    log "━━━ 安装Cron定时任务 ━━━"
    
    # 移除旧任务
    crontab -r 2>/dev/null || true
    
    # 添加新任务
    (crontab -l 2>/dev/null; cat << 'EOF'
# 测试调度中心 - 每分钟检查
* * * * * bash $(pwd)/testing-system/scheduler/testing-scheduler.sh >> $(pwd)/testing-system/logs/cron.log 2>&1

# 健康检查 - 每5分钟
*/5 * * * * bash $(pwd)/testing-system/health/run-health-check.sh >> $(pwd)/testing-system/logs/health-cron.log 2>&1

# 每日报告 - 23:00
0 23 * * * bash -c 'echo "# 测试日报 $(date +\%Y-\%m-\%d)" > testing-system/reports/daily-$(date +\%Y\%m\%d).md'
EOF
) | crontab -
    
    log "✓ Cron任务已安装"
    crontab -l
}

# ═══════════════════════════════════════════════════════════════════════
# 主菜单
# ═══════════════════════════════════════════════════════════════════════

show_help() {
    cat << EOF
╔══════════════════════════════════════════════════════════════════════╗
║           Testing Master · 测试体系管理 V1.0                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   start     启动完整测试体系 (调度+监控+报告)                       ║
║   stop      停止所有服务                                            ║
║   restart   重启所有服务                                             ║
║   status    查看服务状态                                              ║
║                                                                      ║
║   test      手动执行测试                                             ║
║             - unit    单元测试                                      ║
║             - cashier 收银台模块                                     ║
║             - member  会员模块                                       ║
║             - smoke   冒烟测试                                       ║
║             - all     完整测试套件                                   ║
║                                                                      ║
║   logs      查看日志 (默认50行)                                      ║
║             logs 100 查看更多                                        ║
║                                                                      ║
║   install   安装Cron定时任务 (开机自启)                              ║
║   uninstall 卸载Cron定时任务                                          ║
║                                                                      ║
║   help      显示帮助                                                ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

运行时段:
  A班: 15:00 - 23:00 (下午测试)
  B班: 07:00 - 15:00 (上午测试)
  休班: 23:00 - 07:00 (守护模式)
EOF
}

# ═══════════════════════════════════════════════════════════════════════
# 主入口
# ═══════════════════════════════════════════════════════════════════════

COMMAND=${1:-help}

case "$COMMAND" in
    "start")
        preflight_check
        start_scheduler
        start_health_monitor
        start_report_generator
        log ""
        log "═══════════════════════════════════════════════════════════"
        log "✓ 测试体系已全面启动"
        log "═══════════════════════════════════════════════════════════"
        status
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        stop_all
        sleep 2
        preflight_check
        start_scheduler
        start_health_monitor
        start_report_generator
        log "✓ 测试体系已重启"
        ;;
    "status")
        status
        ;;
    "test")
        run_tests $2
        ;;
    "logs")
        show_logs $2
        ;;
    "install")
        install_cron
        ;;
    "uninstall")
        crontab -r 2>/dev/null || true
        log "✓ Cron任务已卸载"
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        error "未知命令: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
