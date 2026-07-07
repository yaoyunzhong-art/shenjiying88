/**
 * 🐜 自动: [time-series] [D] contract 补全
 *
 * 时序指标模块：跨模块合约类型
 * 定义 time-series 模块对外暴露的稳定合约接口，
 * 供其他模块（perf-monitor, observability, health-dashboard 等）消费。
 */
import type {
  TimeSeriesMetricEntity,
  TimeSeriesAggregate,
  TimeSeriesPoint,
  TimeSeriesCollectorStatus,
} from './time-series.entity'
import type { WindowSize } from './time-series.dto'
import type { AlertRule, AlertEvent, TimeSeriesSummary } from './time-series.service'

/**
 * 时序指标合约（跨模块安全子集）
 */
export interface TimeSeriesMetricContract {
  metricKey: string
  tenantId?: string
  window: WindowSize
  points: TimeSeriesPoint[]
  aggregate: TimeSeriesAggregate
  seasonality: number
}

/**
 * 聚合统计合约（跨模块安全子集）
 */
export interface TimeSeriesAggregateContract {
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
  count: number
}

/**
 * 时序数据点合约（跨模块安全子集）
 */
export interface TimeSeriesPointContract {
  timestamp: string
  value: number
}

/**
 * 告警规则合约（跨模块安全子集）
 */
export interface AlertRuleContract {
  metricName: string
  tenantId?: string
  operator: 'gt' | 'lt' | 'gte' | 'lte'
  threshold: number
  window: WindowSize
  description?: string
}

/**
 * 告警事件合约（跨模块安全子集）
 */
export interface AlertEventContract {
  rule: AlertRuleContract
  currentValue: number
  triggeredAt: string
  message: string
}

/**
 * 时序摘要合约（跨模块安全子集）
 */
export interface TimeSeriesSummaryContract {
  totalMetrics: number
  totalPoints: number
  oldestTimestamp: string | null
  newestTimestamp: string | null
  topMetricNames: string[]
}

/**
 * 窗口对比结果合约（跨模块安全子集）
 */
export interface WindowCompareResultContract {
  window: WindowSize
  avg: number
  count: number
  p95: number
}

/**
 * 采集器状态合约（跨模块安全子集）
 */
export interface CollectorStatusContract {
  collectorName: string
  buffersCount: number
  totalPoints: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  uptimeMs: number
}

/**
 * 季节性模式合约（跨模块安全子集）
 */
export interface SeasonalityPatternContract {
  weekly: number[]
  monthly: number[]
  daily: number[]
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toTimeSeriesMetricContract(entity: TimeSeriesMetricEntity): TimeSeriesMetricContract {
  return {
    metricKey: entity.metricKey,
    tenantId: entity.tenantId,
    window: entity.window,
    points: entity.points.map((p) => ({ timestamp: p.timestamp, value: p.value })),
    aggregate: { ...entity.aggregate },
    seasonality: entity.seasonality,
  }
}

/** 实体 -> 合约映射 */
export function toAggregateContract(entity: TimeSeriesAggregate): TimeSeriesAggregateContract {
  return { ...entity }
}

/** 告警规则 -> 合约映射 */
export function toAlertRuleContract(entity: AlertRule): AlertRuleContract {
  return {
    metricName: entity.metricName,
    tenantId: entity.tenantId,
    operator: entity.operator,
    threshold: entity.threshold,
    window: entity.window,
    description: entity.description,
  }
}

/** 告警事件 -> 合约映射 */
export function toAlertEventContract(entity: AlertEvent): AlertEventContract {
  return {
    rule: toAlertRuleContract(entity.rule),
    currentValue: entity.currentValue,
    triggeredAt: entity.triggeredAt,
    message: entity.message,
  }
}

/** 时序摘要 -> 合约映射 */
export function toTimeSeriesSummaryContract(entity: TimeSeriesSummary): TimeSeriesSummaryContract {
  return {
    totalMetrics: entity.totalMetrics,
    totalPoints: entity.totalPoints,
    oldestTimestamp: entity.oldestTimestamp,
    newestTimestamp: entity.newestTimestamp,
    topMetricNames: [...entity.topMetricNames],
  }
}

/** 采集器状态 -> 合约映射 */
export function toCollectorStatusContract(entity: TimeSeriesCollectorStatus): CollectorStatusContract {
  return {
    collectorName: entity.collectorName,
    buffersCount: entity.buffersCount,
    totalPoints: entity.totalPoints,
    status: entity.status,
    uptimeMs: entity.uptimeMs,
  }
}

/** 季节性模式 -> 合约映射 */
export function toSeasonalityPatternContract(entity: {
  weekly: number[]
  monthly: number[]
  daily: number[]
}): SeasonalityPatternContract {
  return {
    weekly: [...entity.weekly],
    monthly: [...entity.monthly],
    daily: [...entity.daily],
  }
}

/** 窗口对比结果 -> 合约映射 */
export function toWindowCompareResultContracts(
  entities: Array<{ window: WindowSize; avg: number; count: number; p95: number }>,
): WindowCompareResultContract[] {
  return entities.map((e) => ({ ...e }))
}
