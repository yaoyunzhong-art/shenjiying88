# 数据分析工作台 v2（Analytics V2）

统一数据分析与运营指标看板，提供租户级的数据监控、Cohort 留存分析、漏斗转化分析和实时事件流追踪。

## 功能概述

- **指标概览** — 支持多维度关键指标呈现（总事件数、活跃会员数、转化率、点击率、营收），按 1d / 7d / 30d 周期切换
- **DAU 变化** — 当前 Cohorts 环比变化及周期对比
- **CDC 状态** — 实时展示 CDC（Change Data Capture）水印位置与累积事件量
- **留存健康度** — 综合留存评分及 D1/D7/D30 分阶段留存率，附运营建议
- **Cohort 留存矩阵** — 以周为粒度的用户留存表格
- **漏斗转化分析** — 电商转化漏斗显示每一步进入人数、转化率与流失率
- **实时事件流** — 最新的用户行为事件滚动列表（页面浏览、点击、购买等）

## 目录结构

```
analytics-v2/
├── analytics-v2-data.ts       # 数据层：类型定义 + Mock 数据接口
├── analytics-v2-client.tsx     # 客户端组件：仪表盘 UI 渲染
├── page.tsx                    # 服务端页面：权限门控 + 快照加载
├── page.test.tsx               # 页面测试
├── error.tsx                   # 错误边界
├── loading.tsx                 # 加载态骨架屏
├── not-found.tsx               # 404 占位页
└── README.md
```

## 主要组件

| 组件 | 说明 |
|---|---|
| `AnalyticsV2Page` | 服务端组件，加载快照并通过 `AdminPermissionGate` 控制访问 |
| `AnalyticsV2Client` | 客户端组件，包含所有看板区块的交互逻辑 |

## 核心数据模型

| 类型 | 说明 |
|---|---|
| `AnalyticsV2SnapshotDelivery` | 顶层快照载荷（Cohorts / Funnels / Summary / CDC / Events） |
| `CohortMatrix` | 周 Cohort 定义与各期留存率 |
| `FunnelResult` | 漏斗转化结果 |
| `RetentionHealth` | 留存健康度评分与建议 |
| `MetricCard` | 关键指标卡片，带趋势方向 |
| `LiveEvent` | 实时事件行 |

## 相关 API

- **数据来源**: `loadAnalyticsV2Snapshot()` — 本地 Mock 数据，可通过切换到真实分析流水线替换

## 权限控制

需 `dashboard:read` 权限，通过 `AdminPermissionGate` 实现 Route Guard。

## 使用示例

```tsx
// 服务端 page.tsx
const snapshot = await loadAnalyticsV2Snapshot()
return (
  <AdminPermissionGate requiredPermission="dashboard:read" title="..." description="...">
    <AnalyticsV2Client snapshot={snapshot} />
  </AdminPermissionGate>
)
```
