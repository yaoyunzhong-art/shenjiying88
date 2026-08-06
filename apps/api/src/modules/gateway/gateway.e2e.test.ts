import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Gateway API 网关 HTTP 链路
 *
 * 链路:
 *   HTTP → GatewayController → APIGateway + RateLimiterService + APIKeyManager + GatewayAnalyticsService
 *
 * 验证:
 *   - 路由转发(按 path/method 匹配目标微服务)
 *   - 限流(令牌桶消费/配额管理)
 *   - 鉴权(API Key 创建/验证/吊销)
 *   - 请求日志记录
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { GatewayController } from './gateway.controller'
import { APIGateway, RateLimiterService, APIKeyManager } from './gateway.service'
import { GatewayAnalyticsService } from './gateway-analytics.service'

const T = 'test-tenant'

async function buildApp() {
  const rateLimiter = new RateLimiterService()
  const apiKeyManager = new APIKeyManager()
  const apiGateway = new APIGateway(rateLimiter, apiKeyManager)
  const analyticsService = new GatewayAnalyticsService()
  analyticsService.setLogSource(apiGateway)

  const moduleRef = await Test.createTestingModule({
    controllers: [GatewayController],
    providers: [
      { provide: APIGateway, useValue: apiGateway },
      { provide: RateLimiterService, useValue: rateLimiter },
      { provide: APIKeyManager, useValue: apiKeyManager },
      { provide: GatewayAnalyticsService, useValue: analyticsService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, apiGateway, rateLimiter, apiKeyManager }
}

it('e2e: 路由转发按 path/method 匹配目标服务', async () => {
  const { app } = await buildApp()
  try {
    const routes: Array<{ path: string; method: string; expectedService: string }> = [
      { path: '/api/agent/status', method: 'GET', expectedService: 'agent-service' },
      { path: '/api/order/create', method: 'POST', expectedService: 'order-service' },
      { path: '/api/product/list', method: 'GET', expectedService: 'product-service' },
      { path: '/api/member/profile', method: 'PUT', expectedService: 'member-service' },
    ]

    for (const { path, method, expectedService } of routes) {
      const res = await request(app.getHttpServer())
        .post('/gateway/route')
        .set('x-tenant-id', T)
        .send({ path, method })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.found, true)
      assert.equal(res.body.data.service, expectedService)
      assert.ok(res.body.data.timeout > 0)
    }
  } finally {
    await app.close()
  }
})

it('e2e: 不存在的路由返回 not found', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/gateway/route')
      .set('x-tenant-id', T)
      .send({ path: '/api/unknown-service/test', method: 'GET' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.found, false)
  } finally {
    await app.close()
  }
})

it('e2e: 限流令牌桶消费与配额管理', async () => {
  const { app } = await buildApp()
  try {
    const clientId = 'client-rate-limit'
    const endpoint = 'GET:/api/test'

    // 设置较低配额 — controller 使用 @HttpCode(HttpStatus.OK)
    await request(app.getHttpServer())
      .post('/gateway/quota/set')
      .set('x-tenant-id', T)
      .send({ clientId, endpoint, maxTokens: 5, refillRate: 1 })
      .expect(200)

    // 消费前查询配额状态
    const beforeRes = await request(app.getHttpServer())
      .post('/gateway/quota')
      .set('x-tenant-id', T)
      .send({ clientId, endpoint })
    assert.equal(beforeRes.statusCode, 200)
    assert.equal(beforeRes.body.data.maxTokens, 5)
    assert.ok(beforeRes.body.data.tokens >= 0)

    // 连续消费 5 次，前 5 次应该允许
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/gateway/rate-limit/consume')
        .set('x-tenant-id', T)
        .send({ clientId, path: '/api/test', method: 'GET' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.allowed, true, `Token ${i + 1} should be allowed`)
    }

    // 第 6 次被限流
    const deniedRes = await request(app.getHttpServer())
      .post('/gateway/rate-limit/consume')
      .set('x-tenant-id', T)
      .send({ clientId, path: '/api/test', method: 'GET' })
    assert.equal(deniedRes.statusCode, 200)
    assert.equal(deniedRes.body.data.allowed, false)
    assert.equal(deniedRes.body.data.remaining, 0)
  } finally {
    await app.close()
  }
})

it('e2e: API Key 创建→鉴权→列表→吊销全流程', async () => {
  const { app } = await buildApp()
  try {
    // 1. 创建 API Key
    const createRes = await request(app.getHttpServer())
      .post('/gateway/api-keys')
      .set('x-tenant-id', T)
      .send({ name: 'test-key', ownerId: 'user-001', scopes: ['read', 'write'] })
    assert.equal(createRes.statusCode, 201)
    const keyId = createRes.body.data.keyId
    const apiKey = createRes.body.data.key
    assert.ok(keyId)
    assert.ok(apiKey.startsWith('sk_gateway_'))

    // 2. 使用 API Key 鉴权
    const authRes = await request(app.getHttpServer())
      .post('/gateway/auth')
      .set('x-tenant-id', T)
      .send({ apiKey, path: '/api/order', method: 'GET' })
    assert.equal(authRes.statusCode, 200)
    assert.equal(authRes.body.data.authenticated, true)
    assert.equal(authRes.body.data.ownerId, 'user-001')
    assert.ok(authRes.body.data.scopes.includes('read'))

    // 3. 列出用户 API Keys
    const listRes = await request(app.getHttpServer())
      .get('/gateway/api-keys/user-001')
      .set('x-tenant-id', T)
    assert.equal(listRes.statusCode, 200)
    assert.ok(listRes.body.data.length >= 1)

    // 4. 吊销 API Key
    const revokeRes = await request(app.getHttpServer())
      .post('/gateway/api-keys/revoke')
      .set('x-tenant-id', T)
      .send({ keyId })
    assert.equal(revokeRes.statusCode, 200)
    assert.equal(revokeRes.body.data.success, true)

    // 5. 吊销后鉴权失败
    const expiredAuth = await request(app.getHttpServer())
      .post('/gateway/auth')
      .set('x-tenant-id', T)
      .send({ apiKey, path: '/api/order', method: 'GET' })
    assert.equal(expiredAuth.statusCode, 200)
    assert.equal(expiredAuth.body.data.authenticated, false)
  } finally {
    await app.close()
  }
})

it('e2e: 请求日志记录与查询', async () => {
  const { app, apiGateway } = await buildApp()
  try {
    // 产生一些请求日志
    await apiGateway.logRequest({ path: '/api/test', method: 'GET', headers: {}, timestamp: Date.now() })
    await apiGateway.logRequest({ path: '/api/order', method: 'POST', headers: {}, timestamp: Date.now() }, { statusCode: 200, body: {} })
    await apiGateway.logRequest({ path: '/api/error', method: 'GET', headers: {}, timestamp: Date.now() }, { statusCode: 500, body: {} })

    const res = await request(app.getHttpServer())
      .get('/gateway/logs?limit=10')
      .set('x-tenant-id', T)
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data.length >= 3)
    assert.equal(res.body.data[res.body.data.length - 1].path, '/api/error')
    assert.equal(res.body.data[res.body.data.length - 1].method, 'GET')
  } finally {
    await app.close()
  }
})

it('e2e: 网关分析摘要与端点分析', async () => {
  const { app, apiGateway } = await buildApp()
  try {
    // 产生分析数据
    for (let i = 0; i < 5; i++) {
      await apiGateway.logRequest({ path: '/api/agent', method: 'GET', headers: { 'x-api-key': 'client-1' }, timestamp: Date.now() - i * 1000 }, { statusCode: 200, body: {} })
    }
    await apiGateway.logRequest({ path: '/api/error', method: 'GET', headers: { 'x-api-key': 'client-1' }, timestamp: Date.now() }, { statusCode: 500, body: {} })

    // 分析摘要
    const summaryRes = await request(app.getHttpServer())
      .get('/gateway/analytics/summary')
      .set('x-tenant-id', T)
    assert.equal(summaryRes.statusCode, 200)
    assert.ok(summaryRes.body.data.totalRequests >= 6)
    assert.ok(summaryRes.body.data.uniqueClients >= 1)

    // 端点分析
    const endpointsRes = await request(app.getHttpServer())
      .get('/gateway/analytics/endpoints')
      .set('x-tenant-id', T)
    assert.equal(endpointsRes.statusCode, 200)
    assert.ok(endpointsRes.body.data.length >= 1)

    // 客户端分析
    const clientsRes = await request(app.getHttpServer())
      .get('/gateway/analytics/clients')
      .set('x-tenant-id', T)
    assert.equal(clientsRes.statusCode, 200)
    assert.ok(clientsRes.body.data.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: 异常检测', async () => {
  const { app, apiGateway } = await buildApp()
  try {
    // 产生足够样本数据
    for (let i = 0; i < 20; i++) {
      await apiGateway.logRequest(
        { path: '/api/test', method: 'GET', headers: {}, timestamp: Date.now() - i * 1000 },
        { statusCode: 200, body: {} }
      )
    }

    const anomaliesRes = await request(app.getHttpServer())
      .get('/gateway/analytics/anomalies')
      .set('x-tenant-id', T)
    assert.equal(anomaliesRes.statusCode, 200)
    assert.ok(Array.isArray(anomaliesRes.body.data))
    assert.ok(anomaliesRes.body.data.length >= 1)
    assert.equal(typeof anomaliesRes.body.data[0].detected, 'boolean')
  } finally {
    await app.close()
  }
})
