import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * slo-engine.test.ts - Phase-22 T77/T78
 * SLO 计算引擎 + Error Budget 单元测试
 */
import assert from 'node:assert/strict';
import { SLOCalculator, DEFAULT_SLO_TARGETS, type SLIDataPoint } from './slo-engine';

function makePoints(opts: {
  total?: number;
  errors?: number;
  latencies?: number[];
  count?: number; // data points count
  windowDays?: number;
}): SLIDataPoint[] {
  const total = opts.total ?? 100;
  const errors = opts.errors ?? 0;
  const latencies = opts.latencies ?? [];
  const count = opts.count ?? 1;
  const dayMs = 24 * 60 * 60 * 1000;
  const points: SLIDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      timestamp: new Date(Date.now() - i * dayMs).toISOString(),
      total,
      successful: total - errors,
      errors,
      latencies,
    });
  }
  return points;
}

describe('SLOCalculator · availability', () => {
  it('AC-1 100% success → passing', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    const report = calc.evaluate('api_availability', makePoints({ total: 1000, errors: 0, count: 30 }));
    assert.equal(report.passing, true);
    assert.equal(report.current, 1);
    assert.equal(report.budgetRemaining, 1);
  });

  it('AC-2 99.5% success (低于 99.9% 目标) → failing', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    const report = calc.evaluate('api_availability', makePoints({ total: 1000, errors: 5, count: 30 }));
    assert.equal(report.passing, false);
    assert.equal(report.current, 0.995);
    assert.ok(report.budgetUsed > 0, 'budget 已用');
  });

  it('AC-3 monthly budget = 1 - target (0.001 for 99.9%)', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    const report = calc.evaluate('api_availability', makePoints({}));
    assert.equal(report.monthlyBudget.toFixed(4), '0.0010');
  });

  it('AC-4 99.95% → passing 且 budget 剩余 > 50%', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    const report = calc.evaluate('api_availability', makePoints({ total: 10000, errors: 5, count: 30 }));
    assert.equal(report.passing, true);
    assert.ok(report.budgetRemaining > 0.5);
  });
});

describe('SLOCalculator · latency', () => {
  it('AC-5 P99 latency 400ms (低于 500ms) → passing', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[1]] });
    const points = makePoints({ latencies: [100, 200, 300, 400, 500], count: 30 });
    const report = calc.evaluate('api_latency_p99', points);
    assert.equal(report.passing, true);
    assert.ok(report.current <= 500);
  });

  it('AC-6 P99 latency 800ms (高于 500ms) → failing', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[1]] });
    const points = makePoints({ latencies: [100, 200, 300, 400, 800], count: 30 });
    const report = calc.evaluate('api_latency_p99', points);
    assert.equal(report.passing, false);
    assert.equal(report.current, 800);
  });

  it('AC-7 P95 latency 计算', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[2]] });
    const points = makePoints({ latencies: [50, 100, 150, 200, 250], count: 30 });
    const report = calc.evaluate('api_latency_p95', points);
    assert.equal(report.current, 250);
  });
});

describe('SLOCalculator · error rate', () => {
  it('AC-8 0.05% 错误率 (低于 0.1%) → passing', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[3]] });
    const points = makePoints({ total: 10000, errors: 5, count: 30 });
    const report = calc.evaluate('api_error_rate', points);
    assert.equal(report.passing, true);
    assert.equal(report.current, 0.0005);
  });

  it('AC-9 1% 错误率 → failing', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[3]] });
    const points = makePoints({ total: 100, errors: 1, count: 30 });
    const report = calc.evaluate('api_error_rate', points);
    assert.equal(report.passing, false);
  });
});

describe('SLOCalculator · burn rate', () => {
  it('AC-10 burn rate 触发 P0 (1h budget 耗尽)', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    // 30 天窗口,1 小时窗口:99% 可用性 (大量错误)
    const hourMs = 60 * 60 * 1000;
    const report = calc.evaluate('api_availability', makePoints({ total: 100, errors: 50, count: 30 }), hourMs);
    // burn rate 应该 >= 14.4 → P0
    const alert = calc.checkBurnRateAlert(report);
    assert.ok(alert.alert, '应触发告警');
    assert.equal(alert.severity, 'P0');
  });

  it('AC-11 burn rate 触发 P1 (6h budget 5% 耗尽)', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    const sixHourMs = 6 * 60 * 60 * 1000;
    // 99.5% availability → 0.5% 错误 → 超过 0.1% budget 的 5 倍
    const report = calc.evaluate('api_availability', makePoints({ total: 1000, errors: 5, count: 30 }), sixHourMs);
    const alert = calc.checkBurnRateAlert(report);
    assert.ok(alert.alert);
  });

  it('AC-12 burn rate 未达告警阈值', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    // 99.99% → 极低 burn rate
    const report = calc.evaluate('api_availability', makePoints({ total: 10000, errors: 1, count: 30 }));
    const alert = calc.checkBurnRateAlert(report);
    assert.equal(alert.alert, false);
    assert.equal(alert.severity, null);
  });
});

describe('SLOCalculator · 批量评估', () => {
  it('AC-13 evaluateAll 返回所有 target 报告', () => {
    const calc = new SLOCalculator({ targets: DEFAULT_SLO_TARGETS });
    const pointsBySLO = {
      api_availability: makePoints({ total: 100, errors: 0, count: 30 }),
      api_latency_p99: makePoints({ latencies: [100], count: 30 }),
      api_latency_p95: makePoints({ latencies: [50], count: 30 }),
      api_error_rate: makePoints({ total: 100, errors: 0, count: 30 }),
    };
    const reports = calc.evaluateAll(pointsBySLO);
    assert.equal(reports.length, 4);
    assert.ok(reports.every((r) => r.passing));
  });
});

describe('SLOCalculator · 边界', () => {
  it('AC-14 未知 targetId 抛错', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    assert.throws(() => calc.evaluate('unknown', []), /Unknown SLO target/);
  });

  it('AC-15 空 targets 抛错', () => {
    assert.throws(() => new SLOCalculator({ targets: [] }), /at least one/i);
  });

  it('AC-16 无 data points → current 0/1 边界', () => {
    const calc = new SLOCalculator({ targets: [DEFAULT_SLO_TARGETS[0]] });
    const report = calc.evaluate('api_availability', []);
    assert.equal(report.current, 1);
  });
});

describe('DEFAULT_SLO_TARGETS', () => {
  it('AC-17 默认 4 个 targets', () => {
    assert.equal(DEFAULT_SLO_TARGETS.length, 4);
  });
});
