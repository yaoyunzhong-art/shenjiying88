# 🐜 dispatch-530-tree · admin-web shop 3页拉升 TSC+Test修复

> **来源**: pulse#530 验收 · 2026-07-16 22:05 CST
> **原因**: feat(admin-web): shop 3页拉升 (317d9ef8e) — discount-rules 12→240 + inventory 12→250 + analytics 12→285
> **触发**: 13 NEW TSC errors + 5 NEW test failures

---

## 🔴 TSC Errors (13个)

### 文件: `app/shop/analytics/page.tsx` (4 errors)
| # | 行 | 问题 | 修复方向 |
|:-:|:--:|:-----|:---------|
| 1 | 180 | `Type 'number' is not assignable to type 'string'` — TrendItem.value类型不符 | 检查TrendItem定义, value应为number或加toString() |
| 2 | 191 | `'direction' does not exist in type '{ value: string; positive: boolean; }'` — 属性名错 | 将`direction`改为`positive`或对齐接口定义 |
| 3 | 212 | `DailySales[]` not assignable to `{ [key: string]: string\|number }[]` — 缺索引签名 | 给DailySales加`[key: string]: string | number`索引签名或加`as any` |
| 4 | 236 | `DataTableColumn<TopProduct>[]` → `DataTableColumn<unknown>[]` — 泛型不匹配 | 给DataTable加泛型约束 `<TopProduct>` |

### 文件: `app/shop/discount-rules/page.tsx` (4 errors)
| # | 行 | 问题 | 修复方向 |
|:-:|:--:|:-----|:---------|
| 5 | 138 | `pageItems` does not exist — usePagination没返回pageItems | 改为`paginate(items)`调用 |
| 6 | 138 | `Argument type DiscountRule[]` not assignable to `number` — 传参位置错 | 修复paginate调用签名 |
| 7 | 175 | `"danger"` not assignable — StatusBadge不支持 | 改为`"error"`或扩展StatusBadge类型 |
| 8 | 200 | `DataTableColumn<DiscountRule>[]` → `DataTableColumn<unknown>[]` — 同上 | 给DataTable加泛型 |

### 文件: `app/shop/inventory/page.tsx` (5 errors)
| # | 行 | 问题 | 修复方向 |
|:-:|:--:|:-----|:---------|
| 9 | 94 | `'dir'` does not exist — DataTableSortConfig属性名错 | `dir` → `direction` |
| 10 | 108 | `pageItems` does not exist — 同上 | 改为`paginate(items)` |
| 11 | 108 | 传参类型错 — 同上 | 修复调用签名 |
| 12 | 128 | `"danger"` not assignable — 同上 | 改为`"error"` |
| 13 | 146 | `DataTableColumn<InventoryItem>[]` → `DataTableColumn<unknown>[]` — 同上 | 加泛型 |

---

## 🟡 Test Failures (5个)

| 文件 | 说明 | 修复方向 |
|:----|:-----|:---------|
| `app/shop/analytics/page.test.tsx` | 页面新增后测试不匹配 | 更新测试匹配新UI |
| `app/shop/discount-rules/page.test.tsx` | 同上 | 更新测试 |
| `app/shop/fulfillment/page.test.tsx` | 同上 | 更新测试 |
| `app/shop/inventory/page.test.tsx` | 同上 | 更新测试 |
| `app/shop/order-reviews/page.test.tsx` | 同上 | 更新测试 |

---

## 📋 要求

1. **P0**: 修复13个TSC错误 → 恢复admin-web TSC 14/14全绿
2. **P1**: 修复5个test → shop pages全部通过
3. **截止**: 下个脉冲(#531)验收
4. **连续2次未闭环** → P0升级

> 参考: @m5/ui DataTable签名 `DataTable<T>(props: DataTableProps<T>)` · `usePagination`返回`paginate<T>`而非`pageItems` · StatusBadge支持 `"default"|"success"|"info"|"warning"|"error"`
