#!/bin/bash
# 专家决策卡片生成器 · 替代散文报告
# 用法: cron调用: 08:00/14:00/20:45
# 产出: docs/knowledge/expert-team/YYYY-MM-DD/card-NNN.md

DATE=$(date '+%Y-%m-%d')
HOUR=$(date '+%H')
CARD_DIR="docs/knowledge/expert-team/$DATE"
mkdir -p "$CARD_DIR"

# 轮值分配: 按小时决定哪些专家值班
case $HOUR in
  08) GROUP="G1 G2 G3 G4" ;;  # 晨学
  14) GROUP="G5 G6 G7 G8" ;;  # 午学
  20) GROUP="G9 G10 G11 G12" ;; # 晚学
  *) GROUP="G1" ;;
esac

# 生成卡片模板
CARD_NUM=$(ls "$CARD_DIR" 2>/dev/null | grep "card-" | wc -l)
CARD_ID="$DATE-$(printf '%03d' $((CARD_NUM + 1)))"

cat > "$CARD_DIR/card-$CARD_ID.md" << CARD
# 📋 专家决策卡片 · $CARD_ID
> 轮值: $GROUP · 生成: $DATE $HOUR:00

## 一句话结论
[不超过2行]

## 发现的问题
1. [问题1] — 影响模块: [模块名]
2. [问题2] — 影响模块: [模块名]

## 产出行动
| 行动 | 负责人 | 截止 |
|------|--------|------|
| [具体动作] | [谁] | [时间] |

## Gate签名状态
- [ ] Gate 1 架构+安全 (E1)
- [ ] Gate 2 对口业务 (E对口)
- [ ] Gate 3 数据+AI (E5+E9)
- [ ] Gate 4 体验+租户 (E7+E40)
- [ ] Gate 5 合规+财务 (E36+E2)
- [ ] Gate 6 审计+监管 (E38+E6)
CARD

echo "📋 决策卡片已生成: $CARD_DIR/card-$CARD_ID.md"

# 记录到phase-progress
echo "| $DATE $HOUR:00 | 📋 专家卡片 | card-$CARD_ID by $GROUP | — | 📋 |" >> docs/knowledge/phase-progress.md
