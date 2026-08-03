# 限流与配额管理模块 (Rate Limits)

## 模块概述

限流与配额管理模块提供 API 限流策略和配额账本的可视化管控界面。支持 `healthy` / `warning` / `blocked` 三态分桶、策略详情、配额账本详情查看，以及多维查询筛选。模块对接后端 `loadRateLimitWorkspace` ViewModel，支持真实 API 和 fallback 两种交付模式。

## 主要功能

| 功能 | 描述 |
|------|------|
| **工作台总览** | 策略/账本/封禁账本/高消耗账本四维统计卡片概览 |
| **策略管理** | 查看限流策略列表（Code、作用域、周期、限额、算法、更新时间） |
| **配额账本** | 查看按主题/策略分组的配额账本，支持 healthy/warning/blocked 三态筛选 |
| **策略详情** | 策略 Code、作用域、周期、限额、算法、状态、维度键、关联账本 |
| **账本详情** | 主题 Key、已用/上限、占比、状态、重置时间、关联策略 |
| **多维搜索** | 按租户 ID / 策略 Code / 主题 Key / 状态条件组合查询 |
| **数据溯源** | 页面显式展示 `deliveryMode`、控制面来源、业务数据来源、查询条件 |

## 目录结构

```
rate-limits/
├── README.md                              # 本文件
├── page.tsx                               # 工作台入口 (Server Component, force-dynamic)
├── rate-limits-workspace-client.tsx       # 工作台客户端组件 (含 Tabs、DataTable、搜索、筛选)
├── page.test.tsx                          # 工作台 E2E 测试
├── page.test.ts                           # 工作台单元测试
├── rate-limits-workspace-client.test.ts   # 工作台客户端单元测试
├── loading.tsx                            # 工作台加载骨架 (Suspense fallback)
├── error.tsx                              # 工作台错误边界
├── not-found.tsx                          # 工作台 404 边界
├── ledgers/
│   └── [ledger]/
│       ├── page.tsx                       # 配额账本详情页 (Server Component)
│       ├── rate-limits-ledger-detail-client.tsx  # 账本详情客户端组件
│       ├── page.test.tsx                  # 账本详情 E2E 测试
│       ├── page.test.ts                   # 账本详情单元测试
│       └── loading.tsx                    # 账本详情加载骨架
└── policies/
    └── [policy]/
        ├── page.tsx                       # 限流策略详情页 (Client Component, mock)
        ├── rate-limits-policy-detail-client.tsx  # 策略详情客户端组件
        ├── page.test.tsx                  # 策略详情 E2E 测试
        ├── page.test.ts                   # 策略详情单元测试
        └── loading.tsx                    # 策略详情加载骨架
```

## API 接口概要

### 数据层函数 (`rate-limits-view-model.ts`)

| 函数 | 签名 | 说明 |
|------|------|------|
| `loadRateLimitWorkspace` | `(query, options?) => Promise<RateLimitSnapshotDelivery>` | 加载限流工作台数据，支持 API / fallback 双模式 |
| `isLedgerBlocked` | `(ledger: QuotaLedgerRecord) => boolean` | 判断账本是否封禁（按 blockedUntil 判断） |
| `ledgerConsumptionRatio` | `(ledger: QuotaLedgerRecord) => number` | 计算账本消耗比例 |
| `isPolicyActive` | `(policy: RateLimitPolicyRecord) => boolean` | 判断策略是否活跃（按 limit > 0） |
| `summarizePolicy` | `(policy) => string` | 策略摘要文字 |
| `summarizeLedger` | `(ledger) => string` | 账本摘要文字 |

### 数据流

```
RateLimitsPage (Server, force-dynamic)
  ├─ searchParams 解析: tenantId / policyCode / subjectKey / status
  └─ Suspense + ErrorBoundary 包裹
      └─ RateLimitsContent (Server)
           └─ loadRateLimitWorkspace(query, { cache: 'no-store' })
                └─ RateLimitsWorkspaceClient (Client, 3-tab 视图)

Ledger Detail:
  page.tsx → loadMockLedger(id) → rate-limits-ledger-detail-client.tsx

Policy Detail:
  page.tsx → loadMockPolicy(id) → rate-limits-policy-detail-client.tsx
```

### 查询参数

`/rate-limits?tenantId=xxx&policyCode=xxx&subjectKey=xxx&status=healthy`

| 参数 | 类型 | 说明 |
|------|------|------|
| `tenantId` | `string` | 租户 ID 筛选 |
| `policyCode` | `string` | 策略 Code 筛选 |
| `subjectKey` | `string` | 主题 Key 筛选 |
| `status` | `'ALL' \| 'healthy' \| 'warning' \| 'blocked'` | 账本三态筛选 |

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `@m5/ui` | `DataTable`, `Tabs`, `StatusBadge`, `SearchFilterInput`, `PageShell`, `ErrorBoundary`, `WorkspaceBreadcrumb`, `DetailActionBar`, `DetailClosureBar` 等 |
| `@m5/types` | `RateLimitWorkspace`, `QuotaLedgerRecord`, `RateLimitPolicyRecord` 等类型及路由辅助函数 |
| `@m5/sdk` | `ApiClient` API 请求客户端 |
| `../rate-limits-view-model` | ViewModel 层数据加载与工具函数 |
| `../components/admin-permission-gate` | 权限管控组件，要求 `foundation.governance.read` 权限 |
| `../components/use-detail-actions` | 详情页通用操作 hooks |
| `../components/detail-workspace-registry` | 工作区面包屑注册表 |

## 使用指引

### 开发启动

```bash
pnpm --filter @m5/admin-web dev
```

### 访问地址

- 工作台总览: `/rate-limits`
- 策略详情: `/rate-limits/policies/[policyCode]`
- 账本详情: `/rate-limits/ledgers/[ledgerId]`

### 权限

模块要求 `foundation.governance.read` 权限。未授权时显示权限受限提示卡片。

### Mock 数据说明

- **工作台**: 通过 `loadRateLimitWorkspace` 的 `deliveryMode` 区分 API / fallback
- **策略详情**: 预置 `KNOWN_POLICIES` — `READ_QPS_100`, `WRITE_QPS_50`, `CAMPAIGN_TRIGGER_1000`, `BURST_5000`
- **账本详情**: 预置 `KNOWN_LEDGERS` — `ledger-demo-001`, `ledger-demo-002`, `ledger-demo-003`

### 测试

```bash
# 工作台
pnpm --filter @m5/admin-web test -- --testPathPattern 'rate-limits/page'
pnpm --filter @m5/admin-web test -- --testPathPattern 'rate-limits/rate-limits-workspace-client'

# 策略详情
pnpm --filter @m5/admin-web test -- --testPathPattern 'rate-limits/policies'

# 账本详情
pnpm --filter @m5/admin-web test -- --testPathPattern 'rate-limits/ledgers'
```
