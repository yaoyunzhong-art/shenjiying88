/**
 * 🐜 自动: [loyalty] [D] entity spec 补全
 * 
 * 补全 loyalty entity 所有接口/枚举测试：
 * PointsLedgerEntry / CouponRedemption / BlindboxFulfillment / LoyaltyOrderSettlement
 * LoyaltySettlementStatus / CouponRedemptionStatus / BlindboxFulfillmentStatus
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  BlindboxFulfillmentStatus,
  CouponRedemptionStatus,
  LoyaltySettlementStatus,
  type BlindboxFulfillment,
  type CouponRedemption,
  type LoyaltyOrderSettlement,
  type PointsLedgerEntry
} from './loyalty.entity'

// ── 通用工厂 ──
const tenantCtx = { tenantId: 'tenant-test', brandId: 'brand-test', storeId: 'store-test' }
const nowISO = '2026-06-14T10:00:00.000Z'

// ── LoyaltySettlementStatus 枚举 ──
describe('LoyaltySettlementStatus enum', () => {
  test('Succeeded = "SUCCEEDED"', () => {
    assert.equal(LoyaltySettlementStatus.Succeeded, 'SUCCEEDED')
  })

  test('Failed = "FAILED"', () => {
    assert.equal(LoyaltySettlementStatus.Failed, 'FAILED')
  })

  test('only has 2 members', () => {
    const keys = Object.keys(LoyaltySettlementStatus).filter(k => isNaN(Number(k)))
    assert.equal(keys.length, 2)
  })
})

// ── CouponRedemptionStatus 枚举 ──
describe('CouponRedemptionStatus enum', () => {
  test('Redeemed = "REDEEMED"', () => {
    assert.equal(CouponRedemptionStatus.Redeemed, 'REDEEMED')
  })

  test('Released = "RELEASED"', () => {
    assert.equal(CouponRedemptionStatus.Released, 'RELEASED')
  })

  test('Redeemed and Released are distinct', () => {
    assert.notEqual(CouponRedemptionStatus.Redeemed, CouponRedemptionStatus.Released)
  })
})

// ── BlindboxFulfillmentStatus 枚举 ──
describe('BlindboxFulfillmentStatus enum', () => {
  test('Fulfilled = "FULFILLED"', () => {
    assert.equal(BlindboxFulfillmentStatus.Fulfilled, 'FULFILLED')
  })

  test('Skipped = "SKIPPED"', () => {
    assert.equal(BlindboxFulfillmentStatus.Skipped, 'SKIPPED')
  })

  test('Revoked = "REVOKED"', () => {
    assert.equal(BlindboxFulfillmentStatus.Revoked, 'REVOKED')
  })

  test('all 3 values are distinct', () => {
    const vals = [BlindboxFulfillmentStatus.Fulfilled, BlindboxFulfillmentStatus.Skipped, BlindboxFulfillmentStatus.Revoked]
    assert.equal(new Set(vals).size, 3)
  })
})

// ── PointsLedgerEntry 接口 ──
describe('PointsLedgerEntry', () => {
  test('正积分（获赠积分）形状', () => {
    const entry: PointsLedgerEntry = {
      entryId: 'points-entry-1',
      tenantContext: tenantCtx,
      memberId: 'member-1',
      orderId: 'order-1',
      paymentId: 'payment-1',
      points: 100,
      reason: 'cashier.payment-succeeded',
      createdAt: nowISO
    }
    assert.equal(entry.entryId, 'points-entry-1')
    assert.equal(entry.points, 100)
    assert.equal(entry.reason.includes('payment-succeeded'), true)
    assert.equal(entry.tenantContext.tenantId, 'tenant-test')
  })

  test('负积分（退款扣回）形状', () => {
    const entry: PointsLedgerEntry = {
      entryId: 'points-entry-2',
      tenantContext: tenantCtx,
      memberId: 'member-1',
      orderId: 'order-1',
      paymentId: 'payment-1',
      points: -40,
      reason: 'transaction.refund-completed',
      createdAt: nowISO
    }
    assert.equal(entry.points, -40)
    assert.equal(entry.reason, 'transaction.refund-completed')
  })

  test('字段完备性（共 8 字段）', () => {
    const entry: PointsLedgerEntry = {
      entryId: 'entry-id',
      tenantContext: tenantCtx,
      memberId: 'm1',
      orderId: 'o1',
      paymentId: 'p1',
      points: 1,
      reason: 'test',
      createdAt: nowISO
    }
    const keys = Object.keys(entry)
    assert.equal(keys.length, 8)
    assert.ok(keys.includes('entryId'))
    assert.ok(keys.includes('points'))
    assert.ok(keys.includes('reason'))
  })

  test('不同类型 tenant context 可分配', () => {
    const ctxWithMarket = { ...tenantCtx, marketCode: 'cn-mainland' }
    const entry: PointsLedgerEntry = {
      entryId: 'entry-with-market',
      tenantContext: ctxWithMarket,
      memberId: 'm1',
      orderId: 'o1',
      paymentId: 'p1',
      points: 50,
      reason: 'promotion',
      createdAt: nowISO
    }
    assert.equal(entry.tenantContext.marketCode, 'cn-mainland')
  })
})

// ── CouponRedemption 接口 ──
describe('CouponRedemption', () => {
  test('REDEEMED 状态', () => {
    const cr: CouponRedemption = {
      redemptionId: 'coupon-red-1',
      tenantContext: tenantCtx,
      orderId: 'order-1',
      paymentId: 'payment-1',
      memberId: 'member-1',
      couponCode: 'COUPON-2026',
      status: CouponRedemptionStatus.Redeemed,
      createdAt: nowISO
    }
    assert.equal(cr.status, 'REDEEMED')
    assert.equal(cr.couponCode, 'COUPON-2026')
    assert.equal(cr.memberId, 'member-1')
  })

  test('RELEASED 状态', () => {
    const cr: CouponRedemption = {
      redemptionId: 'coupon-red-2',
      tenantContext: tenantCtx,
      orderId: 'order-2',
      paymentId: 'payment-2',
      memberId: 'member-2',
      couponCode: 'COUPON-EXPIRED',
      status: CouponRedemptionStatus.Released,
      createdAt: nowISO
    }
    assert.equal(cr.status, 'RELEASED')
    assert.equal(cr.redemptionId, 'coupon-red-2')
  })

  test('字段完备性（共 8 字段）', () => {
    const cr: CouponRedemption = {
      redemptionId: 'id',
      tenantContext: tenantCtx,
      orderId: 'o1',
      paymentId: 'p1',
      memberId: 'm1',
      couponCode: 'C1',
      status: CouponRedemptionStatus.Redeemed,
      createdAt: nowISO
    }
    assert.equal(Object.keys(cr).length, 8)
  })

  test('同 order 可以有多个 coupon（不同 couponCode）', () => {
    const cr1: CouponRedemption = {
      redemptionId: 'r1', tenantContext: tenantCtx,
      orderId: 'order-shared', paymentId: 'p1', memberId: 'm1',
      couponCode: 'C-A', status: CouponRedemptionStatus.Redeemed, createdAt: nowISO
    }
    const cr2: CouponRedemption = {
      redemptionId: 'r2', tenantContext: tenantCtx,
      orderId: 'order-shared', paymentId: 'p1', memberId: 'm1',
      couponCode: 'C-B', status: CouponRedemptionStatus.Released, createdAt: nowISO
    }
    assert.equal(cr1.orderId, cr2.orderId)
    assert.notEqual(cr1.couponCode, cr2.couponCode)
    assert.notEqual(cr1.status, cr2.status)
  })
})

// ── BlindboxFulfillment 接口 ──
describe('BlindboxFulfillment', () => {
  test('FULFILLED 状态', () => {
    const bf: BlindboxFulfillment = {
      fulfillmentId: 'bf-1',
      tenantContext: tenantCtx,
      orderId: 'order-1',
      paymentId: 'payment-1',
      memberId: 'member-1',
      blindboxPlanId: 'blindbox-basic',
      quantity: 1,
      rewardSku: 'blindbox-basic-reward-1',
      status: BlindboxFulfillmentStatus.Fulfilled,
      createdAt: nowISO
    }
    assert.equal(bf.status, 'FULFILLED')
    assert.equal(bf.quantity, 1)
    assert.equal(bf.blindboxPlanId, 'blindbox-basic')
  })

  test('SKIPPED 状态', () => {
    const bf: BlindboxFulfillment = {
      fulfillmentId: 'bf-2',
      tenantContext: tenantCtx,
      orderId: 'order-2',
      paymentId: 'payment-2',
      memberId: 'member-2',
      blindboxPlanId: 'blindbox-premium',
      quantity: 2,
      rewardSku: 'blindbox-premium-reward-2',
      status: BlindboxFulfillmentStatus.Skipped,
      createdAt: nowISO
    }
    assert.equal(bf.status, 'SKIPPED')
    assert.equal(bf.quantity, 2)
  })

  test('REVOKED 状态（含 relatedFulfillmentId + reason）', () => {
    const bf: BlindboxFulfillment = {
      fulfillmentId: 'bf-3',
      tenantContext: tenantCtx,
      orderId: 'order-1',
      paymentId: 'payment-1',
      memberId: 'member-1',
      blindboxPlanId: 'blindbox-basic',
      quantity: 1,
      rewardSku: 'blindbox-basic-reward-1',
      status: BlindboxFulfillmentStatus.Revoked,
      relatedFulfillmentId: 'bf-1',
      reason: 'transaction.full-refund',
      createdAt: nowISO
    }
    assert.equal(bf.status, 'REVOKED')
    assert.equal(bf.relatedFulfillmentId, 'bf-1')
    assert.equal(bf.reason, 'transaction.full-refund')
  })

  test('可选字段 relatedFulfillmentId / reason 可缺省', () => {
    const bf: BlindboxFulfillment = {
      fulfillmentId: 'bf-4',
      tenantContext: tenantCtx,
      orderId: 'order-3',
      paymentId: 'payment-3',
      memberId: 'member-3',
      blindboxPlanId: 'bb-solo',
      quantity: 3,
      rewardSku: 'bb-solo-reward-3',
      status: BlindboxFulfillmentStatus.Fulfilled,
      createdAt: nowISO
    }
    assert.equal(bf.relatedFulfillmentId, undefined)
    assert.equal(bf.reason, undefined)
  })
})

// ── LoyaltyOrderSettlement 接口 ──
describe('LoyaltyOrderSettlement', () => {
  test('SUCCEEDED 结算', () => {
    const s: LoyaltyOrderSettlement = {
      settlementId: 'settlement-1',
      tenantContext: tenantCtx,
      orderId: 'order-1',
      paymentId: 'payment-1',
      memberId: 'member-1',
      status: LoyaltySettlementStatus.Succeeded,
      awardedPoints: 88,
      couponCode: 'COUPON-88',
      blindboxPlanId: 'blindbox-basic',
      createdAt: nowISO,
      updatedAt: nowISO
    }
    assert.equal(s.status, 'SUCCEEDED')
    assert.equal(s.awardedPoints, 88)
    assert.equal(s.createdAt, s.updatedAt)
  })

  test('FAILED 结算', () => {
    const s: LoyaltyOrderSettlement = {
      settlementId: 'settlement-2',
      tenantContext: tenantCtx,
      orderId: 'order-2',
      paymentId: 'payment-2',
      memberId: 'member-2',
      status: LoyaltySettlementStatus.Failed,
      awardedPoints: 0,
      createdAt: nowISO,
      updatedAt: nowISO
    }
    assert.equal(s.status, 'FAILED')
    assert.equal(s.awardedPoints, 0)
    assert.equal(s.couponCode, undefined)
    assert.equal(s.blindboxPlanId, undefined)
  })

  test('可选字段 couponCode / blindboxPlanId 可缺省', () => {
    const s: LoyaltyOrderSettlement = {
      settlementId: 'settlement-3',
      tenantContext: tenantCtx,
      orderId: 'order-3',
      paymentId: 'payment-3',
      memberId: 'member-3',
      status: LoyaltySettlementStatus.Succeeded,
      awardedPoints: 10,
      createdAt: nowISO,
      updatedAt: nowISO
    }
    assert.equal(s.couponCode, undefined)
    assert.equal(s.blindboxPlanId, undefined)
  })

  test('createdAt / updatedAt 可不同（重结算场景）', () => {
    const s: LoyaltyOrderSettlement = {
      settlementId: 'settlement-4',
      tenantContext: tenantCtx,
      orderId: 'order-4',
      paymentId: 'payment-4',
      memberId: 'member-4',
      status: LoyaltySettlementStatus.Succeeded,
      awardedPoints: 50,
      createdAt: '2026-06-14T08:00:00.000Z',
      updatedAt: '2026-06-14T10:00:00.000Z'
    }
    assert.notEqual(s.createdAt, s.updatedAt)
  })

  test('字段完备性（最多 11 字段含可选）', () => {
    const s: LoyaltyOrderSettlement = {
      settlementId: 'sid', tenantContext: tenantCtx,
      orderId: 'oid', paymentId: 'pid', memberId: 'mid',
      status: LoyaltySettlementStatus.Succeeded,
      awardedPoints: 1, couponCode: 'C', blindboxPlanId: 'B',
      createdAt: nowISO, updatedAt: nowISO
    }
    assert.equal(Object.keys(s).length, 11)
  })
})
