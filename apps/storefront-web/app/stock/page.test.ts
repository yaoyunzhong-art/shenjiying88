/**
 * stock/page.test.ts — 库存管理列表页 L1 冒烟测试
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 覆盖: 正例(数据完整/导出稳定) + 反例(空数据/防御) + 边界(极端值/大量数据/全状态)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { StockStatus } from './components/StockStatusBadge';

/* ── 数据工厂 ── */
function makeStockItem(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: '1',
    sku: 'SKU-TEST-001',
    name: '测试商品',
    category: '护肤品',
    quantity: 100,
    minThreshold: 20,
    maxThreshold: 300,
    unit: '瓶',
    price: 99,
    updatedAt: '2026-06-25 10:00',
    status: 'sufficient',
    ...overrides,
  };
}

function makeStockItems(count: number): Record<string, unknown>[] {
  const statuses: StockStatus[] = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'];
  const categories = ['护肤品', '彩妆', '香水', '身体护理', '头发护理', '工具配件'];
  return Array.from({ length: count }, (_, i) => makeStockItem({
    id: String(i + 1),
    sku: `SKU-${String(i + 1).padStart(4, '0')}`,
    name: `商品${i + 1}`,
    category: categories[i % categories.length],
    quantity: Math.floor(Math.random() * 500),
    price: Math.floor(Math.random() * 500) + 10,
    status: statuses[i % statuses.length],
    updatedAt: `2026-06-${String((i % 30) + 1).padStart(2, '0')}`,
  }));
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('👔 店长视角: 页面 & 组件模块导出完整', async () => {
  const pageMod = await import('./page');
  assert.equal(typeof pageMod.default, 'function', 'default export should be a function');

  const stockPageMod = await import('./components/StockPage');
  assert.equal(typeof stockPageMod.StockPage, 'function', 'StockPage should be a function');
  assert.ok(Array.isArray(stockPageMod.STOCK_CATEGORIES), 'STOCK_CATEGORIES should be an array');
  assert.ok(stockPageMod.STOCK_CATEGORIES.length >= 5, 'at least 5 categories needed');

  const badgeMod = await import('./components/StockStatusBadge');
  assert.equal(typeof badgeMod.StockStatusBadge, 'function', 'StockStatusBadge should be a function');
  assert.equal(typeof badgeMod.STOCK_STATUS_LABEL, 'object', 'STOCK_STATUS_LABEL should be an object');
  assert.equal(Object.keys(badgeMod.STOCK_STATUS_LABEL).length, 5, '5 status labels');
  assert.equal(typeof badgeMod.STOCK_STATUS_COLOR, 'object', 'STOCK_STATUS_COLOR should be an object');
  assert.equal(typeof badgeMod.STOCK_STATUS_BG, 'object', 'STOCK_STATUS_BG should be an object');
});

test('🛒 前台视角: 默认导出稳定', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
  assert.equal(typeof mod.default, 'function', 'default export is a function component');
});

test('💳 采购视角: StockPage 接受全量 props', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(
    callSafe(StockPage, {
      items: [makeStockItem()],
      total: 1, page: 1, pageSize: 20,
    }),
    true, 'StockPage should render with valid props',
  );
});

test('正例: 模块导入不抛异常', async () => {
  for (const modPath of ['./page', './components/StockPage', './components/StockStatusBadge']) {
    let threw = false;
    try { await import(modPath); } catch { threw = true; }
    assert.equal(threw, false, `import ${modPath} should succeed`);
  }
});

test('正例: StockPage 渲染多条数据', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(
    callSafe(StockPage, {
      items: makeStockItems(5),
      total: 5, page: 1, pageSize: 20,
    }),
    true, 'should render 5 stock items',
  );
});

test('正例: StockCategory 列表内容合理', async () => {
  const { STOCK_CATEGORIES } = await import('./components/StockPage');
  assert.ok(STOCK_CATEGORIES.includes('护肤品'), 'should include 护肤品');
  assert.ok(STOCK_CATEGORIES.includes('彩妆'), 'should include 彩妆');
  assert.ok(STOCK_CATEGORIES.includes('香水'), 'should include 香水');
  assert.equal(STOCK_CATEGORIES[0], '全部', 'first should be 全部');
});

/* ── 反例 ── */

test('反例: 空数据不抛异常', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: [], total: 0, page: 1, pageSize: 20,
  }), true);
});

test('反例: null items 防御', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: null, total: 0, page: 1, pageSize: 20,
  }), true);
});

test('反例: 负数页码防御', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: [], total: 0, page: 0, pageSize: 20,
  }), true);
});

test('反例: undefined items 防御', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: undefined, total: 0, page: 1, pageSize: 20,
  }), true);
});

test('反例: 超大 pageSize 防御', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: makeStockItems(5), total: 999, page: 1, pageSize: 99999,
  }), true);
});

/* ── 边界 ── */

test('边界: 库存为 0 时渲染', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: [makeStockItem({ id: 'zero', quantity: 0 })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 超大库存数量', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: [makeStockItem({ id: 'huge', quantity: 99999 })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 超大单价', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: [makeStockItem({ id: 'expensive', price: 99999999 })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 空字符串字段', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: [makeStockItem({
      sku: '', name: '', category: '', unit: '', updatedAt: '',
    })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 50 条数据批量渲染性能', async () => {
  const { StockPage } = await import('./components/StockPage');
  const items = makeStockItems(50);
  const start = performance.now();
  const ok = callSafe(StockPage, {
    items, total: 50, page: 1, pageSize: 50,
  });
  const elapsed = performance.now() - start;
  assert.equal(ok, true);
  assert.ok(elapsed < 500, `50 items render in ${elapsed.toFixed(1)}ms`);
});

test('边界: 所有 5 种库存状态渲染', async () => {
  const statuses: StockStatus[] = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'];
  const { StockPage } = await import('./components/StockPage');
  const items = statuses.map((s, i) => makeStockItem({ id: String(i + 1), status: s }));
  assert.equal(callSafe(StockPage, {
    items, total: items.length, page: 1, pageSize: 20,
  }), true, 'all 5 stock statuses should render');
});

test('边界: 分页极端值', async () => {
  const { StockPage } = await import('./components/StockPage');
  assert.equal(callSafe(StockPage, {
    items: makeStockItems(5), total: 5, page: 1, pageSize: 5,
  }), true);
});

test('边界: 异步默认导出返回有效元素', async () => {
  const result = await (await import('./page')).default();
  assert.ok(result !== null && result !== undefined,
    'StockListPage should return a valid element');
});
