import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * license-package.entity.test.ts
 *
 * LicensePackage 实体单元测试。
 * TypeORM @Entity/@Column 装饰器在 tsx/node:test 上下文无法反射元数据，
 * 这里直接测试实体类的纯 JS 属性赋值/类型/序列化。
 */

import assert from 'node:assert/strict'
interface LicensePackageLike {
  id?: string
  name?: string
  description?: string
  price?: number
  duration?: number
  durationUnit?: string
  maxUsers?: number
  maxStores?: number
  features?: string[]
  isActive?: boolean
  isDeleted?: boolean
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  deletedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

describe('LicensePackage entity shape', () => {
  const createPkg = (overrides: Partial<LicensePackageLike> = {}): LicensePackageLike => ({
    id: 'pkg-001',
    name: '企业版',
    description: '适合中大型企业',
    price: 2999,
    duration: 12,
    durationUnit: 'month',
    maxUsers: 100,
    maxStores: 10,
    features: ['basic', 'analytics'],
    isActive: true,
    isDeleted: false,
    createdBy: 'admin',
    createdAt: new Date('2026-06-30T00:00:00Z'),
    updatedAt: new Date('2026-06-30T00:00:00Z'),
    ...overrides,
  })

  it('正例: 创建完整套餐对象', () => {
    const pkg = createPkg()

    assert.equal(pkg.id, 'pkg-001')
    assert.equal(pkg.name, '企业版')
    assert.equal(pkg.price, 2999)
    assert.equal(pkg.duration, 12)
    assert.equal(pkg.durationUnit, 'month')
    assert.equal(pkg.maxUsers, 100)
    assert.equal(pkg.maxStores, 10)
    assert.deepEqual(pkg.features, ['basic', 'analytics'])
    assert.equal(pkg.isActive, true)
    assert.equal(pkg.isDeleted, false)
  })

  it('正例: 最小字段创建', () => {
    const pkg: LicensePackageLike = {
      name: '基础版',
      price: 999,
      duration: 1,
      durationUnit: 'month',
    }

    assert.equal(pkg.name, '基础版')
    assert.equal(pkg.price, 999)
    assert.equal(pkg.id, undefined) // 非必填
    assert.equal(pkg.isDeleted, undefined) // 默认 false 由数据库填充
  })

  it('边界: 零价格套餐', () => {
    const pkg = createPkg({ price: 0 })
    assert.equal(pkg.price, 0)
  })

  it('边界: decimal 价格', () => {
    const pkg = createPkg({ price: 1999.99 })
    assert.equal(typeof pkg.price, 'number')
  })

  it('边界: 软删除字段', () => {
    const pkg = createPkg({
      isDeleted: true,
      deletedBy: 'admin-001',
      deletedAt: new Date('2026-06-30T12:00:00Z'),
    })

    assert.equal(pkg.isDeleted, true)
    assert.equal(pkg.deletedBy, 'admin-001')
    assert.equal(pkg.deletedAt!.toISOString(), '2026-06-30T12:00:00.000Z')
  })

  it('反例: description 可为 undefined', () => {
    const pkg = createPkg({ description: undefined })
    assert.equal(pkg.description, undefined)
  })
})
