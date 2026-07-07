/**
 * finance.test.ts — Page-level tests for admin-web 财务管理页面
 *
 * 正例 + 反例 + 边界, ≥3 个测试用例
 * References: page.tsx (Payment, Refund, formatAmount, generateUUID, STATUS_COLORS, status machine)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Data shapes (replicated from page.tsx) ──────────────────────────────

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' | 'BALANCE';
type RefundStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

interface Payment {
  id: string; tenantId: string; orderId: string;
  amountCents: number; currency: string; method: PaymentMethod;
  status: PaymentStatus; version: number; idempotencyKey: string;
  transactionId?: string; failureReason?: string; createdAt: string;
}

interface Refund {
  id: string; tenantId: string; paymentId: string; orderId: string;
  amountCents: number; reason: string; status: RefundStatus;
  version: number; requestedBy: string; createdAt: string;
}

// ─── Replicated helpers ──────────────────────────────────────────────────

function formatAmount(cents: number, currency = 'CNY'): string {
  const yuan = (cents / 100).toFixed(2);
  return currency === 'CNY' ? `¥${yuan}` : `${currency} ${yuan}`;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING:   { bg: '#fef3c7', fg: '#92400e' },
  SUCCESS:   { bg: '#d1fae5', fg: '#065f46' },
  FAILED:    { bg: '#fee2e2', fg: '#991b1b' },
  REFUNDED:  { bg: '#e5e7eb', fg: '#374151' },
  REQUESTED: { bg: '#dbeafe', fg: '#1e40af' },
  APPROVED:  { bg: '#fef3c7', fg: '#92400e' },
  COMPLETED: { bg: '#d1fae5', fg: '#065f46' },
  REJECTED:  { bg: '#fee2e2', fg: '#991b1b' },
};

// ─── Payment status machine (from page.tsx handleCreate + handleRefund) ───

/** Valid state transitions: PENDING → SUCCESS|FAILED, SUCCESS → REFUNDED */
function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  const transitions: Record<PaymentStatus, PaymentStatus[]> = {
    PENDING:  ['SUCCESS', 'FAILED'],
    SUCCESS:  ['REFUNDED'],
    FAILED:   [],
    REFUNDED: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

/** Refund status machine: REQUESTED → APPROVED|REJECTED → COMPLETED */
function canTransitionRefund(from: RefundStatus, to: RefundStatus): boolean {
  const transitions: Record<RefundStatus, RefundStatus[]> = {
    REQUESTED:  ['APPROVED', 'REJECTED'],
    APPROVED:   ['COMPLETED'],
    REJECTED:   [],
    COMPLETED:  [],
  };
  return transitions[from]?.includes(to) ?? false;
}

function filterPaymentsByStatus(payments: Payment[], status: string): Payment[] {
  if (status === 'all') return payments;
  return payments.filter((p) => p.status === status);
}

function filterPaymentsByMethod(payments: Payment[], method: string): Payment[] {
  if (method === 'all') return payments;
  return payments.filter((p) => p.method === method);
}

const BASE_PAYMENTS: Payment[] = [
  { id: 'p1', tenantId: 't1', orderId: 'o1', amountCents: 9900, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', version: 2, idempotencyKey: 'ik1', createdAt: '2025-06-01T00:00:00Z' },
  { id: 'p2', tenantId: 't1', orderId: 'o2', amountCents: 12900, currency: 'CNY', method: 'ALIPAY', status: 'PENDING', version: 1, idempotencyKey: 'ik2', transactionId: 'tx-001', createdAt: '2025-06-02T00:00:00Z' },
  { id: 'p3', tenantId: 't1', orderId: 'o3', amountCents: 5000, currency: 'CNY', method: 'CASH', status: 'FAILED', version: 1, idempotencyKey: 'ik3', failureReason: '余额不足', createdAt: '2025-06-03T00:00:00Z' },
  { id: 'p4', tenantId: 't1', orderId: 'o4', amountCents: 20000, currency: 'CNY', method: 'CARD', status: 'REFUNDED', version: 3, idempotencyKey: 'ik4', transactionId: 'tx-002', createdAt: '2025-06-04T00:00:00Z' },
  { id: 'p5', tenantId: 't1', orderId: 'o5', amountCents: 150, currency: 'CNY', method: 'BALANCE', status: 'SUCCESS', version: 1, idempotencyKey: 'ik5', createdAt: '2025-06-05T00:00:00Z' },
];

// ─── Tests ───────────────────────────────────────────────────────────────

describe('admin-finance: 正例', () => {
  it('formatAmount 正确格式化人民币金额', () => {
    assert.equal(formatAmount(9900), '¥99.00');
    assert.equal(formatAmount(1), '¥0.01');
    assert.equal(formatAmount(0), '¥0.00');
    assert.equal(formatAmount(129900), '¥1299.00');
  });

  it('formatAmount 支持非人民币币种', () => {
    assert.equal(formatAmount(9900, 'USD'), 'USD 99.00');
    assert.equal(formatAmount(1000, 'EUR'), 'EUR 10.00');
  });

  it('generateUUID 返回合法 UUID v4 格式', () => {
    const uuid = generateUUID();
    assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generateUUID 每次调用返回不同值', () => {
    const u1 = generateUUID();
    const u2 = generateUUID();
    assert.notEqual(u1, u2);
  });

  it('STATUS_COLORS 覆盖所有 8 种状态', () => {
    const allStatuses: string[] = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED'];
    for (const s of allStatuses) {
      assert.ok(STATUS_COLORS[s], `missing color for ${s}`);
      assert.ok(STATUS_COLORS[s].bg);
      assert.ok(STATUS_COLORS[s].fg);
    }
  });

  it('filterPaymentsByStatus "all" 返回全部', () => {
    const result = filterPaymentsByStatus(BASE_PAYMENTS, 'all');
    assert.equal(result.length, BASE_PAYMENTS.length);
  });

  it('filterPaymentsByMethod "all" 返回全部', () => {
    const result = filterPaymentsByMethod(BASE_PAYMENTS, 'all');
    assert.equal(result.length, BASE_PAYMENTS.length);
  });

  it('filterPaymentsByStatus 按状态筛选正确', () => {
    const success = filterPaymentsByStatus(BASE_PAYMENTS, 'SUCCESS');
    assert.equal(success.length, 2);
    assert.ok(success.every((p) => p.status === 'SUCCESS'));
  });

  it('filterPaymentsByMethod 按支付方式筛选正确', () => {
    const wechat = filterPaymentsByMethod(BASE_PAYMENTS, 'WECHAT');
    assert.equal(wechat.length, 1);
    assert.equal(wechat[0]!.method, 'WECHAT');
  });

  it('canTransition PENDING → SUCCESS 合法', () => {
    assert.ok(canTransition('PENDING', 'SUCCESS'));
  });

  it('canTransition PENDING → FAILED 合法', () => {
    assert.ok(canTransition('PENDING', 'FAILED'));
  });

  it('canTransition SUCCESS → REFUNDED 合法', () => {
    assert.ok(canTransition('SUCCESS', 'REFUNDED'));
  });

  it('canTransitionRefund REQUESTED → APPROVED 合法', () => {
    assert.ok(canTransitionRefund('REQUESTED', 'APPROVED'));
  });

  it('canTransitionRefund APPROVED → COMPLETED 合法', () => {
    assert.ok(canTransitionRefund('APPROVED', 'COMPLETED'));
  });
});

describe('admin-finance: 反例', () => {
  it('canTransition FAILED → SUCCESS 非法', () => {
    assert.ok(!canTransition('FAILED', 'SUCCESS'));
  });

  it('canTransition REFUNDED → PENDING 非法', () => {
    assert.ok(!canTransition('REFUNDED', 'PENDING'));
  });

  it('canTransition PENDING → REFUNDED 非法（必须先 SUCCESS）', () => {
    assert.ok(!canTransition('PENDING', 'REFUNDED'));
  });

  it('canTransitionRefund REJECTED → APPROVED 非法', () => {
    assert.ok(!canTransitionRefund('REJECTED', 'APPROVED'));
  });

  it('filterPaymentsByStatus 不存在的状态返回空数组', () => {
    const result = filterPaymentsByStatus(BASE_PAYMENTS, 'NONEXISTENT' as any);
    assert.equal(result.length, 0);
  });

  it('filterPaymentsByMethod 不存在的支付方式返回空数组', () => {
    const result = filterPaymentsByMethod(BASE_PAYMENTS, 'BITCOIN' as any);
    assert.equal(result.length, 0);
  });

  it('formatAmount 负数金额格式化', () => {
    assert.equal(formatAmount(-500), '¥-5.00');
  });

  it('UUID 不含泄露敏感信息', () => {
    const uuid = generateUUID();
    assert.ok(!uuid.includes('undefined'));
    assert.ok(!uuid.includes('NaN'));
  });
});

describe('admin-finance: 边界', () => {
  it('金额为 0 时格式化', () => {
    assert.equal(formatAmount(0), '¥0.00');
  });

  it('金额为极大值 9999999999 分', () => {
    assert.equal(formatAmount(9999999999), '¥99999999.99');
  });

  it('filterPaymentsByStatus 空数组', () => {
    assert.equal(filterPaymentsByStatus([], 'SUCCESS').length, 0);
  });

  it('一个订单有多个支付记录（拆分支付场景）', () => {
    const multi = BASE_PAYMENTS.filter((p) => p.orderId === 'o1');
    assert.equal(multi.length, 1); // 仅 1 个支付单
    // 模拟同一个 order 多笔支付
    const splitted = [
      ...BASE_PAYMENTS,
      { ...BASE_PAYMENTS[0], id: 'p1b', method: 'CASH' as PaymentMethod, amountCents: 5000 },
    ];
    const orderPayments = splitted.filter((p) => p.orderId === 'o1');
    assert.equal(orderPayments.length, 2);
    const total = orderPayments.reduce((s, p) => s + p.amountCents, 0);
    assert.equal(total, 14900);
  });

  it('canTransitionRefund REQUESTED → REJECTED 合法', () => {
    assert.ok(canTransitionRefund('REQUESTED', 'REJECTED'));
  });

  it('所有状态在 STATUS_COLORS 中存在映射', () => {
    const payStatuses: PaymentStatus[] = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];
    const refStatuses: RefundStatus[] = ['REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED'];
    for (const s of [...payStatuses, ...refStatuses]) {
      assert.ok(STATUS_COLORS[s], `STATUS_COLORS missing key "${s}"`);
    }
  });
});
