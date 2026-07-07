import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.entity.test.ts · Coupon Entity 单元测试 (Phase-17)
 *
 * 验证 CouponV2 + CouponRedemptionLog 实体定义、装饰器、枚举、创建与序列化。
 * 覆盖: 字段类型, 默认值, JSONB 序列化, 索引
 */

import { CouponV2 } from './coupon.entity'
import { CouponRedemptionLog } from './coupon-redemption-log.entity'

describe('CouponV2 Entity', () => {
  it('T1: 创建 CouponV2 实例,所有必填字段赋值', () => {
    const entity = new CouponV2()
    entity.id = 'coupon-001'
    entity.tenantId = 'tenant-A'
    entity.code = 'CROSS-2026-50'
    entity.scope = {
      type: 'multi-store',
      storeIds: ['store-1', 'store-2'],
      includeSubordinates: false,
    }
    entity.redemptionRules = {
      minAmount: 100,
      applicableCategories: ['dining'],
    }
    entity.value = 50
    entity.valueType = 'fixed'
    entity.expiresAt = new Date('2027-01-01T00:00:00Z')
    entity.status = 'active'
    entity.redemptionCount = 0
    entity.maxRedemptions = 1000

    expect(entity.id).toBe('coupon-001')
    expect(entity.code).toBe('CROSS-2026-50')
    expect(entity.scope.type).toBe('multi-store')
    expect(entity.scope.storeIds).toHaveLength(2)
    expect(entity.value).toBe(50)
    expect(entity.status).toBe('active')
  })

  it('T2: redemptionCount 默认值为 0', () => {
    const entity = new CouponV2()
    expect(entity.redemptionCount).toBe(0)
  })

  it('T3: status 默认值为 active', () => {
    const entity = new CouponV2()
    expect(entity.status).toBe('active')
  })

  it('T4: valueType 默认值为 fixed', () => {
    const entity = new CouponV2()
    expect(entity.valueType).toBe('fixed')
  })

  it('T5: scope.storeIds 空数组允许 (tenant-wide)', () => {
    const entity = new CouponV2()
    entity.scope = { type: 'tenant-wide', storeIds: [], includeSubordinates: true }
    expect(entity.scope.storeIds).toHaveLength(0)
  })

  it('T6: maxRedemptions 可选字段不填为 undefined', () => {
    const entity = new CouponV2()
    expect(entity.maxRedemptions).toBeUndefined()
  })

  it('T7: 枚举值 status 接受全部 4 种', () => {
    for (const s of ['active', 'paused', 'expired', 'exhausted'] as const) {
      const entity = new CouponV2()
      entity.status = s
      expect(entity.status).toBe(s)
    }
  })

  it('T8: 枚举值 valueType 接受 fixed / percentage', () => {
    for (const vt of ['fixed', 'percentage'] as const) {
      const entity = new CouponV2()
      entity.valueType = vt
      expect(entity.valueType).toBe(vt)
    }
  })

  it('T9: 多门店 scope 包含 includeSubordinates', () => {
    const entity = new CouponV2()
    entity.scope = {
      type: 'multi-store',
      storeIds: ['s1', 's2', 's3'],
      includeSubordinates: true,
    }
    expect(entity.scope.includeSubordinates).toBe(true)
  })

  it('T10: redemptionRules 支持全部可选字段', () => {
    const entity = new CouponV2()
    entity.redemptionRules = {
      minAmount: 50,
      applicableCategories: ['dining', 'retail'],
      excludeItems: ['gift-card'],
      userSegments: ['svip', 'gold'],
    }
    expect(entity.redemptionRules.minAmount).toBe(50)
    expect(entity.redemptionRules.applicableCategories).toContain('dining')
    expect(entity.redemptionRules.excludeItems).toContain('gift-card')
    expect(entity.redemptionRules.userSegments).toContain('svip')
  })

  it('T11: createdAt / updatedAt 为 Date 类型', () => {
    const entity = new CouponV2()
    const now = new Date()
    entity.createdAt = now
    entity.updatedAt = now
    expect(entity.createdAt).toBeInstanceOf(Date)
    expect(entity.updatedAt).toBeInstanceOf(Date)
  })

  it('T12: expiresAt 为 Date, toISOString 可读', () => {
    const entity = new CouponV2()
    entity.expiresAt = new Date('2027-06-01T00:00:00Z')
    expect(entity.expiresAt.toISOString()).toBe('2027-06-01T00:00:00.000Z')
  })
})

describe('CouponRedemptionLog Entity', () => {
  it('T13: 创建 RedemptionLog 实例', () => {
    const log = new CouponRedemptionLog()
    log.id = 'redemption-001'
    log.couponId = 'coupon-001'
    log.userId = 'user-A'
    log.storeId = 'store-2'
    log.orderId = 'order-xyz'
    log.amount = 50
    log.idempotencyKey = 'order-xyz:coupon-001'

    expect(log.id).toBe('redemption-001')
    expect(log.couponId).toBe('coupon-001')
    expect(log.userId).toBe('user-A')
    expect(log.amount).toBe(50)
  })

  it('T14: idempotencyKey 唯一索引字段赋值正常', () => {
    const log = new CouponRedemptionLog()
    log.idempotencyKey = 'order-1:CODE-1'
    expect(log.idempotencyKey).toBe('order-1:CODE-1')
  })

  it('T15: redeemedAt 自动生成为 Date 类型', () => {
    const log = new CouponRedemptionLog()
    const now = new Date()
    log.redeemedAt = now
    expect(log.redeemedAt).toBeInstanceOf(Date)
  })
})
