/**
 * Phase-44 T174: 开放 API 模块实体定义
 *
 * DR-44:
 *  A: API Key 格式 = sk_live_xxx / sk_test_xxx
 *  B: 签名 = HMAC-SHA256 + timestamp + nonce
 *  C: Webhook 重试 = 指数退避 5 次
 *  D: 沙箱 = t-sandbox- 前缀 + 脱敏
 *  E: 限流 = 滑动窗口 (QPS + 日配额)
 *  F: 多租户隔离
 */

export type TenantId = string

// ─── API Key ──────────────────────────────────────────────

export type APIKeyEnvironment = 'LIVE' | 'TEST' | 'SANDBOX'
export type APIKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export interface APIKeyScope {
  resource: string   // 'orders' | 'members' | 'products' | '*'
  actions: string[]  // ['read', 'write'] | ['*']
}

export interface APIKey {
  id: string
  tenantId: TenantId
  keyId: string           // 公钥部分 (sk_live_abc123)
  keyHash: string         // 私钥 SHA-256 哈希 (不入库明文)
  environment: APIKeyEnvironment
  name: string            // 用户备注名
  scopes: APIKeyScope[]
  status: APIKeyStatus
  createdAt: string
  createdBy: string
  expiresAt?: string
  lastUsedAt?: string
  revokedAt?: string
  revokedReason?: string
}

// ─── Webhook ──────────────────────────────────────────────

export type WebhookEventType =
  | 'order.created' | 'order.paid' | 'order.refunded'
  | 'member.created' | 'member.upgraded'
  | 'inventory.low'
  | 'payment.completed' | 'payment.failed'
  | 'coupon.issued' | 'coupon.redeemed'

export interface WebhookSubscription {
  id: string
  tenantId: TenantId
  url: string              // 接收 URL
  events: WebhookEventType[]
  secret: string           // 签名密钥 (HMAC)
  description?: string
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED'
  createdAt: string
  createdBy: string
}

export interface WebhookDelivery {
  id: string
  tenantId: TenantId
  subscriptionId: string
  eventType: WebhookEventType
  payload: Record<string, any>
  attempts: number         // 重试次数 (0-5)
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER'
  lastAttemptAt?: string
  nextRetryAt?: string
  responseStatus?: number
  responseBody?: string
  errorMessage?: string
  signature: string        // HMAC-SHA256 签名
  createdAt: string
  deliveredAt?: string
}

// ─── Sandbox ──────────────────────────────────────────────

export type SandboxStatus = 'CREATED' | 'ACTIVE' | 'EXPIRED' | 'PURGED'

export interface SandboxEnvironment {
  id: string
  tenantId: TenantId       // t-sandbox-{id}
  parentTenantId: TenantId // 关联的生产租户
  name: string
  status: SandboxStatus
  ttlDays: number          // 默认 30 天
  dataMaskingEnabled: boolean
  createdAt: string
  expiresAt: string
  purgedAt?: string
}

// ─── Rate Limit ───────────────────────────────────────────

export interface RateLimitBucket {
  id: string
  tenantId: TenantId
  keyId?: string           // 关联 API Key
  endpoint: string         // '/api/orders' | '*'
  qps: number              // 每秒 QPS 上限
  dailyQuota: number       // 每日总配额
  windowMs: number         // 滑动窗口大小 (默认 60000)
  active: boolean
  createdAt: string
}

export interface RateLimitRecord {
  id: string
  tenantId: TenantId
  keyId?: string
  endpoint: string
  timestamp: number        // 毫秒
  weight: number           // 每次请求权重 (默认 1)
}

// ─── Quota Usage ──────────────────────────────────────────

export interface QuotaUsage {
  id: string
  tenantId: TenantId
  keyId: string
  periodKey: string        // '2025-06-28' (按天)
  usedCount: number
  remainingCount: number
  overageCount: number     // 超额次数
  lastRequestAt?: string
}

// ─── API Request/Response ─────────────────────────────────

export interface SignedRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  body?: string            // 原始 body
  timestamp: number        // 毫秒时间戳
  nonce: string            // 唯一 ID
  signature: string        // HMAC-SHA256
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number      // 秒
  reason?: 'qps_exceeded' | 'daily_quota_exceeded' | 'bucket_disabled'
}

export interface OpenAPISpec {
  openapi: '3.1.0'
  info: {
    title: string
    version: string
    description?: string
  }
  servers: Array<{ url: string; description: string }>
  paths: Record<string, any>
  components: {
    securitySchemes: Record<string, any>
    schemas: Record<string, any>
  }
}