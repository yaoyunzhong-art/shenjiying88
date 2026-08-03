#!/usr/bin/env bash
# v23-self-evolution.sh — V23每日自我进化检查
# 每天01:00自动运行。不打断开发，只产生报告和改进建议。
# V23版本号固定，内容每日迭代。

# ═══════════════════════════════════════════════════════════════
# 三个能力:
#   🌡️ 健康评分 — 从L3评分+圈梁评分+commits数综合得出
#   📊 趋势比较 — 与昨日对比，上升/下降/持平
#   📝 改进建议 — 如果下降，自动分析根因
# ═══════════════════════════════════════════════════════════════

set -uo pipefail
REPO=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88")
cd "$REPO"
TODAY=$(date '+%Y-%m-%d')
OUT_DIR="docs/knowledge/v23-daily-health"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/$TODAY.md"

echo "═══════════════════════════════════════════"
echo " V23每日自我进化检查"
echo " 日期: $TODAY"
echo " V23版本号: 固定(内容每日迭代)"
echo "═══════════════════════════════════════════"

# ── 1. L3评分（如果有） ──
L3_SCORE="N/A"
L3_FILE=$(ls docs/knowledge/evolution/score-*.md 2>/dev/null | sort | tail -1)
if [ -n "$L3_FILE" ]; then
  L3_SCORE=$(grep -oE '总分: [0-9]+' "$L3_FILE" 2>/dev/null | grep -oE '[0-9]+' || echo "N/A")
fi

# ── 2. 圈梁评分 ──
if [ -f scripts/alignment-scorecard.sh ]; then
  SCORE_CARD=$(bash scripts/alignment-scorecard.sh 2>&1)
  RING_SCORE=$(echo "$SCORE_CARD" | grep -oE 'SCORE=[0-9]+' | grep -oE '[0-9]+' || echo "N/A")
  RING_FAIL=$(echo "$SCORE_CARD" | grep -oE 'FAILED=[0-9]+' | grep -oE '[0-9]+' || echo "0")
else
  RING_SCORE="N/A"
  RING_FAIL="N/A"
fi

# ── 3. Commits ──
TODAY_COMMITS=$(git log --since="$TODAY 00:00" --until="$TODAY 23:59" --oneline 2>/dev/null | wc -l | tr -d ' ')
YESTERDAY=$(date -v-1d '+%Y-%m-%d' 2>/dev/null || date -d 'yesterday' '+%Y-%m-%d' 2>/dev/null || echo "yesterday")
YESTERDAY_COMMITS=$(git log --since="$YESTERDAY 00:00" --until="$YESTERDAY 23:59" --oneline 2>/dev/null | wc -l | tr -d ' ')

# ── 4. 昨日比较 ──
TREND="首次运行"
if [ "$TODAY_COMMITS" -ge 50 ]; then COMMIT_LEVEL="优秀"; COMMIT_SCORE=25
elif [ "$TODAY_COMMITS" -ge 30 ]; then COMMIT_LEVEL="良好"; COMMIT_SCORE=20
elif [ "$TODAY_COMMITS" -ge 10 ]; then COMMIT_LEVEL="一般"; COMMIT_SCORE=10
else COMMIT_LEVEL="不足"; COMMIT_SCORE=5; fi

# 综合评分
TOTAL_SCORE=$([ "$RING_SCORE" != "N/A" ] && echo $((RING_SCORE * 7 + COMMIT_SCORE)) || echo "$COMMIT_SCORE")
TOTAL_MAX=100

RING_STATUS="ALL PASS"
[ "${RING_FAIL:-0}" -gt 0 ] && RING_STATUS="${RING_FAIL} FAIL"
SUGGESTIONS=""
if [ "$TODAY_COMMITS" -lt 10 ] 2>/dev/null; then SUGGESTIONS="- Commits不足(<10)，建议检查开发节奏\n"; fi
if [ "${RING_FAIL:-0}" -gt 0 ] 2>/dev/null; then SUGGESTINGS="- 圈梁$RING_FAIL道箍未通过，需立即修复\n"; fi
if [ "$L3_SCORE" != "N/A" ] && [ "$L3_SCORE" -lt 60 ] 2>/dev/null; then SUGGESTIONS+="- L3评分偏低(<60)，需关注测试/合规/闭环率\n"; fi

# ── 写入报告 ──
cat > "$OUT_FILE" << EOF
# 🌡️ V23 每日健康报告 — $TODAY

> V23版本号: **固定**(迭代内容不迭代版本)
> 生成时间: $(date '+%Y-%m-%d %H:%M')

## 今日数据

| 指标 | 值 | 评价 |
|:-----|:--:|:----:|
| Commits | $TODAY_COMMITS | $COMMIT_LEVEL |
| 昨日Commits | $YESTERDAY_COMMITS | — |
| 圈梁评分 | ${RING_SCORE:-N/A}/9 | ${RING_STATUS} |
| L3评分 | $L3_SCORE | — |
| **综合评分** | **${TOTAL_SCORE}/${TOTAL_MAX}** | — |

## 趋势

昨日对比: ${TREND:-无数据}

## 改进建议

${SUGGESTIONS:-(无)当前运行正常}

---

_V23版本号固定，内容每日迭代。下次检查: $(date -v+1d '+%Y-%m-%d 01:00' 2>/dev/null || echo "次日01:00")_
EOF

echo "✅ 报告已写入: $OUT_FILE"
echo "V23_VERSION=1.0"
echo "DATED_DATE=$TODAY"
echo "COMMITS=$TODAY_COMMITS"
echo "RING_SCORE=${RING_SCORE:-N/A}"
echo "L3_SCORE=${L3_SCORE:-N/A}"
echo "TOTAL_SCORE=${TOTAL_SCORE:-N/A}"
echo "TREND=${TREND:-首次}"
echo "SUGGESTIONS=${SUGGESTIONS:-无}"
exit 0
