/**
 * 🐜 自动: [loyalty] [D] controller spec 补全增强
 *
 * 原有覆盖 (保留): metadata 验证 / listPointsLedger / listCouponRedemptions /
 *   listBlindboxFulfillments / listSettlements / multi-tenant isolation / error resilience
 *
 * 新增 (此补全):
 *   - coupon-plans CRUD: registerCouponPlan / listCouponPlans / getCouponPlan / activateCouponPlan
 *   - blindbox-plans CRUD: registerBlindboxPlan / listBlindboxPlans / getBlindboxPlan / activateBlindboxPlan
 *   - issue coupon: issueCoupon (正例+反例+边界)
 *   - issue blindbox: issueBlindbox (正例+反例+边界)
 *   - 所有端点 metadata 验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { LoyaltyController } from './loyalty.controller'
import { LoyaltySettlementStatus, CouponRedemptionStatus, BlindboxFulfillmentStatus, LoyaltyPlanStatus, CouponDiscountType } from './loyalty.entity'

const makeMockService = (overrides: Record<string, (...args: any[]) => unknown> = {}) => ({
  listPointsLedger: () => [],
  listCouponRedemptions: () => [],
  listBlindboxFulfillments: () => [],
  listSettlements: () => [],
  registerCouponPlan: () => ({}),
  listCouponPlans: () => [],
  getCouponPlan: () => undefined,
  updateCouponPlanStatus: () => ({}),
  issueCouponFromPlan: () => ({}),
  registerBlindboxPlan: () => ({}),
  listBlindboxPlans: () => [],
  getBlindboxPlan: () => undefined,
  updateBlindboxPlanStatus: () => ({}),
  issueBlindboxFromPlan: () => ({}),
  ...overrides
}) as any

// ---------------------------------------------------------------------------
// Controller metadata
// ---------------------------------------------------------------------------
describe('LoyaltyController metadata', () => {
  test('controller path is loyalty', () => {
    const path = Reflect.getMetadata('path', LoyaltyController)
    assert.equal(path, 'loyalty')
  })

  test('listPointsLedger GET points-ledger', () => {
    const method = Reflect.getMetadata('method', LoyaltyController.prototype.listPointsLedger)
    const path = Reflect.getMetadata('path', LoyaltyController.prototype.listPointsLedger)
    assert.equal(method, 0)
    assert.equal(path, 'points-ledger')
  })

  test('listCouponRedemptions GET coupon-redemptions', () => {
    const method = Reflect.getMetadata('method', LoyaltyController.prototype.listCouponRedemptions)
    const path = Reflect.getMetadata('path', LoyaltyController.prototype.listCouponRedemptions)
    assert.equal(method, 0)
    assert.equal(path, 'coupon-redemptions')
  })

  test('listBlindboxFulfillments GET blindbox-fulfillments', () => {
    const method = Reflect.getMetadata('method', LoyaltyController.prototype.listBlindboxFulfillments)
    const path = Reflect.getMetadata('path', LoyaltyController.prototype.listBlindboxFulfillments)
    assert.equal(method, 0)
    assert.equal(path, 'blindbox-fulfillments')
  })

  test('listSettlements GET settlements', () => {
    const method = Reflect.getMetadata('method', LoyaltyController.prototype.listSettlements)
    const path = Reflect.getMetadata('path', LoyaltyController.prototype.listSettlements)
    assert.equal(method, 0)
    assert.equal(path, 'settlements')
  })
})

// ---------------------------------------------------------------------------
// listPointsLedger — positive cases
// ---------------------------------------------------------------------------
describe('LoyaltyController — listPointsLedger', () => {
  test('returns empty array when no points entries exist (boundary)', () => {
    const controller = new LoyaltyController(makeMockService({
      listPointsLedger: () => []
    }))
    const result = controller.listPointsLedger({ tenantId: 't-empty' })
    assert.deepEqual(result, [])
  })

  test('returns filtered points entries for tenant (positive)', () => {
    const entries = [
      { entryId: 'e1', tenantContext: { tenantId: 't1' }, memberId: 'm1', orderId: 'o1', paymentId: 'p1', points: 100, reason: 'purchase', createdAt: '2025-01-01' }
    ]
    const controller = new LoyaltyController(makeMockService({
      listPointsLedger: () => entries
    }))
    const result = controller.listPointsLedger({ tenantId: 't1' })
    assert.equal(result.length, 1)
    assert.equal(result[0].entryId, 'e1')
  })

  test('delegates tenantId to service (positive)', () => {
    let capturedTenant = ''
    const controller = new LoyaltyController(makeMockService({
      listPointsLedger: (id: string) => { capturedTenant = id; return [] }
    }))
    controller.listPointsLedger({ tenantId: 'tenant-X' })
    assert.equal(capturedTenant, 'tenant-X')
  })

  test('returns empty when tenant has no entries (boundary)', () => {
    const controller = new LoyaltyController(makeMockService({
      listPointsLedger: (_id: string) => []
    }))
    const result = controller.listPointsLedger({ tenantId: 'ghost-tenant' })
    assert.equal(result.length, 0)
  })
})

// ---------------------------------------------------------------------------
// listCouponRedemptions — positive & boundary
// ---------------------------------------------------------------------------
describe('LoyaltyController — listCouponRedemptions', () => {
  test('returns empty array when no coupon redemptions exist (boundary)', () => {
    const controller = new LoyaltyController(makeMockService({
      listCouponRedemptions: () => []
    }))
    const result = controller.listCouponRedemptions({ tenantId: 't-empty' })
    assert.deepEqual(result, [])
  })

  test('returns coupon redemptions for tenant (positive)', () => {
    const redemptions = [
      { redemptionId: 'cr1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', couponCode: 'COUPON-001', status: CouponRedemptionStatus.Redeemed, createdAt: '2025-01-01' }
    ]
    const controller = new LoyaltyController(makeMockService({
      listCouponRedemptions: () => redemptions
    }))
    const result = controller.listCouponRedemptions({ tenantId: 't1' })
    assert.equal(result.length, 1)
    assert.equal(result[0].couponCode, 'COUPON-001')
  })

  test('respects tenant isolation (negative-like boundary)', () => {
    const controller = new LoyaltyController(makeMockService({
      listCouponRedemptions: (id: string) => id === 't2' ? [{ redemptionId: 'cr2', tenantContext: { tenantId: 't2' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', couponCode: 'COUPON-002', status: CouponRedemptionStatus.Released, createdAt: '2025-01-01' }] : []
    }))
    const result1 = controller.listCouponRedemptions({ tenantId: 't1' })
    const result2 = controller.listCouponRedemptions({ tenantId: 't2' })
    assert.equal(result1.length, 0)
    assert.equal(result2.length, 1)
    assert.equal(result2[0].redemptionId, 'cr2')
  })
})

// ---------------------------------------------------------------------------
// listBlindboxFulfillments — positive & boundary
// ---------------------------------------------------------------------------
describe('LoyaltyController — listBlindboxFulfillments', () => {
  test('returns empty array when no blindbox fulfillments exist (boundary)', () => {
    const controller = new LoyaltyController(makeMockService({
      listBlindboxFulfillments: () => []
    }))
    const result = controller.listBlindboxFulfillments({ tenantId: 't-empty' })
    assert.deepEqual(result, [])
  })

  test('returns blindbox fulfillments for tenant (positive)', () => {
    const fulfillments = [
      { fulfillmentId: 'bf1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', blindboxPlanId: 'plan-1', quantity: 2, rewardSku: 'sku-1', status: BlindboxFulfillmentStatus.Fulfilled, createdAt: '2025-01-01' }
    ]
    const controller = new LoyaltyController(makeMockService({
      listBlindboxFulfillments: () => fulfillments
    }))
    const result = controller.listBlindboxFulfillments({ tenantId: 't1' })
    assert.equal(result.length, 1)
    assert.equal(result[0].blindboxPlanId, 'plan-1')
    assert.equal(result[0].quantity, 2)
  })

  test('handles multiple fulfillments for same tenant (boundary)', () => {
    const fulfillments = [
      { fulfillmentId: 'bf1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', blindboxPlanId: 'plan-1', quantity: 1, rewardSku: 'sku-1', status: BlindboxFulfillmentStatus.Fulfilled, createdAt: '2025-01-01' },
      { fulfillmentId: 'bf2', tenantContext: { tenantId: 't1' }, orderId: 'o2', paymentId: 'p2', memberId: 'm2', blindboxPlanId: 'plan-2', quantity: 3, rewardSku: 'sku-2', status: BlindboxFulfillmentStatus.Skipped, createdAt: '2025-01-02' }
    ]
    const controller = new LoyaltyController(makeMockService({
      listBlindboxFulfillments: () => fulfillments
    }))
    const result = controller.listBlindboxFulfillments({ tenantId: 't1' })
    assert.equal(result.length, 2)
  })
})

// ---------------------------------------------------------------------------
// listSettlements — positive & boundary
// ---------------------------------------------------------------------------
describe('LoyaltyController — listSettlements', () => {
  test('returns empty array when no settlements exist (boundary)', () => {
    const controller = new LoyaltyController(makeMockService({
      listSettlements: () => []
    }))
    const result = controller.listSettlements({ tenantId: 't-empty' })
    assert.deepEqual(result, [])
  })

  test('returns settlements for tenant (positive)', () => {
    const settlements = [
      { settlementId: 's1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', status: LoyaltySettlementStatus.Succeeded, awardedPoints: 50, createdAt: '2025-01-01', updatedAt: '2025-01-01' }
    ]
    const controller = new LoyaltyController(makeMockService({
      listSettlements: () => settlements
    }))
    const result = controller.listSettlements({ tenantId: 't1' })
    assert.equal(result.length, 1)
    assert.equal(result[0].settlementId, 's1')
    assert.equal(result[0].status, LoyaltySettlementStatus.Succeeded)
    assert.equal(result[0].awardedPoints, 50)
  })

  test('returns empty for different tenant (boundary)', () => {
    const controller = new LoyaltyController(makeMockService({
      listSettlements: (id: string) => id === 't-a' ? [{ settlementId: 's1', tenantContext: { tenantId: 't-a' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', status: LoyaltySettlementStatus.Failed, awardedPoints: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01' }] : []
    }))
    const result = controller.listSettlements({ tenantId: 't-other' })
    assert.equal(result.length, 0)
  })

  test('handles settlement with all fields populated (boundary)', () => {
    const settlement = {
      settlementId: 's-full', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1',
      memberId: 'm1', status: LoyaltySettlementStatus.Succeeded, awardedPoints: 999,
      couponCode: 'COUPON-FULL', blindboxPlanId: 'plan-full',
      createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z'
    }
    const controller = new LoyaltyController(makeMockService({
      listSettlements: () => [settlement]
    }))
    const result = controller.listSettlements({ tenantId: 't1' })
    assert.equal(result.length, 1)
    assert.equal(result[0].couponCode, 'COUPON-FULL')
    assert.equal(result[0].blindboxPlanId, 'plan-full')
    assert.equal(result[0].awardedPoints, 999)
  })
})

// ---------------------------------------------------------------------------
// Cross-endpoint multi-tenant isolation
// ---------------------------------------------------------------------------
describe('LoyaltyController — multi-tenant isolation', () => {
  test('each endpoint respects different tenant contexts', () => {
    const pointsEntries = [
      { entryId: 'e-t1', tenantContext: { tenantId: 't1' }, memberId: 'm1', orderId: 'o1', paymentId: 'p1', points: 10, reason: 'test', createdAt: '2025-01-01' }
    ]
    const redemptionEntries = [
      { redemptionId: 'cr-t2', tenantContext: { tenantId: 't2' }, orderId: 'o2', paymentId: 'p2', memberId: 'm2', couponCode: 'C2', status: CouponRedemptionStatus.Redeemed, createdAt: '2025-01-01' }
    ]
    const controller = new LoyaltyController(makeMockService({
      listPointsLedger: (id: string) => id === 't1' ? pointsEntries : [],
      listCouponRedemptions: (id: string) => id === 't2' ? redemptionEntries : [],
      listBlindboxFulfillments: () => [],
      listSettlements: () => []
    }))

    assert.equal(controller.listPointsLedger({ tenantId: 't1' }).length, 1)
    assert.equal(controller.listPointsLedger({ tenantId: 't2' }).length, 0)
    assert.equal(controller.listCouponRedemptions({ tenantId: 't1' }).length, 0)
    assert.equal(controller.listCouponRedemptions({ tenantId: 't2' }).length, 1)
  })
})

// ---------------------------------------------------------------------------
// Error resilience — service throws
// ---------------------------------------------------------------------------
describe('LoyaltyController — error resilience', () => {
  test('listPointsLedger propagates service error', () => {
    const controller = new LoyaltyController(makeMockService({
      listPointsLedger: () => { throw new Error('db unavailable') }
    }))
    assert.throws(
      () => controller.listPointsLedger({ tenantId: 't1' }),
      /db unavailable/
    )
  })

  test('listSettlements propagates service error', () => {
    const controller = new LoyaltyController(makeMockService({
      listSettlements: () => { throw new Error('timeout') }
    }))
    assert.throws(
      () => controller.listSettlements({ tenantId: 't1' }),
      /timeout/
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 🐜 新增补全: coupon-plans CRUD
// ══════════════════════════════════════════════════════════════

describe('LoyaltyController — coupon-plans CRUD', () => {
  const tenantCtx = { tenantId: 't-coupon' }

  test('[正例] registerCouponPlan 创建优惠券计划并返回结果', () => {
    const plan = { planId: 'cp-new', code: 'NEW-COUPON', title: '新用户优惠', description: '首单立减', discountType: CouponDiscountType.FixedAmount, discountValue: 10, minOrderAmount: 50, totalQuota: 100, perMemberLimit: 1, validFrom: '2025-06-01', validUntil: '2025-12-31', status: LoyaltyPlanStatus.Active }
    const controller = new LoyaltyController(makeMockService({
      registerCouponPlan: () => plan
    }))
    const body = { code: 'NEW-COUPON', title: '新用户优惠', description: '首单立减', discountType: CouponDiscountType.FixedAmount, discountValue: 10, minOrderAmount: 50, totalQuota: 100, perMemberLimit: 1, validFrom: '2025-06-01', validUntil: '2025-12-31' }
    const result = controller.registerCouponPlan(tenantCtx, body)
    assert.equal(result.planId, 'cp-new')
    assert.equal(result.code, 'NEW-COUPON')
    assert.equal(result.status, LoyaltyPlanStatus.Active)
  })

  test('[正例] registerCouponPlan 正确处理百分比折扣', () => {
    const plan = { planId: 'cp-pct', code: 'PCT-20', title: '八折券', discountType: CouponDiscountType.Percentage, discountValue: 20, status: LoyaltyPlanStatus.Active }
    const controller = new LoyaltyController(makeMockService({
      registerCouponPlan: () => plan
    }))
    const body = { code: 'PCT-20', title: '八折券', description: '20% off', discountType: CouponDiscountType.Percentage, discountValue: 20, minOrderAmount: 0, totalQuota: 500, perMemberLimit: 3, validFrom: '2025-06-01', validUntil: '2025-12-31' }
    const result = controller.registerCouponPlan(tenantCtx, body)
    assert.equal(result.discountType, CouponDiscountType.Percentage)
    assert.equal(result.discountValue, 20)
  })

  test('[反例] registerCouponPlan 传递 service error', () => {
    const controller = new LoyaltyController(makeMockService({
      registerCouponPlan: () => { throw new Error('duplicate code') }
    }))
    assert.throws(
      () => controller.registerCouponPlan(tenantCtx, { code: 'DUP', title: '重复', description: '重复券', discountType: CouponDiscountType.FixedAmount, discountValue: 5, minOrderAmount: 0, totalQuota: 10, perMemberLimit: 1, validFrom: '2025-01-01', validUntil: '2025-06-30' }),
      /duplicate code/
    )
  })

  test('[正例] listCouponPlans 返回所有优惠券计划', () => {
    const plans = [
      { planId: 'cp-1', code: 'C1', title: '券1', discountType: CouponDiscountType.FixedAmount, discountValue: 5, status: LoyaltyPlanStatus.Active },
      { planId: 'cp-2', code: 'C2', title: '券2', discountType: CouponDiscountType.Percentage, discountValue: 15, status: LoyaltyPlanStatus.Draft }
    ]
    const controller = new LoyaltyController(makeMockService({
      listCouponPlans: () => plans
    }))
    const result = controller.listCouponPlans(tenantCtx)
    assert.equal(result.length, 2)
    assert.equal(result[0].code, 'C1')
    assert.equal(result[1].code, 'C2')
  })

  test('[边界] listCouponPlans 返回空数组（无计划）', () => {
    const controller = new LoyaltyController(makeMockService({
      listCouponPlans: () => []
    }))
    const result = controller.listCouponPlans(tenantCtx)
    assert.deepEqual(result, [])
  })

  test('[正例] getCouponPlan 根据 planId 获取单个计划', () => {
    const plan = { planId: 'cp-3', code: 'C3', title: '券3', discountType: CouponDiscountType.FixedAmount, discountValue: 30, status: LoyaltyPlanStatus.Active }
    const controller = new LoyaltyController(makeMockService({
      getCouponPlan: () => plan
    }))
    const result = controller.getCouponPlan(tenantCtx, 'cp-3')
    assert.ok(result)
    if (!result) return
    assert.equal(result.planId, 'cp-3')
    assert.equal(result.discountValue, 30)
  })

  test('[反例] getCouponPlan 不存在的计划返回 undefined', () => {
    const controller = new LoyaltyController(makeMockService({
      getCouponPlan: () => undefined
    }))
    const result: ReturnType<typeof controller.getCouponPlan> = controller.getCouponPlan(tenantCtx, 'no-such-plan')
    assert.equal(result, undefined)
  })

  test('[正例] activateCouponPlan 激活计划', () => {
    const plan = { planId: 'cp-4', code: 'C4', title: '券4', status: LoyaltyPlanStatus.Active }
    const controller = new LoyaltyController(makeMockService({
      updateCouponPlanStatus: () => plan
    }))
    const result = controller.activateCouponPlan(tenantCtx, 'cp-4', { status: LoyaltyPlanStatus.Active })
    assert.equal(result.status, LoyaltyPlanStatus.Active)
  })

  test('[正例] activateCouponPlan 停用计划（Draft 状态）', () => {
    const plan = { planId: 'cp-5', code: 'C5', title: '券5', status: LoyaltyPlanStatus.Draft }
    const controller = new LoyaltyController(makeMockService({
      updateCouponPlanStatus: () => plan
    }))
    const result = controller.activateCouponPlan(tenantCtx, 'cp-5', { status: LoyaltyPlanStatus.Draft })
    assert.equal(result.status, LoyaltyPlanStatus.Draft)
  })

  test('[反例] activateCouponPlan 不存在的计划抛错', () => {
    const controller = new LoyaltyController(makeMockService({
      updateCouponPlanStatus: () => { throw new Error('not found') }
    }))
    assert.throws(
      () => controller.activateCouponPlan(tenantCtx, 'ghost-plan', { status: LoyaltyPlanStatus.Active }),
      /not found/
    )
  })

  test('[正例] issueCoupon 分配优惠券给会员', () => {
    const redemption = { redemptionId: 'cr-issued', couponCode: 'ISSUED-1', memberId: 'm-issued', status: CouponRedemptionStatus.Released }
    const controller = new LoyaltyController(makeMockService({
      issueCouponFromPlan: () => redemption
    }))
    const result = controller.issueCoupon(tenantCtx, 'cp-6', { memberId: 'm-issued', source: 'manual' })
    assert.equal(result.redemptionId, 'cr-issued')
    assert.equal(result.memberId, 'm-issued')
    assert.equal(result.status, CouponRedemptionStatus.Released)
  })

  test('[边界] issueCoupon 缺少成员抛错', () => {
    const controller = new LoyaltyController(makeMockService({
      issueCouponFromPlan: () => { throw new Error('memberId is required') }
    }))
    assert.throws(
      () => controller.issueCoupon(tenantCtx, 'cp-7', { memberId: '', source: 'auto' }),
      /memberId/
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 🐜 新增补全: blindbox-plans CRUD
// ══════════════════════════════════════════════════════════════

describe('LoyaltyController — blindbox-plans CRUD', () => {
  const tenantCtx = { tenantId: 't-blindbox' }

  test('[正例] registerBlindboxPlan 创建盲盒计划', () => {
    const plan = { planId: 'bb-new', blindboxPlanId: 'BB-NEW', title: '神秘盲盒', description: '随机奖励', unitPrice: 29.9, totalQuota: 1000, rewardPool: [{ sku: 'SKU-A', weight: 10, label: 'A款' }, { sku: 'SKU-B', weight: 20, label: 'B款' }], validFrom: '2025-06-01', validUntil: '2025-12-31', status: LoyaltyPlanStatus.Active }
    const controller = new LoyaltyController(makeMockService({
      registerBlindboxPlan: () => plan
    }))
    const body = { blindboxPlanId: 'BB-NEW', title: '神秘盲盒', description: '随机奖励', unitPrice: 29.9, totalQuota: 1000, rewardPool: [{ sku: 'SKU-A', weight: 10, label: 'A款' }, { sku: 'SKU-B', weight: 20, label: 'B款' }], validFrom: '2025-06-01', validUntil: '2025-12-31' }
    const result = controller.registerBlindboxPlan(tenantCtx, body)
    assert.equal(result.blindboxPlanId, 'BB-NEW')
    assert.equal(result.unitPrice, 29.9)
    assert.equal(result.rewardPool.length, 2)
    assert.equal(result.status, LoyaltyPlanStatus.Active)
  })

  test('[反例] registerBlindboxPlan 重复盲盒计划 ID 抛错', () => {
    const controller = new LoyaltyController(makeMockService({
      registerBlindboxPlan: () => { throw new Error('blindbox plan already exists') }
    }))
    assert.throws(
      () => controller.registerBlindboxPlan(tenantCtx, { blindboxPlanId: 'DUP-BB', title: '重复', description: '重复盲盒', unitPrice: 10, totalQuota: 100, rewardPool: [{ sku: 'SKU-X', weight: 10, label: 'X款' }], validFrom: '2025-01-01', validUntil: '2025-06-30' }),
      /already exists/
    )
  })

  test('[正例] listBlindboxPlans 返回所有盲盒计划', () => {
    const plans = [
      { planId: 'bb-1', blindboxPlanId: 'BB1', title: '盲盒1', unitPrice: 10, status: LoyaltyPlanStatus.Active },
      { planId: 'bb-2', blindboxPlanId: 'BB2', title: '盲盒2', unitPrice: 20, status: LoyaltyPlanStatus.Draft }
    ]
    const controller = new LoyaltyController(makeMockService({
      listBlindboxPlans: () => plans
    }))
    const result = controller.listBlindboxPlans(tenantCtx)
    assert.equal(result.length, 2)
    assert.equal(result[0].blindboxPlanId, 'BB1')
    assert.equal(result[1].unitPrice, 20)
  })

  test('[边界] listBlindboxPlans 返回空数组', () => {
    const controller = new LoyaltyController(makeMockService({
      listBlindboxPlans: () => []
    }))
    const result = controller.listBlindboxPlans(tenantCtx)
    assert.deepEqual(result, [])
  })

  test('[正例] getBlindboxPlan 根据 planId 获取单个盲盒计划', () => {
    const plan = { planId: 'bb-3', blindboxPlanId: 'BB3', title: '盲盒3', unitPrice: 49.9, status: LoyaltyPlanStatus.Active }
    const controller = new LoyaltyController(makeMockService({
      getBlindboxPlan: () => plan
    }))
    const result = controller.getBlindboxPlan(tenantCtx, 'bb-3')
    assert.ok(result)
    if (!result) return
    assert.equal(result.blindboxPlanId, 'BB3')
    assert.equal(result.unitPrice, 49.9)
  })

  test('[反例] getBlindboxPlan 不存在的计划返回 undefined', () => {
    const controller = new LoyaltyController(makeMockService({
      getBlindboxPlan: () => undefined as unknown as ReturnType<typeof controller.getBlindboxPlan>
    }))
    const result = controller.getBlindboxPlan(tenantCtx, 'no-such-bb')
    assert.equal(result, undefined)
  })

  test('[正例] activateBlindboxPlan 激活盲盒计划', () => {
    const plan = { planId: 'bb-4', blindboxPlanId: 'BB4', title: '盲盒4', status: LoyaltyPlanStatus.Active }
    const controller = new LoyaltyController(makeMockService({
      updateBlindboxPlanStatus: () => plan
    }))
    const result = controller.activateBlindboxPlan(tenantCtx, 'bb-4', { status: LoyaltyPlanStatus.Active })
    assert.equal(result.status, LoyaltyPlanStatus.Active)
  })

  test('[正例] activateBlindboxPlan 停用盲盒计划', () => {
    const plan = { planId: 'bb-5', blindboxPlanId: 'BB5', title: '盲盒5', status: LoyaltyPlanStatus.Draft }
    const controller = new LoyaltyController(makeMockService({
      updateBlindboxPlanStatus: () => plan
    }))
    const result = controller.activateBlindboxPlan(tenantCtx, 'bb-5', { status: LoyaltyPlanStatus.Draft })
    assert.equal(result.status, LoyaltyPlanStatus.Draft)
  })

  test('[反例] activateBlindboxPlan 不存在的计划抛错', () => {
    const controller = new LoyaltyController(makeMockService({
      updateBlindboxPlanStatus: () => { throw new Error('blindbox plan not found') }
    }))
    assert.throws(
      () => controller.activateBlindboxPlan(tenantCtx, 'ghost-bb', { status: LoyaltyPlanStatus.Active }),
      /not found/
    )
  })

  test('[正例] issueBlindbox 为会员发放盲盒', () => {
    const fulfillment = { fulfillmentId: 'bf-issued', blindboxPlanId: 'BB-ISSUED', memberId: 'm-issued-bb', quantity: 3, rewardSku: 'SKU-RANDOM', status: BlindboxFulfillmentStatus.Fulfilled }
    const controller = new LoyaltyController(makeMockService({
      issueBlindboxFromPlan: () => fulfillment
    }))
    const result = controller.issueBlindbox(tenantCtx, 'bb-6', { memberId: 'm-issued-bb', quantity: 3 })
    assert.equal(result.fulfillmentId, 'bf-issued')
    assert.equal(result.memberId, 'm-issued-bb')
    assert.equal(result.quantity, 3)
    assert.equal(result.status, BlindboxFulfillmentStatus.Fulfilled)
  })

  test('[反例] issueBlindbox 配额不足抛错', () => {
    const controller = new LoyaltyController(makeMockService({
      issueBlindboxFromPlan: () => { throw new Error('quota exceeded') }
    }))
    assert.throws(
      () => controller.issueBlindbox(tenantCtx, 'bb-7', { memberId: 'm-hungry', quantity: 9999 }),
      /quota exceeded/
    )
  })

  test('[边界] issueBlindbox 零数量抛错', () => {
    const controller = new LoyaltyController(makeMockService({
      issueBlindboxFromPlan: () => { throw new Error('quantity must be positive') }
    }))
    assert.throws(
      () => controller.issueBlindbox(tenantCtx, 'bb-8', { memberId: 'm-zero', quantity: 0 }),
      /positive/
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 🐜 新增补全: coupon/blindbox metadata 验证
// ══════════════════════════════════════════════════════════════

describe('LoyaltyController metadata — coupon & blindbox endpoints', () => {
  test('registerCouponPlan POST coupon-plans', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.registerCouponPlan)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.registerCouponPlan)
    assert.equal(m, 1)
    assert.equal(p, 'coupon-plans')
  })

  test('listCouponPlans GET coupon-plans', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.listCouponPlans)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.listCouponPlans)
    assert.equal(m, 0)
    assert.equal(p, 'coupon-plans')
  })

  test('getCouponPlan GET coupon-plans/:planId', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.getCouponPlan)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.getCouponPlan)
    assert.equal(m, 0)
    assert.equal(p, 'coupon-plans/:planId')
  })

  test('activateCouponPlan PATCH coupon-plans/:planId/status', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.activateCouponPlan)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.activateCouponPlan)
    assert.equal(m, 4) // PATCH
    assert.equal(p, 'coupon-plans/:planId/status')
  })

  test('issueCoupon POST coupon-plans/:planId/issue', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.issueCoupon)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.issueCoupon)
    assert.equal(m, 1)
    assert.equal(p, 'coupon-plans/:planId/issue')
  })

  test('registerBlindboxPlan POST blindbox-plans', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.registerBlindboxPlan)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.registerBlindboxPlan)
    assert.equal(m, 1)
    assert.equal(p, 'blindbox-plans')
  })

  test('listBlindboxPlans GET blindbox-plans', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.listBlindboxPlans)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.listBlindboxPlans)
    assert.equal(m, 0)
    assert.equal(p, 'blindbox-plans')
  })

  test('getBlindboxPlan GET blindbox-plans/:planId', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.getBlindboxPlan)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.getBlindboxPlan)
    assert.equal(m, 0)
    assert.equal(p, 'blindbox-plans/:planId')
  })

  test('activateBlindboxPlan PATCH blindbox-plans/:planId/status', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.activateBlindboxPlan)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.activateBlindboxPlan)
    assert.equal(m, 4) // PATCH
    assert.equal(p, 'blindbox-plans/:planId/status')
  })

  test('issueBlindbox POST blindbox-plans/:planId/issue', () => {
    const m = Reflect.getMetadata('method', LoyaltyController.prototype.issueBlindbox)
    const p = Reflect.getMetadata('path', LoyaltyController.prototype.issueBlindbox)
    assert.equal(m, 1)
    assert.equal(p, 'blindbox-plans/:planId/issue')
  })
})
