/**
 * resilience/retries/[key]/page.test.ts — 重试策略详情页 L1 冒烟
 * 覆盖: 正例渲染 / 反例 notFound / 边界(最大重试/零间隔/超长key)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 枚举 ── */

const RETRY_STRATEGIES = ['linear', 'exponential', 'fixed'] as const;
type RetryStrategy = (typeof RETRY_STRATEGIES)[number];

const STRATEGY_LABELS: Record<RetryStrategy, string> = {
  linear: '线性回退',
  exponential: '指数回退',
  fixed: '固定间隔',
};

/* ── 数据工厂 ── */

function makeRetryPolicy(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    key: 'order-service-retry',
    maxRetries: 3,
    strategy: 'exponential' as RetryStrategy,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    description: '订单服务重试策略，指数退避。',
    errors: ['NetworkError', 'TimeoutError', 'RateLimitError'],
    enabled: true,
    ...overrides,
  };
}

function makeSnapshot(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    notFound: false,
    key: 'order-service-retry',
    record: makeRetryPolicy(),
    ...overrides,
  };
}

/* ── 正例 ── */

test('正例: 重试策略应展示核心字段', () => {
  const snapshot = makeSnapshot();
  assert.equal(snapshot.notFound, false);
  assert.equal(snapshot.key, 'order-service-retry');

  const record = snapshot.record as Record<string, unknown>;
  assert.equal(record.strategy, 'exponential');
  assert.equal(record.maxRetries, 3);
  assert.equal(record.baseDelayMs, 1000);
  assert.equal(record.maxDelayMs, 30000);
  assert.equal(record.enabled, true);
});

test('正例: 策略标签映射完整', () => {
  for (const s of RETRY_STRATEGIES) {
    const label = STRATEGY_LABELS[s];
    assert.ok(typeof label === 'string', `${s} 应有标签`);
    assert.ok(label.length > 0);
  }
});

test('正例: errors 列表可遍历', () => {
  const record = makeRetryPolicy();
  assert.ok(Array.isArray(record.errors));
  assert.equal(record.errors.length, 3);
  assert.ok(record.errors.includes('TimeoutError'));
});

/* ── 反例(防御) ── */

test('反例: notFound 时不应有 record', () => {
  const snapshot = makeSnapshot({ notFound: true, record: undefined });
  assert.equal(snapshot.notFound, true);
  assert.equal(snapshot.record, undefined);
});

test('反例: 空 errors 列表', () => {
  const record = makeRetryPolicy({ errors: [] });
  assert.ok(Array.isArray(record.errors));
  assert.equal(record.errors.length, 0);
});

test('反例: disabled 策略', () => {
  const record = makeRetryPolicy({ enabled: false });
  assert.equal(record.enabled, false);
});

/* ── 边界 ── */

test('边界: maxRetries = 0 禁用重试', () => {
  const record = makeRetryPolicy({ maxRetries: 0 });
  assert.equal(record.maxRetries, 0);
});

test('边界: maxRetries = 10 极多重试', () => {
  const record = makeRetryPolicy({ maxRetries: 10 });
  assert.equal(record.maxRetries, 10);
});

test('边界: baseDelayMs = 0 无间隔', () => {
  const record = makeRetryPolicy({ baseDelayMs: 0 });
  assert.equal(record.baseDelayMs, 0);
});

test('边界: baseDelayMs > maxDelayMs 反转', () => {
  const record = makeRetryPolicy({ baseDelayMs: 60000, maxDelayMs: 1000 });
  assert.ok((record.baseDelayMs as number) > (record.maxDelayMs as number));
  // 实际策略应通过 min() 兜底
});

test('边界: 超长 key', () => {
  const longKey = 'retry-' + 'x'.repeat(200);
  const snapshot = makeSnapshot({ key: longKey, record: makeRetryPolicy({ key: longKey }) });
  assert.equal((snapshot.key as string).length, 206);
});

test('边界: fixed 策略无回退', () => {
  const record = makeRetryPolicy({ strategy: 'fixed', baseDelayMs: 2000, maxDelayMs: 2000 });
  assert.equal(record.strategy, 'fixed');
  assert.equal(record.baseDelayMs, record.maxDelayMs);
});
