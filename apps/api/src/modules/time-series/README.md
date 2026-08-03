# Time-Series 模块 · 时序指标

## 概述 / Overview

时序指标采集、滚动窗口聚合、告警规则管理模块。接收来自 `perf-monitor` 的 `PerfSample` 流，按 5 种窗口（1h/6h/24h/7d/30d）实时计算 min/max/avg/p50/p95/p99，支持季节性模式识别和 Prometheus 导出。

**Tech Stack:** NestJS · TypeScript · In-memory buffer (v1) · Prisma optional

## 核心实体 / Core Entities

| Entity | 描述 |
|---|---|
| `TimeSeriesMetric` | 单条时序指标（metricKey + tenantId + window + points） |
| `TimeSeriesPoint` | 时序数据点 `{ timestamp, value }` |
| `TimeSeriesAggregate` | 聚合统计 `{ min, max, avg, p50, p95, p99, count }` |
| `AlertRule` | 告警规则 `{ metricName, operator, threshold, window }` |
| `AlertEvent` | 触发的告警事件 |
| `SeasonalityPattern` | 季节性模式 `{ daily, weekly, monthly }` |
| `TimeSeriesSummary` | 全局摘要 `{ totalMetrics, totalPoints, oldest/newest }` |

## API 端点 / Endpoints

Prefix: `/time-series` (protected by `TenantGuard`)

### 数据写入
| Method | Path | 说明 |
|--------|------|------|
| POST | `/record` | 记录单条指标 |
| POST | `/batch` | 批量记录请求耗时样本 |

### 数据查询
| Method | Path | 说明 |
|--------|------|------|
| POST | `/query` | 查询窗口内时序数据 |
| GET | `/keys` | 列出所有已注册的 metric key |
| GET | `/status` | 采集器运行状态 |
| POST | `/seasonality` | 检测季节性模式 |
| POST | `/compare` | 跨窗口（1h/6h/24h）对比 |

### 告警管理
| Method | Path | 说明 |
|--------|------|------|
| GET | `/alert-rules` | 列出所有告警规则 |
| POST | `/alert-rules` | 注册告警规则 |
| DELETE | `/alert-rules/:id` | 删除告警规则 |
| POST | `/alerts/evaluate` | 评估所有告警规则 |
| GET | `/summary` | 时序数据摘要 |

## 使用示例 / Usage

```typescript
// 记录指标
POST /time-series/record
{ "metricName": "api_latency", "tenantId": "t-store-a", "value": 235 }

// 查询
POST /time-series/query
{ "metricName": "api_latency", "tenantId": "t-store-a", "window": "1h" }

// 注册告警规则
POST /time-series/alert-rules
{ "metricName": "api_latency", "operator": "gt", "threshold": 1000, "window": "1h" }

// 跨模块合约导入
import { toTimeSeriesMetricContract } from './time-series.contract'
```

## 依赖关系 / Dependencies

- **NestJS** — Controller/Service 框架
- **`perf-monitor`** — PerfSample 数据源
- **`class-validator` / `class-transformer`** — DTO 校验
- **`TenantGuard`** (`agent/tenant.guard`) — 多租户保护
- V2 规划: InfluxDB / TimescaleDB

## 配置项 / Configuration

| 项 | 类型 | 默认 | 说明 |
|----|------|------|------|
| windowMs | Record | 见 `TimeSeriesCollectorService` | 各窗口保留时间 (ms) |
| MAX_ALERTS | number | 100 | 内存告警事件保留上限 |

## 错误码 / Error Codes

| 场景 | HTTP | 原因 |
|------|------|------|
| 参数校验失败 | 400 | DTO 校验未通过 |
| 租户隔离拒绝 | 403 | TenantGuard 检测 tenant 不匹配 |
| 服务内部错误 | 500 | 告警评估异常 |
