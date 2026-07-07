/**
 * 🐜 自动: [openapi] 跨模块合约类型
 *
 * 定义 OpenAPI 模块对外暴露的稳定合约接口，
 * 供其他模块（analytics, observability, tenant 等）消费。
 */
import type {
  APIKeyEnvironment,
  APIKeyStatus,
  WebhookEventType,
  WebhookDelivery,
  SandboxStatus,
  RateLimitResult,
} from './openapi.entity'

/**
 * API Key 合约（跨模块消费安全子集）
 */
export interface APIKeyContract {
  id: string
  tenantId: string
  keyId: string
  environment: APIKeyEnvironment
  name: string
  scopes: string[]
  status: APIKeyStatus
  createdAt: string
  createdBy: string
  expiresAt?: string
  lastUsedAt?: string
}

/**
 * Webhook 订阅合约
 */
export interface WebhookSubscriptionContract {
  id: string
  tenantId: string
  url: string
  events: WebhookEventType[]
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED'
  createdAt: string
  createdBy: string
}

/**
 * Webhook 投递合约
 */
export interface WebhookDeliveryContract {
  id: string
  tenantId: string
  subscriptionId: string
  eventType: WebhookEventType
  attempts: number
  status: WebhookDelivery['status']
  lastAttemptAt?: string
  responseStatus?: number
  errorMessage?: string
  createdAt: string
}

/**
 * 沙箱合约
 */
export interface SandboxContract {
  id: string
  tenantId: string
  parentTenantId: string
  name: string
  status: SandboxStatus
  ttlDays: number
  createdAt: string
  expiresAt: string
}

/**
 * 配额使用合约
 */
export interface QuotaUsageContract {
  tenantId: string
  periodKey: string
  usedCount: number
  remainingCount: number
  overageCount: number
}

/**
 * 限流结果合约
 */
export interface RateLimitResultContract extends RateLimitResult {}

/**
 * 签名验证合约
 */
export interface SignValidationContract {
  valid: boolean
  error?: string
}

/**
 * 事件分发合约——外部模块可调用
 */
export interface EventDispatchRequest {
  source: string
  tenantId: string
  eventType: WebhookEventType
  payload: Record<string, unknown>
}

export interface EventDispatchResponse {
  accepted: boolean
  deliveryId: string
}

/**
 * 开放 API 服务合约接口——其他模块可注入消费
 */
export interface OpenAPIServiceContract {
  createKey(input: {
    tenantId: string
    environment: APIKeyEnvironment
    name: string
    scopes: string[]
    expiresAt?: string
    createdBy?: string
  }): Promise<APIKeyContract>

  getKey(tenantId: string, keyId: string): Promise<APIKeyContract | null>

  listKeys(tenantId: string, environment?: APIKeyEnvironment): Promise<APIKeyContract[]>

  revokeKey(tenantId: string, keyId: string, reason: string): Promise<void>

  createWebhookSubscription(input: {
    tenantId: string
    url: string
    events: WebhookEventType[]
    description?: string
    createdBy?: string
  }): Promise<WebhookSubscriptionContract>

  listWebhookSubscriptions(tenantId: string): Promise<WebhookSubscriptionContract[]>

  dispatchWebhookEvent(req: EventDispatchRequest): Promise<EventDispatchResponse>

  createSandbox(input: {
    parentTenantId: string
    name: string
    ttlDays?: number
    dataMaskingEnabled?: boolean
  }): Promise<SandboxContract>

  checkQuota(tenantId: string): Promise<QuotaUsageContract>

  verifySignature(secret: string, request: Record<string, unknown>): Promise<SignValidationContract>
}
