import { describe, it, expect, beforeEach } from 'vitest'
import {
  APIGateway,
  RateLimiterService,
  APIKeyManager,
} from './gateway.service'

/**
 * 🐜 [gateway] 角色扩展测试
 * 覆盖路由、认证、限流、API Key 管理边界场景
 */

function setup() {
  const rateLimiter = new RateLimiterService()
  const apiKeyManager = new APIKeyManager()
  const apiGateway = new APIGateway(rateLimiter, apiKeyManager)
  return { apiGateway, rateLimiter, apiKeyManager }
}

describe('👔店长 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('路由查找已注册路径', async () => {
    const r = await svc.apiGateway.routeRequest({ path: '/api/agent', method: 'GET', headers: {} })
    expect(r).not.toBeNull()
    expect(r!.service).toBe('agent-service')
  })

  it('路由查找未注册路径返回 null', async () => {
    const r = await svc.apiGateway.routeRequest({ path: '/api/unknown', method: 'GET', headers: {} })
    expect(r).toBeNull()
  })
})

describe('🛒前台 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建 API Key', () => {
    const key = svc.apiKeyManager.createKey('front-desk-1', ['read'])
    expect(key.keyId).toBeTruthy()
    expect(key.scopes).toContain('read')
  })
})

describe('👥HR gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建并撤销 API Key', () => {
    const key = svc.apiKeyManager.createKey('hr-user', ['read', 'write'])
    svc.apiKeyManager.revokeKey(key.keyId)
    const status = svc.apiKeyManager.getKeyStatus(key.keyId)
    expect(status).toBe('revoked')
  })
})

describe('🔧安监 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>}
  beforeEach(() => { svc = setup() })

  it('API Key 认证通过', async () => {
    const key = svc.apiKeyManager.createKey('sec-user', ['admin'])
    const auth = await svc.apiGateway.authenticate({ path: '/api/admin', method: 'POST', headers: { 'x-api-key': key.key } })
    expect(auth.authenticated).toBe(true)
  })

  it('无效 API Key 认证失败', async () => {
    const auth = await svc.apiGateway.authenticate({ path: '/api/admin', method: 'GET', headers: { 'x-api-key': 'invalid' } })
    expect(auth.authenticated).toBe(false)
  })
})

describe('🎯运行专员 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>}
  beforeEach(() => { svc = setup() })

  it('限流检查未超限时允许', async () => {
    const r = await svc.apiGateway.rateLimit('client-1', { path: '/api/test', method: 'GET', headers: {} })
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBeGreaterThanOrEqual(0)
  })

  it('设置并查询配额状态', () => {
    svc.rateLimiter.setQuota('client-1', { tokens: 100, maxTokens: 100, refillRate: 10 })
    const q = svc.rateLimiter.getQuota('client-1')
    expect(q).not.toBeNull()
    expect(q!.tokens).toBeLessThanOrEqual(100)
  })
})

describe('📢营销 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>}
  beforeEach(() => { svc = setup() })

  it('创建多个 API Key 并验证数量', () => {
    svc.apiKeyManager.createKey('mkt-1', ['read'])
    svc.apiKeyManager.createKey('mkt-2', ['read', 'write'])
    svc.apiKeyManager.createKey('mkt-3', ['admin'])
    const keys = svc.apiKeyManager.listKeys()
    expect(keys.length).toBeGreaterThanOrEqual(3)
  })

  it('撤销已撤销的 Key 不报错', () => {
    const key = svc.apiKeyManager.createKey('test', ['read'])
    svc.apiKeyManager.revokeKey(key.keyId)
    expect(() => svc.apiKeyManager.revokeKey(key.keyId)).not.toThrow()
  })

  it('查询不存在 Key 状态', () => {
    const status = svc.apiKeyManager.getKeyStatus('no-such')
    expect(status).toBe('not_found')
  })
})
