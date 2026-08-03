# 📊 财务看板模块 — Finance Dashboard (tob-web)

## 模块定位

TOB（品牌端）财务看板模块为品牌运营团队提供 **多门店损益汇总与分账日志追踪**。模块以三个 Tab 视图组织数据：门店损益、品牌损益、分账日志，覆盖从单店盈利分析到品牌级损益汇总再到资金分账全链路。

> 角色视角：🏢 品牌运营 / 财务对账人员

## 核心功能

| Tab | 功能 | 说明 |
|---|---|---|
| 🏪 **门店损益** | 单店损益卡片 | 展示每家门店的营收/成本/毛利/毛利率/营业利润/利润率 |
| 🏢 **品牌损益** | 品牌级损益汇总 | 品牌总收入/成本/毛利/内部往来抵销/品牌净收入 + 各门店明细表 |
| 📋 **分账日志** | 分账流水追踪 | 展示每笔交易的分账记录，支持按状态过滤，含时间线追踪 |

## 路由结构

```
app/finance-dashboard/
├── page.tsx                         # 财务看板主页面（'use client'）
├── page.test.ts                     # L1 源码分析测试
├── finance-dashboard-data.ts        # 类型定义、常量、Mock 数据、辅助函数
└── finance-dashboard-service.ts     # API 服务层（请求发起 + fallback 到 Mock）
```

访问路径: `/finance-dashboard`

## 主要组件/页面

### FinanceDashboardPage (page.tsx)

财务看板核心页面，包含三个 Tab 视图：

#### Tab 1: 门店损益 (`store-pandl`)

| 特性 | 说明 |
|---|---|
| 期间选择器 | `<select>` 下拉（2026-06 / 2026-05 / 2026-04） |
| 门店卡片 | auto-fill grid 布局，每张卡片展示门店在选定期间的 P&L 指标 |
| 指标 | 营收 / 成本 / 毛利 / 毛利率 / 营业利润 / 利润率 |

#### Tab 2: 品牌损益 (`brand-pandl`)

| 特性 | 说明 |
|---|---|
| 品牌汇总区 | 渐变背景卡片，展示品牌级损益汇总 |
| 门店明细表 | 全行表格，包含每家店的营收/成本/毛利/毛利率/营业利润/利润率 |
| 合计行 | 蓝色高亮行，展示合计值（含内部往来抵销后的品牌净收入计算） |
| 指标 | 营收合计 / 成本合计 / 毛利合计 / 内部往来抵销 / 品牌净收入 |

#### Tab 3: 分账日志 (`transaction-logs`)

| 特性 | 说明 |
|---|---|
| 状态过滤器 | 全部 / 待分账 / 已分账 / 已划转 / 已完成 / 失败 |
| 日志卡片 | 每条日志展示交易号、账户信息、金额、分账比例、备注 |
| 时间线 | 创建时间 → 如果已更新则显示更新时间 |
| 状态标签 | 颜色编码（pending: 黄 / split: 蓝 / transferred: 紫 / completed: 绿 / failed: 红） |

### 内部子组件

- `MetricCard({ label, value, color, large? })` — 通用财务指标卡片
- 分账状态标签 — 内联背景色标签

### Loading 态

每个 Tab 切换或数据加载时，页面通过 `loading` 状态显示 "加载中..." 提示，置于 Tab 内容下方。

## 数据模型

### StorePAndL — 门店损益

| 字段 | 类型 | 说明 |
|---|---|---|
| storeId | string | 门店 ID |
| storeName | string | 门店名称 |
| period | string | 统计期间 (YYYY-MM) |
| revenue | number | 营收 |
| costOfGoods | number | 成本 |
| grossProfit | number | 毛利 |
| grossMargin | number | 毛利率 (0~1) |
| operatingExpenses | number | 营业费用 |
| operatingProfit | number | 营业利润 |
| operatingMargin | number | 利润率 (0~1) |

### BrandPAndL — 品牌损益

| 字段 | 类型 | 说明 |
|---|---|---|
| brandId | string | 品牌 ID |
| brandName | string | 品牌名称 |
| stores | StorePAndL[] | 旗下门店损益列表 |
| totalRevenue / totalCostOfGoods / totalGrossProfit | number | 合计 |
| internalTransaction_elimination | number | 内部往来抵销 |
| brandNetRevenue | number | 品牌净收入 |

### AccountTransactionLog — 分账日志

| 字段 | 类型 | 说明 |
|---|---|---|
| logId / transactionId | string | 日志 ID / 交易 ID |
| accountName | string | 账户名称 |
| accountType | `'brand' \| 'store' \| 'supplier' \| 'platform'` | 账户类型 |
| amount | number | 分账金额 |
| status | `TransactionStatus` | 分账状态 |
| splitRatio | number | 分账比例 (0~1) |
| remarks | string | 备注 |
| createdAt / updatedAt | string | 创建/更新时间 |

### 分账状态

| 状态 | label | 颜色 |
|---|---|---|
| `pending` | 待分账 | 🟡 `#f59e0b` |
| `split` | 已分账 | 🔵 `#3b82f6` |
| `transferred` | 已划转 | 🟣 `#8b5cf6` |
| `completed` | 已完成 | 🟢 `#22c55e` |
| `failed` | 失败 | 🔴 `#ef4444` |

### 账户类型

| 类型 | label |
|---|---|
| `brand` | 品牌账户 |
| `store` | 门店账户 |
| `supplier` | 供应商 |
| `platform` | 平台 |

## 数据流

```
FinanceDashboardPage
  │
  ├─ activeTab → 三选一渲染
  │
  ├─ [门店损益 / 品牌损益 / 分账日志]
  │     │
  │     └─ useEffect(selectedPeriod) → loadData()
  │           │
  │           ├─ getAllStorePAndL({ year, month })
  │           │    └─ GET /api/finance/store-pandl?period=YYYY-MM
  │           │
  │           ├─ getBrandPAndL(brandId, { year, month })
  │           │    └─ GET /api/finance/brand-pandl/{brandId}?period=YYYY-MM
  │           │
  │           └─ getTransactionLogs(filter?)
  │                └─ GET /api/finance/transaction-logs?status=...
  │
  ├─ [分账日志] useEffect(statusFilter) → 再次 loadData()
  │
  └─ 所有 API 有 catch fallback → 返回 MOCK 数据
```

### 服务层架构

`finance-dashboard-service.ts` 提供简洁的 catch-fallback 模式：

1. 优先请求真实 API（带 `x-tenant-id` 请求头）
2. API 异常时降级到 `finance-dashboard-data.ts` 中的 MOCK 数据
3. 辅助函数 `formatPeriodDisplay("2026-06") → "2026年6月"`

## 依赖的外部模块

| 来源 | 导出 |
|---|---|
| `@m5/ui` | `PageShell` — 页面外壳组件 |
| `./finance-dashboard-data` | 所有类型定义、常量、Mock 数据、辅助格式化函数 (`formatCurrency`, `formatPercent`, `formatDate`, `getAccountTypeLabel`) |
| `./finance-dashboard-service` | API 请求函数 + 降级回退逻辑 |

## 常用 API

| API | 方法 | 参数 | 说明 |
|---|---|---|---|
| `/api/finance/store-pandl?period={YYYY-MM}` | GET | `period` | 批量查询门店损益 |
| `/api/finance/store-pandl/{storeId}?period={YYYY-MM}` | GET | `storeId`, `period` | 单店损益 |
| `/api/finance/brand-pandl/{brandId}?period={YYYY-MM}` | GET | `brandId`, `period` | 品牌损益汇总 |
| `/api/finance/compare?stores={ids}&period={YYYY-MM}` | GET | `stores`, `period` | 多门店对比 |
| `/api/finance/transaction-logs?status={status}` | GET | `status`, `accountType`, `startDate`, `endDate` | 分账日志查询 |
| `/api/finance/transaction-logs/{txId}` | GET | `txId` | 单笔分账详情 |

所有 API 需携带请求头: `x-tenant-id: demo-tenant`

## 权限要求

- 品牌运营 / 财务管理者可查看
- 数据自动限定在 `demo-tenant` 租户内（当前硬编码 `TENANT = 'demo-tenant'`）

## 注意事项

1. **Mock 数据当前默认生效** — 服务层虽优先请求 API，但当前 `fetch` 预期会失败并回退到 `MOCK_STORE_PANDL` / `MOCK_BRAND_PANDL` / `MOCK_TRANSACTION_LOGS`，实际上线需确认 API 正常
2. **品牌 ID 硬编码** — `getBrandPAndL('BRAND001', ...)` 固定品牌 ID，多品牌场景需扩展
3. **期间选择器硬编码** — 当前只有 3 个固定的月份选项，需后端提供期间列表 API
4. **每次 Tab 切换发起请求** — 注意频繁切换 Tab 可能导致冗余请求
5. **分账日志状态过滤** — 当切换到 "transaction-logs" Tab 或改变状态过滤时，组件会重新触发 `loadData()` 请求
6. **分账比例与账户类型** — 分账日志中的 `splitRatio` 表示分账比例（如 0.30 = 30%），`accountType` 区分品牌/门店/供应商/平台四个账户维度
7. **内部往来抵销** — 品牌损益中的 `internalTransaction_elimination` 是品牌级汇总时门店间内部交易的抵销金额，不计入品牌净收入
