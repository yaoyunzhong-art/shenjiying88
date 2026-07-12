# 🌲 dispatch-374 · storefront-web TSC 回归 (16处: EmptyStateProps+ErrorBoundary+新3类)

> 源自 pulse#381 缓存消除真实揭示 · **pulse#382 首次验收失败零commit + scope扩展**
> 脉冲: pulse#381 → pulse#382 · 2026-07-13 02:21 → 02:51
> **严重度**: P1 (TSC阻塞 · 16处错误) · ⚠️ **30min零commit** · **1次验收失败**
> **存活脉冲**: 0

---

## 错误分布 (pulse#382 揭示: 原10✖ → 扫雪式force揭示16✖)

### 1. EmptyStateProps 缺少 actionLabel (7处)
```
app/store-manager/page.tsx(74,7): TS2322: actionLabel不存在于EmptyStateProps
app/stores/compare/page.tsx(93,7): TS2322: actionLabel不存在于EmptyStateProps
app/stores/compare/page.tsx(105,7): TS2322: actionLabel不存在于EmptyStateProps
app/member-upgrade-path/page.tsx(213,7): TS2322: actionLabel不存在于EmptyStateProps
app/reports/[id]/page.tsx(139,7): TS2322: actionLabel不存在于EmptyStateProps
app/reports/page.tsx(210,7): TS2322: actionLabel不存在于EmptyStateProps
app/reports/page.tsx(222,7): TS2322: actionLabel不存在于EmptyStateProps
```

### 2. ErrorBoundary fallback 类型不匹配 (5处)
```
app/member-upgrade-path/page.tsx(258,22): TS2322: Type 'Element' not assignable to (args: ErrorBoundaryFallbackArgs) => ReactNode
app/reports/[id]/page.tsx(297,22): TS2322: Type 'Element' not assignable to (args: ErrorBoundaryFallbackArgs) => ReactNode
app/reports/page.tsx(253,22): TS2322: Type 'Element' not assignable to (args: ErrorBoundaryFallbackArgs) => ReactNode
app/store-manager/page.tsx(189,22): TS2322: Type 'Element' not assignable to (args: ErrorBoundaryFallbackArgs) => ReactNode
app/stores/compare/page.tsx(298,22): TS2322: Type 'Element' not assignable to (args: ErrorBoundaryFallbackArgs) => ReactNode
```

### 3. 🔥 NEW: TS2307 模块未找到 (1处)
```
app/reports/[id]/page.tsx(19,36): TS2307: Cannot find module '../report-detail-client'
```
**原因**: `reports/[id]/page.tsx` import了 `'../report-detail-client'` 但该文件不存在或路径错误。

### 4. 🔥 NEW: statusInfo 可能未定义 (3处)
```
app/reports/[id]/page.tsx(283,25): TS18048: 'statusInfo' is possibly 'undefined'
app/reports/[id]/page.tsx(284,20): TS18048: 'statusInfo' is possibly 'undefined'
app/reports/[id]/page.tsx(289,12): TS18048: 'statusInfo' is possibly 'undefined'
```
**原因**: `startTimeInfo` 被 `find()` 后未null-check直接解构/访问属性。

---

## 修复策略

### 固定优先: EmptyStateProps (7处)
**方案A（推荐）**: `@m5/ui` 的 `EmptyStateProps` 加 `actionLabel?: string` + `actionHref?: string`

### ErrorBoundary fallback (5处)
所有调用处改为: `fallback={() => <Component />}`

### Module not found (1处)
`reports/[id]/page.tsx:19` — 检查report-detail-client是否存在，修正import路径

### statusInfo null-check (3处)
reports/[id]/page.tsx:283-289 — 加可选链或提前守卫

---

## 影响范围
- `apps/storefront-web/app/store-manager/page.tsx` — 2处
- `apps/storefront-web/app/stores/compare/page.tsx` — 4处
- `apps/storefront-web/app/member-upgrade-path/page.tsx` — 2处
- `apps/storefront-web/app/reports/[id]/page.tsx` — 5处 ✨NEW
- `apps/storefront-web/app/reports/page.tsx` — 3处

## 验收标准
- [ ] `pnpm turbo typecheck --filter=@m5/storefront-web` 通过 (0 errors)
- [ ] 不破坏现有测试 (`pnpm turbo test --filter=@m5/storefront-web`)
