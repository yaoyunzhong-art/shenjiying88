// health-dashboard.entity.test.ts — 健康度仪表板实体/类型导出测试
import { describe, it, expect } from 'vitest'
import { HealthScoreService, HealthDashboardService } from './health-dashboard.entity'
import type { TenantHealthInput } from './health-dashboard.entity'

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

  /* ── compute 正例 ── */
  it('compute 应返回完整的 TenantHealthScore', () => {
    const svc = new HealthScoreService()
    const result = svc.compute({
      tenantId: 't1',
      p95Ms: 100,
      errorRate: 0.05,
      quotaUsagePercent: 0.5,
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
      errorRate: 0.001,
      quotaUsagePercent: 0.2,
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
      errorRate: 0.5,
      quotaUsagePercent: 1.0,
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
      { tenantId: 't1', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.5, championActivityScore: 80, anomalyCount30d: 2 },
      { tenantId: 't2', p95Ms: 50, errorRate: 0.001, quotaUsagePercent: 0.2, championActivityScore: 100, anomalyCount30d: 0 },
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
      { tenantId: 't1', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.5, championActivityScore: 80, anomalyCount30d: 2 },
      { tenantId: 't2', p95Ms: 5000, errorRate: 0.5, quotaUsagePercent: 1.0, championActivityScore: 0, anomalyCount30d: 50 },
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

  /* ── 各组件评分验证 ── */
  it('P95 ≤ 100 时 performance 应满分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-p0', p95Ms: 50, errorRate: 0, quotaUsagePercent: 0, championActivityScore: 100, anomalyCount30d: 0,
    })
    expect(score.components.performance).toBe(100)
  })

  it('ErrorRate < 0.001 时 reliability 满分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-er0', p95Ms: 100, errorRate: 0.0001, quotaUsagePercent: 0.5, championActivityScore: 80, anomalyCount30d: 0,
    })
    expect(score.components.reliability).toBe(100)
  })

  it('Quota < 0.5 时 quotaHealth 满分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-q50', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.1, championActivityScore: 80, anomalyCount30d: 2,
    })
    expect(score.components.quotaHealth).toBe(100)
  })

  it('Quota >= 1.0 时 quotaHealth 仅 10分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-q100', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 1.0, championActivityScore: 80, anomalyCount30d: 2,
    })
    expect(score.components.quotaHealth).toBe(10)
  })

  it('Champion 活跃度为 0 时 community 仅 20分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-c0', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.5, championActivityScore: 0, anomalyCount30d: 2,
    })
    expect(score.components.community).toBe(20)
  })

  it('Champion 活跃度 >= 100 时 community 满分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-c100', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.5, championActivityScore: 150, anomalyCount30d: 2,
    })
    expect(score.components.community).toBe(100)
  })

  /* ── 类型验证 ── */
  it('类型 TenantHealthInput 应包含必要字段', () => {
    const input: TenantHealthInput = { tenantId: 't', p95Ms: 100, errorRate: 0.5, quotaUsagePercent: 0.5, championActivityScore: 75, anomalyCount30d: 1 }
    expect(input).toHaveProperty('tenantId')
    expect(input).toHaveProperty('p95Ms')
    expect(input).toHaveProperty('errorRate')
    expect(input).toHaveProperty('quotaUsagePercent')
    expect(input).toHaveProperty('championActivityScore')
    expect(input).toHaveProperty('anomalyCount30d')
  })

  /* ── score 完整性 ── */
  it('score 应在 0-100 范围内', () => {
    const svc = new HealthScoreService()
    const good = svc.compute({ tenantId: 't', p95Ms: 50, errorRate: 0, quotaUsagePercent: 0, championActivityScore: 100, anomalyCount30d: 0 })
    expect(good.score).toBeGreaterThanOrEqual(0)
    expect(good.score).toBeLessThanOrEqual(100)
    const bad = svc.compute({ tenantId: 't', p95Ms: 5000, errorRate: 1, quotaUsagePercent: 1.5, championActivityScore: 0, anomalyCount30d: 100 })
    expect(bad.score).toBeGreaterThanOrEqual(0)
    expect(bad.score).toBeLessThanOrEqual(100)
  })

  it('recommendations 应包含建议', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({ tenantId: 't', p95Ms: 5000, errorRate: 0.5, quotaUsagePercent: 1.0, championActivityScore: 0, anomalyCount30d: 100 })
    expect(score.recommendations.length).toBeGreaterThan(0)
  })

  it('computedAt 应为 ISO 时间戳', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({ tenantId: 't', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.5, championActivityScore: 80, anomalyCount30d: 2 })
    expect(() => new Date(score.computedAt)).not.toThrow()
  })
})
