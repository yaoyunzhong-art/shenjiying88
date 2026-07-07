import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * finance-payment.entity.test.ts
 *
 * Payment + Refund + Audit Entry 实体定义单元测试。
 * 验证: 类型别名, interface 完整字段, 状态机枚举, 必填/可选字段, 边界条件。
 */

import assert from 'node:assert/strict'
import {
  type PaymentStatus,
  type PaymentMethod,
  type RefundStatus,
  type Payment,
  type Refund,
  type PaymentAuditEntry,
  type RefundAuditEntry,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type CreateRefundInput,
} from './finance-payment.entity'

describe('PaymentStatus / PaymentMethod / RefundStatus 字面量类型', () => {
  it('PaymentStatus: PENDING | SUCCESS | FAILED | REFUNDED', () => {
    const valid: PaymentStatus[] = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']
    assert.equal(valid.length, 4)
    assert.equal(valid[0], 'PENDING')
    assert.equal(valid[1], 'SUCCESS')
    assert.equal(valid[2], 'FAILED')
    assert.equal(valid[3], 'REFUNDED')
  })

  it('PaymentMethod: 5 种支付方式', () => {
    const valid: PaymentMethod[] = ['WECHAT', 'ALIPAY', 'CARD', 'CASH', 'BALANCE']
    assert.equal(valid.length, 5)
    assert.equal(valid[0], 'WECHAT')
    assert.equal(valid[1], 'ALIPAY')
    assert.equal(valid[2], 'CARD')
    assert.equal(valid[3], 'CASH')
    assert.equal(valid[4], 'BALANCE')
  })

  it('RefundStatus: REQUESTED | APPROVED | COMPLETED | REJECTED', () => {
    const valid: RefundStatus[] = ['REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED']
    assert.equal(valid.length, 4)
    assert.equal(valid[0], 'REQUESTED')
    assert.equal(valid[1], 'APPROVED')
    assert.equal(valid[2], 'COMPLETED')
    assert.equal(valid[3], 'REJECTED')
  })
})

describe('Payment interface', () => {
  const samplePayment: Payment = {
    id: 'pay-001',
    tenantId: 'tenant-game-center',
    orderId: 'order-42',
    amountCents: 5000,
    currency: 'CNY',
    method: 'WECHAT',
    status: 'PENDING',
    idempotencyKey: 'idem-abc-123',
    transactionId: undefined,
    failureReason: undefined,
    version: 1,
    metadata: { source: 'pos' },
    createdAt: '2026-06-30T08:00:00.000Z',
    updatedAt: '2026-06-30T08:00:00.000Z',
    successAt: undefined,
    failedAt: undefined,
    refundedAt: undefined,
  }

  it('T1: 完整创建 Payment 对象, 必填字段无误', () => {
    assert.equal(samplePayment.id, 'pay-001')
    assert.equal(samplePayment.tenantId, 'tenant-game-center')
    assert.equal(samplePayment.orderId, 'order-42')
    assert.equal(samplePayment.amountCents, 5000)
    assert.equal(samplePayment.currency, 'CNY')
    assert.equal(samplePayment.method, 'WECHAT')
    assert.equal(samplePayment.status, 'PENDING')
    assert.equal(samplePayment.idempotencyKey, 'idem-abc-123')
    assert.equal(samplePayment.version, 1)
  })

  it('T2: 金额以分为单位, 最小值 0', () => {
    const zeroPay: Payment = { ...samplePayment, id: 'pay-zero', amountCents: 0 }
    assert.equal(zeroPay.amountCents, 0)
  })

  it('T3: 大额金额正常赋值', () => {
    const bigPay: Payment = { ...samplePayment, id: 'pay-big', amountCents: 9_999_999_99 }
    assert.equal(bigPay.amountCents, 999999999)
  })

  it('T4: status 为 SUCCESS 时 successAt 必填语义 (类型正确)', () => {
    const successPay: Payment = {
      ...samplePayment,
      id: 'pay-success',
      status: 'SUCCESS',
      transactionId: 'txn-wechat-001',
      successAt: '2026-06-30T08:01:00.000Z',
    }
    assert.equal(successPay.status, 'SUCCESS')
    assert.equal(successPay.transactionId, 'txn-wechat-001')
    assert.equal(successPay.successAt, '2026-06-30T08:01:00.000Z')
  })

  it('T5: status 为 FAILED 时 failureReason 赋值', () => {
    const failedPay: Payment = {
      ...samplePayment,
      id: 'pay-failed',
      status: 'FAILED',
      failureReason: '余额不足',
      failedAt: '2026-06-30T08:02:00.000Z',
    }
    assert.equal(failedPay.status, 'FAILED')
    assert.equal(failedPay.failureReason, '余额不足')
    assert.equal(failedPay.failedAt, '2026-06-30T08:02:00.000Z')
  })

  it('T6: status 为 REFUNDED', () => {
    const refundedPay: Payment = {
      ...samplePayment,
      id: 'pay-refunded',
      status: 'REFUNDED',
      refundedAt: '2026-06-30T09:00:00.000Z',
    }
    assert.equal(refundedPay.status, 'REFUNDED')
    assert.equal(refundedPay.refundedAt, '2026-06-30T09:00:00.000Z')
  })

  it('T7: method 每种值均可', () => {
    for (const m of ['WECHAT', 'ALIPAY', 'CARD', 'CASH', 'BALANCE'] as const) {
      const p: Payment = { ...samplePayment, id: `pay-${m}`, method: m }
      assert.equal(p.method, m)
    }
  })

  it('T8: metadata 支持任意 JSON', () => {
    const withMeta: Payment = {
      ...samplePayment,
      id: 'pay-meta',
      metadata: { couponId: 'c-001', discount: 10, tags: ['promo'] },
    }
    assert.deepEqual(withMeta.metadata?.tags, ['promo'])
  })

  it('T9: currency 默认 CNY', () => {
    assert.equal(samplePayment.currency, 'CNY')
  })

  it('T10: version 乐观锁字段类型检查', () => {
    assert.equal(typeof samplePayment.version, 'number')
  })
})

describe('Refund interface', () => {
  const sampleRefund: Refund = {
    id: 'ref-001',
    tenantId: 'tenant-game-center',
    paymentId: 'pay-001',
    orderId: 'order-42',
    amountCents: 5000,
    reason: '商品质量问题',
    status: 'REQUESTED',
    version: 1,
    requestedBy: 'user-cashier-01',
    approvedBy: undefined,
    rejectedBy: undefined,
    rejectionReason: undefined,
    refundTransactionId: undefined,
    createdAt: '2026-06-30T08:30:00.000Z',
    updatedAt: '2026-06-30T08:30:00.000Z',
    requestedAt: '2026-06-30T08:30:00.000Z',
    approvedAt: undefined,
    completedAt: undefined,
    rejectedAt: undefined,
  }

  it('T11: 完整创建 Refund 对象, 必填字段无误', () => {
    assert.equal(sampleRefund.id, 'ref-001')
    assert.equal(sampleRefund.paymentId, 'pay-001')
    assert.equal(sampleRefund.amountCents, 5000)
    assert.equal(sampleRefund.reason, '商品质量问题')
    assert.equal(sampleRefund.status, 'REQUESTED')
    assert.equal(sampleRefund.requestedBy, 'user-cashier-01')
  })

  it('T12: 退款金额不超过支付金额', () => {
    assert.ok(sampleRefund.amountCents <= 5000)
  })

  it('T13: 退款状态机 APPROVED', () => {
    const approved: Refund = {
      ...sampleRefund,
      id: 'ref-approved',
      status: 'APPROVED',
      approvedBy: 'manager-01',
      approvedAt: '2026-06-30T08:35:00.000Z',
    }
    assert.equal(approved.status, 'APPROVED')
    assert.equal(approved.approvedBy, 'manager-01')
  })

  it('T14: 退款状态机 COMPLETED', () => {
    const completed: Refund = {
      ...sampleRefund,
      id: 'ref-completed',
      status: 'COMPLETED',
      refundTransactionId: 'wechat-ref-001',
      completedAt: '2026-06-30T08:40:00.000Z',
    }
    assert.equal(completed.status, 'COMPLETED')
    assert.equal(completed.refundTransactionId, 'wechat-ref-001')
  })

  it('T15: 退款状态机 REJECTED', () => {
    const rejected: Refund = {
      ...sampleRefund,
      id: 'ref-rejected',
      status: 'REJECTED',
      rejectedBy: 'finance-01',
      rejectionReason: '已超过退款期限',
      rejectedAt: '2026-06-30T08:45:00.000Z',
    }
    assert.equal(rejected.status, 'REJECTED')
    assert.equal(rejected.rejectedBy, 'finance-01')
    assert.equal(rejected.rejectionReason, '已超过退款期限')
  })

  it('T16: requestedAt 必须早于 approvedAt / completedAt', () => {
    const approved: Refund = {
      ...sampleRefund,
      id: 'ref-timing',
      status: 'APPROVED',
      approvedBy: 'manager',
      approvedAt: '2026-06-30T09:00:00.000Z',
    }
    assert.equal(approved.requestedAt < approved.approvedAt!, true)
  })
})

describe('PaymentAuditEntry interface', () => {
  it('T17: 支付创建审计条目标', () => {
    const entry: PaymentAuditEntry = {
      id: 'audit-pay-001',
      paymentId: 'pay-001',
      tenantId: 'tenant-game-center',
      action: 'CREATE',
      actor: 'system',
      detail: '订单 order-42 创建支付单',
      at: '2026-06-30T08:00:00.000Z',
    }
    assert.equal(entry.action, 'CREATE')
    assert.equal(entry.actor, 'system')
    assert.equal(entry.paymentId, 'pay-001')
  })

  it('T18: 支付状态变更审计包含 from/to', () => {
    const entry: PaymentAuditEntry = {
      id: 'audit-pay-002',
      paymentId: 'pay-001',
      tenantId: 'tenant-game-center',
      action: 'MARK_SUCCESS',
      fromStatus: 'PENDING',
      toStatus: 'SUCCESS',
      actor: 'payment-gateway',
      at: '2026-06-30T08:01:00.000Z',
    }
    assert.equal(entry.fromStatus, 'PENDING')
    assert.equal(entry.toStatus, 'SUCCESS')
    assert.equal(entry.action, 'MARK_SUCCESS')
  })

  it('T19: IDEMPOTENT_REUSE 幂等审计', () => {
    const entry: PaymentAuditEntry = {
      id: 'audit-pay-003',
      paymentId: 'pay-001',
      tenantId: 'tenant-game-center',
      action: 'IDEMPOTENT_REUSE',
      actor: 'payment-service',
      detail: '幂等键 idem-abc-123 已存在, 复用已有支付单',
      at: '2026-06-30T08:02:00.000Z',
    }
    assert.equal(entry.action, 'IDEMPOTENT_REUSE')
  })
})

describe('RefundAuditEntry interface', () => {
  it('T20: 退款请求审计', () => {
    const entry: RefundAuditEntry = {
      id: 'audit-ref-001',
      refundId: 'ref-001',
      paymentId: 'pay-001',
      tenantId: 'tenant-game-center',
      action: 'REQUEST',
      actor: 'user-cashier-01',
      detail: '申请退款 5000 分',
      at: '2026-06-30T08:30:00.000Z',
    }
    assert.equal(entry.action, 'REQUEST')
    assert.equal(entry.refundId, 'ref-001')
  })

  it('T21: 退款审批审计含状态变化', () => {
    const entry: RefundAuditEntry = {
      id: 'audit-ref-002',
      refundId: 'ref-001',
      paymentId: 'pay-001',
      tenantId: 'tenant-game-center',
      action: 'APPROVE',
      fromStatus: 'REQUESTED',
      toStatus: 'APPROVED',
      actor: 'manager-01',
      at: '2026-06-30T08:35:00.000Z',
    }
    assert.equal(entry.action, 'APPROVE')
    assert.equal(entry.fromStatus, 'REQUESTED')
    assert.equal(entry.toStatus, 'APPROVED')
  })

  it('T22: 退款拒绝审计', () => {
    const entry: RefundAuditEntry = {
      id: 'audit-ref-003',
      refundId: 'ref-001',
      paymentId: 'pay-001',
      tenantId: 'tenant-game-center',
      action: 'REJECT',
      fromStatus: 'REQUESTED',
      toStatus: 'REJECTED',
      actor: 'finance-01',
      detail: '已超过退款期限',
      at: '2026-06-30T08:45:00.000Z',
    }
    assert.equal(entry.action, 'REJECT')
    assert.equal(entry.toStatus, 'REJECTED')
  })
})

describe('CreatePaymentInput / UpdatePaymentInput / CreateRefundInput', () => {
  it('T23: CreatePaymentInput 必填字段', () => {
    const input: CreatePaymentInput = {
      tenantId: 'tenant-game-center',
      orderId: 'order-42',
      amountCents: 5000,
      method: 'ALIPAY',
      idempotencyKey: 'idem-uuid-xyz',
    }
    assert.equal(input.tenantId, 'tenant-game-center')
    assert.equal(input.orderId, 'order-42')
    assert.equal(input.amountCents, 5000)
    assert.equal(input.method, 'ALIPAY')
    assert.equal(input.idempotencyKey, 'idem-uuid-xyz')
  })

  it('T24: CreatePaymentInput 可选字段默认值', () => {
    const input: CreatePaymentInput = {
      tenantId: 'tenant-x',
      orderId: 'order-1',
      amountCents: 100,
      method: 'CASH',
      idempotencyKey: 'key-1',
    }
    assert.equal(input.currency, undefined)   // 可选
    assert.equal(input.metadata, undefined)   // 可选
  })

  it('T25: CreatePaymentInput 带可选字段', () => {
    const input: CreatePaymentInput = {
      tenantId: 'tenant-x',
      orderId: 'order-2',
      amountCents: 2000,
      method: 'BALANCE',
      idempotencyKey: 'key-2',
      currency: 'USD',
      metadata: { source: 'app' },
    }
    assert.equal(input.currency, 'USD')
    assert.deepEqual(input.metadata, { source: 'app' })
  })

  it('T26: UpdatePaymentInput 全部可选', () => {
    const input: UpdatePaymentInput = {
      transactionId: 'txn-001',
      failureReason: '超时',
    }
    assert.equal(input.transactionId, 'txn-001')
    assert.equal(input.failureReason, '超时')
  })

  it('T27: UpdatePaymentInput 仅更新 metadata', () => {
    const input: UpdatePaymentInput = {
      metadata: { retryCount: 2 },
    }
    assert.deepEqual(input.metadata, { retryCount: 2 })
  })

  it('T28: CreateRefundInput 必填字段', () => {
    const input: CreateRefundInput = {
      tenantId: 'tenant-x',
      paymentId: 'pay-001',
      orderId: 'order-42',
      amountCents: 5000,
      reason: '退货',
      requestedBy: 'user-01',
    }
    assert.equal(input.paymentId, 'pay-001')
    assert.equal(input.reason, '退货')
    assert.equal(input.requestedBy, 'user-01')
  })

  it('T29: CreateRefundInput 退款金额为 0 边界', () => {
    const input: CreateRefundInput = {
      tenantId: 'tenant-x',
      paymentId: 'pay-001',
      orderId: 'order-42',
      amountCents: 0,
      reason: '测试零退款',
      requestedBy: 'user-01',
    }
    assert.equal(input.amountCents, 0)
  })
})
