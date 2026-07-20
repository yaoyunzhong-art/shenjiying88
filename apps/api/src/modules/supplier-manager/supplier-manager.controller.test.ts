import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [supplier-manager] [D] controller 测试 — 增强: ≥16 tests
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SupplierManagerController } from './supplier-manager.controller'
import { SupplierManagerService } from './supplier-manager.service'
import {
  SupplierStatus,
  SupplierRating,
} from './supplier-manager.entity'

describe('SupplierManagerController', () => {
  let controller: InstanceType<typeof SupplierManagerController>
  let service: InstanceType<typeof SupplierManagerService>

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }

  beforeEach(() => {
    service = new SupplierManagerService()
    controller = new SupplierManagerController(service)
  })

  afterEach(() => {
    service.resetSupplierStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be suppliers', () => {
      const path = Reflect.getMetadata('path', SupplierManagerController)
      assert.equal(path, 'suppliers')
    })

    it('createSupplier should be POST /', () => {
      const method = Reflect.getMetadata('method', SupplierManagerController.prototype.createSupplier)
      const path = Reflect.getMetadata('path', SupplierManagerController.prototype.createSupplier)
      assert.equal(method, 1)
      assert.equal(path, '/')
    })

    it('listSuppliers should be GET /', () => {
      const method = Reflect.getMetadata('method', SupplierManagerController.prototype.listSuppliers)
      const path = Reflect.getMetadata('path', SupplierManagerController.prototype.listSuppliers)
      assert.equal(method, 0)
      assert.equal(path, '/')
    })

    it('getSupplier should be GET /:supplierId', () => {
      const method = Reflect.getMetadata('method', SupplierManagerController.prototype.getSupplier)
      const path = Reflect.getMetadata('path', SupplierManagerController.prototype.getSupplier)
      assert.equal(method, 0)
      assert.equal(path, ':supplierId')
    })

    it('updateSupplier should be PATCH /:supplierId', () => {
      const method = Reflect.getMetadata('method', SupplierManagerController.prototype.updateSupplier)
      const path = Reflect.getMetadata('path', SupplierManagerController.prototype.updateSupplier)
      assert.equal(method, 4)
      assert.equal(path, ':supplierId')
    })

    it('deleteSupplier should be DELETE /:supplierId', () => {
      const method = Reflect.getMetadata('method', SupplierManagerController.prototype.deleteSupplier)
      const path = Reflect.getMetadata('path', SupplierManagerController.prototype.deleteSupplier)
      assert.equal(method, 3)
      assert.equal(path, ':supplierId')
    })
  })

  // ── CRUD via controller ──

  describe('POST /suppliers', () => {
    it('should create a supplier with defaults', () => {
      const result = controller.createSupplier(TENANT, {
        name: '深圳华强电子',
        code: 'SUP-001',
        contactPerson: '张伟',
        phone: '13800138001',
        email: 'zhangwei@hqelec.com',
        address: '深圳市福田区华强北路1001号',
        category: '电子元器件',
      })

      assert.equal(result.name, '深圳华强电子')
      assert.equal(result.status, SupplierStatus.Active)
      assert.ok(result.id.startsWith('supplier-'))
    })

    it('should create a supplier with custom status, rating and remark', () => {
      const result = controller.createSupplier(TENANT, {
        name: '广州博远包装',
        code: 'SUP-002',
        contactPerson: '李明',
        phone: '13900139002',
        email: 'liming@boyuan.com',
        address: '广州市番禺区南村镇兴业路88号',
        category: '包装材料',
        status: SupplierStatus.Inactive,
        rating: SupplierRating.A,
        remark: '测试供应商',
      })

      assert.equal(result.status, SupplierStatus.Inactive)
      assert.equal(result.rating, SupplierRating.A)
      assert.equal(result.remark, '测试供应商')
    })
  })

  describe('GET /suppliers', () => {
    it('should list all suppliers (seeded + created)', () => {
      controller.createSupplier(TENANT, {
        name: 'S1', code: 'S1', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const list = controller.listSuppliers(TENANT, {})
      // listSuppliers triggers seed (24 suppliers) + 1 created = 25
      assert.ok(list.length >= 25)
    })

    it('should filter list by status', () => {
      const activeList = controller.listSuppliers(TENANT, { status: SupplierStatus.Active })
      assert.ok(activeList.length > 0)
      activeList.forEach(s => assert.equal(s.status, SupplierStatus.Active))
    })

    it('should filter list by rating', () => {
      const aList = controller.listSuppliers(TENANT, { rating: SupplierRating.A })
      assert.ok(aList.length > 0)
      aList.forEach(s => assert.equal(s.rating, SupplierRating.A))
    })

    it('should filter list by category', () => {
      const elecList = controller.listSuppliers(TENANT, { category: '电子元器件' })
      assert.equal(elecList.length, 3)
    })

    it('should search list by name/code/phone', () => {
      controller.listSuppliers(TENANT, { search: '' }) // trigger seed
      const result = controller.listSuppliers(TENANT, { search: '华强' })
      assert.equal(result.length, 1)
      assert.equal(result[0].name, '深圳华强电子')
    })
  })

  describe('GET /suppliers/:supplierId', () => {
    it('should get supplier by id', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'Get Me', code: 'GM-001', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const found = controller.getSupplier(TENANT, created.id)
      assert.ok(found)
      assert.equal(found.name, 'Get Me')
    })

    it('should throw for non-existent supplier id', () => {
      assert.throws(
        () => controller.getSupplier(TENANT, 'nonexistent'),
        /Supplier not found: nonexistent/
      )
    })
  })

  describe('PATCH /suppliers/:supplierId', () => {
    it('should update supplier name', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'Old', code: 'OLD', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const updated = controller.updateSupplier(TENANT, created.id, { name: 'New' })
      assert.equal(updated.name, 'New')
    })

    it('should update supplier status', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'S', code: 'S', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const updated = controller.updateSupplier(TENANT, created.id, { status: SupplierStatus.Suspended })
      assert.equal(updated.status, SupplierStatus.Suspended)
    })

    it('should update supplier rating and remark together', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'S', code: 'S', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const updated = controller.updateSupplier(TENANT, created.id, {
        rating: SupplierRating.A,
        remark: '优质供应商',
      })
      assert.equal(updated.rating, SupplierRating.A)
      assert.equal(updated.remark, '优质供应商')
    })
  })

  describe('DELETE /suppliers/:supplierId', () => {
    it('should delete supplier and return success', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'Del', code: 'DEL', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const result = controller.deleteSupplier(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })

    it('deleted supplier should not be found', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'Del', code: 'DEL', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      controller.deleteSupplier(TENANT, created.id)
      assert.throws(
        () => controller.getSupplier(TENANT, created.id),
        /Supplier not found/
      )
    })
  })

  // ── Error handling ──

  describe('error propagation', () => {
    it('should propagate not found for get', () => {
      assert.throws(
        () => controller.getSupplier(TENANT, 'nonexistent'),
        /Supplier not found: nonexistent/
      )
    })

    it('should propagate not found for update', () => {
      assert.throws(
        () => controller.updateSupplier(TENANT, 'nonexistent', { name: 'X' }),
        /Supplier not found/
      )
    })

    it('should propagate not found for delete', () => {
      assert.throws(
        () => controller.deleteSupplier(TENANT, 'nonexistent'),
        /Supplier not found/
      )
    })
  })

  // ── Multi-tenant isolation ──

  describe('multi-tenant isolation', () => {
    it('should not find supplier from different tenant', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'T1 Supplier', code: 'T1', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const otherTenant = { tenantId: 'tenant-002', brandId: 'brand-2', storeId: 'store-002' }
      assert.throws(
        () => controller.getSupplier(otherTenant, created.id),
        /Supplier not found/
      )
    })

    it('should isolate lists between tenants', () => {
      controller.listSuppliers(TENANT, {}) // seed tenant-001
      const t1Count = controller.listSuppliers(TENANT, {}).length

      const otherTenant = { tenantId: 'tenant-002', brandId: 'brand-2', storeId: 'store-002' }
      controller.createSupplier(otherTenant, {
        name: 'Other Supplier', code: 'OS-001', contactPerson: 'C', phone: 'P',
        email: 'e@o.com', address: 'A', category: 'C',
      })

      // tenant-001: seeded 24; tenant-002: just the one created
      assert.equal(controller.listSuppliers(otherTenant, {}).length, 1)
      assert.equal(controller.listSuppliers(TENANT, {}).length, t1Count)
    })
  })
})
