/**
 * 🐜 自动: [inventory] [C] 角色测试
 *
 * 8 角色视角的 inventory 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/业务场景）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { InventoryController } from './inventory.controller'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import { StockRecordType } from './inventory.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

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

// ── 测试数据工厂 ──
const tenantCtx: RequestTenantContext = {
  tenantId: 't-inv-role',
  brandId: 'b-arcade',
  storeId: 's-main',
}

function createController() {
  resetInventoryServiceTestState()
  const service = new InventoryService()
  return new InventoryController(service)
}

// ─────────────────────────────────────────────────────────
// 👔店长 (StoreManager) — 全局库存管理、采购审批
// ─────────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} — 店长视角`, () => {
  test('完整采购流程：创建商品 → 入库 → 创建采购单 → 确认 → 收货', () => {
    const ctrl = createController()

    // 创建商品
    const product = ctrl.createProduct(tenantCtx, {
      name: 'Switch 手柄',
      sku: 'SW-HL-001',
      unit: '个',
      price: 450,
      cost: 300,
      minStock: 5,
      maxStock: 100,
      currentStock: 0,
    })
    assert.equal(product.name, 'Switch 手柄')
    assert.equal(product.currentStock, 0)

    // 入库
    const { product: stockedProduct } = ctrl.stockIn(tenantCtx, {
      productId: product.id,
      quantity: 30,
      reason: '首单到货',
    })
    assert.equal(stockedProduct.currentStock, 30)

    // 创建采购单
    const po = ctrl.createPurchaseOrder(tenantCtx, {
      items: [{ productId: product.id, productName: product.name, sku: product.sku, quantity: 20, unitPrice: 300, totalPrice: 6000 }],
      totalAmount: 6000,
    })
    assert.equal(po.status, 'draft')

    // 确认采购单
    const confirmed = ctrl.confirmOrder(po.id, tenantCtx)
    assert.equal(confirmed.status, 'confirmed')

    // 收货 → 自动入库
    const received = ctrl.receiveOrder(po.id, tenantCtx)
    assert.equal(received.status, 'received')

    // 验证库存增加了采购量
    const updatedProduct = ctrl.getProduct(product.id, tenantCtx)
    assert.equal(updatedProduct.currentStock, 50)
  })

  test('低库存预警阈值可配置', () => {
    const ctrl = createController()
    const p1 = ctrl.createProduct(tenantCtx, {
      name: '饮料', sku: 'DR-001', unit: '瓶', price: 5, cost: 3,
      minStock: 10, maxStock: 200, currentStock: 8,
    })
    ctrl.createProduct(tenantCtx, {
      name: '零食', sku: 'SN-001', unit: '包', price: 10, cost: 6,
      minStock: 20, maxStock: 100, currentStock: 25,
    })

    // 使用默认阈值（minStock）
    const alerts = ctrl.getLowStockProducts(tenantCtx, undefined)
    assert(alerts.length > 0)
    const p1Alert = alerts.find((a: any) => a.product.id === p1.id)
    assert(p1Alert, '低库存商品应在预警列表')
    assert.equal(p1Alert.status, 'low')
  })

  test('越权：不可查看其他门店的库存', () => {
    const ctrl = createController()
    ctrl.createProduct(tenantCtx, {
      name: '街机摇杆', sku: 'ARC-STK-001', unit: '个', price: 800, cost: 500,
      minStock: 2, maxStock: 50, currentStock: 10,
    })

    const otherTenantCtx: RequestTenantContext = { tenantId: 't-other-store', brandId: 'b-other', storeId: 's-other' }
    const products = ctrl.listProducts(otherTenantCtx, {})
    assert.equal(products.length, 0, '其他门店不应看到本门店商品')
  })
})

// ─────────────────────────────────────────────────────────
// 🛒前台 (FrontDesk) — 日常销售出库
// ─────────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} — 前台视角`, () => {
  test('正常销售出库流程', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '游戏币', sku: 'COIN-001', unit: '枚', price: 1, cost: 0.5,
      minStock: 500, maxStock: 10000, currentStock: 3000,
    })

    const { product: afterSale } = ctrl.stockOut(tenantCtx, {
      productId: product.id,
      quantity: 100,
      reason: '销售出库',
    })
    assert.equal(afterSale.currentStock, 2900)
  })

  test('库存不足时禁止出库', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '限量手办', sku: 'FIG-LMTD-001', unit: '个', price: 299, cost: 150,
      minStock: 0, maxStock: 5, currentStock: 2,
    })

    assert.throws(
      () => ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 10 }),
      /Insufficient stock/
    )
  })

  test('出库后检查库存是否已更新', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '卡片包', sku: 'CARD-PK-001', unit: '包', price: 15, cost: 10,
      minStock: 10, maxStock: 200, currentStock: 50,
    })
    ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 10 })
    ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 5 })
    const updated = ctrl.getProduct(product.id, tenantCtx)
    assert.equal(updated.currentStock, 35)
  })
})

// ─────────────────────────────────────────────────────────
// 👥HR (人力资源) — 员工物资领用审批
// ─────────────────────────────────────────────────────────
describe(`${ROLES.HR} — HR视角`, () => {
  test('创建新供应商（入职物资采购渠道）', () => {
    const ctrl = createController()
    const supplier = ctrl.createSupplier(tenantCtx, {
      name: '办公用品供应商',
      contactName: '李经理',
      phone: '13800138000',
      email: 'li@office.com',
      address: '上海市浦东新区',
    })
    assert.equal(supplier.name, '办公用品供应商')
    assert.equal(supplier.contactName, '李经理')
  })

  test('查看供应商列表', () => {
    const ctrl = createController()
    ctrl.createSupplier(tenantCtx, { name: '文具商' })
    ctrl.createSupplier(tenantCtx, { name: '工装商' })
    const suppliers = ctrl.listSuppliers(tenantCtx)
    assert.equal(suppliers.length, 2)
  })

  test('无法访问非本租户供应商', () => {
    const ctrl = createController()
    ctrl.createSupplier(tenantCtx, { name: '本公司供应商' })
    const otherCtx: RequestTenantContext = { tenantId: 't-hr-other', brandId: 'b-other', storeId: 's-other' }
    const suppliers = ctrl.listSuppliers(otherCtx)
    assert.equal(suppliers.length, 0)
  })
})

// ─────────────────────────────────────────────────────────
// 🔧安监 (Security) — 盘点调账、查看库存记录
// ─────────────────────────────────────────────────────────
describe(`${ROLES.Security} — 安监视角`, () => {
  test('盘点调账：发现库存差异后调整', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '摄像头', sku: 'CAM-001', unit: '个', price: 500, cost: 350,
      minStock: 2, maxStock: 20, currentStock: 10,
    })

    // 盘点发现实际有 8 个（少了 2）
    const { product: adjusted } = ctrl.adjustStock(tenantCtx, {
      productId: product.id,
      newQuantity: 8,
      reason: '盘点差异调整',
    })
    assert.equal(adjusted.currentStock, 8)
  })

  test('查看出入库记录', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '消防设备', sku: 'FIRE-001', unit: '个', price: 200, cost: 120,
      minStock: 1, maxStock: 10, currentStock: 3,
    })
    ctrl.stockIn(tenantCtx, { productId: product.id, quantity: 5, reason: '补货' })
    ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 1, reason: '领用' })

    const records = ctrl.getStockRecords(tenantCtx, { productId: product.id })
    assert.equal(records.length, 2)
  })

  test('按类型筛选库存记录', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '门禁卡', sku: 'ACCESS-001', unit: '张', price: 30, cost: 20,
      minStock: 5, maxStock: 50, currentStock: 10,
    })
    ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 3, reason: '保安领用' })

    const outRecords = ctrl.getStockRecords(tenantCtx, { productId: product.id, type: StockRecordType.Outbound })
    assert(outRecords.length > 0)
    assert.equal(outRecords[0].type, 'outbound')
  })
})

// ─────────────────────────────────────────────────────────
// 🎮导玩员 (Guide) — 奖品商品出库、库存查询
// ─────────────────────────────────────────────────────────
describe(`${ROLES.Guide} — 导玩员视角`, () => {
  test('兑换奖品出库', () => {
    const ctrl = createController()
    const prize = ctrl.createProduct(tenantCtx, {
      name: '毛绒公仔', sku: 'PRIZE-TOY-001', unit: '个', price: 0, cost: 25,
      minStock: 5, maxStock: 50, currentStock: 20,
    })

    const { product: afterExchange } = ctrl.stockOut(tenantCtx, {
      productId: prize.id,
      quantity: 2,
      reason: '积分兑换',
    })
    assert.equal(afterExchange.currentStock, 18)
  })

  test('查询商品详情以告知玩家', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '扭蛋', sku: 'GACHA-001', unit: '个', price: 10, cost: 3,
      minStock: 10, maxStock: 200, currentStock: 100,
      barcode: '6923456789012',
      category: '奖品',
    })
    const details = ctrl.getProduct(product.id, tenantCtx)
    assert.equal(details.name, '扭蛋')
    assert.equal(details.barcode, '6923456789012')
    assert.equal(details.category, '奖品')
  })

  test('关键词搜索商品', () => {
    const ctrl = createController()
    ctrl.createProduct(tenantCtx, { name: '赛车模型', sku: 'CAR-001', unit: '个', price: 50, cost: 20, minStock: 5, maxStock: 30, currentStock: 15 })
    ctrl.createProduct(tenantCtx, { name: '赛车贴纸', sku: 'CAR-STK-001', unit: '张', price: 5, cost: 1, minStock: 10, maxStock: 100, currentStock: 50 })
    ctrl.createProduct(tenantCtx, { name: '积木套装', sku: 'BLOCK-001', unit: '盒', price: 80, cost: 30, minStock: 3, maxStock: 20, currentStock: 10 })

    const results = ctrl.listProducts(tenantCtx, { keyword: '赛车' })
    assert.equal(results.length, 2)
  })
})

// ─────────────────────────────────────────────────────────
// 🎯运行专员 (Operations) — 日常运营补货入库
// ─────────────────────────────────────────────────────────
describe(`${ROLES.Operations} — 运行专员视角`, () => {
  test('正常入库补货', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '矿泉水', sku: 'WATER-001', unit: '瓶', price: 3, cost: 1,
      minStock: 20, maxStock: 500, currentStock: 15,
    })

    const { product: restocked } = ctrl.stockIn(tenantCtx, {
      productId: product.id,
      quantity: 100,
      reason: '日常补货',
    })
    assert.equal(restocked.currentStock, 115)
  })

  test('批量入库含批次号', () => {
    const ctrl = createController()
    const p1 = ctrl.createProduct(tenantCtx, {
      name: '耳机', sku: 'AUD-001', unit: '副', price: 99, cost: 50,
      minStock: 5, maxStock: 50, currentStock: 10,
    })

    const { record } = ctrl.stockIn(tenantCtx, {
      productId: p1.id,
      quantity: 20,
      reason: '批量到货',
      batchNo: 'BATCH-20260601',
    })
    assert.equal(record.batchNo, 'BATCH-20260601')
    assert(record.id.startsWith('sr-'))
  })

  test('按日期范围筛选库存记录', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '纸巾', sku: 'TIS-001', unit: '包', price: 2, cost: 0.8,
      minStock: 30, maxStock: 200, currentStock: 50,
    })
    ctrl.stockIn(tenantCtx, { productId: product.id, quantity: 50, reason: '补货' })
    ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 10, reason: '使用' })

    const now = new Date().toISOString()
    const past = new Date(Date.now() - 86400000).toISOString()

    const records = ctrl.getStockRecords(tenantCtx, {
      productId: product.id,
      dateFrom: past,
      dateTo: now,
    })
    assert.equal(records.length, 2)
  })
})

// ─────────────────────────────────────────────────────────
// 🤝团建 (Teambuilding) — 活动物资采购与管理
// ─────────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} — 团建视角`, () => {
  test('为团建活动创建临时用品采购单', () => {
    const ctrl = createController()
    // 先创建团建物资
    const food = ctrl.createProduct(tenantCtx, {
      name: '烧烤食材套餐', sku: 'BBQ-SET-001', unit: '套', price: 200, cost: 120,
      minStock: 0, maxStock: 20, currentStock: 0,
    })
    const drink = ctrl.createProduct(tenantCtx, {
      name: '饮料箱', sku: 'DRINK-BX-001', unit: '箱', price: 50, cost: 30,
      minStock: 0, maxStock: 10, currentStock: 0,
    })

    const po = ctrl.createPurchaseOrder(tenantCtx, {
      storeId: tenantCtx.storeId,
      items: [
        { productId: food.id, productName: food.name, sku: food.sku, quantity: 3, unitPrice: 120, totalPrice: 360 },
        { productId: drink.id, productName: drink.name, sku: drink.sku, quantity: 5, unitPrice: 30, totalPrice: 150 },
      ],
      totalAmount: 510,
    })
    assert.equal(po.items.length, 2)
    assert.equal(po.totalAmount, 510)
  })

  test('按门店筛选采购单', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '团建 T 恤', sku: 'TSH-001', unit: '件', price: 30, cost: 15,
      minStock: 0, maxStock: 100, currentStock: 0,
    })
    ctrl.createPurchaseOrder(tenantCtx, {
      items: [{ productId: product.id, productName: product.name, sku: product.sku, quantity: 20, unitPrice: 15, totalPrice: 300 }],
      totalAmount: 300,
    })

    const orders = ctrl.listPurchaseOrders(tenantCtx, { storeId: tenantCtx.storeId })
    assert.equal(orders.length, 1)
  })
})

// ─────────────────────────────────────────────────────────
// 📢营销 (Marketing) — 促销赠品库存查看与更新
// ─────────────────────────────────────────────────────────
describe(`${ROLES.Marketing} — 营销视角`, () => {
  test('创建促销赠品商品并补货', () => {
    const ctrl = createController()
    const gift = ctrl.createProduct(tenantCtx, {
      name: '限定徽章', sku: 'GIFT-BADGE-001', unit: '枚', price: 0, cost: 5,
      minStock: 20, maxStock: 500, currentStock: 0,
      imageUrl: 'https://cdn.example.com/badge-001.png',
    })
    assert.equal(gift.name, '限定徽章')
    assert.equal(gift.imageUrl, 'https://cdn.example.com/badge-001.png')

    const { product: stocked } = ctrl.stockIn(tenantCtx, {
      productId: gift.id,
      quantity: 300,
      reason: '活动备货',
    })
    assert.equal(stocked.currentStock, 300)
  })

  test('按分类筛选商品（促销商品选品）', () => {
    const ctrl = createController()
    ctrl.createProduct(tenantCtx, { name: '联名水杯', sku: 'CUP-001', unit: '个', price: 35, cost: 15, minStock: 5, maxStock: 100, currentStock: 30, category: '促销品' })
    ctrl.createProduct(tenantCtx, { name: '联名贴纸', sku: 'STK-002', unit: '张', price: 5, cost: 1, minStock: 10, maxStock: 500, currentStock: 200, category: '促销品' })
    ctrl.createProduct(tenantCtx, { name: '街机主板', sku: 'PCB-001', unit: '块', price: 1200, cost: 800, minStock: 1, maxStock: 10, currentStock: 3, category: '备件' })

    const promo = ctrl.listProducts(tenantCtx, { category: '促销品' })
    assert.equal(promo.length, 2)
  })

  test('创建商品时 status 默认为 active', () => {
    const ctrl = createController()
    const product = ctrl.createProduct(tenantCtx, {
      name: '宣传海报', sku: 'POSTER-001', unit: '张', price: 0, cost: 2,
      minStock: 10, maxStock: 200, currentStock: 50,
    })
    assert.equal(product.status, 'active')
  })
})
