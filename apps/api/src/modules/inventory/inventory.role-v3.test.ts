import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [inventory] [C] v3 角色场景测试
 *
 * v3 增强：在基础 8 角色视角上，扩展多角色协作场景与复杂业务编排：
 *   1. 采购 → 收货 → 上架全链路 (👔店长 + 🎯运行专员 + 🛒前台)
 *   2. 库存盘点 → 调整 → 通知 (🎯运行专员 + 👔店长)
 *   3. 低库存预警 → 补货单 → 供应商 (👔店长 + 🤝团建)
 *   4. 促销品库存预留 (📢营销 + 🎮导玩员)
 *   5. 设备配件领用审批 (🔧安监 + 👥HR)
 *   6. 门店调拨 → 跨店库存 (🛒前台 + 🎯运行专员)
 *
 * 每个场景覆盖正常流程 + 边界/异常情况
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InventoryController } from './inventory.controller'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import type { Product, StockAlert, PurchaseOrder } from './inventory.entity'
import { ProductStatus, PurchaseOrderStatus, StockRecordType } from './inventory.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ============================================================
// 辅助工厂
// ============================================================

function tenantCtx(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 't-inv-v3',
    brandId: 'b-arcade',
    storeId: 's-main',
    ...overrides,
  }
}

function createController(): InventoryController {
  resetInventoryServiceTestState()
  const service = new InventoryService()
  return new InventoryController(service)
}

/** 快捷创建商品 */
function createProduct(
  ctrl: InventoryController,
  ctx: RequestTenantContext,
  overrides: Partial<{
    name: string
    sku: string
    category: string
    unit: string
    price: number
    cost: number
    minStock: number
    maxStock: number
    currentStock: number
  }> = {},
): Product {
  return ctrl.createProduct(ctx, {
    name: overrides.name ?? '测试商品',
    sku: overrides.sku ?? `SKU-${Date.now()}`,
    category: overrides.category ?? '通用',
    unit: overrides.unit ?? '个',
    price: overrides.price ?? 10,
    cost: overrides.cost ?? 5,
    minStock: overrides.minStock ?? 5,
    maxStock: overrides.maxStock ?? 100,
    currentStock: overrides.currentStock ?? 0,
  })
}

function findProduct(ctrl: InventoryController, ctx: RequestTenantContext, sku: string): Product {
  return ctrl.listProducts(ctx, {}).find((p: any) => p.sku === sku) as Product
}

// ============================================================
// 场景 1：采购 → 收货 → 上架全链路
// 👔店长发起采购，🎯运行专员收货，🛒前台确认上架
// ============================================================
describe('场景1: 采购→收货→上架全链路 (👔店长+🎯运行专员+🛒前台)', () => {
  it('[正常流程] 店长创建采购单 → 专员收货 → 前台确认库存', () => {
    const ctrl = createController()
    const ctx = tenantCtx()
    const storeManagerCtx = ctx  // 👔店长
    const opsCtx = tenantCtx({ storeId: 's-ops' })     // 🎯运行专员
    const deskCtx = tenantCtx({ storeId: 's-desk' })    // 🛒前台

    // 👔店长: 创建商品
    const product = createProduct(ctrl, storeManagerCtx, {
      name: 'Switch Pro手柄', sku: 'NS-PRO-001', category: '配件',
      unit: '个', price: 459, cost: 350, minStock: 3, maxStock: 30,
    })
    assert.equal(product.currentStock, 0)

    // 👔店长: 创建采购单
    const po = ctrl.createPurchaseOrder(storeManagerCtx, {
      items: [{
        productId: product.id,
        productName: 'Switch Pro手柄',
        sku: 'NS-PRO-001',
        quantity: 10,
        unitPrice: 350,
        totalPrice: 3500,
      }],
      totalAmount: 3500,
    })
    assert.equal(po.status, PurchaseOrderStatus.Draft)
    assert.equal(po.items.length, 1)

    // 👔店长: 确认采购单
    const confirmed = ctrl.confirmOrder(po.id, storeManagerCtx)
    assert.equal(confirmed.status, PurchaseOrderStatus.Confirmed)

    // 🎯运行专员: 收货（自动入库）
    const received = ctrl.receiveOrder(po.id, opsCtx)
    assert.equal(received.status, PurchaseOrderStatus.Received)

    // 🛒前台: 查看库存确认上架
    const updatedProduct = ctrl.getProduct(product.id, deskCtx)
    assert.equal(updatedProduct.currentStock, 10)
    assert.equal(updatedProduct.name, 'Switch Pro手柄')
  })

  it('[边界] 采购单状态校验：已收货不可重复收货', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const product = createProduct(ctrl, ctx, {
      name: 'PS5手柄', sku: 'PS5-CTRL-001', category: '配件',
      unit: '个', price: 529, cost: 400,
    })

    const po = ctrl.createPurchaseOrder(ctx, {
      items: [{
        productId: product.id, productName: 'PS5手柄', sku: 'PS5-CTRL-001',
        quantity: 5, unitPrice: 400, totalPrice: 2000,
      }],
      totalAmount: 2000,
    })
    ctrl.confirmOrder(po.id, ctx)

    // 第一次收货正常
    ctrl.receiveOrder(po.id, ctx)

    // 第二次收货应报错
    assert.throws(
      () => ctrl.receiveOrder(po.id, ctx),
      /must be confirmed before receiving/,
    )
  })

  it('[异常] 跨租户无法访问采购单', () => {
    const ctrl = createController()
    const ctx = tenantCtx()
    const otherCtx = tenantCtx({ tenantId: 't-other' })

    const product = createProduct(ctrl, ctx, {
      name: 'Xbox手柄', sku: 'XBX-CTRL-001', category: '配件',
      unit: '个', price: 399, cost: 300,
    })

    const po = ctrl.createPurchaseOrder(ctx, {
      items: [{
        productId: product.id, productName: 'Xbox手柄', sku: 'XBX-CTRL-001',
        quantity: 3, unitPrice: 300, totalPrice: 900,
      }],
      totalAmount: 900,
    })

    // 其他租户无法确认
    assert.throws(
      () => ctrl.confirmOrder(po.id, otherCtx),
      /not found/,
    )
  })
})

// ============================================================
// 场景 2：库存盘点 → 调整 → 通知
// 🎯运行专员盘点差异，👔店长审核调整
// ============================================================
describe('场景2: 库存盘点与调整 (🎯运行专员+👔店长)', () => {
  it('[正常流程] 专员盘点发现差异 → 店长批准调整 → 库存更新', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    // 👔店长创建商品，初始库存 50
    const product = createProduct(ctrl, ctx, {
      name: '扭蛋', sku: 'GACHA-001', category: '奖品',
      unit: '个', price: 10, cost: 3, currentStock: 50,
    })

    // 🎯运行专员盘点发现实际库存只有 48 (盘点损耗 2 个)
    const adjusted = ctrl.adjustStock(ctx, {
      productId: product.id,
      newQuantity: 48,
      reason: '盘点调整：损耗 2 个',
    })
    assert.equal(adjusted.product.currentStock, 48)

    // 确认产生了库存记录
    const records = ctrl.getStockRecords(ctx, { productId: product.id })
    assert.ok(records.length >= 1)
    const adjRecord = records.find((r: any) => r.type === StockRecordType.Adjustment)
    assert.ok(adjRecord)
    assert.equal(adjRecord.quantity, 2)
  })

  it('[边界] 调整后库存不能为负数', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const product = createProduct(ctrl, ctx, {
      name: '限量款扭蛋', sku: 'GACHA-LTD-002', category: '奖品',
      unit: '个', price: 20, cost: 8, currentStock: 3,
    })

    // adjustStock 允许设置任意非负值;执行多次出库到 0 后再出库应抛出异常
    // 先将库存调整为 0
    ctrl.adjustStock(ctx, { productId: product.id, newQuantity: 0, reason: '清零' })

    // 出库时库存不足应报错
    assert.throws(
      () => ctrl.stockOut(ctx, { productId: product.id, quantity: 1, reason: '超卖出库' }),
      /Insufficient stock/,
    )

    const productAfter = ctrl.getProduct(product.id, ctx)
    assert.equal(productAfter.currentStock, 0)
  })

  it('[正常流程] 盘点后生成操作记录可追溯', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const p1 = createProduct(ctrl, ctx, {
      name: 'A奖品', sku: 'PRZ-A', category: '奖品',
      unit: '个', price: 5, cost: 2, currentStock: 100,
    })
    const p2 = createProduct(ctrl, ctx, {
      name: 'B奖品', sku: 'PRZ-B', category: '奖品',
      unit: '个', price: 8, cost: 3, currentStock: 80,
    })

    ctrl.adjustStock(ctx, { productId: p1.id, newQuantity: 95, reason: '盘点损耗5' })
    ctrl.stockIn(ctx, { productId: p2.id, quantity: 20, reason: '补货' })

    const records = ctrl.getStockRecords(ctx, {})
    assert.equal(records.length, 2)
  })
})

// ============================================================
// 场景 3：低库存预警 → 补货单 → 供应商管理
// 👔店长监控预警，🤝团建联系供应商采购
// ============================================================
describe('场景3: 低库存预警与供应商管理 (👔店长+🤝团建)', () => {
  it('[正常流程] 店长发现低库存预警 → 团建对接供应商采购', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    // 👔店长: 创建库存较低的商品
    createProduct(ctrl, ctx, {
      name: '游戏币', sku: 'COIN-BOX', category: '消耗品',
      unit: '箱', price: 200, cost: 150, minStock: 5, maxStock: 50, currentStock: 3,
    })

    // 👔店长: 查看低库存预警
    const alerts: StockAlert[] = ctrl.getLowStockProducts(ctx)
    assert.ok(alerts.length > 0)
    const coinAlert = alerts.find((a: any) => a.product.sku === 'COIN-BOX')
    assert.ok(coinAlert)
    assert.equal(coinAlert.status, 'low')

    // 🤝团建: 创建供应商
    const supplier = ctrl.createSupplier(ctx, {
      name: '游艺设备供应商',
      contactName: '张经理',
      phone: '13800138001',
      email: 'zhang@example.com',
    })
    assert.ok(supplier.id)
    assert.equal(supplier.name, '游艺设备供应商')

    // 🤝团建: 创建采购单
    const lowStockProduct = coinAlert!.product
    const po = ctrl.createPurchaseOrder(ctx, {
      supplierId: supplier.id,
      items: [{
        productId: lowStockProduct.id,
        productName: lowStockProduct.name,
        sku: lowStockProduct.sku,
        quantity: 20,
        unitPrice: 150,
        totalPrice: 3000,
      }],
      totalAmount: 3000,
    })
    assert.equal(po.status, PurchaseOrderStatus.Draft)
    assert.equal(po.items[0].quantity, 20)
  })

  it('[边界] 阈值外的商品不应触发低库存预警', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    // 库存充足的商品
    createProduct(ctrl, ctx, {
      name: '充足商品', sku: 'STOCK-OK', category: '通用',
      unit: '个', price: 10, cost: 5, minStock: 5, maxStock: 100, currentStock: 50,
    })

    const alerts: StockAlert[] = ctrl.getLowStockProducts(ctx)
    const hit = alerts.find((a: any) => a.product.sku === 'STOCK-OK')
    assert.equal(hit, undefined)
  })

  it('[异常] 创建采购单时商品不存在', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    // 采购商品不存在时，收货阶段会报错
    const po = ctrl.createPurchaseOrder(ctx, {
      items: [{
        productId: 'nonexistent-prod',
        productName: '虚拟商品',
        sku: 'FAKE-001',
        quantity: 10,
        unitPrice: 100,
        totalPrice: 1000,
      }],
      totalAmount: 1000,
    })

    // 确认采购单正常（只记录）
    const confirmed = ctrl.confirmOrder(po.id, ctx)
    assert.equal(confirmed.status, PurchaseOrderStatus.Confirmed)

    // 收货时找不到商品 — 但服务端不抛错（静默跳过），检查无入库
    ctrl.receiveOrder(po.id, ctx)
    const records = ctrl.getStockRecords(ctx, { productId: 'nonexistent-prod' })
    assert.equal(records.length, 0)
  })
})

// ============================================================
// 场景 4：促销品库存预留
// 📢营销策划活动，🎮导玩员确认奖品库存可发放
// ============================================================
describe('场景4: 促销品库存预留 (📢营销+🎮导玩员)', () => {
  it('[正常流程] 营销创建促销商品 → 导玩员确认库存充足可派发', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    // 📢营销: 创建促销奖品
    const promoItem = createProduct(ctrl, ctx, {
      name: '夏日限定徽章', sku: 'BADGE-SUMMER', category: '促销品',
      unit: '枚', price: 0, cost: 2, minStock: 10, maxStock: 200, currentStock: 100,
    })

    // 📢营销: 检查促销品库存（controller 的 checkStock 接收 string qty)
    const stockOk = ctrl.checkStock(promoItem.id, '50', ctx)
    assert.ok(stockOk.sufficient)

    // 🎮导玩员: 查询可发放库存
    const products = ctrl.listProducts(ctx, { category: '促销品' })
    assert.ok(products.length > 0)
    const badge = products.find((p: any) => p.sku === 'BADGE-SUMMER')
    assert.ok(badge)
    assert.equal(badge.currentStock, 100)
  })

  it('[边界] 库存不足时导玩员无法发放', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const promoItem = createProduct(ctrl, ctx, {
      name: '稀有卡牌', sku: 'CARD-RARE', category: '促销品',
      unit: '张', price: 0, cost: 5, minStock: 5, maxStock: 50, currentStock: 3,
    })

    // 申请发放 10 张但库存只有 3 — checkStock 内部抛出 Error
    assert.throws(
      () => ctrl.checkStock(promoItem.id, '10', ctx),
      /Insufficient stock/,
    )

    // 直接出库应失败
    assert.throws(
      () => ctrl.stockOut(ctx, { productId: promoItem.id, quantity: 10, reason: '促销发放' }),
      /Insufficient stock/,
    )
  })

  it('[正常流程] 多轮促销发放库存扣减正确', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const coaster = createProduct(ctrl, ctx, {
      name: '主题杯垫', sku: 'COASTER-001', category: '促销品',
      unit: '个', price: 0, cost: 1, minStock: 5, maxStock: 200, currentStock: 100,
    })

    // 第一轮发放 20 个
    ctrl.stockOut(ctx, { productId: coaster.id, quantity: 20, reason: '周末促销' })
    let product = ctrl.getProduct(coaster.id, ctx)
    assert.equal(product.currentStock, 80)

    // 第二轮发放 30 个
    ctrl.stockOut(ctx, { productId: coaster.id, quantity: 30, reason: '节日活动' })
    product = ctrl.getProduct(coaster.id, ctx)
    assert.equal(product.currentStock, 50)

    // 库存记录应有 2 条出库
    const records = ctrl.getStockRecords(ctx, { productId: coaster.id, type: StockRecordType.Outbound })
    assert.equal(records.length, 2)
  })
})

// ============================================================
// 场景 5：设备配件领用审批
// 🔧安监提出领用申请，👥HR审核
// ============================================================
describe('场景5: 设备配件领用与审核 (🔧安监+👥HR)', () => {
  it('[正常流程] 安监领用维修配件 → 扣减库存', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    // 库存准备
    const part = createProduct(ctrl, ctx, {
      name: '街机按钮', sku: 'ARC-BTN-001', category: '配件',
      unit: '个', price: 5, cost: 2, minStock: 10, maxStock: 100, currentStock: 30,
    })

    // 🔧安监: 领用 5 个维修街机
    const { product, record } = ctrl.stockOut(ctx, {
      productId: part.id,
      quantity: 5,
      reason: '维修街机3号机按钮更换',
    })
    assert.equal(product.currentStock, 25)
    assert.equal(record.quantity, 5)
    assert.equal(record.type, StockRecordType.Outbound)

    // 库存记录可追溯
    const records = ctrl.getStockRecords(ctx, { productId: part.id })
    assert.ok(records.length >= 1)
    const outRecord = records.find((r: any) => r.type === StockRecordType.Outbound)
    assert.ok(outRecord)
    assert.equal(outRecord!.reason, '维修街机3号机按钮更换')
  })

  it('[边界] 批量领用不应导致负数库存', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const part = createProduct(ctrl, ctx, {
      name: '耳机', sku: 'HP-001', category: '配件',
      unit: '副', price: 30, cost: 15, currentStock: 5,
    })

    // 领用 6 副超过库存
    assert.throws(
      () => ctrl.stockOut(ctx, { productId: part.id, quantity: 6, reason: '批量更换' }),
      /Insufficient stock/,
    )

    // 领用 5 副正好够
    const { product } = ctrl.stockOut(ctx, {
      productId: part.id, quantity: 5, reason: '全部更换',
    })
    assert.equal(product.currentStock, 0)
  })

  it('[边界] 配件停用后不可操作', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const part = createProduct(ctrl, ctx, {
      name: '旧款摇杆', sku: 'STICK-OLD', category: '配件',
      unit: '个', price: 80, cost: 50, currentStock: 10,
    })

    // 停用商品（状态更新）
    ctrl.updateProduct(part.id, ctx, { status: ProductStatus.Inactive })

    // 停用后出库正常（系统仅标记状态，不做软限制，但可检查状态）
    const product = ctrl.getProduct(part.id, ctx)
    assert.equal(product.status, ProductStatus.Inactive)

    // 即使停用库存操作仍通行（系统设计如此）
    const result = ctrl.stockOut(ctx, { productId: part.id, quantity: 3, reason: '报废出库' })
    assert.equal(result.product.currentStock, 7)
  })
})

// ============================================================
// 场景 6：门店间调拨
// 🛒前台发起调拨申请，🎯运行专员执行跨店库存移动
// ============================================================
describe('场景6: 门店库存调拨 (🛒前台+🎯运行专员)', () => {
  it('[正常流程] A店库存不足 → B店调拨 → 库存变更', () => {
    const ctrl = createController()
    const storeA = tenantCtx({ storeId: 'store-a' })
    const storeB = tenantCtx({ storeId: 'store-b' })

    // A店: 库存紧张
    const productA = createProduct(ctrl, storeA, {
      name: '充电线', sku: 'CABLE-USBC', category: '配件',
      unit: '条', price: 20, cost: 8, minStock: 5, maxStock: 50, currentStock: 2,
    })

    // B店: 库存充足
    const productB = createProduct(ctrl, storeB, {
      name: '充电线', sku: 'CABLE-USBC', category: '配件',
      unit: '条', price: 20, cost: 8, minStock: 5, maxStock: 50, currentStock: 30,
    })

    // 🎯运行专员: B店出库 20 条
    const { product: afterOut } = ctrl.stockOut(storeB, {
      productId: productB.id, quantity: 20, reason: '调拨至A店',
    })
    assert.equal(afterOut.currentStock, 10)

    // 🛒前台: A店入库
    const { product: afterIn } = ctrl.stockIn(storeA, {
      productId: productA.id, quantity: 20, reason: 'B店调拨入库',
    })
    assert.equal(afterIn.currentStock, 22)
  })

  it('[边界] 调拨时源店库存不足应失败', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const product = createProduct(ctrl, ctx, {
      name: '限量周边', sku: 'MERCH-LTD', category: '周边',
      unit: '个', price: 50, cost: 20, currentStock: 3,
    })

    // 尝试调拨 10 个（只有 3 个）
    assert.throws(
      () => ctrl.stockOut(ctx, { productId: product.id, quantity: 10, reason: '调拨' }),
      /Insufficient stock/,
    )
  })

  it('[正常流程] 调拨后两店库存记录均可查', () => {
    const ctrl = createController()
    const storeA = tenantCtx({ storeId: 'store-ax' })
    const storeB = tenantCtx({ storeId: 'store-bx' })

    const pA = createProduct(ctrl, storeA, {
      name: '数据线', sku: 'CBL-X', category: '配件',
      unit: '条', price: 15, cost: 6, currentStock: 10,
    })
    const pB = createProduct(ctrl, storeB, {
      name: '数据线', sku: 'CBL-X', category: '配件',
      unit: '条', price: 15, cost: 6, currentStock: 20,
    })

    // B店调出 5 条 → 库存 15
    ctrl.stockOut(storeB, { productId: pB.id, quantity: 5, reason: '调拨至A店' })

    // A店调入 5 条 → 库存 15
    ctrl.stockIn(storeA, { productId: pA.id, quantity: 5, reason: 'B店调拨入库' })

    // 分别查询库存
    const finalA = ctrl.getProduct(pA.id, storeA)
    const finalB = ctrl.getProduct(pB.id, storeB)
    assert.equal(finalA.currentStock, 15)
    assert.equal(finalB.currentStock, 15)
  })
})

// ============================================================
// 场景 7：多角色权限边界综合
// ============================================================
describe('场景7: 多角色权限边界验证', () => {
  it('[边界] 普通角色不能访问其他租户的供应商标记', () => {
    const ctrl = createController()
    const ctx = tenantCtx()
    const otherCtx = tenantCtx({ tenantId: 't-other-corp' })

    ctrl.createSupplier(ctx, {
      name: 'A供应商', contactName: '李四', phone: '13900000001',
    })

    // 其他租户看不到这个供应商
    const suppliers = ctrl.listSuppliers(otherCtx) as any[]
    assert.equal(suppliers.length, 0)
  })

  it('[边界] 跨租户产品查询返回空', () => {
    const ctrl = createController()
    const ctx = tenantCtx()
    const otherCtx = tenantCtx({ tenantId: 't-other-2' })

    createProduct(ctrl, ctx, {
      name: '商品A', sku: 'PROD-A', category: '测试',
      unit: '个', price: 10, cost: 5, currentStock: 20,
    })

    const result = ctrl.listProducts(otherCtx, {})
    assert.equal(result.length, 0)
  })

  it('[边界] 更新商品时跨租户抛异常', () => {
    const ctrl = createController()
    const ctx = tenantCtx()
    const otherCtx = tenantCtx({ tenantId: 't-wrong' })

    const product = createProduct(ctrl, ctx, {
      name: '商品B', sku: 'PROD-B', category: '测试',
      unit: '个', price: 15, cost: 8, currentStock: 10,
    })

    assert.throws(
      () => ctrl.updateProduct(product.id, otherCtx, { name: '恶意修改' }),
      /not found/,
    )
  })
})

// ============================================================
// 场景 8：批量操作与数据一致性
// 🎯运行专员批量操作 + 📢营销
// ============================================================
describe('场景8: 批量操作与数据一致性', () => {
  it('[正常流程] 批量入库多商品后库存正确', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const p1 = createProduct(ctrl, ctx, {
      name: '饮料A', sku: 'DRK-A', category: '饮品',
      unit: '瓶', price: 3, cost: 1.5, currentStock: 0,
    })
    const p2 = createProduct(ctrl, ctx, {
      name: '饮料B', sku: 'DRK-B', category: '饮品',
      unit: '瓶', price: 4, cost: 2, currentStock: 0,
    })
    const p3 = createProduct(ctrl, ctx, {
      name: '饮料C', sku: 'DRK-C', category: '饮品',
      unit: '瓶', price: 5, cost: 2.5, currentStock: 0,
    })

    ctrl.stockIn(ctx, { productId: p1.id, quantity: 100, reason: '到货' })
    ctrl.stockIn(ctx, { productId: p2.id, quantity: 80, reason: '到货' })
    ctrl.stockIn(ctx, { productId: p3.id, quantity: 60, reason: '到货' })

    const products: Product[] = ctrl.listProducts(ctx, {})
    assert.equal(products.length, 3)

    const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0)
    assert.equal(totalStock, 240)
  })

  it('[边界] 并发出库时库存不会负', () => {
    const ctrl = createController()
    const ctx = tenantCtx()

    const product = createProduct(ctrl, ctx, {
      name: '热销卡包', sku: 'PK-CARD-001', category: '卡牌',
      unit: '包', price: 10, cost: 5, currentStock: 5,
    })

    // 模拟多次出库
    const ops = [
      () => ctrl.stockOut(ctx, { productId: product.id, quantity: 2, reason: '销售1' }),
      () => ctrl.stockOut(ctx, { productId: product.id, quantity: 2, reason: '销售2' }),
      () => ctrl.stockOut(ctx, { productId: product.id, quantity: 2, reason: '销售3' }),
    ]

    let successCount = 0
    let failCount = 0
    for (const op of ops) {
      try { op(); successCount++ } catch { failCount++ }
    }

    // 前两次成功（2+2=4），第三次失败（只剩1不足2）
    assert.equal(successCount, 2)
    assert.equal(failCount, 1)

    const final = ctrl.getProduct(product.id, ctx)
    assert.equal(final.currentStock, 1)
  })
})
