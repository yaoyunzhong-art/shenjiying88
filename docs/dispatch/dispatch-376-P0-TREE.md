# dispatch-376-P0 修复树 (scope扩展·pulse#384)

> **限制**: 下次脉冲 #385 (04:21) 验收 — 再零commit → 连续2次→dispatch-377-P0
> **scope扩展**: 新增 @m5/app test 21✖ (缓存揭露)

## 📦 模块一: @m5/storefront-web TSC 16✖

### 1.1 EmptyStateProps actionLabel/actionHref ×6
- **文件**: `apps/storefront-web/src/components/` (找EmptyState组件定义)
- **修复**: 给EmptyStateProps接口补充 `actionLabel?: string; actionHref?: string;`
- **涉及页面**: member-upgrade-path(213), reports/[id](139), reports(210,222), store-manager(74), stores/compare(93,105)

### 1.2 ErrorBoundary fallback ×5
- **文件**: 各page.tsx中ErrorBoundary使用处
- **修复**: 将 `<FallbackComponent />` 改为 `{() => <FallbackComponent />}`
- **涉及页面**: member-upgrade-path(258), reports/[id](297), reports(253), store-manager(189), stores/compare(298)

### 1.3 TS2307 ×1
- **文件**: `apps/storefront-web/app/reports/[id]/page.tsx:19`
- **修复**: 创建 `report-detail-client.tsx` 或调整 import 路径

### 1.4 TS18048 ×3
- **文件**: `apps/storefront-web/app/reports/[id]/page.tsx:283,284,289`
- **修复**: 对 `statusInfo` 添加可选链 `?.` 或提前 guard

## 📦 模块二: @m5/admin-web test 84✖

### 2.1 AdminAlertsPage 10✖ (结构+Client+防御+反例)
### 2.2 categories-data 3✖ (categoryId/parentId/name)
### 2.3 FirePrevention/Safety 6✖
### 2.4 StoresLayout 4✖
### 2.5 suppliers 增强+更多功能 6✖
### 2.6 其他单项: 财务字段/日期范围/合计/operations/panel

## 📦 模块三 (NEW): @m5/app test 21✖

### 3.1 HomeScreen 11✖
- **文件**: `apps/expo-app/src/screens/home/HomeScreen.tsx` (或 test 定位的组件)
- **修复**: ErrorBoundary 中 `<FallbackComponent />` → `{() => <FallbackComponent />}`

### 3.2 SettingsScreen 10✖
- **文件**: `apps/expo-app/src/screens/settings/SettingsScreen.tsx`
- **修复**: ErrorBoundary 中 `<FallbackComponent />` → `{() => <FallbackComponent />}`
