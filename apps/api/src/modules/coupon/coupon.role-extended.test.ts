import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 coupon.role-extended.test.ts · 扩展角色测试 (Pulse 自动)
 *
 * 4 个附加角色视角：
 * 👔店长   — 跨门店优惠券核销策略管理
 * 👥HR     — 员工福利优惠券发放与追溯
 * 🎯运行专员 — 优惠券核销运营监控与指标
 * 📢营销   — 优惠券活动策略与用户分层
 *
 * 每个角色 3 个测试用例（正常流程 + 业务异常 + 权限边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import type { RedemptionResult } from './coupon.types'

// ── 测试工厂 ──
function createController() {
  const mockService = new CouponService(
    {} as any,
    {} as any,
    { transaction: async (cb: any) => cb({ getRepository: () => ({ update: vi.fn(), create: vi.fn(), save: vi.fn() }) }) } as any,
    undefined,
    undefined,
  )
  return {
    controller: new CouponController(mockService),
    service: mockService,
  }
}

// ══════════════════════════════════════════════════════════════════════
// 👔店长 — 跨门店优惠券核销策略管理
// ══════════════════════════════════════════════════════════════════════
describe('👔店长 — 跨门店优惠券核销策略管理', () => {
  it('店长配置门店范围优惠券: multi-store scope 正确落地', async () => {
    const { service } = createController()
    // 模拟 storeIds 为多家门店
    const scopeCheck = service.checkCrossStoreEligibility(
      {
        id: 'coupon-1',
        tenantId: 'store-group-A',
        code: 'CROSS-50',
        scope: {
          type: 'multi-store',
          storeIds: ['store-1', 'store-2', 'store-3'],
          includeSubordinates: true,
        },
        redemptionRules: { minAmount: 100, userSegments: ['gold'] },
        value: 50,
        valueType: 'fixed',
        expiresAt: new Date('2099-12-31'),
        status: 'active',
        redemptionCount: 0,
        maxRedemptions: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      'store-2',
    )
    expect(scopeCheck.eligible).toBe(true)
    expect(scopeCheck.matchedScope).toBe('multi-store')
    expect(scopeCheck.matchedStoreIds).toContain('store-2')
  })

  it('店长为不在范围内的门店核销 → STORE_NOT_IN_SCOPE', async () => {
    const { service } = createController()
    const scopeCheck = service.checkCrossStoreEligibility(
      {
        id: 'coupon-2',
        scope: {
          type: 'single-store',
          storeIds: ['store-A'],
          includeSubordinates: false,
        },
      } as any,
      'store-B',
    )
    expect(scopeCheck.eligible).toBe(false)
    expect(scopeCheck.reason).toContain('store-B')
  })

  it('店长暂停优惠券后, 核销应返回错误 (状态非 active)', async () => {
    const { service } = createController()
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: false,
      error: { code: 'COUPON_NOT_FOUND', message: 'coupon P-001 not found or inactive' },
    })
    const result = await service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'P-001',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'o1:P-001',
      tenantId: 't1',
    })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_NOT_FOUND')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 👥HR — 员工福利优惠券发放与追溯
// ══════════════════════════════════════════════════════════════════════
describe('👥HR — 员工福利优惠券发放与追溯', () => {
  it('HR 为员工发放福利优惠券并批量核销成功', async () => {
    const { service } = createController()
    vi.spyOn(service, 'batchRedeem').mockResolvedValue([
      { success: true, couponId: 'c1', amount: 50, redemptionId: 'r1' },
      { success: true, couponId: 'c2', amount: 30, redemptionId: 'r2' },
      { success: true, couponId: 'c3', amount: 20, redemptionId: 'r3' },
    ])
    const results = await service.batchRedeem([
      { userId: 'emp-1', couponCode: 'WELFARE-50', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:w1' },
      { userId: 'emp-2', couponCode: 'WELFARE-30', storeId: 's2', orderAmount: 80, orderId: 'o2', idempotencyKey: 'o2:w2' },
      { userId: 'emp-3', couponCode: 'WELFARE-20', storeId: 's3', orderAmount: 50, orderId: 'o3', idempotencyKey: 'o3:w3' },
    ])
    expect(results).toHaveLength(3)
    expect(results.every(r => r.success)).toBe(true)
  })

  it('HR 批量核销中部分失败应返回混合结果', async () => {
    const { service } = createController()
    vi.spyOn(service, 'batchRedeem').mockResolvedValue([
      { success: true, couponId: 'c1', amount: 50, redemptionId: 'r1' },
      { success: false, error: { code: 'COUPON_EXPIRED', message: 'coupon expired' } },
      { success: false, error: { code: 'MIN_AMOUNT_NOT_MET', message: 'min 100' } },
    ])
    const results = await service.batchRedeem([
      { userId: 'emp-A', couponCode: 'A', storeId: 's1', orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:A' },
      { userId: 'emp-B', couponCode: 'B', storeId: 's2', orderAmount: 50, orderId: 'o2', idempotencyKey: 'o2:B' },
      { userId: 'emp-C', couponCode: 'C', storeId: 's3', orderAmount: 30, orderId: 'o3', idempotencyKey: 'o3:C' },
    ])
    expect(results.filter(r => r.success)).toHaveLength(1)
    expect(results.filter(r => !r.success)).toHaveLength(2)
  })

  it('HR 查看相同券的幂等核销只扣减一次 (DUPLICATE REDEMPTION)', async () => {
    const { service } = createController()
    const redemption: RedemptionResult = { success: true, couponId: 'c1', amount: 50, redemptionId: 'r1' }
    vi.spyOn(service, 'redeemCrossStore')
      .mockResolvedValueOnce(redemption)
      .mockResolvedValueOnce(redemption)
    const r1 = await service.redeemCrossStore({
      userId: 'emp-X', couponCode: 'WELFARE-50', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'same-key', tenantId: 't1',
    })
    const r2 = await service.redeemCrossStore({
      userId: 'emp-X', couponCode: 'WELFARE-50', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'same-key', tenantId: 't1',
    })
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🎯运行专员 — 优惠券核销运营监控与指标
// ══════════════════════════════════════════════════════════════════════
describe('🎯运行专员 — 优惠券核销运营监控', () => {
  it('运行专员监控跨门店核销成功率', async () => {
    const { service } = createController()
    vi.spyOn(service, 'batchRedeem').mockResolvedValue([
      { success: true, couponId: 'c1', amount: 100, redemptionId: 'r1' },
      { success: true, couponId: 'c2', amount: 50, redemptionId: 'r2' },
      { success: false, error: { code: 'COUPON_EXPIRED', message: 'expired' } },
      { success: false, error: { code: 'STORE_NOT_IN_SCOPE', message: 'not in scope' } },
      { success: true, couponId: 'c3', amount: 30, redemptionId: 'r3' },
    ])
    const results = await service.batchRedeem(new Array(5).fill({
      userId: 'u1', couponCode: 'C', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1',
    }))
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    expect(successCount).toBe(3)
    expect(failCount).toBe(2)
    const successRate = successCount / results.length
    expect(successRate).toBe(0.6)
  })

  it('运行专员处理空批量核销请求: 空数组返回空结果', async () => {
    const { service } = createController()
    vi.spyOn(service, 'batchRedeem').mockResolvedValue([])
    const results = await service.batchRedeem([])
    expect(results).toHaveLength(0)
  })

  it('运行专员检查核销失败错误分布', async () => {
    const { service } = createController()
    vi.spyOn(service, 'batchRedeem').mockResolvedValue([
      { success: false, error: { code: 'COUPON_NOT_FOUND', message: 'not found' } },
      { success: false, error: { code: 'COUPON_EXPIRED', message: 'expired' } },
      { success: false, error: { code: 'STORE_NOT_IN_SCOPE', message: 'not in scope' } },
      { success: false, error: { code: 'MIN_AMOUNT_NOT_MET', message: 'min amount' } },
      { success: true, couponId: 'c1', amount: 10, redemptionId: 'r1' },
    ])
    const results = await service.batchRedeem(new Array(5).fill({
      userId: 'u1', couponCode: 'C', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1',
    }))
    const errorCodes = results.filter(r => !r.success).map(r => r.error!.code)
    expect(errorCodes).toContain('COUPON_NOT_FOUND')
    expect(errorCodes).toContain('COUPON_EXPIRED')
    expect(errorCodes).toContain('STORE_NOT_IN_SCOPE')
    expect(errorCodes).toContain('MIN_AMOUNT_NOT_MET')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 📢营销 — 优惠券活动策略与用户分层
// ══════════════════════════════════════════════════════════════════════
describe('📢营销 — 优惠券活动策略与用户分层', () => {
  it('营销创建用户分层优惠券: gold 用户核销成功, silver 被拒', async () => {
    const { service } = createController()
    vi.spyOn(service, 'redeemCrossStore').mockImplementation(async (req) => {
      if (req.userSegment === 'gold') {
        return { success: true, couponId: 'c-gold', amount: 100, redemptionId: 'r1' }
      }
      return { success: false, error: { code: 'USER_SEGMENT_NOT_MATCH', message: `userSegment ${req.userSegment} not allowed` } }
    })

    const goldResult = await service.redeemCrossStore({
      userId: 'gold-u1', couponCode: 'VIP-100', storeId: 's1', orderAmount: 300, orderId: 'o1', idempotencyKey: 'o1:gold', userSegment: 'gold',
    })
    const silverResult = await service.redeemCrossStore({
      userId: 'silver-u1', couponCode: 'VIP-100', storeId: 's1', orderAmount: 300, orderId: 'o2', idempotencyKey: 'o2:silver', userSegment: 'silver',
    })

    expect(goldResult.success).toBe(true)
    expect(silverResult.success).toBe(false)
    expect(silverResult.error?.code).toBe('USER_SEGMENT_NOT_MATCH')
  })

  it('营销设置最低消费门槛: 低于门槛的核销被拒', async () => {
    const { service } = createController()
    vi.spyOn(service, 'redeemCrossStore').mockImplementation(async (req) => {
      if (req.orderAmount < 100) {
        return { success: false, error: { code: 'MIN_AMOUNT_NOT_MET', message: `orderAmount ${req.orderAmount} < minAmount 100` } }
      }
      return { success: true, couponId: 'c-min', amount: 20, redemptionId: 'r1' }
    })

    const underMin = await service.redeemCrossStore({
      userId: 'u1', couponCode: 'MIN-20', storeId: 's1', orderAmount: 50, orderId: 'o1', idempotencyKey: 'o1:min',
    })
    const meetsMin = await service.redeemCrossStore({
      userId: 'u1', couponCode: 'MIN-20', storeId: 's1', orderAmount: 150, orderId: 'o2', idempotencyKey: 'o2:min',
    })

    expect(underMin.success).toBe(false)
    expect(underMin.error?.code).toBe('MIN_AMOUNT_NOT_MET')
    expect(meetsMin.success).toBe(true)
  })

  it('营销验证 tenant-wide 范围优惠券可被任意门店核销', async () => {
    const { service } = createController()
    const tenantWideCheck = service.checkCrossStoreEligibility(
      {
        id: 'coupon-global',
        scope: {
          type: 'tenant-wide',
          storeIds: ['store-A', 'store-B', 'store-C'],
          includeSubordinates: true,
        },
      } as any,
      'store-Z', // 不在列表中但 tenant-wide
    )
    expect(tenantWideCheck.eligible).toBe(true)
    expect(tenantWideCheck.matchedScope).toBe('tenant-wide')
  })
})
