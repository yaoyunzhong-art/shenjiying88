# 💰 财务管理模块 — Finance (storefront-web)

## 模块定位

店务前端财务管理模块为门店店长/财务主管提供 **真实收支流水展示与财务总览**。模块打通后端 `finance/revenue/summary` 与 `finance/ledgers` 数据管道，支持按时间范围筛选、按收支类型过滤、关键词搜索流水，并通过可视化柱状图展示近 6 个月营收趋势。

> 角色视角：👔 店长 / 财务主管

## 核心功能

| 功能 | 说明 |
|---|---|
| 💰 **营收总览卡片** | 总营收、总退款、总支出、净收入、流水笔数，附环比增长率 |
| 📋 **真实财务流水** | 展示完整 ledger 记录（入账时间、类型、分类、金额、描述、状态、订单号、交易号） |
| 🔍 **多条件筛选** | 按类型（全部/收入/退款/支出/调整）过滤 + 关键词搜索 |
| 📅 **时间范围切换** | 近 7 天 / 近 30 天 / 近 6 个月 |
| 📈 **营收趋势图** | 近 6 个月逐月营收/支出/退款条形图（高度自适应） |
| 🔄 **手动刷新** | 一键重新拉取最新财务数据 |

## 路由结构

```
app/finance/
├── page.tsx       # 财务主页面（'use client'）
├── loading.tsx    # 页面级 Suspense 加载占位
├── page.test.ts   # L1 源码分析测试
└── page.vitest.tsx# L1 集成测试 (Vitest)
```

访问路径: `/finance`

## 主要组件/页面

### FinancePage (page.tsx)

财务管理核心页面，全部逻辑内聚于单个 `'use client'` 组件内：

| 特性 | 实现方式 |
|---|---|
| 数据加载 | `useEffect` + `loadStorefrontFinanceDashboard(dateRange, scope)` |
| 状态管理 | `useState` 管理 `dashboard`, `loading`, `error`, `search`, `typeFilter`, `dateRange` |
| 搜索过滤 | `useMemo` 对 `dashboard.records` 按关键词 + 类型过滤 |
| 趋势计算 | `useMemo` 计算 `trendMaxRevenue` 以动态归一化柱状图高度 |

**渲染逻辑：**

1. **loading 态** — 半透明暗色背景，居中 "正在加载真实财务数据..."
2. **error 态** — 错误信息展示 + "重新加载" 按钮
3. **空数据态** — "暂无真实财务流水" 提示 + 刷新按钮
4. **正常态** — 完整的仪表盘：

   - **概览卡片区** — 4-5 张 `FinanceOverviewCard`（grid 自适应布局）
   - **营收趋势图** — 逐月柱状图，颜色按净收入正负区分（蓝/红），展示金额和笔数
   - **真实财务流水表** — 含类型标签、状态标签、金额着色（绿色=正/红色=负）、分类、描述、订单号/交易号
   - **分页** — 实际为全量列表，底部分页信息显示总条数

### Loading (loading.tsx)

Streaming SSR Suspense 边界组件，展示脉冲动画骨架屏。

## 输入/输出数据模型

| 类型 | 来源 | 说明 |
|---|---|---|
| `StorefrontFinanceDashboard` | `storefront-finance.ts` | Dashboard 聚合数据：summary + records + trend + overviewCards |
| `StorefrontRevenueSummary` | `@m5/sdk` | 营收汇总（totalRevenue / totalRefund / totalExpense / netRevenue / transactionCount） |
| `FinanceRecordViewModel` | 内部模型 | 流水记录视图模型，由 `mapLedgerToFinanceRecord` 从 ledger 转换 |
| `FinanceTrendPoint` | 内部模型 | 趋势点（month / revenue / expense / refund / netRevenue / transactionCount） |
| `FinanceOverviewCard` | 内部模型 | 概览卡片（label / value / color / hint） |

### 财务记录类型

| 类型 | key | 颜色 |
|---|---|---|
| 收入 | `income` | 🟢 `#34d399` |
| 支出 | `expense` | 🔴 `#f87171` |
| 退款 | `refund` | 🟡 `#fbbf24` |
| 调整 | `adjustment` | 🔵 `#60a5fa` |

### 时间范围

| 范围 | key | 起始 offset | API 参数 |
|---|---|---|---|
| 近 7 天 | `week` | 6 天前 | `startDate`/`endDate` |
| 近 30 天 | `month` | 29 天前 | `startDate`/`endDate` |
| 近 6 个月 | `all` | 5 个月前 1 号 | `startDate`/`endDate` |

## 数据流

```
User Action
  │
  ├─ 选择时间范围 → setDateRange → useEffect → loadDashboard()
  ├─ 切换类型过滤 → setTypeFilter → useMemo 重新过滤 records
  ├─ 输入关键词   → setSearchTerm → useMemo 重新过滤 records
  └─ 点击刷新按钮 → loadDashboard()
       │
       ▼
  loadStorefrontFinanceDashboard(range, scope)
       │
       ├─ getStorefrontRevenueSummary(range, scope)
       │    └─ client.finance.getRevenueSummary({ storeId, startDate, endDate })
       │
       └─ listStorefrontLedgerRecords(range, scope)
            └─ client.finance.listLedgers({ storeId, recordedAfter, recordedBefore, limit })
                │
                ▼
          mapLedgerToFinanceRecord → FinanceRecordViewModel[]
          buildFinanceTrend        → FinanceTrendPoint[]
          buildFinanceOverviewCards→ FinanceOverviewCard[]
                │
                ▼
          StorefrontFinanceDashboard → 页面渲染
```

## 依赖的外部模块

| 来源 | 导出 |
|---|---|
| `../../lib/storefront-finance` | `loadStorefrontFinanceDashboard`, `getFinanceRangeLabel`, `getFinanceTypeColor`, `getFinanceTypeLabel`, 类型定义 |
| `../../lib/storefront-transactions` | `resolveStorefrontScope` — 解析门店作用域（含 tenant 与 storeId） |
| `@m5/sdk` | `createBusinessClient`, `getDefaultApiBaseUrl`, `BusinessFinanceLedgerRecord`, `BusinessRevenueSummary` |

## 常用 API

| API | 路径 | 方法 | 说明 |
|---|---|---|---|
| 营收汇总 | `/api/finance/revenue/summary` | GET | 查询门店营收汇总（需传 storeId + 时间范围） |
| 流水列表 | `/api/finance/ledgers` | GET | 查询门店 ledger 交易记录（支持分页、时间范围） |

由 `@m5/sdk` 提供的 `createBusinessClient` 自动组装完整路径，无需手动拼接 URL。

### 请求头

客户端自动通过 `buildStorefrontScopeHeaders(resolvedScope)` 注入：

| Header | 值 |
|---|---|
| `x-tenant-id` | 当前租户 ID |
| `x-store-id` | 当前门店 ID |

## 权限要求

- 门店管理员 / 财务主管角色可查看
- 数据仅展示自己门店 scope 范围内的财务记录（通过 `resolveStorefrontScope` 控制）

## 注意事项

1. **Mock 数据** — 当前通过 `@m5/sdk` 的 `createBusinessClient` 连接到后端真实 API，若后端不可用会抛出错误并被 error 态捕获，提供重试按钮
2. **无分页** — 当前全量流水一次性加载（limit 200），大数据量下需考虑后端分页
3. **过滤计算在内存中** — 类型过滤和关键词搜索在前端 `useMemo` 中完成，不对后端发起新请求
4. **趋势图依赖实际数据** — 如果没有某个月的 ledger 记录，该月柱状图显示为 0
5. **环比计算** — `monthGrowth` 使用倒数第二个月作为环比基准期，如果仅有 1 个月数据则不显示环比
