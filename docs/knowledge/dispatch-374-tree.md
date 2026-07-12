# 🌲 dispatch-374 · storefront-web TSC 回归(EmptyStateProps+ErrorBoundary)

> 源自 pulse#381 缓存消除真实揭示
> 脉冲: pulse#381 · 2026-07-13 02:21
> **严重度**: P1 (TSC阻塞 · 10处错误)

---

## 错误分布

### 1. EmptyStateProps 缺少 actionLabel (6处)
```
app/store-manager/page.tsx(74,7): TS2322: actionLabel不存在于EmptyStateProps
app/stores/compare/page.tsx(93,7): TS2322: actionLabel不存在于EmptyStateProps
app/stores/compare/page.tsx(105,7): TS2322: actionLabel不存在于EmptyStateProps
app/member-upgrade-path/page.tsx(213,?: 同上)
app/reports/[id]/page.tsx(139,?: 同上)
app/reports/page.tsx(210,222,?: 同上)
```

**原因**: `@m5/ui` 的 `EmptyStateProps` 接口只有 `{title, description, action, icon, variant}`，没有 `actionLabel` 属性。页面传入了 `actionLabel="..."` 但组件不接收。

**修复方向 (二选一)**:
- **方案A**: 在 `EmptyStateProps` 中增加 `actionLabel?: string` + 内部渲染为 `<button>` (推荐，更简单一致)
- **方案B**: 把 `actionLabel` 改为 `action={<button>...</button>}` ReactNode (每个调用处改)

### 2. ErrorBoundary fallback 类型不匹配 (4处)
```
app/store-manager/page.tsx(189,22): TS2322: Element is not assignable to (args: ErrorBoundaryFallbackArgs) => ReactNode
app/stores/compare/page.tsx(298,22): 同上
```

**原因**: `ErrorBoundary` 期望 fallback 为函数 `(args: ErrorBoundaryFallbackArgs) => ReactNode`，但传入了 JSX `<Component>`。
**修复**: 改为 `fallback={() => <Component />}` 或改 caller。

---

## 影响范围
- `apps/storefront-web/app/store-manager/page.tsx` — 2处
- `apps/storefront-web/app/stores/compare/page.tsx` — 4处
- `apps/storefront-web/app/member-upgrade-path/page.tsx` — 1处
- `apps/storefront-web/app/reports/[id]/page.tsx` — 1处
- `apps/storefront-web/app/reports/page.tsx` — 3处

## 验收标准
- [ ] `pnpm turbo typecheck --filter=@m5/storefront-web` 通过 (0 errors)
- [ ] 不破坏现有测试 (`pnpm turbo test --filter=@m5/storefront-web`)
