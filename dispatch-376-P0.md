# 🚨 P0 强制升级: dispatch-376

> 生成: 2026-07-13 03:21 (CST) · pulse#383
> 触发: dispatch-374(storefront TSC 16✖) + dispatch-375(admin test ~35✖) 连续2次验收零commit

---

## 失败链历史

| 派单 | 目标 | 脉冲 | 状态 |
|------|------|------|------|
| dispatch-374 | storefront-web TSC 10✖→16✖(scope扩展) | #381派→#382 30min零commit→#383 60min零commit | 🔴 **连续2次验收失败→P0** |
| dispatch-375 | admin-web test 1✖ | #381派→#382 30min零commit→#383 60min零commit | 🔴 **连续2次验收失败→P0** |
| dispatch-376-P0 | storefront TSC 16✖ + admin test 84✖ + **@m5/app 21✖(新增)** | #383→#384 30min零commit | 🔴 **首次验收失败(30min零commit)→scope扩展** |

---

## 问题一: storefront-web TSC 16✖ (范围不变)

**16 errors 分类**:
- **EmptyStateProps actionLabel not exist** × 6
  - `app/member-upgrade-path/page.tsx:213`
  - `app/reports/[id]/page.tsx:139`
  - `app/reports/page.tsx:210,222`
  - `app/store-manager/page.tsx:74`
  - `app/stores/compare/page.tsx:93,105`
- **ErrorBoundary fallback type mismatch** × 5 (Element不符合函数签名)
  - `app/member-upgrade-path/page.tsx:258`
  - `app/reports/[id]/page.tsx:297`
  - `app/reports/page.tsx:253`
  - `app/store-manager/page.tsx:189`
  - `app/stores/compare/page.tsx:298`
- **TS2307: 模块不存在** × 1
  - `app/reports/[id]/page.tsx:19` — `../report-detail-client`
- **TS18048: statusInfo 可能 undefined** × 3
  - `app/reports/[id]/page.tsx:283,284,289`
- **dispatch-374-tree.md 不存在** (之前应写入的树文件缺失)

**根因**: EmptyStateProps缺少actionLabel+actionHref属性定义; ErrorBoundary组件API变更; reports-detail-client模块缺失; statusInfo非空断言缺失

## 问题三 (NEW): @m5/app test 21✖ (缓存揭露)

**force揭示真实失败** — 此前HEARTBEAT记录"222/222✅"为缓存产物

| 测试套 | 失败数 | 说明 |
|--------|--------|------|
| HomeScreen | 11✖ | renders greeting/stats/revenue/actions/navigation/tasks/announcement/order/avatar — 全部ErrorBoundary崩溃 |
| SettingsScreen | 10✖ | renders section titles/offline toggle/push notification/biometric/cache/update/about/legal/logout — 全部ErrorBoundary崩溃 |

**根因**: 与storefront问题同源 — ErrorBoundary组件`fallback`属性从`ReactNode`变更为`(args: ErrorBoundaryFallbackArgs) => ReactNode`函数签名，直接传递`<Fallback/>`作为JSX Element不满足新的类型要求

## 问题二: admin-web test ~35✖ (scope大幅扩展)

> ⚠️ 之前缓存遮罩，真实失败远多于1✖

| 测试模块 | 失败数 | 说明 |
|---------|--------|------|
| AdminAlertsPage | 10✖ | 结构+Client+防御+反例全部相关 |
| categories-data | 3✖ | categoryId/parentId/name缺失 |
| 财务字段 | 1✖ | 核心财务字段未引用 |
| 日期范围选择器 | 1✖ | 日期范围选择器缺失 |
| 合计/汇总 | 1✖ | 合计/汇总计算缺失 |
| FirePrevention | 3✖ | equipment/emergency/fire drill |
| operations-page | 1✖ | 操作的页面测试 |
| runtime-governance-panel | 1✖ | 运行时治理面板测试 |
| Safety | 3✖ | safety inspection/incident/training |
| StoresLayout | 4✖ | SidebarNav/门店选择/返回按钮/className/事件 |
| suppliers 增强 | 3✖ | empty/loading/fallback |
| suppliers 更多功能 | 3✖ | bulk selection/detail modal/audit trail |

---

## 🚨 P0 指令

**唯一限制**: 60分钟（下次脉冲#384）内关闭 — 全部须可验证通过。

### 优先级

1. **P0.1 [关键] storefront TSC 16✖** — 修复全部TS错误
2. **P0.2 [关键] admin test 84✖** — 修复全部测试失败(~16测试套)
3. **P0.3 [新增] @m5/app test 21✖** — HomeScreen(11✖)+SettingsScreen(10✖)·ErrorBoundary缓存遮罩揭露
4. **P0.4 [验证] 全force验证** — 无缓存masking

### 已知修复方案

**EmptyStateProps**: 在 `apps/storefront-web/src/components/` 下找到 `EmptyState` 组件类型定义，补充 `actionLabel?: string; actionHref?: string;`
**ErrorBoundary**: 在下方组件中找到 ErrorBoundary 使用处，将 `<Fallback>` 改为 `{() => <Fallback />}` 闭包
**TS2307**: 创建 `app/reports/[id]/report-detail-client.tsx` 或调整 import 路径
**TS18048**: 在 `reports/[id]/page.tsx` 283-289 行对 `statusInfo` 添加 `?.` 可选链或提前guard
**@m5/app tests**: 在 HomeScreen.tsx 和 SettingsScreen.tsx 中将 ErrorBoundary 中的 `<Fallback>` 改为 `{() => <Fallback />}` 闭包
**admin tests**: 检查各测试suite中的mock数据是否遗漏字段，补全categoryId/parentId/name等
