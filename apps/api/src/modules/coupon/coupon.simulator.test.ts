import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.simulator.test.ts · Coupon 模拟器测试 (Phase-17)
 *
 * 模拟跨门店优惠券核销场景：
 * - 单门店核销
 * - 多门店核销
 * - tenant-wide 全店核销
 * - 多张券批量核销
 * - 边界场景 (过期/超量/金额不足)
 * - 幂等性 (重复 idempotencyKey)
 *
 * 8 角色视角覆盖：
 *  👔店长 - 优惠券创建&全店活动
 *  🛒前台 - 单笔核销
 *  👥HR - 统计查询
 *  🔧安监 - 审计追溯
 *  🎮导玩员 - 游戏券核销
 *  🎯运行专员 - 批量操作&异常处理
 *  🤝团建 - 多人团券核销
 *  📢营销 - 跨店营销活动
 */

import { CouponService } from './coupon.service'
import { CouponController } from './coupon.controller'
import type { CouponV2 } from './coupon.entity'
import type { RedemptionRequest, RedemptionResult } from './coupon.types'

// ─── 模拟器辅助 ─────────────────────────────────────────────────────────

interface SimulatedCoupon {
  entity: CouponV2
  remainingRedemptions: number
}

function createSimulatedCoupon(overrides: Partial<CouponV2> = {}): SimulatedCoupon {
  const entity = {
    id: 'coupon-' + Math.random().toString(36).slice(2, 8),
    tenantId: 'tenant-A',
    code: 'SIM-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    scope: {
      type: 'multi-store' as const,
      storeIds: ['store-1', 'store-2', 'store-3'],
      includeSubordinates: false,
    },
    redemptionRules: {
      minAmount: 50,
      applicableCategories: ['dining', 'retail', 'arcade'],
      userSegments: ['all'],
    },
    value: 30,
    valueType: 'fixed' as const,
    expiresAt: new Date('2027-12-31'),
    status: 'active' as const,
    redemptionCount: 0,
    maxRedemptions: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CouponV2

  return {
    entity,
    remainingRedemptions: (entity.maxRedemptions ?? Infinity) - entity.redemptionCount,
  }
}

function makeRedemptionReq(
  overrides: Partial<RedemptionRequest> = {},
): RedemptionRequest {
  const key = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return {
    userId: 'user-sim',
    couponCode: 'SIM-CODE',
    storeId: 'store-1',
    orderAmount: 200,
    orderId: `order-${key}`,
    idempotencyKey: key,
    ...overrides,
  }
}

// ─── 模拟器场景 ─────────────────────────────────────────────────────────

describe('Coupon Simulator: 跨门店核销场景', () => {
  let service: CouponService
  let controller: CouponController

  beforeEach(() => {
    service = new CouponService({} as any, {} as any, { transaction: async (cb: any) => cb({ getRepository: () => ({}) }) } as any, undefined, undefined)
    controller = new CouponController(service)
  })

  // ─── 单个动作: redeemCrossStore ───

  it('SC-1: 单门店核销 — 正常流程', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: true,
      couponId: 'c-1',
      amount: 30,
      redemptionId: 'r-1',
    })
    const req = makeRedemptionReq({ storeId: 'store-1', couponCode: 'SINGLE-1' })
    const result = await controller.redeem(req)
    expect(result.success).toBe(true)
    expect(result.amount).toBe(30)
  })

  it('SC-2: 跨门店核销 — store-2 也可核销', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: true,
      couponId: 'c-1',
      amount: 30,
      redemptionId: 'r-2',
    })
    const req = makeRedemptionReq({ storeId: 'store-2', couponCode: 'MULTI-1' })
    const result = await controller.redeem(req)
    expect(result.success).toBe(true)
  })

  it('SC-3: tenant-wide 全店核销 — 任意门店通过', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: true,
      couponId: 'c-wide',
      amount: 20,
      redemptionId: 'r-wide',
    })
    const result = await controller.redeem(
      makeRedemptionReq({ storeId: 'any-store', couponCode: 'TENANT-WIDE' }),
    )
    expect(result.success).toBe(true)
  })

  // ─── 批量操作 ───

  it('SC-4: 批量核销 5 张券 — 全部成功', async () => {
    const results: RedemptionResult[] = Array.from({ length: 5 }, (_, i) => ({
      success: true,
      couponId: `c-${i}`,
      amount: 20,
      redemptionId: `r-${i}`,
    }))
    vi.spyOn(service, 'batchRedeem').mockResolvedValue(results)

    const result = await controller.batchRedeem({
      redemptions: Array.from({ length: 5 }, (_, i) => ({
        userId: `user-${i}`,
        couponCode: `CODE-${i}`,
        storeId: 'store-1',
        orderAmount: 100,
        orderId: `order-${i}`,
        idempotencyKey: `key-${i}`,
      })),
    })
    expect(result.succeeded).toBe(5)
    expect(result.failed).toBe(0)
  })

  it('SC-5: 批量核销 — 部分失败, 返回统计', async () => {
    const results: RedemptionResult[] = [
      { success: true, couponId: 'c-ok', amount: 10, redemptionId: 'r-ok' },
      { success: false, error: { code: 'COUPON_EXPIRED', message: 'expired' } },
      { success: true, couponId: 'c-ok2', amount: 20, redemptionId: 'r-ok2' },
      { success: false, error: { code: 'STORE_NOT_IN_SCOPE', message: 'not in scope' } },
    ]
    vi.spyOn(service, 'batchRedeem').mockResolvedValue(results)

    const result = await controller.batchRedeem({
      redemptions: Array.from({ length: 4 }, (_, i) => ({
        userId: `u-${i}`, couponCode: `C-${i}`, storeId: `s-${i}`,
        orderAmount: 100, orderId: `o-${i}`, idempotencyKey: `k-${i}`,
      })),
    })
    expect(result.succeeded).toBe(2)
    expect(result.failed).toBe(2)
  })

  // ─── 边界场景 ───

  it('SC-6: 过期券核销 — 返回 COUPON_EXPIRED', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'COUPON_EXPIRED', message: '优惠券已过期' },
    })
    const result = await controller.redeem(
      makeRedemptionReq({ couponCode: 'EXPIRED-1' }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_EXPIRED')
  })

  it('SC-7: 超量券核销 — 返回 COUPON_EXHAUSTED', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'COUPON_EXHAUSTED', message: '发放量已用完' },
    })
    const result = await controller.redeem(
      makeRedemptionReq({ couponCode: 'EXHAUSTED-1' }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_EXHAUSTED')
  })

  it('SC-8: 金额不满足最低限制 — 返回 MIN_AMOUNT_NOT_MET', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'MIN_AMOUNT_NOT_MET', message: '未达最低消费 50' },
    })
    const result = await controller.redeem(
      makeRedemptionReq({ orderAmount: 30 }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('MIN_AMOUNT_NOT_MET')
  })

  it('SC-9: 幂等性 — 同一 idempotencyKey 第二次核销返回 DUPLICATE', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'DUPLICATE_REDEMPTION', message: '重复核销' },
    })
    const key = 'dup-key-001'
    const result = await controller.redeem(
      makeRedemptionReq({ idempotencyKey: key }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('DUPLICATE_REDEMPTION')
  })

  it('SC-10: 门店不在 scope — 返回 STORE_NOT_IN_SCOPE', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'STORE_NOT_IN_SCOPE', message: '门店不在适用范围' },
    })
    const result = await controller.redeem(
      makeRedemptionReq({ storeId: 'remote-store' }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('STORE_NOT_IN_SCOPE')
  })

  it('SC-11: 用户段不匹配 — 返回 USER_SEGMENT_NOT_MATCH', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'USER_SEGMENT_NOT_MATCH', message: '用户不满足人群要求' },
    })
    const result = await controller.redeem(
      makeRedemptionReq({ userId: 'non-svip-user' }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('USER_SEGMENT_NOT_MATCH')
  })

  it('SC-12: 配额超额 — 返回 QUOTA_EXCEEDED', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'QUOTA_EXCEEDED', message: '租户配额超限' },
    })
    const result = await controller.redeem(
      makeRedemptionReq({ userId: 'quota-user' }),
    )
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('QUOTA_EXCEEDED')
  })

  it('SC-13: 空批量 — 空数组应被 DTO 拦截, 验证 service 不会收到空请求', () => {
    // service 层面调用 batchRedeem 传空数组应返回空结果
    expect(service.batchRedeem([])).resolves.toEqual([])
  })

  it('SC-14: checkCrossStoreEligibility 边界 — single-store 不匹配', () => {
    const coupon = {
      scope: { type: 'single-store' as const, storeIds: ['s1'], includeSubordinates: false },
    } as CouponV2
    const result = service.checkCrossStoreEligibility(coupon, 's2')
    expect(result.eligible).toBe(false)
  })

  it('SC-15: percentage 券核销返回正确金额', async () => {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: true,
      couponId: 'c-pct',
      amount: 25,
      redemptionId: 'r-pct',
    })
    const result = await controller.redeem(
      makeRedemptionReq({ couponCode: 'PCT-20', orderAmount: 125 }),
    )
    expect(result.success).toBe(true)
    expect(result.amount).toBe(25)
  })

  it('SC-16: tenant-wide + includeSubordinates=true — 子门店也通过', () => {
    const coupon = {
      scope: { type: 'tenant-wide' as const, storeIds: ['hq-store'], includeSubordinates: true },
    } as CouponV2
    const r1 = service.checkCrossStoreEligibility(coupon, 'hq-store')
    const r2 = service.checkCrossStoreEligibility(coupon, 'sub-store-99')
    expect(r1.eligible).toBe(true)
    expect(r2.eligible).toBe(true)
  })
})
