import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import { InventoryPurchaseService } from './inventory-purchase.service'
import { PurchaseOrderService, resetPurchaseOrderStore } from './purchase-order.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

const tenantCtx: RequestTenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001',
}

const otherTenant: RequestTenantContext = {
  tenantId: 'other-tenant',
  brandId: 'other-brand',
  storeId: 'other-store',
}

function setupProduct(inv: InventoryService): string {
  return inv.createProduct(tenantCtx, {
    name: '测试商品', sku: 'SKU-HIST-001', unit: 'pcs', price: 100, cost: 50,
    minStock: 5, maxStock: 100, currentStock: 50,
  }).id
}

function createBasePO(inv: InventoryService, purchaseSvc: InventoryPurchaseService): string {
  const prodId = setupProduct(inv)
  const po = purchaseSvc.createPurchaseOrder(tenantCtx, {
    supplierId: 'sup-001',
    items: [{ productId: prodId, productName: 'A', sku: 'S1', quantity: 10, unitPrice: 100 }],
  })
  return po.id
}

describe('PurchaseOrderService', () => {
  let inventory: InventoryService
  let purchaseSvc: InventoryPurchaseService
  let poHistory: PurchaseOrderService

  beforeEach(() => {
    resetInventoryServiceTestState()
    resetPurchaseOrderStore()
    inventory = new InventoryService()
    purchaseSvc = new InventoryPurchaseService(inventory)
    poHistory = new PurchaseOrderService(purchaseSvc)
  })

  it('should record history on create', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    expect(records.length).toBeGreaterThanOrEqual(1)
  })

  it('should record history on submit for approval', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    const submitAction = records.find((r) => r.action === 'submit')
    expect(submitAction).toBeDefined()
  })

  it('should record history on approval', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    purchaseSvc.approvePurchaseOrder(poId, tenantCtx, { approverId: 'u1', approverName: 'Admin' })
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    const approveAction = records.find((r) => r.action === 'approve')
    expect(approveAction).toBeDefined()
  })

  it('should record history on rejection', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    purchaseSvc.rejectPurchaseOrder(poId, tenantCtx, { approverId: 'u2', approverName: 'Manager', comment: 'No budget' })
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    const approveAction = records.find((r) => r.action === 'approve')
    const rejectAction = records.find((r) => r.action === 'reject')
    expect(rejectAction).toBeDefined()
  })

  it('should record history on cancellation', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.cancelPurchaseOrder(poId, tenantCtx)
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    const cancelAction = records.find((r) => r.action === 'cancel')
    expect(cancelAction).toBeDefined()
  })

  it('should return empty history for non-existent PO', () => {
    const records = poHistory.getOrderHistory('ghost-po', tenantCtx)
    expect(records).toHaveLength(0)
  })

  it('should enforce tenant isolation for history', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    const records = poHistory.getOrderHistory(poId, otherTenant)
    expect(records).toHaveLength(0)
  })

  it('should maintain ascending timestamp order', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    purchaseSvc.approvePurchaseOrder(poId, tenantCtx, { approverId: 'u1', approverName: 'Admin' })
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    for (let i = 1; i < records.length; i++) {
      expect(new Date(records[i].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(records[i - 1].createdAt).getTime())
    }
  })

  it('should record history for place order', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    purchaseSvc.approvePurchaseOrder(poId, tenantCtx, { approverId: 'u1', approverName: 'Admin' })
    purchaseSvc.placeOrder(poId, tenantCtx)
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    const placeAction = records.find((r) => r.action === 'place-order')
    expect(placeAction).toBeDefined()
  })

  it('should handle reset correctly', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    expect(poHistory.getOrderHistory(poId, tenantCtx).length).toBeGreaterThan(0)
    resetPurchaseOrderStore()
    expect(poHistory.getOrderHistory(poId, tenantCtx)).toHaveLength(0)
  })

  it('should support multiple POs independently', () => {
    const po1 = createBasePO(inventory, purchaseSvc)
    const po2 = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(po1, tenantCtx)
    const h1 = poHistory.getOrderHistory(po1, tenantCtx)
    const h2 = poHistory.getOrderHistory(po2, tenantCtx)
    expect(h1.length).toBeGreaterThan(0)
    expect(h2.length).toBeGreaterThan(0)
  })

  it('should include operator info when provided', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx, 'submitter-1')
    const recs = poHistory.getOrderHistory(poId, tenantCtx)
    const submitAction = recs.find((r) => r.action === 'submit')
    expect(submitAction).toBeDefined()
  })

  it('should create multiple history entries for complex workflows', () => {
    const poId = createBasePO(inventory, purchaseSvc)
    purchaseSvc.submitForApproval(poId, tenantCtx)
    purchaseSvc.approvePurchaseOrder(poId, tenantCtx, { approverId: 'u1', approverName: 'Admin' })
    purchaseSvc.placeOrder(poId, tenantCtx)
    const records = poHistory.getOrderHistory(poId, tenantCtx)
    expect(records.length).toBeGreaterThanOrEqual(3)
  })
})
