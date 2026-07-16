#!/bin/bash
# 覆盖率检查脚本 — Phase4质量门
# 输出: docs/knowledge/coverage-report-$(date +%Y-%m-%d).md

REPO_DIR="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
cd "$REPO_DIR" || exit 1

REPORT="docs/knowledge/coverage-report-$(date +%Y-%m-%d).md"

echo "# 覆盖率报告 $(date +%Y-%m-%d)" > "$REPORT"
echo "" >> "$REPORT"

# 1. E2E覆盖率
echo "## E2E测试覆盖" >> "$REPORT"
E2E_COUNT=$(find apps/api/src/modules -name "*.e2e.test.ts" 2>/dev/null | wc -l)
MODULE_COUNT=$(find apps/api/src/modules -maxdepth 1 -type d | wc -l)
echo "- E2E文件数: $E2E_COUNT" >> "$REPORT"
echo "- 总模块数: $MODULE_COUNT" >> "$REPORT"
echo "" >> "$REPORT"

# 2. admin-web测试覆盖率
echo "## admin-web测试覆盖" >> "$REPORT"
ADMIN_PAGES=$(ls -d apps/admin-web/app/*/ 2>/dev/null | wc -l)
ADMIN_TESTED=0
for d in apps/admin-web/app/*/; do
  name=$(basename "$d")
  [ "$name" = "__e2e__" ] || [ "$name" = "api" ] && continue
  testfile=$(find "$d" -name "*.test.*" 2>/dev/null | head -1)
  [ -n "$testfile" ] && ADMIN_TESTED=$((ADMIN_TESTED + 1))
done
echo "- 页面数: $ADMIN_PAGES" >> "$REPORT"
echo "- 有测试页面: $ADMIN_TESTED" >> "$REPORT"
echo "" >> "$REPORT"

# 3. storefront测试覆盖
echo "## storefront测试覆盖" >> "$REPORT"
SF_PAGES=$(ls -d apps/storefront-web/app/*/ 2>/dev/null | wc -l)
SF_TESTED=0
for d in apps/storefront-web/app/*/; do
  name=$(basename "$d")
  [ "$name" = "__smoke__" ] && continue
  testfile=$(find "$d" -name "*.test.*" 2>/dev/null | head -1)
  [ -n "$testfile" ] && SF_TESTED=$((SF_TESTED + 1))
done
echo "- 页面数: $SF_PAGES" >> "$REPORT"
echo "- 有测试页面: $SF_TESTED" >> "$REPORT"
echo "" >> "$REPORT"

# 4. 前20个无E2E模块
echo "## 缺失E2E模块" >> "$REPORT"
for m in $(find apps/api/src/modules -maxdepth 1 -type d -exec basename {} \; | sort | uniq); do
  if ! find "apps/api/src/modules/$m" -name "*.e2e.test.ts" 2>/dev/null | grep -q .; then
    echo "- $m" >> "$REPORT"
  fi
done

echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S %Z')" >> "$REPORT"

echo "报告已生成: $REPORT"
wc -l "$REPORT"
