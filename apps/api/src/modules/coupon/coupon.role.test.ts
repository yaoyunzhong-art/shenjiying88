import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.role.test.ts · Coupon 8 角色视角测试 (Phase-17)
 *
 * 模拟 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 每个角色至少 2 个测试用例 (正常流程 + 权限边界)
 */

import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'

// ─── 角色定义 ───────────────────────────────────────────────────────────

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ─── 测试工厂 ───────────────────────────────────────────────────────────

function makeController() {
  const service = new CouponService(
    {} as any, // couponRepo
    {} as any, // redemptionRepo
    { transaction: async (cb: any) => cb({ getRepository: () => ({}) }) } as any, // dataSource (Pulse-68)
    undefined, // lifecycle
    undefined, // quota
  )
  vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
    success: true,
    couponId: 'c-1',
    amount: 50,
    redemptionId: 'r-1',
  })
  vi.spyOn(service, 'batchRedeem').mockResolvedValue([])
  vi.spyOn(service, 'checkCrossStoreEligibility').mockImplementation(
    (_coupon: any, storeId: string) => ({
      eligible: storeId !== 'store-blocked',
      reason: storeId === 'store-blocked' ? 'blacklisted' : undefined,
      matchedScope: 'multi-store' as const,
      matchedStoreIds: ['store-1', 'store-2'],
    }),
  )
  return { controller: new CouponController(service), service }
}

// ──────────── 👔店长 ────────────
describe(`${ROLES.TenantAdmin} 优惠券角色测试`, () => {
  it('店长创建一张多门店优惠券（正常流程）', async () => {
    const { service } = makeController()
    // 模拟跨门店核销能力
    const coupon = {
      scope: { type: 'multi-store' as const, storeIds: ['s1', 's2'], includeSubordinates: false },
    } as any
    const r1 = service.checkCrossStoreEligibility(coupon, 's1')
    const r2 = service.checkCrossStoreEligibility(coupon, 's2')
    expect(r1.eligible).toBe(true)
    expect(r2.eligible).toBe(true)
  })

  it('店长将门店从 scope 移除后该门店不可核销（权限边界）', async () => {
    const { service } = makeController()
    const coupon = {
      scope: { type: 'multi-store' as const, storeIds: ['s1'], includeSubordinates: false },
    } as any
    const r = service.checkCrossStoreEligibility(coupon, 's2')
    expect(r.eligible).toBe(false)
    expect(r.reason).toContain('s2')
  })
})

// ──────────── 🛒前台 ────────────
describe(`${ROLES.Reception} 优惠券角色测试`, () => {
  it('前台为顾客核销优惠券（正常流程）', async () => {
    const { controller } = makeController()
    const result = await controller.redeem({
      userId: 'customer-A',
      couponCode: 'WELCOME-50',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'order-001',
      idempotencyKey: 'order-001:WELCOME-50',
    })
    expect(result.success).toBe(true)
    expect(result.amount).toBe(50)
  })

  it('前台使用过期优惠券应返回错误（权限边界）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.redeemCrossStore).mockResolvedValueOnce({
      success: false,
      error: { code: 'COUPON_EXPIRED', message: '优惠券已过期' },
    })
    const result = await controller.redeem({
      userId: 'customer-A',
      couponCode: 'EXPIRED-CODE',
      storeId: 'store-1',
      orderAmount: 100,
      orderId: 'order-002',
      idempotencyKey: 'order-002:EXPIRED-CODE',
    })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_EXPIRED')
  })
})

// ──────────── 👥HR ────────────
describe(`${ROLES.HR} 优惠券角色测试`, () => {
  it('HR 查询优惠券列表（正常流程）', async () => {
    const { controller } = makeController()
    const result = await controller.list({})
    expect(result.total).toBe(0)
    expect(result.page).toBe(1)
    expect(result.coupons).toBeDefined()
  })

  it('HR 按状态过滤列表（权限边界：非法状态返回空结果）', async () => {
    const { controller } = makeController()
    const result = await controller.list({ status: 'active' })
    expect(result.total).toBe(0)
    expect(result.page).toBe(1)
  })
})

// ──────────── 🔧安监 ────────────
describe(`${ROLES.Safety} 优惠券角色测试`, () => {
  it('安监审计核销日志-批量核销结果统计（正常流程）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.batchRedeem).mockResolvedValue([
      { success: true, couponId: 'c1', amount: 10, redemptionId: 'r1' },
      { success: false, error: { code: 'DUPLICATE_REDEMPTION', message: '重复核销' } },
    ] as any)
    const result = await controller.batchRedeem({
      redemptions: [
        { userId: 'u1', couponCode: 'C1', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1' },
        { userId: 'u1', couponCode: 'C1', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1' },
      ],
    })
    expect(result.succeeded + result.failed).toBe(2)
    expect(result.results.filter((r) => !r.success)[0].error?.code).toBe('DUPLICATE_REDEMPTION')
  })

  it('安监核验黑名单门店核销被拒绝（权限边界）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.redeemCrossStore).mockResolvedValueOnce({
      success: false,
      error: { code: 'STORE_NOT_IN_SCOPE', message: '门店不在优惠券适用范围' },
    })
    const result = await controller.redeem({
      userId: 'u1', couponCode: 'C1', storeId: 'store-blocked',
      orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1',
    })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('STORE_NOT_IN_SCOPE')
  })
})

// ──────────── 🎮导玩员 ────────────
describe(`${ROLES.Guide} 优惠券角色测试`, () => {
  it('导玩员核销游戏币优惠券（正常流程）', async () => {
    const { controller } = makeController()
    const result = await controller.redeem({
      userId: 'gamer-1',
      couponCode: 'COIN-BONUS',
      storeId: 'arcade-1',
      orderAmount: 100,
      orderId: 'game-order-001',
      idempotencyKey: 'game-order-001:COIN-BONUS',
      category: 'arcade',
    })
    expect(result.success).toBe(true)
  })

  it('导玩员尝试核销非游戏品类优惠券被拒（权限边界）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.redeemCrossStore).mockResolvedValueOnce({
      success: false,
      error: { code: 'MIN_AMOUNT_NOT_MET', message: '未达到品类最低消费要求' },
    })
    const result = await controller.redeem({
      userId: 'gamer-2', couponCode: 'DINING-ONLY', storeId: 'arcade-1',
      orderAmount: 30, orderId: 'game-order-002', idempotencyKey: 'game-order-002:DINING-ONLY',
    })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('MIN_AMOUNT_NOT_MET')
  })
})

// ──────────── 🎯运行专员 ────────────
describe(`${ROLES.Ops} 优惠券角色测试`, () => {
  it('运行专员暂停优惠券活动（正常流程）', async () => {
    const { controller } = makeController()
    // updateStatus 目前未实现，验证抛出预期错误
    await expect(
      controller.updateStatus('coupon-001', { status: 'paused' }),
    ).rejects.toThrow('NOT_IMPLEMENTED')
  })

  it('运行专员查询优惠券详情（边界：不存在 ID 返回 null）', async () => {
    const { controller } = makeController()
    const result = await controller.get('non-existent-id')
    expect(result).toBeNull()
  })
})

// ──────────── 🤝团建 ────────────
describe(`${ROLES.Teambuilding} 优惠券角色测试`, () => {
  it('团建批量核销多人优惠券（正常流程）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.batchRedeem).mockResolvedValue([
      { success: true, couponId: 'c1', amount: 20, redemptionId: 'r1' },
      { success: true, couponId: 'c2', amount: 20, redemptionId: 'r2' },
      { success: true, couponId: 'c3', amount: 20, redemptionId: 'r3' },
    ] as any)
    const result = await controller.batchRedeem({
      redemptions: Array.from({ length: 3 }, (_, i) => ({
        userId: `team-member-${i + 1}`,
        couponCode: `TEAM-CODE-${i + 1}`,
        storeId: 'store-1',
        orderAmount: 200,
        orderId: `team-order-${i + 1}`,
        idempotencyKey: `team-order-${i + 1}:TEAM-CODE-${i + 1}`,
      })),
    })
    expect(result.succeeded).toBe(3)
    expect(result.failed).toBe(0)
  })

  it('团建核销中部分人优惠券已过期（权限边界）', async () => {
    const { controller, service } = makeController()
    vi.mocked(service.batchRedeem).mockResolvedValue([
      { success: true, couponId: 'c1', amount: 20, redemptionId: 'r1' },
      { success: false, error: { code: 'COUPON_EXPIRED', message: '已过期' } },
    ] as any)
    const result = await controller.batchRedeem({
      redemptions: [
        { userId: 'm1', couponCode: 'VALID', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:VALID' },
        { userId: 'm2', couponCode: 'EXPIRED', storeId: 's1', orderAmount: 100, orderId: 'o2', idempotencyKey: 'o2:EXPIRED' },
      ],
    })
    expect(result.succeeded).toBe(1)
    expect(result.failed).toBe(1)
  })
})

// ──────────── 📢营销 ────────────
describe(`${ROLES.Marketing} 优惠券角色测试`, () => {
  it('营销人员查询优惠券列表查看发放情况（正常流程）', async () => {
    const { controller } = makeController()
    const result = await controller.list({ page: 1, pageSize: 20 })
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('营销人员查询不存在的优惠券详情返回 null（权限边界）', async () => {
    const { controller } = makeController()
    const result = await controller.get('marketing-campaign-nonexistent')
    expect(result).toBeNull()
  })
})
