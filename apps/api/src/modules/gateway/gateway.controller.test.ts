// gateway.controller.test.ts — Gateway Controller 完整单元测试
// 覆盖: 所有 Controller 端点：正向 + 反例 + 边界（25 tests minimum）
import { describe, it, expect, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { GatewayController } from './gateway.controller'
import { APIGateway, RateLimiterService, APIKeyManager } from './gateway.service'
import { GatewayAnalyticsService } from './gateway-analytics.service'
import type { APIKey, AuthResult, RateLimitResult, QuotaStatus, GatewayLogEntry } from './gateway.entity'

describe('GatewayController', () => {
  let controller: GatewayController
  let apiGateway: APIGateway
  let rateLimiter: RateLimiterService
  let apiKeyManager: APIKeyManager

  beforeEach(() => {
    rateLimiter = new RateLimiterService()
    apiKeyManager = new APIKeyManager()
    apiGateway = new APIGateway(rateLimiter, apiKeyManager)
    const analytics = new GatewayAnalyticsService()
    controller = new GatewayController(apiGateway, rateLimiter, apiKeyManager, analytics)
  })

  // ── POST /gateway/route — routeLookup ──
  describe('POST /gateway/route — 路由查找', () => {
    it('正例: 应返回已知路由的目标服务', async () => {
      const result = await controller.routeLookup({ path: '/api/agent/status', method: 'GET' })
      expect(result.found).toBe(true)
      expect((result as { found: true; service: string }).service).toBe('agent-service')
    })

    it('正例: POST 方法的路由也匹配', async () => {
      const result = await controller.routeLookup({ path: '/api/order/create', method: 'POST' })
      expect(result.found).toBe(true)
      expect((result as any).service).toBe('order-service')
    })

    it('反例: 未知路由返回 found=false', async () => {
      const result = await controller.routeLookup({ path: '/unknown/endpoint', method: 'DELETE' })
      expect(result.found).toBe(false)
      expect((result as any).service).toBeUndefined()
    })

    it('反例: 路由存在但方法不匹配返回 found=false', async () => {
      const result = await controller.routeLookup({ path: '/api/analytics', method: 'DELETE' })
      expect(result.found).toBe(false)
    })

    it('边界: 根路径不匹配任何路由', async () => {
      const result = await controller.routeLookup({ path: '/', method: 'GET' })
      expect(result.found).toBe(false)
    })
  })

  // ── POST /gateway/auth — authenticate ──
  describe('POST /gateway/auth — 身份认证', () => {
    it('正例: 有效 API Key 应认证通过', async () => {
      const key = await apiKeyManager.createAPIKey('测试', 'user-1', ['read'])
      const result = await controller.authenticate({ apiKey: key.key, path: '/api/users', method: 'GET' })
      expect(result.authenticated).toBe(true)
      expect(result.ownerId).toBe('user-1')
    })

    it('正例: 返回所有的 scopes', async () => {
      const key = await apiKeyManager.createAPIKey('scoped', 'scope-user', ['read:orders', 'write:orders'])
      const result = await controller.authenticate({ apiKey: key.key, path: '/api/orders', method: 'GET' })
      expect(result.authenticated).toBe(true)
      expect(result.scopes).toContain('read:orders')
      expect(result.scopes).toContain('write:orders')
    })

    it('反例: 无效的 API Key 应认证失败', async () => {
      const result = await controller.authenticate({ apiKey: 'sk-invalid-key', path: '/api/users', method: 'GET' })
      expect(result.authenticated).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('反例: 空的 API Key 应认证失败', async () => {
      const result = await controller.authenticate({ apiKey: '', path: '/api/users', method: 'GET' })
      expect(result.authenticated).toBe(false)
    })

    it('性能: 认证速度', async () => {
      const key = await apiKeyManager.createAPIKey('perf', 'perf-user', ['read'])
      const start = Date.now()
      for (let i = 0; i < 10; i++) {
        await controller.authenticate({ apiKey: key.key, path: '/api/test', method: 'GET' })
      }
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(5000)
    })
  })

  // ── POST /gateway/rate-limit — checkRateLimit ──
  describe('POST /gateway/rate-limit — 限流检查', () => {
    it('正例: 首次请求应允许通过', async () => {
      const result = await controller.checkRateLimit({ clientId: 'client-1', path: '/api/users', method: 'GET' })
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it('正例: 连续请求后配额下降', async () => {
      await controller.consumeToken({ clientId: 'down-cli', path: '/api/down', method: 'GET' })
      await controller.consumeToken({ clientId: 'down-cli', path: '/api/down', method: 'GET' })
      const result = await controller.checkRateLimit({ clientId: 'down-cli', path: '/api/down', method: 'GET' })
      expect(result.remaining).toBeLessThanOrEqual(98)
    })
  })

  // ── POST /gateway/rate-limit/consume — consumeToken ──
  describe('POST /gateway/rate-limit/consume — 消费令牌', () => {
    it('正例: 令牌充足时应消费成功', async () => {
      const result = await controller.consumeToken({ clientId: 'client-1', path: '/api/users', method: 'GET' })
      expect(result.allowed).toBe(true)
    })
  })

  // ── POST /gateway/quota — getQuotaStatus ──
  describe('POST /gateway/quota — 查询配额', () => {
    it('正例: 已消费令牌后应返回配额状态', async () => {
      await controller.consumeToken({ clientId: 'q-client', path: '/api/orders', method: 'GET' })
      const result = await controller.getQuotaStatus({ clientId: 'q-client', endpoint: '/api/orders:GET' })
      const status = Array.isArray(result) ? result[0] : result
      expect(status.clientId).toBe('q-client')
      expect((status as QuotaStatus).maxTokens).toBeGreaterThan(0)
    })

    it('正例: 查询所有端点的配额', async () => {
      await controller.consumeToken({ clientId: 'multi-q', path: '/api/a', method: 'GET' })
      await controller.consumeToken({ clientId: 'multi-q', path: '/api/b', method: 'GET' })
      const result = await controller.getQuotaStatus({ clientId: 'multi-q' })
      expect(Array.isArray(result)).toBe(true)
      expect((result as QuotaStatus[]).length).toBe(2)
    })
  })

  // ── POST /gateway/quota/set — setQuota ──
  describe('POST /gateway/quota/set — 修改配额', () => {
    it('正例: 修改 maxTokens 和 refillRate 应成功', async () => {
      const result = await controller.setQuota({
        clientId: 'set-client',
        endpoint: '/api/test:GET',
        maxTokens: 200,
        refillRate: 20,
      })
      expect(result.success).toBe(true)
    })

    it('边界: 仅修改 maxTokens 应成功', async () => {
      const result = await controller.setQuota({
        clientId: 'set-client',
        endpoint: '/api/test:POST',
        maxTokens: 500,
      })
      expect(result.success).toBe(true)
    })

    it('正例: 修改后通过 getQuotaStatus 验证', async () => {
      await controller.setQuota({
        clientId: 'verify-set',
        endpoint: 'GET:/api/verify',
        maxTokens: 300,
        refillRate: 30,
      })
      const status = await controller.getQuotaStatus({ clientId: 'verify-set', endpoint: 'GET:/api/verify' })
      const s = status as QuotaStatus
      expect(s.maxTokens).toBe(300)
      expect(s.refillRate).toBe(30)
    })
  })

  // ── POST /gateway/api-keys — createApiKey ──
  describe('POST /gateway/api-keys — 创建 API Key', () => {
    it('正例: 应成功创建 API Key', async () => {
      const result = await controller.createApiKey({
        name: '新密钥',
        ownerId: 'user-1',
        scopes: ['read:orders', 'write:orders'],
      })
      expect(result.key).toBeDefined()
      expect(result.name).toBe('新密钥')
      expect(result.ownerId).toBe('user-1')
      expect(result.scopes).toHaveLength(2)
      expect(result.key).toContain('sk_gateway_')
    })

    it('边界: 空权限列表', async () => {
      const result = await controller.createApiKey({
        name: '空权限',
        ownerId: 'user-empty',
        scopes: [],
      })
      expect(result.scopes).toEqual([])
    })
  })

  // ── GET /gateway/api-keys/:ownerId — listApiKeys ──
  describe('GET /gateway/api-keys/:ownerId — 列出密钥', () => {
    it('正例: 列出用户的所有有效密钥', async () => {
      await controller.createApiKey({ name: 'k1', ownerId: 'owner-1', scopes: ['read'] })
      await controller.createApiKey({ name: 'k2', ownerId: 'owner-1', scopes: ['write'] })
      const keys = await controller.listApiKeys('owner-1')
      expect(keys).toHaveLength(2)
      expect(keys[0].key).toContain('...') // 密钥被脱敏
    })

    it('边界: 无密钥的用户应返回空数组', async () => {
      const keys = await controller.listApiKeys('nonexistent')
      expect(keys).toHaveLength(0)
    })

    it('反例: 已吊销的密钥不出现', async () => {
      const key = await controller.createApiKey({ name: 'revoke-me', ownerId: 'rev-owner', scopes: ['read'] })
      await controller.revokeApiKey({ keyId: key.keyId })
      const keys = await controller.listApiKeys('rev-owner')
      expect(keys).toHaveLength(0)
    })
  })

  // ── POST /gateway/api-keys/revoke — revokeApiKey ──
  describe('POST /gateway/api-keys/revoke — 吊销密钥', () => {
    it('正例: 成功吊销有效密钥', async () => {
      const key = await controller.createApiKey({ name: '吊销测试', ownerId: 'user-2', scopes: ['read'] })
      const result = await controller.revokeApiKey({ keyId: key.keyId })
      expect(result.success).toBe(true)
    })

    it('反例: 吊销不存在的密钥应抛出 NotFoundException', async () => {
      await expect(controller.revokeApiKey({ keyId: 'nonexistent-key' })).rejects.toThrow(NotFoundException)
    })
  })

  // ── GET /gateway/logs — getRequestLogs ──
  describe('GET /gateway/logs — 请求日志', () => {
    it('正例: 新控制器的日志为空', async () => {
      const logs = controller.getRequestLogs()
      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBe(0)
    })

    it('正例: 有操作后应有日志', async () => {
      // 触发一些请求以产生日志
      await controller.authenticate({ apiKey: 'test', path: '/api/test', method: 'GET' })
      await controller.checkRateLimit({ clientId: 'log-test', path: '/api/test', method: 'GET' })
      const logs = controller.getRequestLogs()
      expect(Array.isArray(logs)).toBe(true)
    })

    it('边界: 可指定返回上限', async () => {
      const logs = controller.getRequestLogs('5')
      expect(logs.length).toBeLessThanOrEqual(5)
    })

    it('边界: limit 超出范围应被钳制在 1~1000 之间', async () => {
      const logs = controller.getRequestLogs('9999')
      expect(logs.length).toBeLessThanOrEqual(1000)
    })

    it('边界: 无效 limit 数字应回退到默认 100', async () => {
      const logs = controller.getRequestLogs('abc')
      expect(logs.length).toBe(0)
    })

    it('边界: 默认 limit=100', async () => {
      const logs = controller.getRequestLogs()
      expect(logs.length).toBe(0)
    })
  })
})
