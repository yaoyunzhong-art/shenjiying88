# 优惠券管理模块 (Coupons)

## 模块概述

优惠券管理模块为 admin-web 提供完整的优惠券生命周期管理功能，涵盖优惠券列表查看、多维筛选排序、详情查看、状态流转（创建→发布→暂停→领完→过期）、新建优惠券表单等核心场景。模块基于 **Next.js App Router** 架构，采用 Client Component 模式，使用 `@m5/ui` 组件库实现数据表格、分页、搜索、标签筛选、详情操作栏等交互。

**角色视角:** 👔 运营经理 / 💰 财务主管 / 📊 品类经理

## 主要功能

| 功能 | 描述 |
|------|------|
| **优惠券列表** | 查看全部优惠券，含券码、名称、类型、折扣值、门槛、剩余/总量、限领、有效期、状态、创建人 |
| **多维筛选** | 支持搜索关键词（券码/名称/创建人）、状态下筛选（Tabs）、类型筛选、适用范围筛选 |
| **统计概览** | 顶部 StatCard 展示优惠券总数、进行中、已领完、总发放量、已核销数 |
| **过期预警** | 7天内到期的优惠券自动预警提示 |
| **近7天统计** | 核销量、进行中、草稿待发布、已过期的近7天概览 |
| **详情页** | 完整的详情查看，含 KPI 概览、基本信息、领取进度条、有效期、使用统计数据 |
| **状态流转** | 草稿→进行中→暂停→已领完，含确认弹窗，Toast 反馈 |
| **编辑/删除** | 详情页提供编辑跳转和删除操作 |
| **新建表单** | `/coupons/form` 完整的优惠券创建表单，支持四种优惠类型，含字段验证和提交回调 |

## 目录结构

```
coupons/
├── coupons.README.md              # 本文件
├── page.tsx                       # 列表页入口 (Client Component, AdminPermissionGate)
├── page.test.tsx                  # 列表页 E2E 测试
├── error.tsx                      # 错误边界组件
├── loading.tsx                    # 加载态骨架
├── not-found.tsx                  # 404 页面
├── [id]/
│   ├── page.tsx                   # 优惠券详情页 (详情查看 + 状态流转 + 编辑/删除)
│   ├── page.test.tsx              # 详情页测试
│   ├── coupon-detail-client.test.tsx  # 详情客户端组件测试
│   └── loading.tsx                # 详情加载态
└── form/
    ├── page.tsx                   # 新建/编辑优惠券表单页
    ├── page.test.tsx              # 表单页测试
    └── loading.tsx                # 表单加载态
```

## 核心数据模型

### CouponItem（定义于 `../coupons-data.ts`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 优惠券 ID |
| `code` | `string` | 券码（唯一，4-20位大写字母或数字） |
| `name` | `string` | 优惠券名称 |
| `type` | `CouponType` | `percentage` / `fixed` / `shipping` / `threshold` |
| `discountValue` | `number` | 折扣值（百分比/金额/门槛） |
| `threshold` | `number` | 满减门槛（0 表示无门槛） |
| `scope` | `CouponScope` | `all` / `category` / `product` / `store` / `member_tier` |
| `scopeLabel` | `string` | 适用范围描述 |
| `totalQuota` | `number` | 发放总量 |
| `remainingQuota` | `number` | 剩余配额 |
| `usageLimit` | `number` | 每人限领次数（99999 = 不限） |
| `usedCount` | `number` | 已核销数 |
| `status` | `CouponStatus` | `draft` / `active` / `paused` / `exhausted` / `expired` |
| `startAt` | `string` | 有效期开始 |
| `endAt` | `string` | 有效期结束 |
| `createdBy` | `string` | 创建人 |
| `updatedAt` | `string` | 最后更新时间 |

### 优惠券类型

| 类型 | 含义 | 折扣值含义 |
|------|------|------------|
| `percentage` | 折扣券 | 折扣百分比 % |
| `fixed` | 代金券 | 立减金额（元） |
| `shipping` | 包邮券 | 包邮门槛（元） |
| `threshold` | 满减券 | 减免金额（元） |

### 适用范围

| 范围 | 含义 |
|------|------|
| `all` | 全场通用 |
| `category` | 指定品类 |
| `product` | 指定商品 |
| `store` | 指定门店 |
| `member_tier` | 指定会员等级 |

### 状态流转图

```
  ┌───────┐  发布  ┌─────────┐  暂停  ┌─────────┐
  │ Draft │ ────→ │ Active  │ ────→ │ Paused  │
  └───────┘       └─────────┘       └─────────┘
                       │                 │
                       │ 领完            │ 截停
                       ▼                 ▼
                   ┌──────────┐    ┌───────────┐
                   │Exhausted │    │ Exhausted │
                   └──────────┘    └───────────┘
                   ┌──────────┐
                   │ Expired  │ (自动到期)
                   └──────────┘
```

## 核心功能详解

### 列表页逻辑

列表页使用 `CouponsPageContent` 客户端组件，内部状态管理链路：
1. `MOCK_COUPONS` 初始数据 → `useSearchFilter` 关键词搜索过滤
2. → 状态下筛选（`statusFilter` Tabs）→ 类型筛选（`typeFilter` Tabs）
3. → 适用范围筛选（`scopeFilter` Tabs）→ `useSortedItems` 排序
4. → `usePagination` 分页（可选每页 5/10/15/20）
5. → 渲染 `DataTable` + `Pagination`

### 详情页逻辑

详情页通过 `[id]/page.tsx` 路由参数获取 `id`，匹配 `MOCK_COUPONS` 找到对应记录：
- 展示 KPI 统计（`KpiSummaryCard`：发放总量、已核销、剩余量、限领）
- 基本信息双栏布局（`InfoCard` + `ProgressCard`）
- 状态流转按钮（`DetailActionBar` 根据当前状态动态渲染可流转的状态按钮）
- 状态变更确认弹窗（可点击确认/取消，模拟操作后 Toast 反馈）

### 表单页逻辑

表单页 `form/page.tsx` 提供完整表单：
- 四种优惠券类型选择（按钮式）
- 字段验证（名称、券码格式、折扣值、总量、日期等）
- 模拟提交（800ms 延迟，支持 `DUPLICATE` 券码冲突模拟）
- 表单重置

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `@m5/ui` | `DataTable`, `Pagination`, `SearchFilterInput`, `PageShell`, `Tabs`, `FilterChips`, `StatusBadge`, `DetailActionBar`, `DetailClosureBar`, `InfoCard`, `ProgressCard`, `KpiSummaryCard`, `FormField`, `SubmitButton`, `ToastContainer`, `Breadcrumb`, `Spinner`, `usePagination`, `useSearchFilter`, `useSortedItems` 等 |
| `next/navigation` | `useRouter`, `useParams` 路由跳转与参数获取 |
| `react` | 客户端状态管理 (`useState`, `useMemo`, `useCallback`, `useEffect`, `Suspense`) |
| `../components/admin-permission-gate` | 权限栅栏组件 |
| `../coupons-data` | 共享数据层（类型、mock 数据、常量映射表） |

## 权限节点

| 页面 | 权限 | 说明 |
|------|------|------|
| 列表页 (`/coupons`) | `coupons:read` | 查看优惠券列表 |
| 详情页 (`/coupons/[id]`) | `coupons:id:read` | 查看优惠券详情 |
| 表单页 (`/coupons/form`) | `coupons:form:read` | 新建/编辑优惠券 |

未授权时显示权限受限提示卡片。

## 使用指引

### 开发启动

```bash
pnpm --filter @m5/admin-web dev
```

### 访问地址

- 优惠券列表: `/coupons`
- 优惠券详情: `/coupons/[id]`
- 新建优惠券: `/coupons/form`

### 数据说明

当前使用 `MOCK_COUPONS` 本地 mock 数据，未对接真实后端 API。对接真实后端时需：
1. 替换 `MOCK_COUPONS` 为 API 调用
2. 更新详情页 `findCoupon` 逻辑
3. `submitCoupon` 替换为真实提交

### 测试

```bash
pnpm --filter @m5/admin-web test -- --testPathPattern 'coupons/'
```

## 维护者

- **维护者:** Admin Web 前端团队
- **最后修改:** 2026-07-27

## 交叉引用

- [共享数据层](../coupons-data.ts) — `CouponItem` 类型、mock 数据和常量映射表
- [AdminPermissionGate](../components/admin-permission-gate.tsx) — 权限栅栏组件
