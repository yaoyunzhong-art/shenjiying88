# 🐜 派树哥 #pulse506 — admin-web TSC 75 errors (NEW回归)

> **发现时间**: 2026-07-16 09:47 CST (pulse#506)
> **状态**: 🆕 首次派单
> **根因**: 最近提交 f45a7306d feat(storefront): wave3 + finance 新增 4658行 (UI增强+finance模块) 导致admin-web TSC假阳激增

## 诊断

### 基线变化 (pulse#505 → #506)
| 指标 | #505 | #506 | 变化 |
|:----|:----:|:----:|:----:|
| admin-web TSC | 8 errors | **75 errors** | 🚨 +67 NEW |
| admin-web Test | 61 fail | 57 fail | ✅ -4 改善 |
| storefront TSC | ✅ | ✅ | 持平 |
| storefront Test | 5755/5756·1 fail | 5811/5812·1 fail | ✅ 改善58新测试全部通过 |
| app tests | 222/222 🟢 | 222/222 🟢 | ✅ |
| 其他模块 | 全绿 | 全绿 | ✅ |

### TSC 75 Error 分布
| 文件 | 错误数 | 类型 |
|:----|:-----:|:-----|
| stock-operations/page.tsx | 15 | ButtonSize/ButtonVariant/StatCardProps/DataTable |
| ai-decision/page.tsx | 14 | StatCardProps/DataTable/ButtonVariant + number→string |
| safety/page.tsx | 13 | StatCardProps/DataTable/selectable |
| shop/fulfillment/page.tsx | 11 | StatCardProps/DataTable |
| fire-prevention/page.tsx | 11 | StatCardProps/DataTable |
| pad/page.tsx | 3 | StatCardProps |
| sla-view-model.ts | 2 | ServiceStatus未定义 |
| api/coupons/*/route.ts | 4 | module resolution: _proxy/utils |
| api/knowledge/*/route.ts | 2 | module resolution: pg |

### 核心问题
1. **StatCardProps** — 组件接口缺失 `title` 属性 → 需要增加或替换为 `label`
2. **ButtonVariant/ButtonSize** — string literal 不匹配枚举类型
3. **DataTable** — `selectable` 属性不存在于 DataTableProps
4. **ServiceStatus** — 未定义类型
5. **module resolution** — 5条 route 文件模块路径错误

## 修复范围

### Fix-1: StatCardProps 接口对齐 (约40处·5文件)
**涉及**: ai-decision, safety, shop/fulfillment, fire-prevention, stock-operations, pad
**类型**: `{ title, value, secondary, tone? }` → 补充 `title` 到 StatCardProps 或改为 `label`
**位置**: `apps/admin-web/components/stat-card.tsx` (假设)

### Fix-2: Button类型对齐 (约10处·3文件)
**涉及**: ai-decision, stock-operations
**类型**: `'xs'|'sm'|'md'|'lg'` → ButtonSize; `'text'|'primary'|'default'|'dashed'` → ButtonVariant

### Fix-3: DataTable selectable + 属性 (约6处·5文件)
**涉及**: safety, stock-operations, ai-decision, shop/fulfillment, fire-prevention
**类型**: DataTableProps 缺少 selectable

### Fix-4: ServiceStatus 定义 (2处)
**文件**: sla-view-model.ts:234

### Fix-5: route模块路径 (5处)
**文件**: api/coupons/*/route.ts + api/knowledge/*/route.ts

## 截止
⏰ 下个脉冲 (#507 预计 ~10:20) 前修复

## 连续追踪
- 这是自 pulse#503b 树哥修复后首次出现 NEW 回归
- P0升级条件: 连续2脉冲未闭环 (下个脉冲#507如果未修复→P0)
