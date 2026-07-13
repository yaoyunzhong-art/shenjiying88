// health-dashboard.module.test.ts — 健康度仪表板模块测试
import { describe, it, expect } from 'vitest'
import { HealthDashboardModule } from './health-dashboard.module';
import { HealthScoreService, HealthDashboardService } from './health-dashboard.entity';

describe('HealthDashboardModule', () => {
  /* ── 正例: 模块元数据 ── */
  it('AC-1: 应正确定义模块元数据', () => {
    const controllers = Reflect.getMetadata('controllers', HealthDashboardModule);
    const providers = Reflect.getMetadata('providers', HealthDashboardModule);
    const exports = Reflect.getMetadata('exports', HealthDashboardModule);

    expect(controllers).toBeDefined();
    expect(controllers).toHaveLength(1);
    expect(providers).toBeDefined();
    expect(providers).toHaveLength(2);
    expect(exports).toBeDefined();
    expect(exports).toHaveLength(2);
  });

  it('Controller 数量应为 1', () => {
    const controllers = Reflect.getMetadata('controllers', HealthDashboardModule) || []
    expect(controllers.length).toBe(1)
  })

  it('Provider 列表应包含 HealthScoreService 和 HealthDashboardService', () => {
    const providers = Reflect.getMetadata('providers', HealthDashboardModule) || []
    const names = providers.map((p: any) => p?.name || p)
    expect(names).toContain('HealthScoreService')
    expect(names).toContain('HealthDashboardService')
  })

  it('Export 列表应与 provider 一致', () => {
    const providers = Reflect.getMetadata('providers', HealthDashboardModule) || []
    const exports = Reflect.getMetadata('exports', HealthDashboardModule) || []
    expect(providers).toEqual(exports)
  })

  it('不应导入额外模块', () => {
    const imports = Reflect.getMetadata('imports', HealthDashboardModule) || []
    expect(imports).toHaveLength(0)
  })

  it('模块应可实例化', () => {
    const mod = new HealthDashboardModule()
    expect(mod).toBeInstanceOf(HealthDashboardModule)
  })

  /* ── 业务场景正例 ── */
  it('健康度评分: 优秀租户应返回 HEALTHY', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-good',
      p95Ms: 50,
      errorRate: 0.001,
      quotaUsagePercent: 0.2,
      championActivityScore: 95,
      anomalyCount30d: 0,
    })
    expect(score.status).toBe('HEALTHY')
    expect(score.score).toBeGreaterThanOrEqual(85)
  })

  it('健康度评分: 恶化租户应返回 CRITICAL', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-bad',
      p95Ms: 8000,
      errorRate: 0.5,
      quotaUsagePercent: 1.0,
      championActivityScore: 0,
      anomalyCount30d: 100,
    })
    expect(score.status).toBe('CRITICAL')
    expect(score.score).toBeLessThan(30)
  })

  it('批量评分应正确处理混合租户', () => {
    const svc = new HealthScoreService()
    const results = svc.computeBatch([
      { tenantId: 't1', p95Ms: 50, errorRate: 0.001, quotaUsagePercent: 0.2, championActivityScore: 95, anomalyCount30d: 0 },
      { tenantId: 't2', p95Ms: 5000, errorRate: 0.5, quotaUsagePercent: 1.0, championActivityScore: 0, anomalyCount30d: 50 },
    ])
    // computeBatch sorts by score ascending (worst first)
    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('CRITICAL')
    expect(results[1].status).toBe('HEALTHY')
  })

  /* ── 边界场景 ── */
  it('空批次应返回空数组', () => {
    const svc = new HealthScoreService()
    expect(svc.computeBatch([])).toEqual([])
  })

  it('P95 为 0 时 performance 应满分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-p0', p95Ms: 0, errorRate: 0, quotaUsagePercent: 0, championActivityScore: 100, anomalyCount30d: 0,
    })
    expect(score.components.performance).toBe(100)
  })

  it('ErrorRate 为 0 时 reliability 满分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-er0', p95Ms: 100, errorRate: 0, quotaUsagePercent: 0.5, championActivityScore: 80, anomalyCount30d: 0,
    })
    expect(score.components.reliability).toBe(100)
  })

  it('Quota 100% 时 quotaHealth 仅 10 分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-q100', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 1.0, championActivityScore: 80, anomalyCount30d: 2,
    })
    expect(score.components.quotaHealth).toBe(10)
  })

  it('Champion 活跃度为 0 时 community 20 分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-c0', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.5, championActivityScore: 0, anomalyCount30d: 2,
    })
    expect(score.components.community).toBe(20)
  })

  /* ── generateSummary ── */
  it('generateSummary 应正确汇总多种状态', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const summary = dash.generateSummary([
      { tenantId: 't1', p95Ms: 50, errorRate: 0.001, quotaUsagePercent: 0.2, championActivityScore: 95, anomalyCount30d: 0 },
      { tenantId: 't2', p95Ms: 200, errorRate: 0.05, quotaUsagePercent: 0.85, championActivityScore: 20, anomalyCount30d: 10 },
      { tenantId: 't3', p95Ms: 8000, errorRate: 0.5, quotaUsagePercent: 1.0, championActivityScore: 0, anomalyCount30d: 100 },
    ])
    expect(summary.totalTenants).toBe(3)
    expect(summary.averageScore).toBeGreaterThan(0)
  })

  it('generateSummary 空输入应返回零值摘要', () => {
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const summary = dash.generateSummary([])
    expect(summary.totalTenants).toBe(0)
    expect(summary.averageScore).toBe(0)
  })

  /* ── 额外 ── */
  it('compute 返回的 score 应在 0-100 之间', () => {
    const svc = new HealthScoreService()
    const s1 = svc.compute({ tenantId: 't1', p95Ms: 50, errorRate: 0, quotaUsagePercent: 0, championActivityScore: 100, anomalyCount30d: 0 })
    const s2 = svc.compute({ tenantId: 't2', p95Ms: 9999, errorRate: 0.99, quotaUsagePercent: 2, championActivityScore: 0, anomalyCount30d: 999 })
    expect(s1.score).toBeGreaterThanOrEqual(0)
    expect(s1.score).toBeLessThanOrEqual(100)
    expect(s2.score).toBeGreaterThanOrEqual(0)
    expect(s2.score).toBeLessThanOrEqual(100)
  })

  it('compute 应返回所有组件评分', () => {
    const svc = new HealthScoreService()
    const score = svc.compute({ tenantId: 't', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 0.5, championActivityScore: 80, anomalyCount30d: 2 })
    expect(score.components.performance).toBeGreaterThanOrEqual(0)
    expect(score.components.reliability).toBeGreaterThanOrEqual(0)
    expect(score.components.quotaHealth).toBeGreaterThanOrEqual(0)
    expect(score.components.community).toBeGreaterThanOrEqual(0)
  })
});
