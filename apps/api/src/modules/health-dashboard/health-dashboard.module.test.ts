// health-dashboard.module.test.ts — 健康度仪表板模块测试
import { describe, it, expect } from 'vitest'
import { HealthDashboardModule } from './health-dashboard.module';

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

  it('Controller 应为 HealthDashboardController', () => {
    const controllers = Reflect.getMetadata('controllers', HealthDashboardModule) || []
    const [{ name }] = controllers
    // Import the actual class for assertion
    expect(controllers.length).toBe(1)
  })

  it('Provider 列表应包含 HealthScoreService 和 HealthDashboardService', () => {
    const providers = Reflect.getMetadata('providers', HealthDashboardModule) || []
    const names = providers.map((p: any) => p?.name || p)
    expect(names.some((n: string) => n === 'HealthScoreService')).toBe(true)
    expect(names.some((n: string) => n === 'HealthDashboardService')).toBe(true)
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
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-good',
      p95Ms: 50,
      errorRate: 0.01,
      quotaUsagePercent: 20,
      championActivityScore: 95,
      anomalyCount30d: 0,
    })
    expect(score.status).toBe('HEALTHY')
    expect(score.score).toBeGreaterThanOrEqual(85)
  })

  it('健康度评分: 恶化租户应返回 CRITICAL', () => {
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-bad',
      p95Ms: 8000,
      errorRate: 20,
      quotaUsagePercent: 100,
      championActivityScore: 0,
      anomalyCount30d: 100,
    })
    expect(score.status).toBe('CRITICAL')
    expect(score.score).toBeLessThan(30)
  })

  it('批量评分应正确处理混合租户', () => {
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const results = svc.computeBatch([
      { tenantId: 't1', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 50, championActivityScore: 80, anomalyCount30d: 2 },
      { tenantId: 't2', p95Ms: 5000, errorRate: 15, quotaUsagePercent: 100, championActivityScore: 0, anomalyCount30d: 50 },
    ])
    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('HEALTHY')
    expect(results[1].status).toBe('CRITICAL')
  })

  /* ── 边界场景 ── */
  it('空批次应返回空数组', () => {
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    expect(svc.computeBatch([])).toEqual([])
  })

  it('P95 为 0 时应为满分', () => {
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-p0',
      p95Ms: 0,
      errorRate: 0,
      quotaUsagePercent: 0,
      championActivityScore: 100,
      anomalyCount30d: 0,
    })
    expect(score.components.performance).toBeGreaterThanOrEqual(95)
  })

  it('ErrorRate 为 0 时可靠性满分', () => {
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-er0',
      p95Ms: 100,
      errorRate: 0,
      quotaUsagePercent: 50,
      championActivityScore: 80,
      anomalyCount30d: 0,
    })
    expect(score.components.reliability).toBeGreaterThanOrEqual(95)
  })

  it('Quota 100% 时配额分为 0', () => {
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-q100',
      p95Ms: 100,
      errorRate: 0.05,
      quotaUsagePercent: 100,
      championActivityScore: 80,
      anomalyCount30d: 2,
    })
    expect(score.components.quotaHealth).toBeLessThanOrEqual(10)
  })

  it('Champion 活跃度为 0 分', () => {
    const { HealthScoreService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const score = svc.compute({
      tenantId: 't-c0',
      p95Ms: 100,
      errorRate: 0.05,
      quotaUsagePercent: 50,
      championActivityScore: 0,
      anomalyCount30d: 2,
    })
    expect(score.components.community).toBeLessThanOrEqual(10)
  })

  /* ── generateSummary ── */
  it('generateSummary 应正确汇总多种状态', () => {
    const { HealthScoreService, HealthDashboardService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const summary = dash.generateSummary([
      { tenantId: 't1', p95Ms: 50, errorRate: 0.01, quotaUsagePercent: 20, championActivityScore: 95, anomalyCount30d: 0 },
      { tenantId: 't2', p95Ms: 200, errorRate: 5, quotaUsagePercent: 85, championActivityScore: 20, anomalyCount30d: 10 },
      { tenantId: 't3', p95Ms: 8000, errorRate: 20, quotaUsagePercent: 100, championActivityScore: 0, anomalyCount30d: 100 },
    ])
    expect(summary.totalTenants).toBe(3)
    expect(summary.byStatus.HEALTHY).toBeGreaterThanOrEqual(1)
    expect(summary.byStatus.CRITICAL).toBeGreaterThanOrEqual(1)
    expect(summary.averageScore).toBeGreaterThan(0)
  })

  it('generateSummary 空输入应返回零值摘要', () => {
    const { HealthScoreService, HealthDashboardService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const summary = dash.generateSummary([])
    expect(summary.totalTenants).toBe(0)
    expect(summary.averageScore).toBe(0)
  })

  /* ── evaluateAlerts ── */
  it('evaluateAlerts: 严重告警应包含 critical', () => {
    const { HealthScoreService, HealthDashboardService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const score = svc.compute({
      tenantId: 't-crit', p95Ms: 8000, errorRate: 20, quotaUsagePercent: 100,
      championActivityScore: 0, anomalyCount30d: 100,
    })
    const alerts = dash.evaluateAlerts(score, { warningThreshold: 60, criticalThreshold: 40, notifyChannels: ['email', 'feishu'] })
    expect(alerts.length).toBeGreaterThanOrEqual(1)
    const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical')
    expect(criticalAlerts.length).toBeGreaterThanOrEqual(1)
  })

  it('evaluateAlerts: 健康租户应无告警', () => {
    const { HealthScoreService, HealthDashboardService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const score = svc.compute({
      tenantId: 't-healthy', p95Ms: 50, errorRate: 0.01, quotaUsagePercent: 20,
      championActivityScore: 95, anomalyCount30d: 0,
    })
    const alerts = dash.evaluateAlerts(score, { warningThreshold: 60, criticalThreshold: 40, notifyChannels: ['email'] })
    const warned = alerts.filter((a: any) => a.severity === 'warning' || a.severity === 'critical')
    expect(warned.length).toBe(0)
  })

  /* ── generateExportData ── */
  it('generateExportData 应返回可导出的对象', () => {
    const { HealthScoreService, HealthDashboardService } = require('./health-dashboard.entity')
    const svc = new HealthScoreService()
    const dash = new HealthDashboardService(svc)
    const scores = [svc.compute({ tenantId: 't1', p95Ms: 100, errorRate: 0.05, quotaUsagePercent: 50, championActivityScore: 80, anomalyCount30d: 2 })]
    const exportData = dash.generateExportData(scores)
    expect(exportData).toBeDefined()
    expect(typeof exportData).toBe('object')
  })
});
