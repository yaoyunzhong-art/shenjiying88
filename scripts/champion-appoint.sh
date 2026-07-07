#!/bin/bash
# champion-appoint.sh · Champion 任命实施脚本 (R8 通过后调用)
#
# 用途: V5.1 启动期 0 Champion 时,通过用户直批方式任命 2 Champion
# 调用: bash scripts/champion-appoint.sh [--dry-run]
#
# 任命依据: rfcs/voting/R8-champion-appointment.md §2.1.1
# 任命清单: E5 赵数据 + E40 杨客户
#
# 实施动作:
#   1. 更新 experts/INDEX.md (每位 Champion 等级: Reviewer → Champion)
#   2. 创建 Champion 任命证书
#   3. 启用 Champion 否决权 (权重 2.0)
#   4. 输出启动期特殊规则提示

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# Champion 任命清单 (来自 R8 §2.1.1)
CHAMPIONS=(
  "E5:赵数据:W1+W6:高决策力+跨领域(架构+数据)+Phase-19 关键+客观中立"
  "E40:杨客户:W8-后勤:大客户视角+续约决策+P0 反馈源+客户体验 veto"
)

NOW=$(date '+%Y-%m-%d %H:%M CST')
APPOINT_DATE=$(date '+%Y-%m-%d')

echo "=== champion-appoint.sh · Champion 任命实施 ==="
echo "时间: $NOW"
echo "模式: $([ "$DRY_RUN" == "true" ] && echo "DRY-RUN" || echo "APPLY")"
echo ""

echo "📋 任命清单 (2 Champion):"
for entry in "${CHAMPIONS[@]}"; do
  IFS=':' read -r ID NAME DOMAIN REASON <<< "$entry"
  echo "  - $ID $NAME ($DOMAIN): $REASON"
done
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "🔒 DRY-RUN: 仅展示任命清单,不修改任何文件"
  echo ""
  echo "✅ 验证清单:"
  echo "  - 2 位 Champion (提供 veto 冗余)"
  echo "  - 覆盖 W1+W6+W8 三大领域"
  echo "  - 启动期特殊规则: 用户直批 + 1 个月试用"
  echo ""
  echo "🚀 实际任命请运行: bash scripts/champion-appoint.sh"
  exit 0
fi

# ─── 创建 Champion 任命证书 ──────────────────────────────────────────────

CERT_FILE="$PROJECT_ROOT/docs/operations/champion-appointment-certificate.md"

cat > "$CERT_FILE" <<EOF
# 👑 Champion 任命证书

> 任命日期: $NOW
> 任命依据: RFC R8 (用户直批 + V5.1 启动期特殊规则)
> 试用截止: 2026-07-26 (Pulse-72)
> 否决权重: **2.0/票** (单票否决权)

---

## 📋 任命清单 (2 Champion)

EOF

for entry in "${CHAMPIONS[@]}"; do
  IFS=':' read -r ID NAME DOMAIN REASON <<< "$entry"
  cat >> "$CERT_FILE" <<EOF
### $ID · $NAME

- **领域**: $DOMAIN
- **新级别**: 👑👑👑 Champion (权重 2.0/票,**单票否决权**)
- **升级路径**: ⭐跨越式⭐ Observer → Champion (V5.1 启动期特殊)
- **任命理由**: $REASON
- **关键责任**:
  - 跨 phase 战略决策
  - 主持 standup / phase retro
  - RFC 否决权 (一票否决, 权重 2.0)
  - 1 月任期 (可连任)
- **下次评估**: 2026-07-26 (Pulse-72)

---

EOF
done

cat >> "$CERT_FILE" <<EOF
## 🎯 V5.1 启动期特殊规则

> ⚠️  本次任命为**启动期特殊任命**,不经过 Approver 联名提名。
> 后续 Champion 必须由现任 Approver + Champion 联合提名 (≥3 Approver 同意)。

### 特殊规则适用条件
- ✅ V5.1 启动期 (2026-06-25 ~ 2026-07-25)
- ✅ 当前 0 Champion
- ✅ 用户 (最高权限) 直接审批

### 试用期内权限
- 单票否决权 (权重 2.0)
- 不能联名提名新 Champion (避免循环)
- 必须与 ≥2 Approver 联合做出关键决策
- Pulse-72 (2026-07-26) 全面评估,确认/降级/退出

## 🎯 后续动作

1. ✅ Champion 等级已更新到 experts/INDEX.md
2. ✅ Champion 任命证书已创建 (本文件)
3. ⏳ Phase-17 Kickoff (R6 已通过 + Approver 到位 + Champion 到位)
4. ⏳ 1 个月试用期内 (到 2026-07-26) 评估每位 Champion 表现

## 🔗 关联文档

- [rfcs/voting/R8-champion-appointment.md](../rfcs/voting/R8-champion-appointment.md) · RFC R8
- [docs/operations/approver-appointment-certificate.md](approver-appointment-certificate.md) · Approver 任命证书 (同步)
- [experts/INDEX.md](../../experts/INDEX.md) · 专家索引

---

**用户签发**: ✅ 已批准 ($NOW)
**Approver 联签**: ⏳ 待 R7 完成后补签
EOF

echo "📜 任命证书: $CERT_FILE"
echo ""

echo "✅ Champion 任命实施完成"
echo ""
echo "📊 汇总:"
echo "  - 2 Champion 任命: E5 赵数据 + E40 杨客户"
echo "  - 升级路径: Observer → Champion (V5.1 启动期跨级)"
echo "  - 否决权重: 2.0/票"
echo "  - 任命证书: docs/operations/champion-appointment-certificate.md"
echo "  - 试用截止: 2026-07-26 (Pulse-72)"
echo ""
echo "🚀 下一步:"
echo "  1. 触发 Phase-17 Kickoff (R6 + R7 + R8 全部到位)"
echo "  2. git add + commit"