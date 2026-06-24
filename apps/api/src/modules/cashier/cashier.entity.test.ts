import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  CashierOrderCloseReason,
  CashierOrderStatus,
  CashierPaymentStatus,
  computeCashierOrderTotal,
  type CashierOrder,
  type CashierPayment
} from './cashier.entity'

describe('cashier.entity', () => {
  test('computeCashierOrderTotal sums item price x quantity', () => {
    const total = computeCashierOrderTotal([
      { skuId: 'sku-1', quantity: 2, price: 30 },
      { skuId: 'sku-2', quantity: 1, price: 40 }
    ])

    assert.equal(total, 100)
  })

  test('CashierOrder contract supports pending payment shape', () => {
    const order: CashierOrder = {
      orderId: 'order-1',
      tenantContext: { tenantId: 'tenant-1' },
      memberId: 'member-1',
      items: [{ skuId: 'sku-1', quantity: 1, price: 50 }],
      currency: 'CNY',
      totalAmount: 50,
      couponCode: 'COUPON-1',
      blindboxPlanId: 'blindbox-basic',
      blindboxQuantity: 1,
      status: CashierOrderStatus.PendingPayment,
      createdAt: '2026-06-14T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z',
      closeReason: CashierOrderCloseReason.PaymentTimeout,
      closedBy: 'ops-user',
      closeNote: 'manual review',
      source: 'memory'
    }

    assert.equal(order.status, CashierOrderStatus.PendingPayment)
    assert.equal(order.couponCode, 'COUPON-1')
    assert.equal(order.closeReason, CashierOrderCloseReason.PaymentTimeout)
    assert.equal(order.closedBy, 'ops-user')
    assert.equal(order.closeNote, 'manual review')
  })

  test('CashierPayment contract supports succeeded shape', () => {
    const payment: CashierPayment = {
      paymentId: 'payment-1',
      orderId: 'order-1',
      channel: 'wechat-pay',
      amount: 50,
      status: CashierPaymentStatus.Succeeded,
      createdAt: '2026-06-14T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z'
    }

    assert.equal(payment.status, CashierPaymentStatus.Succeeded)
  })
})
