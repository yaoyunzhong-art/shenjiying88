import { describe, it, expect, beforeEach } from 'vitest'
import { ProductService, SKUService } from './inventory-product.service'

const TENANT = 'tenant-001'
const BRAND = 'brand-001'
const STORE = 'store-001'
const OTHER_TENANT = 'tenant-002'

describe('ProductService', () => {
  let service: ProductService

  beforeEach(() => {
    service = new ProductService()
  })

  it('should create a product with generated id', () => {
    const product = service.createProduct(TENANT, BRAND, STORE, {
      name: '投篮机',
      sku: 'SKU-001',
      category: '设备',
      price: 5000,
      cost: 3000,
    })
    expect(product.id).toBeTruthy()
    expect(product.name).toBe('投篮机')
    expect(product.status).toBe('ACTIVE')
    expect(product.tenantId).toBe(TENANT)
  })

  it('should get product by id', () => {
    const p = service.createProduct(TENANT, BRAND, STORE, { name: '测试', sku: 'SKU-002', category: '设备', price: 100, cost: 50 })
    const fetched = service.getProduct(p.id, TENANT)
    expect(fetched).not.toBeNull()
    expect(fetched.id).toBe(p.id)
  })

  it('should throw on non-existent product', () => {
    expect(() => service.getProduct('nonexistent', TENANT)).toThrow('not found')
  })

  it('should enforce tenant isolation', () => {
    const p = service.createProduct(TENANT, BRAND, STORE, { name: '专属', sku: 'SKU-003', category: '设备', price: 100, cost: 50 })
    expect(() => service.getProduct(p.id, OTHER_TENANT)).toThrow('not found')
  })

  it('should update a product', () => {
    const p = service.createProduct(TENANT, BRAND, STORE, { name: '旧名字', sku: 'SKU-004', category: '设备', price: 100, cost: 50 })
    const updated = service.updateProduct(p.id, TENANT, { name: '新名字', price: 150 })
    expect(updated.name).toBe('新名字')
    expect(updated.price).toBe(150)
  })

  it('should throw on updating non-existent product', () => {
    expect(() => service.updateProduct('ghost', TENANT, { name: '新版' })).toThrow('not found')
  })

  it('should reject duplicate SKU', () => {
    service.createProduct(TENANT, BRAND, STORE, { name: 'A', sku: 'DUPE', category: '设备', price: 100, cost: 50 })
    expect(() => service.createProduct(TENANT, BRAND, STORE, { name: 'B', sku: 'DUPE', category: '设备', price: 50, cost: 25 }))
      .toThrow('already exists')
  })

  it('should list products with tenant isolation', () => {
    service.createProduct(TENANT, BRAND, STORE, { name: 'P1', sku: 'S1', category: '设备', price: 100, cost: 50 })
    service.createProduct(TENANT, BRAND, STORE, { name: 'P2', sku: 'S2', category: '设备', price: 200, cost: 100 })
    service.createProduct(OTHER_TENANT, BRAND, STORE, { name: 'P-other', sku: 'S3', category: '设备', price: 300, cost: 150 })
    const list = service.listProducts(TENANT)
    expect(list).toHaveLength(2)
  })

  it('should filter products by category', () => {
    service.createProduct(TENANT, BRAND, STORE, { name: 'A', sku: 'SA', category: '设备', price: 100, cost: 50 })
    service.createProduct(TENANT, BRAND, STORE, { name: 'B', sku: 'SB', category: '配件', price: 50, cost: 20 })
    const devices = service.listProducts(TENANT, { category: '设备' })
    expect(devices).toHaveLength(1)
    expect(devices[0].name).toBe('A')
  })

  it('should filter products by status', () => {
    const p = service.createProduct(TENANT, BRAND, STORE, { name: 'A', sku: 'SA', category: '设备', price: 100, cost: 50 })
    service.updateProduct(p.id, TENANT, { status: 'INACTIVE' })
    service.createProduct(TENANT, BRAND, STORE, { name: 'B', sku: 'SB', category: '设备', price: 50, cost: 20 })
    const active = service.listProducts(TENANT, { status: 'ACTIVE' })
    expect(active).toHaveLength(1)
  })

  it('should link and get LYT product', () => {
    const p = service.createProduct(TENANT, BRAND, STORE, { name: 'LYT测试', sku: 'LYT-001', category: '设备', price: 100, cost: 50, lytProductId: 'lyt-123' })
    const link = service.getLytLink(p.id, TENANT)
    expect(link).toBe('lyt-123')
  })
})

describe('SKUService', () => {
  let productService: ProductService
  let skuService: SKUService

  beforeEach(() => {
    productService = new ProductService()
    skuService = new SKUService(productService)
  })

  function setupProduct(): string {
    return productService.createProduct(TENANT, BRAND, STORE, { name: '多规格商品', sku: 'PROD', category: '设备', price: 100, cost: 50 }).id
  }

  it('should create SKU variants for a product', () => {
    const prodId = setupProduct()
    const skus = skuService.createSKU(TENANT, {
      productId: prodId,
      variants: [{ color: 'red' }, { color: 'blue' }],
      initialQty: 50,
    })
    expect(skus).toHaveLength(2)
    expect(skus[0].sku).toContain('PROD-')
  })

  it('should update SKU stock with delta', () => {
    const prodId = setupProduct()
    const skus = skuService.createSKU(TENANT, { productId: prodId, variants: [{ color: 'red' }], initialQty: 50 })
    const updated = skuService.updateSKUStock(skus[0].id, TENANT, 10)
    expect(updated.totalQty).toBe(60)
  })

  it('should throw when updating stock below zero', () => {
    const prodId = setupProduct()
    const skus = skuService.createSKU(TENANT, { productId: prodId, variants: [{ color: 'red' }], initialQty: 5 })
    expect(() => skuService.updateSKUStock(skus[0].id, TENANT, -999)).toThrow('Insufficient')
  })

  it('should list SKUs by product', () => {
    const prodId = setupProduct()
    skuService.createSKU(TENANT, { productId: prodId, variants: [{ color: 'red' }, { color: 'blue' }], initialQty: 10 })
    const skus = skuService.listSKUs(prodId, TENANT)
    expect(skus).toHaveLength(2)
  })

  it('should throw listing SKUs for non-existent product', () => {
    expect(() => skuService.listSKUs('ghost-prod', TENANT)).toThrow('not found')
  })

  it('should reserve SKU quantity', () => {
    const prodId = setupProduct()
    const skus = skuService.createSKU(TENANT, { productId: prodId, variants: [{ color: 'red' }], initialQty: 50 })
    const updated = skuService.reserveSKU(TENANT, { skuId: skus[0].id, orderId: 'order-1', quantity: 10 })
    expect(updated.availableQty).toBe(40)
    expect(updated.reservedQty).toBe(10)
  })

  it('should throw on reserving more than available', () => {
    const prodId = setupProduct()
    const skus = skuService.createSKU(TENANT, { productId: prodId, variants: [{ color: 'red' }], initialQty: 5 })
    expect(() => skuService.reserveSKU(TENANT, { skuId: skus[0].id, orderId: 'o-1', quantity: 99 }))
      .toThrow('Insufficient')
  })

  it('should release reservation', () => {
    const prodId = setupProduct()
    const skus = skuService.createSKU(TENANT, { productId: prodId, variants: [{ color: 'red' }], initialQty: 50 })
    skuService.reserveSKU(TENANT, { skuId: skus[0].id, orderId: 'o-1', quantity: 10 })
    const released = skuService.releaseReservation(skus[0].id, TENANT, 5)
    expect(released.reservedQty).toBe(5)
  })

  it('should enforce version increment on updates', () => {
    const prodId = setupProduct()
    const skus = skuService.createSKU(TENANT, { productId: prodId, variants: [{ color: 'red' }], initialQty: 50 })
    expect(skus[0].version).toBe(1)
    const updated = skuService.updateSKUStock(skus[0].id, TENANT, 10)
    expect(updated.version).toBe(2)
  })
})
