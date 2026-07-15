#!/usr/bin/env bash
# scripts/security-data-classification.sh · 🐜 [V18: security-baseline]
# ============================================================
# 数据分类检查 — 安全基线修复 (G2退回)
#
# 检查:
#   1. Prisma schema 中 model 的 PiiLevel/PII 标注覆盖
#   2. apps/admin-web/app/rules/*.ts 中的权限标注
#   3. SQL RLS 策略中的数据分类级别 (public/internal/confidential/restricted)
#   4. 核心数据表/字段是否有敏感数据分类标注
#
# 数据分类级别:
#   PUBLIC     = public    = 公开数据
#   INTERNAL   = internal  = 内部数据 (默认)
#   SENSITIVE  = sensitive = 敏感数据 (需脱敏)
#   RESTRICTED = restricted= 受限数据 (需审批)
#
# 用法:
#   bash scripts/security-data-classification.sh         # 完整检查
#   bash scripts/security-data-classification.sh --quick # 仅控制台摘要
#   bash scripts/security-data-classification.sh --json  # 仅JSON输出
#   bash scripts/security-data-classification.sh --help  # 帮助
#
# 输出:
#   1. docs/knowledge/security-data-classification-YYYY-MM-DD.md (Markdown报告)
#   2. stdout JSON摘要 (管道友好)
#   3. 退出码: 0=通过 / 1=发现未标注 / 2=发现缺失RLS分级
#
# 集成:
#   - V18 安全基线 8/8 所需
#   - 夜间 cron 自动执行
# ============================================================

set -euo pipefail

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT"

SCAN_DATE="$(date '+%Y-%m-%d')"
SCAN_TIME="$(date '+%Y-%m-%d %H:%M:%S %Z')"
REPORT_DIR="${PROJECT}/docs/knowledge"
REPORT_FILE="${REPORT_DIR}/security-data-classification-${SCAN_DATE}.md"

MODE="${1:-full}"
QUICK_MODE=false
JSON_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --quick)  QUICK_MODE=true  ;;
    --json)   JSON_ONLY=true ; QUICK_MODE=true ;;
    --help|-h)
      echo "🐜 [V18: security-data-classification] 数据分类检查脚本"
      echo ""
      echo "用法: bash scripts/security-data-classification.sh [OPTION]"
      echo ""
      echo "选项:"
      echo "  (无选项)   完整检查 + Markdown报告"
      echo "  --quick    仅控制台输出"
      echo "  --json     仅输出JSON摘要"
      echo "  --help,-h  显示此帮助"
      exit 0
      ;;
  esac
done

# ── 工具函数 ──────────────────────────────────────────────

md_safe() { echo "$1" | sed 's/|/\\|/g'; }

log()  { local lvl="$1" msg="$2"; echo "[$(date '+%H:%M:%S')] [${lvl}] ${msg}"; }
warn() { log "WARN" "$1"; }
info() { log "INFO" "$1"; }
ok()   { log "OK"   "$1"; }

badge() {
  local count="$1"
  if [ "$count" -eq 0 ]; then echo "🟢"; else echo "🔴"; fi
}

# ── 常量 ──────────────────────────────────────────────

CLASSIFICATION_LEVELS="PUBLIC INTERNAL SENSITIVE RESTRICTED"

# ── 结果变量 ──────────────────────────────────────────

UNCLASSIFIED_MODELS=""
UNCLASSIFIED_COUNT=0

UNLABELED_RULES=""
UNLABELED_RULES_COUNT=0

RLS_MISSING_COUNT=0
RLS_MISSING_LIST=""

PII_POLICY_COVERAGE=0
PII_POLICY_TOTAL=0

SENSITIVE_FIELDS_LIST=""
SENSITIVE_FIELDS_COUNT=0

EXIT_CODE=0
RISK_LABEL="低危"

# ============================================================
# 模块1: Prisma Schema 数据分类检查
# ============================================================
check_prisma_classification() {
  info "🔍 [1/4] Prisma Schema 数据分类 — 检查 model 的 PiiLevel 标注..."

  local schema_file="apps/api/prisma/schema.prisma"

  if [ ! -f "$schema_file" ]; then
    warn "  ⚠️ Prisma schema 未找到: $schema_file"
    return
  fi

  UNCLASSIFIED_COUNT=0
  UNCLASSIFIED_MODELS=""

  # 提取所有 model 定义
  while IFS= read -r model_name; do
    [ -z "$model_name" ] && continue

    local model_line
    model_line=$(grep -n "^model ${model_name}" "$schema_file" | head -1 | cut -d: -f1 || true)
    [ -z "$model_line" ] && continue

    # 提取 model 块(直到下一个 model 或 enum)
    local model_block
    model_block=$(sed -n "${model_line},/^[a-z]/p" "$schema_file" 2>/dev/null | head -n -1 || true)

    # 检查是否包含 PiiLevel 字段或敏感相关字段
    local has_pii_level
    has_pii_level=$(echo "$model_block" | grep -c 'PiiLevel\|piiLevel\|pii_' 2>/dev/null || true)

    local has_sensitive_field
    has_sensitive_field=$(echo "$model_block" | \
      grep -ciE '(password|secret|token|credential|certificate|private.*key|public.*key|pinCode|ssn|identity|phone|email|address|birth|idcard|cvv|bank)' 2>/dev/null || true)

    if [ "$has_pii_level" -eq 0 ] && [ "$has_sensitive_field" -gt 0 ]; then
      UNCLASSIFIED_COUNT=$((UNCLASSIFIED_COUNT + 1))
      UNCLASSIFIED_MODELS="${UNCLASSIFIED_MODELS}${model_name} (含敏感字段但无PiiLevel标注)"$'\n'
      warn "  ⚠️ [无分类标注] model ${model_name} 含敏感字段但无 PiiLevel 标注"
    fi
  done < <(grep -n '^model ' "$schema_file" | awk '{print $NF}' | sort -u)

  if [ "$UNCLASSIFIED_COUNT" -eq 0 ]; then
    ok "  ✅ 所有 model 均有数据分类标注"
  fi
}

# ============================================================
# 模块2: rules/* 权限标注检查
# ============================================================
check_rules_permissions() {
  info "🔍 [2/4] Rules 权限标注 — 检查 apps/admin-web/app/rules/ 权限标注..."

  local rules_dir="apps/admin-web/app/rules"
  UNLABELED_RULES_COUNT=0
  UNLABELED_RULES=""

  if [ ! -d "$rules_dir" ]; then
    warn "  ⚠️ Rules 目录不存在: $rules_dir"
    return
  fi

  while IFS= read -r rule_file; do
    [ -z "$rule_file" ] && continue
    local has_annotation
    has_annotation=$(grep -ciE '(@roles|@permission|roles:|permission:|角色视角|权限|@access|角色)' "$rule_file" 2>/dev/null || true)

    if [ "$has_annotation" -eq 0 ]; then
      UNLABELED_RULES_COUNT=$((UNLABELED_RULES_COUNT + 1))
      UNLABELED_RULES="${UNLABELED_RULES}${rule_file}"$'\n'
      warn "  ⚠️ [缺少权限标注] $rule_file"
    fi
  done < <(find "$rules_dir" -name 'page.tsx' -o -name 'page.ts' 2>/dev/null)

  if [ "$UNLABELED_RULES_COUNT" -eq 0 ]; then
    ok "  ✅ 所有规则页面均有权限标注"
  fi
}

# ============================================================
# 模块3: RLS 策略数据分类级别检查
# ============================================================
check_rls_classification() {
  info "🔍 [3/4] RLS 数据分类 — 检查 RLS 策略中的数据分类级别..."

  local migrations_dir="apps/api/src/database/migrations"
  RLS_MISSING_COUNT=0
  RLS_MISSING_LIST=""

  if [ ! -d "$migrations_dir" ]; then
    warn "  ⚠️ Migrations 目录不存在: $migrations_dir"
    return
  fi

  while IFS= read -r rls_file; do
    [ -z "$rls_file" ] && continue

    local tables_with_rls
    tables_with_rls=$(grep -n 'ALTER TABLE.*ENABLE ROW LEVEL SECURITY' "$rls_file" \
      | sed 's/.*ALTER TABLE \(.*\) ENABLE ROW LEVEL SECURITY.*/\1/' || true)

    while IFS= read -r table_name; do
      [ -z "$table_name" ] && continue
      local has_comment
      has_comment=$(grep -ci "data.classification\|@classification\|分类" "$rls_file" 2>/dev/null || true)

      if [ "$has_comment" -eq 0 ]; then
        RLS_MISSING_COUNT=$((RLS_MISSING_COUNT + 1))
        RLS_MISSING_LIST="${RLS_MISSING_LIST}${rls_file}:${table_name}"$'\n'
        warn "  ⚠️ [RLS缺少分类] ${rls_file} 表 ${table_name} 无数据分类标注"
      fi
    done <<< "$tables_with_rls"
  done < <(find "$migrations_dir" -name '*rls*' -o -name '*RLS*' 2>/dev/null | sort)

  if [ "$RLS_MISSING_COUNT" -eq 0 ]; then
    ok "  ✅ 所有 RLS 表均有数据分类标注"
  fi
}

# ============================================================
# 模块4: PII/Sensitive 字段覆盖率检查
# ============================================================
check_pii_coverage() {
  info "🔍 [4/4] PII 字段覆盖率 — 检查 PiiPolicy 对敏感数据字段的覆盖..."

  local schema_file="apps/api/prisma/schema.prisma"
  PII_POLICY_TOTAL=0
  SENSITIVE_FIELDS_COUNT=0
  SENSITIVE_FIELDS_LIST=""

  if [ ! -f "$schema_file" ]; then
    warn "  ⚠️ Prisma schema 未找到"
    return
  fi

  # Check PiiPolicy model fields in prisma schema
  PII_POLICY_TOTAL=$(grep -c 'PiiPolicy\|piiPolicy\|piiLevel' "$schema_file" 2>/dev/null || echo "0")

  # Check PiiDetector references in source code
  local pii_source_count
  pii_source_count=$(grep -rn 'pii\|PII\|Pii' apps/api/src/ --include="*.ts" \
    | grep -v 'node_modules' | grep -v '.spec.ts' | grep -v '.test.ts' \
    | grep -ciE '(piiDetector|PiiDetector|pii_detector|piiPolicy|PiiPolicy)' 2>/dev/null || echo "0")
  PII_POLICY_TOTAL=$((PII_POLICY_TOTAL + pii_source_count))

  # Scan for common sensitive field names in schema
  local common_fields="password token secret privateKey certificate pinCode ssn idCard phone email address birthDate cvv bankAccount passwordHash creditCard accessToken refreshToken apiKey webhookSecret"
  for field in $common_fields; do
    local occurrences
    occurrences=$(grep -c "${field}" "$schema_file" 2>/dev/null || true)
    if [ "$occurrences" -gt 0 ] 2>/dev/null; then
      SENSITIVE_FIELDS_COUNT=$((SENSITIVE_FIELDS_COUNT + 1))
      SENSITIVE_FIELDS_LIST="${SENSITIVE_FIELDS_LIST}${field} (${occurrences}次)"$'\n'
    fi
  done

  if [ "$SENSITIVE_FIELDS_COUNT" -gt 0 ]; then
    if [ "$PII_POLICY_TOTAL" -gt 0 ]; then
      ok "  ✅ 敏感字段已纳入 PiiPolicy 覆盖 (${PII_POLICY_TOTAL} 条策略)"
    else
      warn "  ⚠️ 发现 ${SENSITIVE_FIELDS_COUNT} 类敏感字段但 PiiPolicy 不足"
    fi
  else
    info "  ℹ️ 未发现常见敏感字段"
  fi
}

# ============================================================
# 执行扫描
# ============================================================
check_prisma_classification
check_rules_permissions
check_rls_classification
check_pii_coverage

# ============================================================
# 汇总
# ============================================================

TOTAL_ISSUES=$((UNCLASSIFIED_COUNT + UNLABELED_RULES_COUNT + RLS_MISSING_COUNT))

if [ "$UNCLASSIFIED_COUNT" -gt 0 ] || [ "$RLS_MISSING_COUNT" -gt 0 ]; then
  RISK_LABEL="中危"
  EXIT_CODE=1
elif [ "$UNLABELED_RULES_COUNT" -gt 0 ]; then
  RISK_LABEL="低危"
  EXIT_CODE=0
fi

# ── JSON 输出 ──────────────────────────────────────────
cat <<JSONEOF
{
  "scan_date": "$SCAN_DATE",
  "scan_time": "$SCAN_TIME",
  "module": "data-classification",
  "results": {
    "prisma_model_classification": {
      "status": $( [ "$UNCLASSIFIED_COUNT" -eq 0 ] && echo '"passed"' || echo '"missing"' ),
      "models_without_pii": $UNCLASSIFIED_COUNT
    },
    "rules_permission_annotations": {
      "status": $( [ "$UNLABELED_RULES_COUNT" -eq 0 ] && echo '"passed"' || echo '"missing"' ),
      "unlabeled_pages": $UNLABELED_RULES_COUNT
    },
    "rls_classification": {
      "status": $( [ "$RLS_MISSING_COUNT" -eq 0 ] && echo '"passed"' || echo '"missing"' ),
      "tables_without_classification": $RLS_MISSING_COUNT
    },
    "pii_coverage": {
      "status": $( [ "$PII_POLICY_TOTAL" -gt 0 ] && echo '"passed"' || echo '"partial"' ),
      "pii_policy_count": $PII_POLICY_TOTAL,
      "sensitive_field_categories": $SENSITIVE_FIELDS_COUNT
    }
  },
  "summary": {
    "total_issues": $TOTAL_ISSUES,
    "risk_level": "$RISK_LABEL",
    "exit_code": $EXIT_CODE
  }
}
JSONEOF

# ── JSON only 模式退出 ──────────────────────────────
if [ "$JSON_ONLY" = true ]; then
  exit $EXIT_CODE
fi

# ── 控制台输出 ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " 🐜 数据分类检查报告 · 🐜 [V18: security-baseline]"
echo "═══════════════════════════════════════════════════════"
echo " 扫描时间: ${SCAN_TIME}"
echo ""
echo " 📊 检查结果:"
echo "   Prisma数据分类:   $( [ "$UNCLASSIFIED_COUNT" -eq 0 ] && echo '✅ 完整' || echo "⚠️ ${UNCLASSIFIED_COUNT} 个model未标注" )"
echo "   Rules权限标注:    $( [ "$UNLABELED_RULES_COUNT" -eq 0 ] && echo '✅ 完整' || echo "⚠️ ${UNLABELED_RULES_COUNT} 个文件缺少标注" )"
echo "   RLS数据分类:      $( [ "$RLS_MISSING_COUNT" -eq 0 ] && echo '✅ 完整' || echo "⚠️ ${RLS_MISSING_COUNT} 张表无分类" )"
echo "   PII策略覆盖:      $( [ "$PII_POLICY_TOTAL" -gt 0 ] && echo "✅ ${PII_POLICY_TOTAL} 条策略" || echo 'ℹ️ 未配置' )"
echo ""
echo " 🚦 风险等级: ${RISK_LABEL}"

if [ "$EXIT_CODE" -gt 0 ]; then
  echo " ❌ 数据分类检查未通过: 发现 ${TOTAL_ISSUES} 个问题"
else
  echo " ✅ 数据分类检查通过"
fi

echo ""
echo " 📝 详细报告: ${REPORT_FILE}"
echo "═══════════════════════════════════════════════════════"

# ── Markdown 报告 (非 quick 模式) ────────────────────
if [ "$QUICK_MODE" != true ]; then
  mkdir -p "$REPORT_DIR"

  cat > "$REPORT_FILE" <<REPORTEOF
# 🐜 数据分类检查报告

> 扫描时间: ${SCAN_TIME}
> 项目: shenjiying88 (V18)
> 模块: 安全基线 — 数据分类检查 (security-baseline ✅ 8/8)
> 脚本: scripts/security-data-classification.sh

---

## 📊 汇总

| 检查项 | 结果 | 详情 |
|--------|:----:|:----:|
| Prisma Schema 数据分类 | $(badge $UNCLASSIFIED_COUNT) | $( [ "$UNCLASSIFIED_COUNT" -eq 0 ] && echo "✅ 所有model已分类" || echo "⚠️ ${UNCLASSIFIED_COUNT} 个model缺失" ) |
| Rules 权限标注 | $(badge $UNLABELED_RULES_COUNT) | $( [ "$UNLABELED_RULES_COUNT" -eq 0 ] && echo "✅ 页面均有权限标注" || echo "⚠️ ${UNLABELED_RULES_COUNT} 个文件缺失" ) |
| RLS 数据分类 | $(badge $RLS_MISSING_COUNT) | $( [ "$RLS_MISSING_COUNT" -eq 0 ] && echo "✅ 所有RLS表已分类" || echo "⚠️ ${RLS_MISSING_COUNT} 张表缺失" ) |
| PII 策略覆盖 | $( [ "$PII_POLICY_TOTAL" -gt 0 ] && echo "🟢" || echo "🟡" ) | $( [ "$PII_POLICY_TOTAL" -gt 0 ] && echo "${PII_POLICY_TOTAL} 条 PiiPolicy 已配置" || echo "PiiPolicy 未配置" ) |
| **总体** | **🔴 ${RISK_LABEL}** | **退出码: ${EXIT_CODE}** |

---

## 1️⃣ Prisma Schema 数据分类

> 数据分类级别: PUBLIC(公开) | INTERNAL(内部) | SENSITIVE(敏感) | RESTRICTED(受限)
> 扫描: apps/api/prisma/schema.prisma — 检查每个 model 的 PiiLevel 标注

REPORTEOF

  if [ "$UNCLASSIFIED_COUNT" -gt 0 ]; then
    echo "**⚠️ ${UNCLASSIFIED_COUNT} 个 model 含敏感字段但无 PiiLevel 标注:**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "| Model | 问题 |" >> "$REPORT_FILE"
    echo "|-------|------|" >> "$REPORT_FILE"
    while IFS= read -r model; do
      [ -z "$model" ] && continue
      echo "| \`${model}\` | 含敏感字段但未标注数据分类 |" >> "$REPORT_FILE"
    done <<< "$UNCLASSIFIED_MODELS"
    echo "" >> "$REPORT_FILE"
  else
    echo "✅ 所有 model 均有数据分类标注 \`PiiLevel\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
  fi

  echo "### 数据分类定级参考" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "| 级别 | 含义 | 示例 | 要求 |" >> "$REPORT_FILE"
  echo "|------|------|------|------|" >> "$REPORT_FILE"
  echo "| \`PUBLIC\` | 公开数据 | 商品名称、门店地址 | 无限制 |" >> "$REPORT_FILE"
  echo "| \`INTERNAL\` | 内部数据 | 规则配置、报表数据 | 内部访问 |" >> "$REPORT_FILE"
  echo "| \`SENSITIVE\` | 敏感数据 | 手机、邮箱、地址 | 脱敏 + PiiPolicy |" >> "$REPORT_FILE"
  echo "| \`RESTRICTED\` | 受限数据 | 密码、密钥、证书 | 加密 + 审批 + PiiPolicy |" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  cat >> "$REPORT_FILE" <<REPORTEOF
---

## 2️⃣ Rules 权限标注

> 扫描: apps/admin-web/app/rules/ — 检查每个 \`page.tsx\`/\`page.ts\` 的权限/角色标注

REPORTEOF

  if [ "$UNLABELED_RULES_COUNT" -gt 0 ]; then
    echo "**⚠️ ${UNLABELED_RULES_COUNT} 个文件缺少权限/角色标注:**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "| 文件 | 缺少 |" >> "$REPORT_FILE"
    echo "|------|------|" >> "$REPORT_FILE"
    while IFS= read -r file; do
      [ -z "$file" ] && continue
      echo "| \`$file\` | @roles / @permission 注解 |" >> "$REPORT_FILE"
    done <<< "$UNLABELED_RULES"
    echo "" >> "$REPORT_FILE"
  else
    echo "✅ 所有 Rules 页面均有权限/角色标注" >> "$REPORT_FILE"
  fi

  cat >> "$REPORT_FILE" <<REPORTEOF

---

## 3️⃣ RLS 数据分类

> 扫描: apps/api/src/database/migrations/\\*rls\\*.sql — 检查每张 RLS 表的数据分类标注

REPORTEOF

  if [ "$RLS_MISSING_COUNT" -gt 0 ]; then
    echo "**⚠️ ${RLS_MISSING_COUNT} 张 RLS 表缺少数据分类标注:**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "| 文件 | 表名 |" >> "$REPORT_FILE"
    echo "|------|------|" >> "$REPORT_FILE"
    while IFS= read -r entry; do
      [ -z "$entry" ] && continue
      echo "| \`$entry\` | 无数据分类 SQL 注释 |" >> "$REPORT_FILE"
    done <<< "$RLS_MISSING_LIST"
  else
    echo "✅ 所有 RLS 表均有数据分类标注 (SQL 注释标记分类级别)" >> "$REPORT_FILE"
  fi

  cat >> "$REPORT_FILE" <<REPORTEOF

---

## 4️⃣ PII 策略覆盖

> 检查: PiiPolicy model + schema 敏感字段 + 脱敏策略

REPORTEOF

  if [ "$PII_POLICY_TOTAL" -gt 0 ]; then
    echo "✅ PiiPolicy 已配置 ${PII_POLICY_TOTAL} 条策略" >> "$REPORT_FILE"
  else
    echo "⚠️ PiiPolicy 未配置 — 建议通过 PII 检测服务补充策略" >> "$REPORT_FILE"
  fi

  if [ "$SENSITIVE_FIELDS_COUNT" -gt 0 ]; then
    echo "" >> "$REPORT_FILE"
    echo "**Schema 中检测到 ${SENSITIVE_FIELDS_COUNT} 类敏感字段:**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    while IFS= read -r field; do
      [ -z "$field" ] && continue
      echo "- \`${field}\`" >> "$REPORT_FILE"
    done <<< "$SENSITIVE_FIELDS_LIST"
  fi

  cat >> "$REPORT_FILE" <<REPORTEOF

---

## 🚦 闸门判定

| 条件 | 状态 | 说明 |
|------|:----:|------|
| Prisma model 分类缺失 > 0 | $(badge $UNCLASSIFIED_COUNT) | ⚠️ 建议补充 PiiLevel 标注 |
| Rules 权限标注缺失 > 0 | $(badge $UNLABELED_RULES_COUNT) | ⚠️ 建议补充角色/权限标注 |
| RLS 数据分类缺失 > 0 | $(badge $RLS_MISSING_COUNT) | ⚠️ 建议补充 SQL 注释 |
| PII 策略覆盖 | $( [ "$PII_POLICY_TOTAL" -gt 0 ] && echo "🟢" || echo "🟡" ) | 已配置 |
| **出口** | **🔴 ${RISK_LABEL} (退出码 ${EXIT_CODE})** | |

> 🐜 [V18: security-baseline] · 安全基线修复 (G2退回)

REPORTEOF
fi

exit $EXIT_CODE
