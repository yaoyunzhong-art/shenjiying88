import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// gateway.test.ts · OpenAPI 网关单元测试
// Phase-FP P0-9 T116-1 · 2026-07-03

import assert from 'node:assert/strict'
import {
  APIGateway,
  RateLimiterService,
  APIKeyManager,
  GatewayRequest,
  GatewayResponse,
} from './gateway.service'

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    path: '/api/agent',
    method: 'GET',
    headers: {},
    timestamp: Date.now(),
    ...overrides,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── APIGateway · Routing Tests ──────────────────────────────────────────────

describe('APIGateway · routeRequest() · 统一路由', () => {
  let gateway: APIGateway
  let rateLimiter: RateLimiterService
  let apiKeyManager: APIKeyManager

  beforeEach(() => {
    rateLimiter = new RateLimiterService()
    apiKeyManager = new APIKeyManager()
    gateway = new APIGateway(rateLimiter, apiKeyManager)
  })

  it('TC-1 GET /api/agent → agent-service', async () => {
    const req = makeRequest({ path: '/api/agent', method: 'GET' })
    const result = await gateway.routeRequest(req)
    assert.equal(result?.service, 'agent-service')
  })

  it('TC-2 POST /api/agent → agent-service', async () => {
    const req = makeRequest({ path: '/api/agent', method: 'POST' })
    const result = await gateway.routeRequest(req)
    assert.equal(result?.service, 'agent-service')
  })

  it('TC-3 GET /api/ai-cs → ai-cs-service', async () => {
    const req = makeRequest({ path: '/api/ai-cs', method: 'GET' })
    const result = await gateway.routeRequest(req)
    assert.equal(result?.service, 'ai-cs-service')
  })

  it('TC-4 GET /api/analytics → analytics-service', async () => {
    const req = makeRequest({ path: '/api/analytics', method: 'GET' })
    const result = await gateway.routeRequest(req)
    assert.equal(result?.service, 'analytics-service')
  })

  it('TC-5 GET /api/campaign → campaign-service', async () => {
    const req = makeRequest({ path: '/api/campaign', method: 'GET' })
    const result = await gateway.routeRequest(req)
    assert.equal(result?.service, 'campaign-service')
  })

  it('TC-6 DELETE /api/inventory → inventory-service', async () => {
    const req = makeRequest({ path: '/api/inventory', method: 'DELETE' })
    const result = await gateway.routeRequest(req)
    assert.equal(result?.service, 'inventory-service')
  })

  it('TC-7 未匹配路由 → null', async () => {
    const req = makeRequest({ path: '/api/unknown', method: 'GET' })
    const result = await gateway.routeRequest(req)
    assert.equal(result, null)
  })

  it('TC-8 方法不匹配 → null', async () => {
    const req = makeRequest({ path: '/api/agent', method: 'PATCH' })
    const result = await gateway.routeRequest(req)
    assert.equal(result, null)
  })
})

// ─── RateLimiterService · 限流 Tests ────────────────────────────────────────

describe('RateLimiterService · rateLimit · 限流', () => {
  let rateLimiter: RateLimiterService

  beforeEach(() => {
    rateLimiter = new RateLimiterService()
  })

  it('TC-9 首次请求应允许通过', async () => {
    const result = await rateLimiter.consumeToken('client1', '/api/test')
    assert.equal(result.allowed, true)
    assert.ok(result.remaining >= 0)
  })

  it('TC-10 超过配额后拒绝请求', async () => {
    // 设置小配额以便测试
    await rateLimiter.setQuota('client_limited', '/api/test', { maxTokens: 2, refillRate: 0 })

    // 消费完令牌
    const r1 = await rateLimiter.consumeToken('client_limited', '/api/test')
    assert.equal(r1.allowed, true)

    const r2 = await rateLimiter.consumeToken('client_limited', '/api/test')
    assert.equal(r2.allowed, true)

    // 第三个请求应被拒绝
    const r3 = await rateLimiter.consumeToken('client_limited', '/api/test')
    assert.equal(r3.allowed, false)
    assert.ok(r3.retryAfter !== undefined)
    assert.ok(r3.retryAfter > 0)
  })

  it('TC-11 令牌补充速度正确', async () => {
    // 设置每秒补充 5 个令牌
    await rateLimiter.setQuota('client_refill', '/api/test', { maxTokens: 10, refillRate: 5 })

    // 消费完所有令牌
    for (let i = 0; i < 10; i++) {
      await rateLimiter.consumeToken('client_refill', '/api/test')
    }

    const result = await rateLimiter.checkLimit('client_refill', '/api/test')
    assert.equal(result.allowed, false)

    // 等待 1 秒，补充 5 个令牌
    await delay(1100)

    const result2 = await rateLimiter.checkLimit('client_refill', '/api/test')
    assert.equal(result2.allowed, true)
    assert.ok(result2.remaining >= 4)
  })

  it('TC-12 checkLimit 不消费令牌', async () => {
    await rateLimiter.setQuota('client_check', '/api/test', { maxTokens: 5, refillRate: 0 })

    const r1 = await rateLimiter.checkLimit('client_check', '/api/test')
    assert.equal(r1.allowed, true)

    // 再次检查，令牌数应不变
    const r2 = await rateLimiter.checkLimit('client_check', '/api/test')
    assert.equal(r2.remaining, r1.remaining)
  })

  it('TC-13 getQuotaStatus 返回正确状态', async () => {
    await rateLimiter.setQuota('client_quota', '/api/test', { maxTokens: 50, refillRate: 10 })

    const status = await rateLimiter.getQuotaStatus('client_quota', '/api/test') as any
    assert.equal(status.clientId, 'client_quota')
    assert.equal(status.endpoint, '/api/test')
    assert.equal(status.maxTokens, 50)
    assert.equal(status.refillRate, 10)
  })

  it('TC-14 setQuota 更新配额', async () => {
    await rateLimiter.setQuota('client_update', '/api/test', { maxTokens: 100, refillRate: 20 })
    await rateLimiter.consumeToken('client_update', '/api/test')

    await rateLimiter.setQuota('client_update', '/api/test', { maxTokens: 10, refillRate: 5 })

    const status = await rateLimiter.getQuotaStatus('client_update', '/api/test') as any
    assert.equal(status.maxTokens, 10)
    assert.equal(status.refillRate, 5)
  })
})

// ─── APIKeyManager · API Key Tests ──────────────────────────────────────────

describe('APIKeyManager · API Key 管理', () => {
  let apiKeyManager: APIKeyManager

  beforeEach(() => {
    apiKeyManager = new APIKeyManager()
  })

  it('TC-15 创建 API Key 成功', async () => {
    const key = await apiKeyManager.createAPIKey('Test Key', 'owner1', ['read', 'write'])
    assert.ok(key.keyId.startsWith('key_'))
    assert.ok(key.key.startsWith('sk_gateway_'))
    assert.equal(key.name, 'Test Key')
    assert.equal(key.ownerId, 'owner1')
    assert.deepEqual(key.scopes, ['read', 'write'])
  })

  it('TC-16 有效 API Key 验证通过', async () => {
    const created = await apiKeyManager.createAPIKey('Valid Key', 'owner1', ['read'])
    const result = await apiKeyManager.validateAPIKey(created.key)
    assert.equal(result.valid, true)
    assert.equal(result.keyId, created.keyId)
    assert.equal(result.ownerId, 'owner1')
  })

  it('TC-17 无效 API Key 验证失败', async () => {
    const result = await apiKeyManager.validateAPIKey('sk_gateway_invalid_key_12345')
    assert.equal(result.valid, false)
    assert.ok(result.error !== undefined)
  })

  it('TC-18 空 API Key 验证失败', async () => {
    const result = await apiKeyManager.validateAPIKey('')
    assert.equal(result.valid, false)
    assert.equal(result.error, 'API Key is required')
  })

  it('TC-19 吊销后 API Key 立即无效', async () => {
    const created = await apiKeyManager.createAPIKey('Revoke Key', 'owner1', ['read'])

    // 吊销前有效
    const before = await apiKeyManager.validateAPIKey(created.key)
    assert.equal(before.valid, true)

    // 吊销
    const revoked = await apiKeyManager.revokeAPIKey(created.keyId)
    assert.equal(revoked, true)

    // 吊销后无效
    const after = await apiKeyManager.validateAPIKey(created.key)
    assert.equal(after.valid, false)
    assert.equal(after.error, 'API Key has been revoked')
  })

  it('TC-20 吊销不存在的 Key 返回 false', async () => {
    const result = await apiKeyManager.revokeAPIKey('non_existent_key_id')
    assert.equal(result, false)
  })

  it('TC-21 listAPIKeys 返回用户的所有 Key', async () => {
    await apiKeyManager.createAPIKey('Key 1', 'owner1', ['read'])
    await apiKeyManager.createAPIKey('Key 2', 'owner1', ['write'])
    await apiKeyManager.createAPIKey('Key 3', 'owner2', ['read'])

    const keys = await apiKeyManager.listAPIKeys('owner1')
    assert.equal(keys.length, 2)
  })

  it('TC-22 listAPIKeys 隐藏完整 Key 值', async () => {
    const created = await apiKeyManager.createAPIKey('Mask Key', 'owner1', ['read'])
    const keys = await apiKeyManager.listAPIKeys('owner1')
    assert.ok(keys[0].key.includes('...'))
    assert.ok(!keys[0].key.includes(created.key.substring(8, created.key.length - 4)))
  })

  it('TC-23 hasScope 正确检查权限', async () => {
    assert.equal(apiKeyManager.hasScope(['read', 'write'], 'read'), true)
    assert.equal(apiKeyManager.hasScope(['read', 'write'], 'delete'), false)
    assert.equal(apiKeyManager.hasScope(['*'], 'anything'), true)
  })
})

// ─── APIGateway · Integration Tests ────────────────────────────────────────

describe('APIGateway · 集成测试', () => {
  let gateway: APIGateway
  let rateLimiter: RateLimiterService
  let apiKeyManager: APIKeyManager

  beforeEach(() => {
    rateLimiter = new RateLimiterService()
    apiKeyManager = new APIKeyManager()
    gateway = new APIGateway(rateLimiter, apiKeyManager)
  })

  it('TC-24 authenticate API Key 认证成功', async () => {
    const created = await apiKeyManager.createAPIKey('Gateway Key', 'owner1', ['read', 'write'])

    const req = makeRequest({
      headers: { 'x-api-key': created.key },
    })

    const result = await gateway.authenticate(req)
    assert.equal(result.authenticated, true)
    assert.equal(result.ownerId, 'owner1')
  })

  it('TC-25 authenticate 无凭证失败', async () => {
    const req = makeRequest({ headers: {} })

    const result = await gateway.authenticate(req)
    assert.equal(result.authenticated, false)
    assert.ok(result.error !== undefined)
  })

  it('TC-26 logRequest 记录请求', async () => {
    const req = makeRequest({ path: '/api/test', method: 'POST', timestamp: Date.now() })

    await gateway.logRequest(req)

    const logs = gateway.getRequestLogs()
    assert.ok(logs.length > 0)
    assert.equal(logs[logs.length - 1].path, '/api/test')
    assert.equal(logs[logs.length - 1].method, 'POST')
  })
})
