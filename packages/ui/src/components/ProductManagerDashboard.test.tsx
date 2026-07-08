import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {
  ProductManagerDashboard,
} from './ProductManagerDashboard';
import type {
  ProductManagerDashboardProps,
  ProductGrowthMetrics,
  ProductSnapshot,
  CategoryStat,
  ProductQuickAction,
} from './ProductManagerDashboard';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }
  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }
  return '';
}

// ---- 基础导出 ----

test('ProductManagerDashboard: component is exported as a function', () => {
  assert.equal(typeof ProductManagerDashboard, 'function');
});

// ---- 加载状态 ----

test('ProductManagerDashboard: loading state renders skeleton and loading text', () => {
  const element = ProductManagerDashboard({ loading: true });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /正在加载产品数据/);
});

// ---- 头部信息 ----

test('ProductManagerDashboard: renders manager name', () => {
  const element = ProductManagerDashboard({ managerName: '张产品' });
  const text = extractText(element);
  assert.match(text, /产品经理工作台/);
  assert.match(text, /张产品/);
});

test('ProductManagerDashboard: renders lastSyncAt', () => {
  const element = ProductManagerDashboard({ lastSyncAt: '2026-07-08 14:00' });
  const text = extractText(element);
  assert.match(text, /2026-07-08 14:00/);
});

// ---- 增长指标 ----

test('ProductManagerDashboard: renders metrics with positive trends', () => {
  const metrics: ProductGrowthMetrics = {
    totalProducts: 186,
    totalProductsQoQ: 12.5,
    onlineProducts: 154,
    onlineProductsQoQ: 8.3,
    pendingReview: 8,
    pendingReviewQoQ: -20.0,
    outOfStockCount: 3,
    outOfStockQoQ: -40.0,
    newProductsThisMonth: 15,
    totalSoldThisMonth: 24000,
    avgRating: 4.7,
    avgRatingQoQ: 0.5,
  };
  const element = ProductManagerDashboard({ metrics });
  assert.ok(React.isValidElement(element));
});

test('ProductManagerDashboard: renders metrics with negative trends', () => {
  const metrics: ProductGrowthMetrics = {
    totalProducts: 120,
    totalProductsQoQ: -5.2,
    onlineProducts: 80,
    onlineProductsQoQ: -10.1,
    pendingReview: 15,
    pendingReviewQoQ: 50.0,
    outOfStockCount: 12,
    outOfStockQoQ: 30.0,
    newProductsThisMonth: 3,
    totalSoldThisMonth: 8000,
    avgRating: 3.9,
    avgRatingQoQ: -0.8,
  };
  const element = ProductManagerDashboard({ metrics });
  assert.ok(React.isValidElement(element));
});

test('ProductManagerDashboard: renders no stats section when no metrics', () => {
  const element = ProductManagerDashboard({});
  assert.ok(React.isValidElement(element));
});

// ---- 月度上新进度 ----

test('ProductManagerDashboard: renders launch progress bar', () => {
  const element = ProductManagerDashboard({
    monthlyGoal: 20,
    launchedThisMonth: 12,
  });
  const text = extractText(element);
  assert.match(text, /本月上新进度/);
  assert.match(text, /12/);
  assert.match(text, /20/);
});

test('ProductManagerDashboard: renders completed launch goal', () => {
  const element = ProductManagerDashboard({
    monthlyGoal: 15,
    launchedThisMonth: 15,
  });
  const text = extractText(element);
  assert.match(text, /15/);
});

test('ProductManagerDashboard: renders over-achieved launch goal', () => {
  const element = ProductManagerDashboard({
    monthlyGoal: 10,
    launchedThisMonth: 14,
  });
  const text = extractText(element);
  assert.match(text, /14/);
  assert.match(text, /10/);
});

test('ProductManagerDashboard: no launch bar when props omitted', () => {
  const element = ProductManagerDashboard({});
  const text = extractText(element);
  assert.equal(text.includes('本月上新进度'), false);
});

// ---- 产品列表 ----

test('ProductManagerDashboard: renders products with all status types', () => {
  const products: ProductSnapshot[] = [
    {
      id: 'p1',
      name: '经典纯棉T恤',
      sku: 'TS-001-BLK',
      category: '服装',
      brand: '自有品牌',
      price: 129.00,
      costPrice: 45.00,
      stock: 500,
      soldCount: 3200,
      status: 'online',
      createdAt: '2026-01-15',
      rating: 4.5,
    },
    {
      id: 'p2',
      name: '运动速干短裤',
      sku: 'SH-002-RED',
      category: '服装',
      brand: '运动系列',
      price: 199.00,
      costPrice: 70.00,
      stock: 0,
      soldCount: 1800,
      status: 'out_of_stock',
      createdAt: '2026-02-10',
      rating: 4.2,
    },
    {
      id: 'p3',
      name: '智能手环Pro',
      sku: 'WB-003-PRO',
      category: '数码',
      brand: '科技系列',
      price: 399.00,
      costPrice: 150.00,
      stock: 120,
      soldCount: 560,
      status: 'pending_review',
      createdAt: '2026-06-28',
      rating: 0,
    },
    {
      id: 'p4',
      name: '保温杯500ml',
      sku: 'BG-004-GRY',
      category: '日用品',
      price: 89.00,
      stock: 200,
      soldCount: 4500,
      status: 'online',
      createdAt: '2026-01-05',
      rating: 4.8,
    },
    {
      id: 'p5',
      name: '经典帆布鞋',
      sku: 'CS-005-WHT',
      category: '鞋类',
      brand: '经典系列',
      price: 168.00,
      costPrice: 55.00,
      stock: 350,
      soldCount: 12000,
      status: 'online',
      createdAt: '2025-12-01',
      rating: 4.6,
    },
    {
      id: 'p6',
      name: '老款充电宝',
      sku: 'CP-006-OLD',
      category: '数码',
      price: 59.00,
      costPrice: 30.00,
      stock: 40,
      soldCount: 20000,
      status: 'discontinued',
      createdAt: '2024-06-01',
      updatedAt: '2026-03-01',
      rating: 4.0,
    },
    {
      id: 'p7',
      name: '冬季羽绒服',
      sku: 'DK-007-BLK',
      category: '服装',
      brand: '自有品牌',
      price: 599.00,
      costPrice: 200.00,
      stock: 80,
      soldCount: 900,
      status: 'offline',
      createdAt: '2025-09-15',
      rating: 4.3,
    },
  ];
  const element = ProductManagerDashboard({ products });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /产品列表/);
  assert.match(text, /\( 7 \)/);
  assert.ok(React.isValidElement(element));
});

test('ProductManagerDashboard: renders empty products state', () => {
  const element = ProductManagerDashboard({ products: [] });
  const text = extractText(element);
  assert.match(text, /暂无产品数据/);
});

test('ProductManagerDashboard: no products section when undefined', () => {
  const element = ProductManagerDashboard({});
  assert.ok(React.isValidElement(element));
});

// ---- 品类分布 ----

test('ProductManagerDashboard: renders category stats', () => {
  const categoryStats: CategoryStat[] = [
    { category: '服装', productCount: 64, salesPercent: 45.2, avgPrice: 168.50 },
    { category: '数码', productCount: 38, salesPercent: 28.6, avgPrice: 399.00 },
    { category: '日用品', productCount: 42, salesPercent: 18.3, avgPrice: 45.80 },
    { category: '鞋类', productCount: 25, salesPercent: 7.9, avgPrice: 215.00 },
  ];
  const element = ProductManagerDashboard({ categoryStats });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /品类分布/);
  assert.match(text, /\( 4 \)/);
  assert.ok(React.isValidElement(element));
});

test('ProductManagerDashboard: no categories section when omitted', () => {
  const element = ProductManagerDashboard({ products: [] });
  const text = extractText(element);
  assert.equal(text.includes('品类分布'), false);
});

// ---- 快速操作 ----

test('ProductManagerDashboard: renders quick action buttons including primary', () => {
  const actions: ProductQuickAction[] = [
    { key: 'add', label: '添加产品', primary: true },
    { key: 'import', label: '批量导入' },
    { key: 'review', label: '审核队列', icon: '📋' },
    { key: 'report', label: '产品报表' },
  ];
  const element = ProductManagerDashboard({ quickActions: actions });
  const text = extractText(element);
  assert.match(text, /添加产品/);
  assert.match(text, /批量导入/);
  assert.match(text, /审核队列/);
  assert.match(text, /产品报表/);
  assert.match(text, /📋/);
});

test('ProductManagerDashboard: no quick actions when empty array', () => {
  const element = ProductManagerDashboard({ quickActions: [] });
  assert.ok(React.isValidElement(element));
});

// ---- 紧凑模式 ----

test('ProductManagerDashboard: compact mode renders correctly', () => {
  const element = ProductManagerDashboard({
    compact: true,
    managerName: '张产品',
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /产品经理工作台/);
});

// ---- 完整集成 ----

test('ProductManagerDashboard: full integration with all sections', () => {
  const props: ProductManagerDashboardProps = {
    managerName: '李产品',
    lastSyncAt: '2026-07-08 10:00',
    monthlyGoal: 25,
    launchedThisMonth: 18,
    metrics: {
      totalProducts: 200,
      totalProductsQoQ: 10.5,
      onlineProducts: 170,
      onlineProductsQoQ: 6.2,
      pendingReview: 5,
      pendingReviewQoQ: -50.0,
      outOfStockCount: 4,
      outOfStockQoQ: -33.3,
      newProductsThisMonth: 18,
      totalSoldThisMonth: 35000,
      avgRating: 4.6,
      avgRatingQoQ: 0.3,
    },
    products: [
      {
        id: 'p1',
        name: '旗舰产品',
        sku: 'FLAG-001',
        category: '数码',
        price: 599.00,
        stock: 200,
        soldCount: 5000,
        status: 'online',
        createdAt: '2026-03-01',
        rating: 4.8,
      },
      {
        id: 'p2',
        name: '待审核产品',
        sku: 'PEND-002',
        category: '服装',
        price: 199.00,
        stock: 0,
        soldCount: 0,
        status: 'pending_review',
        createdAt: '2026-07-05',
        rating: 0,
      },
    ],
    categoryStats: [
      { category: '数码', productCount: 80, salesPercent: 50.0, avgPrice: 350.00 },
      { category: '服装', productCount: 60, salesPercent: 30.0, avgPrice: 180.00 },
      { category: '日用品', productCount: 40, salesPercent: 20.0, avgPrice: 50.00 },
    ],
    quickActions: [
      { key: 'add', label: '添加产品', primary: true },
      { key: 'review', label: '审核队列', icon: '📋' },
    ],
  };

  const element = ProductManagerDashboard(props);
  assert.ok(React.isValidElement(element));
  const text = extractText(element);

  // 头部
  assert.match(text, /产品经理工作台/);
  assert.match(text, /李产品/);
  assert.match(text, /2026-07-08 10:00/);

  // 上新进度
  assert.match(text, /本月上新进度/);
  assert.match(text, /18/);
  assert.match(text, /25/);

  // Section titles
  assert.match(text, /产品列表/);
  assert.match(text, /品类分布/);

  // Quick actions
  assert.match(text, /添加产品/);
  assert.match(text, /审核队列/);
  assert.match(text, /📋/);

  assert.ok(React.isValidElement(element));
});

// ---- 边界情况 ----

test('ProductManagerDashboard: handles product without optional fields', () => {
  const products: ProductSnapshot[] = [
    {
      id: 'p-min',
      name: '极简产品',
      sku: 'MIN-001',
      category: '其他',
      price: 10.00,
      stock: 1,
      soldCount: 0,
      status: 'online',
      createdAt: '2026-07-01',
    },
  ];
  const element = ProductManagerDashboard({ products });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /产品列表/);
  assert.ok(React.isValidElement(element));
});

test('ProductManagerDashboard: handles zero stock edge case', () => {
  const products: ProductSnapshot[] = [
    {
      id: 'p-zero',
      name: '零库存产品',
      sku: 'ZERO-001',
      category: '测试',
      price: 50.00,
      stock: 0,
      soldCount: 100,
      status: 'out_of_stock',
      createdAt: '2026-06-15',
    },
    {
      id: 'p-low',
      name: '低库存产品',
      sku: 'LOW-002',
      category: '测试',
      price: 30.00,
      stock: 3,
      soldCount: 500,
      status: 'online',
      createdAt: '2026-05-01',
    },
  ];
  const element = ProductManagerDashboard({ products });
  assert.ok(React.isValidElement(element));
});

test('ProductManagerDashboard: renders without any props', () => {
  const element = ProductManagerDashboard({});
  assert.ok(React.isValidElement(element));
});

test('ProductManagerDashboard: handles zero monthlyGoal edge case', () => {
  const element = ProductManagerDashboard({
    monthlyGoal: 0,
    launchedThisMonth: 0,
  });
  const text = extractText(element);
  assert.match(text, /本月上新进度/);
  assert.ok(React.isValidElement(element));
});
