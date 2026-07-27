# 支付渠道管理（Payment Channels）

统一管理线上 / 线下支付渠道，支持渠道监控、费率配置、交易统计与健康检查。

## 功能概述

- **渠道总览** — 展示所有支付渠道的今日交易额、今日笔数和异常状态
- **线上/线下筛选项** — 按渠道类型（online / offline）过滤展示
- **渠道卡片** — 每张卡片展示渠道名称、提供商、费率、单笔限额、日限额、适用门店及健康检查时间
- **状态标识** — 正常 / 降级 / 离线三种状态，辅以颜色区分
- **实时刷新** — 支持手动触发全量数据刷新
- **Fallback 机制** — 当上游 API 不可达时自动回退到本地样本数据

## 目录结构

```
payment-channels/
├── payment-channels-data.ts     # 数据层：类型定义 + API 请求 + Fallback 逻辑
├── payment-channels-client.tsx   # 客户端组件：渠道列表 UI 渲染
├── page.tsx                      # 服务端页面：权限门控 + 快照加载
├── page.test.tsx                 # 页面测试
├── layout.tsx                    # 布局包装
├── error.tsx                     # 错误边界
├── loading.tsx                   # 加载态骨架屏
├── not-found.tsx                 # 404 占位页
└── README.md
```

## 主要组件

| 组件 | 说明 |
|---|---|
| `PaymentChannelsPage` | 服务端组件，加载数据快照并通过 `AdminPermissionGate` 控制访问 |
| `PaymentChannelsClient` | 客户端组件，渠道列表、筛选项、统计卡片和刷新的交互逻辑 |

## 核心数据模型

| 类型 | 说明 |
|---|---|
| `PaymentChannel` | 单个支付渠道（ID、名称、提供商、费率、限额、状态等） |
| `PaymentChannelsSnapshotDelivery` | 顶层快照载荷，含渠道列表和回退标记 |

## 相关 API

- **上游接口**: `GET /api/v1/cashier/channels` — 获取支付渠道列表
- **回退策略**: 当上游不可达时，使用 `defaultChannels` 本地样本数据
- **API Base URL 配置**: 依次读取 `M5_API_BASE_URL` → `NEXT_PUBLIC_M5_API_BASE_URL` → `NEXT_PUBLIC_API_URL`，默认 `http://localhost:3001`

## 权限控制

需 `payment-channels:read` 权限，通过 `AdminPermissionGate` 实现 Route Guard。

## 使用示例

```tsx
// 服务端 page.tsx
const snapshot = await loadPaymentChannelsSnapshot()
return (
  <AdminPermissionGate requiredPermission="payment-channels:read" title="..." description="...">
    <PaymentChannelsClient snapshot={snapshot} />
  </AdminPermissionGate>
)
```
