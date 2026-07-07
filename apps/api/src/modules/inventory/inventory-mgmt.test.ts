import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ProductStatus, StockRecordType, PurchaseOrderStatus } from './inventory.entity'
import {
  PurchaseOrderService,
  InventoryCheckService,
  CrossStoreTransferService,
  StockCheckStatus,
  TransferStatus,
  resetInventoryMgmtTestState
} from './inventory-mgmt.service'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'

const tenantCtx = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001'
}

describe('PurchaseOrderService', () => {
  let inventoryService: InventoryService
  let purchaseOrderService: PurchaseOrderService

  beforeEach(() => {
    resetInventoryServiceTestState()
    resetInventoryMgmtTestState()
    inventoryService = new InventoryService()
    purchaseOrderService = new PurchaseOrderService(inventoryService)
  })

  describe('createPurchaseOrder', () => {
    it('should create purchase order with draft status', () => {
      const items = [
        { productId: 'p-1', productName: 'Ball', sku: 'B-1', quantity: 10, unitPrice: 15 }
      ]
      const po = purchaseOrderService.createPurchaseOrder(tenantCtx, items, 'supplier-1', 'store-001')

      assert.ok(po.id.startsWith('po-'))
      assert.equal(po.status, PurchaseOrderStatus.Draft)
      assert.equal(po.items.length, 1)
      assert.equal(po.items[0].quantity, 10)
      assert.equal(po.items[0].totalPrice, 150)
      assert.equal(po.supplierId, 'supplier-1')
      assert.equal(po.totalAmount, 150)
    })

    it('should calculate total amount correctly for multiple items', () => {
      const items = [
        { productId: 'p-1', productName: 'Ball', sku: 'B-1', quantity: 10, unitPrice: 15 },
        { productId: 'p-2', productName: 'Doll', sku: 'D-1', quantity: 5, unitPrice: 20 }
      ]
      const po = purchaseOrderService.createPurchaseOrder(tenantCtx, items)

      assert.equal(po.totalAmount, 10 * 15 + 5 * 20)
    })
  })

  describe('receivePO', () => {
    it('should receive PO and increase inventory', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 0
      })

      const po = purchaseOrderService.createPurchaseOrder(tenantCtx, [
        { productId: product.id, productName: product.name, sku: product.sku, quantity: 20, unitPrice: 50 }
      ])

      inventoryService.confirmOrder(po.id, tenantCtx)

      const { purchaseOrder, stockRecords } = purchaseOrderService.receivePO(
        po.id,
        [{ productId: product.id, quantity: 20 }],
        tenantCtx
      )

      assert.equal(purchaseOrder.status, PurchaseOrderStatus.Received)
      assert.ok(purchaseOrder.receivedAt)
      assert.equal(stockRecords.length, 1)

      const updatedProduct = inventoryService.getProduct(product.id, tenantCtx)
      assert.equal(updatedProduct.currentStock, 20)
    })
  })

  describe('cancelPO', () => {
    it('should cancel draft purchase order', () => {
      const po = purchaseOrderService.createPurchaseOrder(tenantCtx, [
        { productId: 'p-1', productName: 'Ball', sku: 'B-1', quantity: 10, unitPrice: 15 }
      ])

      const cancelled = purchaseOrderService.cancelPO(po.id, tenantCtx)

      assert.equal(cancelled.status, PurchaseOrderStatus.Cancelled)
    })
  })

  describe('getPO', () => {
    it('should get purchase order by id', () => {
      const po = purchaseOrderService.createPurchaseOrder(tenantCtx, [
        { productId: 'p-1', productName: 'Ball', sku: 'B-1', quantity: 10, unitPrice: 15 }
      ])

      const found = purchaseOrderService.getPO(po.id, tenantCtx)

      assert.equal(found.id, po.id)
      assert.equal(found.status, PurchaseOrderStatus.Draft)
    })
  })

  describe('listPOs', () => {
    it('should list purchase orders', () => {
      purchaseOrderService.createPurchaseOrder(tenantCtx, [
        { productId: 'p-1', productName: 'Ball', sku: 'B-1', quantity: 10, unitPrice: 15 }
      ])
      purchaseOrderService.createPurchaseOrder(tenantCtx, [
        { productId: 'p-2', productName: 'Doll', sku: 'D-1', quantity: 5, unitPrice: 20 }
      ])

      const pos = purchaseOrderService.listPOs(tenantCtx)

      assert.equal(pos.length, 2)
    })

    it('should list purchase orders filtered by status', () => {
      const po1 = purchaseOrderService.createPurchaseOrder(tenantCtx, [
        { productId: 'p-1', productName: 'Ball', sku: 'B-1', quantity: 10, unitPrice: 15 }
      ])
      purchaseOrderService.createPurchaseOrder(tenantCtx, [
        { productId: 'p-2', productName: 'Doll', sku: 'D-1', quantity: 5, unitPrice: 20 }
      ])

      inventoryService.confirmOrder(po1.id, tenantCtx)

      const draftPos = purchaseOrderService.listPOs(tenantCtx, PurchaseOrderStatus.Draft)
      const confirmedPos = purchaseOrderService.listPOs(tenantCtx, PurchaseOrderStatus.Confirmed)

      assert.equal(draftPos.length, 1)
      assert.equal(confirmedPos.length, 1)
    })
  })
})

describe('InventoryCheckService', () => {
  let inventoryService: InventoryService
  let inventoryCheckService: InventoryCheckService

  beforeEach(() => {
    resetInventoryServiceTestState()
    resetInventoryMgmtTestState()
    inventoryService = new InventoryService()
    inventoryCheckService = new InventoryCheckService(inventoryService)
  })

  describe('startCheck', () => {
    it('should start stock check with products', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const check = inventoryCheckService.startCheck(tenantCtx, 'store-001')

      assert.ok(check.id.startsWith('sc-'))
      assert.equal(check.status, StockCheckStatus.InProgress)
      assert.equal(check.items.length, 1)
      assert.equal(check.items[0].systemQty, 50)
    })
  })

  describe('recordCount', () => {
    it('should record actual quantity and calculate discrepancy', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const check = inventoryCheckService.startCheck(tenantCtx, 'store-001')
      const updated = inventoryCheckService.recordCount(check.id, product.id, 45, tenantCtx)

      const item = updated.items.find((i) => i.productId === product.id)
      assert.equal(item?.actualQty, 45)
      assert.equal(item?.discrepancy, -5)
    })
  })

  describe('submitCheck', () => {
    it('should submit stock check', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const check = inventoryCheckService.startCheck(tenantCtx, 'store-001')
      inventoryCheckService.recordCount(check.id, product.id, 45, tenantCtx)

      const submitted = inventoryCheckService.submitCheck(check.id, tenantCtx)

      assert.equal(submitted.status, StockCheckStatus.Submitted)
      assert.ok(submitted.submittedAt)
    })
  })

  describe('calculateDiscrepancy', () => {
    it('should calculate discrepancies', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const check = inventoryCheckService.startCheck(tenantCtx, 'store-001')
      inventoryCheckService.recordCount(check.id, product.id, 48, tenantCtx)

      const discrepancies = inventoryCheckService.calculateDiscrepancy(check.id, tenantCtx)

      assert.equal(discrepancies[0].discrepancy, -2)
    })
  })

  describe('adjustStock', () => {
    it('should adjust stock based on discrepancies', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const check = inventoryCheckService.startCheck(tenantCtx, 'store-001')
      inventoryCheckService.recordCount(check.id, product.id, 48, tenantCtx)
      inventoryCheckService.submitCheck(check.id, tenantCtx)

      const results = inventoryCheckService.adjustStock(
        check.id,
        [{ productId: product.id, adjustQty: -2 }],
        tenantCtx
      )

      assert.equal(results.length, 1)
      assert.equal(results[0].product.currentStock, 48)
      assert.equal(results[0].record.type, StockRecordType.Adjustment)

      const finalCheck = inventoryCheckService.getCheck(check.id, tenantCtx)
      assert.equal(finalCheck.status, StockCheckStatus.Completed)
    })
  })

  describe('getCheck', () => {
    it('should get stock check by id', () => {
      const check = inventoryCheckService.startCheck(tenantCtx, 'store-001')
      const found = inventoryCheckService.getCheck(check.id, tenantCtx)

      assert.equal(found.id, check.id)
    })
  })

  describe('listChecks', () => {
    it('should list stock checks', () => {
      inventoryCheckService.startCheck(tenantCtx, 'store-001')
      inventoryCheckService.startCheck(tenantCtx, 'store-001')

      const checks = inventoryCheckService.listChecks(tenantCtx)

      assert.equal(checks.length, 2)
    })
  })
})

describe('CrossStoreTransferService', () => {
  let inventoryService: InventoryService
  let crossStoreTransferService: CrossStoreTransferService

  beforeEach(() => {
    resetInventoryServiceTestState()
    resetInventoryMgmtTestState()
    inventoryService = new InventoryService()
    crossStoreTransferService = new CrossStoreTransferService(inventoryService)
  })

  describe('requestTransfer', () => {
    it('should create transfer request', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer = crossStoreTransferService.requestTransfer(
        tenantCtx,
        'store-001',
        'store-002',
        [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitCost: 50
          }
        ]
      )

      assert.ok(transfer.id.startsWith('xfer-'))
      assert.equal(transfer.status, TransferStatus.Pending)
      assert.equal(transfer.items.length, 1)
      assert.equal(transfer.totalAmount, 500)
    })

    it('should throw when stores are the same', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      assert.throws(
        () =>
          crossStoreTransferService.requestTransfer(
            tenantCtx,
            'store-001',
            'store-001',
            [
              {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: 10,
                unitCost: 50
              }
            ]
          ),
        /Source and destination stores must be different/
      )
    })
  })

  describe('approveTransfer', () => {
    it('should approve pending transfer', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer = crossStoreTransferService.requestTransfer(
        tenantCtx,
        'store-001',
        'store-002',
        [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitCost: 50
          }
        ]
      )

      const approved = crossStoreTransferService.approveTransfer(transfer.id, tenantCtx)

      assert.equal(approved.status, TransferStatus.Approved)
      assert.ok(approved.approvedAt)
    })
  })

  describe('rejectTransfer', () => {
    it('should reject transfer and keep inventory unchanged', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer = crossStoreTransferService.requestTransfer(
        tenantCtx,
        'store-001',
        'store-002',
        [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitCost: 50
          }
        ]
      )

      const rejected = crossStoreTransferService.rejectTransfer(
        transfer.id,
        'Insufficient budget',
        tenantCtx
      )

      assert.equal(rejected.status, TransferStatus.Rejected)
      assert.equal(rejected.rejectReason, 'Insufficient budget')

      const unchangedProduct = inventoryService.getProduct(product.id, tenantCtx)
      assert.equal(unchangedProduct.currentStock, 50)
    })
  })

  describe('executeTransfer', () => {
    it('should execute outbound and decrease inventory', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer = crossStoreTransferService.requestTransfer(
        tenantCtx,
        'store-001',
        'store-002',
        [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitCost: 50
          }
        ]
      )

      crossStoreTransferService.approveTransfer(transfer.id, tenantCtx)
      const outbound = crossStoreTransferService.executeTransfer(transfer.id, tenantCtx)

      assert.equal(outbound.status, TransferStatus.Outbound)
      assert.ok(outbound.outboundAt)

      const updatedProduct = inventoryService.getProduct(product.id, tenantCtx)
      assert.equal(updatedProduct.currentStock, 40)
    })
  })

  describe('receiveTransfer', () => {
    it('should receive inbound and increase inventory', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer = crossStoreTransferService.requestTransfer(
        tenantCtx,
        'store-001',
        'store-002',
        [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitCost: 50
          }
        ]
      )

      crossStoreTransferService.approveTransfer(transfer.id, tenantCtx)
      crossStoreTransferService.executeTransfer(transfer.id, tenantCtx)

      const inbound = crossStoreTransferService.receiveTransfer(transfer.id, tenantCtx)

      assert.equal(inbound.status, TransferStatus.Inbound)
      assert.ok(inbound.inboundAt)
    })
  })

  describe('calculateTransferCost', () => {
    it('should calculate transfer cost including freight + loss + labor', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer = crossStoreTransferService.requestTransfer(
        tenantCtx,
        'store-001',
        'store-002',
        [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitCost: 50
          }
        ]
      )

      const cost = crossStoreTransferService.calculateTransferCost(transfer.id, tenantCtx)

      assert.equal(cost.freight, 50)
      assert.equal(cost.lossRatio, 0.005)
      assert.equal(cost.lossAmount, 3)
      assert.equal(cost.laborPerUnit, 2)
      assert.equal(cost.laborTotal, 20)
      assert.equal(cost.total, 73)
    })
  })

  describe('completeTransfer', () => {
    it('should complete transfer workflow', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer = crossStoreTransferService.requestTransfer(
        tenantCtx,
        'store-001',
        'store-002',
        [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitCost: 50
          }
        ]
      )

      crossStoreTransferService.approveTransfer(transfer.id, tenantCtx)
      crossStoreTransferService.executeTransfer(transfer.id, tenantCtx)
      crossStoreTransferService.receiveTransfer(transfer.id, tenantCtx)

      const completed = crossStoreTransferService.completeTransfer(transfer.id, tenantCtx)

      assert.equal(completed.status, TransferStatus.Completed)
      assert.ok(completed.completedAt)
      assert.ok(completed.costBreakdown)
    })
  })

  describe('listTransfers', () => {
    it('should list transfers', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      crossStoreTransferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
        { productId: product.id, productName: product.name, sku: product.sku, quantity: 10, unitCost: 50 }
      ])
      crossStoreTransferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
        { productId: product.id, productName: product.name, sku: product.sku, quantity: 5, unitCost: 50 }
      ])

      const transfers = crossStoreTransferService.listTransfers(tenantCtx)

      assert.equal(transfers.length, 2)
    })

    it('should list transfers filtered by status', () => {
      const product = inventoryService.createProduct(tenantCtx, {
        name: 'Test Product',
        sku: 'TP-1',
        unit: 'pcs',
        price: 100,
        cost: 50,
        minStock: 0,
        maxStock: 100,
        currentStock: 50
      })

      const transfer1 = crossStoreTransferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
        { productId: product.id, productName: product.name, sku: product.sku, quantity: 10, unitCost: 50 }
      ])
      crossStoreTransferService.requestTransfer(tenantCtx, 'store-001', 'store-002', [
        { productId: product.id, productName: product.name, sku: product.sku, quantity: 5, unitCost: 50 }
      ])

      crossStoreTransferService.approveTransfer(transfer1.id, tenantCtx)

      const pendingTransfers = crossStoreTransferService.listTransfers(tenantCtx, TransferStatus.Pending)
      const approvedTransfers = crossStoreTransferService.listTransfers(tenantCtx, TransferStatus.Approved)

      assert.equal(pendingTransfers.length, 1)
      assert.equal(approvedTransfers.length, 1)
    })
  })
})
