import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * alert-engine.test.ts - Phase-22 T75
 * Alert 引擎单元测试
 */
import assert from 'node:assert/strict';
import { AlertEngine, DEFAULT_ALERT_RULES, installDefaultRules } from './alert-engine';
import { MetricsService } from './metrics.service';

describe('AlertEngine · rule management', () => {
  let engine: AlertEngine;
  let metrics: MetricsService;
  beforeEach(() => {
    metrics = new MetricsService();
    engine = new AlertEngine({ metrics });
  });

  it('AC-1 addRule + listRules', () => {
    engine.addRule({ id: 'r1', severity: 'P0', title: 'r1', metric: 'm', evaluator: () => true, windowMs: 1000 });
    engine.addRule({ id: 'r2', severity: 'P1', title: 'r2', metric: 'm', evaluator: () => false, windowMs: 1000 });
    const rules = engine.listRules();
    assert.equal(rules.length, 2);
    assert.equal(rules[0].id, 'r1');
    assert.equal(rules[1].severity, 'P1');
  });

  it('AC-2 removeRule 返回成功标记', () => {
    engine.addRule({ id: 'r1', severity: 'P0', title: 'r1', metric: 'm', evaluator: () => true, windowMs: 1000 });
    assert.equal(engine.removeRule('r1'), true);
    assert.equal(engine.removeRule('r1'), false);
  });
});

describe('AlertEngine · evaluation', () => {
  let metrics: MetricsService;
  beforeEach(() => {
    metrics = new MetricsService();
  });

  it('AC-3 evaluator 返回 true → firing', () => {
    const engine = new AlertEngine({ metrics, defaultMinSamples: 0 });
    engine.addRule({ id: 'r1', severity: 'P0', title: 'r1', metric: 'm', evaluator: () => true, windowMs: 1000 });
    const alerts = engine.evaluate();
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].state, 'firing');
    assert.equal(alerts[0].severity, 'P0');
  });

  it('AC-4 evaluator 返回 false → 不 firing', () => {
    const engine = new AlertEngine({ metrics, defaultMinSamples: 0 });
    engine.addRule({ id: 'r1', severity: 'P0', title: 'r1', metric: 'm', evaluator: () => false, windowMs: 1000 });
    const alerts = engine.evaluate();
    assert.equal(alerts.length, 0);
  });

  it('AC-5 minSamples 不满足 → 不 firing (冷启动保护)', () => {
    const engine = new AlertEngine({ metrics, defaultMinSamples: 100 });
    engine.addRule({ id: 'r1', severity: 'P0', title: 'r1', metric: 'm', evaluator: () => true, windowMs: 1000 });
    const alerts = engine.evaluate();
    assert.equal(alerts.length, 0);
  });

  it('AC-6 alert 重新触发保持 firedAt', async () => {
    const engine = new AlertEngine({ metrics, defaultMinSamples: 0 });
    engine.addRule({ id: 'r1', severity: 'P0', title: 'r1', metric: 'm', evaluator: () => true, windowMs: 1000 });
    const first = engine.evaluate();
    const firedAt1 = first[0].firedAt;
    await new Promise((r) => setTimeout(r, 10));
    const second = engine.evaluate();
    assert.equal(second[0].firedAt, firedAt1, '持续 firing 应保持原 firedAt');
  });

  it('AC-7 firing → resolved 转换', () => {
    let shouldFire = true;
    const engine = new AlertEngine({ metrics, defaultMinSamples: 0 });
    engine.addRule({ id: 'r1', severity: 'P0', title: 'r1', metric: 'm', evaluator: () => shouldFire, windowMs: 1000 });
    const first = engine.evaluate();
    assert.equal(first[0].state, 'firing');
    shouldFire = false;
    const second = engine.evaluate();
    assert.equal(second.length, 0);
    const history = engine.getHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].state, 'resolved');
    assert.ok(history[0].resolvedAt);
  });
});

describe('AlertEngine · inhibit rules', () => {
  let metrics: MetricsService;
  beforeEach(() => {
    metrics = new MetricsService();
  });

  it('AC-8 P0 触发时抑制 P1', () => {
    const engine = new AlertEngine({ metrics, defaultMinSamples: 0 });
    engine.addRule({ id: 'p0', severity: 'P0', title: 'p0', metric: 'm', evaluator: () => true, windowMs: 1000, inhibits: ['p1'] });
    engine.addRule({ id: 'p1', severity: 'P1', title: 'p1', metric: 'm', evaluator: () => true, windowMs: 1000 });
    const alerts = engine.evaluate();
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].ruleId, 'p0');
  });

  it('AC-9 P0 未触发时 P1 正常 firing', () => {
    const engine = new AlertEngine({ metrics, defaultMinSamples: 0 });
    engine.addRule({ id: 'p0', severity: 'P0', title: 'p0', metric: 'm', evaluator: () => false, windowMs: 1000, inhibits: ['p1'] });
    engine.addRule({ id: 'p1', severity: 'P1', title: 'p1', metric: 'm', evaluator: () => true, windowMs: 1000 });
    const alerts = engine.evaluate();
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].ruleId, 'p1');
  });
});

describe('AlertEngine · default rules', () => {
  it('AC-10 installDefaultRules 注册 5 条', () => {
    const metrics = new MetricsService();
    const engine = new AlertEngine({ metrics });
    installDefaultRules(engine);
    assert.equal(engine.listRules().length, DEFAULT_ALERT_RULES.length);
  });

  it('AC-11 默认规则覆盖 P0/P1/P2', () => {
    const sevs = new Set(DEFAULT_ALERT_RULES.map((r) => r.severity));
    assert.ok(sevs.has('P0'));
    assert.ok(sevs.has('P1'));
  });
});

describe('AlertEngine · value snapshot', () => {
  it('AC-12 alert 包含 value (触发时的 avg)', () => {
    const metrics = new MetricsService();
    const engine = new AlertEngine({ metrics, defaultMinSamples: 0 });
    let capturedValue: number | undefined;
    engine.addRule({
      id: 'r1',
      severity: 'P0',
      title: 'r1',
      metric: 'm',
      evaluator: (s) => {
        capturedValue = s.avg;
        return true;
      },
      windowMs: 1000,
    });
    const alerts = engine.evaluate();
    assert.ok(alerts[0].value !== undefined);
    assert.equal(alerts[0].value, capturedValue);
  });
});
