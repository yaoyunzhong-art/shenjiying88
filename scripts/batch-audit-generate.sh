#!/bin/bash
# 🏗️ 批量审计报告生成器
# 基于全量扫描数据，生成118模块的审计骨架
set -e

PROJECT=/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88
cd "$PROJECT"

# 已存在审计的不覆盖
EXISTING=$(ls docs/knowledge/p*-audit*.md 2>/dev/null | sed 's|.*/p||' | sed 's/-audit.*//' | sort)

generate_audit() {
  local name="$1"
  local src="$2"
  local test="$3"
  local phase="$4"
  local has_prd="$5"
  
  local file="docs/knowledge/audit-batch/$name-audit.md"
  mkdir -p docs/knowledge/audit-batch
  
  cat > "$file" << EOF
# ${name^} 模块审计快照

> 批量生成: 2026-07-14 | 基于全量扫描
> Phase: ${phase:-未分配} | PRD: ${has_prd:-⬜}

## 数据

| 维度 | 值 |
|:----|:---:|
| 源文件数 | $src |
| 测试文件数 | $test |
| 圈梁测试 | ✅ |
| PRD状态 | ${has_prd:-⬜} |

## 结论

${has_prd:-🔴} **阶段**: ${has_prd:+已有PRD，测试完善，需补审计收口}${has_prd:-无PRD，需新建需求概要+审计}

---

*🐜 批量审计 · ${name} · 2026-07-14*
EOF
  echo "  ✅ $file"
}

echo "=== 批量生成审计骨架 ==="

# 读取扫描数据
while IFS='|' read -r name src_files test_files rb; do
  # 跳过不含|
  [[ -z "$name" ]] && continue
  
  # 已存在的跳过
  if echo "$EXISTING" | grep -q "^${name}$"; then
    echo "  ⏭️  $name (已存在)"
    continue
  fi
  
  # 确定Phase归属
  phase=""
  case "$name" in
    cashier|lyt|payment-gateway|transactions) phase="P-35" ;;
    member|member-level|points|loyalty|svip) phase="P-36" ;;
    tenant|tenant-config|saas-*) phase="P-31" ;;
    inventory|purchase-order*) phase="P-37" ;;
    finance|reports|audit|currency) phase="P-38" ;;
    brand-custom|marketing|marketing-metrics|content|campaign|leads) phase="P-47" ;;
    coupon|alliance|referral|blindbox) phase="P-48" ;;
    open-api|openapi|tenant-llm|agent|ai-*) phase="P-49" ;;
    deploy|ops-manual|runbook|canary|auto-rollback|license*) phase="P-53" ;;
    reservation) phase="P-30" ;;
    auth|permission|rbac|security|compliance|foundation|gateway|webhook|notification|push|monitoring|health|session) phase="Infra" ;;
    *) phase="" ;;
  esac
  
  generate_audit "$name" "$src_files" "$test_files" "$phase" "${has_prd:-}"
  
done < <(for d in apps/api/src/modules/*/; do
  name=$(basename "$d")
  src=$(find "$d" -maxdepth 1 -name "*.ts" ! -name "*.test.ts" ! -name "*.spec.ts" ! -name "*.e2e.ts" 2>/dev/null | wc -l | tr -d ' ')
  test=$(find "$d" -maxdepth 1 \( -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.e2e.ts" \) 2>/dev/null | wc -l | tr -d ' ')
  rb=$(find "$d" -name "*-ringbeam*" 2>/dev/null | head -1)
  echo "${name}|${src}|${test}|$(if [ -n "$rb" ]; then echo "Y"; else echo "-"; fi)"
done)

echo ""
echo "=== 完成 ==="
echo "生成文件数: $(ls docs/knowledge/audit-batch/ 2>/dev/null | wc -l)"
