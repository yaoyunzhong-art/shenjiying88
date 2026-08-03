import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import { PurchaseOrderService, InventoryCheckService, CrossStoreTransferService, resetInventoryMgmtTestState, StockCheckStatus, TransferStatus } from './inventory-mgmt.service'
import { ProductStatus, PurchaseOrderStatus } from './inventory.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const tenantCtx: RequestTenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001',
}

const otherTenantCtx: RequestTenantContext = {
  tenantId: 'tenant-002',
  brandId: 'brand-002',
  storeId: 'store-002',
}

function setupProduct(inventory: InventoryService): string {
  const p = inventory.createProduct(tenantCtx, {
    name: '测试商品',
    sku: 'SKU-TEST-001',
    unit: 'pcs',
    price: 100,
    cost: 50,
    minStock: 5,
    maxStock: 100,
    currentStock: 50,
  })
  return p.id
}

describe('PurchaseOrderService', () => {
  let inventory: InventoryService
  let poService: PurchaseOrderService

  beforeEach(() => {
    resetInventoryServiceTestState()
    resetInventoryMgmtTestState()
    inventory = new InventoryService()
    poService = new PurchaseOrderService(inventory)
  })

  it('should create a purchase order', () => {
    const prodId = setupProduct(inventory)
    const po = poService.createPurchaseOrder(tenantCtx, [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 10, unitPrice: 80 },
    ], 'supplier-001', 'store-001')
    expect(po.id).toBeTruthy()
    expect(po.totalAmount).toBe(800)
    expect(po.status).toBe(PurchaseOrderStatus.Confirmed)
  })

  it('should create PO with multiple items', () => {
    const p1 = setupProduct(inventory)
    const p2 = inventory.createProduct(tenantCtx, {
      name: '商品B', sku: 'SKU-B', unit: 'pcs', price: 200, cost: 100,
      minStock: 2, maxStock: 50, currentStock: 20,
    })
    const po = poService.createPurchaseOrder(tenantCtx, [
      { productId: p1, productName: 'A', sku: 'SKU-TEST-001', quantity: 5, unitPrice: 80 },
      { productId: p2.id, productName: 'B', sku: 'SKU-B', quantity: 3, unitPrice: 150 },
    ])
    expect(po.totalAmount).toBe(850)
    expect(po.items).toHaveLength(2)
  })

  it('should receive PO and create stock records', () => {
    const prodId = setupProduct(inventory)
    const po = poService.createPurchaseOrder(tenantCtx, [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 10, unitPrice: 80 },
    ])
    const result = poService.receivePO(po.id, [{ productId: prodId, quantity: 10 }], tenantCtx)
    expect(result.stockRecords).toHaveLength(1)
    expect(result.purchaseOrder.status).toBe(PurchaseOrderStatus.Received)
  })

  it('should throw on receiving non-existent PO', () => {
    expect(() => poService.receivePO('nonexistent', [{ productId: 'p1', quantity: 5 }], tenantCtx))
      .toThrow('not found or not confirmed')
  })

  it('should cancel a PO', () => {
    const prodId = setupProduct(inventory)
    const po = poService.createPurchaseOrder(tenantCtx, [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 5, unitPrice: 80 },
    ])
    const cancelled = poService.cancelPO(po.id, tenantCtx)
    expect(cancelled.status).toBe(PurchaseOrderStatus.Cancelled)
  })

  it('should throw when cancelling non-existent PO', () => {
    expect(() => poService.cancelPO('ghost-po', tenantCtx)).toThrow('not found')
  })

  it('should throw when cancelling received PO', () => {
    const prodId = setupProduct(inventory)
    const po = poService.createPurchaseOrder(tenantCtx, [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 5, unitPrice: 80 },
    ])
    poService.receivePO(po.id, [{ productId: prodId, quantity: 5 }], tenantCtx)
    expect(() => poService.cancelPO(po.id, tenantCtx)).toThrow('Cannot cancel received')
  })

  it('should get PO by id', () => {
    const prodId = setupProduct(inventory)
    const po = poService.createPurchaseOrder(tenantCtx, [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 3, unitPrice: 80 },
    ])
    const fetched = poService.getPO(po.id, tenantCtx)
    expect(fetched.id).toBe(po.id)
  })

  it('should throw on getting non-existent PO', () => {
    expect(() => poService.getPO('no-such-po', tenantCtx)).toThrow('not found')
  })

  it('should list POs by tenant', () => {
    const prodId = setupProduct(inventory)
    poService.createPurchaseOrder(tenantCtx, [{ productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 5, unitPrice: 80 }])
    const list = poService.listPOs(tenantCtx)
    expect(list.length).toBeGreaterThan(0)
  })

  it('should filter POs by status', () => {
    const prodId = setupProduct(inventory)
    poService.createPurchaseOrder(tenantCtx, [{ productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 5, unitPrice: 80 }])
    const confirmed = poService.listPOs(tenantCtx, PurchaseOrderStatus.Confirmed)
    expect(confirmed.length).toBeGreaterThan(0)
    const submitted = poService.listPOs(tenantCtx, PurchaseOrderStatus.Submitted)
    expect(submitted).toHaveLength(0)
  })
})

describe('InventoryCheckService', () => {
  let inventory: InventoryService
  let checkService: InventoryCheckService

  beforeEach(() => {
    resetInventoryServiceTestState()
    resetInventoryMgmtTestState()
    inventory = new InventoryService()
    checkService = new InventoryCheckService(inventory)
  })

  it('should start a stock check', () => {
    setupProduct(inventory)
    const check = checkService.startCheck(tenantCtx, 'store-001')
    expect(check.status).toBe(StockCheckStatus.InProgress)
    expect(check.items.length).toBeGreaterThan(0)
  })

  it('should record counts for items', () => {
    const prodId = setupProduct(inventory)
    const check = checkService.startCheck(tenantCtx, 'store-001')
    const updated = checkService.recordCount(check.id, prodId, 45, tenantCtx)
    const item = updated.items.find((i) => i.productId === prodId)
    expect(item!.actualQty).toBe(45)
    expect(item!.discrepancy).toBe(-5)
  })

  it('should throw on recording count for non-existent item', () => {
    const check = checkService.startCheck(tenantCtx, 'store-001')
    expect(() => checkService.recordCount(check.id, 'ghost-product', 10, tenantCtx))
      .toThrow('not found in stock check')
  })

  it('should throw when recording count for completed check', () => {
    const prodId = setupProduct(inventory)
    const check = checkService.startCheck(tenantCtx, 'store-001')
    checkService.recordCount(check.id, prodId, 45, tenantCtx)
    const submitted = checkService.submitCheck(check.id, tenantCtx)
    expect(() => checkService.recordCount(submitted.id, prodId, 50, tenantCtx))
      .toThrow('is not in progress')
  })

  it('should submit a stock check', () => {
    const prodId = setupProduct(inventory)
    const check = checkService.startCheck(tenantCtx, 'store-001')
    checkService.recordCount(check.id, prodId, 48, tenantCtx)
    const submitted = checkService.submitCheck(check.id, tenantCtx)
    expect(submitted.status).toBe(StockCheckStatus.Submitted)
    expect(submitted.submittedAt).toBeTruthy()
  })

  it('should throw on submitting non-in-progress check', () => {
    expect(() => checkService.submitCheck('no-such', tenantCtx)).toThrow('not found')
  })

  it('should calculate discrepancies', () => {
    const prodId = setupProduct(inventory)
    const check = checkService.startCheck(tenantCtx, 'store-001')
    checkService.recordCount(check.id, prodId, 55, tenantCtx)
    const discrepancies = checkService.calculateDiscrepancy(check.id, tenantCtx)
    const item = discrepancies.find((i) => i.productId === prodId)
    expect(item!.discrepancy).toBe(5)
  })

  it('should adjust stock from discrepancies', () => {
    const prodId = setupProduct(inventory)
    const check = checkService.startCheck(tenantCtx, 'store-001')
    checkService.recordCount(check.id, prodId, 55, tenantCtx)
    checkService.submitCheck(check.id, tenantCtx)
    const results = checkService.adjustStock(check.id, [{ productId: prodId, adjustQty: 5 }], tenantCtx)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].product.currentStock).toBe(55)
  })

  it('should get check by id', () => {
    setupProduct(inventory)
    const check = checkService.startCheck(tenantCtx, 'store-001')
    const fetched = checkService.getCheck(check.id, tenantCtx)
    expect(fetched.id).toBe(check.id)
  })

  it('should list checks by tenant isolation', () => {
    setupProduct(inventory)
    checkService.startCheck(tenantCtx, 'store-001')
    const list = checkService.listChecks(tenantCtx)
    expect(list.length).toBe(1)
    const otherList = checkService.listChecks(otherTenantCtx)
    expect(otherList).toHaveLength(0)
  })
})

describe('CrossStoreTransferService', () => {
  let inventory: InventoryService
  let transferService: CrossStoreTransferService

  beforeEach(() => {
    resetInventoryServiceTestState()
    resetInventoryMgmtTestState()
    inventory = new InventoryService()
    transferService = new CrossStoreTransferService(inventory)
  })

  it('should request a transfer between stores', () => {
    const prodId = setupProduct(inventory)
    const transfer = transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 10, unitCost: 50 },
    ])
    expect(transfer.status).toBe(TransferStatus.Pending)
    expect(transfer.fromStoreId).toBe('store-001')
    expect(transfer.toStoreId).toBe('store-002')
  })

  it('should throw when fromStore equals toStore', () => {
    expect(() => transferService.requestTransfer(tenantCtx, 'store-001', 'store-001', []))
      .toThrow('must be different')
  })

  it('should throw on insufficient stock', () => {
    const prodId = setupProduct(inventory)
    expect(() => transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 999, unitCost: 50 },
    ])).toThrow('Insufficient stock')
  })

  it('should approve a transfer', () => {
    const prodId = setupProduct(inventory)
    const transfer = transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 10, unitCost: 50 },
    ])
    const approved = transferService.approveTransfer(transfer.id, tenantCtx)
    expect(approved.status).toBe(TransferStatus.Approved)
  })

  it('should reject a transfer with reason', () => {
    const prodId = setupProduct(inventory)
    const transfer = transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: '测试商品', sku: 'SKU-TEST-001', quantity: 10, unitCost: 50 },
    ])
    const rejected = transferService.rejectTransfer(transfer.id, '库存不足', tenantCtx)
    expect(rejected.status).toBe(TransferStatus.Rejected)
    expect(rejected.rejectReason).toBe('库存不足')
  })

  it('should execute (outbound) an approved transfer', () => {
    const prodId = setupProduct(inventory)
    const transfer = transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 10, unitCost: 50 },
    ])
    transferService.approveTransfer(transfer.id, tenantCtx)
    const executed = transferService.executeTransfer(transfer.id, tenantCtx)
    expect(executed.status).toBe(TransferStatus.Outbound)
    const product = inventory.getProduct(prodId, tenantCtx)
    expect(product.currentStock).toBe(40) // 50 - 10
  })

  it('should receive (inbound) after outbound', () => {
    const prodId = setupProduct(inventory)
    const transfer = transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 10, unitCost: 50 },
    ])
    transferService.approveTransfer(transfer.id, tenantCtx)
    transferService.executeTransfer(transfer.id, tenantCtx)
    const received = transferService.receiveTransfer(transfer.id, tenantCtx)
    expect(received.status).toBe(TransferStatus.Inbound)
  })

  it('should calculate transfer cost', () => {
    const prodId = setupProduct(inventory)
    const transfer = transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 10, unitCost: 50 },
    ])
    const cost = transferService.calculateTransferCost(transfer.id, tenantCtx)
    expect(cost.freight).toBeGreaterThan(0)
    expect(cost.laborTotal).toBeGreaterThan(0)
    expect(cost.total).toBe(cost.freight + cost.lossAmount + cost.laborTotal)
  })

  it('should complete a transfer with cost', () => {
    const prodId = setupProduct(inventory)
    const transfer = transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 10, unitCost: 50 },
    ])
    transferService.approveTransfer(transfer.id, tenantCtx)
    transferService.executeTransfer(transfer.id, tenantCtx)
    transferService.receiveTransfer(transfer.id, tenantCtx)
    const completed = transferService.completeTransfer(transfer.id, tenantCtx)
    expect(completed.status).toBe(TransferStatus.Completed)
    expect(completed.costBreakdown).toBeTruthy()
  })

  it('should list transfers with tenant isolation', () => {
    const prodId = setupProduct(inventory)
    transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 5, unitCost: 50 },
    ])
    expect(transferService.listTransfers(tenantCtx)).toHaveLength(1)
    expect(transferService.listTransfers(otherTenantCtx)).toHaveLength(0)
  })

  it('should filter transfers by status', () => {
    const prodId = setupProduct(inventory)
    transferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
      { productId: prodId, productName: 'A', sku: 'SKU-TEST-001', quantity: 5, unitCost: 50 },
    ])
    expect(transferService.listTransfers(tenantCtx, TransferStatus.Pending)).toHaveLength(1)
    expect(transferService.listTransfers(tenantCtx, TransferStatus.Completed)).toHaveLength(0)
  })
})
