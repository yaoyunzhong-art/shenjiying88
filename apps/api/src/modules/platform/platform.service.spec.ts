/**
 * platform.service.spec.ts — 平台服务 Service 单元测试 (V23)
 *
 * 覆盖: getOverview / recordMetric / checkHealth / getUptime / reset
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PlatformService } from './platform.service'

describe('PlatformService', () => {
  let svc: PlatformService

  beforeEach(() => {
    svc = new PlatformService()
    svc.reset()
  })

  // ════════════════════════════════════════════
  // getOverview
  // ════════════════════════════════════════════

  describe('getOverview', () => {
    it('正例: 返回平台概览', () => {
      const overview = svc.getOverview()
      expect(overview.version).toBeDefined()
      expect(overview.version.version).toBeTruthy()
      expect(overview.health).toBeDefined()
      expect(overview.health.status).toBe('healthy')
      expect(overview.health.services).toContain('api')
      expect(overview.metrics).toBeDefined()
      expect(overview.activeTenants).toBeGreaterThanOrEqual(0)
      expect(overview.servicesCount).toBe(4)
      expect(overview.uptimeHours).toBeGreaterThanOrEqual(0)
    })
  })

  // ════════════════════════════════════════════
  // recordMetric
  // ════════════════════════════════════════════

  describe('recordMetric', () => {
    it('正例: 记录新指标', () => {
      const metric = svc.recordMetric('api_requests', 1000, 'count')
      expect(metric.name).toBe('api_requests')
      expect(metric.value).toBe(1000)
    })

    it('正例: 更新已有指标', () => {
      svc.recordMetric('api_requests', 1000, 'count')
      const updated = svc.recordMetric('api_requests', 2000, 'count')
      expect(updated.value).toBe(2000)
    })

    it('正例: 记录到概览中', () => {
      svc.recordMetric('cpu_usage', 45, '%')
      svc.recordMetric('memory_used', 80, '%')
      const overview = svc.getOverview()
      expect(overview.metrics.length).toBe(2)
    })
  })

  // ════════════════════════════════════════════
  // checkHealth
  // ════════════════════════════════════════════

  describe('checkHealth', () => {
    it('正例: 健康检查', async () => {
      const health = await svc.checkHealth()
      expect(health.status).toBe('healthy')
      expect(health.services).toContain('redis')
      expect(health.lastCheck).toBeTruthy()
    })
  })

  // ════════════════════════════════════════════
  // getUptime
  // ════════════════════════════════════════════

  describe('getUptime', () => {
    it('正例: 返回格式化uptime', () => {
      const uptime = svc.getUptime()
      expect(uptime).toMatch(/^\d+h\d+m\d+s$/)
    })
  })

  // ════════════════════════════════════════════
  // reset
  // ════════════════════════════════════════════

  describe('reset', () => {
    it('正例: 重置后指标为空', () => {
      svc.recordMetric('test', 100, 'count')
      svc.reset()
      expect(svc.getOverview().metrics.length).toBe(0)
    })
  })
})
