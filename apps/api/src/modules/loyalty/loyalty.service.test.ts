import assert from 'node:assert/strict'
import test, { beforeEach, describe } from 'node:test'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { CashierOrderStatus, CashierPaymentStatus, type CashierOrder, type CashierPayment } from '../cashier/cashier.entity'
import type { LytOrderSnapshot, LytPaymentSnapshot } from '../transactions/transactions.entity'
import {
  BlindboxFulfillmentStatus,
  CouponRedemptionStatus,
  LoyaltySettlementStatus
} from './loyalty.entity'
import { LoyaltyService } from './loyalty.service'

function createContext(): RequestTenantContext {
  return {
    tenantId: 'tenant-loyalty',
    brandId: 'brand-loyalty',
    storeId: 'store-loyalty'
  }
}

function createOrder(memberId = 'member-loyalty-1', suffix = '1'): CashierOrder {
  return {
    orderId: `order-loyalty-${suffix}`,
    tenantContext: createContext(),
    memberId,
    items: [{ skuId: 'sku-1', quantity: 1, price: 88 }],
    currency: 'CNY',
    totalAmount: 88,
    couponCode: 'COUPON-88',
    blindboxPlanId: 'blindbox-basic',
    blindboxQuantity: 1,
    status: CashierOrderStatus.Paid,
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z',
    source: 'memory'
  }
}

function createPayment(orderId = 'order-loyalty-1', suffix = '1'): CashierPayment {
  return {
    paymentId: `payment-loyalty-${suffix}`,
    orderId,
    channel: 'wechat-pay',
    amount: 88,
    status: CashierPaymentStatus.Succeeded,
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z'
  }
}

beforeEach(() => {
  resetMemberServiceTestState()
})

describe('LoyaltyService', () => {
  test('settlePaidOrder awards points, coupon redemption and blindbox fulfillment', async () => {
    const memberId = 'member-loyalty-paid'
    const order = createOrder(memberId, 'paid')
    const payment = createPayment(order.orderId, 'paid')
    const memberService = new MemberService()
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Loyalty User'
    })

    const service = new LoyaltyService(memberService)
    const settlement = await service.settlePaidOrder(order, payment)

    assert.equal(settlement.status, LoyaltySettlementStatus.Succeeded)
    assert.equal(settlement.awardedPoints, 88)
    assert.equal(service.listPointsLedger(createContext().tenantId).length >= 1, true)
    assert.equal(service.listCouponRedemptions(createContext().tenantId)[0]?.status, CouponRedemptionStatus.Redeemed)
    assert.equal(service.listBlindboxFulfillments(createContext().tenantId)[0]?.blindboxPlanId, 'blindbox-basic')
    assert.equal(memberService.getProfile(memberId)?.lifecycleStage, 'newly-paid')
    assert.ok(memberService.getProfile(memberId)?.tags?.includes('channel-wechat-pay'))
  })

  test('settleFailedOrder releases coupon and does not award points', async () => {
    const memberId = 'member-loyalty-failed'
    const order = createOrder(memberId, 'failed')
    const memberService = new MemberService()
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Loyalty User'
    })

    const service = new LoyaltyService(memberService)
    const payment = createPayment(order.orderId, 'failed')
    payment.status = CashierPaymentStatus.Failed
    const settlement = await service.settleFailedOrder(order, payment)

    assert.equal(settlement.status, LoyaltySettlementStatus.Failed)
    assert.equal(settlement.awardedPoints, 0)
    assert.equal(service.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, CouponRedemptionStatus.Released)
  })

  test('applyRefund rolls back points and releases coupon once', async () => {
    const memberId = 'member-loyalty-refund'
    const order = createOrder(memberId, 'refund')
    const payment = createPayment(order.orderId, 'refund')
    const memberService = new MemberService()
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Refund Loyalty User'
    })

    const service = new LoyaltyService(memberService)
    await service.settlePaidOrder(order, payment)

    const result = await service.applyRefund(order, payment, 40, {
      revokeBlindbox: false
    })
    const profile = memberService.getProfile(memberId)

    assert.equal(result.reversedPoints, 40)
    assert.equal(result.releasedCoupon, true)
    assert.equal(result.revokedBlindbox, false)
    assert.equal(profile?.points, 48)
    assert.equal(service.listPointsLedger(createContext().tenantId).slice(-1)[0]?.points, -40)
    assert.equal(service.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, CouponRedemptionStatus.Released)
    assert.equal(
      service.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.status,
      BlindboxFulfillmentStatus.Fulfilled
    )

    const second = await service.applyRefund(order, payment, 48, {
      revokeBlindbox: true
    })
    assert.equal(second.releasedCoupon, false)
    assert.equal(second.reversedPoints, 48)
    assert.equal(second.revokedBlindbox, true)
    assert.equal(memberService.getProfile(memberId)?.points, 0)
    assert.equal(
      service.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.status,
      BlindboxFulfillmentStatus.Revoked
    )
  })

  test('settlePaidOrderFromSnapshots consumes standard LYT snapshots and enriches profile tags', async () => {
    const memberId = 'member-loyalty-snapshot'
    const memberService = new MemberService()
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Snapshot Loyalty User'
    })
    const service = new LoyaltyService(memberService)
    const orderSnapshot: LytOrderSnapshot = {
      snapshotId: 'lyt-order-snapshot-1',
      tenantContext: createContext(),
      externalOrderId: 'lyt-order-1',
      orderNo: 'NO-1',
      memberId,
      couponCode: 'COUPON-LYT',
      blindboxPlanId: 'blindbox-pro',
      blindboxQuantity: 2,
      amount: 260,
      discountAmount: 10,
      payableAmount: 250,
      currency: 'CNY',
      status: 'PAID',
      paidAt: '2026-06-14T15:00:00.000Z',
      updatedAtFromSource: '2026-06-14T15:00:00.000Z',
      source: 'memory'
    }
    const paymentSnapshot: LytPaymentSnapshot = {
      snapshotId: 'lyt-payment-snapshot-1',
      tenantContext: createContext(),
      externalPaymentId: 'lyt-payment-1',
      externalOrderId: 'lyt-order-1',
      paymentChannel: 'alipay',
      paymentStatus: 'SUCCEEDED',
      amount: 250,
      currency: 'CNY',
      transactionNo: 'txn-1',
      paidAt: '2026-06-14T15:00:00.000Z',
      updatedAtFromSource: '2026-06-14T15:00:00.000Z',
      source: 'memory'
    }

    const settlement = await service.settlePaidOrderFromSnapshots(orderSnapshot, paymentSnapshot)

    assert.equal(settlement.status, LoyaltySettlementStatus.Succeeded)
    assert.equal(settlement.orderId, 'lyt-order-1')
    assert.equal(settlement.paymentId, 'lyt-payment-1')
    assert.equal(service.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.couponCode, 'COUPON-LYT')
    assert.equal(service.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.quantity, 2)
    assert.equal(memberService.getProfile(memberId)?.lifecycleStage, 'repeat-paid')
    assert.ok(memberService.getProfile(memberId)?.tags?.includes('source-lyt-snapshot'))
    assert.ok(memberService.getProfile(memberId)?.tags?.includes('channel-alipay'))
  })
})
