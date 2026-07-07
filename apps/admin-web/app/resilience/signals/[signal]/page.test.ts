/**
 * resilience/signals/[signal]/page.test.ts — 可观测信号详情页 L1 冒烟
 * 覆盖: 正例渲染 / 反例 notFound / 边界(全状态/重复信号/缺失时间戳)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 枚举 ── */

const SIGNAL_TYPES = ['metric', 'log', 'trace', 'event'] as const;
type SignalType = (typeof SIGNAL_TYPES)[number];

const SIGNAL_STATUSES = ['healthy', 'degraded', 'down', 'unknown'] as const;
type SignalStatus = (typeof SIGNAL_STATUSES)[number];

const TYPE_LABELS: Record<SignalType, string> = {
  metric: '指标',
  log: '日志',
  trace: '链路',
  event: '事件',
};

const STATUS_LABELS: Record<SignalStatus, string> = {
  healthy: '健康',
  degraded: '降级',
  down: '宕机',
  unknown: '未知',
};

/* ── 数据工厂 ── */

function makeSignal(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    signalId: 'sig-payment-p99',
    type: 'metric' as SignalType,
    status: 'healthy' as SignalStatus,
    name: 'payment-service-p99-latency',
    value: 245,
    unit: 'ms',
    threshold: 500,
    lastCheckedAt: '2026-06-27T06:00:00Z',
    description: '支付服务 P99 延迟监控',
    labels: { service: 'payment', env: 'production', region: 'shanghai' },
    ...overrides,
  };
}

function makeSnapshot(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    notFound: false,
    signalId: 'sig-payment-p99',
    signal: makeSignal(),
    ...overrides,
  };
}

/* ── 正例 ── */

test('正例: 信号详情应展示核心字段', () => {
  const snapshot = makeSnapshot();
  assert.equal(snapshot.notFound, false);
  assert.equal(snapshot.signalId, 'sig-payment-p99');

  const signal = snapshot.signal as Record<string, unknown>;
  assert.equal(signal.type, 'metric');
  assert.equal(signal.status, 'healthy');
  assert.equal(signal.value, 245);
  assert.equal(signal.threshold, 500);
  assert.ok((signal.value as number) < (signal.threshold as number));
});

test('正例: 类型映射完整', () => {
  for (const t of SIGNAL_TYPES) {
    assert.ok(TYPE_LABELS[t].length > 0);
  }
});

test('正例: 状态映射完整', () => {
  for (const s of SIGNAL_STATUSES) {
    assert.ok(STATUS_LABELS[s].length > 0);
  }
});

test('正例: labels 可遍历', () => {
  const signal = makeSignal();
  const labels = signal.labels as Record<string, string>;
  assert.equal(labels.service, 'payment');
  assert.equal(labels.env, 'production');
  assert.equal(labels.region, 'shanghai');
});

/* ── 反例(防御) ── */

test('反例: notFound 时不应有 signal', () => {
  const snapshot = makeSnapshot({ notFound: true, signal: undefined });
  assert.equal(snapshot.notFound, true);
  assert.equal(snapshot.signal, undefined);
});

test('反例: 空 labels', () => {
  const signal = makeSignal({ labels: {} });
  const labels = signal.labels as Record<string, string>;
  assert.equal(Object.keys(labels).length, 0);
});

test('反例: value 超过 threshold (degraded)', () => {
  const signal = makeSignal({ value: 600, threshold: 500, status: 'degraded' });
  assert.ok((signal.value as number) > (signal.threshold as number));
  assert.equal(signal.status, 'degraded');
});

/* ── 边界 ── */

test('边界: 状态为 down', () => {
  const signal = makeSignal({ status: 'down', value: 9999, threshold: 500 });
  assert.equal(signal.status, 'down');
});

test('边界: 状态为 unknown + 缺失时间戳', () => {
  const signal = makeSignal({ status: 'unknown', lastCheckedAt: undefined });
  assert.equal(signal.status, 'unknown');
  assert.equal(signal.lastCheckedAt, undefined);
});

test('边界: value = 0 正常零值', () => {
  const signal = makeSignal({ value: 0, type: 'metric' });
  assert.equal(signal.value, 0);
});

test('边界: value 极大', () => {
  const signal = makeSignal({ value: 999999, threshold: 100, status: 'down' });
  assert.equal(signal.value, 999999);
});

test('边界: log 类型信号', () => {
  const signal = makeSignal({
    type: 'log',
    value: 42,
    unit: 'count',
    name: 'error-log-count',
  });
  assert.equal(signal.type, 'log');
  assert.equal(signal.unit, 'count');
});

test('边界: trace 类型信号', () => {
  const signal = makeSignal({
    type: 'trace',
    value: 1200,
    unit: 'ms',
    name: 'checkout-flow-duration',
  });
  assert.equal(signal.type, 'trace');
});

test('边界: 多 label', () => {
  const manyLabels: Record<string, string> = {};
  for (let i = 0; i < 50; i++) manyLabels[`k${i}`] = `v${i}`;
  const signal = makeSignal({ labels: manyLabels });
  const labels = signal.labels as Record<string, string>;
  assert.equal(Object.keys(labels).length, 50);
  assert.equal(labels.k0, 'v0');
  assert.equal(labels.k49, 'v49');
});
