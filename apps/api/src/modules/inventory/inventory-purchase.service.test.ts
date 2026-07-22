import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import { InventoryPurchaseService } from './inventory-purchase.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { PurchaseOrderStatus } from './inventory-purchase.entity'

const tenantCtx: RequestTenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001',
}

const otherTenant: RequestTenantContext = {
  tenantId: 'tenant-002',
  brandId: 'brand-002',
  storeId: 'store-002',
}

function setupProduct(inventory: InventoryService): string {
  return inventory.createProduct(tenantCtx, { name: '测试商品', sku: 'SKU-PO-001', unit: 'pcs', price: 100, cost: 50, minStock: 5, maxStock: 100, currentStock: 50 }).id
}

describe('InventoryPurchaseService', () => {
  let inventory: InventoryService
  let service: InventoryPurchaseService

  beforeEach(() => {
    resetInventoryServiceTestState()
    inventory = new InventoryService()
    service = new InventoryPurchaseService(inventory)
  })

  describe('createPurchaseOrder', () => {
    it('should create a draft PO with generated id', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, {
        supplierId: 'sup-001',
        items: [{ productId: prodId, productName: '测试', sku: 'S1', quantity: 10, unitPrice: 100 }],
      })
      expect(po.id).toBeTruthy()
      expect(po.status).toBe(PurchaseOrderStatus.Draft)
      expect(po.items).toHaveLength(1)
    })

    it('should throw on empty items', () => {
      expect(() => service.createPurchaseOrder(tenantCtx, { items: [] }))
        .toThrow('must have at least one item')
    })

    it('should throw on negative unit price', () => {
      const prodId = setupProduct(inventory)
      expect(() => service.createPurchaseOrder(tenantCtx, {
        items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 1, unitPrice: -5 }],
      })).toThrow('quantity must be > 0')
    })

    it('should throw on zero quantity', () => {
      const prodId = setupProduct(inventory)
      expect(() => service.createPurchaseOrder(tenantCtx, {
        items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 0, unitPrice: 100 }],
      })).toThrow('quantity must be > 0')
    })

    it('should calculate total amount from items', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, {
        supplierId: 'sup-001',
        items: [
          { productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 },
          { productId: prodId, productName: 'A', sku: 'S1', quantity: 3, unitPrice: 200 },
        ],
      })
      expect(po.totalAmount).toBe(1100)
    })
  })

  describe('getPurchaseOrder', () => {
    it('should get PO by id', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, {
        items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }],
      })
      const fetched = service.getPurchaseOrder(po.id, tenantCtx)
      expect(fetched.id).toBe(po.id)
    })

    it('should throw on non-existent PO', () => {
      expect(() => service.getPurchaseOrder('nonexistent', tenantCtx)).toThrow('not found')
    })

    it('should enforce tenant isolation', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, {
        items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }],
      })
      expect(() => service.getPurchaseOrder(po.id, otherTenant)).toThrow('not found')
    })
  })

  describe('listPurchaseOrders', () => {
    it('should list all POs for a tenant', () => {
      const prodId = setupProduct(inventory)
      service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'B', sku: 'S2', quantity: 3, unitPrice: 200 }] })
      const list = service.listPurchaseOrders(tenantCtx)
      expect(list).toHaveLength(2)
    })

    it('should not return other tenant POs', () => {
      const prodId = setupProduct(inventory)
      service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      const list = service.listPurchaseOrders(otherTenant)
      expect(list).toHaveLength(0)
    })

    it('should filter by status', () => {
      const prodId = setupProduct(inventory)
      service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      const drafts = service.listPurchaseOrders(tenantCtx, { status: PurchaseOrderStatus.Draft })
      expect(drafts).toHaveLength(1)
      const approved = service.listPurchaseOrders(tenantCtx, { status: PurchaseOrderStatus.Approved })
      expect(approved).toHaveLength(0)
    })
  })

  describe('submitForApproval', () => {
    it('should change status to PendingApproval', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      const submitted = service.submitForApproval(po.id, tenantCtx)
      expect(submitted.status).toBe(PurchaseOrderStatus.PendingApproval)
    })

    it('should throw if submitting non-draft', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      service.submitForApproval(po.id, tenantCtx)
      expect(() => service.submitForApproval(po.id, tenantCtx)).toThrow(/cannot be submitted|status/i)
    })
  })

  describe('approvePurchaseOrder', () => {
    it('should approve with approver info', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      service.submitForApproval(po.id, tenantCtx)
      const result = service.approvePurchaseOrder(po.id, tenantCtx, { approverId: 'user-1', approverName: 'Admin', comment: 'OK' })
      expect(result.success).toBe(true)
      expect(result.order.status).toBe(PurchaseOrderStatus.Approved)
    })
  })

  describe('rejectPurchaseOrder', () => {
    it('should reject with reason', () => {
      const prodId = setupProduct(inventory)
      const po = service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      service.submitForApproval(po.id, tenantCtx)
      const result = service.rejectPurchaseOrder(po.id, tenantCtx, { approverId: 'user-2', approverName: 'Manager', comment: 'Budget limit' })
      expect(result.order.status).toBe(PurchaseOrderStatus.Rejected)
      expect(result.success).toBe(true)
    })
  })

  describe('suppliers', () => {
    it('should create and list suppliers', () => {
      const sup = service.createSupplier(tenantCtx, { code: 'SUP-001', name: '供应商A', contactName: '张三', phone: '13800138000' })
      expect(sup.id).toBeTruthy()
      const list = service.listSuppliers(tenantCtx)
      expect(list).toHaveLength(1)
    })

    it('should get supplier by id', () => {
      const sup = service.createSupplier(tenantCtx, { code: 'SUP-002', name: '供应商B', contactName: '李四' })
      const fetched = service.getSupplier(sup.id, tenantCtx)
      expect(fetched!.name).toBe('供应商B')
    })

    it('should enforce tenant isolation on suppliers', () => {
      service.createSupplier(tenantCtx, { code: 'SUP-003', name: '供应商A', contactName: '张三' })
      const list = service.listSuppliers(otherTenant)
      expect(list).toHaveLength(0)
    })
  })

  describe('getPurchaseStats', () => {
    it('should return correct statistics', () => {
      const prodId = setupProduct(inventory)
      service.createPurchaseOrder(tenantCtx, { items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 5, unitPrice: 100 }] })
      const stats = service.getPurchaseStats(tenantCtx)
      expect(stats.totalOrders).toBe(1)
      expect(stats.totalAmount).toBe(500)
    })
  })
})
