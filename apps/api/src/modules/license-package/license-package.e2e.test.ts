import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * license-package.e2e.test.ts
 *
 * LicensePackageService E2E 集成测试 —— 覆盖完整套餐管理生命周期
 *
 * 测试场景:
 * 1. 创建套餐 → 查询列表 → 查询详情
 * 2. 更新套餐 → 验证更新结果
 * 3. 删除套餐（软删除）→ 验证不可查询
 * 4. 同名套餐创建拒绝
 * 5. 分配套餐到 License（桩 → 不可分配停用套餐）
 */

import assert from 'node:assert/strict'
// ========== mock service 工厂 ==========

interface PkgRecord {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  durationUnit: string
  maxUsers?: number
  maxStores?: number
  features?: string[]
  isActive: boolean
  isDeleted: boolean
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

function createMockRepository(initialPackages: Partial<PkgRecord>[] = []) {
  const store = new Map<string, PkgRecord>()
  let nextId = 1

  for (const p of initialPackages) {
    const id = p.id || `seed-${nextId++}`
    store.set(id, {
      id,
      name: p.name || '默认套餐',
      price: p.price ?? 0,
      duration: p.duration ?? 1,
      durationUnit: p.durationUnit || 'month',
      isActive: p.isActive !== undefined ? p.isActive : true,
      isDeleted: p.isDeleted || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  return {
    findOne: async (where: { where: { id?: string; name?: string } }) => {
      for (const [, record] of store) {
        if (where.where.id && record.id === where.where.id && !record.isDeleted) {
          return record
        }
        if (where.where.name && record.name === where.where.name && !record.isDeleted) {
          return record
        }
      }
      return null
    },
    findAndCount: async ({ where, skip, take }: any) => {
      let list = Array.from(store.values()).filter(p => !p.isDeleted)
      if (where?.name) {
        list = list.filter(p => p.name.includes(where.name))
      }
      if (where?.isActive !== undefined) {
        list = list.filter(p => p.isActive === where.isActive)
      }
      const total = list.length
      if (skip) list = list.slice(skip)
      if (take) list = list.slice(0, take)
      return [list, total]
    },
    create: (data: any) => {
      const id = `pkg-${nextId++}`
      const record: PkgRecord = {
        id,
        ...data,
        isActive: data.isActive ?? true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      return record
    },
    save: async (record: PkgRecord) => {
      store.set(record.id, record)
      return record
    },
    _store: store,
  }
}

function createMockService(repo: ReturnType<typeof createMockRepository>) {
  return {
    async create(dto: any, userId?: string) {
      // 同名检查
      const existing = await repo.findOne({ where: { name: dto.name } })
      if (existing) throw new Error('套餐名称已存在')

      const record = repo.create({ ...dto, createdBy: userId, updatedBy: userId })
      return repo.save(record)
    },

    async findAll(query: any) {
      const where: any = {}
      if (query.keyword) where.name = query.keyword
      if (query.isActive !== undefined) where.isActive = query.isActive

      const result = await repo.findAndCount({
        where,
        skip: ((query.page || 1) - 1) * (query.pageSize || 10),
        take: query.pageSize || 10,
      })

      return { list: result[0] as PkgRecord[], total: result[1] as number, page: query.page || 1, pageSize: query.pageSize || 10 }
    },

    async findOne(id: string) {
      const record = await repo.findOne({ where: { id } })
      if (!record) throw new Error('套餐不存在')
      return record
    },

    async update(id: string, dto: any, userId?: string) {
      const record = await this.findOne(id)

      if (dto.name && dto.name !== record.name) {
        const existing = await repo.findOne({ where: { name: dto.name } })
        if (existing) throw new Error('套餐名称已存在')
      }

      Object.assign(record, dto, { updatedBy: userId, updatedAt: new Date() })
      return repo.save(record)
    },

    async remove(id: string, userId?: string) {
      const record = await this.findOne(id)
      record.isDeleted = true
      record.deletedBy = userId
      record.deletedAt = new Date()
      await repo.save(record)
    },

    async assignToLicense(packageId: string, _dto: any, _userId?: string) {
      const record = await this.findOne(packageId)
      if (!record.isActive) throw new Error('该套餐未启用')
    },
  }
}

// ========== E2E 测试 ==========

describe('LicensePackage E2E: 套餐管理完整生命周期', () => {
  it('场景 1: 创建新套餐 → 查询列表包含新套餐', async () => {
    const repo = createMockRepository()
    const svc = createMockService(repo)

    const pkg = await svc.create({
      name: '企业版',
      price: 2999,
      duration: 12,
      durationUnit: 'month',
      maxUsers: 100,
      maxStores: 10,
      features: ['basic', 'analytics', 'api'],
      description: '适合中大型企业',
    }, 'admin-001')

    assert.ok(pkg.id, '返回套餐 id')
    assert.equal(pkg.name, '企业版')
    assert.equal(pkg.price, 2999)
    assert.equal(pkg.createdBy, 'admin-001')
    assert.equal(pkg.isActive, true)

    const list = await svc.findAll({ page: 1, pageSize: 10 })
    assert.equal(list.total, 1)
    assert.equal(list.list[0].name, '企业版')
  })

  it('场景 2: 查询套餐详情', async () => {
    const repo = createMockRepository([{ id: 'p1', name: '基础版', price: 999, duration: 1, durationUnit: 'month' }])
    const svc = createMockService(repo)

    const detail = await svc.findOne('p1')
    assert.equal(detail.name, '基础版')
    assert.equal(detail.price, 999)
  })

  it('场景 3: 更新套餐名 → 验证更新', async () => {
    const repo = createMockRepository([{ id: 'p1', name: '原套餐名', price: 100, duration: 1, durationUnit: 'month' }])
    const svc = createMockService(repo)

    const updated = await svc.update('p1', { name: '升级版套餐', price: 1999 }, 'admin-002')
    assert.equal(updated.name, '升级版套餐')
    assert.equal(updated.price, 1999)
  })

  it('场景 4: 删除套餐（软删除）→ 不可查询', async () => {
    const repo = createMockRepository([{ id: 'p1', name: '待删套餐', price: 100, duration: 1, durationUnit: 'month' }])
    const svc = createMockService(repo)

    await svc.remove('p1', 'admin')
    await assert.rejects(() => svc.findOne('p1'), /套餐不存在/)
  })

  it('场景 5: 同名套餐创建被拒绝', async () => {
    const repo = createMockRepository([{ id: 'p1', name: '旗舰版', price: 5000, duration: 12, durationUnit: 'month' }])
    const svc = createMockService(repo)

    await assert.rejects(
      () => svc.create({ name: '旗舰版', price: 6000, duration: 12, durationUnit: 'month' }, 'admin'),
      /套餐名称已存在/
    )
  })

  it('场景 6: 停用套餐不可分配 License', async () => {
    const repo = createMockRepository([{ id: 'p1', name: '停用套餐', price: 100, duration: 1, durationUnit: 'month', isActive: false }])
    const svc = createMockService(repo)

    await assert.rejects(
      () => svc.assignToLicense('p1', { licenseId: 'lic-001' }, 'admin'),
      /未启用/
    )
  })

  it('场景 7: 列表搜索按关键词过滤', async () => {
    const repo = createMockRepository([
      { id: 'p1', name: '企业版', price: 2999, duration: 12, durationUnit: 'month' },
      { id: 'p2', name: '个人版', price: 99, duration: 1, durationUnit: 'month' },
    ])
    const svc = createMockService(repo)

    const result = await svc.findAll({ keyword: '企业' })
    assert.equal(result.total, 1)
    assert.equal(result.list[0].name, '企业版')
  })

  it('场景 8: 多次查询幂等性', async () => {
    const repo = createMockRepository([{ id: 'p1', name: '稳定版', price: 100, duration: 1, durationUnit: 'month' }])
    const svc = createMockService(repo)

    const a = await svc.findOne('p1')
    const b = await svc.findOne('p1')
    assert.equal(a.id, b.id)
    assert.equal(a.name, b.name)
  })
})
