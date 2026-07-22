# Analytics V2 模块

## 功能概述

Analytics V2 模块 (`analytics-v2`) 是第二阶段数据分析引擎，提供从事件采集、CDC 增量同步、同期群分析、漏斗分析到留存分析与指标聚合的全链路数据分析能力。

### 核心能力

- **事件采集**: 支持 PAGEVIEW / CLICK / CONVERSION / PURCHASE / CUSTOM 五种事件类型，单条/批量采集
- **CDC 增量同步**: 基于 watermark 的变更数据捕获，支持重放与幂等消费
- **同期群分析**: 按周/月维度构建 Cohort 矩阵，跟踪会员生命周期表现
- **漏斗分析**: 可配置多步骤漏斗，计算各步骤转化率与流失率
- **留存分析**: D1/D7/D30/D60/D90 留存计算，留存健康度评分与趋势
- **指标聚合**: 仪表板汇总、实时指标、综合健康报告
- **多租户隔离**: 所有查询按 tenant 隔离

## 核心 Service 列表

| Service | 文件 | 职责 |
|---------|------|------|
| `AnalyticsV2Service` | `analytics-v2.service.ts` | 主编排服务 — 事件→CDC→cohort→漏斗→留存→指标全链路编排 |
| `EventCollector` | `event-collector.ts` | 事件采集引擎 — 单事件/批量采集、事件校验与去重 |
| `CDCStream` | `cdc-stream.ts` | CDC 流引擎 — watermark 跟踪、重放、幂等应用 |
| `CohortAnalyzer` | `cohort-analyzer.ts` | 同期群分析引擎 — 矩阵构建、平均留存计算 |
| `FunnelCalculator` | `funnel-calculator.ts` | 漏斗计算引擎 — 步骤转化率与流失率计算 |
| `CohortService` | `services/cohort.service.ts` | 会员分组服务 — 注册、行为跟踪、矩阵重建 |
| `FunnelService` | `services/funnel.service.ts` | 漏斗管理服务 — 创建、查询、默认模板 |
| `RetentionService` | `services/retention.service.ts` | 留存分析服务 — 报告生成、健康度、趋势 |
| `MetricsService` | `services/metrics.service.ts` | 指标聚合服务 — 仪表板、实时指标、CDC 状态 |

## 数据适配器列表

| 适配器 | 文件 | 职责 |
|--------|------|------|
| `EventAdapter` | `datasources/event.adapter.ts` | 事件数据适配层 |
| `CDCAdapter` | `datasources/cdc.adapter.ts` | CDC 数据适配层 |
| `CohortAdapter` | `datasources/cohort.adapter.ts` | Cohort 数据适配层 |
| `FunnelAdapter` | `datasources/funnel.adapter.ts` | 漏斗数据适配层 |
| `RetentionAdapter` | `datasources/retention.adapter.ts` | 留存数据适配层 |

## 主要 API 端点

### 事件采集
| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/analytics-v2/event/collect` | 单事件采集 |
| `POST` | `/api/analytics-v2/event/batch` | 批量采集 |
| `GET` | `/api/analytics-v2/event/recent` | 实时事件流 |

### CDC 增量同步
| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/analytics-v2/cdc/apply` | CDC 单条应用 |
| `POST` | `/api/analytics-v2/cdc/replay` | CDC 重放 |
| `GET` | `/api/analytics-v2/cdc/tail` | CDC tail 查询 |
| `GET` | `/api/analytics-v2/cdc/status` | CDC 状态 |

### 同期群分析
| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/analytics-v2/cohort/register` | 注册新会员建 cohort |
| `POST` | `/api/analytics-v2/cohort/track` | 跟踪会员行为 |
| `GET` | `/api/analytics-v2/cohort/list` | cohort 列表 |
| `GET` | `/api/analytics-v2/cohort/matrix` | cohort 矩阵 |
| `GET` | `/api/analytics-v2/cohort/reliability` | cohort 可靠度报告 |

### 漏斗分析
| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/analytics-v2/funnel/create` | 创建漏斗 |
| `GET` | `/api/analytics-v2/funnel/list` | 漏斗列表 |
| `GET` | `/api/analytics-v2/funnel/:id` | 漏斗详情 |
| `GET` | `/api/analytics-v2/funnel/template/default` | 默认漏斗模板 |

### 留存分析
| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/analytics-v2/retention/generate` | 生成留存报告 |
| `GET` | `/api/analytics-v2/retention/health` | 留存健康度 |
| `GET` | `/api/analytics-v2/retention/trend` | 留存趋势 |

### 指标聚合
| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/analytics-v2/metrics/summary` | 仪表板汇总 |
| `GET` | `/api/analytics-v2/metrics/live` | 实时指标 |
| `GET` | `/api/analytics-v2/metrics/health` | 综合健康报告 |

## 依赖关系

| 依赖 | 说明 |
|------|------|
| `@nestjs/common` | NestJS 框架基础 |
| `../agent/tenant.guard` | 多租户守卫 |

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 事件存储 | — | 内存适配器 | 支持替换为 ClickHouse 等列存引擎 |
| 窗口天数 | `number` | 7 | 漏斗分析默认时间窗口 |
| Cohort 期数 | `number` | 12 | 矩阵重建默认期数 |
| Retention 窗口 | `number` | 4 | 留存趋势默认计算周期数 |
| 事件类型 | — | 5 | PAGEVIEW/CLICK/CONVERSION/PURCHASE/CUSTOM |

## 目录结构

```
analytics-v2/
├── README.md                            # 本文件
├── analytics-v2.service.ts              # 主编排服务
├── analytics-v2.controller.ts           # API 控制器
├── analytics-v2.module.ts               # NestJS 模块
├── analytics-v2.entity.ts               # 实体定义
├── analytics-v2.dto.ts                  # 入参校验 DTO
├── analytics-v2.contract.ts             # 跨模块合约
├── event-collector.ts                   # 事件采集引擎
├── cdc-stream.ts                        # CDC 流引擎
├── cohort-analyzer.ts                   # 同期群分析引擎
├── funnel-calculator.ts                 # 漏斗计算引擎
├── services/
│   ├── cohort.service.ts                # 会员分组服务
│   ├── funnel.service.ts                # 漏斗管理服务
│   ├── retention.service.ts             # 留存分析服务
│   └── metrics.service.ts               # 指标聚合服务
└── datasources/
    ├── event.adapter.ts                 # 事件数据适配层
    ├── cdc.adapter.ts                   # CDC 数据适配层
    ├── cohort.adapter.ts                # Cohort 数据适配层
    ├── funnel.adapter.ts                # 漏斗数据适配层
    └── retention.adapter.ts             # 留存数据适配层
```
