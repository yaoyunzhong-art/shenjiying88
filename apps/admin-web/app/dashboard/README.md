# 概览仪表盘 Dashboard

门店运营核心首页看板，提供关键指标卡片、营收趋势、设备状态、今日待办、实时客流与预警摘要等概览信息，支持总览/运营/财务/增长四视图切换。

## 核心功能

- **关键指标卡片** — 今日营收、订单数、设备在线率、客流、待处理告警、完成率等核心 KPI 一览
- **营收趋势图** — 过去 7 天营收与订单量趋势可视化
- **设备运行状态** — 设备在线/离线状态列表，快速定位异常设备
- **今日待办** — 按优先级（高/中/低）排列的待办事项清单，标注截止时间
- **实时客流** — 当前在店客户数及人均停留时长
- **预警摘要** — 待处理告警聚合展示，支持跳转详情
- **多视图切换** — 总览/运营/财务/增长四套 Tab，每套视图按权限控制可见性
- **权限守卫** — `dashboard:read` 权限门禁，视图级细粒度鉴权

## 技术栈

- **Next.js App Router** — Server Component 加载快照 + Client Component 交互
- **React 19** — `useState` / `useEffect` / `useMemo` 管理状态与权限
- **TypeScript** — 全类型安全，导出 `DashboardStats` / `DashboardView` 等类型
- **@m5/ui** — `Card`、`StatusBadge`、`DataTable`、`Tabs` 等通用组件
- **admin-permission-gate** — 页面级与视图级权限守卫组件
- **admin-session** — 本地管理员会话缓存与权限判断

## 文件结构

```
dashboard/
├── README.md                # 本文件
├── page.tsx                 # 服务端页面入口，加载仪表盘统计快照
├── dashboard-client.tsx     # 客户端组件：趋势图、待办、设备状态、视图切换
├── dashboard-data.ts        # 数据层：DashboardStats 类型定义与本地统计样本
├── loading.tsx              # 加载骨架屏
├── error.tsx                # 错误边界 UI
├── not-found.tsx            # 404 页面
└── page.test.tsx            # 组件测试
```

## 如何使用

### 页面路由

`/dashboard` — 管理员首页，需要 `dashboard:read` 权限。

### 数据模式

当前使用本地统计样本数据（`deliveryMode: 'mock'`），数据定义在 `dashboard-data.ts` 的 `loadDashboardStats()` 函数中。如需对接真实后台：

1. 替换 `loadDashboardStats()` 为真实 API 调用
2. 在 `dashboard-data.ts` 中扩展 `DashboardSnapshotDelivery` 支持 `api` 模式
3. 顶部证据面板会自动更新来源信息

### 多视图权限

| 视图 | 所需权限 | 内容 |
|------|---------|------|
| 总览 | `dashboard:read` | 核心指标 + 趋势 |
| 运营 | `dashboard:operations:read` | 运营明细 |
| 财务 | `finance:read` | 财务数据 |
| 增长 | `dashboard:growth:read` | 增长分析 |

权限配置在 `dashboard-client.tsx` 的 `VIEW_PERMISSIONS` 常量中，与 `admin-session` 配合生效。
