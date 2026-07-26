# 采购管理模块 (Procurement)

## 功能概述

采购管理模块 (`procurement`) 负责采购订单的全生命周期管理，从需求提报、审批、发货追踪到收货确认。支持多级优先级（低/中/高/紧急），覆盖多品项采购单，提供供应商管理和到货跟踪能力。

## 目录结构

```
procurement/
├── README.md                 # 本文件 — 模块文档
├── page.tsx                  # 服务端页面组件（SSR）
├── page.test.tsx             # 页面测试
├── procurement-client.tsx    # 客户端交互组件
├── procurement-data.ts       # 数据层（类型定义 + API 获取 + fallback + 后端映射）
├── loading.tsx               # 加载态 UI
├── error.tsx                 # 错误边界 UI
└── not-found.tsx             # 404 占位
```

## 核心功能

| 功能 | 说明 |
|------|------|
| 采购单列表 | 按状态分 Tab 筛选（待处理 / 供应商处理中 / 已收货 / 全部） |
| 关键指标看板 | 采购单总数、待处理数、紧急数、采购总额一目了然 |
| 优先级标注 | 低/中/高/紧急四档，配不同颜色标签 |
| 采购单详情 | 显示订单编号、供应商、品项清单、申请人、门店、收发货日期 |
| 数据刷新 | 客户端一键刷新触发服务端重新获取 |
| 容灾降级 | API 不可用时自动回退本地样本数据 |
| 后端数据映射 | `mapToFrontendOrder` 将后端 DTO 转换为前端模型 |

### 采购单状态流转

```
draft → submitted → approved → shipped → received
  ↓        ↓
cancelled  cancelled
```

### 优先级定义

- **low** — 常规采购
- **medium** — 标准采购
- **high** — 加急处理
- **urgent** — 紧急采购（红色标识）

## 依赖关系

| 依赖 | 关联模块 | 说明 |
|------|----------|------|
| `AdminPermissionGate` | `components/` | 权限管控门组件，需 `procurement:read` 权限 |
| `next/navigation` | Next.js | `useRouter` 实现页面刷新 |
| `next/navigation` | Next.js | `useTransition` 实现刷新状态管理 |

## 使用方法

### 路由访问

```
/admin-web/app/procurement
```

### 权限要求

页面已接入管理员权限管控，需具备 `procurement:read` 权限的账号方可访问。

### API 配置

模块自动从以下环境变量解析后端 API 地址（按优先级）：

1. `M5_API_BASE_URL`
2. `NEXT_PUBLIC_M5_API_BASE_URL`
3. `NEXT_PUBLIC_API_URL`
4. 缺省值: `http://localhost:3001`

最终请求地址：`{baseUrl}/procurement-orders`

### 数据流

```
page.tsx (SSR)
  └─ loadProcurementSnapshot()
       ├─ fetchProcurementOrders()
       │    └─ GET /api/v1/procurement-orders
       │    └─ mapToFrontendOrder() 后端状态映射
       └─ fallback → defaultOrders (5 条样本)
  └─ ProcurementClient (client component)
       └─ 用户交互（Tab 筛选 / 刷新）
```

### 后端数据映射

API 返回的后端状态码映射关系：

| 后端状态 | 前端状态 | 说明 |
|----------|----------|------|
| `DRAFT` | `draft` | 草稿 |
| `PENDING_APPROVAL` | `submitted` | 待审批 |
| `APPROVED` | `approved` | 待发货 |
| `SHIPPED` / `PARTIAL` | `shipped` | 配送中 |
| `RECEIVED` | `received` | 已收货 |
| `CANCELLED` | `cancelled` | 已取消 |

### 错误处理

- API 请求失败 → 页面顶部展示黄色警告条 + 自动切换 fallback 数据
- Tab 筛选无结果 → 展示空状态占位（带图标和说明文字）
- 未配置 API → 自动使用 `DEFAULT_API_ORIGIN`（localhost:3001）
