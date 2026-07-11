/**
 * orders/page.test.ts — 订单列表页 L1 冒烟测试
 * 角色视角: 👔店长 · 🛒前台 · 💳会员
 * 覆盖: 正例 + 反例(空数据/防御) + 边界(极端金额/大量数据/多状态)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 数据工厂 ── */
function makeOrder(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: '1',
    orderNo: 'ORD-TEST-001',
    memberName: '测试会员',
    memberPhone: '13800138000',
    totalAmount: 19900,
    status: 'delivered',
    itemCount: 2,
    createdAt: '2026-06-01 10:00',
    storeName: '测试门店',
    ...overrides,
  };
}

function makeOrders(count: number): Record<string, unknown>[] {
  const statuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  return Array.from({ length: count }, (_, i) => makeOrder({
    id: String(i + 1),
    orderNo: `ORD-${String(i + 1).padStart(6, '0')}`,
    memberName: `会员${i + 1}`,
    memberPhone: `13800138${String(i + 1).padStart(3, '0')}`,
    totalAmount: (i + 1) * 10000,
    status: statuses[i % statuses.length],
    itemCount: (i % 10) + 1,
    createdAt: `2026-06-${String(i + 1).padStart(2, '0')}`,
    storeName: i % 2 === 0 ? '南京旗舰店' : '上海静安店',
  }));
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('👔 店长视角: 页面 & 组件模块导出完整', async () => {
  const pageMod = await import('./page');
  assert.equal(typeof pageMod.default, 'function', 'default export should be a function');

  const pgMod = await import('./components/OrdersPage');
  assert.equal(typeof pgMod.OrdersPage, 'function', 'OrdersPage should be a function');

  const badgeMod = await import('./components/OrderStatusBadge');
  assert.equal(typeof badgeMod.OrderStatusBadge, 'function', 'OrderStatusBadge should be a function');
  assert.equal(typeof badgeMod.STATUS_LABEL, 'object', 'STATUS_LABEL should be an object');
  assert.equal(Object.keys(badgeMod.STATUS_LABEL).length, 7, 'STATUS_LABEL should have 7 entries');
  assert.equal(typeof badgeMod.STATUS_COLOR, 'object', 'STATUS_COLOR should be an object');
});

test('🛒 前台视角: 默认导出稳定', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
  assert.equal(typeof mod.default, 'function', 'default export is a function component');
});

test('💳 会员视角: OrderStatusBadge 渲染不同状态标签', async () => {
  const { OrderStatusBadge } = await import('./components/OrderStatusBadge');
  const statuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  const expectedLabels = ['待确认', '已确认', '备货中', '已发货', '已送达', '已取消', '已退款'];

  for (let i = 0; i < statuses.length; i++) {
    const result = OrderStatusBadge({ status: statuses[i] });
    assert.ok(result !== null && result !== undefined,
      `should render for status: ${statuses[i]}`);
    if (result?.props?.children) {
      assert.equal(
        String(result.props.children).trim(),
        expectedLabels[i],
        `label for ${statuses[i]} should be ${expectedLabels[i]}`,
      );
    }
  }
});

test('正例: 模块导入不抛异常', async () => {
  for (const modPath of ['./page', './components/OrdersPage', './components/OrderStatusBadge']) {
    let threw = false;
    try { await import(modPath); } catch { threw = true; }
    assert.equal(threw, false, `import ${modPath} should succeed`);
  }
});

test('正例: OrdersPage 接受全量 props', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(
    callSafe(OrdersPage, { orders: [makeOrder()], total: 1, page: 1, pageSize: 20 }),
    true, 'OrdersPage should render with valid props',
  );
});

test('正例: OrdersPage 渲染多条数据', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(
    callSafe(OrdersPage, { orders: makeOrders(3), total: 3, page: 1, pageSize: 20 }),
    true, 'OrdersPage should render 3 orders',
  );
});

/* ── 反例 ── */

test('反例: 空数据不抛异常', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, { orders: [], total: 0, page: 1, pageSize: 20 }), true);
});

test('反例: 负数页码防御', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, { orders: [], total: 0, page: 0, pageSize: 20 }), true);
});

test('反例: 超大 pageSize 防御', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, { orders: makeOrders(5), total: 999, page: 1, pageSize: 9999 }), true);
});

test('反例: null orders 防御', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, { orders: null, total: 0, page: 1, pageSize: 20 }), true);
});

/* ── 边界 ── */

test('边界: 超大金额格式化', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, {
    orders: [makeOrder({ id: 'big', totalAmount: 999999999 })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 金额为 0', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, {
    orders: [makeOrder({ id: 'free', totalAmount: 0 })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 空字符串字段', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, {
    orders: [makeOrder({ orderNo: '', memberName: '', memberPhone: '', storeName: '', createdAt: '' })],
    total: 1, page: 1, pageSize: 20,
  }), true);
});

test('边界: 50 条数据批量渲染', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  const orders = makeOrders(50);
  const start = performance.now();
  const ok = callSafe(OrdersPage, { orders, total: 50, page: 1, pageSize: 50 });
  const elapsed = performance.now() - start;
  assert.equal(ok, true);
  assert.ok(elapsed < 500, `50 orders render in ${elapsed.toFixed(1)}ms`);
});

test('边界: 所有 7 种状态 Badge 渲染', async () => {
  const { OrderStatusBadge } = await import('./components/OrderStatusBadge');
  for (const status of ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded']) {
    assert.equal(callSafe(OrderStatusBadge, { status }), true, `should render ${status}`);
  }
});

test('边界: 分页极端值', async () => {
  const { OrdersPage } = await import('./components/OrdersPage');
  assert.equal(callSafe(OrdersPage, { orders: makeOrders(5), total: 5, page: 1, pageSize: 5 }), true);
});

test('边界: 默认导出可导入为函数', async () => {
  const pageMod = await import('./page');
  assert.equal(typeof pageMod.default, 'function',
    'OrdersListPage should be a valid function');
});
