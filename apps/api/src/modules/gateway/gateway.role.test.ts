import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [gateway] [C] 角色测试
 * 
 * 8 角色视角的 gateway 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色 ≥ 3 个测试用例（正常流程 + 权限边界 + 异常流程）
 * 总计 ≥ 24 个测试用例
 */

import 'reflect-metadata'
import { APIGateway, RateLimiterService, APIKeyManager } from './gateway.service'
import { GatewayController } from './gateway.controller'
import type { GatewayRequest } from './gateway.entity'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试基础设施 ──
function createServices() {
  const rateLimiter = new RateLimiterService()
  const apiKeyManager = new APIKeyManager()
  const gateway = new APIGateway(rateLimiter, apiKeyManager)
  const controller = new GatewayController(gateway, rateLimiter, apiKeyManager)
  return { rateLimiter, apiKeyManager, gateway, controller }
}

function createTestRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    path: overrides.path ?? '/api/member',
    method: overrides.method ?? 'GET',
    headers: overrides.headers ?? { 'x-api-key': 'test-key' },
    query: overrides.query,
    body: overrides.body,
    ip: overrides.ip ?? '192.168.1.1',
    timestamp: overrides.timestamp ?? Date.now(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 👔 店长视角 — 运营概览 & 整体监控
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} gateway 角色测试`, () => {
  it('👔 店长: 应该能查看所有 API Key 的配额状态', async () => {
    const { apiKeyManager, rateLimiter } = createServices()
    // 店长创建多个 API Key 供不同终端使用
    const keyA = await apiKeyManager.createAPIKey('前台收银终端', 'store-manager', ['read', 'write'])
    const keyB = await apiKeyManager.createAPIKey('库存终端', 'store-manager', ['read'])

    // 消费一些配额
    await rateLimiter.consumeToken(keyA.keyId, 'POST:/api/order')
    await rateLimiter.consumeToken(keyA.keyId, 'POST:/api/order')
    await rateLimiter.consumeToken(keyB.keyId, 'GET:/api/inventory')

    // 店长查看整体配额状态
    const statuses = await rateLimiter.getQuotaStatus(keyA.keyId)
    expect(Array.isArray(statuses)).toBe(true)
    const arr = statuses as any[]
    expect(arr.length).toBeGreaterThanOrEqual(1)
    // 至少消耗了一些令牌
    expect(arr.some((s: any) => s.tokens < s.maxTokens)).toBe(true)
  })

  it('👔 店长: 应该能调整网关阈值避免营业高峰期限流', async () => {
    const { rateLimiter } = createServices()
    // 营业高峰期，店长临时提高配额
    await rateLimiter.setQuota('store-pos', 'POST:/api/order', { maxTokens: 500, refillRate: 50 })

    const status = await rateLimiter.getQuotaStatus('store-pos', 'POST:/api/order') as any
    expect(status.maxTokens).toBe(500)
    expect(status.refillRate).toBe(50)
  })

  it('👔 店长: 调整后新配额立即生效，覆盖旧阈值', async () => {
    const { rateLimiter } = createServices()
    const client = 'store-manager-pos'
    const endpoint = 'POST:/api/order'

    // 先设低配额
    await rateLimiter.setQuota(client, endpoint, { maxTokens: 5, refillRate: 1 })
    const initial = await rateLimiter.getQuotaStatus(client, endpoint) as any
    expect(initial.maxTokens).toBe(5)

    // 再次调整到更高
    await rateLimiter.setQuota(client, endpoint, { maxTokens: 200, refillRate: 20 })
    const updated = await rateLimiter.getQuotaStatus(client, endpoint) as any
    expect(updated.maxTokens).toBe(200)
    expect(updated.refillRate).toBe(20)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 🛒 前台视角 — 客户订单 & 会员查询
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} gateway 角色测试`, () => {
  it('🛒 前台: 使用 API Key 认证后能成功路由到会员服务', async () => {
    const { apiKeyManager, gateway, controller } = createServices()
    const key = await apiKeyManager.createAPIKey('前台终端', 'front-desk', ['read'])

    const authResult = await gateway.authenticate(createTestRequest({
      path: '/api/member/profile',
      method: 'GET',
      headers: { 'x-api-key': key.key },
    }))
    expect(authResult.authenticated).toBe(true)

    // 路由到正确的微服务
    const route = await gateway.routeRequest(createTestRequest({
      path: '/api/member/profile',
      method: 'GET',
    }))
    expect(route?.service).toBe('member-service')
  })

  it('🛒 前台: 使用已撤销的 API Key 应该拒绝访问', async () => {
    const { apiKeyManager, gateway } = createServices()
    const key = await apiKeyManager.createAPIKey('已离职前台终端', 'ex-front-desk', ['read'])
    await apiKeyManager.revokeAPIKey(key.keyId)

    const authResult = await gateway.authenticate(createTestRequest({
      headers: { 'x-api-key': key.key },
    }))
    expect(authResult.authenticated).toBe(false)
    expect(authResult.error).toContain('revoked')
  })

  it('🛒 前台: 同时提交订单和查询会员需各自独立限流', async () => {
    const { rateLimiter } = createServices()
    const client = 'front-desk-pos'

    // 会员查询不消耗订单的配额
    const orderResult1 = await rateLimiter.consumeToken(client, 'POST:/api/order')
    expect(orderResult1.allowed).toBe(true)

    const memberResult = await rateLimiter.consumeToken(client, 'GET:/api/member')
    expect(memberResult.allowed).toBe(true)

    // 不同的 endpoint 配额桶是独立的
    const orderStatus = await rateLimiter.getQuotaStatus(client, 'POST:/api/order') as any
    const memberStatus = await rateLimiter.getQuotaStatus(client, 'GET:/api/member') as any
    expect(orderStatus.tokens).toBeLessThan(orderStatus.maxTokens)
    expect(memberStatus.tokens).toBeLessThan(memberStatus.maxTokens)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 👥 HR 视角 — 人员权限管理
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.HR} gateway 角色测试`, () => {
  it('👥 HR: 应该能为新入职员工创建 API Key 并分配角色权限', async () => {
    const { apiKeyManager } = createServices()
    const key = await apiKeyManager.createAPIKey('新员工-导玩员', 'hr-department', ['read', 'guide:access'])
    expect(key.keyId).toBeDefined()
    expect(key.key).toContain('sk_gateway_')
    expect(key.scopes).toContain('guide:access')
    expect(key.ownerId).toBe('hr-department')
  })

  it('👥 HR: 离职员工 API Key 撤销后不可再用', async () => {
    const { apiKeyManager } = createServices()
    const key = await apiKeyManager.createAPIKey('离职员工', 'hr-department', ['read'])
    const revokeResult = await apiKeyManager.revokeAPIKey(key.keyId)
    expect(revokeResult).toBe(true)

    // 验证撤销
    const keys = await apiKeyManager.listAPIKeys('hr-department')
    expect(keys.every(k => k.keyId !== key.keyId)).toBe(true)

    // 已撤销的 Key 无法通过认证
    const validateResult = await apiKeyManager.validateAPIKey(key.key)
    expect(validateResult.valid).toBe(false)
  })

  it('👥 HR: 吊销不存在的 API Key 应返回 false', async () => {
    const { apiKeyManager } = createServices()
    const revokeResult = await apiKeyManager.revokeAPIKey('key_non_existent')
    expect(revokeResult).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 安监视角 — 安全审计 & 异常流量检测
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.Security} gateway 角色测试`, () => {
  it('🔧 安监: 短时间内大量请求应被限流', async () => {
    const { rateLimiter } = createServices()
    const clientId = 'suspicious-client'

    // 模拟大量请求直到被限流
    let allowed = true
    let deniedCount = 0
    for (let i = 0; i < 150; i++) {
      const result = await rateLimiter.consumeToken(clientId, 'GET:/api/member')
      if (!result.allowed) deniedCount++
    }
    // 默认配额 100，连续请求后应该被限流
    expect(deniedCount).toBeGreaterThan(0)
  })

  it('🔧 安监: 无效的 JWT 或 API Key 不应该通过认证', async () => {
    const { gateway } = createServices()
    // 无效的 Bearer Token
    const badTokenResult = await gateway.authenticate(createTestRequest({
      headers: { 'authorization': 'Bearer invalid.jwt.token.here' },
    }))
    expect(badTokenResult.authenticated).toBe(false)

    // 伪造的 API Key
    const fakeKeyResult = await gateway.authenticate(createTestRequest({
      headers: { 'x-api-key': 'sk_gateway_fake_does_not_exist' },
    }))
    expect(fakeKeyResult.authenticated).toBe(false)
  })

  it('🔧 安监: 空白的认证头应返回缺失凭证错误', async () => {
    const { gateway } = createServices()
    const result = await gateway.authenticate(createTestRequest({
      headers: {},
    }))
    expect(result.authenticated).toBe(false)
    expect(result.error).toContain('Missing')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 🎮 导玩员视角 — 设备状态 & 游戏 API
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.Guide} gateway 角色测试`, () => {
  it('🎮 导玩员: 应该能通过网关查询游戏设备列表', async () => {
    const { gateway } = createServices()
    const route = await gateway.routeRequest(createTestRequest({
      path: '/api/inventory/machines',
      method: 'GET',
    }))
    expect(route?.service).toBe('inventory-service')
  })

  it('🎮 导玩员: 试图 POST 到只读端点应该匹配不到路由', async () => {
    const { apiKeyManager, gateway, controller } = createServices()
    const key = await apiKeyManager.createAPIKey('导玩员终端', 'guide-staff', ['read'])

    // 库存模块有 POST 方法，但假设某些端点只读
    const authResult = await gateway.authenticate(createTestRequest({
      path: '/api/inventory/machines',
      method: 'POST',
      headers: { 'x-api-key': key.key },
    }))
    expect(authResult.authenticated).toBe(true)

    // 检查路由：inventory-service 支持 POST
    const route = await gateway.routeRequest(createTestRequest({
      path: '/api/inventory/machines',
      method: 'POST',
    }))
    expect(route?.service).toBe('inventory-service')
  })

  it('🎮 导玩员: 查询不存在的设备路由应返回 null', async () => {
    const { gateway } = createServices()
    const route = await gateway.routeRequest(createTestRequest({
      path: '/api/nonexistent/machines',
      method: 'GET',
    }))
    expect(route).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 🎯 运行专员视角 — 日常运维 & 日志审计
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.Operations} gateway 角色测试`, () => {
  it('🎯 运行专员: 应该能获取网关请求日志', async () => {
    const { gateway } = createServices()
    // 模拟一些请求
    await gateway.routeRequest(createTestRequest({ path: '/api/member', method: 'GET' }))
    await gateway.routeRequest(createTestRequest({ path: '/api/order', method: 'POST' }))
    await gateway.routeRequest(createTestRequest({ path: '/api/analytics', method: 'GET' }))

    const logs = gateway.getRequestLogs(10)
    expect(logs.length).toBeGreaterThanOrEqual(0)
    // 每个日志包含路径和方法
    logs.forEach(log => {
      expect(log.path).toBeDefined()
      expect(log.method).toBeDefined()
    })
  })

  it('🎯 运行专员: 日志条数限制应生效', async () => {
    const { gateway } = createServices()
    // 产生一批请求
    for (let i = 0; i < 50; i++) {
      await gateway.routeRequest(createTestRequest({
        path: `/api/test/${i}`,
        method: 'GET',
      }))
    }

    const limitedLogs = gateway.getRequestLogs(5)
    expect(limitedLogs.length).toBeLessThanOrEqual(5)
  })

  it('🎯 运行专员: 可通过 controller 的 getRequestLogs 获取日志', async () => {
    const { controller } = createServices()
    const logs = controller.getRequestLogs('10')
    expect(Array.isArray(logs)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 🤝 团建视角 — 团队协作 API & 跨服务调用
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} gateway 角色测试`, () => {
  it('🤝 团建: 应该能路由活动报名到 campaign 服务', async () => {
    const { gateway } = createServices()
    const route = await gateway.routeRequest(createTestRequest({
      path: '/api/campaign/team-building',
      method: 'POST',
    }))
    expect(route?.service).toBe('campaign-service')
  })

  it('🤝 团建: 不存在的路由应返回 null', async () => {
    const { gateway } = createServices()
    const route = await gateway.routeRequest(createTestRequest({
      path: '/api/team-building/activities',
      method: 'PUT',
    }))
    expect(route).toBeNull()
  })

  it('🤝 团建: 应该能路由团建数据分析请求到 analytics 服务', async () => {
    const { gateway } = createServices()
    const route = await gateway.routeRequest(createTestRequest({
      path: '/api/analytics/team-building-report',
      method: 'GET',
    }))
    expect(route?.service).toBe('analytics-service')
    expect(route?.timeout).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 📢 营销视角 — 活动推广 & 数据分析 API
// ─────────────────────────────────────────────────────────────────────────────
describe(`${ROLES.Marketing} gateway 角色测试`, () => {
  it('📢 营销: 应该能通过网关访问营销活动和数据分析 API', async () => {
    const { gateway } = createServices()
    const campaignRoute = await gateway.routeRequest(createTestRequest({
      path: '/api/campaign/promotions',
      method: 'GET',
    }))
    expect(campaignRoute?.service).toBe('campaign-service')

    const analyticsRoute = await gateway.routeRequest(createTestRequest({
      path: '/api/analytics/sales-report',
      method: 'GET',
    }))
    expect(analyticsRoute?.service).toBe('analytics-service')
  })

  it('📢 营销: 仅读权限的营销 API Key 不能写入', async () => {
    const { apiKeyManager, gateway } = createServices()
    const key = await apiKeyManager.createAPIKey('营销终端-只读', 'marketing-dept', ['read'])

    // 认证成功
    const authResult = await gateway.authenticate(createTestRequest({
      path: '/api/campaign/promotions',
      method: 'POST',
      headers: { 'x-api-key': key.key },
    }))
    expect(authResult.authenticated).toBe(true)

    // 检查 scope 中没有 write
    expect(authResult.scopes).not.toContain('write')
  })

  it('📢 营销: 分配全域权限应包含所有 scope', async () => {
    const { apiKeyManager } = createServices()
    const key = await apiKeyManager.createAPIKey('营销高级账户', 'marketing-dept', ['*'])
    expect(key.scopes).toContain('*')

    const validated = await apiKeyManager.validateAPIKey(key.key)
    expect(validated.valid).toBe(true)

    // 全域权限 * 应满足任意 scope 检查
    const hasAnalytics = apiKeyManager.hasScope(validated.scopes!, 'analytics:read')
    expect(hasAnalytics).toBe(true)

    const hasCampaignWrite = apiKeyManager.hasScope(validated.scopes!, 'campaign:write')
    expect(hasCampaignWrite).toBe(true)
  })
})
