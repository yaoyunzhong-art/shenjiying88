#!/usr/bin/env bash
# ============================================================
# 审计新鲜度检查
# 检查 docs/knowledge/ 下所有 audit 文件最后更新日期
# 输出: 🟢 <7天 / 🟡 7-14天 / 🔴 >14天
# 输出文件: docs/knowledge/audit-freshness-YYYY-MM-DD.md
# 🐜 [V17: audit-quality-fuse]
# ============================================================
set -euo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
KNOWLEDGE_DIR="$PROJECT/docs/knowledge"
TODAY="$(date +%Y-%m-%d)"
TODAY_EPOCH="$(date +%s)"
OUTFILE="$KNOWLEDGE_DIR/audit-freshness-$TODAY.md"

# 7天/14天阈值 (秒)
WARN_SECONDS=$(( 7 * 86400 ))
CRIT_SECONDS=$(( 14 * 86400 ))

total=0
green=0
yellow=0
red=0
green_lines=""
yellow_lines=""
red_lines=""

echo "Collecting audit files under $KNOWLEDGE_DIR ..."

for f in "$KNOWLEDGE_DIR"/*-audit.md; do
    [ -f "$f" ] || continue
    total=$(( total + 1 ))
    basename=$(basename "$f")
    mtime_str=$(stat -f "%Sm" -t "%Y-%m-%d" "$f" 2>/dev/null || stat -c "%Y" "$f" 2>/dev/null)
    mtime_epoch=$(stat -f "%m" "$f" 2>/dev/null || stat -c "%Y" "$f" 2>/dev/null)
    age=$(( TODAY_EPOCH - mtime_epoch ))
    days_ago=$(( age / 86400 ))

    line="$basename | 最后更新: $mtime_str ($days_ago 天前)"

    if [ "$age" -lt "$WARN_SECONDS" ]; then
        green=$(( green + 1 ))
        green_lines="${green_lines}- $line\n"
    elif [ "$age" -lt "$CRIT_SECONDS" ]; then
        yellow=$(( yellow + 1 ))
        yellow_lines="${yellow_lines}- $line\n"
    else
        red=$(( red + 1 ))
        red_lines="${red_lines}- $line\n"
    fi
done

[[ -z "$green_lines" ]] && green_lines="无\n"
[[ -z "$yellow_lines" ]] && yellow_lines="无\n"
[[ -z "$red_lines" ]] && red_lines="无\n"

cat > "$OUTFILE" << OUTEOF
# 审计新鲜度检查报告
> 生成时间: $TODAY
> 🐜 [V17: audit-quality-fuse]

## 概览

| 状态 | 数量 | 说明 |
|------|------|------|
| 🟢 新鲜 | $green | < 7天内更新 |
| 🟡 警告 | $yellow | 7-14天未更新 |
| 🔴 过期 | $red | > 14天未更新 |
| **合计** | **$total** | |

## 🟢 新鲜模块 ($green)

$(echo -e "$green_lines" | sed 's/\\n/\n/g')

## 🟡 警告模块 ($yellow)

$(echo -e "$yellow_lines" | sed 's/\\n/\n/g')

## 🔴 过期模块 ($red)

$(echo -e "$red_lines" | sed 's/\\n/\n/g')

## 建议

$(if [ "$red" -gt 0 ]; then
    echo "- ⚠️ $red 个模块已超过14天未更新审计文件，建议安排复审"
elif [ "$yellow" -gt 0 ]; then
    echo "- 📋 $yellow 个模块即将过期，建议本周内安排复审"
else
    echo "- ✅ 所有审计文件均在7天内更新，状态良好"
fi)
OUTEOF

echo ""
echo "=== 审计新鲜度检查完成 ==="
echo "  总计: $total | 🟢 $green | 🟡 $yellow | 🔴 $red"
echo "  输出: $OUTFILE"
