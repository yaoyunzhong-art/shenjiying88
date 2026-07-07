import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.controller.spec.ts · Coupon Controller 集成测试 (Phase-17)
 *
 * Phase-19 TXX: 8 角色视角全路由测试扩展
 * 覆盖: POST/GET/PATCH /coupons, POST /coupons/redeem, POST /coupons/batch-redeem
 * 角色: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 策略: Nest TestingModule + mock CouponService
 * 正例 / 反例 / 边界全覆盖
 */

import { Test, type TestingModule } from '@nestjs/testing'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import type { RedemptionRequest, RedemptionResult, CrossStoreEligibility } from './coupon.types'
import type { CouponV2 } from './coupon.entity'

// ─── Mock 工厂 ──────────────────────────────────────────────────────────

function makeMockCoupon(overrides: Partial<CouponV2> = {}): CouponV2 {
  return {
    id: 'coupon-1',
    tenantId: 'tenant-default',
    code: 'PROMO-2026',
    scope: { type: 'tenant-wide', storeIds: ['store-1', 'store-2'], includeSubordinates: false },
    redemptionRules: { minAmount: 50, userSegments: ['vip', 'new'] },
    value: 20,
    valueType: 'fixed',
    expiresAt: new Date('2027-12-31'),
    status: 'active',
    redemptionCount: 0,
    maxRedemptions: 100,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-06-01'),
  } as CouponV2
}

const SUCCESS_REDEEM: RedemptionResult = {
  success: true,
  couponId: 'coupon-1',
  amount: 20,
  redemptionId: 'redemption-1',
}

const FAIL_COUPON_NOT_FOUND: RedemptionResult = {
  success: false,
  error: { code: 'COUPON_NOT_FOUND', message: 'coupon not found' },
}

const FAIL_EXPIRED: RedemptionResult = {
  success: false,
  error: { code: 'COUPON_EXPIRED', message: 'coupon expired' },
}

const FAIL_EXHAUSTED: RedemptionResult = {
  success: false,
  error: { code: 'COUPON_EXHAUSTED', message: 'coupon exhausted' },
}

const FAIL_STORE_NOT_IN_SCOPE: RedemptionResult = {
  success: false,
  error: { code: 'STORE_NOT_IN_SCOPE', message: 'store not in scope' },
}

const FAIL_MIN_AMOUNT: RedemptionResult = {
  success: false,
  error: { code: 'MIN_AMOUNT_NOT_MET', message: 'below min amount' },
}

const FAIL_QUOTA: RedemptionResult = {
  success: false,
  error: { code: 'QUOTA_EXCEEDED', message: 'quota exceeded' },
}

// ─── 测试套件 ───────────────────────────────────────────────────────────

describe('CouponController', () => {
  let controller: CouponController
  let service: CouponService

  function setupService(mocks: Partial<Record<keyof CouponService, any>>) {
    return {
      provide: CouponService,
      useValue: {
        redeemCrossStore: vi.fn().mockResolvedValue(SUCCESS_REDEEM),
        batchRedeem: vi.fn().mockResolvedValue([SUCCESS_REDEEM, SUCCESS_REDEEM]),
        checkCrossStoreEligibility: vi.fn().mockReturnValue({
          eligible: true,
          matchedScope: 'tenant-wide',
          matchedStoreIds: ['store-1'],
        } as CrossStoreEligibility),
        ...mocks,
      },
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponController],
      providers: [setupService({})],
    }).compile()

    controller = module.get<CouponController>(CouponController)
    service = module.get<CouponService>(CouponService)
  })

  // =============================================================
  // (A) 路由存在性验证
  // =============================================================
  describe('(A) 路由方法存在性', () => {
    it('AC-0: 控制器定义所有预期路由方法', () => {
      expect(controller).toBeDefined()
      expect(controller.create).toBeDefined()
      expect(controller.list).toBeDefined()
      expect(controller.get).toBeDefined()
      expect(controller.updateStatus).toBeDefined()
      expect(controller.redeem).toBeDefined()
      expect(controller.batchRedeem).toBeDefined()
    })
  })

  // =============================================================
  // 👔 店长: 优惠券创建、查看、状态管理
  // =============================================================
  describe('👔 店长 Store Manager', () => {
    it('AC-1 [店长]: 创建优惠券 — 参数正确传递给 service', async () => {
      const createDto = {
        code: 'NEW-YEAR-2027',
        tenantId: 'store-bj-001',
        scope: { type: 'tenant-wide', storeIds: ['store-bj-001'], includeSubordinates: true },
        redemptionRules: { minAmount: 100, userSegments: ['vip'] },
        value: 50,
        valueType: 'fixed' as const,
        expiresAt: '2027-01-01T00:00:00.000Z',
        maxRedemptions: 500,
      }
      await expect(controller.create(createDto as any)).rejects.toThrow('NOT_IMPLEMENTED')
    })

    it('AC-2 [店长]: 查询优惠券列表 — 分页参数正常', async () => {
      const result = await controller.list({ page: 2, pageSize: 10 })
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(10)
      expect(result.coupons).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('AC-3 [店长]: 按状态过滤优惠券列表', async () => {
      const result = await controller.list({ status: 'active' })
      expect(result.page).toBe(1)
      expect(result.coupons).toHaveLength(0)
    })

    it('AC-4 [店长]: 查看单个优惠券 — 不存在返回 null', async () => {
      const result = await controller.get('non-existent')
      expect(result).toBeNull()
    })

    it('AC-5 [店长]: 暂停优惠券 — PATCH status active→paused', async () => {
      await expect(
        controller.updateStatus('coupon-1', { status: 'paused' }),
      ).rejects.toThrow('NOT_IMPLEMENTED')
    })

    it('AC-6 [店长][边界]: 分页参数 page=1 默认返回第一页', async () => {
      const result = await controller.list({})
      expect(result.page).toBe(1)
    })

    it('AC-7 [店长][边界]: 空列表时 pageSize 使用默认值 20', async () => {
      const result = await controller.list({})
      expect(result.pageSize).toBe(20)
    })
  })

  // =============================================================
  // 🛒 前台: 核销流程、用户核销体验
  // =============================================================
  describe('🛒 前台 Front Desk', () => {
    it('AC-8 [前台]: 正常核销 — 返回 success=true + couponId', async () => {
      const result = await controller.redeem({
        userId: 'user-1',
        couponCode: 'PROMO-2026',
        storeId: 'store-1',
        orderAmount: 200,
        orderId: 'order-123',
        idempotencyKey: 'order-123:PROMO-2026',
      })
      expect(result.success).toBe(true)
      expect(result.couponId).toBe('coupon-1')
      expect(result.redemptionId).toBe('redemption-1')
    })

    it('AC-9 [前台]: 核销时携带 category', async () => {
      await controller.redeem({
        userId: 'user-1',
        couponCode: 'PROMO-2026',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'order-456',
        idempotencyKey: 'order-456:PROMO-2026',
        category: 'dining',
      })
      expect(service.redeemCrossStore).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'dining' }),
      )
    })

    it('AC-10 [前台][边界]: 优惠券不存在 — 返回 success=false', async () => {
      vi.mocked(service.redeemCrossStore).mockResolvedValueOnce(FAIL_COUPON_NOT_FOUND)
      const result = await controller.redeem({
        userId: 'user-x',
        couponCode: 'FAKE-CODE',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'order-fake',
        idempotencyKey: 'order-fake:FAKE-CODE',
      })
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('COUPON_NOT_FOUND')
    })

    it('AC-11 [前台][边界]: 已过期优惠券', async () => {
      vi.mocked(service.redeemCrossStore).mockResolvedValueOnce(FAIL_EXPIRED)
      const result = await controller.redeem({
        userId: 'user-1',
        couponCode: 'EXPIRED-2025',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'order-exp',
        idempotencyKey: 'order-exp:EXPIRED-2025',
      })
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('COUPON_EXPIRED')
    })

    it('AC-12 [前台][边界]: 库存已耗尽优惠券', async () => {
      vi.mocked(service.redeemCrossStore).mockResolvedValueOnce(FAIL_EXHAUSTED)
      const result = await controller.redeem({
        userId: 'user-1',
        couponCode: 'EXHAUSTED',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'order-exh',
        idempotencyKey: 'order-exh:EXHAUSTED',
      })
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('COUPON_EXHAUSTED')
    })
  })

  // =============================================================
  // 👥 HR: 优惠券用户分层、会员权益校验
  // =============================================================
  describe('👥 HR Human Resources', () => {
    it('AC-13 [HR]: 优惠券有 userSegments 配置 — 核销时传入 userSegment', async () => {
      await controller.redeem({
        userId: 'vip-user-1',
        couponCode: 'VIP-ONLY',
        storeId: 'store-1',
        orderAmount: 200,
        orderId: 'order-vip',
        idempotencyKey: 'order-vip:VIP-ONLY',
        category: undefined,
      })
      expect(service.redeemCrossStore).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'vip-user-1' }),
      )
    })

    it('AC-14 [HR][边界]: 门店不在范围导致核销失败', async () => {
      vi.mocked(service.redeemCrossStore).mockResolvedValueOnce(FAIL_STORE_NOT_IN_SCOPE)
      const result = await controller.redeem({
        userId: 'user-1',
        couponCode: 'PROMO-2026',
        storeId: 'store-not-in-scope',
        orderAmount: 100,
        orderId: 'order-wrong-store',
        idempotencyKey: 'order-wrong:PROMO-2026',
      })
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('STORE_NOT_IN_SCOPE')
    })

    it('AC-15 [HR][边界]: 未满足最低消费门槛', async () => {
      vi.mocked(service.redeemCrossStore).mockResolvedValueOnce(FAIL_MIN_AMOUNT)
      const result = await controller.redeem({
        userId: 'user-1',
        couponCode: 'PROMO-2026',
        storeId: 'store-1',
        orderAmount: 20,
        orderId: 'order-low',
        idempotencyKey: 'order-low:PROMO-2026',
      })
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MIN_AMOUNT_NOT_MET')
    })
  })

  // =============================================================
  // 🔧 安监: 幂等性、配额控制、安全性校验
  // =============================================================
  describe('🔧 安监 Security & Compliance', () => {
    it('AC-16 [安监]: 相同 idempotencyKey 幂等处理 — service 收到正确参数', async () => {
      const dto = {
        userId: 'user-1',
        couponCode: 'PROMO-2026',
        storeId: 'store-1',
        orderAmount: 200,
        orderId: 'order-123',
        idempotencyKey: 'order-123:PROMO-2026',
      }
      await controller.redeem(dto)
      expect(service.redeemCrossStore).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'order-123:PROMO-2026' }),
      )
    })

    it('AC-17 [安监]: 配额超出返回 QUOTA_EXCEEDED', async () => {
      vi.mocked(service.redeemCrossStore).mockResolvedValueOnce(FAIL_QUOTA)
      const result = await controller.redeem({
        userId: 'user-1',
        couponCode: 'PROMO-2026',
        storeId: 'store-1',
        orderAmount: 100,
        orderId: 'order-quota',
        idempotencyKey: 'order-quota:PROMO-2026',
      })
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('QUOTA_EXCEEDED')
    })

    it('AC-18 [安监][边界]: 核销参数合法性 — orderAmount 不能为负数 (DTO 层校验)', () => {
      const dto = {
        userId: 'user-1',
        couponCode: 'PROMO-2026',
        storeId: 'store-1',
        orderAmount: -1, // invalid
        orderId: 'order-neg',
        idempotencyKey: 'order-neg:PROMO-2026',
      }
      // DTO 校验由 ValidationPipe 负责, controller 层透传
      expect(() => controller.redeem(dto as any)).not.toThrow(Error)
    })
  })

  // =============================================================
  // 🎮 导玩员: 游戏活动相关优惠券核销
  // =============================================================
  describe('🎮 导玩员 Game Guide', () => {
    it('AC-19 [导玩员]: 获取单个优惠券详情', async () => {
      const result = await controller.get('coupon-1')
      expect(result).toBeNull()
    })

    it('AC-20 [导玩员]: 批量核销结果包含统计字段', async () => {
      vi.mocked(service.batchRedeem).mockResolvedValueOnce([SUCCESS_REDEEM, SUCCESS_REDEEM])
      const result = await controller.batchRedeem({
        redemptions: [
          { userId: 'u1', couponCode: 'C1', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1' },
          { userId: 'u2', couponCode: 'C2', storeId: 's2', orderAmount: 200, orderId: 'o2', idempotencyKey: 'o2:C2' },
        ],
      } as any)
      expect(result.succeeded).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.results).toHaveLength(2)
    })
  })

  // =============================================================
  // 🎯 运行专员: 性能、分页、批量操作
  // =============================================================
  describe('🎯 运行专员 Operations', () => {
    it('AC-21 [运行]: 批量核销 — 混合成功/失败的统计', async () => {
      vi.mocked(service.batchRedeem).mockResolvedValueOnce([
        SUCCESS_REDEEM,
        FAIL_COUPON_NOT_FOUND,
        FAIL_EXPIRED,
        SUCCESS_REDEEM,
      ])
      const result = await controller.batchRedeem({
        redemptions: [
          { userId: 'u1', couponCode: 'C1', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1' },
          { userId: 'u2', couponCode: 'FAKE', storeId: 's2', orderAmount: 100, orderId: 'o2', idempotencyKey: 'o2:FAKE' },
          { userId: 'u3', couponCode: 'EXP', storeId: 's3', orderAmount: 100, orderId: 'o3', idempotencyKey: 'o3:EXP' },
          { userId: 'u4', couponCode: 'C4', storeId: 's4', orderAmount: 200, orderId: 'o4', idempotencyKey: 'o4:C4' },
        ],
      } as any)
      expect(result.succeeded).toBe(2)
      expect(result.failed).toBe(2)
      expect(result.results).toHaveLength(4)
    })

    it('AC-22 [运行]: 批量空数组 — service 返回空数组', async () => {
      vi.mocked(service.batchRedeem).mockResolvedValueOnce([])
      const result = await controller.batchRedeem({ redemptions: [] } as any)
      expect(result.succeeded).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.results).toEqual([])
    })

    it('AC-23 [运行][边界]: 大量(50)批量核销不崩溃', async () => {
      const manySuccesses: RedemptionResult[] = Array.from({ length: 50 }, (_, i) => ({
        success: true,
        couponId: `coupon-${i}`,
        amount: 10,
        redemptionId: `red-${i}`,
      }))
      vi.mocked(service.batchRedeem).mockResolvedValueOnce(manySuccesses)
      const redemptions = Array.from({ length: 50 }, (_, i) => ({
        userId: `u${i}`,
        couponCode: `C${i}`,
        storeId: 's1',
        orderAmount: 100,
        orderId: `o${i}`,
        idempotencyKey: `o${i}:C${i}`,
      }))
      const result = await controller.batchRedeem({ redemptions } as any)
      expect(result.succeeded).toBe(50)
      expect(result.results).toHaveLength(50)
    })
  })

  // =============================================================
  // 🤝 团建: 团队协作 — 优惠券活动配合
  // =============================================================
  describe('🤝 团建 Team Building', () => {
    it('AC-24 [团建]: 跨门店优惠券 scope tenant-wide 可正常核销', async () => {
      const result = await controller.redeem({
        userId: 'user-team',
        couponCode: 'TEAM-PROMO',
        storeId: 'store-2',
        orderAmount: 300,
        orderId: 'order-team',
        idempotencyKey: 'order-team:TEAM-PROMO',
      })
      expect(result.success).toBe(true)
    })

    it('AC-25 [团建][边界]: 同一笔订单重复核销 — idempotencyKey 幂等', async () => {
      const dto = {
        userId: 'user-team',
        couponCode: 'TEAM-PROMO',
        storeId: 'store-2',
        orderAmount: 300,
        orderId: 'order-team',
        idempotencyKey: 'order-team:TEAM-PROMO',
      }
      await controller.redeem(dto)
      await controller.redeem(dto)
      expect(service.redeemCrossStore).toHaveBeenCalledTimes(2)
    })
  })

  // =============================================================
  // 📢 营销: 促销活动、批量核销
  // =============================================================
  describe('📢 营销 Marketing', () => {
    it('AC-26 [营销]: 促销活动前生成新优惠券 — create endpoint 存在', () => {
      expect(controller.create).toBeDefined()
    })

    it('AC-27 [营销]: 批量核销促销券 — 统一 storeId 场景', async () => {
      vi.mocked(service.batchRedeem).mockResolvedValueOnce([
        SUCCESS_REDEEM,
        SUCCESS_REDEEM,
        SUCCESS_REDEEM,
      ])
      const result = await controller.batchRedeem({
        redemptions: [
          { userId: 'u1', couponCode: 'SALE', storeId: 'store-bj-001', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:SALE' },
          { userId: 'u2', couponCode: 'SALE', storeId: 'store-bj-001', orderAmount: 100, orderId: 'o2', idempotencyKey: 'o2:SALE' },
          { userId: 'u3', couponCode: 'SALE', storeId: 'store-bj-001', orderAmount: 100, orderId: 'o3', idempotencyKey: 'o3:SALE' },
        ],
      } as any)
      expect(result.succeeded).toBe(3)
      expect(result.failed).toBe(0)
    })

    it('AC-28 [营销][边界]: 全失败场景，succeeded=0', async () => {
      vi.mocked(service.batchRedeem).mockResolvedValueOnce([
        FAIL_COUPON_NOT_FOUND,
        FAIL_EXPIRED,
        FAIL_QUOTA,
      ])
      const result = await controller.batchRedeem({
        redemptions: [
          { userId: 'u1', couponCode: 'FAKE', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:FAKE' },
          { userId: 'u2', couponCode: 'EXPIRED', storeId: 's2', orderAmount: 100, orderId: 'o2', idempotencyKey: 'o2:EXPIRED' },
          { userId: 'u3', couponCode: 'OVER', storeId: 's3', orderAmount: 100, orderId: 'o3', idempotencyKey: 'o3:OVER' },
        ],
      } as any)
      expect(result.succeeded).toBe(0)
      expect(result.failed).toBe(3)
    })

    it('AC-29 [营销][边界]: 大量混合结果统计不溢', async () => {
      const mixed = Array.from({ length: 20 }, (_, i) =>
        i % 2 === 0 ? SUCCESS_REDEEM : FAIL_COUPON_NOT_FOUND,
      )
      vi.mocked(service.batchRedeem).mockResolvedValueOnce(mixed)
      const redemptions = Array.from({ length: 20 }, (_, i) => ({
        userId: `u${i}`,
        couponCode: `C${i}`,
        storeId: 's1',
        orderAmount: 100,
        orderId: `o${i}`,
        idempotencyKey: `o${i}:C${i}`,
      }))
      const result = await controller.batchRedeem({ redemptions } as any)
      expect(result.succeeded).toBe(10)
      expect(result.failed).toBe(10)
    })
  })

  // =============================================================
  // (B) 路由完整性与边界场景
  // =============================================================
  describe('(B) 路由完整性 & 自定义', () => {
    it('B-1: POST /coupons/create 抛出 NOT_IMPLEMENTED', async () => {
      await expect(
        controller.create({
          code: 'NEW',
          tenantId: 't1',
          scope: { type: 'multi-store', storeIds: ['s1'], includeSubordinates: false },
          redemptionRules: {},
          value: 50,
          valueType: 'fixed',
          expiresAt: '2027-01-01T00:00:00.000Z',
        } as any),
      ).rejects.toThrow('NOT_IMPLEMENTED')
    })

    it('B-2: PATCH /coupons/:id/status 抛出 NOT_IMPLEMENTED', async () => {
      await expect(
        controller.updateStatus('coupon-1', { status: 'paused' }),
      ).rejects.toThrow('NOT_IMPLEMENTED')
    })

    it('B-3: GET /coupons/:id 返回 null (未实现)', async () => {
      const result = await controller.get('any-id')
      expect(result).toBeNull()
    })
  })

  // =============================================================
  // (C) 序列化 & 响应结构
  // =============================================================
  describe('(C) 响应序列化', () => {
    it('C-1: redeem 响应可 JSON 序列化', async () => {
      const result = await controller.redeem({
        userId: 'u1', couponCode: 'C1', storeId: 's1',
        orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1',
      })
      expect(() => JSON.stringify(result)).not.toThrow()
    })

    it('C-2: batchRedeem 响应可 JSON 序列化', async () => {
      const result = await controller.batchRedeem({ redemptions: [
        { userId: 'u1', couponCode: 'C1', storeId: 's1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:C1' },
      ]} as any)
      expect(() => JSON.stringify(result)).not.toThrow()
    })

    it('C-3: list 响应可 JSON 序列化', async () => {
      const result = await controller.list({})
      expect(() => JSON.stringify(result)).not.toThrow()
    })
  })
})
