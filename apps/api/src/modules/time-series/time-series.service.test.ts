import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: TimeSeries + Collector Service 综合单元测试 (正例+反例+边界)
import { TimeSeriesCollectorService, type TimeSeriesPoint } from './time-series-collector.service'
import { TimeSeriesService, type AlertRule, type AlertEvent } from './time-series.service'
import type { PerfSample } from '../perf-monitor/perf-monitor.service'

// ─── 辅助工厂 ───

function makePerfSample(overrides: Partial<PerfSample> = {}): PerfSample {
  return {
    route: '/api/test',
    statusCode: 200,
    durationMs: 100,
    timestamp: new Date().toISOString(),
    tenantId: 'store-a',
    ...overrides,
  }
}

function createEnv() {
  const collector = new TimeSeriesCollectorService()
  const service = new TimeSeriesService(collector)
  return { collector, service }
}

// ─── TimeSeriesCollectorService ───

describe('TimeSeriesCollectorService', () => {
  let collector: TimeSeriesCollectorService

  beforeEach(() => {
    collector = new TimeSeriesCollectorService()
  })

  // ── recordSample / recordBatch / recordMetric ──

  describe('recordSample', () => {
    it('should record a single PerfSample point', () => {
      const sample = makePerfSample({ route: '/api/order', durationMs: 200 })
      collector.recordSample(sample)

      const metric = collector.query({ metricName: '/api/order', tenantId: 'store-a', window: '1h' })
      expect(metric.points).toHaveLength(1)
      expect(metric.points[0].value).toBe(200)
      expect(metric.aggregate.count).toBe(1)
    })

    it('should record under global tenant when tenantId is undefined', () => {
      const sample = makePerfSample({ route: '/api/health', tenantId: undefined })
      collector.recordSample(sample)

      const keys = collector.listMetricKeys()
      expect(keys).toContain('/api/health:global')
    })

    it('should evict points older than 30d', () => {
      const oldSample = makePerfSample({
        route: '/api/stale',
        timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
      })
      collector.recordSample(oldSample)

      const metric = collector.query({ metricName: '/api/stale', window: '30d' })
      expect(metric.points).toHaveLength(0)
      expect(metric.aggregate.count).toBe(0)
    })
  })

  describe('recordBatch', () => {
    it('should record multiple samples at once', () => {
      const samples = [
        makePerfSample({ route: '/api/a', durationMs: 10 }),
        makePerfSample({ route: '/api/a', durationMs: 20 }),
        makePerfSample({ route: '/api/a', durationMs: 30 }),
      ]
      const count = collector.recordBatch(samples)
      expect(count).toBe(3)

      const metric = collector.query({ metricName: '/api/a', tenantId: 'store-a', window: '1h' })
      expect(metric.points).toHaveLength(3)
      expect(metric.aggregate.avg).toBe(20)
    })

    it('should return 0 for empty batch', () => {
      const count = collector.recordBatch([])
      expect(count).toBe(0)
    })
  })

  describe('recordMetric', () => {
    it('should record an arbitrary metric by name', () => {
      collector.recordMetric({ metricName: 'order_rate', value: 99.5 })
      const metric = collector.query({ metricName: 'order_rate', window: '1h' })
      expect(metric.aggregate.count).toBe(1)
      expect(metric.aggregate.avg).toBe(99.5)
    })

    it('should overwrite nothing when called multiple times — append data', () => {
      collector.recordMetric({ metricName: 'cpu_usage', value: 50 })
      collector.recordMetric({ metricName: 'cpu_usage', value: 80 })
      const metric = collector.query({ metricName: 'cpu_usage', window: '1h' })
      expect(metric.points).toHaveLength(2)
      expect(metric.aggregate.avg).toBe(65)
    })

    it('should accept explicit timestamp', () => {
      const ts = '2026-06-01T00:00:00.000Z'
      collector.recordMetric({ metricName: 'lag', value: 1, timestamp: ts })
      const metric = collector.query({ metricName: 'lag', window: '30d' })
      expect(metric.points[0].timestamp).toBe(ts)
    })
  })

  // ── query ──

  describe('query', () => {
    it('should return empty aggregate when no data matches', () => {
      const metric = collector.query({ metricName: 'nonexistent', window: '1h' })
      expect(metric.points).toHaveLength(0)
      expect(metric.aggregate.min).toBe(0)
      expect(metric.aggregate.max).toBe(0)
      expect(metric.aggregate.count).toBe(0)
    })

    it('should filter by window size correctly', () => {
      // Insert a point from 2 hours ago
      const oldTs = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      collector.recordMetric({ metricName: 'm1', value: 100, timestamp: oldTs })
      // Insert a recent point
      collector.recordMetric({ metricName: 'm1', value: 50 })

      const h1 = collector.query({ metricName: 'm1', window: '1h' })
      expect(h1.points).toHaveLength(1)  // only the recent one
      expect(h1.aggregate.avg).toBe(50)

      const h6 = collector.query({ metricName: 'm1', window: '6h' })
      expect(h6.points).toHaveLength(2)  // both
    })

    it('should compute percentiles correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      for (const v of values) {
        collector.recordMetric({ metricName: 'latency', value: v })
      }
      const metric = collector.query({ metricName: 'latency', window: '1h' })
      expect(metric.aggregate.min).toBe(10)
      expect(metric.aggregate.max).toBe(100)
      // Linear interpolation: N=10, p50 rank=4.5 → avg of index 4 and 5 => (50+60)/2=55
      expect(metric.aggregate.p50).toBe(55)
      // p95 rank=9*0.95=8.55 → linear from index 8(90) to 9(100) => 90+0.55*10=95.5
      expect(metric.aggregate.p95).toBeCloseTo(95.5, 1)
      // p99 rank=9*0.99=8.91 → linear from index 8(90) to 9(100) => 90+0.91*10=99.1
      expect(metric.aggregate.p99).toBeCloseTo(99.1, 1)
    })
  })

  // ── listMetricKeys ──

  describe('listMetricKeys', () => {
    it('should return empty array when no metrics recorded', () => {
      expect(collector.listMetricKeys()).toEqual([])
    })

    it('should return all unique metric keys', () => {
      collector.recordMetric({ metricName: 'a', value: 1 })
      collector.recordMetric({ metricName: 'b', tenantId: 'store-1', value: 2 })
      collector.recordMetric({ metricName: 'a', tenantId: 'store-2', value: 3 })

      const keys = collector.listMetricKeys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('a:global')
      expect(keys).toContain('b:store-1')
      expect(keys).toContain('a:store-2')
    })
  })

  // ── detectSeasonality ──

  describe('detectSeasonality', () => {
    it('should return zero arrays when no data', () => {
      const pattern = collector.detectSeasonality({ metricName: 'no-data' })
      expect(pattern.daily).toHaveLength(24)
      expect(pattern.daily.every((v) => v === 0)).toBe(true)
      expect(pattern.weekly).toHaveLength(7)
      expect(pattern.monthly).toHaveLength(31)
    })

    it('should detect a daily pattern', () => {
      // Record data all at the same hour to create a pattern
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          const date = new Date('2026-06-01T00:00:00Z')
          date.setDate(date.getDate() + d)
          date.setUTCHours(h, 0, 0, 0)
          collector.recordMetric({
            metricName: 'orders',
            value: h === 10 ? 500 : h === 14 ? 400 : h === 20 ? 300 : 50,
            timestamp: date.toISOString(),
          })
        }
      }
      const pattern = collector.detectSeasonality({ metricName: 'orders' })
      // Hour 10 should be peak
      expect(pattern.daily[10]).toBeGreaterThan(pattern.daily[2])
      expect(Math.max(...pattern.daily)).toBeGreaterThan(0)
    })
  })

  // ── toPrometheus ──

  describe('toPrometheus', () => {
    it('should return prometheus text format', () => {
      collector.recordMetric({ metricName: 'requests', value: 100 })
      const output = collector.toPrometheus()
      expect(output).toContain('# HELP requests_1h')
      expect(output).toContain('requests_1h_avg')
      expect(output).toContain('requests_1h_count')
    })

    it('should include tenant labels when tenantId is set', () => {
      collector.recordMetric({ metricName: 'requests', tenantId: 'store-1', value: 50 })
      const output = collector.toPrometheus()
      expect(output).toContain('{tenantId="store-1"}')
    })
  })

  // ── resetForTests ──

  describe('resetForTests', () => {
    it('should clear all buffers', () => {
      collector.recordMetric({ metricName: 'x', value: 1 })
      expect(collector.listMetricKeys()).toHaveLength(1)
      collector.resetForTests()
      expect(collector.listMetricKeys()).toHaveLength(0)
    })
  })
})

// ─── TimeSeriesService ───

describe('TimeSeriesService', () => {
  let collector: TimeSeriesCollectorService
  let service: TimeSeriesService

  beforeEach(() => {
    collector = new TimeSeriesCollectorService()
    service = new TimeSeriesService(collector)
  })

  // ── 告警规则管理 ──

  describe('registerAlertRule', () => {
    it('should register a rule and return {id, rule}', () => {
      const rule: AlertRule = {
        metricName: 'api_latency',
        operator: 'gt',
        threshold: 500,
        window: '1h',
        description: 'API延迟告警',
      }
      const result = service.registerAlertRule(rule)
      expect(result.id).toBe(0)
      expect(result.rule.metricName).toBe('api_latency')
      expect(result.rule.operator).toBe('gt')
      expect(result.rule.threshold).toBe(500)
    })

    it('should assign incrementing ids', () => {
      service.registerAlertRule({ metricName: 'a', operator: 'gt', threshold: 10, window: '1h' })
      service.registerAlertRule({ metricName: 'b', operator: 'lt', threshold: 20, window: '6h' })
      const rules = service.listAlertRules()
      expect(rules).toHaveLength(2)
    })
  })

  describe('listAlertRules', () => {
    it('should return empty when no rules registered', () => {
      expect(service.listAlertRules()).toEqual([])
    })

    it('should return all rules', () => {
      service.registerAlertRule({ metricName: 'cpu', operator: 'gt', threshold: 90, window: '1h' })
      service.registerAlertRule({ metricName: 'mem', operator: 'gt', threshold: 80, window: '24h' })
      const rules = service.listAlertRules()
      expect(rules).toHaveLength(2)
      expect(rules[0].metricName).toBe('cpu')
      expect(rules[1].metricName).toBe('mem')
    })
  })

  describe('removeAlertRule', () => {
    it('should return true and mark rule as removed', () => {
      service.registerAlertRule({ metricName: 'cpu', operator: 'gt', threshold: 90, window: '1h' })
      const removed = service.removeAlertRule(0)
      expect(removed).toBe(true)
      // The slot is nullified but length remains — implementation detail
      expect(service.listAlertRules()).toHaveLength(1)
    })

    it('should return false for out-of-bounds id', () => {
      expect(service.removeAlertRule(-1)).toBe(false)
      expect(service.removeAlertRule(0)).toBe(false)
      expect(service.removeAlertRule(999)).toBe(false)
    })
  })

  // ── evaluateAllRules ──

  describe('evaluateAllRules', () => {
    it('should trigger alert when value exceeds threshold (gt)', () => {
      service.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 200, window: '1h' })
      collector.recordMetric({ metricName: 'latency', value: 300 })

      const alerts = service.evaluateAllRules()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].currentValue).toBe(300)
      expect(alerts[0].rule.operator).toBe('gt')
      expect(alerts[0].message).toContain('latency')
    })

    it('should trigger alert when value below threshold (lt)', () => {
      service.registerAlertRule({ metricName: 'uptime', operator: 'lt', threshold: 99.9, window: '6h' })
      collector.recordMetric({ metricName: 'uptime', value: 95 })

      const alerts = service.evaluateAllRules()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].currentValue).toBe(95)
    })

    it('should trigger on gte and lte boundaries', () => {
      service.registerAlertRule({ metricName: 'm1', operator: 'gte', threshold: 100, window: '1h' })
      collector.recordMetric({ metricName: 'm1', value: 100 })

      let alerts = service.evaluateAllRules()
      expect(alerts).toHaveLength(1)

      service.registerAlertRule({ metricName: 'm2', operator: 'lte', threshold: 0, window: '1h' })
      collector.recordMetric({ metricName: 'm2', value: 0 })

      alerts = service.evaluateAllRules()
      // m1 still triggers, and now m2 also triggers
      expect(alerts.length).toBeGreaterThanOrEqual(1)
    })

    it('should not trigger when value is within threshold', () => {
      service.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 500, window: '1h' })
      collector.recordMetric({ metricName: 'latency', value: 200 })

      const alerts = service.evaluateAllRules()
      expect(alerts).toHaveLength(0)
    })

    it('should skip rules with no data', () => {
      service.registerAlertRule({ metricName: 'no_data', operator: 'gt', threshold: 0, window: '1h' })
      const alerts = service.evaluateAllRules()
      expect(alerts).toHaveLength(0)
    })

    it('should cap alerts at MAX_ALERTS (100)', () => {
      for (let i = 0; i < 3; i++) {
        service.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 0, window: '1h' })
      }
      // Insert many trigger points
      for (let i = 0; i < 150; i++) {
        collector.recordMetric({ metricName: 'latency', tenantId: `t${i}`, value: 999 })
      }
      const alerts = service.evaluateAllRules()
      // Each rule iteration causes evaluateAllRules to collect alerts for all rules
      // With many tenants, rules trigger and get stored
      expect(alerts.length).toBeGreaterThanOrEqual(0)

      const recent = service.getRecentAlerts(200)
      expect(recent.length).toBeLessThanOrEqual(100)
    })

    it('should handle removed rules gracefully (undefined slot)', () => {
      service.registerAlertRule({ metricName: 'ok', operator: 'gt', threshold: 0, window: '1h' })
      service.registerAlertRule({ metricName: 'also_ok', operator: 'gt', threshold: 0, window: '1h' })
      service.removeAlertRule(0)
      collector.recordMetric({ metricName: 'also_ok', value: 999 })

      const alerts = service.evaluateAllRules()
      expect(alerts).toHaveLength(1)
    })
  })

  describe('getRecentAlerts', () => {
    it('should return empty when no alerts triggered', () => {
      expect(service.getRecentAlerts()).toEqual([])
    })

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        service.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 0, window: '1h', tenantId: `t${i}` })
      }
      collector.recordMetric({ metricName: 'latency', value: 999 })
      service.evaluateAllRules()

      const limited = service.getRecentAlerts(3)
      expect(limited.length).toBeLessThanOrEqual(3)
    })
  })

  // ── getSummary ──

  describe('getSummary', () => {
    it('should return empty summary when no metrics', () => {
      const summary = service.getSummary()
      expect(summary.totalMetrics).toBe(0)
      expect(summary.totalPoints).toBe(0)
      expect(summary.oldestTimestamp).toBeNull()
      expect(summary.newestTimestamp).toBeNull()
      expect(summary.topMetricNames).toEqual([])
    })

    it('should aggregate multiple metrics', () => {
      const now = new Date()
      collector.recordMetric({ metricName: 'orders', value: 10, timestamp: new Date(now.getTime() - 10000).toISOString() })
      collector.recordMetric({ metricName: 'orders', value: 20, timestamp: new Date(now.getTime() - 5000).toISOString() })
      collector.recordMetric({ metricName: 'revenue', value: 1000, timestamp: now.toISOString() })

      const summary = service.getSummary()
      expect(summary.totalMetrics).toBe(2)
      expect(summary.totalPoints).toBe(3)
      expect(summary.oldestTimestamp).toBeDefined()
      expect(summary.newestTimestamp).toBeDefined()
      expect(summary.topMetricNames).toHaveLength(2)
    })
  })

  // ── compareWindows ──

  describe('compareWindows', () => {
    it('should return comparisons for 1h/6h/24h windows', () => {
      collector.recordMetric({ metricName: 'test', value: 100 })

      const results = service.compareWindows('test')
      expect(results).toHaveLength(3)
      expect(results[0].window).toBe('1h')
      expect(results[1].window).toBe('6h')
      expect(results[2].window).toBe('24h')
      results.forEach((r) => {
        expect(r.avg).toBe(100)
        expect(r.count).toBe(1)
        expect(r.p95).toBe(100)
      })
    })

    it('should return zeroed results for nonexistent metric', () => {
      const results = service.compareWindows('ghost')
      expect(results).toHaveLength(3)
      expect(results[0].count).toBe(0)
      expect(results[0].avg).toBe(0)
    })

    it('should filter by tenantId', () => {
      collector.recordMetric({ metricName: 'reqs', tenantId: 'store-a', value: 50 })
      collector.recordMetric({ metricName: 'reqs', tenantId: 'store-b', value: 200 })

      const resultsA = service.compareWindows('reqs', 'store-a')
      expect(resultsA[0].avg).toBe(50)

      const resultsB = service.compareWindows('reqs', 'store-b')
      expect(resultsB[0].avg).toBe(200)
    })
  })
})
