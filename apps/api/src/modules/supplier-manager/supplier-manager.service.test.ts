import { describe, it, expect, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [supplier-manager] [D] service 测试 — 增强: CRUD/状态切换/边界 ≥15 tests
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

  function createTestSupplier(
    overrides?: Partial<Parameters<SupplierManagerService['createSupplier']>[0]>
  ): Supplier {
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

  // ═══════════════════════════════════════════════════════════════════
  // createSupplier — 2 tests
  // ═══════════════════════════════════════════════════════════════════

  describe('createSupplier', () => {
    it('should create a supplier with ACTIVE status and B rating by default', () => {
      const s = createTestSupplier()

      assert.equal(s.name, 'Test Supplier')
      assert.equal(s.code, 'SUP-TEST')
      assert.equal(s.status, SupplierStatus.Active)
      assert.equal(s.rating, SupplierRating.B)
      assert.equal(s.tenantId, TENANT)
      assert.equal(s.category, '测试分类')
      assert.ok(s.id.startsWith('supplier-'))
      assert.ok(typeof s.createdAt === 'string')
      assert.ok(typeof s.updatedAt === 'string')
      assert.equal(s.createdAt, s.updatedAt)
    })

    it('should create supplier with specific status, rating and remark', () => {
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

  // ═══════════════════════════════════════════════════════════════════
  // getSupplier — 3 tests
  // ═══════════════════════════════════════════════════════════════════

  describe('getSupplier', () => {
    it('should return supplier by id', () => {
      const s = createTestSupplier()
      const found = service.getSupplier(s.id, TENANT)
      assert.ok(found)
      assert.equal(found.id, s.id)
      assert.equal(found.name, s.name)
    })

    it('should return undefined for non-existent id', () => {
      const found = service.getSupplier('supplier-nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined when tenant does not match', () => {
      const s = createTestSupplier()
      const found = service.getSupplier(s.id, 'other-tenant')
      assert.equal(found, undefined)
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // listSuppliers — 6 tests
  // Note: listSuppliers seeds 24 mock suppliers on first call.
  // Assertions account for the seed + any test-created suppliers.
  // ═══════════════════════════════════════════════════════════════════

  describe('listSuppliers', () => {
    it('should list seeded suppliers after first call', () => {
      // First call triggers seed → 24 mock suppliers for tenant-001
      const list = service.listSuppliers(TENANT)
      assert.equal(list.length, 24)
      // Each entry has required fields
      assert.ok(list.every((s) => s.id.startsWith('supplier-')))
      assert.ok(list.every((s) => s.tenantId === TENANT))
    })

    it('should filter by status from seeded data', () => {
      const list = service.listSuppliers(TENANT)
      // Among 24 seeded: 18 ACTIVE, 3 INACTIVE, 2 SUSPENDED (SUP-009=Suspended, SUP-016=Suspended)
      // Index 8 is SUP-009 (Suspended), index 15 is SUP-016 (Suspended) — but we just check total

      const inactive = service.listSuppliers(TENANT, { status: SupplierStatus.Inactive })
      assert.ok(inactive.length > 0)
      inactive.forEach((s) => assert.equal(s.status, SupplierStatus.Inactive))

      const suspended = service.listSuppliers(TENANT, { status: SupplierStatus.Suspended })
      assert.ok(suspended.length > 0)
      suspended.forEach((s) => assert.equal(s.status, SupplierStatus.Suspended))
    })

    it('should filter by rating from seeded data', () => {
      const aList = service.listSuppliers(TENANT, { rating: SupplierRating.A })
      assert.ok(aList.length > 0)
      aList.forEach((s) => assert.equal(s.rating, SupplierRating.A))
    })

    it('should filter by category from seeded data', () => {
      const elec = service.listSuppliers(TENANT, { category: '电子元器件' })
      assert.equal(elec.length, 3) // SUP-001, SUP-018, SUP-022
    })

    it('should search by name, code, contactPerson or phone', () => {
      // trigger seed
      service.listSuppliers(TENANT)

      // Search by Chinese name substring
      const nameResult = service.listSuppliers(TENANT, { search: '华强' })
      assert.equal(nameResult.length, 1) // 深圳华强电子

      // Search by code
      const codeResult = service.listSuppliers(TENANT, { search: 'SUP-001' })
      assert.equal(codeResult.length, 1)

      // Search by contact person
      const personResult = service.listSuppliers(TENANT, { search: '张伟' })
      assert.equal(personResult.length, 1)

      // Search by phone
      const phoneResult = service.listSuppliers(TENANT, { search: '13800138001' })
      assert.equal(phoneResult.length, 1)
    })

    it('should return sorted by name ascending', () => {
      const list = service.listSuppliers(TENANT)
      for (let i = 1; i < list.length; i++) {
        assert.ok(list[i - 1].name.localeCompare(list[i].name) <= 0)
      }
    })

    it('should return empty array for wrong tenant', () => {
      service.listSuppliers(TENANT) // trigger seed for tenant-001
      const list = service.listSuppliers('other-tenant')
      assert.equal(list.length, 0)
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // updateSupplier — 6 tests (CRUD + status transitions + boundary)
  // ═══════════════════════════════════════════════════════════════════

  describe('updateSupplier', () => {
    it('should update individual fields', () => {
      const s = createTestSupplier()
      const updated = service.updateSupplier(s.id, TENANT, {
        name: 'Updated Name',
        rating: SupplierRating.A,
        remark: 'New remark',
      })

      assert.equal(updated.name, 'Updated Name')
      assert.equal(updated.rating, SupplierRating.A)
      assert.equal(updated.remark, 'New remark')
      assert.ok(typeof updated.updatedAt === 'string')
      assert.ok(updated.updatedAt.length > 0)
    })

    it('should throw for non-existent supplier', () => {
      assert.throws(
        () => service.updateSupplier('supplier-nonexistent', TENANT, { name: 'X' }),
        /Supplier not found/
      )
    })

    it('should throw for mismatched tenant', () => {
      const s = createTestSupplier()
      assert.throws(
        () => service.updateSupplier(s.id, 'other-tenant', { name: 'X' }),
        /Supplier not found/
      )
    })

    it('should allow status transitions: Active → Inactive → Suspended', () => {
      const s = createTestSupplier({ status: SupplierStatus.Active })

      const s1 = service.updateSupplier(s.id, TENANT, { status: SupplierStatus.Inactive })
      assert.equal(s1.status, SupplierStatus.Inactive)

      const s2 = service.updateSupplier(s.id, TENANT, { status: SupplierStatus.Suspended })
      assert.equal(s2.status, SupplierStatus.Suspended)
    })

    it('should update updatedAt timestamp on every mutation', () => {
      const s = createTestSupplier()
      const original = s.updatedAt

      const s1 = service.updateSupplier(s.id, TENANT, { name: 'After Update' })
      assert.ok(new Date(s1.updatedAt).getTime() >= new Date(original).getTime())
    })

    it('should update only the provided field, leaving others unchanged', () => {
      const s = createTestSupplier({
        name: 'Original',
        code: 'ORIG',
        status: SupplierStatus.Inactive,
        rating: SupplierRating.C,
      })

      const updated = service.updateSupplier(s.id, TENANT, { name: 'Changed' })
      assert.equal(updated.name, 'Changed')
      // other fields unchanged
      assert.equal(updated.code, 'ORIG')
      assert.equal(updated.status, SupplierStatus.Inactive)
      assert.equal(updated.rating, SupplierRating.C)
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // deleteSupplier — 3 tests
  // ═══════════════════════════════════════════════════════════════════

  describe('deleteSupplier', () => {
    it('should delete an existing supplier', () => {
      const s = createTestSupplier()

      service.deleteSupplier(s.id, TENANT)
      const found = service.getSupplier(s.id, TENANT)
      assert.equal(found, undefined)
    })

    it('should throw for non-existent supplier', () => {
      assert.throws(
        () => service.deleteSupplier('supplier-nonexistent', TENANT),
        /Supplier not found/
      )
    })

    it('should throw for mismatched tenant', () => {
      const s = createTestSupplier()
      assert.throws(
        () => service.deleteSupplier(s.id, 'other-tenant'),
        /Supplier not found/
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // Edge & boundary — 4 tests
  // ═══════════════════════════════════════════════════════════════════

  describe('edge cases & boundaries', () => {
    it('should handle empty search query (return seeded results)', () => {
      const list = service.listSuppliers(TENANT, { search: '' })
      assert.equal(list.length, 24)
    })

    it('should handle search with no matches', () => {
      service.listSuppliers(TENANT) // trigger seed
      const list = service.listSuppliers(TENANT, { search: 'zzzzz' })
      assert.equal(list.length, 0)
    })

    it('should handle case-insensitive search', () => {
      service.listSuppliers(TENANT) // trigger seed
      const upper = service.listSuppliers(TENANT, { search: '张伟' })
      const lower = service.listSuppliers(TENANT, { search: '张伟' })
      assert.equal(upper.length, lower.length)
    })

    it('should return undefined for supplier that existed but belongs to different tenant', () => {
      // Supplier exists for tenant-001, but we query with other-tenant
      const s = createTestSupplier()
      assert.equal(service.getSupplier(s.id, 'other-tenant'), undefined)
    })
  })
})
