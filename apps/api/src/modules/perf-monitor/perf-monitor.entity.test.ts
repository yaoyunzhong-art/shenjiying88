import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { toPerfSummary } from './perf-monitor.entity'
import type { PerfStats } from './perf-monitor.entity'

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
})
