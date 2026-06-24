/**
 * E2E 跨模块 #9 — 采购 → 入库 → 应付账款 全链路
 *
 * 链路:
 *   1. InventoryService.createProduct (登记商品)
 *   2. InventoryService.createPurchaseOrder (Draft)
 *   3. InventoryService.confirmOrder (Confirmed)
 *   4. InventoryService.receiveOrder (Received, 自动 stockIn)
 *   5. FinanceService.recordLedger(type=Expense, PO 号关联) → 应付账款
 *
 * 验证:
 *   - PO 状态机: Draft → Confirmed → Received
 *   - 采购入库数量准确增加 stock
 *   - 财务 Expense ledger 关联 PO id
 *   - 余额计算: Revenue 1000 - Expense 300 = 700
 *   - 跨租户隔离: Tenant B 看不到 Tenant A 库存 / ledger
 *   - 库存阈值: low_stock / out_of_stock 状态
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { Body, Controller, Inject, Param, Post, Req } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { FinanceService, resetFinanceServiceTestState } from '../finance/finance.service'
import { LedgerType } from '../finance/finance.entity'
import {
  InventoryService,
  resetInventoryServiceTestState
} from '../inventory/inventory.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-A',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-A',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-A',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

// ─── TestController ───

@Controller()
class TestController {
  constructor(
    @Inject(InventoryService) private readonly inventoryService: InventoryService,
    @Inject(FinanceService) private readonly financeService: FinanceService
  ) {}

  @Post('inventory/products')
  createProduct(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.createProduct(tc, body)
  }

  @Post('inventory/stock-in')
  stockIn(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.stockIn(tc, body)
  }

  @Post('inventory/stock-out')
  stockOut(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.stockOut(tc, body)
  }

  @Post('inventory/purchase-orders')
  createPO(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.createPurchaseOrder(tc, body)
  }

  @Post('inventory/purchase-orders/:poId/confirm')
  confirmPO(@Req() req: Request, @Param('poId') poId: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.confirmOrder(poId, tc)
  }

  @Post('inventory/purchase-orders/:poId/receive')
  receivePO(@Req() req: Request, @Param('poId') poId: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.receiveOrder(poId, tc)
  }

  @Post('finance/ledgers')
  async recordLedger(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.financeService.recordLedger(tc, body)
  }

  @Post('finance/revenue')
  async recordRevenue(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.financeService.recordTransactionRevenue(tc, body)
  }
}

// ─── 构建 app ───

async function buildApp() {
  resetFinanceServiceTestState()
  resetInventoryServiceTestState()
  const inventoryService = new InventoryService()
  const financeService = new FinanceService()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestController],
    providers: [
      { provide: InventoryService, useValue: inventoryService },
      { provide: FinanceService, useValue: financeService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, inventoryService, financeService }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-A',
  'x-brand-id': 'brand-A',
  'x-store-id': 'store-A'
}
const TENANT_B = {
  'x-tenant-id': 'tenant-B',
  'x-brand-id': 'brand-B',
  'x-store-id': 'store-B'
}

function ctxA(): RequestTenantContext {
  return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }
}

function ctxB(): RequestTenantContext {
  return { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn-mainland' }
}

// ═══════════════════════════════════════════════════

test('e2e-9: full procurement → stock-in → payable ledger lifecycle', async () => {
  const { app } = await buildApp()

  try {
    // 1. 创建商品
    const productRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({
        sku: 'SKU-001',
        name: '矿泉水',
        unit: 'bottle',
        price: 5,
        currentStock: 50,
        minStock: 20
      })
    assert.equal(productRes.statusCode, 201)
    const productId = productRes.body.data.id
    assert.equal(productRes.body.data.currentStock, 50)

    // 2. 创建采购单 (Draft)
    const poRes = await request(app.getHttpServer())
      .post('/inventory/purchase-orders')
      .set(TENANT_A)
      .send({
        orderNumber: 'PO-2026-001',
        supplierId: 'supplier-A',
        items: [{ productId, sku: 'SKU-001', productName: '矿泉水', quantity: 100, unitPrice: 3, totalPrice: 300 }],
        totalAmount: 300
      })
    assert.equal(poRes.statusCode, 201)
    assert.equal(poRes.body.data.status, 'draft')
    const poId = poRes.body.data.id
    assert.equal(poRes.body.data.totalAmount, 300)

    // 3. 确认采购单
    const confirmRes = await request(app.getHttpServer())
      .post(`/inventory/purchase-orders/${poId}/confirm`)
      .set(TENANT_A)
    assert.equal(confirmRes.statusCode, 201)
    assert.equal(confirmRes.body.data.status, 'confirmed')

    // 4. 入库 (自动 stockIn 100 瓶 → 库存 150)
    const receiveRes = await request(app.getHttpServer())
      .post(`/inventory/purchase-orders/${poId}/receive`)
      .set(TENANT_A)
    assert.equal(receiveRes.statusCode, 201)
    assert.equal(receiveRes.body.data.status, 'received')

    // 5. 财务记账应付账款
    const payableRes = await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: LedgerType.Expense,
        amount: 300,
        description: 'PO-2026-001 入库应付',
        orderId: poId,
        category: 'inventory_purchase'
      })
    assert.equal(payableRes.statusCode, 201)
    assert.equal(payableRes.body.data.type, LedgerType.Expense)
    assert.equal(payableRes.body.data.amount, 300)
    assert.equal(payableRes.body.data.orderId, poId)
  } finally {
    await app.close()
  }
})

test('e2e-9: PO state machine - cannot receive Draft PO directly', async () => {
  const { app } = await buildApp()

  try {
    const pRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({ sku: 'S-2', name: 'X', unit: 'pcs', price: 10, currentStock: 0, minStock: 5 })
    const productId = pRes.body.data.id

    const poRes = await request(app.getHttpServer())
      .post('/inventory/purchase-orders')
      .set(TENANT_A)
      .send({
        orderNumber: 'PO-2026-002',
        supplierId: 'supplier-A',
        items: [{ productId, sku: 'S-2', productName: 'X', quantity: 10, unitPrice: 5, totalPrice: 50 }],
        totalAmount: 50
      })
    const poId = poRes.body.data.id

    const receiveRes = await request(app.getHttpServer())
      .post(`/inventory/purchase-orders/${poId}/receive`)
      .set(TENANT_A)
    assert.equal(receiveRes.statusCode, 500, 'Draft 状态不能 receive')
  } finally {
    await app.close()
  }
})

test('e2e-9: PO state machine - cannot confirm twice', async () => {
  const { app } = await buildApp()

  try {
    const pRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({ sku: 'S-3', name: 'Y', unit: 'pcs', price: 10, currentStock: 0, minStock: 5 })
    const productId = pRes.body.data.id

    const poRes = await request(app.getHttpServer())
      .post('/inventory/purchase-orders')
      .set(TENANT_A)
      .send({
        orderNumber: 'PO-2026-003',
        supplierId: 'supplier-A',
        items: [{ productId, sku: 'S-3', productName: 'Y', quantity: 5, unitPrice: 5, totalPrice: 25 }],
        totalAmount: 25
      })
    const poId = poRes.body.data.id

    const confirm1 = await request(app.getHttpServer())
      .post(`/inventory/purchase-orders/${poId}/confirm`)
      .set(TENANT_A)
    assert.equal(confirm1.statusCode, 201)

    const confirm2 = await request(app.getHttpServer())
      .post(`/inventory/purchase-orders/${poId}/confirm`)
      .set(TENANT_A)
    assert.equal(confirm2.statusCode, 500, 'confirmed 状态不能再 confirm')
  } finally {
    await app.close()
  }
})

test('e2e-9: finance ledger balance: revenue 1000 - expense 300 = 700', async () => {
  const { app, financeService } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/finance/revenue')
      .set(TENANT_A)
      .send({
        orderId: 'sales-001',
        transactionId: 'txn-sales-001',
        amount: 1000,
        description: '订单销售'
      })

    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: LedgerType.Expense,
        amount: 300,
        description: '采购成本',
        orderId: 'PO-2026-001'
      })

    const ledgers = financeService.listLedgers(ctxA(), { limit: 10 })
    assert.equal(ledgers.length, 2)
    // 余额: 累计 running balance —— revenue 1000 → balance=1000, expense 300 → balance=700
    const revenue = ledgers.find((l) => l.type === LedgerType.Revenue)
    const expense = ledgers.find((l) => l.type === LedgerType.Expense)
    assert.equal(revenue?.balance, 1000)
    assert.equal(expense?.balance, 700, 'expense 记账后累计余额 1000-300=700')
  } finally {
    await app.close()
  }
})

test('e2e-9: cross-tenant isolation - Tenant B cannot see Tenant A inventory/ledger', async () => {
  const { app, inventoryService, financeService } = await buildApp()

  try {
    // Tenant A 创建商品 + ledger
    await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({ sku: 'A-1', name: 'A', unit: 'pcs', price: 10, currentStock: 100, minStock: 5 })
    await request(app.getHttpServer())
      .post('/finance/ledgers')
      .set(TENANT_A)
      .send({
        type: LedgerType.Expense,
        amount: 500,
        description: 'Tenant A 采购'
      })

    // 直接 service 验证 Tenant B 看到 0
    const tenantAProducts = inventoryService.listProducts(ctxA(), {})
    const tenantBProducts = inventoryService.listProducts(ctxB(), {})
    assert.equal(tenantAProducts.length, 1)
    assert.equal(tenantBProducts.length, 0, 'Tenant B 不应看到 Tenant A 库存')

    const tenantALedgers = financeService.listLedgers(ctxA(), { limit: 10 })
    const tenantBLedgers = financeService.listLedgers(ctxB(), { limit: 10 })
    assert.equal(tenantALedgers.length, 1)
    assert.equal(tenantBLedgers.length, 0)

    // HTTP 层验证：Tenant B 创建商品不影响 Tenant A 计数
    const tenantBProduct = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_B)
      .send({ sku: 'B-1', name: 'B', unit: 'pcs', price: 20, currentStock: 50, minStock: 5 })
    assert.equal(tenantBProduct.statusCode, 201)

    const tenantAFinal = inventoryService.listProducts(ctxA(), {})
    const tenantBFinal = inventoryService.listProducts(ctxB(), {})
    assert.equal(tenantAFinal.length, 1, 'Tenant A 仍只有 1 个')
    assert.equal(tenantBFinal.length, 1, 'Tenant B 有 1 个')
    assert.notEqual(tenantAFinal[0]!.id, tenantBFinal[0]!.id, '两端产品 ID 不可重叠')
  } finally {
    await app.close()
  }
})

test('e2e-9: low stock alert when stockOut brings stock below threshold', async () => {
  const { app, inventoryService } = await buildApp()

  try {
    const pRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({
        sku: 'SKU-low',
        name: '即将缺货',
        unit: 'pcs',
        price: 20,
        currentStock: 50,
        minStock: 30
      })
    const productId = pRes.body.data.id

    // 出库 25 → 库存 25, 低于阈值 30
    const stockOutRes = await request(app.getHttpServer())
      .post('/inventory/stock-out')
      .set(TENANT_A)
      .send({ productId, quantity: 25, reason: 'sales' })
    assert.equal(stockOutRes.statusCode, 201)
    assert.equal(stockOutRes.body.data.product.currentStock, 25)

    // 通过 getLowStockProducts 验证
    const alerts = inventoryService.getLowStockProducts(ctxA())
    const alert = alerts.find((a) => a.product.id === productId)
    assert.ok(alert, '应有库存预警')
    assert.equal(alert!.status, 'low', '低于阈值 → low 状态')
  } finally {
    await app.close()
  }
})

test('e2e-9: out-of-stock alert when stock reaches 0', async () => {
  const { app, inventoryService } = await buildApp()

  try {
    const pRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({
        sku: 'SKU-empty',
        name: '会卖光',
        unit: 'pcs',
        price: 10,
        currentStock: 30,
        minStock: 20
      })
    const productId = pRes.body.data.id

    const stockOutRes = await request(app.getHttpServer())
      .post('/inventory/stock-out')
      .set(TENANT_A)
      .send({ productId, quantity: 30, reason: 'sales' })
    assert.equal(stockOutRes.statusCode, 201)
    assert.equal(stockOutRes.body.data.product.currentStock, 0)

    // 通过 getLowStockProducts 验证
    const alerts = inventoryService.getLowStockProducts(ctxA())
    const alert = alerts.find((a) => a.product.id === productId)
    assert.ok(alert, '应有库存预警')
    assert.equal(alert!.status, 'out_of_stock', '库存为 0 → out_of_stock')
  } finally {
    await app.close()
  }
})

test('e2e-9: cannot stockOut more than current stock', async () => {
  const { app } = await buildApp()

  try {
    const pRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({
        sku: 'SKU-cap',
        name: '有限',
        unit: 'pcs',
        price: 10,
        currentStock: 5,
        minStock: 1
      })
    const productId = pRes.body.data.id

    const stockOutRes = await request(app.getHttpServer())
      .post('/inventory/stock-out')
      .set(TENANT_A)
      .send({ productId, quantity: 100, reason: 'overdraw' })
    assert.equal(stockOutRes.statusCode, 500, '库存不足应抛错')
  } finally {
    await app.close()
  }
})

test('e2e-9: PO receive automatically updates product stock (50 + 100 = 150)', async () => {
  const { app, inventoryService } = await buildApp()

  try {
    const pRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({
        sku: 'SKU-auto',
        name: '自动入库测试',
        unit: 'pcs',
        price: 50,
        currentStock: 50,
        minStock: 5
      })
    const productId = pRes.body.data.id

    const poRes = await request(app.getHttpServer())
      .post('/inventory/purchase-orders')
      .set(TENANT_A)
      .send({
        orderNumber: 'PO-AUTO-001',
        supplierId: 'supplier-A',
        items: [{ productId, sku: 'SKU-auto', productName: 'Auto', quantity: 100, unitPrice: 30, totalPrice: 3000 }],
        totalAmount: 3000
      })
    const poId = poRes.body.data.id
    await request(app.getHttpServer()).post(`/inventory/purchase-orders/${poId}/confirm`).set(TENANT_A)
    await request(app.getHttpServer()).post(`/inventory/purchase-orders/${poId}/receive`).set(TENANT_A)

    const product = inventoryService.getProduct(productId, ctxA())
    assert.ok(product)
    assert.equal(product!.currentStock, 150, '初始 50 + PO 100 = 150')
  } finally {
    await app.close()
  }
})

test('e2e-9: stock records history preserved across multiple operations', async () => {
  const { app, inventoryService } = await buildApp()

  try {
    const pRes = await request(app.getHttpServer())
      .post('/inventory/products')
      .set(TENANT_A)
      .send({
        sku: 'SKU-history',
        name: '历史',
        unit: 'pcs',
        price: 10,
        currentStock: 0,
        minStock: 5
      })
    const productId = pRes.body.data.id

    // 多次 stockIn / stockOut
    await request(app.getHttpServer())
      .post('/inventory/stock-in')
      .set(TENANT_A)
      .send({ productId, quantity: 100, reason: 'initial' })
    await request(app.getHttpServer())
      .post('/inventory/stock-out')
      .set(TENANT_A)
      .send({ productId, quantity: 30, reason: 'sale1' })
    await request(app.getHttpServer())
      .post('/inventory/stock-in')
      .set(TENANT_A)
      .send({ productId, quantity: 50, reason: 'restock' })

    const product = inventoryService.getProduct(productId, ctxA())
    assert.ok(product)
    assert.equal(product!.currentStock, 120, '100 - 30 + 50 = 120')

    const records = inventoryService.getStockRecords(ctxA(), { productId })
    assert.equal(records.length, 3, '应有 3 条 stock record')
  } finally {
    await app.close()
  }
})
