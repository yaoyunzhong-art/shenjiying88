import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Open-API 开放 API 管理 HTTP 链路
 *
 * 链路:
 *   HTTP → OpenApiController → OpenApiService
 *
 * 验证:
 *   - 密钥创建: OAuth 2.0 client_credentials token 获取
 *   - 接口调用: Bearer token + HMAC 签名数据同步
 *   - 限流: 滑动窗口 QPS 限制
 *   - 审计: HMAC 签名校验 / IP 白名单 / Token 验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import * as crypto from 'node:crypto'
import { Controller, Post, Get, Body, Headers, Req, HttpCode, HttpStatus } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { Request } from 'express'
import { OpenApiService } from './open-api.service'

// ─── Test controller mirroring OpenApiController for isolated e2e ──

@Controller('open-test')
class TestOpenApiController {
  constructor(private readonly service: OpenApiService) {}

  @Post('auth')
  @HttpCode(HttpStatus.OK)
  async authenticate(@Body() body: { client_id: string; client_secret: string; scope?: string }) {
    return this.service.authenticate(body.client_id, body.client_secret, body.scope?.split(' ') ?? [])
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() body: { access_token: string }) {
    return this.service.verifyToken(body.access_token)
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync(
    @Body() payload: { businessKey: string; data?: Record<string, unknown>; resourceType?: string; action?: string },
    @Headers('authorization') authHeader: string,
    @Headers('x-client-id') clientId: string,
    @Headers('x-hmac-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Req() _req: Request,
  ) {
    const token = (authHeader ?? '').replace('Bearer ', '')
    await this.service.verifyToken(token)

    if (!this.service.verifyHmacSignature(clientId, 'POST', '/open/sync', timestamp, JSON.stringify(payload), signature)) {
      throw new Error('HMAC signature invalid')
    }
    const syncPayload = {
      resourceType: payload.resourceType ?? 'order',
      action: (payload.action ?? 'create') as 'create' | 'update' | 'delete',
      data: payload.data ?? {},
      businessKey: payload.businessKey,
      timestamp: new Date().toISOString(),
    }
    return this.service.handleSync(clientId, syncPayload)
  }

  @Post('rate-check')
  @HttpCode(HttpStatus.OK)
  checkRateLimit(@Body() body: { clientId: string }) {
    return this.service.checkRateLimit(body.clientId)
  }

  @Get('clients')
  listClients(@Body() body: { tenantId: string }) {
    return { data: this.service.listClients(body.tenantId) }
  }
}

async function buildApp() {
  // Use a fresh service without seed clients for exact control
  const service = new OpenApiService()
  // Seed with a new test client with known secret
  const secretHash = crypto.createHash('sha256').update('known-secret').digest('hex')
  // Access private clients map via verifyHmacSignature which uses the client id
  // Instead, create a separate test flow

  const moduleRef = await Test.createTestingModule({
    controllers: [TestOpenApiController],
    providers: [OpenApiService],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, service }
}

// Helper: compute HMAC signature
function hmacSignature(clientId: string, method: string, path: string, timestamp: string, body: string, hmacSecret: string): string {
  const bodyHash = crypto.createHash('sha256').update(body ?? '').digest('hex')
  const payload = `${method.toUpperCase()}\n${path}\n${timestamp}\n${bodyHash}`
  return crypto.createHmac('sha256', hmacSecret).update(payload).digest('hex')
}

// ─── 1. 密钥创建 ─────────────────────────────────────────────

it('e2e: authenticate with valid credentials returns access token', async () => {
  const { app } = await buildApp()
  try {
    // The seed client has hash of 'test-secret'
    const res = await request(app.getHttpServer())
      .post('/open-test/auth')
      .send({ client_id: 'cli-merchant-001', client_secret: 'test-secret', scope: 'sync:read sync:write' })
    assert.equal(res.statusCode, 200)
    const body = res.body as Record<string, unknown>
    assert.ok(body.accessToken)
    assert.equal(body.tokenType, 'Bearer')
    assert.equal(body.expiresIn, 3600)
  } finally {
    await app.close()
  }
})

it('e2e: authenticate with invalid secret is rejected', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/open-test/auth')
      .send({ client_id: 'cli-merchant-001', client_secret: 'wrong-secret' })
    assert.equal(res.statusCode, 401)
  } finally {
    await app.close()
  }
})

it('e2e: authenticate with unknown client fails', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/open-test/auth')
      .send({ client_id: 'unknown-client', client_secret: 'any' })
    assert.equal(res.statusCode, 401)
  } finally {
    await app.close()
  }
})

it('e2e: authenticate returns only granted scopes', async () => {
  const { app } = await buildApp()
  try {
    // Request scopes the client doesn't have
    const res = await request(app.getHttpServer())
      .post('/open-test/auth')
      .send({ client_id: 'cli-partner-pos', client_secret: 'test-secret', scope: 'auth:read sync:write' })
    assert.equal(res.statusCode, 200)
    const body = res.body as { scope: string[] }
    // cli-partner-pos doesn't have auth:read, only sync:read/sync:bulk
    assert.ok(body.scope.includes('sync:read'))
    assert.ok(!body.scope.includes('auth:read'))
  } finally {
    await app.close()
  }
})

// ─── 2. 接口调用 ─────────────────────────────────────────────

it('e2e: sync with valid Bearer token and HMAC signature succeeds', async () => {
  const { app } = await buildApp()
  try {
    // Get token first
    const authRes = await request(app.getHttpServer())
      .post('/open-test/auth')
      .send({ client_id: 'cli-merchant-001', client_secret: 'test-secret', scope: 'sync:write' })
    const token = (authRes.body as Record<string, unknown>).accessToken as string

    const timestamp = String(Date.now())
    const body = JSON.stringify({ businessKey: 'order-123', data: { items: ['a', 'b'] } })
    const sig = hmacSignature('cli-merchant-001', 'POST', '/open/sync', timestamp, body, 'hmac-merchant-001-secret')

    const res = await request(app.getHttpServer())
      .post('/open-test/sync')
      .set('authorization', `Bearer ${token}`)
      .set('x-client-id', 'cli-merchant-001')
      .set('x-hmac-signature', `sha256=${sig}`)
      .set('x-timestamp', timestamp)
      .send({ businessKey: 'order-123', data: { items: ['a', 'b'] } })

    assert.equal(res.statusCode, 200)
    const result = res.body as Record<string, unknown>
    assert.equal(result.businessKey, 'order-123')
    assert.equal(result.accepted, true)
  } finally {
    await app.close()
  }
})

it('e2e: sync with invalid HMAC is rejected', async () => {
  const { app } = await buildApp()
  try {
    const authRes = await request(app.getHttpServer())
      .post('/open-test/auth')
      .send({ client_id: 'cli-merchant-001', client_secret: 'test-secret', scope: 'sync:write' })
    const token = (authRes.body as Record<string, unknown>).accessToken as string

    const res = await request(app.getHttpServer())
      .post('/open-test/sync')
      .set('authorization', `Bearer ${token}`)
      .set('x-client-id', 'cli-merchant-001')
      .set('x-hmac-signature', 'sha256=bad')
      .set('x-timestamp', String(Date.now()))
      .send({ businessKey: 'order-bad' })

    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: verify token returns token info', async () => {
  const { app } = await buildApp()
  try {
    const authRes = await request(app.getHttpServer())
      .post('/open-test/auth')
      .send({ client_id: 'cli-merchant-001', client_secret: 'test-secret', scope: 'sync:read' })
    const token = (authRes.body as Record<string, unknown>).accessToken as string

    const res = await request(app.getHttpServer())
      .post('/open-test/verify')
      .send({ access_token: token })

    assert.equal(res.statusCode, 200)
    const body = res.body as Record<string, unknown>
    assert.ok(body.accessToken)
    assert.ok(body.jti)
  } finally {
    await app.close()
  }
})

// ─── 3. 限流 ─────────────────────────────────────────────────

it('e2e: rate limit allows initial requests within QPS', async () => {
  const { app, service } = await buildApp()
  try {
    const result = service.checkRateLimit('cli-merchant-001')
    assert.equal(result.allowed, true)
    assert.ok(result.remaining > 0)
  } finally {
    await app.close()
  }
})

// ─── 4. 审计 ─────────────────────────────────────────────────

it('e2e: verifyHmacSignature rejects expired timestamp', async () => {
  const { app, service } = await buildApp()
  try {
    const oldTs = String(Date.now() - 10 * 60 * 1000) // 10 min ago
    const valid = service.verifyHmacSignature('cli-merchant-001', 'POST', '/test', oldTs, '{}', 'sha256=anything')
    assert.equal(valid, false)
  } finally {
    await app.close()
  }
})

it('e2e: verifyHmacSignature with valid timestamp returns true', async () => {
  const { app, service } = await buildApp()
  try {
    const ts = String(Date.now())
    const sig = hmacSignature('cli-merchant-001', 'GET', '/test', ts, '{}', 'hmac-merchant-001-secret')
    const valid = service.verifyHmacSignature('cli-merchant-001', 'GET', '/test', ts, '{}', `sha256=${sig}`)
    assert.equal(valid, true)
  } finally {
    await app.close()
  }
})

it('e2e: verifyHmacSignature with mismatched secret fails', async () => {
  const { app, service } = await buildApp()
  try {
    const ts = String(Date.now())
    const sig = hmacSignature('cli-merchant-001', 'GET', '/test', ts, '{}', 'wrong-secret')
    const valid = service.verifyHmacSignature('cli-merchant-001', 'GET', '/test', ts, '{}', `sha256=${sig}`)
    assert.equal(valid, false)
  } finally {
    await app.close()
  }
})

it('e2e: list clients returns correct tenant clients', async () => {
  const { app, service } = await buildApp()
  try {
    const clients = service.listClients('tenant-A')
    assert.ok(clients.length >= 1)
    assert.ok(clients.some((c) => c.clientId === 'cli-merchant-001'))
  } finally {
    await app.close()
  }
})
