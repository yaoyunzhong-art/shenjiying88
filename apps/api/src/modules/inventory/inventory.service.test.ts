/**
 * inventory.service.test.ts — P-38 库存管理服务 单元测试
 *
 * 覆盖:
 *   正常流程: 商品CRUD、入库、出库、库存调整、供应商、采购订单
 *   边界值: 零库存管理、最大库存阈值、批量采购、超量出库校验
 *   错误处理: 商品不存在、库存不足、跨租户隔离、采购状态校验
 *   空状态: 空商品列表、空库存记录、空供应商
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import {
  ProductStatus,
  StockRecordType,
  PurchaseOrderStatus,
  type Product,
  type StockRecord,
  type Supplier,
  type PurchaseOrder,
} from './inventory.entity'

function createContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-inventory',
    brandId: 'brand-inv',
    storeId: 'store-inv',
    ...overrides,
  }
}

function createOtherContext(): RequestTenantContext {
  return { tenantId: 'tenant-other', brandId: 'brand-other', storeId: 'store-other' }
}

describe('InventoryService', () => {
  let service: InventoryService

  beforeEach(() => {
    resetInventoryServiceTestState()
    service = new InventoryService()
  })

  afterEach(() => {
    resetInventoryServiceTestState()
  })

  // ───────────────────────────────────────────────────
  // 正常流程 - Product CRUD
  // ───────────────────────────────────────────────────

  it('creates a product with all required fields', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: '测试商品A',
      sku: 'SKU-001',
      unit: '个',
      price: 29.99,
      cost: 15.00,
      minStock: 10,
      maxStock: 200,
      currentStock: 50,
      category: '电子产品',
    })
    expect(product.id).toMatch(/^prod-/)
    expect(product.name).toBe('测试商品A')
    expect(product.sku).toBe('SKU-001')
    expect(product.price).toBe(29.99)
    expect(product.currentStock).toBe(50)
    expect(product.status).toBe(ProductStatus.Active)
    expect(product.tenantId).toBe('tenant-inventory')
  })

  it('updates an existing product', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: '旧名称', sku: 'SKU-002', unit: '箱', price: 100, cost: 60,
      minStock: 5, maxStock: 100, currentStock: 20,
    })
    const updated = service.updateProduct(product.id, ctx, {
      name: '新名称',
      price: 120,
    })
    expect(updated.name).toBe('新名称')
    expect(updated.price).toBe(120)
    expect(updated.sku).toBe('SKU-002') // unchanged
  })

  it('gets a product by id', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Get Test', sku: 'SKU-GET', unit: '个', price: 10, cost: 5,
      minStock: 2, maxStock: 50, currentStock: 10,
    })
    const fetched = service.getProduct(product.id, ctx)
    expect(fetched.id).toBe(product.id)
    expect(fetched.name).toBe('Get Test')
  })

  it('lists products with category and keyword filters', () => {
    const ctx = createContext()
    service.createProduct(ctx, {
      name: 'Apple', sku: 'APL-001', unit: '个', price: 5, cost: 3,
      minStock: 10, maxStock: 100, currentStock: 50, category: '水果',
    })
    service.createProduct(ctx, {
      name: 'Banana', sku: 'BAN-001', unit: '个', price: 3, cost: 1.5,
      minStock: 10, maxStock: 100, currentStock: 80, category: '水果',
    })
    service.createProduct(ctx, {
      name: 'Milk', sku: 'MLK-001', unit: '瓶', price: 15, cost: 10,
      minStock: 5, maxStock: 50, currentStock: 30, category: '乳制品',
    })

    const fruitProducts = service.listProducts(ctx, { category: '水果' })
    expect(fruitProducts.length).toBe(2)

    const keywordResults = service.listProducts(ctx, { keyword: 'apple' })
    expect(keywordResults.length).toBe(1)
    expect(keywordResults[0].sku).toBe('APL-001')
  })

  it('handles product status filtering in list', () => {
    const ctx = createContext()
    const p1 = service.createProduct(ctx, {
      name: 'Active Product', sku: 'ACT-001', unit: '个', price: 10, cost: 5,
      minStock: 1, maxStock: 10, currentStock: 5, status: ProductStatus.Active,
    })
    service.createProduct(ctx, {
      name: 'Inactive Product', sku: 'INA-001', unit: '个', price: 20, cost: 10,
      minStock: 1, maxStock: 10, currentStock: 3, status: ProductStatus.Inactive,
    })

    const activeOnly = service.listProducts(ctx, { status: ProductStatus.Active })
    expect(activeOnly.length).toBe(1)
    expect(activeOnly[0].id).toBe(p1.id)
  })

  // ───────────────────────────────────────────────────
  // 正常流程 - 库存操作
  // ───────────────────────────────────────────────────

  it('stockIn increases product stock and creates a record', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Stock In Test', sku: 'STK-IN', unit: '个', price: 10, cost: 5,
      minStock: 5, maxStock: 100, currentStock: 20,
    })

    const result = service.stockIn(ctx, {
      productId: product.id,
      quantity: 30,
      reason: '采购入库',
      batchNo: 'BATCH-001',
    })

    expect(result.product.currentStock).toBe(50)
    expect(result.record.type).toBe(StockRecordType.Inbound)
    expect(result.record.quantity).toBe(30)
    expect(result.record.beforeStock).toBe(20)
    expect(result.record.afterStock).toBe(50)
    expect(result.record.batchNo).toBe('BATCH-001')
  })

  it('stockOut decreases product stock and creates a record', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Stock Out Test', sku: 'STK-OUT', unit: '个', price: 10, cost: 5,
      minStock: 5, maxStock: 100, currentStock: 50,
    })

    const result = service.stockOut(ctx, {
      productId: product.id,
      quantity: 20,
      reason: '销售出库',
    })

    expect(result.product.currentStock).toBe(30)
    expect(result.record.type).toBe(StockRecordType.Outbound)
    expect(result.record.quantity).toBe(20)
    expect(result.record.beforeStock).toBe(50)
    expect(result.record.afterStock).toBe(30)
  })

  it('adjustStock changes stock to exact new quantity', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Adjust Test', sku: 'ADJ-001', unit: '个', price: 10, cost: 5,
      minStock: 5, maxStock: 100, currentStock: 40,
    })

    const result = service.adjustStock(ctx, {
      productId: product.id,
      newQuantity: 60,
      reason: '盘点调整',
    })

    expect(result.product.currentStock).toBe(60)
    expect(result.record.type).toBe(StockRecordType.Adjustment)
  })

  it('checkStock returns true when stock is sufficient', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Check Test', sku: 'CHK-001', unit: '个', price: 10, cost: 5,
      minStock: 5, maxStock: 100, currentStock: 30,
    })
    const result = service.checkStock(product.id, 20, ctx)
    expect(result).toBe(true)
  })

  it('getLowStockProducts detects low and out-of-stock products', () => {
    const ctx = createContext()
    service.createProduct(ctx, {
      name: 'Well Stocked', sku: 'WELL-001', unit: '个', price: 10, cost: 5,
      minStock: 10, maxStock: 100, currentStock: 50,
    })
    service.createProduct(ctx, {
      name: 'Low Stock', sku: 'LOW-001', unit: '个', price: 10, cost: 5,
      minStock: 10, maxStock: 100, currentStock: 3,
    })
    service.createProduct(ctx, {
      name: 'Out of Stock', sku: 'OOS-001', unit: '个', price: 10, cost: 5,
      minStock: 10, maxStock: 100, currentStock: 0,
    })

    const alerts = service.getLowStockProducts(ctx)
    expect(alerts.length).toBe(2)
    const oosAlert = alerts.find((a) => a.product.sku === 'OOS-001')
    const lowAlert = alerts.find((a) => a.product.sku === 'LOW-001')
    expect(oosAlert?.status).toBe('out_of_stock')
    expect(lowAlert?.status).toBe('low')
    expect(oosAlert?.currentStock).toBe(0)
  })

  // ───────────────────────────────────────────────────
  // 正常流程 - 供应商
  // ───────────────────────────────────────────────────

  it('creates and lists suppliers', () => {
    const ctx = createContext()
    const supplier = service.createSupplier(ctx, {
      name: '供货商A',
      contactName: '张三',
      phone: '13800138001',
      email: 'zhang@supplier.com',
      address: '北京市朝阳区',
    })
    expect(supplier.id).toMatch(/^supplier-/)
    expect(supplier.name).toBe('供货商A')

    const suppliers = service.listSuppliers(ctx)
    expect(suppliers.length).toBe(1)
    expect(suppliers[0].id).toBe(supplier.id)
  })

  // ───────────────────────────────────────────────────
  // 正常流程 - 采购订单
  // ───────────────────────────────────────────────────

  it('creates a purchase order in Draft status', () => {
    const ctx = createContext()
    const order = service.createPurchaseOrder(ctx, {
      supplierId: 'supplier-test-1',
      storeId: 'store-inv',
      totalAmount: 5000,
      items: [
        { productId: 'prod-1', productName: 'Item A', sku: 'SKU-A', quantity: 10, unitPrice: 200, totalPrice: 2000 },
        { productId: 'prod-2', productName: 'Item B', sku: 'SKU-B', quantity: 5, unitPrice: 600, totalPrice: 3000 },
      ],
    })
    expect(order.id).toMatch(/^po-/)
    expect(order.status).toBe(PurchaseOrderStatus.Draft)
    expect(order.items.length).toBe(2)
    expect(order.totalAmount).toBe(5000)
  })

  it('confirms a draft purchase order', () => {
    const ctx = createContext()
    const order = service.createPurchaseOrder(ctx, {
      supplierId: 'supplier-confirm', totalAmount: 1000,
      items: [{ productId: 'prod-c', productName: 'C', sku: 'SKU-C', quantity: 1, unitPrice: 1000, totalPrice: 1000 }],
    })
    const confirmed = service.confirmOrder(order.id, ctx)
    expect(confirmed.status).toBe(PurchaseOrderStatus.Confirmed)
    expect(confirmed.orderedAt).toBeTruthy()
  })

  it('receives a confirmed order and auto stock-in', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'PO Product', sku: 'PO-SKU', unit: '个', price: 100, cost: 50,
      minStock: 5, maxStock: 200, currentStock: 10,
    })
    const order = service.createPurchaseOrder(ctx, {
      supplierId: 'supplier-recv', totalAmount: 2000,
      items: [{ productId: product.id, productName: 'PO Product', sku: 'PO-SKU', quantity: 20, unitPrice: 100, totalPrice: 2000 }],
    })
    const confirmed = service.confirmOrder(order.id, ctx)
    const received = service.receiveOrder(order.id, ctx)
    expect(received.status).toBe(PurchaseOrderStatus.Received)
    expect(received.receivedAt).toBeTruthy()

    // Product stock should have increased by 20
    const updatedProduct = service.getProduct(product.id, ctx)
    expect(updatedProduct.currentStock).toBe(30)
  })

  it('lists purchase orders with status filter', () => {
    const ctx = createContext()
    const o1 = service.createPurchaseOrder(ctx, {
      supplierId: 's1', totalAmount: 500,
      items: [{ productId: 'p1', productName: 'P1', sku: 'S1', quantity: 1, unitPrice: 500, totalPrice: 500 }],
    })
    const o2 = service.createPurchaseOrder(ctx, {
      supplierId: 's2', totalAmount: 300,
      items: [{ productId: 'p2', productName: 'P2', sku: 'S2', quantity: 1, unitPrice: 300, totalPrice: 300 }],
    })
    service.confirmOrder(o2.id, ctx) // o2 is confirmed
    const draftOrders = service.listPurchaseOrders(ctx, { status: PurchaseOrderStatus.Draft })
    expect(draftOrders.length).toBe(1)
    expect(draftOrders[0].id).toBe(o1.id)

    const confirmedOrders = service.listPurchaseOrders(ctx, { status: PurchaseOrderStatus.Confirmed })
    expect(confirmedOrders.length).toBe(1)
    expect(confirmedOrders[0].id).toBe(o2.id)
  })

  // ───────────────────────────────────────────────────
  // 边界值
  // ───────────────────────────────────────────────────

  it('creates product with zero currentStock', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Zero Stock', sku: 'ZERO-001', unit: '个', price: 10, cost: 5,
      minStock: 0, maxStock: 100, currentStock: 0,
    })
    expect(product.currentStock).toBe(0)
    const alerts = service.getLowStockProducts(ctx)
    expect(alerts.some((a) => a.product.id === product.id)).toBe(true)
  })

  it('adjusts stock down to zero from positive stock', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Down to Zero', sku: 'DZ-001', unit: '个', price: 10, cost: 5,
      minStock: 1, maxStock: 100, currentStock: 5,
    })
    const result = service.adjustStock(ctx, {
      productId: product.id,
      newQuantity: 0,
      reason: '盘点清空',
    })
    expect(result.product.currentStock).toBe(0)
  })

  it('paginates listings with limit and offset', () => {
    const ctx = createContext()
    for (let i = 0; i < 5; i++) {
      service.createProduct(ctx, {
        name: `Product ${i}`, sku: `PG-${i}`, unit: '个', price: 10, cost: 5,
        minStock: 1, maxStock: 50, currentStock: 10,
      })
    }
    const all = service.listProducts(ctx, {})
    expect(all.length).toBe(5)
    const page = service.listProducts(ctx, { limit: 2, offset: 1 })
    expect(page.length).toBe(2)
  })

  it('handles large quantity stock operations', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Bulk Item', sku: 'BULK-001', unit: '箱', price: 1000, cost: 500,
      minStock: 0, maxStock: 100000, currentStock: 50000,
    })
    const result = service.stockIn(ctx, {
      productId: product.id, quantity: 10000, reason: '大批量入库',
    })
    expect(result.product.currentStock).toBe(60000)
  })

  // ───────────────────────────────────────────────────
  // 错误处理
  // ───────────────────────────────────────────────────

  it('throws error when getting non-existent product', () => {
    const ctx = createContext()
    expect(() => service.getProduct('non-existent-prod', ctx)).toThrow(/not found/)
  })

  it('throws error when product belongs to different tenant', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Tenant Scoped', sku: 'TENANT-SKU', unit: '个', price: 10, cost: 5,
      minStock: 1, maxStock: 50, currentStock: 10,
    })
    expect(() => service.getProduct(product.id, createOtherContext())).toThrow(/not found/)
  })

  it('throws error when stockOut with insufficient stock', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'Low Stock', sku: 'LOW-ERR', unit: '个', price: 10, cost: 5,
      minStock: 1, maxStock: 50, currentStock: 3,
    })
    expect(() => service.stockOut(ctx, { productId: product.id, quantity: 10, reason: '超卖' })).toThrow(
      /Insufficient stock/
    )
  })

  it('throws error when confirming non-existent purchase order', () => {
    const ctx = createContext()
    expect(() => service.confirmOrder('ghost-po', ctx)).toThrow(/not found/)
  })

  it('throws error when confirming order from wrong tenant', () => {
    const ctx = createContext()
    const order = service.createPurchaseOrder(ctx, {
      supplierId: 's-err', totalAmount: 100,
      items: [{ productId: 'p-err', productName: 'Err', sku: 'ERR', quantity: 1, unitPrice: 100, totalPrice: 100 }],
    })
    expect(() => service.confirmOrder(order.id, createOtherContext())).toThrow(/not found/)
  })

  it('throws error when receiving non-confirmed purchase order', () => {
    const ctx = createContext()
    const order = service.createPurchaseOrder(ctx, {
      supplierId: 's-draft', totalAmount: 100,
      items: [{ productId: 'p-draft', productName: 'Draft', sku: 'DRF', quantity: 1, unitPrice: 100, totalPrice: 100 }],
    })
    expect(() => service.receiveOrder(order.id, ctx)).toThrow(/must be confirmed/)
  })

  it('throws error for checkStock with insufficient stock', () => {
    const ctx = createContext()
    const product = service.createProduct(ctx, {
      name: 'CheckFail', sku: 'CHK-FAIL', unit: '个', price: 10, cost: 5,
      minStock: 1, maxStock: 50, currentStock: 2,
    })
    expect(() => service.checkStock(product.id, 5, ctx)).toThrow(/Insufficient stock/)
  })

  // ───────────────────────────────────────────────────
  // 空状态
  // ───────────────────────────────────────────────────

  it('returns empty list when no products exist', () => {
    const ctx = createContext()
    const products = service.listProducts(ctx, {})
    expect(products).toEqual([])
  })

  it('returns empty list when no suppliers exist', () => {
    const ctx = createContext()
    const suppliers = service.listSuppliers(ctx)
    expect(suppliers).toEqual([])
  })

  it('returns empty list when no purchase orders exist', () => {
    const ctx = createContext()
    const orders = service.listPurchaseOrders(ctx, {})
    expect(orders).toEqual([])
  })

  it('returns empty low stock alerts when all products are well-stocked', () => {
    const ctx = createContext()
    service.createProduct(ctx, {
      name: 'Well Stocked', sku: 'FULL-001', unit: '个', price: 10, cost: 5,
      minStock: 5, maxStock: 100, currentStock: 80,
    })
    service.createProduct(ctx, {
      name: 'Also Full', sku: 'FULL-002', unit: '个', price: 10, cost: 5,
      minStock: 10, maxStock: 100, currentStock: 50,
    })
    const alerts = service.getLowStockProducts(ctx)
    expect(alerts.length).toBe(0)
  })

  it('returns empty stock records when no operations performed', () => {
    const ctx = createContext()
    const records = service.getStockRecords(ctx, {})
    expect(records).toEqual([])
  })

  it('returns empty purchase order list filtered by non-existent status', () => {
    const ctx = createContext()
    service.createPurchaseOrder(ctx, {
      supplierId: 's-empty', totalAmount: 100,
      items: [{ productId: 'p-empty', productName: 'E', sku: 'EMP', quantity: 1, unitPrice: 100, totalPrice: 100 }],
    })
    const receivedOrders = service.listPurchaseOrders(ctx, { status: PurchaseOrderStatus.Cancelled })
    expect(receivedOrders).toEqual([])
  })
})
