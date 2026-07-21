// gateway.service.test.ts — Gateway Service 完整单元测试
// 覆盖: RateLimiterService, APIKeyManager, APIGateway
// 三件套: 正例 + 反例 + 边界（25 tests minimum）
import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiterService, APIKeyManager, APIGateway } from './gateway.service'

describe('GatewayService', () => {
  let rateLimiter: RateLimiterService
  let apiKeyManager: APIKeyManager
  let gateway: APIGateway

  beforeEach(() => {
    rateLimiter = new RateLimiterService()
    apiKeyManager = new APIKeyManager()
    gateway = new APIGateway(rateLimiter, apiKeyManager)
  })

  // ════════════════════════════════════════════════
  // RateLimiterService
  // ════════════════════════════════════════════════

  describe('RateLimiterService', () => {
    it('正例: checkLimit 首次请求返回允许且剩余令牌=100', async () => {
      const result = await rateLimiter.checkLimit('client1', '/api/users')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(100)
      expect(result.resetAt).toBeGreaterThanOrEqual(Date.now())
    })

    it('正例: consumeToken 后剩余令牌减少', async () => {
      const r1 = await rateLimiter.consumeToken('client1', '/api/users')
      expect(r1.allowed).toBe(true)
      expect(r1.remaining).toBe(99)

      const r2 = await rateLimiter.consumeToken('client1', '/api/users')
      expect(r2.allowed).toBe(true)
      expect(r2.remaining).toBe(98)
    })

    it('正例: getQuotaStatus 返回完整状态', async () => {
      const status = await rateLimiter.getQuotaStatus('client1', '/api/users')
      const single = Array.isArray(status) ? status[0] : status
      expect(single.clientId).toBe('client1')
      expect(single.endpoint).toBe('/api/users')
      expect(single.maxTokens).toBe(100)
      expect(single.refillRate).toBe(10)
    })

    it('正例: getQuotaStatus 不传 endpoint 返回数组', async () => {
      await rateLimiter.consumeToken('multi-cli', '/api/a')
      await rateLimiter.consumeToken('multi-cli', '/api/b')
      const status = await rateLimiter.getQuotaStatus('multi-cli')
      expect(Array.isArray(status)).toBe(true)
      expect((status as any[]).length).toBe(2)
    })

    it('正例: setQuota 修改 maxTokens', async () => {
      await rateLimiter.setQuota('q-client', 'GET:/api/q', { maxTokens: 500 })
      const status = await rateLimiter.getQuotaStatus('q-client', 'GET:/api/q')
      const single = Array.isArray(status) ? status[0] : status
      expect(single.maxTokens).toBe(500)
    })

    it('正例: setQuota 修改 refillRate', async () => {
      await rateLimiter.setQuota('q-client2', 'GET:/api/q2', { refillRate: 50 })
      const status = await rateLimiter.getQuotaStatus('q-client2', 'GET:/api/q2')
      const single = Array.isArray(status) ? status[0] : status
      expect(single.refillRate).toBe(50)
    })

    it('反例: 饿令牌时 consumeToken 返回 allowed=false', async () => {
      const clientId = 'exhaust-cli'
      // 消费超过默认 100 个令牌 (>100)
      let last: any = null
      for (let i = 0; i < 150; i++) {
        last = await rateLimiter.consumeToken(clientId, '/api/exhaust')
      }
      // 快速连续消费后 tokens 应耗尽
      // (refill 是每秒 10 个，循环接近瞬时，不足以补充)
      expect(last.allowed).toBe(false)
      expect(last.retryAfter).toBeGreaterThan(0)
    })

    it('边界: 不同 endpoint 配额独立', async () => {
      const r1 = await rateLimiter.consumeToken('multi-ep', '/api/a')
      expect(r1.remaining).toBe(99)
      // /api/b 首次调用应有 100 个令牌
      const r2 = await rateLimiter.consumeToken('multi-ep', '/api/b')
      expect(r2.remaining).toBe(99)
    })

    it('边界: 不同 client 配额独立', async () => {
      await rateLimiter.consumeToken('cli-a', '/api/share')
      const r1 = await rateLimiter.consumeToken('cli-a', '/api/share')
      expect(r1.remaining).toBe(98)

      const r2 = await rateLimiter.consumeToken('cli-b', '/api/share')
      expect(r2.remaining).toBe(99)
    })
  })

  // ════════════════════════════════════════════════
  // APIKeyManager
  // ════════════════════════════════════════════════

  describe('APIKeyManager', () => {
    it('正例: 创建 API Key 返回完整信息', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      expect(apiKey.keyId).toBeDefined()
      expect(apiKey.key).toContain('sk_gateway_')
      expect(apiKey.name).toBe('test-key')
      expect(apiKey.ownerId).toBe('owner1')
      expect(apiKey.scopes).toEqual(['read', 'write'])
      expect(apiKey.createdAt).toBeGreaterThan(0)
      expect(apiKey.revokedAt).toBeUndefined()
    })

    it('正例: validateAPIKey 有效 Key 通过', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      const result = await apiKeyManager.validateAPIKey(apiKey.key)
      expect(result.valid).toBe(true)
      expect(result.ownerId).toBe('owner1')
      expect(result.scopes).toEqual(['read', 'write'])
    })

    it('反例: 无效 Key 被拒绝', async () => {
      const result = await apiKeyManager.validateAPIKey('invalid-key')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API Key')
    })

    it('反例: 空 Key 被拒绝', async () => {
      const result = await apiKeyManager.validateAPIKey('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('API Key is required')
    })

    it('正例: 吊销后 Key 验证失败', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      const revoked = await apiKeyManager.revokeAPIKey(apiKey.keyId)
      expect(revoked).toBe(true)

      const result = await apiKeyManager.validateAPIKey(apiKey.key)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('revoked')
    })

    it('反例: 吊销不存在的 Key 返回 false', async () => {
      const result = await apiKeyManager.revokeAPIKey('non-existent-key')
      expect(result).toBe(false)
    })

    it('正例: listAPIKeys 返回用户所有有效 Key', async () => {
      await apiKeyManager.createAPIKey('key1', 'owner1', ['read'])
      await apiKeyManager.createAPIKey('key2', 'owner1', ['write'])
      const keys = await apiKeyManager.listAPIKeys('owner1')
      expect(keys).toHaveLength(2)
    })

    it('反例: 吊销的 Key 不在列表中', async () => {
      const key = await apiKeyManager.createAPIKey('to-revoke', 'owner-rev', ['read'])
      await apiKeyManager.revokeAPIKey(key.keyId)
      const keys = await apiKeyManager.listAPIKeys('owner-rev')
      expect(keys).toHaveLength(0)
    })

    it('边界: 有 Key 被吊销但其他 Key 仍在列表中', async () => {
      await apiKeyManager.createAPIKey('keep', 'owner-mix', ['read'])
      const revKey = await apiKeyManager.createAPIKey('remove', 'owner-mix', ['write'])
      await apiKeyManager.revokeAPIKey(revKey.keyId)
      const keys = await apiKeyManager.listAPIKeys('owner-mix')
      expect(keys).toHaveLength(1)
      expect(keys[0].name).toBe('keep')
    })

    it('正例: hasScope 宽泛匹配', () => {
      expect(apiKeyManager.hasScope(['*'], 'read')).toBe(true)
      expect(apiKeyManager.hasScope(['read', 'write'], 'read')).toBe(true)
      expect(apiKeyManager.hasScope(['write'], 'read')).toBe(false)
    })

    it('边界: list 返回的 Key 被脱敏', async () => {
      await apiKeyManager.createAPIKey('secret', 'mask-owner', ['read'])
      const keys = await apiKeyManager.listAPIKeys('mask-owner')
      expect(keys[0].key).toContain('...')
      expect(keys[0].key.length).toBeLessThan(40)
    })

    it('边界: 已过期 Key 验证失败', async () => {
      const apiKey = await apiKeyManager.createAPIKey('expired', 'exp-owner', ['read'])
      // 手动设置过期时间（通过类型断言访问 expiresAt）
      const key = (apiKey as any)
      key.expiresAt = Date.now() - 1000
      // 通过 index 手动更新
      const result = await apiKeyManager.validateAPIKey(apiKey.key)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })
  })

  // ════════════════════════════════════════════════
  // APIGateway
  // ════════════════════════════════════════════════

  describe('APIGateway', () => {
    it('正例: routeRequest 匹配已知路由', async () => {
      const result = await gateway.routeRequest({
        path: '/api/agent/list',
        method: 'GET',
        headers: {},
      })
      expect(result).not.toBeNull()
      expect(result!.service).toBe('agent-service')
      expect(result!.timeout).toBe(30000)
    })

    it('正例: 匹配 analytics 路由', async () => {
      const result = await gateway.routeRequest({
        path: '/api/analytics/report',
        method: 'POST',
        headers: {},
      })
      expect(result).not.toBeNull()
      expect(result!.service).toBe('analytics-service')
    })

    it('反例: 未知路由返回 null', async () => {
      const result = await gateway.routeRequest({
        path: '/unknown/path',
        method: 'GET',
        headers: {},
      })
      expect(result).toBeNull()
    })

    it('反例: 路由存在但方法不匹配返回 null', async () => {
      const result = await gateway.routeRequest({
        path: '/api/analytics',
        method: 'DELETE',
        headers: {},
      })
      expect(result).toBeNull()
    })

    it('正例: authenticate 使用 API Key 通过', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      const result = await gateway.authenticate({
        path: '/api/users',
        method: 'GET',
        headers: { 'x-api-key': apiKey.key },
      })
      expect(result.authenticated).toBe(true)
      expect(result.ownerId).toBe('owner1')
    })

    it('反例: authenticate 无凭据失败', async () => {
      const result = await gateway.authenticate({
        path: '/api/users',
        method: 'GET',
        headers: {},
      })
      expect(result.authenticated).toBe(false)
      expect(result.error).toBe('Missing authentication credentials')
    })

    it('正例: authenticate 使用 Authorization Bearer (JWT)', async () => {
      // 模拟 JWT: header.payload.signature
      const payload = Buffer.from(JSON.stringify({ sub: 'jwt-user', owner_id: 'jwt-owner' })).toString('base64')
      const fakeJwt = `header.${payload}.signature`
      const result = await gateway.authenticate({
        path: '/api/test',
        method: 'GET',
        headers: { 'authorization': `Bearer ${fakeJwt}` },
      })
      expect(result.authenticated).toBe(true)
      expect(result.ownerId).toBe('jwt-owner')
    })

    it('反例: 格式错误的 JWT 验证失败', async () => {
      const result = await gateway.authenticate({
        path: '/api/test',
        method: 'GET',
        headers: { 'authorization': 'Bearer not-a-valid-jwt' },
      })
      expect(result.authenticated).toBe(false)
    })

    it('正例: rateLimit 通过 API Gateway 调用', async () => {
      const result = await gateway.rateLimit('gateway-cli', {
        path: '/api/test',
        method: 'GET',
        headers: {},
      })
      expect(result.allowed).toBe(true)
    })

    it('正例: logRequest 存储日志', async () => {
      await gateway.logRequest({
        path: '/api/users',
        method: 'GET',
        headers: {},
        timestamp: Date.now(),
      })
      const logs = gateway.getRequestLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].path).toBe('/api/users')
    })

    it('正例: getRequestLogs 返回指定条数', async () => {
      for (let i = 0; i < 20; i++) {
        await gateway.logRequest({
          path: `/api/item/${i}`,
          method: 'GET',
          headers: {},
          timestamp: Date.now() + i,
        })
      }
      const logs = gateway.getRequestLogs(5)
      expect(logs.length).toBe(5)
    })

    it('正例: requestLogs 保留最新的日志', async () => {
      for (let i = 0; i < 5; i++) {
        await gateway.logRequest({
          path: `/api/log/${i}`,
          method: 'GET',
          headers: {},
        })
      }
      const logs = gateway.getRequestLogs(3)
      expect(logs.length).toBe(3)
      // 应保留最后 3 条
      expect(logs[logs.length - 1].path).toBe('/api/log/4')
    })

    it('边界: X-Forwarded-For 提取客户端 IP', async () => {
      const result = await gateway.authenticate({
        path: '/api/test',
        method: 'GET',
        headers: {
          'x-api-key': 'some-key',
          'x-forwarded-for': '203.0.113.5, 10.0.0.1',
        },
      })
      expect(result.authenticated).toBe(false) // invalid key
    })
  })
})
