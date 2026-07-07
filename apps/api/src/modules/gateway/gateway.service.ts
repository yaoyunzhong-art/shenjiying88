// gateway.service.ts · OpenAPI 网关服务
// Phase-FP P0-9 T116-1 · 2026-07-03

import { Injectable, Logger } from '@nestjs/common'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Route Definitions ──────────────────────────────────────────────────────

const ROUTE_TABLE: RouteConfig[] = [
  { service: 'agent-service', pathPattern: '/api/agent', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { service: 'ai-cs-service', pathPattern: '/api/ai-cs', methods: ['GET', 'POST'] },
  { service: 'analytics-service', pathPattern: '/api/analytics', methods: ['GET', 'POST'] },
  { service: 'campaign-service', pathPattern: '/api/campaign', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { service: 'inventory-service', pathPattern: '/api/inventory', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { service: 'member-service', pathPattern: '/api/member', methods: ['GET', 'POST', 'PUT'] },
  { service: 'order-service', pathPattern: '/api/order', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { service: 'product-service', pathPattern: '/api/product', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
]

// ─── RateLimiterService ─────────────────────────────────────────────────────

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name)

  // 令牌桶状态: clientId:endpoint -> { tokens, lastRefill, maxTokens, refillRate }
  private readonly buckets = new Map<string, TokenBucket>()

  // 默认配额配置
  private readonly defaultQuota = {
    maxTokens: 100,
    refillRate: 10, // 每秒补充令牌数
  }

  /**
   * TokenBucket 令牌桶实现
   */
  private static async createBucket(maxTokens: number, refillRate: number): Promise<TokenBucket> {
    return {
      tokens: maxTokens,
      lastRefill: Date.now(),
      maxTokens,
      refillRate,
    }
  }

  /**
   * 检查限流配额
   */
  async checkLimit(clientId: string, endpoint: string): Promise<RateLimitResult> {
    const key = `${clientId}:${endpoint}`
    let bucket = await this.getOrCreateBucket(key)

    // 补充令牌
    const now = Date.now()
    const elapsed = (now - bucket.lastRefill) / 1000
    const tokensToAdd = Math.floor(elapsed * bucket.refillRate)

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd)
      bucket.lastRefill = now
    }

    const allowed = bucket.tokens >= 1
    const remaining = Math.floor(bucket.tokens)

    return {
      allowed,
      remaining,
      resetAt: now + Math.ceil((bucket.maxTokens - bucket.tokens) / bucket.refillRate) * 1000,
      retryAfter: allowed ? undefined : Math.ceil((1 - bucket.tokens) / bucket.refillRate),
    }
  }

  /**
   * 消费令牌
   */
  async consumeToken(clientId: string, endpoint: string): Promise<RateLimitResult> {
    const key = `${clientId}:${endpoint}`
    let bucket = await this.getOrCreateBucket(key)

    // 先补充令牌
    const now = Date.now()
    const elapsed = (now - bucket.lastRefill) / 1000
    const tokensToAdd = Math.floor(elapsed * bucket.refillRate)

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd)
      bucket.lastRefill = now
    }

    // 消费令牌
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: now + Math.ceil((bucket.maxTokens - bucket.tokens) / bucket.refillRate) * 1000,
      }
    }

    // 令牌不足
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + Math.ceil((1 - bucket.tokens) / bucket.refillRate) * 1000,
      retryAfter: Math.ceil((1 - bucket.tokens) / bucket.refillRate),
    }
  }

  /**
   * 获取配额状态
   */
  async getQuotaStatus(clientId: string, endpoint?: string): Promise<QuotaStatus | QuotaStatus[]> {
    if (endpoint) {
      const key = `${clientId}:${endpoint}`
      const bucket = this.buckets.get(key)
      if (!bucket) {
        return {
          clientId,
          endpoint,
          tokens: this.defaultQuota.maxTokens,
          maxTokens: this.defaultQuota.maxTokens,
          refillRate: this.defaultQuota.refillRate,
          lastRefillAt: Date.now(),
        }
      }
      return {
        clientId,
        endpoint,
        tokens: bucket.tokens,
        maxTokens: bucket.maxTokens,
        refillRate: bucket.refillRate,
        lastRefillAt: bucket.lastRefill,
      }
    }

    // 返回该 clientId 所有端点的配额
    const statuses: QuotaStatus[] = []
    for (const [key, bucket] of this.buckets) {
      if (key.startsWith(`${clientId}:`)) {
        const ep = key.substring(clientId.length + 1)
        statuses.push({
          clientId,
          endpoint: ep,
          tokens: bucket.tokens,
          maxTokens: bucket.maxTokens,
          refillRate: bucket.refillRate,
          lastRefillAt: bucket.lastRefill,
        })
      }
    }
    return statuses
  }

  /**
   * 设置配额
   */
  async setQuota(clientId: string, endpoint: string, quota: { maxTokens?: number; refillRate?: number }): Promise<void> {
    const key = `${clientId}:${endpoint}`
    let bucket = await this.getOrCreateBucket(key)

    if (quota.maxTokens !== undefined) {
      bucket.maxTokens = quota.maxTokens
      bucket.tokens = Math.min(bucket.tokens, bucket.maxTokens)
    }
    if (quota.refillRate !== undefined) {
      bucket.refillRate = quota.refillRate
    }

    this.logger.log(`Quota updated for ${key}: maxTokens=${bucket.maxTokens}, refillRate=${bucket.refillRate}`)
  }

  private async getOrCreateBucket(key: string): Promise<TokenBucket> {
    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = await RateLimiterService.createBucket(this.defaultQuota.maxTokens, this.defaultQuota.refillRate)
      this.buckets.set(key, bucket)
    }
    return bucket
  }
}

interface TokenBucket {
  tokens: number
  lastRefill: number
  maxTokens: number
  refillRate: number
}

// ─── APIKeyManager ───────────────────────────────────────────────────────────

@Injectable()
export class APIKeyManager {
  private readonly logger = new Logger(APIKeyManager.name)

  // 存储: keyId -> APIKey
  private readonly keys = new Map<string, APIKey>()
  // 索引: key hash -> keyId (用于快速验证)
  private readonly keyIndex = new Map<string, string>()

  // 默认 API Key 前缀
  private readonly KEY_PREFIX = 'sk_gateway_'

  /**
   * 创建 API Key
   */
  async createAPIKey(name: string, ownerId: string, scopes: string[]): Promise<APIKey> {
    const keyId = this.generateKeyId()
    const key = this.generateKey(keyId)

    const apiKey: APIKey = {
      keyId,
      key,
      name,
      ownerId,
      scopes,
      createdAt: Date.now(),
    }

    this.keys.set(keyId, apiKey)
    this.keyIndex.set(this.hashKey(key), keyId)

    this.logger.log(`API Key created: ${keyId} for owner ${ownerId}`)
    return apiKey
  }

  /**
   * 验证 API Key
   */
  async validateAPIKey(key: string): Promise<{ valid: boolean; keyId?: string; ownerId?: string; scopes?: string[]; error?: string }> {
    if (!key) {
      return { valid: false, error: 'API Key is required' }
    }

    const keyId = this.keyIndex.get(this.hashKey(key))
    if (!keyId) {
      return { valid: false, error: 'Invalid API Key' }
    }

    const apiKey = this.keys.get(keyId)
    if (!apiKey) {
      return { valid: false, error: 'API Key not found' }
    }

    // 检查是否已吊销
    if (apiKey.revokedAt) {
      return { valid: false, error: 'API Key has been revoked' }
    }

    // 检查是否过期
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return { valid: false, error: 'API Key has expired' }
    }

    return {
      valid: true,
      keyId: apiKey.keyId,
      ownerId: apiKey.ownerId,
      scopes: apiKey.scopes,
    }
  }

  /**
   * 吊销 API Key
   */
  async revokeAPIKey(keyId: string): Promise<boolean> {
    const apiKey = this.keys.get(keyId)
    if (!apiKey) {
      return false
    }

    apiKey.revokedAt = Date.now()
    this.logger.log(`API Key revoked: ${keyId}`)
    return true
  }

  /**
   * 列出用户的 API Keys
   */
  async listAPIKeys(ownerId: string): Promise<APIKey[]> {
    const result: APIKey[] = []
    for (const apiKey of this.keys.values()) {
      if (apiKey.ownerId === ownerId && !apiKey.revokedAt) {
        result.push({ ...apiKey, key: this.maskKey(apiKey.key) })
      }
    }
    return result
  }

  /**
   * 验证 Scope 权限
   */
  hasScope(userScopes: string[], requiredScope: string): boolean {
    if (userScopes.includes('*')) return true
    return userScopes.includes(requiredScope)
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private generateKey(keyId: string): string {
    const randomPart = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('')
    return `${this.KEY_PREFIX}${keyId}_${randomPart}`
  }

  private hashKey(key: string): string {
    // 简化 hash，实际生产应使用 crypto.createHash
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  private maskKey(key: string): string {
    if (key.length < 16) return '***'
    return key.substring(0, 8) + '...' + key.substring(key.length - 4)
  }
}

// ─── APIGateway ──────────────────────────────────────────────────────────────

@Injectable()
export class APIGateway {
  private readonly logger = new Logger(APIGateway.name)

  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly apiKeyManager: APIKeyManager,
  ) {}

  // 请求日志
  private readonly requestLogs: Array<{
    timestamp: number
    path: string
    method: string
    statusCode?: number
    responseTime?: number
    clientId?: string
    ip?: string
  }> = []

  /**
   * 统一路由：根据 path/method 转发到对应微服务
   */
  async routeRequest(request: GatewayRequest): Promise<{ service: string; timeout: number } | null> {
    const { path, method } = request

    for (const route of ROUTE_TABLE) {
      if (path.startsWith(route.pathPattern) && route.methods.includes(method)) {
        this.logger.debug(`Routing ${method} ${path} -> ${route.service}`)
        return {
          service: route.service,
          timeout: route.timeout || 30000,
        }
      }
    }

    // 未匹配路由
    this.logger.warn(`No route found for ${method} ${path}`)
    return null
  }

  /**
   * 限流检查
   */
  async rateLimit(clientId: string, request: GatewayRequest): Promise<RateLimitResult> {
    // 从请求中提取端点
    const endpoint = `${request.method}:${request.path}`
    return this.rateLimiter.consumeToken(clientId, endpoint)
  }

  /**
   * 认证：API Key / JWT
   */
  async authenticate(request: GatewayRequest): Promise<{
    authenticated: boolean
    clientId?: string
    ownerId?: string
    scopes?: string[]
    error?: string
  }> {
    // 注入 P0-9 API 网关 IP
    const clientIp = this.extractClientIp(request)
    request.ip = clientIp

    const authHeader = request.headers['authorization'] || request.headers['Authorization']
    const apiKeyHeader = request.headers['x-api-key'] || request.headers['X-API-Key']

    // 优先验证 API Key
    if (apiKeyHeader) {
      const key = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader
      const result = await this.apiKeyManager.validateAPIKey(key)

      if (result.valid) {
        return {
          authenticated: true,
          clientId: result.keyId,
          ownerId: result.ownerId,
          scopes: result.scopes,
        }
      }

      return {
        authenticated: false,
        error: result.error,
      }
    }

    // 其次验证 Bearer Token (JWT)
    if (authHeader) {
      const token = Array.isArray(authHeader) ? authHeader[0] : authHeader
      if (token.startsWith('Bearer ')) {
        const jwtResult = this.verifyJwt(token.substring(7))
        if (jwtResult.valid) {
          return {
            authenticated: true,
            clientId: jwtResult.clientId,
            ownerId: jwtResult.ownerId,
            scopes: jwtResult.scopes || ['read', 'write'],
          }
        }
        return {
          authenticated: false,
          error: jwtResult.error,
        }
      }
    }

    return {
      authenticated: false,
      error: 'Missing authentication credentials',
    }
  }

  /**
   * 记录请求日志
   */
  async logRequest(request: GatewayRequest, response?: GatewayResponse): Promise<void> {
    const log = {
      timestamp: request.timestamp || Date.now(),
      path: request.path,
      method: request.method,
      statusCode: response?.statusCode,
      responseTime: response ? Date.now() - (request.timestamp || Date.now()) : undefined,
      clientId: (request.headers['x-api-key'] || '') as string,
      ip: request.ip,
    }

    this.requestLogs.push(log)

    // 保留最近 10000 条日志
    if (this.requestLogs.length > 10000) {
      this.requestLogs.shift()
    }

    this.logger.log(
      `[${log.timestamp}] ${log.method} ${log.path} ${log.statusCode || ''} ${log.responseTime ? `${log.responseTime}ms` : ''} ip=${log.ip || 'unknown'}`
    )
  }

  /**
   * 获取请求日志
   */
  getRequestLogs(limit = 100): typeof this.requestLogs {
    return this.requestLogs.slice(-limit)
  }

  /**
   * 验证 JWT (简化版)
   */
  private verifyJwt(token: string): {
    valid: boolean
    clientId?: string
    ownerId?: string
    scopes?: string[]
    error?: string
  } {
    // 简化 JWT 验证，实际生产应使用 jsonwebtoken 库
    try {
      // 模拟 JWT 格式: base64(header).base64(payload).signature
      const parts = token.split('.')
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid JWT format' }
      }

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
   * 提取客户端 IP (P0-9 API 网关 IP 注入)
   */
  private extractClientIp(request: GatewayRequest): string {
    // 优先从 X-Forwarded-For 头获取
    const forwarded = request.headers['x-forwarded-for']
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded
      return ips.split(',')[0].trim()
    }

    // 其次从 X-Real-IP 头获取
    const realIp = request.headers['x-real-ip']
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp
    }

    // 最后从连接信息获取
    return request.ip || '127.0.0.1'
  }
}
