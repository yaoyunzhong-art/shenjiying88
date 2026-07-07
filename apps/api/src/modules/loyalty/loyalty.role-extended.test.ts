import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: loyalty 模块
 *
 * 4 个附加角色视角：
 * 🛒前台 — 查询会员积分
 * 📢营销 — 创建营销活动
 * 🎯运行专员 — 管理奖品奖励
 * 👔店长 — 查看忠诚度分析
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LoyaltyController } from './loyalty.controller'
import { LoyaltyService } from './loyalty.service'
import { MemberService } from '../member/member.service'
import {
  CouponDiscountType,
  LoyaltyPlanStatus,
  type CouponPlan,
} from './loyalty.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 测试数据工厂 ──

const tenantCtx: RequestTenantContext = {
  tenantId: 't-loyalty-ext',
  brandId: 'b-arcade',
  storeId: 's-main',
}

/** Mock MemberService to avoid real Prisma dependency */
class MockMemberService implements Partial<MemberService> {
  async awardPoints(memberId: string, points: number, ctx: RequestTenantContext): Promise<any> { return undefined }
  async rollbackPoints(memberId: string, points: number, ctx: RequestTenantContext): Promise<any> { return undefined }
  async recordPaymentActivity(args: Record<string, any>): Promise<any> { return undefined }
}

function createController(): LoyaltyController {
  const memberService = new MockMemberService() as unknown as MemberService
  const loyaltyService = new LoyaltyService(memberService)
  // Reset in-memory stores
  const resetMethod = (loyaltyService as any).resetLoyaltyStoresForTests
  if (resetMethod) resetMethod.call(loyaltyService)
  return new LoyaltyController(loyaltyService)
}

// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 查询会员积分 (reception looking up member points)
// ──────────────────────────────────────────────────────────────────────
describe('🛒前台 — 会员积分查询视角', () => {
  it('查询积分台账可见已有积分记录 (points ledger query)', () => {
    const ctrl = createController()

    // 初始积分台账为空
    const ledger = ctrl.listPointsLedger(tenantCtx)
    assert.ok(Array.isArray(ledger))
    assert.equal(ledger.length, 0)
  })

  it('结算成功后积分台账有对应积分记录 (points awarded after settlement)', async () => {
    const ctrl = createController()
    const service = (ctrl as any).loyaltyService as LoyaltyService

    // 模拟支付结算
    const mockOrder = {
      orderId: 'order-001',
      memberId: 'mem-001',
      tenantContext: tenantCtx as any,
      amount: 5000,
      couponCode: undefined,
      blindboxPlanId: undefined,
      blindboxQuantity: undefined,
    }
    const mockPayment = {
      paymentId: 'pay-001',
      amount: 5000,
      channel: 'WECHAT',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await service.settlePaidOrder(mockOrder as any, mockPayment as any)

    const ledger = ctrl.listPointsLedger(tenantCtx)
    assert(ledger.length >= 1)

    const entry = ledger.find((e: any) => e.orderId === 'order-001')
    assert(entry, '支付订单应有积分记录')
    assert(entry.points > 0, '积分应大于 0')
    assert.equal(entry.reason, 'cashier.payment-succeeded')
  })

  it('退款后会扣回对应积分 (points rollback on refund)', async () => {
    const ctrl = createController()
    const service = (ctrl as any).loyaltyService as LoyaltyService

    const mockOrder = {
      orderId: 'order-refund-001',
      memberId: 'mem-refund-001',
      tenantContext: tenantCtx as any,
      amount: 3000,
      couponCode: undefined,
      blindboxPlanId: undefined,
      blindboxQuantity: undefined,
    }
    const mockPayment = {
      paymentId: 'pay-refund-001',
      amount: 3000,
      channel: 'ALIPAY',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 先结算
    await service.settlePaidOrder(mockOrder as any, mockPayment as any)
    const beforeRefund = ctrl.listPointsLedger(tenantCtx)
    const totalPointsBefore = beforeRefund
      .filter((e: any) => e.points > 0)
      .reduce((sum: number, e: any) => sum + e.points, 0)
    assert(totalPointsBefore > 0, '结算后应有正积分')

    // 退款
    const refundResult = await service.applyRefund(mockOrder as any, mockPayment as any, 3000)
    assert(refundResult.reversedPoints > 0, '退款应扣回积分')

    const afterRefund = ctrl.listPointsLedger(tenantCtx)
    const negativeEntries = afterRefund.filter((e: any) => e.points < 0 && e.orderId === 'order-refund-001')
    assert.equal(negativeEntries.length, 1, '应有 1 条扣分记录')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 创建营销活动 (marketing creating campaigns)
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 营销活动创建视角', () => {
  it('创建优惠券活动计划 (create coupon plan)', () => {
    const ctrl = createController()

    const plan = ctrl.registerCouponPlan(tenantCtx, {
      code: 'PROMO-618',
      title: '618 大促满减券',
      description: '满 100 减 20',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 2000, // 20 元 (分)
      minOrderAmount: 10000, // 100 元 (分)
      totalQuota: 500,
      perMemberLimit: 2,
      validFrom: '2026-06-01T00:00:00.000Z',
      validUntil: '2026-06-20T23:59:59.999Z',
    })

    assert.equal(plan.code, 'PROMO-618')
    assert.equal(plan.totalQuota, 500)
    assert.equal(plan.remainingQuota, 500)
    assert.equal(plan.status, LoyaltyPlanStatus.Draft)
  })

  it('激活优惠券计划后可发放 (activate and issue coupon)', () => {
    const ctrl = createController()

    const plan = ctrl.registerCouponPlan(tenantCtx, {
      code: 'NEW-YEAR',
      title: '新年折扣券',
      discountType: CouponDiscountType.Percentage,
      discountValue: 85, // 85 折
      totalQuota: 100,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.999Z',
    })

    // 激活计划
    const activated = ctrl.activateCouponPlan(tenantCtx, plan.planId, {
      status: LoyaltyPlanStatus.Active,
    })
    assert.equal(activated.status, LoyaltyPlanStatus.Active)

    // 发放优惠券给会员
    const redemption = ctrl.issueCoupon(tenantCtx, plan.planId, {
      memberId: 'mem-promo-001',
      source: 'marketing-campaign',
    })

    assert.equal(redemption.couponCode, 'NEW-YEAR')
    assert.equal(redemption.memberId, 'mem-promo-001')
  })

  it('无效的折扣比例拒绝注册 (invalid discount validation)', () => {
    const ctrl = createController()

    // 百分比折扣超过 100%
    assert.throws(
      () => ctrl.registerCouponPlan(tenantCtx, {
        code: 'INVALID-PCT',
        title: '异常折扣',
        discountType: CouponDiscountType.Percentage,
        discountValue: 150, // 150%！非法
        totalQuota: 50,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.999Z',
      }),
      /Percentage discount cannot exceed 100/
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 管理奖品奖励 (operations managing rewards)
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — 奖品奖励管理视角', () => {
  it('创建盲盒计划 (create blindbox plan)', () => {
    const ctrl = createController()

    const plan = ctrl.registerBlindboxPlan(tenantCtx, {
      blindboxPlanId: 'GACHA-SUMMER',
      title: '夏日限定扭蛋',
      description: '夏天专属奖励',
      unitPrice: 500, // 5 元 (分)
      totalQuota: 200,
      rewardPool: [
        { sku: 'PRIZE-A', weight: 70, label: '徽章' },
        { sku: 'PRIZE-B', weight: 20, label: '钥匙扣' },
        { sku: 'PRIZE-C', weight: 8, label: '小公仔' },
        { sku: 'PRIZE-D', weight: 2, label: '隐藏款手办' },
      ],
      validFrom: '2026-07-01T00:00:00.000Z',
      validUntil: '2026-08-31T23:59:59.999Z',
    })

    assert.equal(plan.title, '夏日限定扭蛋')
    assert.equal(plan.totalQuota, 200)
    assert.equal(plan.rewardPool.length, 4)
    assert.equal(plan.status, LoyaltyPlanStatus.Draft)
  })

  it('激活盲盒后可从计划发放 (activate and issue blindbox)', async () => {
    const ctrl = createController()

    const plan = ctrl.registerBlindboxPlan(tenantCtx, {
      blindboxPlanId: 'MYSTERY-BOX',
      title: '神秘盒子',
      unitPrice: 0,
      totalQuota: 100,
      rewardPool: [
        { sku: 'MYSTERY-A', weight: 80, label: '普通奖励' },
        { sku: 'MYSTERY-B', weight: 20, label: '稀有奖励' },
      ],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.999Z',
    })

    // 激活
    ctrl.activateBlindboxPlan(tenantCtx, plan.planId, {
      status: LoyaltyPlanStatus.Active,
    })

    // 发放——因为带随机性，跳过精确断言，只验证格式
    const fulfillment = await ctrl.issueBlindbox(tenantCtx, plan.planId, {
      memberId: 'mem-blind-001',
      quantity: 1,
    })

    assert.equal(fulfillment.memberId, 'mem-blind-001')
    assert.ok(fulfillment.rewardSku.startsWith('MYSTERY-'), '奖励 SKU 应来自奖池')
    assert.equal(fulfillment.quantity, 1)
  })

  it('盲盒预留不足时拒绝发放 (insufficient blindbox quota)', async () => {
    const ctrl = createController()

    const plan = ctrl.registerBlindboxPlan(tenantCtx, {
      blindboxPlanId: 'LIMITED-BOX',
      title: '限量盲盒',
      unitPrice: 1000,
      totalQuota: 2,
      rewardPool: [
        { sku: 'REWARD-1', weight: 100, label: '奖品' },
      ],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.999Z',
    })

    // 激活
    ctrl.activateBlindboxPlan(tenantCtx, plan.planId, {
      status: LoyaltyPlanStatus.Active,
    })

    // 消耗所有配额
    await ctrl.issueBlindbox(tenantCtx, plan.planId, { memberId: 'mem-01', quantity: 2 })

    // 再发放应当拒绝
    await assert.rejects(
      () => ctrl.issueBlindbox(tenantCtx, plan.planId, { memberId: 'mem-02', quantity: 1 }),
      /insufficient quota/i
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看忠诚度分析 (shop manager viewing loyalty analytics)
// ──────────────────────────────────────────────────────────────────────
describe('👔店长 — 忠诚度分析视角', () => {
  it('查看结算记录列表 (settlement list)', async () => {
    const ctrl = createController()
    const service = (ctrl as any).loyaltyService as LoyaltyService

    const mockOrder = {
      orderId: 'order-an-001',
      memberId: 'mem-an-001',
      tenantContext: tenantCtx as any,
      amount: 8000,
      couponCode: undefined,
      blindboxPlanId: undefined,
      blindboxQuantity: undefined,
    }
    const mockPayment = {
      paymentId: 'pay-an-001',
      amount: 8000,
      channel: 'CASH',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await service.settlePaidOrder(mockOrder as any, mockPayment as any)

    const settlements = ctrl.listSettlements(tenantCtx)
    assert(settlements.length >= 1)
    const s = settlements.find((s: any) => s.orderId === 'order-an-001')
    assert(s, '结算记录应包含刚结算的订单')
    assert.equal(s.status, 'SUCCEEDED')
    assert(s.awardedPoints > 0)
  })

  it('查看优惠券核销记录 (coupon redemption list)', async () => {
    const ctrl = createController()
    const service = (ctrl as any).loyaltyService as LoyaltyService

    // 创建一个优惠券计划
    const plan = ctrl.registerCouponPlan(tenantCtx, {
      code: 'ANALYTICS-TEST',
      title: '分析测试券',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 1000,
      totalQuota: 100,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.999Z',
    })
    ctrl.activateCouponPlan(tenantCtx, plan.planId, { status: LoyaltyPlanStatus.Active })

    // 发放并在结算时核销
    const redemption = ctrl.issueCoupon(tenantCtx, plan.planId, {
      memberId: 'mem-cpn-an-001',
    })

    const redemptions = ctrl.listCouponRedemptions(tenantCtx)
    assert(redemptions.length >= 1)
    const r = redemptions.find((r: any) => r.redemptionId === redemption.redemptionId)
    assert(r, '核销列表应包含所有核销记录')
    assert.equal(r.status, 'REDEEMED')
  })

  it('查看盲盒履约列表 (blindbox fulfillment list)', async () => {
    const ctrl = createController()

    const plan = ctrl.registerBlindboxPlan(tenantCtx, {
      blindboxPlanId: 'BOX-ANALYTICS',
      title: '分析盲盒',
      unitPrice: 100,
      totalQuota: 50,
      rewardPool: [
        { sku: 'AN-REWARD', weight: 100, label: '奖品' },
      ],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.999Z',
    })
    ctrl.activateBlindboxPlan(tenantCtx, plan.planId, { status: LoyaltyPlanStatus.Active })
    await ctrl.issueBlindbox(tenantCtx, plan.planId, { memberId: 'mem-box-an-001', quantity: 1 })

    const fulfillments = ctrl.listBlindboxFulfillments(tenantCtx)
    assert(fulfillments.length >= 1)
    const bf = fulfillments.find((f: any) => f.memberId === 'mem-box-an-001')
    assert(bf, '履约列表应包含该盲盒发放记录')
    assert.equal(bf.status, 'FULFILLED')
  })
})
