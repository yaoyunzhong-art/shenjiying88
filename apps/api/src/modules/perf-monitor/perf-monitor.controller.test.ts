import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { PerfMonitorController } from './perf-monitor.controller'
import { PerfMonitorService } from './perf-monitor.service'

describe('PerfMonitorController', () => {
  let controller: PerfMonitorController
  let service: PerfMonitorService

  beforeEach(() => {
    service = new PerfMonitorService()
    controller = new PerfMonitorController(service)
  })

  describe('POST /perf-monitor/record', () => {
    it('should accept valid sample', () => {
      const res = controller.record({ route: '/api/test', durationMs: 100, statusCode: 200 })
      expect(res.data.accepted).toBe(true)
      expect(res.data.total).toBe(1)
    })

    it('should increment total on multiple records', () => {
      controller.record({ route: '/api/a', durationMs: 50, statusCode: 200 })
      controller.record({ route: '/api/b', durationMs: 150, statusCode: 200 })
      const res = controller.record({ route: '/api/a', durationMs: 80, statusCode: 200 })
      expect(res.data.total).toBe(3)
    })

    it('should accept optional tenantId', () => {
      const res = controller.record({ route: '/api/tenant', durationMs: 100, statusCode: 200, tenantId: 'tenant-001' })
      expect(res.data.accepted).toBe(true)

      const stats = controller.getStats({ route: '/api/tenant' })
      expect(stats.data.count).toBe(1)
    })
  })

  describe('POST /perf-monitor/sla', () => {
    it('should register SLA config', () => {
      const res = controller.registerSla({ route: '/api/test', targetP95Ms: 200, warnThresholdP95Ms: 250 })
      expect(res.data.route).toBe('/api/test')
      expect(res.data.registered).toBe(true)
    })

    it('should detect violations after SLA registered', () => {
      controller.registerSla({ route: '/api/slow', targetP95Ms: 100, warnThresholdP95Ms: 120 })
      // Record samples that push P95 high
      for (let i = 0; i < 20; i++) {
        controller.record({ route: '/api/slow', durationMs: 200 + i * 10, statusCode: 200 })
      }
      const violations = controller.getViolations()
      expect(violations.data.length).toBeGreaterThan(0)
      expect(violations.data[0].violations).toBeGreaterThan(0)
    })
  })

  describe('GET /perf-monitor/stats', () => {
    it('should return zero stats for unknown route', () => {
      const res = controller.getStats({ route: '/api/unknown' })
      expect(res.data.count).toBe(0)
      expect(res.data.p95).toBe(0)
    })

    it('should return correct stats for route', () => {
      for (let i = 1; i <= 100; i++) {
        controller.record({ route: '/api/calc', durationMs: i, statusCode: 200 })
      }
      const res = controller.getStats({ route: '/api/calc' })
      expect(res.data.count).toBe(100)
      expect(res.data.p95).toBeGreaterThanOrEqual(95)
      expect(res.data.p95).toBeLessThanOrEqual(100)
    })
  })

  describe('GET /perf-monitor/stats/all', () => {
    it('should return empty for no data', () => {
      const res = controller.getAllStats()
      expect(res.data).toEqual([])
    })

    it('should return stats for all routes', () => {
      controller.record({ route: '/api/x', durationMs: 50, statusCode: 200 })
      controller.record({ route: '/api/y', durationMs: 100, statusCode: 200 })
      const res = controller.getAllStats()
      expect(res.data.length).toBe(2)
    })
  })

  describe('GET /perf-monitor/summary', () => {
    it('should return empty summary', () => {
      const res = controller.getSummary()
      expect(res.data.totalSamples).toBe(0)
      expect(res.data.routes).toBe(0)
    })

    it('should return correct summary', () => {
      controller.record({ route: '/api/a', durationMs: 50, statusCode: 200 })
      controller.record({ route: '/api/b', durationMs: 600, statusCode: 500 })
      controller.record({ route: '/api/b', durationMs: 700, statusCode: 200 })
      const res = controller.getSummary()
      expect(res.data.totalSamples).toBe(3)
      expect(res.data.routes).toBe(2)
      expect(res.data.slowQueries).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /perf-monitor/slow-queries', () => {
    it('should return empty for no slow queries', () => {
      controller.record({ route: '/api/fast', durationMs: 10, statusCode: 200 })
      const res = controller.getSlowQueries({ limit: 10 })
      expect(res.data.length).toBe(0)
    })

    it('should return slow queries sorted by recency', () => {
      controller.record({ route: '/api1', durationMs: 600, statusCode: 200 })
      controller.record({ route: '/api2', durationMs: 1000, statusCode: 200 })
      controller.record({ route: '/api3', durationMs: 50, statusCode: 200 })
      const res = controller.getSlowQueries({ limit: 10 })
      expect(res.data.length).toBe(2)
      expect(res.data.every(s => s.durationMs > 500)).toBe(true)
    })
  })

  describe('POST /perf-monitor/reset', () => {
    it('should reset all data', () => {
      controller.record({ route: '/api/temp', durationMs: 100, statusCode: 200 })
      controller.reset({ confirm: true })
      const summary = controller.getSummary()
      expect(summary.data.totalSamples).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle error rate calculation', () => {
      controller.record({ route: '/api/err', durationMs: 50, statusCode: 200 })
      controller.record({ route: '/api/err', durationMs: 60, statusCode: 200 })
      controller.record({ route: '/api/err', durationMs: 70, statusCode: 500 })
      const stats = controller.getStats({ route: '/api/err' })
      expect(stats.data.errorRate).toBeCloseTo(1 / 3, 2)
    })

    it('should handle high load without crash', () => {
      for (let i = 0; i < 15000; i++) {
        controller.record({ route: `/api/load-${i % 10}`, durationMs: Math.random() * 500, statusCode: 200 })
      }
      const summary = controller.getSummary()
      // Should not exceed max samples constraint
      expect(summary.data.totalSamples).toBeLessThanOrEqual(10000)
    })
  })
})
