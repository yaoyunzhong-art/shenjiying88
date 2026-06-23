/**
 * E2E-level: Loyalty 积分会员 service 层测试
 *
 * 链路:
 *   LoyaltyService
 *     → listPointsLedger / listCouponRedemptions / listBlindboxFulfillments / listSettlements
 *     → registerCouponPlan / listCouponPlans / getCouponPlan / activateCouponPlan / issueCoupon
 *     → registerBlindboxPlan / listBlindboxPlans / getBlindboxPlan / activateBlindboxPlan / issueBlindbox
 *     → settlePaidOrder / settleFailedOrder / refundRollback
 *
 * 验证:
 *   - 列表查询初始为空
 *   - 注册 Coupon Plan 后列表可查
 *   - Coupon Plan 状态激活
 *   - 发放优惠券成功
 *   - 注册盲盒计划
 *   - settlePaidOrder 创建积分、优惠券赎回、盲盒履约
 *   - settleFailedOrder 释放优惠券
 *   - 租户隔离
 *   - 边界: 无效 planId
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { LoyaltyService } from './loyalty.service'
import { LoyaltyPlanStatus, CouponDiscountType } from './loyalty.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { MemberService } from '../member/member.service'

// ========== mock MemberService ==========

function mockMemberService(): MemberService {
  return {
    awardPoints: async () => undefined,
    recordPaymentActivity: async () => undefined,
  } as unknown as MemberService
}

// ========== helpers ==========

function makeTenant(id: string): RequestTenantContext {
  return { tenantId: id, brandId: '', storeId: '', marketCode: '' }
}

function createService(): LoyaltyService {
  return new LoyaltyService(mockMemberService())
}

// ========== 列表 ==========

test('e2e: listPointsLedger is empty initially', () => {
  const svc = createService()
  const res = svc.listPointsLedger('tenant-A')
  assert.ok(Array.isArray(res))
  assert.equal(res.length, 0)
})

test('e2e: listCouponRedemptions is empty initially', () => {
  const svc = createService()
  const res = svc.listCouponRedemptions('tenant-A')
  assert.ok(Array.isArray(res))
  assert.equal(res.length, 0)
})

test('e2e: listBlindboxFulfillments is empty initially', () => {
  const svc = createService()
  const res = svc.listBlindboxFulfillments('tenant-A')
  assert.ok(Array.isArray(res))
  assert.equal(res.length, 0)
})

test('e2e: listSettlements is empty initially', () => {
  const svc = createService()
  const res = svc.listSettlements('tenant-A')
  assert.ok(Array.isArray(res))
  assert.equal(res.length, 0)
})

// ========== Coupon Plan ==========

test('e2e: registerCouponPlan then listCouponPlans returns it', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-1')
  svc.registerCouponPlan({
    tenantContext: ctx,
    code: 'CPN-NEWYEAR',
    title: '新年优惠',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 50,
    totalQuota: 1000,
    perMemberLimit: 3,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  const plans = svc.listCouponPlans('tenant-1')
  assert.equal(plans.length, 1)
  assert.equal(plans[0].code, 'CPN-NEWYEAR')
})

test('e2e: getCouponPlan returns the correct plan', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-2')
  const plan = svc.registerCouponPlan({
    tenantContext: ctx,
    code: 'CPN-SUMMER',
    title: '夏日特惠',
    discountType: CouponDiscountType.Percentage,
    discountValue: 15,
    totalQuota: 500,
    perMemberLimit: 1,
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2026-08-31T23:59:59.000Z',
  })
  const found = svc.getCouponPlan(plan.planId, 'tenant-2')
  assert.equal(found!.code, 'CPN-SUMMER')
  assert.equal(found!.discountType, CouponDiscountType.Percentage)
  assert.equal(found!.discountValue, 15)
})

test('e2e: activateCouponPlan changes status', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-3')
  const plan = svc.registerCouponPlan({
    tenantContext: ctx,
    code: 'CPN-ACTIVE',
    title: '激活测试',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 10,
    totalQuota: 100,
    perMemberLimit: 2,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  assert.equal(plan.status, LoyaltyPlanStatus.Draft)
  const updated = svc.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-3')
  assert.equal(updated.status, LoyaltyPlanStatus.Active)
})

test('e2e: issueCouponFromPlan reduces remaining quota', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-4')
  const plan = svc.registerCouponPlan({
    tenantContext: ctx,
    code: 'CPN-ISSUE',
    title: '发放测试',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 20,
    totalQuota: 100,
    perMemberLimit: 5,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  svc.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-4')
  const res = svc.issueCouponFromPlan({
    tenantContext: ctx,
    memberId: 'member-1',
    planId: plan.planId,
    source: 'manual',
  })
  assert.equal(res.status, 'REDEEMED')
  // remaining quota decreased
  const updatedPlan = svc.getCouponPlan(plan.planId, 'tenant-4')
  assert.equal(updatedPlan!.remainingQuota, 99)
})

// ========== Blindbox Plan ==========

test('e2e: registerBlindboxPlan then listBlindboxPlans returns it', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-5')
  svc.registerBlindboxPlan({
    tenantContext: ctx,
    blindboxPlanId: 'BB-MYSTERY',
    title: '神秘盲盒',
    unitPrice: 59,
    totalQuota: 200,
    rewardPool: [
      { sku: 'rare', weight: 10, label: '稀有款' },
      { sku: 'normal', weight: 90, label: '普通款' },
    ],
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  const plans = svc.listBlindboxPlans('tenant-5')
  assert.equal(plans.length, 1)
  assert.equal(plans[0].blindboxPlanId, 'BB-MYSTERY')
})

test('e2e: getBlindboxPlan returns correct plan', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-6')
  const plan = svc.registerBlindboxPlan({
    tenantContext: ctx,
    blindboxPlanId: 'BB-GOLDEN',
    title: '黄金盲盒',
    unitPrice: 199,
    totalQuota: 50,
    rewardPool: [{ sku: 'gold', weight: 100, label: '金' }],
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  const found = svc.getBlindboxPlan(plan.planId, 'tenant-6')
  assert.equal(found!.blindboxPlanId, 'BB-GOLDEN')
  assert.equal(found!.unitPrice, 199)
})

test('e2e: activateBlindboxPlan changes status', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-7')
  const plan = svc.registerBlindboxPlan({
    tenantContext: ctx,
    blindboxPlanId: 'BB-ACTIVE',
    title: '激活盲盒',
    unitPrice: 39,
    totalQuota: 100,
    rewardPool: [{ sku: 'sample', weight: 100, label: '样品' }],
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  assert.equal(plan.status, LoyaltyPlanStatus.Draft)
  const updated = svc.updateBlindboxPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-7')
  assert.equal(updated.status, LoyaltyPlanStatus.Active)
})

// ========== Tenant isolation ==========

test('e2e: tenant isolation - plan not visible in other tenant', () => {
  const svc = createService()
  svc.registerCouponPlan({
    tenantContext: makeTenant('tenant-A'),
    code: 'CPN-ONLY-A',
    title: 'Only A',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 10,
    totalQuota: 100,
    perMemberLimit: 1,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  const plansA = svc.listCouponPlans('tenant-A')
  const plansB = svc.listCouponPlans('tenant-B')
  assert.equal(plansA.length, 1)
  assert.equal(plansB.length, 0)
})

// ========== settlePaidOrder ==========

test('e2e: settlePaidOrder creates points ledger entry', async () => {
  const svc = createService()
  const ctx = makeTenant('tenant-settle')
  // settlePaidOrder 需要 CashierOrder/CashierPayment 形状
  const result = await svc.settlePaidOrder(
    {
      tenantContext: ctx,
      orderId: 'order-001',
      memberId: 'member-001',
    } as any,
    {
      tenantContext: ctx,
      paymentId: 'pay-001',
      amount: 299,
      channel: 'wechat',
      completedAt: '2026-06-23T08:00:00.000Z',
    } as any,
  )
  assert.equal(result.status, 'SUCCEEDED')
  assert.equal(result.awardedPoints, 299)
  assert.equal(result.memberId, 'member-001')

  const ledger = svc.listPointsLedger('tenant-settle')
  assert.equal(ledger.length, 1)
  assert.equal(ledger[0].points, 299)
  assert.equal(ledger[0].memberId, 'member-001')
})

test('e2e: settlePaidOrder is idempotent for same order', async () => {
  const svc = createService()
  const ctx = makeTenant('tenant-idem')
  const order = { tenantContext: ctx, orderId: 'order-idem', memberId: 'member-002' } as any
  const payment = {
    tenantContext: ctx,
    paymentId: 'pay-idem',
    amount: 100,
    channel: 'alipay',
    completedAt: '2026-06-23T08:00:00.000Z',
  } as any
  const r1 = await svc.settlePaidOrder(order, payment)
  const r2 = await svc.settlePaidOrder(order, payment)
  assert.equal(r1.settlementId, r2.settlementId) // 幂等返回同一 settlement
  const ledger = svc.listPointsLedger('tenant-idem')
  assert.equal(ledger.length, 1) // 不会重复创建
})

// ========== settleFailedOrder ==========

test('e2e: settleFailedOrder creates CouponRedemption with Released status', async () => {
  const svc = createService()
  const ctx = makeTenant('tenant-fail')
  await svc.settleFailedOrder(
    {
      tenantContext: ctx,
      orderId: 'order-fail-001',
      memberId: 'member-003',
      couponCode: 'CPN-FAIL-TEST',
    } as any,
    { tenantContext: ctx, paymentId: 'pay-fail-001', amount: 0 } as any,
  )
  const redemptions = svc.listCouponRedemptions('tenant-fail')
  assert.equal(redemptions.length, 1)
  assert.equal(redemptions[0].status, 'RELEASED')
  assert.equal(redemptions[0].couponCode, 'CPN-FAIL-TEST')
})

// ========== 边界 ==========

test('e2e: getCouponPlan with non-existent planId returns undefined', () => {
  const svc = createService()
  const result = svc.getCouponPlan('non-existent-plan', 'tenant-1')
  assert.equal(result, undefined)
})

test('e2e: settlePaidOrder without memberId throws', async () => {
  const svc = createService()
  const ctx = makeTenant('tenant-err')
  await assert.rejects(() =>
    svc.settlePaidOrder(
      { tenantContext: ctx, orderId: 'order-no-member' } as any,
      { tenantContext: ctx, paymentId: 'pay-001', amount: 100 } as any,
    ),
  )
})

test('e2e: issueCoupon beyond perMemberLimit throws', () => {
  const svc = createService()
  const ctx = makeTenant('tenant-limit')
  const plan = svc.registerCouponPlan({
    tenantContext: ctx,
    code: 'CPN-LIMIT',
    title: '限制测试',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 5,
    totalQuota: 10,
    perMemberLimit: 2,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  })
  svc.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-limit')
  // 先发放 2 次，第三次应该失败
  svc.issueCouponFromPlan({ tenantContext: ctx, memberId: 'member-limit', planId: plan.planId, source: 'manual' })
  svc.issueCouponFromPlan({ tenantContext: ctx, memberId: 'member-limit', planId: plan.planId, source: 'manual' })
  const fn = () => svc.issueCouponFromPlan({ tenantContext: ctx, memberId: 'member-limit', planId: plan.planId, source: 'manual' })
  assert.throws(fn, /per-member limit/i)
})
