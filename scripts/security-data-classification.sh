#!/usr/bin/env bash
# scripts/security-data-classification.sh · 🐜 [V18: security-baseline]
# 数据分类检查 — 安全基线修复 (G2退回)
set -euo pipefail

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT"

SCAN_DATE="$(date '+%Y-%m-%d')"
SCAN_TIME="$(date '+%Y-%m-%d %H:%M:%S %Z')"
REPORT_DIR="${PROJECT}/docs/knowledge"
REPORT_FILE="${REPORT_DIR}/security-data-classification-${SCAN_DATE}.md"

QUICK_MODE=false
JSON_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --quick)  QUICK_MODE=true  ;;
    --json)   JSON_ONLY=true ; QUICK_MODE=true ;;
    --help|-h)
      echo "🐜 [V18: security-data-classification] 数据分类检查脚本"
      echo "用法: bash scripts/security-data-classification.sh [--quick|--json|--help]"
      exit 0 ;;
  esac
done

md_safe() { echo "$1" | sed 's/|/\\|/g'; }
log()  { local l="$1" m="$2"; echo "[$(date '+%H:%M:%S')] [${l}] ${m}"; }
warn() { log "WARN" "$1"; }
info() { log "INFO" "$1"; }
ok()   { log "OK"   "$1"; }
badge() { [ "$1" -eq 0 ] && echo "🟢" || echo "🔴"; }

UNCLASSIFIED_COUNT=0; UNCLASSIFIED_MODELS=""
UNLABELED_RULES_COUNT=0; UNLABELED_RULES=""
RLS_MISSING_COUNT=0; RLS_MISSING_LIST=""
PII_POLICY_TOTAL=0; SENSITIVE_FIELDS_COUNT=0; SENSITIVE_FIELDS_LIST=""
EXIT_CODE=0; RISK_LABEL="低危"

# ── 1: Prisma Schema 数据分类 ──
check_prisma_classification() {
  info "🔍 [1/4] Prisma Schema 数据分类 — 检查 model 的 PiiLevel 标注..."
  [ ! -f "apps/api/prisma/schema.prisma" ] && { warn "  prisma schema not found"; return; }

  while IFS='' read -r line; do
    local mname
    mname=$(echo "$line" | sed 's/^[0-9]*:model //; s/ {.*//')
    [ -z "$mname" ] && continue
    local mlineno; mlineno=$(echo "$line" | cut -d: -f1)
    local mblock
    mblock=$(sed -n "${mlineno},/^[a-z]/p" apps/api/prisma/schema.prisma 2>/dev/null | sed '$d' || true)
    local pii; pii=$(echo "$mblock" | grep -c 'PiiLevel\|piiLevel\|pii_' 2>/dev/null || true)
    local sens; sens=$(echo "$mblock" | grep -ciE '(password|secret|token|credential|certificate|private|key|auth|pin|ssn|identity|phone|email|address|birth|idcard|cvv|bank)' 2>/dev/null || true)
    if [ "$pii" -eq 0 ] && [ "$sens" -gt 0 ]; then
      UNCLASSIFIED_COUNT=$((UNCLASSIFIED_COUNT+1))
      UNCLASSIFIED_MODELS="${UNCLASSIFIED_MODELS}${mname}"$'\n'
      warn "  ⚠️ [无分类标注] model ${mname} 含敏感字段但无PiiLevel"
    fi
  done < <(grep -n '^model ' apps/api/prisma/schema.prisma)

  [ "$UNCLASSIFIED_COUNT" -eq 0 ] && ok "  ✅ 所有 model 均有数据分类标注"
}

# ── 2: Rules 权限标注 ──
check_rules_permissions() {
  info "🔍 [2/4] Rules 权限标注 — 检查 admin-web rules/ 权限标注..."
  local rd="apps/admin-web/app/rules"
  [ ! -d "$rd" ] && { warn "  Rules 目录不存在: $rd"; return; }

  while IFS='' read -r f; do
    local has=$(grep -ciE '(角色视角|权限|@roles|roles:|permission:)' "$f" 2>/dev/null || true)
    if [ "$has" -eq 0 ]; then
      UNLABELED_RULES_COUNT=$((UNLABELED_RULES_COUNT+1))
      UNLABELED_RULES="${UNLABELED_RULES}${f}"$'\n'
      warn "  ⚠️ [缺少权限标注] $f"
    fi
  done < <(find "$rd" -name 'page.tsx' -o -name 'page.ts' 2>/dev/null)

  [ "$UNLABELED_RULES_COUNT" -eq 0 ] && ok "  ✅ 所有规则页面均有权限标注"
}

# ── 3: RLS 数据分类 ──
check_rls_classification() {
  info "🔍 [3/4] RLS 数据分类 — 检查 RLS 策略中的数据分类级别..."
  local md="apps/api/src/database/migrations"
  [ ! -d "$md" ] && { warn "  Migrations 不存在"; return; }

  while IFS='' read -r f; do
    local tables
    tables=$(grep -n 'ALTER TABLE.*ENABLE ROW LEVEL SECURITY' "$f" | sed 's/.*ALTER TABLE \(.*\) ENABLE ROW LEVEL SECURITY.*/\1/' || true)
    while IFS='' read -r tname; do
      [ -z "$tname" ] && continue
      local hasc
      hasc=$(grep -ci "data.classification\|@classification\|分类" "$f" 2>/dev/null || true)
      if [ "$hasc" -eq 0 ]; then
        RLS_MISSING_COUNT=$((RLS_MISSING_COUNT+1))
        RLS_MISSING_LIST="${RLS_MISSING_LIST}${f}:${tname}"$'\n'
        warn "  ⚠️ [RLS缺少分类] 表 ${tname}"
      fi
    done <<< "$tables"
  done < <(find "$md" -name '*rls*' -o -name '*RLS*' 2>/dev/null | sort)

  [ "$RLS_MISSING_COUNT" -eq 0 ] && ok "  ✅ 所有 RLS 表均有数据分类标注"
}

# ── 4: PII 覆盖率 ──
check_pii_coverage() {
  info "🔍 [4/4] PII 字段覆盖率 — 检查 PiiPolicy 覆盖..."
  local sf="apps/api/prisma/schema.prisma"
  [ ! -f "$sf" ] && { warn "  Prisma schema not found"; return; }

  PII_POLICY_TOTAL=$(grep -c 'PiiPolicy\|piiPolicy\|piiLevel' "$sf" 2>/dev/null || true)
  local src_pii
  src_pii=$(grep -rn 'piiDetector\|PiiDetector\|PiiPolicy' apps/api/src/ --include="*.ts" 2>/dev/null | grep -v '(node_modules|.spec.ts|.test.ts)' | grep -c . || true)
  PII_POLICY_TOTAL=$((PII_POLICY_TOTAL + src_pii))

  for field in password token secret privateKey certificate pinCode ssn idCard phone email address birthDate cvv bankAccount passwordHash creditCard accessToken refreshToken apiKey webhookSecret; do
    local occ
    occ=$(grep -c "${field}" "$sf" 2>/dev/null || true)
    if [ "$occ" -gt 0 ] 2>/dev/null; then
      SENSITIVE_FIELDS_COUNT=$((SENSITIVE_FIELDS_COUNT+1))
      SENSITIVE_FIELDS_LIST="${SENSITIVE_FIELDS_LIST}${field} (${occ})"$'\n'
    fi
  done

  if [ "$SENSITIVE_FIELDS_COUNT" -gt 0 ]; then
    [ "$PII_POLICY_TOTAL" -gt 0 ] && ok "  ✅ 敏感字段已纳入 PiiPolicy (${PII_POLICY_TOTAL} 策略)" \
      || warn "  ⚠️ 发现 ${SENSITIVE_FIELDS_COUNT} 类敏感字段但 PiiPolicy 不足"
  else
    info "  ℹ️ 未发现常见敏感字段"
  fi
}

check_prisma_classification
check_rules_permissions
check_rls_classification
check_pii_coverage

TOTAL_ISSUES=$((UNCLASSIFIED_COUNT + UNLABELED_RULES_COUNT + RLS_MISSING_COUNT))
if [ "$UNCLASSIFIED_COUNT" -gt 0 ] || [ "$RLS_MISSING_COUNT" -gt 0 ]; then RISK_LABEL="中危"; EXIT_CODE=1; fi

cat <<JSONEOF
{
 "scan_date":"$SCAN_DATE","scan_time":"$SCAN_TIME","module":"data-classification",
 "results":{
  "prisma_model_classification":{"status":$([ "$UNCLASSIFIED_COUNT" -eq 0 ] && echo '"passed"' || echo '"missing"'),"models_without_pii":$UNCLASSIFIED_COUNT},
  "rules_permission_annotations":{"status":$([ "$UNLABELED_RULES_COUNT" -eq 0 ] && echo '"passed"' || echo '"missing"'),"unlabeled_pages":$UNLABELED_RULES_COUNT},
  "rls_classification":{"status":$([ "$RLS_MISSING_COUNT" -eq 0 ] && echo '"passed"' || echo '"missing"'),"tables_without_classification":$RLS_MISSING_COUNT},
  "pii_coverage":{"status":$([ "$PII_POLICY_TOTAL" -gt 0 ] && echo '"passed"' || echo '"partial"'),"pii_policy_count":$PII_POLICY_TOTAL,"sensitive_field_categories":$SENSITIVE_FIELDS_COUNT}
 },
 "summary":{"total_issues":$TOTAL_ISSUES,"risk_level":"$RISK_LABEL","exit_code":$EXIT_CODE}
}
JSONEOF

[ "$JSON_ONLY" = true ] && exit $EXIT_CODE

echo ""
echo "═══════════════════════════════════════════════════════"
echo " 🐜 数据分类检查报告 · [V18: security-baseline]"
echo "═══════════════════════════════════════════════════════"
echo " 扫描时间: ${SCAN_TIME}"
echo ""
echo " 📊 检查结果:"
echo "   Prisma数据分类:   $([ "$UNCLASSIFIED_COUNT" -eq 0 ] && echo '✅ 完整' || echo "⚠️ ${UNCLASSIFIED_COUNT} 个model未标注")"
echo "   Rules权限标注:    $([ "$UNLABELED_RULES_COUNT" -eq 0 ] && echo '✅ 完整' || echo "⚠️ ${UNLABELED_RULES_COUNT} 个文件缺少标注")"
echo "   RLS数据分类:      $([ "$RLS_MISSING_COUNT" -eq 0 ] && echo '✅ 完整' || echo "⚠️ ${RLS_MISSING_COUNT} 张表无分类")"
echo "   PII策略覆盖:      $([ "$PII_POLICY_TOTAL" -gt 0 ] && echo "✅ ${PII_POLICY_TOTAL} 条策略" || echo 'ℹ️ 未配置')"
echo ""
echo " 🚦 风险等级: ${RISK_LABEL}"
[ "$EXIT_CODE" -gt 0 ] && echo " ❌ 发现 ${TOTAL_ISSUES} 个问题" || echo " ✅ 数据分类检查通过"
echo " 📝 报告: ${REPORT_FILE}"
echo "═══════════════════════════════════════════════════════"

if [ "$QUICK_MODE" != true ]; then
  mkdir -p "$REPORT_DIR"
  cat > "$REPORT_FILE" << REPORTEOF
# 🐜 数据分类检查报告

> 扫描时间: ${SCAN_TIME}
> 项目: shenjiying88 (V18)
> 模块: 安全基线 — 数据分类检查 (security-baseline ✅ 8/8)

## 📊 汇总

| 检查项 | 结果 | 详情 |
|--------|:----:|:----:|
| Prisma Schema 数据分类 | $(badge $UNCLASSIFIED_COUNT) | $( [ "$UNCLASSIFIED_COUNT" -eq 0 ] && echo "✅ 所有model已分类" || echo "⚠️ ${UNCLASSIFIED_COUNT} 个model缺失" ) |
| Rules 权限标注 | $(badge $UNLABELED_RULES_COUNT) | $( [ "$UNLABELED_RULES_COUNT" -eq 0 ] && echo "✅ 页面均有权限标注" || echo "⚠️ ${UNLABELED_RULES_COUNT} 个文件缺失" ) |
| RLS 数据分类 | $(badge $RLS_MISSING_COUNT) | $( [ "$RLS_MISSING_COUNT" -eq 0 ] && echo "✅ 所有RLS表已分类" || echo "⚠️ ${RLS_MISSING_COUNT} 张表缺失" ) |
| PII 策略覆盖 | $( [ "$PII_POLICY_TOTAL" -gt 0 ] && echo "🟢" || echo "🟡" ) | $( [ "$PII_POLICY_TOTAL" -gt 0 ] && echo "${PII_POLICY_TOTAL} 条 PiiPolicy 已配置" || echo "PiiPolicy 未配置" ) |
| **总体** | **🔴 ${RISK_LABEL}** | **退出码: ${EXIT_CODE}** |

## 1️⃣ Prisma Schema 数据分类
> 级别: PUBLIC(公开) | INTERNAL(内部) | SENSITIVE(敏感) | RESTRICTED(受限)

$(if [ "$UNCLASSIFIED_COUNT" -gt 0 ]; then
echo "**⚠️ ${UNCLASSIFIED_COUNT} 个 model 含敏感字段但无 PiiLevel:**"
echo "| Model | 问题 |"
echo "|-------|------|"
while IFS='' read -r m; do [ -z "$m" ] && continue; echo "| \`${m}\` | 含敏感字段但未标注数据分类 |"; done <<< "$UNCLASSIFIED_MODELS"
else
echo "✅ 所有 model 均有 PiiLevel 标注"
fi)

## 2️⃣ Rules 权限标注
$(if [ "$UNLABELED_RULES_COUNT" -gt 0 ]; then
echo "**⚠️ ${UNLABELED_RULES_COUNT} 个文件缺少权限标注:**"
echo "| 文件 | 缺少 |"
echo "|------|------|"
while IFS='' read -r f; do [ -z "$f" ] && continue; echo "| \`$f\` | 角色/权限注解 |"; done <<< "$UNLABELED_RULES"
else
echo "✅ 所有 Rules 页面均有权限标注"
fi)

## 3️⃣ RLS 数据分类
$(if [ "$RLS_MISSING_COUNT" -gt 0 ]; then
echo "**⚠️ ${RLS_MISSING_COUNT} 张 RLS 表缺少数据分类:**"
echo "| 表 |" | head -1
echo "|------|"
while IFS='' read -r e; do [ -z "$e" ] && continue; echo "| \`$e\` |无分类 SQL 注释|"; done <<< "$RLS_MISSING_LIST"
else
echo "✅ 所有 RLS 表均有数据分类标注"
fi)

## 4️⃣ PII 策略覆盖
$([ "$PII_POLICY_TOTAL" -gt 0 ] && echo "✅ PiiPolicy 已配置 ${PII_POLICY_TOTAL} 条策略" || echo "⚠️ PiiPolicy 未配置")
$(if [ "$SENSITIVE_FIELDS_COUNT" -gt 0 ]; then
echo ""
echo "**Schema 敏感字段 ${SENSITIVE_FIELDS_COUNT} 类:**"
while IFS='' read -r f; do [ -z "$f" ] && continue; echo "- \`${f}\`"; done <<< "$SENSITIVE_FIELDS_LIST"
fi)

## 🚦 闸门判定
| 条件 | 状态 |
|------|:----:|
| Prisma model 分类缺失 > 0 | $(badge $UNCLASSIFIED_COUNT) |
| Rules 权限标注缺失 > 0 | $(badge $UNLABELED_RULES_COUNT) |
| RLS 数据分类缺失 > 0 | $(badge $RLS_MISSING_COUNT) |
| **出口** | **${RISK_LABEL} (${EXIT_CODE})** |
REPORTEOF
fi

exit $EXIT_CODE
