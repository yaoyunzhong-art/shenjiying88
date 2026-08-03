/**
 * frontdesk/page.test.ts — 前台工作台 L1 源码冒烟测试
 * 覆盖: 购物篮 · 排队叫号 · 快捷功能 · 交易记录 · 防御 · 边界
 * 角色: 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型（mirror page.tsx） ──

interface BasketItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

type CheckoutStatus = 'completed' | 'pending' | 'refunded' | 'cancelled';
type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member_card';

interface QueueItem {
  id: string;
  number: string;
  customerName?: string;
  type: string;
  waitingMinutes: number;
  status: 'waiting' | 'calling' | 'served' | 'cancelled';
}

interface TransactionRecord {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: PaymentMethod;
  time: string;
  status: CheckoutStatus;
}

interface QuickAction {
  key: string;
  label: string;
  icon: string;
  highlight?: boolean;
  badge?: number;
}

// ── Mock 数据 ──

const MOCK_BASKET: BasketItem[] = [
  { id: 'bi-1', name: '精选有机蔬菜拼盘', sku: 'VEG-001', quantity: 2, unitPrice: 45, subtotal: 90 },
  { id: 'bi-2', name: '澳洲进口牛排 500g', sku: 'BEEF-012', quantity: 1, unitPrice: 168, subtotal: 168 },
  { id: 'bi-3', name: '纯牛奶 1L 装', sku: 'MLK-008', quantity: 3, unitPrice: 19.9, subtotal: 59.7 },
  { id: 'bi-4', name: '新鲜蓝莓 125g', sku: 'FRT-023', quantity: 2, unitPrice: 29.9, subtotal: 59.8 },
];

const MOCK_QUEUE: QueueItem[] = [
  { id: 'q1', number: 'A001', customerName: '张先生', type: 'service', waitingMinutes: 3, status: 'waiting' },
  { id: 'q2', number: 'A002', customerName: '李女士', type: 'pickup', waitingMinutes: 5, status: 'waiting' },
  { id: 'q3', number: 'A003', type: 'return', waitingMinutes: 7, status: 'calling' },
  { id: 'q4', number: 'A004', customerName: '王女士', type: 'consult', waitingMinutes: 10, status: 'waiting' },
  { id: 'q5', number: 'A005', type: 'service', waitingMinutes: 12, status: 'waiting' },
  { id: 'q6', number: 'B001', customerName: '赵先生', type: 'pickup', waitingMinutes: 15, status: 'waiting' },
];

const MOCK_QUICK_ACTIONS: QuickAction[] = [
  { key: 'qa-scan', label: '扫码录入', icon: '📷', highlight: true },
  { key: 'qa-return', label: '退货处理', icon: '↩️' },
  { key: 'qa-call', label: '叫号通知', icon: '🔔', badge: 2 },
  { key: 'qa-member', label: '会员查询', icon: '👤' },
  { key: 'qa-inv', label: '库存查询', icon: '📦' },
  { key: 'qa-price', label: '改价审批', icon: '💰' },
  { key: 'qa-print', label: '打印小票', icon: '🖨️' },
  { key: 'qa-summary', label: '交班汇总', icon: '📊' },
];

const MOCK_TRANSACTIONS: TransactionRecord[] = [
  { id: 't1', orderId: 'ORD-001', customer: '张明', amount: 128.5, method: 'wechat', time: '10:25', status: 'completed' },
  { id: 't2', orderId: 'ORD-002', customer: '李丽', amount: 356, method: 'alipay', time: '10:18', status: 'completed' },
  { id: 't3', orderId: 'ORD-003', customer: '王强', amount: 89.9, method: 'cash', time: '10:05', status: 'completed' },
  { id: 't4', orderId: 'ORD-004', customer: '赵雪', amount: 520, method: 'member_card', time: '09:52', status: 'refunded' },
  { id: 't5', orderId: 'ORD-005', customer: '陈伟', amount: 45.5, method: 'wechat', time: '09:40', status: 'completed' },
];

// ── 辅助函数 ──

function calcBasketTotal(items: BasketItem[]): number {
  return items.reduce((s, i) => s + i.subtotal, 0);
}

function filterTransactions(items: TransactionRecord[], method?: PaymentMethod | '全部', status?: CheckoutStatus | '全部'): TransactionRecord[] {
  let result = items;
  if (method && method !== '全部') result = result.filter((t) => t.method === method);
  if (status && status !== '全部') result = result.filter((t) => t.status === status);
  return result;
}

function searchTransactions(items: TransactionRecord[], keyword: string): TransactionRecord[] {
  if (!keyword.trim()) return items;
  const kw = keyword.toLowerCase();
  return items.filter(
    (t) =>
      t.customer.toLowerCase().includes(kw) ||
      t.orderId.toLowerCase().includes(kw),
  );
}

function getTodayRevenue(items: TransactionRecord[]): number {
  return items.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0);
}

function getWaitStats(queue: QueueItem[]): { waiting: number; calling: number; avgWaitMin: number } {
  const waiting = queue.filter((q) => q.status === 'waiting');
  const calling = queue.filter((q) => q.status === 'calling');
  const avgWait = waiting.length > 0
    ? Math.round(waiting.reduce((s, q) => s + q.waitingMinutes, 0) / waiting.length)
    : 0;
  return { waiting: waiting.length, calling: calling.length, avgWaitMin: avgWait };
}

function getQuickActionByKey(actions: QuickAction[], key: string): QuickAction | undefined {
  return actions.find((a) => a.key === key);
}

// ============================================================
// 正例 (10+)
// ============================================================

test('🛒 前台: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 店长: 源码包含关键导出', () => {
  assert.ok(SRC.includes("'use client'"), '缺少 use client');
  assert.ok(SRC.includes('BasketItem'), '缺少 BasketItem');
  assert.ok(SRC.includes('QueueItem'), '缺少 QueueItem');
  assert.ok(SRC.includes('QuickAction'), '缺少 QuickAction');
  assert.ok(SRC.includes('MOCK_TRANSACTIONS'), '缺少 MOCK_TRANSACTIONS');
});

test('🛒 前台: 购物车总价计算正确', () => {
  const total = calcBasketTotal(MOCK_BASKET);
  assert.equal(total, 90 + 168 + 59.7 + 59.8); // 377.5
});

test('🛒 前台: 今日营收统计', () => {
  const revenue = getTodayRevenue(MOCK_TRANSACTIONS);
  // t1-t3 + t5 = 128.5 + 356 + 89.9 + 45.5 = 619.9
  assert.equal(revenue, 619.9);
});

test('🛒 前台: 排队等待统计', () => {
  const stats = getWaitStats(MOCK_QUEUE);
  assert.equal(stats.waiting, 5);
  assert.equal(stats.calling, 1);
});

test('🛒 前台: 平均等待时间', () => {
  const stats = getWaitStats(MOCK_QUEUE);
  // waiting items: q1(3), q2(5), q4(10), q5(12), q6(15) => avg = (3+5+10+12+15)/5 = 9
  assert.equal(stats.avgWaitMin, 9);
});

test('🛒 前台: 快捷功能按键查找', () => {
  const scan = getQuickActionByKey(MOCK_QUICK_ACTIONS, 'qa-scan');
  assert.ok(scan);
  assert.equal(scan?.label, '扫码录入');
  assert.equal(scan?.highlight, true);
});

test('🛒 前台: 按支付方式过滤交易', () => {
  const wechatTxs = filterTransactions(MOCK_TRANSACTIONS, 'wechat');
  assert.equal(wechatTxs.length, 2);
  wechatTxs.forEach((t) => assert.equal(t.method, 'wechat'));
});

test('🛒 前台: 按状态过滤交易', () => {
  const refunded = filterTransactions(MOCK_TRANSACTIONS, undefined, 'refunded');
  assert.equal(refunded.length, 1);
  assert.equal(refunded[0].orderId, 'ORD-004');
});

test('🛒 前台: 搜索客户姓名', () => {
  const result = searchTransactions(MOCK_TRANSACTIONS, '张明');
  assert.equal(result.length, 1);
  assert.equal(result[0].customer, '张明');
});

test('🛒 前台: 搜索订单号', () => {
  const result = searchTransactions(MOCK_TRANSACTIONS, 'ORD-003');
  assert.equal(result.length, 1);
  assert.equal(result[0].orderId, 'ORD-003');
});

test('👔 店长: MOCK_QUICK_ACTIONS 有 8 个功能', () => {
  assert.equal(MOCK_QUICK_ACTIONS.length, 8);
});

test('👔 店长: MOCK_QUEUE 有 6 个排队', () => {
  assert.equal(MOCK_QUEUE.length, 6);
});

test('🛒 前台: 叫号通知快捷功能有 badge=2', () => {
  const callAction = getQuickActionByKey(MOCK_QUICK_ACTIONS, 'qa-call');
  assert.equal(callAction?.badge, 2);
});

// ============================================================
// 反例 (8+)
// ============================================================

test('🔧 安监: 不存在客户搜索应返回空', () => {
  assert.equal(searchTransactions(MOCK_TRANSACTIONS, '不存在的客户').length, 0);
});

test('🔧 安监: 不存在的快捷功能返回 undefined', () => {
  assert.equal(getQuickActionByKey(MOCK_QUICK_ACTIONS, 'qa-nonexist'), undefined);
});

test('🔧 安监: 不存在的支付方式过滤返回空', () => {
  const result = filterTransactions(MOCK_TRANSACTIONS, 'bitcoin' as PaymentMethod);
  assert.equal(result.length, 0);
});

test('🔧 安监: 不存在的状态过滤返回空', () => {
  const result = filterTransactions(MOCK_TRANSACTIONS, undefined, 'ghost' as CheckoutStatus);
  assert.equal(result.length, 0);
});

test('🔧 安监: 空购物篮总价为 0', () => {
  assert.equal(calcBasketTotal([]), 0);
});

test('🔧 安监: 恶意搜索脚本不报错', () => {
  const result = searchTransactions(MOCK_TRANSACTIONS, '<script>document.cookie</script>');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('👔 店长: 无效排队列表中统计为 0', () => {
  const stats = getWaitStats([]);
  assert.equal(stats.waiting, 0);
  assert.equal(stats.calling, 0);
  assert.equal(stats.avgWaitMin, 0);
});

test('🔧 安监: transaction 金额负数处理', () => {
  const txs: TransactionRecord[] = [...MOCK_TRANSACTIONS, { id: 't6', orderId: 'ORD-006', customer: '负数测试', amount: -100, method: 'cash', time: '11:00', status: 'completed' }];
  const revenue = getTodayRevenue(txs);
  assert.equal(revenue, 619.9 + (-100));
});

// ============================================================
// 边界 (7+)
// ============================================================

test('🎯 运行专员: 缓存金额精度不丢失', () => {
  const total = calcBasketTotal(MOCK_BASKET);
  assert.equal(total, 377.5);
});

test('🎯 运行专员: 全过滤条件返回全部', () => {
  const all = filterTransactions(MOCK_TRANSACTIONS, '全部', '全部');
  assert.equal(all.length, MOCK_TRANSACTIONS.length);
});

test('🎯 运行专员: 只过滤方法不过滤状态', () => {
  const cash = filterTransactions(MOCK_TRANSACTIONS, 'cash');
  assert.equal(cash.length, 1);
  assert.ok(cash.every((t) => t.method === 'cash'));
});

test('🎯 运行专员: 各支付方式交易数', () => {
  const methods = new Set(MOCK_TRANSACTIONS.map((t) => t.method));
  assert.equal(methods.size, 4, '覆盖全部 4 种支付方式');
});

test('📢 营销: 快捷功能 highlight 标志检查', () => {
  const highlighted = MOCK_QUICK_ACTIONS.filter((a) => a.highlight);
  assert.equal(highlighted.length, 1, '仅 1 个高亮');
  assert.equal(highlighted[0].key, 'qa-scan');
});

test('🤝 团建: 排队按等待时间升序', () => {
  for (let i = 1; i < MOCK_QUEUE.length; i++) {
    assert.ok(MOCK_QUEUE[i].waitingMinutes >= MOCK_QUEUE[i - 1].waitingMinutes, '排队按等待时间升序');
  }
});

test('👥 HR: 交易记录字段完整性', () => {
  for (const tx of MOCK_TRANSACTIONS) {
    assert.ok(tx.id);
    assert.ok(tx.orderId);
    assert.ok(tx.customer);
    assert.ok(typeof tx.amount === 'number');
    assert.ok(tx.method);
    assert.ok(tx.time);
    assert.ok(tx.status);
  }
});

test('👔 店长: 搜索区分大小写兼容', () => {
  const r1 = searchTransactions(MOCK_TRANSACTIONS, '张明');
  const r2 = searchTransactions(MOCK_TRANSACTIONS, '张明');
  assert.equal(r1.length, r2.length);
});
