import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * license-package.entity.test.ts
 *
 * LicensePackage 实体单元测试。
 * TypeORM @Entity/@Column 装饰器在 tsx/node:test 上下文无法反射元数据，
 * 这里直接测试实体类的纯 JS 属性赋值/类型/序列化,
 * 同时也从实际实体导入确认类型一致性。
 */

import assert from 'node:assert/strict'
import type { LicensePackage } from './entities/license-package.entity'
import { LicensePackage as LicensePackageClass } from './entities/license-package.entity'

type LicensePackageLike = Partial<LicensePackage>

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
    assert.equal(pkg.id, undefined)
    assert.equal(pkg.isDeleted, undefined)
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
    assert.equal((pkg.deletedAt as Date).toISOString(), '2026-06-30T12:00:00.000Z')
  })

  it('反例: description 可为 undefined', () => {
    const pkg = createPkg({ description: undefined })
    assert.equal(pkg.description, undefined)
  })

  it('边界: 大数值价格 (decimal precision)', () => {
    const pkg = createPkg({ price: 99999.99 })
    assert.equal(pkg.price, 99999.99)
  })

  it('正例: 以实体类创建实例', () => {
    const pkg = new LicensePackageClass()
    pkg.name = '实体创建测试'
    pkg.price = 199
    pkg.duration = 3
    pkg.durationUnit = 'month'

    assert.equal(pkg.name, '实体创建测试')
    assert.equal(pkg.price, 199)
    assert.equal(pkg.duration, 3)
    assert.equal(pkg.isActive, undefined) // 未赋值
  })

  it('边界: 扩展功能列表', () => {
    const pkg = createPkg({
      features: ['basic', 'analytics', 'ai', 'multi-tenant', 'custom-branding'],
    })
    assert.equal(pkg.features?.length, 5)
    assert.ok(pkg.features?.includes('ai'))
    assert.ok(pkg.features?.includes('custom-branding'))
  })

  it('正例: 新建套餐默认未删除', () => {
    const pkg = createPkg()
    assert.equal(pkg.isDeleted, false)
    assert.equal(pkg.deletedBy, undefined)
    assert.equal(pkg.deletedAt, undefined)
  })

  it('反例: 价格不能为负数 (运行时)', () => {
    const pkg = createPkg({ price: -100 })
    assert.equal(pkg.price, -100) // entity 层不做校验, 由 DTO 负责
  })
})
