import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: 健康度仪表板 Service 单元测试 (正例+反例+边界)
import { HealthDashboardService } from './health-dashboard.service'
import { HealthScoreService, type TenantHealthInput } from './health-score.service'

describe('HealthDashboardService', () => {
  let dashboard: HealthDashboardService
  let healthScore: HealthScoreService

  beforeEach(() => {
    healthScore = new HealthScoreService()
    dashboard = new HealthDashboardService(healthScore)
  })

  // ── generateSummary ──
  describe('generateSummary', () => {
    const healthyInput: TenantHealthInput = {
      tenantId: 'store-a',
      p95Ms: 100,
      errorRate: 0.001,
      quotaUsagePercent: 0.4,
      championActivityScore: 90,
      anomalyCount30d: 0,
    }

    // perf=70, rel=90, quota=90, comm=40 → score=21+27+18+8=74 → WARNING
    const warningInput: TenantHealthInput = {
      tenantId: 'store-b',
      p95Ms: 400,
      errorRate: 0.005,
      quotaUsagePercent: 0.7,
      championActivityScore: 15,
      anomalyCount30d: 0,
    }

    const criticalInput: TenantHealthInput = {
      tenantId: 'store-c',
      p95Ms: 5000,
      errorRate: 0.3,
      quotaUsagePercent: 1.5,
      championActivityScore: 0,
      anomalyCount30d: 40,
    }

    it('should return full summary for single tenant', () => {
      const summary = dashboard.generateSummary([healthyInput])
      expect(summary.totalTenants).toBe(1)
      expect(summary.byStatus.HEALTHY).toBe(1)
      expect(summary.byStatus.WARNING).toBe(0)
      expect(summary.byStatus.CRITICAL).toBe(0)
      expect(summary.averageScore).toBeGreaterThanOrEqual(80)
      expect(summary.topIssues).toHaveLength(0)
      expect(summary.alerts).toHaveLength(0)
    })

    it('should report WARNING tenants in alerts', () => {
      const summary = dashboard.generateSummary([warningInput])
      expect(summary.totalTenants).toBe(1)
      expect(summary.byStatus.WARNING).toBe(1)
      expect(summary.alerts.length).toBeGreaterThanOrEqual(1)
      expect(summary.alerts[0].severity).toBe('WARNING')
    })

    it('should report CRITICAL tenants with lowest score', () => {
      const summary = dashboard.generateSummary([criticalInput])
      expect(summary.byStatus.CRITICAL).toBe(1)
      expect(summary.averageScore).toBeLessThan(60)
      expect(summary.alerts.length).toBeGreaterThanOrEqual(1)
      expect(summary.alerts[0].severity).toBe('CRITICAL')
    })

    it('should compute average over multiple tenants', () => {
      const summary = dashboard.generateSummary([healthyInput, warningInput, criticalInput])
      expect(summary.totalTenants).toBe(3)
      expect(summary.byStatus.HEALTHY).toBe(1)
      expect(summary.byStatus.WARNING).toBe(1)
      expect(summary.byStatus.CRITICAL).toBe(1)
      expect(summary.averageScore).toBeGreaterThan(0)
      expect(summary.averageScore).toBeLessThan(100)
    })

    it('should return top issues sorted by count descending', () => {
      const allInputs = [
        { ...warningInput, anomalyCount30d: 15 },
        { ...warningInput, tenantId: 'store-d', anomalyCount30d: 15 },
        { ...warningInput, tenantId: 'store-e', anomalyCount30d: 15 },
        { ...criticalInput },
      ]
      const summary = dashboard.generateSummary(allInputs)
      expect(summary.topIssues.length).toBeGreaterThan(0)
      // Issues should be sorted descending by count
      for (let i = 1; i < summary.topIssues.length; i++) {
        expect(summary.topIssues[i].count).toBeLessThanOrEqual(summary.topIssues[i - 1].count)
      }
    })

    it('should handle empty input gracefully', () => {
      const summary = dashboard.generateSummary([])
      expect(summary.totalTenants).toBe(0)
      expect(summary.averageScore).toBe(0)
      expect(summary.byStatus.HEALTHY).toBe(0)
      expect(summary.byStatus.WARNING).toBe(0)
      expect(summary.byStatus.CRITICAL).toBe(0)
      expect(summary.topIssues).toEqual([])
      expect(summary.alerts).toEqual([])
      expect(summary.computedAt).toBeDefined()
    })
  })

  // ── checkAlerts ──
  describe('checkAlerts', () => {
    it('should generate CRITICAL alert for score below critical threshold', () => {
      const score = healthScore.compute({
        tenantId: 't1', p95Ms: 5000, errorRate: 0.3, quotaUsagePercent: 1.5,
        championActivityScore: 0, anomalyCount30d: 50,
      })
      const alerts = dashboard.checkAlerts({
        scores: [score],
        config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'feishu'] },
      })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe('CRITICAL')
      expect(alerts[0].notifyChannels).toEqual(['email', 'feishu'])
    })

    // p95Ms=300(70), errorRate=0.005(90), quota=0.7(90), champ=50(80)
    // score=21+27+18+16=82 → HEALTHY — need WARNING, use different inputs
    // p95Ms=500(70), errorRate=0.01(75), quota=0.75(75), champ=30(60)
    // score=21+22.5+15+12=70.5 → WARNING
    it('should generate WARNING alert for score between thresholds', () => {
      const score = healthScore.compute({
        tenantId: 't2', p95Ms: 500, errorRate: 0.01, quotaUsagePercent: 0.75,
        championActivityScore: 30, anomalyCount30d: 0,
      })
      const alerts = dashboard.checkAlerts({
        scores: [score],
        config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'feishu', 'dingtalk'] },
      })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe('WARNING')
      // WARNING falls back to just email
      expect(alerts[0].notifyChannels).toEqual(['email'])
    })

    it('should return empty array when all scores healthy', () => {
      const score = healthScore.compute({
        tenantId: 't3', p95Ms: 50, errorRate: 0.0005, quotaUsagePercent: 0.3,
        championActivityScore: 100, anomalyCount30d: 0,
      })
      const alerts = dashboard.checkAlerts({
        scores: [score],
        config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
      })
      expect(alerts).toEqual([])
    })

    it('should handle multiple scores with mixed status', () => {
      const s1 = healthScore.compute({
        tenantId: 'a', p95Ms: 50, errorRate: 0.001, quotaUsagePercent: 0.3,
        championActivityScore: 100, anomalyCount30d: 0,
      })
      const s2 = healthScore.compute({
        tenantId: 'b', p95Ms: 5000, errorRate: 0.3, quotaUsagePercent: 1.5,
        championActivityScore: 0, anomalyCount30d: 30,
      })
      const alerts = dashboard.checkAlerts({
        scores: [s1, s2],
        config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
      })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].tenantId).toBe('b')
    })
  })

  // ── toGrafana ──
  describe('toGrafana', () => {
    it('should produce Prometheus exposition format', () => {
      const output = dashboard.toGrafana({
        totalTenants: 10,
        byStatus: { HEALTHY: 7, WARNING: 2, CRITICAL: 1 },
        averageScore: 85.3,
        topIssues: [{ issue: 'high p95', count: 3 }],
        alerts: [],
        computedAt: '2026-06-26T00:00:00Z',
      })
      expect(output).toContain('# HELP tenant_health_score_avg')
      expect(output).toContain('# TYPE tenant_health_score_avg gauge')
      expect(output).toContain('tenant_health_score_avg 85.30')
      expect(output).toContain('tenant_by_status_healthy 7')
      expect(output).toContain('tenant_by_status_warning 2')
      expect(output).toContain('tenant_by_status_critical 1')
    })

    it('should handle zero values correctly', () => {
      const output = dashboard.toGrafana({
        totalTenants: 0,
        byStatus: { HEALTHY: 0, WARNING: 0, CRITICAL: 0 },
        averageScore: 0,
        topIssues: [],
        alerts: [],
        computedAt: '2026-06-26T00:00:00Z',
      })
      expect(output).toContain('tenant_health_score_avg 0.00')
      expect(output).toContain('tenant_by_status_healthy 0')
      expect(output).toContain('tenant_by_status_warning 0')
      expect(output).toContain('tenant_by_status_critical 0')
    })
  })
})
