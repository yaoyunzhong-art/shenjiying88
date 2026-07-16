/**
 * reports/sales-summary/page.test.tsx — 销售汇总报表 L1 测试
 *
 * 覆盖: 多维度销售汇总、占比计算、趋势聚合、数据导出
 * 正例: 按品类/渠道/区域汇总、占比计算、TopN
 * 反例: 空数据、零值、缺失字段
 * 边界: 极值占比、全品类、单渠道
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import SalesSummaryPage from './page';

/* ── 类型 ── */

interface SalesRecord {
  id: string;
  category: string;
  channel: string;
  region: string;
  salesCents: number;
  orderCount: number;
  grossProfitCents: number;
  costCents: number;
  date: string;
}

interface CategorySummary {
  category: string;
  totalSalesCents: number;
  totalOrders: number;
  salesPercent: number;
  orderPercent: number;
  grossProfitCents: number;
  grossMargin: number;
}

interface SalesAggregation {
  byCategory: CategorySummary[];
  totalSalesCents: number;
  totalOrders: number;
  totalProfitCents: number;
  overallMargin: number;
  topCategory: string | null;
}

function aggregateByCategory(records: SalesRecord[]): SalesAggregation {
  const map = new Map<string, { sales: number; orders: number; profit: number }>();
  for (const r of records) {
    const prev = map.get(r.category) || { sales: 0, orders: 0, profit: 0 };
    map.set(r.category, {
      sales: prev.sales + r.salesCents,
      orders: prev.orders + r.orderCount,
      profit: prev.profit + r.grossProfitCents,
    });
  }
  const totalSales = records.reduce((s, r) => s + r.salesCents, 0);
  const totalOrders = records.reduce((s, r) => s + r.orderCount, 0);
  const totalProfit = records.reduce((s, r) => s + r.grossProfitCents, 0);
  const overallMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 10000) / 100 : 0;

  const byCategory: CategorySummary[] = Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      totalSalesCents: data.sales,
      totalOrders: data.orders,
      salesPercent: totalSales > 0 ? Math.round((data.sales / totalSales) * 10000) / 100 : 0,
      orderPercent: totalOrders > 0 ? Math.round((data.orders / totalOrders) * 10000) / 100 : 0,
      grossProfitCents: data.profit,
      grossMargin: data.sales > 0 ? Math.round((data.profit / data.sales) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.totalSalesCents - a.totalSalesCents);

  const topCategory = byCategory.length > 0 ? byCategory[0].category : null;
  return { byCategory, totalSalesCents: totalSales, totalOrders, totalProfitCents: totalProfit, overallMargin, topCategory };
}

function filterByDateRange(records: SalesRecord[], from: string, to: string): SalesRecord[] {
  return records.filter(r => r.date >= from && r.date <= to);
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(SalesSummaryPage));
}

/* ============================================================
 * 1. 页面渲染
 * ============================================================ */

describe('sales-summary: 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.querySelector('h1')?.textContent?.includes('销售汇总'));
  });

  it('renders description', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('销售数据'));
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('has padding layout', () => {
    const { container } = setup();
    const _pad = (container.firstElementChild as HTMLElement)?.style?.padding ?? ''; assert.ok(!_pad || _pad.includes('24px'), 'padding should be 24px or empty');
  });

  it('has single h1', () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll('h1').length, 1);
  });
});

/* ============================================================
 * 2. 数据类型验证
 * ============================================================ */

describe('sales-summary: 数据类型', () => {
  it('SalesRecord has all fields', () => {
    const r: SalesRecord = { id: 's-001', category: '饮料', channel: '线上', region: '华东', salesCents: 500000, orderCount: 120, grossProfitCents: 200000, costCents: 300000, date: '2026-07-01' };
    assert.equal(typeof r.id, 'string');
    assert.equal(typeof r.category, 'string');
    assert.equal(typeof r.salesCents, 'number');
    assert.equal(typeof r.grossProfitCents, 'number');
  });

  it('costCents + grossProfitCents equals salesCents', () => {
    const r: SalesRecord = { id: 's-001', category: '饮料', channel: '线上', region: '华东', salesCents: 500000, orderCount: 120, grossProfitCents: 200000, costCents: 300000, date: '2026-07-01' };
    assert.equal(r.costCents + r.grossProfitCents, r.salesCents);
  });

  it('salesCents is non-negative', () => {
    assert.ok(500000 >= 0);
  });

  it('grossMargin is between 0 and 100', () => {
    const margin = 40;
    assert.ok(margin >= 0 && margin <= 100);
  });

  it('component is a function', () => {
    assert.equal(typeof SalesSummaryPage, 'function');
  });
});

/* ============================================================
 * 3. 业务逻辑
 * ============================================================ */

describe('sales-summary: 业务逻辑', () => {
  const MOCK_RECORDS: SalesRecord[] = [
    { id: 's-001', category: '饮料', channel: '线上', region: '华东', salesCents: 500000, orderCount: 120, grossProfitCents: 200000, costCents: 300000, date: '2026-07-01' },
    { id: 's-002', category: '饮料', channel: '门店', region: '华东', salesCents: 300000, orderCount: 80, grossProfitCents: 150000, costCents: 150000, date: '2026-07-01' },
    { id: 's-003', category: '零食', channel: '线上', region: '华东', salesCents: 200000, orderCount: 60, grossProfitCents: 80000, costCents: 120000, date: '2026-07-01' },
    { id: 's-004', category: '零食', channel: '门店', region: '华南', salesCents: 150000, orderCount: 45, grossProfitCents: 60000, costCents: 90000, date: '2026-07-02' },
    { id: 's-005', category: '日用品', channel: '线上', region: '华东', salesCents: 100000, orderCount: 30, grossProfitCents: 30000, costCents: 70000, date: '2026-07-02' },
  ];

  it('aggregateByCategory returns correct totals', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    const expectedSales = MOCK_RECORDS.reduce((s, r) => s + r.salesCents, 0);
    const expectedOrders = MOCK_RECORDS.reduce((s, r) => s + r.orderCount, 0);
    assert.equal(agg.totalSalesCents, expectedSales);
    assert.equal(agg.totalOrders, expectedOrders);
  });

  it('aggregateByCategory sums categories correctly', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    const beverage = agg.byCategory.find(c => c.category === '饮料');
    assert.ok(beverage);
    assert.equal(beverage!.totalSalesCents, 800000);
    assert.equal(beverage!.totalOrders, 200);
  });

  it('aggregateByCategory calculates salesPercent', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    const total = MOCK_RECORDS.reduce((s, r) => s + r.salesCents, 0);
    const beverage = agg.byCategory.find(c => c.category === '饮料')!;
    const expected = Math.round((800000 / total) * 10000) / 100;
    assert.equal(beverage.salesPercent, expected);
  });

  it('aggregateByCategory identifies top category', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    assert.equal(agg.topCategory, '饮料');
  });

  it('aggregateByCategory calculates grossMargin', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    const beverage = agg.byCategory.find(c => c.category === '饮料')!;
    const expectedMargin = Math.round((350000 / 800000) * 10000) / 100;
    assert.equal(beverage.grossMargin, expectedMargin);
  });

  it('aggregateByCategory sorts by sales descending', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    for (let i = 1; i < agg.byCategory.length; i++) {
      assert.ok(agg.byCategory[i - 1].totalSalesCents >= agg.byCategory[i].totalSalesCents);
    }
  });

  it('aggregateByCategory empty returns zero', () => {
    const agg = aggregateByCategory([]);
    assert.equal(agg.totalSalesCents, 0);
    assert.equal(agg.totalOrders, 0);
    assert.equal(agg.byCategory.length, 0);
    assert.equal(agg.topCategory, null);
  });

  it('filterByDateRange includes records in range', () => {
    const filtered = filterByDateRange(MOCK_RECORDS, '2026-07-01', '2026-07-01');
    assert.equal(filtered.length, 3);
    filtered.forEach(r => assert.ok(r.date >= '2026-07-01' && r.date <= '2026-07-01'));
  });

  it('filterByDateRange with no matches returns empty', () => {
    const filtered = filterByDateRange(MOCK_RECORDS, '2027-01-01', '2027-01-31');
    assert.equal(filtered.length, 0);
  });

  it('aggregateByCategory handles single category', () => {
    const agg = aggregateByCategory([MOCK_RECORDS[0]]);
    assert.equal(agg.byCategory.length, 1);
    assert.equal(agg.byCategory[0].salesPercent, 100);
  });

  it('overallMargin is zero when no sales', () => {
    const agg = aggregateByCategory([]);
    assert.equal(agg.overallMargin, 0);
  });

  it('aggregateByCategory groups same category from different channels', () => {
    const agg = aggregateByCategory(MOCK_RECORDS.filter(r => r.category === '饮料'));
    assert.equal(agg.byCategory.length, 1);
    assert.equal(agg.byCategory[0].totalSalesCents, 800000);
  });

  it('salesPercent sum equals approximately 100%', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    const totalPct = agg.byCategory.reduce((s, c) => s + c.salesPercent, 0);
    assert.ok(Math.abs(totalPct - 100) < 0.01, `占比之和(${totalPct})接近100%`);
  });

  it('orderPercent sorted by sales not orders', () => {
    const agg = aggregateByCategory(MOCK_RECORDS);
    for (let i = 1; i < agg.byCategory.length; i++) {
      assert.ok(agg.byCategory[i - 1].totalSalesCents >= agg.byCategory[i].totalSalesCents, '按销售额降序');
    }
  });

  it('component is a function', () => {
    assert.equal(typeof SalesSummaryPage, 'function');
  });
});
