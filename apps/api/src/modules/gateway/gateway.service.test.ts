import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
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

  describe('RateLimiterService', () => {
    it('should allow request when tokens are available', async () => {
      const result = await rateLimiter.checkLimit('client1', '/api/users')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
    })

    it('should consume token on consumeToken call', async () => {
      const result1 = await rateLimiter.consumeToken('client1', '/api/users')
      expect(result1.allowed).toBe(true)
      const result2 = await rateLimiter.consumeToken('client1', '/api/users')
      expect(result2.remaining).toBeLessThan(result1.remaining)
    })

    it('should get quota status for client', async () => {
      const status = await rateLimiter.getQuotaStatus('client1', '/api/users')
      const single = Array.isArray(status) ? status[0] : status
      expect((single as any).clientId).toBe('client1')
      expect((single as any).endpoint).toBe('/api/users')
    })
  })

  describe('APIKeyManager', () => {
    it('should create an API key', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      expect(apiKey.keyId).toBeDefined()
      expect(apiKey.key).toContain('sk_gateway_')
    })

    it('should validate a valid API key', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      const result = await apiKeyManager.validateAPIKey(apiKey.key)
      expect(result.valid).toBe(true)
      expect(result.ownerId).toBe('owner1')
    })

    it('should reject an invalid API key', async () => {
      const result = await apiKeyManager.validateAPIKey('invalid-key')
      expect(result.valid).toBe(false)
    })

    it('should revoke an API key', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      const revoked = await apiKeyManager.revokeAPIKey(apiKey.keyId)
      expect(revoked).toBe(true)
      const result = await apiKeyManager.validateAPIKey(apiKey.key)
      expect(result.valid).toBe(false)
    })

    it('should list API keys for owner', async () => {
      await apiKeyManager.createAPIKey('key1', 'owner1', ['read'])
      await apiKeyManager.createAPIKey('key2', 'owner1', ['write'])
      const keys = await apiKeyManager.listAPIKeys('owner1')
      expect(keys).toHaveLength(2)
    })
  })

  describe('APIGateway', () => {
    it('should route request to correct service', async () => {
      const result = await gateway.routeRequest({
        path: '/api/agent/list',
        method: 'GET',
        headers: {},
      })
      expect(result?.service).toBe('agent-service')
    })

    it('should return null for unmatched route', async () => {
      const result = await gateway.routeRequest({
        path: '/unknown/path',
        method: 'GET',
        headers: {},
      })
      expect(result).toBeNull()
    })

    it('should authenticate with API key', async () => {
      const apiKey = await apiKeyManager.createAPIKey('test-key', 'owner1', ['read', 'write'])
      const result = await gateway.authenticate({
        path: '/api/users',
        method: 'GET',
        headers: { 'x-api-key': apiKey.key },
      })
      expect(result.authenticated).toBe(true)
    })

    it('should reject request without authentication', async () => {
      const result = await gateway.authenticate({
        path: '/api/users',
        method: 'GET',
        headers: {},
      })
      expect(result.authenticated).toBe(false)
    })

    it('should log request', async () => {
      await gateway.logRequest({
        path: '/api/users',
        method: 'GET',
        headers: {},
        timestamp: Date.now(),
      })
      const logs = gateway.getRequestLogs()
      expect(logs.length).toBeGreaterThan(0)
    })
  })
})
