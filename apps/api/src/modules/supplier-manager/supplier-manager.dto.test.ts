import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [supplier-manager] [D] DTO 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
} from './supplier-manager.dto'
import { SupplierStatus, SupplierRating } from './supplier-manager.entity'

describe('SupplierManager DTOs', () => {
  describe('CreateSupplierDto', () => {
    const toDto = (raw: Record<string, unknown>): CreateSupplierDto =>
      Object.assign(new CreateSupplierDto(), raw)

    it('should accept all required fields', () => {
      const dto = toDto({
        name: 'Test Supplier',
        code: 'SUP-001',
        contactPerson: '张三',
        phone: '13800138000',
        email: 'zhangsan@test.com',
        address: '测试地址',
        category: '电子元器件',
      })

      assert.equal(dto.name, 'Test Supplier')
      assert.equal(dto.code, 'SUP-001')
      assert.equal(dto.contactPerson, '张三')
      assert.equal(dto.phone, '13800138000')
      assert.equal(dto.email, 'zhangsan@test.com')
      assert.equal(dto.address, '测试地址')
      assert.equal(dto.category, '电子元器件')
    })

    it('should accept optional fields', () => {
      const dto = toDto({
        name: 'S',
        code: 'S-001',
        contactPerson: '王五',
        phone: '13700137000',
        email: 'wangwu@test.com',
        address: '地址',
        status: SupplierStatus.Active,
        rating: SupplierRating.A,
        category: '五金',
        remark: '备注',
      })

      assert.equal(dto.status, SupplierStatus.Active)
      assert.equal(dto.rating, SupplierRating.A)
      assert.equal(dto.remark, '备注')
    })

    it('should be instanceof CreateSupplierDto', () => {
      const dto = toDto({
        name: 'S', code: 'S-001', contactPerson: 'C', phone: 'P',
        email: 'e@t.com', address: 'A', category: 'C',
      })
      assert.ok(dto instanceof CreateSupplierDto)
    })
  })

  describe('UpdateSupplierDto', () => {
    it('should accept partial data', () => {
      const dto = Object.assign(new UpdateSupplierDto(), { name: 'New Name' })
      assert.equal(dto.name, 'New Name')
      assert.equal(dto.address, undefined)
    })

    it('should accept empty object', () => {
      const dto = new UpdateSupplierDto()
      assert.equal(dto.name, undefined)
    })
  })

  describe('SupplierQueryDto', () => {
    it('should hold query filters', () => {
      const dto = Object.assign(new SupplierQueryDto(), {
        status: SupplierStatus.Active,
        rating: SupplierRating.A,
        category: '电子',
        search: '华强',
      })
      assert.equal(dto.status, SupplierStatus.Active)
      assert.equal(dto.rating, SupplierRating.A)
      assert.equal(dto.category, '电子')
      assert.equal(dto.search, '华强')
    })

    it('should accept empty query', () => {
      const dto = new SupplierQueryDto()
      assert.equal(dto.status, undefined)
    })
  })
})
