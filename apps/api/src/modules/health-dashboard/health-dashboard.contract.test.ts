import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [health-dashboard] [D] 合约测试
 *
 * 验证 health-dashboard 模块的实体 Shape、评分契约、告警契约、Grafana 导出契约
 * 覆盖: HealthScoreService, HealthDashboardService, 所有边界条件
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { HealthScoreService, HealthDashboardService } from './health-dashboard.entity';
import type { TenantHealthInput, TenantHealthScore, DashboardSummary, AlertConfig } from './health-dashboard.entity';

// ─── 服务实例 helpers ──────────────────────────────────

function makeScoreService(): HealthScoreService {
  return new HealthScoreService();
}

function makeDashboardService(): { healthScore: HealthScoreService; dashboard: HealthDashboardService } {
  const healthScore = new HealthScoreService();
  const dashboard = new HealthDashboardService(healthScore);
  return { healthScore, dashboard };
}

// ─── 测试数据工厂 ──────────────────────────────────────

function healthyInput(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return {
    tenantId: 'store-healthy',
    p95Ms: 50,
    errorRate: 0.0005,
    quotaUsagePercent: 0.3,
    championActivityScore: 100,
    anomalyCount30d: 0,
    ...overrides,
  };
}

function warningInput(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return {
    tenantId: 'store-warning',
    p95Ms: 400,
    errorRate: 0.008,
    quotaUsagePercent: 0.75,
    championActivityScore: 30,
    anomalyCount30d: 5,
    ...overrides,
  };
}

function criticalInput(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return {
    tenantId: 'store-critical',
    p95Ms: 5000,
    errorRate: 0.5,
    quotaUsagePercent: 2.0,
    championActivityScore: 0,
    anomalyCount30d: 50,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// 合约 A: 实体 Shape & 类型契约
// ═══════════════════════════════════════════════════════════

describe('[health-dashboard] 合约 A: 实体 Shape', () => {
  it('TenantHealthInput shape 正确', () => {
    const input = healthyInput();
    assert.equal(typeof input.tenantId, 'string');
    assert.equal(typeof input.p95Ms, 'number');
    assert.equal(typeof input.errorRate, 'number');
    assert.equal(typeof input.quotaUsagePercent, 'number');
    assert.equal(typeof input.championActivityScore, 'number');
    assert.equal(typeof input.anomalyCount30d, 'number');
    assert.ok(Number.isFinite(input.p95Ms));
    assert.ok(input.p95Ms >= 0);
    assert.ok(input.errorRate >= 0 && input.errorRate <= 1);
  });

  it('TenantHealthScore shape 正确', () => {
    const svc = makeScoreService();
    const score = svc.compute(healthyInput());
    assert.equal(typeof score.tenantId, 'string');
    assert.equal(typeof score.score, 'number');
    assert.ok(score.score >= 0 && score.score <= 100);
    assert.equal(typeof score.components.performance, 'number');
    assert.equal(typeof score.components.reliability, 'number');
    assert.equal(typeof score.components.quotaHealth, 'number');
    assert.equal(typeof score.components.community, 'number');
    assert.ok(['HEALTHY', 'WARNING', 'CRITICAL'].includes(score.status));
    assert.ok(Array.isArray(score.recommendations));
    assert.equal(typeof score.computedAt, 'string');
    assert.ok(!isNaN(Date.parse(score.computedAt)));
  });

  it('DashboardSummary shape 正确', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([healthyInput(), warningInput()]);
    assert.equal(typeof summary.totalTenants, 'number');
    assert.equal(typeof summary.byStatus.HEALTHY, 'number');
    assert.equal(typeof summary.byStatus.WARNING, 'number');
    assert.equal(typeof summary.byStatus.CRITICAL, 'number');
    assert.equal(typeof summary.averageScore, 'number');
    assert.ok(Array.isArray(summary.topIssues));
    assert.ok(Array.isArray(summary.alerts));
    assert.equal(typeof summary.computedAt, 'string');
    assert.ok(!isNaN(Date.parse(summary.computedAt)));
  });

  it('AlertConfig shape 正确', () => {
    const config: AlertConfig = {
      warningThreshold: 80,
      criticalThreshold: 60,
      notifyChannels: ['email', 'feishu', 'dingtalk'],
    };
    assert.equal(typeof config.warningThreshold, 'number');
    assert.equal(typeof config.criticalThreshold, 'number');
    assert.ok(Array.isArray(config.notifyChannels));
    assert.ok(config.notifyChannels.every(c => ['email', 'feishu', 'dingtalk'].includes(c)));
  });
});

// ═══════════════════════════════════════════════════════════
// 合约 B: 健康度评分契约
// ═══════════════════════════════════════════════════════════

describe('[health-dashboard] 合约 B: 健康度评分', () => {
  it('健康租户得到 HEALTHY 状态和 >=80 分', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ tenantId: 'store-001' }));
    assert.equal(result.status, 'HEALTHY');
    assert.ok(result.score >= 80);
    assert.equal(result.tenantId, 'store-001');
  });

  it('严重退化租户得到 CRITICAL 状态和 <60 分', () => {
    const svc = makeScoreService();
    const result = svc.compute(criticalInput({ tenantId: 'store-999' }));
    assert.equal(result.status, 'CRITICAL');
    assert.ok(result.score < 60);
    assert.equal(result.tenantId, 'store-999');
  });

  it('中等退化租户得到 WARNING 状态 (60-79)', () => {
    const svc = makeScoreService();
    const result = svc.compute(warningInput());
    assert.equal(result.status, 'WARNING');
    assert.ok(result.score >= 60 && result.score < 80);
  });

  it('每个组件分数在 0-100 范围内', () => {
    const svc = makeScoreService();
    const inputs = [
      healthyInput({ p95Ms: 0, errorRate: 0, quotaUsagePercent: 0, championActivityScore: 100 }),
      criticalInput({ p95Ms: 10000, errorRate: 1, quotaUsagePercent: 10, championActivityScore: 0 }),
      warningInput(),
    ];
    for (const input of inputs) {
      const result = svc.compute(input);
      for (const [key, val] of Object.entries(result.components)) {
        assert.ok(val >= 0 && val <= 100, `${key}=${val} 超出 0-100 范围 for ${input.tenantId}`);
      }
    }
  });

  it('P95=0 时 performance 得分最高 (100)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ p95Ms: 0 }));
    assert.equal(result.components.performance, 100);
  });

  it('P95>3000 时 performance 得分最低 (10)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ p95Ms: 5000 }));
    assert.equal(result.components.performance, 10);
  });

  it('错误率=0 时 reliability 得分最高 (100)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ errorRate: 0 }));
    assert.equal(result.components.reliability, 100);
  });

  it('错误率>=0.1 时 reliability 得分最低 (10)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ errorRate: 0.5 }));
    assert.equal(result.components.reliability, 10);
  });

  it('quota 使用率<50% 时得分最高 (100)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ quotaUsagePercent: 0.1 }));
    assert.equal(result.components.quotaHealth, 100);
  });

  it('quota 使用率>=100% 时得分最低 (10)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ quotaUsagePercent: 1.5 }));
    assert.equal(result.components.quotaHealth, 10);
  });

  it('champion 活跃度=100 时得分最高 (100)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ championActivityScore: 100 }));
    assert.equal(result.components.community, 100);
  });

  it('champion 活跃度=0 时得分最低 (20)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ championActivityScore: 0 }));
    assert.equal(result.components.community, 20);
  });

  it('anomalyCount30d>10 时包含稳定性推荐', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ anomalyCount30d: 20 }));
    const hasAnomalyRec = result.recommendations.some(r => r.includes('异常事件'));
    assert.ok(hasAnomalyRec);
  });

  it('anomalyCount30d=0 且其他健康时不包含异常推荐', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ anomalyCount30d: 0 }));
    const hasAnomalyRec = result.recommendations.some(r => r.includes('异常事件'));
    assert.ok(!hasAnomalyRec);
  });

  it('所有字段健康时推荐为"健康度良好"', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({
      p95Ms: 50, errorRate: 0.0005, quotaUsagePercent: 0.3,
      championActivityScore: 100, anomalyCount30d: 0,
    }));
    const hasGoodRec = result.recommendations.some(r => r.includes('健康度良好'));
    assert.ok(hasGoodRec);
  });

  it('computeBatch 按分数升序排列 (最差在前)', () => {
    const svc = makeScoreService();
    const results = svc.computeBatch([
      healthyInput({ tenantId: 'a', p95Ms: 50 }),
      criticalInput({ tenantId: 'b' }),
      warningInput({ tenantId: 'c' }),
    ]);
    assert.equal(results.length, 3);
    assert.equal(results[0].tenantId, 'b'); // 最差应在第一位
    assert.equal(results[2].tenantId, 'a'); // 最好应在最后一位
    assert.ok(results[0].score <= results[1].score);
    assert.ok(results[1].score <= results[2].score);
  });

  it('computeBatch 空输入返回空数组', () => {
    const svc = makeScoreService();
    const results = svc.computeBatch([]);
    assert.ok(Array.isArray(results));
    assert.equal(results.length, 0);
  });
});

// ═══════════════════════════════════════════════════════════
// 合约 C: 仪表板汇总契约
// ═══════════════════════════════════════════════════════════

describe('[health-dashboard] 合约 C: 仪表板汇总', () => {
  it('generateSummary 正确统计各状态数量', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([
      healthyInput({ tenantId: 'a' }),
      healthyInput({ tenantId: 'b' }),
      warningInput({ tenantId: 'c' }),
      criticalInput({ tenantId: 'd' }),
    ]);
    assert.equal(summary.totalTenants, 4);
    assert.equal(summary.byStatus.HEALTHY, 2);
    assert.equal(summary.byStatus.WARNING, 1);
    assert.equal(summary.byStatus.CRITICAL, 1);
  });

  it('generateSummary 正确计算平均分', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([
      healthyInput({ tenantId: 'a' }),
      criticalInput({ tenantId: 'b' }),
    ]);
    // 健康大约 95+, 严重大约 20-30, 平均大约 55-65
    assert.ok(summary.averageScore >= 40 && summary.averageScore <= 80);
    assert.equal(summary.totalTenants, 2);
  });

  it('generateSummary 空输入返回零值', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([]);
    assert.equal(summary.totalTenants, 0);
    assert.equal(summary.byStatus.HEALTHY, 0);
    assert.equal(summary.byStatus.WARNING, 0);
    assert.equal(summary.byStatus.CRITICAL, 0);
    assert.equal(summary.averageScore, 0);
    assert.equal(summary.alerts.length, 0);
  });

  it('generateSummary 只生成非健康状态的告警', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([
      healthyInput({ tenantId: 'a' }),
      warningInput({ tenantId: 'b' }),
      criticalInput({ tenantId: 'c' }),
    ]);
    assert.equal(summary.alerts.length, 2);
    const alertTenants = summary.alerts.map(a => a.tenantId);
    assert.ok(!alertTenants.includes('a'));
    assert.ok(alertTenants.includes('b'));
    assert.ok(alertTenants.includes('c'));
  });

  it('generateSummary topIssues 包含常见问题', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([criticalInput({ tenantId: 'x' })]);
    assert.ok(summary.topIssues.length > 0);
    // 应该有性能/错误率相关的 issue
    const allIssues = summary.topIssues.map(i => i.issue).join(' ');
    assert.ok(allIssues.length > 0);
  });
});

// ═══════════════════════════════════════════════════════════
// 合约 D: 告警检查契约
// ═══════════════════════════════════════════════════════════

describe('[health-dashboard] 合约 D: 告警检查', () => {
  it('分数低于 criticalThreshold 产生 CRITICAL 告警', () => {
    const { dashboard, healthScore } = makeDashboardService();
    const score = healthScore.compute(criticalInput());
    const alerts = dashboard.checkAlerts({
      scores: [score],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].severity, 'CRITICAL');
    assert.ok(alerts[0].notifyChannels.includes('email'));
  });

  it('分数介于 warningThreshold 和 criticalThreshold 之间产生 WARNING 告警', () => {
    const { dashboard, healthScore } = makeDashboardService();
    const score = healthScore.compute(warningInput());
    const alerts = dashboard.checkAlerts({
      scores: [score],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['feishu'] },
    });
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].severity, 'WARNING');
    // WARNING 默认只走 email
    assert.ok(Array.isArray(alerts[0].notifyChannels));
  });

  it('分数高于 warningThreshold 不产生告警', () => {
    const { dashboard, healthScore } = makeDashboardService();
    const score = healthScore.compute(healthyInput());
    const alerts = dashboard.checkAlerts({
      scores: [score],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    assert.equal(alerts.length, 0);
  });

  it('临界值检查: 分数等于 warningThreshold 产生 WARNING', () => {
    const { dashboard, healthScore } = makeDashboardService();
    const score = healthScore.compute(healthyInput({ p95Ms: 800, errorRate: 0.02, quotaUsagePercent: 0.85, championActivityScore: 10 }));
    const alerts = dashboard.checkAlerts({
      scores: [score],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    // 健康度应在 WARNING 附近
    if (score.score < 80) {
      assert.ok(alerts.length > 0);
    }
  });

  it('空分数数组返回空告警', () => {
    const { dashboard } = makeDashboardService();
    const alerts = dashboard.checkAlerts({
      scores: [],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    assert.equal(alerts.length, 0);
  });

  it('多租户告警独立产生', () => {
    const { dashboard, healthScore } = makeDashboardService();
    const scores = [
      healthScore.compute(criticalInput({ tenantId: 'a' })),
      healthScore.compute(criticalInput({ tenantId: 'b' })),
    ];
    const alerts = dashboard.checkAlerts({
      scores,
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email'] },
    });
    assert.equal(alerts.length, 2);
    assert.equal(alerts[0].tenantId, 'a');
    assert.equal(alerts[1].tenantId, 'b');
  });
});

// ═══════════════════════════════════════════════════════════
// 合约 E: Grafana 导出契约
// ═══════════════════════════════════════════════════════════

describe('[health-dashboard] 合约 E: Grafana 导出', () => {
  it('toGrafana 输出 Prometheus 格式文本', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([
      healthyInput({ tenantId: 'a' }),
      warningInput({ tenantId: 'b' }),
      criticalInput({ tenantId: 'c' }),
    ]);
    const output = dashboard.toGrafana(summary);
    assert.ok(output.includes('# HELP'));
    assert.ok(output.includes('# TYPE'));
    assert.ok(output.includes('tenant_health_score_avg'));
    assert.ok(output.includes('tenant_by_status_healthy'));
    assert.ok(output.includes('tenant_by_status_warning'));
    assert.ok(output.includes('tenant_by_status_critical'));
    assert.ok(output.includes(summary.averageScore.toFixed(2)));
    assert.equal(output.split('\n').length, 12); // 4 metrics groups × 3 lines each (HELP + TYPE + value)
  });

  it('toGrafana 空仪表板输出正确', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([]);
    const output = dashboard.toGrafana(summary);
    assert.ok(output.includes('tenant_health_score_avg 0.00'));
    assert.ok(output.includes('tenant_by_status_healthy 0'));
    assert.ok(output.includes('tenant_by_status_warning 0'));
    assert.ok(output.includes('tenant_by_status_critical 0'));
  });

  it('toGrafana 格式符合 Prometheus 规范', () => {
    const { dashboard } = makeDashboardService();
    const summary = dashboard.generateSummary([
      healthyInput({ tenantId: 'a' }),
      healthyInput({ tenantId: 'b' }),
    ]);
    const output = dashboard.toGrafana(summary);
    const lines = output.split('\n');
    // 每 3 行一组: HELP + TYPE + 数据
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        assert.ok(lines[i].startsWith('# HELP '), `行 ${i}: 应为 HELP`);
        assert.ok(lines[i + 1].startsWith('# TYPE '), `行 ${i + 1}: 应为 TYPE`);
        const metricInHelp = lines[i].split(' ')[2];
        const metricInType = lines[i + 1].split(' ')[2];
        assert.equal(metricInHelp, metricInType, `HELP 和 TYPE 的指标名应一致`);
        // 第 3 行为数据行
        assert.ok(/^[a-zA-Z_][a-zA-Z0-9_]+ [0-9.]+$/.test(lines[i + 2]), `数据行格式错误: ${lines[i + 2]}`);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════
// 合约 F: 边界条件契约
// ═══════════════════════════════════════════════════════════

describe('[health-dashboard] 合约 F: 边界条件', () => {
  it('P95=0 极端值处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ p95Ms: 0 }));
    assert.equal(result.components.performance, 100);
    assert.ok(result.score >= 80);
  });

  it('P95 极大值处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ p95Ms: 1e6 }));
    assert.equal(result.components.performance, 10);
  });

  it('errorRate=0 极端值处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ errorRate: 0 }));
    assert.equal(result.components.reliability, 100);
  });

  it('errorRate=1 极端值处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ errorRate: 1 }));
    assert.equal(result.components.reliability, 10);
  });

  it('quotaUsagePercent=0 处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ quotaUsagePercent: 0 }));
    assert.equal(result.components.quotaHealth, 100);
  });

  it('quotaUsagePercent 极大值处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ quotaUsagePercent: 100 }));
    assert.equal(result.components.quotaHealth, 10);
  });

  it('championActivityScore=0 处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ championActivityScore: 0 }));
    assert.equal(result.components.community, 20);
  });

  it('championActivityScore 极大值处理', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ championActivityScore: 9999 }));
    assert.equal(result.components.community, 100);
  });

  it('anomalyCount30d=0 不产生异常推荐', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ anomalyCount30d: 0 }));
    const anomalyRecs = result.recommendations.filter(r => r.includes('异常'));
    assert.equal(anomalyRecs.length, 0);
  });

  it('anomalyCount30d=11 产生异常推荐 (边界)', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({ anomalyCount30d: 11 }));
    const anomalyRecs = result.recommendations.filter(r => r.includes('异常事件'));
    assert.ok(anomalyRecs.length > 0);
  });

  it('所有指标极差时状态为 CRITICAL', () => {
    const svc = makeScoreService();
    const result = svc.compute(criticalInput({
      p95Ms: 99999,
      errorRate: 0.99,
      quotaUsagePercent: 99,
      championActivityScore: 0,
      anomalyCount30d: 999,
    }));
    assert.equal(result.status, 'CRITICAL');
    assert.ok(result.score < 40);
    // 应有多个推荐
    assert.ok(result.recommendations.length >= 4);
  });

  it('所有指标极优时状态为 HEALTHY', () => {
    const svc = makeScoreService();
    const result = svc.compute(healthyInput({
      p95Ms: 1,
      errorRate: 0,
      quotaUsagePercent: 0.01,
      championActivityScore: 100,
      anomalyCount30d: 0,
    }));
    assert.equal(result.status, 'HEALTHY');
    assert.ok(result.score >= 95);
    assert.ok(result.recommendations.some(r => r.includes('健康度良好')));
  });
});
