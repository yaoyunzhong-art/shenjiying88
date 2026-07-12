import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * health-dashboard.role.test.ts — L1 角色冒烟测试 (8角色 × health-dashboard)
 *
 * 从以下8个角色视角, 测试 HealthDashboard 模块的健康度评估、告警、汇总和指标导出:
 *   👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { HealthDashboardController } from './health-dashboard.controller'
import { HealthDashboardService } from './health-dashboard.service'
import { HealthScoreService } from './health-score.service'
// ── Helpers ──
function createController() {
  const healthScore = new HealthScoreService();
  const dashboard = new HealthDashboardService(healthScore);
  const controller = new HealthDashboardController(healthScore, dashboard);
  return { controller, healthScore, dashboard };
}

function healthyTenant(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'store-healthy',
    p95Ms: 50,
    errorRate: 0.0005,
    quotaUsagePercent: 0.3,
    championActivityScore: 90,
    anomalyCount30d: 0,
    ...overrides,
  };
}

function degradedTenant(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'store-bad',
    p95Ms: 5000,
    errorRate: 0.5,
    quotaUsagePercent: 2.0,
    championActivityScore: 0,
    anomalyCount30d: 50,
    ...overrides,
  };
}

function warningTenant(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'store-warn',
    p95Ms: 500,
    errorRate: 0.01,
    quotaUsagePercent: 0.75,
    championActivityScore: 30,
    anomalyCount30d: 5,
    ...overrides,
  };
}

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
};

// ──────── 👔店长 ────────
describe(`${ROLES.TenantAdmin} HealthDashboard 角色测试`, () => {
  it('店长可评估单租户健康度', () => {
    const { controller } = createController();
    const result = controller.evaluate({ tenants: [healthyTenant({ tenantId: 'store-1' })] });
    assert.equal(result.length, 1);
    assert.equal(result[0].status, 'HEALTHY');
    assert.ok(result[0].score >= 80);
    assert.equal(result[0].tenantId, 'store-1');
    assert.ok(Array.isArray(result[0].recommendations));
  });

  it('店长可评估批量租户 — 多健康状态混合', () => {
    const { controller } = createController();
    const result = controller.evaluate({ tenants: [healthyTenant(), degradedTenant(), warningTenant()] });
    assert.equal(result.length, 3);
    assert.equal(result[0].status, 'CRITICAL');
    assert.equal(result[1].status, 'WARNING');
    assert.equal(result[2].status, 'HEALTHY');
  });

  it('店长可检查告警 — 临界阈值', () => {
    const { controller } = createController();
    const alerts = controller.checkAlerts({
      scores: [degradedTenant()],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'feishu'] },
    });
    assert.ok(alerts.length >= 1);
    assert.equal(alerts[0].severity, 'CRITICAL');
  });
});

// ──────── 🛒前台 ────────
describe(`${ROLES.Reception} HealthDashboard 角色测试`, () => {
  it('前台可查看仪表板汇总 — 空输入', () => {
    const { controller } = createController();
    const summary = controller.generateSummary({});
    assert.equal(summary.totalTenants, 0);
    assert.equal(summary.averageScore, 0);
    assert.equal(summary.byStatus.HEALTHY, 0);
    assert.ok(summary.computedAt);
  });

  it('前台可查看 Prometheus 指标导出', () => {
    const { controller } = createController();
    const metrics = controller.getMetrics();
    assert.ok(metrics.includes('# HELP tenant_health_score_avg'));
    assert.ok(metrics.includes('# TYPE tenant_health_score_avg gauge'));
    assert.ok(metrics.includes('tenant_health_score_avg'));
  });

  it('前台可查看所有租户都健康时的汇总', () => {
    const { dashboard, healthScore } = createController();
    const inputs = [healthyTenant({ tenantId: 't1' }), healthyTenant({ tenantId: 't2', p95Ms: 80 })];
    const summary = dashboard.generateSummary(inputs);
    assert.equal(summary.totalTenants, 2);
    assert.equal(summary.byStatus.HEALTHY, 2);
    assert.equal(summary.byStatus.WARNING, 0);
    assert.equal(summary.byStatus.CRITICAL, 0);
    assert.ok(summary.averageScore >= 80);
  });
});

// ──────── 👥HR ────────
describe(`${ROLES.HR} HealthDashboard 角色测试`, () => {
  it('HR 可检查 Champion 活跃度对评分的影响', () => {
    const { healthScore } = createController();
    // champion=5 => community=40, perf=90, rel=90, quota=100
    // score = 27+27+20+8 = 82 => HEALTHY
    const score = healthScore.compute({
      tenantId: 'store-hr',
      p95Ms: 100,
      errorRate: 0.001,
      quotaUsagePercent: 0.4,
      championActivityScore: 5,
      anomalyCount30d: 0,
    });
    assert.ok(score.score >= 80);
    assert.equal(score.status, 'HEALTHY');
    assert.ok(score.components.community <= 40);
  });

  it('HR 可检查低活跃度导致的 WARNING', () => {
    const { controller } = createController();
    const scores = {
      tenantId: 'store-low-active',
      p95Ms: 300,
      errorRate: 0.005,
      quotaUsagePercent: 0.7,
      championActivityScore: 5,
      anomalyCount30d: 0,
    };
    const alerts = controller.checkAlerts({
      scores: [scores],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    // perf=70, rel=90, quota=90, community=40 => 21+27+18+8=74 => WARNING
    assert.ok(alerts.length >= 1);
    assert.equal(alerts[0].severity, 'WARNING');
  });
});

// ──────── 🔧安监 ────────
describe(`${ROLES.Safety} HealthDashboard 角色测试`, () => {
  it('安监可检查 CRITICAL 告警', () => {
    const { controller } = createController();
    const alerts = controller.checkAlerts({
      scores: [degradedTenant({ tenantId: 'store-critical' })],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'dingtalk'] },
    });
    assert.ok(alerts.length >= 1);
    assert.equal(alerts[0].severity, 'CRITICAL');
    assert.ok(alerts[0].notifyChannels.includes('dingtalk'));
  });

  it('安监可检查 WARNING 告警', () => {
    const { controller } = createController();
    const alerts = controller.checkAlerts({
      scores: [warningTenant({ tenantId: 'store-warn-safety' })],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    assert.ok(alerts.length >= 1);
    assert.equal(alerts[0].severity, 'WARNING');
  });

  it('安监可检查健康租户无告警', () => {
    const { controller } = createController();
    const alerts = controller.checkAlerts({
      scores: [healthyTenant({ tenantId: 'store-healthy-safety' })],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    assert.equal(alerts.length, 0);
  });
});

// ──────── 🎮导玩员 ────────
describe(`${ROLES.Guide} HealthDashboard 角色测试`, () => {
  it('导玩员可查看性能不达标的评估结果', () => {
    const { controller } = createController();
    const result = controller.evaluate({
      tenants: [healthyTenant({ tenantId: 'store-guide', p95Ms: 1200, errorRate: 0.02 })],
    });
    // perf=50, rel=50 => score down
    assert.ok(result[0].score < 80);
    assert.ok(result[0].recommendations.length > 0);
  });

  it('导玩员可查看异常数高时的评估', () => {
    const { healthScore } = createController();
    const score = healthScore.compute({
      tenantId: 'store-anomaly',
      p95Ms: 100,
      errorRate: 0.001,
      quotaUsagePercent: 0.4,
      championActivityScore: 50,
      anomalyCount30d: 15,
    });
    assert.ok(score.recommendations.some((r: string) => r.includes('异常事件')));
  });

  it('导玩员可查看有告警的汇总', () => {
    const { dashboard } = createController();
    const inputs = [healthyTenant({ tenantId: 't1' }), degradedTenant({ tenantId: 't2' })];
    const summary = dashboard.generateSummary(inputs);
    assert.ok(summary.topIssues.length > 0);
    assert.ok(summary.alerts.length > 0);
  });
});

// ──────── 🎯运行专员 ────────
describe(`${ROLES.Ops} HealthDashboard 角色测试`, () => {
  it('运行专员可检查混合告警', () => {
    const { controller } = createController();
    const alerts = controller.checkAlerts({
      scores: [healthyTenant(), degradedTenant(), warningTenant()],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'feishu'] },
    });
    assert.equal(alerts.length, 2);
    const severities = alerts.map((a: any) => a.severity);
    assert.ok(severities.includes('CRITICAL'));
    assert.ok(severities.includes('WARNING'));
  });

  it('运行专员可生成三状态汇总', () => {
    const { dashboard } = createController();
    const inputs = [
      healthyTenant({ tenantId: 'h' }),
      warningTenant({ tenantId: 'w' }),
      degradedTenant({ tenantId: 'd' }),
    ];
    const summary = dashboard.generateSummary(inputs);
    assert.equal(summary.byStatus.HEALTHY, 1);
    assert.equal(summary.byStatus.WARNING, 1);
    assert.equal(summary.byStatus.CRITICAL, 1);
    assert.equal(summary.totalTenants, 3);
  });

  it('运行专员可导出 Grafana 指标', () => {
    const { dashboard } = createController();
    const summary = dashboard.generateSummary([healthyTenant({ tenantId: 'g1' })]);
    const grafana = dashboard.toGrafana(summary);
    assert.ok(grafana.includes('tenant_health_score_avg'));
    assert.ok(grafana.includes('tenant_by_status_healthy'));
    assert.ok(grafana.includes('tenant_by_status_warning'));
    assert.ok(grafana.includes('tenant_by_status_critical'));
  });
});

// ──────── 🤝团建 ────────
describe(`${ROLES.Teambuilding} HealthDashboard 角色测试`, () => {
  it('团建可查看全健康评估', () => {
    const { controller } = createController();
    const result = controller.evaluate({
      tenants: [
        healthyTenant({ tenantId: 'a' }),
        healthyTenant({ tenantId: 'b', p95Ms: 150 }),
      ],
    });
    assert.equal(result.length, 2);
    assert.ok(result.every((r: any) => r.status === 'HEALTHY'));
  });

  it('团建可查看空汇总', () => {
    const { dashboard } = createController();
    const summary = dashboard.generateSummary([]);
    assert.equal(summary.totalTenants, 0);
    assert.equal(summary.averageScore, 0);
    assert.equal(summary.byStatus.HEALTHY, 0);
    assert.equal(summary.byStatus.WARNING, 0);
    assert.equal(summary.byStatus.CRITICAL, 0);
    assert.ok(summary.computedAt);
  });

  it('团建可查看最差租户排序', () => {
    const { controller } = createController();
    const result = controller.evaluate({
      tenants: [warningTenant({ tenantId: 'w' }), healthyTenant({ tenantId: 'h' }), degradedTenant({ tenantId: 'd' })],
    });
    assert.equal(result[0].tenantId, 'd');
    assert.equal(result[2].tenantId, 'h');
  });
});

// ──────── 📢营销 ────────
describe(`${ROLES.Marketing} HealthDashboard 角色测试`, () => {
  it('营销可查看配额使用率相关的告警', () => {
    const { controller } = createController();
    const alerts = controller.checkAlerts({
      scores: [{
        tenantId: 'store-marketing',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 0.95,
        championActivityScore: 80,
        anomalyCount30d: 0,
      }],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    assert.ok(alerts.length >= 1);
  });

  it('营销可查看包含多条建议的评估', () => {
    const { controller } = createController();
    const result = controller.evaluate({
      tenants: [{
        tenantId: 'store-needs-upgrade',
        p95Ms: 3000,
        errorRate: 0.02,
        quotaUsagePercent: 0.95,
        championActivityScore: 10,
        anomalyCount30d: 8,
      }],
    });
    assert.ok(result[0].recommendations.length > 0);
    const allRecs = result[0].recommendations.join(' ');
    assert.ok(
      allRecs.includes('性能') || allRecs.includes('错误率') ||
      allRecs.includes('配额') || allRecs.includes('Champion'),
    );
  });

  it('营销可查看指标格式', () => {
    const { controller } = createController();
    const metrics = controller.getMetrics();
    const lines = metrics.split('\n').filter((l: string) => l.trim());
    assert.ok(lines.length >= 10);
    assert.ok(lines.some((l: string) => l.startsWith('# HELP')));
    assert.ok(lines.some((l: string) => l.startsWith('# TYPE')));
    assert.ok(lines.some((l: string) => l.startsWith('tenant_')));
  });
});
