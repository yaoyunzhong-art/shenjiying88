// gateway.entity.test.ts — Gateway 实体类型测试（编译期 + 运行时构造验证）
import { describe, it, expect } from 'vitest'
import type {
  GatewayRequest,
  GatewayResponse,
  RouteConfig,
  QuotaStatus,
  APIKey,
  RateLimitResult,
  AuthResult,
  RouteResult,
  GatewayLogEntry,
} from './gateway.entity'

describe('Gateway Entity 类型一致性', () => {
  it('GatewayRequest 应包含核心字段', () => {
    const req: GatewayRequest = {
      path: '/api/users',
      method: 'GET',
      headers: { authorization: 'Bearer token123' },
      ip: '192.168.1.1',
      timestamp: Date.now(),
    }
    expect(req.path).toBe('/api/users')
    expect(req.method).toBe('GET')
    expect(req.headers.authorization).toBe('Bearer token123')
    expect(typeof req.timestamp).toBe('number')
  })

  it('GatewayRequest query 和 body 可选', () => {
    const req: GatewayRequest = {
      path: '/api/login',
      method: 'POST',
      headers: {},
      query: { redirect: '/dashboard' },
      body: { username: 'admin' },
    }
    expect(req.query!.redirect).toBe('/dashboard')
    expect(req.body.username).toBe('admin')
  })

  it('GatewayResponse 应包含状态码和返回体', () => {
    const res: GatewayResponse = {
      statusCode: 200,
      body: { success: true, data: [] },
      headers: { 'content-type': 'application/json' },
    }
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.headers!['content-type']).toBe('application/json')
  })

  it('RouteConfig 应定义服务路由映射', () => {
    const route: RouteConfig = {
      service: 'user-service',
      pathPattern: '/api/users/*',
      methods: ['GET', 'POST'],
      timeout: 5000,
    }
    expect(route.service).toBe('user-service')
    expect(route.methods).toContain('GET')
    expect(route.timeout).toBe(5000)
  })

  it('QuotaStatus 应统计令牌状态', () => {
    const quota: QuotaStatus = {
      clientId: 'client-1',
      endpoint: '/api/users:GET',
      tokens: 50,
      maxTokens: 100,
      refillRate: 10,
      lastRefillAt: Date.now(),
    }
    expect(quota.clientId).toBe('client-1')
    expect(quota.tokens).toBeLessThanOrEqual(quota.maxTokens)
    expect(quota.refillRate).toBeGreaterThan(0)
  })

  it('APIKey 应携带基本密钥信息', () => {
    const key: APIKey = {
      keyId: 'key-001',
      key: 'sk-abc123def456',
      name: '生产环境密钥',
      ownerId: 'user-1',
      scopes: ['read:orders'],
      createdAt: Date.now(),
    }
    expect(key.key.startsWith('sk-')).toBe(true)
    expect(key.scopes).toHaveLength(1)
    expect(key.revokedAt).toBeUndefined()
  })

  it('APIKey 可被吊销', () => {
    const key: APIKey = {
      keyId: 'key-002',
      key: 'sk-expired',
      name: '已吊销密钥',
      ownerId: 'user-2',
      scopes: [],
      createdAt: Date.now(),
      revokedAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    }
    expect(key.revokedAt).toBeDefined()
    expect(key.expiresAt).toBeDefined()
    expect(typeof key.revokedAt).toBe('number')
  })

  it('RateLimitResult 应携带限流决策', () => {
    const rl: RateLimitResult = {
      allowed: true,
      remaining: 9,
      resetAt: Date.now() + 60000,
    }
    expect(rl.allowed).toBe(true)
    expect(rl.remaining).toBe(9)
  })

  it('RateLimitResult 拒绝时应有 retryAfter', () => {
    const rl: RateLimitResult = {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
      retryAfter: 30,
    }
    expect(rl.allowed).toBe(false)
    expect(rl.retryAfter).toBe(30)
  })

  it('AuthResult 认证通过应含身份信息', () => {
    const auth: AuthResult = {
      authenticated: true,
      clientId: 'client-1',
      ownerId: 'user-1',
      scopes: ['read', 'write'],
    }
    expect(auth.authenticated).toBe(true)
    expect(auth.clientId).toBe('client-1')
  })

  it('AuthResult 认证失败应有错误提示', () => {
    const auth: AuthResult = {
      authenticated: false,
      error: 'Invalid API key',
    }
    expect(auth.authenticated).toBe(false)
    expect(auth.error).toBe('Invalid API key')
  })

  it('RouteResult 应含目标服务和超时', () => {
    const route: RouteResult = {
      service: 'order-service',
      timeout: 10000,
    }
    expect(route.service).toBe('order-service')
  })

  it('GatewayLogEntry 应记录请求轨迹', () => {
    const log: GatewayLogEntry = {
      timestamp: Date.now(),
      path: '/api/orders',
      method: 'POST',
      statusCode: 201,
      responseTime: 45,
      clientId: 'client-1',
      ip: '10.0.0.1',
    }
    expect(log.statusCode).toBe(201)
    expect(log.responseTime).toBeLessThan(100)
    expect(log.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
  })
})
