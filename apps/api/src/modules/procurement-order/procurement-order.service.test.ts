import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [procurement-order] [D] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ProcurementOrderService } from './procurement-order.service'
import {
  ProcurementStatus,
  type ProcurementOrder,
} from './procurement-order.entity'

describe('ProcurementOrderService', () => {
  let service: ProcurementOrderService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new ProcurementOrderService()
  })

  afterEach(() => {
    service.resetOrderStoresForTests()
  })

  function createTestOrder(overrides?: Partial<Parameters<ProcurementOrderService['createOrder']>[0]>): ProcurementOrder {
    return service.createOrder({
      tenantId: TENANT,
      orderNo: 'PO-TEST-001',
      supplierId: 'supplier-test',
      supplierName: '测试供应商',
      items: [
        { name: '测试商品A', sku: 'T-A', quantity: 10, unitPrice: 5.0 },
        { name: '测试商品B', sku: 'T-B', quantity: 5, unitPrice: 20.0 },
      ],
      orderedAt: '2026-07-16T00:00:00.000Z',
      expectedAt: '2026-07-25T00:00:00.000Z',
      remark: '测试订单',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createOrder', () => {
    it('should create an order with DRAFT status', () => {
      const o = createTestOrder()

      assert.equal(o.orderNo, 'PO-TEST-001')
      assert.equal(o.supplierName, '测试供应商')
      assert.equal(o.status, ProcurementStatus.Draft)
      assert.equal(o.tenantId, TENANT)
      assert.equal(o.items.length, 2)
      assert.equal(o.totalAmount, 150) // 10*5 + 5*20
      assert.ok(o.id.startsWith('order-'))
      assert.ok(o.createdAt)
    })

    it('should calculate totalAmount from items', () => {
      const o = createTestOrder({
        items: [
          { name: 'Item A', sku: 'A', quantity: 3, unitPrice: 10 },
          { name: 'Item B', sku: 'B', quantity: 2, unitPrice: 100 },
        ],
      })

      assert.equal(o.totalAmount, 230) // 3*10 + 2*100
    })

    it('should create order without remark', () => {
      const o = createTestOrder({ remark: undefined })
      assert.equal(o.remark, undefined)
    })
  })

  describe('getOrder', () => {
    it('should return order by id', () => {
      const o = createTestOrder()
      const found = service.getOrder(o.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, o.id)
    })

    it('should return undefined for non-existent order', () => {
      const found = service.getOrder('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const o = createTestOrder()
      const found = service.getOrder(o.id, 'wrong-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listOrders', () => {
    it('should list all orders for tenant (with seed data)', () => {
      createTestOrder({ orderNo: 'PO-001' })
      createTestOrder({ orderNo: 'PO-002' })

      const list = service.listOrders(TENANT)
      // listOrders seeds mock data, so length = 21 seeds + 2 test
      assert.ok(list.length >= 21)
      assert.ok(list.some((o) => o.orderNo === 'PO-001'))
    })

    it('should filter by status', () => {
      createTestOrder({ orderNo: 'PO-DRAFT' })
      const o2 = createTestOrder({ orderNo: 'PO-SHIP' })
      service.updateOrderStatus(o2.id, ProcurementStatus.PendingApproval, TENANT)
      service.updateOrderStatus(o2.id, ProcurementStatus.Approved, TENANT)
      service.updateOrderStatus(o2.id, ProcurementStatus.Shipped, TENANT)

      const shipped = service.listOrders(TENANT, { status: ProcurementStatus.Shipped })
      assert.ok(shipped.length >= 1)
      assert.ok(shipped.some((o) => o.orderNo === 'PO-SHIP'))
    })

    it('should filter by supplierId', () => {
      createTestOrder({ orderNo: 'PO-1', supplierId: 'sup-a' })
      createTestOrder({ orderNo: 'PO-2', supplierId: 'sup-b' })

      const list = service.listOrders(TENANT, { supplierId: 'sup-a' })
      assert.ok(list.length >= 1)
      assert.ok(list.every((o) => o.supplierId === 'sup-a'))
    })

    it('should filter by search', () => {
      createTestOrder({ orderNo: 'PO-SPECIAL', supplierName: '特别供应商' })
      createTestOrder({ orderNo: 'PO-ORDINARY', supplierName: '普通供应商' })

      const list = service.listOrders(TENANT, { search: '特别' })
      assert.ok(list.length >= 1)
      assert.ok(list.some((o) => o.orderNo === 'PO-SPECIAL'))
    })
  })

  describe('updateOrder', () => {
    it('should update order fields', () => {
      const o = createTestOrder()
      const updated = service.updateOrder(o.id, TENANT, {
        remark: '更新备注',
        expectedAt: '2026-08-01T00:00:00.000Z',
      })

      assert.equal(updated.remark, '更新备注')
      assert.equal(updated.expectedAt, '2026-08-01T00:00:00.000Z')
    })

    it('should recalculate totalAmount when items change', () => {
      const o = createTestOrder()
      const updated = service.updateOrder(o.id, TENANT, {
        items: [
          { id: 'ni1', name: 'New Item', sku: 'NI', quantity: 2, unitPrice: 50, receivedQuantity: 0 },
        ],
      })

      assert.equal(updated.items.length, 1)
      assert.equal(updated.totalAmount, 100)
    })

    it('should throw for non-existent order', () => {
      assert.throws(
        () => service.updateOrder('nonexistent', TENANT, { remark: 'X' }),
        /Order not found/
      )
    })
  })

  describe('deleteOrder', () => {
    it('should delete a draft order', () => {
      const o = createTestOrder()
      service.deleteOrder(o.id, TENANT)

      const found = service.getOrder(o.id, TENANT)
      assert.equal(found, undefined)
    })

    it('should throw for non-draft order', () => {
      const o = createTestOrder()
      service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, TENANT)

      assert.throws(
        () => service.deleteOrder(o.id, TENANT),
        /Only draft or cancelled orders can be deleted/
      )
    })

    it('should throw for non-existent order', () => {
      assert.throws(
        () => service.deleteOrder('nonexistent', TENANT),
        /Order not found/
      )
    })
  })

  // ── Status transitions ──

  describe('updateOrderStatus', () => {
    it('should transition Draft → PendingApproval', () => {
      const o = createTestOrder()
      const updated = service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, TENANT)
      assert.equal(updated.status, ProcurementStatus.PendingApproval)
    })

    it('should transition Draft → Cancelled', () => {
      const o = createTestOrder()
      const updated = service.updateOrderStatus(o.id, ProcurementStatus.Cancelled, TENANT)
      assert.equal(updated.status, ProcurementStatus.Cancelled)
    })

    it('should transition PendingApproval → Approved', () => {
      const o = createTestOrder()
      service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, TENANT)
      const updated = service.updateOrderStatus(o.id, ProcurementStatus.Approved, TENANT)
      assert.equal(updated.status, ProcurementStatus.Approved)
    })

    it('should transition Approved → Shipped', () => {
      const o = createTestOrder()
      service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, TENANT)
      service.updateOrderStatus(o.id, ProcurementStatus.Approved, TENANT)
      const updated = service.updateOrderStatus(o.id, ProcurementStatus.Shipped, TENANT)
      assert.equal(updated.status, ProcurementStatus.Shipped)
    })

    it('should reject invalid: Draft → Received', () => {
      const o = createTestOrder()
      assert.throws(
        () => service.updateOrderStatus(o.id, ProcurementStatus.Received, TENANT),
        /Invalid procurement status transition/
      )
    })

    it('should reject invalid: Received → Draft', () => {
      const o = createTestOrder()
      service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, TENANT)
      service.updateOrderStatus(o.id, ProcurementStatus.Approved, TENANT)
      service.updateOrderStatus(o.id, ProcurementStatus.Shipped, TENANT)
      service.updateOrderStatus(o.id, ProcurementStatus.Received, TENANT)
      assert.throws(
        () => service.updateOrderStatus(o.id, ProcurementStatus.Draft, TENANT),
        /Invalid procurement status transition/
      )
    })
  })

  // ── Receive items ──

  function makeShipped(o: ProcurementOrder): void {
    service.updateOrderStatus(o.id, ProcurementStatus.PendingApproval, TENANT)
    service.updateOrderStatus(o.id, ProcurementStatus.Approved, TENANT)
    service.updateOrderStatus(o.id, ProcurementStatus.Shipped, TENANT)
  }

  describe('receiveItems', () => {
    it('should receive items for SHIPPED order', () => {
      const o = createTestOrder()
      makeShipped(o)

      const updated = service.receiveItems(o.id, [
        { itemId: o.items[0].id, receivedQuantity: 10 },
        { itemId: o.items[1].id, receivedQuantity: 5 },
      ], TENANT)

      assert.equal(updated.status, ProcurementStatus.Received)
      assert.equal(updated.items[0].receivedQuantity, 10)
      assert.equal(updated.items[1].receivedQuantity, 5)
      assert.ok(updated.receivedAt)
    })

    it('should handle partial receive', () => {
      const o = createTestOrder()
      makeShipped(o)

      const updated = service.receiveItems(o.id, [
        { itemId: o.items[0].id, receivedQuantity: 5 },
      ], TENANT)

      assert.equal(updated.status, ProcurementStatus.Partial)
      assert.equal(updated.items[0].receivedQuantity, 5)
      assert.equal(updated.items[1].receivedQuantity, 0)
    })

    it('should throw for DRAFT order', () => {
      const o = createTestOrder()
      assert.throws(
        () => service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 1 }], TENANT),
        /Order must be in SHIPPED or PARTIAL status/
      )
    })

    it('should throw for exceeding ordered quantity', () => {
      const o = createTestOrder()
      makeShipped(o)

      assert.throws(
        () => service.receiveItems(o.id, [{ itemId: o.items[0].id, receivedQuantity: 100 }], TENANT),
        /Received quantity exceeds ordered quantity/
      )
    })
  })

  // ── Query helpers ──

  describe('getOrdersBySupplier', () => {
    it('should return orders for a supplier', () => {
      createTestOrder({ orderNo: 'PO-1', supplierId: 'sup-001' })
      createTestOrder({ orderNo: 'PO-2', supplierId: 'sup-001' })
      createTestOrder({ orderNo: 'PO-3', supplierId: 'sup-002' })

      const orders = service.getOrdersBySupplier('sup-001', TENANT)
      assert.equal(orders.length, 2)
    })

    it('should return empty for unknown supplier', () => {
      const orders = service.getOrdersBySupplier('nobody', TENANT)
      assert.equal(orders.length, 0)
    })
  })

  describe('getOverdueOrders', () => {
    it('should return overdue orders', () => {
      // Create order with past expected date, still in draft
      const o = createTestOrder({
        orderNo: 'PO-OVERDUE',
        expectedAt: '2026-06-01T00:00:00.000Z',
      })

      const overdue = service.getOverdueOrders(TENANT)
      assert.ok(overdue.length >= 1)
      assert.ok(overdue.some((o2) => o2.id === o.id))
    })
  })
})
