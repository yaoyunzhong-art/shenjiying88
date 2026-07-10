import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.controller.test.ts · Coupon Controller 快速单测 (Phase-17)
 *
 * 纯单元测试,不依赖 Nest TestingModule,直接实例化 controller。
 * 正向流程 + 异常路径 + 边界覆盖。
 *
 * Pulse-Bot: 实现 create / list / get / updateStatus 控制器方法及测试
 */

import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import { CouponV2 } from './coupon.entity'
import type { RedemptionResult } from './coupon.types'
import { DataSource } from 'typeorm'

// ─── 工厂: 创建 mock 仓库 ──────────────────────────────────────────────

function createMockRepo(overrides: Record<string, any> = {}) {
  const defaultMock = {
    create: vi.fn((d: any) => d),
    save: vi.fn((d: any) => ({ ...d, id: 'mock-id', createdAt: new Date(), updatedAt: new Date() })),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
  }
  return { ...defaultMock, ...overrides }
}

function createMockDataSource() {
  return {
    transaction: async (cb: any) => cb({
      getRepository: () => createMockRepo(),
    }),
  } as unknown as DataSource
}

describe('CouponController (unit)', () => {
  let controller: CouponController
  let service: CouponService
  let couponRepo: ReturnType<typeof createMockRepo>

  beforeEach(() => {
    couponRepo = createMockRepo()
    const redemptionRepo = createMockRepo()
    const dataSource = createMockDataSource()

    service = new CouponService(
      couponRepo as any,
      redemptionRepo as any,
      dataSource,
      undefined,
      undefined,
    )

    // Mock redeemCrossStore for controlled tests
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue({
      success: true,
      couponId: 'c-1',
      amount: 50,
      redemptionId: 'r-1',
    })
    vi.spyOn(service, 'batchRedeem').mockResolvedValue([])

    controller = new CouponController(service)
  })

  // ─── 正向流程 ─────────────────────────────────────────────────────────

  it('T1: redeem 成功返回核销结果', async () => {
    const result = await controller.redeem({
      userId: 'u1',
      couponCode: 'CODE-1',
      storeId: 's1',
      orderAmount: 200,
      orderId: 'o1',
      idempotencyKey: 'o1:CODE-1',
    })

    expect(result.success).toBe(true)
    expect(result.couponId).toBe('c-1')
    expect(result.amount).toBe(50)
  })

  it('T2: batchRedeem 成功返回统计', async () => {
    vi.mocked(service.batchRedeem).mockResolvedValue([
      { success: true, couponId: 'c1', amount: 10, redemptionId: 'r1' },
      { success: false, error: { code: 'MIN_AMOUNT_NOT_MET', message: 'min 100' } },
    ] as RedemptionResult[])

    const result = await controller.batchRedeem({
      redemptions: [
        {
          userId: 'u1', couponCode: 'C1', storeId: 's1',
          orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1',
        },
        {
          userId: 'u2', couponCode: 'C2', storeId: 's2',
          orderAmount: 50, orderId: 'o2', idempotencyKey: 'o2:C2',
        },
      ],
    })

    expect(result.succeeded).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.results).toHaveLength(2)
  })

  // ─── 异常路径 ─────────────────────────────────────────────────────────

  it('T3: redeem 失败返回错误信息', async () => {
    vi.mocked(service.redeemCrossStore).mockResolvedValue({
      success: false,
      error: { code: 'STORE_NOT_IN_SCOPE', message: 'store not allowed' },
    })

    const result = await controller.redeem({
      userId: 'u1', couponCode: 'C1', storeId: 'invalid-store',
      orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1',
    })

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('STORE_NOT_IN_SCOPE')
  })

  // ─── 空/边界 ──────────────────────────────────────────────────────────

  it('T4: batchRedeem 全部失败时 succeeded = 0', async () => {
    vi.mocked(service.batchRedeem).mockResolvedValue([
      { success: false, error: { code: 'COUPON_NOT_FOUND', message: 'not found' } },
      { success: false, error: { code: 'COUPON_EXPIRED', message: 'expired' } },
    ] as RedemptionResult[])

    const result = await controller.batchRedeem({
      redemptions: [
        {
          userId: 'u1', couponCode: 'C1', storeId: 's1',
          orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1',
        },
        {
          userId: 'u2', couponCode: 'C2', storeId: 's2',
          orderAmount: 100, orderId: 'o2', idempotencyKey: 'o2:C2',
        },
      ],
    })

    expect(result.succeeded).toBe(0)
    expect(result.failed).toBe(2)
  })

  // ─── CRUD 实现测试 ──────────────────────────────────────────────────

  it('T5: list 调用 service.list 并正确分页', async () => {
    const mockCoupon = new CouponV2()
    Object.assign(mockCoupon, {
      id: 'c-1',
      tenantId: 't-1',
      code: 'TEST-50',
      scope: { type: 'single-store' as const, storeIds: ['s1'], includeSubordinates: false },
      redemptionRules: {},
      value: 50,
      valueType: 'fixed' as const,
      expiresAt: new Date('2027-01-01'),
      status: 'active' as const,
      redemptionCount: 0,
      maxRedemptions: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    couponRepo.findAndCount.mockResolvedValue([[mockCoupon], 1])

    const result = await controller.list({ page: 1, pageSize: 10 })

    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.coupons).toHaveLength(1)
    expect(result.coupons[0].code).toBe('TEST-50')
    expect(result.coupons[0].value).toBe(50)
  })

  it('T6: get 返回优惠券详情', async () => {
    const mockCoupon = new CouponV2()
    Object.assign(mockCoupon, {
      id: 'c-1',
      tenantId: 't-1',
      code: 'DETAIL-01',
      scope: { type: 'tenant-wide' as const, storeIds: ['s1', 's2'], includeSubordinates: true },
      redemptionRules: { minAmount: 100 },
      value: 30,
      valueType: 'percentage' as const,
      expiresAt: new Date('2027-06-01'),
      status: 'active' as const,
      redemptionCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    couponRepo.findOne.mockResolvedValue(mockCoupon)

    const result = await controller.get('c-1')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('c-1')
    expect(result!.code).toBe('DETAIL-01')
    expect(result!.scope.type).toBe('tenant-wide')
  })

  it('T6b: get 不存在的 ID 返回 null', async () => {
    couponRepo.findOne.mockResolvedValue(null)
    const result = await controller.get('nonexistent')
    expect(result).toBeNull()
  })

  it('T7: create 调用 service.create 并返回契约', async () => {
    const expiresAt = '2027-12-31T00:00:00.000Z'
    couponRepo.save.mockImplementation((d: any) => Promise.resolve({
      ...d,
      id: 'new-coupon-id',
      redemptionCount: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const result = await controller.create({
      code: 'NEW-CODE',
      tenantId: 't-1',
      scope: { type: 'multi-store', storeIds: ['s1', 's2'], includeSubordinates: false },
      redemptionRules: { minAmount: 50, applicableCategories: ['dining'] },
      value: 20,
      valueType: 'fixed',
      expiresAt,
      maxRedemptions: 500,
    })

    expect(result.id).toBe('new-coupon-id')
    expect(result.code).toBe('NEW-CODE')
    expect(result.value).toBe(20)
    expect(result.status).toBe('active')
    expect(result.redemptionCount).toBe(0)
  })

  it('T8: updateStatus 更新优惠券状态', async () => {
    const mockCoupon = new CouponV2()
    Object.assign(mockCoupon, {
      id: 'c-1',
      tenantId: 't-1',
      code: 'PAUSE-TEST',
      scope: { type: 'single-store', storeIds: ['s1'], includeSubordinates: false },
      redemptionRules: {},
      value: 10,
      valueType: 'fixed',
      expiresAt: new Date('2027-01-01'),
      status: 'active',
      redemptionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    couponRepo.findOne.mockResolvedValue(mockCoupon)
    couponRepo.save.mockImplementation((d: any) => Promise.resolve({ ...d, updatedAt: new Date() }))

    const result = await controller.updateStatus('c-1', { status: 'paused' })

    expect(result.status).toBe('paused')
    expect(result.id).toBe('c-1')
  })

  it('T8b: updateStatus 不存在的优惠券抛出错误', async () => {
    couponRepo.findOne.mockResolvedValue(null)

    await expect(controller.updateStatus('nonexistent', { status: 'paused' })).rejects.toThrow('not found')
  })

  // ─── list 边界测试 ──────────────────────────────────────────────────

  it('T9: list 空数据库返回空列表', async () => {
    couponRepo.findAndCount.mockResolvedValue([[], 0])

    const result = await controller.list({})

    expect(result.total).toBe(0)
    expect(result.coupons).toEqual([])
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('T10: list 支持按 tenantId 和 status 过滤', async () => {
    couponRepo.findAndCount.mockResolvedValue([[], 0])

    await controller.list({ tenantId: 't-1', status: 'active' })

    expect(couponRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 't-1',
          status: 'active',
        }),
      }),
    )
  })
})
