import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [supplier-manager] [D] controller 测试
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
      assert.equal(method, 5)
      assert.equal(path, ':supplierId')
    })
  })

  // ── CRUD via controller ──

  describe('POST /suppliers', () => {
    it('should create a supplier', () => {
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
  })

  describe('GET /suppliers', () => {
    it('should list suppliers', () => {
      controller.createSupplier(TENANT, {
        name: 'S1', code: 'S1', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const list = controller.listSuppliers(TENANT, {})
      assert.equal(list.length, 1)
    })
  })

  describe('GET /suppliers/:supplierId', () => {
    it('should get supplier', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'Get Me', code: 'GM-001', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const found = controller.getSupplier(TENANT, created.id)
      assert.ok(found)
      assert.equal(found.name, 'Get Me')
    })
  })

  describe('PATCH /suppliers/:supplierId', () => {
    it('should update supplier', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'Old', code: 'OLD', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const updated = controller.updateSupplier(TENANT, created.id, { name: 'New' })
      assert.equal(updated.name, 'New')
    })
  })

  describe('DELETE /suppliers/:supplierId', () => {
    it('should delete supplier', () => {
      const created = controller.createSupplier(TENANT, {
        name: 'Del', code: 'DEL', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })

      const result = controller.deleteSupplier(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  // ── Error handling ──

  describe('error propagation', () => {
    it('should propagate not found', () => {
      assert.throws(
        () => controller.getSupplier(TENANT, 'nonexistent'),
        /Supplier not found: nonexistent/
      )
    })
  })
})
