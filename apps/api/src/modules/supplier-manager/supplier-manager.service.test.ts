import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [supplier-manager] [D] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SupplierManagerService } from './supplier-manager.service'
import {
  SupplierStatus,
  SupplierRating,
  type Supplier,
} from './supplier-manager.entity'

describe('SupplierManagerService', () => {
  let service: SupplierManagerService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new SupplierManagerService()
  })

  afterEach(() => {
    service.resetSupplierStoresForTests()
  })

  function createTestSupplier(overrides?: Partial<Parameters<SupplierManagerService['createSupplier']>[0]>): Supplier {
    return service.createSupplier({
      tenantId: TENANT,
      name: 'Test Supplier',
      code: 'SUP-TEST',
      contactPerson: '张三',
      phone: '13800138000',
      email: 'test@supplier.com',
      address: '测试地址',
      category: '测试分类',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createSupplier', () => {
    it('should create a supplier with ACTIVE status by default', () => {
      const s = createTestSupplier()

      assert.equal(s.name, 'Test Supplier')
      assert.equal(s.code, 'SUP-TEST')
      assert.equal(s.status, SupplierStatus.Active)
      assert.equal(s.rating, SupplierRating.B)
      assert.equal(s.tenantId, TENANT)
      assert.equal(s.category, '测试分类')
      assert.ok(s.id.startsWith('supplier-'))
      assert.ok(s.createdAt)
      assert.ok(s.updatedAt)
    })

    it('should create supplier with specific status and rating', () => {
      const s = createTestSupplier({
        status: SupplierStatus.Inactive,
        rating: SupplierRating.A,
        remark: 'VIP supplier',
      })

      assert.equal(s.status, SupplierStatus.Inactive)
      assert.equal(s.rating, SupplierRating.A)
      assert.equal(s.remark, 'VIP supplier')
    })
  })

  describe('getSupplier', () => {
    it('should return supplier by id', () => {
      const s = createTestSupplier()
      const found = service.getSupplier(s.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, s.id)
    })

    it('should return undefined for non-existent', () => {
      const found = service.getSupplier('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const s = createTestSupplier()
      const found = service.getSupplier(s.id, 'wrong-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listSuppliers', () => {
    it('should list all suppliers for tenant', () => {
      createTestSupplier({ name: 'S1', code: 'S1' })
      createTestSupplier({ name: 'S2', code: 'S2' })

      const list = service.listSuppliers(TENANT)
      assert.equal(list.length, 2)
    })

    it('should filter by status', () => {
      createTestSupplier({ name: 'A', status: SupplierStatus.Active })
      const s2 = createTestSupplier({ name: 'I', status: SupplierStatus.Inactive })

      const inactive = service.listSuppliers(TENANT, { status: SupplierStatus.Inactive })
      assert.equal(inactive.length, 1)
      assert.equal(inactive[0].name, 'I')
    })

    it('should filter by rating', () => {
      createTestSupplier({ name: 'A-Rating', rating: SupplierRating.A })
      createTestSupplier({ name: 'C-Rating', rating: SupplierRating.C })

      const aList = service.listSuppliers(TENANT, { rating: SupplierRating.A })
      assert.equal(aList.length, 1)
    })

    it('should filter by category', () => {
      createTestSupplier({ name: 'Elec', category: '电子元器件' })
      createTestSupplier({ name: 'Pack', category: '包装材料' })

      const elec = service.listSuppliers(TENANT, { category: '电子元器件' })
      assert.equal(elec.length, 1)
    })

    it('should search by name or code', () => {
      createTestSupplier({ name: '华强电子', code: 'HQ-001' })
      createTestSupplier({ name: '博远包装', code: 'BY-002' })

      const searchResult = service.listSuppliers(TENANT, { search: '华强' })
      assert.equal(searchResult.length, 1)

      const codeSearch = service.listSuppliers(TENANT, { search: 'BY' })
      assert.equal(codeSearch.length, 1)
    })

    it('should return empty for wrong tenant', () => {
      createTestSupplier()
      const list = service.listSuppliers('wrong-tenant')
      assert.equal(list.length, 0)
    })
  })

  describe('updateSupplier', () => {
    it('should update supplier fields', () => {
      const s = createTestSupplier()
      const updated = service.updateSupplier(s.id, TENANT, {
        name: 'Updated Name',
        rating: SupplierRating.A,
      })

      assert.equal(updated.name, 'Updated Name')
      assert.equal(updated.rating, SupplierRating.A)
    })

    it('should throw for non-existent', () => {
      assert.throws(
        () => service.updateSupplier('nonexistent', TENANT, { name: 'X' }),
        /Supplier not found/
      )
    })

    it('should throw for wrong tenant', () => {
      const s = createTestSupplier()
      assert.throws(
        () => service.updateSupplier(s.id, 'wrong-tenant', { name: 'X' }),
        /Supplier not found/
      )
    })
  })

  describe('deleteSupplier', () => {
    it('should delete a supplier', () => {
      const s = createTestSupplier()
      service.deleteSupplier(s.id, TENANT)

      const found = service.getSupplier(s.id, TENANT)
      assert.equal(found, undefined)
    })

    it('should throw for non-existent', () => {
      assert.throws(
        () => service.deleteSupplier('nonexistent', TENANT),
        /Supplier not found/
      )
    })
  })
})
