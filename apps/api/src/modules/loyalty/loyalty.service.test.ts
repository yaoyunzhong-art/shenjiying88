import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { CashierOrderStatus, CashierPaymentStatus, type CashierOrder, type CashierPayment } from '../cashier/cashier.entity'
import type { LytOrderSnapshot, LytPaymentSnapshot } from '../transactions/transactions.entity'
import {
  BlindboxQuotaExecutionMode,
  BlindboxRewardTier,
  BlindboxFulfillmentStatus,
  CouponDiscountType,
  CouponRedemptionStatus,
  LoyaltyPlanStatus,
  LoyaltySettlementStatus
} from './loyalty.entity'
import { LoyaltyService } from './loyalty.service'

function createFakeRedisService(initialQuota = 0) {
  let quota = initialQuota
  return {
    client: {
      status: 'ready',
      async set(_key: string, value: string, mode: string) {
        if (mode === 'NX') {
          quota = Number(value)
        }
        return 'OK'
      },
      async eval(_script: string, _keys: number, _key: string, quantity: string) {
        const requested = Number(quantity)
        if (quota < requested) {
          return [0, quota]
        }
        const before = quota
        quota -= requested
        return [1, before, quota]
      }
    }
  }
}

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
  LoyaltyService.prototype.resetLoyaltyStoresForTests()
})

describe('LoyaltyService', () => {
  it('settlePaidOrder awards points, coupon redemption and blindbox fulfillment', async () => {
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
    assert.equal(service.listBlindboxFulfillments(createContext().tenantId)[0]?.rewards?.length, 1)
    assert.equal(
      service.listBlindboxFulfillments(createContext().tenantId)[0]?.quotaExecutionMode,
      BlindboxQuotaExecutionMode.InMemoryFallback
    )
    assert.equal(memberService.getProfile(memberId)?.lifecycleStage, 'newly-paid')
    assert.ok(memberService.getProfile(memberId)?.tags?.includes('channel-wechat-pay'))
  })

  it('settlePaidOrder writes coupon redemption and order value metrics once', async () => {
    const memberId = 'member-loyalty-metrics'
    const order = createOrder(memberId, 'metrics')
    const payment = createPayment(order.orderId, 'metrics')
    const memberService = new MemberService()
    const metricsService = new MarketingMetricsService()
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Metrics User'
    })

    const service = new LoyaltyService(memberService, undefined, metricsService)
    await service.settlePaidOrder(order, payment)
    await service.settlePaidOrder(order, payment)

    const snapshot = metricsService.snapshot(createContext().tenantId)
    assert.equal(snapshot.couponRedemptionTotal, 1)
    assert.equal(snapshot.avgOrderValue, 88)
    assert.ok(metricsService.toPrometheus(createContext().tenantId).includes('order_value_count 1'))
  })

  it('settleFailedOrder releases coupon and does not award points', async () => {
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

  it('applyRefund rolls back points and releases coupon once', async () => {
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

  it('settlePaidOrderFromSnapshots consumes standard LYT snapshots and enriches profile tags', async () => {
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

  it('issueBlindboxFromPlan returns probability disclosure and applies hidden guarantee for full case', async () => {
    const memberId = 'member-loyalty-case'
    const memberService = new MemberService()
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Blindbox User'
    })
    const service = new LoyaltyService(memberService)
    const originalRandom = Math.random
    Math.random = () => 0

    try {
      const plan = service.registerBlindboxPlan({
        tenantContext: createContext(),
        blindboxPlanId: 'blindbox-case',
        title: 'Blindbox Case',
        unitPrice: 199,
        totalQuota: 24,
        rewardPool: [
          { sku: 'sku-s1', weight: 7, label: 'standard-1', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s2', weight: 7, label: 'standard-2', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s3', weight: 7, label: 'standard-3', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s4', weight: 7, label: 'standard-4', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s5', weight: 7, label: 'standard-5', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s6', weight: 7, label: 'standard-6', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s7', weight: 7, label: 'standard-7', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s8', weight: 7, label: 'standard-8', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s9', weight: 7, label: 'standard-9', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s10', weight: 7, label: 'standard-10', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-hot-1', weight: 10, label: 'hot-1', tier: BlindboxRewardTier.Hot },
          { sku: 'sku-hot-2', weight: 10, label: 'hot-2', tier: BlindboxRewardTier.Hot },
          { sku: 'sku-hidden', weight: 8, label: 'hidden', tier: BlindboxRewardTier.Hidden },
          { sku: 'sku-super', weight: 2, label: 'super', tier: BlindboxRewardTier.SuperHidden }
        ],
        caseGuarantee: {
          caseSize: 12,
          guaranteedTier: BlindboxRewardTier.Hidden,
          distinctRewards: true
        },
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })
      service.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, createContext().tenantId)
      const issued = service.issueBlindboxFromPlan({
        tenantContext: createContext(),
        memberId,
        planId: plan.blindboxPlanId,
        quantity: 12
      })

      assert.equal(plan.probabilityDisclosure?.length, 4)
      assert.deepEqual(plan.probabilityDisclosure, [
        { tier: BlindboxRewardTier.Standard, weight: 70, probabilityPct: 70 },
        { tier: BlindboxRewardTier.Hot, weight: 20, probabilityPct: 20 },
        { tier: BlindboxRewardTier.Hidden, weight: 8, probabilityPct: 8 },
        { tier: BlindboxRewardTier.SuperHidden, weight: 2, probabilityPct: 2 }
      ])
      assert.equal(issued.quantity, 12)
      assert.equal(issued.rewards?.length, 12)
      assert.equal(issued.guaranteeApplied, true)
      assert.equal(issued.quotaExecutionMode, BlindboxQuotaExecutionMode.InMemoryFallback)
      assert.ok(issued.auditLogId)
      assert.ok(issued.rewards?.some((reward) => reward.tier === BlindboxRewardTier.Hidden))
      assert.equal(new Set(issued.rewards?.map((reward) => reward.sku)).size, 12)
      const drawLogs = service.listBlindboxDrawAuditLogs(createContext().tenantId)
      assert.equal(drawLogs.length, 1)
      assert.equal(drawLogs[0]?.quotaBefore, 24)
      assert.equal(drawLogs[0]?.quotaAfter, 12)
      assert.equal(drawLogs[0]?.quotaExecutionMode, BlindboxQuotaExecutionMode.InMemoryFallback)
      assert.equal(drawLogs[0]?.auditLogId, issued.auditLogId)
      assert.ok(drawLogs[0]?.auditHash)
      assert.equal(drawLogs[0]?.previousAuditLogId, undefined)
      assert.equal(drawLogs[0]?.previousHash, undefined)
      const probabilityOverview = service.getBlindboxProbabilityOverview(plan.planId, createContext().tenantId)
      assert.ok(probabilityOverview)
      assert.equal(probabilityOverview?.recentDrawRecordTotal, 1)
      assert.equal(probabilityOverview?.historyLimitApplied, 10)
      assert.equal(probabilityOverview?.hasMoreRecentDrawRecords, false)
      assert.equal(probabilityOverview?.recentDrawRecords.length, 1)
      assert.equal(probabilityOverview?.recentDrawRecords[0]?.auditLogId, issued.auditLogId)
      assert.equal(service.getBlindboxDrawAuditIntegrityReport(createContext().tenantId).valid, true)
    } finally {
      Math.random = originalRandom
    }
  })

  it('registerBlindboxPlan rejects distinct case guarantee when reward pool lacks enough unique skus', () => {
    const memberService = new MemberService()
    const service = new LoyaltyService(memberService)

    let error: unknown
    try {
      service.registerBlindboxPlan({
        tenantContext: createContext(),
        blindboxPlanId: 'blindbox-distinct-invalid',
        title: 'Blindbox Distinct Invalid',
        unitPrice: 99,
        totalQuota: 12,
        rewardPool: [
          { sku: 'sku-s1', weight: 14, label: 'standard-1', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s2', weight: 14, label: 'standard-2', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s3', weight: 14, label: 'standard-3', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s4', weight: 14, label: 'standard-4', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-s5', weight: 14, label: 'standard-5', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-hot-1', weight: 20, label: 'hot-1', tier: BlindboxRewardTier.Hot },
          { sku: 'sku-hidden', weight: 8, label: 'hidden', tier: BlindboxRewardTier.Hidden },
          { sku: 'sku-super', weight: 2, label: 'super', tier: BlindboxRewardTier.SuperHidden }
        ],
        caseGuarantee: {
          caseSize: 12,
          guaranteedTier: BlindboxRewardTier.Hidden,
          distinctRewards: true
        },
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })
      assert.fail('expected distinct reward pool validation to fail')
    } catch (caught) {
      error = caught
    }
    assert.match((error as Error).message, /distinct sku count 8 cannot satisfy case guarantee size 12/i)
    assert.ok(error instanceof BadRequestException)
  })

  it('registerBlindboxPlan rejects invalid official four-tier probability distribution', () => {
    const memberService = new MemberService()
    const service = new LoyaltyService(memberService)

    let error: unknown
    try {
      service.registerBlindboxPlan({
        tenantContext: createContext(),
        blindboxPlanId: 'blindbox-probability-invalid',
        title: 'Blindbox Probability Invalid',
        unitPrice: 99,
        totalQuota: 12,
        rewardPool: [
          { sku: 'sku-standard', weight: 60, label: 'standard', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-hot', weight: 20, label: 'hot', tier: BlindboxRewardTier.Hot },
          { sku: 'sku-hidden', weight: 10, label: 'hidden', tier: BlindboxRewardTier.Hidden },
          { sku: 'sku-super', weight: 10, label: 'super', tier: BlindboxRewardTier.SuperHidden }
        ],
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })
      assert.fail('expected official probability validation to fail')
    } catch (caught) {
      error = caught
    }
    assert.match((error as Error).message, /official four-tier probability mismatch/i)
    assert.ok(error instanceof BadRequestException)
  })

  it('issueCouponFromPlan maps not-found and inactive-plan errors to business exceptions', () => {
    const memberService = new MemberService()
    const service = new LoyaltyService(memberService)

    let notFoundError: unknown
    try {
      service.issueCouponFromPlan({
        tenantContext: createContext(),
        memberId: 'member-loyalty-coupon',
        planId: 'coupon-missing'
      })
      assert.fail('expected missing coupon plan to fail')
    } catch (caught) {
      notFoundError = caught
    }
    assert.match((notFoundError as Error).message, /Coupon plan not found/i)
    assert.ok(notFoundError instanceof NotFoundException)

    const plan = service.registerCouponPlan({
      tenantContext: createContext(),
      code: 'COUPON-DRAFT',
      title: 'Draft Coupon',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 10,
      totalQuota: 10,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    let inactiveError: unknown
    try {
      service.issueCouponFromPlan({
        tenantContext: createContext(),
        memberId: 'member-loyalty-coupon',
        planId: plan.planId
      })
      assert.fail('expected inactive coupon plan to fail')
    } catch (caught) {
      inactiveError = caught
    }
    assert.match((inactiveError as Error).message, /Coupon plan is not active/i)
    assert.ok(inactiveError instanceof ConflictException)
  })

  it('issueCouponFromPlan writes coupon issued metric into tenant bucket', () => {
    const memberService = new MemberService()
    const metricsService = new MarketingMetricsService()
    const service = new LoyaltyService(memberService, undefined, metricsService)
    const plan = service.registerCouponPlan({
      tenantContext: createContext(),
      code: 'COUPON-METRIC',
      title: 'Metric Coupon',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 10,
      totalQuota: 10,
      perMemberLimit: 2,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    service.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, createContext().tenantId)

    service.issueCouponFromPlan({
      tenantContext: createContext(),
      memberId: 'member-loyalty-coupon-metrics',
      planId: plan.planId
    })

    const snapshot = metricsService.snapshot(createContext().tenantId)
    assert.equal(snapshot.couponIssuedTotal, 1)
  })

  it('issueBlindboxFromPlan maps missing-plan and insufficient-quota errors to business exceptions', () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-loyalty-conflict',
      tenantContext: createContext(),
      nickname: 'Conflict User'
    })
    const service = new LoyaltyService(memberService)

    let notFoundError: unknown
    try {
      service.issueBlindboxFromPlan({
        tenantContext: createContext(),
        memberId: 'member-loyalty-conflict',
        planId: 'blindbox-missing',
        quantity: 1
      })
      assert.fail('expected missing blindbox plan to fail')
    } catch (caught) {
      notFoundError = caught
    }
    assert.match((notFoundError as Error).message, /Blindbox plan not found/i)
    assert.ok(notFoundError instanceof NotFoundException)

    const plan = service.registerBlindboxPlan({
      tenantContext: createContext(),
      blindboxPlanId: 'blindbox-conflict',
      title: 'Blindbox Conflict',
      unitPrice: 49,
      totalQuota: 1,
      rewardPool: [{ sku: 'sku-std', weight: 1, label: 'standard', tier: BlindboxRewardTier.Standard }],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    service.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, createContext().tenantId)

    let quotaError: unknown
    try {
      service.issueBlindboxFromPlan({
        tenantContext: createContext(),
        memberId: 'member-loyalty-conflict',
        planId: plan.blindboxPlanId,
        quantity: 2
      })
      assert.fail('expected insufficient blindbox quota to fail')
    } catch (caught) {
      quotaError = caught
    }
    assert.match((quotaError as Error).message, /insufficient quota/i)
    assert.ok(quotaError instanceof ConflictException)
  })

  it('getBlindboxProbabilityOverview applies historyLimit and historyOffset when querying recent draw records', () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-loyalty-history',
      tenantContext: createContext(),
      nickname: 'History User'
    })
    const service = new LoyaltyService(memberService)
    const plan = service.registerBlindboxPlan({
      tenantContext: createContext(),
      blindboxPlanId: 'blindbox-history-limit',
      title: 'Blindbox History Limit',
      unitPrice: 49,
      totalQuota: 5,
      rewardPool: [{ sku: 'sku-std', weight: 1, label: 'standard', tier: BlindboxRewardTier.Standard }],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    service.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, createContext().tenantId)

    const first = service.issueBlindboxFromPlan({
      tenantContext: createContext(),
      memberId: 'member-loyalty-history',
      planId: plan.blindboxPlanId,
      quantity: 1
    })
    const second = service.issueBlindboxFromPlan({
      tenantContext: createContext(),
      memberId: 'member-loyalty-history',
      planId: plan.blindboxPlanId,
      quantity: 1
    })
    const third = service.issueBlindboxFromPlan({
      tenantContext: createContext(),
      memberId: 'member-loyalty-history',
      planId: plan.blindboxPlanId,
      quantity: 1
    })

    const overview = service.getBlindboxProbabilityOverview(plan.planId, createContext().tenantId, {
      historyOffset: 1,
      historyLimit: 1
    })
    assert.ok(overview)
    assert.equal(overview?.recentDrawRecordTotal, 3)
    assert.equal(overview?.historyLimitApplied, 1)
    assert.equal(overview?.hasMoreRecentDrawRecords, true)
    assert.equal(overview?.recentDrawRecords.length, 1)
    assert.equal(overview?.recentDrawRecords[0]?.auditLogId, second.auditLogId)
    assert.notEqual(overview?.recentDrawRecords[0]?.auditLogId, third.auditLogId)
    assert.notEqual(overview?.recentDrawRecords[0]?.auditLogId, first.auditLogId)
  })

  it('issueBlindboxFromPlanAtomically uses Redis Lua reservation when redis is ready', async () => {
    const memberId = 'member-loyalty-redis'
    const memberService = new MemberService()
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Redis Blindbox User'
    })
    const service = new LoyaltyService(memberService, createFakeRedisService(5) as any)
    const plan = service.registerBlindboxPlan({
      tenantContext: createContext(),
      blindboxPlanId: 'blindbox-redis',
      title: 'Blindbox Redis',
      unitPrice: 59,
      totalQuota: 5,
      rewardPool: [
        { sku: 'sku-std', weight: 90, label: 'standard', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-hidden', weight: 10, label: 'hidden', tier: BlindboxRewardTier.Hidden }
      ],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    service.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, createContext().tenantId)

    const issued = await service.issueBlindboxFromPlanAtomically({
      tenantContext: createContext(),
      memberId,
      planId: plan.blindboxPlanId,
      quantity: 2
    })

    assert.equal(issued.quotaExecutionMode, BlindboxQuotaExecutionMode.RedisLua)
    assert.equal(service.getBlindboxPlan(plan.planId, createContext().tenantId)?.remainingQuota, 3)
    assert.equal(service.listBlindboxDrawAuditLogs(createContext().tenantId)[0]?.quotaExecutionMode, BlindboxQuotaExecutionMode.RedisLua)
  })

  it('blindbox audit log builds a verifiable hash chain across draws', () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'member-loyalty-chain',
      tenantContext: createContext(),
      nickname: 'Chain User'
    })
    const service = new LoyaltyService(memberService)
    const plan = service.registerBlindboxPlan({
      tenantContext: createContext(),
      blindboxPlanId: 'blindbox-chain',
      title: 'Blindbox Chain',
      unitPrice: 29,
      totalQuota: 5,
      rewardPool: [
        { sku: 'sku-std', weight: 90, label: 'standard', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-hidden', weight: 10, label: 'hidden', tier: BlindboxRewardTier.Hidden }
      ],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    service.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, createContext().tenantId)

    const first = service.issueBlindboxFromPlan({
      tenantContext: createContext(),
      memberId: 'member-loyalty-chain',
      planId: plan.blindboxPlanId,
      quantity: 1
    })
    const second = service.issueBlindboxFromPlan({
      tenantContext: createContext(),
      memberId: 'member-loyalty-chain',
      planId: plan.blindboxPlanId,
      quantity: 1
    })

    const logs = service.listBlindboxDrawAuditLogs(createContext().tenantId)
    assert.equal(logs.length, 2)
    assert.equal(logs[0]?.auditLogId, second.auditLogId)
    assert.equal(logs[1]?.auditLogId, first.auditLogId)
    assert.equal(logs[0]?.previousAuditLogId, logs[1]?.auditLogId)
    assert.equal(logs[0]?.previousHash, logs[1]?.auditHash)

    const integrity = service.getBlindboxDrawAuditIntegrityReport(createContext().tenantId)
    assert.equal(integrity.valid, true)
    assert.equal(integrity.totalLogs, 2)
    assert.equal(integrity.lastAuditLogId, logs[0]?.auditLogId)
    assert.equal(integrity.lastHash, logs[0]?.auditHash)
  })
})
