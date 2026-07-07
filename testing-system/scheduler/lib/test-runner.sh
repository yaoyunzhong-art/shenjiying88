#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Test Runner Helpers · 通用 pnpm test runner
# 集中 6 段 pnpm test -- {name} --run 模板, 路径锚定 + log 前缀 + 退出码处理
# ═══════════════════════════════════════════════════════════════════════

# ─── 路径锚定 ────────────────────────────────────────────────────────────

# 切到 monorepo 根目录 (向上找 pnpm-workspace.yaml 标记)
# 取代 6 处 inline `cd "$(dirname "${BASH_SOURCE[0]}")/../.."`
# 自寻根: 鲁棒, 不依赖 lib 嵌套深度
cd_to_root() {
    local dir
    dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    while [ "$dir" != "/" ] && [ ! -f "$dir/pnpm-workspace.yaml" ]; do
        dir="$(dirname "$dir")"
    done
    if [ ! -f "$dir/pnpm-workspace.yaml" ]; then
        echo "ERROR: monorepo root not found (no pnpm-workspace.yaml)" >&2
        return 1
    fi
    cd "$dir"
}

# ─── 任务规格表 ──────────────────────────────────────────────────────────
# 格式: "name|display_name|tail_lines"
# - name: pnpm test -- <name> 用的过滤名
# - display_name: 日志前缀
# - tail_lines: 日志保留最后 N 行
TEST_SPECS=(
    "unit|单元测试|20"
    "integration|集成测试|20"
    "api|接口测试|20"
    "cashier|E2E-收银台|30"
    "member|E2E-会员|30"
    "smoke|冒烟测试|40"
)

# ─── 通用 runner ─────────────────────────────────────────────────────────
# 用法: run_pnpm_test "cashier" "E2E-收银台" 30
# 内部: log + cd 根目录 + pnpm test + 捕获 exit code
run_pnpm_test() {
    local name=$1
    local display_name=$2
    local tail_lines=$3

    log "【${display_name}】开始执行..."
    cd_to_root
    pnpm test -- "$name" --run 2>&1 | tail -"${tail_lines}"
    local exit_code=${PIPESTATUS[0]}
    return "$exit_code"
}
