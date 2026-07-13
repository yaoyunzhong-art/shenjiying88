// health-dashboard.entity.test.ts — 健康度仪表板实体/类型导出测试
import { describe, it, expect } from 'vitest'
import { HealthScoreService, HealthDashboardService } from './health-dashboard.entity'

describe('HealthDashboard Entity exports', () => {
  /* ── 正例: 基础导出 ── */
  it('AC-1: HealthScoreService 可实例化', () => {
    const service = new HealthScoreService()
    expect(service).toBeInstanceOf(HealthScoreService)
  })

  it('AC-2: HealthDashboardService 可实例化', () => {
    const healthScore = new HealthScoreService()
    const dashboard = new HealthDashboardService(healthScore)
    expect(dashboard).toBeInstanceOf(HealthDashboardService)
  })

  it('HealthScoreService 应定义 compute 方法', () => {
    const svc = new HealthScoreService()
    expect(typeof svc.compute).toBe('function')
  })

  it('HealthScoreService 应定义 computeBatch 方法', () => {
    const svc = new HealthScoreService()
    expect(typeof svc.computeBatch).toBe('function')
  })

  it('HealthDashboardService 应定义 generateSummary 方法', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    expect(typeof dash.generateSummary).toBe('function')
  })

  it('HealthDashboardService 应定义 evaluateAlerts 方法', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    expect(typeof dash.evaluateAlerts).toBe('function')
  })

  it('HealthDashboardService 应定义 generateExportData 方法', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    expect(typeof dash.generateExportData).toBe('function')
  })

  /* ── compute 正例 ── */
  it('compute 应返回完整的 TenantHealthScore', () => {
    const svc = new HealthScoreService()
    const result = svc.compute({
      tenantId: 't1',
      p95Ms: 100,
      errorRate: 0.05,
      quotaUsagePercent: 50,
      championActivityScore: 80,
      anomalyCount30d: 2,
    })
    expect(result).toHaveProperty('tenantId', 't1')
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('components')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('recommendations')
    expect(result).toHaveProperty('computedAt')
    expect(result.components).toHaveProperty('performance')
    expect(result.components).toHaveProperty('reliability')
    expect(result.components).toHaveProperty('quotaHealth')
    expect(result.components).toHaveProperty('community')
  })

  it('compute: 高性能场景应返回 HEALTHY', () => {
    const svc = new HealthScoreService()
    const result = svc.compute({
      tenantId: 't2',
      p95Ms: 50,
      errorRate: 0.01,
      quotaUsagePercent: 20,
      championActivityScore: 100,
      anomalyCount30d: 0,
    })
    expect(result.status).toBe('HEALTHY')
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  /* ── compute 反例: 极差输入 ── */
  it('compute: 全指标恶化应返回 CRITICAL', () => {
    const svc = new HealthScoreService()
    const result = svc.compute({
      tenantId: 't-bad',
      p95Ms: 5000,
      errorRate: 15,
      quotaUsagePercent: 100,
      championActivityScore: 0,
      anomalyCount30d: 50,
    })
    expect(result.status).toBe('CRITICAL')
    expect(result.score).toBeLessThan(40)
  })

  /* ── computeBatch 正例 ── */
  it('computeBatch 应处理多租户', () => {
    const svc = new HealthScoreService()
    const results = svc.computeBatch([
      { tenantId: 't1', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 50, championActivityScore: 80, anomalyCount30d: 2 },
      { tenantId: 't2', p95Ms: 50, errorRate: 0.01, quotaUsagePercent: 20, championActivityScore: 100, anomalyCount30d: 0 },
    ])
    expect(results).toHaveLength(2)
    expect(results[0].tenantId).toBe('t1')
    expect(results[1].tenantId).toBe('t2')
  })

  it('computeBatch 空数组应返回 []', () => {
    const svc = new HealthScoreService()
    expect(svc.computeBatch([])).toEqual([])
  })

  /* ── generateSummary 正例 ── */
  it('generateSummary 应正确汇总', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const summary = dash.generateSummary([
      { tenantId: 't1', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 50, championActivityScore: 80, anomalyCount30d: 2 },
      { tenantId: 't2', p95Ms: 5000, errorRate: 15, quotaUsagePercent: 100, championActivityScore: 0, anomalyCount30d: 50 },
    ])
    expect(summary).toHaveProperty('totalTenants', 2)
    expect(summary).toHaveProperty('byStatus')
    expect(summary).toHaveProperty('averageScore')
    expect(summary).toHaveProperty('topIssues')
    expect(summary).toHaveProperty('alerts')
    expect(summary).toHaveProperty('computedAt')
    expect(summary.totalTenants).toBeGreaterThan(0)
  })

  it('generateSummary 空输入应返回含 0 值的摘要', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const summary = dash.generateSummary([])
    expect(summary.totalTenants).toBe(0)
    expect(summary.averageScore).toBe(0)
  })

  /* ── evaluateAlerts ── */
  it('evaluateAlerts 应返回告警列表', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const input: TenantHealthInput = {
      tenantId: 't-crit', p95Ms: 5000, errorRate: 15, quotaUsagePercent: 100,
      championActivityScore: 0, anomalyCount30d: 50,
    }
    const score = svc.compute(input)
    const alerts = dash.evaluateAlerts(score, { warningThreshold: 60, criticalThreshold: 40, notifyChannels: ['email'] })
    expect(Array.isArray(alerts)).toBe(true)
    expect(alerts.length).toBeGreaterThan(0)
  })

  // 类型导入验证
  it('类型 TenantHealthInput 应包含必要字段', () => {
    const input = { tenantId: 't', p95Ms: 100, errorRate: 0.5, quotaUsagePercent: 50, championActivityScore: 75, anomalyCount30d: 1 }
    expect(input).toHaveProperty('tenantId')
    expect(input).toHaveProperty('p95Ms')
    expect(input).toHaveProperty('errorRate')
    expect(input).toHaveProperty('quotaUsagePercent')
    expect(input).toHaveProperty('championActivityScore')
    expect(input).toHaveProperty('anomalyCount30d')
  })
})

import type { TenantHealthInput, TenantHealthScore, DashboardSummary, AlertConfig } from './health-dashboard.entity'
