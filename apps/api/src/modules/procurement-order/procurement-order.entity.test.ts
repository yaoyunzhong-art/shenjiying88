import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [procurement-order] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ProcurementStatus,
  type ProcurementItem,
  type ProcurementOrder,
} from './procurement-order.entity'

describe('ProcurementOrder Entity', () => {
  describe('enums', () => {
    it('ProcurementStatus should have correct values', () => {
      assert.equal(ProcurementStatus.Draft, 'DRAFT')
      assert.equal(ProcurementStatus.PendingApproval, 'PENDING_APPROVAL')
      assert.equal(ProcurementStatus.Approved, 'APPROVED')
      assert.equal(ProcurementStatus.Shipped, 'SHIPPED')
      assert.equal(ProcurementStatus.Partial, 'PARTIAL')
      assert.equal(ProcurementStatus.Received, 'RECEIVED')
      assert.equal(ProcurementStatus.Cancelled, 'CANCELLED')
    })
  })

  describe('ProcurementItem interface shape', () => {
    it('should create a valid procurement item', () => {
      const item: ProcurementItem = {
        id: 'item-001',
        name: '电阻器套装',
        sku: 'R-1001',
        quantity: 1000,
        unitPrice: 0.5,
        receivedQuantity: 500,
      }

      assert.equal(item.id, 'item-001')
      assert.equal(item.name, '电阻器套装')
      assert.equal(item.sku, 'R-1001')
      assert.equal(item.quantity, 1000)
      assert.equal(item.unitPrice, 0.5)
      assert.equal(item.receivedQuantity, 500)
    })

    it('should support zero receivedQuantity', () => {
      const item: ProcurementItem = {
        id: 'item-002',
        name: '全新未收',
        sku: 'NEW-001',
        quantity: 50,
        unitPrice: 10,
        receivedQuantity: 0,
      }

      assert.equal(item.receivedQuantity, 0)
    })
  })

  describe('ProcurementOrder interface shape', () => {
    it('should create a valid order with items', () => {
      const item: ProcurementItem = {
        id: 'item-001',
        name: '电阻器套装',
        sku: 'R-1001',
        quantity: 1000,
        unitPrice: 0.5,
        receivedQuantity: 1000,
      }

      const order: ProcurementOrder = {
        id: 'order-001',
        orderNo: 'PO-2026-0001',
        supplierId: 'supplier-001',
        supplierName: '深圳华强电子',
        status: ProcurementStatus.Received,
        totalAmount: 500,
        items: [item],
        remark: '常规补货',
        orderedAt: '2026-07-01T00:00:00.000Z',
        expectedAt: '2026-07-10T00:00:00.000Z',
        receivedAt: '2026-07-09T00:00:00.000Z',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
      }

      assert.equal(order.id, 'order-001')
      assert.equal(order.orderNo, 'PO-2026-0001')
      assert.equal(order.supplierName, '深圳华强电子')
      assert.equal(order.status, ProcurementStatus.Received)
      assert.equal(order.totalAmount, 500)
      assert.equal(order.items.length, 1)
      assert.equal(order.remark, '常规补货')
      assert.ok(order.orderedAt)
      assert.ok(order.expectedAt)
      assert.ok(order.receivedAt)
      assert.equal(order.tenantId, 'tenant-001')
    })

    it('should support order without remark/receivedAt', () => {
      const order: ProcurementOrder = {
        id: 'order-002',
        orderNo: 'PO-2026-0002',
        supplierId: 'supplier-002',
        supplierName: '广州博远包装',
        status: ProcurementStatus.Draft,
        totalAmount: 0,
        items: [],
        orderedAt: '2026-07-05T00:00:00.000Z',
        expectedAt: '2026-07-15T00:00:00.000Z',
        tenantId: 'tenant-001',
        createdAt: '2026-07-05T00:00:00.000Z',
      }

      assert.equal(order.remark, undefined)
      assert.equal(order.receivedAt, undefined)
    })

    it('should compute totalAmount from items', () => {
      const items: ProcurementItem[] = [
        { id: 'i1', name: 'Item A', sku: 'A', quantity: 10, unitPrice: 5, receivedQuantity: 0 },
        { id: 'i2', name: 'Item B', sku: 'B', quantity: 5, unitPrice: 20, receivedQuantity: 0 },
      ]

      const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      assert.equal(total, 150) // 10*5 + 5*20 = 150
    })
  })
})
