/**
 * E2E: Notification 通知模块 HTTP 链路
 *
 * 链路:
 *   HTTP → NotificationController → NotificationService → MapStore
 *
 * 验证:
 *   - POST /notifications/templates     - 注册模板
 *   - GET  /notifications/templates     - 模板列表/筛选
 *   - GET  /notifications/templates/:id - 模板详情
 *   - PATCH /notifications/templates/:id - 更新模板
 *   - POST /notifications/send          - 发送通知
 *   - GET  /notifications/dispatches    - 调度列表/筛选
 *   - GET  /notifications/dispatches/:id - 调度详情
 *   - POST /notifications/dispatches/:id/retry  - 重试
 *   - POST /notifications/dispatches/:id/cancel - 取消
 *   - 模板不存在时的边界行为
 *   - 调度不存在时的边界行为
 *   - 发送失败通知后重试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { NotificationService } from './notification.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
} from './notification.entity'
import {
  toNotificationDispatchContract,
  toNotificationTemplateContract,
} from './notification.contract'
import {
  RegisterNotificationTemplateDto,
  SendNotificationDto,
  UpdateNotificationTemplateDto,
} from './notification.dto'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-notify',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-notify',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-notify',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

/** 内嵌 controller, 用 @Req() 取 tenantContext 而不是 @TenantContext() 自定义装饰器 */
@Controller('notifications')
class TestNotificationController {
  constructor(
    @Inject(NotificationService) private readonly notificationService: NotificationService
  ) {}

  @Post('templates')
  registerTemplate(
    @Req() req: Request,
    @Body() body: RegisterNotificationTemplateDto
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext!
    const template = this.notificationService.registerTemplate({
      code: body.code,
      channel: body.channel,
      scopeType: body.scopeType,
      tenantId: body.tenantId ?? tenantContext.tenantId,
      brandId: body.brandId ?? tenantContext.brandId,
      storeId: body.storeId ?? tenantContext.storeId,
      marketCode: body.marketCode ?? tenantContext.marketCode,
      locale: body.locale,
      titleTemplate: body.titleTemplate,
      bodyTemplate: body.bodyTemplate,
      variables: body.variables,
      enabled: body.enabled
    })
    return toNotificationTemplateContract(template)
  }

  @Get('templates')
  listTemplates(
    @Req() req: Request,
    @Query('channel') channel?: NotificationChannelType,
    @Query('scopeType') scopeType?: FoundationScopeType,
    @Query('enabled') enabled?: string
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext!
    return this.notificationService
      .listTemplates({
        channel,
        scopeType,
        tenantId: tenantContext.tenantId,
        enabled: enabled !== undefined ? enabled === 'true' : undefined
      })
      .map(toNotificationTemplateContract)
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    const template = this.notificationService.getTemplate(id)
    return template ? toNotificationTemplateContract(template) : null
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() body: UpdateNotificationTemplateDto
  ) {
    const template = this.notificationService.updateTemplate(id, body)
    return template ? toNotificationTemplateContract(template) : null
  }

  @Post('send')
  send(
    @Req() req: Request,
    @Body() body: SendNotificationDto
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext!
    const dispatch = this.notificationService.send({
      templateCode: body.templateCode,
      channel: body.channel,
      scopeType: body.scopeType,
      tenantId: body.tenantId ?? tenantContext.tenantId,
      brandId: body.brandId ?? tenantContext.brandId,
      storeId: body.storeId ?? tenantContext.storeId,
      recipient: body.recipient,
      payload: body.payload,
      scheduledAt: body.scheduledAt
    })
    return toNotificationDispatchContract(dispatch)
  }

  @Get('dispatches')
  listDispatches(
    @Req() req: Request,
    @Query('status') status?: NotificationStatus,
    @Query('channel') channel?: NotificationChannelType,
    @Query('recipient') recipient?: string
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext!
    return this.notificationService
      .listDispatches({
        status,
        channel,
        tenantId: tenantContext.tenantId,
        recipient
      })
      .map(toNotificationDispatchContract)
  }

  @Get('dispatches/:id')
  getDispatch(@Param('id') id: string) {
    const dispatch = this.notificationService.getDispatch(id)
    return dispatch ? toNotificationDispatchContract(dispatch) : null
  }

  @Post('dispatches/:id/retry')
  retryDispatch(@Param('id') id: string) {
    const dispatch = this.notificationService.retryDispatch(id)
    return dispatch ? toNotificationDispatchContract(dispatch) : null
  }

  @Post('dispatches/:id/cancel')
  cancelDispatch(@Param('id') id: string) {
    const dispatch = this.notificationService.cancelDispatch(id)
    return dispatch ? toNotificationDispatchContract(dispatch) : null
  }
}

function makeApp() {
  return Test.createTestingModule({
    controllers: [TestNotificationController],
    providers: [NotificationService]
  }).compile()
}

// ── 测试套件 ──

test('Notification E2E: POST /notifications/templates 注册模板 - 正向', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const res = await request(app.getHttpServer())
    .post('/notifications/templates')
    .send({
      code: 'welcome-email',
      channel: 'EMAIL',
      scopeType: 'TENANT',
      locale: 'zh-CN',
      bodyTemplate: '欢迎 {{username}} 加入 {{tenantName}}',
      variables: ['username', 'tenantName'],
      enabled: true
    })
    .expect(201)

  assert.equal(res.body.data.code, 'welcome-email')
  assert.equal(res.body.data.channel, 'EMAIL')
  assert.equal(res.body.data.locale, 'zh-CN')
  assert.ok(res.body.data.id, 'should have id')
  assert.ok(res.body.data.createdAt, 'should have createdAt')
  await app.close()
})

test('Notification E2E: POST /notifications/templates 带 head 租户上下文', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const res = await request(app.getHttpServer())
    .post('/notifications/templates')
    .set('x-tenant-id', 't-head-001')
    .set('x-brand-id', 'b-head-001')
    .send({
      code: 'order-sms',
      channel: 'SMS',
      scopeType: 'STORE',
      locale: 'en-US',
      bodyTemplate: 'Order {{orderId}} confirmed'
    })
    .expect(201)

  assert.equal(res.body.data.code, 'order-sms')
  assert.equal(res.body.data.channel, 'SMS')
  assert.equal(res.body.data.tenantId, 't-head-001')
  assert.equal(res.body.data.brandId, 'b-head-001')
  await app.close()
})

test('Notification E2E: GET /notifications/templates 列表与筛选', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  // 注册两条模板
  await request(app.getHttpServer())
    .post('/notifications/templates')
    .send({ code: 'tpl-a', channel: 'EMAIL', scopeType: 'TENANT', locale: 'zh-CN', bodyTemplate: 'A' })
    .expect(201)
  await request(app.getHttpServer())
    .post('/notifications/templates')
    .send({ code: 'tpl-b', channel: 'SMS', scopeType: 'STORE', locale: 'en-US', bodyTemplate: 'B' })
    .expect(201)

  // 全部查询
  const all = await request(app.getHttpServer())
    .get('/notifications/templates')
    .expect(200)
  assert.ok(all.body.data.length >= 2)

  // 按 channel 筛选
  const byChannel = await request(app.getHttpServer())
    .get('/notifications/templates?channel=EMAIL')
    .expect(200)
  for (const tpl of byChannel.body.data) {
    assert.equal(tpl.channel, 'EMAIL')
  }

  // 按 scopeType 筛选
  const byScope = await request(app.getHttpServer())
    .get('/notifications/templates?scopeType=STORE')
    .expect(200)
  for (const tpl of byScope.body.data) {
    assert.equal(tpl.scopeType, 'STORE')
  }

  await app.close()
})

test('Notification E2E: GET /notifications/templates/:id 模板详情', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const created = await request(app.getHttpServer())
    .post('/notifications/templates')
    .send({ code: 'detail-tpl', channel: 'PUSH', scopeType: 'BRAND', locale: 'ja-JP', bodyTemplate: 'こんにちは' })
    .expect(201)

  const tplId = created.body.data.id

  const res = await request(app.getHttpServer())
    .get(`/notifications/templates/${tplId}`)
    .expect(200)
  assert.equal(res.body.data.id, tplId)
  assert.equal(res.body.data.code, 'detail-tpl')

  // 不存在的 id
  const missing = await request(app.getHttpServer())
    .get('/notifications/templates/nonexistent')
    .expect(200)
  assert.equal(missing.body.data, null)

  await app.close()
})

test('Notification E2E: PATCH /notifications/templates/:id 更新模板', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const created = await request(app.getHttpServer())
    .post('/notifications/templates')
    .send({ code: 'patch-tpl', channel: 'IN_APP', scopeType: 'TENANT', locale: 'zh-CN', bodyTemplate: 'old body' })
    .expect(201)

  const tplId = created.body.data.id

  const updated = await request(app.getHttpServer())
    .patch(`/notifications/templates/${tplId}`)
    .send({ bodyTemplate: 'new body', enabled: false })
    .expect(200)

  assert.equal(updated.body.data.bodyTemplate, 'new body')
  assert.equal(updated.body.data.enabled, false)

  // 更新不存在的
  const missing = await request(app.getHttpServer())
    .patch('/notifications/templates/no-such-id')
    .send({ enabled: true })
    .expect(200)
  assert.equal(missing.body.data, null)

  await app.close()
})

test('Notification E2E: POST /notifications/send 发送通知', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const res = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({
      channel: 'EMAIL',
      scopeType: 'TENANT',
      recipient: 'user@example.com',
      payload: { orderId: 'ORD-001', amount: 99.9 }
    })
    .expect(201)

  assert.equal(res.body.data.channel, 'EMAIL')
  assert.equal(res.body.data.recipient, 'user@example.com')
  assert.equal(res.body.data.status, 'SENT')
  assert.equal(res.body.data.payload.orderId, 'ORD-001')
  assert.ok(res.body.data.providerResponse, 'should have provider response')
  assert.equal(res.body.data.retryCount, 0)

  await app.close()
})

test('Notification E2E: POST /notifications/send 关联模板发送', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const tpl = await request(app.getHttpServer())
    .post('/notifications/templates')
    .send({ code: 'linked-tpl', channel: 'SMS', scopeType: 'STORE', locale: 'zh-CN', bodyTemplate: '验证码 {{code}}' })
    .expect(201)

  const res = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({
      templateCode: 'linked-tpl',
      channel: 'SMS',
      scopeType: 'STORE',
      recipient: '+8613800138000',
      payload: { code: '123456' }
    })
    .expect(201)

  assert.equal(res.body.data.templateId, tpl.body.data.id)
  assert.equal(res.body.data.status, 'SENT')

  await app.close()
})

test('Notification E2E: POST /notifications/send 失败通知', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const res = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({
      channel: 'WEBHOOK',
      scopeType: 'TENANT',
      recipient: 'fail-webhook@example.com',
      payload: { event: 'test' }
    })
    .expect(201)

  assert.equal(res.body.data.status, 'FAILED')
  assert.ok(res.body.data.providerResponse)
  assert.equal(res.body.data.providerResponse.error, 'PROVIDER_REJECTED')

  await app.close()
})

test('Notification E2E: GET /notifications/dispatches 调度列表与筛选', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  await request(app.getHttpServer())
    .post('/notifications/send')
    .send({ channel: 'EMAIL', scopeType: 'TENANT', recipient: 'a@x.com', payload: {} })
    .expect(201)
  await request(app.getHttpServer())
    .post('/notifications/send')
    .send({ channel: 'SMS', scopeType: 'STORE', recipient: 'fail-test@x.com', payload: {} })
    .expect(201)

  const all = await request(app.getHttpServer())
    .get('/notifications/dispatches')
    .expect(200)
  assert.ok(all.body.data.length >= 2)

  const sent = await request(app.getHttpServer())
    .get('/notifications/dispatches?status=SENT')
    .expect(200)
  for (const d of sent.body.data) {
    assert.equal(d.status, 'SENT')
  }

  const failed = await request(app.getHttpServer())
    .get('/notifications/dispatches?status=FAILED')
    .expect(200)
  for (const d of failed.body.data) {
    assert.equal(d.status, 'FAILED')
  }

  const byChannel = await request(app.getHttpServer())
    .get('/notifications/dispatches?channel=SMS')
    .expect(200)
  for (const d of byChannel.body.data) {
    assert.equal(d.channel, 'SMS')
  }

  const byRecipient = await request(app.getHttpServer())
    .get('/notifications/dispatches?recipient=a@x.com')
    .expect(200)
  for (const d of byRecipient.body.data) {
    assert.equal(d.recipient, 'a@x.com')
  }

  await app.close()
})

test('Notification E2E: GET /notifications/dispatches/:id 调度详情', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const sent = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({ channel: 'PUSH', scopeType: 'BRAND', recipient: 'device-001', payload: { title: 'Hi' } })
    .expect(201)

  const dispatchId = sent.body.data.id

  const res = await request(app.getHttpServer())
    .get(`/notifications/dispatches/${dispatchId}`)
    .expect(200)
  assert.equal(res.body.data.id, dispatchId)
  assert.equal(res.body.data.status, 'SENT')

  const missing = await request(app.getHttpServer())
    .get('/notifications/dispatches/no-dispatch')
    .expect(200)
  assert.equal(missing.body.data, null)

  await app.close()
})

test('Notification E2E: POST /notifications/dispatches/:id/retry 重试失败通知', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const sent = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({ channel: 'EMAIL', scopeType: 'TENANT', recipient: 'fail-retry@x.com', payload: {} })
    .expect(201)

  const dispatchId = sent.body.data.id
  assert.equal(sent.body.data.status, 'FAILED')
  assert.equal(sent.body.data.retryCount, 0)

  const retried = await request(app.getHttpServer())
    .post(`/notifications/dispatches/${dispatchId}/retry`)
    .expect(201)

  assert.equal(retried.body.data.retryCount, 1)
  assert.equal(retried.body.data.status, 'FAILED')

  const missing = await request(app.getHttpServer())
    .post('/notifications/dispatches/nonexistent/retry')
    .expect(201)
  assert.equal(missing.body.data, null)

  await app.close()
})

test('Notification E2E: POST /notifications/dispatches/:id/retry 对已成功不变', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const sent = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({ channel: 'IN_APP', scopeType: 'TENANT', recipient: 'success-user', payload: {} })
    .expect(201)

  const dispatchId = sent.body.data.id
  assert.equal(sent.body.data.status, 'SENT')

  const retried = await request(app.getHttpServer())
    .post(`/notifications/dispatches/${dispatchId}/retry`)
    .expect(201)
  assert.equal(retried.body.data.status, 'SENT')
  assert.equal(retried.body.data.retryCount, 0)

  await app.close()
})

test('Notification E2E: POST /notifications/dispatches/:id/cancel 取消通知', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const sent = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({ channel: 'SOCIAL', scopeType: 'TENANT', recipient: 'user-social', payload: {} })
    .expect(201)

  const cancelled = await request(app.getHttpServer())
    .post(`/notifications/dispatches/${sent.body.data.id}/cancel`)
    .expect(201)
  assert.equal(cancelled.body.data.status, 'SENT') // 已发送的不能取消

  const missing = await request(app.getHttpServer())
    .post('/notifications/dispatches/fake-id/cancel')
    .expect(201)
  assert.equal(missing.body.data, null)

  await app.close()
})

test('Notification E2E: 端到端模板→发送→查询→取消流程', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const tpl = await request(app.getHttpServer())
    .post('/notifications/templates')
    .send({
      code: 'full-flow',
      channel: 'EMAIL',
      scopeType: 'BRAND',
      locale: 'en-US',
      titleTemplate: 'Your Order',
      bodyTemplate: 'Order {{orderId}} is {{status}}',
      variables: ['orderId', 'status']
    })
    .expect(201)
  assert.equal(tpl.body.data.variables.length, 2)

  const dispatch = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({
      templateCode: 'full-flow',
      channel: 'EMAIL',
      scopeType: 'BRAND',
      recipient: 'flow@example.com',
      payload: { orderId: 'FLOW-001', status: 'confirmed' }
    })
    .expect(201)
  assert.equal(dispatch.body.data.templateId, tpl.body.data.id)

  const detail = await request(app.getHttpServer())
    .get(`/notifications/dispatches/${dispatch.body.data.id}`)
    .expect(200)
  assert.equal(detail.body.data.recipient, 'flow@example.com')

  const templates = await request(app.getHttpServer())
    .get('/notifications/templates?channel=EMAIL')
    .expect(200)
  const found = templates.body.data.find((t: any) => t.code === 'full-flow')
  assert.ok(found, 'full-flow template should exist in filtered list')

  await app.close()
})

test('Notification E2E: 边界 - 大量模板注册与列表查询', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const count = 10
  for (let i = 0; i < count; i++) {
    await request(app.getHttpServer())
      .post('/notifications/templates')
      .send({ code: `bulk-${i}`, channel: 'EMAIL', scopeType: 'TENANT', locale: 'zh-CN', bodyTemplate: `template ${i}` })
      .expect(201)
  }

  const list = await request(app.getHttpServer())
    .get('/notifications/templates')
    .expect(200)
  assert.ok(list.body.data.length >= count)

  await app.close()
})

test('Notification E2E: 带 scheduledAt 的定时发送', async (t) => {
  const moduleFixture = await makeApp()
  const app = moduleFixture.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  const futureDate = new Date(Date.now() + 86400000).toISOString()
  const res = await request(app.getHttpServer())
    .post('/notifications/send')
    .send({
      channel: 'PUSH',
      scopeType: 'STORE',
      recipient: 'device-scheduled',
      payload: { reminder: 'tomorrow' },
      scheduledAt: futureDate
    })
    .expect(201)

  assert.equal(res.body.data.scheduledAt, futureDate)
  assert.equal(res.body.data.status, 'SENT')

  await app.close()
})
