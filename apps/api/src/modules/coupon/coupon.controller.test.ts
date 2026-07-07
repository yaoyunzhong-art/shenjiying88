import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.controller.test.ts · Coupon Controller 快速单测 (Phase-17)
 *
 * 纯单元测试,不依赖 Nest TestingModule,直接实例化 controller。
 * 正向流程 + 异常路径 + 边界覆盖。
 */

import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import type { RedemptionResult } from './coupon.types'

describe('CouponController (unit)', () => {
  let controller: CouponController
  let service: CouponService

  beforeEach(() => {
    const mockService = new CouponService(
      {} as any,
      {} as any,
      { transaction: async (cb: any) => cb({ getRepository: () => ({}) }) } as any,
      undefined,
      undefined,
    )
    // Mock only redeemCrossStore for controlled tests
    vi.spyOn(mockService, 'redeemCrossStore').mockResolvedValue({
      success: true,
      couponId: 'c-1',
      amount: 50,
      redemptionId: 'r-1',
    })
    vi.spyOn(mockService, 'batchRedeem').mockResolvedValue([])

    service = mockService
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

  it('T5: list 返回默认分页结构', async () => {
    const result = await controller.list({})

    expect(result.total).toBe(0)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.coupons).toEqual([])
  })

  it('T6: get 不存在的 ID 返回 null', async () => {
    const result = await controller.get('nonexistent')
    expect(result).toBeNull()
  })

  it('T7: create 抛出 NotImplemented 错误', async () => {
    await expect(controller.create({} as any)).rejects.toThrow('NOT_IMPLEMENTED')
  })

  it('T8: updateStatus 抛出 NotImplemented 错误', async () => {
    await expect(controller.updateStatus('x', { status: 'paused' })).rejects.toThrow('NOT_IMPLEMENTED')
  })
})
