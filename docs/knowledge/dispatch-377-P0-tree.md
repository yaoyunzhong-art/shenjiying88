# 🌲 dispatch-377-P0 🚨🚨 P0升级 — storefront TSC 16✖ + admin 供应商测试3✖

> **来源**: dispatch-376-P0 连续2次验收零commit → P0升级
> dispatch-376-P0 创建于 pulse#383 (03:21), 零commit于 pulse#384 (03:51), pulse#385 (04:21)
> **存活脉冲**: 0 (刚创建) · **累计零commit时间**: 60min+
> **P0升级触发**: 第2次验收零commit (铁律: 连续2次→P0升级)

---

## 错误分布 (force验证)

### 模块1: storefront-web TSC 16✖ (P0)
| 类别 | 数量 | 文件 | 错误类型 |
|:----:|:----:|:-----|:--------:|
| EmptyStateProps (actionLabel缺失) | 6 | store-manager(1), stores/compare(2), member-upgrade-path(1), reports/[id](1), reports(2) | TS2322 |
| ErrorBoundary fallback类型不匹配 | 5 | member-upgrade-path(1), reports/[id](1), reports(1), store-manager(1), stores/compare(1) | TS2322 |
| TS2307 模块未找到 | 1 | reports/[id]/page.tsx:19 — `'../report-detail-client'` | TS2307 |
| statusInfo 可能未定义 | 3 | reports/[id]/page.tsx:283-289 | TS18048 |

### 模块2: admin-web 供应商页面测试3✖ (P1)
| 文件 | 行 | 断言 | 描述 |
|:----:|:--:|:----:|:------|
| suppliers/page.test.tsx | 146 | 缺少批量选择 | `${supplier.supplierId}` 选择按钮 |
| suppliers/page.test.tsx | 154 | 缺少详情弹窗 | supplier detail modal 检查 |
| suppliers/page.test.tsx | 178 | 缺少审计信息 | `!src.includes('audit')` |

---

## 修复策略

### TSC策略 (优先)

**1. EmptyStateProps (6处)**
```
方案A(推荐): @m5/ui EmptyStateProps 加 actionLabel?: string + actionHref?: string
方案B: 改为 title + description 双行布局
```

**2. ErrorBoundary fallback (5处)**
```
修复: fallback={<Component />} → fallback={() => <Component />}
```

**3. TS2307模块未找到 (1处)**
```
修复: reports/[id]/page.tsx:19 — 创建或修正report-detail-client引用路径
```

**4. statusInfo null-check (3处)**
```
修复: 加可选链 statusInfo?.xxx 或提前 if(statusInfo) 守卫
```

### admin测试 (次要)
```
检查 suppliers/page 是否确实渲染批量选择/详情弹窗/审计时间
若无 → 补渲染；若设计无 → 调整断言匹配实际UI
```

---

## 影响范围
- `apps/storefront-web/app/store-manager/page.tsx` — 2处
- `apps/stores/compare/page.tsx` — 4处
- `apps/member-upgrade-path/page.tsx` — 2处
- `apps/reports/[id]/page.tsx` — 5处
- `apps/reports/page.tsx` — 3处
- `apps/admin-web/app/suppliers/page.test.tsx` — 3断言

## 验收标准
- [ ] `pnpm turbo typecheck --filter=@m5/storefront-web --force` 通过 (0 errors)
- [ ] `pnpm turbo test --filter=@m5/admin-web --force` 通过 (0 failures)
- [ ] 不影响已有测试: storefront 4,950/4,950✅
