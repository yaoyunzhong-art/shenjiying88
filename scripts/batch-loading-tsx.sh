#!/usr/bin/env bash
# scripts/batch-loading-tsx.sh — 批量创建缺失的loading.tsx
# 扫描 admin-web/storefront-web 缺loading的page目录，批量创建

set -euo pipefail

REPO=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88")
cd "$REPO"

create_loading() {
  local dir="$1"
  local loading_file="${dir}/loading.tsx"
  local page_file="${dir}/page.tsx"
  
  [ -f "$loading_file" ] && return  # 已有则跳过
  [ ! -f "$page_file" ] && return   # 没有page也跳过
  
  cat > "$loading_file" <<'EOF'
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse space-y-4 w-full max-w-4xl">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
EOF
  echo "  CREATED: $loading_file"
}

echo "=== admin-web 缺loading的页面 ==="
count=0
for dir in apps/admin-web/app/*/; do
  if [ -f "${dir}page.tsx" ] && [ ! -f "${dir}loading.tsx" ]; then
    create_loading "$dir"
    count=$((count+1))
  fi
done
echo "admin-web: $count loading.tsx created"

echo ""
echo "=== storefront-web 缺loading的页面 ==="
count=0
for dir in apps/storefront-web/app/*/; do
  if [ -f "${dir}page.tsx" ] && [ ! -f "${dir}loading.tsx" ]; then
    create_loading "$dir"
    count=$((count+1))
  fi
done
echo "storefront-web: $count loading.tsx created"

echo ""
echo "Done"
