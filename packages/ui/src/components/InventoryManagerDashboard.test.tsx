import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  InventoryManagerDashboard,
} = require('./InventoryManagerDashboard');

import type {
  InventoryMetrics,
  SlowMovingItem,
  SupplierPerformance,
  CategoryBreakdown,
} from './InventoryManagerDashboard';

// ---- Mock Data ----

const mockMetrics: InventoryMetrics = {
  totalStockValue: 3240000,
  totalSku: 2156,
  turnoverDays: 28,
  stockoutRate: 0.032,
  valueTrend: -1.2,
  skuTrend: 3.5,
  turnoverTrend: -2.1,
  stockoutTrend: 0.5,
};

const mockSlowItems: SlowMovingItem[] = [
  {
    id: 'sm-01',
    sku: 'SKU-089',
    name: 'XX冬季棉服',
    currentQty: 320,
    sales30d: 12,
    daysInStock: 98,
    capitalLocked: 38400,
    suggestion: 'promote',
  },
  {
    id: 'sm-02',
    sku: 'SKU-112',
    name: '经典格纹围巾',
    currentQty: 150,
    sales30d: 5,
    daysInStock: 145,
    capitalLocked: 9000,
    suggestion: 'writeoff',
  },
];

const mockSuppliers: SupplierPerformance[] = [
  {
    id: 's-01',
    name: '杭州纺织科技',
    onTimeRate: 0.96,
    qualityRate: 0.99,
    avgLeadDays: 4,
    monthlyPurchase: 450000,
    grade: 'A',
  },
  {
    id: 's-02',
    name: '广州服装辅料',
    onTimeRate: 0.82,
    qualityRate: 0.94,
    avgLeadDays: 7,
    monthlyPurchase: 220000,
    grade: 'C',
  },
];

const mockCategories: CategoryBreakdown[] = [
  { category: '服装', skuCount: 680, totalValue: 1080000, percentage: 33.3 },
  { category: '配饰', skuCount: 420, totalValue: 540000, percentage: 16.7 },
  { category: '家居', skuCount: 310, totalValue: 756000, percentage: 23.3 },
];

// ---- Helpers ----

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

function countOccurrences(html: string, substr: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = html.indexOf(substr, idx)) !== -1) {
    count++;
    idx += substr.length;
  }
  return count;
}

// ---- Tests ----

describe('InventoryManagerDashboard', () => {
  it('renders loading state', () => {
    const html = renderToStaticMarkup(<InventoryManagerDashboard loading />);
    assert.ok(hasText(html, '正在加载库存分析数据'));
  });

  it('shows default title when not provided', () => {
    const html = renderToStaticMarkup(<InventoryManagerDashboard />);
    assert.ok(hasText(html, '库存经理工作台'));
  });

  it('renders custom title', () => {
    const html = renderToStaticMarkup(<InventoryManagerDashboard title="仓储分析面板" />);
    assert.ok(hasText(html, '仓储分析面板'));
  });

  it('renders last updated timestamp', () => {
    const html = renderToStaticMarkup(<InventoryManagerDashboard lastUpdatedAt="2026-07-08 18:00" />);
    assert.ok(hasText(html, '数据更新: 2026-07-08 18:00'));
  });

  it('renders 4 metric cards with given data', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard metrics={mockMetrics} />
    );
    assert.ok(hasText(html, '总库存金额'));
    assert.ok(hasText(html, '324'));
    assert.ok(hasText(html, 'SKU 总数'));
    assert.ok(hasText(html, '库存周转天数'));
    assert.ok(hasText(html, '缺货率'));
  });

  it('includes trend helpers in metric cards', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard metrics={mockMetrics} />
    );
    assert.ok(hasText(html, '环比'));
    assert.ok(hasText(html, '-1.2%'));
  });

  it('renders category breakdown bars', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard
        metrics={mockMetrics}
        categoryBreakdown={mockCategories}
      />
    );
    assert.ok(hasText(html, '品类库存分布'));
    assert.ok(hasText(html, '服装'));
    assert.ok(hasText(html, '配饰'));
    assert.ok(hasText(html, '家居'));
    assert.ok(hasText(html, '33.3%'));
    assert.ok(hasText(html, '16.7%'));
    assert.ok(hasText(html, '23.3%'));
  });

  it('renders slow moving items table', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard
        metrics={mockMetrics}
        slowMovingItems={mockSlowItems}
      />
    );
    assert.ok(hasText(html, '滞销 / 积压商品'));
    assert.ok(hasText(html, 'XX冬季棉服'));
    assert.ok(hasText(html, '经典格纹围巾'));
    assert.ok(hasText(html, '促销'));
    assert.ok(hasText(html, '报废'));
  });

  it('renders slow item count badge', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard
        metrics={mockMetrics}
        slowMovingItems={mockSlowItems}
      />
    );
    assert.ok(hasText(html, '(2)'));
  });

  it('renders supplier performance table', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard
        metrics={mockMetrics}
        supplierPerformances={mockSuppliers}
      />
    );
    assert.ok(hasText(html, '供应商绩效'));
    assert.ok(hasText(html, '杭州纺织科技'));
    assert.ok(hasText(html, '广州服装辅料'));
    assert.ok(hasText(html, '96%'));
    assert.ok(hasText(html, '99%'));
    assert.ok(hasText(html, 'A'));
    assert.ok(hasText(html, 'C'));
  });

  it('renders full dashboard with all sections', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard
        metrics={mockMetrics}
        slowMovingItems={mockSlowItems}
        supplierPerformances={mockSuppliers}
        categoryBreakdown={mockCategories}
        title="库存总览"
        lastUpdatedAt="刚刚"
      />
    );
    assert.ok(hasText(html, '库存总览'));
    assert.ok(hasText(html, '数据更新: 刚刚'));
    assert.ok(hasText(html, '品类库存分布'));
    assert.ok(hasText(html, '滞销 / 积压商品'));
    assert.ok(hasText(html, '供应商绩效'));
  });

  it('renders fallback text when no metrics', () => {
    const html = renderToStaticMarkup(<InventoryManagerDashboard />);
    // fallback labels not metrics values
    assert.ok(hasText(html, '库存金额'));
    assert.ok(hasText(html, 'SKU 数'));
  });

  it('does not render sections when data is empty', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard metrics={mockMetrics} />
    );
    // no category, no slow items, no suppliers
    assert.ok(!hasText(html, '品类库存分布'));
    assert.ok(!hasText(html, '滞销'));
    assert.ok(!hasText(html, '供应商绩效'));
  });

  it('renders all 4 metric labels', () => {
    const html = renderToStaticMarkup(
      <InventoryManagerDashboard metrics={mockMetrics} />
    );
    const labels = ['总库存金额', 'SKU 总数', '库存周转天数', '缺货率'];
    for (const lbl of labels) {
      assert.ok(hasText(html, lbl), `Missing metric label: ${lbl}`);
    }
  });
});
