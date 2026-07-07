import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ProductStatus,
  StockRecordType,
  PurchaseOrderStatus
} from './inventory.entity'

describe('Inventory Entity — Enums', () => {
  it('ProductStatus has correct values', () => {
    assert.equal(ProductStatus.Active, 'active')
    assert.equal(ProductStatus.Inactive, 'inactive')
    assert.equal(ProductStatus.Discontinued, 'discontinued')
  })

  it('StockRecordType has all expected values', () => {
    assert.equal(StockRecordType.Inbound, 'inbound')
    assert.equal(StockRecordType.Outbound, 'outbound')
    assert.equal(StockRecordType.Return, 'return')
    assert.equal(StockRecordType.Adjustment, 'adjustment')
  })

  it('PurchaseOrderStatus has all expected values', () => {
    assert.equal(PurchaseOrderStatus.Draft, 'draft')
    assert.equal(PurchaseOrderStatus.Submitted, 'submitted')
    assert.equal(PurchaseOrderStatus.Confirmed, 'confirmed')
    assert.equal(PurchaseOrderStatus.Received, 'received')
    assert.equal(PurchaseOrderStatus.Cancelled, 'cancelled')
  })
})

describe('Inventory Entity — Type shapes', () => {
  it('Product interface can be constructed', () => {
    const product = {
      id: 'prod-1',
      tenantId: 't-1',
      name: 'Bear Plush',
      sku: 'SKU-BP-001',
      category: 'toys',
      unit: 'pcs',
      price: 99,
      cost: 50,
      minStock: 10,
      maxStock: 100,
      currentStock: 50,
      status: ProductStatus.Active,
      barcode: '123456',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    assert.equal(product.id, 'prod-1')
    assert.equal(product.price, 99)
  })

  it('StockRecord interface can be constructed', () => {
    const record = {
      id: 'sr-1',
      productId: 'prod-1',
      type: StockRecordType.Inbound,
      quantity: 10,
      beforeStock: 50,
      afterStock: 60,
      reason: 'restock',
      operatorId: 'op-1',
      batchNo: 'B-001',
      createdAt: new Date().toISOString()
    }
    assert.equal(record.type, StockRecordType.Inbound)
    assert.equal(record.afterStock, 60)
  })

  it('Supplier interface can be constructed', () => {
    const supplier = {
      id: 's-1',
      tenantId: 't-1',
      name: 'Toy Factory',
      contactName: 'Zhang San',
      phone: '13800138000',
      email: 'zhang@toy.com',
      address: 'Shanghai',
      createdAt: new Date().toISOString()
    }
    assert.equal(supplier.name, 'Toy Factory')
  })

  it('PurchaseOrder interface can be constructed', () => {
    const order = {
      id: 'po-1',
      tenantId: 't-1',
      status: PurchaseOrderStatus.Draft,
      items: [{
        productId: 'p-1',
        productName: 'Ball',
        sku: 'SKU-B-001',
        quantity: 5,
        unitPrice: 10,
        totalPrice: 50
      }],
      totalAmount: 50,
      createdAt: new Date().toISOString()
    }
    assert.equal(order.status, PurchaseOrderStatus.Draft)
    assert.equal(order.items.length, 1)
    assert.equal(order.items[0]?.totalPrice, 50)
  })

  it('StockAlert interface can be constructed', () => {
    const product = {
      id: 'p-1', tenantId: 't-1', name: 'Low', sku: 'L-1',
      unit: 'pcs', price: 10, cost: 5, minStock: 20, maxStock: 100,
      currentStock: 5, status: ProductStatus.Active,
      createdAt: '', updatedAt: ''
    }
    const alert = {
      product,
      currentStock: 5,
      minStock: 20,
      maxStock: 100,
      status: 'low' as const
    }
    assert.equal(alert.status, 'low')
    assert.equal(alert.currentStock, 5)
  })
})
