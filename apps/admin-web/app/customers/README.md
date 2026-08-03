# 客户管理模块 (Customers)

## 模块概述

客户管理模块为 admin-web 提供门店视角的客户管理功能，涵盖客户列表查看、客户信息搜索筛选、新建客户等核心场景。模块基于 **Next.js App Router** 架构，采用 Server Component + Client Component 分离模式。

## 主要功能

| 功能 | 描述 |
|------|------|
| **客户列表** | 查看全部客户记录，含姓名、手机号、会员等级、状态、消费数据等字段 |
| **多维筛选** | 支持按搜索关键词（姓名/手机号/城市）、客户状态、会员等级组合筛选 |
| **统计概览** | 顶部 StatCard 展示总客户数、活跃客户数、累计消费、钻石会员统计 |
| **快照刷新** | 通过 Server Action 刷新客户快照，避免 stale 数据 |
| **新建客户** | `/customers/new` 子路由提供完整的客户信息录入表单，含字段验证 |
| **数据溯源** | 页面显式暴露 `deliveryMode`、`sourceLabel`、`refreshPath` 等来源元信息 |

## 目录结构

```
customers/
├── README.md                 # 本文件
├── page.tsx                  # 列表页入口 (Server Component, force-dynamic)
├── customers-client.tsx      # 列表客户端组件 (含 DataTable、搜索筛选、分页)
├── customers-data.ts         # 数据层：类型定义、mock 数据、筛选/统计工具函数
├── new/
│   ├── page.tsx              # 新建客户表单页 (Client Component)
│   ├── page.test.tsx         # 表单 E2E 测试
│   ├── page.test.ts          # 表单单元测试
│   └── loading.tsx           # 新建页加载骨架
├── loading.tsx               # 列表页加载骨架
├── error.tsx                 # 列表页错误边界
├── not-found.tsx             # 列表页 404 边界
├── page.test.tsx             # 列表页 E2E 测试
└── page.test.ts              # 列表页单元测试
```

## API 接口概要

当前模块使用本地 mock 数据（`MOCK_CUSTOMERS`），未对接真实后端 API。

### 数据层函数 (`customers-data.ts`)

| 函数 | 签名 | 说明 |
|------|------|------|
| `loadCustomersSnapshot` | `() => Promise<CustomersPageSnapshot>` | 加载客户快照，返回完整页面数据 |
| `computeCustomerStats` | `(items: CustomerRecord[]) => CustomerStats` | 统计总客户、活跃、消费总额、钻石会员 |
| `filterCustomers` | `(items, search, statusFilter, levelFilter) => CustomerRecord[]` | 客户端多维筛选 |
| `formatCustomerCurrency` | `(amount: number) => string` | 格式化金额显示（¥K / ¥万 单位） |

### 数据流

```
CustomersPage (Server, force-dynamic)
  └─ loadCustomersSnapshot() → CustomersPageSnapshot
       ├─ customers: CustomerRecord[]
       └─ stats: CustomerStats
  └─ CustomersClient (Client)
       ├─ 搜索/筛选/分页 (纯客户端)
       └─ "刷新快照" → router.refresh()
```

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `@m5/ui` | `Badge`, `DataTable`, `SearchFilterInput`, `StatCard`, `StatusBadge`, `FormField`, `SubmitButton`, `useToast` 等 UI 组件 |
| `next/navigation` | `useRouter` 路由跳转与刷新 |
| `react` | 客户端状态管理 (`useState`, `useMemo`, `useTransition`) |
| **AdminPermissionGate** | 权限管控，要求 `customers:read` 权限 |

## 使用指引

### 开发启动

```bash
# 在 monorepo 根目录启动 admin-web
pnpm --filter @m5/admin-web dev
```

### 访问地址

- 客户列表: `/customers`
- 新建客户: `/customers/new`

### 权限

列表页要求 `customers:read` 权限，新建页要求 `customers:new:read` 权限。未授权时显示权限受限提示卡片。

### 数据对接

当前为 mock 数据。对接真实后端时需：
1. 替换 `loadCustomersSnapshot` 实现，调用真实 API
2. 更新 `deliveryMode` 等元信息
3. 可移除或保留 `MOCK_CUSTOMERS` 作为 fallback

### 测试

```bash
# 列表页测试
pnpm --filter @m5/admin-web test -- --testPathPattern 'customers/page'

# 新建页测试
pnpm --filter @m5/admin-web test -- --testPathPattern 'customers/new'
```
