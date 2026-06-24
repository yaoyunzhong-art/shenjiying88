import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  StockInDto,
  StockOutDto,
  AdjustStockDto,
  StockRecordQueryDto,
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreatePurchaseOrderItemDto,
  PurchaseOrderQueryDto
} from './inventory.dto'
import { ProductStatus, StockRecordType, PurchaseOrderStatus } from './inventory.entity'

describe('Inventory DTO — CreateProductDto', () => {
  test('validates required fields', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Bear Plush',
      sku: 'SKU-BP-001',
      unit: 'pcs',
      price: 99,
      cost: 50,
      minStock: 10,
      maxStock: 100,
      currentStock: 50
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects missing required fields', async () => {
    const dto = plainToInstance(CreateProductDto, {})
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  test('rejects negative price', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test', sku: 'S-1', unit: 'pcs', price: -10, cost: 5,
      minStock: 0, maxStock: 100, currentStock: 20
    })
    const errors = await validate(dto)
    const priceErrors = errors.filter((e) => e.property === 'price')
    assert.ok(priceErrors.length > 0)
  })

  test('accepts optional status', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test', sku: 'S-2', unit: 'pcs', price: 10, cost: 5,
      minStock: 0, maxStock: 100, currentStock: 20,
      status: ProductStatus.Inactive
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

describe('Inventory DTO — UpdateProductDto', () => {
  test('allows partial update with only name', async () => {
    const dto = plainToInstance(UpdateProductDto, { name: 'New Name' })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('allows partial update with only price', async () => {
    const dto = plainToInstance(UpdateProductDto, { price: 199 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects negative cost', async () => {
    const dto = plainToInstance(UpdateProductDto, { cost: -5 })
    const errors = await validate(dto)
    const costErrors = errors.filter((e) => e.property === 'cost')
    assert.ok(costErrors.length > 0)
  })
})

describe('Inventory DTO — ProductQueryDto', () => {
  test('validates optional query fields', async () => {
    const dto = plainToInstance(ProductQueryDto, {
      category: 'toys',
      keyword: 'bear',
      limit: 10,
      offset: 0
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('allows empty query', async () => {
    const dto = plainToInstance(ProductQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

describe('Inventory DTO — StockInDto', () => {
  test('validates correct stock in', async () => {
    const dto = plainToInstance(StockInDto, {
      productId: 'prod-1',
      quantity: 10,
      reason: 'restock',
      batchNo: 'B-001'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects quantity of 0', async () => {
    const dto = plainToInstance(StockInDto, { productId: 'p-1', quantity: 0 })
    const errors = await validate(dto)
    const qtyErrors = errors.filter((e) => e.property === 'quantity')
    assert.ok(qtyErrors.length > 0)
  })

  test('rejects missing productId', async () => {
    const dto = plainToInstance(StockInDto, { quantity: 5 })
    const errors = await validate(dto)
    const idErrors = errors.filter((e) => e.property === 'productId')
    assert.ok(idErrors.length > 0)
  })
})

describe('Inventory DTO — StockOutDto', () => {
  test('validates correct stock out', async () => {
    const dto = plainToInstance(StockOutDto, { productId: 'p-1', quantity: 3 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects quantity of 0', async () => {
    const dto = plainToInstance(StockOutDto, { productId: 'p-1', quantity: 0 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

describe('Inventory DTO — AdjustStockDto', () => {
  test('validates correct adjustment', async () => {
    const dto = plainToInstance(AdjustStockDto, {
      productId: 'p-1',
      newQuantity: 100,
      reason: 'inventory check'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects missing reason', async () => {
    const dto = plainToInstance(AdjustStockDto, { productId: 'p-1', newQuantity: 50 })
    const errors = await validate(dto)
    const reasonErrors = errors.filter((e) => e.property === 'reason')
    assert.ok(reasonErrors.length > 0)
  })
})

describe('Inventory DTO — StockRecordQueryDto', () => {
  test('validates query with type filter', async () => {
    const dto = plainToInstance(StockRecordQueryDto, {
      productId: 'p-1',
      type: StockRecordType.Inbound,
      dateFrom: '2026-01-01',
      dateTo: '2026-06-30',
      limit: 20,
      offset: 0
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('allows empty query', async () => {
    const dto = plainToInstance(StockRecordQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

describe('Inventory DTO — CreateSupplierDto', () => {
  test('validates with required name only', async () => {
    const dto = plainToInstance(CreateSupplierDto, { name: 'Acme Corp' })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects missing name', async () => {
    const dto = plainToInstance(CreateSupplierDto, { phone: '123456' })
    const errors = await validate(dto)
    const nameErrors = errors.filter((e) => e.property === 'name')
    assert.ok(nameErrors.length > 0)
  })
})

describe('Inventory DTO — CreatePurchaseOrderDto', () => {
  test('validates correct purchase order', async () => {
    const dto = plainToInstance(CreatePurchaseOrderDto, {
      storeId: 'store-1',
      supplierId: 'supplier-1',
      items: [{
        productId: 'p-1', productName: 'Ball', sku: 'B-1',
        quantity: 10, unitPrice: 15, totalPrice: 150
      }],
      totalAmount: 150
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects empty items array', async () => {
    const dto = plainToInstance(CreatePurchaseOrderDto, {
      items: [], totalAmount: 0
    })
    const errors = await validate(dto)
    const itemsErrors = errors.filter((e) => e.property === 'items')
    assert.ok(itemsErrors.length > 0)
  })

  test('rejects negative totalAmount', async () => {
    const dto = plainToInstance(CreatePurchaseOrderDto, {
      items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 10, totalPrice: 10 }],
      totalAmount: -1
    })
    const errors = await validate(dto)
    const amtErrors = errors.filter((e) => e.property === 'totalAmount')
    assert.ok(amtErrors.length > 0)
  })
})

describe('Inventory DTO — CreatePurchaseOrderItemDto', () => {
  test('validates correct item', async () => {
    const dto = plainToInstance(CreatePurchaseOrderItemDto, {
      productId: 'p-1', productName: 'Ball', sku: 'B-1',
      quantity: 5, unitPrice: 10, totalPrice: 50
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects quantity 0', async () => {
    const dto = plainToInstance(CreatePurchaseOrderItemDto, {
      productId: 'p-1', productName: 'B', sku: 'B-1',
      quantity: 0, unitPrice: 10, totalPrice: 0
    })
    const errors = await validate(dto)
    const qtyErrors = errors.filter((e) => e.property === 'quantity')
    assert.ok(qtyErrors.length > 0)
  })
})

describe('Inventory DTO — PurchaseOrderQueryDto', () => {
  test('validates with status filter', async () => {
    const dto = plainToInstance(PurchaseOrderQueryDto, {
      status: PurchaseOrderStatus.Draft,
      supplierId: 's-1',
      limit: 10
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('allows empty query', async () => {
    const dto = plainToInstance(PurchaseOrderQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})
