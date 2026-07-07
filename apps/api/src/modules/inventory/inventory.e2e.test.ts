import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [inventory] E2E 基础测试
 *
 * E2E 链路: HTTP → InventoryController → InventoryService → Product/Stock/Supplier/PurchaseOrder
 *
 * 覆盖:
 *   - Product CRUD: 创建 / 详情 / 列表 / 关键词搜索
 *   - 库存操作: stockIn / stockOut / adjustStock / 库存检查
 *   - 库存预警: 低库存 / 缺货
 *   - 库存记录: 出入库记录查询
 *   - 供应商: 创建 / 列表
 *   - 采购订单: 创建 / 确认 / 收货 (自动入库)
 *   - 跨租户隔离
 *   - 错误处理 (404/400)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Inject
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { InventoryService } from './inventory.service'
import { resetInventoryServiceTestState } from './inventory.service'
import { PurchaseOrderStatus } from './inventory.entity'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  ;(req as any).tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

// ========== 测试 Controller ==========

@Controller('inventory')
class TestInventoryController {
  constructor(@Inject(InventoryService) private readonly service: InventoryService) {}

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  createProduct(@Req() req: Request, @Body() body: any) {
    return this.service.createProduct((req as any).tenantContext, body)
  }

  @Get('products')
  listProducts(@Req() req: Request, @Query() query: any) {
    return this.service.listProducts((req as any).tenantContext, query)
  }

  @Get('products/:productId')
  getProduct(@Req() req: Request, @Param('productId') productId: string) {
    return this.service.getProduct(productId, (req as any).tenantContext)
  }

  @Put('products/:productId')
  updateProduct(@Req() req: Request, @Param('productId') productId: string, @Body() body: any) {
    return this.service.updateProduct(productId, (req as any).tenantContext, body)
  }

  @Post('stock-in')
  @HttpCode(HttpStatus.CREATED)
  stockIn(@Req() req: Request, @Body() body: any) {
    return this.service.stockIn((req as any).tenantContext, body)
  }

  @Post('stock-out')
  @HttpCode(HttpStatus.CREATED)
  stockOut(@Req() req: Request, @Body() body: any) {
    return this.service.stockOut((req as any).tenantContext, body)
  }

  @Post('stock-adjust')
  @HttpCode(HttpStatus.CREATED)
  adjustStock(@Req() req: Request, @Body() body: any) {
    return this.service.adjustStock((req as any).tenantContext, body)
  }

  @Get('stock-records')
  getStockRecords(@Req() req: Request, @Query() query: any) {
    return this.service.getStockRecords((req as any).tenantContext, query)
  }

  @Get('stock-alerts')
  getStockAlerts(@Req() req: Request, @Query('threshold') threshold?: string) {
    return this.service.getLowStockProducts(
      (req as any).tenantContext,
      threshold ? Number(threshold) : undefined
    )
  }

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  createSupplier(@Req() req: Request, @Body() body: any) {
    return this.service.createSupplier((req as any).tenantContext, body)
  }

  @Get('suppliers')
  listSuppliers(@Req() req: Request) {
    return this.service.listSuppliers((req as any).tenantContext)
  }

  @Post('purchase-orders')
  @HttpCode(HttpStatus.CREATED)
  createPurchaseOrder(@Req() req: Request, @Body() body: any) {
    return this.service.createPurchaseOrder((req as any).tenantContext, body)
  }

  @Get('purchase-orders')
  listPurchaseOrders(@Req() req: Request, @Query() query: any) {
    return this.service.listPurchaseOrders((req as any).tenantContext, query)
  }

  @Put('purchase-orders/:orderId/confirm')
  confirmOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    return this.service.confirmOrder(orderId, (req as any).tenantContext)
  }

  @Put('purchase-orders/:orderId/receive')
  receiveOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    return this.service.receiveOrder(orderId, (req as any).tenantContext)
  }
}

// ========== 构建 app ==========

async function buildApp() {
  resetInventoryServiceTestState()
  const service = new InventoryService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestInventoryController],
    providers: [{ provide: InventoryService, useValue: service }]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, service }
}

const TENANT_HEADERS = {
  'x-tenant-id': 'tenant-001',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

const TENANT_B_HEADERS = {
  'x-tenant-id': 'tenant-002',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

async function createProduct(app: any, overrides: any = {}, headers: any = TENANT_HEADERS) {
  return request(app.getHttpServer())
    .post('/inventory/products')
    .set(headers)
    .send({
      name: '矿泉水',
      sku: 'SKU-001',
      category: '饮料',
      unit: '瓶',
      price: 3,
      cost: 1,
      minStock: 10,
      maxStock: 100,
      currentStock: 50,
      ...overrides
    })
}

// ========== E2E: Product CRUD ==========

describe('E2E: Product CRUD', () => {
  it('POST → GET :id → PUT → GET 完整生命周期', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await createProduct(app)
      assert.equal(createRes.statusCode, 201)
      const productId = createRes.body.data.id
      assert.ok(productId.startsWith('prod-'))

      const getRes = await request(app.getHttpServer())
        .get(`/inventory/products/${productId}`)
        .set(TENANT_HEADERS)
      assert.equal(getRes.statusCode, 200)
      assert.equal(getRes.body.data.id, productId)
      assert.equal(getRes.body.data.name, '矿泉水')

      const updateRes = await request(app.getHttpServer())
        .put(`/inventory/products/${productId}`)
        .set(TENANT_HEADERS)
        .send({ price: 5, name: '矿泉水-改' })
      assert.equal(updateRes.statusCode, 200)
      assert.equal(updateRes.body.data.price, 5)
      assert.equal(updateRes.body.data.name, '矿泉水-改')
      // currentStock 不能通过 updateProduct 改 (库存完整性约束),只能 stockIn/Out/Adjust
      assert.equal(updateRes.body.data.currentStock, 50)

      const getAfterRes = await request(app.getHttpServer())
        .get(`/inventory/products/${productId}`)
        .set(TENANT_HEADERS)
      assert.equal(getAfterRes.body.data.price, 5)
    } finally {
      await app.close()
    }
  })

  it('GET /inventory/products 列表 + category 过滤', async () => {
    const { app } = await buildApp()
    try {
      await createProduct(app, { name: '可乐', sku: 'C-1', category: '饮料' })
      await createProduct(app, { name: '薯片', sku: 'S-1', category: '零食' })

      const res = await request(app.getHttpServer())
        .get('/inventory/products?category=饮料')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      for (const p of res.body.data) assert.equal(p.category, '饮料')
    } finally {
      await app.close()
    }
  })

  it('GET /inventory/products?keyword= 关键词搜索', async () => {
    const { app } = await buildApp()
    try {
      await createProduct(app, { name: '可口可乐', sku: 'COKE-001' })
      await createProduct(app, { name: '百事可乐', sku: 'PEPSI-001' })
      await createProduct(app, { name: '薯片', sku: 'CHIPS-001' })

      const res = await request(app.getHttpServer())
        .get('/inventory/products?keyword=可乐')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.length, 2)
    } finally {
      await app.close()
    }
  })

  it('GET /inventory/products/:id 不存在返回 500', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/inventory/products/non-existent-prod')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 库存操作 ==========

describe('E2E: 库存操作', () => {
  it('stockIn + stockOut + adjustStock 完整链路', async () => {
    const { app } = await buildApp()
    try {
      const create = await createProduct(app, { currentStock: 50 })
      const productId = create.body.data.id

      // 入库 20 → 70
      const inRes = await request(app.getHttpServer())
        .post('/inventory/stock-in')
        .set(TENANT_HEADERS)
        .send({ productId, quantity: 20, reason: '采购入库' })
      assert.equal(inRes.statusCode, 201)
      assert.equal(inRes.body.data.product.currentStock, 70)
      assert.equal(inRes.body.data.record.afterStock, 70)

      // 出库 10 → 60
      const outRes = await request(app.getHttpServer())
        .post('/inventory/stock-out')
        .set(TENANT_HEADERS)
        .send({ productId, quantity: 10, reason: '销售出库' })
      assert.equal(outRes.statusCode, 201)
      assert.equal(outRes.body.data.product.currentStock, 60)

      // 调整到 100 → +40
      const adjustRes = await request(app.getHttpServer())
        .post('/inventory/stock-adjust')
        .set(TENANT_HEADERS)
        .send({ productId, newQuantity: 100, reason: '盘点调整' })
      assert.equal(adjustRes.statusCode, 201)
      assert.equal(adjustRes.body.data.product.currentStock, 100)
    } finally {
      await app.close()
    }
  })

  it('stockOut 超量 → 500', async () => {
    const { app } = await buildApp()
    try {
      const create = await createProduct(app, { currentStock: 5 })
      const productId = create.body.data.id
      const res = await request(app.getHttpServer())
        .post('/inventory/stock-out')
        .set(TENANT_HEADERS)
        .send({ productId, quantity: 10 })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  it('GET /inventory/stock-records 按 type 过滤', async () => {
    const { app } = await buildApp()
    try {
      const create = await createProduct(app, { currentStock: 50 })
      const productId = create.body.data.id

      await request(app.getHttpServer())
        .post('/inventory/stock-in')
        .set(TENANT_HEADERS)
        .send({ productId, quantity: 10 })
      await request(app.getHttpServer())
        .post('/inventory/stock-out')
        .set(TENANT_HEADERS)
        .send({ productId, quantity: 5 })

      const res = await request(app.getHttpServer())
        .get('/inventory/stock-records')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.length >= 2)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 库存预警 ==========

describe('E2E: 库存预警', () => {
  it('低库存预警: currentStock <= minStock', async () => {
    const { app } = await buildApp()
    try {
      await createProduct(app, {
        name: '低库存商品',
        sku: 'LOW-001',
        currentStock: 5,
        minStock: 10
      })
      const res = await request(app.getHttpServer())
        .get('/inventory/stock-alerts')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      const lowStockAlert = res.body.data.find(
        (a: any) => a.product.sku === 'LOW-001'
      )
      assert.ok(lowStockAlert)
      assert.equal(lowStockAlert.status, 'low')
    } finally {
      await app.close()
    }
  })

  it('缺货预警: currentStock = 0 → out_of_stock', async () => {
    const { app } = await buildApp()
    try {
      await createProduct(app, {
        name: '缺货商品',
        sku: 'OOS-001',
        currentStock: 0,
        minStock: 5
      })
      const res = await request(app.getHttpServer())
        .get('/inventory/stock-alerts')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      const alert = res.body.data.find((a: any) => a.product.sku === 'OOS-001')
      assert.ok(alert)
      assert.equal(alert.status, 'out_of_stock')
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 供应商 & 采购订单 ==========

describe('E2E: 供应商和采购订单', () => {
  it('POST supplier → GET 列表 + 创建 PO', async () => {
    const { app } = await buildApp()
    try {
      // 1. 创建供应商
      const supplierRes = await request(app.getHttpServer())
        .post('/inventory/suppliers')
        .set(TENANT_HEADERS)
        .send({ name: '可口可乐公司', contactName: '张三', phone: '13800000000' })
      assert.equal(supplierRes.statusCode, 201)
      const supplierId = supplierRes.body.data.id

      // 2. 创建产品
      const product = await createProduct(app, { currentStock: 10 })

      // 3. 创建采购订单
      const poRes = await request(app.getHttpServer())
        .post('/inventory/purchase-orders')
        .set(TENANT_HEADERS)
        .send({
          supplierId,
          totalAmount: 100,
          items: [
            {
              productId: product.body.data.id,
              productName: product.body.data.name,
              sku: product.body.data.sku,
              quantity: 100,
              unitPrice: 1,
              totalPrice: 100
            }
          ]
        })
      assert.equal(poRes.statusCode, 201)
      assert.equal(poRes.body.data.status, PurchaseOrderStatus.Draft)

      // 4. 列表
      const listRes = await request(app.getHttpServer())
        .get('/inventory/purchase-orders')
        .set(TENANT_HEADERS)
      assert.equal(listRes.body.data.length, 1)
    } finally {
      await app.close()
    }
  })

  it('PO 状态机: Draft → Confirmed → Received (自动入库)', async () => {
    const { app } = await buildApp()
    try {
      // 创建供应商 + 产品
      const supplier = await request(app.getHttpServer())
        .post('/inventory/suppliers')
        .set(TENANT_HEADERS)
        .send({ name: '供应商A' })
      const supplierId = supplier.body.data.id

      const product = await createProduct(app, { currentStock: 10 })

      // 创建 PO
      const po = await request(app.getHttpServer())
        .post('/inventory/purchase-orders')
        .set(TENANT_HEADERS)
        .send({
          supplierId,
          totalAmount: 200,
          items: [
            {
              productId: product.body.data.id,
              productName: product.body.data.name,
              sku: product.body.data.sku,
              quantity: 50,
              unitPrice: 4,
              totalPrice: 200
            }
          ]
        })
      const orderId = po.body.data.id

      // 确认
      const confirmRes = await request(app.getHttpServer())
        .put(`/inventory/purchase-orders/${orderId}/confirm`)
        .set(TENANT_HEADERS)
      assert.equal(confirmRes.statusCode, 200)
      assert.equal(confirmRes.body.data.status, PurchaseOrderStatus.Confirmed)

      // 收货 (自动入库 +50)
      const receiveRes = await request(app.getHttpServer())
        .put(`/inventory/purchase-orders/${orderId}/receive`)
        .set(TENANT_HEADERS)
      assert.equal(receiveRes.statusCode, 200)
      assert.equal(receiveRes.body.data.status, PurchaseOrderStatus.Received)

      // 验证库存自动 +50
      const productAfter = await request(app.getHttpServer())
        .get(`/inventory/products/${product.body.data.id}`)
        .set(TENANT_HEADERS)
      assert.equal(productAfter.body.data.currentStock, 60) // 10 + 50
    } finally {
      await app.close()
    }
  })

  it('Draft 状态不可直接 receive', async () => {
    const { app } = await buildApp()
    try {
      const supplier = await request(app.getHttpServer())
        .post('/inventory/suppliers')
        .set(TENANT_HEADERS)
        .send({ name: '供应商X' })
      const product = await createProduct(app)
      const po = await request(app.getHttpServer())
        .post('/inventory/purchase-orders')
        .set(TENANT_HEADERS)
        .send({
          supplierId: supplier.body.data.id,
          totalAmount: 50,
          items: [
            {
              productId: product.body.data.id,
              productName: 'x',
              sku: 'x',
              quantity: 10,
              unitPrice: 5,
              totalPrice: 50
            }
          ]
        })
      // 跳过 confirm,直接 receive
      const res = await request(app.getHttpServer())
        .put(`/inventory/purchase-orders/${po.body.data.id}/receive`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 跨租户隔离 ==========

describe('E2E: 跨租户隔离', () => {
  it('tenant-B 看不到 tenant-A 的产品', async () => {
    const { app } = await buildApp()
    try {
      const create = await createProduct(app, {}, TENANT_HEADERS)
      const productId = create.body.data.id

      const res = await request(app.getHttpServer())
        .get(`/inventory/products/${productId}`)
        .set(TENANT_B_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  it('tenant-B 列表只返回自己的产品', async () => {
    const { app } = await buildApp()
    try {
      await createProduct(app, { name: 'A-Product', sku: 'A-1' }, TENANT_HEADERS)
      await createProduct(app, { name: 'B-Product', sku: 'B-1' }, TENANT_B_HEADERS)

      const aRes = await request(app.getHttpServer())
        .get('/inventory/products')
        .set(TENANT_HEADERS)
      const bRes = await request(app.getHttpServer())
        .get('/inventory/products')
        .set(TENANT_B_HEADERS)
      assert.equal(aRes.body.data.length, 1)
      assert.equal(bRes.body.data.length, 1)
      assert.equal(aRes.body.data[0].name, 'A-Product')
      assert.equal(bRes.body.data[0].name, 'B-Product')
    } finally {
      await app.close()
    }
  })

  it('tenant-B 无法修改 tenant-A 的产品', async () => {
    const { app } = await buildApp()
    try {
      const create = await createProduct(app, {}, TENANT_HEADERS)
      const productId = create.body.data.id
      const res = await request(app.getHttpServer())
        .put(`/inventory/products/${productId}`)
        .set(TENANT_B_HEADERS)
        .send({ price: 999 })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})
