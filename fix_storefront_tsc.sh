#!/bin/bash
set -e
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88

# === orders/page.tsx ===
ORDERS=apps/storefront-web/app/orders/page.tsx
# cancelled: 'neutral' -> 'default'
sed -i '' 's/cancelled: .*neutral.*,/cancelled: '"'"'default'"'"',/' "$ORDERS"
# storeName: undefined fix
sed -i '' 's/storeName: stores\[Math\.floor(Math\.random() \* stores\.length)\],$/storeName: stores[Math.floor(Math.random() * stores.length)]!,/' "$ORDERS"
# remark: undefined fix
sed -i '' 's/remark: remarks\[Math\.floor(Math\.random() \* remarks\.length)\],$/remark: remarks[Math.floor(Math.random() * remarks.length)]!,/' "$ORDERS"
# StatCard variant="neutral" -> "default"
sed -i '' 's/variant="neutral"/variant="default"/g' "$ORDERS"

# === products/page.tsx ===
PRODS=apps/storefront-web/app/products/page.tsx
# subCatgs undefined fix
sed -i '' 's/subCategory: subCatgs\[Math\.floor(Math\.random() \* subCatgs\.length)\],/subCategory: subCatgs[Math.floor(Math.random() * subCatgs.length)]!,/' "$PRODS"
# Tag variant="danger" -> "error" (3 places)
sed -i '' "s/t === '热销' ? 'danger' : t === '新品' ? 'success' : 'info'/t === '热销' ? 'error' : t === '新品' ? 'success' : 'info'/g" "$PRODS"
# Tag size="xs" -> "sm" (3 places)
sed -i '' 's/size="xs"/size="sm"/g' "$PRODS"
# Rating size="sm" -> size={14} (2 places)
sed -i '' 's/<Rating value={item\.rating} max={5} size="sm" readonly/<Rating value={item.rating} max={5} size={14} readonly/g' "$PRODS"
sed -i '' 's/<Rating value={product\.rating} max={5} size="sm" readonly/<Rating value={product.rating} max={5} size={14} readonly/g' "$PRODS"
# Button variant="default" -> "secondary" (lines 409, 503)
# Use perl for more precise handling
perl -i'' -pe 's/variant="default"(.*)onClick=\{openEdit\}/variant="secondary"$1onClick={openEdit}/' "$PRODS"
perl -i'' -pe 's/variant="default"(.*)onClick=\{\(\) => setEditMode\(false\)\}/variant="secondary"$1onClick={() => setEditMode(false)}/' "$PRODS"

echo "All fixes applied."
