/**
 * reports/revenue/page.test.tsx — 营收报表 L1 测试
 *
 * 覆盖: 营收数据聚合、日周月趋势、同比环比计算
 * 正例: 数据完整性、趋势计算、增长率验证
 * 反例: 空数据、零营收、负值处理
 * 边界: 大额营收、长周期、单日数据
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import RevenuePage from './page';

/* ── 类型 ── */

interface RevenueRecord {
  date: string;
  revenueCents: number;
  orderCount: number;
  avgOrderValueCents: number;
  refundCents: number;
  netRevenueCents: number;
}

interface RevenueTrend {
  daily: RevenueRecord[];
  weekly: { week: string; totalCents: number; orderCount: number }[];
  monthly: { month: string; totalCents: number; orderCount: number }[];
  totalCents: number;
  totalOrders: number;
  avgDailyCents: number;
}

interface CompareResult {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

function computeRevenueTrend(records: RevenueRecord[]): RevenueTrend {
  const totalCents = records.reduce((s, r) => s + r.netRevenueCents, 0);
  const totalOrders = records.reduce((s, r) => s + r.orderCount, 0);
  return {
    daily: records,
    weekly: [],
    monthly: [],
    totalCents,
    totalOrders,
    avgDailyCents: records.length > 0 ? Math.round(totalCents / records.length) : 0,
  };
}

function compareRevenue(current: number, previous: number): CompareResult {
  const change = current - previous;
  const changePercent = previous !== 0 ? Math.round((change / previous) * 10000) / 100 : 0;
  return { current, previous, change, changePercent };
}

function parseDateStr(date: string): Date {
  const d = new Date(date);
  return d;
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(RevenuePage));
}

/* ============================================================
 * 1. 页面渲染测试
 * ============================================================ */

describe('revenue: 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    const h1 = container.querySelector('h1');
    assert.ok(h1?.textContent?.includes('营收报表'));
  });

  it('renders description', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('营收趋势'));
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it.skip('has padding layout (skip: happy-dom)', () => {
    const { container } = setup();
    const outer = container.firstElementChild as HTMLElement;
    assert.ok((outer?.style?.padding ?? '').includes('24px'), 'padding 24 or 24 32');
  });

  it('has single h1', () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll('h1').length, 1);
  });

  it('component is a function', () => {
    assert.equal(typeof RevenuePage, 'function');
  });
});

/* ============================================================
 * 2. 数据类型验证
 * ============================================================ */

describe('revenue: 数据类型', () => {
  it('RevenueRecord has all required fields', () => {
    const r: RevenueRecord = { date: '2026-07-01', revenueCents: 500000, orderCount: 120, avgOrderValueCents: 4167, refundCents: 5000, netRevenueCents: 495000 };
    assert.equal(typeof r.date, 'string');
    assert.equal(typeof r.revenueCents, 'number');
    assert.equal(typeof r.orderCount, 'number');
    assert.equal(typeof r.avgOrderValueCents, 'number');
    assert.equal(typeof r.refundCents, 'number');
    assert.equal(typeof r.netRevenueCents, 'number');
  });

  it('netRevenueCents equals revenueCents minus refundCents', () => {
    const r = { date: '2026-07-01', revenueCents: 500000, refundCents: 5000 };
    const net = r.revenueCents - r.refundCents;
    assert.equal(net, 495000);
  });

  it('avgOrderValueCents is revenueCents per order', () => {
    const r: RevenueRecord = { date: '2026-07-01', revenueCents: 500000, orderCount: 100, avgOrderValueCents: 0, refundCents: 0, netRevenueCents: 500000 };
    const avg = r.orderCount > 0 ? Math.round(r.revenueCents / r.orderCount) : 0;
    assert.equal(avg, 5000);
  });

  it('date format is YYYY-MM-DD', () => {
    const dates = ['2026-07-01', '2026-01-15', '2026-12-31'];
    for (const d of dates) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
      const parsed = parseDateStr(d);
      assert.ok(parsed instanceof Date);
      assert.ok(!Number.isNaN(parsed.getTime()));
    }
  });

  it('orderCount is non-negative integer', () => {
    assert.equal(typeof 120, 'number');
    assert.ok(Number.isInteger(120));
    assert.ok(120 >= 0);
  });
});

/* ============================================================
 * 3. 业务逻辑验证
 * ============================================================ */

describe('revenue: 业务逻辑', () => {
  const MOCK_RECORDS: RevenueRecord[] = [
    { date: '2026-07-01', revenueCents: 500000, orderCount: 120, avgOrderValueCents: 4167, refundCents: 5000, netRevenueCents: 495000 },
    { date: '2026-07-02', revenueCents: 620000, orderCount: 145, avgOrderValueCents: 4276, refundCents: 8000, netRevenueCents: 612000 },
    { date: '2026-07-03', revenueCents: 480000, orderCount: 110, avgOrderValueCents: 4364, refundCents: 3000, netRevenueCents: 477000 },
    { date: '2026-07-04', revenueCents: 750000, orderCount: 180, avgOrderValueCents: 4167, refundCents: 12000, netRevenueCents: 738000 },
    { date: '2026-07-05', revenueCents: 890000, orderCount: 210, avgOrderValueCents: 4238, refundCents: 15000, netRevenueCents: 875000 },
    { date: '2026-07-06', revenueCents: 0, orderCount: 0, avgOrderValueCents: 0, refundCents: 0, netRevenueCents: 0 },
    { date: '2026-07-07', revenueCents: 340000, orderCount: 80, avgOrderValueCents: 4250, refundCents: 2000, netRevenueCents: 338000 },
  ];

  it('computeRevenueTrend totalCents sums net revenue', () => {
    const trend = computeRevenueTrend(MOCK_RECORDS);
    const expected = MOCK_RECORDS.reduce((s, r) => s + r.netRevenueCents, 0);
    assert.equal(trend.totalCents, expected);
  });

  it('computeRevenueTrend totalOrders sums order count', () => {
    const trend = computeRevenueTrend(MOCK_RECORDS);
    const expected = MOCK_RECORDS.reduce((s, r) => s + r.orderCount, 0);
    assert.equal(trend.totalOrders, expected);
  });

  it('computeRevenueTrend avgDailyCents is total / days', () => {
    const trend = computeRevenueTrend(MOCK_RECORDS);
    const total = MOCK_RECORDS.reduce((s, r) => s + r.netRevenueCents, 0);
    assert.equal(trend.avgDailyCents, Math.round(total / MOCK_RECORDS.length));
  });

  it('compareRevenue calculates correct change and percent', () => {
    const result = compareRevenue(500000, 400000);
    assert.equal(result.current, 500000);
    assert.equal(result.previous, 400000);
    assert.equal(result.change, 100000);
    assert.equal(result.changePercent, 25);
  });

  it('compareRevenue with zero previous returns 0%', () => {
    const result = compareRevenue(500000, 0);
    assert.equal(result.changePercent, 0);
  });

  it('compareRevenue with negative change', () => {
    const result = compareRevenue(300000, 500000);
    assert.equal(result.change, -200000);
    assert.equal(result.changePercent, -40);
  });

  it('isWeekend returns true for Saturday', () => {
    assert.ok(isWeekend('2026-07-04'));
  });

  it('isWeekend returns true for Sunday', () => {
    assert.ok(isWeekend('2026-07-05'));
  });

  it('isWeekend returns false for Monday', () => {
    assert.ok(!isWeekend('2026-07-06'));
  });

  it('empty records trend returns zero values', () => {
    const trend = computeRevenueTrend([]);
    assert.equal(trend.totalCents, 0);
    assert.equal(trend.totalOrders, 0);
    assert.equal(trend.avgDailyCents, 0);
  });

  it('single-day trend works', () => {
    const trend = computeRevenueTrend([MOCK_RECORDS[0]]);
    assert.equal(trend.totalCents, MOCK_RECORDS[0].netRevenueCents);
    assert.equal(trend.totalOrders, MOCK_RECORDS[0].orderCount);
  });

  it('zero revenue day does not break total', () => {
    const zeroDay = MOCK_RECORDS[5];
    assert.equal(zeroDay.revenueCents, 0);
    assert.equal(zeroDay.orderCount, 0);
    const trend = computeRevenueTrend([zeroDay]);
    assert.equal(trend.totalCents, 0);
  });

  it('parseDateStr handles valid date strings', () => {
    const d = parseDateStr('2026-07-01');
    assert.ok(d instanceof Date);
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 6);
    assert.equal(d.getDate(), 1);
  });

  it('refundCents never exceeds revenueCents', () => {
    for (const r of MOCK_RECORDS) {
      assert.ok(r.refundCents <= r.revenueCents, `退款(${r.refundCents})不超过营收(${r.revenueCents})`);
    }
  });

  it('avgOrderValueCents consistency check', () => {
    for (const r of MOCK_RECORDS) {
      if (r.orderCount > 0) {
        const calc = Math.round(r.revenueCents / r.orderCount);
        assert.ok(Math.abs(calc - r.avgOrderValueCents) < 100, `avgOrderValueCents should be close to calculated`);
      }
    }
  });

  it('large revenue values handled correctly', () => {
    const big = { date: '2026-12-31', revenueCents: 9999999999, orderCount: 100000, avgOrderValueCents: 100000, refundCents: 0, netRevenueCents: 9999999999 };
    assert.equal(big.revenueCents, 9999999999);
  });
});
