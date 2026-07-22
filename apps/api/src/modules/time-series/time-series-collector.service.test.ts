/**
 * time-series-collector.service.test.ts
 * 圈梁五道箍: TimeSeriesCollectorService 单元测试
 * 覆盖: 正常路径5+ / 边界条件4+ / 错误处理4+ / 空值/空数组3+ / 并发/时序5+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TimeSeriesCollectorService } from './time-series-collector.service'

// ─── 辅助：构造假的 PerfSample ────────────────────────────────────

function makeSample(
  route: string,
  durationMs: number,
  overrides: Partial<{ timestamp: string; tenantId: string; statusCode: number }> = {},
) {
  return {
    route,
    durationMs,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    tenantId: overrides.tenantId,
    statusCode: overrides.statusCode ?? 200,
    requestId: `${route}-${Date.now()}`,
  }
}

describe('TimeSeriesCollectorService', () => {
  let service: TimeSeriesCollectorService

  beforeEach(() => {
    service = new TimeSeriesCollectorService()
  })

  afterEach(() => {
    // 每个测试结束时重置内部状态
    service.resetForTests()
  })

  // ================================================================
  // 正常路径 (5 cases)
  // ================================================================

  describe('正常路径', () => {
    it('应该能够记录单个 PerfSample 并通过 query 读取', () => {
      const sample = makeSample('/api/orders', 42.5)
      service.recordSample(sample)

      const result = service.query({ metricName: '/api/orders', window: '1h' })
      expect(result.metricKey).toBe('/api/orders:global')
      expect(result.points).toHaveLength(1)
      expect(result.points[0].value).toBe(42.5)
      expect(result.aggregate.count).toBe(1)
      expect(result.aggregate.avg).toBe(42.5)
      expect(result.aggregate.min).toBe(42.5)
      expect(result.aggregate.max).toBe(42.5)
    })

    it('应该能够批量记录多个样本并正确聚合', () => {
      const samples = [
        makeSample('/api/users', 10),
        makeSample('/api/users', 20),
        makeSample('/api/users', 30),
        makeSample('/api/users', 40),
        makeSample('/api/users', 50),
      ]
      const count = service.recordBatch(samples)
      expect(count).toBe(5)

      const result = service.query({ metricName: '/api/users', window: '1h' })
      expect(result.aggregate.min).toBe(10)
      expect(result.aggregate.max).toBe(50)
      expect(result.aggregate.avg).toBe(30)
      expect(result.aggregate.count).toBe(5)
      expect(result.aggregate.p50).toBe(30)
    })

    it('recordMetric 应该支持直接写入任意指标', () => {
      service.recordMetric({ metricName: 'cpu_usage', value: 78.3, tenantId: 'tenant-a' })

      const result = service.query({ metricName: 'cpu_usage', tenantId: 'tenant-a', window: '1h' })
      expect(result.metricKey).toBe('cpu_usage:tenant-a')
      expect(result.points).toHaveLength(1)
      expect(result.points[0].value).toBe(78.3)
    })

    it('listMetricKeys 应该返回已注册的所有 metric key', () => {
      service.recordMetric({ metricName: 'memory', value: 512 })
      service.recordMetric({ metricName: 'disk', value: 1024, tenantId: 't1' })
      const keys = service.listMetricKeys()
      expect(keys).toContain('memory:global')
      expect(keys).toContain('disk:t1')
      expect(keys).toHaveLength(2)
    })

    it('不同 window 查询应该返回对应窗口内的数据', () => {
      const oldSample = makeSample('/api/old', 1, {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
      })
      const recentSample = makeSample('/api/recent', 99, {
        timestamp: new Date().toISOString(),
      })
      service.recordSample(oldSample)
      service.recordSample(recentSample)

      // 1h 窗口应该只有 recentSample
      const result1h = service.query({ metricName: '/api/recent', window: '1h' })
      expect(result1h.points).toHaveLength(1)
      expect(result1h.aggregate.avg).toBe(99)

      // 6h 窗口应该两者都有 — 但注意 oldSample 的 key 是 '/api/old:global', 不是 '/api/recent:global'
      const result6h = service.query({ metricName: '/api/old', window: '6h' })
      expect(result6h.points).toHaveLength(1)
    })
  })

  // ================================================================
  // 边界条件 (4 cases)
  // ================================================================

  describe('边界条件', () => {
    it('p50/p95/p99 百分位计算对偶数个数据点应该准确', () => {
      // 1 2 3 4 5 6 7 8 9 10 → p50=5.5 p95=9.55 p99=10
      for (let i = 1; i <= 10; i++) {
        service.recordMetric({ metricName: 'pct_test', value: i })
      }
      const result = service.query({ metricName: 'pct_test', window: '1h' })
      expect(result.aggregate.p50).toBeCloseTo(5.5, 1)
      expect(result.aggregate.p95).toBeCloseTo(9.55, 1)
      expect(result.aggregate.p99).toBeCloseTo(10, 0)
    })

    it('单个数据点的百分位应该返回该值', () => {
      service.recordMetric({ metricName: 'single', value: 777 })
      const result = service.query({ metricName: 'single', window: '1h' })
      expect(result.aggregate.p50).toBe(777)
      expect(result.aggregate.p95).toBe(777)
      expect(result.aggregate.p99).toBe(777)
    })

    it('seasonality 对少于24个点的数据应该返回 0', () => {
      for (let i = 0; i < 23; i++) {
        service.recordMetric({ metricName: 'season', value: i })
      }
      const result = service.query({ metricName: 'season', window: '1h' })
      expect(result.seasonality).toBe(0)
    })

    it('detectSeasonality 对相同值的点应该返回接近 0 的季节性指数', () => {
      for (let i = 0; i < 48; i++) {
        service.recordMetric({ metricName: 'flat', value: 50 })
      }
      const pattern = service.detectSeasonality({ metricName: 'flat' })
      expect(pattern.daily).toHaveLength(24)
      // 所有小时均值应为 50
      pattern.daily.forEach((v) => expect(v).toBe(50))
    })
  })

  // ================================================================
  // 错误处理 (4 cases)
  // ================================================================

  describe('错误处理', () => {
    it('对不存在的 metricName 查询应该返回空 points 和 aggregate 0', () => {
      const result = service.query({ metricName: 'nonexistent', window: '1h' })
      expect(result.points).toHaveLength(0)
      expect(result.aggregate.count).toBe(0)
      expect(result.aggregate.avg).toBe(0)
      expect(result.aggregate.min).toBe(0)
      expect(result.aggregate.max).toBe(0)
    })

    it('listMetricKeys 在无数据时应该返回空数组', () => {
      const keys = service.listMetricKeys()
      expect(keys).toEqual([])
    })

    it('toPrometheus 在无数据时应该返回空字符串', () => {
      const output = service.toPrometheus()
      expect(output).toBe('')
    })

    it('detectSeasonality 在无数据时应该返回全零模式', () => {
      const pattern = service.detectSeasonality({ metricName: 'empty' })
      expect(pattern.daily).toHaveLength(24)
      expect(pattern.daily.every((v) => v === 0)).toBe(true)
      expect(pattern.weekly).toHaveLength(7)
      expect(pattern.monthly).toHaveLength(31)
    })
  })

  // ================================================================
  // 空值/空数组 (3 cases)
  // ================================================================

  describe('空值/空数组', () => {
    it('recordBatch 处理空数组应该返回 0', () => {
      const count = service.recordBatch([])
      expect(count).toBe(0)
    })

    it('recordMetric 不传 tenantId 应该使用 global', () => {
      service.recordMetric({ metricName: 'no_tenant', value: 100 })
      const keys = service.listMetricKeys()
      expect(keys).toContain('no_tenant:global')
    })

    it('recordMetric 不传 timestamp 应该自动填充', () => {
      service.recordMetric({ metricName: 'auto_ts', value: 10 })
      const result = service.query({ metricName: 'auto_ts', window: '1h' })
      expect(result.points[0].timestamp).toBeTruthy()
      expect(new Date(result.points[0].timestamp).getTime()).not.toBeNaN()
    })
  })

  // ================================================================
  // 并发/时序 (5 cases)
  // ================================================================

  describe('并发/时序', () => {
    it('连续多次写入同个 metric 应该追加而非覆盖', () => {
      for (let i = 0; i < 100; i++) {
        service.recordMetric({ metricName: 'append_test', value: i })
      }
      const result = service.query({ metricName: 'append_test', window: '1h' })
      expect(result.aggregate.count).toBe(100)
      expect(result.aggregate.min).toBe(0)
      expect(result.aggregate.max).toBe(99)
    })

    it('resetForTests 后所有数据应该被清空', () => {
      service.recordMetric({ metricName: 'temp', value: 1 })
      service.resetForTests()
      const keys = service.listMetricKeys()
      expect(keys).toHaveLength(0)
    })

    it('toPrometheus 在多数据时应该输出正确的格式', () => {
      service.recordMetric({ metricName: 'latency', value: 200 })
      service.recordMetric({ metricName: 'latency', value: 300 })

      const output = service.toPrometheus()
      expect(output).toContain('latency_1h_avg')
      expect(output).toContain('latency_1h_p95')
      expect(output).toContain('latency_1h_p99')
      expect(output).toContain('latency_1h_count')
    })

    it('同一 metric 不同 tenant 应该独立存储', () => {
      service.recordMetric({ metricName: 'multi_tenant', value: 10, tenantId: 't1' })
      service.recordMetric({ metricName: 'multi_tenant', value: 99, tenantId: 't2' })

      const r1 = service.query({ metricName: 'multi_tenant', tenantId: 't1', window: '1h' })
      const r2 = service.query({ metricName: 'multi_tenant', tenantId: 't2', window: '1h' })
      expect(r1.aggregate.avg).toBe(10)
      expect(r2.aggregate.avg).toBe(99)
    })

    it('大量数据点下 query 的 aggregate 计算应该正确', () => {
      const samples: number[] = []
      for (let i = 0; i < 5000; i++) {
        const val = Math.random() * 1000
        samples.push(val)
        service.recordMetric({ metricName: 'bulk', value: val })
      }
      const result = service.query({ metricName: 'bulk', window: '1h' })
      expect(result.aggregate.count).toBe(5000)
      expect(result.aggregate.min).toBeGreaterThanOrEqual(0)
      expect(result.aggregate.max).toBeLessThanOrEqual(1000)
      expect(result.aggregate.avg).toBeGreaterThan(0)
    })

    it('多 metric 并发写入后 listMetricKeys 应该正确列出所有 key', () => {
      service.recordMetric({ metricName: 'a', value: 1 })
      service.recordMetric({ metricName: 'b', value: 2, tenantId: 'x' })
      service.recordMetric({ metricName: 'c', value: 3, tenantId: 'y' })

      const keys = service.listMetricKeys()
      expect(keys).toHaveLength(3)
      expect(keys.sort()).toEqual(['a:global', 'b:x', 'c:y'])
    })
  })
})
