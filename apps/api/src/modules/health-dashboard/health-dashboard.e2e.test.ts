import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { HealthScoreService, type TenantHealthInput } from './health-score.service';
import { HealthDashboardService } from './health-dashboard.service';

describe('Phase-19 T34-T35 健康度', () => {
  let healthScore: HealthScoreService;
  let dashboard: HealthDashboardService;

  beforeEach(() => {
    healthScore = new HealthScoreService();
    dashboard = new HealthDashboardService(healthScore);
  });

  // AC-1: 健康租户评分 >= 80
  it('AC-1 healthy tenant scores >= 80', () => {
    const score = healthScore.compute({
      tenantId: 'tenant-A',
      p95Ms: 150,
      errorRate: 0.001,
      quotaUsagePercent: 0.5,
      championActivityScore: 80,
      anomalyCount30d: 1,
    });
    expect(score.score).toBeGreaterThanOrEqual(80);
    expect(score.status).toBe('HEALTHY');
  });

  // AC-2: 性能差的租户触发 recommendations
  it('AC-2 slow tenant gets performance recommendation', () => {
    const score = healthScore.compute({
      tenantId: 'tenant-B',
      p95Ms: 2000,
      errorRate: 0.001,
      quotaUsagePercent: 0.5,
      championActivityScore: 50,
      anomalyCount30d: 0,
    });
    expect(score.components.performance).toBeLessThan(70);
    expect(score.recommendations.some((r) => r.includes('性能'))).toBe(true);
  });

  // AC-3: 配额超限 + 多组件差 → CRITICAL
  it('AC-3 quota exceeded triggers CRITICAL', () => {
    const score = healthScore.compute({
      tenantId: 'tenant-C',
      p95Ms: 2000,
      errorRate: 0.1,
      quotaUsagePercent: 1.2,
      championActivityScore: 0,
      anomalyCount30d: 15,
    });
    expect(score.components.quotaHealth).toBeLessThanOrEqual(30);
    expect(score.score).toBeLessThan(60);
    expect(score.status).toBe('CRITICAL');
  });

  // AC-4: 批量排序 (差在前)
  it('AC-4 batch sorting worst-first', () => {
    const inputs: TenantHealthInput[] = [
      { tenantId: 'good', p95Ms: 100, errorRate: 0.001, quotaUsagePercent: 0.4, championActivityScore: 100, anomalyCount30d: 0 },
      { tenantId: 'bad', p95Ms: 2000, errorRate: 0.1, quotaUsagePercent: 0.95, championActivityScore: 0, anomalyCount30d: 20 },
      { tenantId: 'mid', p95Ms: 500, errorRate: 0.01, quotaUsagePercent: 0.7, championActivityScore: 30, anomalyCount30d: 5 },
    ];
    const scores = healthScore.computeBatch(inputs);
    expect(scores[0].tenantId).toBe('bad');
    expect(scores[scores.length - 1].tenantId).toBe('good');
  });

  // AC-5: Dashboard summary + 告警
  it('AC-5 dashboard summary + alerts', () => {
    const summary = dashboard.generateSummary([
      { tenantId: 'a', p95Ms: 100, errorRate: 0.001, quotaUsagePercent: 0.4, championActivityScore: 100, anomalyCount30d: 0 },
      { tenantId: 'b', p95Ms: 2000, errorRate: 0.1, quotaUsagePercent: 0.95, championActivityScore: 0, anomalyCount30d: 20 },
    ]);
    expect(summary.totalTenants).toBe(2);
    expect(summary.byStatus.CRITICAL).toBe(1);
    expect(summary.alerts.length).toBe(1);
    expect(summary.alerts[0].tenantId).toBe('b');
  });

  // AC-6: Alert check 多渠道
  it('AC-6 alert check with multi-channel', () => {
    const score = healthScore.compute({
      tenantId: 'x', p95Ms: 3000, errorRate: 0.1, quotaUsagePercent: 1.0, championActivityScore: 0, anomalyCount30d: 30,
    });
    const alerts = dashboard.checkAlerts({
      scores: [score],
      config: { warningThreshold: 80, criticalThreshold: 50, notifyChannels: ['email', 'feishu'] },
    });
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('CRITICAL');
    expect(alerts[0].notifyChannels).toContain('feishu');
  });

  // AC-7: Grafana 导出
  it('AC-7 Grafana export format', () => {
    const summary = dashboard.generateSummary([
      { tenantId: 'a', p95Ms: 100, errorRate: 0.001, quotaUsagePercent: 0.4, championActivityScore: 100, anomalyCount30d: 0 },
    ]);
    const prom = dashboard.toGrafana(summary);
    expect(prom).toContain('# HELP tenant_health_score_avg');
    expect(prom).toContain('# TYPE tenant_health_score_avg gauge');
    expect(prom).toContain('tenant_by_status_healthy');
  });
});
