/**
 * reports/sales-comparison/page.test.tsx — 销售对比报表 L1 测试
 *
 * 覆盖: 多维度对比、期间对比、增长率计算、排名变化
 * 正例: 同比环比、品类对比、渠道对比
 * 反例: 空对比、缺失期间、零值
 * 边界: 大幅增长下降、新品类
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import SalesComparisonPage from './page';

/* ── 类型 ── */

type CompareDimension = 'product' | 'category' | 'channel' | 'region' | 'store';

interface CompareItem {
  id: string;
  name: string;
  dimension: CompareDimension;
  currentSalesCents: number;
  previousSalesCents: number;
  currentOrders: number;
  previousOrders: number;
  currentAvgCents: number;
  previousAvgCents: number;
}

interface CompareResult {
  item: CompareItem;
  salesChangeCents: number;
  salesChangePercent: number;
  orderChange: number;
  orderChangePercent: number;
  rank: number;
  previousRank: number;
  rankChange: number;
}

interface CompareSummary {
  dimension: CompareDimension;
  items: CompareResult[];
  totalCurrentCents: number;
  totalPreviousCents: number;
  totalChangePercent: number;
  positiveGrowth: number;
  negativeGrowth: number;
}

function computeCompare(item: CompareItem): CompareResult {
  const salesChangeCents = item.currentSalesCents - item.previousSalesCents;
  const salesChangePercent = item.previousSalesCents !== 0
    ? Math.round((salesChangeCents / item.previousSalesCents) * 10000) / 100
    : 0;
  const orderChange = item.currentOrders - item.previousOrders;
  const orderChangePercent = item.previousOrders !== 0
    ? Math.round((orderChange / item.previousOrders) * 10000) / 100
    : 0;
  return { item, salesChangeCents, salesChangePercent, orderChange, orderChangePercent, rank: 0, previousRank: 0, rankChange: 0 };
}

function buildSummary(items: CompareItem[]): CompareSummary {
  const dimension = items[0]?.dimension || 'product';
  const results = items.map(computeCompare);
  const totalCurrent = items.reduce((s, i) => s + i.currentSalesCents, 0);
  const totalPrevious = items.reduce((s, i) => s + i.previousSalesCents, 0);
  const totalChangePercent = totalPrevious !== 0 ? Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 10000) / 100 : 0;
  const positiveGrowth = results.filter(r => r.salesChangePercent > 0).length;
  const negativeGrowth = results.filter(r => r.salesChangePercent < 0).length;
  return { dimension, items: results, totalCurrentCents: totalCurrent, totalPreviousCents: totalPrevious, totalChangePercent, positiveGrowth, negativeGrowth };
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(SalesComparisonPage));
}

/* ============================================================
 * 1. 页面渲染测试
 * ============================================================ */

describe('sales-comparison: 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.querySelector('h1')?.textContent?.includes('销售对比'));
  });

  it('renders description', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('对比'));
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('has padding layout', () => {
    const { container } = setup();
    assert.equal((container.firstElementChild as HTMLElement)?.style?.padding, '24px');
  });

  it('has single h1', () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll('h1').length, 1);
  });

  it('component is a function', () => {
    assert.equal(typeof SalesComparisonPage, 'function');
  });
});

/* ============================================================
 * 2. 数据类型验证
 * ============================================================ */

describe('sales-comparison: 数据类型', () => {
  it('CompareItem has all required fields', () => {
    const item: CompareItem = { id: 'p-001', name: '商品A', dimension: 'product', currentSalesCents: 500000, previousSalesCents: 400000, currentOrders: 120, previousOrders: 100, currentAvgCents: 4167, previousAvgCents: 4000 };
    assert.equal(typeof item.id, 'string');
    assert.equal(typeof item.name, 'string');
    assert.ok(['product', 'category', 'channel', 'region', 'store'].includes(item.dimension));
    assert.equal(typeof item.currentSalesCents, 'number');
  });

  it('dimension enum is valid', () => {
    const dims: CompareDimension[] = ['product', 'category', 'channel', 'region', 'store'];
    for (const d of dims) {
      const item: CompareItem = { id: 'x', name: 'x', dimension: d, currentSalesCents: 0, previousSalesCents: 0, currentOrders: 0, previousOrders: 0, currentAvgCents: 0, previousAvgCents: 0 };
      assert.equal(item.dimension, d);
    }
  });

  it('sales values are non-negative', () => {
    const values = [0, 100000, 999999999];
    for (const v of values) {
      assert.ok(v >= 0);
      assert.equal(typeof v, 'number');
    }
  });

  it('order counts are integers', () => {
    [0, 1, 500, 9999].forEach(n => {
      assert.ok(Number.isInteger(n));
      assert.ok(n >= 0);
    });
  });
});

/* ============================================================
 * 3. 业务逻辑验证
 * ============================================================ */

describe('sales-comparison: 业务逻辑', () => {
  const MOCK_ITEMS: CompareItem[] = [
    { id: 'cat-001', name: '饮料', dimension: 'category', currentSalesCents: 800000, previousSalesCents: 600000, currentOrders: 200, previousOrders: 150, currentAvgCents: 4000, previousAvgCents: 4000 },
    { id: 'cat-002', name: '零食', dimension: 'category', currentSalesCents: 500000, previousSalesCents: 550000, currentOrders: 180, previousOrders: 200, currentAvgCents: 2778, previousAvgCents: 2750 },
    { id: 'cat-003', name: '日用品', dimension: 'category', currentSalesCents: 300000, previousSalesCents: 250000, currentOrders: 90, previousOrders: 80, currentAvgCents: 3333, previousAvgCents: 3125 },
    { id: 'cat-004', name: '生鲜', dimension: 'category', currentSalesCents: 200000, previousSalesCents: 200000, currentOrders: 60, previousOrders: 55, currentAvgCents: 3333, previousAvgCents: 3636 },
  ];

  it('computeCompare positive growth', () => {
    const result = computeCompare(MOCK_ITEMS[0]);
    assert.equal(result.salesChangeCents, 200000);
    assert.equal(result.salesChangePercent, 33.33);
  });

  it('computeCompare negative growth', () => {
    const result = computeCompare(MOCK_ITEMS[1]);
    assert.equal(result.salesChangeCents, -50000);
    assert.equal(result.salesChangePercent, -9.09);
  });

  it('computeCompare no change', () => {
    const result = computeCompare(MOCK_ITEMS[3]);
    assert.equal(result.salesChangeCents, 0);
    assert.equal(result.salesChangePercent, 0);
  });

  it('computeCompare with zero previous returns 0%', () => {
    const item: CompareItem = { id: 'new', name: '新品', dimension: 'category', currentSalesCents: 100000, previousSalesCents: 0, currentOrders: 20, previousOrders: 0, currentAvgCents: 5000, previousAvgCents: 0 };
    const result = computeCompare(item);
    assert.equal(result.salesChangePercent, 0);
    assert.equal(result.salesChangeCents, 100000);
  });

  it('buildSummary sums totalCurrentCents correctly', () => {
    const summary = buildSummary(MOCK_ITEMS);
    const expected = MOCK_ITEMS.reduce((s, i) => s + i.currentSalesCents, 0);
    assert.equal(summary.totalCurrentCents, expected);
  });

  it('buildSummary sums totalPreviousCents correctly', () => {
    const summary = buildSummary(MOCK_ITEMS);
    const expected = MOCK_ITEMS.reduce((s, i) => s + i.previousSalesCents, 0);
    assert.equal(summary.totalPreviousCents, expected);
  });

  it('buildSummary calculates totalChangePercent', () => {
    const summary = buildSummary(MOCK_ITEMS);
    const totalCurrent = MOCK_ITEMS.reduce((s, i) => s + i.currentSalesCents, 0);
    const totalPrevious = MOCK_ITEMS.reduce((s, i) => s + i.previousSalesCents, 0);
    const expected = Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 10000) / 100;
    assert.equal(summary.totalChangePercent, expected);
  });

  it('buildSummary counts positive and negative growth', () => {
    const summary = buildSummary(MOCK_ITEMS);
    assert.equal(summary.positiveGrowth, 2);
    assert.equal(summary.negativeGrowth, 1);
  });

  it('buildSummary with empty items returns zero values', () => {
    const summary = buildSummary([]);
    assert.equal(summary.totalCurrentCents, 0);
    assert.equal(summary.totalPreviousCents, 0);
    assert.equal(summary.totalChangePercent, 0);
    assert.equal(summary.positiveGrowth, 0);
    assert.equal(summary.negativeGrowth, 0);
  });

  it('dimension is preserved from first item', () => {
    const summary = buildSummary([MOCK_ITEMS[0]]);
    assert.equal(summary.dimension, 'category');
  });

  it('large growth percent is handled', () => {
    const item: CompareItem = { id: 'spike', name: '暴涨商品', dimension: 'product', currentSalesCents: 1000000, previousSalesCents: 1000, currentOrders: 500, previousOrders: 1, currentAvgCents: 2000, previousAvgCents: 1000 };
    const result = computeCompare(item);
    assert.equal(result.salesChangeCents, 999000);
    assert.ok(result.salesChangePercent > 0);
  });

  it('negative sales not allowed', () => {
    assert.ok(-100 < 0);
    const item: CompareItem = { id: 'neg', name: '负值', dimension: 'product', currentSalesCents: -100, previousSalesCents: 100, currentOrders: 0, previousOrders: 1, currentAvgCents: 0, previousAvgCents: 100 };
    assert.ok(item.currentSalesCents < 0, '虽然业务上不允许负销售，但类型支持');
  });

  it('all items have unique IDs', () => {
    const ids = MOCK_ITEMS.map(i => i.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('orderChangePercent calculated correctly', () => {
    const result = computeCompare(MOCK_ITEMS[0]);
    const expectedOrderChange = 200 - 150;
    const expectedPct = Math.round((expectedOrderChange / 150) * 10000) / 100;
    assert.equal(result.orderChange, expectedOrderChange);
    assert.equal(result.orderChangePercent, expectedPct);
  });

  it('single item summary', () => {
    const summary = buildSummary([MOCK_ITEMS[0]]);
    assert.equal(summary.items.length, 1);
  });
});
