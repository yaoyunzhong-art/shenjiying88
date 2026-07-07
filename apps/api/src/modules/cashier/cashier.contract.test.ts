import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  CashierOrderCloseReason,
  CashierOrderStatus,
  CashierPaymentStatus,
} from './cashier.entity'
import {
  toCashierOrderContract,
  toCashierOrderItemContract,
  toCashierPaymentContract,
} from './cashier.contract'
const tenantCtx = { tenantId: 'tenant-demo', branchId: 'branch-demo', operatorId: 'op-1' }
it('toCashierOrderContract maps order including single item and status', () => {
  const order = {
    orderId: 'order-1',
    tenantContext: tenantCtx,
    memberId: 'member-1',
    items: [{ skuId: 'sku-1', title: '盲盒 A', quantity: 2, price: 49.9 }],
    currency: 'CNY',
    totalAmount: 99.8,
    couponCode: 'COUPON10',
    blindboxPlanId: 'plan-1',
    blindboxQuantity: 3,
    status: CashierOrderStatus.Paid,
    latestPaymentId: 'payment-1',
    createdAt: '2026-06-23T06:00:00.000Z',
    updatedAt: '2026-06-23T06:05:00.000Z',
    paidAt: '2026-06-23T06:03:00.000Z',
    closedAt: undefined,
    closeReason: undefined,
    closedBy: undefined,
    closeNote: undefined,
    source: 'memory' as const,
  }
  const contract = toCashierOrderContract(order)
  assert.equal(contract.orderId, 'order-1')
  assert.equal(contract.tenantId, 'tenant-demo')
  assert.equal(contract.memberId, 'member-1')
  assert.equal(contract.currency, 'CNY')
  assert.equal(contract.totalAmount, 99.8)
  assert.equal(contract.couponCode, 'COUPON10')
  assert.equal(contract.blindboxPlanId, 'plan-1')
  assert.equal(contract.blindboxQuantity, 3)
  assert.equal(contract.status, CashierOrderStatus.Paid)
  assert.equal(contract.latestPaymentId, 'payment-1')
  assert.equal(contract.paidAt, '2026-06-23T06:03:00.000Z')
  assert.equal(contract.source, 'memory')
  // items mapped
  assert.equal(contract.items.length, 1)
  assert.equal(contract.items[0].skuId, 'sku-1')
  assert.equal(contract.items[0].title, '盲盒 A')
  assert.equal(contract.items[0].quantity, 2)
  assert.equal(contract.items[0].price, 49.9)
  // optional undefined fields
  assert.equal(contract.closedAt, undefined)
  assert.equal(contract.closeReason, undefined)
  assert.equal(contract.closedBy, undefined)
  assert.equal(contract.closeNote, undefined)
})
it('toCashierOrderContract maps closed order with close details', () => {
  const order = {
    orderId: 'order-2',
    tenantContext: tenantCtx,
    memberId: 'member-2',
    items: [{ skuId: 'sku-2', title: '手办', quantity: 1, price: 150 }],
    currency: 'CNY',
    totalAmount: 150,
    couponCode: undefined,
    blindboxPlanId: undefined,
    blindboxQuantity: undefined,
    status: CashierOrderStatus.Closed,
    latestPaymentId: 'payment-2',
    createdAt: '2026-06-22T10:00:00.000Z',
    updatedAt: '2026-06-22T11:00:00.000Z',
    paidAt: undefined,
    closedAt: '2026-06-22T11:00:00.000Z',
    closeReason: CashierOrderCloseReason.PaymentTimeout,
    closedBy: 'system',
    closeNote: '超时自动关闭',
    source: 'memory' as const,
  }
  const contract = toCashierOrderContract(order)
  assert.equal(contract.orderId, 'order-2')
  assert.equal(contract.status, CashierOrderStatus.Closed)
  assert.equal(contract.closedAt, '2026-06-22T11:00:00.000Z')
  assert.equal(contract.closeReason, CashierOrderCloseReason.PaymentTimeout)
  assert.equal(contract.closedBy, 'system')
  assert.equal(contract.closeNote, '超时自动关闭')
  assert.equal(contract.paidAt, undefined)
  assert.equal(contract.items.length, 1)
  assert.equal(contract.items[0].skuId, 'sku-2')
  assert.equal(contract.items[0].price, 150)
})
it('toCashierOrderItemContract maps single item', () => {
  const item = { skuId: 'sku-x', title: 'T恤', quantity: 3, price: 99 }
  const contract = toCashierOrderItemContract(item)
  assert.equal(contract.skuId, 'sku-x')
  assert.equal(contract.title, 'T恤')
  assert.equal(contract.quantity, 3)
  assert.equal(contract.price, 99)
})
it('toCashierOrderItemContract omits title when undefined', () => {
  const item = { skuId: 'sku-y', quantity: 1, price: 25 }
  const contract = toCashierOrderItemContract(item)
  assert.equal(contract.skuId, 'sku-y')
  assert.equal(contract.title, undefined)
  assert.equal(contract.quantity, 1)
  assert.equal(contract.price, 25)
})
it('toCashierPaymentContract maps succeeded payment', () => {
  const payment = {
    paymentId: 'payment-1',
    orderId: 'order-1',
    externalPaymentId: 'ext-abc',
    channel: 'wechat',
    amount: 99.8,
    status: CashierPaymentStatus.Succeeded,
    transactionNo: 'txn-001',
    sourceEventName: 'cashier.payment-succeeded',
    failureReason: undefined,
    createdAt: '2026-06-23T06:02:00.000Z',
    updatedAt: '2026-06-23T06:03:00.000Z',
    completedAt: '2026-06-23T06:03:00.000Z',
  }
  const contract = toCashierPaymentContract(payment)
  assert.equal(contract.paymentId, 'payment-1')
  assert.equal(contract.orderId, 'order-1')
  assert.equal(contract.externalPaymentId, 'ext-abc')
  assert.equal(contract.channel, 'wechat')
  assert.equal(contract.amount, 99.8)
  assert.equal(contract.status, CashierPaymentStatus.Succeeded)
  assert.equal(contract.transactionNo, 'txn-001')
  assert.equal(contract.sourceEventName, 'cashier.payment-succeeded')
  assert.equal(contract.failureReason, undefined)
  assert.equal(contract.completedAt, '2026-06-23T06:03:00.000Z')
})
it('toCashierPaymentContract maps failed payment with failure reason', () => {
  const payment = {
    paymentId: 'payment-2',
    orderId: 'order-2',
    externalPaymentId: undefined,
    channel: 'alipay',
    amount: 150,
    status: CashierPaymentStatus.Failed,
    transactionNo: undefined,
    sourceEventName: 'cashier.payment-failed',
    failureReason: '余额不足',
    createdAt: '2026-06-22T10:00:00.000Z',
    updatedAt: '2026-06-22T11:00:00.000Z',
    completedAt: '2026-06-22T11:00:00.000Z',
  }
  const contract = toCashierPaymentContract(payment)
  assert.equal(contract.paymentId, 'payment-2')
  assert.equal(contract.channel, 'alipay')
  assert.equal(contract.status, CashierPaymentStatus.Failed)
  assert.equal(contract.failureReason, '余额不足')
  assert.equal(contract.externalPaymentId, undefined)
  assert.equal(contract.transactionNo, undefined)
  assert.equal(contract.sourceEventName, 'cashier.payment-failed')
})
it('toCashierPaymentContract maps pending payment', () => {
  const payment = {
    paymentId: 'payment-3',
    orderId: 'order-3',
    externalPaymentId: 'ext-pending',
    channel: 'unionpay',
    amount: 50,
    status: CashierPaymentStatus.Pending,
    transactionNo: undefined,
    sourceEventName: undefined,
    failureReason: undefined,
    createdAt: '2026-06-23T07:00:00.000Z',
    updatedAt: '2026-06-23T07:00:00.000Z',
    completedAt: undefined,
  }
  const contract = toCashierPaymentContract(payment)
  assert.equal(contract.status, CashierPaymentStatus.Pending)
  assert.equal(contract.completedAt, undefined)
  assert.equal(contract.sourceEventName, undefined)
  assert.equal(contract.failureReason, undefined)
  assert.equal(contract.transactionNo, undefined)
})
