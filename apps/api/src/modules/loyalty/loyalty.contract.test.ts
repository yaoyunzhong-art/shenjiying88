import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { BlindboxRewardTier } from './loyalty.entity'
import {
  toLoyaltySettlementContract,
  toPointsLedgerContract,
  toCouponRedemptionContract,
  toBlindboxFulfillmentContract,
  toCouponPlanContract,
  toBlindboxPlanContract,
  toLoyaltyOrderSummaryContract,
} from './loyalty.contract'
import {
  LoyaltySettlementStatus,
  CouponRedemptionStatus,
  BlindboxFulfillmentStatus,
  CouponDiscountType,
  LoyaltyPlanStatus,
  type LoyaltyOrderSettlement,
  type PointsLedgerEntry,
  type CouponRedemption,
  type BlindboxFulfillment,
  type CouponPlan,
  type BlindboxPlan,
} from './loyalty.entity'

// ── 辅助工厂 ──
function makeTenantCtx(tenantId = 'tenant-demo') {
  return {
    tenantId,
    marketCode: 'cn-mainland',
  }
}

function makeSettlement(
  overrides?: Partial<LoyaltyOrderSettlement>
): LoyaltyOrderSettlement {
  return {
    settlementId: 'settlement-001',
    tenantContext: makeTenantCtx(),
    orderId: 'order-001',
    paymentId: 'payment-001',
    memberId: 'member-001',
    status: LoyaltySettlementStatus.Succeeded,
    awardedPoints: 100,
    couponCode: 'SUMMER2026',
    blindboxPlanId: 'bb-bronze',
    createdAt: '2026-06-23T10:00:00.000Z',
    updatedAt: '2026-06-23T10:00:01.000Z',
    ...overrides,
  }
}

function makePointsEntry(
  overrides?: Partial<PointsLedgerEntry>
): PointsLedgerEntry {
  return {
    entryId: 'points-entry-001',
    tenantContext: makeTenantCtx(),
    memberId: 'member-001',
    orderId: 'order-001',
    paymentId: 'payment-001',
    points: 50,
    reason: '消费积分',
    createdAt: '2026-06-23T10:00:01.000Z',
    ...overrides,
  }
}

function makeCouponRedemption(
  overrides?: Partial<CouponRedemption>
): CouponRedemption {
  return {
    redemptionId: 'redeem-001',
    tenantContext: makeTenantCtx(),
    orderId: 'order-001',
    paymentId: 'payment-001',
    memberId: 'member-001',
    couponCode: 'SUMMER2026',
    status: CouponRedemptionStatus.Redeemed,
    createdAt: '2026-06-23T10:00:01.000Z',
    ...overrides,
  }
}

function makeBlindboxFulfillment(
  overrides?: Partial<BlindboxFulfillment>
): BlindboxFulfillment {
  return {
    fulfillmentId: 'ff-001',
    tenantContext: makeTenantCtx(),
    orderId: 'order-001',
    paymentId: 'payment-001',
    memberId: 'member-001',
    blindboxPlanId: 'bb-bronze',
    quantity: 3,
    rewardSku: 'bb-bronze-reward-1',
    status: BlindboxFulfillmentStatus.Fulfilled,
    createdAt: '2026-06-23T10:00:01.000Z',
    ...overrides,
  }
}

function makeCouponPlan(overrides?: Partial<CouponPlan>): CouponPlan {
  return {
    planId: 'plan-coupon-001',
    tenantContext: makeTenantCtx(),
    code: 'SUMMER2026',
    title: '夏季满减券',
    description: '满200减30元',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 30,
    minOrderAmount: 200,
    totalQuota: 1000,
    remainingQuota: 850,
    perMemberLimit: 3,
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2026-08-31T23:59:59.000Z',
    status: LoyaltyPlanStatus.Active,
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeBlindboxPlan(overrides?: Partial<BlindboxPlan>): BlindboxPlan {
  return {
    planId: 'plan-bb-001',
    tenantContext: makeTenantCtx(),
    blindboxPlanId: 'bb-bronze',
    title: '青铜盲盒',
    description: '保底青铜，有概率开出白银奖励',
    unitPrice: 30,
    totalQuota: 500,
    remainingQuota: 480,
    rewardPool: [
      { sku: 'reward-a', weight: 0.6, label: '10积分', tier: BlindboxRewardTier.Standard },
      { sku: 'reward-b', weight: 0.3, label: '优惠券5元', tier: BlindboxRewardTier.Standard },
      { sku: 'reward-c', weight: 0.1, label: '白银盲盒', tier: BlindboxRewardTier.Standard },
    ],
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
    status: LoyaltyPlanStatus.Active,
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

// ──────────── toLoyaltySettlementContract ────────────
describe('toLoyaltySettlementContract', () => {
  it('成功结算转换：保留核心字段、剥离 tenantContext', () => {
    const settlement = makeSettlement()
    const contract = toLoyaltySettlementContract(settlement)

    assert.equal(contract.settlementId, 'settlement-001')
    assert.equal(contract.orderId, 'order-001')
    assert.equal(contract.paymentId, 'payment-001')
    assert.equal(contract.memberId, 'member-001')
    assert.equal(contract.status, LoyaltySettlementStatus.Succeeded)
    assert.equal(contract.awardedPoints, 100)
    assert.equal(contract.couponCode, 'SUMMER2026')
    assert.equal(contract.blindboxPlanId, 'bb-bronze')
    assert.equal(contract.createdAt, '2026-06-23T10:00:00.000Z')
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
  })

  it('失败结算转换：status 为 FAILED 且 awardedPoints 可能为 0', () => {
    const settlement = makeSettlement({
      status: LoyaltySettlementStatus.Failed,
      awardedPoints: 0,
      couponCode: undefined,
      blindboxPlanId: undefined,
    })
    const contract = toLoyaltySettlementContract(settlement)

    assert.equal(contract.status, LoyaltySettlementStatus.Failed)
    assert.equal(contract.awardedPoints, 0)
    assert.equal(contract.couponCode, undefined)
    assert.equal(contract.blindboxPlanId, undefined)
  })

  it('结算合同 round-trip：转换后关键字段与原实体一致', () => {
    const settlement = makeSettlement()
    const contract = toLoyaltySettlementContract(settlement)

    assert.equal(contract.settlementId, settlement.settlementId)
    assert.equal(contract.orderId, settlement.orderId)
    assert.equal(contract.paymentId, settlement.paymentId)
    assert.equal(contract.memberId, settlement.memberId)
    assert.equal(contract.status, settlement.status)
    assert.equal(contract.awardedPoints, settlement.awardedPoints)
  })
})

// ──────────── toPointsLedgerContract ────────────
describe('toPointsLedgerContract', () => {
  it('积分账本条目转换：剥离 tenantContext', () => {
    const entry = makePointsEntry()
    const contract = toPointsLedgerContract(entry)

    assert.equal(contract.entryId, 'points-entry-001')
    assert.equal(contract.memberId, 'member-001')
    assert.equal(contract.orderId, 'order-001')
    assert.equal(contract.points, 50)
    assert.equal(contract.reason, '消费积分')
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
  })

  it('负积分条目（积分扣减）', () => {
    const entry = makePointsEntry({ points: -30, reason: '积分兑换扣减' })
    const contract = toPointsLedgerContract(entry)

    assert.equal(contract.points, -30)
    assert.equal(contract.reason, '积分兑换扣减')
  })

  it('零积分条目（边界）', () => {
    const entry = makePointsEntry({ points: 0, reason: '零积分记录' })
    const contract = toPointsLedgerContract(entry)

    assert.equal(contract.points, 0)
  })
})

// ──────────── toCouponRedemptionContract ────────────
describe('toCouponRedemptionContract', () => {
  it('已核销优惠券转换', () => {
    const redemption = makeCouponRedemption()
    const contract = toCouponRedemptionContract(redemption)

    assert.equal(contract.redemptionId, 'redeem-001')
    assert.equal(contract.couponCode, 'SUMMER2026')
    assert.equal(contract.status, CouponRedemptionStatus.Redeemed)
    assert.equal(contract.memberId, 'member-001')
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
  })

  it('已释放优惠券转换（订单取消后退还）', () => {
    const redemption = makeCouponRedemption({
      redemptionId: 'redeem-002',
      status: CouponRedemptionStatus.Released,
    })
    const contract = toCouponRedemptionContract(redemption)

    assert.equal(contract.status, CouponRedemptionStatus.Released)
  })
})

// ──────────── toBlindboxFulfillmentContract ────────────
describe('toBlindboxFulfillmentContract', () => {
  it('盲盒已兑现转换', () => {
    const fulfillment = makeBlindboxFulfillment()
    const contract = toBlindboxFulfillmentContract(fulfillment)

    assert.equal(contract.fulfillmentId, 'ff-001')
    assert.equal(contract.blindboxPlanId, 'bb-bronze')
    assert.equal(contract.quantity, 3)
    assert.equal(contract.rewardSku, 'bb-bronze-reward-1')
    assert.equal(contract.status, BlindboxFulfillmentStatus.Fulfilled)
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
  })

  it('盲盒已跳过转换（库存不足）', () => {
    const fulfillment = makeBlindboxFulfillment({
      fulfillmentId: 'ff-002',
      rewardSku: '',
      status: BlindboxFulfillmentStatus.Skipped,
    })
    const contract = toBlindboxFulfillmentContract(fulfillment)

    assert.equal(contract.status, BlindboxFulfillmentStatus.Skipped)
    assert.equal(contract.rewardSku, '')
  })

  it('盲盒已撤销转换', () => {
    const fulfillment = makeBlindboxFulfillment({
      fulfillmentId: 'ff-003',
      status: BlindboxFulfillmentStatus.Revoked,
    })
    const contract = toBlindboxFulfillmentContract(fulfillment)

    assert.equal(contract.status, BlindboxFulfillmentStatus.Revoked)
  })
})

// ──────────── toCouponPlanContract ────────────
describe('toCouponPlanContract', () => {
  it('优惠券计划转换：保留业务字段，剥离租户上下文', () => {
    const plan = makeCouponPlan()
    const contract = toCouponPlanContract(plan)

    assert.equal(contract.planId, 'plan-coupon-001')
    assert.equal(contract.code, 'SUMMER2026')
    assert.equal(contract.title, '夏季满减券')
    assert.equal(contract.discountType, CouponDiscountType.FixedAmount)
    assert.equal(contract.discountValue, 30)
    assert.equal(contract.minOrderAmount, 200)
    assert.equal(contract.totalQuota, 1000)
    assert.equal(contract.remainingQuota, 850)
    assert.equal(contract.perMemberLimit, 3)
    assert.equal(contract.status, LoyaltyPlanStatus.Active)
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
  })

  it('百分比折扣优惠券计划', () => {
    const plan = makeCouponPlan({
      planId: 'plan-coupon-pct',
      code: 'PCT10',
      title: '全场九折',
      discountType: CouponDiscountType.Percentage,
      discountValue: 10,
      minOrderAmount: undefined,
    })
    const contract = toCouponPlanContract(plan)

    assert.equal(contract.discountType, CouponDiscountType.Percentage)
    assert.equal(contract.discountValue, 10)
    assert.equal(contract.minOrderAmount, undefined)
  })

  it('已暂停优惠券计划', () => {
    const plan = makeCouponPlan({ status: LoyaltyPlanStatus.Paused })
    const contract = toCouponPlanContract(plan)

    assert.equal(contract.status, LoyaltyPlanStatus.Paused)
  })

  it('已过期优惠券计划', () => {
    const plan = makeCouponPlan({
      status: LoyaltyPlanStatus.Expired,
      remainingQuota: 0,
    })
    const contract = toCouponPlanContract(plan)

    assert.equal(contract.status, LoyaltyPlanStatus.Expired)
    assert.equal(contract.remainingQuota, 0)
  })
})

// ──────────── toBlindboxPlanContract ────────────
describe('toBlindboxPlanContract', () => {
  it('盲盒计划转换：剥离租户上下文和奖励池详情', () => {
    const plan = makeBlindboxPlan()
    const contract = toBlindboxPlanContract(plan)

    assert.equal(contract.planId, 'plan-bb-001')
    assert.equal(contract.blindboxPlanId, 'bb-bronze')
    assert.equal(contract.title, '青铜盲盒')
    assert.equal(contract.description, '保底青铜，有概率开出白银奖励')
    assert.equal(contract.unitPrice, 30)
    assert.equal(contract.totalQuota, 500)
    assert.equal(contract.remainingQuota, 480)
    assert.equal(contract.status, LoyaltyPlanStatus.Active)
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
    // @ts-expect-error rewardPool 不属于 contract (内部细节)
    assert.equal(contract.rewardPool, undefined)
  })

  it('草稿状态盲盒计划', () => {
    const plan = makeBlindboxPlan({ status: LoyaltyPlanStatus.Draft })
    const contract = toBlindboxPlanContract(plan)

    assert.equal(contract.status, LoyaltyPlanStatus.Draft)
  })
})

// ──────────── toLoyaltyOrderSummaryContract ────────────
describe('toLoyaltyOrderSummaryContract', () => {
  it('完整订单摘要：含结算、积分、核销、盲盒', () => {
    const settlement = makeSettlement()
    const summary = toLoyaltyOrderSummaryContract({
      settlement,
      pointsEntries: [makePointsEntry()],
      couponRedemptions: [makeCouponRedemption()],
      blindboxFulfillments: [makeBlindboxFulfillment()],
    })

    assert.equal(summary.orderId, 'order-001')
    assert.ok(summary.settlement)
    assert.equal(summary.settlement.awardedPoints, 100)
    assert.equal(summary.pointsEntries.length, 1)
    assert.equal(summary.pointsEntries[0].points, 50)
    assert.equal(summary.couponRedemptions.length, 1)
    assert.equal(summary.couponRedemptions[0].couponCode, 'SUMMER2026')
    assert.equal(summary.blindboxFulfillments.length, 1)
    assert.equal(summary.blindboxFulfillments[0].blindboxPlanId, 'bb-bronze')
  })

  it('订单摘要多条目：3 条积分记录 + 2 个盲盒兑现', () => {
    const settlement = makeSettlement()
    const summary = toLoyaltyOrderSummaryContract({
      settlement,
      pointsEntries: [
        makePointsEntry({ entryId: 'pe-1', points: 10 }),
        makePointsEntry({ entryId: 'pe-2', points: 20 }),
        makePointsEntry({ entryId: 'pe-3', points: 30 }),
      ],
      couponRedemptions: [],
      blindboxFulfillments: [
        makeBlindboxFulfillment({ fulfillmentId: 'ff-1' }),
        makeBlindboxFulfillment({ fulfillmentId: 'ff-2', rewardSku: 'bb-bronze-reward-2' }),
      ],
    })

    assert.equal(summary.pointsEntries.length, 3)
    assert.equal(summary.blindboxFulfillments.length, 2)
    assert.equal(summary.couponRedemptions.length, 0)
  })

  it('无结算时抛错', () => {
    assert.throws(
      () =>
        toLoyaltyOrderSummaryContract({
          settlement: undefined as unknown as LoyaltyOrderSettlement,
          pointsEntries: [],
          couponRedemptions: [],
          blindboxFulfillments: [],
        }),
      /Cannot build loyalty order summary without a settlement/
    )
  })

  it('空数组也能构建摘要', () => {
    const settlement = makeSettlement({ couponCode: undefined, blindboxPlanId: undefined })
    const summary = toLoyaltyOrderSummaryContract({
      settlement,
      pointsEntries: [],
      couponRedemptions: [],
      blindboxFulfillments: [],
    })

    assert.equal(summary.orderId, 'order-001')
    assert.equal(summary.pointsEntries.length, 0)
    assert.equal(summary.couponRedemptions.length, 0)
    assert.equal(summary.blindboxFulfillments.length, 0)
    assert.equal(summary.settlement?.couponCode, undefined)
  })
})
