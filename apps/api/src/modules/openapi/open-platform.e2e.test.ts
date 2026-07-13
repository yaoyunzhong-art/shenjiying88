import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import 'reflect-metadata'
import request from 'supertest'
import { Test } from '@nestjs/testing'
import {
  ValidationPipe,
} from '@nestjs/common'
import { OpenAPIController } from './openapi.controller'
import { APIKeyService } from './services/api-key.service'
import { WebhookService } from './services/webhook.service'
import { SandboxService } from './services/sandbox.service'
import { UsageService } from './services/usage.service'
import { KeyGenerator } from './key-generator'
import { SignValidator } from './sign-validator'
import { RateLimiter } from './rate-limiter'
import { WebhookDispatcher } from './webhook-dispatcher'
import { APIKeyAdapter } from './datasources/api-key.adapter'
import { WebhookAdapter } from './datasources/webhook.adapter'
import { SandboxAdapter } from './datasources/sandbox.adapter'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'
import { QuotaAdapter } from './datasources/quota.adapter'

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [OpenAPIController],
    providers: [
      APIKeyAdapter,
      WebhookAdapter,
      SandboxAdapter,
      RateLimitAdapter,
      QuotaAdapter,
      KeyGenerator,
      SignValidator,
      {
        provide: RateLimiter,
        useFactory: (rateLimitAdapter: RateLimitAdapter) => new RateLimiter(rateLimitAdapter),
        inject: [RateLimitAdapter],
      },
      {
        provide: WebhookDispatcher,
        useFactory: (webhookAdapter: WebhookAdapter) => new WebhookDispatcher(webhookAdapter),
        inject: [WebhookAdapter],
      },
      APIKeyService,
      WebhookService,
      SandboxService,
      UsageService,
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  await app.init()

  return {
    app,
    dispatcher: app.get(WebhookDispatcher),
  }
}

describe('E2E: [openapi] Open Platform Gateway HTTP链路', () => {
  let app: any
  let http: ReturnType<typeof request>
  let dispatcher: WebhookDispatcher

  beforeAll(async () => {
    const built = await buildApp()
    app = built.app
    dispatcher = built.dispatcher
    http = request(app.getHttpServer())
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    dispatcher.httpPoster = async () => ({
      success: true,
      responseStatus: 200,
      responseBody: 'ok',
    })
  })

  it('GET /openapi/docs 返回开放平台文档', async () => {
    const res = await http.get('/openapi/docs').expect(200)

    expect(res.body.openapi).toBe('3.1.0')
    expect(res.body.paths['/openapi/keys']).toBeDefined()
    expect(res.body.components.securitySchemes.ApiKeyAuth).toBeDefined()
  })

  it('POST + GET /openapi/keys 保持租户隔离且不返回明文 secret', async () => {
    const createRes = await http
      .post('/openapi/keys')
      .send({
        tenantId: 'tenant-openapi-e2e',
        environment: 'LIVE',
        name: 'E2E Key',
        scopes: [{ resource: 'orders', actions: ['read'] }],
      })
      .expect(201)

    expect(createRes.body.apiKey.keyId).toMatch(/^sk_live_/)
    expect(createRes.body.plaintextSecret).toBeTruthy()

    const ownList = await http
      .get('/openapi/keys')
      .query({ tenantId: 'tenant-openapi-e2e' })
      .expect(200)
    const otherList = await http
      .get('/openapi/keys')
      .query({ tenantId: 'tenant-openapi-e2e-other' })
      .expect(200)

    expect(ownList.body.keys).toHaveLength(1)
    expect(ownList.body.keys[0].tenantId).toBe('tenant-openapi-e2e')
    expect(ownList.body.keys[0].plaintextSecret).toBeUndefined()
    expect(otherList.body.keys).toHaveLength(0)
  })

  it('DELETE /openapi/keys/:id 撤销 key 后列表反映为 REVOKED', async () => {
    const createRes = await http
      .post('/openapi/keys')
      .send({
        tenantId: 'tenant-openapi-revoke',
        environment: 'TEST',
        name: 'E2E Revoke Key',
        scopes: [{ resource: 'orders', actions: ['read'] }],
      })
      .expect(201)

    await http
      .delete(`/openapi/keys/${createRes.body.apiKey.keyId}`)
      .query({ tenantId: 'tenant-openapi-revoke' })
      .expect(204)

    const listRes = await http
      .get('/openapi/keys')
      .query({ tenantId: 'tenant-openapi-revoke' })
      .expect(200)

    expect(listRes.body.keys[0].status).toBe('REVOKED')
  })

  it('POST /openapi/webhook/subscribe + /dispatch + /deliveries 完成成功投递链路', async () => {
    const subRes = await http
      .post('/openapi/webhook/subscribe')
      .send({
        tenantId: 'tenant-hook-e2e',
        url: 'https://hooks.example.com/e2e',
        events: ['order.created'],
      })
      .expect(201)

    const dispatchRes = await http
      .post('/openapi/webhook/dispatch')
      .send({
        tenantId: 'tenant-hook-e2e',
        subscriptionId: subRes.body.id,
        eventType: 'order.created',
        payload: { id: 'evt-e2e-1', orderNo: 'SO-E2E-001' },
      })
      .expect(201)

    const deliveriesRes = await http
      .get('/openapi/webhook/deliveries')
      .query({ tenantId: 'tenant-hook-e2e' })
      .expect(200)

    expect(dispatchRes.body.status).toBe('SUCCESS')
    expect(deliveriesRes.body.deliveries).toHaveLength(1)
    expect(deliveriesRes.body.deliveries[0].eventType).toBe('order.created')
  })

  it('POST /openapi/webhook/dispatch 失败后可在 dead-letter 中看到记录', async () => {
    dispatcher.httpPoster = async () => ({
      success: false,
      responseStatus: 503,
      errorMessage: 'upstream_down',
    })

    const subRes = await http
      .post('/openapi/webhook/subscribe')
      .send({
        tenantId: 'tenant-hook-dead',
        url: 'https://hooks.example.com/dead',
        events: ['order.created'],
      })
      .expect(201)

    const dispatchRes = await http
      .post('/openapi/webhook/dispatch')
      .send({
        tenantId: 'tenant-hook-dead',
        subscriptionId: subRes.body.id,
        eventType: 'order.created',
        payload: { id: 'evt-dead-1', orderNo: 'SO-DEAD-001' },
      })
      .expect(201)

    for (let i = 0; i < 4; i++) {
      await http
        .post(`/openapi/webhook/retry/${dispatchRes.body.id}`)
        .query({ tenantId: 'tenant-hook-dead' })
        .expect(201)
    }

    const deadRes = await http
      .get('/openapi/webhook/dead-letter')
      .query({ tenantId: 'tenant-hook-dead' })
      .expect(200)

    expect(deadRes.body.deadLetters).toHaveLength(1)
    expect(deadRes.body.deadLetters[0].status).toBe('DEAD_LETTER')
  })

  it('POST /openapi/usage/bucket + /check + GET /openapi/usage 形成租户级 usage 报表', async () => {
    await http
      .post('/openapi/usage/bucket')
      .send({
        tenantId: 'tenant-usage-e2e',
        endpoint: '/openapi/orders',
        qps: 10,
        dailyQuota: 5,
      })
      .expect(201)

    await http
      .post('/openapi/usage/check')
      .send({
        tenantId: 'tenant-usage-e2e',
        keyId: 'sk_live_usage_e2e',
        endpoint: '/openapi/orders',
      })
      .expect(201)

    await http
      .post('/openapi/usage/check')
      .send({
        tenantId: 'tenant-usage-e2e',
        keyId: 'sk_live_usage_e2e',
        endpoint: '/openapi/orders',
      })
      .expect(201)

    const ownRes = await http
      .get('/openapi/usage')
      .query({ tenantId: 'tenant-usage-e2e' })
      .expect(200)
    const otherRes = await http
      .get('/openapi/usage')
      .query({ tenantId: 'tenant-usage-other' })
      .expect(200)

    expect(ownRes.body.totalBuckets).toBe(1)
    expect(ownRes.body.totalUsageToday).toBe(2)
    expect(otherRes.body.totalBuckets).toBe(0)
    expect(otherRes.body.totalUsageToday).toBe(0)
  })

  it('POST /openapi/sign/verify 验证有效签名请求', async () => {
    const body = {
      secret: 'sig-e2e-secret',
      request: {
        method: 'POST' as const,
        url: '/api/orders',
        timestamp: Date.now(),
        nonce: 'nonce-e2e-1',
        body: '{"orderNo":"SO-001"}',
        signature: '',
      },
    }

    const validator = new SignValidator()
    body.request.signature = validator.sign({
      secret: body.secret,
      method: body.request.method,
      url: body.request.url,
      timestamp: body.request.timestamp,
      nonce: body.request.nonce,
      body: body.request.body,
    })

    const verifyRes = await http
      .post('/openapi/sign/verify')
      .send(body)
      .expect(201)

    expect(verifyRes.body.valid).toBe(true)
  })
})
