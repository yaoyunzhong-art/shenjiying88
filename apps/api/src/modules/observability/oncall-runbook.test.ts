import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * oncall-runbook.test.ts - Phase-22 T76
 * Oncall 轮值 + Runbook 执行单元测试
 */
import assert from 'node:assert/strict';
import {
  OncallRotation,
  RunbookRegistry,
  MockNotifier,
  installDefaultRunbooks,
  DEFAULT_RUNBOOKS,
  type OncallEngineer,
  type RunbookExecutorContext,
} from './oncall-runbook';
import type { Alert } from './alert-engine';

const ENGINEERS: OncallEngineer[] = [
  { id: 'e1', name: 'Alice', email: 'alice@m5', phone: '+8613800000001', feishuUserId: 'ou_alice', timezone: 'Asia/Shanghai' },
  { id: 'e2', name: 'Bob', email: 'bob@m5', phone: '+8613800000002', feishuUserId: 'ou_bob', timezone: 'Asia/Shanghai' },
  { id: 'e3', name: 'Carol', email: 'carol@m5', phone: '+8613800000003', feishuUserId: 'ou_carol', timezone: 'Asia/Shanghai' },
];

const SAMPLE_ALERT: Alert = {
  id: 'alert-1',
  ruleId: 'http_5xx_high',
  severity: 'P0',
  title: '5xx',
  state: 'firing',
  firedAt: new Date().toISOString(),
  windowMs: 60000,
  service: 'm5-api',
};

describe('OncallRotation', () => {
  it('AC-1 3 个工程师轮值 (7 天周期)', () => {
    const rotation = new OncallRotation({
      engineers: ENGINEERS,
      rotationMs: 7 * 24 * 60 * 60 * 1000,
      startAt: Date.UTC(2026, 5, 1), // 2026-06-01
    });
    // Week 1: Alice primary
    const week1 = rotation.currentSchedule(Date.UTC(2026, 5, 3));
    assert.equal(week1.primary?.id, 'e1');
    assert.equal(week1.secondary?.id, 'e2');
    assert.equal(week1.manager?.id, 'e3');
    // Week 2: Bob primary
    const week2 = rotation.currentSchedule(Date.UTC(2026, 5, 10));
    assert.equal(week2.primary?.id, 'e2');
    // Week 3: Carol primary
    const week3 = rotation.currentSchedule(Date.UTC(2026, 5, 17));
    assert.equal(week3.primary?.id, 'e3');
    // Week 4: 回 Alice
    const week4 = rotation.currentSchedule(Date.UTC(2026, 5, 24));
    assert.equal(week4.primary?.id, 'e1');
  });

  it('AC-2 工程师列表为空时抛错', () => {
    assert.throws(() => new OncallRotation({ engineers: [] }), /At least one engineer/);
  });

  it('AC-3 getOncallAt 返回指定时间点的 primary', () => {
    const rotation = new OncallRotation({
      engineers: ENGINEERS,
      rotationMs: 7 * 24 * 60 * 60 * 1000,
      startAt: Date.UTC(2026, 5, 1),
    });
    const oncall = rotation.getOncallAt(Date.UTC(2026, 5, 10), 'primary');
    assert.equal(oncall?.id, 'e2');
  });

  it('AC-4 listEngineers 返回完整列表', () => {
    const rotation = new OncallRotation({ engineers: ENGINEERS });
    assert.equal(rotation.listEngineers().length, 3);
  });

  it('AC-5 schedule 包含 cycleStart / cycleEnd', () => {
    const rotation = new OncallRotation({
      engineers: ENGINEERS,
      rotationMs: 7 * 24 * 60 * 60 * 1000,
      startAt: Date.UTC(2026, 5, 1),
    });
    const schedule = rotation.currentSchedule(Date.UTC(2026, 5, 3));
    assert.ok(schedule.cycleStart);
    assert.ok(schedule.cycleEnd);
    assert.notEqual(schedule.cycleStart, schedule.cycleEnd);
  });
});

describe('RunbookRegistry', () => {
  let registry: RunbookRegistry;
  let notifier: MockNotifier;
  let ctx: RunbookExecutorContext;

  beforeEach(() => {
    registry = new RunbookRegistry();
    notifier = new MockNotifier();
    ctx = {
      alert: SAMPLE_ALERT,
      executeActions: true,
      notifier,
      serviceRestarter: async () => ({ success: true, message: 'restarted' }),
      cacheClearer: async () => ({ success: true, message: 'cleared' }),
    };
  });

  it('AC-6 register + get by alertRuleId', () => {
    registry.register({
      id: 'rb1',
      alertRuleId: 'http_5xx_high',
      enabled: true,
      actions: [{ type: 'log', message: 'test', level: 'info' }],
    });
    const rb = registry.get('http_5xx_high');
    assert.ok(rb);
    assert.equal(rb.id, 'rb1');
  });

  it('AC-7 未注册的 alertRuleId 返回 undefined', () => {
    assert.equal(registry.get('unknown'), undefined);
  });

  it('AC-8 execute 按顺序执行所有 actions', async () => {
    registry.register({
      id: 'rb1',
      alertRuleId: 'http_5xx_high',
      enabled: true,
      actions: [
        { type: 'log', message: 'first', level: 'info' },
        { type: 'page', severity: 'P0', channel: 'feishu' },
      ],
    });
    const { results } = await registry.execute('http_5xx_high', ctx);
    assert.equal(results.length, 2);
    assert.equal(results[0].action.type, 'log');
    assert.equal(results[1].action.type, 'page');
    assert.equal(results[1].ok, true);
  });

  it('AC-9 disabled runbook 不执行', async () => {
    registry.register({
      id: 'rb1',
      alertRuleId: 'http_5xx_high',
      enabled: false,
      actions: [{ type: 'page', severity: 'P0', channel: 'feishu' }],
    });
    const { results } = await registry.execute('http_5xx_high', ctx);
    assert.equal(results.length, 0);
    assert.equal(notifier.sentMessages.length, 0);
  });

  it('AC-10 page action 通过 notifier 发送', async () => {
    registry.register({
      id: 'rb1',
      alertRuleId: 'http_5xx_high',
      enabled: true,
      actions: [{ type: 'page', severity: 'P0', channel: 'feishu' }],
    });
    await registry.execute('http_5xx_high', ctx);
    assert.equal(notifier.sentMessages.length, 1);
    assert.equal(notifier.sentMessages[0].channel, 'feishu');
  });

  it('AC-11 restart_service action 调用 serviceRestarter', async () => {
    let restarted = '';
    ctx.serviceRestarter = async (svc: string) => {
      restarted = svc;
      return { success: true, message: 'ok' };
    };
    registry.register({
      id: 'rb1',
      alertRuleId: 'http_5xx_high',
      enabled: true,
      actions: [{ type: 'restart_service', service: 'm5-api' }],
    });
    const { results } = await registry.execute('http_5xx_high', ctx);
    assert.equal(restarted, 'm5-api');
    assert.equal(results[0].ok, true);
  });

  it('AC-12 dry-run (executeActions=false) 不实际调用', async () => {
    ctx.executeActions = false;
    registry.register({
      id: 'rb1',
      alertRuleId: 'http_5xx_high',
      enabled: true,
      actions: [{ type: 'page', severity: 'P0', channel: 'feishu' }],
    });
    await registry.execute('http_5xx_high', ctx);
    assert.equal(notifier.sentMessages.length, 0);
  });
});

describe('DEFAULT_RUNBOOKS', () => {
  it('AC-13 installDefaultRunbooks 注册 3 条', () => {
    const registry = new RunbookRegistry();
    installDefaultRunbooks(registry);
    assert.equal(registry.list().length, DEFAULT_RUNBOOKS.length);
  });

  it('AC-14 默认 runbook 覆盖 P0/P1', () => {
    const sevs = new Set(DEFAULT_RUNBOOKS.flatMap((rb) => rb.actions.filter((a) => a.type === 'page').map((a) => a.severity)));
    assert.ok(sevs.has('P0'));
    assert.ok(sevs.has('P1'));
  });
});
