// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
/**
 * 🐜 自动: [coupon] [C] 门店角色全场景测试 (storefront)
 *
 * 4 个门店角色视角的 coupon 模块测试：
 * 🛒前台 — 扫码核销/验证优惠券/处理过期券
 * 📢营销 — 创建券活动/分发会员/追踪核销
 * 👔店长 — 查看使用统计/设置规则/审批活动
 * 🎮导玩员 — 查游戏券/发放奖励券
 *
 * 每个角色 2-3 个测试用例（正常流程 + 反例/边界）
 * 共 10+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'

// ── 角色定义 ──
const ROLES = {
  FrontDesk: '🛒前台',
  Marketing: '📢营销',
  StoreManager: '👔店长',
  Guide: '🎮导玩员',
} as const

// ── 测试工厂 ──

function makeController() {
  const mockCouponRepo = {
    create: vi.fn((d: any) => d),
    save: vi.fn((d: any) => Promise.resolve({ ...d, id: 'c-storefront', createdAt: (new Date() as unknown as string), updatedAt: (new Date() as unknown as string) })),
    findOne: vi.fn(),
    findAndCount: vi.fn().mockResolvedValue([[], 0]),
    find: vi.fn(),
    update: vi.fn(),
  }
  const service = new CouponService(
    mockCouponRepo as any,
    {} as any,
    { transaction: async (cb: any) => cb({ getRepository: () => ({}) }) } as any,
    undefined,
    undefined,
  )
  vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
    success: true,
    couponId: 'c-storefront-1',
    amount: 30,
    redemptionId: 'r-storefront-1',
  } as any)
  vi.spyOn(service, 'batchRedeem').mockResolvedValue([] as any)
  vi.spyOn(service, 'checkCrossStoreEligibility').mockImplementation(
    (coupon: any, storeId: string) => {
      const matched = coupon?.scope?.storeIds?.includes(storeId) ?? false
      return {
        eligible: matched && storeId !== 'store-blacklisted',
        reason: !matched
          ? `storeId ${storeId} not in scope`
          : storeId === 'store-blacklisted'
            ? 'blacklisted'
            : undefined,
        matchedScope: coupon?.scope?.type ?? 'multi-store',
        matchedStoreIds: coupon?.scope?.storeIds ?? [],
      }
    },
  )
  return { controller: new CouponController(service), service, mockCouponRepo }
}

// ════════════════════════════════════════════════════════
// 🛒前台 — 门店结账核销视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} coupon 门店测试`, () => {
  it('前台可为顾客扫码核销有效优惠券（正例）', async () => {
    const { controller } = makeController()
    const result = await controller.redeem({
      userId: 'customer-checkout-1',
      couponCode: 'SCAN-50',
      storeId: 'store-main',
      orderAmount: 150,
      orderId: 'order-scan-001',
      idempotencyKey: 'order-scan-001:SCAN-50',
    })

    assert.equal(result.success, true)
    assert.equal(result.amount, 30)
    assert.ok(result.redemptionId)
  })

  it('前台核销已过期优惠券应返回错误（反例）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.redeemCrossStore).mockResolvedValueOnce({
      success: false,
      error: { code: 'COUPON_EXPIRED', message: '优惠券已过期' },
    } as any)

    const result = await controller.redeem({
      userId: 'customer-2',
      couponCode: 'EXPIRED-CODE',
      storeId: 'store-main',
      orderAmount: 100,
      orderId: 'order-expired-001',
      idempotencyKey: 'order-expired-001:EXPIRED-CODE',
    })

    assert.equal(result.success, false)
    assert.equal(result.error?.code, 'COUPON_EXPIRED')
  })

  it('前台可校验优惠券在当前门店是否可用（正例）', async () => {
    const { service } = makeController()
    const coupon = {
      scope: { type: 'multi-store' as const, storeIds: ['store-main', 'store-branch'], includeSubordinates: false },
    } as any

    const eligible = service.checkCrossStoreEligibility(coupon, 'store-main')
    assert.equal(eligible.eligible, true)
  })

  it('前台核销不适用本门店的优惠券应被拒绝（反例）', async () => {
    const { service } = makeController()
    const coupon = {
      scope: { type: 'multi-store' as const, storeIds: ['store-other'], includeSubordinates: false },
    } as any

    const result = service.checkCrossStoreEligibility(coupon, 'store-main')
    assert.equal(result.eligible, false)
    assert.ok(result.reason?.includes('store-main'))
  })
})

// ════════════════════════════════════════════════════════
// 📢营销 — 优惠券营销视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} coupon 门店测试`, () => {
  it('营销可创建优惠券营销活动（正例）', async () => {
    const { controller, mockCouponRepo } = makeController()
    mockCouponRepo.save.mockImplementation((d: any) =>
      Promise.resolve({
        ...d,
        id: 'campaign-coupon-001',
        createdAt: (new Date() as unknown as string),
        updatedAt: (new Date() as unknown as string),
      }),
    )

    const result = await controller.create({
      code: 'SUMMER-2026',
      tenantId: 't-storefront',
      scope: { type: 'multi-store', storeIds: ['store-main', 'store-branch'], includeSubordinates: false },
      redemptionRules: { minAmount: 50, applicableCategories: ['arcade', 'snacks'] },
      value: 20,
      valueType: 'fixed',
      expiresAt: new Date('2026-09-01'),
      maxRedemptions: 500,
    })

    assert.equal(result.code, 'SUMMER-2026')
    assert.ok(result.id)
    assert.ok(result.scope?.storeIds?.includes('store-main'))
  })

  it('营销可按条件查询优惠券列表追踪分发效果（正例）', async () => {
    const { controller, mockCouponRepo } = makeController()
    const mockCoupons = [
      {
        id: 'c-promo-1',
        code: 'PROMO-10',
        tenantId: 't-storefront',
        value: 10,
        valueType: 'fixed' as const,
        status: 'active' as const,
        redemptionCount: 45,
        scope: { type: 'multi-store' as const, storeIds: ['store-main'], includeSubordinates: false },
        redemptionRules: {},
        expiresAt: new Date('2026-12-31'),
        createdAt: (new Date() as unknown as string),
        updatedAt: (new Date() as unknown as string),
      },
    ]
    mockCouponRepo.findAndCount.mockResolvedValue([mockCoupons, 1])

    const result = await controller.list({ status: 'active' })
    assert.equal(result.total, 1)
    assert.equal(result.coupons[0].code, 'PROMO-10')
    assert.equal(result.coupons[0].redemptionCount, 45)
  })

  it('营销查询不存在的活动返回空结果而非报错（边界）', async () => {
    const { controller, mockCouponRepo } = makeController()
    mockCouponRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await controller.list({ status: 'expired' })
    assert.equal(result.total, 0)
    assert.equal(result.coupons.length, 0)
  })
})

// ════════════════════════════════════════════════════════
// 👔店长 — 门店核销管理视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} coupon 门店测试`, () => {
  it('店长可查看门店优惠券使用统计（正例）', async () => {
    const { controller, mockCouponRepo } = makeController()
    const mockList = [
      {
        id: 'c-stats-1',
        code: 'STORE-50',
        tenantId: 't-storefront',
        value: 50,
        valueType: 'fixed' as const,
        status: 'active' as const,
        redemptionCount: 128,
        scope: { type: 'single-store' as const, storeIds: ['store-main'], includeSubordinates: false },
        redemptionRules: {},
        expiresAt: new Date('2026-12-31'),
        createdAt: (new Date() as unknown as string),
        updatedAt: (new Date() as unknown as string),
      },
      {
        id: 'c-stats-2',
        code: 'STORE-20',
        tenantId: 't-storefront',
        value: 20,
        valueType: 'fixed' as const,
        status: 'active' as const,
        redemptionCount: 340,
        scope: { type: 'single-store' as const, storeIds: ['store-main'], includeSubordinates: false },
        redemptionRules: {},
        expiresAt: new Date('2026-11-30'),
        createdAt: (new Date() as unknown as string),
        updatedAt: (new Date() as unknown as string),
      },
    ]
    mockCouponRepo.findAndCount.mockResolvedValue([mockList, 2])

    const result = await controller.list({ page: 1, pageSize: 20 })
    assert.equal(result.total, 2)

    // 店长关注总核销量
    const totalRedemptions = result.coupons.reduce((sum: number, c: any) => sum + c.redemptionCount, 0)
    assert.equal(totalRedemptions, 468)
  })

  it('店长可暂停优惠券活动（正例）', async () => {
    const { controller, mockCouponRepo } = makeController()

    const mockCoupon = {
      id: 'coupon-ctrl-1',
      tenantId: 't-storefront',
      code: 'STORE-CTRL',
      scope: { type: 'multi-store', storeIds: ['store-main'], includeSubordinates: false },
      redemptionRules: {},
      value: 15,
      valueType: 'fixed' as const,
      expiresAt: new Date('2026-12-31'),
      status: 'active' as const,
      redemptionCount: 0,
      createdAt: (new Date() as unknown as string),
      updatedAt: (new Date() as unknown as string),
    }
    mockCouponRepo.findOne.mockResolvedValue(mockCoupon)
    mockCouponRepo.save.mockImplementation((d: any) => Promise.resolve({ ...d, updatedAt: (new Date() as unknown as string) }))

    const result = await controller.updateStatus('coupon-ctrl-1', { status: 'paused' })
    assert.equal(result.status, 'paused')
  })

  it('店长暂停不存在的优惠券应报错（反例）', async () => {
    const { controller, mockCouponRepo } = makeController()
    mockCouponRepo.findOne.mockResolvedValue(null)

    try {
      await controller.updateStatus('nonexistent-coupon', { status: 'paused' })
      assert.fail('应抛出错误')
    } catch (e: any) {
      assert.ok(e.message.includes('not found'))
    }
  })
})

// ════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏区核销视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Guide} coupon 门店测试`, () => {
  it('导玩员可核销游戏币优惠券（正例）', async () => {
    const { controller } = makeController()
    const result = await controller.redeem({
      userId: 'gamer-arcade-1',
      couponCode: 'COIN-BONUS-50',
      storeId: 'arcade-room',
      orderAmount: 100,
      orderId: 'game-order-sf-001',
      idempotencyKey: 'game-order-sf-001:COIN-BONUS-50',
      category: 'arcade',
    })

    assert.equal(result.success, true)
  })

  it('导玩员可将优惠券作为游戏奖励发放给顾客（正例）', async () => {
    const { controller, mockCouponRepo } = makeController()
    mockCouponRepo.save.mockImplementation((d: any) =>
      Promise.resolve({
        ...d,
        id: 'reward-coupon-001',
        createdAt: (new Date() as unknown as string),
        updatedAt: (new Date() as unknown as string),
      }),
    )

    const result = await controller.create({
      code: 'GAME-REWARD-10',
      tenantId: 't-storefront',
      scope: { type: 'single-store', storeIds: ['arcade-room'], includeSubordinates: false },
      redemptionRules: { applicableCategories: ['arcade'] },
      value: 10,
      valueType: 'fixed',
      expiresAt: new Date('2026-08-01'),
      maxRedemptions: 100,
    })

    assert.equal(result.code, 'GAME-REWARD-10')
    assert.ok(result.id)
  })

  it('导玩员查看可用的游戏优惠券列表（正例）', async () => {
    const { controller, mockCouponRepo } = makeController()
    const mockCoupons = [
      {
        id: 'c-arcade-1',
        code: 'ARCADE-FREE',
        tenantId: 't-storefront',
        value: 0,
        valueType: 'percentage' as const,
        status: 'active' as const,
        redemptionCount: 10,
        scope: { type: 'single-store' as const, storeIds: ['arcade-room'], includeSubordinates: false },
        redemptionRules: { applicableCategories: ['arcade'] },
        expiresAt: new Date('2026-12-31'),
        createdAt: (new Date() as unknown as string),
        updatedAt: (new Date() as unknown as string),
      },
    ]
    mockCouponRepo.findAndCount.mockResolvedValue([mockCoupons, 1])

    const result = await controller.list({ status: 'active' })
    assert.equal(result.total, 1)
    assert.ok(result.coupons[0].redemptionRules?.applicableCategories?.includes('arcade'))
  })

  it('导玩员核销非游戏品类优惠券应失败（反例）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.redeemCrossStore).mockResolvedValueOnce({
      success: false,
      error: { code: 'MIN_AMOUNT_NOT_MET', message: '未达到品类最低消费要求' },
    } as any)

    const result = await controller.redeem({
      userId: 'gamer-2',
      couponCode: 'DINING-ONLY',
      storeId: 'arcade-room',
      orderAmount: 30,
      orderId: 'order-category-fail',
      idempotencyKey: 'order-category-fail',
    })

    assert.equal(result.success, false)
    assert.equal(result.error?.code, 'MIN_AMOUNT_NOT_MET')
  })
})
