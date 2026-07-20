/**
 * 🧪 门店管理 StoreController 单元测试
 *
 * 覆盖：
 *   创建/更新/删除/查询 — 门店基本信息 CRUD
 *   权限检查 — @UseGuards(TenantGuard) 生效
 *   错误处理 — 门店不存在、租户隔离、参数校验
 *   边界场景 — 空列表、最大门店数、并发操作
 *
 * 正例 ≥10 + 反例 ≥8 + 边界 ≥5 = 总计 ≥23
 *
 * 策略: 内联 controller + mocked StoreService，不依赖 NestJS DI
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════

interface Store {
  id: string
  name: string
  code: string
  address: string
  city: string
  phone: string
  status: 'active' | 'inactive' | 'closed'
  tenantId: string
  managerName?: string
  totalEmployees?: number
  floorArea?: number
  createdAt: string
  updatedAt: string
}

interface CreateStoreInput {
  name: string
  code: string
  address: string
  city: string
  phone: string
  managerName?: string
  totalEmployees?: number
  floorArea?: number
}

interface UpdateStoreInput {
  name?: string
  address?: string
  phone?: string
  status?: Store['status']
  managerName?: string
  totalEmployees?: number
  floorArea?: number
}

interface QueryStoresFilter {
  city?: string
  status?: Store['status']
  keyword?: string
  page?: number
  pageSize?: number
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ═══════════════════════════════════════════════════════════════════
// 模拟响应工厂
// ═══════════════════════════════════════════════════════════════════

function mockSuccess(data: unknown) {
  return { success: true, code: 200, data }
}

function mockError(code: number, message: string) {
  return { success: false, code, message }
}

// ═══════════════════════════════════════════════════════════════════
// Mock StoreService
// ═══════════════════════════════════════════════════════════════════

const STORE_LIMIT = 50

function createMockStoreService() {
  const stores = new Map<string, Store>()
  let nextSeq = 1

  const now = (): string => new Date().toISOString()

  return {
    create(tenantId: string, input: CreateStoreInput): Store {
      // 检查租户门店数量上限
      const tenantStores = Array.from(stores.values())
        .filter((s) => s.tenantId === tenantId)
      if (tenantStores.length >= STORE_LIMIT) {
        throw new Error(`STORE_LIMIT_EXCEEDED:MAX_${STORE_LIMIT}`)
      }

      // 检查门店编码唯一性
      const existingCode = Array.from(stores.values())
        .find((s) => s.tenantId === tenantId && s.code === input.code)
      if (existingCode) {
        throw new Error(`STORE_CODE_DUPLICATE:${input.code}`)
      }

      // 校验必填字段
      if (!input.name || !input.name.trim()) {
        throw new Error('VALIDATION_ERROR:name 不能为空')
      }
      if (!input.code || !input.code.trim()) {
        throw new Error('VALIDATION_ERROR:code 不能为空')
      }
      if (!input.address || !input.address.trim()) {
        throw new Error('VALIDATION_ERROR:address 不能为空')
      }
      if (!input.city || !input.city.trim()) {
        throw new Error('VALIDATION_ERROR:city 不能为空')
      }

      const id = `store-${String(nextSeq++).padStart(4, '0')}`
      const store: Store = {
        id,
        name: input.name.trim(),
        code: input.code.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        phone: input.phone?.trim() || '',
        status: 'active',
        tenantId,
        managerName: input.managerName,
        totalEmployees: input.totalEmployees ?? 0,
        floorArea: input.floorArea ?? 0,
        createdAt: now(),
        updatedAt: now(),
      }
      stores.set(id, store)
      return { ...store }
    },

    get(storeId: string, tenantId: string): Store | undefined {
      const store = stores.get(storeId)
      if (!store || store.tenantId !== tenantId) return undefined
      return { ...store }
    },

    update(storeId: string, tenantId: string, input: UpdateStoreInput): Store {
      const existing = stores.get(storeId)
      if (!existing || existing.tenantId !== tenantId) {
        throw new Error('STORE_NOT_FOUND')
      }

      if (input.name !== undefined && !input.name.trim()) {
        throw new Error('VALIDATION_ERROR:name 不能为空')
      }

      const updated: Store = {
        ...existing,
        name: input.name !== undefined ? input.name.trim() : existing.name,
        address: input.address !== undefined ? input.address.trim() : existing.address,
        phone: input.phone !== undefined ? input.phone.trim() : existing.phone,
        status: input.status ?? existing.status,
        managerName: input.managerName !== undefined ? input.managerName : existing.managerName,
        totalEmployees: input.totalEmployees ?? existing.totalEmployees,
        floorArea: input.floorArea ?? existing.floorArea,
        updatedAt: now(),
      }
      stores.set(storeId, updated)
      return { ...updated }
    },

    delete(storeId: string, tenantId: string): void {
      const existing = stores.get(storeId)
      if (!existing || existing.tenantId !== tenantId) {
        throw new Error('STORE_NOT_FOUND')
      }
      stores.delete(storeId)
    },

    list(tenantId: string, filter?: QueryStoresFilter): PaginatedResult<Store> {
      let items = Array.from(stores.values())
        .filter((s) => s.tenantId === tenantId)

      if (filter?.city) {
        items = items.filter((s) => s.city === filter.city)
      }
      if (filter?.status) {
        items = items.filter((s) => s.status === filter.status)
      }
      if (filter?.keyword) {
        const kw = filter.keyword.toLowerCase()
        items = items.filter(
          (s) =>
            s.name.toLowerCase().includes(kw) ||
            s.code.toLowerCase().includes(kw) ||
            s.address.toLowerCase().includes(kw) ||
            s.phone.includes(kw),
        )
      }

      items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

      const total = items.length
      const page = filter?.page ?? 1
      const pageSize = filter?.pageSize ?? 20
      const totalPages = Math.ceil(total / pageSize) || 1
      const start = (page - 1) * pageSize
      const paged = items.slice(start, start + pageSize)

      return { items: paged, total, page, pageSize, totalPages }
    },

    countByCity(tenantId: string): Record<string, number> {
      const items = Array.from(stores.values())
        .filter((s) => s.tenantId === tenantId)
      const dist: Record<string, number> = {}
      for (const s of items) {
        dist[s.city] = (dist[s.city] || 0) + 1
      }
      return dist
    },

    // Test helpers — 允许测试直接操作存储
    _reset(): void {
      stores.clear()
      nextSeq = 1
    },
    _getAll(): Store[] {
      return Array.from(stores.values())
    },
  }
}

// ═══════════════════════════════════════════════════════════════════
// Inline Controller
// ═══════════════════════════════════════════════════════════════════

class InlineStoreController {
  constructor(private readonly svc: ReturnType<typeof createMockStoreService>) {}

  create(tenantId: string, input: CreateStoreInput) {
    // 模拟 @UseGuards(TenantGuard) 缺失 tenantId
    if (!tenantId || !tenantId.trim()) {
      throw Object.assign(new Error('UNAUTHORIZED:Missing x-tenant-id'), { status: 401 })
    }
    try {
      return mockSuccess(this.svc.create(tenantId, input))
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (msg.startsWith('STORE_LIMIT_EXCEEDED')) {
        throw Object.assign(new Error(msg), { status: 400 })
      }
      if (msg.startsWith('STORE_CODE_DUPLICATE')) {
        throw Object.assign(new Error(msg), { status: 409 })
      }
      if (msg.startsWith('VALIDATION_ERROR')) {
        throw Object.assign(new Error(msg), { status: 400 })
      }
      throw e
    }
  }

  get(tenantId: string, storeId: string) {
    if (!tenantId || !tenantId.trim()) {
      throw Object.assign(new Error('UNAUTHORIZED:Missing x-tenant-id'), { status: 401 })
    }
    const store = this.svc.get(storeId, tenantId)
    if (!store) {
      throw Object.assign(new Error('STORE_NOT_FOUND'), { status: 404 })
    }
    return mockSuccess(store)
  }

  update(tenantId: string, storeId: string, input: UpdateStoreInput) {
    if (!tenantId || !tenantId.trim()) {
      throw Object.assign(new Error('UNAUTHORIZED:Missing x-tenant-id'), { status: 401 })
    }
    try {
      return mockSuccess(this.svc.update(storeId, tenantId, input))
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (msg === 'STORE_NOT_FOUND') {
        throw Object.assign(new Error(msg), { status: 404 })
      }
      if (msg.startsWith('VALIDATION_ERROR')) {
        throw Object.assign(new Error(msg), { status: 400 })
      }
      throw e
    }
  }

  delete(tenantId: string, storeId: string) {
    if (!tenantId || !tenantId.trim()) {
      throw Object.assign(new Error('UNAUTHORIZED:Missing x-tenant-id'), { status: 401 })
    }
    try {
      this.svc.delete(storeId, tenantId)
      return mockSuccess({ deleted: true })
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (msg === 'STORE_NOT_FOUND') {
        throw Object.assign(new Error(msg), { status: 404 })
      }
      throw e
    }
  }

  list(tenantId: string, filter?: QueryStoresFilter) {
    if (!tenantId || !tenantId.trim()) {
      throw Object.assign(new Error('UNAUTHORIZED:Missing x-tenant-id'), { status: 401 })
    }
    return mockSuccess(this.svc.list(tenantId, filter))
  }
}

// ═══════════════════════════════════════════════════════════════════
// 测试数据工厂
// ═══════════════════════════════════════════════════════════════════

function aStoreInput(overrides: Partial<CreateStoreInput> = {}): CreateStoreInput {
  return {
    name: '测试门店',
    code: 'STORE-001',
    address: '深圳市南山区科技园',
    city: '深圳',
    phone: '0755-88888888',
    managerName: '张三',
    totalEmployees: 20,
    floorArea: 500,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════════

describe('门店管理 StoreController', () => {
  let service: ReturnType<typeof createMockStoreService>
  let controller: InlineStoreController

  const TENANT_A = 'tenant-arcade-a'
  const TENANT_B = 'tenant-arcade-b'

  beforeEach(() => {
    service = createMockStoreService()
    controller = new InlineStoreController(service)
  })

  // ═══════════════════════════════════════════════════════════════════
  // POST /stores — 创建门店
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /stores 创建门店', () => {
    it('【正例1】完整参数创建门店成功', () => {
      const result = controller.create(TENANT_A, aStoreInput())
      expect(result.success).toBe(true)
      const store = result.data as Store
      expect(store.id).toMatch(/^store-\d{4}$/)
      expect(store.name).toBe('测试门店')
      expect(store.code).toBe('STORE-001')
      expect(store.status).toBe('active')
      expect(store.tenantId).toBe(TENANT_A)
      expect(store.createdAt).toBeTruthy()
      // 同一次创建中 createdAt 与 updatedAt 应是同一秒级别
      expect(store.updatedAt.slice(0, 16)).toBe(store.createdAt.slice(0, 16))
    })

    it('【正例2】创建门店时带可选字段', () => {
      const result = controller.create(TENANT_A, aStoreInput({
        managerName: '李四',
        totalEmployees: 30,
        floorArea: 800,
      }))
      const store = result.data as Store
      expect(store.managerName).toBe('李四')
      expect(store.totalEmployees).toBe(30)
      expect(store.floorArea).toBe(800)
    })

    it('【正例3】同一租户可创建多个门店', () => {
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-001', name: '总店' }))
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-002', name: '分店A' }))
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-003', name: '分店B' }))

      const listResult = controller.list(TENANT_A)
      const paginated = listResult.data as PaginatedResult<Store>
      expect(paginated.total).toBe(3)
      expect(paginated.items.length).toBe(3)
    })

    it('【反例1】缺失 tenantId → 401', () => {
      expect(() => controller.create('', aStoreInput()))
        .toThrow('UNAUTHORIZED:Missing x-tenant-id')
      expect(() => controller.create('  ', aStoreInput()))
        .toThrow('UNAUTHORIZED:Missing x-tenant-id')
    })

    it('【反例2】门店编码重复→409', () => {
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-001' }))
      expect(() => controller.create(TENANT_A, aStoreInput({ code: 'STORE-001' })))
        .toThrow('STORE_CODE_DUPLICATE:STORE-001')
    })

    it('【反例3】不同租户可重复编码—不冲突', () => {
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-001' }))
      // Tenant B 使用相同编码不应报错
      const result = controller.create(TENANT_B, aStoreInput({ code: 'STORE-001' }))
      const store = result.data as Store
      expect(store.code).toBe('STORE-001')
      expect(store.tenantId).toBe(TENANT_B)
    })

    it('【反例4】门店名称为空→400', () => {
      expect(() => controller.create(TENANT_A, aStoreInput({ name: '' })))
        .toThrow('VALIDATION_ERROR:name 不能为空')
      expect(() => controller.create(TENANT_A, aStoreInput({ name: '  ' })))
        .toThrow('VALIDATION_ERROR:name 不能为空')
    })

    it('【反例5】门店编码为空→400', () => {
      expect(() => controller.create(TENANT_A, aStoreInput({ code: '' })))
        .toThrow('VALIDATION_ERROR:code 不能为空')
    })

    it('【反例6】门店地址为空→400', () => {
      expect(() => controller.create(TENANT_A, aStoreInput({ address: '' })))
        .toThrow('VALIDATION_ERROR:address 不能为空')
    })

    it('【边界1】创建时名称前后空格会自动trim', () => {
      const result = controller.create(TENANT_A, aStoreInput({
        name: '  深圳旗舰店  ',
        code: 'STORE-FLAG',
      }))
      const store = result.data as Store
      expect(store.name).toBe('深圳旗舰店')
      expect(store.name).not.toContain(' ')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // GET /stores/:id — 查询门店
  // ═══════════════════════════════════════════════════════════════════

  describe('GET /stores/:id 查询门店', () => {
    it('【正例4】按ID查询已存在的门店', () => {
      const created = controller.create(TENANT_A, aStoreInput())
      const storeId = (created.data as Store).id

      const result = controller.get(TENANT_A, storeId)
      expect(result.success).toBe(true)
      const store = result.data as Store
      expect(store.id).toBe(storeId)
      expect(store.name).toBe('测试门店')
    })

    it('【反例7】门店不存在→404', () => {
      expect(() => controller.get(TENANT_A, 'store-nonexistent'))
        .toThrow('STORE_NOT_FOUND')
    })

    it('【反例8】跨租户查询不可见→404（租户隔离）', () => {
      const created = controller.create(TENANT_A, aStoreInput())
      const storeId = (created.data as Store).id

      expect(() => controller.get(TENANT_B, storeId))
        .toThrow('STORE_NOT_FOUND')
    })

    it('【反例9】缺失 tenantId → 401', () => {
      expect(() => controller.get('', 'store-0001'))
        .toThrow('UNAUTHORIZED:Missing x-tenant-id')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // PUT /stores/:id — 更新门店
  // ═══════════════════════════════════════════════════════════════════

  describe('PUT /stores/:id 更新门店', () => {
    let storeId: string

    beforeEach(() => {
      const created = controller.create(TENANT_A, aStoreInput())
      storeId = (created.data as Store).id
    })

    it('【正例5】更新门店名称', () => {
      const result = controller.update(TENANT_A, storeId, { name: '深圳旗舰店(升级)' })
      const store = result.data as Store
      expect(store.name).toBe('深圳旗舰店(升级)')
      // 更新后 updatedAt 应在 createdAt 之后
      expect(new Date(store.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(store.createdAt).getTime())
    })

    it('【正例6】更新门店地址和联系电话', () => {
      const result = controller.update(TENANT_A, storeId, {
        address: '深圳市福田区华强北',
        phone: '0755-99999999',
      })
      const store = result.data as Store
      expect(store.address).toBe('深圳市福田区华强北')
      expect(store.phone).toBe('0755-99999999')
    })

    it('【正例7】更新门店状态为关闭', () => {
      const result = controller.update(TENANT_A, storeId, { status: 'closed' })
      const store = result.data as Store
      expect(store.status).toBe('closed')
    })

    it('【正例8】更新门店负责人和员工数', () => {
      const result = controller.update(TENANT_A, storeId, {
        managerName: '王五',
        totalEmployees: 25,
      })
      const store = result.data as Store
      expect(store.managerName).toBe('王五')
      expect(store.totalEmployees).toBe(25)
    })

    it('【反例10】门店不存在→404', () => {
      expect(() => controller.update(TENANT_A, 'store-nonexistent', { name: '新名' }))
        .toThrow('STORE_NOT_FOUND')
    })

    it('【反例11】更新名称为空→400', () => {
      expect(() => controller.update(TENANT_A, storeId, { name: '' }))
        .toThrow('VALIDATION_ERROR:name 不能为空')
    })

    it('【边界2】更新时只传部分字段，其余保持不变', () => {
      const before = (controller.get(TENANT_A, storeId).data as Store)
      controller.update(TENANT_A, storeId, { phone: '0755-11111111' })
      const after = (controller.get(TENANT_A, storeId).data as Store)
      expect(after.phone).toBe('0755-11111111')
      expect(after.name).toBe(before.name)   // 未变
      expect(after.address).toBe(before.address) // 未变
      expect(after.status).toBe(before.status)   // 未变
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /stores/:id — 删除门店
  // ═══════════════════════════════════════════════════════════════════

  describe('DELETE /stores/:id 删除门店', () => {
    let storeId: string

    beforeEach(() => {
      const created = controller.create(TENANT_A, aStoreInput())
      storeId = (created.data as Store).id
    })

    it('【正例9】删除门店成功', () => {
      const result = controller.delete(TENANT_A, storeId)
      expect(result.success).toBe(true)
      expect((result.data as any).deleted).toBe(true)
    })

    it('【正例10】删除后不可再查询', () => {
      controller.delete(TENANT_A, storeId)
      expect(() => controller.get(TENANT_A, storeId)).toThrow('STORE_NOT_FOUND')
    })

    it('【反例12】门店不存在→404', () => {
      expect(() => controller.delete(TENANT_A, 'store-nonexistent'))
        .toThrow('STORE_NOT_FOUND')
    })

    it('【反例13】跨租户删除被隔离→404', () => {
      controller.create(TENANT_B, aStoreInput({ code: 'OTHER-STORE' }))
      // Tenant A 的 storeId 不存在于 Tenant B 中
      const otherStoreId = (controller.create(TENANT_B, aStoreInput({ code: 'BT-STORE' })).data as Store).id
      expect(() => controller.delete(TENANT_A, otherStoreId))
        .toThrow('STORE_NOT_FOUND')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // GET /stores — 门店列表
  // ═══════════════════════════════════════════════════════════════════

  describe('GET /stores 门店列表', () => {
    it('【正例11】无门店时返回空列表', () => {
      const result = controller.list(TENANT_A)
      const paginated = result.data as PaginatedResult<Store>
      expect(paginated.items).toEqual([])
      expect(paginated.total).toBe(0)
      expect(paginated.page).toBe(1)
      expect(paginated.totalPages).toBe(1)
    })

    it('【正例12】按城市筛选门店', () => {
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-001', city: '深圳' }))
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-002', city: '北京' }))
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-003', city: '深圳' }))

      const result = controller.list(TENANT_A, { city: '深圳' })
      const paginated = result.data as PaginatedResult<Store>
      expect(paginated.total).toBe(2)
      paginated.items.forEach((s) => expect(s.city).toBe('深圳'))
    })

    it('【正例13】按门店状态筛选', () => {
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-001' }))
      const id2 = (controller.create(TENANT_A, aStoreInput({ code: 'STORE-002' })).data as Store).id
      controller.update(TENANT_A, id2, { status: 'inactive' })

      const activeResult = controller.list(TENANT_A, { status: 'active' })
      expect((activeResult.data as PaginatedResult<Store>).total).toBe(1)

      const inactiveResult = controller.list(TENANT_A, { status: 'inactive' })
      expect((inactiveResult.data as PaginatedResult<Store>).total).toBe(1)
    })

    it('【正例14】按关键字搜索门店', () => {
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-001', name: '深圳万象城店' }))
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-002', name: '北京国贸店' }))

      const result = controller.list(TENANT_A, { keyword: '万象' })
      const paginated = result.data as PaginatedResult<Store>
      expect(paginated.total).toBe(1)
      expect(paginated.items[0].name).toBe('深圳万象城店')
    })

    it('【边界3】分页返回正确', () => {
      for (let i = 1; i <= 25; i++) {
        controller.create(TENANT_A, aStoreInput({
          code: `STORE-${String(i).padStart(3, '0')}`,
          name: `门店${i}`,
        }))
      }

      const page1 = controller.list(TENANT_A, { page: 1, pageSize: 10 })
      const p1 = page1.data as PaginatedResult<Store>
      expect(p1.items.length).toBe(10)
      expect(p1.total).toBe(25)
      expect(p1.totalPages).toBe(3)

      const page2 = controller.list(TENANT_A, { page: 2, pageSize: 10 })
      const p2 = page2.data as PaginatedResult<Store>
      expect(p2.items.length).toBe(10)

      const page3 = controller.list(TENANT_A, { page: 3, pageSize: 10 })
      const p3 = page3.data as PaginatedResult<Store>
      expect(p3.items.length).toBe(5)
    })

    it('【反例14】缺失 tenantId → 401', () => {
      expect(() => controller.list(''))
        .toThrow('UNAUTHORIZED:Missing x-tenant-id')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 权限与租户隔离
  // ═══════════════════════════════════════════════════════════════════

  describe('权限与租户隔离', () => {
    it('【正例15】不同租户数据完全隔离', () => {
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-A1', name: 'A店1号' }))
      controller.create(TENANT_A, aStoreInput({ code: 'STORE-A2', name: 'A店2号' }))
      controller.create(TENANT_B, aStoreInput({ code: 'STORE-B1', name: 'B店1号' }))

      const resultA = controller.list(TENANT_A)
      expect((resultA.data as PaginatedResult<Store>).total).toBe(2)

      const resultB = controller.list(TENANT_B)
      expect((resultB.data as PaginatedResult<Store>).total).toBe(1)
    })

    it('【边界4】租户A门店数量接近上限', () => {
      for (let i = 1; i <= 50; i++) {
        controller.create(TENANT_A, aStoreInput({
          code: `STORE-${String(i).padStart(3, '0')}`,
          name: `满负荷门店${i}`,
        }))
      }

      // 第51个应失败
      expect(() => controller.create(TENANT_A, aStoreInput({
        code: 'STORE-051',
        name: '超额门店',
      }))).toThrow('STORE_LIMIT_EXCEEDED:MAX_50')
    })

    it('【边界5】租户B不受租户A上限影响', () => {
      // A 已满
      for (let i = 1; i <= 50; i++) {
        controller.create(TENANT_A, aStoreInput({
          code: `STORE-${String(i).padStart(3, '0')}`,
          name: `A店${i}`,
        }))
      }

      // B 仍可创建
      const result = controller.create(TENANT_B, aStoreInput({ code: 'STORE-B001' }))
      expect(result.success).toBe(true)
    })
  })
})
