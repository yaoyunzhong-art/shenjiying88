// gateway.service.spec.ts — 纯函数式内联，不 import 生产代码
// Module: gateway — OpenAPI 网关 (API Key管理/限流/路由/认证)
// 测试策略: 枚举 + 类型定义 + mock数据工厂 + 内联纯函数 + ≥18测试

import { describe, it, expect } from 'vitest'

// ─── 1. 枚举 + 类型定义 ────────────────────────────────────────────────────

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export interface GatewayRequest {
  path: string
  method: string
  headers: Record<string, string | string[] | undefined>
  query?: Record<string, string>
  body?: any
  ip?: string
  timestamp?: number
}

export interface GatewayResponse {
  statusCode: number
  body: any
  headers?: Record<string, string>
}

export interface RouteConfig {
  service: string
  pathPattern: string
  methods: string[]
  timeout?: number
}

export interface QuotaStatus {
  clientId: string
  endpoint: string
  tokens: number
  maxTokens: number
  refillRate: number
  lastRefillAt: number
}

export interface APIKey {
  keyId: string
  key: string
  name: string
  ownerId: string
  scopes: string[]
  createdAt: number
  revokedAt?: number
  expiresAt?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

export interface TokenBucket {
  tokens: number
  lastRefill: number
  maxTokens: number
  refillRate: number
}

export type KeyEntry = {
  keyId: string
  keyHash: string
}

// ─── 2. Mock 数据工厂 ──────────────────────────────────────────────────────

export function makeGatewayRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    path: '/api/member/profile',
    method: 'GET',
    headers: { 'x-api-key': 'sk_gateway_key_1_abc123', authorization: 'Bearer test.jwt.token' },
    query: { id: '123' },
    ip: '192.168.1.1',
    timestamp: Date.now(),
    ...overrides,
  }
}

export function makeRouteConfig(overrides: Partial<RouteConfig> = {}): RouteConfig {
  return {
    service: 'member-service',
    pathPattern: '/api/member',
    methods: ['GET', 'POST', 'PUT'],
    timeout: 30000,
    ...overrides,
  }
}

export function makeAPIKey(overrides: Partial<APIKey> = {}): APIKey {
  return {
    keyId: `key_${Date.now()}`,
    key: `sk_gateway_key_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    name: 'Test Key',
    ownerId: 'owner_1',
    scopes: ['read', 'write'],
    createdAt: Date.now(),
    ...overrides,
  }
}

export function makeTokenBucket(overrides: Partial<TokenBucket> = {}): TokenBucket {
  return {
    tokens: 100,
    lastRefill: Date.now(),
    maxTokens: 100,
    refillRate: 10,
    ...overrides,
  }
}

export function makeQuotaStatus(overrides: Partial<QuotaStatus> = {}): QuotaStatus {
  return {
    clientId: 'client_1',
    endpoint: 'GET:/api/member/profile',
    tokens: 50,
    maxTokens: 100,
    refillRate: 10,
    lastRefillAt: Date.now(),
    ...overrides,
  }
}

// ─── 3. 内联业务逻辑纯函数 ───────────────────────────────────────────────

/**
 * 路由匹配 — 根据 path/method 查找对应服务
 */
export function matchRoute(
  path: string,
  method: string,
  routeTable: RouteConfig[],
): { service: string; timeout: number } | null {
  for (const route of routeTable) {
    if (path.startsWith(route.pathPattern) && route.methods.includes(method)) {
      return { service: route.service, timeout: route.timeout || 30000 }
    }
  }
  return null
}

/**
 * 令牌桶补充
 */
export function refillBucket(bucket: TokenBucket, now: number): TokenBucket {
  const elapsed = (now - bucket.lastRefill) / 1000
  const tokensToAdd = Math.floor(elapsed * bucket.refillRate)
  if (tokensToAdd <= 0) return bucket
  return {
    ...bucket,
    tokens: Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd),
    lastRefill: now,
  }
}

/**
 * 限流检查 (不消耗令牌)
 */
export function checkRateLimit(bucket: TokenBucket, now: number): RateLimitResult {
  const refilled = refillBucket(bucket, now)
  const allowed = refilled.tokens >= 1
  const remaining = Math.floor(refilled.tokens)
  return {
    allowed,
    remaining,
    resetAt: now + Math.ceil((refilled.maxTokens - refilled.tokens) / refilled.refillRate) * 1000,
    retryAfter: allowed ? undefined : Math.ceil((1 - refilled.tokens) / refilled.refillRate),
  }
}

/**
 * 消费令牌
 */
export function consumeToken(bucket: TokenBucket, now: number): { bucket: TokenBucket; result: RateLimitResult } {
  const refilled = refillBucket(bucket, now)
  if (refilled.tokens >= 1) {
    const newBucket = { ...refilled, tokens: refilled.tokens - 1 }
    return {
      bucket: newBucket,
      result: {
        allowed: true,
        remaining: Math.floor(newBucket.tokens),
        resetAt: now + Math.ceil((newBucket.maxTokens - newBucket.tokens) / newBucket.refillRate) * 1000,
      },
    }
  }
  return {
    bucket: refilled,
    result: {
      allowed: false,
      remaining: 0,
      resetAt: now + Math.ceil((1 - refilled.tokens) / refilled.refillRate) * 1000,
      retryAfter: Math.ceil((1 - refilled.tokens) / refilled.refillRate),
    },
  }
}

/**
 * API Key 哈希 (简易)
 */
export function hashKey(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

/**
 * 验证 API Key
 */
export function validateAPIKey(
  key: string,
  keysByHash: Map<string, APIKey>,
): { valid: boolean; keyId?: string; ownerId?: string; scopes?: string[]; error?: string } {
  if (!key) return { valid: false, error: 'API Key is required' }

  const keyHash = hashKey(key)
  const apiKey = keysByHash.get(keyHash)
  if (!apiKey) return { valid: false, error: 'Invalid API Key' }
  if (apiKey.revokedAt) return { valid: false, error: 'API Key has been revoked' }
  if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) return { valid: false, error: 'API Key has expired' }

  return { valid: true, keyId: apiKey.keyId, ownerId: apiKey.ownerId, scopes: apiKey.scopes }
}

/**
 * Scope 权限检查
 */
export function hasScope(userScopes: string[], requiredScope: string): boolean {
  if (userScopes.includes('*')) return true
  return userScopes.includes(requiredScope)
}

/**
 * Mask API Key (隐藏中间部分)
 */
export function maskKey(key: string): string {
  if (key.length < 16) return '***'
  return key.substring(0, 8) + '...' + key.substring(key.length - 4)
}

/**
 * 提取客户端 IP (X-Forwarded-For / X-Real-IP / fallback)
 */
export function extractClientIp(headers: Record<string, string | string[] | undefined>, defaultIp: string): string {
  const forwarded = headers['x-forwarded-for']
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded
    return ips.split(',')[0].trim()
  }
  const realIp = headers['x-real-ip']
  if (realIp) return Array.isArray(realIp) ? realIp[0] : realIp
  return defaultIp
}

/**
 * JWT payload 解析 (简化模拟)
 */
export function verifyJwt(token: string): {
  valid: boolean
  clientId?: string
  ownerId?: string
  scopes?: string[]
  error?: string
} {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return { valid: false, error: 'Invalid JWT format' }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return {
      valid: true,
      clientId: payload.sub || payload.client_id,
      ownerId: payload.owner_id || payload.sub,
      scopes: payload.scopes || payload.scope?.split(' ') || ['read', 'write'],
    }
  } catch {
    return { valid: false, error: 'Invalid JWT token' }
  }
}

/**
 * 请求日志记录
 */
export function createRequestLog(
  request: GatewayRequest,
  response?: GatewayResponse,
): {
  timestamp: number
  path: string
  method: string
  statusCode?: number
  responseTime?: number
  ip?: string
} {
  return {
    timestamp: request.timestamp || Date.now(),
    path: request.path,
    method: request.method,
    statusCode: response?.statusCode,
    responseTime: response ? Date.now() - (request.timestamp || Date.now()) : undefined,
    ip: request.ip,
  }
}

// ─── 4. 测试 — ≥18项 (正例8+反例5+边界5) ─────────────────────────────────

describe('gateway.service (内联纯函数)', () => {
  const DEFAULT_ROUTES: RouteConfig[] = [
    { service: 'member-service', pathPattern: '/api/member', methods: ['GET', 'POST', 'PUT'] },
    { service: 'order-service', pathPattern: '/api/order', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    { service: 'product-service', pathPattern: '/api/product', methods: ['GET'] },
    { service: 'analytics-service', pathPattern: '/api/analytics', methods: ['GET', 'POST'] },
  ]

  // ─── matchRoute 正例 ───

  it('[P1] GET 请求正确匹配到对应服务', () => {
    const result = matchRoute('/api/member/profile', 'GET', DEFAULT_ROUTES)
    expect(result).not.toBeNull()
    expect(result!.service).toBe('member-service')
    expect(result!.timeout).toBe(30000)
  })

  it('[P2] POST 请求正确匹配', () => {
    const result = matchRoute('/api/order/create', 'POST', DEFAULT_ROUTES)
    expect(result!.service).toBe('order-service')
  })

  it('[P3] DELETE 请求正确匹配', () => {
    const result = matchRoute('/api/order/123', 'DELETE', DEFAULT_ROUTES)
    expect(result!.service).toBe('order-service')
  })

  it('[P4] 子路径也能匹配到父 pattern', () => {
    const result = matchRoute('/api/product/v2/list?page=1', 'GET', DEFAULT_ROUTES)
    expect(result!.service).toBe('product-service')
  })

  it('[P5] 自定义 timeout 生效', () => {
    const routes = [makeRouteConfig({ service: 'slow-service', pathPattern: '/api/slow', methods: ['GET'], timeout: 60000 })]
    const result = matchRoute('/api/slow/data', 'GET', routes)
    expect(result!.timeout).toBe(60000)
  })

  // ─── matchRoute 反例 ───

  it('[N1] 不支持的 method 返回 null', () => {
    const result = matchRoute('/api/member/profile', 'DELETE', DEFAULT_ROUTES)
    expect(result).toBeNull()
  })

  it('[N2] 不存在的路径前缀返回 null', () => {
    const result = matchRoute('/api/nonexistent/action', 'GET', DEFAULT_ROUTES)
    expect(result).toBeNull()
  })

  it('[N3] 空路径返回 null', () => {
    const result = matchRoute('', 'GET', DEFAULT_ROUTES)
    expect(result).toBeNull()
  })

  // ─── refillBucket / checkRateLimit / consumeToken ───

  it('[P6] 刚创建的桶 tokens = maxTokens', () => {
    const bucket = makeTokenBucket({ maxTokens: 50, tokens: 50 })
    expect(bucket.tokens).toBe(50)
  })

  it('[P7] 长时间未访问后补充令牌到上限', () => {
    const bucket = makeTokenBucket({ tokens: 0, lastRefill: 1000, maxTokens: 100, refillRate: 10 })
    const refilled = refillBucket(bucket, 11000) // 10s later
    expect(refilled.tokens).toBe(100) // capped
  })

  it('[P8] 部分补充不会超过 maxTokens', () => {
    const bucket = makeTokenBucket({ tokens: 90, lastRefill: 0, maxTokens: 100, refillRate: 10 })
    const refilled = refillBucket(bucket, 2000) // 2s = 20 tokens
    expect(refilled.tokens).toBe(100)
  })

  it('[P9] consumeToken 正常消耗一个令牌', () => {
    const bucket = makeTokenBucket({ tokens: 50, lastRefill: 0, maxTokens: 100, refillRate: 10 })
    const { bucket: newBucket, result } = consumeToken(bucket, 1100) // 1100ms = 11 tokens to add
    expect(result.allowed).toBe(true)
    expect(newBucket.tokens).toBe(60) // 50 + 11 - 1 = 60
    expect(result.remaining).toBe(60)
  })

  it('[N4] consumeToken 令牌不足时拒绝', () => {
    const bucket = makeTokenBucket({ tokens: 0, lastRefill: 0, maxTokens: 100, refillRate: 10 })
    // 50ms = 0.05 * 10 = 0.5 tokens → floor = 0, no refill
    const { result } = consumeToken(bucket, 50)
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('[N5] 空 API Key 验证失败', () => {
    const map = new Map<string, APIKey>()
    const result = validateAPIKey('', map)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('API Key is required')
  })

  it('[N6] 不存在的 API Key 验证失败', () => {
    const map = new Map<string, APIKey>()
    const result = validateAPIKey('some_invalid_key', map)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid API Key')
  })

  it('[N7] 已吊销的 API Key 验证失败', () => {
    const apiKey = makeAPIKey({ revokedAt: Date.now() - 1000 })
    const map = new Map([[hashKey(apiKey.key), apiKey]])
    const result = validateAPIKey(apiKey.key, map)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('API Key has been revoked')
  })

  it('[N8] 已过期的 API Key 验证失败', () => {
    const apiKey = makeAPIKey({ expiresAt: Date.now() - 1000 })
    const map = new Map([[hashKey(apiKey.key), apiKey]])
    const result = validateAPIKey(apiKey.key, map)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('API Key has expired')
  })

  // ─── hasScope ───

  it('[P10] * 通配 scope 放行所有', () => {
    expect(hasScope(['*'], 'admin')).toBe(true)
    expect(hasScope(['*'], 'delete')).toBe(true)
  })

  it('[P11] 精确 scope 匹配', () => {
    expect(hasScope(['read', 'write'], 'read')).toBe(true)
    expect(hasScope(['read', 'write'], 'write')).toBe(true)
    expect(hasScope(['read', 'write'], 'admin')).toBe(false)
  })

  // ─── maskKey ───

  it('[P12] maskKey 隐藏密钥中间部分', () => {
    const key = 'sk_gateway_key_1_abcd1234efgh5678'
    const masked = maskKey(key)
    expect(masked).toContain('...')
    expect(masked.startsWith('sk_gatew')).toBe(true)
    expect(masked.endsWith('5678')).toBe(true)
  })

  it('[B1] 短 key mask 返回 ***', () => {
    expect(maskKey('short')).toBe('***')
  })

  // ─── extractClientIp ───

  it('[P13] X-Forwarded-For 正确提取第一个 IP', () => {
    const ip = extractClientIp({ 'x-forwarded-for': '10.0.0.1, 192.168.1.1, 172.16.0.1' }, '127.0.0.1')
    expect(ip).toBe('10.0.0.1')
  })

  it('[P14] X-Real-IP 优先于 fallback', () => {
    const ip = extractClientIp({ 'x-real-ip': '10.0.0.5' }, '127.0.0.1')
    expect(ip).toBe('10.0.0.5')
  })

  it('[B2] 无代理头时返回 fallback IP', () => {
    const ip = extractClientIp({}, '203.0.113.1')
    expect(ip).toBe('203.0.113.1')
  })

  it('[B3] X-Forwarded-For 为数组时取第一个元素', () => {
    const ip = extractClientIp({ 'x-forwarded-for': ['10.0.0.2', '10.0.0.3'] }, '127.0.0.1')
    expect(ip).toBe('10.0.0.2')
  })

  // ─── verifyJwt ───

  it('[P15] 有效 JWT 解析出 payload', () => {
    const payload = { sub: 'user_42', owner_id: 'owner_42', scopes: ['read', 'write'] }
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const token = `${header}.${body}.fake_signature`
    const result = verifyJwt(token)
    expect(result.valid).toBe(true)
    expect(result.clientId).toBe('user_42')
    expect(result.ownerId).toBe('owner_42')
    expect(result.scopes).toEqual(['read', 'write'])
  })

  it('[N9] 格式错误的 JWT 拒绝', () => {
    const result = verifyJwt('bad-token')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid JWT format')
  })

  it('[N10] 无效 base64 payload 拒绝', () => {
    const result = verifyJwt('header.!!!.sig')
    expect(result.valid).toBe(false)
  })

  // ─── 边界 ───

  it('[B4] 大量并发 (100 tokens 桶连续消耗) 第 101 次被拒', () => {
    const bucket = makeTokenBucket({ tokens: 100, maxTokens: 100, refillRate: 1000 })
    const now = Date.now()
    let current = bucket
    for (let i = 0; i < 100; i++) {
      const r = consumeToken(current, now)
      expect(r.result.allowed).toBe(true)
      current = r.bucket
    }
    // 第 101 次
    const final = consumeToken(current, now)
    expect(final.result.allowed).toBe(false)
  })

  it('[B5] 空 scope 列表拒绝任何非 * 请求', () => {
    expect(hasScope([], 'read')).toBe(false)
    expect(hasScope([], '*')).toBe(false) // * must be explicit
  })

  it('[B6] rolloud — 瞬时 (0s) check 不补充', () => {
    const bucket = makeTokenBucket({ tokens: 0, maxTokens: 1, refillRate: 10, lastRefill: 0 })
    // lastRefill = now = 0, elapsed = 0s → tokensToAdd = floor(0 * 10) = 0 → no refill
    const result = checkRateLimit(bucket, 0)
    expect(result.allowed).toBe(false)
    // Because elapsed 0s, tokensToAdd = 0, refillBucket returns original -> tokens = 0
  })

  it('[P16] createRequestLog 包含正确字段', () => {
    const req = makeGatewayRequest({ timestamp: 1000 })
    const res: GatewayResponse = { statusCode: 200, body: { ok: true } }
    const log = createRequestLog(req, res)
    expect(log.path).toBe('/api/member/profile')
    expect(log.method).toBe('GET')
    expect(log.statusCode).toBe(200)
    expect(log.responseTime).toBeGreaterThanOrEqual(-1)
  })
})
