# 订单管理 Orders

订单中心模块，提供订单列表展示、多维度搜索筛选、状态流转操作与渠道分析等功能，支持 API 实时模式与本地回退模式。

## 核心功能

- **订单列表** — 表格展示订单号、客户信息、渠道、状态、金额、门店等字段
- **多维搜索** — 按订单号、客户名、手机号关键字搜索
- **筛选过滤** — FilterChips 快速过滤与组合筛选
- **排序** — 支持按订单号、金额、创建时间等字段排序
- **状态流转** — 待确认 → 已确认 → 处理中 → 已发货 → 已签收（以及取消/退款）
- **渠道分析** — 线上 / 线下 / 小程序 / 电话 渠道统计与分布
- **金额分级** — 按金额区间用颜色区分（≥¥300 绿色、≥¥100 黄色、<¥100 灰色）
- **权限守卫** — `order:read` 权限门禁
- **分页** — 结合 `usePagination` 提供完整分页能力
- **来源证据** — 页面顶部显式标记数据交付模式、控制面来源与业务数据来源

## 技术栈

- **Next.js App Router** — Server Component 加载快照 + Client Component 交互
- **React 19** — `useCallback` / `useMemo` / `useTransition` / `useState`
- **TypeScript** — 全类型安全，导出 `OrderStatus` / `OrderChannel` / `OrderItem` 等类型与枚举
- **@m5/ui** — `DataTable`、`FilterChips`、`Pagination`、`SearchFilterInput`、`StatusBadge`、`Tabs` 等
- **admin-permission-gate** — 权限守卫组件
- **common data layer** — `apps/admin-web/app/orders-data.ts` 共享数据层

## 文件结构

```
orders/
├── README.md
├── [id]/                   # 订单详情动态路由
│   └── page.tsx
├── page.tsx                # 服务端页面入口，加载订单快照
├── orders-client.tsx       # 客户端组件：列表、搜索、筛选、状态操作、渠道分析
├── loading.tsx             # 加载骨架屏
├── error.tsx               # 错误边界 UI
├── not-found.tsx           # 404 页面
├── page.test.ts            # 数据层测试
└── page.test.tsx           # 组件测试
```

共享数据层位于 `apps/admin-web/app/orders-data.ts`，定义 `OrderStatus`、`OrderChannel` 枚举及各状态映射。

## 如何使用

### 页面路由

`/orders` — 订单列表页，需要 `order:read` 权限。
`/orders/[id]` — 订单详情页。

### 数据模式

页面支持两种交付模式（由 `loadOrdersSnapshot()` 控制）：

| 模式 | 说明 |
|------|------|
| `api` | 通过 `transactions?type=order` API 获取真实订单数据 |
| `fallback` | 使用本地 `MOCK_ORDERS` 样本数据（开发/演示） |

### 状态操作

每个订单行根据当前状态显示对应的操作按钮（如"确认"、"发货"、"签收"、"退款"），点击后触发状态流转。流转路径定义在 `ORDER_STATUS_FLOW`。

### 渠道统计

顶部渠道分析区域按线上/线下/小程序/电话展示订单分布，使用 `Tabs` 组件切换全量/各渠道视图。
