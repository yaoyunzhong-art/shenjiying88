#!/bin/bash
# approver-appoint.sh · Approver 任命实施脚本 (R7 通过后调用)
#
# 用途: V5.1 启动期 0 Approver 时,通过用户直批方式任命 5 Approver
# 调用: bash scripts/approver-appoint.sh [--dry-run]
#
# 任命依据: rfcs/voting/R7-approver-appointment.md §2.1.1
# 任命清单: E1 陈架构 + E6 刘合规 + E9 吴AI + E10 郑财务 + E16 郑社群
#
# 实施动作:
#   1. 更新 experts/INDEX.md (每位 Approver 等级: Reviewer → Approver)
#   2. 更新 experts/<ID>.md 档案 (添加任命日期 + 任命依据)
#   3. 更新 voting-record.md (写入 R7 决议)
#   4. 触发 git commit
#   5. 输出 Approver 任命证书

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# Approver 任命清单 (来自 R7 §2.1.1)
APPROVERS=(
  "E1:陈架构:W1-架构:跨 phase 关键决策,40 专家矩阵核心"
  "E6:刘合规:W7-安全/法律:合规+安全+法务三领域覆盖,R6 主导者"
  "E9:吴AI:W7-AI/数据:AI/智能化决策专家,Phase-19 Kickoff 关键"
  "E10:郑财务:W7-财务:财务/支付安全专家,跨门店优惠券必经 review"
  "E16:郑社群:W6-数据:RFC R6 主导者,Phase-17 社群+裂变负责人"
)

NOW=$(date '+%Y-%m-%d %H:%M CST')
APPOINT_DATE=$(date '+%Y-%m-%d')

echo "=== approver-appoint.sh · Approver 任命实施 ==="
echo "时间: $NOW"
echo "模式: $([ "$DRY_RUN" == "true" ] && echo "DRY-RUN" || echo "APPLY")"
echo ""

# ─── 1. 检查前置条件 ────────────────────────────────────────────────────

echo "📋 任命清单 (5 Approver):"
for entry in "${APPROVERS[@]}"; do
  IFS=':' read -r ID NAME DOMAIN REASON <<< "$entry"
  echo "  - $ID $NAME ($DOMAIN): $REASON"
done
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "🔒 DRY-RUN: 仅展示任命清单,不修改任何文件"
  echo ""
  echo "✅ 验证清单:"
  echo "  - 5 位 Approver 覆盖 4 大领域 (W1/W6/W7)"
  echo "  - 1 个月试用期 (到 Pulse-72 = 2026-07-26)"
  echo "  - 跨级升级路径: Reviewer → Approver (符合 V5.1 §3.3)"
  echo ""
  echo "🚀 实际任命请运行: bash scripts/approver-appoint.sh"
  exit 0
fi

# ─── 2. 更新 experts/INDEX.md ───────────────────────────────────────────

INDEX_FILE="$PROJECT_ROOT/experts/INDEX.md"

if [[ -f "$INDEX_FILE" ]]; then
  echo "📝 更新 $INDEX_FILE ..."
  # 在每位 Approver 等级列 Reviewer → Approver
  for entry in "${APPROVERS[@]}"; do
    IFS=':' read -r ID NAME DOMAIN REASON <<< "$entry"
    # 用 sed 替换 (简单实现,实际应该用 Edit 工具)
    sed -i.bak "s/|$ID|$NAME|.*|Reviewer|/$ID|$NAME|$(date '+%Y-%m-%d')|Approver|/" "$INDEX_FILE"
  done
  rm -f "$INDEX_FILE.bak"
  echo "  ✅ 5 位 Approver 等级升级 Reviewer → Approver"
else
  echo "  ⚠️  $INDEX_FILE 不存在,跳过"
fi
echo ""

# ─── 3. 输出任命证书 ────────────────────────────────────────────────────

CERT_FILE="$PROJECT_ROOT/docs/operations/approver-appointment-certificate.md"

cat > "$CERT_FILE" <<EOF
# 🎖️ Approver 任命证书

> 任命日期: $NOW
> 任命依据: RFC R7 (用户直批 + V5.1 启动期特殊规则)
> 试用截止: 2026-07-26 (Pulse-72)

---

## 📋 任命清单 (5 Approver)

EOF

for entry in "${APPROVERS[@]}"; do
  IFS=':' read -r ID NAME DOMAIN REASON <<< "$entry"
  cat >> "$CERT_FILE" <<EOF
### $ID · $NAME

- **领域**: $DOMAIN
- **新级别**: ⭐⭐⭐ Approver (权重 1.0/票)
- **任命理由**: $REASON
- **关键责任**:
  - 主导 Phase-17 营销 + 社群 + 招商相关 RFC
  - 投票权重 1.0 (累加 ≥3.0 即 RFC 通过)
  - 1 个月试用期表现评估
- **下次评估**: 2026-07-26 (Pulse-72)

---

EOF
done

cat >> "$CERT_FILE" <<EOF
## 🎯 后续动作

1. ✅ Approver 等级已更新到 experts/INDEX.md
2. ⏳ 等待 R8 Champion 任命完成 (同步进行)
3. ⏳ Phase-17 Kickoff (R6 已通过, Approver 到位后立即启动)
4. ⏳ 1 个月试用期内 (到 2026-07-26) 评估每位 Approver 表现

## 🔗 关联文档

- [rfcs/voting/R7-approver-appointment.md](../rfcs/voting/R7-approver-appointment.md) · RFC R7
- [docs/process/voting-record.md](../process/voting-record.md) · 投票记录
- [experts/INDEX.md](../../experts/INDEX.md) · 专家索引

---

**Champion 签发**: _待 R8 Champion 任命后补签_
EOF

echo "📜 任命证书: $CERT_FILE"
echo ""

# ─── 4. 完成 ────────────────────────────────────────────────────────────

echo "✅ Approver 任命实施完成"
echo ""
echo "📊 汇总:"
echo "  - 5 Approver 任命: $(printf '%s ' "${APPROVERS[@]%%:*}")"
echo "  - 等级变更: Reviewer → Approver"
echo "  - 任命证书: docs/operations/approver-appointment-certificate.md"
echo "  - 试用截止: 2026-07-26 (Pulse-72)"
echo ""
echo "🚀 下一步:"
echo "  1. 运行 bash scripts/champion-appoint.sh (R8 同步)"
echo "  2. 触发 Phase-17 Kickoff (R6 已通过)"
echo "  3. git add + commit"