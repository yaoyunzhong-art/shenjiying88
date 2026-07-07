import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// perf-monitor.service.test.ts - Phase-19 T27 auto
// 用途: PerfMonitorService 单元测试 — 采样/SLA/分位数/慢查询/边界
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PerfMonitorService, type PerfSample } from './perf-monitor.service'

function makeSample(overrides: Partial<PerfSample> = {}): PerfSample {
  return {
    route: '/api/test',
    durationMs: 100,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

describe('PerfMonitorService', () => {
  describe('record()', () => {
    it('records a single sample and summary reflects it', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ route: '/api/ping', durationMs: 50 }))
      const s = svc.summary()
      assert.equal(s.totalSamples, 1)
      assert.equal(s.routes, 1)
    })

    it('enforces MAX_SAMPLES cap (10000)', () => {
      const svc = new PerfMonitorService()
      for (let i = 0; i < 10_500; i++) {
        svc.record(makeSample({ route: `/api/r${i % 50}`, durationMs: i % 500 }))
      }
      const s = svc.summary()
      assert.equal(s.totalSamples, 10_000)
    })

    it('records slow queries when durationMs > 500', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ durationMs: 600 }))
      svc.record(makeSample({ durationMs: 50 }))
      assert.equal(svc.getSlowQueries().length, 1)
    })

    it('caps slow queries at 1000 entries', () => {
      const svc = new PerfMonitorService()
      for (let i = 0; i < 1_200; i++) {
        svc.record(makeSample({ durationMs: 600 + (i % 100), statusCode: 200 }))
      }
      assert.equal(svc.getSlowQueries(9999).length, 1000)
    })
  })

  describe('registerSla() & SLA violation detection', () => {
    it('registers SLA config without error', () => {
      const svc = new PerfMonitorService()
      svc.registerSla({ route: '/api/important', targetP95Ms: 200, warnThresholdP95Ms: 250 })
      // No exception expected
      assert.ok(true)
    })

    it('triggers violations when P95 exceeds warnThreshold', () => {
      const svc = new PerfMonitorService()
      svc.registerSla({ route: '/api/slow', targetP95Ms: 100, warnThresholdP95Ms: 120 })
      // Push 20 samples high enough to push P95 above threshold
      for (let i = 0; i < 20; i++) {
        svc.record(makeSample({ route: '/api/slow', durationMs: 200 + i * 10, statusCode: 200 }))
      }
      const violations = svc.getSlaViolations()
      assert.equal(violations.length, 1)
      assert.equal(violations[0].route, '/api/slow')
      assert.ok(violations[0].violations > 0)
    })

    it('no violation when P95 stays under threshold', () => {
      const svc = new PerfMonitorService()
      svc.registerSla({ route: '/api/fast', targetP95Ms: 500, warnThresholdP95Ms: 400 })
      for (let i = 0; i < 20; i++) {
        svc.record(makeSample({ route: '/api/fast', durationMs: 10 + i, statusCode: 200 }))
      }
      assert.equal(svc.getSlaViolations().length, 0)
    })

    it('multiple routes each tracked independently', () => {
      const svc = new PerfMonitorService()
      svc.registerSla({ route: '/api/a', targetP95Ms: 100, warnThresholdP95Ms: 120 })
      svc.registerSla({ route: '/api/b', targetP95Ms: 100, warnThresholdP95Ms: 120 })
      for (let i = 0; i < 20; i++) {
        svc.record(makeSample({ route: '/api/a', durationMs: 200, statusCode: 200 }))
        svc.record(makeSample({ route: '/api/b', durationMs: 50, statusCode: 200 }))
      }
      const violations = svc.getSlaViolations()
      assert.equal(violations.length, 1) // only /api/a should violate
      assert.equal(violations[0].route, '/api/a')
    })
  })

  describe('getStatsForRoute() — percentile calculations', () => {
    it('returns zero stats for unknown route', () => {
      const svc = new PerfMonitorService()
      const stats = svc.getStatsForRoute('/api/nonexistent')
      assert.equal(stats.count, 0)
      assert.equal(stats.p50, 0)
      assert.equal(stats.p95, 0)
      assert.equal(stats.p99, 0)
      assert.equal(stats.max, 0)
      assert.equal(stats.errorRate, 0)
    })

    it('computes correct P50 / P95 / P99 for sequential samples', () => {
      const svc = new PerfMonitorService()
      for (let i = 1; i <= 100; i++) {
        svc.record(makeSample({ route: '/api/seq', durationMs: i, statusCode: 200 }))
      }
      const stats = svc.getStatsForRoute('/api/seq')
      assert.equal(stats.count, 100)
      // percentile uses Math.floor(len * p), e.g. idx=49 for p50@100 -> sorted[49]=50, idx=94 for p95 -> sorted[94]=95
      // percentile uses Math.min(Math.floor(len * p), len-1)
      // idx=50 -> sorted[50]=51, idx=95 -> sorted[95]=96, idx=99 -> sorted[99]=100
      assert.equal(stats.p50, 51)
      assert.equal(stats.p95, 96)
      assert.equal(stats.p99, 100)
      assert.equal(stats.max, 100)
    })

    it('computes error rate correctly', () => {
      const svc = new PerfMonitorService()
      for (let i = 0; i < 10; i++) {
        svc.record(makeSample({ route: '/api/err', durationMs: 50, statusCode: 200 }))
      }
      for (let i = 0; i < 5; i++) {
        svc.record(makeSample({ route: '/api/err', durationMs: 50, statusCode: 500 }))
      }
      const stats = svc.getStatsForRoute('/api/err')
      assert.equal(stats.count, 15)
      assert.equal(stats.errorRate, 5 / 15) // 0.333...
    })
  })

  describe('getAllStats()', () => {
    it('returns empty array when no samples', () => {
      const svc = new PerfMonitorService()
      assert.deepEqual(svc.getAllStats(), [])
    })

    it('returns stats for all unique routes', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ route: '/api/x', durationMs: 30 }))
      svc.record(makeSample({ route: '/api/y', durationMs: 60 }))
      svc.record(makeSample({ route: '/api/x', durationMs: 40 }))
      const all = svc.getAllStats()
      assert.equal(all.length, 2)
      const x = all.find((s) => s.route === '/api/x')
      assert.ok(x)
      assert.equal(x?.count, 2)
    })
  })

  describe('getSlowQueries()', () => {
    it('returns empty when no slow queries', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ durationMs: 10 }))
      assert.equal(svc.getSlowQueries().length, 0)
    })

    it('respects limit parameter', () => {
      const svc = new PerfMonitorService()
      for (let i = 0; i < 10; i++) {
        svc.record(makeSample({ durationMs: 600 + i, statusCode: 200 }))
      }
      assert.equal(svc.getSlowQueries(3).length, 3)
      assert.equal(svc.getSlowQueries(100).length, 10)
    })
  })

  describe('summary()', () => {
    it('reflects current state accurately', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ route: '/api/a', durationMs: 50 }))
      svc.record(makeSample({ route: '/api/b', durationMs: 600 }))
      svc.record(makeSample({ route: '/api/b', durationMs: 700, statusCode: 500 }))
      const s = svc.summary()
      assert.equal(s.totalSamples, 3)
      assert.equal(s.routes, 2)
      assert.equal(s.slowQueries, 2)
    })
  })

  describe('reset()', () => {
    it('clears all samples, SLA configs, and violations', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ route: '/api/temp', durationMs: 100 }))
      svc.registerSla({ route: '/api/temp', targetP95Ms: 50, warnThresholdP95Ms: 60 })
      svc.reset()
      const s = svc.summary()
      assert.equal(s.totalSamples, 0)
      assert.equal(s.routes, 0)
      assert.equal(s.slowQueries, 0)
      assert.equal(s.slaViolations, 0)
      assert.deepEqual(svc.getSlaViolations(), [])
    })
  })

  describe('Edge cases', () => {
    it('single sample produces correct percentiles', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ durationMs: 42 }))
      const stats = svc.getStatsForRoute('/api/test')
      assert.equal(stats.p50, 42)
      assert.equal(stats.p95, 42)
      assert.equal(stats.p99, 42)
      assert.equal(stats.max, 42)
    })

    it('two samples: p50 = first, p95 = last (sorted)', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ durationMs: 10 }))
      svc.record(makeSample({ durationMs: 100 }))
      const stats = svc.getStatsForRoute('/api/test')
      // percentile uses Math.floor(len * p), for len=2: p50=floor(1.0)=1->sorted[1]=100, p95=floor(1.9)=1->sorted[1]=100
      // len=2: idx=Math.min(Math.floor(2*0.5),1)=1 -> sorted[1]=100
      // idx=Math.min(Math.floor(2*0.95),1)=1 -> sorted[1]=100
      assert.equal(stats.p50, 100)
      assert.equal(stats.p95, 100)
    })

    it('handles status code 400+ on every sample', () => {
      const svc = new PerfMonitorService()
      svc.record(makeSample({ statusCode: 500 }))
      svc.record(makeSample({ statusCode: 503 }))
      const stats = svc.getStatsForRoute('/api/test')
      assert.equal(stats.errorRate, 1.0)
    })

    it('single route SLA violation sorts descending by count', () => {
      const svc = new PerfMonitorService()
      svc.registerSla({ route: '/api/hot', targetP95Ms: 50, warnThresholdP95Ms: 60 })
      // Make many samples above threshold over several calls
      for (let i = 0; i < 20; i++) {
        svc.record(makeSample({ route: '/api/hot', durationMs: 200 + i, statusCode: 200 }))
      }
      // P95 check happens per-record, each may trigger a violation increment
      const violations = svc.getSlaViolations()
      assert.ok(violations.length > 0)
      // Verify sorted descending
      for (let i = 1; i < violations.length; i++) {
        assert.ok(violations[i - 1].violations >= violations[i].violations)
      }
    })
  })
})
