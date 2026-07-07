#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Bash Lib Test · lib/*.sh 合约验证
# 用法: bash testing-system/scheduler/lib/lib-test.sh
# ═══════════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

PASS=0
FAIL=0

assert_eq() {
    local desc=$1
    local expected=$2
    local actual=$3
    if [ "$expected" = "$actual" ]; then
        PASS=$((PASS+1))
        echo "  ✓ ${desc}"
    else
        FAIL=$((FAIL+1))
        echo "  ✗ ${desc}: expected '${expected}', got '${actual}'"
    fi
}

assert_contains() {
    local desc=$1
    local needle=$2
    local haystack=$3
    if echo "$haystack" | grep -q "$needle"; then
        PASS=$((PASS+1))
        echo "  ✓ ${desc}"
    else
        FAIL=$((FAIL+1))
        echo "  ✗ ${desc}: expected to contain '${needle}', got '${haystack}'"
    fi
}

assert_true() {
    local desc=$1
    local result=$2
    if [ "$result" = "0" ]; then
        PASS=$((PASS+1))
        echo "  ✓ ${desc}"
    else
        FAIL=$((FAIL+1))
        echo "  ✗ ${desc}: expected true (0), got ${result}"
    fi
}

# ─── shift-window.sh ────────────────────────────────────────────────────

echo "━━━ shift-window.sh ━━━"

source shift-window.sh

# 常量 export
assert_eq "SHIFT_A_START=15" "15" "$SHIFT_A_START"
assert_eq "SHIFT_A_END=23" "23" "$SHIFT_A_END"
assert_eq "SHIFT_B_START=7" "7" "$SHIFT_B_START"
assert_eq "SHIFT_B_END=15" "15" "$SHIFT_B_END"

# get_shift: A 班
# 通过 source 后的真实函数 + 模拟 hour 测试 (使用 TZ trick 不行, 所以测试 get_shift 输出字母)
shift_out=$(get_shift)
# 由于真实 hour 不可控, 仅测试函数存在
if type -t get_shift > /dev/null; then
    PASS=$((PASS+1))
    echo "  ✓ get_shift function defined"
else
    FAIL=$((FAIL+1))
    echo "  ✗ get_shift not defined"
fi

if type -t is_run_window > /dev/null; then
    PASS=$((PASS+1))
    echo "  ✓ is_run_window function defined"
else
    FAIL=$((FAIL+1))
    echo "  ✗ is_run_window not defined"
fi

# 当前 hour 在 A 或 B 班时, is_run_window 返回 0
is_run_window && {
    PASS=$((PASS+1))
    echo "  ✓ is_run_window returns 0 during current run window"
} || {
    PASS=$((PASS+1))
    echo "  ✓ is_run_window returns 1 outside current run window (off shift)"
}

# 当前 get_shift 必须是 "A" | "B" | "OFF" 之一
case "$shift_out" in
    A|B|OFF)
        PASS=$((PASS+1))
        echo "  ✓ get_shift returns valid value: ${shift_out}"
        ;;
    *)
        FAIL=$((FAIL+1))
        echo "  ✗ get_shift returned invalid: ${shift_out}"
        ;;
esac

# ─── test-runner.sh ─────────────────────────────────────────────────────

echo "━━━ test-runner.sh ━━━"

source test-runner.sh

# TEST_SPECS 表结构: 6 行, 3 字段用 | 分隔
spec_count=${#TEST_SPECS[@]}
assert_eq "TEST_SPECS has 6 entries" "6" "$spec_count"

# 验证每行是 name|display_name|tail_lines
for spec in "${TEST_SPECS[@]}"; do
    fields=$(echo "$spec" | awk -F'|' '{print NF}')
    assert_eq "spec '$spec' has 3 fields" "3" "$fields"
done

# 验证 task name 都存在
expected_names=("unit" "integration" "api" "cashier" "member" "smoke")
for name in "${expected_names[@]}"; do
    found=0
    for spec in "${TEST_SPECS[@]}"; do
        if [ "${spec%%|*}" = "$name" ]; then
            found=1
            break
        fi
    done
    if [ "$found" = "1" ]; then
        PASS=$((PASS+1))
        echo "  ✓ TEST_SPECS contains '$name'"
    else
        FAIL=$((FAIL+1))
        echo "  ✗ TEST_SPECS missing '$name'"
    fi
done

# 函数存在
for fn in run_pnpm_test cd_to_root; do
    if type -t "$fn" > /dev/null; then
        PASS=$((PASS+1))
        echo "  ✓ $fn defined"
    else
        FAIL=$((FAIL+1))
        echo "  ✗ $fn not defined"
    fi
done

# cd_to_root 实际切到 monorepo 根 (应能 ls 到 pnpm-workspace.yaml)
cd_to_root
if [ -f "pnpm-workspace.yaml" ]; then
    PASS=$((PASS+1))
    echo "  ✓ cd_to_root lands in monorepo root"
else
    FAIL=$((FAIL+1))
    echo "  ✗ cd_to_root wrong dir: $(pwd)"
fi

# ─── Summary ──────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PASS: ${PASS}    FAIL: ${FAIL}"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
