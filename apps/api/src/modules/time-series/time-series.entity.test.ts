import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// time-series.entity.test.ts - Phase-19 T27
// 用途: time-series Entity 类型测试
import type {
  TimeSeriesMetricEntity,
  TimeSeriesAggregate,
  TimeSeriesCollectorStatus,
} from './time-series.entity'

describe('TimeSeriesEntity types', () => {
  it('should construct a valid TimeSeriesMetricEntity', () => {
    const entity: TimeSeriesMetricEntity = {
      metricKey: 'latency:global',
      window: '1h',
      points: [
        { timestamp: '2026-01-01T00:00:00Z', value: 10 },
        { timestamp: '2026-01-01T01:00:00Z', value: 20 },
      ],
      aggregate: {
        min: 10,
        max: 20,
        avg: 15,
        p50: 10,
        p95: 20,
        p99: 20,
        count: 2,
      },
      seasonality: 0.5,
    }
    expect(entity.metricKey).toBe('latency:global')
    expect(entity.points.length).toBe(2)
    expect(entity.aggregate.avg).toBe(15)
    expect(entity.seasonality).toBe(0.5)
  })

  it('should construct TimeSeriesAggregate with zero count', () => {
    const agg: TimeSeriesAggregate = {
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      count: 0,
    }
    expect(agg.count).toBe(0)
  })

  it('should construct TimeSeriesCollectorStatus in all states', () => {
    const active: TimeSeriesCollectorStatus = {
      collectorName: 'TimeSeriesCollector',
      buffersCount: 5,
      totalPoints: 100,
      status: 'ACTIVE',
      uptimeMs: 86400000,
    }
    expect(active.status).toBe('ACTIVE')

    const degraded: TimeSeriesCollectorStatus = {
      collectorName: 'TimeSeriesCollector',
      buffersCount: 0,
      totalPoints: 0,
      status: 'DEGRADED',
      uptimeMs: 0,
    }
    expect(degraded.status).toBe('DEGRADED')
  })

  it('should accept all WindowSize values', () => {
    const windows: Array<TimeSeriesMetricEntity['window']> = ['1h', '6h', '24h', '7d', '30d']
    for (const w of windows) {
      const entity: TimeSeriesMetricEntity = {
        metricKey: `test:${w}`,
        window: w,
        points: [],
        aggregate: { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 },
        seasonality: 0,
      }
      expect(entity.window).toBe(w)
    }
  })
})
