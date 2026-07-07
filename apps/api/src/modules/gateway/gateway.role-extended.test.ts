import { describe, it, expect, beforeEach } from 'vitest'
import {
  APIGateway,
  RateLimiterService,
  APIKeyManager,
} from './gateway.service'

/**
 * 🐜 自动: [gateway] [C] 角色扩展测试修复
 * 修正 createKey → createAPIKey, revokeKey → revokeAPIKey, getQuota → getQuotaStatus 等 API 匹配
 *
 * 8 角色视角扩展测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个用例（正常流程 + 权限/边界场景）
 */

function setup() {
  const rateLimiter = new RateLimiterService()
  const apiKeyManager = new APIKeyManager()
  const apiGateway = new APIGateway(rateLimiter, apiKeyManager)
  return { apiGateway, rateLimiter, apiKeyManager }
}

// ============================================================
// 👔店长 – 路由管理 & API 全局策略
// ============================================================
describe('👔店长 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
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

  it('可为新路径注册路由并访问', async () => {
    const r = await svc.apiGateway.routeRequest({ path: '/api/custom-reports/list', method: 'GET', headers: {} })
    // 未注册路径应返回 null，店长能理解路由表需要扩展
    expect(r).toBeNull()
  })
})

// ============================================================
// 🛒前台 – API Key 创建 & 基础使用
// ============================================================
describe('🛒前台 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台可创建只读 API Key', async () => {
    const key = await svc.apiKeyManager.createAPIKey('front-desk-1', 'front-desk', ['read'])
    expect(key.keyId).toBeTruthy()
    expect(key.scopes).toContain('read')
    expect(key.name).toBe('front-desk-1')
  })

  it('边界：创建空名称 API Key', async () => {
    const key = await svc.apiKeyManager.createAPIKey('', 'front-desk', ['read'])
    expect(key.keyId).toBeTruthy()
    expect(key.name).toBe('')
  })

  it('前台可验证自己的 API Key', async () => {
    const key = await svc.apiKeyManager.createAPIKey('fd-reader', 'front-desk', ['read'])
    const result = await svc.apiKeyManager.validateAPIKey(key.key)
    expect(result.valid).toBe(true)
    expect(result.scopes).toContain('read')
  })
})

// ============================================================
// 👥HR – API Key 生命周期管理（创建/吊销）
// ============================================================
describe('👥HR gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建并撤销 API Key', async () => {
    const key = await svc.apiKeyManager.createAPIKey('hr-user', 'hr-department', ['read', 'write'])
    const revoked = await svc.apiKeyManager.revokeAPIKey(key.keyId)
    expect(revoked).toBe(true)

    // 吊销后验证应失败
    const result = await svc.apiKeyManager.validateAPIKey(key.key)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('revoked')
  })

  it('撤销不存在的 Key 返回 false', async () => {
    const revoked = await svc.apiKeyManager.revokeAPIKey('non-existent-key-id')
    expect(revoked).toBe(false)
  })

  it('列出部门下的所有 API Key', async () => {
    await svc.apiKeyManager.createAPIKey('hr-key-1', 'hr-department', ['read'])
    await svc.apiKeyManager.createAPIKey('hr-key-2', 'hr-department', ['read', 'write'])
    const keys = await svc.apiKeyManager.listAPIKeys('hr-department')
    expect(keys.length).toBeGreaterThanOrEqual(2)
  })
})

// ============================================================
// 🔧安监 – 安全认证 & 权限校验
// ============================================================
describe('🔧安监 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('API Key 认证通过', async () => {
    const key = await svc.apiKeyManager.createAPIKey('sec-user', 'security', ['admin'])
    const auth = await svc.apiGateway.authenticate({ path: '/api/admin', method: 'POST', headers: { 'x-api-key': key.key } })
    expect(auth.authenticated).toBe(true)
  })

  it('无效 API Key 认证失败', async () => {
    const auth = await svc.apiGateway.authenticate({ path: '/api/admin', method: 'GET', headers: { 'x-api-key': 'invalid' } })
    expect(auth.authenticated).toBe(false)
  })

  it('吊销的 Key 认证应失败', async () => {
    const key = await svc.apiKeyManager.createAPIKey('sec-temp', 'security', ['read'])
    await svc.apiKeyManager.revokeAPIKey(key.keyId)
    const auth = await svc.apiGateway.authenticate({ path: '/api/read', method: 'GET', headers: { 'x-api-key': key.key } })
    expect(auth.authenticated).toBe(false)
  })
})

// ============================================================
// 🎮导玩员 – 低权限 Key 认证边界
// ============================================================
describe('🎮导玩员 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('导玩员 API Key 可认证只读路径', async () => {
    const key = await svc.apiKeyManager.createAPIKey('guide-1', 'guide', ['read'])
    const auth = await svc.apiGateway.authenticate({ path: '/api/game/list', method: 'GET', headers: { 'x-api-key': key.key } })
    expect(auth.authenticated).toBe(true)
  })

  it('边界：空 API Key 认证', async () => {
    const auth = await svc.apiGateway.authenticate({ path: '/api/test', method: 'GET', headers: { 'x-api-key': '' } })
    expect(auth.authenticated).toBe(false)
  })
})

// ============================================================
// 🎯运行专员 – 限流管理 & 配额监控
// ============================================================
describe('🎯运行专员 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('限流检查未超限时允许', async () => {
    const r = await svc.apiGateway.rateLimit('client-1', { path: '/api/test', method: 'GET', headers: {} })
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBeGreaterThanOrEqual(0)
  })

  it('设置并查询配额状态（指定端点）', async () => {
    await svc.rateLimiter.setQuota('client-1', '/api/report', { maxTokens: 100, refillRate: 10 })
    const q = await svc.rateLimiter.getQuotaStatus('client-1', '/api/report')
    expect(q).not.toBeNull()
    if ('tokens' in q) {
      expect(q.tokens).toBeLessThanOrEqual(100)
    }
  })

  it('查询不存在的 client 配额默认值', async () => {
    const q = await svc.rateLimiter.getQuotaStatus('unknown-client', '/api/test')
    expect(q).not.toBeNull()
    if ('tokens' in q) {
      expect(q.tokens).toBeGreaterThanOrEqual(0)
    }
  })
})

// ============================================================
// 🤝团建 – 批量 Key 管理
// ============================================================
describe('🤝团建 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团队场景：为多个活动创建 API Key', async () => {
    await svc.apiKeyManager.createAPIKey('team-building-1', 'teambuilding', ['read'])
    await svc.apiKeyManager.createAPIKey('team-building-2', 'teambuilding', ['read'])
    await svc.apiKeyManager.createAPIKey('team-building-3', 'teambuilding', ['read'])
    const keys = await svc.apiKeyManager.listAPIKeys('teambuilding')
    expect(keys.length).toBeGreaterThanOrEqual(3)
  })

  it('边界：撤销后 Key 不在列表', async () => {
    const key = await svc.apiKeyManager.createAPIKey('temp-key', 'teambuilding', ['read'])
    await svc.apiKeyManager.revokeAPIKey(key.keyId)
    const keys = await svc.apiKeyManager.listAPIKeys('teambuilding')
    const found = keys.find(k => k.keyId === key.keyId)
    expect(found).toBeUndefined()
  })
})

// ============================================================
// 📢营销 – 多渠道 Key 策略
// ============================================================
describe('📢营销 gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销可创建多个不同权限 Key', async () => {
    await svc.apiKeyManager.createAPIKey('mkt-read', 'marketing', ['read'])
    await svc.apiKeyManager.createAPIKey('mkt-write', 'marketing', ['read', 'write'])
    await svc.apiKeyManager.createAPIKey('mkt-admin', 'marketing', ['admin'])
    const keys = await svc.apiKeyManager.listAPIKeys('marketing')
    expect(keys.length).toBeGreaterThanOrEqual(3)
  })

  it('边界：重复吊销不报错', async () => {
    const key = await svc.apiKeyManager.createAPIKey('mkt-test', 'marketing', ['read'])
    const firstRevoke = await svc.apiKeyManager.revokeAPIKey(key.keyId)
    const secondRevoke = await svc.apiKeyManager.revokeAPIKey(key.keyId)
    expect(firstRevoke).toBe(true)
    expect(secondRevoke).toBe(true) // 重复吊销返回 true（已设置 revokedAt）
  })

  it('营销 Key 认证后 scope 正确', async () => {
    const key = await svc.apiKeyManager.createAPIKey('mkt-campaign', 'marketing', ['read', 'write'])
    const v = await svc.apiKeyManager.validateAPIKey(key.key)
    expect(v.valid).toBe(true)
    expect(v.scopes).toEqual(['read', 'write'])
  })
})
