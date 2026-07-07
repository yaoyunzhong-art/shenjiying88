import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * sentry.service.test.ts - Phase-22 T69
 * SentryService 单元测试
 */
import assert from 'node:assert/strict';
import { SentryService, type SentryEvent } from './sentry.service';

describe('SentryService · captureException', () => {
  let sentry: SentryService;
  beforeEach(() => {
    sentry = new SentryService({ release: '1.0.0', environment: 'test' });
    sentry.resetForTests();
  });

  it('AC-1 捕获异常 → 返回 event id', () => {
    const id = sentry.captureException(new Error('boom'), { tenantId: 't-1' });
    assert.match(id, /^\d+-\w+$/, 'id 应为 <timestamp>-<random> 格式');
    const events = sentry.getEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].exception.value, 'boom');
    assert.equal(events[0].context.tenantId, 't-1');
  });

  it('AC-2 异常自动生成 fingerprint', () => {
    sentry.captureException(new Error('e1'));
    sentry.captureException(new Error('e1'));
    const events = sentry.getEvents();
    assert.equal(events[0].fingerprint.length, 3); // [error, name, frame]
    assert.equal(events[0].fingerprint[0], 'error');
    assert.equal(events[0].fingerprint[1], 'Error');
  });

  it('AC-3 相同异常的 fingerprint 一致 (用于 grouping)', () => {
    sentry.captureException(new Error('e1'), { tenantId: 't-A' });
    sentry.captureException(new Error('e1'), { tenantId: 't-B' }); // 不同 tenant
    const groups = sentry.getErrorGroups();
    assert.equal(groups.length, 1, '相同类型+帧 应归为 1 组');
    assert.equal(groups[0].count, 2);
  });
});

describe('SentryService · captureMessage', () => {
  let sentry: SentryService;
  beforeEach(() => {
    sentry = new SentryService({ release: '1.0.0' });
    sentry.resetForTests();
  });

  it('AC-4 消息事件 level 正确', () => {
    sentry.captureMessage('user signed up', 'info');
    sentry.captureMessage('db slow', 'warning');
    const events = sentry.getEvents();
    assert.equal(events.length, 2);
    const levels = events.map((e) => e.level).sort();
    assert.deepEqual(levels, ['info', 'warning']);
  });

  it('AC-5 按 level 过滤事件', () => {
    sentry.captureException(new Error('e'));
    sentry.captureMessage('m', 'info');
    const errors = sentry.getEvents({ level: 'error' });
    assert.equal(errors.length, 1);
    assert.equal(errors[0].exception.type, 'Error');
  });
});

describe('SentryService · Release Health', () => {
  let sentry: SentryService;
  beforeEach(() => {
    sentry = new SentryService({ release: '1.0.0' });
    sentry.resetForTests();
  });

  it('AC-6 startSession + crash-free 计算', () => {
    // 10 个 session,3 个 crash
    for (let i = 0; i < 10; i++) {
      sentry.startSession(`s-${i}`, `u-${i}`);
    }
    // 触发 crash (最近 3 个 session 标记 crashed)
    sentry.captureException(new Error('crash'));
    sentry.captureException(new Error('crash'));
    sentry.captureException(new Error('crash'));

    const health = sentry.getReleaseHealth();
    assert.equal(health.totalSessions, 10);
    assert.equal(health.crashSessions, 3);
    assert.equal(health.crashFreeSessionRate, 0.7);
  });

  it('AC-7 crash-free user 比例', () => {
    // 10 个 session,5 个用户,2 个用户 crash
    for (let i = 0; i < 10; i++) {
      sentry.startSession(`s-${i}`, `u-${i % 5}`);
    }
    sentry.captureException(new Error('e'), { userId: 'u-0' });
    sentry.captureException(new Error('e'), { userId: 'u-1' });
    const health = sentry.getReleaseHealth();
    assert.equal(health.crashFreeUserRate, 0.6); // 1 - 2/5
  });

  it('AC-8 无 session 时 crash-free = 1', () => {
    const health = sentry.getReleaseHealth();
    assert.equal(health.crashFreeSessionRate, 1);
    assert.equal(health.crashFreeUserRate, 1);
  });

  it('AC-9 eventsByLevel 统计', () => {
    sentry.captureException(new Error('e1'));
    sentry.captureException(new Error('e2'));
    sentry.captureMessage('m', 'warning');
    const health = sentry.getReleaseHealth();
    assert.equal(health.eventsByLevel.error, 2);
    assert.equal(health.eventsByLevel.warning, 1);
  });
});

describe('SentryService · error groups', () => {
  let sentry: SentryService;
  beforeEach(() => {
    sentry = new SentryService({ release: '1.0.0' });
    sentry.resetForTests();
  });

  it('AC-10 getErrorGroups 按 fingerprint 分组 + count', () => {
    sentry.captureException(new TypeError('e1'));
    sentry.captureException(new TypeError('e1'));
    sentry.captureException(new TypeError('e1'));
    sentry.captureException(new RangeError('e2'));
    const groups = sentry.getErrorGroups();
    assert.equal(groups.length, 2);
    assert.equal(groups[0].count, 3);
    assert.equal(groups[0].fingerprint.includes('TypeError'), true);
  });

  it('AC-11 groups 按 count 降序', () => {
    for (let i = 0; i < 5; i++) sentry.captureException(new RangeError('r'));
    for (let i = 0; i < 2; i++) sentry.captureException(new TypeError('t'));
    const groups = sentry.getErrorGroups();
    assert.equal(groups[0].count, 5);
    assert.equal(groups[1].count, 2);
  });
});

describe('SentryService · filter & events', () => {
  let sentry: SentryService;
  beforeEach(() => {
    sentry = new SentryService({ release: '1.0.0' });
    sentry.resetForTests();
  });

  it('AC-12 按 since 过滤事件', async () => {
    sentry.captureException(new Error('old'));
    // 等 5ms 确保 since 严格在 old 之后
    await new Promise((r) => setTimeout(r, 5));
    const oldTime = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 5));
    sentry.captureException(new Error('new'));
    const events = sentry.getEvents({ since: oldTime });
    assert.ok(events.length >= 1);
    assert.equal(events[0].exception.value, 'new');
  });

  it('AC-13 按 fingerprint 过滤', () => {
    sentry.captureException(new TypeError('e1'));
    sentry.captureException(new RangeError('e2'));
    const all = sentry.getEvents();
    const typeFp = all.find((e: SentryEvent) => e.exception.type === 'TypeError')?.fingerprint.join('|');
    const filtered = sentry.getEvents({ fingerprint: typeFp });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].exception.type, 'TypeError');
  });
});
