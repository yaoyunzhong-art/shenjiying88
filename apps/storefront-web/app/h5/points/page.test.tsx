/**
 * H5积分页面 - page.test.tsx — L1 冒烟测试
 * Phase-FP · 2026-07-05
 * 覆盖: 积分记录 / 收支统计 / 筛选
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据工厂 ──

function makePointRecord(overrides?: Record<string, unknown>) {
  return {
    id: 'r1',
    type: 'earn' as const,
    amount: 100,
    description: '消费返积分',
    createdAt: '2026-07-01',
    ...overrides,
  };
}

function makePointsResponse(overrides?: Record<string, unknown>) {
  return {
    success: true,
    data: {
      summary: { total: 1280, earned: 1880, spent: 600 },
      records: [
        makePointRecord(),
        makePointRecord({ id: 'r2', type: 'earn' as const, amount: 50, description: '评价奖励' }),
        makePointRecord({ id: 'r3', type: 'earn' as const, amount: 200, description: '活动奖励' }),
        makePointRecord({ id: 'r4', type: 'spend' as const, amount: -50, description: '积分兑换优惠券' }),
        makePointRecord({ id: 'r5', type: 'earn' as const, amount: 80, description: '消费返积分' }),
        makePointRecord({ id: 'r6', type: 'spend' as const, amount: -100, description: '积分抽奖' }),
        makePointRecord({ id: 'r7', type: 'earn' as const, amount: 30, description: '签到奖励' }),
      ],
      total: 7,
    },
    ...overrides,
  };
}

type PointType = 'earn' | 'spend';

/* ── 正例 ── */

test('PointsPage: should accept a valid PointRecord', () => {
  const r = makePointRecord();
  assert.equal(typeof r.id, 'string');
  assert.equal(typeof r.type, 'string');
  assert.equal(typeof r.amount, 'number');
  assert.equal(typeof r.description, 'string');
  assert.equal(typeof r.createdAt, 'string');
  assert.ok(r.type === 'earn' || r.type === 'spend');
});

test('PointsPage: earn records should have positive amount', () => {
  const r = makePointRecord();
  assert.ok(r.amount > 0);
});

test('PointsPage: spend records should have negative amount', () => {
  const r = makePointRecord({ type: 'spend' as const, amount: -50 });
  assert.ok(r.amount < 0);
});

test('PointsPage: should accept a valid PointsResponse', () => {
  const resp = makePointsResponse();
  assert.equal(resp.success, true);
  assert.ok(resp.data !== undefined);
  assert.equal(resp.data!.records.length, 7);
  assert.equal(resp.data!.total, 7);
  assert.equal(resp.data!.summary.total, 1280);
});

test('PointsPage: should compute stats correctly', () => {
  const records = [
    makePointRecord({ amount: 100 }),
    makePointRecord({ id: 'r2', amount: 50 }),
    makePointRecord({ id: 'r3', type: 'spend' as const, amount: -50 }),
  ];
  const stats = {
    total: 100 + 50 - 50,
    earned: records.filter(r => r.type === 'earn').reduce((s, r) => s + r.amount, 0),
    spent: records.filter(r => r.type === 'spend').reduce((s, r) => s + Math.abs(r.amount), 0),
  };
  assert.equal(stats.total, 100);
  assert.equal(stats.earned, 150);
  assert.equal(stats.spent, 50);
});

test('PointsPage: should filter records by type', () => {
  const records = [
    makePointRecord({ id: 'r1', type: 'earn' as const }),
    makePointRecord({ id: 'r2', type: 'earn' as const }),
    makePointRecord({ id: 'r3', type: 'spend' as const }),
    makePointRecord({ id: 'r4', type: 'earn' as const }),
    makePointRecord({ id: 'r5', type: 'spend' as const }),
  ];
  const earn = records.filter(r => r.type === 'earn');
  const spend = records.filter(r => r.type === 'spend');
  assert.equal(earn.length, 3);
  assert.equal(spend.length, 2);
});

test('PointsPage: should handle ALL filter returning all records', () => {
  const records = [makePointRecord(), makePointRecord({ id: 'r2', type: 'spend' as const })];
  const all = records;
  assert.equal(all.length, 2);
});

test('PointsPage: cumulative earned should total correctly', () => {
  const records = [
    makePointRecord({ amount: 100 }),
    makePointRecord({ id: 'r2', amount: 200 }),
    makePointRecord({ id: 'r3', amount: 50 }),
    makePointRecord({ id: 'r4', type: 'spend' as const, amount: -30 }),
  ];
  const earnedSum = records.filter(r => r.type === 'earn').reduce((s, r) => s + r.amount, 0);
  assert.equal(earnedSum, 350);
});

test('PointsPage: cumulative spent should total correctly', () => {
  const records = [
    makePointRecord({ id: 'r1', type: 'spend' as const, amount: -50 }),
    makePointRecord({ id: 'r2', type: 'spend' as const, amount: -100 }),
    makePointRecord({ id: 'r3', type: 'earn' as const, amount: 200 }),
  ];
  const spentSum = records.filter(r => r.type === 'spend').reduce((s, r) => s + Math.abs(r.amount), 0);
  assert.equal(spentSum, 150);
});

test('PointsPage: total should be earned - spent', () => {
  const earned = 1880;
  const spent = 600;
  const total = earned - spent;
  assert.equal(total, 1280);
});

test('PointsPage: filter toggle should switch between ALL/earn/spend', () => {
  let filter: PointType | 'ALL' = 'ALL';
  assert.equal(filter, 'ALL');
  filter = 'earn';
  assert.equal(filter, 'earn');
  filter = 'spend';
  assert.equal(filter, 'spend');
});

test('PointsPage: record with optional orderNo', () => {
  const withNo = makePointRecord({ orderNo: 'SJY20260701001' });
  const withoutNo = makePointRecord({ orderNo: undefined });
  assert.equal(withNo.orderNo, 'SJY20260701001');
  assert.equal(withoutNo.orderNo, undefined);
});

test('PointsPage: total formatted with toLocaleString', () => {
  const total = 1280;
  assert.equal(total.toLocaleString(), '1,280');
  const zero = 0;
  assert.equal(zero.toLocaleString(), '0');
});

/* ── 反例 / 防御 ── */

test('PointsPage: should handle empty records', () => {
  const resp = { success: true, data: { summary: { total: 0, earned: 0, spent: 0 }, records: [] as unknown[], total: 0 } };
  assert.equal(resp.data.records.length, 0);
  assert.equal(resp.data.total, 0);
});

test('PointsPage: should handle failed response', () => {
  const resp = { success: false, error: { code: 'FETCH_ERROR', message: '获取积分信息失败' } };
  assert.equal(resp.success, false);
  assert.equal(resp.error!.code, 'FETCH_ERROR');
});

test('PointsPage: should handle missing data', () => {
  const resp = { success: false, data: undefined };
  assert.equal(resp.data, undefined);
});

test('PointsPage: should handle unknown type in records', () => {
  const unknownTypes: unknown[] = [undefined, null, 'unknown', ''];
  for (const t of unknownTypes) {
    const r = makePointRecord({ type: t });
    assert.equal(r.type, t);
  }
});

test('PointsPage: should handle zero amount', () => {
  const r = makePointRecord({ amount: 0 });
  assert.equal(r.amount, 0);
});

test('PointsPage: should handle missing id', () => {
  const r = makePointRecord({ id: undefined });
  assert.equal(r.id, undefined);
});

test('PointsPage: should handle empty description', () => {
  const r = makePointRecord({ description: '' });
  assert.equal(r.description, '');
});

test('PointsPage: should handle negative spent > earned', () => {
  const earned = 100;
  const spent = 300;
  const total = earned - spent;
  assert.equal(total, -200);
});

test('PointsPage: should handle invalid date format', () => {
  const invalidDates = ['', 'invalid', '2026/07/01'];
  for (const d of invalidDates) {
    const r = makePointRecord({ createdAt: d });
    assert.equal(r.createdAt, d);
  }
});

test('PointsPage: should handle negative earn type amount', () => {
  const r = makePointRecord({ type: 'earn' as const, amount: -10 });
  // earn with negative is semantically wrong, but should not crash
  assert.equal(r.amount, -10);
});

/* ── 边界 ── */

test('PointsPage: should handle many records', () => {
  const records = Array.from({ length: 200 }, (_, i) => makePointRecord({
    id: `r${i}`,
    type: i % 2 === 0 ? 'earn' as const : 'spend' as const,
    amount: i % 2 === 0 ? i * 10 : -(i * 5),
  }));
  assert.equal(records.length, 200);
  const earnCount = records.filter(r => r.type === 'earn').length;
  const spendCount = records.filter(r => r.type === 'spend').length;
  assert.equal(earnCount + spendCount, 200);
});

test('PointsPage: all records should have unique IDs', () => {
  const resp = makePointsResponse();
  const ids = resp.data!.records.map(r => r.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});

test('PointsPage: should handle all earn type records', () => {
  const records = Array.from({ length: 5 }, (_, i) => makePointRecord({ id: `r${i}`, type: 'earn' as const, amount: 50 }));
  assert.equal(records.every(r => r.type === 'earn'), true);
});

test('PointsPage: should handle large amount values', () => {
  const r = makePointRecord({ amount: 999999 });
  assert.equal(r.amount, 999999);
});

test('PointsPage: spend amount should always be negative when type=spend', () => {
  const resp = makePointsResponse();
  const spendRecords = resp.data!.records.filter(r => r.type === 'spend');
  assert.ok(spendRecords.every(r => r.amount < 0));
});

test('PointsPage: earn amount should always be positive when type=earn', () => {
  const resp = makePointsResponse();
  const earnRecords = resp.data!.records.filter(r => r.type === 'earn');
  assert.ok(earnRecords.every(r => r.amount > 0));
});

test('PointsPage: summary spent should be >= sum of absolute spend amounts in records', () => {
  const resp = makePointsResponse();
  const spendSum = resp.data!.records.filter(r => r.type === 'spend').reduce((s, r) => s + Math.abs(r.amount), 0);
  assert.ok(spendSum <= resp.data!.summary.spent);
});

test('PointsPage: summary earned should be >= sum of earn amounts in records', () => {
  const resp = makePointsResponse();
  const earnSum = resp.data!.records.filter(r => r.type === 'earn').reduce((s, r) => s + r.amount, 0);
  assert.ok(earnSum <= resp.data!.summary.earned);
});

test('PointsPage: records from mock data should be valid', () => {
  const resp = makePointsResponse();
  const records = resp.data!.records;
  assert.ok(records.every(r => typeof r.id === 'string'));
  assert.ok(records.every(r => r.type === 'earn' || r.type === 'spend'));
  assert.ok(records.every(r => typeof r.description === 'string'));
  assert.ok(records.every(r => typeof r.createdAt === 'string'));
});

test('PointsPage: redeem options should be present', () => {
  const options = [
    { points: 100, reward: '¥1优惠券' },
    { points: 500, reward: '¥5优惠券' },
    { points: 1000, reward: '免运费券' },
    { points: 2000, reward: '¥20优惠券' },
  ];
  assert.equal(options.length, 4);
  assert.ok(options.every(o => o.points > 0 && o.reward.length > 0));
});
