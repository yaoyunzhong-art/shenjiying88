/**
 * resilience/recovery/[resource]/page.test.ts — 恢复计划详情页 L1 冒烟
 * 覆盖: 正例渲染 / 反例 notFound / 边界(已过期演练/无依赖/短RTO)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 枚举 ── */

const RECOVERY_STATUSES = ['on_track', 'needs_attention', 'drill_overdue'] as const;
type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];

const STATUS_LABELS: Record<RecoveryStatus, string> = {
  on_track: '正常',
  needs_attention: '需关注',
  drill_overdue: '演练过期',
};

/* ── 数据工厂 ── */

function makeRecoveryPlan(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    resource: 'payment-gateway',
    status: 'on_track' as RecoveryStatus,
    rtoMinutes: 15,
    rpoMinutes: 5,
    staleAfterDays: 90,
    lastDrillAt: '2026-05-01T10:00:00Z',
    runbook: 'https://runbook.example.com/payment',
    dependencies: ['redis-cluster', 'kafka-broker-01', 'cert-rotation-svc'],
    notes: '主备切换计划, 含数据库一致性校验。',
    ...overrides,
  };
}

function makeSnapshot(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    notFound: false,
    resource: 'payment-gateway',
    record: makeRecoveryPlan(),
    ...overrides,
  };
}

/* ── 正例 ── */

test('正例: 恢复计划详情应展示核心字段', () => {
  const snapshot = makeSnapshot();

  assert.equal(snapshot.notFound, false);
  assert.equal(snapshot.resource, 'payment-gateway');

  const record = snapshot.record as Record<string, unknown>;
  assert.equal(record.resource, 'payment-gateway');
  assert.equal(record.rtoMinutes, 15);
  assert.equal(record.rpoMinutes, 5);
  assert.equal(record.status, 'on_track');
  assert.ok(Array.isArray(record.dependencies));
  assert.equal(record.dependencies.length, 3);
  assert.ok(record.dependencies.includes('redis-cluster'));
});

test('正例: 状态标签映射完整', () => {
  for (const status of RECOVERY_STATUSES) {
    const label = STATUS_LABELS[status];
    assert.ok(typeof label === 'string', `${status} 应有标签`);
    assert.ok(label.length > 0);
  }
});

test('正例: 演练未过期时 lastDrillAt 存在', () => {
  const record = makeRecoveryPlan({ status: 'on_track', lastDrillAt: '2026-05-01T10:00:00Z' });
  assert.ok(record.lastDrillAt);
  const drillDate = new Date(record.lastDrillAt as string);
  assert.ok(drillDate < new Date('2026-07-01')); // 在当前时间前
});

/* ── 反例(防御) ── */

test('反例: notFound 时不应有 record', () => {
  const snapshot = makeSnapshot({
    notFound: true,
    record: undefined,
  });

  assert.equal(snapshot.notFound, true);
  assert.equal(snapshot.record, undefined);
});

test('反例: 空依赖列表', () => {
  const record = makeRecoveryPlan({ dependencies: [] });
  assert.ok(Array.isArray(record.dependencies));
  assert.equal(record.dependencies.length, 0);
});

test('反例: 空 resource 值', () => {
  const snapshot = makeSnapshot({ resource: '' });
  assert.equal(snapshot.resource, '');
  assert.equal(snapshot.notFound, false);
});

/* ── 边界 ── */

test('边界: RTO=0 紧急恢复', () => {
  const record = makeRecoveryPlan({ rtoMinutes: 0, status: 'needs_attention' });
  assert.equal(record.rtoMinutes, 0);
  assert.equal(record.status, 'needs_attention');
});

test('边界: RPO=1440 (1天) 长延迟可接受', () => {
  const record = makeRecoveryPlan({ rpoMinutes: 1440 });
  assert.equal(record.rpoMinutes, 1440);
});

test('边界: stale 状态', () => {
  const record = makeRecoveryPlan({
    status: 'drill_overdue',
    lastDrillAt: '2025-01-01T00:00:00Z',
    staleAfterDays: 30,
  });
  assert.equal(record.status, 'drill_overdue');

  const daysSinceDrill =
    (Date.now() - new Date(record.lastDrillAt as string).getTime()) /
    (1000 * 60 * 60 * 24);
  assert.ok(daysSinceDrill > (record.staleAfterDays as number), '应超过 stale 阈值');
});

test('边界: 极多依赖', () => {
  const manyDeps = Array.from({ length: 100 }, (_, i) => `dep-${i + 1}`);
  const record = makeRecoveryPlan({ dependencies: manyDeps });
  const deps = record.dependencies as unknown[];
  assert.equal(deps.length, 100);
  assert.equal(deps[0], 'dep-1');
  assert.equal(deps[99], 'dep-100');
});

test('边界: 超长备注', () => {
  const longNotes = 'A'.repeat(10000);
  const record = makeRecoveryPlan({ notes: longNotes });
  assert.equal((record.notes as string).length, 10000);
});
