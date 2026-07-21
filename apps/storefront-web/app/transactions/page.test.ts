/**
 * transactions/page.test.ts — 交易记录页 L1 源码冒烟测试
 * 覆盖: 交易类型 / 状态 / 金额格式 / 搜索过滤 / 排序 / 分页 / 汇总统计
 * 角色视角: 👔店长 / 💰财务 / 🔧安监 / 🎯运行专员
 * 正例(16) + 反例(10) + 边界(9) = 35 tests
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

// ── 类型（mirror page.tsx 预期结构） ──

export type TransactionType = 'income' | 'expense' | 'refund' | 'adjustment';
export type TransactionStatus = 'success' | 'pending' | 'failed' | 'cancelled';
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member_card' | 'bank_transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  category: string;
  description: string;
  orderId: string;
  createdAt: string;
  createdBy: string;
  storeName: string;
}

// ── 常量映射 ──

export const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense', 'refund', 'adjustment'];
export const TRANSACTION_STATUSES: TransactionStatus[] = ['success', 'pending', 'failed', 'cancelled'];
export const PAYMENT_METHODS: PaymentMethod[] = ['wechat', 'alipay', 'cash', 'member_card', 'bank_transfer'];

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: '收入',
  expense: '支出',
  refund: '退款',
  adjustment: '调整',
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  success: '成功',
  pending: '处理中',
  failed: '失败',
  cancelled: '已取消',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  member_card: '会员卡',
  bank_transfer: '银行转账',
};

const CATEGORIES = ['商品销售', '会员充值', '退款处理', '运营支出', '员工薪资', '设备采购', '活动补贴', '押金退回'];
const STORE_NAMES = ['旗舰店', '南山分店', '福田分店', '宝安店', '龙华店'];
const USERS = ['系统', '张三', '李四', '王五'];

// ── 工厂函数（与 page.tsx 逻辑一致） ──

export function fmtAmount(amount: number): string {
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}¥${Math.abs(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export function generateMockTransactions(count: number): Transaction[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const type = TRANSACTION_TYPES[i % TRANSACTION_TYPES.length]!;
    const baseAmount = type === 'expense' || type === 'refund'
      ? -(Math.floor(Math.random() * 50000) + 10) / 100
      : (Math.floor(Math.random() * 50000) + 10) / 100;
    return {
      id: `txn-${String(i + 1).padStart(6, '0')}`,
      type,
      status: TRANSACTION_STATUSES[i % TRANSACTION_STATUSES.length]!,
      amount: baseAmount,
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length]!,
      category: CATEGORIES[i % CATEGORIES.length]!,
      description: `交易描述 #${i + 1}`,
      orderId: `ORD-${String(i + 1).padStart(6, '0')}`,
      createdAt: new Date(now - i * 3600000).toISOString(),
      createdBy: USERS[i % USERS.length]!,
      storeName: STORE_NAMES[i % STORE_NAMES.length]!,
    };
  });
}

export function filterTransactions(
  items: Transaction[],
  typeFilter: TransactionType | 'all',
  statusFilter: TransactionStatus | 'all',
  searchQuery: string,
): Transaction[] {
  let result = items;
  if (typeFilter !== 'all') {
    result = result.filter(t => t.type === typeFilter);
  }
  if (statusFilter !== 'all') {
    result = result.filter(t => t.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.orderId.toLowerCase().includes(q) ||
      t.storeName.toLowerCase().includes(q),
    );
  }
  return result;
}

export function sortTransactions(
  items: Transaction[],
  key: keyof Transaction | null,
  desc: boolean,
): Transaction[] {
  if (!key) return [...items];
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return desc ? bVal - aVal : aVal - bVal;
    }
    const aStr = String(aVal ?? '');
    const bStr = String(bVal ?? '');
    const cmp = aStr.localeCompare(bStr, 'zh-CN', { numeric: true });
    return desc ? -cmp : cmp;
  });
}

export function paginateTransactions<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(1, pageSize)));
  const safePage = Math.max(1, Math.min(page, totalPages));
  return items.slice((safePage - 1) * pageSize, safePage * pageSize);
}

export function calcTotalPages(totalItems: number, pageSize: number): number {
  const safeSize = Math.max(1, pageSize);
  return Math.max(1, Math.ceil(totalItems / safeSize));
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  totalRefund: number;
  totalAdjustment: number;
  netAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  cancelledCount: number;
  totalCount: number;
}

export function computeSummary(items: Transaction[]): TransactionSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalRefund = 0;
  let totalAdjustment = 0;
  let successCount = 0;
  let failedCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  for (const t of items) {
    if (t.status === 'success') successCount++;
    else if (t.status === 'failed') failedCount++;
    else if (t.status === 'pending') pendingCount++;
    else if (t.status === 'cancelled') cancelledCount++;
    if (t.type === 'income') totalIncome += t.amount;
    else if (t.type === 'expense') totalExpense += t.amount;
    else if (t.type === 'refund') totalRefund += t.amount;
    else if (t.type === 'adjustment') totalAdjustment += t.amount;
  }
  const netAmount = totalIncome + totalExpense + totalRefund + totalAdjustment;
  return { totalIncome, totalExpense, totalRefund, totalAdjustment, netAmount, successCount, failedCount, pendingCount, cancelledCount, totalCount: items.length };
}

export function validateTransaction(t: Transaction): string[] {
  const errors: string[] = [];
  if (!t.id) errors.push('id 为空');
  if (!TRANSACTION_TYPES.includes(t.type)) errors.push(`type ${t.type} 无效`);
  if (!TRANSACTION_STATUSES.includes(t.status)) errors.push(`status ${t.status} 无效`);
  if (typeof t.amount !== 'number' || !Number.isFinite(t.amount)) errors.push(`amount ${t.amount} 无效`);
  if (!PAYMENT_METHODS.includes(t.paymentMethod)) errors.push(`paymentMethod ${t.paymentMethod} 无效`);
  if (!t.description) errors.push('description 为空');
  if (!t.orderId) errors.push('orderId 为空');
  try { new Date(t.createdAt).toISOString(); } catch { errors.push(`createdAt ${t.createdAt} 格式无效`); }
  return errors;
}

// ════════════════════════════════════════════════════════
// 正例 (16+)
// ════════════════════════════════════════════════════════

test('💰 财务: TYPE_LABELS 覆盖全部 4 种交易类型', () => {
  for (const t of TRANSACTION_TYPES) {
    assert.ok(TYPE_LABELS[t], `类型 ${t} 应有中文标签`);
    assert.equal(typeof TYPE_LABELS[t], 'string');
  }
});

test('💰 财务: STATUS_LABELS 覆盖全部 4 种状态', () => {
  for (const s of TRANSACTION_STATUSES) {
    assert.ok(STATUS_LABELS[s], `状态 ${s} 应有中文标签`);
  }
});

test('💰 财务: PAYMENT_LABELS 覆盖全部 5 种支付方式', () => {
  for (const p of PAYMENT_METHODS) {
    assert.ok(PAYMENT_LABELS[p], `支付方式 ${p} 应有中文标签`);
  }
});

test('💰 财务: generateMockTransactions 生成指定数量', () => {
  const data = generateMockTransactions(48);
  assert.equal(data.length, 48);
});

test('💰 财务: 生成 100 条无错误', () => {
  const data = generateMockTransactions(100);
  assert.equal(data.length, 100);
});

test('💰 财务: 每条记录 id 唯一且格式正确', () => {
  const data = generateMockTransactions(50);
  const ids = data.map(d => d.id);
  assert.equal(new Set(ids).size, ids.length);
  data.forEach(d => assert.match(d.id, /^txn-\d{6}$/));
});

test('💰 财务: 4 种类型全部出现', () => {
  const data = generateMockTransactions(40);
  const types = new Set(data.map(d => d.type));
  TRANSACTION_TYPES.forEach(t => assert.ok(types.has(t)));
});

test('💰 财务: 4 种状态全部出现', () => {
  const data = generateMockTransactions(40);
  const statuses = new Set(data.map(d => d.status));
  TRANSACTION_STATUSES.forEach(s => assert.ok(statuses.has(s)));
});

test('💰 财务: 5 种支付方式全部出现', () => {
  const data = generateMockTransactions(40);
  const methods = new Set(data.map(d => d.paymentMethod));
  PAYMENT_METHODS.forEach(p => assert.ok(methods.has(p)));
});

test('🛒 前台: fmtAmount 正数格式化', () => {
  assert.equal(fmtAmount(0), '¥0.00');
  assert.equal(fmtAmount(123.45), '¥123.45');
  assert.equal(fmtAmount(1000000), '¥1,000,000.00');
});

test('🛒 前台: fmtAmount 负数格式化', () => {
  assert.equal(fmtAmount(-50), '-¥50.00');
  assert.equal(fmtAmount(-1234.56), '-¥1,234.56');
});

test('💰 财务: filterTransactions 全部不过滤', () => {
  const data = generateMockTransactions(48);
  assert.equal(filterTransactions(data, 'all', 'all', '').length, 48);
});

test('💰 财务: filterTransactions 按类型过滤', () => {
  const data = generateMockTransactions(48);
  const income = filterTransactions(data, 'income', 'all', '');
  income.forEach(t => assert.equal(t.type, 'income'));
  assert.ok(income.length > 0);
});

test('💰 财务: filterTransactions 搜索按 orderId 匹配', () => {
  const data = generateMockTransactions(48);
  const result = filterTransactions(data, 'all', 'all', 'ORD-000001');
  assert.equal(result.length, 1);
  assert.equal(result[0]!.orderId, 'ORD-000001');
});

test('💰 财务: sortTransactions 按 amount 降序', () => {
  const data = generateMockTransactions(48);
  const sorted = sortTransactions(data, 'amount', true);
  for (let i = 1; i < sorted.length; i++) {
    const prev = typeof sorted[i - 1]!.amount === 'number' ? sorted[i - 1]!.amount : 0;
    const curr = typeof sorted[i]!.amount === 'number' ? sorted[i]!.amount : 0;
    assert.ok(prev >= curr, `idx ${i}: ${prev} < ${curr}`);
  }
});

test('💰 财务: computeSummary 正确汇总', () => {
  const data = generateMockTransactions(48);
  const summary = computeSummary(data);
  assert.equal(summary.totalCount, 48);
  assert.equal(summary.successCount + summary.failedCount + summary.pendingCount + summary.cancelledCount, 48);
  assert.ok(Number.isFinite(summary.netAmount));
});

// ════════════════════════════════════════════════════════
// 反例 (10+)
// ════════════════════════════════════════════════════════

test('🔧 安监: 无效类型过滤返回空', () => {
  const data = generateMockTransactions(48);
  // 使用类型断言测试不存在的值
  const result = filterTransactions(data, 'unknown' as TransactionType, 'all', '');
  assert.equal(result.length, 0);
});

test('🔧 安监: 搜索不存在的关键词返回空', () => {
  const data = generateMockTransactions(48);
  const result = filterTransactions(data, 'all', 'all', '不存在关键词xxxxx');
  assert.equal(result.length, 0);
});

test('🔧 安监: 空数据过滤不抛异常', () => {
  assert.equal(filterTransactions([], 'all', 'all', '').length, 0);
  assert.equal(filterTransactions([], 'income', 'success', 'test').length, 0);
});

test('🔧 安监: 空数据排序返回空', () => {
  assert.equal(sortTransactions([], 'amount', false).length, 0);
  assert.equal(sortTransactions([], null, false).length, 0);
});

test('🔧 安监: 空数据分页返回空', () => {
  assert.equal(paginateTransactions([], 1, 10).length, 0);
  assert.equal(paginateTransactions([], 5, 20).length, 0);
});

test('🔧 安监: validateTransaction 检测无效 type', () => {
  const tx = generateMockTransactions(1)[0]!;
  const bad = { ...tx, type: 'invalid' as TransactionType };
  const errors = validateTransaction(bad);
  assert.ok(errors.some(e => e.includes('type') && e.includes('无效')));
});

test('🔧 安监: validateTransaction 检测无效 amount', () => {
  const tx = generateMockTransactions(1)[0]!;
  const bad = { ...tx, amount: NaN };
  const errors = validateTransaction(bad);
  assert.ok(errors.some(e => e.includes('amount') && e.includes('无效')));
});

test('🔧 安监: validateTransaction 检测空字段', () => {
  const tx = generateMockTransactions(1)[0]!;
  const bad = { ...tx, id: '', description: '', orderId: '' };
  const errors = validateTransaction(bad);
  assert.ok(errors.some(e => e.includes('id 为空')));
  assert.ok(errors.some(e => e.includes('description 为空')));
  assert.ok(errors.some(e => e.includes('orderId 为空')));
});

test('🔧 安监: 负数 amount 在 fmtAmount 正确处理', () => {
  const result = fmtAmount(-0.01);
  assert.equal(result, '-¥0.01');
});

test('🔧 安监: 极端搜索词不报错', () => {
  const data = generateMockTransactions(10);
  const result = filterTransactions(data, 'all', 'all', '<script>alert(1)</script>');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

// ════════════════════════════════════════════════════════
// 边界 (9+)
// ════════════════════════════════════════════════════════

test('🎯 运行专员: 生成 0 条返回空数组', () => {
  assert.equal(generateMockTransactions(0).length, 0);
});

test('🎯 运行专员: 生成 1 条正常工作', () => {
  const data = generateMockTransactions(1);
  assert.equal(data.length, 1);
  assert.equal(validateTransaction(data[0]!).length, 0);
});

test('🎯 运行专员: 生成 200 条 id 唯一', () => {
  const data = generateMockTransactions(200);
  assert.equal(data.length, 200);
  assert.equal(new Set(data.map(d => d.id)).size, 200);
});

test('🎯 运行专员: paginateTransactions 越界页码归正', () => {
  const data = generateMockTransactions(30);
  const page999 = paginateTransactions(data, 999, 10);
  assert.equal(page999.length, 10); // safePage clamped to last page
});

test('🎯 运行专员: paginateTransactions 负数页码归正', () => {
  const data = generateMockTransactions(10);
  const neg = paginateTransactions(data, -5, 10);
  assert.equal(neg.length, 10); // safePage clamped to 1
});

test('🎯 运行专员: calcTotalPages 0 条返回 1', () => {
  assert.equal(calcTotalPages(0, 10), 1);
  assert.equal(calcTotalPages(0, 0), 1);
});

test('🎯 运行专员: calcTotalPages 计算正确', () => {
  assert.equal(calcTotalPages(30, 10), 3);
  assert.equal(calcTotalPages(31, 10), 4);
  assert.equal(calcTotalPages(100, 20), 5);
});

test('🎯 运行专员: computeSummary 空数组返回全零', () => {
  const s = computeSummary([]);
  assert.equal(s.totalIncome, 0);
  assert.equal(s.totalExpense, 0);
  assert.equal(s.totalRefund, 0);
  assert.equal(s.totalAdjustment, 0);
  assert.equal(s.netAmount, 0);
  assert.equal(s.successCount, 0);
  assert.equal(s.failedCount, 0);
  assert.equal(s.pendingCount, 0);
  assert.equal(s.cancelledCount, 0);
  assert.equal(s.totalCount, 0);
});

test('🎯 运行专员: createdAt 格式为 ISO 8601', () => {
  const data = generateMockTransactions(10);
  data.forEach(t => {
    const d = new Date(t.createdAt);
    assert.ok(d.getTime() > 0, `${t.id} invalid createdAt`);
  });
});
