/**
 * license-package.service.spec.ts — 套餐管理纯函数式测试
 * 不 import 生产 Service/Entity，纯内联逻辑
 */
import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'

// ─── 枚举 + 类型定义 ──────────────────────────────────────────────

interface LicensePackage {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  durationUnit: 'day' | 'month' | 'year'
  maxUsers: number
  maxStores: number
  features?: string[]
  isActive: boolean
  isDeleted: boolean
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

interface CreatePackageInput {
  name: string
  description?: string
  price: number
  duration: number
  durationUnit: 'day' | 'month' | 'year'
  maxUsers: number
  maxStores: number
  features?: string[]
  isActive?: boolean
}

interface UpdatePackageInput {
  name?: string
  description?: string
  price?: number
  duration?: number
  durationUnit?: 'day' | 'month' | 'year'
  maxUsers?: number
  maxStores?: number
  features?: string[]
  isActive?: boolean
}

interface PackageQuery {
  page: number
  pageSize: number
  keyword?: string
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
}

interface PackageListResponse {
  list: LicensePackage[]
  total: number
  page: number
  pageSize: number
}

// ─── mock 数据工厂 ──────────────────────────────────────────────

let _idSeq = 0

function nextId(): string {
  return `pkg-${(++_idSeq).toString(16).padStart(6, '0')}`
}

function makePackage(overrides: Partial<LicensePackage> = {}): LicensePackage {
  const now = new Date()
  return {
    id: nextId(),
    name: `套餐-${_idSeq}`,
    price: 2999,
    duration: 12,
    durationUnit: 'month',
    maxUsers: 100,
    maxStores: 10,
    features: ['basic', 'analytics'],
    isActive: true,
    isDeleted: false,
    createdBy: 'user-admin',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeCreateInput(overrides: Partial<CreatePackageInput> = {}): CreatePackageInput {
  return {
    name: `套餐-${nextId()}`,
    price: 1999,
    duration: 6,
    durationUnit: 'month',
    maxUsers: 50,
    maxStores: 5,
    ...overrides,
  }
}

// ─── 内联纯函数 ─────────────────────────────────────────────────

function createPackage(input: CreatePackageInput, userId: string): LicensePackage {
  const now = new Date()
  return {
    id: nextId(),
    name: input.name,
    description: input.description,
    price: input.price,
    duration: input.duration,
    durationUnit: input.durationUnit,
    maxUsers: input.maxUsers,
    maxStores: input.maxStores,
    features: input.features ?? [],
    isActive: input.isActive ?? true,
    isDeleted: false,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
  }
}

function findPackageById(packages: LicensePackage[], id: string): LicensePackage | undefined {
  return packages.find(p => p.id === id && !p.isDeleted)
}

function findPackageByName(packages: LicensePackage[], name: string): LicensePackage | undefined {
  return packages.find(p => p.name === name && !p.isDeleted)
}

function updatePackage(
  pkg: LicensePackage,
  input: UpdatePackageInput,
  userId: string,
): LicensePackage {
  const now = new Date()
  return {
    ...pkg,
    ...input,
    description: input.description !== undefined ? input.description : pkg.description,
    features: input.features !== undefined ? input.features : pkg.features,
    isActive: input.isActive !== undefined ? input.isActive : pkg.isActive,
    updatedBy: userId,
    updatedAt: now,
  }
}

function softDeletePackage(pkg: LicensePackage, userId: string): LicensePackage {
  return {
    ...pkg,
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
  }
}

function queryPackages(
  packages: LicensePackage[],
  query: PackageQuery,
): PackageListResponse {
  let filtered = packages.filter(p => !p.isDeleted)

  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(kw))
  }

  if (query.isActive !== undefined) {
    filtered = filtered.filter(p => p.isActive === query.isActive)
  }

  if (query.minPrice !== undefined) {
    filtered = filtered.filter(p => p.price >= query.minPrice!)
  }

  if (query.maxPrice !== undefined) {
    filtered = filtered.filter(p => p.price <= query.maxPrice!)
  }

  const total = filtered.length
  const start = (query.page - 1) * query.pageSize
  const list = filtered.slice(start, start + query.pageSize).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )

  return { list, total, page: query.page, pageSize: query.pageSize }
}

function validatePriceModification(pkg: LicensePackage, update: UpdatePackageInput, isUsed: boolean): string | null {
  if (!isUsed) return null
  if (update.price !== undefined) return '该套餐已被使用，不能修改价格或有效期'
  return null
}

function checkPackageInUse(_packageId: string, _licenseIds: string[]): boolean {
  return _licenseIds.includes(_packageId)
}

// ─── 测试 ─────────────────────────────────────────────────────

describe('license-package.service.spec: createPackage', () => {
  it('[1] 创建基础套餐', () => {
    const input = makeCreateInput({ name: '企业版' })
    const pkg = createPackage(input, 'user-001')
    assert.ok(pkg.id)
    assert.equal(pkg.name, '企业版')
    assert.equal(pkg.price, 1999)
    assert.equal(pkg.duration, 6)
    assert.equal(pkg.durationUnit, 'month')
    assert.equal(pkg.maxUsers, 50)
    assert.equal(pkg.maxStores, 5)
    assert.equal(pkg.isActive, true)
    assert.equal(pkg.isDeleted, false)
    assert.equal(pkg.createdBy, 'user-001')
    assert.equal(pkg.updatedBy, 'user-001')
  })

  it('[2] 创建不活跃套餐', () => {
    const pkg = createPackage(makeCreateInput({ isActive: false }), 'user-002')
    assert.equal(pkg.isActive, false)
  })

  it('[3] 创建套餐自动生成 id', () => {
    const pkg = createPackage(makeCreateInput(), 'user')
    assert.ok(pkg.id.startsWith('pkg-'))
  })

  it('[4] features 为空数组默认值', () => {
    const pkg = createPackage(makeCreateInput({ features: undefined }), 'user')
    assert.deepStrictEqual(pkg.features, [])
  })

  it('[5] createdAt 和 updatedAt 是有效 Date', () => {
    const pkg = createPackage(makeCreateInput(), 'user')
    assert.ok(pkg.createdAt instanceof Date)
    assert.ok(pkg.updatedAt instanceof Date)
  })
})

describe('license-package.service.spec: findPackageById', () => {
  it('[6] 按 id 查找存在', () => {
    const pkg = makePackage({ id: 'pkg-001' })
    assert.ok(findPackageById([pkg], 'pkg-001'))
  })

  it('[7] 不存在返回 undefined', () => {
    assert.equal(findPackageById([makePackage()], 'nonexistent'), undefined)
  })

  it('[8] 不返回已删除', () => {
    const pkg = makePackage({ id: 'pkg-002', isDeleted: true })
    assert.equal(findPackageById([pkg], 'pkg-002'), undefined)
  })
})

describe('license-package.service.spec: findPackageByName', () => {
  it('[9] 按名称查找存在', () => {
    const pkg = makePackage({ name: '基础版' })
    assert.ok(findPackageByName([pkg], '基础版'))
  })

  it('[10] 不存在的名称返回 undefined', () => {
    assert.equal(findPackageByName([makePackage()], '不存在的套餐'), undefined)
  })

  it('[11] 已删除套餐名称不匹配', () => {
    const pkg = makePackage({ name: '已删版', isDeleted: true })
    assert.equal(findPackageByName([pkg], '已删版'), undefined)
  })
})

describe('license-package.service.spec: updatePackage', () => {
  it('[12] 更新套餐名称', () => {
    const pkg = makePackage({ name: '旧版' })
    const updated = updatePackage(pkg, { name: '新版' }, 'user-update')
    assert.equal(updated.name, '新版')
    assert.equal(updated.updatedBy, 'user-update')
  })

  it('[13] 部分更新不覆盖未传字段', () => {
    const pkg = makePackage({ name: '套餐', price: 100 })
    const updated = updatePackage(pkg, { name: '新名' }, 'user')
    assert.equal(updated.name, '新名')
    assert.equal(updated.price, 100) // unchanged
  })

  it('[14] 更新 active 状态', () => {
    const pkg = makePackage({ isActive: true })
    assert.equal(updatePackage(pkg, { isActive: false }, 'user').isActive, false)
  })

  it('[15] 更新后 updatedAt 变化', () => {
    const pkg = makePackage()
    const before = pkg.updatedAt.getTime()
    // Small delay
    const updated = updatePackage(pkg, { name: '改名' }, 'user')
    assert.ok(updated.updatedAt.getTime() >= before)
  })
})

describe('license-package.service.spec: softDeletePackage', () => {
  it('[16] 软删除设置标记和时间', () => {
    const pkg = makePackage()
    const deleted = softDeletePackage(pkg, 'user-del')
    assert.equal(deleted.isDeleted, true)
    assert.ok(deleted.deletedAt instanceof Date)
    assert.equal(deleted.deletedBy, 'user-del')
  })
})

describe('license-package.service.spec: queryPackages', () => {
  it('[17] 分页查询返回正确', () => {
    const pkgs = Array.from({ length: 5 }, (_, i) => makePackage({ name: `套餐${i}`, createdAt: new Date(2025, 0, i + 1) }))
    const result = queryPackages(pkgs, { page: 1, pageSize: 3 })
    assert.equal(result.list.length, 3)
    assert.equal(result.total, 5)
    assert.equal(result.page, 1)
    assert.equal(result.pageSize, 3)
  })

  it('[18] 按关键字过滤', () => {
    const pkgs = [
      makePackage({ name: '企业版' }),
      makePackage({ name: '旗舰版' }),
      makePackage({ name: '基础版' }),
    ]
    const result = queryPackages(pkgs, { page: 1, pageSize: 10, keyword: '基础' })
    assert.equal(result.total, 1)
    assert.equal(result.list[0].name, '基础版')
  })

  it('[19] 按 isActive 过滤', () => {
    const pkgs = [
      makePackage({ name: '活跃', isActive: true }),
      makePackage({ name: '不活跃', isActive: false }),
    ]
    const result = queryPackages(pkgs, { page: 1, pageSize: 10, isActive: true })
    assert.equal(result.total, 1)
  })

  it('[20] 分页空结果', () => {
    const result = queryPackages([], { page: 1, pageSize: 10 })
    assert.equal(result.list.length, 0)
    assert.equal(result.total, 0)
  })

  it('[21] 第二页', () => {
    const pkgs = Array.from({ length: 10 }, (_, i) => makePackage({ name: `P${i}` }))
    const result = queryPackages(pkgs, { page: 2, pageSize: 8 })
    assert.equal(result.list.length, 2)
    assert.equal(result.page, 2)
  })

  it('[22] 已删除套餐不出现在列表', () => {
    const pkgs = [
      makePackage({ name: '可见' }),
      makePackage({ name: '已删除', isDeleted: true }),
    ]
    const result = queryPackages(pkgs, { page: 1, pageSize: 10 })
    assert.equal(result.total, 1)
  })

  it('[23] 按价格范围过滤', () => {
    const pkgs = [
      makePackage({ name: '便宜', price: 99 }),
      makePackage({ name: '中等', price: 1999 }),
      makePackage({ name: '昂贵', price: 9999 }),
    ]
    const result = queryPackages(pkgs, { page: 1, pageSize: 10, minPrice: 100, maxPrice: 5000 })
    assert.equal(result.total, 1)
    assert.equal(result.list[0].name, '中等')
  })
})

describe('license-package.service.spec: validatePriceModification', () => {
  it('[24] 未使用时可修改价格', () => {
    assert.equal(validatePriceModification(makePackage(), { price: 5000 }, false), null)
  })

  it('[25] 已使用时不能修改价格', () => {
    const err = validatePriceModification(makePackage(), { price: 5000 }, true)
    assert.ok(err?.includes('不能修改价格'))
  })

  it('[26] 已使用不修改价格则 OK', () => {
    assert.equal(validatePriceModification(makePackage(), { name: '改名' }, true), null)
  })
})

describe('license-package.service.spec: checkPackageInUse', () => {
  it('[27] 包在 license 列表中返回 true', () => {
    assert.ok(checkPackageInUse('pkg-1', ['pkg-1', 'pkg-2']))
  })

  it('[28] 包不在列表中返回 false', () => {
    assert.equal(checkPackageInUse('pkg-3', ['pkg-1', 'pkg-2']), false)
  })

  it('[29] 空列表返回 false', () => {
    assert.equal(checkPackageInUse('pkg-1', []), false)
  })
})

describe('license-package.service.spec: makePackage 默认值', () => {
  it('[30] 默认值完整', () => {
    const pkg = makePackage()
    assert.equal(pkg.isActive, true)
    assert.equal(pkg.isDeleted, false)
    assert.equal(pkg.durationUnit, 'month')
    assert.ok(Array.isArray(pkg.features))
    assert.ok(pkg.features!.length >= 2)
  })
})
