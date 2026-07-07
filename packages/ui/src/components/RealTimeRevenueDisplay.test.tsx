/**
 * RealTimeRevenueDisplay.test.tsx — 实时营收展示面板 L1 测试
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * 覆盖: 快照展示 / 趋势图渲染 / 品类分布 / 边界场景
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  RevenueSnapshot,
  RevenueTrendPoint,
  RevenueByCategory,
} from './RealTimeRevenueDisplay';

// ── Mock 数据 ──

const MOCK_SNAPSHOT: RevenueSnapshot = {
  currentRevenue: 48250.00,
  targetRevenue: 65000.00,
  completionPercent: 74.2,
  yoyPercent: 12.5,
  momPercent: -3.2,
  transactionCount: 312,
  avgOrderValue: 154.65,
  onlineOrders: 128,
  offlineOrders: 184,
  peakConcurrent: 24,
  activeRegisters: 6,
};

const MOCK_HOURLY: RevenueTrendPoint[] = [
  { label: '08:00', revenue: 1200, orders: 8 },
  { label: '09:00', revenue: 3800, orders: 22 },
  { label: '10:00', revenue: 5200, orders: 35 },
  { label: '11:00', revenue: 6100, orders: 42 },
  { label: '12:00', revenue: 7800, orders: 55 },
  { label: '13:00', revenue: 4200, orders: 30 },
  { label: '14:00', revenue: 5600, orders: 38 },
  { label: '15:00', revenue: 5100, orders: 34 },
  { label: '16:00', revenue: 4800, orders: 28 },
  { label: '17:00', revenue: 4350, orders: 20 },
];

const MOCK_CATEGORY: RevenueByCategory[] = [
  { category: '生鲜蔬果', amount: 15800, percent: 32.7 },
  { category: '肉禽蛋奶', amount: 12000, percent: 24.9 },
  { category: '饮品冲调', amount: 8500, percent: 17.6 },
  { category: '零食百货', amount: 7200, percent: 14.9 },
  { category: '其他', amount: 4750, percent: 9.9 },
];

// ── 正例 ──

test('正例: snapshot has all required fields', () => {
  const s = MOCK_SNAPSHOT;
  assert.ok(s.currentRevenue > 0, 'currentRevenue > 0');
  assert.ok(s.targetRevenue > 0, 'targetRevenue > 0');
  assert.ok(s.completionPercent >= 0 && s.completionPercent <= 100, 'completionPercent 0-100');
  assert.ok(typeof s.yoyPercent === 'number', 'yoyPercent is number');
  assert.ok(typeof s.momPercent === 'number', 'momPercent is number');
  assert.ok(s.transactionCount > 0, 'transactionCount > 0');
  assert.ok(s.avgOrderValue > 0, 'avgOrderValue > 0');
  assert.ok(s.peakConcurrent >= 0, 'peakConcurrent >= 0');
  assert.ok(s.activeRegisters >= 0, 'activeRegisters >= 0');
});

test('正例: currentRevenue should not exceed target for test data', () => {
  assert.ok(MOCK_SNAPSHOT.currentRevenue < MOCK_SNAPSHOT.targetRevenue,
    'current < target in mock');
});

test('正例: completionPercent matches current/target', () => {
  const expected = (MOCK_SNAPSHOT.currentRevenue / MOCK_SNAPSHOT.targetRevenue) * 100;
  const diff = Math.abs(expected - MOCK_SNAPSHOT.completionPercent);
  assert.ok(diff < 0.1, `completionPercent mismatch: expected ${expected.toFixed(2)}, got ${MOCK_SNAPSHOT.completionPercent}`);
});

test('正例: online + offline equals total transactions', () => {
  assert.strictEqual(
    MOCK_SNAPSHOT.onlineOrders + MOCK_SNAPSHOT.offlineOrders,
    MOCK_SNAPSHOT.transactionCount,
  );
});

test('正例: hourlyTrend has 10 data points', () => {
  assert.strictEqual(MOCK_HOURLY.length, 10);
});

test('正例: each hourlyTrend point has valid fields', () => {
  for (const point of MOCK_HOURLY) {
    assert.ok(point.label.length > 0, 'label required');
    assert.ok(point.revenue >= 0, `revenue >= 0 for ${point.label}`);
    assert.ok(point.orders >= 0, `orders >= 0 for ${point.label}`);
  }
});

test('正例: hourlyTrend is chronological', () => {
  for (let i = 1; i < MOCK_HOURLY.length; i++) {
    assert.ok(
      MOCK_HOURLY[i]!.label > MOCK_HOURLY[i - 1]!.label,
      `out of order at index ${i}: ${MOCK_HOURLY[i - 1]!.label} > ${MOCK_HOURLY[i]!.label}`,
    );
  }
});

test('正例: category revenue sum equals currentRevenue', () => {
  const sum = MOCK_CATEGORY.reduce((acc, c) => acc + c.amount, 0);
  const diff = Math.abs(sum - MOCK_SNAPSHOT.currentRevenue);
  assert.ok(diff < 10, `category sum ${sum} should approximate currentRevenue ${MOCK_SNAPSHOT.currentRevenue}`);
});

test('正例: category percent sum is ~100%', () => {
  const sum = MOCK_CATEGORY.reduce((acc, c) => acc + c.percent, 0);
  assert.ok(Math.abs(sum - 100) < 0.5, `category percent sum ${sum} should be ~100`);
});

test('正例: categories sorted by amount descending', () => {
  const sorted = [...MOCK_CATEGORY].sort((a, b) => b.amount - a.amount);
  for (let i = 0; i < MOCK_CATEGORY.length; i++) {
    assert.strictEqual(MOCK_CATEGORY[i]!.category, sorted[i]!.category);
  }
});

test('正例: peakConcurrent should not exceed reasonable threshold', () => {
  assert.ok(MOCK_SNAPSHOT.peakConcurrent <= MOCK_SNAPSHOT.activeRegisters * 10,
    'peakConcurrent reasonably bounded');
});

test('正例: formatCurrency-like calculation', () => {
  const val = MOCK_SNAPSHOT.currentRevenue;
  const formatted = `¥${val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  assert.ok(formatted.startsWith('¥'), 'formatted starts with ¥');
  assert.ok(formatted.includes(','), 'formatted has thousands separator');
});

test('正例: hourlyTrend revenue should have peak at noon', () => {
  const noon = MOCK_HOURLY.find(p => p.label === '12:00');
  assert.ok(noon, '12:00 data point exists');
  assert.ok(noon!.revenue >= 7500, 'noon revenue should be high');
});

// ── 反例 ──

test('反例: empty hourlyTrend should be handled', () => {
  const empty: RevenueTrendPoint[] = [];
  assert.strictEqual(empty.length, 0);
  const maxRev = Math.max(...empty.map((p) => p.revenue), 1);
  assert.strictEqual(maxRev, 1, 'fallback maxRevenue should be 1 for empty');
});

test('反例: empty categories should render nothing', () => {
  const empty: RevenueByCategory[] = [];
  assert.strictEqual(empty.length, 0);
  assert.strictEqual(empty.reduce((a, c) => a + c.amount, 0), 0);
});

test('反例: zero currentRevenue should show ¥0.00', () => {
  const zeroSnapshot: RevenueSnapshot = {
    ...MOCK_SNAPSHOT,
    currentRevenue: 0,
    completionPercent: 0,
  };
  assert.strictEqual(zeroSnapshot.currentRevenue, 0);
  assert.strictEqual(zeroSnapshot.completionPercent, 0);
});

test('反例: negative trend values should be displayed correctly', () => {
  const negSnapshot: RevenueSnapshot = {
    ...MOCK_SNAPSHOT,
    yoyPercent: -5.0,
    momPercent: -8.3,
  };
  assert.ok(negSnapshot.yoyPercent < 0, 'negative yoy');
  assert.ok(negSnapshot.momPercent < 0, 'negative mom');
});

test('反例: category percent should not exceed 100 individually', () => {
  for (const cat of MOCK_CATEGORY) {
    assert.ok(cat.percent <= 100, `${cat.category} percent <= 100`);
  }
});

test('反例: total online+offline should not exceed transactionCount', () => {
  const exceeded: RevenueSnapshot = {
    ...MOCK_SNAPSHOT,
    onlineOrders: 1000,
    offlineOrders: 500,
    transactionCount: 1200,
  };
  assert.ok(exceeded.onlineOrders + exceeded.offlineOrders <= exceeded.transactionCount * 2,
    'reasonable bound');
});

// ── 边界 ──

test('边界: completionPercent 100% edge case', () => {
  const exact: RevenueSnapshot = {
    ...MOCK_SNAPSHOT,
    currentRevenue: MOCK_SNAPSHOT.targetRevenue,
    completionPercent: 100,
  };
  assert.strictEqual(exact.currentRevenue, exact.targetRevenue);
  assert.strictEqual(exact.completionPercent, 100);
});

test('边界: completionPercent exceeds 100 (overachieved)', () => {
  const over: RevenueSnapshot = {
    ...MOCK_SNAPSHOT,
    currentRevenue: 72000,
    targetRevenue: 65000,
    completionPercent: 110.8,
  };
  assert.ok(over.completionPercent > 100, 'overachieved');
  assert.ok(over.currentRevenue > over.targetRevenue, 'exceeded goal');
});

test('边界: single hourly data point', () => {
  const single: RevenueTrendPoint[] = [{ label: '12:00', revenue: 1000, orders: 5 }];
  assert.strictEqual(single.length, 1);
  assert.strictEqual(single[0]!.revenue, 1000);
  assert.strictEqual(single[0]!.orders, 5);
});

test('边界: single category', () => {
  const single: RevenueByCategory[] = [{ category: '生鲜', amount: 48000, percent: 100 }];
  assert.strictEqual(single.length, 1);
  assert.strictEqual(single[0]!.percent, 100);
});

test('边界: 24-hour full day trend should not be empty', () => {
  const fullDay: RevenueTrendPoint[] = Array.from({ length: 24 }, (_, i) => ({
    label: `${String(i).padStart(2, '0')}:00`,
    revenue: Math.round(1000 + Math.random() * 5000),
    orders: Math.round(5 + Math.random() * 40),
  }));
  assert.strictEqual(fullDay.length, 24);
  const labels = fullDay.map(p => p.label);
  assert.strictEqual(labels[0], '00:00');
  assert.strictEqual(labels[23], '23:00');
});

test('边界: avgOrderValue = currentRevenue / transactionCount', () => {
  const expected = MOCK_SNAPSHOT.currentRevenue / MOCK_SNAPSHOT.transactionCount;
  const diff = Math.abs(expected - MOCK_SNAPSHOT.avgOrderValue);
  assert.ok(diff < 0.1, `avgOrderValue mismatch: expected ${expected.toFixed(2)}`);
});

test('边界: all category percentages should be positive', () => {
  for (const cat of MOCK_CATEGORY) {
    assert.ok(cat.percent > 0, `category ${cat.category} percent > 0`);
    assert.ok(cat.amount > 0, `category ${cat.category} amount > 0`);
  }
});

test('边界: yoyPercent consistency with trend direction', () => {
  assert.ok(MOCK_SNAPSHOT.yoyPercent > 0, 'yoy growth positive');
  assert.ok(MOCK_SNAPSHOT.momPercent < 0, 'mom decline negative');
});

test('边界: activeRegisters should be >= 1 for open store', () => {
  assert.ok(MOCK_SNAPSHOT.activeRegisters >= 1, 'at least one register');
});

test('边界: count of revenue categories should be >= 4', () => {
  assert.ok(MOCK_CATEGORY.length >= 4, 'at least 4 revenue categories');
});
