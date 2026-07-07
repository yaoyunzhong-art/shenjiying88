import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { TransactionRefundStatus } from './transactions.entity'
import { CashierOrderStatus, CashierPaymentStatus, CashierOrderCloseReason } from '../cashier/cashier.entity'
import { BlindboxFulfillmentStatus } from '../loyalty/loyalty.entity'
import {
  toTransactionRefundContract,
  toTransactionAggregateContract,
  toLytOrderSnapshotContract,
  toLytPaymentSnapshotContract,
  toMemberTransactionTimelineContract,
} from './transactions.contract'

const tenantCtx = { tenantId: 'tenant-demo', brandId: 'brand-demo', storeId: 'store-demo' }

// ---------------------------------------------------------------------------
// toTransactionRefundContract
// ---------------------------------------------------------------------------

it('toTransactionRefundContract maps pending refund', () => {
  const refund = {
    refundId: 'refund-1',
    tenantContext: tenantCtx,
    orderId: 'order-1',
    paymentId: 'payment-1',
    memberId: 'member-1',
    refundAmount: 99.8,
    reason: '客户不满意',
    operator: 'op-zhang',
    status: TransactionRefundStatus.Pending,
    requestedAt: '2026-06-23T08:00:00.000Z',
  }

  const contract = toTransactionRefundContract(refund)

  assert.equal(contract.refundId, 'refund-1')
  assert.equal(contract.tenantId, 'tenant-demo')
  assert.equal(contract.orderId, 'order-1')
  assert.equal(contract.paymentId, 'payment-1')
  assert.equal(contract.memberId, 'member-1')
  assert.equal(contract.refundAmount, 99.8)
  assert.equal(contract.reason, '客户不满意')
  assert.equal(contract.operator, 'op-zhang')
  assert.equal(contract.status, TransactionRefundStatus.Pending)
  assert.equal(contract.requestedAt, '2026-06-23T08:00:00.000Z')
  assert.equal(contract.completedAt, undefined)
  assert.equal(contract.reviewedAt, undefined)
  assert.equal(contract.reviewedBy, undefined)
  assert.equal(contract.reviewNote, undefined)
})

it('toTransactionRefundContract maps completed refund with review info', () => {
  const refund = {
    refundId: 'refund-2',
    tenantContext: tenantCtx,
    orderId: 'order-2',
    paymentId: 'payment-2',
    memberId: 'member-2',
    refundAmount: 50,
    reason: '价格错误',
    operator: 'op-li',
    status: TransactionRefundStatus.Completed,
    requestedAt: '2026-06-22T10:00:00.000Z',
    completedAt: '2026-06-22T10:30:00.000Z',
    reviewedAt: '2026-06-22T10:15:00.000Z',
    reviewedBy: 'admin-wang',
    reviewNote: '同意退款',
  }

  const contract = toTransactionRefundContract(refund)

  assert.equal(contract.status, TransactionRefundStatus.Completed)
  assert.equal(contract.completedAt, '2026-06-22T10:30:00.000Z')
  assert.equal(contract.reviewedAt, '2026-06-22T10:15:00.000Z')
  assert.equal(contract.reviewedBy, 'admin-wang')
  assert.equal(contract.reviewNote, '同意退款')
})

it('toTransactionRefundContract maps rejected refund', () => {
  const refund = {
    refundId: 'refund-3',
    tenantContext: tenantCtx,
    orderId: 'order-3',
    paymentId: 'payment-3',
    memberId: 'member-3',
    refundAmount: 200,
    reason: '重复购买',
    operator: undefined,
    status: TransactionRefundStatus.Rejected,
    requestedAt: '2026-06-21T12:00:00.000Z',
    reviewedAt: '2026-06-21T13:00:00.000Z',
    reviewedBy: 'admin-zhao',
    reviewNote: '不符合退款条件',
  }

  const contract = toTransactionRefundContract(refund)

  assert.equal(contract.status, TransactionRefundStatus.Rejected)
  assert.equal(contract.operator, undefined)
  assert.equal(contract.reviewNote, '不符合退款条件')
})

// ---------------------------------------------------------------------------
// toTransactionAggregateContract
// ---------------------------------------------------------------------------

it('toTransactionAggregateContract maps paid order without refunds', () => {
  const order = {
    orderId: 'order-1',
    tenantContext: tenantCtx,
    memberId: 'member-1',
    items: [{ skuId: 'sku-1', quantity: 1, price: 99 }],
    currency: 'CNY',
    totalAmount: 99,
    couponCode: 'COUPON10',
    blindboxPlanId: undefined,
    blindboxQuantity: undefined,
    status: 'PAID',
    latestPaymentId: 'payment-1',
    createdAt: '2026-06-23T08:00:00.000Z',
    updatedAt: '2026-06-23T08:05:00.000Z',
    paidAt: '2026-06-23T08:03:00.000Z',
    source: 'memory' as const,
  }

  const payment = {
    paymentId: 'payment-1',
    orderId: 'order-1',
    channel: 'wechat',
    amount: 99,
    status: 'SUCCEEDED',
    createdAt: '2026-06-23T08:02:00.000Z',
    updatedAt: '2026-06-23T08:03:00.000Z',
  }

  const aggregate = {
    order: order as any,
    payment: payment as any,
    settlement: undefined,
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: [] as any[],
  }

  const contract = toTransactionAggregateContract(aggregate)

  assert.equal(contract.orderId, 'order-1')
  assert.equal(contract.tenantId, 'tenant-demo')
  assert.equal(contract.memberId, 'member-1')
  assert.equal(contract.orderStatus, 'PAID')
  assert.equal(contract.paymentStatus, 'SUCCEEDED')
  assert.equal(contract.totalAmount, 99)
  assert.equal(contract.currency, 'CNY')
  assert.equal(contract.paidAmount, 99)
  assert.equal(contract.refundedAmount, 0)
  assert.equal(contract.refundStatus, undefined)
  assert.equal(contract.refundCount, 0)
  assert.equal(contract.couponCode, 'COUPON10')
  assert.equal(contract.blindboxPlanId, undefined)
})

it('toTransactionAggregateContract maps order with completed refund', () => {
  const order = {
    orderId: 'order-2',
    tenantContext: tenantCtx,
    memberId: 'member-2',
    items: [{ skuId: 'sku-2', quantity: 2, price: 50 }],
    currency: 'CNY',
    totalAmount: 100,
    couponCode: undefined,
    blindboxPlanId: 'plan-1',
    blindboxQuantity: 2,
    status: 'CLOSED',
    latestPaymentId: 'payment-2',
    createdAt: '2026-06-22T10:00:00.000Z',
    updatedAt: '2026-06-22T11:00:00.000Z',
    paidAt: '2026-06-22T10:30:00.000Z',
    source: 'memory' as const,
  }

  const payment = {
    paymentId: 'payment-2',
    orderId: 'order-2',
    channel: 'alipay',
    amount: 100,
    status: 'SUCCEEDED',
    createdAt: '2026-06-22T10:25:00.000Z',
    updatedAt: '2026-06-22T10:30:00.000Z',
  }

  const refund = {
    refundId: 'refund-1',
    tenantContext: tenantCtx,
    orderId: 'order-2',
    paymentId: 'payment-2',
    memberId: 'member-2',
    refundAmount: 100,
    reason: '质量问题',
    status: TransactionRefundStatus.Completed,
    requestedAt: '2026-06-22T10:35:00.000Z',
  }

  const aggregate = {
    order: order as any,
    payment: payment as any,
    settlement: undefined,
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: [refund as any],
  }

  const contract = toTransactionAggregateContract(aggregate)

  assert.equal(contract.orderId, 'order-2')
  assert.equal(contract.orderStatus, 'CLOSED')
  assert.equal(contract.totalAmount, 100)
  assert.equal(contract.paidAmount, 100)
  assert.equal(contract.refundedAmount, 100)
  assert.equal(contract.refundStatus, TransactionRefundStatus.Completed)
  assert.equal(contract.refundCount, 1)
  assert.equal(contract.blindboxPlanId, 'plan-1')
  assert.equal(contract.couponCode, undefined)
})

it('toTransactionAggregateContract maps pending refund not counted in refundedAmount', () => {
  const order = {
    orderId: 'order-3',
    tenantContext: tenantCtx,
    memberId: 'member-3',
    items: [{ skuId: 'sku-3', quantity: 1, price: 30 }],
    currency: 'CNY',
    totalAmount: 30,
    couponCode: undefined,
    blindboxPlanId: undefined,
    blindboxQuantity: undefined,
    status: 'PAID',
    latestPaymentId: 'payment-3',
    createdAt: '2026-06-23T09:00:00.000Z',
    updatedAt: '2026-06-23T09:05:00.000Z',
    paidAt: '2026-06-23T09:03:00.000Z',
    source: 'memory' as const,
  }

  const payment = {
    paymentId: 'payment-3',
    orderId: 'order-3',
    channel: 'unionpay',
    amount: 30,
    status: 'SUCCEEDED',
    createdAt: '2026-06-23T09:02:00.000Z',
    updatedAt: '2026-06-23T09:03:00.000Z',
  }

  const refund = {
    refundId: 'refund-pending',
    tenantContext: tenantCtx,
    orderId: 'order-3',
    paymentId: 'payment-3',
    memberId: 'member-3',
    refundAmount: 30,
    reason: '测试退款',
    status: TransactionRefundStatus.Pending,
    requestedAt: '2026-06-23T09:10:00.000Z',
  }

  const aggregate = {
    order: order as any,
    payment: payment as any,
    settlement: undefined,
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: [refund as any],
  }

  const contract = toTransactionAggregateContract(aggregate)

  // Pending refunds are NOT counted as refunded
  assert.equal(contract.refundedAmount, 0)
  assert.equal(contract.refundStatus, TransactionRefundStatus.Pending)
  assert.equal(contract.refundCount, 1)
  assert.equal(contract.orderStatus, 'PAID')
})

it('toTransactionAggregateContract handles missing payment', () => {
  const order = {
    orderId: 'order-4',
    tenantContext: tenantCtx,
    memberId: 'member-4',
    items: [{ skuId: 'sku-4', quantity: 1, price: 50 }],
    currency: 'CNY',
    totalAmount: 50,
    couponCode: undefined,
    blindboxPlanId: undefined,
    blindboxQuantity: undefined,
    status: 'CREATED',
    latestPaymentId: undefined,
    createdAt: '2026-06-23T10:00:00.000Z',
    updatedAt: '2026-06-23T10:00:00.000Z',
    paidAt: undefined,
    source: 'memory' as const,
  }

  const aggregate = {
    order: order as any,
    payment: undefined,
    settlement: undefined,
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: [] as any[],
  }

  const contract = toTransactionAggregateContract(aggregate)

  assert.equal(contract.orderId, 'order-4')
  assert.equal(contract.paymentStatus, undefined)
  assert.equal(contract.paidAmount, undefined)
  assert.equal(contract.refundedAmount, 0)
  assert.equal(contract.refundCount, 0)
})

// ---------------------------------------------------------------------------
// toLytOrderSnapshotContract
// ---------------------------------------------------------------------------

it('toLytOrderSnapshotContract maps snapshot from memory source', () => {
  const snapshot = {
    snapshotId: 'snap-order-1',
    tenantContext: tenantCtx,
    externalOrderId: 'ext-order-1',
    orderNo: 'NO20260623001',
    memberId: 'member-1',
    couponCode: 'CP10',
    amount: 100,
    discountAmount: 10,
    payableAmount: 90,
    currency: 'CNY',
    status: 'PAID',
    paidAt: '2026-06-23T08:00:00.000Z',
    updatedAtFromSource: '2026-06-23T08:05:00.000Z',
    source: 'memory' as const,
  }

  const contract = toLytOrderSnapshotContract(snapshot)

  assert.equal(contract.snapshotId, 'snap-order-1')
  assert.equal(contract.tenantId, 'tenant-demo')
  assert.equal(contract.externalOrderId, 'ext-order-1')
  assert.equal(contract.orderNo, 'NO20260623001')
  assert.equal(contract.memberId, 'member-1')
  assert.equal(contract.couponCode, 'CP10')
  assert.equal(contract.amount, 100)
  assert.equal(contract.discountAmount, 10)
  assert.equal(contract.payableAmount, 90)
  assert.equal(contract.currency, 'CNY')
  assert.equal(contract.status, 'PAID')
  assert.equal(contract.paidAt, '2026-06-23T08:00:00.000Z')
  assert.equal(contract.source, 'memory')
})

it('toLytOrderSnapshotContract maps snapshot from prisma source with optional fields omitted', () => {
  const snapshot = {
    snapshotId: 'snap-order-2',
    tenantContext: tenantCtx,
    externalOrderId: 'ext-order-2',
    orderNo: undefined,
    memberId: undefined,
    couponCode: undefined,
    amount: 50,
    discountAmount: 0,
    payableAmount: 50,
    currency: 'CNY',
    status: 'UPDATED',
    paidAt: undefined,
    updatedAtFromSource: '2026-06-22T12:00:00.000Z',
    source: 'prisma' as const,
  }

  const contract = toLytOrderSnapshotContract(snapshot)

  assert.equal(contract.snapshotId, 'snap-order-2')
  assert.equal(contract.orderNo, undefined)
  assert.equal(contract.memberId, undefined)
  assert.equal(contract.couponCode, undefined)
  assert.equal(contract.paidAt, undefined)
  assert.equal(contract.source, 'prisma')
  assert.equal(contract.payableAmount, 50)
})

it('toLytOrderSnapshotContract source defaults to memory when undefined', () => {
  const snapshot = {
    snapshotId: 'snap-order-3',
    tenantContext: tenantCtx,
    externalOrderId: 'ext-order-3',
    amount: 200,
    discountAmount: 20,
    payableAmount: 180,
    currency: 'CNY',
    status: 'PAID',
    updatedAtFromSource: '2026-06-23T09:00:00.000Z',
    source: undefined,
  }

  const contract = toLytOrderSnapshotContract(snapshot as any)

  assert.equal(contract.source, 'memory')
})

// ---------------------------------------------------------------------------
// toLytPaymentSnapshotContract
// ---------------------------------------------------------------------------

it('toLytPaymentSnapshotContract maps succeeded payment snapshot', () => {
  const snapshot = {
    snapshotId: 'snap-pay-1',
    tenantContext: tenantCtx,
    externalPaymentId: 'ext-pay-1',
    externalOrderId: 'ext-order-1',
    paymentChannel: 'wechat',
    paymentStatus: 'SUCCEEDED',
    amount: 99.8,
    currency: 'CNY',
    transactionNo: 'txn-001',
    paidAt: '2026-06-23T08:03:00.000Z',
    updatedAtFromSource: '2026-06-23T08:03:00.000Z',
    source: 'memory' as const,
  }

  const contract = toLytPaymentSnapshotContract(snapshot)

  assert.equal(contract.snapshotId, 'snap-pay-1')
  assert.equal(contract.tenantId, 'tenant-demo')
  assert.equal(contract.externalPaymentId, 'ext-pay-1')
  assert.equal(contract.externalOrderId, 'ext-order-1')
  assert.equal(contract.paymentChannel, 'wechat')
  assert.equal(contract.paymentStatus, 'SUCCEEDED')
  assert.equal(contract.amount, 99.8)
  assert.equal(contract.currency, 'CNY')
  assert.equal(contract.transactionNo, 'txn-001')
  assert.equal(contract.paidAt, '2026-06-23T08:03:00.000Z')
  assert.equal(contract.source, 'memory')
})

it('toLytPaymentSnapshotContract maps pending payment snapshot', () => {
  const snapshot = {
    snapshotId: 'snap-pay-2',
    tenantContext: tenantCtx,
    externalPaymentId: 'ext-pay-2',
    externalOrderId: 'ext-order-2',
    paymentChannel: undefined,
    paymentStatus: 'PENDING',
    amount: 150,
    currency: 'CNY',
    transactionNo: undefined,
    paidAt: undefined,
    updatedAtFromSource: '2026-06-23T10:00:00.000Z',
    source: 'prisma' as const,
  }

  const contract = toLytPaymentSnapshotContract(snapshot)

  assert.equal(contract.paymentStatus, 'PENDING')
  assert.equal(contract.paymentChannel, undefined)
  assert.equal(contract.transactionNo, undefined)
  assert.equal(contract.paidAt, undefined)
  assert.equal(contract.source, 'prisma')
})

// ---------------------------------------------------------------------------
// toMemberTransactionTimelineContract
// ---------------------------------------------------------------------------

it('toMemberTransactionTimelineContract maps paid entry with points and refund', () => {
  const entry = {
    orderId: 'order-1',
    memberId: 'member-1',
    status: CashierOrderStatus.Paid,
    paymentStatus: CashierPaymentStatus.Succeeded,
    totalAmount: 99.8,
    currency: 'CNY',
    awardedPoints: 99,
    refundedAmount: 0,
    refundStatus: undefined as TransactionRefundStatus | undefined,
    couponCode: 'COUPON10',
    blindboxPlanId: 'plan-1',
    blindboxStatus: BlindboxFulfillmentStatus.Fulfilled,
    closeReason: undefined as CashierOrderCloseReason | undefined,
    closedBy: undefined as string | undefined,
    closeNote: undefined as string | undefined,
    createdAt: '2026-06-23T08:00:00.000Z',
    updatedAt: '2026-06-23T08:05:00.000Z',
    paidAt: '2026-06-23T08:03:00.000Z',
    closedAt: undefined as string | undefined,
  }

  const contract = toMemberTransactionTimelineContract(entry)

  assert.equal(contract.orderId, 'order-1')
  assert.equal(contract.memberId, 'member-1')
  assert.equal(contract.status, 'PAID')
  assert.equal(contract.paymentStatus, 'SUCCEEDED')
  assert.equal(contract.totalAmount, 99.8)
  assert.equal(contract.currency, 'CNY')
  assert.equal(contract.awardedPoints, 99)
  assert.equal(contract.refundedAmount, 0)
  assert.equal(contract.refundStatus, undefined)
  assert.equal(contract.couponCode, 'COUPON10')
  assert.equal(contract.blindboxPlanId, 'plan-1')
  assert.equal(contract.blindboxStatus, 'FULFILLED')
  assert.equal(contract.paidAt, '2026-06-23T08:03:00.000Z')
  assert.equal(contract.closedAt, undefined)
})

it('toMemberTransactionTimelineContract maps closed entry with full refund', () => {
  const entry = {
    orderId: 'order-2',
    memberId: 'member-2',
    status: CashierOrderStatus.Closed,
    paymentStatus: CashierPaymentStatus.Succeeded,
    totalAmount: 200,
    currency: 'CNY',
    awardedPoints: 0,
    refundedAmount: 200,
    refundStatus: TransactionRefundStatus.Completed as TransactionRefundStatus,
    couponCode: undefined as string | undefined,
    blindboxPlanId: undefined as string | undefined,
    blindboxStatus: undefined as BlindboxFulfillmentStatus | undefined,
    closeReason: CashierOrderCloseReason.FullRefund,
    closedBy: 'system',
    closeNote: '全额退款自动关闭',
    createdAt: '2026-06-22T10:00:00.000Z',
    updatedAt: '2026-06-22T11:00:00.000Z',
    paidAt: '2026-06-22T10:30:00.000Z',
    closedAt: '2026-06-22T11:00:00.000Z',
  }

  const contract = toMemberTransactionTimelineContract(entry)

  assert.equal(contract.orderId, 'order-2')
  assert.equal(contract.status, 'CLOSED')
  assert.equal(contract.awardedPoints, 0)
  assert.equal(contract.refundedAmount, 200)
  assert.equal(contract.refundStatus, TransactionRefundStatus.Completed)
  assert.equal(contract.couponCode, undefined)
  assert.equal(contract.blindboxPlanId, undefined)
  assert.equal(contract.blindboxStatus, undefined)
  assert.equal(contract.closeReason, 'FULL_REFUND')
  assert.equal(contract.closedBy, 'system')
  assert.equal(contract.closeNote, '全额退款自动关闭')
  assert.equal(contract.closedAt, '2026-06-22T11:00:00.000Z')
})

it('toMemberTransactionTimelineContract maps entry with rejected refund', () => {
  const entry = {
    orderId: 'order-3',
    memberId: 'member-3',
    status: CashierOrderStatus.Paid,
    paymentStatus: CashierPaymentStatus.Succeeded,
    totalAmount: 50,
    currency: 'CNY',
    awardedPoints: 50,
    refundedAmount: 0,
    refundStatus: TransactionRefundStatus.Rejected as TransactionRefundStatus,
    couponCode: undefined as string | undefined,
    blindboxPlanId: undefined as string | undefined,
    blindboxStatus: undefined as BlindboxFulfillmentStatus | undefined,
    closeReason: undefined as CashierOrderCloseReason | undefined,
    closedBy: undefined as string | undefined,
    closeNote: undefined as string | undefined,
    createdAt: '2026-06-23T09:00:00.000Z',
    updatedAt: '2026-06-23T09:10:00.000Z',
    paidAt: '2026-06-23T09:05:00.000Z',
    closedAt: undefined as string | undefined,
  }

  const contract = toMemberTransactionTimelineContract(entry)

  assert.equal(contract.orderId, 'order-3')
  assert.equal(contract.status, 'PAID')
  assert.equal(contract.awardedPoints, 50)
  assert.equal(contract.refundedAmount, 0)
  assert.equal(contract.refundStatus, TransactionRefundStatus.Rejected)
  assert.equal(contract.closeReason, undefined)
  assert.equal(contract.closedBy, undefined)
})

it('toMemberTransactionTimelineContract maps entry without payment', () => {
  const entry = {
    orderId: 'order-4',
    memberId: 'member-4',
    status: CashierOrderStatus.Created,
    paymentStatus: undefined as CashierPaymentStatus | undefined,
    totalAmount: 30,
    currency: 'CNY',
    awardedPoints: 0,
    refundedAmount: 0,
    refundStatus: undefined as TransactionRefundStatus | undefined,
    couponCode: undefined as string | undefined,
    blindboxPlanId: undefined as string | undefined,
    blindboxStatus: undefined as BlindboxFulfillmentStatus | undefined,
    closeReason: undefined as CashierOrderCloseReason | undefined,
    closedBy: undefined as string | undefined,
    closeNote: undefined as string | undefined,
    createdAt: '2026-06-23T10:00:00.000Z',
    updatedAt: '2026-06-23T10:00:00.000Z',
    paidAt: undefined as string | undefined,
    closedAt: undefined as string | undefined,
  }

  const contract = toMemberTransactionTimelineContract(entry)

  assert.equal(contract.status, 'CREATED')
  assert.equal(contract.paymentStatus, undefined)
  assert.equal(contract.awardedPoints, 0)
  assert.equal(contract.paidAt, undefined)
})
