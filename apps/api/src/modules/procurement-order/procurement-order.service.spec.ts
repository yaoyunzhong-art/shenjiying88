/**
 * procurement-order.service.spec.ts — 采购订单 Service 单元测试 (V23)
 *
 * 覆盖: createOrder / updateOrder / getOrder / listOrders / deleteOrder /
 *       updateOrderStatus / receiveItems / getOrdersBySupplier / getOverdueOrders
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ProcurementOrderService } from './procurement-order.service'
import { ProcurementStatus } from './procurement-order.entity'

const TENANT_ID = 'tenant-001'

describe('ProcurementOrderService', () => {
  let svc: ProcurementOrderService

  beforeEach(() => {
    svc = new ProcurementOrderService()
    svc.resetOrderStoresForTests()
  })

  // ════════════════════════════════════════════
  // createOrder
  // ════════════════════════════════════════════

  describe('createOrder', () => {
    it('正例: 创建采购订单', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID,
        orderNo: 'PO-TEST-001',
        supplierId: 's-001',
        supplierName: '测试供应商',
        items: [{ name: '螺丝', sku: 'SCR-001', quantity: 1000, unitPrice: 0.5 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date(Date.now() + 86400000).toISOString(),
      })
      expect(order.id).toBeTruthy()
      expect(order.status).toBe(ProcurementStatus.Draft)
      expect(order.totalAmount).toBe(500)
    })

    it('正例: 带remark创建', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID,
        orderNo: 'PO-TEST-002',
        supplierId: 's-002',
        supplierName: '供应商B',
        items: [{ name: '纸箱', sku: 'BOX-001', quantity: 200, unitPrice: 3 }],
        remark: '紧急订单',
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      expect(order.remark).toBe('紧急订单')
    })
  })

  // ════════════════════════════════════════════
  // updateOrder
  // ════════════════════════════════════════════

  describe('updateOrder', () => {
    it('正例: 更新订单信息', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-001', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'A', sku: 'A', quantity: 10, unitPrice: 1 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      const updated = svc.updateOrder(order.id, TENANT_ID, { remark: '更新备注' })
      expect(updated.remark).toBe('更新备注')
    })
  })

  // ════════════════════════════════════════════
  // getOrder / listOrders
  // ════════════════════════════════════════════

  describe('getOrder', () => {
    it('正例: 获取订单', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-002', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'B', sku: 'B', quantity: 5, unitPrice: 10 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      const found = svc.getOrder(order.id, TENANT_ID)
      expect(found).toBeDefined()
    })
  })

  describe('listOrders', () => {
    it('正例: 列出所有订单（含种子数据）', () => {
      // 先清空再创建
      const list = svc.listOrders(TENANT_ID)
      expect(list.length).toBeGreaterThanOrEqual(21) // 种子21条
    })

    it('正例: 按状态筛选', () => {
      const drafts = svc.listOrders(TENANT_ID, { status: ProcurementStatus.Draft })
      expect(drafts.every(o => o.status === ProcurementStatus.Draft)).toBe(true)
    })

    it('正例: 按关键字搜索', () => {
      const result = svc.listOrders(TENANT_ID, { search: '华强' })
      expect(result.every(o => o.supplierName.includes('华强') || o.orderNo.includes('华强'))).toBe(true)
    })
  })

  // ════════════════════════════════════════════
  // deleteOrder
  // ════════════════════════════════════════════

  describe('deleteOrder', () => {
    it('正例: 删除草稿状态订单', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-DEL', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'X', sku: 'X', quantity: 1, unitPrice: 1 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      expect(() => svc.deleteOrder(order.id, TENANT_ID)).not.toThrow()
    })

    it('反例: 删除非草稿状态抛异常', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-NO', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'Y', sku: 'Y', quantity: 1, unitPrice: 1 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      svc.updateOrderStatus(order.id, ProcurementStatus.PendingApproval, TENANT_ID)
      expect(() => svc.deleteOrder(order.id, TENANT_ID)).toThrow('Only draft or cancelled')
    })
  })

  // ════════════════════════════════════════════
  // updateOrderStatus
  // ════════════════════════════════════════════

  describe('updateOrderStatus', () => {
    it('正例: 状态流转正确', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-STATUS', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'Z', sku: 'Z', quantity: 1, unitPrice: 1 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      svc.updateOrderStatus(order.id, ProcurementStatus.PendingApproval, TENANT_ID)
      svc.updateOrderStatus(order.id, ProcurementStatus.Approved, TENANT_ID)
      const o = svc.getOrder(order.id, TENANT_ID)!
      expect(o.status).toBe(ProcurementStatus.Approved)
    })

    it('反例: 非法状态流转抛异常', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-BAD', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'W', sku: 'W', quantity: 1, unitPrice: 1 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      expect(() =>
        svc.updateOrderStatus(order.id, ProcurementStatus.Received, TENANT_ID),
      ).toThrow('Invalid procurement status')
    })
  })

  // ════════════════════════════════════════════
  // receiveItems
  // ════════════════════════════════════════════

  describe('receiveItems', () => {
    it('正例: 部分收货', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-RCV', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'ItemA', sku: 'A', quantity: 100, unitPrice: 1 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      svc.updateOrderStatus(order.id, ProcurementStatus.Approved, TENANT_ID)
      svc.updateOrderStatus(order.id, ProcurementStatus.Shipped, TENANT_ID)
      const received = svc.receiveItems(order.id, [{ itemId: order.items[0].id, receivedQuantity: 50 }], TENANT_ID)
      expect(received.status).toBe(ProcurementStatus.Partial)
    })

    it('正例: 全部收货', () => {
      const order = svc.createOrder({
        tenantId: TENANT_ID, orderNo: 'PO-FULL', supplierId: 's-001',
        supplierName: 'S1',
        items: [{ name: 'ItemB', sku: 'B', quantity: 100, unitPrice: 1 }],
        orderedAt: new Date().toISOString(),
        expectedAt: new Date().toISOString(),
      })
      svc.updateOrderStatus(order.id, ProcurementStatus.Approved, TENANT_ID)
      svc.updateOrderStatus(order.id, ProcurementStatus.Shipped, TENANT_ID)
      const received = svc.receiveItems(order.id, [{ itemId: order.items[0].id, receivedQuantity: 100 }], TENANT_ID)
      expect(received.status).toBe(ProcurementStatus.Received)
    })
  })

  // ════════════════════════════════════════════
  // Query helpers
  // ════════════════════════════════════════════

  describe('getOrdersBySupplier', () => {
    it('正例: 按供应商查询', () => {
      const orders = svc.getOrdersBySupplier('supplier-001', TENANT_ID)
      expect(orders.every(o => o.supplierId === 'supplier-001')).toBe(true)
    })
  })

  describe('getOverdueOrders', () => {
    it('正例: 查询逾期订单', () => {
      const overdue = svc.getOverdueOrders(TENANT_ID)
      expect(overdue.every(o => o.expectedAt < new Date().toISOString())).toBe(true)
    })
  })
})
