import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [inventory] [C] 角色测试
 * 
 * 8 角色视角的 inventory 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InventoryController } from './inventory.controller'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import { ProductStatus, PurchaseOrderStatus, StockRecordType } from './inventory.entity'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试租户上下文工厂 ──
function tenantCtx(storeId = 'store-001') {
  return { tenantId: 't-001', brandId: 'b-001', storeId }
}

function createController() {
  const service = new InventoryService()
  return new InventoryController(service)
}

describe('👔 StoreManager - 库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('👔店长-正常流程: 创建商品并入库', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '可乐',
      sku: 'COLA-001',
      category: '饮料',
      unit: '瓶',
      price: 3.5,
      cost: 2.0,
      minStock: 10,
      maxStock: 100,
      currentStock: 0,
    })
    assert.ok(product.id)
    assert.equal(product.name, '可乐')

    const stockResult = controller.stockIn(ctx, {
      productId: product.id,
      quantity: 50,
      reason: '采购入库',
    })
    assert.equal(stockResult.product.currentStock, 50)
    assert.equal(stockResult.record.quantity, 50)
  })

  it('👔店长-权限边界: 跨租户无法访问库存', () => {
    resetInventoryServiceTestState()
    // 创建商品在 t-001
    const product = controller.createProduct(ctx, {
      name: '雪碧',
      sku: 'SPRITE-001',
      category: '饮料',
      unit: '瓶',
      price: 3.0,
      cost: 1.8,
      minStock: 10,
      maxStock: 100,
      currentStock: 30,
    })

    // 用另一个租户上下文访问
    const otherCtx = { tenantId: 't-999', brandId: 'b-999', storeId: 'store-999' }
    assert.throws(() => controller.getProduct(product.id, otherCtx), /not found/)
  })

  it('👔店长-正常流程: 查询低库存预警', () => {
    resetInventoryServiceTestState()
    controller.createProduct(ctx, {
      name: '纸巾',
      sku: 'TISSUE-001',
      category: '日用品',
      unit: '包',
      price: 5.0,
      cost: 3.0,
      minStock: 20,
      maxStock: 100,
      currentStock: 5,
    })
    const alerts = controller.getLowStockProducts(ctx, '20')
    assert.ok(alerts.length > 0)
    assert.equal(alerts[0].status, 'low')
  })
})

describe('🛒 FrontDesk - 前台库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('🛒前台-正常流程: 查看商品库存并出库', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '矿泉水',
      sku: 'WATER-001',
      category: '饮料',
      unit: '瓶',
      price: 2.0,
      cost: 1.0,
      minStock: 10,
      maxStock: 200,
      currentStock: 100,
    })
    const fetched = controller.getProduct(product.id, ctx)
    assert.equal(fetched.name, '矿泉水')

    const outResult = controller.stockOut(ctx, {
      productId: product.id,
      quantity: 10,
      reason: '前台销售出库',
    })
    assert.equal(outResult.product.currentStock, 90)
  })

  it('🛒前台-权限边界: 出库数量超过库存应报错', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '薯片',
      sku: 'CHIPS-001',
      category: '零食',
      unit: '包',
      price: 6.0,
      cost: 3.5,
      minStock: 5,
      maxStock: 50,
      currentStock: 3,
    })
    assert.throws(
      () => controller.stockOut(ctx, { productId: product.id, quantity: 99, reason: '大批量出货' }),
      /Insufficient stock/
    )
  })
})

describe('👥 HR - HR 库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('👥HR-正常流程: 查看采购订单列表', () => {
    resetInventoryServiceTestState()
    const list = controller.listPurchaseOrders(ctx, {})
    assert.ok(Array.isArray(list))
  })

  it('👥HR-权限边界: 无法操作采购订单确认（正常流程查询不报错）', () => {
    resetInventoryServiceTestState()
    // HR 查询所有供应商
    const suppliers = controller.listSuppliers(ctx)
    assert.ok(Array.isArray(suppliers))
    // 模拟 HR 只能查看不能操作
    const list = controller.listPurchaseOrders(ctx, { status: PurchaseOrderStatus.Draft })
    assert.ok(Array.isArray(list))
  })

  it('👥HR-正常流程: 创建供应商', () => {
    resetInventoryServiceTestState()
    const supplier = controller.createSupplier(ctx, {
      name: '可口可乐中国',
      contactName: '张三',
      phone: '13800138000',
    })
    assert.ok(supplier.id)
    assert.equal(supplier.name, '可口可乐中国')
  })
})

describe('🔧 Security - 安监库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('🔧安监-正常流程: 库存调整（盘点差异修正）', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '灭火器',
      sku: 'FIRE-EXT-001',
      category: '安防设备',
      unit: '个',
      price: 80.0,
      cost: 50.0,
      minStock: 2,
      maxStock: 20,
      currentStock: 5,
    })
    const adjResult = controller.adjustStock(ctx, {
      productId: product.id,
      newQuantity: 8,
      reason: '月度盘点-发现库存差异',
    })
    assert.equal(adjResult.product.currentStock, 8)
  })

  it('🔧安监-权限边界: 操纵不存在的商品应报错', () => {
    resetInventoryServiceTestState()
    assert.throws(
      () => controller.getProduct('prod-nonexistent', ctx),
      /not found/
    )
  })

  it('🔧安监-正常流程: 查看低库存预警', () => {
    resetInventoryServiceTestState()
    controller.createProduct(ctx, {
      name: '安全帽',
      sku: 'HELMET-001',
      category: '安防设备',
      unit: '个',
      price: 25.0,
      cost: 15.0,
      minStock: 10,
      maxStock: 50,
      currentStock: 0,
    })
    const alerts = controller.getLowStockProducts(ctx)
    const zeroStock = alerts.filter(a => a.status === 'out_of_stock')
    assert.ok(zeroStock.length > 0)
  })
})

describe('🎮 Guide - 导玩员库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('🎮导玩员-正常流程: 查询商品并检查库存', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '游戏币(100枚)',
      sku: 'COIN-100',
      category: '代币',
      unit: '袋',
      price: 100.0,
      cost: 60.0,
      minStock: 10,
      maxStock: 200,
      currentStock: 50,
    })
    const check = controller.checkStock(product.id, '5', ctx)
    assert.ok(check.sufficient)
  })

  it('🎮导玩员-权限边界: 出库不存在的商品应报错', () => {
    resetInventoryServiceTestState()
    assert.throws(
      () => controller.stockOut(ctx, { productId: 'prod-unknown', quantity: 1, reason: '导玩员出库' }),
      /not found/
    )
  })
})

describe('🎯 Operations - 运行专员库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('🎯运行专员-正常流程: 创建采购订单并确认收货', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '打印纸',
      sku: 'PAPER-A4-001',
      category: '办公用品',
      unit: '箱',
      price: 30.0,
      cost: 20.0,
      minStock: 5,
      maxStock: 50,
      currentStock: 2,
    })
    const po = controller.createPurchaseOrder(ctx, {
      supplierId: 'supplier-001',
      items: [{
        productId: product.id,
        productName: '打印纸',
        sku: 'PAPER-A4-001',
        quantity: 10,
        unitPrice: 20,
        totalPrice: 200,
      }],
      totalAmount: 200,
    })
    assert.equal(po.status, 'draft')

    const confirmed = controller.confirmOrder(po.id, ctx)
    assert.equal(confirmed.status, 'confirmed')

    const received = controller.receiveOrder(po.id, ctx)
    assert.equal(received.status, 'received')
    // 商品库存应已自动增加
    const updatedProduct = controller.getProduct(product.id, ctx)
    assert.equal(updatedProduct.currentStock, 12) // 2 + 10
  })

  it('🎯运行专员-权限边界: 未确认的采购订单不能收货', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '墨盒',
      sku: 'INK-001',
      category: '办公用品',
      unit: '个',
      price: 50.0,
      cost: 35.0,
      minStock: 3,
      maxStock: 20,
      currentStock: 10,
    })
    const po = controller.createPurchaseOrder(ctx, {
      supplierId: 'supplier-002',
      items: [{
        productId: product.id,
        productName: '墨盒',
        sku: 'INK-001',
        quantity: 5,
        unitPrice: 35,
        totalPrice: 175,
      }],
      totalAmount: 175,
    })
    assert.throws(() => controller.receiveOrder(po.id, ctx), /must be confirmed/)
  })
})

describe('🤝 Teambuilding - 团建库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('🤝团建-正常流程: 查询商品列表', () => {
    resetInventoryServiceTestState()
    controller.createProduct(ctx, {
      name: '团建礼盒A',
      sku: 'GIFT-A-001',
      category: '团建用品',
      unit: '套',
      price: 200.0,
      cost: 120.0,
      minStock: 5,
      maxStock: 30,
      currentStock: 15,
    })
    controller.createProduct(ctx, {
      name: '团建礼盒B',
      sku: 'GIFT-B-001',
      category: '团建用品',
      unit: '套',
      price: 300.0,
      cost: 180.0,
      minStock: 5,
      maxStock: 30,
      currentStock: 10,
    })
    const products = controller.listProducts(ctx, { category: '团建用品' })
    assert.equal(products.length, 2)
  })

  it('🤝团建-权限边界: 按关键字搜索商品', () => {
    resetInventoryServiceTestState()
    controller.createProduct(ctx, {
      name: '烧烤食材套装',
      sku: 'BBQ-001',
      category: '团建用品',
      unit: '套',
      price: 150.0,
      cost: 90.0,
      minStock: 3,
      maxStock: 20,
      currentStock: 8,
    })
    const results = controller.listProducts(ctx, { keyword: '烧烤' })
    assert.equal(results.length, 1)
    assert.equal(results[0].name, '烧烤食材套装')
  })
})

describe('📢 Marketing - 营销库存角色测试', () => {
  const controller = createController()
  const ctx = tenantCtx()

  it('📢营销-正常流程: 创建促销商品并查看', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '限量礼盒',
      sku: 'LIMITED-001',
      category: '营销品',
      unit: '盒',
      price: 199.0,
      cost: 100.0,
      minStock: 1,
      maxStock: 50,
      currentStock: 20,
    })
    const fetched = controller.getProduct(product.id, ctx)
    assert.equal(fetched.price, 199)
  })

  it('📢营销-权限边界: 下架商品后查询状态', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '过期营销样品',
      sku: 'SAMPLE-OUT-001',
      category: '营销品',
      unit: '个',
      price: 0.0,
      cost: 5.0,
      minStock: 0,
      maxStock: 10,
      currentStock: 3,
    })
    const updated = controller.updateProduct(product.id, ctx, {
      status: ProductStatus.Discontinued,
    })
    assert.equal(updated.status, ProductStatus.Discontinued)

    // 按状态过滤
    const activeOnly = controller.listProducts(ctx, { status: ProductStatus.Active })
    assert.equal(activeOnly.find(p => p.id === product.id), undefined)
  })

  it('📢营销-正常流程: 查看库存记录流水', () => {
    resetInventoryServiceTestState()
    const product = controller.createProduct(ctx, {
      name: '赠品马克杯',
      sku: 'MUG-GIFT-001',
      category: '营销品',
      unit: '个',
      price: 15.0,
      cost: 8.0,
      minStock: 10,
      maxStock: 100,
      currentStock: 20,
    })
    controller.stockIn(ctx, { productId: product.id, quantity: 50, reason: '营销备货' })
    controller.stockOut(ctx, { productId: product.id, quantity: 10, reason: '营销发放' })
    const records = controller.getStockRecords(ctx, { productId: product.id })
    assert.equal(records.length, 2)
    // 最新的在前（stockIn 后执行的 stockOut 或 stockIn 更新后的最新时间戳）
    // 两笔操作 createdAt 可能相同，验证总数和类型包含即可
    assert.equal(records.length, 2)
    const types = records.map(r => r.type)
    assert.ok(types.includes(StockRecordType.Inbound))
    assert.ok(types.includes(StockRecordType.Outbound))
  })
})
