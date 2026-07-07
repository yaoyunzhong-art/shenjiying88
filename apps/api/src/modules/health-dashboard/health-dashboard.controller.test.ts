import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: 健康度仪表板 Controller 单元测试 (正例+反例+边界)
import { HealthDashboardController } from './health-dashboard.controller'
import { HealthScoreService } from './health-score.service'
import { HealthDashboardService } from './health-dashboard.service'

describe('HealthDashboardController', () => {
  let controller: HealthDashboardController
  let healthScore: HealthScoreService
  let dashboard: HealthDashboardService

  beforeEach(() => {
    healthScore = new HealthScoreService()
    dashboard = new HealthDashboardService(healthScore)
    controller = new HealthDashboardController(healthScore, dashboard)
  })

  // ── POST /health-dashboard/evaluate ──
  describe('POST /health-dashboard/evaluate', () => {
    it('should return HEALTHY for healthy tenant input', () => {
      const result = controller.evaluate({
        tenants: [{
          tenantId: 'store-1',
          p95Ms: 50,
          errorRate: 0.0005,
          quotaUsagePercent: 0.3,
          championActivityScore: 90,
          anomalyCount30d: 1,
        }],
      })
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('HEALTHY')
      expect(result[0].score).toBeGreaterThanOrEqual(80)
      expect(result[0].tenantId).toBe('store-1')
    })

    it('should return CRITICAL for severely degraded tenant', () => {
      const result = controller.evaluate({
        tenants: [{
          tenantId: 'store-bad',
          p95Ms: 5000,
          errorRate: 0.5,
          quotaUsagePercent: 2.0,
          championActivityScore: 0,
          anomalyCount30d: 50,
        }],
      })
      expect(result[0].status).toBe('CRITICAL')
      expect(result[0].score).toBeLessThan(60)
    })

    it('should return sorted results with worst tenant first', () => {
      const result = controller.evaluate({
        tenants: [
          { tenantId: 'a', p95Ms: 50, errorRate: 0.001, quotaUsagePercent: 0.3, championActivityScore: 100, anomalyCount30d: 0 },
          { tenantId: 'b', p95Ms: 3000, errorRate: 0.1, quotaUsagePercent: 1.0, championActivityScore: 5, anomalyCount30d: 20 },
          { tenantId: 'c', p95Ms: 500, errorRate: 0.01, quotaUsagePercent: 0.7, championActivityScore: 50, anomalyCount30d: 5 },
        ],
      })
      expect(result[0].tenantId).toBe('b')
      expect(result[2].tenantId).toBe('a')
    })

    it('should handle single tenant gracefully', () => {
      const result = controller.evaluate({
        tenants: [{
          tenantId: 'solo',
          p95Ms: 100,
          errorRate: 0.001,
          quotaUsagePercent: 0.5,
          championActivityScore: 80,
          anomalyCount30d: 2,
        }],
      })
      expect(result).toHaveLength(1)
      expect(result[0].tenantId).toBe('solo')
    })
  })

  // ── POST /health-dashboard/alerts ──
  describe('POST /health-dashboard/alerts', () => {
    it('should return CRITICAL alert when score below critical threshold', () => {
      const alerts = controller.checkAlerts({
        scores: [{
          tenantId: 'alerts-1',
          p95Ms: 3000,
          errorRate: 0.2,
          quotaUsagePercent: 0.9,
          championActivityScore: 10,
          anomalyCount30d: 5,
        }],
        config: {
          warningThreshold: 80,
          criticalThreshold: 60,
          notifyChannels: ['email', 'feishu'],
        },
      })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe('CRITICAL')
      expect(alerts[0].notifyChannels).toContain('feishu')
    })

    it('should return WARNING alert when score between thresholds', () => {
      const alerts = controller.checkAlerts({
        // perf=70, rel=90, quota=90, comm=60 → score=21+27+18+12=78 → WARNING
        scores: [{
          tenantId: 'alerts-2',
          p95Ms: 300,
          errorRate: 0.005,
          quotaUsagePercent: 0.7,
          championActivityScore: 30,
          anomalyCount30d: 0,
        }],
        config: {
          warningThreshold: 80,
          criticalThreshold: 60,
          notifyChannels: ['email', 'feishu', 'dingtalk'],
        },
      })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe('WARNING')
      // WARNING always notifies via email only
      expect(alerts[0].notifyChannels).toEqual(['email'])
    })

    it('should return empty array when all scores above warning threshold', () => {
      const alerts = controller.checkAlerts({
        scores: [{
          tenantId: 'healthy-1',
          p95Ms: 50,
          errorRate: 0.0005,
          quotaUsagePercent: 0.3,
          championActivityScore: 100,
          anomalyCount30d: 0,
        }],
        config: {
          warningThreshold: 80,
          criticalThreshold: 60,
          notifyChannels: ['email'],
        },
      })
      expect(alerts).toHaveLength(0)
    })

    it('should handle multiple scores with mixed health', () => {
      const alerts = controller.checkAlerts({
        scores: [
          {
            tenantId: 'h1',
            p95Ms: 100,
            errorRate: 0.001,
            quotaUsagePercent: 0.4,
            championActivityScore: 90,
            anomalyCount30d: 0,
          },
          {
            tenantId: 'h2',
            p95Ms: 3000,
            errorRate: 0.2,
            quotaUsagePercent: 0.9,
            championActivityScore: 10,
            anomalyCount30d: 30,
          },
          // perf=70, rel=75, quota=75, comm=60 → score=21+22.5+15+12=70.5 → WARNING
          {
            tenantId: 'h3',
            p95Ms: 500,
            errorRate: 0.01,
            quotaUsagePercent: 0.75,
            championActivityScore: 30,
            anomalyCount30d: 5,
          },
        ],
        config: {
          warningThreshold: 80,
          criticalThreshold: 60,
          notifyChannels: ['email', 'feishu'],
        },
      })
      expect(alerts).toHaveLength(2)
      const severities = alerts.map(a => a.severity)
      expect(severities).toContain('CRITICAL')
      expect(severities).toContain('WARNING')
    })
  })

  // ── GET /health-dashboard/summary ──
  describe('GET /health-dashboard/summary', () => {
    it('should generate summary with zero tenants for empty input', () => {
      const result = controller.generateSummary({})
      expect(result.totalTenants).toBe(0)
      expect(result.averageScore).toBe(0)
      expect(result.byStatus.HEALTHY).toBe(0)
      expect(result.byStatus.WARNING).toBe(0)
      expect(result.byStatus.CRITICAL).toBe(0)
      expect(result.computedAt).toBeDefined()
    })
  })

  // ── GET /health-dashboard/metrics ──
  describe('GET /health-dashboard/metrics', () => {
    it('should return Prometheus format metrics', () => {
      const metrics = controller.getMetrics()
      expect(metrics).toContain('# HELP')
      expect(metrics).toContain('# TYPE')
      expect(metrics).toContain('tenant_health_score_avg')
      expect(metrics).toContain('tenant_by_status_healthy')
      expect(metrics).toContain('tenant_by_status_warning')
      expect(metrics).toContain('tenant_by_status_critical')
    })

    it('should return correct format with multiple lines', () => {
      const metrics = controller.getMetrics()
      const lines = metrics.split('\n').filter(l => l.trim())
      // 3 HELP lines + 3 TYPE lines + 1 avg + 3 status = 10 lines
      // 3*HELP + 3*TYPE + 1 avg gauge + 3 status = 12 non-empty lines
      expect(lines.length).toBe(12)
    })
  })
})
