import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// Contract: 验证 perf-monitor 模块导出的类型一致性
import type { PerfSample, PerfStats, SlaConfig, PerfSummary, SlaViolation } from './perf-monitor.entity'
import { PerfMonitorService } from './perf-monitor.service'
import { PerfMonitorController } from './perf-monitor.controller'
import { PerfMonitorModule } from './perf-monitor.module'

describe('PerfMonitor Contract', () => {
  it('should export PerfMonitorService class', () => {
    expect(PerfMonitorService).toBeDefined()
    expect(typeof PerfMonitorService.prototype.record).toBe('function')
  })

  it('should export PerfMonitorController class', () => {
    expect(PerfMonitorController).toBeDefined()
  })

  it('should export PerfMonitorModule', () => {
    expect(PerfMonitorModule).toBeDefined()
  })

  it('should have PerfSample interface shape', () => {
    const sample: PerfSample = { route: '/api/test', durationMs: 100, statusCode: 200, timestamp: new Date().toISOString() }
    expect(sample.route).toBeDefined()
    expect(sample.durationMs).toBeDefined()
    expect(sample.statusCode).toBeDefined()
    expect(sample.timestamp).toBeDefined()
  })

  it('should have PerfStats interface shape', () => {
    const stats: PerfStats = { route: '/api/test', p50: 50, p95: 95, p99: 99, max: 150, count: 100, errorRate: 0.01 }
    expect(stats.route).toBeDefined()
    expect(stats.p95).toBeDefined()
    expect(stats.errorRate).toBeDefined()
  })

  it('should have SlaConfig interface shape', () => {
    const config: SlaConfig = { route: '/api/test', targetP95Ms: 200, warnThresholdP95Ms: 250 }
    expect(config.route).toBeDefined()
    expect(config.targetP95Ms).toBe(200)
    expect(config.warnThresholdP95Ms).toBe(250)
  })
})
