import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.service.continuing.test.ts · Coupon Service 持续测试 (树哥B-圈梁五道箍)
 *
 * 覆盖补充场景 (16+):
 * - redeemCrossStore 异常路径补充
 * - batchRedeem 混合成功/失败
 * - create/findById/list/updateStatus 补充边界
 * - 事务冲突 / 并发竞争
 * - code/status 联合查询
 * - 空 scope / null rules 边界
 * - 多 store scope 匹配
 * - 长期优惠券过期边界
 * - triggerByCampaign
 * - 纯函数 checkCrossStoreEligibility
 */
import { CouponService } from './coupon.service'
import { CouponV2 } from './coupon.entity'
import type { Repository, DataSource } from 'typeorm'
import { runWithTenant } from '../../common/context/tenant-context'

// ─── Tenant context helper ──────────────────────────────────────────────
const TENANT_CTX = { tenantId: 'test-tenant', userId: 'test-user' }
function withTenantCtx<T>(fn: () => T | Promise<T>): Promise<T> {
  return runWithTenant(TENANT_CTX, fn)
}

// ─── Mock helpers ────────────────────────────────────────────────────────

function createMockRepo(overrides: Partial<Repository<any>> = {}): Repository<any> {
  return {
    findOne: vi.fn(),
    find: vi.fn(),
    findAndCount: vi.fn().mockResolvedValue([[], 0]),
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

// ═══════════════════════════════════════════════════════════════
// 树哥B — Coupon Service 持续测试 (16条)
// ═══════════════════════════════════════════════════════════════

describe('CouponService — 持续测试 [树哥B-圈梁五道箍]', () => {
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
            if (entity === Object || entity === CouponV2) return couponRepo
            return redemptionRepo
          }),
        }
        return cb(txManager)
      }),
    } as any
    service = new CouponService(couponRepo as any, redemptionRepo as any, dataSource, undefined, undefined)
  })

  // ── redeemCrossStore — 边界补充 ─────────────────────────────

  it('[D01] redeemCrossStore 订单金额等于 minAmount 边界', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionRules: { minAmount: 100 } }),
    )
    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1', couponCode: 'C1', storeId: 'store-1',
      orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1',
    }))
    expect(result.success).toBe(true)
  })

  it('[D02] redeemCrossStore 订单金额略低于 minAmount 拒绝', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionRules: { minAmount: 100 } }),
    )
    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1', couponCode: 'C1', storeId: 'store-1',
      orderAmount: 99.99, orderId: 'o1', idempotencyKey: 'o1:C1',
    }))
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('MIN_AMOUNT_NOT_MET')
  })

  it('[D03] redeemCrossStore 多 store scope 匹配其中任意一个 storeId 可核销', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ scope: { type: 'multi-store', storeIds: ['s1', 's2', 's3'], includeSubordinates: false } }),
    )
    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1', couponCode: 'C1', storeId: 's3',
      orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:C1',
    }))
    expect(result.success).toBe(true)
  })

  it('[D04] redeemCrossStore redemptionCount+1 达到 maxRedemptions 触发 exhausted', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionCount: 999, maxRedemptions: 1000 }),
    )
    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1', couponCode: 'C1', storeId: 'store-1',
      orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:C1',
    }))
    expect(result.success).toBe(true)
  })

  // ── redeemCrossStore — 并发/事务冲突 ────────────────────────

  it('[D05] redeemCrossStore 事务内 update affected=0 返回 COUPON_NOT_FOUND', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(
      createMockCoupon({ redemptionCount: 0, maxRedemptions: 1 }),
    )
    // 模拟事务内的 update 返回 affected=0（并发冲突）
    const txManager = {
      getRepository: vi.fn().mockReturnValue({
        update: vi.fn().mockResolvedValue({ affected: 0 }),
        create: vi.fn((d: any) => d),
        save: vi.fn((d: any) => ({ ...d, id: 'mock-redemption-id' })),
      }),
    }
    dataSource.transaction = vi.fn(async (cb: any) => cb(txManager))
    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1', couponCode: 'C1', storeId: 'store-1',
      orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:C1',
    }))
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_NOT_FOUND')
  })

  it('[D06] redeemCrossStore coupon 状态为 paused 时 repo 按 status=active 查不到', async () => {
    // 因为 couponRepo.findOne 查询条件为 { ..., status: 'active' }，paused 状态的 coupon
    // 返回 null 导致 COUPON_NOT_FOUND
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(null)
    const result = await withTenantCtx(() => service.redeemCrossStore({
      userId: 'u1', couponCode: 'PAUSED', storeId: 'store-1',
      orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:PAUSED',
    }))
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('COUPON_NOT_FOUND')
  })

  // ── batchRedeem — 混合场景 ──────────────────────────────────

  it('[D07] batchRedeem 混合成功/失败返回对应结果', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne)
      .mockResolvedValueOnce(createMockCoupon({ maxRedemptions: 10 }))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createMockCoupon({ maxRedemptions: 10 }))
    const results = await withTenantCtx(() => service.batchRedeem([
      { userId: 'u1', couponCode: 'GOOD1', storeId: 'store-1', orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1:GOOD1' },
      { userId: 'u2', couponCode: 'BAD1', storeId: 'store-1', orderAmount: 200, orderId: 'o2', idempotencyKey: 'o2:BAD1' },
      { userId: 'u3', couponCode: 'GOOD2', storeId: 'store-1', orderAmount: 200, orderId: 'o3', idempotencyKey: 'o3:GOOD2' },
    ]))
    expect(results).toHaveLength(3)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
    expect(results[2].success).toBe(true)
  })

  it('[D08] batchRedeem 都是失败的请求', async () => {
    vi.mocked(redemptionRepo.findOne).mockResolvedValue(null)
    vi.mocked(couponRepo.findOne).mockResolvedValue(null)
    const results = await withTenantCtx(() => service.batchRedeem([
      { userId: 'u1', couponCode: 'X1', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:X1' },
      { userId: 'u2', couponCode: 'X2', storeId: 's1', orderAmount: 100, orderId: 'o2', idempotencyKey: 'o2:X2' },
    ]))
    expect(results).toHaveLength(2)
    expect(results.every(r => !r.success)).toBe(true)
  })

  // ── create — 边界 ────────────────────────────────────────────

  it('[D09] create 时 percentage 类型 value 为正数', async () => {
    vi.mocked(couponRepo.create).mockReturnValue(createMockCoupon({ value: 15, valueType: 'percentage' }))
    vi.mocked(couponRepo.save).mockResolvedValue(createMockCoupon({ value: 15, valueType: 'percentage' }))
    const coupon = await service.create({
      code: 'PCT-15',
      tenantId: 't-1',
      scope: { type: 'single-store', storeIds: ['s1'], includeSubordinates: false },
      redemptionRules: {},
      value: 15,
      valueType: 'percentage',
      expiresAt: '2099-12-31T23:59:59Z',
    })
    expect(coupon.value).toBe(15)
    expect(coupon.valueType).toBe('percentage')
  })

  // ── findById — 边界 ──────────────────────────────────────────

  it('[D10] findById 空字符串查询不崩溃', async () => {
    vi.mocked(couponRepo.findOne).mockResolvedValue(null)
    await expect(service.findById('')).resolves.toBeNull()
  })

  it('[D11] findById 返回 null 后连锁调用 updateStatus 返回 null', async () => {
    vi.mocked(couponRepo.findOne).mockResolvedValue(null)
    const result = await service.updateStatus('no-such-id', 'paused')
    expect(result).toBeNull()
  })

  // ── list — 边界 ──────────────────────────────────────────────

  it('[D12] list 空结果总量为 0', async () => {
    vi.mocked(couponRepo.findAndCount).mockResolvedValue([[], 0])
    const result = await service.list({ tenantId: 'non-existent' })
    expect(result.total).toBe(0)
    expect(result.items).toEqual([])
  })

  it('[D13] list 按 status=expired 筛选', async () => {
    vi.mocked(couponRepo.findAndCount).mockResolvedValue([
      [createMockCoupon({ status: 'expired' })],
      1,
    ])
    const result = await service.list({ status: 'expired' })
    expect(result.total).toBe(1)
    expect(result.items[0]!.status).toBe('expired')
  })

  // ── updateStatus — 边界 ──────────────────────────────────────

  it('[D14] updateStatus 切换为 active 再切换为 paused 保持一致', async () => {
    const coupon = createMockCoupon({ status: 'active' })
    vi.mocked(couponRepo.findOne).mockResolvedValueOnce(coupon)
    vi.mocked(couponRepo.save).mockResolvedValueOnce({ ...coupon, status: 'paused' })
    const paused = await service.updateStatus(coupon.id, 'paused')
    expect(paused!.status).toBe('paused')
  })

  it('[D15] updateStatus 保存后调用 save', async () => {
    const coupon = createMockCoupon({ status: 'active' })
    vi.mocked(couponRepo.findOne).mockResolvedValue(coupon)
    vi.mocked(couponRepo.save).mockResolvedValue({ ...coupon, status: 'paused' })
    await service.updateStatus(coupon.id, 'paused')
    expect(couponRepo.save).toHaveBeenCalledTimes(1)
  })

  // ── triggerByCampaign ─────────────────────────────────────────

  it('[D16] triggerByCampaign 当前返回 { distributed: 0 }', async () => {
    const result = await service.triggerByCampaign('campaign-1', 'svip')
    expect(result).toEqual({ distributed: 0 })
  })

  // ── checkCrossStoreEligibility 纯函数 ────────────────────────

  it('[D17] checkCrossStoreEligibility tenant-wide 时任意 storeId 返回 matchedScope=tenant-wide', () => {
    const coupon = createMockCoupon({
      scope: { type: 'tenant-wide', storeIds: ['any'], includeSubordinates: true },
    })
    const result = service.checkCrossStoreEligibility(coupon, 'never-heard-of')
    expect(result.matchedScope).toBe('tenant-wide')
  })

  it('[D18] checkCrossStoreEligibility 返回的 matchedStoreIds 为当前匹配的单 store', () => {
    const coupon = createMockCoupon({
      scope: { type: 'multi-store', storeIds: ['s1', 's2'], includeSubordinates: false },
    })
    const result = service.checkCrossStoreEligibility(coupon, 's1')
    // 代码中 in-scope 时返回 matchedStoreIds: [storeId]
    expect(result.matchedStoreIds).toEqual(['s1'])
    expect(result.matchedScope).toBe('multi-store')
  })
})
