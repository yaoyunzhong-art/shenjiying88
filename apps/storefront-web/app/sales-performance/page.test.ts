/**
 * Sales Performance Page — storefront-web
 * Tests: period metrics calculation, data integrity, forecast generation
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── Types (mirrors page.tsx) ──

interface SalesTransaction {
  id: string;
  date: string;
  customer: string;
  amount: number;
  items: number;
  store: string;
  channel: 'online' | 'offline';
}

type PeriodFilter = '7d' | '30d' | '90d';

interface PeriodMetrics {
  total: number;
  avg: number;
  orderCount: number;
  offlineTotal: number;
  onlineTotal: number;
}

// ── Mock data ──

const MOCK_TRANSACTIONS: SalesTransaction[] = [
  { id: 'T001', date: '2026-06-24 18:32', customer: '张三', amount: 568, items: 3, store: '旗舰店', channel: 'offline' },
  { id: 'T002', date: '2026-06-24 17:15', customer: '李四', amount: 1299, items: 5, store: '旗舰店', channel: 'offline' },
  { id: 'T003', date: '2026-06-24 16:40', customer: '王五', amount: 89, items: 1, store: '旗舰店', channel: 'online' },
  { id: 'T004', date: '2026-06-24 15:00', customer: '赵六', amount: 450, items: 2, store: '社区店', channel: 'offline' },
  { id: 'T005', date: '2026-06-24 14:22', customer: '陈七', amount: 780, items: 4, store: '旗舰店', channel: 'online' },
  { id: 'T006', date: '2026-06-24 12:08', customer: '刘八', amount: 220, items: 1, store: '社区店', channel: 'offline' },
  { id: 'T007', date: '2026-06-24 10:45', customer: '孙九', amount: 1340, items: 6, store: '旗舰店', channel: 'offline' },
  { id: 'T008', date: '2026-06-24 09:30', customer: '周十', amount: 320, items: 2, store: '社区店', channel: 'offline' },
];

// ── Helper functions (mirroring page.tsx) ──

function computePeriodMetrics(transactions: SalesTransaction[]): PeriodMetrics {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const avg = transactions.length > 0 ? total / transactions.length : 0;
  const orderCount = transactions.length;
  const offlineTotal = transactions.filter((t) => t.channel === 'offline').reduce((s, t) => s + t.amount, 0);
  const onlineTotal = transactions.filter((t) => t.channel === 'online').reduce((s, t) => s + t.amount, 0);
  return { total, avg, orderCount, offlineTotal, onlineTotal };
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

interface ForecastDataPoint {
  label: string;
  predicted: number;
  optimistic: number;
  pessimistic: number;
  actual?: number;
}

function generateForecastDays(count: number): ForecastDataPoint[] {
  const points: ForecastDataPoint[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i - 3);
    const label = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const predicted = 48000 + Math.round(Math.sin(i * 0.8 + 0.5) * 12000 + (Math.random() - 0.5) * 3000);
    const actual = i < 3 ? predicted + Math.round((Math.random() - 0.5) * 6000) : undefined;
    const optimistic = Math.round(predicted * (1.08 + Math.random() * 0.06));
    const pessimistic = Math.round(predicted * (0.85 + Math.random() * 0.05));
    points.push({ label, predicted, optimistic, pessimistic, actual });
  }
  return points;
}

// ── Tests ──

test('SalesPerformancePage: mock data has correct record count', () => {
  assert.equal(MOCK_TRANSACTIONS.length, 8);
});

test('SalesPerformancePage: each transaction has valid structure', () => {
  for (const tx of MOCK_TRANSACTIONS) {
    assert.ok(tx.id.startsWith('T'));
    assert.ok(tx.amount > 0);
    assert.ok(tx.items >= 1);
    assert.ok(['online', 'offline'].includes(tx.channel));
    assert.ok(['旗舰店', '社区店'].includes(tx.store));
  }
});

test('SalesPerformancePage: computePeriodMetrics returns correct totals', () => {
  const metrics = computePeriodMetrics(MOCK_TRANSACTIONS);
  const expectedTotal = MOCK_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  assert.equal(metrics.total, expectedTotal);
  assert.equal(metrics.orderCount, 8);
  assert.equal(metrics.offlineTotal + metrics.onlineTotal, expectedTotal);
});

test('SalesPerformancePage: avg is total divided by count', () => {
  const metrics = computePeriodMetrics(MOCK_TRANSACTIONS);
  const total = MOCK_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  assert.equal(metrics.avg, total / 8);
  assert.equal(Math.round(metrics.avg), Math.round(total / 8));
});

test('SalesPerformancePage: online channels sum independently', () => {
  const onlineTotal = MOCK_TRANSACTIONS
    .filter((t) => t.channel === 'online')
    .reduce((s, t) => s + t.amount, 0);
  const metrics = computePeriodMetrics(MOCK_TRANSACTIONS);
  assert.equal(metrics.onlineTotal, onlineTotal);
  assert.equal(metrics.onlineTotal, 89 + 780); // T003 + T005
});

test('SalesPerformancePage: offline channels sum independently', () => {
  const offlineTotal = MOCK_TRANSACTIONS
    .filter((t) => t.channel === 'offline')
    .reduce((s, t) => s + t.amount, 0);
  const metrics = computePeriodMetrics(MOCK_TRANSACTIONS);
  assert.equal(metrics.offlineTotal, offlineTotal);
});

test('SalesPerformancePage: formatCurrency formats correctly', () => {
  assert.equal(formatCurrency(1234), '¥1,234');
  assert.equal(formatCurrency(0), '¥0');
  assert.equal(formatCurrency(9999), '¥9,999');
  assert.equal(formatCurrency(500.5), '¥500.5');
});

test('SalesPerformancePage: empty transactions produce zero metrics', () => {
  const metrics = computePeriodMetrics([]);
  assert.equal(metrics.total, 0);
  assert.equal(metrics.avg, 0);
  assert.equal(metrics.orderCount, 0);
  assert.equal(metrics.offlineTotal, 0);
  assert.equal(metrics.onlineTotal, 0);
});

test('SalesPerformancePage: generateForecastDays produces correct count', () => {
  const points = generateForecastDays(10);
  assert.equal(points.length, 10);

  for (const point of points) {
    assert.ok(typeof point.label === 'string' && point.label.length > 0);
    assert.ok(point.predicted >= 30000 && point.predicted <= 70000,
      `Predicted ${point.predicted} out of range`);
    assert.ok(point.optimistic >= point.predicted,
      `Optimistic ${point.optimistic} < predicted ${point.predicted}`);
    assert.ok(point.predicted >= point.pessimistic,
      `Predicted ${point.predicted} < pessimistic ${point.pessimistic}`);
  }
});

test('SalesPerformancePage: past days have actual values', () => {
  const points = generateForecastDays(10);
  for (let i = 0; i < 3; i++) {
    assert.ok(points[i].actual !== undefined, `Day ${i} should have actual`);
  }
});

test('SalesPerformancePage: future days have no actual values', () => {
  const points = generateForecastDays(10);
  for (let i = 3; i < points.length; i++) {
    assert.equal(points[i].actual, undefined, `Day ${i} should not have actual`);
  }
});

test('SalesPerformancePage: online-only metrics calculation', () => {
  const onlineOnly = MOCK_TRANSACTIONS.filter((t) => t.channel === 'online');
  const metrics = computePeriodMetrics(onlineOnly);
  assert.equal(metrics.orderCount, 2);
  assert.equal(metrics.offlineTotal, 0);
  assert.equal(metrics.total, metrics.onlineTotal);
});

test('SalesPerformancePage: offline-only metrics calculation', () => {
  const offlineOnly = MOCK_TRANSACTIONS.filter((t) => t.channel === 'offline');
  const metrics = computePeriodMetrics(offlineOnly);
  assert.equal(metrics.orderCount, 6);
  assert.equal(metrics.onlineTotal, 0);
  assert.equal(metrics.total, metrics.offlineTotal);
});
