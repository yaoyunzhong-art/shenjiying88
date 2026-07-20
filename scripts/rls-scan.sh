#!/usr/bin/env bash
# ==============================================================================
# scripts/rls-scan.sh — RLS 多租户隔离完整性扫描
#
# 🐜 RQ-20260720-013: RLS verify 端点 + 每周 cron 扫描
#
# 功能:
#   1. 扫描所有 database 表，检查 tenantId 列完整性
#   2. 输出 JSON 报告: 缺失 tenantId 的表列表
#   3. 可用于 cron 或 CI 管道
#
# 用法:
#   ./scripts/rls-scan.sh                    # 使用默认 DATABASE_URL 环境变量
#   DATABASE_URL="postgresql://..." ./scripts/rls-scan.sh
#   ./scripts/rls-scan.sh --json             # 仅输出 JSON 报告
#   ./scripts/rls-scan.sh --quiet            # 静默模式，只输出 JSON
#   ./scripts/rls-scan.sh --threshold=10     # 缺失超过 N 张表视为 failed
#
# 退出码:
#   0 — 所有 tenant-aware 表均具备 tenantId 列
#   1 — 存在缺失 tenantId 的表
#   ≥2 — 运行时错误
# ==============================================================================

set -euo pipefail

# ─── 配置 ───────────────────────────────────────────────────────────────────
SCAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-}"
QUIET=false
JSON_ONLY=false
THRESHOLD=0  # 缺失超过此数量视为 failed

# ─── 参数解析 ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON_ONLY=true; shift ;;
    --quiet) QUIET=true; shift ;;
    --threshold=*) THRESHOLD="${1#*=}"; shift ;;
    --threshold) THRESHOLD="$2"; shift 2 ;;
    --help|-h)
      sed -n '3,/^# ─── 配置 ──/p' "${BASH_SOURCE[0]}" | grep '^#' | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

# ─── 检测连接字符串 ──────────────────────────────────────────────────────────
if [[ -z "$DATABASE_URL" ]]; then
  # 尝试从 .env 或 .env.local 加载
  for envfile in "$SCAN_DIR/apps/api/.env" "$SCAN_DIR/apps/api/.env.local" "$SCAN_DIR/.env" "$SCAN_DIR/.env.local"; do
    if [[ -f "$envfile" ]]; then
      DATABASE_URL=$(grep -E '^DATABASE_URL=' "$envfile" | head -1 | cut -d= -f2- | tr -d '"'"'")
      [[ -n "$DATABASE_URL" ]] && break
    fi
  done
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo '{"success":false,"error":"DATABASE_URL not set","hint":"Set DATABASE_URL env or add to .env"}' >&2
  exit 2
fi

# ─── 扫描 SQL ────────────────────────────────────────────────────────────────
SCAN_SQL=$(cat <<'EOF'
SELECT
  c.relname AS table_name,
  n.nspname AS schema_name,
  CASE
    WHEN tc.column_name IS NOT NULL THEN true
    ELSE false
  END AS has_tenant_id
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
  SELECT DISTINCT table_name, column_name
  FROM information_schema.columns
  WHERE column_name IN ('tenantId', 'tenant_id')
) tc ON tc.table_name = c.relname
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname
EOF
)

# ─── 执行扫描 ────────────────────────────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  echo '{"success":false,"error":"psql not found"}'
  exit 2
fi

DATA=$(PGPAGER= PAGER= psql "$DATABASE_URL" -t -A -F'|' -c "$SCAN_SQL" 2>/dev/null) || {
  echo '{"success":false,"error":"Database connection failed"}'
  exit 2
}

# ─── 解析结果 ────────────────────────────────────────────────────────────────
TOTAL_TABLES=0
TENANT_ID_TABLES=0
MISSING_TABLES="["
FIRST=true

while IFS='|' read -r table_name schema_name has_tenant; do
  [[ -z "$table_name" ]] && continue
  TOTAL_TABLES=$((TOTAL_TABLES + 1))
  if [[ "$has_tenant" == "t" ]]; then
    TENANT_ID_TABLES=$((TENANT_ID_TABLES + 1))
  else
    if [[ "$FIRST" == true ]]; then
      MISSING_TABLES="${MISSING_TABLES}\"${schema_name}.${table_name}\""
      FIRST=false
    else
      MISSING_TABLES="${MISSING_TABLES},\"${schema_name}.${table_name}\""
    fi
  fi
done <<< "$DATA"

MISSING_TABLES="${MISSING_TABLES}]"
MISSING_COUNT=$((TOTAL_TABLES - TENANT_ID_TABLES))
ISOLATED=false
[[ "$MISSING_COUNT" -eq 0 ]] && ISOLATED=true

EXIT_CODE=0
if [[ "$ISOLATED" == false ]] && [[ "$MISSING_COUNT" -gt "$THRESHOLD" ]]; then
  EXIT_CODE=1
fi

# ─── 报告 ────────────────────────────────────────────────────────────────────
CHECKED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

REPORT=$(cat <<REPORT_EOF
{
  "success": true,
  "scanType": "tenantId-integrity",
  "checkedAt": "${CHECKED_AT}",
  "isolated": ${ISOLATED},
  "totalTables": ${TOTAL_TABLES},
  "tenantIdTables": ${TENANT_ID_TABLES},
  "missingCount": ${MISSING_COUNT},
  "missingTenantIdTables": ${MISSING_TABLES}
}
REPORT_EOF
)

if [[ "$QUIET" == true ]] || [[ "$JSON_ONLY" == true ]]; then
  echo "$REPORT"
else
  echo "═══════════════════════════════════════════════"
  echo "  RLS 多租户隔离完整性扫描报告"
  echo "═══════════════════════════════════════════════"
  echo "  扫描时间:  ${CHECKED_AT}"
  echo "  总表数:    ${TOTAL_TABLES}"
  echo "  tenantId:  ${TENANT_ID_TABLES}/${TOTAL_TABLES}"
  echo "  缺失:      ${MISSING_COUNT}"
  echo ""
  if [[ "$MISSING_COUNT" -gt 0 ]]; then
    echo "  ⚠️  以下表缺少 tenantId 列:"
    echo "$MISSING_TABLES" | sed 's/\[//' | sed 's/\]//' | tr ',' '\n' | sed 's/^/    - /'
  else
    echo "  ✅ 所有 $TOTAL_TABLES 张表均已正确配置 tenantId 列"
  fi
  echo ""
  echo "  JSON: $REPORT"
  echo "═══════════════════════════════════════════════"
fi

exit "$EXIT_CODE"
