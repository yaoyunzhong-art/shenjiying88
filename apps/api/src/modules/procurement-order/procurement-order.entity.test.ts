import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [procurement-order] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ProcurementStatus, type ProcurementItem, type ProcurementOrder } from './procurement-order.entity'

describe('ProcurementOrder Entity', () => {
  describe('ProcurementStatus enum', () => {
    it('should have correct values', () => {
      assert.equal(ProcurementStatus.Draft, 'DRAFT')
      assert.equal(ProcurementStatus.PendingApproval, 'PENDING_APPROVAL')
      assert.equal(ProcurementStatus.Approved, 'APPROVED')
      assert.equal(ProcurementStatus.Shipped, 'SHIPPED')
      assert.equal(ProcurementStatus.Partial, 'PARTIAL')
      assert.equal(ProcurementStatus.Received, 'RECEIVED')
      assert.equal(ProcurementStatus.Cancelled, 'CANCELLED')
    })
  })

  describe('ProcurementItem interface', () => {
    it('should create a valid item', () => {
      const item: ProcurementItem = {
        id: 'item-001',
        name: '电阻器',
        sku: 'R-001',
        quantity: 100,
        unitPrice: 0.5,
        receivedQuantity: 50,
      }
      assert.equal(item.name, '电阻器')
      assert.equal(item.quantity, 100)
      assert.equal(item.unitPrice, 0.5)
      assert.equal(item.receivedQuantity, 50)
    })
  })

  describe('ProcurementOrder interface', () => {
    it('should create a valid order', () => {
      const item: ProcurementItem = {
        id: 'item-001', name: 'Test', sku: 'T-001', quantity: 10, unitPrice: 5, receivedQuantity: 0,
      }
      const order: ProcurementOrder = {
        id: 'order-001',
        orderNo: 'PO-2026-0001',
        supplierId: 'supplier-001',
        supplierName: 'Test Supplier',
        status: ProcurementStatus.Draft,
        totalAmount: 50,
        items: [item],
        orderedAt: '2026-07-01T00:00:00.000Z',
        expectedAt: '2026-07-10T00:00:00.000Z',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
      }

      assert.equal(order.orderNo, 'PO-2026-0001')
      assert.equal(order.status, ProcurementStatus.Draft)
      assert.equal(order.totalAmount, 50)
      assert.equal(order.items.length, 1)
    })

    it('should support optional fields', () => {
      const order: ProcurementOrder = {
        id: 'order-002',
        orderNo: 'PO-2026-0002',
        supplierId: 's-001',
        supplierName: 'S',
        status: ProcurementStatus.Received,
        totalAmount: 100,
        items: [],
        remark: '备注',
        orderedAt: '2026-07-01T00:00:00.000Z',
        expectedAt: '2026-07-10T00:00:00.000Z',
        receivedAt: '2026-07-09T00:00:00.000Z',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
      }

      assert.equal(order.remark, '备注')
      assert.equal(order.receivedAt, '2026-07-09T00:00:00.000Z')
    })
  })
})
