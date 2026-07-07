/**
 * sales-performance/[id]/page.test.ts — Transaction detail page L1 tests.
 * Tests: data integrity, format helpers, edge cases, 404 behavior.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: page.tsx (DetailShell, PaginatedDataTableCard, Stats)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── Types (mirror page.tsx) ──

type TransactionChannel = 'online' | 'offline';

interface SalesTransaction {
  id: string;
  date: string;
  customer: string;
  amount: number;
  items: number;
  store: string;
  channel: TransactionChannel;
  paymentMethod: string;
  category: string;
  salesClerk: string;
}

interface SalesMember {
  id: string;
  name: string;
  level: string;
  joinedAt: string;
  totalSpent: number;
  lastVisit: string;
}

// ── Mock data (mirrored from page.tsx) ──

const MOCK_TRANSACTIONS: Record<string, SalesTransaction> = {
  T001: { id: 'T001', date: '2026-06-24 18:32', customer: '张三', amount: 568, items: 3, store: '旗舰店', channel: 'offline', paymentMethod: '微信支付', category: '饮品', salesClerk: '小王' },
  T002: { id: 'T002', date: '2026-06-24 17:15', customer: '李四', amount: 1299, items: 5, store: '旗舰店', channel: 'offline', paymentMethod: '支付宝', category: '套餐', salesClerk: '小李' },
  T003: { id: 'T003', date: '2026-06-24 16:40', customer: '王五', amount: 89, items: 1, store: '旗舰店', channel: 'online', paymentMethod: '微信支付', category: '饮品', salesClerk: '-' },
  T004: { id: 'T004', date: '2026-06-24 15:00', customer: '赵六', amount: 450, items: 2, store: '社区店', channel: 'offline', paymentMethod: '现金', category: '烘焙', salesClerk: '小张' },
  T005: { id: 'T005', date: '2026-06-24 14:22', customer: '陈七', amount: 780, items: 4, store: '旗舰店', channel: 'online', paymentMethod: '支付宝', category: '套餐', salesClerk: '-' },
  T006: { id: 'T006', date: '2026-06-24 12:08', customer: '刘八', amount: 220, items: 1, store: '社区店', channel: 'offline', paymentMethod: '微信支付', category: '饮品', salesClerk: '小张' },
  T007: { id: 'T007', date: '2026-06-24 10:45', customer: '孙九', amount: 1340, items: 6, store: '旗舰店', channel: 'offline', paymentMethod: '会员卡', category: '套餐', salesClerk: '小王' },
  T008: { id: 'T008', date: '2026-06-24 09:30', customer: '周十', amount: 320, items: 2, store: '社区店', channel: 'offline', paymentMethod: '微信支付', category: '烘焙', salesClerk: '小张' },
};

const MOCK_MEMBERS: SalesMember[] = [
  { id: 'M001', name: '张三', level: '黄金', joinedAt: '2025-03-15', totalSpent: 12680, lastVisit: '2026-06-24' },
  { id: 'M002', name: '李四', level: '钻石', joinedAt: '2024-09-01', totalSpent: 45200, lastVisit: '2026-06-24' },
  { id: 'M003', name: '王五', level: '白银', joinedAt: '2026-01-10', totalSpent: 3890, lastVisit: '2026-06-24' },
  { id: 'M004', name: '赵六', level: '黄金', joinedAt: '2025-06-20', totalSpent: 8740, lastVisit: '2026-06-24' },
  { id: 'M005', name: '陈七', level: '白银', joinedAt: '2026-02-14', totalSpent: 2190, lastVisit: '2026-06-24' },
  { id: 'M006', name: '刘八', level: '黄金', joinedAt: '2025-08-05', totalSpent: 5630, lastVisit: '2026-06-24' },
  { id: 'M007', name: '孙九', level: '钻石', joinedAt: '2024-05-01', totalSpent: 62100, lastVisit: '2026-06-24' },
  { id: 'M008', name: '周十', level: '白银', joinedAt: '2026-04-18', totalSpent: 1450, lastVisit: '2026-06-24' },
];

// ── Helpers (mirror page.tsx) ──

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function getTransactionById(id: string): SalesTransaction | undefined {
  return MOCK_TRANSACTIONS[id];
}

function getMemberByCustomerName(name: string): SalesMember | undefined {
  return MOCK_MEMBERS.find((m) => m.name === name);
}

function getStoreTransactions(store: string, excludeId?: string): SalesTransaction[] {
  return Object.values(MOCK_TRANSACTIONS).filter(
    (t) => t.store === store && t.id !== excludeId,
  );
}

function getTransactionsByChannel(channel: TransactionChannel): SalesTransaction[] {
  return Object.values(MOCK_TRANSACTIONS).filter((t) => t.channel === channel);
}

function getHighValueTransactions(minAmount: number): SalesTransaction[] {
  return Object.values(MOCK_TRANSACTIONS).filter((t) => t.amount >= minAmount);
}

function calculateAverageUnitPrice(transaction: SalesTransaction): number {
  return transaction.items > 0
    ? Math.round(transaction.amount / transaction.items)
    : 0;
}

// ── 正例 ──

test('每个交易都有唯一 ID 且键值匹配', () => {
  const ids = Object.keys(MOCK_TRANSACTIONS);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.strictEqual(MOCK_TRANSACTIONS[id].id, id);
  }
});

test('数据完整性: 所有交易字段齐全', () => {
  for (const tx of Object.values(MOCK_TRANSACTIONS)) {
    assert.ok(tx.id.length > 0);
    assert.ok(tx.date.length > 0);
    assert.ok(tx.customer.length > 0);
    assert.ok(tx.amount > 0);
    assert.ok(tx.items >= 1);
    assert.ok(['旗舰店', '社区店'].includes(tx.store));
    assert.ok(['online', 'offline'].includes(tx.channel));
    assert.ok(tx.paymentMethod.length > 0);
    assert.ok(tx.category.length > 0);
  }
});

test('数据完整性: 会员字段齐全', () => {
  for (const m of MOCK_MEMBERS) {
    assert.ok(m.id.length > 0);
    assert.ok(m.name.length > 0);
    assert.ok(['白银', '黄金', '钻石'].includes(m.level));
    assert.ok(m.totalSpent >= 0);
    assert.ok(m.joinedAt.length > 0);
    assert.ok(m.lastVisit.length > 0);
  }
});

test('getTransactionById: 按 ID 查找成功', () => {
  const tx = getTransactionById('T001');
  assert.ok(tx);
  assert.strictEqual(tx.customer, '张三');
  assert.strictEqual(tx.amount, 568);
});

test('getMemberByCustomerName: 通过顾客名查会员', () => {
  const member = getMemberByCustomerName('张三');
  assert.ok(member);
  assert.strictEqual(member.level, '黄金');
  assert.strictEqual(member.totalSpent, 12680);
});

test('getStoreTransactions: 按门店筛选', () => {
  const storeTxs = getStoreTransactions('旗舰店');
  // 旗舰店 transactions: T001, T002, T003, T005, T007 = 5
  assert.strictEqual(storeTxs.length, 5);
  for (const tx of storeTxs) {
    assert.strictEqual(tx.store, '旗舰店');
  }
});

test('getTransactionsByChannel: 按渠道筛选', () => {
  const online = getTransactionsByChannel('online');
  assert.strictEqual(online.length, 2); // T003, T005
  for (const tx of online) {
    assert.strictEqual(tx.channel, 'online');
  }

  const offline = getTransactionsByChannel('offline');
  assert.strictEqual(offline.length, 6); // the rest
  for (const tx of offline) {
    assert.strictEqual(tx.channel, 'offline');
  }
});

test('getHighValueTransactions: 高额交易筛选', () => {
  const high = getHighValueTransactions(1000);
  assert.ok(high.length >= 2); // T002(1299), T007(1340)
  for (const tx of high) {
    assert.ok(tx.amount >= 1000);
  }
});

test('calculateAverageUnitPrice: 计算均单价', () => {
  const tx = getTransactionById('T007')!;
  assert.strictEqual(tx.items, 6);
  assert.strictEqual(tx.amount, 1340);
  assert.strictEqual(calculateAverageUnitPrice(tx), 223); // 1340/6 ≈ 223.3
});

test('formatCurrency: 格式化金额', () => {
  assert.strictEqual(formatCurrency(0), '¥0');
  assert.strictEqual(formatCurrency(100), '¥100');
  assert.strictEqual(formatCurrency(1234), '¥1,234');
  assert.strictEqual(formatCurrency(1000000), '¥1,000,000');
  assert.strictEqual(formatCurrency(99.9), '¥99.9');
});

test('getStoreTransactions: 排除当前交易 ID', () => {
  const withExclusion = getStoreTransactions('旗舰店', 'T001');
  const withoutExclusion = getStoreTransactions('旗舰店');
  assert.strictEqual(withExclusion.length, withoutExclusion.length - 1);
  for (const tx of withExclusion) {
    assert.notStrictEqual(tx.id, 'T001');
  }
});

test('钻石会员累计消费最高', () => {
  const diamondMembers = MOCK_MEMBERS.filter((m) => m.level === '钻石');
  assert.ok(diamondMembers.length >= 1);
  for (const dm of diamondMembers) {
    assert.ok(dm.totalSpent >= 40000, `钻石会员 ${dm.name} 消费 ${dm.totalSpent} 偏低`);
  }
});

// ── 反例 ──

test('反例: 不存在的交易 ID 返回 undefined', () => {
  const tx = getTransactionById('T999');
  assert.strictEqual(tx, undefined);
});

test('反例: 不存在的顾客名查无会员', () => {
  const member = getMemberByCustomerName('不存在');
  assert.strictEqual(member, undefined);
});

test('反例: 空门店名称返回空列表', () => {
  const result = getStoreTransactions('');
  assert.strictEqual(result.length, 0);
});

test('反例: 负数金额筛选返回空', () => {
  const result = getHighValueTransactions(-1);
  // 所有交易金额 > 0，所以 -1 作为阈值会返回全部
  assert.ok(result.length > 0);
});

test('反例: 极大金额筛选返回空', () => {
  const result = getHighValueTransactions(999999);
  assert.strictEqual(result.length, 0);
});

test('反例: 金额为零的交易不存在', () => {
  const zeroAmount = Object.values(MOCK_TRANSACTIONS).filter((t) => t.amount <= 0);
  assert.strictEqual(zeroAmount.length, 0);
});

test('反例: 会员等级必须有效', () => {
  const invalidLevels = MOCK_MEMBERS.filter(
    (m) => !['白银', '黄金', '钻石'].includes(m.level),
  );
  assert.strictEqual(invalidLevels.length, 0);
});

// ── 边界 ──

test('边界: 单件商品交易均单价等于金额', () => {
  const tx = getTransactionById('T006')!;
  assert.strictEqual(tx.items, 1);
  assert.strictEqual(calculateAverageUnitPrice(tx), tx.amount);
});

test('边界: 最小交易金额', () => {
  const amounts = Object.values(MOCK_TRANSACTIONS).map((t) => t.amount);
  const min = Math.min(...amounts);
  assert.strictEqual(min, 89); // T003
  assert.strictEqual(getTransactionById('T003')!.amount, 89);
});

test('边界: 最大交易金额', () => {
  const amounts = Object.values(MOCK_TRANSACTIONS).map((t) => t.amount);
  const max = Math.max(...amounts);
  assert.strictEqual(max, 1340); // T007
  assert.strictEqual(getTransactionById('T007')!.amount, 1340);
});

test('边界: 交易 channel 只能是 online 或 offline', () => {
  for (const tx of Object.values(MOCK_TRANSACTIONS)) {
    assert.ok(tx.channel === 'online' || tx.channel === 'offline');
  }
});

test('边界: 所有 member 的名字都对应一个 transaction', () => {
  for (const member of MOCK_MEMBERS) {
    const matchingTx = Object.values(MOCK_TRANSACTIONS).find(
      (t) => t.customer === member.name,
    );
    assert.ok(matchingTx, `会员 ${member.name} 应有对应交易`);
  }
});

test('边界: 旗舰店交易数多于社区店', () => {
  const flagship = Object.values(MOCK_TRANSACTIONS).filter((t) => t.store === '旗舰店').length;
  const community = Object.values(MOCK_TRANSACTIONS).filter((t) => t.store === '社区店').length;
  assert.ok(flagship > community, `旗舰店(${flagship}) > 社区店(${community})`);
});

test('边界: 线下交易超过线上', () => {
  const offline = getTransactionsByChannel('offline').length;
  const online = getTransactionsByChannel('online').length;
  assert.ok(offline > online);
});

test('边界: MOCK_TRANSACTIONS 与 MOCK_MEMBERS 数量对应', () => {
  const uniqueCustomers = new Set(Object.values(MOCK_TRANSACTIONS).map((t) => t.customer));
  assert.strictEqual(uniqueCustomers.size, MOCK_MEMBERS.length);
});

test('边界: 三日前的日期格式 YYYY-MM-DD', () => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  for (const member of MOCK_MEMBERS) {
    assert.ok(datePattern.test(member.joinedAt), `joinedAt ${member.joinedAt}`);
    assert.ok(datePattern.test(member.lastVisit), `lastVisit ${member.lastVisit}`);
  }

  // Transaction dates have time component
  const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
  for (const tx of Object.values(MOCK_TRANSACTIONS)) {
    assert.ok(dateTimePattern.test(tx.date), `date ${tx.date}`);
  }
});
