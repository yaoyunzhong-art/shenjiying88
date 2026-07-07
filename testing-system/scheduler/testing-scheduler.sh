#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Testing System Scheduler · 测试调度中心 V1.0
# 功能: 定时触发/异常重试/断点续跑/7×16小时无间断运行
# ═══════════════════════════════════════════════════════════════════════

set -e

# 加载共享 lib (使用绝对路径)
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(cd "$SCRIPT_DIR" && pwd)"
source "${SCRIPT_DIR}/lib/shift-window.sh"
source "${SCRIPT_DIR}/lib/test-runner.sh"

# 配置
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M%S)
LOG_DIR="testing-system/logs/scheduler"
REPORT_DIR="testing-system/reports"
STATE_FILE="testing-system/.scheduler.state"
PID_FILE="testing-system/.scheduler.pid"

# 创建目录
mkdir -p "$LOG_DIR" "$REPORT_DIR"

# 日志
LOG_FILE="$LOG_DIR/scheduler-${DATE}.log"
ERROR_FILE="$LOG_DIR/scheduler-error-${DATE}.log"

# 调度配置
SCHEDULE_FILE="testing-system/.schedule.conf"

# ═══════════════════════════════════════════════════════════════════════
# 工具函数
# ═══════════════════════════════════════════════════════════════════════

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_FILE"
}

# 保存状态 (断点续跑)
save_state() {
    local key=$1
    local value=$2
    mkdir -p "$(dirname "$STATE_FILE")"
    echo "${key}=${value}" >> "$STATE_FILE"
}

# 读取状态
get_state() {
    local key=$1
    grep "^${key}=" "$STATE_FILE" 2>/dev/null | tail -1 | cut -d'=' -f2
}

# 清除状态
clear_state() {
    > "$STATE_FILE"
}

# ═══════════════════════════════════════════════════════════════════════
# 任务执行
# ═══════════════════════════════════════════════════════════════════════

run_task() {
    local task_name=$1
    local task_script=$2
    local max_retries=${3:-3}
    local retry_delay=${4:-60}

    log "━━━ 开始任务: ${task_name} ━━━"

    local attempt=1
    local success=false

    while [ $attempt -le $max_retries ] && [ "$success" = "false" ]; do
        log "[尝试 ${attempt}/${max_retries}] 执行 ${task_script}"

        # 执行任务
        if bash "$task_script" >> "$LOG_FILE" 2>> "$ERROR_FILE"; then
            log "✓ 任务成功: ${task_name}"
            success=true
            save_state "LAST_${task_name}_SUCCESS" "$(date +%s)"
        else
            log_error "✗ 任务失败: ${task_name} (尝试 ${attempt})"

            if [ $attempt -lt $max_retries ]; then
                log "等待 ${retry_delay} 秒后重试..."
                sleep $retry_delay
            fi

            ((attempt++))
        fi
    done

    if [ "$success" = "false" ]; then
        log_error "任务彻底失败: ${task_name}"
        save_state "LAST_${task_name}_FAIL" "$(date +%s)"
        return 1
    fi

    return 0
}

# ═══════════════════════════════════════════════════════════════════════
# 测试任务定义 (6 段 pnpm test 模板, 内部走 lib/test-runner.sh)
# ═══════════════════════════════════════════════════════════════════════

run_unit_tests() {
    run_pnpm_test "unit" "单元测试" 20
}

run_integration_tests() {
    run_pnpm_test "integration" "集成测试" 20
}

run_api_tests() {
    run_pnpm_test "api" "接口测试" 20
}

run_e2e_cashier() {
    run_pnpm_test "cashier" "E2E-收银台" 30
}

run_e2e_member() {
    run_pnpm_test "member" "E2E-会员" 30
}

run_smoke_tests() {
    run_pnpm_test "cashier/member/coupon" "冒烟测试" 40
}

# ═══════════════════════════════════════════════════════════════════════
# 调度主循环
# ═══════════════════════════════════════════════════════════════════════

main_loop() {
    log "═══════════════════════════════════════════════════════════"
    log "测试调度中心启动"
    log "日期: $(date '+%Y-%m-%d %H:%M:%S')"
    log "班次: $(get_shift)"
    log "═══════════════════════════════════════════════════════════"
    
    # 检查是否在运行时段
    if ! is_run_window; then
        log "[$(get_shift)] 非运行时段,进入守护模式..."
    else
        log "[$(get_shift)] 运行时段,开始调度..."
    fi
    
    local cycle=0
    local last_full_run=""
    
    while true; do
        cycle=$((cycle + 1))
        local shift=$(get_shift)
        local hour=$(date +%H)
        local minute=$(date +%M)
        
        # ─────────────────────────────────────────────────────────
        # 运行时段逻辑 (15:00-23:00, 07:00-15:00)
        # ─────────────────────────────────────────────────────────
        if is_run_window; then
            
            log "━━━ 周期 ${cycle} | 班次 ${shift} | $(date '+%H:%M') ━━━"
            
            # ─── 每30分钟: 冒烟测试 ───
            if [ "$minute" = "00" ] || [ "$minute" = "30" ]; then
                # 直接运行冒烟测试 (只运行api包)
                log "━━━ 冒烟测试 ━━━"
                cd_to_root
                cd apps/api
                # 运行 cashier/member/coupon 模块的 vitest 测试
                pnpm vitest run src/modules/cashier src/modules/member src/modules/coupon --reporter=dot 2>&1 | tail -20
                local exit_code=$?
                if [ $exit_code -eq 0 ]; then
                    log "✓ 冒烟测试通过"
                    echo "$(date +%s),SMOKE,$(get_shift),PASS" >> testing-system/.heartbeat
                else
                    log_error "✗ 冒烟测试失败 (exit: $exit_code)"
                    echo "$(date +%s),SMOKE,$(get_shift),FAIL" >> testing-system/.heartbeat
                fi
                cd "$OLDPWD" 2>/dev/null || cd_to_root
            fi
            
            # ─── 每2小时: 完整测试套件 ───
            if [ "$minute" = "00" ] && [ $((hour % 2)) -eq 1 ]; then
                log "【完整测试套件】开始..."
                
                # 单元测试
                run_task "单元测试" <(run_unit_tests) 3 60
                
                # 集成测试
                run_task "集成测试" <(run_integration_tests) 3 60
                
                # 接口测试
                run_task "接口测试" <(run_api_tests) 3 60
                
                # E2E测试
                run_task "E2E-收银台" <(run_e2e_cashier) 3 60
                run_task "E2E-会员" <(run_e2e_member) 3 60
                
                last_full_run=$(date +%Y-%m-%d\ %H:%M)
                log "【完整测试套件】完成. 上次完整运行: ${last_full_run}"
            fi
            
            # ─── 班次交接时: 关键复测 ───
            if [ "$shift" = "A" ] && [ "$hour" = "22" ] && [ "$minute" = "30" ]; then
                log "【A班交接前复测】..."
                run_task "交接前复测" <(run_smoke_tests) 2 30
            fi
            
            if [ "$shift" = "B" ] && [ "$hour" = "14" ] && [ "$minute" = "30" ]; then
                log "【B班交接前复测】..."
                run_task "交接前复测" <(run_smoke_tests) 2 30
            fi
            
        else
            # ─────────────────────────────────────────────────────────
            # 非运行时段: 守护/健康检查/环境巡检
            # ─────────────────────────────────────────────────────────
            if [ $((cycle % 10)) -eq 0 ]; then
                log "[守护模式] 周期 ${cycle} | $(date '+%H:%M')"
                
                # 环境健康检查
                if [ -f "testing-system/health/run-health-check.sh" ]; then
                    bash testing-system/health/run-health-check.sh >> "$LOG_FILE" 2>> "$ERROR_FILE" || true
                fi
                
                # 发送心跳
                echo "$(date +%s),IDLE,OFF" >> testing-system/.heartbeat
            fi
        fi
        
        # ─────────────────────────────────────────────────────────
        # 每分钟: 检查是否有紧急任务
        # ─────────────────────────────────────────────────────────
        if [ -f "testing-system/.urgent-task" ]; then
            local urgent=$(cat testing-system/.urgent-task)
            rm -f testing-system/.urgent-task
            log "【紧急任务】: $urgent"
            bash "$urgent" >> "$LOG_FILE" 2>> "$ERROR_FILE" || true
        fi
        
        sleep 60
    done
}

# ═══════════════════════════════════════════════════════════════════════
# 信号处理
# ═══════════════════════════════════════════════════════════════════════

cleanup() {
    log "收到停止信号,正在清理..."
    log "保存当前状态..."
    save_state "LAST_RUN" "$(date +%Y-%m-%d\ %H:%M:%S)"
    save_state "LAST_CYCLE" "$cycle"
    log "测试调度中心已停止"
    exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP

# ═══════════════════════════════════════════════════════════════════════
# 启动
# ═══════════════════════════════════════════════════════════════════════

# 检查是否已在运行
if [ -f "$PID_FILE" ]; then
    old_pid=$(cat "$PID_FILE")
    if kill -0 "$old_pid" 2>/dev/null; then
        log "警告: 调度中心已在运行 (PID: $old_pid)"
        exit 1
    fi
fi

# 保存PID
echo $$ > "$PID_FILE"

# 清理旧状态 (新的一天)
if [ "$(date +%H%M)" = "0000" ]; then
    clear_state
    log "新的一天,状态已重置"
fi

# 恢复上次状态
if [ -f "$STATE_FILE" ]; then
    log "恢复上次状态:"
    cat "$STATE_FILE" | while read line; do log "  $line"; done
fi

# 启动主循环
main_loop &

log "测试调度中心已启动 (PID: $!)"
log "日志文件: $LOG_FILE"
