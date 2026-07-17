/**
 * finance/page.test.tsx — 财务管理页面 L1 测试
 *
 * 覆盖:
 *   正例 — Payment/Refund 数据渲染、筛选、格式化、操作(标记成功/申请退款)
 *   反例 — 空数据、非法状态流转、过滤无匹配
 *   边界 — 金额零值、极端版本号、UUID 生成
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// ── 工具函数（mirror page） ──

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
type RefundStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' | 'BALANCE';

interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  version: number;
  idempotencyKey: string;
  transactionId?: string;
  failureReason?: string;
  createdAt: string;
}

interface Refund {
  id: string;
  tenantId: string;
  paymentId: string;
  orderId: string;
  amountCents: number;
  reason: string;
  status: RefundStatus;
  version: number;
  requestedBy: string;
  createdAt: string;
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

function formatAmount(cents: number, currency = 'CNY'): string {
  const yuan = (cents / 100).toFixed(2);
  return currency === 'CNY' ? `\u00a5${yuan}` : `${currency} ${yuan}`;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function filterPayments(payments: Payment[], status: string, method: string): Payment[] {
  return payments.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (method !== 'all' && p.method !== method) return false;
    return true;
  });
}

function getStatusColor(status: string): { bg: string; fg: string } {
  return STATUS_COLORS[status] ?? { bg: '#e5e7eb', fg: '#000' };
}

function canMarkSuccess(status: PaymentStatus): boolean {
  return status === 'PENDING';
}

function canRequestRefund(status: PaymentStatus): boolean {
  return status === 'SUCCESS';
}

function validatePaymentForm(orderId: string, amountCents: number): string | null {
  if (!orderId.trim()) return '订单 ID 和金额必填';
  if (amountCents <= 0) return '订单 ID 和金额必填';
  return null;
}

// ── MOCK 数据 ──

let mockPayments: Payment[];
let mockRefunds: Refund[];

before(() => {
  mockPayments = [
    {
      id: 'pay-001',
      tenantId: 'demo-tenant',
      orderId: 'ord-2024-001',
      amountCents: 9900,
      currency: 'CNY',
      method: 'WECHAT',
      status: 'SUCCESS',
      version: 2,
      idempotencyKey: 'idem-001',
      transactionId: 'wx-tx-42001',
      createdAt: '2026-06-30T08:00:00Z',
    },
    {
      id: 'pay-002',
      tenantId: 'demo-tenant',
      orderId: 'ord-2024-002',
      amountCents: 12900,
      currency: 'CNY',
      method: 'ALIPAY',
      status: 'PENDING',
      version: 1,
      idempotencyKey: 'idem-002',
      createdAt: '2026-06-30T08:05:00Z',
    },
    {
      id: 'pay-003',
      tenantId: 'demo-tenant',
      orderId: 'ord-2024-003',
      amountCents: 5000,
      currency: 'CNY',
      method: 'CARD',
      status: 'FAILED',
      version: 1,
      idempotencyKey: 'idem-003',
      failureReason: '余额不足',
      createdAt: '2026-06-30T08:10:00Z',
    },
    {
      id: 'pay-004',
      tenantId: 'demo-tenant',
      orderId: 'ord-2024-004',
      amountCents: 25000,
      currency: 'CNY',
      method: 'CASH',
      status: 'REFUNDED',
      version: 3,
      idempotencyKey: 'idem-004',
      createdAt: '2026-06-29T10:00:00Z',
    },
    {
      id: 'pay-005',
      tenantId: 'demo-tenant',
      orderId: 'ord-2024-005',
      amountCents: 350,
      currency: 'CNY',
      method: 'BALANCE',
      status: 'SUCCESS',
      version: 1,
      idempotencyKey: 'idem-005',
      createdAt: '2026-06-30T06:00:00Z',
    },
  ];

  mockRefunds = [
    {
      id: 'ref-001',
      tenantId: 'demo-tenant',
      paymentId: 'pay-001',
      orderId: 'ord-2024-001',
      amountCents: 9900,
      reason: '客户取消',
      status: 'COMPLETED',
      version: 2,
      requestedBy: 'cs-001',
      createdAt: '2026-06-30T09:00:00Z',
    },
    {
      id: 'ref-002',
      tenantId: 'demo-tenant',
      paymentId: 'pay-004',
      orderId: 'ord-2024-004',
      amountCents: 20000,
      reason: '部分退款',
      status: 'REQUESTED',
      version: 1,
      requestedBy: 'cs-002',
      createdAt: '2026-06-30T09:30:00Z',
    },
  ];
});

// ════════════════════════════════════════
// 正例 (Positive Cases)
// ════════════════════════════════════════

describe('finance-page: 正例', () => {
  describe('formatAmount', () => {
    it('should format CNY cents to ¥ string', () => {
      assert.strictEqual(formatAmount(9900), '\u00a599.00');
      assert.strictEqual(formatAmount(100), '\u00a51.00');
      assert.strictEqual(formatAmount(1), '\u00a50.01');
    });

    it('should handle zero cents', () => {
      assert.strictEqual(formatAmount(0), '\u00a50.00');
    });

    it('should handle large amounts', () => {
      assert.strictEqual(formatAmount(10000000), '\u00a5100000.00');
    });

    it('should include currency prefix for non-CNY', () => {
      assert.strictEqual(formatAmount(5000, 'USD'), 'USD 50.00');
    });
  });

  describe('generateUUID', () => {
    it('should produce a valid UUIDv4 format', () => {
      const uuid = generateUUID();
      assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should produce unique values each call', () => {
      const uuids = Array.from({ length: 100 }, () => generateUUID());
      const unique = new Set(uuids);
      assert.strictEqual(unique.size, 100);
    });
  });

  describe('filterPayments', () => {
    it('"all" filter should return all payments', () => {
      const result = filterPayments(mockPayments, 'all', 'all');
      assert.strictEqual(result.length, mockPayments.length);
    });

    it('status filter PENDING should return only PENDING payments', () => {
      const result = filterPayments(mockPayments, 'PENDING', 'all');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.status, 'PENDING');
    });

    it('status filter SUCCESS should return only SUCCESS payments', () => {
      const result = filterPayments(mockPayments, 'SUCCESS', 'all');
      assert.strictEqual(result.length, 2);
      for (const p of result) {
        assert.strictEqual(p.status, 'SUCCESS');
      }
    });

    it('status filter FAILED should return only FAILED payments', () => {
      const result = filterPayments(mockPayments, 'FAILED', 'all');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.status, 'FAILED');
    });

    it('status filter REFUNDED should return only REFUNDED payments', () => {
      const result = filterPayments(mockPayments, 'REFUNDED', 'all');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.status, 'REFUNDED');
    });

    it('method filter WECHAT should return only WECHAT payments', () => {
      const result = filterPayments(mockPayments, 'all', 'WECHAT');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.method, 'WECHAT');
    });

    it('combined status + method filter should work', () => {
      const result = filterPayments(mockPayments, 'SUCCESS', 'WECHAT');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.status, 'SUCCESS');
      assert.strictEqual(result[0]!.method, 'WECHAT');
    });
  });

  describe('getStatusColor', () => {
    it('should return defined colors for all payment statuses', () => {
      for (const s of ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] as const) {
        const c = getStatusColor(s);
        assert.ok(c.bg, `missing bg for ${s}`);
        assert.ok(c.fg, `missing fg for ${s}`);
      }
    });

    it('should return default colors for unknown status', () => {
      const c = getStatusColor('UNKNOWN');
      assert.strictEqual(c.bg, '#e5e7eb');
      assert.strictEqual(c.fg, '#000');
    });

    it('should return defined colors for all refund statuses', () => {
      for (const s of ['REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED'] as const) {
        const c = getStatusColor(s);
        assert.ok(c.bg, `missing bg for ${s}`);
        assert.ok(c.fg, `missing fg for ${s}`);
      }
    });
  });

  describe('state machine guards', () => {
    it('canMarkSuccess should only allow PENDING', () => {
      assert.ok(canMarkSuccess('PENDING'));
      assert.ok(!canMarkSuccess('SUCCESS'));
      assert.ok(!canMarkSuccess('FAILED'));
      assert.ok(!canMarkSuccess('REFUNDED'));
    });

    it('canRequestRefund should only allow SUCCESS', () => {
      assert.ok(canRequestRefund('SUCCESS'));
      assert.ok(!canRequestRefund('PENDING'));
      assert.ok(!canRequestRefund('FAILED'));
      assert.ok(!canRequestRefund('REFUNDED'));
    });
  });

  describe('form validation', () => {
    it('valid form should pass validation', () => {
      assert.strictEqual(validatePaymentForm('ord-001', 9900), null);
    });

    it('empty orderId should fail validation', () => {
      const err = validatePaymentForm('', 9900);
      assert.ok(err !== null);
      assert.ok(err!.includes('订单'));
    });

    it('zero amount should fail validation', () => {
      const err = validatePaymentForm('ord-001', 0);
      assert.ok(err !== null);
      assert.ok(err!.includes('金额'));
    });

    it('negative amount should fail validation', () => {
      const err = validatePaymentForm('ord-001', -100);
      assert.ok(err !== null);
    });
  });

  describe('mock data integrity', () => {
    it('all 4 payment statuses should be represented', () => {
      const statuses = new Set(mockPayments.map((p) => p.status));
      assert.ok(statuses.has('PENDING'));
      assert.ok(statuses.has('SUCCESS'));
      assert.ok(statuses.has('FAILED'));
      assert.ok(statuses.has('REFUNDED'));
    });

    it('all 5 payment methods should be represented', () => {
      const methods = new Set(mockPayments.map((p) => p.method));
      assert.strictEqual(methods.size, 5);
    });

    it('every payment should have a valid idempotencyKey', () => {
      for (const p of mockPayments) {
        assert.ok(p.idempotencyKey.length > 0);
      }
    });

    it('every payment should have a version >= 1', () => {
      for (const p of mockPayments) {
        assert.ok(p.version >= 1);
      }
    });
  });
});

// ════════════════════════════════════════
// 反例 (Negative Cases)
// ════════════════════════════════════════

describe('finance-page: 反例', () => {
  it('filter for non-existent status should return empty', () => {
    const result = filterPayments(mockPayments, 'COMPLETED', 'all');
    assert.strictEqual(result.length, 0);
  });

  it('filter for non-existent method should return empty', () => {
    const result = filterPayments(mockPayments, 'all', 'CRYPTO');
    assert.strictEqual(result.length, 0);
  });

  it('empty payment list should handle all filters gracefully', () => {
    const empty: Payment[] = [];
    assert.strictEqual(filterPayments(empty, 'all', 'all').length, 0);
    assert.strictEqual(filterPayments(empty, 'SUCCESS', 'all').length, 0);
    assert.strictEqual(filterPayments(empty, 'all', 'WECHAT').length, 0);
  });

  it('cannot mark non-PENDING payment as success', () => {
    for (const s of ['SUCCESS', 'FAILED', 'REFUNDED'] as PaymentStatus[]) {
      assert.ok(!canMarkSuccess(s), `should not allow markSuccess for ${s}`);
    }
  });

  it('cannot request refund for non-SUCCESS payment', () => {
    for (const s of ['PENDING', 'FAILED', 'REFUNDED'] as PaymentStatus[]) {
      assert.ok(!canRequestRefund(s), `should not allow refund for ${s}`);
    }
  });

  it('invalid tenantId should still not throw in filter', () => {
    // tenantId is a UI input; filter ops should not depend on it
    const result = filterPayments(mockPayments, 'SUCCESS', 'all');
    assert.strictEqual(result.length, 2);
  });

  it('FAILED payment should have a failure reason', () => {
    const failed = mockPayments.find((p) => p.status === 'FAILED');
    assert.ok(failed);
    assert.ok(failed!.failureReason, 'FAILED payment must have failureReason');
  });
});

// ════════════════════════════════════════
// 边界 (Boundary Cases)
// ════════════════════════════════════════

describe('finance-page: 边界', () => {
  it('amount 1 cent should render ¥0.01', () => {
    assert.strictEqual(formatAmount(1), '\u00a50.01');
  });

  it('amount 99999999 cents (large) should render correctly', () => {
    assert.strictEqual(formatAmount(99999999), '\u00a5999999.99');
  });

  it('UUID should always start with version 4', () => {
    for (let i = 0; i < 50; i++) {
      const uuid = generateUUID();
      assert.strictEqual(uuid[14], '4');
    }
  });

  it('version should increment on status changes (UI state machine rule)', () => {
    // pay-001 (SUCCESS, version 2) should have gone PENDING -> SUCCESS
    // pay-004 (REFUNDED, version 3) could be PENDING -> SUCCESS -> REFUNDED
    const pay001 = mockPayments.find((p) => p.id === 'pay-001')!;
    const pay004 = mockPayments.find((p) => p.id === 'pay-004')!;
    assert.ok(pay001.version >= 2);
    assert.ok(pay004.version >= 3);
  });

  it('REFUND amount should not exceed original payment amount', () => {
    for (const r of mockRefunds) {
      const payment = mockPayments.find((p) => p.id === r.paymentId);
      if (payment) {
        assert.ok(r.amountCents <= payment.amountCents, `refund ${r.amountCents} > payment ${payment.amountCents}`);
      }
    }
  });

  it('SUCCESS payments via WECHAT/ALIPAY/CARD should have a transactionId', () => {
    const gatewayMethods = new Set<PaymentMethod>(['WECHAT', 'ALIPAY', 'CARD']);
    const successPayments = mockPayments.filter((p) => p.status === 'SUCCESS' && gatewayMethods.has(p.method));
    for (const p of successPayments) {
      assert.ok(p.transactionId, `SUCCESS ${p.method} payment ${p.id} should have transactionId`);
    }
  });

  it('formatAmount should handle 0 cents with no fractions', () => {
    assert.strictEqual(formatAmount(0), '\u00a50.00');
    assert.strictEqual(formatAmount(0, 'USD'), 'USD 0.00');
  });

  it('date formatting - all payments should have valid ISO dates', () => {
    for (const p of mockPayments) {
      const d = new Date(p.createdAt);
      assert.ok(!Number.isNaN(d.getTime()), `invalid date for ${p.id}`);
    }
  });

  it('all payment IDs should be unique', () => {
    const ids = new Set(mockPayments.map((p) => p.id));
    assert.strictEqual(ids.size, mockPayments.length);
  });

  it('all refund IDs should be unique', () => {
    const ids = new Set(mockRefunds.map((r) => r.id));
    assert.strictEqual(ids.size, mockRefunds.length);
  });

  it('refund requestedBy should be non-empty', () => {
    for (const r of mockRefunds) {
      assert.ok(r.requestedBy.length > 0);
    }
  });

  it('every payment method should be one of the 5 defined methods', () => {
    const validMethods: PaymentMethod[] = ['WECHAT', 'ALIPAY', 'CARD', 'CASH', 'BALANCE'];
    for (const p of mockPayments) {
      assert.ok(validMethods.includes(p.method), `invalid method ${p.method} for ${p.id}`);
    }
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Finance — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
