import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * coupon.contract.test.ts · Coupon Contract 单元测试 (Phase-17)
 *
 * 验证 toCouponContract / toCouponListContract 转换逻辑。
 * 覆盖: 正常转换,边界值,空列表
 */

import {
  toCouponContract,
  toCouponListContract,
} from './coupon.contract'
import type { CouponV2 } from './coupon.entity'

function buildMockCoupon(overrides: Partial<CouponV2> = {}): CouponV2 {
  return {
    id: 'coupon-test-1',
    tenantId: 'tenant-A',
    code: 'CROSS-2026-50',
    scope: {
      type: 'multi-store',
      storeIds: ['store-1', 'store-2'],
      includeSubordinates: false,
    },
    redemptionRules: {
      minAmount: 100,
      applicableCategories: ['dining'],
      userSegments: ['svip'],
    },
    value: 50,
    valueType: 'fixed',
    expiresAt: new Date('2027-01-01T00:00:00Z'),
    status: 'active',
    redemptionCount: 0,
    maxRedemptions: 1000,
    createdAt: new Date('2026-06-26T00:00:00Z'),
    updatedAt: new Date('2026-06-26T00:00:00Z'),
    ...overrides,
  } as CouponV2
}

describe('toCouponContract', () => {
  it('T1: 正常优惠券实体 → 契约对象', () => {
    const entity = buildMockCoupon()
    const contract = toCouponContract(entity)

    expect(contract.id).toBe('coupon-test-1')
    expect(contract.tenantId).toBe('tenant-A')
    expect(contract.code).toBe('CROSS-2026-50')
    expect(contract.scope.type).toBe('multi-store')
    expect(contract.scope.storeIds).toEqual(['store-1', 'store-2'])
    expect(contract.value).toBe(50)
    expect(contract.valueType).toBe('fixed')
    expect(contract.status).toBe('active')
    expect(contract.redemptionCount).toBe(0)
    expect(contract.maxRedemptions).toBe(1000)
    expect(contract.expiresAt).toBe('2027-01-01T00:00:00.000Z')
    expect(contract.createdAt).toBe('2026-06-26T00:00:00.000Z')
    expect(contract.updatedAt).toBe('2026-06-26T00:00:00.000Z')
  })

  it('T2: percentage 类型 + exhausted 状态', () => {
    const entity = buildMockCoupon({
      valueType: 'percentage',
      value: 20,
      status: 'exhausted',
      redemptionCount: 1000,
      maxRedemptions: 1000,
    })
    const contract = toCouponContract(entity)

    expect(contract.valueType).toBe('percentage')
    expect(contract.value).toBe(20)
    expect(contract.status).toBe('exhausted')
    expect(contract.redemptionCount).toBe(1000)
  })

  it('T3: decimal value 精度保留', () => {
    const entity = buildMockCoupon({ value: 9.99 as any })
    const contract = toCouponContract(entity)
    expect(contract.value).toBe(9.99)
  })

  it('T4: single-store scope 正确传递', () => {
    const entity = buildMockCoupon({
      scope: {
        type: 'single-store',
        storeIds: ['store-only-A'],
        includeSubordinates: false,
      },
    })
    const contract = toCouponContract(entity)
    expect(contract.scope.type).toBe('single-store')
    expect(contract.scope.storeIds).toEqual(['store-only-A'])
  })

  it('T5: tenant-wide scope + includeSubordinates', () => {
    const entity = buildMockCoupon({
      scope: {
        type: 'tenant-wide',
        storeIds: [],
        includeSubordinates: true,
      },
    })
    const contract = toCouponContract(entity)
    expect(contract.scope.type).toBe('tenant-wide')
    expect(contract.scope.includeSubordinates).toBe(true)
  })

  it('T6: maxRedemptions 可选字段为空', () => {
    const entity = buildMockCoupon({ maxRedemptions: undefined as any })
    const contract = toCouponContract(entity)
    expect(contract.maxRedemptions).toBeUndefined()
  })

  it('T7: paused 状态 + redemptionCount > 0', () => {
    const entity = buildMockCoupon({
      status: 'paused',
      redemptionCount: 5,
    })
    const contract = toCouponContract(entity)
    expect(contract.status).toBe('paused')
    expect(contract.redemptionCount).toBe(5)
  })

  it('T8: expired 状态边界', () => {
    const entity = buildMockCoupon({
      status: 'expired',
      expiresAt: new Date('2020-01-01T00:00:00Z'),
    })
    const contract = toCouponContract(entity)
    expect(contract.status).toBe('expired')
    expect(contract.expiresAt).toBe('2020-01-01T00:00:00.000Z')
  })
})

describe('toCouponListContract', () => {
  it('T9: 非空列表正常转换', () => {
    const entities = [
      buildMockCoupon({ id: 'c1', code: 'CODE-1', value: 10 }),
      buildMockCoupon({ id: 'c2', code: 'CODE-2', value: 20 }),
    ]
    const result = toCouponListContract(entities, 2, 1, 10)

    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.coupons).toHaveLength(2)
    expect(result.coupons[0].code).toBe('CODE-1')
    expect(result.coupons[1].code).toBe('CODE-2')
  })

  it('T10: 空列表 + 分页边界', () => {
    const result = toCouponListContract([], 0, 5, 20)
    expect(result.total).toBe(0)
    expect(result.page).toBe(5)
    expect(result.pageSize).toBe(20)
    expect(result.coupons).toHaveLength(0)
  })

  it('T11: 大量数据转换不丢字段', () => {
    const entities = Array.from({ length: 50 }, (_, i) =>
      buildMockCoupon({ id: `c${i}`, code: `CODE-${i}` }),
    )
    const result = toCouponListContract(entities, 500, 1, 50)
    expect(result.coupons).toHaveLength(50)
    expect(result.total).toBe(500)
    result.coupons.forEach((c, i) => {
      expect(c.id).toBe(`c${i}`)
      expect(c.code).toBe(`CODE-${i}`)
    })
  })
})
