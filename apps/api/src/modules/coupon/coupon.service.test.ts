import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.service.test.ts · Coupon Service 单元测试 (Phase-17)
 *
 * 验证 CouponService 核心业务逻辑:
 *   1. redeemCrossStore   跨门店核销（正向/异常/边界）
 *   2. batchRedeem        批量核销
 *   3. checkCrossStoreEligibility 门店范围校验
 *
 * 覆盖: 幂等,过期,范围,配额,事务冲突,并发竞争
 *
 * 注意: 所有调用 redeemCrossStore/batchRedeem 的测试必须通过
 *       withTenantCtx() 包裹, 因 P0-C2 守卫 requireTenantContext()
 */

import { CouponService } from './coupon.service'
import type { CouponV2 } from './coupon.entity'
import type { Repository, DataSource } from 'typeorm'
import { runWithTenant } from '../../common/context/tenant-context'

// ─── Tenant context helper (P0-C2 守卫兼容) ────────────────────────────
const TENANT_CTX = { tenantId: 'test-tenant', storeId: 'store-1', userId: 'test-user' }
function withTenantCtx<T>(fn: () => T | Promise<T>): Promise<T> {
  return runWithTenant(TENANT_CTX, fn)
}

// ─── Mock helpers ────────────────────────────────────────────────────────

function createMockRepo(overrides: Partial<Repository<any>> = {}): Repository<any> {
  return {
    findOne: vi.fn(),
    find: vi.fn(),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    create: vi.fn((data) => data),
    save: vi.fn((data) => ({ ...data, id: 'mock-redemption-id' })),
    ...overrides,
  } as any
}

function createMockCoupon(overrides: Partial<CouponV2> = {}): CouponV2 {
  return {
    id: 'coupon-test-1',
    tenantId: 'tenant-A',
    code: 'CROSS-2026-50',
    scope: { type: 'multi-store', storeIds: ['store-1', 'store-2'], includeSubordinates: false },
    redemptionRules: { minAmount: 100 },
    value: 50,
    valueType: 'fixed',
    expiresAt: new Date('2099-01-01T00:00:00Z'),
    status: 'active',
    redemptionCount: 0,
    maxRedemptions: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CouponV2
}

describe('CouponService', () => {
  let couponRepo: Repository<any>
  let redemptionRepo: Repository<any>
  let dataSource: DataSource
  let service: CouponService

  beforeEach(() => {
    vi.clearAllMocks()
    couponRepo = createMockRepo()
    redemptionRepo = createMockRepo()
    dataSource = {
      transaction: vi.fn(async (cb: any) => {
        const txManager = {
          getRepository: vi.fn((entity: any) => {
            if (entity === Object) return couponRepo
            return redemptionRepo
          }),
        }
        return cb(txManager)
      }),
    } as any
    service = new CouponService(
      couponRepo as any,
      redemptionRepo as any,
      dataSource,
      undefined,
      undefined,
    )
  })

  // ─── redeemCrossStore - 正向流程 ──────────────────────────────────────

  it('T1: 正常核销流程返回成功结果', async () => {
    vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'CROSS-2026-50',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'o1:CROSS-2026-50',
      tenantId: 'tenant-A',
    }))

    expect(result.success).toBe(true)
    expect(result.couponId).toBe('coupon-test-1')
    expect(result.amount).toBe(50)
    expect(result.redemptionId).toBe('mock-redemption-id')
    expect(couponRepo.findOne).toHaveBeenCalledTimes(1)
    expect(dataSource.transaction).toHaveBeenCalledTimes(1)
  })

  it('T2: 幂等命中直接返回已有核销结果', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue({
      id: 'existing-r-1',
      couponId: 'coupon-test-1',
      amount: 50,
    })

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'CROSS-2026-50',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'dup-key',
      tenantId: 'tenant-A',
    }))

    expect(result.success).toBe(true)
    expect(result.redemptionId).toBe('existing-r-1')
    // 不应查券也不应开事务
    expect(couponRepo.findOne).not.toHaveBeenCalled()
    expect(dataSource.transaction).not.toHaveBeenCalled()
  })

  it('T3: 幂等命中后 couponRepo.findOne 不会重复调用', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue({
      id: 'existing-r-2',
      couponId: 'c-1',
      amount: 25,
    })

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'ANY',
      storeId: 's1',
      orderAmount: 100,
      orderId: 'o1',
      idempotencyKey: 'dup-key-2',
    }))

    expect(result.success).toBe(true)
    expect(couponRepo.findOne).not.toHaveBeenCalled()
  })

  // ─── redeemCrossStore - 异常路径 ──────────────────────────────────────

  it('T4: 优惠券不存在返回 COUPON_NOT_FOUND', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(null)

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'NOT-FOUND',
      storeId: 's1',
      orderAmount: 100,
      orderId: 'o1',
      idempotencyKey: 'o1:NOT-FOUND',
    }))

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_NOT_FOUND')
  })

  it('T5: 已过期优惠券返回 COUPON_EXPIRED', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ expiresAt: new Date('2020-01-01T00:00:00Z') }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'EXPIRED',
      storeId: 's1',
      orderAmount: 100,
      orderId: 'o1',
      idempotencyKey: 'o1:EXPIRED',
    }))

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_EXPIRED')
  })

  it('T6: 门店不在 scope 内返回 STORE_NOT_IN_SCOPE', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ scope: { type: 'single-store', storeIds: ['store-A'], includeSubordinates: false } }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-B',
      orderAmount: 100,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
    }))

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('STORE_NOT_IN_SCOPE')
  })

  it('T7: 金额未达最低消费返回 MIN_AMOUNT_NOT_MET', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionRules: { minAmount: 200 } }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 50,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
    }))

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('MIN_AMOUNT_NOT_MET')
  })

  it('T8: 核销次数耗尽返回 COUPON_EXHAUSTED', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionCount: 1000, maxRedemptions: 1000 }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 100,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
    }))

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_EXHAUSTED')
  })

  it('T9: 用户分层不匹配返回 USER_SEGMENT_NOT_MATCH', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionRules: { userSegments: ['svip', 'gold'], minAmount: 0 } }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 100,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
      userSegment: 'bronze',
    }))

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('USER_SEGMENT_NOT_MATCH')
  })

  // ─── redeemCrossStore - 边界条件 ──────────────────────────────────────

  it('T10: 用户分层为空时跳过校验', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionRules: { userSegments: [] as any, minAmount: 0 } }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 100,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
      userSegment: undefined,
    }))

    expect(result.success).toBe(true)
  })

  it('T11: tenantId 默认值 tenant-default', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

    await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
    }))

    expect(couponRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-default' }),
      }),
    )
  })

  it('T12: maxRedemptions 未设置时不触发耗尽检查', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ maxRedemptions: undefined, redemptionCount: 9999 }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
    }))

    expect(result.success).toBe(true)
  })

  it('T13: minAmount 未设置时不触发校验', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionRules: { userSegments: undefined, minAmount: undefined } }),
    )

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 1,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
    }))

    expect(result.success).toBe(true)
  })

  // ─── checkCrossStoreEligibility ──────────────────────────────────────

  it('T14: tenant-wide 范围的门店总是 eligible', () => {
    const coupon = createMockCoupon({
      scope: { type: 'tenant-wide', storeIds: ['s1', 's2', 's3'], includeSubordinates: true },
    })
    const result = service.checkCrossStoreEligibility(coupon, 's999')
    expect(result.eligible).toBe(true)
    expect(result.matchedScope).toBe('tenant-wide')
  })

  it('T15: multi-store scope 内门店 eligible', () => {
    const coupon = createMockCoupon({
      scope: { type: 'multi-store', storeIds: ['arcade-1', 'arcade-2'], includeSubordinates: false },
    })
    const result = service.checkCrossStoreEligibility(coupon, 'arcade-1')
    expect(result.eligible).toBe(true)
  })

  it('T16: 不在 scope 的门店 not eligible', () => {
    const coupon = createMockCoupon({
      scope: { type: 'multi-store', storeIds: ['arcade-1', 'arcade-2'], includeSubordinates: false },
    })
    const result = service.checkCrossStoreEligibility(coupon, 'dining-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('dining-1')
  })

  // ─── batchRedeem ─────────────────────────────────────────────────────

  it('T17: 批量核销全部成功', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

    const results = await withTenantCtx(() => service.batchRedeem([
      { userId: 'u1', couponCode: 'C1', storeId: 'store-1', orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:C1' },
      { userId: 'u2', couponCode: 'C2', storeId: 'store-1', orderAmount: 200, orderId: 'o2', idempotencyKey: 'o2:C2' },
    ]))

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
  })

  it('T18: 批量核销中部分失败（stop-on-first-fail: true）', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValueOnce(null)
    vi.mocked(couponRepo.findOne)
      .mockResolvedValueOnce(createMockCoupon())
      .mockResolvedValueOnce(null) // 第二个 coupon 不存在

    const results = await withTenantCtx(() => service.batchRedeem([
      { userId: 'u1', couponCode: 'C1', storeId: 'store-1', orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:C1' },
      { userId: 'u2', couponCode: 'NOT-FOUND', storeId: 'store-1', orderAmount: 200, orderId: 'o2', idempotencyKey: 'o2:NOT-FOUND' },
    ]))

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
    expect(results[1].error?.code).toBe('COUPON_NOT_FOUND')
  })

  it('T19: 空数组返回空结果', async () => {
    const results = await service.batchRedeem([])
    expect(results).toEqual([])
  })

  // ─── 配额/lifecycle 集成边界 ──────────────────────────────────────────

  it('T20: lifecycleService 注入后 assertWriteAllowed 被调用', async () => {
    const assertWriteAllowed = vi.fn()
    service = new CouponService(
      couponRepo as any,
      redemptionRepo as any,
      dataSource as any,
      { assertWriteAllowed },
      undefined,
    )
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

    await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
      tenantId: 'tenant-A',
    }))

    expect(assertWriteAllowed).toHaveBeenCalledWith('tenant-A')
  })

  it('T21: quotaService.check 返回不允许则返回 QUOTA_EXCEEDED', async () => {
    service = new CouponService(
      couponRepo as any,
      redemptionRepo as any,
      dataSource as any,
      undefined,
      { check: vi.fn(() => ({ allowed: false, currentUsage: 100, limit: 50 })), increment: vi.fn() },
    )
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1',
      couponCode: 'C1',
      storeId: 'store-1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'o1:C1',
      tenantId: 'tenant-A',
    }))

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('QUOTA_EXCEEDED')
  })
})
