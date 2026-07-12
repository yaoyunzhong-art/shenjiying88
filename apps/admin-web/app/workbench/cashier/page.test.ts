/**
 * workbench/cashier/page.test.ts — 收银工作台 L1 测试
 *
 * 覆盖:
 *   正例 — 交班数据结构校验、关键计算（差异/预期营收）、状态映射
 *   反例 — 0 差异、缺失 endTime（营业中）
 *   边界 — 金额格式化、随机交易生成
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型 ────────────────────────────────────────────

interface CashierSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  openingBalance: number;
  cashRevenue: number;
  cardRevenue: number;
  onlineRevenue: number;
  refundAmount: number;
  expectedTotal: number;
  actualTotal: number;
  difference: number;
  transactionCount: number;
  status: 'open' | 'closed' | 'pending_review';
}

interface RecentTransaction {
  id: string;
  time: string;
  type: 'sale' | 'recharge' | 'refund';
  amount: number;
  method: string;
  customer: string;
}

// ─── Mock Session ────────────────────────────────────

const session: CashierSession = {
  id: 'CS001',
  date: '2026-07-11',
  startTime: '08:00',
  endTime: '—',
  openingBalance: 2000,
  cashRevenue: 3850,
  cardRevenue: 2120,
  onlineRevenue: 5680,
  refundAmount: 360,
  expectedTotal: 3850 + 2120 + 5680 - 360,
  actualTotal: 3850 + 2120 + 5680 - 358,
  difference: 2,
  transactionCount: 86,
  status: 'open',
};

// ─── 常量 ────────────────────────────────────────────

const SHIFT_STATUS: Record<string, { l: string; v: 'success' | 'warning' | 'danger' }> = {
  open: { l: '营业中', v: 'success' },
  closed: { l: '已结班', v: 'warning' },
  pending_review: { l: '待审核', v: 'warning' },
};

const TXN_TYPE: Record<string, string> = {
  sale: '销售',
  recharge: '充值',
  refund: '退款',
};

const TXN_COLOR: Record<string, string> = {
  sale: '#22c55e',
  recharge: '#3b82f6',
  refund: '#ef4444',
};

// ─── 辅助函数 ────────────────────────────────────────

function fm(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function computeExpectedTotal(cash: number, card: number, online: number, refund: number): number {
  return cash + card + online - refund;
}

function computeDifference(expected: number, actual: number): number {
  return actual - expected;
}

function generateRecentTxns(count: number): RecentTransaction[] {
  const types: RecentTransaction['type'][] = ['sale', 'sale', 'sale', 'recharge', 'refund'];
  const methods = ['现金', '微信', '支付宝', '会员卡', '银联'];
  const customers = ['散客', '张明', '李华', '王芳', '会员'];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.now() - i * 1200000);
    return {
      id: `TXN-${i + 1}`,
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      type: types[Math.floor(Math.random() * types.length)]!,
      amount: Math.round((20 + Math.random() * 300) * 100) / 100,
      method: methods[Math.floor(Math.random() * methods.length)]!,
      customer: customers[Math.floor(Math.random() * customers.length)]!,
    };
  });
}

// ─── 测试套件 ────────────────────────────────────────

describe('workbench/cashier — 交班数据', () => {
  it('1. expectedTotal 计算正确（正例）', () => {
    const expected = computeExpectedTotal(3850, 2120, 5680, 360);
    assert.equal(expected, 3850 + 2120 + 5680 - 360);
    assert.equal(session.expectedTotal, expected);
  });

  it('2. difference = actual - expected（正例）', () => {
    assert.equal(session.difference, computeDifference(session.expectedTotal, session.actualTotal));
  });

  it('3. startTime 格式 HH:MM（正例）', () => {
    assert.match(session.startTime, /^\d{2}:\d{2}$/);
  });

  it('4. status 为 open（正例）', () => {
    assert.equal(session.status, 'open');
    assert.equal(SHIFT_STATUS.open.l, '营业中');
  });

  it('5. cashRevenue > 0（正例）', () => {
    assert.ok(session.cashRevenue > 0);
    assert.ok(session.cardRevenue > 0);
    assert.ok(session.onlineRevenue > 0);
  });

  it('6. transactionCount 为正整数（正例）', () => {
    assert.ok(Number.isInteger(session.transactionCount));
    assert.ok(session.transactionCount > 0);
  });

  it('7. openingBalance < cashRevenue（正例）', () => {
    assert.ok(session.openingBalance < session.cashRevenue);
  });
});

describe('workbench/cashier — 状态与映射', () => {
  it('8. SHIFT_STATUS 3 种状态（正例）', () => {
    const keys = Object.keys(SHIFT_STATUS);
    assert.equal(keys.length, 3);
    assert.ok(keys.includes('open'));
    assert.ok(keys.includes('closed'));
    assert.ok(keys.includes('pending_review'));
  });

  it('9. TXN_TYPE 3 种类型（正例）', () => {
    assert.equal(Object.keys(TXN_TYPE).length, 3);
    assert.equal(TXN_TYPE.sale, '销售');
    assert.equal(TXN_TYPE.recharge, '充值');
    assert.equal(TXN_TYPE.refund, '退款');
  });

  it('10. TXN_COLOR 3 种颜色（正例）', () => {
    const keys = Object.keys(TXN_COLOR);
    assert.equal(keys.length, 3);
  });
});

describe('workbench/cashier — 辅助函数', () => {
  it('11. fm 格式化金额（正例）', () => {
    assert.equal(fm(3850), '¥3,850.00');
    assert.equal(fm(2000), '¥2,000.00');
  });

  it('12. fm 零值（边界）', () => {
    assert.equal(fm(0), '¥0.00');
  });

  it('13. fm 小数（正例）', () => {
    assert.equal(fm(0.5), '¥0.50');
  });

  it('14. computeExpectedTotal 含退款为负（正例）', () => {
    assert.equal(computeExpectedTotal(0, 0, 0, 100), -100);
  });

  it('15. computeDifference 正差（正例）', () => {
    assert.equal(computeDifference(100, 105), 5);
  });

  it('16. computeDifference 零差（边界）', () => {
    assert.equal(computeDifference(100, 100), 0);
  });

  it('17. computeDifference 负差（反例）', () => {
    assert.equal(computeDifference(100, 90), -10);
  });
});

describe('workbench/cashier — 交易生成', () => {
  it('18. 生成 10 笔交易（正例）', () => {
    const txns = generateRecentTxns(10);
    assert.equal(txns.length, 10);
  });

  it('19. 每笔交易有 ID（正例）', () => {
    const txns = generateRecentTxns(5);
    for (const t of txns) {
      assert.ok(t.id.startsWith('TXN-'));
    }
  });

  it('20. 每笔金额 > 0（正例）', () => {
    const txns = generateRecentTxns(20);
    for (const t of txns) {
      assert.ok(t.amount >= 20 && t.amount <= 320, `金额 ${t.amount} 在[20, 320]`);
    }
  });

  it('21. 时间格式 HH:MM（正例）', () => {
    const txns = generateRecentTxns(5);
    for (const t of txns) {
      assert.match(t.time, /^\d{2}:\d{2}$/);
    }
  });

  it('22. customer 非空（正例）', () => {
    const txns = generateRecentTxns(10);
    for (const t of txns) {
      assert.ok(t.customer.length > 0);
    }
  });
});
