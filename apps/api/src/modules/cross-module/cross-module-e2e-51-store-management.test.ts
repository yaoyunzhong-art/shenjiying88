import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

/**
 * cross-module-e2e-51-store-management.test.ts
 *
 * 门店管理全链路 E2E 测试
 * 场景: 门店创建 → 列表查询 → 详情验证 → 更新修改 → 删除验证
 */
describe('E2E-51: 门店管理全链', () => {
  // ── 门店状态常量 ──
  const STORE_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    CLOSED: 'closed',
  } as const

  // ── 门店数据模型 ──
  interface Store {
    id: string
    name: string
    address: string
    phone: string
    status: string
    managerId: string
    areaCode: string
    openingTime: string
    closingTime: string
    createdAt: string
    updatedAt: string | null
  }

  // ── 门店模拟存储 ──
  const storeDb: Map<string, Store> = new Map()

  // ── 模拟服务函数 ──
  function createStore(data: Omit<Store, 'createdAt' | 'updatedAt'>): Store {
    const existing = Array.from(storeDb.values()).find(s => s.name === data.name)
    if (existing) {
      throw new Error('STORE_NAME_DUPLICATE')
    }
    const store: Store = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    }
    storeDb.set(store.id, store)
    return store
  }

  function getStoreById(id: string): Store | undefined {
    return storeDb.get(id)
  }

  function listStores(filter?: { status?: string; areaCode?: string }): Store[] {
    let stores = Array.from(storeDb.values())
    if (filter?.status) {
      stores = stores.filter(s => s.status === filter.status)
    }
    if (filter?.areaCode) {
      stores = stores.filter(s => s.areaCode === filter.areaCode)
    }
    return stores
  }

  function updateStore(id: string, updates: Partial<Omit<Store, 'id' | 'createdAt'>>): Store {
    const store = storeDb.get(id)
    if (!store) {
      throw new Error('STORE_NOT_FOUND')
    }
    const updated: Store = {
      ...store,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    storeDb.set(id, updated)
    return updated
  }

  function deleteStore(id: string): boolean {
    const store = storeDb.get(id)
    if (!store) {
      throw new Error('STORE_NOT_FOUND')
    }
    if (store.status === 'active') {
      throw new Error('ACTIVE_STORE_CANNOT_DELETE')
    }
    return storeDb.delete(id)
  }

  // ── 测试前置：创建测试门店 ──
  const testStore: Omit<Store, 'createdAt' | 'updatedAt'> = {
    id: 'store-e2e-51-001',
    name: '测试门店-A',
    address: '广州市天河区测试路1号',
    phone: '020-88886666',
    status: STORE_STATUS.ACTIVE,
    managerId: 'mgr-001',
    areaCode: 'GZ-TH',
    openingTime: '09:00',
    closingTime: '22:00',
  }

  before(() => {
    // 清理测试数据
    storeDb.clear()
  })

  after(() => {
    storeDb.clear()
  })

  // ═══════════════════════════════════════════════════════════════
  // 门店创建
  // ═══════════════════════════════════════════════════════════════

  it('正例: 创建门店返回完整门店信息且状态为 active', () => {
    const store = createStore(testStore)

    assert.equal(store.id, 'store-e2e-51-001')
    assert.equal(store.name, '测试门店-A')
    assert.equal(store.address, '广州市天河区测试路1号')
    assert.equal(store.phone, '020-88886666')
    assert.equal(store.status, STORE_STATUS.ACTIVE)
    assert.equal(store.managerId, 'mgr-001')
    assert.equal(store.areaCode, 'GZ-TH')
    assert.equal(store.openingTime, '09:00')
    assert.equal(store.closingTime, '22:00')
    assert.ok(store.createdAt, '门店应有创建时间')
    assert.equal(store.updatedAt, null, '创建时无更新记录')
  })

  it('正例: 批量创建多个门店均可单独查询', () => {
    const storeB = createStore({
      id: 'store-e2e-51-002',
      name: '测试门店-B',
      address: '广州市越秀区测试路2号',
      phone: '020-88886667',
      status: STORE_STATUS.ACTIVE,
      managerId: 'mgr-002',
      areaCode: 'GZ-YX',
      openingTime: '10:00',
      closingTime: '23:00',
    })
    const storeC = createStore({
      id: 'store-e2e-51-003',
      name: '测试门店-C',
      address: '深圳市南山区测试路3号',
      phone: '0755-88886668',
      status: STORE_STATUS.INACTIVE,
      managerId: 'mgr-003',
      areaCode: 'SZ-NS',
      openingTime: '09:30',
      closingTime: '21:30',
    })

    assert.equal(storeB.name, '测试门店-B')
    assert.equal(storeC.name, '测试门店-C')
    assert.equal(storeB.areaCode, 'GZ-YX')
    assert.equal(storeC.areaCode, 'SZ-NS')
    assert.equal(storeC.status, STORE_STATUS.INACTIVE)
  })

  it('反例: 创建名称已存在的门店抛出重复异常', () => {
    assert.throws(
      () => {
        createStore({
          id: 'store-e2e-51-004',
          name: '测试门店-A',
          address: '广州市天河区重复路',
          phone: '020-00000000',
          status: STORE_STATUS.ACTIVE,
          managerId: 'mgr-001',
          areaCode: 'GZ-TH',
          openingTime: '09:00',
          closingTime: '22:00',
        })
      },
      { message: 'STORE_NAME_DUPLICATE' },
    )
  })

  // ═══════════════════════════════════════════════════════════════
  // 门店列表查询
  // ═══════════════════════════════════════════════════════════════

  it('正例: 列表查询返回全部门店', () => {
    const stores = listStores()

    assert.equal(stores.length, 3)
    assert.ok(stores.every(s => typeof s.id === 'string'))
    assert.ok(stores.every(s => typeof s.name === 'string'))
  })

  it('正例: 按状态筛选仅返回匹配门店', () => {
    const activeStores = listStores({ status: STORE_STATUS.ACTIVE })
    const inactiveStores = listStores({ status: STORE_STATUS.INACTIVE })

    assert.equal(activeStores.length, 2)
    assert.ok(activeStores.every(s => s.status === STORE_STATUS.ACTIVE))
    assert.equal(inactiveStores.length, 1)
    assert.ok(inactiveStores.every(s => s.status === STORE_STATUS.INACTIVE))
  })

  it('正例: 按区域编码筛选仅返回匹配门店', () => {
    const gzStores = listStores({ areaCode: 'GZ-TH' })
    const szStores = listStores({ areaCode: 'SZ-NS' })

    assert.equal(gzStores.length, 1)
    assert.ok(gzStores.every(s => s.areaCode === 'GZ-TH'))
    assert.equal(szStores.length, 1)
    assert.ok(szStores.every(s => s.areaCode === 'SZ-NS'))
  })

  it('反例: 按不存在的状态筛选返回空列表', () => {
    const closedStores = listStores({ status: STORE_STATUS.CLOSED })

    assert.equal(closedStores.length, 0)
    assert.deepEqual(closedStores, [])
  })

  it('边界: 列表查询同时使用状态和区域筛选', () => {
    // GZ 区域内在业门店
    const gzActive = listStores({ status: STORE_STATUS.ACTIVE, areaCode: 'GZ-TH' })

    assert.equal(gzActive.length, 1)
    assert.equal(gzActive[0].name, '测试门店-A')
  })

  // ═══════════════════════════════════════════════════════════════
  // 门店详情查询
  // ═══════════════════════════════════════════════════════════════

  it('正例: 通过 ID 查询门店详情返回完整数据', () => {
    const store = getStoreById('store-e2e-51-001')

    assert.ok(store !== undefined)
    assert.equal(store.id, 'store-e2e-51-001')
    assert.equal(store.name, '测试门店-A')
    assert.equal(store.phone, '020-88886666')
  })

  it('反例: 查询不存在的门店 ID 返回 undefined', () => {
    const store = getStoreById('store-e2e-51-nonexistent')

    assert.equal(store, undefined)
  })

  // ═══════════════════════════════════════════════════════════════
  // 门店更新
  // ═══════════════════════════════════════════════════════════════

  it('正例: 更新门店名称后返回新名称和更新时间', () => {
    const updated = updateStore('store-e2e-51-001', { name: '测试门店-A（升级版）' })

    assert.equal(updated.name, '测试门店-A（升级版）')
    assert.ok(updated.updatedAt !== null, '更新后应有更新时间')
    assert.ok(new Date(updated.updatedAt).getTime() <= Date.now(), '更新时间有效')
  })

  it('正例: 更新门店状态为 inactive 后查询返回正确状态', () => {
    const updated = updateStore('store-e2e-51-002', { status: STORE_STATUS.INACTIVE })

    assert.equal(updated.status, STORE_STATUS.INACTIVE)
    assert.ok(updated.updatedAt !== null)

    // 验证持久化
    const fetched = getStoreById('store-e2e-51-002')
    assert.equal(fetched.status, STORE_STATUS.INACTIVE)
  })

  it('正例: 更新门店地址和电话同时生效', () => {
    const updated = updateStore('store-e2e-51-003', {
      address: '深圳市南山区科技园路88号',
      phone: '0755-99999999',
    })

    assert.equal(updated.address, '深圳市南山区科技园路88号')
    assert.equal(updated.phone, '0755-99999999')
  })

  it('正例: 更新门店营业时间', () => {
    const updated = updateStore('store-e2e-51-001', {
      openingTime: '08:00',
      closingTime: '23:59',
    })

    assert.equal(updated.openingTime, '08:00')
    assert.equal(updated.closingTime, '23:59')
  })

  it('反例: 更新不存在的门店抛出未找到异常', () => {
    assert.throws(
      () => updateStore('store-e2e-51-nonexistent', { name: '不存在' }),
      { message: 'STORE_NOT_FOUND' },
    )
  })

  it('边界: 更新门店信息不修改 ID 和创建时间', () => {
    const original = getStoreById('store-e2e-51-001')
    const updated = updateStore('store-e2e-51-001', { name: '边界测试门店' })

    assert.equal(updated.id, original.id, 'ID 不变')
    assert.equal(updated.createdAt, original.createdAt, '创建时间不变')
  })

  it('边界: 门店信息空字段更新（保留原有值）', () => {
    // 模拟部分更新：只传需要修改的字段，原始字段不变
    const original = getStoreById('store-e2e-51-001')
    const updated = updateStore('store-e2e-51-001', { phone: '020-00001111' })

    // 未更新的字段保持不变
    assert.equal(updated.name, original.name, '名称不变')
    assert.equal(updated.address, original.address, '地址不变')
    assert.equal(updated.phone, '020-00001111', '电话已更新')
  })

  // ═══════════════════════════════════════════════════════════════
  // 门店删除
  // ═══════════════════════════════════════════════════════════════

  it('正例: 先停用门店再删除成功', () => {
    // 先将门店 C 设为 inactive 再删除
    updateStore('store-e2e-51-003', { status: STORE_STATUS.INACTIVE })
    const deleted = deleteStore('store-e2e-51-003')

    assert.equal(deleted, true)
    const afterDelete = getStoreById('store-e2e-51-003')
    assert.equal(afterDelete, undefined, '删除后不可查询')
  })

  it('正例: 删除后列表数量减少', () => {
    const beforeCount = listStores().length

    updateStore('store-e2e-51-002', { status: STORE_STATUS.INACTIVE })
    deleteStore('store-e2e-51-002')

    const afterCount = listStores().length
    assert.equal(afterCount, beforeCount - 1)
  })

  it('反例: 营业中门店不允许删除', () => {
    // 门店-A 仍是 active
    assert.throws(
      () => deleteStore('store-e2e-51-001'),
      { message: 'ACTIVE_STORE_CANNOT_DELETE' },
    )
    // 删除失败后门店依然存在
    const store = getStoreById('store-e2e-51-001')
    assert.ok(store !== undefined, '门店应仍然存在')
  })

  it('反例: 删除不存在的门店抛出未找到异常', () => {
    assert.throws(
      () => deleteStore('store-e2e-51-nonexistent'),
      { message: 'STORE_NOT_FOUND' },
    )
  })

  it('边界: 已删除门店不可再次删除', () => {
    // 门店-C 已在上方删除
    assert.throws(
      () => deleteStore('store-e2e-51-003'),
      { message: 'STORE_NOT_FOUND' },
    )
  })
})
