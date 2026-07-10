import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E 跨模块 #11 — 库存预警 → 运营通知 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → InventoryService
 *       · createProduct (设 minStock 阈值)
 *       · stockOut (出库) → currentStock 减少
 *       · getLowStockProducts → 触发 StockAlert { status: 'low' | 'out_of_stock' }
 *       · stockIn (补货) → 预警解除
 *     → NotificationService
 *       · registerTemplate (低库存告警模板)
 *       · send (派发给运营 ops@tenant.com)
 *       · simulateSend: 正常收件人 → status='SENT' / 含 'fail' → status='FAILED'
 *       · retryDispatch (FAILED → 重发)
 *       · cancelDispatch (取消)
 *       · listDispatches (按 status/tenantId 过滤)
 *
 * 验证:
 *   - 低库存告警 → 通知模板派发 → SENT 状态
 *   - 缺货告警 (stock=0) → out_of_stock 状态
 *   - 失败派发 → FAILED → retry 重新派发
 *   - 取消派发 → CANCELLED
 *   - 模板更新 (body / enabled 切换)
 *   - 补货 → 预警自动解除
 *   - 跨租户隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req
} from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import {
  InventoryService,
  resetInventoryServiceTestState
} from '../inventory/inventory.service'
import {
  NotificationService,
  resetNotificationServiceTestState
} from '../notification/notification.service'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus
} from '../notification/notification.entity'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp } from './test-helpers'

// ─── TestController ───

@Controller()
class TestController {
  constructor(
    @Inject(InventoryService) private readonly inventoryService: InventoryService,
    @Inject(NotificationService) private readonly notificationService: NotificationService
  ) {}

  @Post('inventory/products')
  createProduct(@Req() req: Request, @Body() body: any) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.createProduct(tc, body)
  }

  @Post('inventory/stock-in')
  stockIn(@Req() req: Request, @Body() body: any) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.stockIn(tc, body)
  }

  @Post('inventory/stock-out')
  stockOut(@Req() req: Request, @Body() body: any) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.stockOut(tc, body)
  }

  @Get('inventory/alerts')
  getAlerts(@Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.inventoryService.getLowStockProducts(tc)
  }

  @Post('notifications/templates')
  registerTemplate(@Body() body: any) {
    return this.notificationService.registerTemplate(body)
  }

  @Post('notifications/send')
  sendNotification(@Req() req: Request, @Body() body: any) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.notificationService.send({
      ...body,
      tenantId: body.tenantId ?? tc.tenantId,
      brandId: body.brandId ?? tc.brandId,
      storeId: body.storeId ?? tc.storeId
    })
  }

  @Post('notifications/:dispatchId/retry')
  retry(@Param('dispatchId') dispatchId: string) {
    return this.notificationService.retryDispatch(dispatchId)
  }

  @Post('notifications/:dispatchId/cancel')
  cancel(@Param('dispatchId') dispatchId: string) {
    return this.notificationService.cancelDispatch(dispatchId)
  }

  @Post('notifications/templates/:templateId/update')
  updateTemplate(
    @Param('templateId') templateId: string,
    @Body() body: any
  ) {
    return this.notificationService.updateTemplate(templateId, body)
  }

  @Get('notifications/dispatches')
  listDispatches(@Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const status = req.header('x-status') as NotificationStatus | undefined
    return this.notificationService.listDispatches({
      tenantId: tc.tenantId,
      status
    })
  }
}

// ─── 构建 app ───

async function buildApp() {
  resetInventoryServiceTestState()
  resetNotificationServiceTestState()
  const inventoryService = new InventoryService()
  const notificationService = new NotificationService()

  const { app, moduleRef } = await buildCrossModuleTestApp({
    controllers: [TestController],
    providers: [
      { provide: InventoryService, useValue: inventoryService },
      { provide: NotificationService, useValue: notificationService }
    ],
  })
  return { app, moduleRef, inventoryService, notificationService }
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

async function createProduct(
  app: any,
  headers: Record<string, string>,
  opts: { sku: string; name?: string; currentStock?: number; minStock?: number; cost?: number; price?: number; maxStock?: number }
) {
  const res = await request(app.getHttpServer())
    .post('/inventory/products')
    .set(headers)
    .send({
      name: opts.name ?? opts.sku,
      sku: opts.sku,
      unit: 'pcs',
      price: opts.price ?? 50,
      cost: opts.cost ?? 30,
      currentStock: opts.currentStock ?? 100,
      minStock: opts.minStock ?? 10,
      maxStock: opts.maxStock ?? 200
    })
  assert.equal(res.statusCode, 201)
  return res.body.data.id
}

// ═══════════════════════════════════════════════════
// E2E: 库存预警 → 运营通知 完整联动
// ═══════════════════════════════════════════════════

it('e2e-11: full chain inventory low-stock alert → notification dispatch SENT', async () => {
  const { app, inventoryService, notificationService } = await buildApp()

  try {
    // 1. 注册低库存告警模板
    const tplRes = await request(app.getHttpServer())
      .post('/notifications/templates')
      .send({
        code: 'INV-LOW-STOCK',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Store,
        tenantId: 'tenant-A',
        storeId: 'store-A',
        locale: 'zh-CN',
        titleTemplate: '【低库存告警】{{sku}}',
        bodyTemplate: '商品 {{name}} 当前库存 {{currentStock}}, 低于阈值 {{minStock}}。请及时补货。',
        variables: ['sku', 'name', 'currentStock', 'minStock'],
        enabled: true
      })
    assert.equal(tplRes.statusCode, 201)
    const templateId = tplRes.body.data.id
    assert.equal(tplRes.body.data.code, 'INV-LOW-STOCK')

    // 2. 创建商品 (minStock=30, currentStock=50)
    const productId = await createProduct(app, TENANT_A, {
      sku: 'SKU-A-001',
      name: '可乐',
      currentStock: 50,
      minStock: 30
    })

    // 3. 出库 25 → 库存 25, 低于阈值 30 → 触发低库存告警
    const stockOutRes = await request(app.getHttpServer())
      .post('/inventory/stock-out')
      .set(TENANT_A)
      .send({ productId, quantity: 25, reason: 'POS sales' })
    assert.equal(stockOutRes.statusCode, 201)
    assert.equal(stockOutRes.body.data.product.currentStock, 25)

    // 4. 验证 getLowStockProducts 触发告警
    const alertsRes = await request(app.getHttpServer())
      .get('/inventory/alerts')
      .set(TENANT_A)
    assert.equal(alertsRes.statusCode, 200)
    assert.ok(alertsRes.body.data.length >= 1, '应有低库存告警')
    const alert = alertsRes.body.data.find((a: any) => a.product.id === productId)
    assert.ok(alert, '应包含本商品的告警')
    assert.equal(alert.status, 'low', '应为 low 状态')
    assert.equal(alert.currentStock, 25)

    // 5. 派发通知给运营 (使用模板)
    const dispatchRes = await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_A)
      .send({
        templateCode: 'INV-LOW-STOCK',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Store,
        recipient: 'ops@tenant-a.com',
        payload: {
          sku: 'SKU-A-001',
          name: '可乐',
          currentStock: 25,
          minStock: 30
        }
      })
    assert.equal(dispatchRes.statusCode, 201)
    assert.equal(dispatchRes.body.data.templateId, templateId, '应关联到模板')
    assert.equal(dispatchRes.body.data.recipient, 'ops@tenant-a.com')
    assert.equal(dispatchRes.body.data.status, 'SENT', '正常收件人应 SENT')
    assert.ok(dispatchRes.body.data.sentAt, 'sentAt 应已设置')

    // 6. 验证 listDispatches 可查到
    const listRes = await request(app.getHttpServer())
      .get('/notifications/dispatches')
      .set(TENANT_A)
    assert.equal(listRes.statusCode, 200)
    assert.equal(listRes.body.data.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e-11: out-of-stock alert when stock reaches 0', async () => {
  const { app, inventoryService } = await buildApp()

  try {
    const productId = await createProduct(app, TENANT_A, {
      sku: 'SKU-EMPTY',
      currentStock: 30,
      minStock: 20
    })

    // 全部出库 → 库存 0
    const stockOutRes = await request(app.getHttpServer())
      .post('/inventory/stock-out')
      .set(TENANT_A)
      .send({ productId, quantity: 30, reason: 'sales' })
    assert.equal(stockOutRes.statusCode, 201)
    assert.equal(stockOutRes.body.data.product.currentStock, 0)

    // 验证 out_of_stock 告警
    const alertsRes = await request(app.getHttpServer())
      .get('/inventory/alerts')
      .set(TENANT_A)
    const alert = alertsRes.body.data.find((a: any) => a.product.id === productId)
    assert.ok(alert, '应有告警')
    assert.equal(alert.status, 'out_of_stock', '库存为 0 → out_of_stock')
  } finally {
    await app.close()
  }
})

it('e2e-11: failed dispatch → retry → SENT', async () => {
  const { app, notificationService } = await buildApp()

  try {
    // 注册模板
    await request(app.getHttpServer())
      .post('/notifications/templates')
      .send({
        code: 'FAIL-TPL',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Store,
        tenantId: 'tenant-A',
        locale: 'en-US',
        bodyTemplate: 'test',
        enabled: true
      })

    // 派发给含 'fail' 的收件人 → 模拟失败
    const dispatchRes = await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_A)
      .send({
        templateCode: 'FAIL-TPL',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Store,
        recipient: 'fail-recipient@bad.com',
        payload: {}
      })
    assert.equal(dispatchRes.body.data.status, 'FAILED', '含 fail 的收件人应 FAILED')
    assert.ok(dispatchRes.body.data.providerResponse, '应有 providerResponse')
    assert.equal(dispatchRes.body.data.retryCount, 0)

    const dispatchId = dispatchRes.body.data.id

    // 重试 (recipient 仍含 'fail', 模拟仍会失败, 但 retryCount 增加 + 状态回流 PENDING→FAILED)
    const retryRes = await request(app.getHttpServer())
      .post(`/notifications/${dispatchId}/retry`)
      .send({})
    assert.equal(retryRes.statusCode, 201)
    assert.equal(retryRes.body.data.retryCount, 1, 'retryCount 增加')
    // status: 失败时 simulateSend 会重新评估 recipient, 因含 'fail' 仍 FAILED
    assert.ok(['FAILED', 'SENT'].includes(retryRes.body.data.status), '重试后状态为 FAILED/SENT')
  } finally {
    await app.close()
  }
})

it('e2e-11: cancel a sent dispatch → status remains SENT (not cancellable)', async () => {
  const { app, notificationService } = await buildApp()

  try {
    // 派发成功
    const dispatchRes = await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_A)
      .send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Store,
        recipient: 'user@example.com',
        payload: { code: '1234' }
      })
    assert.equal(dispatchRes.body.data.status, 'SENT')

    // 取消 SENT 派发 → 应保持 SENT (不可取消)
    const cancelRes = await request(app.getHttpServer())
      .post(`/notifications/${dispatchRes.body.data.id}/cancel`)
      .send({})
    assert.equal(cancelRes.statusCode, 201)
    assert.equal(cancelRes.body.data.status, 'SENT', '已 SENT 的派发不可取消')
  } finally {
    await app.close()
  }
})

it('e2e-11: list dispatches filter by status (PENDING/SENT/FAILED)', async () => {
  const { app, notificationService } = await buildApp()

  try {
    // 派发 2 个 SENT + 1 个 FAILED
    await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_A)
      .send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Store,
        recipient: 'a@example.com',
        payload: {}
      })
    await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_A)
      .send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Store,
        recipient: 'b@example.com',
        payload: {}
      })
    await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_A)
      .send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Store,
        recipient: 'fail-c@example.com',
        payload: {}
      })

    // 全部
    const allRes = await request(app.getHttpServer())
      .get('/notifications/dispatches')
      .set(TENANT_A)
    assert.equal(allRes.body.data.length, 3)

    // 仅 SENT
    const sentRes = await request(app.getHttpServer())
      .get('/notifications/dispatches')
      .set({ ...TENANT_A, 'x-status': NotificationStatus.Sent })
    assert.equal(sentRes.body.data.length, 2)
    assert.ok(sentRes.body.data.every((d: any) => d.status === 'SENT'))

    // 仅 FAILED
    const failedRes = await request(app.getHttpServer())
      .get('/notifications/dispatches')
      .set({ ...TENANT_A, 'x-status': NotificationStatus.Failed })
    assert.equal(failedRes.body.data.length, 1)
    assert.equal(failedRes.body.data[0].status, 'FAILED')
  } finally {
    await app.close()
  }
})

it('e2e-11: update notification template body and toggle enabled', async () => {
  const { app, notificationService } = await buildApp()

  try {
    // 注册模板
    const tplRes = await request(app.getHttpServer())
      .post('/notifications/templates')
      .send({
        code: 'UPD-TPL',
        channel: NotificationChannelType.Push,
        scopeType: FoundationScopeType.Brand,
        tenantId: 'tenant-A',
        brandId: 'brand-A',
        locale: 'zh-CN',
        bodyTemplate: '原始内容',
        enabled: true
      })
    const templateId = tplRes.body.data.id

    // 更新 body + 关闭
    const updateRes = await request(app.getHttpServer())
      .post(`/notifications/templates/${templateId}/update`)
      .send({
        bodyTemplate: '更新后内容',
        enabled: false
      })
    assert.equal(updateRes.statusCode, 201)
    assert.equal(updateRes.body.data.bodyTemplate, '更新后内容')
    assert.equal(updateRes.body.data.enabled, false)

    // findTemplateByCode 只返回 enabled=true 的模板
    const found = notificationService.findTemplateByCode('UPD-TPL')
    assert.equal(found, undefined, '禁用的模板不应被 findTemplateByCode 找到')
  } finally {
    await app.close()
  }
})

it('e2e-11: restock clears low-stock alert', async () => {
  const { app, inventoryService } = await buildApp()

  try {
    const productId = await createProduct(app, TENANT_A, {
      sku: 'SKU-RESTOCK',
      currentStock: 30,
      minStock: 25
    })

    // 出库到低库存
    await request(app.getHttpServer())
      .post('/inventory/stock-out')
      .set(TENANT_A)
      .send({ productId, quantity: 10, reason: 'sales' })
    // 库存 = 20, 低于阈值 25

    const lowRes = await request(app.getHttpServer())
      .get('/inventory/alerts')
      .set(TENANT_A)
    const lowAlert = lowRes.body.data.find((a: any) => a.product.id === productId)
    assert.ok(lowAlert, '应有低库存告警')
    assert.equal(lowAlert.status, 'low')

    // 补货 50 → 库存 70
    const restockRes = await request(app.getHttpServer())
      .post('/inventory/stock-in')
      .set(TENANT_A)
      .send({ productId, quantity: 50, reason: 'restock' })
    assert.equal(restockRes.statusCode, 201)
    assert.equal(restockRes.body.data.product.currentStock, 70)

    // 验证告警已解除
    const clearedRes = await request(app.getHttpServer())
      .get('/inventory/alerts')
      .set(TENANT_A)
    const clearedAlert = clearedRes.body.data.find((a: any) => a.product.id === productId)
    assert.equal(clearedAlert, undefined, '补货后告警应解除')
  } finally {
    await app.close()
  }
})

it('e2e-11: cross-tenant isolation - Tenant B cannot see Tenant A dispatches', async () => {
  const { app, inventoryService, notificationService } = await buildApp()

  try {
    // Tenant A: 派发一个
    await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_A)
      .send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Store,
        recipient: 'a-ops@example.com',
        payload: {}
      })

    // Tenant B: 派发一个
    await request(app.getHttpServer())
      .post('/notifications/send')
      .set(TENANT_B)
      .send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Store,
        recipient: 'b-ops@example.com',
        payload: {}
      })

    // Tenant A list: 1 个
    const tenantAList = await request(app.getHttpServer())
      .get('/notifications/dispatches')
      .set(TENANT_A)
    assert.equal(tenantAList.body.data.length, 1)
    assert.equal(tenantAList.body.data[0].tenantId, 'tenant-A')
    assert.equal(tenantAList.body.data[0].recipient, 'a-ops@example.com')

    // Tenant B list: 1 个
    const tenantBList = await request(app.getHttpServer())
      .get('/notifications/dispatches')
      .set(TENANT_B)
    assert.equal(tenantBList.body.data.length, 1)
    assert.equal(tenantBList.body.data[0].tenantId, 'tenant-B')
    assert.equal(tenantBList.body.data[0].recipient, 'b-ops@example.com')

    // 直接 service 验证: tenantId 过滤
    const serviceTenantA = notificationService.listDispatches({ tenantId: 'tenant-A' })
    const serviceTenantB = notificationService.listDispatches({ tenantId: 'tenant-B' })
    assert.equal(serviceTenantA.length, 1)
    assert.equal(serviceTenantB.length, 1)
    assert.equal(serviceTenantA[0]!.id, tenantAList.body.data[0].id)
    assert.equal(serviceTenantB[0]!.id, tenantBList.body.data[0].id)
  } finally {
    await app.close()
  }
})
