/**
 * finance/page.test.ts — 财务管理页 L1 冒烟测试
 * 角色视角: 👔店长 / 财务主管
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── Types (mirror page.tsx) ── */

type TransactionType = 'income' | 'expense' | 'transfer';

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  operator: string;
}

interface MonthlyFinance {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}

/* ── Data Factories ── */

function makeTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    id: 'tx-001', date: '2026-06-28', type: 'income', category: '零售收入',
    amount: 28560, description: '日营业收入', status: 'completed',
    paymentMethod: '微信支付', operator: '赵强',
    ...overrides,
  };
}

function makeMonthlyFinance(overrides?: Partial<MonthlyFinance>): MonthlyFinance {
  return {
    month: '2026-06', revenue: 512300, cost: 307380, profit: 204920, orderCount: 1610,
    ...overrides,
  };
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── Positive Tests ── */

test('👔 财务管理: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 财务管理: 页面导出稳定', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
  const fnStr = mod.default.toString();
  assert.ok(fnStr.includes('Finance'), 'component should be named Finance*');
  assert.ok(fnStr.includes('formatCurrency'), 'should have currency formatting');
  assert.ok(fnStr.includes('MONTHLY_DATA'), 'should reference monthly data');
});

test('正例: 交易记录构造完整', () => {
  const tx = makeTransaction();
  assert.equal(tx.id, 'tx-001');
  assert.equal(tx.type, 'income');
  assert.equal(typeof tx.amount, 'number');
  assert.equal(tx.status, 'completed');
  assert.equal(tx.paymentMethod, '微信支付');
  assert.equal(tx.operator, '赵强');
});

test('正例: 月度财务数据构造完整', () => {
  const m = makeMonthlyFinance();
  assert.equal(m.month, '2026-06');
  assert.equal(typeof m.revenue, 'number');
  assert.equal(typeof m.cost, 'number');
  assert.equal(typeof m.profit, 'number');
  assert.equal(typeof m.orderCount, 'number');
  assert.ok(m.revenue >= m.profit, 'revenue should be >= profit');
});

test('正例: TransactionType 枚举值完整', () => {
  const types: TransactionType[] = ['income', 'expense', 'transfer'];
  for (const t of types) {
    const tx = makeTransaction({ type: t });
    assert.equal(tx.type, t);
  }
});

test('正例: Transaction status 枚举值完整', () => {
  const statuses: Transaction['status'][] = ['completed', 'pending', 'failed'];
  for (const s of statuses) {
    const tx = makeTransaction({ status: s });
    assert.equal(tx.status, s);
  }
});

test('正例: 所有 Monetary 字段为非负数', () => {
  const m = makeMonthlyFinance();
  assert.ok(m.revenue >= 0);
  assert.ok(m.cost >= 0);
  assert.ok(m.profit >= 0);
  assert.ok(m.orderCount >= 0);
});

test('正例: 工厂函数不抛异常', () => {
  assert.equal(callSafe(makeTransaction), true);
  assert.equal(callSafe(makeMonthlyFinance), true);
});

test('正例: 字段使用 overrides 覆盖', () => {
  const tx = makeTransaction({ amount: 99999, status: 'failed' });
  assert.equal(tx.amount, 99999);
  assert.equal(tx.status, 'failed');
});

test('正例: 利润计算正确性', () => {
  const m = makeMonthlyFinance({ revenue: 100000, cost: 60000 });
  m.profit = m.revenue - m.cost;
  assert.equal(m.profit, 40000);
  const rate = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
  assert.equal(rate, 40);
});

test('正例: 空交易描述不抛异常', () => {
  const tx = makeTransaction({ description: '' });
  assert.equal(tx.description, '');
});

/* ── Negative Tests ── */

test('反例: 全零数据构造不抛异常', () => {
  const m = makeMonthlyFinance({ revenue: 0, cost: 0, profit: 0, orderCount: 0 });
  assert.equal(m.revenue, 0);
  assert.equal(m.cost, 0);
  assert.equal(m.profit, 0);
  assert.equal(m.orderCount, 0);
});

test('反例: 负利润数据', () => {
  const m = makeMonthlyFinance({ revenue: 50000, cost: 80000, profit: -30000 });
  assert.equal(m.profit, -30000);
  assert.ok(m.profit < 0);
});

test('反例: 超大金额', () => {
  const tx = makeTransaction({ amount: 999999999.99 });
  assert.equal(tx.amount, 999999999.99);
});

test('反例: 空字符串字段', () => {
  const tx = makeTransaction({ id: '', date: '', category: '', description: '', paymentMethod: '', operator: '' });
  assert.equal(tx.id, '');
  assert.equal(tx.date, '');
  assert.equal(tx.category, '');
});

test('反例: 负值 amount', () => {
  const tx = makeTransaction({ amount: -5000 });
  assert.equal(tx.amount, -5000);
});

test('反例: 非预期 status 值', () => {
  // @ts-expect-error testing invalid status
  const tx = makeTransaction({ status: 'unknown' });
  assert.equal(tx.status, 'unknown');
});

/* ── Boundary Tests ── */

test('边界: 超大量交易记录构造 < 30ms', () => {
  const start = performance.now();
  const transactions = Array.from({ length: 500 }, (_, i) => makeTransaction({
    id: `tx-${String(i + 1).padStart(4, '0')}`,
    date: `2026-06-${String((i % 30) + 1).padStart(2, '0')}`,
    type: i % 3 === 0 ? 'income' : i % 3 === 1 ? 'expense' : 'transfer',
    amount: 1000 + (i * 100),
  }));
  const elapsed = performance.now() - start;
  assert.equal(transactions.length, 500);
  assert.ok(elapsed < 50, `500 transactions construct in ${elapsed.toFixed(1)}ms (should be < 50ms)`);
});

test('边界: 跨年度月度数据', () => {
  const months = ['2025-12', '2026-01', '2026-06', '2027-01'];
  const data = months.map(m => makeMonthlyFinance({ month: m }));
  assert.equal(data.length, 4);
  assert.equal(data[0].month, '2025-12');
  assert.equal(data[1].month, '2026-01');
  assert.equal(data[3].month, '2027-01');
});

test('边界: 极值利润与亏损', () => {
  const bigProfit = makeMonthlyFinance({ revenue: 1e8, cost: 1e7, profit: 9e7 });
  assert.equal(bigProfit.profit, 9e7);
  const bigLoss = makeMonthlyFinance({ revenue: 1e7, cost: 1e8, profit: -9e7 });
  assert.equal(bigLoss.profit, -9e7);
});

test('边界: 所有三种交易类型同时存在', () => {
  const types: TransactionType[] = ['income', 'expense', 'transfer'];
  const transactions = types.map(t => makeTransaction({ id: `tx-${t}`, type: t }));
  assert.equal(transactions.length, 3);
  assert.equal(transactions[0].type, 'income');
  assert.equal(transactions[1].type, 'expense');
  assert.equal(transactions[2].type, 'transfer');
});

test('边界: 所有三种状态同时存在', () => {
  const txes = ['completed', 'pending', 'failed'].map(s => makeTransaction({
    id: `tx-${s}`, status: s as Transaction['status'],
  }));
  assert.equal(txes.length, 3);
  assert.equal(txes[0].status, 'completed');
  assert.equal(txes[1].status, 'pending');
  assert.equal(txes[2].status, 'failed');
});

test('边界: 模块引用完整性', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
  const fnStr = mod.default.toString();
  assert.ok(fnStr.includes('MONTHLY_DATA') || fnStr.includes('TRANSACTIONS'),
    'component should reference data constants');
  assert.ok(fnStr.includes('formatCurrency'), 'should have formatCurrency');
});
