import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { toPerfSummary, PerfAlertLevel } from './perf-monitor.entity'
import type { PerfStats, PerfSample, PerfAlert, SlaConfig, SlaViolation } from './perf-monitor.entity'

describe('PerfMonitorEntity', () => {
  it('toPerfSummary should aggregate stats correctly', () => {
    const stats: PerfStats[] = [
      { route: '/api/a', p50: 10, p95: 20, p99: 30, max: 40, count: 100, errorRate: 0.01 },
      { route: '/api/b', p50: 20, p95: 40, p99: 50, max: 60, count: 200, errorRate: 0.02 },
    ]
    const summary = toPerfSummary(stats)
    expect(summary.totalSamples).toBe(300)
    expect(summary.routes).toBe(2)
  })

  it('toPerfSummary should handle empty stats', () => {
    const summary = toPerfSummary([])
    expect(summary.totalSamples).toBe(0)
    expect(summary.routes).toBe(0)
  })

  it('toPerfSummary should handle single route', () => {
    const stats: PerfStats[] = [
      { route: '/api/c', p50: 5, p95: 10, p99: 15, max: 20, count: 50, errorRate: 0.005 },
    ]
    const summary = toPerfSummary(stats)
    expect(summary.totalSamples).toBe(50)
    expect(summary.routes).toBe(1)
  })

  it('toPerfSummary should handle high cardinality routes', () => {
    const stats: PerfStats[] = Array.from({ length: 100 }, (_, i) => ({
      route: `/api/route-${i}`,
      p50: i * 10,
      p95: i * 20,
      p99: i * 30,
      max: i * 40,
      count: i * 100,
      errorRate: i * 0.001,
    }))
    const summary = toPerfSummary(stats)
    expect(summary.routes).toBe(100)
    expect(summary.totalSamples).toBe(495000) // 0 + 100 + 200 + ... + 9900
  })

  it('toPerfSummary should handle zero-count route', () => {
    const stats: PerfStats[] = [
      { route: '/api/unused', p50: 0, p95: 0, p99: 0, max: 0, count: 0, errorRate: 0 },
    ]
    const summary = toPerfSummary(stats)
    expect(summary.totalSamples).toBe(0)
    expect(summary.routes).toBe(1)
  })

  it('PerfAlertLevel enum should have correct values', () => {
    expect(PerfAlertLevel.INFO).toBe('INFO')
    expect(PerfAlertLevel.WARN).toBe('WARN')
    expect(PerfAlertLevel.CRITICAL).toBe('CRITICAL')
  })
})
