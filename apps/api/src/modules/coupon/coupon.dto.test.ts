import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.dto.test.ts · Coupon DTO 校验测试 (Phase-17)
 *
 * 验证 class-validator 装饰器是否正确校验入参。
 * 覆盖: CreateCouponDto, RedeemCouponDto, UpdateCouponStatusDto, BatchRedeemDto
 */

import { validate } from 'class-validator'
import {
  CreateCouponDto,
  RedeemCouponDto,
  UpdateCouponStatusDto,
  BatchRedeemDto,
  CouponScopeDto,
  CouponRedemptionRulesDto,
  ListCouponDto,
} from './coupon.dto'

function buildValidCreateDto(): CreateCouponDto {
  const dto = new CreateCouponDto()
  dto.code = 'PROMO-2026'
  dto.tenantId = 'tenant-A'
  dto.scope = Object.assign(new CouponScopeDto(), {
    type: 'multi-store' as const,
    storeIds: ['store-1', 'store-2'],
    includeSubordinates: false,
  })
  dto.redemptionRules = Object.assign(new CouponRedemptionRulesDto(), {
    minAmount: 100,
    applicableCategories: ['dining'],
  })
  dto.value = 50
  dto.valueType = 'fixed' as const
  dto.expiresAt = '2027-01-01T00:00:00.000Z'
  return dto
}

describe('CreateCouponDto', () => {
  it('T1: 有效入参通过校验', async () => {
    const dto = buildValidCreateDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T2: code 为空 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    dto.code = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('code')
  })

  it('T3: value 为负数 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    dto.value = -1
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('value')
  })

  it('T4: expiresAt 非法 ISO 8601 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    dto.expiresAt = 'not-a-date'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('expiresAt')
  })

  it('T5: valueType 非法枚举 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    ;(dto as any).valueType = 'invalid'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('valueType')
  })

  it('T6: scope.type 非法 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    ;(dto.scope as any).type = 'global'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T7: storeIds 非数组 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    ;(dto.scope as any).storeIds = 'not-array'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T8: maxRedemptions 可选字段不填通过校验', async () => {
    const dto = buildValidCreateDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T9: maxRedemptions < 1 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    dto.maxRedemptions = 0
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('maxRedemptions')
  })

  it('T10: percentage + value=100 边界通过', async () => {
    const dto = buildValidCreateDto()
    dto.valueType = 'percentage' as const
    dto.value = 100
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T11: tenantId 空字符串 → 校验失败', async () => {
    const dto = buildValidCreateDto()
    dto.tenantId = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('tenantId')
  })

  it('T12: redemptionRules 缺失必要嵌套字段 → 校验通过(嵌套无额外必填)', async () => {
    const dto = buildValidCreateDto()
    dto.redemptionRules = Object.assign(new CouponRedemptionRulesDto(), {})
    const errors = await validate(dto)
    // all redemption rules fields are optional
    expect(errors).toHaveLength(0)
  })
})

describe('RedeemCouponDto', () => {
  function buildValidRedeemDto(): RedeemCouponDto {
    const dto = new RedeemCouponDto()
    dto.userId = 'user-1'
    dto.couponCode = 'PROMO-2026'
    dto.storeId = 'store-1'
    dto.orderAmount = 200
    dto.orderId = 'order-123'
    dto.idempotencyKey = 'order-123:PROMO-2026'
    return dto
  }

  it('T13: 有效核销请求通过校验', async () => {
    const dto = buildValidRedeemDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T14: orderAmount=0 边界通过校验', async () => {
    const dto = buildValidRedeemDto()
    dto.orderAmount = 0
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T15: orderAmount 负数 → 校验失败', async () => {
    const dto = buildValidRedeemDto()
    dto.orderAmount = -10
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T16: userId 缺失 → 校验失败', async () => {
    const dto = buildValidRedeemDto()
    dto.userId = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T17: category 可选字段不填通过校验', async () => {
    const dto = buildValidRedeemDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T18: idempotencyKey 重复校验(仅 DTO 不校验唯一性)', async () => {
    const dto = buildValidRedeemDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('UpdateCouponStatusDto', () => {
  it('T19: active 状态通过校验', async () => {
    const dto = new UpdateCouponStatusDto()
    dto.status = 'active' as const
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T20: paused 状态通过校验', async () => {
    const dto = new UpdateCouponStatusDto()
    dto.status = 'paused' as const
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T21: expired 非法状态(不允许手动设置) → 校验失败', async () => {
    const dto = new UpdateCouponStatusDto()
    ;(dto as any).status = 'expired'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T22: unknown 状态 → 校验失败', async () => {
    const dto = new UpdateCouponStatusDto()
    ;(dto as any).status = 'unknown'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T23: missing status → 校验失败', async () => {
    const dto = new UpdateCouponStatusDto()
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('BatchRedeemDto', () => {
  it('T24: 单个核销通过校验', async () => {
    const dto = new BatchRedeemDto()
    const r1 = new RedeemCouponDto()
    r1.userId = 'user-1'
    r1.couponCode = 'CODE-1'
    r1.storeId = 'store-1'
    r1.orderAmount = 100
    r1.orderId = 'order-1'
    r1.idempotencyKey = 'order-1:CODE-1'
    dto.redemptions = [r1]
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T25: 空数组 → 校验失败', async () => {
    const dto = new BatchRedeemDto()
    dto.redemptions = []
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T26: 多个核销(含可选 category)', async () => {
    const dto = new BatchRedeemDto()
    dto.redemptions = [
      Object.assign(new RedeemCouponDto(), {
        userId: 'u1',
        couponCode: 'C1',
        storeId: 's1',
        orderAmount: 100,
        orderId: 'o1',
        idempotencyKey: 'o1:C1',
      }),
      Object.assign(new RedeemCouponDto(), {
        userId: 'u2',
        couponCode: 'C2',
        storeId: 's2',
        orderAmount: 200,
        orderId: 'o2',
        idempotencyKey: 'o2:C2',
        category: 'dining',
      }),
    ]
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('ListCouponDto', () => {
  it('T27: 默认空对象通过校验', async () => {
    const dto = new ListCouponDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T28: 全字段填充通过校验', async () => {
    const dto = new ListCouponDto()
    dto.status = 'active' as const
    dto.tenantId = 'tenant-A'
    dto.page = 1
    dto.pageSize = 50
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('T29: page=0 → 校验失败', async () => {
    const dto = new ListCouponDto()
    dto.page = 0
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('T30: 非法 status → 校验失败', async () => {
    const dto = new ListCouponDto()
    ;(dto as any).status = 'archived'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
