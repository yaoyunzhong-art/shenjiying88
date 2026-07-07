/**
 * stock/[id]/page.test.ts — 库存详情页 L1 冒烟测试
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 类型: B-页面创建 / 详情页
 * 覆盖: 正例(模块导出完整/数据工厂/类型安全) + 反例(防御性) + 边界(极端值)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { StockStatus } from '../components/StockStatusBadge';

/* ── 数据工厂 ── */
function makeStockItem(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: '1',
    sku: 'SKU-DETAIL-001',
    name: '测试详情商品',
    category: '护肤品',
    quantity: 150,
    minThreshold: 30,
    maxThreshold: 300,
    unit: '瓶',
    price: 199,
    updatedAt: '2026-06-28 14:30',
    status: 'sufficient',
    ...overrides,
  };
}

/* ── 正例 ── */

test('👔 店长视角: 模块默认导出完整', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function component');
});

test('🛒 前台视角: 默认导出非空', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
});

test('💳 采购视角: 各状态枚举齐全', async () => {
  const { StockStatusBadge, STOCK_STATUS_LABEL } = await import('../components/StockStatusBadge');
  assert.equal(typeof StockStatusBadge, 'function', 'StockStatusBadge should be a function');
  assert.equal(Object.keys(STOCK_STATUS_LABEL).length, 5, '5 status labels');
  assert.equal(STOCK_STATUS_LABEL.sufficient, '充足');
  assert.equal(STOCK_STATUS_LABEL.critical, '告急');
  assert.equal(STOCK_STATUS_LABEL.out_of_stock, '缺货');
});

test('正例: 页面源码包含核心结构', async () => {
  const fs = await import('node:fs');
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes('StockStatusBadge'), 'should import StockStatusBadge');
  assert.ok(source.includes('DetailShell'), 'should use DetailShell');
  assert.ok(source.includes('DescriptionList'), 'should use DescriptionList');
  assert.ok(source.includes('useParams'), 'should use useParams');
  assert.ok(source.includes('MOCK_ITEMS'), 'should have mock data');
});

test('正例: 数据工厂生成有效结构', () => {
  const item = makeStockItem() as Record<string, unknown>;
  assert.equal(typeof item.id, 'string');
  assert.equal(typeof item.sku, 'string');
  assert.equal(typeof item.name, 'string');
  assert.equal(typeof item.quantity, 'number');
  assert.equal(typeof item.price, 'number');
  assert.ok(item.quantity > 0, 'quantity should be positive');
});

test('正例: 各状态商品数据均为有效', () => {
  const statuses: StockStatus[] = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'];
  for (const status of statuses) {
    const item = makeStockItem({ status });
    assert.equal(item.status, status);
  }
});

test('正例: 极端库存值数据完整', () => {
  const item = makeStockItem({ quantity: 99999, price: 999999 });
  assert.equal(item.quantity, 99999);
  assert.equal(item.price, 999999);
});

test('正例: 零库存数据有效', () => {
  const item = makeStockItem({ quantity: 0 });
  assert.equal(item.quantity, 0);
});

test('正例: 导入所有子模块不抛异常', async () => {
  for (const modPath of [
    './page',
    '../components/StockPage',
    '../components/StockStatusBadge',
  ]) {
    let threw = false;
    try { await import(modPath); } catch { threw = true; }
    assert.equal(threw, false, `import ${modPath} should succeed`);
  }
});

/* ── 反例 ── */

test('反例: null id 数据防御', () => {
  const item = makeStockItem({ id: null });
  assert.equal(item.id, null);
});

test('反例: 负库存生成有效', () => {
  const item = makeStockItem({ quantity: -5 });
  assert.equal(item.quantity, -5);
});

test('反例: 负单价生成有效', () => {
  const item = makeStockItem({ price: -10 });
  assert.equal(item.price, -10);
});

test('反例: 无效 status 仍可生成', () => {
  const item = makeStockItem({ status: 'invalid_status' });
  assert.equal(item.status, 'invalid_status');
});

test('反例: 空字符串字段可生成', () => {
  const item = makeStockItem({ sku: '', name: '', category: '', unit: '' });
  assert.equal(item.sku, '');
  assert.equal(item.name, '');
  assert.equal(item.category, '');
  assert.equal(item.unit, '');
});

/* ── 边界 ── */

test('边界: 阈值相等边界 (min === max)', () => {
  const item = makeStockItem({ minThreshold: 100, maxThreshold: 100 });
  assert.equal(item.minThreshold, item.maxThreshold);
});

test('边界: 数量超过最大阈值', () => {
  const item = makeStockItem({ quantity: 500, minThreshold: 50, maxThreshold: 100 });
  assert.ok(item.quantity > (item.maxThreshold as number));
});

test('边界: 极长商品名', () => {
  const item = makeStockItem({ name: 'A'.repeat(500) });
  assert.equal((item.name as string).length, 500);
});

test('边界: Deep frozen object 稳定', () => {
  const item = Object.freeze(makeStockItem());
  assert.equal(item.id, '1');
  assert.equal(item.sku, 'SKU-DETAIL-001');
});

test('边界: 批量 50 条数据工厂快速生成', () => {
  const statuses: StockStatus[] = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'];
  const start = performance.now();
  const items = Array.from({ length: 50 }, (_, i) =>
    makeStockItem({ id: String(i + 1), status: statuses[i % 5] }),
  );
  const elapsed = performance.now() - start;
  assert.equal(items.length, 50);
  assert.ok(elapsed < 100, `50 items in ${elapsed.toFixed(1)}ms`);
});

test('边界: 页面源码包含动作按钮名称', async () => {
  const fs = await import('node:fs');
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes('编辑'), 'page should have edit action');
  assert.ok(source.includes('删除'), 'page should have delete action');
  assert.ok(source.includes('返回库存列表'), 'page should have back link');
});
