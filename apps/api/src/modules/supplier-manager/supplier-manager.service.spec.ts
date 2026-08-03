/**
 * supplier-manager.service.spec.ts — 供应商管理模块 Service 单元测试
 *
 * 覆盖: CRUD / 多条件筛选 / 搜索 / 删除 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SupplierManagerService } from './supplier-manager.service'
import { SupplierStatus, SupplierRating } from './supplier-manager.entity'

describe('SupplierManagerService — CRUD', () => {
  let svc: SupplierManagerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new SupplierManagerService()
    svc.resetSupplierStoresForTests()
  })

  it('createSupplier 创建成功', () => {
    const sup = svc.createSupplier({
      tenantId,
      name: '测试供应商',
      code: 'SUP-TEST-001',
      contactPerson: '张三',
      phone: '13800138000',
      email: 'test@supplier.com',
      address: '测试地址',
      status: SupplierStatus.Active,
      rating: SupplierRating.A,
      category: '测试品类',
    })
    expect(sup.id).toMatch(/^supplier-/)
    expect(sup.name).toBe('测试供应商')
    expect(sup.status).toBe(SupplierStatus.Active)
    expect(sup.rating).toBe(SupplierRating.A)
  })

  it('createSupplier 使用默认值', () => {
    const sup = svc.createSupplier({
      tenantId, name: '默认供应商', code: 'SUP-DEF',
      contactPerson: '李四', phone: '139', email: 'a@b.com',
      address: '某地', category: '通用',
    })
    expect(sup.status).toBe(SupplierStatus.Active)
    expect(sup.rating).toBe(SupplierRating.B)
  })

  it('getSupplier 返回正确的供应商', () => {
    const created = svc.createSupplier({
      tenantId, name: '查询供应商', code: 'SUP-GET', contactPerson: 'A',
      phone: '138', email: 'a@b.com', address: 'addr', category: 'cat',
    })
    const found = svc.getSupplier(created.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.name).toBe('查询供应商')
  })

  it('getSupplier 返回 undefined 当供应商不存在或 tenant 不匹配', () => {
    expect(svc.getSupplier('fake-id', tenantId)).toBeUndefined()
  })

  it('updateSupplier 更新所有字段', () => {
    const sup = svc.createSupplier({
      tenantId, name: '旧名', code: 'SUP-UPD', contactPerson: 'A',
      phone: '138', email: 'a@b.com', address: 'addr', category: 'cat',
    })
    const updated = svc.updateSupplier(sup.id, tenantId, {
      name: '新名',
      contactPerson: '新联系人',
      phone: '139000',
      status: SupplierStatus.Inactive,
      rating: SupplierRating.C,
      category: '新品类',
      remark: '测试备注',
    })
    expect(updated.name).toBe('新名')
    expect(updated.contactPerson).toBe('新联系人')
    expect(updated.status).toBe(SupplierStatus.Inactive)
    expect(updated.rating).toBe(SupplierRating.C)
    expect(updated.remark).toBe('测试备注')
  })

  it('deleteSupplier 删除成功', () => {
    const sup = svc.createSupplier({
      tenantId, name: '待删除', code: 'SUP-DEL', contactPerson: 'A',
      phone: '138', email: 'a@b.com', address: 'addr', category: 'cat',
    })
    svc.deleteSupplier(sup.id, tenantId)
    expect(svc.getSupplier(sup.id, tenantId)).toBeUndefined()
  })

  it('deleteSupplier 不存在的供应商抛 Error', () => {
    expect(() => svc.deleteSupplier('fake', tenantId)).toThrow(/not found/)
  })
})

describe('SupplierManagerService — 列表与筛选', () => {
  let svc: SupplierManagerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new SupplierManagerService()
    svc.resetSupplierStoresForTests()
  })

  it('listSuppliers 返回所有供应商（种子数据）', () => {
    const all = svc.listSuppliers(tenantId)
    expect(all.length).toBeGreaterThan(0)
  })

  it('listSuppliers 按状态筛选', () => {
    const active = svc.listSuppliers(tenantId, { status: SupplierStatus.Active })
    active.forEach((s) => expect(s.status).toBe(SupplierStatus.Active))
  })

  it('listSuppliers 按评级筛选', () => {
    const aGrade = svc.listSuppliers(tenantId, { rating: SupplierRating.A })
    aGrade.forEach((s) => expect(s.rating).toBe(SupplierRating.A))
  })

  it('listSuppliers 按品类筛选', () => {
    const items = svc.listSuppliers(tenantId, { category: '电子元器件' })
    items.forEach((s) => expect(s.category).toBe('电子元器件'))
  })

  it('listSuppliers 按搜索关键字', () => {
    const items = svc.listSuppliers(tenantId, { search: '华强' })
    expect(items.length).toBeGreaterThan(0)
    items.forEach((s) => {
      const q = '华强'
      const match = s.name.includes(q) || s.code.includes(q) || s.contactPerson.includes(q) || s.phone.includes(q)
      expect(match).toBeTruthy()
    })
  })

  it('listSuppliers 按名称排序', () => {
    const items = svc.listSuppliers(tenantId)
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].name.localeCompare(items[i].name)).toBeLessThanOrEqual(0)
    }
  })

  it('listSuppliers 多条件组合', () => {
    const items = svc.listSuppliers(tenantId, {
      status: SupplierStatus.Active,
      rating: SupplierRating.A,
      category: '电子元器件',
    })
    items.forEach((s) => {
      expect(s.status).toBe(SupplierStatus.Active)
      expect(s.rating).toBe(SupplierRating.A)
      expect(s.category).toBe('电子元器件')
    })
  })
})
