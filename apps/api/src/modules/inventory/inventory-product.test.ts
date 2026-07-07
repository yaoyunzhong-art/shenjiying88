import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { ProductService, SKUService } from './inventory-product.service'

const tenantId = 'tenant-t110'
const brandId = 'brand-t110'
const storeId = 'store-t110'

describe('T110-1 InventoryProductService', () => {
  let productSvc: ProductService
  let skuSvc: SKUService

  beforeEach(() => {
    productSvc = new ProductService()
    skuSvc = new SKUService(productSvc)
  })

  afterEach(() => {
    productSvc.reset()
  })

  // ════════════════════════════════════════════════════════════
  // ProductService: 创建商品
  // ════════════════════════════════════════════════════════════

  describe('ProductService.createProduct', () => {
    it('合法参数创建商品成功', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 手机',
        sku: 'PHONE-T110',
        category: '电子产品',
        price: 2999,
        cost: 1500
      })

      assert.ok(product.id.startsWith('prod-'))
      assert.equal(product.name, 'T110 手机')
      assert.equal(product.sku, 'PHONE-T110')
      assert.equal(product.category, '电子产品')
      assert.equal(product.price, 2999)
      assert.equal(product.cost, 1500)
      assert.equal(product.status, 'ACTIVE')
      assert.equal(product.tenantId, tenantId)
    })

    it('带 LYT 关联创建商品', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 手机',
        sku: 'PHONE-T110-LYT',
        category: '电子产品',
        price: 2999,
        cost: 1500,
        lytProductId: 'lyt-12345'
      })

      assert.equal(product.lytProductId, 'lyt-12345')
      const link = productSvc.getLytLink(product.id, tenantId)
      assert.equal(link, 'lyt-12345')
    })

    it('重复 SKU 报错 ConflictException', () => {
      productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'Product A',
        sku: 'DUP-SKU',
        category: 'A',
        price: 100,
        cost: 50
      })

      assert.throws(() => {
        productSvc.createProduct(tenantId, brandId, storeId, {
          name: 'Product B',
          sku: 'DUP-SKU',
          category: 'B',
          price: 200,
          cost: 100
        })
      }, /already exists/)
    })

    it('不同租户可使用相同 SKU', () => {
      productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'Product A',
        sku: 'CROSS-TENANT-SKU',
        category: 'A',
        price: 100,
        cost: 50
      })

      const other = new ProductService()
      const product = other.createProduct('tenant-OTHER', brandId, storeId, {
        name: 'Product B',
        sku: 'CROSS-TENANT-SKU',
        category: 'B',
        price: 200,
        cost: 100
      })

      assert.equal(product.sku, 'CROSS-TENANT-SKU')
    })
  })

  // ════════════════════════════════════════════════════════════
  // ProductService: 更新商品
  // ════════════════════════════════════════════════════════════

  describe('ProductService.updateProduct', () => {
    it('更新单个字段只影响该字段', () => {
      const original = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'Old Name',
        sku: 'UPDATE-TEST',
        category: 'Cat-A',
        price: 1000,
        cost: 500
      })

      const updated = productSvc.updateProduct(original.id, tenantId, {
        name: 'New Name'
      })

      assert.equal(updated.name, 'New Name')
      assert.equal(updated.sku, 'UPDATE-TEST')
      assert.equal(updated.category, 'Cat-A')
      assert.equal(updated.price, 1000)
    })

    it('更新多个字段全部生效', () => {
      const original = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'Name',
        sku: 'MULTI-UPDATE',
        category: 'Cat',
        price: 100,
        cost: 50
      })

      const updated = productSvc.updateProduct(original.id, tenantId, {
        name: 'New Name',
        price: 200,
        status: 'INACTIVE'
      })

      assert.equal(updated.name, 'New Name')
      assert.equal(updated.price, 200)
      assert.equal(updated.status, 'INACTIVE')
    })

    it('更新不存在的商品报错', () => {
      assert.throws(() => {
        productSvc.updateProduct('nonexistent-id', tenantId, { name: 'Test' })
      }, /not found/)
    })

    it('跨租户更新商品报错', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'Test',
        sku: 'CROSS-UPDATE',
        category: 'Cat',
        price: 100,
        cost: 50
      })

      assert.throws(() => {
        productSvc.updateProduct(product.id, 'tenant-OTHER', { name: 'Hack' })
      }, /not found/)
    })
  })

  // ════════════════════════════════════════════════════════════
  // ProductService: LYT 关联
  // ════════════════════════════════════════════════════════════

  describe('ProductService LYT Link', () => {
    it('linkLytProduct 保存关联关系', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110',
        sku: 'LYT-LINK-TEST',
        category: 'Electronics',
        price: 999,
        cost: 500
      })

      productSvc.linkLytProduct(product.id, 'lyt-88888', tenantId)
      const link = productSvc.getLytLink(product.id, tenantId)
      assert.equal(link, 'lyt-88888')
    })

    it('getLytLink 无关联返回 null', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110',
        sku: 'NO-LYT',
        category: 'Electronics',
        price: 999,
        cost: 500
      })

      const link = productSvc.getLytLink(product.id, tenantId)
      assert.equal(link, null)
    })

    it('linkLytProduct 跨租户报错', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110',
        sku: 'LYT-CROSS-TENANT',
        category: 'Electronics',
        price: 999,
        cost: 500
      })

      assert.throws(() => {
        productSvc.linkLytProduct(product.id, 'lyt-999', 'tenant-OTHER')
      }, /not found/)
    })
  })

  // ════════════════════════════════════════════════════════════
  // SKUService: 创建 SKU
  // ════════════════════════════════════════════════════════════

  describe('SKUService.createSKU', () => {
    it('单色单尺码创建单个 SKU', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 T-Shirt',
        sku: 'TSHIRT-T110',
        category: '服装',
        price: 199,
        cost: 80
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '红色' }]
      })

      assert.equal(skus.length, 1)
      assert.ok(skus[0].sku.includes('C-红色'))
    })

    it('多颜色生成多个 SKU 变体', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Shoes',
        sku: 'SHOES-T110',
        category: '鞋',
        price: 599,
        cost: 300
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [
          { color: '黑色' },
          { color: '白色' },
          { color: '蓝色' }
        ]
      })

      assert.equal(skus.length, 3)
      const colors = skus.map(s => s.attributes.color)
      assert.ok(colors.includes('黑色'))
      assert.ok(colors.includes('白色'))
      assert.ok(colors.includes('蓝色'))
    })

    it('颜色+尺码生成笛卡尔积 SKU', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Pants',
        sku: 'PANTS-T110',
        category: '服装',
        price: 299,
        cost: 120
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [
          { color: '黑色', size: 'S' },
          { color: '黑色', size: 'M' },
          { color: '黑色', size: 'L' },
          { color: '白色', size: 'S' },
          { color: '白色', size: 'M' },
          { color: '白色', size: 'L' }
        ]
      })

      assert.equal(skus.length, 6)
    })

    it('重复 SKU 变体报错', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Bag',
        sku: 'BAG-T110',
        category: '箱包',
        price: 399,
        cost: 150
      })

      skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '红色' }]
      })

      assert.throws(() => {
        skuSvc.createSKU(tenantId, {
          productId: product.id,
          variants: [{ color: '红色' }]
        })
      }, /already exists/)
    })

    it('带规格参数创建 SKU', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Spec',
        sku: 'SPEC-T110',
        category: '配件',
        price: 199,
        cost: 80
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ spec: '128GB' }, { spec: '256GB' }]
      })

      assert.equal(skus.length, 2)
      assert.ok(skus[0].sku.includes('SP-128GB'))
    })
  })

  // ════════════════════════════════════════════════════════════
  // SKUService: 库存更新
  // ════════════════════════════════════════════════════════════

  describe('SKUService.updateSKUStock', () => {
    it('增量增加库存', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Widget',
        sku: 'WIDGET-T110',
        category: '配件',
        price: 99,
        cost: 40
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '蓝' }],
        initialQty: 10
      })

      const updated = skuSvc.updateSKUStock(skus[0].id, tenantId, 5)

      assert.equal(updated.totalQty, 15)
      assert.equal(updated.availableQty, 15)
    })

    it('增量减少库存', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Gadget',
        sku: 'GADGET-T110',
        category: '配件',
        price: 199,
        cost: 80
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '绿' }],
        initialQty: 20
      })

      const updated = skuSvc.updateSKUStock(skus[0].id, tenantId, -8)

      assert.equal(updated.totalQty, 12)
      assert.equal(updated.availableQty, 12)
    })

    it('库存不足时减少报错', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Item',
        sku: 'ITEM-T110',
        category: '杂项',
        price: 50,
        cost: 20
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '灰' }],
        initialQty: 5
      })

      assert.throws(() => {
        skuSvc.updateSKUStock(skus[0].id, tenantId, -10)
      }, /Insufficient stock/)
    })
  })

  // ════════════════════════════════════════════════════════════
  // SKUService: 预留 / 释放
  // ════════════════════════════════════════════════════════════

  describe('SKUService.reserveSKU', () => {
    it('预留后 availableQty 减少 reservedQty 增加', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Reserve',
        sku: 'RESERVE-T110',
        category: '测试',
        price: 299,
        cost: 100
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '黑' }],
        initialQty: 50
      })

      const reserved = skuSvc.reserveSKU(tenantId, {
        skuId: skus[0].id,
        orderId: 'order-001',
        quantity: 10
      })

      assert.equal(reserved.reservedQty, 10)
      assert.equal(reserved.availableQty, 40)
    })

    it('多次预留累加 reservedQty', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Multi Reserve',
        sku: 'MULTI-RESERVE',
        category: '测试',
        price: 199,
        cost: 80
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '白' }],
        initialQty: 100
      })

      skuSvc.reserveSKU(tenantId, {
        skuId: skus[0].id,
        orderId: 'order-A',
        quantity: 20
      })

      const second = skuSvc.reserveSKU(tenantId, {
        skuId: skus[0].id,
        orderId: 'order-B',
        quantity: 15
      })

      assert.equal(second.reservedQty, 35)
      assert.equal(second.availableQty, 65)
    })

    it('预留超过可用库存报错', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Over Reserve',
        sku: 'OVER-RESERVE',
        category: '测试',
        price: 99,
        cost: 30
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '红' }],
        initialQty: 5
      })

      assert.throws(() => {
        skuSvc.reserveSKU(tenantId, {
          skuId: skus[0].id,
          orderId: 'order-OVER',
          quantity: 10
        })
      }, /Insufficient/)
    })
  })

  describe('SKUService.releaseReservation', () => {
    it('释放预留后 reservedQty 减少 availableQty 恢复', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Release',
        sku: 'RELEASE-T110',
        category: '测试',
        price: 399,
        cost: 150
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '蓝' }],
        initialQty: 80
      })

      skuSvc.reserveSKU(tenantId, {
        skuId: skus[0].id,
        orderId: 'order-REL',
        quantity: 30
      })

      const released = skuSvc.releaseReservation(skus[0].id, tenantId, 30)

      assert.equal(released.reservedQty, 0)
      assert.equal(released.availableQty, 80)
    })

    it('释放数量超过已预留报错', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 Over Release',
        sku: 'OVER-RELEASE',
        category: '测试',
        price: 199,
        cost: 80
      })

      const skus = skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [{ color: '黄' }],
        initialQty: 50
      })

      assert.throws(() => {
        skuSvc.releaseReservation(skus[0].id, tenantId, 100)
      }, /Cannot release/)
    })
  })

  // ════════════════════════════════════════════════════════════
  // SKUService: listSKUs
  // ════════════════════════════════════════════════════════════

  describe('SKUService.listSKUs', () => {
    it('返回商品的所有 SKU', () => {
      const product = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'T110 List SKUs',
        sku: 'LIST-SKU-T110',
        category: '测试',
        price: 299,
        cost: 120
      })

      skuSvc.createSKU(tenantId, {
        productId: product.id,
        variants: [
          { color: '红', size: 'S' },
          { color: '红', size: 'M' },
          { color: '蓝', size: 'S' },
          { color: '蓝', size: 'M' }
        ]
      })

      const skus = skuSvc.listSKUs(product.id, tenantId)
      assert.equal(skus.length, 4)
    })

    it('不同商品的 SKU 互不干扰', () => {
      const p1 = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'Product 1',
        sku: 'P1-SKU',
        category: 'C1',
        price: 100,
        cost: 50
      })

      const p2 = productSvc.createProduct(tenantId, brandId, storeId, {
        name: 'Product 2',
        sku: 'P2-SKU',
        category: 'C2',
        price: 200,
        cost: 100
      })

      skuSvc.createSKU(tenantId, {
        productId: p1.id,
        variants: [{ color: 'A' }]
      })

      skuSvc.createSKU(tenantId, {
        productId: p2.id,
        variants: [{ color: 'B' }, { color: 'C' }]
      })

      const p1Skus = skuSvc.listSKUs(p1.id, tenantId)
      const p2Skus = skuSvc.listSKUs(p2.id, tenantId)

      assert.equal(p1Skus.length, 1)
      assert.equal(p2Skus.length, 2)
    })
  })
})
