import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ProductStatus,
  StockRecordType,
  PurchaseOrderStatus
} from './inventory.entity'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'

const tenantCtx = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001'
}

describe('InventoryService — Product CRUD', () => {
  beforeEach(() => resetInventoryServiceTestState())

  it('createProduct returns a product with generated id', () => {
    const svc = new InventoryService()
    const product = svc.createProduct(tenantCtx, {
      name: 'Bear Plush',
      sku: 'SKU-BP-001',
      unit: 'pcs',
      price: 99,
      cost: 50,
      minStock: 10,
      maxStock: 100,
      currentStock: 50
    })
    assert.ok(product.id.startsWith('prod-'))
    assert.equal(product.name, 'Bear Plush')
    assert.equal(product.status, ProductStatus.Active)
    assert.equal(product.tenantId, 'tenant-001')
  })

  it('createProduct respects optional status', () => {
    const svc = new InventoryService()
    const product = svc.createProduct(tenantCtx, {
      name: 'Old Toy',
      sku: 'OT-1',
      unit: 'pcs',
      price: 10,
      cost: 3,
      minStock: 0,
      maxStock: 50,
      currentStock: 5,
      status: ProductStatus.Discontinued
    })
    assert.equal(product.status, ProductStatus.Discontinued)
  })

  it('getProduct returns the created product', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Ball', sku: 'B-1', unit: 'pcs',
      price: 20, cost: 10, minStock: 5, maxStock: 50, currentStock: 30
    })
    const fetched = svc.getProduct(p.id, tenantCtx)
    assert.equal(fetched.id, p.id)
    assert.equal(fetched.name, 'Ball')
  })

  it('getProduct throws for non-existent product', () => {
    const svc = new InventoryService()
    assert.throws(
      () => svc.getProduct('nonexistent', tenantCtx),
      /not found/
    )
  })

  it('getProduct throws for product from different tenant', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Isolated', sku: 'ISO-1', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 50
    })
    assert.throws(
      () => svc.getProduct(p.id, { tenantId: 'tenant-OTHER' }),
      /not found/
    )
  })

  it('updateProduct modifies allowed fields', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Old Name', sku: 'SKU-OLD', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 20
    })
    const updated = svc.updateProduct(p.id, tenantCtx, {
      name: 'New Name',
      price: 25
    })
    assert.equal(updated.name, 'New Name')
    assert.equal(updated.price, 25)
    assert.equal(updated.sku, 'SKU-OLD') // unchanged
  })

  it('updateProduct throws for non-existent product', () => {
    const svc = new InventoryService()
    assert.throws(
      () => svc.updateProduct('nonexistent', tenantCtx, { name: 'X' }),
      /not found/
    )
  })

  it('listProducts returns all products for tenant', () => {
    const svc = new InventoryService()
    svc.createProduct(tenantCtx, {
      name: 'A', sku: 'A-1', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
    })
    svc.createProduct(tenantCtx, {
      name: 'B', sku: 'B-1', unit: 'pcs',
      price: 20, cost: 10, minStock: 0, maxStock: 100, currentStock: 20
    })
    const products = svc.listProducts(tenantCtx)
    assert.equal(products.length, 2)
  })

  it('listProducts filters by category', () => {
    const svc = new InventoryService()
    svc.createProduct(tenantCtx, {
      name: 'A', sku: 'A-1', category: 'toys', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
    })
    svc.createProduct(tenantCtx, {
      name: 'B', sku: 'B-1', category: 'food', unit: 'pcs',
      price: 20, cost: 10, minStock: 0, maxStock: 100, currentStock: 20
    })
    const toys = svc.listProducts(tenantCtx, { category: 'toys' })
    assert.equal(toys.length, 1)
    assert.equal(toys[0]?.name, 'A')
  })

  it('listProducts filters by keyword', () => {
    const svc = new InventoryService()
    svc.createProduct(tenantCtx, {
      name: 'Bear Plush', sku: 'SKU-BP', unit: 'pcs',
      price: 99, cost: 50, minStock: 10, maxStock: 100, currentStock: 50
    })
    svc.createProduct(tenantCtx, {
      name: 'Dinosaur', sku: 'SKU-DN', unit: 'pcs',
      price: 120, cost: 60, minStock: 5, maxStock: 80, currentStock: 30
    })
    const bear = svc.listProducts(tenantCtx, { keyword: 'bear' })
    assert.equal(bear.length, 1)
    assert.equal(bear[0]?.name, 'Bear Plush')
  })

  it('listProducts supports pagination', () => {
    const svc = new InventoryService()
    for (let i = 1; i <= 5; i++) {
      svc.createProduct(tenantCtx, {
        name: `Product ${i}`, sku: `SKU-${i}`, unit: 'pcs',
        price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
      })
    }
    const page1 = svc.listProducts(tenantCtx, { limit: 2, offset: 0 })
    assert.equal(page1.length, 2)
    const page2 = svc.listProducts(tenantCtx, { limit: 2, offset: 2 })
    assert.equal(page2.length, 2)
  })

  it('listProducts isolates tenants', () => {
    const svc = new InventoryService()
    svc.createProduct(tenantCtx, {
      name: 'TenantA', sku: 'TA-1', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
    })
    const bProducts = svc.listProducts({ tenantId: 'tenant-B' })
    assert.equal(bProducts.length, 0)
  })
})

describe('InventoryService — Stock Operations', () => {
  beforeEach(() => resetInventoryServiceTestState())

  it('stockIn increases product stock and creates record', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Plush', sku: 'P-1', unit: 'pcs',
      price: 50, cost: 25, minStock: 5, maxStock: 100, currentStock: 20
    })
    const { product, record } = svc.stockIn(tenantCtx, {
      productId: p.id, quantity: 30, reason: 'restock', batchNo: 'BATCH-001'
    })
    assert.equal(product.currentStock, 50)
    assert.equal(record.type, StockRecordType.Inbound)
    assert.equal(record.beforeStock, 20)
    assert.equal(record.afterStock, 50)
    assert.equal(record.batchNo, 'BATCH-001')
  })

  it('stockOut decreases product stock when sufficient', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Plush', sku: 'P-2', unit: 'pcs',
      price: 50, cost: 25, minStock: 5, maxStock: 100, currentStock: 50
    })
    const { product, record } = svc.stockOut(tenantCtx, {
      productId: p.id, quantity: 15, reason: 'sold'
    })
    assert.equal(product.currentStock, 35)
    assert.equal(record.type, StockRecordType.Outbound)
    assert.equal(record.reason, 'sold')
  })

  it('stockOut throws when insufficient stock', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Rare Item', sku: 'R-1', unit: 'pcs',
      price: 999, cost: 500, minStock: 1, maxStock: 10, currentStock: 3
    })
    assert.throws(
      () => svc.stockOut(tenantCtx, { productId: p.id, quantity: 10 }),
      /Insufficient stock/
    )
  })

  it('adjustStock sets exact quantity regardless of current', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Adjustable', sku: 'ADJ-1', unit: 'pcs',
      price: 100, cost: 50, minStock: 0, maxStock: 200, currentStock: 30
    })
    const { product, record } = svc.adjustStock(tenantCtx, {
      productId: p.id, newQuantity: 100, reason: 'inventory check'
    })
    assert.equal(product.currentStock, 100)
    assert.equal(record.type, StockRecordType.Adjustment)
    assert.equal(record.quantity, 70)
    assert.equal(record.beforeStock, 30)
    assert.equal(record.afterStock, 100)
  })

  it('checkStock returns true when sufficient', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Check', sku: 'CK-1', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 30
    })
    const ok = svc.checkStock(p.id, 20, tenantCtx)
    assert.equal(ok, true)
  })

  it('checkStock throws when insufficient', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Check', sku: 'CK-2', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 5
    })
    assert.throws(
      () => svc.checkStock(p.id, 20, tenantCtx),
      /Insufficient stock/
    )
  })

  it('getLowStockProducts returns products below minStock', () => {
    const svc = new InventoryService()
    svc.createProduct(tenantCtx, {
      name: 'Low Stock', sku: 'LOW-1', unit: 'pcs',
      price: 10, cost: 5, minStock: 20, maxStock: 100, currentStock: 5
    })
    svc.createProduct(tenantCtx, {
      name: 'Out of Stock', sku: 'OOS-1', unit: 'pcs',
      price: 15, cost: 7, minStock: 10, maxStock: 50, currentStock: 0
    })
    svc.createProduct(tenantCtx, {
      name: 'Healthy', sku: 'OK-1', unit: 'pcs',
      price: 20, cost: 10, minStock: 5, maxStock: 100, currentStock: 80
    })
    const alerts = svc.getLowStockProducts(tenantCtx)
    assert.equal(alerts.length, 2)
    const lowAlert = alerts.find((a) => a.product.name === 'Low Stock')!
    assert.equal(lowAlert.status, 'low')
    const oosAlert = alerts.find((a) => a.product.name === 'Out of Stock')!
    assert.equal(oosAlert.status, 'out_of_stock')
  })

  it('getLowStockProducts accepts custom threshold', () => {
    const svc = new InventoryService()
    svc.createProduct(tenantCtx, {
      name: 'Custom', sku: 'CUST-1', unit: 'pcs',
      price: 50, cost: 25, minStock: 10, maxStock: 200, currentStock: 40
    })
    // 40 > default minStock (10), so not low by default
    const defaultAlerts = svc.getLowStockProducts(tenantCtx)
    assert.equal(defaultAlerts.length, 0)
    // But with threshold 50, it IS low
    const customAlerts = svc.getLowStockProducts(tenantCtx, 50)
    assert.equal(customAlerts.length, 1)
    assert.equal(customAlerts[0]?.status, 'low')
  })

  it('getStockRecords returns records filtered by productId and type', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Recorder', sku: 'REC-1', unit: 'pcs',
      price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 20
    })
    svc.stockIn(tenantCtx, { productId: p.id, quantity: 30, reason: 'restock' })
    svc.stockOut(tenantCtx, { productId: p.id, quantity: 10, reason: 'sold' })

    const allRecords = svc.getStockRecords(tenantCtx)
    assert.equal(allRecords.length, 2)

    const inboundRecords = svc.getStockRecords(tenantCtx, { type: StockRecordType.Inbound })
    assert.equal(inboundRecords.length, 1)

    const outboundRecords = svc.getStockRecords(tenantCtx, { type: StockRecordType.Outbound })
    assert.equal(outboundRecords.length, 1)
  })
})

describe('InventoryService — Supplier CRUD', () => {
  beforeEach(() => resetInventoryServiceTestState())

  it('createSupplier creates with generated id', () => {
    const svc = new InventoryService()
    const supplier = svc.createSupplier(tenantCtx, {
      name: 'Toy Factory',
      contactName: 'Zhang San',
      phone: '13800138000'
    })
    assert.ok(supplier.id.startsWith('supplier-'))
    assert.equal(supplier.name, 'Toy Factory')
    assert.equal(supplier.tenantId, 'tenant-001')
  })

  it('listSuppliers returns all for tenant', () => {
    const svc = new InventoryService()
    svc.createSupplier(tenantCtx, { name: 'Supplier A' })
    svc.createSupplier(tenantCtx, { name: 'Supplier B' })
    const suppliers = svc.listSuppliers(tenantCtx)
    assert.equal(suppliers.length, 2)
    const names = suppliers.map((s) => s.name).sort()
    assert.deepEqual(names, ['Supplier A', 'Supplier B'])
  })

  it('listSuppliers isolates tenants', () => {
    const svc = new InventoryService()
    svc.createSupplier(tenantCtx, { name: 'Only A' })
    const bSuppliers = svc.listSuppliers({ tenantId: 'tenant-B' })
    assert.equal(bSuppliers.length, 0)
  })
})

describe('InventoryService — Purchase Orders', () => {
  beforeEach(() => resetInventoryServiceTestState())

  it('createPurchaseOrder creates in Draft status', () => {
    const svc = new InventoryService()
    const order = svc.createPurchaseOrder(tenantCtx, {
      supplierId: 's-1',
      items: [{
        productId: 'p-1', productName: 'Ball', sku: 'B-1',
        quantity: 10, unitPrice: 15, totalPrice: 150
      }],
      totalAmount: 150
    })
    assert.ok(order.id.startsWith('po-'))
    assert.equal(order.status, PurchaseOrderStatus.Draft)
    assert.equal(order.items.length, 1)
    assert.equal(order.items[0]?.quantity, 10)
  })

  it('confirmOrder transitions Draft to Confirmed', () => {
    const svc = new InventoryService()
    const order = svc.createPurchaseOrder(tenantCtx, {
      items: [{
        productId: 'p-1', productName: 'Ball', sku: 'B-1',
        quantity: 5, unitPrice: 10, totalPrice: 50
      }],
      totalAmount: 50
    })
    const confirmed = svc.confirmOrder(order.id, tenantCtx)
    assert.equal(confirmed.status, PurchaseOrderStatus.Confirmed)
    assert.ok(confirmed.orderedAt)
  })

  it('confirmOrder rejects non-Draft/Submitted status', () => {
    const svc = new InventoryService()
    const order = svc.createPurchaseOrder(tenantCtx, {
      items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
      totalAmount: 1
    })
    svc.confirmOrder(order.id, tenantCtx)
    // Already confirmed
    assert.throws(
      () => svc.confirmOrder(order.id, tenantCtx),
      /cannot be confirmed/
    )
  })

  it('receiveOrder transitions Confirmed to Received and stocks-in items', () => {
    const svc = new InventoryService()
    const p = svc.createProduct(tenantCtx, {
      name: 'Ball', sku: 'B-1', unit: 'pcs',
      price: 15, cost: 8, minStock: 0, maxStock: 100, currentStock: 0
    })
    const order = svc.createPurchaseOrder(tenantCtx, {
      items: [{
        productId: p.id, productName: 'Ball', sku: 'B-1',
        quantity: 20, unitPrice: 8, totalPrice: 160
      }],
      totalAmount: 160
    })
    svc.confirmOrder(order.id, tenantCtx)
    const received = svc.receiveOrder(order.id, tenantCtx)
    assert.equal(received.status, PurchaseOrderStatus.Received)
    assert.ok(received.receivedAt)

    // Product stock should have increased
    const updatedProduct = svc.getProduct(p.id, tenantCtx)
    assert.equal(updatedProduct.currentStock, 20)
  })

  it('receiveOrder rejects non-Confirmed status', () => {
    const svc = new InventoryService()
    const order = svc.createPurchaseOrder(tenantCtx, {
      items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
      totalAmount: 1
    })
    assert.throws(
      () => svc.receiveOrder(order.id, tenantCtx),
      /must be confirmed before receiving/
    )
  })

  it('listPurchaseOrders filters by status and supplier', () => {
    const svc = new InventoryService()
    const o1 = svc.createPurchaseOrder(tenantCtx, {
      supplierId: 's-A',
      items: [{ productId: 'p-1', productName: 'A', sku: 'A-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
      totalAmount: 1
    })
    svc.createPurchaseOrder(tenantCtx, {
      supplierId: 's-B',
      items: [{ productId: 'p-2', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
      totalAmount: 1
    })

    svc.confirmOrder(o1.id, tenantCtx)

    const draftOrders = svc.listPurchaseOrders(tenantCtx, { status: PurchaseOrderStatus.Draft })
    assert.equal(draftOrders.length, 1)

    const confirmedOrders = svc.listPurchaseOrders(tenantCtx, { status: PurchaseOrderStatus.Confirmed })
    assert.equal(confirmedOrders.length, 1)

    const supplierA = svc.listPurchaseOrders(tenantCtx, { supplierId: 's-A' })
    assert.equal(supplierA.length, 1)
  })

  it('listPurchaseOrders isolates tenants', () => {
    const svc = new InventoryService()
    svc.createPurchaseOrder(tenantCtx, {
      items: [{ productId: 'p-1', productName: 'A', sku: 'A-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
      totalAmount: 1
    })
    const bOrders = svc.listPurchaseOrders({ tenantId: 'tenant-B' })
    assert.equal(bOrders.length, 0)
  })
})
