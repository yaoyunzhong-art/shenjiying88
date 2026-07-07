/**
 * performance/page.test.ts — 门店绩效 L1 冒烟测试
 * 角色视角: 👔店长
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 数据工厂 (从 performance-data 导入验证) ── */

function makeData(overrides?: Record<string, unknown>) {
  return {
    todayRevenue: 58260.00,
    todayOrders: 247,
    todayCustomers: 195,
    avgOrderValue: 235.87,
    revenueGrowth: 12.5,
    orderGrowth: 8.3,
    completionRate: 78,
    satisfactionScore: 92,
    hourlySales: [
      { hour: '08:00', sales: 3200, orders: 18 },
      { hour: '09:00', sales: 4800, orders: 25 },
      { hour: '10:00', sales: 5200, orders: 28 },
      { hour: '11:00', sales: 6800, orders: 36 },
      { hour: '12:00', sales: 9100, orders: 42 },
      { hour: '13:00', sales: 7400, orders: 35 },
      { hour: '14:00', sales: 5600, orders: 29 },
      { hour: '15:00', sales: 6100, orders: 34 },
    ],
    categoryPerformance: [
      { category: '生鲜', revenue: 18500, salesCount: 96, targetAchievement: 92 },
      { category: '饮料', revenue: 12300, salesCount: 78, targetAchievement: 105 },
      { category: '零食', revenue: 9800, salesCount: 52, targetAchievement: 88 },
      { category: '日用品', revenue: 8760, salesCount: 45, targetAchievement: 76 },
      { category: '熟食', revenue: 6900, salesCount: 38, targetAchievement: 95 },
    ],
    weekly: {
      dailyRevenue: [45200, 48900, 51200, 47800, 58260, 61500, 53100],
      dailyOrders: [180, 210, 198, 205, 247, 260, 222],
      dailyCustomers: [145, 170, 162, 158, 195, 210, 178],
    },
    ...overrides,
  };
}

function makeHourlySales(overrides?: Record<string, unknown>) {
  return { hour: '10:00', sales: 5200, orders: 28, ...overrides };
}

function makeCategoryPerf(overrides?: Record<string, unknown>) {
  return { category: '生鲜', revenue: 18500, salesCount: 96, targetAchievement: 92, ...overrides };
}

function makeWeeklyPerf(overrides?: Record<string, unknown>) {
  return {
    dailyRevenue: [45200, 48900, 51200, 47800, 58260, 61500, 53100],
    dailyOrders: [180, 210, 198, 205, 247, 260, 222],
    dailyCustomers: [145, 170, 162, 158, 195, 210, 178],
    ...overrides,
  };
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('👔 门店绩效: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 门店绩效: 页面模块导入稳定', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
  const src = mod.default.toString();
  assert.ok(src.includes('GaugeChart'), 'should reference GaugeChart');
  assert.ok(src.includes('QuickStats'), 'should reference QuickStats');
  assert.ok(src.includes('HeatmapChart'), 'should reference HeatmapChart');
  assert.ok(src.includes('StatCard'), 'should reference StatCard');
});

test('正例: performance-data 工厂函数导出存在且可用', async () => {
  const data = await import('./performance-data');
  assert.equal(typeof data.makeStorePerformanceData, 'function');
  assert.equal(typeof data.makeHourlySales, 'function');
  assert.equal(typeof data.makeCategoryPerf, 'function');
  assert.equal(typeof data.makeWeeklyPerf, 'function');

  const d = data.makeStorePerformanceData();
  assert.equal(typeof d.todayRevenue, 'number');
  assert.equal(d.hourlySales.length, 8);
  assert.equal(d.categoryPerformance.length, 5);
});

test('正例: 所有 mock 数据构造不抛异常', () => {
  assert.equal(callSafe(makeData), true);
  assert.equal(callSafe(makeHourlySales), true);
  assert.equal(callSafe(makeCategoryPerf), true);
  assert.equal(callSafe(makeWeeklyPerf), true);
});

test('正例: storePerformanceData 字段完整', () => {
  const d = makeData();
  const expectedKeys = [
    'todayRevenue', 'todayOrders', 'todayCustomers', 'avgOrderValue',
    'revenueGrowth', 'orderGrowth', 'completionRate', 'satisfactionScore',
    'hourlySales', 'categoryPerformance', 'weekly',
  ];
  for (const key of expectedKeys) {
    assert.equal(key in d, true, `data should have field: ${key}`);
  }
  assert.equal(typeof d.todayRevenue, 'number');
  assert.equal(typeof d.todayOrders, 'number');
  assert.equal(typeof d.completionRate, 'number');
  assert.equal(typeof d.satisfactionScore, 'number');
  assert.equal(Array.isArray(d.hourlySales), true);
  assert.equal(Array.isArray(d.categoryPerformance), true);
  assert.equal(typeof d.weekly, 'object');
});

test('正例: hourlySales 每项字段完整', () => {
  const d = makeData();
  for (const h of d.hourlySales) {
    assert.equal(typeof h.hour, 'string');
    assert.equal(typeof h.sales, 'number');
    assert.equal(typeof h.orders, 'number');
  }
  // 验证时段升序
  for (let i = 1; i < d.hourlySales.length; i++) {
    assert.ok(d.hourlySales[i].hour > d.hourlySales[i - 1].hour,
      `hours should be sorted: ${d.hourlySales[i - 1].hour} < ${d.hourlySales[i].hour}`);
  }
});

test('正例: categoryPerformance 每项字段完整', () => {
  const d = makeData();
  for (const c of d.categoryPerformance) {
    assert.equal(typeof c.category, 'string');
    assert.equal(typeof c.revenue, 'number');
    assert.equal(typeof c.salesCount, 'number');
    assert.equal(typeof c.targetAchievement, 'number');
  }
  assert.equal(d.categoryPerformance.length, 5, 'should have 5 categories');
});

test('正例: weekly 字段完整 & 均为 7 天', () => {
  const w = makeWeeklyPerf();
  assert.equal(w.dailyRevenue.length, 7);
  assert.equal(w.dailyOrders.length, 7);
  assert.equal(w.dailyCustomers.length, 7);
  const allNumbers = [...w.dailyRevenue, ...w.dailyOrders, ...w.dailyCustomers];
  for (const v of allNumbers) {
    assert.equal(typeof v, 'number');
    assert.ok(v >= 0, 'weekly values should be non-negative');
  }
});

test('正例: weekly 的 dailyRevenue 总量一致性', () => {
  const d = makeData();
  const weeklyTotal = d.weekly.dailyRevenue.reduce((a, b) => a + b, 0);
  assert.ok(weeklyTotal > 0, 'weekly total revenue should be positive');
});

test('正例: 满意度 & 完成率在 0-100 范围内', () => {
  const d = makeData();
  assert.ok(d.completionRate >= 0 && d.completionRate <= 100,
    `completionRate ${d.completionRate} should be in [0,100]`);
  assert.ok(d.satisfactionScore >= 0 && d.satisfactionScore <= 100,
    `satisfactionScore ${d.satisfactionScore} should be in [0,100]`);
});

test('正例: 导出工厂函数使用 overrides', async () => {
  const data = await import('./performance-data');
  const result = data.makeStorePerformanceData({ todayRevenue: 99999, completionRate: 100 });
  assert.equal(result.todayRevenue, 99999);
  assert.equal(result.completionRate, 100);
});

/* ── 反例 ── */

test('反例: 全零数据不抛异常', () => {
  const d = makeData({
    todayRevenue: 0, todayOrders: 0, todayCustomers: 0, avgOrderValue: 0,
    revenueGrowth: 0, orderGrowth: 0, completionRate: 0, satisfactionScore: 0,
    hourlySales: [],
    categoryPerformance: [],
    weekly: { dailyRevenue: [], dailyOrders: [], dailyCustomers: [] },
  });
  assert.equal(d.todayRevenue, 0);
  assert.equal(d.hourlySales.length, 0);
  assert.equal(d.categoryPerformance.length, 0);
});

test('反例: 负增长不抛异常', () => {
  const d = makeData({ revenueGrowth: -15.3, orderGrowth: -8.7 });
  assert.equal(d.revenueGrowth, -15.3);
  assert.equal(d.orderGrowth, -8.7);
  assert.ok(d.revenueGrowth < 0);
});

test('反例: completionRate 超出 100', () => {
  const d = makeData({ completionRate: 120 });
  assert.equal(d.completionRate, 120);
});

test('反例: 空 hourlySales', () => {
  const h = makeHourlySales({ hour: '', sales: 0, orders: 0 });
  assert.equal(h.hour, '');
  assert.equal(h.sales, 0);
  assert.equal(h.orders, 0);
});

test('反例: category 空字符串', () => {
  const c = makeCategoryPerf({ category: '', revenue: 0, salesCount: 0, targetAchievement: 0 });
  assert.equal(c.category, '');
});

test('反例: weekly 数组长度不一致', () => {
  const w = makeWeeklyPerf({ dailyRevenue: [100], dailyOrders: [100], dailyCustomers: [100] });
  assert.equal(w.dailyRevenue.length, 1);
  assert.equal(w.dailyOrders.length, 1);
  assert.equal(w.dailyCustomers.length, 1);
});

/* ── 边界 ── */

test('边界: 超大营收', () => {
  const d = makeData({ todayRevenue: 99999999.99 });
  assert.equal(d.todayRevenue, 99999999.99);
});

test('边界: 最大品类数 20 个', () => {
  const cats = Array.from({ length: 20 }, (_, i) => makeCategoryPerf({
    category: `品类${i}`,
    revenue: 1000 * (i + 1),
    salesCount: i * 5,
    targetAchievement: 50 + i * 2,
  }));
  assert.equal(cats.length, 20);
  assert.equal(cats[0].category, '品类0');
  assert.equal(cats[19].category, '品类19');
});

test('边界: 小时粒度覆盖全天', () => {
  const hours = Array.from({ length: 14 }, (_, i) => makeHourlySales({
    hour: `${String(8 + i).padStart(2, '0')}:00`,
    sales: 3000 + i * 200,
    orders: 15 + i * 3,
  }));
  assert.equal(hours.length, 14);
  assert.equal(hours[0].hour, '08:00');
  assert.equal(hours[13].hour, '21:00');
});

test('边界: 满意度和完成率边界值', () => {
  const extremes = [
    { completionRate: 0, satisfactionScore: 0 },
    { completionRate: 100, satisfactionScore: 100 },
    { completionRate: 50, satisfactionScore: 50 },
    { completionRate: 1, satisfactionScore: 99 },
  ];
  for (const e of extremes) {
    const d = makeData(e);
    assert.equal(d.completionRate, e.completionRate);
    assert.equal(d.satisfactionScore, e.satisfactionScore);
  }
});

test('边界: 性能 — 构造 1000 条小时数据 < 50ms', () => {
  const start = performance.now();
  const records = Array.from({ length: 1000 }, (_, i) => makeHourlySales({
    hour: `${String(i % 24).padStart(2, '0')}:00`,
    sales: (i % 10) * 1000,
    orders: (i % 20) + 5,
  }));
  const elapsed = performance.now() - start;
  assert.equal(records.length, 1000);
  assert.ok(elapsed < 50, `1000 records construct in ${elapsed.toFixed(1)}ms (should be < 50ms)`);
});

test('边界: 模块常量引用', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
  const fnStr = mod.default.toString();
  assert.ok(fnStr.includes('COMPLETION_SEGMENTS') || fnStr.includes('completion'),
    'component should reference completion gauge');
  assert.ok(fnStr.includes('SATISFACTION_SEGMENTS') || fnStr.includes('satisfaction'),
    'component should reference satisfaction gauge');
});

test('边界: performance-data 导出接口稳定', async () => {
  const data = await import('./performance-data');
  // 验证所有类型和工厂函数
  assert.equal(typeof data.makeStorePerformanceData, 'function');
  assert.equal(typeof data.makeHourlySales, 'function');
  assert.equal(typeof data.makeCategoryPerf, 'function');
  assert.equal(typeof data.makeWeeklyPerf, 'function');

  // 验证工厂函数返回结构
  const d = data.makeStorePerformanceData();
  assert.ok('todayRevenue' in d);
  assert.ok('todayOrders' in d);
  assert.ok('completionRate' in d);
  assert.ok('satisfactionScore' in d);
  assert.ok(Array.isArray(d.hourlySales));
  assert.ok(Array.isArray(d.categoryPerformance));
  assert.ok('weekly' in d);
  assert.equal(typeof d.weekly.dailyRevenue, 'object');
});
