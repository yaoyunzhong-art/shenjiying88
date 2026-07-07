#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Shift Window Helpers · 班次时间窗口判断
# 集中维护 A 班 / B 班阈值, is_run_window / get_shift 共用
# ═══════════════════════════════════════════════════════════════════════

# ─── 班次时间常量 (24h 整点) ─────────────────────────────────────────────
# A 班: 15:00 - 23:00 (8h)
# B 班: 07:00 - 15:00 (8h)
# OFF 班: 23:00 - 07:00 (8h, 仅守护模式)

export SHIFT_A_START=15
export SHIFT_A_END=23
export SHIFT_B_START=7
export SHIFT_B_END=15

# ─── 班次判断 ────────────────────────────────────────────────────────────

# 检查是否在运行时段 (A 班或 B 班)
is_run_window() {
    local hour=$(date +%H)
    if [ "$hour" -ge "$SHIFT_A_START" ] && [ "$hour" -lt "$SHIFT_A_END" ]; then
        return 0
    fi
    if [ "$hour" -ge "$SHIFT_B_START" ] && [ "$hour" -lt "$SHIFT_B_END" ]; then
        return 0
    fi
    return 1
}

# 获取当前班次 ("A" | "B" | "OFF")
get_shift() {
    local hour=$(date +%H)
    if [ "$hour" -ge "$SHIFT_A_START" ] && [ "$hour" -lt "$SHIFT_A_END" ]; then
        echo "A"
    elif [ "$hour" -ge "$SHIFT_B_START" ] && [ "$hour" -lt "$SHIFT_B_END" ]; then
        echo "B"
    else
        echo "OFF"
    fi
}
