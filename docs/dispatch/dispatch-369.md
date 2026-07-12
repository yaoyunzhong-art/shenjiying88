# 🌲 dispatch-369: 缓存彻底崩塌修复 — storefront-web 97✖ + @m5/app TSC回归

> 派单时间: 2026-07-12 20:12 · 验收: pulse#369

## 📋 问题清单

### P0 — storefront-web 97✖ (4673 pass / 97 fail)
**根因**: ~10次验收脉冲缓存掩盖——缓存一直显示2~8✖，`--force`揭示真实97✖
**涉及页面**:
- `app/alerts/page.test.tsx` — 缺少 AlertsListPage 导出、preset/count/detailHrefBase/mapRecords/title/description/FoundationAlertDemoListPage/storefrontPreset
- `app/announcements/page.test.tsx` — 缺少 AnnouncementsPage 导出、Mock数据、AnnouncementItem类型、分页参数、阅读数、优先级字段
- `app/operations/page.test.tsx` — 缺少 OperationsListPage、RuntimeOperationDemoListPage、runtimeOperationListDemoPresets、全部 props
- `app/promotions/[id]/edit/page.test.ts` — Promise resolution 挂起
- `app/promotions/[id]/page.test.tsx` — 同上
- `app/promotions/new/page.test.tsx` — 同上
- `app/stocktaking/stocktaking.test.tsx` — 缺少 stocktaking-client.tsx（ENOENT）
- `app/store-manager/page.test.tsx` — 缺少 StoreManagerDashboardClient

### P1 — tob-web 4✖ (维持)
**涉及**: `__smoke__/role-based-smoke.test.ts` — 空数据兜底/错误边界/CUSTOMER_STATUSES/sports-news

### P1 — miniapp 4✖ (维持)
**涉及**: `__smoke__/role-based-smoke.test.ts` — 积分不足限制/会员等级/空任务/空客户

### P1 — @m5/app TSC TS2307 (新回归)
**文件**: `services/BiometricAuth.ts:6` — `expo-local-authentication` 模块找不到

## 🔧 修复建议

### storefront-web 97✖（优先级最高）
1. `alerts/page.tsx` — 导出 AlertsListPage 默认组件 + FoundationAlertDemoListPage + storefrontPreset
2. `announcements/page.tsx` — 导出 AnnouncementsPage + 8条Mock(4分类/3状态/3优先级) + AnnouncementItem类型
3. `operations/page.tsx` — 导出 OperationsListPage + RuntimeOperationDemoListPage + runtimeOperationListDemoPresets
4. `promotions/[id]/edit/page.test.ts` — 修复 Promise resolution hang
5. `promotions/[id]/page.test.tsx` — 修复同上
6. `promotions/new/page.test.tsx` — 修复同上
7. `stocktaking/` — 创建 stocktaking-client.tsx 或修复导入
8. `store-manager/page.test.tsx` — 导入 StoreManagerDashboardClient

### @m5/app TSC
- 安装 `expo-local-authentication` 类型声明或添加 ts-ignore

## ⏱️ 验收标准
- storefront-web: 4673✅/0❌ (97→0)
- @m5/app: TSC ✅
- tob-web: 4✖→0
- miniapp: 4✖→0
