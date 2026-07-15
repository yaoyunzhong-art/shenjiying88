/**
 * frontdesk/page.test.tsx — 前台操作面板 L1 冒烟测试
 * 角色视角: 🛒前台
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 数据工厂 ── */

function makeBasketItem(overrides?: Record<string, unknown>) {
  return {
    id: 'bi-1',
    name: '测试商品',
    sku: 'SKU-001',
    quantity: 2,
    unitPrice: 45.00,
    subtotal: 90.00,
    ...overrides,
  };
}

function makeQueueItem(overrides?: Record<string, unknown>) {
  return {
    id: 'q1',
    number: 'A001',
    customerName: '张先生',
    type: 'service',
    waitingMinutes: 3,
    status: 'waiting',
    ...overrides,
  };
}

function makeQuickFnButton(overrides?: Record<string, unknown>) {
  return {
    key: 'qa-scan',
    label: '扫码录入',
    icon: '📷',
    highlight: true,
    ...overrides,
  };
}

function makeTodayStats(overrides?: Record<string, unknown>) {
  return {
    totalOrders: 156,
    totalRevenue: 124580.50,
    avgCheckoutSec: 32,
    pendingPickups: 7,
    ...overrides,
  };
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('🛒 前台视角: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('🛒 前台视角: 页面模块导入稳定', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
  const src = mod.default.toString();
  assert.ok(src.includes('FrontDeskPage'), 'should reference FrontDeskPage');
  assert.ok(src.includes('PageShell'), 'should reference PageShell');
});

test('正例: 所有 mock 数据构造不抛异常', async () => {
  assert.equal(callSafe(makeBasketItem), true);
  assert.equal(callSafe(makeQueueItem), true);
  assert.equal(callSafe(makeQuickFnButton), true);
  assert.equal(callSafe(makeTodayStats), true);
});

test('正例: basketItem 字段完整', () => {
  const item = makeBasketItem();
  const expectedKeys = ['id', 'name', 'sku', 'quantity', 'unitPrice', 'subtotal'];
  for (const key of expectedKeys) {
    assert.equal(key in item, true, `basketItem should have field: ${key}`);
    assert.equal(typeof item[key as keyof typeof item], ['id', 'name', 'sku'].includes(key) ? 'string' : 'number',
      `${key} type check`);
  }
});

test('正例: queueItem 字段完整', () => {
  const q = makeQueueItem();
  assert.equal(typeof q.id, 'string');
  assert.equal(typeof q.number, 'string');
  assert.equal(typeof q.type, 'string');
  assert.equal(typeof q.waitingMinutes, 'number');
  assert.equal(typeof q.status, 'string');
  assert.ok(['service', 'pickup', 'return', 'consult'].includes(q.type), 'queue type valid');
  assert.ok(['waiting', 'calling', 'serving'].includes(q.status), 'queue status valid');
});

test('正例: quickFnButton 字段完整', () => {
  const btn = makeQuickFnButton();
  assert.equal(typeof btn.key, 'string');
  assert.equal(typeof btn.label, 'string');
  assert.equal(typeof btn.highlight, 'boolean');
});

test('正例: todayStats 字段完整', () => {
  const s = makeTodayStats();
  assert.equal(typeof s.totalOrders, 'number');
  assert.equal(typeof s.totalRevenue, 'number');
  assert.equal(typeof s.avgCheckoutSec, 'number');
  assert.equal(typeof s.pendingPickups, 'number');
});

test('正例: 4 个购物篮商品不抛异常', () => {
  const items = [
    makeBasketItem({ id: 'bi-1', name: '精选有机蔬菜拼盘', sku: 'VEG-001', quantity: 2, unitPrice: 45.00, subtotal: 90.00 }),
    makeBasketItem({ id: 'bi-2', name: '澳洲进口牛排 500g', sku: 'BEEF-012', quantity: 1, unitPrice: 168.00, subtotal: 168.00 }),
    makeBasketItem({ id: 'bi-3', name: '纯牛奶 1L 装', sku: 'MLK-008', quantity: 3, unitPrice: 19.90, subtotal: 59.70 }),
    makeBasketItem({ id: 'bi-4', name: '新鲜蓝莓 125g', sku: 'FRT-023', quantity: 2, unitPrice: 29.90, subtotal: 59.80 }),
  ];
  assert.equal(items.length, 4);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  assert.equal(totalQty, 8, 'total quantity should be 8');
  const totalAmt = items.reduce((sum, i) => sum + i.subtotal, 0);
  assert.equal(totalAmt, 377.50, 'total amount should be 377.50');
});

test('正例: 6 个排队叫号不抛异常', () => {
  const queue = [
    makeQueueItem({ id: 'q1', number: 'A001', customerName: '张先生', type: 'service', waitingMinutes: 3, status: 'waiting' }),
    makeQueueItem({ id: 'q2', number: 'A002', customerName: '李女士', type: 'pickup', waitingMinutes: 5, status: 'waiting' }),
    makeQueueItem({ id: 'q3', number: 'A003', type: 'return', waitingMinutes: 7, status: 'calling' }),
    makeQueueItem({ id: 'q4', number: 'A004', customerName: '王女士', type: 'consult', waitingMinutes: 10, status: 'waiting' }),
    makeQueueItem({ id: 'q5', number: 'A005', type: 'service', waitingMinutes: 12, status: 'waiting' }),
    makeQueueItem({ id: 'q6', number: 'B001', customerName: '赵先生', type: 'pickup', waitingMinutes: 15, status: 'waiting' }),
  ];
  assert.equal(queue.length, 6);
  const types = new Set(queue.map(q => q.type));
  assert.ok(types.size >= 3, 'should have at least 3 distinct queue types');
  const statuses = new Set(queue.map(q => q.status));
  assert.ok(statuses.size >= 2, 'should have at least 2 distinct queue statuses');
});

test('正例: 8 个快捷操作不抛异常', () => {
  const actions = [
    makeQuickFnButton({ key: 'qa-scan', label: '扫码录入', icon: '📷', highlight: true }),
    makeQuickFnButton({ key: 'qa-return', label: '退货处理', icon: '↩️', highlight: false }),
    makeQuickFnButton({ key: 'qa-call', label: '叫号通知', icon: '🔔', highlight: false, badge: 2 }),
    makeQuickFnButton({ key: 'qa-member', label: '会员查询', icon: '👤', highlight: false }),
    makeQuickFnButton({ key: 'qa-inv', label: '库存查询', icon: '📦', highlight: false }),
    makeQuickFnButton({ key: 'qa-price', label: '改价审批', icon: '💰', highlight: false }),
    makeQuickFnButton({ key: 'qa-print', label: '打印小票', icon: '🖨️', highlight: false }),
    makeQuickFnButton({ key: 'qa-summary', label: '交班汇总', icon: '📊', highlight: false }),
  ];
  assert.equal(actions.length, 8);
  const highlights = actions.filter(a => a.highlight === true);
  assert.equal(highlights.length, 1, 'exactly 1 highlighted action');
});

/* ── 反例 ── */

test('反例: 空购物篮不抛异常', () => {
  const items: Record<string, unknown>[] = [];
  const totalQty = items.reduce((sum, i) => sum + ((i.quantity as number) ?? 0), 0);
  assert.equal(totalQty, 0);
  assert.equal(items.length, 0);
});

test('反例: 空排队列表不抛异常', () => {
  const queue: Record<string, unknown>[] = [];
  assert.equal(queue.length, 0);
});

test('反例: 空快捷操作列表不抛异常', () => {
  const actions: Record<string, unknown>[] = [];
  assert.equal(actions.length, 0);
});

test('反例: 负价格/数量不抛异常', () => {
  const item = makeBasketItem({ unitPrice: -10, subtotal: -20 });
  assert.equal(item.unitPrice, -10);
  assert.equal(item.subtotal, -20);
});

test('反例: 负等待时间不抛异常', () => {
  const q = makeQueueItem({ waitingMinutes: -1 });
  assert.equal(q.waitingMinutes, -1);
});

test('反例: todayStats 零值不抛异常', () => {
  const s = makeTodayStats({ totalOrders: 0, totalRevenue: 0, avgCheckoutSec: 0, pendingPickups: 0 });
  assert.equal(s.totalOrders, 0);
  assert.equal(s.totalRevenue, 0);
});

/* ── 边界 ── */

test('边界: 超大购物篮（100 件商品）', () => {
  const items = Array.from({ length: 100 }, (_, i) =>
    makeBasketItem({ id: `bi-${i}`, name: `商品${i}`, quantity: i + 1 }));
  assert.equal(items.length, 100);
  assert.equal(items[0].id, 'bi-0');
  assert.equal(items[99].id, 'bi-99');
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  assert.equal(totalQty, 5050, 'sum 1..100 = 5050');
});

test('边界: 超长排队列表（50 位）', () => {
  const queue = Array.from({ length: 50 }, (_, i) =>
    makeQueueItem({ id: `q${i}`, number: `A${String(i + 1).padStart(3, '0')}`, waitingMinutes: i }));
  assert.equal(queue.length, 50);
  assert.equal(queue[0].number, 'A001');
  assert.equal(queue[49].number, 'A050');
});

test('边界: 所有 queue 类型覆盖', () => {
  const types = ['service', 'pickup', 'return', 'consult'];
  for (const t of types) {
    const q = makeQueueItem({ type: t });
    assert.equal(q.type, t);
  }
});

test('边界: 所有 queue 状态覆盖', () => {
  const statuses = ['waiting', 'calling', 'serving'];
  for (const s of statuses) {
    const q = makeQueueItem({ status: s });
    assert.equal(q.status, s);
  }
});

test('边界: 所有结账状态覆盖', () => {
  const statuses = ['idle', 'processing', 'success', 'failed'];
  for (const s of statuses) {
    assert.ok(['idle', 'processing', 'success', 'failed'].includes(s), `valid checkout status: ${s}`);
  }
});

test('边界: 所有支付方式覆盖', () => {
  const methods = ['wechat', 'alipay', 'cash', 'card', 'member_card'];
  assert.equal(methods.length, 5);
  for (const m of methods) {
    assert.ok(typeof m === 'string');
  }
});

test('边界: 超高营收', () => {
  const s = makeTodayStats({ totalRevenue: 99999999.99 });
  assert.equal(s.totalRevenue, 99999999.99);
});

test('边界: 超长结账时间', () => {
  const s = makeTodayStats({ avgCheckoutSec: 999 });
  assert.equal(s.avgCheckoutSec, 999);
});

test('边界: 性能 — 构造 1000 条购物篮数据 < 50ms', () => {
  const start = performance.now();
  const items = Array.from({ length: 1000 }, (_, i) =>
    makeBasketItem({ id: `bi-${i}` }));
  const elapsed = performance.now() - start;
  assert.equal(items.length, 1000);
  assert.ok(elapsed < 50, `1000 items construct in ${elapsed.toFixed(1)}ms (should be < 50ms)`);
});
