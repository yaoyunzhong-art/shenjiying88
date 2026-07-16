import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [procurement-order] [D] DTO 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreateProcurementItemDto,
  CreateProcurementOrderDto,
  UpdateProcurementOrderDto,
  UpdateProcurementStatusDto,
  ProcurementOrderQueryDto,
  ReceiveItemsDto,
  ReceiveItemDto,
} from './procurement-order.dto'
import { ProcurementStatus } from './procurement-order.entity'

describe('ProcurementOrder DTOs', () => {
  describe('CreateProcurementItemDto', () => {
    it('should accept all required fields', () => {
      const dto = Object.assign(new CreateProcurementItemDto(), {
        name: '电阻器套装',
        sku: 'R-1001',
        quantity: 1000,
        unitPrice: 0.5,
      })

      assert.equal(dto.name, '电阻器套装')
      assert.equal(dto.sku, 'R-1001')
      assert.equal(dto.quantity, 1000)
      assert.equal(dto.unitPrice, 0.5)
    })

    it('should be instanceof CreateProcurementItemDto', () => {
      const dto = Object.assign(new CreateProcurementItemDto(), {
        name: 'Item',
        sku: 'SKU-001',
        quantity: 10,
        unitPrice: 5,
      })
      assert.ok(dto instanceof CreateProcurementItemDto)
    })
  })

  describe('CreateProcurementOrderDto', () => {
    it('should accept all required fields', () => {
      const itemDto = Object.assign(new CreateProcurementItemDto(), {
        name: '电阻器',
        sku: 'R-001',
        quantity: 100,
        unitPrice: 1.0,
      })

      const dto = Object.assign(new CreateProcurementOrderDto(), {
        orderNo: 'PO-2026-0100',
        supplierId: 'supplier-001',
        supplierName: '测试供应商',
        items: [itemDto],
        orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
        remark: '测试订单',
      })

      assert.equal(dto.orderNo, 'PO-2026-0100')
      assert.equal(dto.supplierName, '测试供应商')
      assert.equal(dto.items.length, 1)
      assert.equal(dto.items[0].name, '电阻器')
      assert.equal(dto.remark, '测试订单')
    })

    it('should be instanceof CreateProcurementOrderDto', () => {
      const dto = new CreateProcurementOrderDto()
      assert.ok(dto instanceof CreateProcurementOrderDto)
    })
  })

  describe('UpdateProcurementOrderDto', () => {
    it('should accept partial fields', () => {
      const dto = Object.assign(new UpdateProcurementOrderDto(), {
        remark: '更新备注',
      })

      assert.equal(dto.remark, '更新备注')
      assert.equal(dto.orderNo, undefined)
    })

    it('should accept multiple fields', () => {
      const dto = Object.assign(new UpdateProcurementOrderDto(), {
        orderNo: 'PO-NEW-001',
        expectedAt: '2026-08-01T00:00:00.000Z',
      })

      assert.equal(dto.orderNo, 'PO-NEW-001')
      assert.equal(dto.expectedAt, '2026-08-01T00:00:00.000Z')
    })

    it('should accept empty object', () => {
      const dto = new UpdateProcurementOrderDto()
      assert.equal(dto.remark, undefined)
    })
  })

  describe('UpdateProcurementStatusDto', () => {
    it('should hold status', () => {
      const dto = Object.assign(new UpdateProcurementStatusDto(), {
        status: ProcurementStatus.Approved,
      })

      assert.equal(dto.status, ProcurementStatus.Approved)
    })
  })

  describe('ProcurementOrderQueryDto', () => {
    it('should hold query filters', () => {
      const dto = Object.assign(new ProcurementOrderQueryDto(), {
        status: ProcurementStatus.Shipped,
        supplierId: 'supplier-001',
        search: '紧急',
      })

      assert.equal(dto.status, ProcurementStatus.Shipped)
      assert.equal(dto.supplierId, 'supplier-001')
      assert.equal(dto.search, '紧急')
    })

    it('should accept empty query', () => {
      const dto = new ProcurementOrderQueryDto()
      assert.equal(dto.status, undefined)
      assert.equal(dto.supplierId, undefined)
      assert.equal(dto.search, undefined)
    })
  })

  describe('ReceiveItemsDto', () => {
    it('should hold items array', () => {
      const item = Object.assign(new ReceiveItemDto(), {
        itemId: 'item-001',
        receivedQuantity: 50,
      })

      const dto = Object.assign(new ReceiveItemsDto(), {
        items: [item],
      })

      assert.equal(dto.items.length, 1)
      assert.equal(dto.items[0].itemId, 'item-001')
      assert.equal(dto.items[0].receivedQuantity, 50)
    })
  })
})
