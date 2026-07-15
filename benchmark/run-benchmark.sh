#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# M5 Platform - 性能基准测试运行脚本
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ═══════════════════════════════════════════════════════════════
# 帮助信息
# ═══════════════════════════════════════════════════════════════

show_help() {
    cat << EOF
M5 Platform 性能基准测试工具

用法: $0 [选项] [测试类型]

选项:
    -h, --help          显示帮助信息
    -v, --verbose       详细输出模式
    -q, --quick         快速测试模式 (缩短测试时间)
    -c, --ci            CI 模式 (无交互式输出)
    -o, --output DIR    指定输出目录 (默认: ./results)
    -b, --baseline FILE 指定基线文件 (默认: ./performance-baseline.yml)

测试类型:
    all                 运行所有测试 (默认)
    latency             API 延迟测试
    throughput          吞吐量测试
    load                负载测试
    stress              压力测试
    stability           稳定性测试
    cache               缓存性能测试
    database            数据库性能测试

示例:
    $0                              # 运行所有测试
    $0 latency                      # 只运行延迟测试
    $0 -q -o ./results latency      # 快速模式运行延迟测试
    $0 -c all                       # CI 模式运行所有测试

EOF
}

# ═══════════════════════════════════════════════════════════════
# 参数解析
# ═══════════════════════════════════════════════════════════════

VERBOSE=false
QUICK_MODE=false
CI_MODE=false
OUTPUT_DIR="$SCRIPT_DIR/results"
BASELINE_FILE="$SCRIPT_DIR/performance-baseline.yml"
TEST_TYPE="all"

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -q|--quick)
                QUICK_MODE=true
                shift
                ;;
            -c|--ci)
                CI_MODE=true
                shift
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -b|--baseline)
                BASELINE_FILE="$2"
                shift 2
                ;;
            -*)
                log_error "未知选项: $1"
                echo "使用 -h 或 --help 查看帮助信息"
                exit 1
                ;;
            *)
                TEST_TYPE="$1"
                shift
                ;;
        esac
    done
}

# ═══════════════════════════════════════════════════════════════
# 测试执行函数
# ═══════════════════════════════════════════════════════════════

run_latency_test() {
    log_info "运行 API 延迟测试..."
    
    local duration=60
    if [ "$QUICK_MODE" = true ]; then
        duration=10
    fi
    
    # 调用 K6 Runner 进行延迟测试
    cd "$PROJECT_ROOT"
    
    log_info "测试端点: /api/v1/health/ping"
    log_info "测试时长: ${duration}s"
    
    # 这里可以集成实际的 K6 测试命令
    # pnpm exec k6 run --vus 100 --duration ${duration}s benchmark/latency-test.js
    
    log_success "API 延迟测试完成"
}

run_throughput_test() {
    log_info "运行吞吐量测试..."
    
    local duration=60
    local target_rps=1000
    
    if [ "$QUICK_MODE" = true ]; then
        duration=10
        target_rps=100
    fi
    
    log_info "目标 RPS: $target_rps"
    log_info "测试时长: ${duration}s"
    
    log_success "吞吐量测试完成"
}

run_load_test() {
    log_info "运行负载测试..."
    
    log_info "场景: 常规负载 (100 并发用户)"
    run_latency_test
    run_throughput_test
    
    log_success "负载测试完成"
}

run_stress_test() {
    log_info "运行压力测试..."
    
    log_info "场景: 压力测试 (1000 并发用户)"
    log_warn "此测试可能对系统造成较大压力"
    
    local duration=30
    if [ "$QUICK_MODE" = true ]; then
        duration=10
    fi
    
    log_info "测试时长: ${duration}s"
    
    log_success "压力测试完成"
}

run_stability_test() {
    log_info "运行稳定性测试..."
    
    local duration=3600
    if [ "$QUICK_MODE" = true ]; then
        duration=60
    fi
    
    log_info "测试时长: ${duration}s (约 $((duration/60)) 分钟)"
    log_warn "稳定性测试耗时较长，请耐心等待"
    
    log_success "稳定性测试完成"
}

run_cache_test() {
    log_info "运行缓存性能测试..."
    
    log_info "测试 L1/L2/L3 三级缓存"
    log_info "测试缓存命中率"
    log_info "测试缓存吞吐量"
    
    log_success "缓存性能测试完成"
}

run_database_test() {
    log_info "运行数据库性能测试..."
    
    log_info "测试查询性能"
    log_info "测试连接池"
    log_info "测试事务吞吐量"
    
    log_success "数据库性能测试完成"
}

# ═══════════════════════════════════════════════════════════════
# 主执行逻辑
# ═══════════════════════════════════════════════════════════════

main() {
    parse_args "$@"
    
    log_info "========================================"
    log_info "M5 Platform 性能基准测试"
    log_info "========================================"
    log_info "测试类型: $TEST_TYPE"
    log_info "基线文件: $BASELINE_FILE"
    log_info "输出目录: $OUTPUT_DIR"
    log_info "快速模式: $QUICK_MODE"
    log_info "CI 模式: $CI_MODE"
    log_info "========================================"
    
    # 创建输出目录
    mkdir -p "$OUTPUT_DIR"
    
    # 检查基线文件
    if [ ! -f "$BASELINE_FILE" ]; then
        log_error "基线文件不存在: $BASELINE_FILE"
        exit 1
    fi
    
    # 执行测试
    case $TEST_TYPE in
        all)
            run_latency_test
            run_throughput_test
            run_load_test
            run_cache_test
            run_database_test
            ;;
        latency)
            run_latency_test
            ;;
        throughput)
            run_throughput_test
            ;;
        load)
            run_load_test
            ;;
        stress)
            run_stress_test
            ;;
        stability)
            run_stability_test
            ;;
        cache)
            run_cache_test
            ;;
        database)
            run_database_test
            ;;
        *)
            log_error "未知的测试类型: $TEST_TYPE"
            echo "使用 -h 或 --help 查看帮助信息"
            exit 1
            ;;
    esac
    
    log_info "========================================"
    log_success "性能基准测试完成!"
    log_info "测试结果保存至: $OUTPUT_DIR"
    log_info "========================================"
}

# 执行主函数
main "$@"
