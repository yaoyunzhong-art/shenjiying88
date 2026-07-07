import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService } from '../member/member.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CashierOrderCloseReason,
  CashierOrderStatus,
  CashierPaymentStatus
} from './cashier.entity'
import { CashierService } from './cashier.service'
function createContext(): RequestTenantContext {
  return {
    tenantId: 'tenant-cashier',
    brandId: 'brand-cashier',
    storeId: 'store-cashier'
  }
}
describe('CashierService', () => {
  it('createOrder creates minimal cashier order for existing member', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-1',
      tenantContext: createContext(),
      nickname: 'Cashier User'
    })
    const service = new CashierService(memberService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-1',
      items: [
        { skuId: 'sku-1', quantity: 2, price: 30 },
        { skuId: 'sku-2', quantity: 1, price: 40 }
      ],
      currency: 'CNY'
    })
    assert.equal(order.status, CashierOrderStatus.Created)
    assert.equal(order.totalAmount, 100)
  })
  it('createPayment moves order into pending payment state', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-2',
      tenantContext: createContext(),
      nickname: 'Pending User'
    })
    const service = new CashierService(memberService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-2',
      items: [{ skuId: 'sku-1', quantity: 1, price: 88 }]
    })
    const payment = await service.createPayment(order.orderId, {
      channel: 'wechat-pay'
    })
    const storedOrder = service.getOrder(order.orderId, createContext())
    assert.equal(payment.status, CashierPaymentStatus.Pending)
    assert.equal(storedOrder?.status, CashierOrderStatus.PendingPayment)
    assert.equal(storedOrder?.latestPaymentId, payment.paymentId)
  })
  it('applyPaymentCallback marks payment succeeded and order paid', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-3',
      tenantContext: createContext(),
      nickname: 'Paid User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-3',
      items: [{ skuId: 'sku-1', quantity: 1, price: 66 }],
      couponCode: 'COUPON-66',
      blindboxPlanId: 'blindbox-pro',
      blindboxQuantity: 1
    })
    const payment = await service.createPayment(order.orderId, {
      channel: 'alipay',
      externalPaymentId: 'ext-paid-1'
    })
    const result = await service.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: 'agg-1',
      orderId: order.orderId,
      tenantId: createContext().tenantId,
      externalPaymentId: 'ext-paid-1',
      transactionNo: 'txn-1'
    })
    assert.equal(result.payment.paymentId, payment.paymentId)
    assert.equal(result.payment.status, CashierPaymentStatus.Succeeded)
    assert.equal(result.order.status, CashierOrderStatus.Paid)
    assert.equal(result.order.paidAt !== undefined, true)
    assert.equal(loyaltyService.listPointsLedger(createContext().tenantId).slice(-1)[0]?.points, 66)
    assert.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.couponCode, 'COUPON-66')
    assert.equal(loyaltyService.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.blindboxPlanId, 'blindbox-pro')
  })
  it('applyPaymentCallback can synthesize failed payment writeback', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-4',
      tenantContext: createContext(),
      nickname: 'Failed User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-4',
      items: [{ skuId: 'sku-1', quantity: 1, price: 120 }],
      couponCode: 'COUPON-FAIL'
    })
    const result = await service.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: 'agg-2',
      orderId: order.orderId,
      tenantId: createContext().tenantId,
      channel: 'mock-gateway',
      amount: 120
    })
    assert.equal(result.payment.status, CashierPaymentStatus.Failed)
    assert.equal(result.order.status, CashierOrderStatus.PaymentFailed)
    assert.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.couponCode, 'COUPON-FAIL')
  })
  it('closeTimedOutOrder closes pending payment order and releases coupon', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-timeout-1',
      tenantContext: createContext(),
      nickname: 'Timeout User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-timeout-1',
      items: [{ skuId: 'sku-1', quantity: 1, price: 45 }],
      couponCode: 'COUPON-TIMEOUT'
    })
    const payment = await service.createPayment(order.orderId, {
      channel: 'wechat-pay'
    })
    const result = await service.closeTimedOutOrder(order.orderId, createContext())
    assert.equal(result.order.status, CashierOrderStatus.Closed)
    assert.equal(result.order.closeReason, CashierOrderCloseReason.PaymentTimeout)
    assert.ok(result.order.closedAt)
    assert.equal(result.payment?.paymentId, payment.paymentId)
    assert.equal(result.payment?.status, CashierPaymentStatus.Failed)
    assert.equal(result.payment?.failureReason, 'Payment timed out')
    assert.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, 'RELEASED')
  })
  it('closeTimedOutOrder rejects paid order', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-timeout-2',
      tenantContext: createContext(),
      nickname: 'Timeout Reject User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-timeout-2',
      items: [{ skuId: 'sku-2', quantity: 1, price: 88 }]
    })
    await service.createPayment(order.orderId, {
      channel: 'alipay',
      externalPaymentId: 'timeout-paid'
    })
    await service.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: createContext().tenantId,
      externalPaymentId: 'timeout-paid',
      transactionNo: 'txn-timeout-paid'
    })
    await assert.rejects(
      () => service.closeTimedOutOrder(order.orderId, createContext()),
      /cannot be timeout-closed/
    )
  })
  it('closeOrder manually closes pending payment order with audit fields', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-manual-1',
      tenantContext: createContext(),
      nickname: 'Manual Close User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-manual-1',
      items: [{ skuId: 'sku-manual-1', quantity: 1, price: 77 }],
      couponCode: 'COUPON-MANUAL'
    })
    const payment = await service.createPayment(order.orderId, {
      channel: 'wechat-pay'
    })
    const result = await service.closeOrder(order.orderId, createContext(), {
      operator: 'ops-a',
      reason: 'customer-cancelled'
    })
    assert.equal(result.order.status, CashierOrderStatus.Closed)
    assert.equal(result.order.closeReason, CashierOrderCloseReason.ManualCancel)
    assert.equal(result.order.closedBy, 'ops-a')
    assert.equal(result.order.closeNote, 'customer-cancelled')
    assert.ok(result.order.closedAt)
    assert.equal(result.payment?.paymentId, payment.paymentId)
    assert.equal(result.payment?.status, CashierPaymentStatus.Failed)
    assert.equal(result.payment?.failureReason, 'Order manually closed')
    assert.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, 'RELEASED')
  })
  it('closeOrder manually closes created order without payment', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-manual-2',
      tenantContext: createContext(),
      nickname: 'Manual Created User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-manual-2',
      items: [{ skuId: 'sku-manual-2', quantity: 1, price: 33 }]
    })
    const result = await service.closeOrder(order.orderId, createContext(), {
      operator: 'ops-b',
      reason: 'inventory-blocked'
    })
    assert.equal(result.order.status, CashierOrderStatus.Closed)
    assert.equal(result.order.closeReason, CashierOrderCloseReason.ManualCancel)
    assert.equal(result.order.closedBy, 'ops-b')
    assert.equal(result.order.closeNote, 'inventory-blocked')
    assert.equal(result.payment, undefined)
  })
  it('closeOrder rejects paid order', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-manual-3',
      tenantContext: createContext(),
      nickname: 'Manual Reject User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-manual-3',
      items: [{ skuId: 'sku-manual-3', quantity: 1, price: 55 }]
    })
    await service.createPayment(order.orderId, {
      channel: 'alipay',
      externalPaymentId: 'manual-paid'
    })
    await service.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: createContext().tenantId,
      externalPaymentId: 'manual-paid',
      transactionNo: 'txn-manual-paid'
    })
    await assert.rejects(
      () =>
        service.closeOrder(order.orderId, createContext(), {
          operator: 'ops-c'
        }),
      /cannot be manually closed/
    )
  })
  it('applyPaymentCallback rejects already closed order', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-order-timeout-3',
      tenantContext: createContext(),
      nickname: 'Closed Order User'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const service = new CashierService(memberService, loyaltyService)
    const order = await service.createOrder(createContext(), {
      memberId: 'member-order-timeout-3',
      items: [{ skuId: 'sku-3', quantity: 1, price: 99 }]
    })
    await service.createPayment(order.orderId, {
      channel: 'wechat-pay',
      externalPaymentId: 'timeout-close-late'
    })
    await service.closeTimedOutOrder(order.orderId, createContext())
    await assert.rejects(
      () =>
        service.applyPaymentCallback({
          standardizedEventName: 'cashier.payment-succeeded',
          aggregateId: order.orderId,
          orderId: order.orderId,
          tenantId: createContext().tenantId,
          externalPaymentId: 'timeout-close-late',
          transactionNo: 'txn-late'
        }),
      /already closed/
    )
  })
})
