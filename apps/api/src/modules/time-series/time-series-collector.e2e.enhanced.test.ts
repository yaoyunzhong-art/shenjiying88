/**
 * time-series-collector.e2e.enhanced.test.ts — 时序采集模块增强E2E测试
 *
 * 覆盖: 数据采集、聚合查询、异常检测、补采机制、多维度分析、
 *       存储策略、过期清理、数据导出、多租户、季节性模式等
 *
 * 总计: 30 个测试用例 (it/test)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { TimeSeriesCollectorService } from './time-series-collector.service'

function makeSample(overrides: Partial<{
  route: string
  durationMs: number
  statusCode: number
  timestamp: string
  tenantId: string
}> = {}) {
  return {
    route: overrides.route ?? '/api/test',
    durationMs: overrides.durationMs ?? 100,
    statusCode: overrides.statusCode ?? 200,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    ...(overrides.tenantId ? { tenantId: overrides.tenantId } : {}),
  }
}

describe('TimeSeriesCollector E2E enhanced — 30 tests', () => {
  let service: TimeSeriesCollectorService

  beforeEach(() => {
    service = new TimeSeriesCollectorService()
  })

  // ═══════════════ 数据采集 (Data Collection) ═══════════════

  it('T01: recordSample — 记录单个样本后query可查到', () => {
    service.recordSample(makeSample({ route: '/api/users', durationMs: 50 }))
    const metric = service.query({ metricName: '/api/users', window: '1h' })
    expect(metric.points.length).toBe(1)
    expect(metric.aggregate.count).toBe(1)
    expect(metric.aggregate.avg).toBe(50)
  })

  it('T02: recordSample — 多样本聚合平均值正确', () => {
    const samples = [10, 20, 30, 40, 50]
    for (const v of samples) {
      service.recordSample(makeSample({ route: '/api/orders', durationMs: v }))
    }
    const metric = service.query({ metricName: '/api/orders', window: '1h' })
    expect(metric.aggregate.count).toBe(5)
    expect(metric.aggregate.avg).toBe(30)
    expect(metric.aggregate.min).toBe(10)
    expect(metric.aggregate.max).toBe(50)
  })

  it('T03: recordSample — 不同路由各自独立存储', () => {
    service.recordSample(makeSample({ route: '/api/a', durationMs: 100 }))
    service.recordSample(makeSample({ route: '/api/b', durationMs: 200 }))
    const a = service.query({ metricName: '/api/a', window: '1h' })
    const b = service.query({ metricName: '/api/b', window: '1h' })
    expect(a.aggregate.avg).toBe(100)
    expect(b.aggregate.avg).toBe(200)
  })

  it('T04: recordMetric — 直接写入任意metric', () => {
    service.recordMetric({ metricName: 'cpu_usage', value: 78.5 })
    const metric = service.query({ metricName: 'cpu_usage', window: '1h' })
    expect(metric.aggregate.count).toBe(1)
    expect(metric.aggregate.avg).toBe(78.5)
  })

  it('T05: recordMetric — 写入时间戳权重', () => {
    const now = Date.now()
    service.recordMetric({
      metricName: 'memory_usage',
      value: 1024,
      timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
    })
    const metric = service.query({ metricName: 'memory_usage', window: '1h' })
    expect(metric.points[0].value).toBe(1024)
    expect(new Date(metric.points[0].timestamp).getTime()).toBeLessThan(now)
  })

  it('T06: recordBatch — 批量写入返回计数', () => {
    const samples = [
      makeSample({ route: '/api/x' }),
      makeSample({ route: '/api/y' }),
      makeSample({ route: '/api/z' }),
    ]
    const count = service.recordBatch(samples)
    expect(count).toBe(3)
  })

  it('T07: recordBatch — 批量写入后全部可查', () => {
    service.recordBatch([
      makeSample({ route: '/api/batch-1' }),
      makeSample({ route: '/api/batch-2' }),
    ])
    const k1 = service.query({ metricName: '/api/batch-1', window: '1h' })
    const k2 = service.query({ metricName: '/api/batch-2', window: '1h' })
    expect(k1.aggregate.count).toBe(1)
    expect(k2.aggregate.count).toBe(1)
  })

  // ═══════════════ 聚合查询 (Aggregation Query) ═══════════════

  it('T08: 分位数 — p50/p95/p99 计算正确', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for (const v of values) {
      service.recordMetric({ metricName: 'percentile_test', value: v })
    }
    const metric = service.query({ metricName: 'percentile_test', window: '1h' })
    expect(metric.aggregate.p50).toBe(5.5)
    expect(metric.aggregate.p95).toBeCloseTo(9.55, 1)
    expect(metric.aggregate.p99).toBeCloseTo(9.91, 1)
  })

  it('T09: 聚合 — 空窗口返回count=0', () => {
    const metric = service.query({ metricName: 'nonexistent', window: '1h' })
    expect(metric.aggregate.count).toBe(0)
    expect(metric.aggregate.min).toBe(0)
    expect(metric.aggregate.max).toBe(0)
    expect(metric.aggregate.avg).toBe(0)
    expect(metric.points).toHaveLength(0)
  })

  it('T10: 聚合 — 单点数据p50等于该值', () => {
    service.recordMetric({ metricName: 'single_point', value: 42 })
    const metric = service.query({ metricName: 'single_point', window: '1h' })
    expect(metric.aggregate.p50).toBe(42)
    expect(metric.aggregate.p95).toBe(42)
    expect(metric.aggregate.p99).toBe(42)
  })

  it('T11: 不同窗口 — 1h/6h/24h 返回不同数据', () => {
    const now = Date.now()
    service.recordMetric({
      metricName: 'window_test',
      value: 10,
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),   // 5min ago → 1h
    })
    service.recordMetric({
      metricName: 'window_test',
      value: 20,
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(), // 3h ago → 6h only
    })
    const h1 = service.query({ metricName: 'window_test', window: '1h' })
    const h6 = service.query({ metricName: 'window_test', window: '6h' })
    expect(h1.aggregate.count).toBe(1)
    expect(h6.aggregate.count).toBe(2)
  })

  // ═══════════════ 异常检测 (Anomaly Detection) ═══════════════

  it('T12: 季节指数 — 无周期数据返回0', () => {
    // 少于24个点
    for (let i = 0; i < 10; i++) {
      service.recordMetric({ metricName: 'flat', value: 100 })
    }
    const metric = service.query({ metricName: 'flat', window: '1h' })
    expect(metric.seasonality).toBe(0)
  })

  it('T13: 季节指数 — 强周期性数据返回>0', () => {
    // 168 个点: 周一低谷 50, 周末高峰 200
    const base = Date.parse('2026-07-20T00:00:00Z') // Monday
    for (let day = 0; day < 7; day++) {
      const val = [50, 60, 70, 80, 90, 200, 220][day]
      for (let h = 0; h < 24; h++) {
        service.recordMetric({
          metricName: 'strong_seasonal',
          value: val,
          timestamp: new Date(base + day * 86400000 + h * 3600000).toISOString(),
        })
      }
    }
    const metric = service.query({ metricName: 'strong_seasonal', window: '30d' })
    expect(metric.seasonality).toBeGreaterThan(0)
  })

  it('T14: detectSeasonality — 返回daily/weekly/monthly模式', () => {
    const base = Date.parse('2026-07-20T00:00:00Z')
    for (let day = 0; day < 7; day++) {
      for (let h = 0; h < 24; h++) {
        service.recordMetric({
          metricName: 'pattern_detect',
          value: 100 + day * 10 + h,
          timestamp: new Date(base + day * 86400000 + h * 3600000).toISOString(),
        })
      }
    }
    const pattern = service.detectSeasonality({ metricName: 'pattern_detect' })
    expect(pattern.daily).toHaveLength(24)
    expect(pattern.weekly).toHaveLength(7)
    expect(pattern.monthly).toHaveLength(31)
    // Daily应该有差异
    expect(pattern.daily[0]).not.toBe(pattern.daily[23])
  })

  // ═══════════════ 补采机制 (Backfill Mechanism) ═══════════════

  it('T15: 补采 — 历史时间戳数据能被正确记录', () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    service.recordSample(makeSample({
      route: '/api/backfill',
      durationMs: 150,
      timestamp: new Date(oneDayAgo).toISOString(),
    }))
    // 24h窗口可查到
    const d1 = service.query({ metricName: '/api/backfill', window: '24h' })
    expect(d1.aggregate.count).toBe(1)
    // 1h窗口查不到
    const h1 = service.query({ metricName: '/api/backfill', window: '1h' })
    expect(h1.aggregate.count).toBe(0)
  })

  it('T16: 补采 — 批量补采旧数据后7d窗口正确', () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    service.recordBatch([
      makeSample({ route: '/api/bulk_backfill', durationMs: 100, timestamp: new Date(sevenDaysAgo).toISOString() }),
      makeSample({ route: '/api/bulk_backfill', durationMs: 200, timestamp: new Date(sevenDaysAgo).toISOString() }),
    ])
    // 7d可查
    const d7 = service.query({ metricName: '/api/bulk_backfill', window: '7d' })
    expect(d7.aggregate.count).toBe(2)
    expect(d7.aggregate.avg).toBe(150)
  })

  // ═══════════════ 多维度分析 (Multi-Dimension Analysis) ═══════════════

  it('T17: 多租户隔离 — tenantA只看到自己的数据', () => {
    service.recordSample(makeSample({ route: '/api/multi', durationMs: 10, tenantId: 'tenant-A' }))
    service.recordSample(makeSample({ route: '/api/multi', durationMs: 20, tenantId: 'tenant-B' }))
    const a = service.query({ metricName: '/api/multi', tenantId: 'tenant-A', window: '1h' })
    const b = service.query({ metricName: '/api/multi', tenantId: 'tenant-B', window: '1h' })
    expect(a.aggregate.avg).toBe(10)
    expect(b.aggregate.avg).toBe(20)
    expect(a.aggregate.count).toBe(1)
    expect(b.aggregate.count).toBe(1)
  })

  it('T18: 多租户 — tenantId在metricKey中隔离', () => {
    service.recordSample(makeSample({ route: '/api/orders', durationMs: 50, tenantId: 't1' }))
    service.recordSample(makeSample({ route: '/api/orders', durationMs: 100, tenantId: 't1' }))
    service.recordSample(makeSample({ route: '/api/orders', durationMs: 200, tenantId: 't2' }))
    const t1 = service.query({ metricName: '/api/orders', tenantId: 't1', window: '1h' })
    const t2 = service.query({ metricName: '/api/orders', tenantId: 't2', window: '1h' })
    expect(t1.aggregate.avg).toBe(75)
    expect(t2.aggregate.avg).toBe(200)
  })

  it('T19: global和tenant租户数据隔离', () => {
    service.recordSample(makeSample({ route: '/api/isolated', durationMs: 100 }))
    service.recordSample(makeSample({ route: '/api/isolated', durationMs: 200, tenantId: 'tenant-X' }))
    const global = service.query({ metricName: '/api/isolated', window: '1h' })
    const tx = service.query({ metricName: '/api/isolated', tenantId: 'tenant-X', window: '1h' })
    expect(global.aggregate.count).toBe(1)
    expect(tx.aggregate.count).toBe(1)
  })

  // ═══════════════ 存储策略 (Storage Strategy) ═══════════════

  it('T20: listMetricKeys — 列出所有已记录key', () => {
    service.recordSample(makeSample({ route: '/api/alpha' }))
    service.recordSample(makeSample({ route: '/api/beta' }))
    const keys = service.listMetricKeys()
    expect(keys).toContain('/api/alpha:global')
    expect(keys).toContain('/api/beta:global')
  })

  it('T21: listMetricKeys — 包含tenantId后缀', () => {
    service.recordSample(makeSample({ route: '/api/shared', tenantId: 'tenant-A' }))
    const keys = service.listMetricKeys()
    expect(keys).toContain('/api/shared:tenant-A')
  })

  it('T22: 同一metric多次写入后list不重复', () => {
    service.recordSample(makeSample({ route: '/api/dupe' }))
    service.recordSample(makeSample({ route: '/api/dupe' }))
    const keys = service.listMetricKeys()
    const matches = keys.filter(k => k.startsWith('/api/dupe:'))
    expect(matches).toHaveLength(1)
  })

  // ═══════════════ 过期清理 (Expiration Cleanup) ═══════════════

  it('T23: 过期数据 — 超过30d的数据自动清理', () => {
    const oldTimestamp = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    service.recordSample(makeSample({
      route: '/api/expired',
      durationMs: 999,
      timestamp: oldTimestamp,
    }))
    // 写入后清理触发，旧点应被清除
    const d30 = service.query({ metricName: '/api/expired', window: '30d' })
    expect(d30.aggregate.count).toBe(0)
  })

  it('T24: 过期清理 — 边界时间保留', () => {
    const borderline = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
    service.recordSample(makeSample({
      route: '/api/border',
      durationMs: 50,
      timestamp: borderline,
    }))
    const d30 = service.query({ metricName: '/api/border', window: '30d' })
    expect(d30.aggregate.count).toBe(1)
  })

  it('T25: 窗口过滤 — 1h窗口排除旧数据', () => {
    const hourAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString() // 1.5h ago
    const recent = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30min ago
    service.recordSample(makeSample({ route: '/api/filter', durationMs: 100, timestamp: hourAgo }))
    service.recordSample(makeSample({ route: '/api/filter', durationMs: 200, timestamp: recent }))
    const h1 = service.query({ metricName: '/api/filter', window: '1h' })
    expect(h1.aggregate.count).toBe(1)
    expect(h1.aggregate.avg).toBe(200)
  })

  // ═══════════════ 数据导出 (Data Export) ═══════════════

  it('T26: toPrometheus — 无数据时返回空字符串', () => {
    const prom = service.toPrometheus()
    expect(prom).toBe('')
  })

  it('T27: toPrometheus — 单metric导出格式正确', () => {
    service.recordSample(makeSample({ route: '/api/exporter', durationMs: 50 }))
    const prom = service.toPrometheus()
    expect(prom).toContain('# HELP /api/exporter_1h')
    expect(prom).toContain('# TYPE /api/exporter_1h summary')
    expect(prom).toContain('/api/exporter_1h_avg')
    expect(prom).toContain('/api/exporter_1h_p95')
    expect(prom).toContain('/api/exporter_1h_p99')
    expect(prom).toContain('/api/exporter_1h_count')
  })

  it('T28: toPrometheus — 多窗口导出', () => {
    service.recordSample(makeSample({ route: '/api/multiwin', durationMs: 30 }))
    const prom = service.toPrometheus()
    expect(prom).toContain('/api/multiwin_1h_avg')
    expect(prom).toContain('/api/multiwin_6h_avg')
    expect(prom).toContain('/api/multiwin_24h_avg')
    expect(prom).toContain('/api/multiwin_7d_avg')
    expect(prom).toContain('/api/multiwin_30d_avg')
  })

  it('T29: toPrometheus — 多租户导出带tenant标签', () => {
    service.recordSample(makeSample({ route: '/api/tenanted', durationMs: 15, tenantId: 't99' }))
    const prom = service.toPrometheus()
    expect(prom).toContain('{tenantId="t99"}')
  })

  // ═══════════════ 综合场景 (Integration Scenarios) ═══════════════

  it('T30: 综合场景 — 完整写入→查询→导出链路', () => {
    // 写入多种数据
    service.recordSample(makeSample({ route: '/api/scenario', durationMs: 50 }))
    service.recordSample(makeSample({ route: '/api/scenario', durationMs: 150 }))
    service.recordSample(makeSample({ route: '/api/scenario', durationMs: 100, tenantId: 't-scenario' }))

    // 验证查询
    const global = service.query({ metricName: '/api/scenario', window: '1h' })
    expect(global.aggregate.avg).toBe(100)
    expect(global.aggregate.count).toBe(2)

    // 验证多租户
    const tenanted = service.query({ metricName: '/api/scenario', tenantId: 't-scenario', window: '1h' })
    expect(tenanted.aggregate.avg).toBe(100)
    expect(tenanted.aggregate.count).toBe(1)

    // 验证key
    const keys = service.listMetricKeys()
    expect(keys).toContain('/api/scenario:global')
    expect(keys).toContain('/api/scenario:t-scenario')

    // 验证导出
    const prom = service.toPrometheus()
    expect(prom).toContain('/api/scenario_1h_avg')
  })
})
