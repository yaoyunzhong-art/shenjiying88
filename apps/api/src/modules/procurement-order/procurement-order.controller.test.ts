import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [procurement-order] [D] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ProcurementOrderController } from './procurement-order.controller'
import { ProcurementOrderService } from './procurement-order.service'
import {
  ProcurementStatus,
} from './procurement-order.entity'

describe('ProcurementOrderController', () => {
  let controller: InstanceType<typeof ProcurementOrderController>
  let service: InstanceType<typeof ProcurementOrderService>

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }

  const sampleItems = [
    { name: '测试商品A', sku: 'T-A', quantity: 10, unitPrice: 5.0 },
    { name: '测试商品B', sku: 'T-B', quantity: 5, unitPrice: 20.0 },
  ]

  beforeEach(() => {
    service = new ProcurementOrderService()
    controller = new ProcurementOrderController(service)
  })

  afterEach(() => {
    service.resetOrderStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be procurement-orders', () => {
      const path = Reflect.getMetadata('path', ProcurementOrderController)
      assert.equal(path, 'procurement-orders')
    })

    it('createOrder should be POST /', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.createOrder)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.createOrder)
      assert.equal(method, 1) // POST
      assert.equal(path, '/')
    })

    it('listOrders should be GET /', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.listOrders)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.listOrders)
      assert.equal(method, 0) // GET
      assert.equal(path, '/')
    })

    it('getOrder should be GET /:orderId', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.getOrder)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.getOrder)
      assert.equal(method, 0)
      assert.equal(path, ':orderId')
    })

    it('updateOrder should be PATCH /:orderId', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.updateOrder)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.updateOrder)
      assert.equal(method, 4) // PATCH
      assert.equal(path, ':orderId')
    })

    it('deleteOrder should be DELETE /:orderId', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.deleteOrder)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.deleteOrder)
      assert.equal(method, 5) // DELETE
      assert.equal(path, ':orderId')
    })

    it('updateOrderStatus should be PATCH /:orderId/status', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.updateOrderStatus)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.updateOrderStatus)
      assert.equal(method, 4)
      assert.equal(path, ':orderId/status')
    })

    it('receiveItems should be POST /:orderId/receive', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.receiveItems)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.receiveItems)
      assert.equal(method, 1)
      assert.equal(path, ':orderId/receive')
    })

    it('getOverdueOrders should be GET /views/overdue', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.getOverdueOrders)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.getOverdueOrders)
      assert.equal(method, 0)
      assert.equal(path, 'views/overdue')
    })

    it('getOrdersBySupplier should be GET /supplier/:supplierId', () => {
      const method = Reflect.getMetadata('method', ProcurementOrderController.prototype.getOrdersBySupplier)
      const path = Reflect.getMetadata('path', ProcurementOrderController.prototype.getOrdersBySupplier)
      assert.equal(method, 0)
      assert.equal(path, 'supplier/:supplierId')
    })
  })

  // ── CRUD via controller ──

  describe('POST /procurement-orders', () => {
    it('should create an order', () => {
      const result = controller.createOrder(TENANT, {
        orderNo: 'PO-001',
        supplierId: 'sup-001',
        supplierName: '测试供应商',
        items: sampleItems,
        orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
        remark: '测试',
      })

      assert.equal(result.orderNo, 'PO-001')
      assert.equal(result.status, ProcurementStatus.Draft)
      assert.equal(result.totalAmount, 150)
      assert.ok(result.id.startsWith('order-'))
    })
  })

  describe('GET /procurement-orders', () => {
    it('should list orders', () => {
      controller.createOrder(TENANT, {
        orderNo: 'PO-001', supplierId: 's', supplierName: 'S',
        items: sampleItems, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      const list = controller.listOrders(TENANT, {})
      assert.equal(list.length, 1)
    })

    it('should filter by status', () => {
      const o = controller.createOrder(TENANT, {
        orderNo: 'PO-SHIP', supplierId: 's', supplierName: 'S',
        items: sampleItems, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })
      controller.updateOrderStatus(TENANT, o.id, { status: ProcurementStatus.Shipped })

      const list = controller.listOrders(TENANT, { status: ProcurementStatus.Shipped })
      assert.equal(list.length, 1)
    })
  })

  describe('GET /procurement-orders/:orderId', () => {
    it('should get order', () => {
      const created = controller.createOrder(TENANT, {
        orderNo: 'PO-GET', supplierId: 's', supplierName: 'S',
        items: sampleItems, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      const found = controller.getOrder(TENANT, created.id)
      assert.ok(found)
      assert.equal(found.orderNo, 'PO-GET')
    })
  })

  describe('PATCH /procurement-orders/:orderId', () => {
    it('should update order', () => {
      const created = controller.createOrder(TENANT, {
        orderNo: 'PO-OLD', supplierId: 's', supplierName: 'S',
        items: sampleItems, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      const updated = controller.updateOrder(TENANT, created.id, { remark: '新备注' })
      assert.equal(updated.remark, '新备注')
    })
  })

  describe('DELETE /procurement-orders/:orderId', () => {
    it('should delete draft order', () => {
      const created = controller.createOrder(TENANT, {
        orderNo: 'PO-DEL', supplierId: 's', supplierName: 'S',
        items: sampleItems, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      const result = controller.deleteOrder(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  // ── Status management ──

  describe('PATCH /procurement-orders/:orderId/status', () => {
    it('should update status', () => {
      const created = controller.createOrder(TENANT, {
        orderNo: 'PO-STATUS', supplierId: 's', supplierName: 'S',
        items: sampleItems, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })

      const updated = controller.updateOrderStatus(TENANT, created.id, {
        status: ProcurementStatus.PendingApproval,
      })
      assert.equal(updated.status, ProcurementStatus.PendingApproval)
    })
  })

  describe('POST /procurement-orders/:orderId/receive', () => {
    it('should receive items', () => {
      const created = controller.createOrder(TENANT, {
        orderNo: 'PO-RCV', supplierId: 's', supplierName: 'S',
        items: sampleItems, orderedAt: '2026-07-16T00:00:00.000Z',
        expectedAt: '2026-07-25T00:00:00.000Z',
      })
      controller.updateOrderStatus(TENANT, created.id, { status: ProcurementStatus.Shipped })

      const result = controller.receiveItems(TENANT, created.id, {
        items: [
          { itemId: created.items[0].id, receivedQuantity: 10 },
          { itemId: created.items[1].id, receivedQuantity: 5 },
        ],
      })
      assert.equal(result.status, ProcurementStatus.Received)
    })
  })

  // ── Error handling ──

  describe('error propagation from service', () => {
    it('should propagate order not found', () => {
      assert.throws(
        () => controller.getOrder(TENANT, 'nonexistent'),
        /Order not found: nonexistent/
      )
    })
  })
})
