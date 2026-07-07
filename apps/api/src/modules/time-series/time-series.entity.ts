// time-series.entity.ts - Phase-19 T27
// 用途: 时序指标实体类型定义
import type { WindowSize, TimeSeriesPoint, SeasonalityPattern } from './time-series-collector.service'

export { WindowSize, TimeSeriesPoint, SeasonalityPattern }

export interface TimeSeriesMetricEntity {
  metricKey: string
  tenantId?: string
  window: WindowSize
  points: TimeSeriesPoint[]
  aggregate: TimeSeriesAggregate
  seasonality: number
}

export interface TimeSeriesAggregate {
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
  count: number
}

export interface TimeSeriesRecordInput {
  metricName: string
  tenantId?: string
  value: number
  timestamp?: string
}

export interface TimeSeriesQueryInput {
  metricName: string
  tenantId?: string
  window: WindowSize
}

export interface TimeSeriesBatchInput {
  samples: Array<{
    route: string
    tenantId?: string
    durationMs: number
    timestamp?: string
  }>
}

export interface TimeSeriesCollectorStatus {
  collectorName: string
  buffersCount: number
  totalPoints: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  uptimeMs: number
}
