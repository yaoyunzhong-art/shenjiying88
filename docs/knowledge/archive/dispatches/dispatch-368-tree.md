# 🌲 dispatch-368 · 联合修复(第2次) + admin-web TSC修复

> 源于 dispatch-367 第1次验收❌(等待1h零commit)
> 脉冲: pulse#368 · 2026-07-12 19:10
> **新增**: admin-web TSC回归 ~40 TS errors(缓存掩盖揭示)

---

## 🔥 任务单

### 1/4 · admin-web TSC修复 🟡 NEW!

**模块**: `@m5/admin-web` — `apps/admin-web/app/stores/[id]/`

当前 ~40 TS errors 分布在至少5页面:
- analytics, audit, capability-access, devices, health-score, inspection, settings, training

**错误类型**:
1. `Row`/`Col` 非 @m5/ui 导出成员（替换为flex布局或Space替代）
2. `Statistic` 无 `title` prop（替换为 `label` 或直接用html）
3. `Tag` 无 `color` prop（使用 className + CSS 替代）
4. `TableColumn` 缺 `key` prop
5. `Button` `type="primary"` → 类型不匹配（改为html原生或修改type值）
6. `PageShell` 缺 `title` prop

**修复参考**: 查看 @m5/ui 实际类型定义确定正确用法

---

### 2/4 · storefront-web __smoke__ 8✖ 修复

**模块**: `apps/storefront-web/` — 8 tests failing
```
✖ 差异数据中应有正值和零值
✖ 状态枚举值应完整且不可变
✖ completedAt 应为可选的
✖ cancelled 状态记录应有 completedAt
✖ should contain expected data in page source
✖ should pass records and total as props
✖ 应导入 StoreManagerDashboardClient
✖ 应返回 JSX 组件 StoreManagerDashboardClient
```

---

### 3/4 · tob-web ✖4 fix

**模块**: `apps/tob-web/`
```
✖ 应展示 "暂无数据" 空状态（过滤无结果时）
✖ 应包含页面错误/加载异常时的兜底处理
✖ customers-data 应定义 CUSTOMER_STATUSES / CUSTOMER_TIERS / CUSTOMER_INDUSTRIES
✖ app/sports-ants/news/[id]/page.test.ts — 'test failed'
```

---

### 4/4 · miniapp ✖4 fix

**模块**: `apps/miniapp/`
```
✖ 应处理积分不足时的限制
✖ 应包含会员等级(tier)体系，至少3个等级
✖ 应处理空任务列表
✖ 应处理客户列表为空场景
```

---

## ✅ 验收标准 (下一脉冲)
- [ ] `pnpm turbo typecheck --filter='!@m5/api' --force` → 0 error (除@m5/app expo-local-authentication慢性)
- [ ] `pnpm turbo test --filter=@m5/storefront-web --force` → 0 fail
- [ ] `pnpm turbo test --filter=@m5/tob-web --force` → 0 fail
- [ ] `pnpm turbo test --filter=@m5/miniapp --force` → 0 fail  
- [ ] `pnpm turbo test --filter='@m5/app' --force` → 222/222 ✅
- [ ] `pnpm turbo test --filter='@m5/admin-web' --force` → 4278/4278 ✅
