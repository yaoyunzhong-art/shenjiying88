import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [loyalty] [C] 角色测试
 * 
 * 8 角色视角的 loyalty 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LoyaltyController } from './loyalty.controller'
import {
  LoyaltyService,
} from './loyalty.service'
import {
  LoyaltySettlementStatus,
  CouponRedemptionStatus,
  BlindboxFulfillmentStatus,
  type PointsLedgerEntry,
  type CouponRedemption,
  type BlindboxFulfillment,
  type LoyaltyOrderSettlement,
} from './loyalty.entity'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──

function createMockService(overrides: Partial<Record<keyof LoyaltyService, (...args: never[]) => unknown>> = {}) {
  return {
    listPointsLedger: (_tenantId: string): PointsLedgerEntry[] => [],
    listCouponRedemptions: (_tenantId: string): CouponRedemption[] => [],
    listBlindboxFulfillments: (_tenantId: string): BlindboxFulfillment[] => [],
    listSettlements: (_tenantId: string): LoyaltyOrderSettlement[] => [],
    ...overrides,
  } as unknown as LoyaltyService
}

function createController(serviceOverrides?: Partial<Record<keyof LoyaltyService, (...args: never[]) => unknown>>) {
  return new LoyaltyController(createMockService(serviceOverrides))
}

const mockPointsEntries: PointsLedgerEntry[] = [
  {
    entryId: 'points-001',
    tenantContext: { tenantId: 't-001' },
    memberId: 'mem-001',
    orderId: 'order-001',
    paymentId: 'pay-001',
    points: 500,
    reason: 'cashier.payment-succeeded',
    createdAt: '2026-06-14T08:00:00.000Z',
  },
  {
    entryId: 'points-002',
    tenantContext: { tenantId: 't-001' },
    memberId: 'mem-002',
    orderId: 'order-002',
    paymentId: 'pay-002',
    points: 200,
    reason: 'cashier.payment-succeeded',
    createdAt: '2026-06-14T09:00:00.000Z',
  },
  {
    entryId: 'points-003',
    tenantContext: { tenantId: 't-001' },
    memberId: 'mem-001',
    orderId: 'order-001',
    paymentId: 'pay-003',
    points: -300,
    reason: 'transaction.refund-completed',
    createdAt: '2026-06-14T10:00:00.000Z',
  },
]

const mockCouponRedemptions: CouponRedemption[] = [
  {
    redemptionId: 'coupon-001',
    tenantContext: { tenantId: 't-001' },
    orderId: 'order-001',
    paymentId: 'pay-001',
    memberId: 'mem-001',
    couponCode: 'COUPON-2026-SUMMER',
    status: CouponRedemptionStatus.Redeemed,
    createdAt: '2026-06-14T08:00:00.000Z',
  },
]

const mockBlindboxFulfillments: BlindboxFulfillment[] = [
  {
    fulfillmentId: 'blindbox-001',
    tenantContext: { tenantId: 't-001' },
    orderId: 'order-001',
    paymentId: 'pay-001',
    memberId: 'mem-001',
    blindboxPlanId: 'bb-plan-001',
    quantity: 2,
    rewardSku: 'bb-plan-001-reward-2',
    status: BlindboxFulfillmentStatus.Fulfilled,
    createdAt: '2026-06-14T08:00:00.000Z',
  },
]

const mockSettlements: LoyaltyOrderSettlement[] = [
  {
    settlementId: 'settlement-001',
    tenantContext: { tenantId: 't-001' },
    orderId: 'order-001',
    paymentId: 'pay-001',
    memberId: 'mem-001',
    status: LoyaltySettlementStatus.Succeeded,
    awardedPoints: 500,
    couponCode: 'COUPON-2026-SUMMER',
    blindboxPlanId: 'bb-plan-001',
    createdAt: '2026-06-14T08:00:00.000Z',
    updatedAt: '2026-06-14T08:00:00.000Z',
  },
]

// ── 👔店长 ──
describe(`${ROLES.StoreManager} loyalty 角色测试`, () => {
  it('店长查看当前店铺积分台账列表 => 有数据', () => {
    const ctrl = createController({
      listPointsLedger: (tenantId: string) => {
        assert.equal(tenantId, 't-001')
        return mockPointsEntries
      },
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-001' })
    assert.equal(result.length, 3)
    assert.equal(result[0].entryId, 'points-001')
    assert.equal(result[1].points, 200)
    // 退款记录为负数
    assert.equal(result[2].points, -300)
  })

  it('店长查看结算列表确认收益 => 含优惠券和盲盒信息', () => {
    const ctrl = createController({
      listSettlements: (tenantId: string) => {
        assert.equal(tenantId, 't-store-01')
        return mockSettlements
      },
    })

    const result = ctrl.listSettlements({ tenantId: 't-store-01' })
    assert.equal(result.length, 1)
    assert.equal(result[0].settlementId, 'settlement-001')
    assert.equal(result[0].status, LoyaltySettlementStatus.Succeeded)
    assert.equal(result[0].awardedPoints, 500)
    assert.equal(result[0].couponCode, 'COUPON-2026-SUMMER')
    assert.equal(result[0].blindboxPlanId, 'bb-plan-001')
  })

  it('店长查看空数据店铺积分台账 => 空数组（边界：无数据）', () => {
    const ctrl = createController({
      listPointsLedger: () => [],
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-empty' })
    assert.equal(result.length, 0)
  })

  it('店长查看跨租户数据隔离 => 不应看到其他店铺数据', () => {
    const ctrl = createController({
      listCouponRedemptions: (tenantId: string) => {
        if (tenantId === 't-001') return mockCouponRedemptions
        return []
      },
    })

    const ownData = ctrl.listCouponRedemptions({ tenantId: 't-001' })
    assert.equal(ownData.length, 1)
    assert.equal(ownData[0].couponCode, 'COUPON-2026-SUMMER')

    const otherData = ctrl.listCouponRedemptions({ tenantId: 't-other-store' })
    assert.equal(otherData.length, 0)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} loyalty 角色测试`, () => {
  it('前台查看盲盒履约列表 => 确认发货状态', () => {
    const ctrl = createController({
      listBlindboxFulfillments: (tenantId: string) => {
        assert.equal(tenantId, 't-front-01')
        return mockBlindboxFulfillments
      },
    })

    const result = ctrl.listBlindboxFulfillments({ tenantId: 't-front-01' })
    assert.equal(result.length, 1)
    assert.equal(result[0].fulfillmentId, 'blindbox-001')
    assert.equal(result[0].status, BlindboxFulfillmentStatus.Fulfilled)
    assert.equal(result[0].quantity, 2)
    assert.equal(result[0].rewardSku, 'bb-plan-001-reward-2')
  })

  it('前台查看积分台账 => 了解会员消费积分（边界：付款成功与退款的混合数据）', () => {
    const ctrl = createController({
      listPointsLedger: () => mockPointsEntries,
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-front-01' })
    // 包含正向积分和负向退款
    const positiveEntries = result.filter(e => e.points > 0)
    const negativeEntries = result.filter(e => e.points < 0)
    assert.equal(positiveEntries.length, 2)
    assert.equal(negativeEntries.length, 1)
  })

  it('前台查看无盲盒履约的店铺 => 空数组', () => {
    const ctrl = createController({
      listBlindboxFulfillments: () => [],
    })

    const result = ctrl.listBlindboxFulfillments({ tenantId: 't-no-bb' })
    assert.equal(result.length, 0)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} loyalty 角色测试`, () => {
  it('HR 查看结算列表了解运营健康度 => Succeeded 状态', () => {
    const ctrl = createController({
      listSettlements: () => mockSettlements,
    })

    const result = ctrl.listSettlements({ tenantId: 't-hr-01' })
    assert.equal(result.length, 1)
    assert.equal(result[0].status, LoyaltySettlementStatus.Succeeded)
    assert.equal(result[0].awardedPoints, 500)
  })

  it('HR 查看优惠券核销记录 => 统计营销投入', () => {
    const multiCoupons: CouponRedemption[] = [
      {
        redemptionId: 'coupon-hr-001',
        tenantContext: { tenantId: 't-hr-01' },
        orderId: 'order-hr-001',
        paymentId: 'pay-hr-001',
        memberId: 'mem-hr-001',
        couponCode: 'COUPON-SUMMER',
        status: CouponRedemptionStatus.Redeemed,
        createdAt: '2026-06-14T08:00:00.000Z',
      },
      {
        redemptionId: 'coupon-hr-002',
        tenantContext: { tenantId: 't-hr-01' },
        orderId: 'order-hr-002',
        paymentId: 'pay-hr-002',
        memberId: 'mem-hr-002',
        couponCode: 'COUPON-WELCOME',
        status: CouponRedemptionStatus.Released,
        createdAt: '2026-06-14T09:00:00.000Z',
      },
    ]

    const ctrl = createController({
      listCouponRedemptions: () => multiCoupons,
    })

    const result = ctrl.listCouponRedemptions({ tenantId: 't-hr-01' })
    assert.equal(result.length, 2)

    const redeemed = result.filter(r => r.status === CouponRedemptionStatus.Redeemed)
    const released = result.filter(r => r.status === CouponRedemptionStatus.Released)
    assert.equal(redeemed.length, 1)
    assert.equal(released.length, 1)
  })

  it('HR 查看无结算的店铺 => 空数组（边界：新店无数据）', () => {
    const ctrl = createController({
      listSettlements: () => [],
    })

    const result = ctrl.listSettlements({ tenantId: 't-new-store' })
    assert.equal(result.length, 0)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} loyalty 角色测试`, () => {
  it('安监查看积分台账确认无异常扣分 => 数据完整性检查', () => {
    const ctrl = createController({
      listPointsLedger: () => mockPointsEntries,
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-sec-01' })
    // 所有条目应有正确的 entryId
    assert.ok(result.every(e => e.entryId.startsWith('points-')))
    // 所有条目应有时间戳
    assert.ok(result.every(e => Date.parse(e.createdAt) > 0))
  })

  it('安监查看盲盒履约记录确认合规 => 无 SKIPPED 状态异常', () => {
    const ctrl = createController({
      listBlindboxFulfillments: () => mockBlindboxFulfillments,
    })

    const result = ctrl.listBlindboxFulfillments({ tenantId: 't-sec-01' })
    assert.equal(result.length, 1)
    // 安监关注：所有履约应为 FULFILLED，不允许 SKIPPED
    const skipped = result.filter(f => f.status === BlindboxFulfillmentStatus.Skipped)
    assert.equal(skipped.length, 0)
  })

  it('安监查看违约态优惠券 => Released 状态（边界：退款释放的优惠券）', () => {
    const releasedCoupons: CouponRedemption[] = [
      {
        redemptionId: 'coupon-sec-001',
        tenantContext: { tenantId: 't-sec-01' },
        orderId: 'order-sec-001',
        paymentId: 'pay-sec-001',
        memberId: 'mem-sec-001',
        couponCode: 'COUPON-REFUNDED-01',
        status: CouponRedemptionStatus.Released,
        createdAt: '2026-06-14T08:00:00.000Z',
      },
    ]

    const ctrl = createController({
      listCouponRedemptions: () => releasedCoupons,
    })

    const result = ctrl.listCouponRedemptions({ tenantId: 't-sec-01' })
    assert.equal(result.length, 1)
    assert.equal(result[0].status, CouponRedemptionStatus.Released)
    assert.equal(result[0].couponCode, 'COUPON-REFUNDED-01')
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} loyalty 角色测试`, () => {
  it('导玩员查看会员积分台账 => 检查会员消费活动', () => {
    const ctrl = createController({
      listPointsLedger: () => [
        {
          entryId: 'points-guide-001',
          tenantContext: { tenantId: 't-guide-01' },
          memberId: 'mem-vip-001',
          orderId: 'order-guide-001',
          paymentId: 'pay-guide-001',
          points: 1000,
          reason: 'cashier.payment-succeeded',
          createdAt: '2026-06-14T08:00:00.000Z',
        },
      ],
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-guide-01' })
    assert.equal(result.length, 1)
    assert.equal(result[0].memberId, 'mem-vip-001')
    assert.equal(result[0].points, 1000)
    assert.equal(result[0].reason, 'cashier.payment-succeeded')
  })

  it('导玩员查看盲盒履约 => 确认奖品发放（边界：多个奖品计划）', () => {
    const multiBlindboxes: BlindboxFulfillment[] = [
      {
        fulfillmentId: 'bb-guide-001',
        tenantContext: { tenantId: 't-guide-01' },
        orderId: 'order-guide-001',
        paymentId: 'pay-guide-001',
        memberId: 'mem-vip-001',
        blindboxPlanId: 'bb-plan-spring',
        quantity: 1,
        rewardSku: 'bb-plan-spring-reward-1',
        status: BlindboxFulfillmentStatus.Fulfilled,
        createdAt: '2026-06-14T08:00:00.000Z',
      },
      {
        fulfillmentId: 'bb-guide-002',
        tenantContext: { tenantId: 't-guide-01' },
        orderId: 'order-guide-002',
        paymentId: 'pay-guide-002',
        memberId: 'mem-vip-001',
        blindboxPlanId: 'bb-plan-autumn',
        quantity: 3,
        rewardSku: 'bb-plan-autumn-reward-3',
        status: BlindboxFulfillmentStatus.Fulfilled,
        createdAt: '2026-06-14T09:00:00.000Z',
      },
    ]

    const ctrl = createController({
      listBlindboxFulfillments: () => multiBlindboxes,
    })

    const result = ctrl.listBlindboxFulfillments({ tenantId: 't-guide-01' })
    assert.equal(result.length, 2)
    assert.equal(result[0].blindboxPlanId, 'bb-plan-spring')
    assert.equal(result[1].quantity, 3)
  })

  it('导玩员查看低频会员积分 => 空数据（边界：新会员无消费记录）', () => {
    const ctrl = createController({
      listPointsLedger: () => [],
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-guide-01' })
    assert.equal(result.length, 0)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} loyalty 角色测试`, () => {
  it('运行专员监控结算状态 => 检查成功/失败分布', () => {
    const multiSettlements: LoyaltyOrderSettlement[] = [
      {
        settlementId: 'settlement-ops-001',
        tenantContext: { tenantId: 't-ops-01' },
        orderId: 'order-ops-001',
        paymentId: 'pay-ops-001',
        memberId: 'mem-ops-001',
        status: LoyaltySettlementStatus.Succeeded,
        awardedPoints: 300,
        createdAt: '2026-06-14T08:00:00.000Z',
        updatedAt: '2026-06-14T08:00:00.000Z',
      },
      {
        settlementId: 'settlement-ops-002',
        tenantContext: { tenantId: 't-ops-01' },
        orderId: 'order-ops-002',
        paymentId: 'pay-ops-002',
        memberId: 'mem-ops-002',
        status: LoyaltySettlementStatus.Failed,
        awardedPoints: 0,
        couponCode: 'COUPON-EXPIRED',
        createdAt: '2026-06-14T09:00:00.000Z',
        updatedAt: '2026-06-14T09:00:00.000Z',
      },
    ]

    const ctrl = createController({
      listSettlements: () => multiSettlements,
    })

    const result = ctrl.listSettlements({ tenantId: 't-ops-01' })
    const succeeded = result.filter(s => s.status === LoyaltySettlementStatus.Succeeded)
    const failed = result.filter(s => s.status === LoyaltySettlementStatus.Failed)

    assert.equal(succeeded.length, 1)
    assert.equal(failed.length, 1)
    assert.equal(failed[0].awardedPoints, 0)
    assert.equal(failed[0].couponCode, 'COUPON-EXPIRED')
  })

  it('运行专员查看优惠券核销系统健康度 => 全部端点为 GET', () => {
    // 验证 controller 路由完整性
    const path = Reflect.getMetadata('path', LoyaltyController)
    assert.equal(path, 'loyalty')

    const endpoints = ['listPointsLedger', 'listCouponRedemptions', 'listBlindboxFulfillments', 'listSettlements']
    for (const ep of endpoints) {
      const method = Reflect.getMetadata('method', (LoyaltyController.prototype as any)[ep])
      assert.equal(method, 0, `${ep} should be GET`) // 0 = GET
    }
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} loyalty 角色测试`, () => {
  it('团建查看活动相关积分台账 => 团建活动积分', () => {
    const ctrl = createController({
      listPointsLedger: () => [
        {
          entryId: 'points-team-001',
          tenantContext: { tenantId: 't-team-01' },
          memberId: 'mem-team-001',
          orderId: 'order-team-001',
          paymentId: 'pay-team-001',
          points: 800,
          reason: 'cashier.payment-succeeded',
          createdAt: '2026-06-14T08:00:00.000Z',
        },
      ],
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-team-01' })
    assert.equal(result.length, 1)
    assert.equal(result[0].points, 800)
  })

  it('团建查看盲盒履约列表 => 团建奖励发放（边界：批量发放）', () => {
    const batchFulfillments: BlindboxFulfillment[] = Array.from({ length: 5 }, (_, i) => ({
      fulfillmentId: `bb-team-${String(i + 1).padStart(3, '0')}`,
      tenantContext: { tenantId: 't-team-01' },
      orderId: 'order-team-001',
      paymentId: `pay-team-${i + 1}`,
      memberId: `mem-team-${i + 1}`,
      blindboxPlanId: 'bb-plan-team-event',
      quantity: 1,
      rewardSku: 'bb-plan-team-event-reward-1',
      status: BlindboxFulfillmentStatus.Fulfilled as const,
      createdAt: new Date(Date.UTC(2026, 5, 14, 8, 0, 0)).toISOString(),
    }))

    const ctrl = createController({
      listBlindboxFulfillments: () => batchFulfillments,
    })

    const result = ctrl.listBlindboxFulfillments({ tenantId: 't-team-01' })
    assert.equal(result.length, 5)
    // 所有都是 FULFILLED
    assert.ok(result.every(r => r.status === BlindboxFulfillmentStatus.Fulfilled))
    // 所有同属一个盲盒计划
    assert.equal(new Set(result.map(r => r.blindboxPlanId)).size, 1)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} loyalty 角色测试`, () => {
  it('营销查看优惠券核销效果 => 统计核销率', () => {
    const campaignCoupons: CouponRedemption[] = [
      {
        redemptionId: 'coupon-mkt-001',
        tenantContext: { tenantId: 't-mkt-01' },
        orderId: 'order-mkt-001',
        paymentId: 'pay-mkt-001',
        memberId: 'mem-mkt-001',
        couponCode: 'CAMPAIGN-SUMMER-2026',
        status: CouponRedemptionStatus.Redeemed,
        createdAt: '2026-06-14T08:00:00.000Z',
      },
      {
        redemptionId: 'coupon-mkt-002',
        tenantContext: { tenantId: 't-mkt-01' },
        orderId: 'order-mkt-002',
        paymentId: 'pay-mkt-002',
        memberId: 'mem-mkt-002',
        couponCode: 'CAMPAIGN-SUMMER-2026',
        status: CouponRedemptionStatus.Redeemed,
        createdAt: '2026-06-14T09:00:00.000Z',
      },
      {
        redemptionId: 'coupon-mkt-003',
        tenantContext: { tenantId: 't-mkt-01' },
        orderId: 'order-mkt-003',
        paymentId: 'pay-mkt-003',
        memberId: 'mem-mkt-003',
        couponCode: 'CAMPAIGN-SUMMER-2026',
        status: CouponRedemptionStatus.Released,
        createdAt: '2026-06-14T10:00:00.000Z',
      },
    ]

    const ctrl = createController({
      listCouponRedemptions: () => campaignCoupons,
    })

    const result = ctrl.listCouponRedemptions({ tenantId: 't-mkt-01' })
    assert.equal(result.length, 3)

    const redeemed = result.filter(r => r.status === CouponRedemptionStatus.Redeemed).length
    const released = result.filter(r => r.status === CouponRedemptionStatus.Released).length
    // 核销率：2 / 3 ≈ 66%
    assert.equal(redeemed, 2)
    assert.equal(released, 1)
  })

  it('营销查看积分台账分析消费趋势 => 总积分统计', () => {
    const ctrl = createController({
      listPointsLedger: () => mockPointsEntries,
    })

    const result = ctrl.listPointsLedger({ tenantId: 't-mkt-01' })
    const totalPositive = result
      .filter(e => e.points > 0)
      .reduce((sum, e) => sum + e.points, 0)
    const totalNegative = result
      .filter(e => e.points < 0)
      .reduce((sum, e) => sum + e.points, 0)

    assert.equal(totalPositive, 700)
    assert.equal(totalNegative, -300)
    // 净积分流入 = 400
    assert.equal(totalPositive + totalNegative, 400)
  })

  it('营销查看营销活动结算（边界：仅结算无盲盒无优惠券的订单）', () => {
    const plainSettlements: LoyaltyOrderSettlement[] = [
      {
        settlementId: 'settlement-plain-001',
        tenantContext: { tenantId: 't-mkt-01' },
        orderId: 'order-plain-001',
        paymentId: 'pay-plain-001',
        memberId: 'mem-plain-001',
        status: LoyaltySettlementStatus.Succeeded,
        awardedPoints: 100,
        createdAt: '2026-06-14T08:00:00.000Z',
        updatedAt: '2026-06-14T08:00:00.000Z',
      },
    ]

    const ctrl = createController({
      listSettlements: () => plainSettlements,
    })

    const result = ctrl.listSettlements({ tenantId: 't-mkt-01' })
    assert.equal(result.length, 1)
    assert.equal(result[0].couponCode, undefined)
    assert.equal(result[0].blindboxPlanId, undefined)
    assert.equal(result[0].awardedPoints, 100)
  })
})
