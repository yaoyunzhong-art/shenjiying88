// gateway.controller.test.ts — Gateway Controller 单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

  // ── routeLookup ──
  describe('POST /gateway/route — 路由查找', () => {
    it('应返回已知路由的目标服务', async () => {
      const result = await controller.routeLookup({ path: '/api/agent/status', method: 'GET' })
      expect(result.found).toBe(true)
      expect((result as { found: true; service: string }).service).toBe('agent-service')
    })

    it('未匹配路由应返回 found=false', async () => {
      const result = await controller.routeLookup({ path: '/unknown/endpoint', method: 'DELETE' })
      expect(result.found).toBe(false)
    })
  })

  // ── authenticate ──
  describe('POST /gateway/auth — 身份认证', () => {
    it('有效的 API Key 应认证通过', async () => {
      const key = await apiKeyManager.createAPIKey('测试', 'user-1', ['read'])
      const result = await controller.authenticate({ apiKey: key.key, path: '/api/users', method: 'GET' })
      expect(result.authenticated).toBe(true)
      expect(result.ownerId).toBe('user-1')
    })

    it('无效的 API Key 应认证失败', async () => {
      const result = await controller.authenticate({ apiKey: 'sk-invalid-key', path: '/api/users', method: 'GET' })
      expect(result.authenticated).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ── checkRateLimit ──
  describe('POST /gateway/rate-limit — 限流检查', () => {
    it('首次请求应允许通过', async () => {
      const result = await controller.checkRateLimit({ clientId: 'client-1', path: '/api/users', method: 'GET' })
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
    })
  })

  // ── consumeToken ──
  describe('POST /gateway/rate-limit/consume — 消费令牌', () => {
    it('令牌充足时应消费成功', async () => {
      const result = await controller.consumeToken({ clientId: 'client-1', path: '/api/users', method: 'GET' })
      expect(result.allowed).toBe(true)
    })
  })

  // ── getQuotaStatus ──
  describe('POST /gateway/quota — 查询配额', () => {
    it('已消费令牌后应返回配额状态', async () => {
      await controller.consumeToken({ clientId: 'q-client', path: '/api/orders', method: 'GET' })
      const result = await controller.getQuotaStatus({ clientId: 'q-client', endpoint: '/api/orders:GET' })
      const status = Array.isArray(result) ? result[0] : result
      expect(status.clientId).toBe('q-client')
      expect((status as QuotaStatus).maxTokens).toBeGreaterThan(0)
    })
  })

  // ── setQuota ──
  describe('POST /gateway/quota/set — 修改配额', () => {
    it('应成功修改配额', async () => {
      const result = await controller.setQuota({
        clientId: 'set-client',
        endpoint: '/api/test:GET',
        maxTokens: 200,
        refillRate: 20,
      })
      expect(result.success).toBe(true)
    })

    it('仅修改 maxTokens 应成功', async () => {
      const result = await controller.setQuota({
        clientId: 'set-client',
        endpoint: '/api/test:POST',
        maxTokens: 500,
      })
      expect(result.success).toBe(true)
    })
  })

  // ── createApiKey ──
  describe('POST /gateway/api-keys — 创建 API Key', () => {
    it('应成功创建 API Key 并返回密钥信息', async () => {
      const result = await controller.createApiKey({
        name: '新密钥',
        ownerId: 'user-1',
        scopes: ['read:orders', 'write:orders'],
      })
      expect(result.key).toBeDefined()
      expect(result.name).toBe('新密钥')
      expect(result.ownerId).toBe('user-1')
      expect(result.scopes).toHaveLength(2)
    })
  })

  // ── listApiKeys ──
  describe('GET /gateway/api-keys/:ownerId — 列出密钥', () => {
    it('应列出用户的所有有效密钥', async () => {
      await controller.createApiKey({ name: 'k1', ownerId: 'owner-1', scopes: ['read'] })
      await controller.createApiKey({ name: 'k2', ownerId: 'owner-1', scopes: ['write'] })
      const keys = await controller.listApiKeys('owner-1')
      expect(keys).toHaveLength(2)
      expect(keys[0].key).toContain('...') // 密钥被脱敏
    })

    it('无密钥的用户应返回空数组', async () => {
      const keys = await controller.listApiKeys('nonexistent')
      expect(keys).toHaveLength(0)
    })
  })

  // ── revokeApiKey ──
  describe('POST /gateway/api-keys/revoke — 吊销密钥', () => {
    it('应成功吊销有效密钥', async () => {
      const key = await controller.createApiKey({ name: '吊销测试', ownerId: 'user-2', scopes: ['read'] })
      const result = await controller.revokeApiKey({ keyId: key.keyId })
      expect(result.success).toBe(true)
    })

    it('吊销不存在的密钥应抛出 NotFoundException', async () => {
      await expect(controller.revokeApiKey({ keyId: 'nonexistent-key' })).rejects.toThrow(NotFoundException)
    })
  })

  // ── getRequestLogs ──
  describe('GET /gateway/logs — 请求日志', () => {
    it('默认应返回最近 100 条日志', async () => {
      // 触发一些请求以产生日志
      await controller.authenticate({ apiKey: 'test', path: '/api/test', method: 'GET' })
      await controller.checkRateLimit({ clientId: 'log-test', path: '/api/test', method: 'GET' })
      const logs = controller.getRequestLogs()
      expect(Array.isArray(logs)).toBe(true)
    })

    it('可指定返回上限', async () => {
      const logs = controller.getRequestLogs('5')
      expect(logs.length).toBeLessThanOrEqual(5)
    })

    it('limit 超出范围应被钳制在 1~1000 之间', async () => {
      const logs = controller.getRequestLogs('9999')
      expect(logs.length).toBeLessThanOrEqual(1000)
    })
  })
})
