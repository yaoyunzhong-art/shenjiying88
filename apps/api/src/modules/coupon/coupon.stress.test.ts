import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [coupon] Stress & Resilience 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 高并发批量核销 (100+ 并发)
 * - 极端输入值 (溢出、负数、超大金额)
 * - 快速连续状态变更 (并发事务冲突)
 * - 内存/时间压力 (大量模拟器运行)
 * - 八角色视角压力场景
 */

import type { Repository, DataSource } from 'typeorm'
import { CouponService } from './coupon.service'
import type { CouponV2 } from './coupon.entity'
import { runWithTenant } from '../../common/context/tenant-context'

// ─── Tenant context helper (P0-C2 守卫兼容) ────────────────────────────
const TENANT_CTX = { tenantId: 'stress-tenant', userId: 'stress-runner' }
function withTenantCtx<T>(fn: () => T | Promise<T>): Promise<T> {
  return runWithTenant(TENANT_CTX, fn)
}

// ─── Mock helpers ────────────────────────────────────────────────────────

function createMockRepo(overrides: Partial<Repository<any>> = {}): Repository<any> {
  return {
    findOne: vi.fn(),
    find: vi.fn(),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    create: vi.fn((data: any) => data),
    save: vi.fn((data: any) => ({ ...data, id: `stress-redemption-${Date.now()}` })),
    ...overrides,
  } as any
}

function createMockCoupon(overrides: Partial<CouponV2> = {}): CouponV2 {
  return {
    id: 'coupon-stress-1',
    tenantId: 'tenant-stress',
    code: 'STRESS-2026-99',
    scope: { type: 'multi-store', storeIds: ['store-1', 'store-2', 'store-3'], includeSubordinates: false },
    redemptionRules: { minAmount: 100 },
    value: 50,
    valueType: 'fixed',
    expiresAt: new Date('2099-01-01T00:00:00Z'),
    status: 'active',
    redemptionCount: 0,
    maxRedemptions: 10000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CouponV2
}

function createTransactionMock(couponRepo: Repository<any>, redemptionRepo: Repository<any>): DataSource {
  return {
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
}

describe('Coupon - Stress & Resilience', () => {
  let couponRepo: Repository<any>
  let redemptionRepo: Repository<any>
  let dataSource: DataSource
  let service: CouponService

  beforeEach(() => {
    vi.clearAllMocks()
    couponRepo = createMockRepo()
    redemptionRepo = createMockRepo()
    dataSource = createTransactionMock(couponRepo, redemptionRepo)
    service = new CouponService(
      couponRepo as any,
      redemptionRepo as any,
      dataSource,
      undefined,
      undefined,
    )
  })

  // ─── 高并发批量核销 ───

  describe('🎯 高并发批量核销 (店长/运行专员视角)', () => {
    it('T1: 同时批量核销 100 次不崩溃', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

      const reqs = Array.from({ length: 100 }, (_, i) => ({
        userId: `stress-user-${i}`,
        couponCode: 'STRESS-2026-99',
        storeId: `store-${(i % 3) + 1}`,
        orderAmount: 200 + i,
        orderId: `stress-order-${i}`,
        idempotencyKey: `stress-${i}`,
        tenantId: 'tenant-stress',
      }))

      const results = await withTenantCtx(() => service.batchRedeem(reqs))

      expect(results).toHaveLength(100)
      const succeeded = results.filter((r) => r.success).length
      expect(succeeded).toBe(100)
      // 每个成功结果应有 couponId 和 redemptionId
      for (const r of results) {
        expect(r.couponId).toBeTruthy()
        expect(r.redemptionId).toBeTruthy()
      }
    })

    it('T2: 100 次核销中混合失败场景', async () => {
      // 幂等检查全部返回 null (未命中)
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      // 前 80 次成功返回 coupon，后 20 次返回 null (找不到券)
      for (let i = 0; i < 80; i++) {
        vi.mocked(couponRepo.findOne).mockResolvedValueOnce(createMockCoupon())
      }
      // 剩余调用返回 null (coupon not found)
      vi.mocked(couponRepo.findOne).mockResolvedValueOnce(null)

      const reqs = Array.from({ length: 100 }, (_, i) => ({
        userId: `user-${i}`,
        couponCode: i < 80 ? 'STRESS-OK' : 'NOT-FOUND',
        storeId: 'store-1',
        orderAmount: 200,
        orderId: `order-${i}`,
        idempotencyKey: `key-${i}`,
      }))

      const results = await withTenantCtx(() => service.batchRedeem(reqs))

      expect(results).toHaveLength(100)
      const succeeded = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length
      expect(succeeded).toBe(80)
      expect(failed).toBe(20)
    })

    it('T3: 200 个幂等请求 (相同 idempotencyKey) 只查一次数据库', async () => {
      // 首次未找到已有记录，后续都命中幂等
      vi.mocked(redemptionRepo.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValue({
          id: 'existing-r-1',
          couponId: 'coupon-stress-1',
          amount: 50,
        })
      vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

      const reqs = Array.from({ length: 200 }, () => ({
        userId: 'u-same',
        couponCode: 'STRESS-KEY',
        storeId: 'store-1',
        orderAmount: 200,
        orderId: 'o-same',
        idempotencyKey: 'same-key-for-all',
      }))

      const results = await withTenantCtx(() => service.batchRedeem(reqs))
      expect(results).toHaveLength(200)
      // 只有第一次真正查询了 coupon（幂等跳过），事务只开一次
      expect(dataSource.transaction).toHaveBeenCalledTimes(1)
    })
  })

  // ─── 极端输入值 ───

  describe('⚠️ 极端输入值 (安全/安监视角)', () => {
    it('T4: 负数 orderAmount 仍可通过 (0 值边界)', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(
        createMockCoupon({ redemptionRules: { minAmount: undefined } }),
      )

      const result = await withTenantCtx(() => service.redeemCrossStore({
        userId: 'u1',
        couponCode: 'C1',
        storeId: 'store-1',
        orderAmount: -1,
        orderId: 'o1',
        idempotencyKey: 'o1:neg',
      }))


      // DTO 层面应拦截负数(Min(0))，但 service 宽松允许
      expect(result.success).toBe(true)
    })

    it('T5: 超大金额 (Number.MAX_SAFE_INTEGER) 不溢出', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(
        createMockCoupon({
          redemptionRules: { minAmount: 0 },
          value: Number.MAX_SAFE_INTEGER,
          valueType: 'fixed',
        }),
      )

      const result = await withTenantCtx(() => service.redeemCrossStore({
        userId: 'u1',
        couponCode: 'C1',
        storeId: 'store-1',
        orderAmount: Number.MAX_SAFE_INTEGER,
        orderId: 'o1',
        idempotencyKey: 'o1:max',
      }))


      expect(result.success).toBe(true)
      expect(result.amount).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('T6: 超长字符串 code 和 idempotencyKey 不崩溃', async () => {
      const longStr = 'x'.repeat(10000)
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(null) // 找不到，返回 COUPON_NOT_FOUND

      const result = await withTenantCtx(() => service.redeemCrossStore({
        userId: longStr,
        couponCode: longStr,
        storeId: longStr,
        orderAmount: 100,
        orderId: longStr,
        idempotencyKey: longStr,
      }))


      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('COUPON_NOT_FOUND')
    })

    it('T7: expiredAt 为过去超大值 (1970年前)', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(
        createMockCoupon({ expiresAt: new Date('1969-01-01T00:00:00Z') }),
      )

      const result = await withTenantCtx(() => service.redeemCrossStore({
        userId: 'u1',
        couponCode: 'C1',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'o1',
        idempotencyKey: 'o1:past',
      }))


      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('COUPON_EXPIRED')
    })

    it('T8: 空字符串 storeId 边界', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      // scope.storeIds 包含空串 '' 时, '' 是匹配的
      vi.mocked(couponRepo.findOne).mockResolvedValue(
        createMockCoupon({
          scope: { type: 'multi-store', storeIds: [''], includeSubordinates: false },
        }),
      )

      const result = await withTenantCtx(() => service.redeemCrossStore({
        userId: 'u1',
        couponCode: 'C1',
        storeId: '',
        orderAmount: 200,
        orderId: 'o1',
        idempotencyKey: 'o1:empty',
      }))


      // storeId '' 在 scope.storeIds [''] 中, 所以应该成功
      expect(result.success).toBe(true)
    })
  })

  // ─── 并发事务冲突 ───

  describe('🔥 并发事务冲突 (导玩员/团建视角)', () => {
    it('T9: 事务并发冲突时 update 影响 0 行不崩溃', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

      // 模拟事务内 update 无影响行 (并发竞争)
      const conflictingRepo = createMockRepo()
      conflictingRepo.update = vi.fn().mockResolvedValue({ affected: 0 })
      const conflictingDs = {
        transaction: vi.fn(async (cb: any) => {
          const txManager = {
            getRepository: vi.fn(() => conflictingRepo),
          }
          return cb(txManager)
        }),
      } as any
      const conflictingService = new CouponService(
        couponRepo as any,
        redemptionRepo as any,
        conflictingDs,
        undefined,
        undefined,
      )

      const result = await withTenantCtx(() => conflictingService.redeemCrossStore({
        userId: 'u1',
        couponCode: 'C1',
        storeId: 'store-1',
        orderAmount: 200,
        orderId: 'o1',
        idempotencyKey: 'o1:concurrent',
      }))

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('COUPON_NOT_FOUND')
    })

    it('T10: 100 次并发核销耗尽 maxRedemptions 正确计数', async () => {
      const maxRedeem = 5
      const baseCoupon = createMockCoupon({
        maxRedemptions: maxRedeem,
        id: 'coupon-limited-1',
        code: 'LIMITED-5',
      })

      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(baseCoupon)

      // 每个核销更新时将 redemptionCount 递增 1, 第 6 次触发 exhausted
      let currentCount = 0
      const limitedRepo = createMockRepo()
      limitedRepo.findOne = vi.fn().mockImplementation(async ({ where }: any) => {
        if (where?.idempotencyKey) return null
        return {
          ...baseCoupon,
          redemptionCount: currentCount,
        }
      })
      limitedRepo.update = vi.fn().mockImplementation(async (_: any, update: any) => {
        currentCount = update.redemptionCount
        return { affected: 1 }
      })
      const limitedDs = {
        transaction: vi.fn(async (cb: any) => {
          const txManager = {
            getRepository: vi.fn(() => limitedRepo),
          }
          return cb(txManager)
        }),
      } as any
      const limitedService = new CouponService(
        limitedRepo as any,
        redemptionRepo as any,
        limitedDs,
        undefined,
        undefined,
      )

      const reqs = Array.from({ length: 10 }, (_, i) => ({
        userId: `concurrent-${i}`,
        couponCode: 'LIMITED-5',
        storeId: 'store-1',
        orderAmount: 200,
        orderId: `concurrent-order-${i}`,
        idempotencyKey: `concurrent-${i}`,
      }))

      const results = await withTenantCtx(() => limitedService.batchRedeem(reqs))
      const succeeded = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      // 最多成功 maxRedeem 个，其余因 exhausted 失败
      expect(succeeded).toBe(maxRedeem)
      expect(failed).toBe(10 - maxRedeem)
      for (const f of results.filter((r) => !r.success)) {
        expect(f.error?.code).toBe('COUPON_EXHAUSTED')
      }
    })
  })

  // ─── 门店范围压力 ───

  describe('🏪 门店范围压力 (前台/营销视角)', () => {
    it('T11: 100 个门店的 tenant-wide 范围全部 eligible', () => {
      const storeIds = Array.from({ length: 100 }, (_, i) => `store-${i}`)
      const coupon = createMockCoupon({
        scope: { type: 'tenant-wide', storeIds, includeSubordinates: true },
      })

      for (let i = 0; i < 100; i++) {
        const result = service.checkCrossStoreEligibility(coupon, `store-${i}`)
        expect(result.eligible).toBe(true)
        expect(result.matchedScope).toBe('tenant-wide')
      }
    })

    it('T12: 1000 个门店中快速查找目标门店', () => {
      const storeIds = Array.from({ length: 1000 }, (_, i) => `store-${i}`)
      const coupon = createMockCoupon({
        scope: { type: 'multi-store', storeIds, includeSubordinates: false },
      })

      const startTime = performance.now()
      const result = service.checkCrossStoreEligibility(coupon, 'store-500')
      const elapsed = performance.now() - startTime

      expect(result.eligible).toBe(true)
      expect(elapsed).toBeLessThan(50) // 应 < 50ms
    })

    it('T13: 1000 家门店中找不到时快速返回', () => {
      const storeIds = Array.from({ length: 1000 }, (_, i) => `store-${i}`)
      const coupon = createMockCoupon({
        scope: { type: 'multi-store', storeIds, includeSubordinates: false },
      })

      const startTime = performance.now()
      const result = service.checkCrossStoreEligibility(coupon, 'store-not-found')
      const elapsed = performance.now() - startTime

      expect(result.eligible).toBe(false)
      expect(elapsed).toBeLessThan(50)
    })
  })

  // ─── 多种角色视角边界 ───

  describe('👥 八角色视角压力场景', () => {
    it('👔 店长: 大量门店核销统计', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

      // 模拟 100 笔核销 (使用 scope 内的 3 家门店)
      const reqs = Array.from({ length: 100 }, (_, i) => {
        const storeIdx = (i % 3) + 1
        return {
          userId: `u-${i}`,
          couponCode: 'BOSS-REPORT',
          storeId: `store-${storeIdx}`,
          orderAmount: 150 + i,
          orderId: `boss-order-${i}`,
          idempotencyKey: `boss-${i}`,
          tenantId: 'tenant-stress',
        }
      })

      const results = await withTenantCtx(() => service.batchRedeem(reqs))
      expect(results.filter((r) => r.success).length).toBe(100)
    })

    it('🛒 前台: 快速核销收银不卡顿', async () => {
      // 创建一个全新的服务实例, 避免与其他测试共享 mock 状态
      const cashierRedemptionRepo = createMockRepo()
      cashierRedemptionRepo.findOne = vi.fn().mockResolvedValue(null)
      const cashierCouponRepo = createMockRepo()
      cashierCouponRepo.findOne = vi.fn().mockResolvedValue(
        createMockCoupon({ id: 'coupon-cashier-1', redemptionRules: { minAmount: 0 } }),
      )
      const cashierDs = createTransactionMock(cashierCouponRepo as any, cashierRedemptionRepo as any)
      const cashierService = new CouponService(
        cashierCouponRepo as any,
        cashierRedemptionRepo as any,
        cashierDs,
        undefined,
        undefined,
      )

      const startTime = performance.now()
      // 模拟前台快速收银 5 次 (每次不同优惠券, 避免 maxRedemptions 耗尽)
      for (let i = 0; i < 5; i++) {
        const r = await withTenantCtx(() => cashierService.redeemCrossStore({
          userId: `cashier-u-${i}`,
          couponCode: `FRONT-DESK-${i}`,
          storeId: 'store-1',
          orderAmount: 88,
          orderId: `cashier-order-${i}`,
          idempotencyKey: `cashier-${i}`,
        }))
        expect(r.success).toBe(true)
      }
      const elapsed = performance.now() - startTime
      expect(elapsed).toBeLessThan(5000) // 5 次 < 5s
    })

    it('👥 HR: 会员分层核销正确筛选', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)

      const svipCoupon = createMockCoupon({
        redemptionRules: { userSegments: ['svip'], minAmount: 0 },
        code: 'SVIP-ONLY',
      })
      vi.mocked(couponRepo.findOne).mockResolvedValue(svipCoupon)

      // SVIP 可以，REGULAR 不可以
      const svipResult = await withTenantCtx(() => service.redeemCrossStore({
        userId: 'svip-1',
        couponCode: 'SVIP-ONLY',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'hr-o1',
        idempotencyKey: 'hr-svip-1',
        userSegment: 'svip',
      }))

      expect(svipResult.success).toBe(true)

      const regularResult = await withTenantCtx(() => service.redeemCrossStore({
        userId: 'regular-1',
        couponCode: 'SVIP-ONLY',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'hr-o2',
        idempotencyKey: 'hr-regular-1',
        userSegment: 'regular',
      }))

      expect(regularResult.success).toBe(false)
      expect(regularResult.error?.code).toBe('USER_SEGMENT_NOT_MATCH')
    })

    it('🔧 安监: 异常输入不泄露敏感信息', async () => {
      // 传入异常数值
      const evilOrderAmounts = [NaN, Infinity, -Infinity]
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(
        createMockCoupon({ redemptionRules: { minAmount: undefined } }),
      )

      for (let i = 0; i < evilOrderAmounts.length; i++) {
        const amount = evilOrderAmounts[i]
        const result = await withTenantCtx(() => service.redeemCrossStore({
          userId: 'u1',
          couponCode: 'C1',
          storeId: 'store-1',
          orderAmount: amount as any,
          orderId: `o1-${i}`,
          idempotencyKey: `evil-${i}`,
      }))

        // 异常数值不应导致崩溃
        expect(typeof result.success).toBe('boolean')
        // error 可能是 undefined（成功）或包含合法错误信息
        if (result.error?.message) {
          expect(result.error.message).not.toContain('Error:')
        }
      }
    })

    it('🎮 导玩员: 高频小额核销 (类似游戏券场景)', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      const coupon = createMockCoupon({
        id: 'coupon-game-1',
        redemptionRules: { minAmount: 10 },
        value: 5,
        code: 'GAME-TOKEN',
        scope: { type: 'multi-store', storeIds: ['arcade-1'], includeSubordinates: false },
      })
      vi.mocked(couponRepo.findOne).mockResolvedValue(coupon)

      // 模拟 50 次小金额核销
      const reqs = Array.from({ length: 50 }, (_, i) => ({
        userId: `arcade-player-${i}`,
        couponCode: 'GAME-TOKEN',
        storeId: 'arcade-1',
        orderAmount: 20,
        orderId: `game-play-${i}`,
        idempotencyKey: `game-${i}`,
      }))

      const results = await withTenantCtx(() => service.batchRedeem(reqs))
      expect(results.filter((r) => r.success).length).toBe(50)
    })

    it('🤝 团建: 批量活动优惠券核销 (100 人团建)', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      const coupon = createMockCoupon({
        maxRedemptions: 200,
        code: 'TEAM-BUILDING',
        scope: { type: 'multi-store', storeIds: ['team-venue'], includeSubordinates: false },
      })
      vi.mocked(couponRepo.findOne).mockResolvedValue(coupon)

      const reqs = Array.from({ length: 100 }, (_, i) => ({
        userId: `team-member-${i}`,
        couponCode: 'TEAM-BUILDING',
        storeId: 'team-venue',
        orderAmount: 300,
        orderId: `team-order-${i}`,
        idempotencyKey: `team-${i}`,
      }))

      const results = await withTenantCtx(() => service.batchRedeem(reqs))
      const succeeded = results.filter((r) => r.success).length
      expect(succeeded).toBe(100)
      // 确认 100 人全成功
      expect(results.every((r) => r.success)).toBe(true)
    })

    it('📢 营销: 批量活动结束后优惠券耗尽', async () => {
      const maxRedeem = 50
      let currentCount = 0
      const marketingRepo = createMockRepo()
      marketingRepo.findOne = vi.fn().mockImplementation(async ({ where }: any) => {
        if (where?.idempotencyKey) return null // 幂等未命中
        return createMockCoupon({
          id: 'coupon-limited-1',
          maxRedemptions: maxRedeem,
          code: 'CAMPAIGN-LIMITED',
          redemptionCount: currentCount,
          scope: { type: 'multi-store', storeIds: ['campaign-store'], includeSubordinates: false },
        })
      })
      marketingRepo.update = vi.fn().mockImplementation(async (_: any, update: any) => {
        currentCount = (update as any).redemptionCount
        return { affected: 1 }
      })
      const marketingDs = {
        transaction: vi.fn(async (cb: any) => {
          const txManager = {
            getRepository: vi.fn(() => marketingRepo),
          }
          return cb(txManager)
        }),
      } as any
      const marketingService = new CouponService(
        marketingRepo as any,
        redemptionRepo as any,
        marketingDs,
        undefined,
        undefined,
      )

      // 60 人抢 50 张券
      const reqs = Array.from({ length: 60 }, (_, i) => ({
        userId: `campaign-user-${i}`,
        couponCode: 'CAMPAIGN-LIMITED',
        storeId: 'campaign-store',
        orderAmount: 200,
        orderId: `campaign-order-${i}`,
        idempotencyKey: `campaign-${i}`,
      }))

      const results = await withTenantCtx(() => marketingService.batchRedeem(reqs))
      const succeeded = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      expect(succeeded).toBe(50)
      expect(failed).toBe(10)
      for (const f of results.filter((r) => !r.success)) {
        expect(f.error?.code).toBe('COUPON_EXHAUSTED')
      }
    })
  })

  // ─── 内存/时间压力 ───

  describe('📊 内存压力测试', () => {
    it('T14: 1000 次连续调用的内存稳定', async () => {
      vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
      vi.mocked(couponRepo.findOne).mockResolvedValue(createMockCoupon())

      const iterations = 1000
      const results: boolean[] = []

      // Use stores that are in scope: store-1, store-2, store-3
      const stores = ['store-1', 'store-2', 'store-3']

      const startTime = performance.now()
      for (let i = 0; i < iterations; i++) {
        const r = await withTenantCtx(() => service.redeemCrossStore({
          userId: `mem-u-${i}`,
          couponCode: 'MEM-STRESS',
          storeId: stores[i % 3],
          orderAmount: 200,
          orderId: `mem-o-${i}`,
          idempotencyKey: `mem-${i}`,
      }))

        results.push(r.success)
      }
      const elapsed = performance.now() - startTime

      expect(results.filter(Boolean).length).toBe(iterations)
      expect(elapsed).toBeLessThan(30000) // 1000 次 < 30s
    })
  })
})
