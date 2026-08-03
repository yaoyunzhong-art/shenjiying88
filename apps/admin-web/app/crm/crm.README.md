# CRM 客户关系管理模块 (crm)

## 模块概述

CRM (Customer Relationship Management) 模块为 admin-web 提供门店视角的客户关系管理功能，涵盖客户列表查看、多维搜索筛选、客户活跃度评分、交互记录溯源、工单追踪等核心场景。模块基于 **Next.js App Router** 架构，采用 Server Component + Client Component 分离模式，支持 API/fallback 双模式数据交付。

## 主要功能

| 功能 | 描述 |
|------|------|
| **客户列表** | 查看全部客户档案，含姓名、邮箱、手机号、活跃评分、状态、标签和最近交互时间 |
| **多维筛选** | 支持按搜索关键词（姓名/手机号/邮箱）、客户状态（活跃/沉默/流失/潜在）、评分区间组合筛选 |
| **统计概览** | 顶部分数卡片展示总客户数、活跃客户数、平均评分、未处理工单数 |
| **客户详情** | 点击行弹出 Dialog，查看基础信息、活跃评分环、客户标签、备注、交互记录、工单明细 |
| **快照刷新** | 通过 Server Action 刷新 CRM 服务端快照，避免 stale 数据 |
| **数据溯源** | 页面顶部显式暴露 `deliveryMode`、`controlPlaneSource`、`generatedAt` 等来源元信息 |

## 目录结构

```
crm/
├── crm.README.md          # 本文件
├── page.tsx               # 列表页入口 (Server Component, force-dynamic)
├── crm-client.tsx         # 列表客户端组件 (含 DataTable, 搜索筛选, 分页, 详情弹窗)
├── crm-data.ts            # 数据层：类型定义、状态映射、mock 数据、API 调用封装
├── page.test.tsx          # E2E 测试
├── page.test.ts           # 单元测试
├── loading.tsx            # 列表页加载骨架
├── error.tsx              # 错误边界
└── not-found.tsx          # 404 页面
```

## 核心数据模型

### CustomerProfile

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 客户 ID |
| `name` | `string` | 客户姓名 |
| `email` | `string` | 邮箱 |
| `phone` | `string` | 手机号 |
| `status` | `CrmCustomerStatus` | `active` / `inactive` / `churned` / `lead` |
| `engagementScore` | `number` | 活跃度评分 0-100 |
| `totalSpentCents` | `number` | 累计消费（分） |
| `visitCount` | `number` | 到店次数 |
| `lastVisitAt` | `string` | 最近到店时间 |
| `tags` | `string[]` | 客户标签 |
| `notes` | `CrmNote[]` | 备注记录 |
| `interactions` | `CrmInteraction[]` | 交互记录 |
| `tickets` | `Ticket[]` | 工单记录 |

### 状态流转

```
  ┌────────┐   沉默   ┌──────────┐
  │ Lead   │ ─────→ │  Active  │
  └────────┘         └──────────┘
                          │
                    ┌─────┴─────┐
                    ▼           ▼
               ┌────────┐ ┌──────────┐
               │Inactive│ │ Churned  │
               └────────┘ └──────────┘
```

### 交互类型说明

| 类型 | 含义 |
|------|------|
| `call` | 电话沟通 |
| `email` | 邮件往来 |
| `chat` | 在线聊天 |
| `visit` | 到店拜访 |
| `ticket` | 工单关联 |
| `other` | 其他 |

### 工单状态

| 状态 | 含义 |
|------|------|
| `open` | 待处理 |
| `in_progress` | 处理中 |
| `resolved` | 已解决 |
| `closed` | 已关闭 |

## 数据流

```
CrmPage (Server Component, force-dynamic)
  └─ AdministrationPermissionGate (requiredPermission: crm:read)
  └─ loadCrmSnapshot() → CrmSnapshotDelivery
       ├─ deliveryMode: 'api' | 'fallback'
       ├─ customers: CustomerProfile[]
       ├─ stats: CrmStats
       └─ generatedAt: string
  └─ CrmClient (Client Component)
       ├─ 搜索/状态/评分区间筛选 (纯客户端)
       ├─ 分页 (每页 10 条)
       ├─ 行点击 → DetailDialog (客户详情弹窗)
       └─ "刷新" → router.refresh()
```

### API 调用链路

`loadCrmSnapshot()` 优先尝试并行请求：
- `GET /api/crm/customers` → 客户列表
- `GET /api/crm/stats` → 统计数据

若 API 不可达，自动回退到 `MOCK_CRM_CUSTOMERS` / `MOCK_CRM_STATS` 本地样本。

API base URL 从以下环境变量依次解析：`M5_API_BASE_URL` → `NEXT_PUBLIC_M5_API_BASE_URL` → `NEXT_PUBLIC_API_URL`，默认 `http://localhost:3001`。

API 响应支持标准 `{ success, data }` 包裹格式或裸数据格式，`unwrapApiPayload` 自动适配。

## 数据层函数 (`crm-data.ts`)

| 函数 | 签名 | 说明 |
|------|------|------|
| `loadCrmSnapshot` | `() => Promise<CrmSnapshotDelivery>` | 加载 CRM 快照，优先调用 API，失败回退 mock |
| `formatCents` | `(n: number) => string` | 格式化金额显示（¥K / ¥万 单位） |
| `formatDate` | `(dateStr: string) => string` | 格式化显示日期 |
| `formatDateTime` | `(dateStr: string) => string` | 格式化显示日期时间 |
| `getScoreLevel` | `(score: number) => { label, color }` | 根据评分返回等级描述和颜色 |

## 客户端筛选逻辑 (`crm-client.tsx`)

| 函数 | 签名 | 说明 |
|------|------|------|
| `filterCustomers` | `(items, search, statusFilter, minScore, maxScore) => CustomerProfile[]` | 按关键词、状态、评分区间筛选 |

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `@m5/ui` | `Badge`, `DataTable`, `Dialog`, `StatCard`, `DataTableColumn` 等 UI 组件 |
| `next/navigation` | `useRouter` 路由刷新 |
| `react` | 客户端状态管理 (`useState`, `useMemo`, `useCallback`, `useTransition`) |
| **AdminPermissionGate** | 权限管控，需要 `crm:read` 权限 |

## 权限节点

| 页面 | 权限 | 说明 |
|------|------|------|
| 列表页 (`/crm`) | `crm:read` | 查看 CRM 客户管理页面 |

未授权时显示权限受限提示卡片。

## 使用指引

### 开发启动

```bash
pnpm --filter @m5/admin-web dev
```

### 访问地址

- CRM 客户管理: `/crm`

### 数据对接

当前优先使用 API 数据，失败回退到 mock。对接真实后端时：
1. 确保后端实现 `GET /api/crm/customers` 和 `GET /api/crm/stats` 端点
2. 通过环境变量配置 API base URL
3. `MOCK_CRM_CUSTOMERS` / `MOCK_CRM_STATS` 作为 fallback 保留

### 测试

```bash
pnpm --filter @m5/admin-web test -- --testPathPattern 'crm/'
```

## 维护者

- **维护者:** Admin Web 前端团队
- **最后修改:** 2026-07-27

## 交叉引用

- [AdminPermissionGate](../components/admin-permission-gate.tsx) — 权限栅栏组件
