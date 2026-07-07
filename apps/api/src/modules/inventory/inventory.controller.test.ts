import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
const { InventoryController } = require('./inventory.controller')
const { InventoryService, resetInventoryServiceTestState } = require('./inventory.service')

type AnyFn = (...args: any[]) => any
interface MockServiceOverrides {
  createProduct?: AnyFn
  updateProduct?: AnyFn
  getProduct?: AnyFn
  listProducts?: AnyFn
  stockIn?: AnyFn
  stockOut?: AnyFn
  adjustStock?: AnyFn
  checkStock?: AnyFn
  getLowStockProducts?: AnyFn
  getStockRecords?: AnyFn
  createSupplier?: AnyFn
  listSuppliers?: AnyFn
  createPurchaseOrder?: AnyFn
  confirmOrder?: AnyFn
  receiveOrder?: AnyFn
  listPurchaseOrders?: AnyFn
}

function makeController(overrides: MockServiceOverrides = {}) {
  const service = {
    createProduct: overrides.createProduct ?? (() => ({ id: 'prod-1' })),
    updateProduct: overrides.updateProduct ?? (() => ({ id: 'prod-1' })),
    getProduct: overrides.getProduct ?? (() => ({ id: 'prod-1' })),
    listProducts: overrides.listProducts ?? (() => []),
    stockIn: overrides.stockIn ?? (() => ({ product: {}, record: {} })),
    stockOut: overrides.stockOut ?? (() => ({ product: {}, record: {} })),
    adjustStock: overrides.adjustStock ?? (() => ({ product: {}, record: {} })),
    checkStock: overrides.checkStock ?? (() => true),
    getLowStockProducts: overrides.getLowStockProducts ?? (() => []),
    getStockRecords: overrides.getStockRecords ?? (() => []),
    createSupplier: overrides.createSupplier ?? (() => ({ id: 's-1' })),
    listSuppliers: overrides.listSuppliers ?? (() => []),
    createPurchaseOrder: overrides.createPurchaseOrder ?? (() => ({ id: 'po-1' })),
    confirmOrder: overrides.confirmOrder ?? (() => ({ id: 'po-1', status: 'confirmed' })),
    receiveOrder: overrides.receiveOrder ?? (() => ({ id: 'po-1', status: 'received' })),
    listPurchaseOrders: overrides.listPurchaseOrders ?? (() => [])
  }
  return new InventoryController(service as any)
}

const tenantCtx = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1' }

describe('InventoryController — Route metadata', () => {
  it('controller path is inventory', () => {
    const path = Reflect.getMetadata('path', InventoryController)
    assert.equal(path, 'inventory')
  })

  it('createProduct POST products', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.createProduct)
    const path = Reflect.getMetadata('path', InventoryController.prototype.createProduct)
    assert.equal(method, 1) // 0=GET, 1=POST
    assert.equal(path, 'products')
  })

  it('updateProduct PUT products/:productId', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.updateProduct)
    const path = Reflect.getMetadata('path', InventoryController.prototype.updateProduct)
    assert.equal(method, 2) // 2=PUT
    assert.equal(path, 'products/:productId')
  })

  it('getProduct GET products/:productId', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.getProduct)
    const path = Reflect.getMetadata('path', InventoryController.prototype.getProduct)
    assert.equal(method, 0)
    assert.equal(path, 'products/:productId')
  })

  it('listProducts GET products', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.listProducts)
    const path = Reflect.getMetadata('path', InventoryController.prototype.listProducts)
    assert.equal(method, 0)
    assert.equal(path, 'products')
  })

  it('stockIn POST stock/in', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.stockIn)
    const path = Reflect.getMetadata('path', InventoryController.prototype.stockIn)
    assert.equal(method, 1)
    assert.equal(path, 'stock/in')
  })

  it('stockOut POST stock/out', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.stockOut)
    const path = Reflect.getMetadata('path', InventoryController.prototype.stockOut)
    assert.equal(method, 1)
    assert.equal(path, 'stock/out')
  })

  it('adjustStock POST stock/adjust', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.adjustStock)
    const path = Reflect.getMetadata('path', InventoryController.prototype.adjustStock)
    assert.equal(method, 1)
    assert.equal(path, 'stock/adjust')
  })

  it('checkStock GET stock/check/:productId', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.checkStock)
    const path = Reflect.getMetadata('path', InventoryController.prototype.checkStock)
    assert.equal(method, 0)
    assert.equal(path, 'stock/check/:productId')
  })

  it('getLowStockProducts GET stock/low-products', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.getLowStockProducts)
    const path = Reflect.getMetadata('path', InventoryController.prototype.getLowStockProducts)
    assert.equal(method, 0)
    assert.equal(path, 'stock/low-products')
  })

  it('getStockRecords GET stock/records', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.getStockRecords)
    const path = Reflect.getMetadata('path', InventoryController.prototype.getStockRecords)
    assert.equal(method, 0)
    assert.equal(path, 'stock/records')
  })

  it('createSupplier POST suppliers', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.createSupplier)
    const path = Reflect.getMetadata('path', InventoryController.prototype.createSupplier)
    assert.equal(method, 1)
    assert.equal(path, 'suppliers')
  })

  it('listSuppliers GET suppliers', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.listSuppliers)
    const path = Reflect.getMetadata('path', InventoryController.prototype.listSuppliers)
    assert.equal(method, 0)
    assert.equal(path, 'suppliers')
  })

  it('createPurchaseOrder POST purchase-orders', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.createPurchaseOrder)
    const path = Reflect.getMetadata('path', InventoryController.prototype.createPurchaseOrder)
    assert.equal(method, 1)
    assert.equal(path, 'purchase-orders')
  })

  it('confirmOrder POST purchase-orders/:orderId/confirm', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.confirmOrder)
    const path = Reflect.getMetadata('path', InventoryController.prototype.confirmOrder)
    assert.equal(method, 1)
    assert.equal(path, 'purchase-orders/:orderId/confirm')
  })

  it('receiveOrder POST purchase-orders/:orderId/receive', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.receiveOrder)
    const path = Reflect.getMetadata('path', InventoryController.prototype.receiveOrder)
    assert.equal(method, 1)
    assert.equal(path, 'purchase-orders/:orderId/receive')
  })

  it('listPurchaseOrders GET purchase-orders', () => {
    const method = Reflect.getMetadata('method', InventoryController.prototype.listPurchaseOrders)
    const path = Reflect.getMetadata('path', InventoryController.prototype.listPurchaseOrders)
    assert.equal(method, 0)
    assert.equal(path, 'purchase-orders')
  })
})

describe('InventoryController — Delegation', () => {
  it('createProduct delegates to service with tenant context and body', () => {
    let captured: any = null
    const ctrl = makeController({
      createProduct: (ctx: any, body: any) => {
        captured = { ctx, body }
        return { id: 'prod-1' }
      }
    })
    const body = { name: 'Test', sku: 'T-1', unit: 'pcs', price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 20 }
    const result = ctrl.createProduct(tenantCtx, body)
    assert.equal(result.id, 'prod-1')
    assert.equal(captured.ctx.tenantId, 't-1')
    assert.equal(captured.body.name, 'Test')
  })

  it('updateProduct delegates with productId param', () => {
    let captured: any = null
    const ctrl = makeController({
      updateProduct: (id: string, ctx: any, body: any) => {
        captured = { id, ctx, body }
        return { id }
      }
    })
    const result = ctrl.updateProduct('prod-X', tenantCtx, { name: 'Updated' })
    assert.equal(result.id, 'prod-X')
    assert.equal(captured.id, 'prod-X')
  })

  it('getProduct delegates with productId', () => {
    const ctrl = makeController({
      getProduct: (id: string) => ({ id })
    })
    const result = ctrl.getProduct('prod-P', tenantCtx)
    assert.equal(result.id, 'prod-P')
  })

  it('listProducts delegates with query', () => {
    let captured: any = null
    const ctrl = makeController({
      listProducts: (ctx: any, query: any) => {
        captured = { ctx, query }
        return [{ id: 'p-1' }]
      }
    })
    const query = { category: 'toys', limit: 10 }
    const result = ctrl.listProducts(tenantCtx, query)
    assert.equal(result.length, 1)
    assert.equal(captured.query.category, 'toys')
  })

  it('stockIn delegates with tenant context and body', () => {
    let captured: any = null
    const ctrl = makeController({
      stockIn: (ctx: any, body: any) => {
        captured = { ctx, body }
        return { product: { id: body.productId }, record: {} }
      }
    })
    const result = ctrl.stockIn(tenantCtx, { productId: 'p-1', quantity: 5 })
    assert.equal(result.product.id, 'p-1')
    assert.equal(captured.body.quantity, 5)
  })

  it('stockOut delegates with tenant context and body', () => {
    const ctrl = makeController({
      stockOut: () => ({ product: { currentStock: 40 }, record: {} })
    })
    const result = ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 10 })
    assert.equal(result.product.currentStock, 40)
  })

  it('getLowStockProducts delegates with optional threshold', () => {
    let capturedThreshold: any = undefined
    const ctrl = makeController({
      getLowStockProducts: (_ctx: any, threshold?: number) => {
        capturedThreshold = threshold
        return []
      }
    })
    ctrl.getLowStockProducts(tenantCtx, undefined)
    assert.equal(capturedThreshold, undefined)

    ctrl.getLowStockProducts(tenantCtx, '30')
    assert.equal(capturedThreshold, 30)
  })

  it('checkStock delegates with productId and qty', () => {
    const ctrl = makeController({
      checkStock: (_id: string, qty: number) => qty <= 50
    })
    const result = ctrl.checkStock('p-1', '30', tenantCtx)
    assert.deepEqual(result, { productId: 'p-1', requiredQty: 30, sufficient: true })

    const result2 = ctrl.checkStock('p-1', '100', tenantCtx)
    assert.deepEqual(result2, { productId: 'p-1', requiredQty: 100, sufficient: false })
  })

  it('createSupplier delegates', () => {
    const ctrl = makeController({
      createSupplier: () => ({ id: 's-new', name: 'Acme' })
    })
    const result = ctrl.createSupplier(tenantCtx, { name: 'Acme' })
    assert.equal(result.id, 's-new')
  })

  it('listSuppliers delegates', () => {
    const ctrl = makeController({
      listSuppliers: () => [{ id: 's-1' }, { id: 's-2' }]
    })
    const result = ctrl.listSuppliers(tenantCtx)
    assert.equal(result.length, 2)
  })

  it('createPurchaseOrder delegates', () => {
    const ctrl = makeController({
      createPurchaseOrder: () => ({ id: 'po-new', status: 'draft' })
    })
    const result = ctrl.createPurchaseOrder(tenantCtx, {
      items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
      totalAmount: 1
    })
    assert.equal(result.id, 'po-new')
  })

  it('confirmOrder delegates with orderId', () => {
    let capturedId: string | null = null
    const ctrl = makeController({
      confirmOrder: (id: string) => { capturedId = id; return { id, status: 'confirmed' } }
    })
    const result = ctrl.confirmOrder('po-abc', tenantCtx)
    assert.equal(result.status, 'confirmed')
    assert.equal(capturedId, 'po-abc')
  })

  it('receiveOrder delegates with orderId', () => {
    const ctrl = makeController({
      receiveOrder: (id: string) => ({ id, status: 'received' })
    })
    const result = ctrl.receiveOrder('po-xyz', tenantCtx)
    assert.equal(result.status, 'received')
  })

  it('listPurchaseOrders delegates with query', () => {
    let capturedQuery: any = null
    const ctrl = makeController({
      listPurchaseOrders: (_ctx: any, query: any) => { capturedQuery = query; return [] }
    })
    ctrl.listPurchaseOrders(tenantCtx, { status: 'draft' })
    assert.equal(capturedQuery.status, 'draft')
  })
})

describe('InventoryController — Error propagation', () => {
  it('getProduct propagates service error', () => {
    const ctrl = makeController({
      getProduct: () => { throw new Error('Product not found') }
    })
    assert.throws(
      () => ctrl.getProduct('bad-id', tenantCtx),
      /Product not found/
    )
  })

  it('stockOut propagates insufficient stock error', () => {
    const ctrl = makeController({
      stockOut: () => { throw new Error('Insufficient stock') }
    })
    assert.throws(
      () => ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 999 }),
      /Insufficient stock/
    )
  })

  it('confirmOrder propagates invalid transition error', () => {
    const ctrl = makeController({
      confirmOrder: () => { throw new Error('cannot be confirmed') }
    })
    assert.throws(
      () => ctrl.confirmOrder('po-bad', tenantCtx),
      /cannot be confirmed/
    )
  })
})
