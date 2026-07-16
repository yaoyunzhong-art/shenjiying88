import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [supplier-manager] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SupplierStatus, SupplierRating, type Supplier } from './supplier-manager.entity'

describe('SupplierManager Entity', () => {
  describe('enums', () => {
    it('SupplierStatus should have correct values', () => {
      assert.equal(SupplierStatus.Active, 'ACTIVE')
      assert.equal(SupplierStatus.Inactive, 'INACTIVE')
      assert.equal(SupplierStatus.Suspended, 'SUSPENDED')
    })

    it('SupplierRating should have correct values', () => {
      assert.equal(SupplierRating.A, 'A')
      assert.equal(SupplierRating.B, 'B')
      assert.equal(SupplierRating.C, 'C')
      assert.equal(SupplierRating.D, 'D')
    })
  })

  describe('Supplier interface shape', () => {
    it('should create a valid supplier object', () => {
      const supplier: Supplier = {
        id: 'supplier-001',
        name: 'Test Supplier',
        code: 'SUP-001',
        contactPerson: '张三',
        phone: '13800138000',
        email: 'zhangsan@test.com',
        address: '测试地址',
        status: SupplierStatus.Active,
        rating: SupplierRating.A,
        category: '电子元器件',
        remark: '备注信息',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-15T00:00:00.000Z',
      }

      assert.equal(supplier.name, 'Test Supplier')
      assert.equal(supplier.code, 'SUP-001')
      assert.equal(supplier.status, SupplierStatus.Active)
      assert.equal(supplier.rating, SupplierRating.A)
      assert.equal(supplier.category, '电子元器件')
      assert.equal(supplier.remark, '备注信息')
    })

    it('should support optional remark field', () => {
      const supplier: Supplier = {
        id: 'supplier-002',
        name: 'No Remark',
        code: 'SUP-002',
        contactPerson: '李四',
        phone: '13900139000',
        email: 'lisi@test.com',
        address: '地址',
        status: SupplierStatus.Inactive,
        rating: SupplierRating.C,
        category: '包装材料',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-15T00:00:00.000Z',
      }

      assert.equal(supplier.remark, undefined)
    })
  })
})
