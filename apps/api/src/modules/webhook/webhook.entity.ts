/**
 * Phase 95 第三方集成 Webhook Entity (V10 Sprint 2 Day 19)
 *
 * 3 个核心实体:
 * - WebhookEndpoint: 用户配置的 webhook (目标 URL + 平台类型 + 事件订阅)
 * - WebhookDelivery: 单次投递记录 (含重试 + 失败状态)
 * - WebhookStatus: 端点状态机 (active/paused/disabled)
 *
 * 9 个内置事件源 (复用 Phase 88/92/93/94):
 * - license.expired
 * - canary.created/promoted/rolled_back/completed
 * - monitoring.alert.fired/resolved
 * - insight.generated
 * - tenant.config.updated
 */

// ============ 跨模块合约补全 ============

/** Webhook 配置合约实体 (跨模块安全子集) */
export interface WebhookConfig {
  id: string
  url: string
  events: WebhookEventType[]
  isActive: boolean
  secret?: string
}

/** Webhook 事件合约实体 (跨模块安全子集) */
export interface WebhookEvent {
  id: string
  type: WebhookEventType
  timestamp: string
  payload: Record<string, unknown>
}

// ============ 原始定义 ============

export type WebhookPlatform = 'feishu' | 'dingtalk' | 'wecom' | 'generic'

export type WebhookStatus = 'active' | 'paused' | 'disabled'

export type WebhookEventType =
  | 'license.expired'
  | 'canary.created'
  | 'canary.promoted'
  | 'canary.rolled_back'
  | 'canary.completed'
  | 'monitoring.alert.fired'
  | 'monitoring.alert.resolved'
  | 'insight.generated'
  | 'tenant.config.updated'

export const BUILTIN_WEBHOOK_EVENTS: { type: WebhookEventType; description: string; category: string }[] = [
  { type: 'license.expired', description: 'License 过期', category: 'license' },
  { type: 'canary.created', description: '灰度实验创建', category: 'canary' },
  { type: 'canary.promoted', description: '灰度晋级', category: 'canary' },
  { type: 'canary.rolled_back', description: '灰度回滚', category: 'canary' },
  { type: 'canary.completed', description: '灰度完成', category: 'canary' },
  { type: 'monitoring.alert.fired', description: '监控告警触发', category: 'monitoring' },
  { type: 'monitoring.alert.resolved', description: '监控告警恢复', category: 'monitoring' },
  { type: 'insight.generated', description: 'AI 洞察生成', category: 'insight' },
  { type: 'tenant.config.updated', description: '配置变更', category: 'config' },
]

export interface WebhookEndpoint {
  id: string
  tenantId: string
  storeId?: string
  name: string
  platform: WebhookPlatform
  /** 目标 URL (https://open.feishu.cn/...) */
  url: string
  /** HMAC 共享密钥 (加密存储) */
  secretEncrypted: string
  /** 订阅事件类型 */
  events: WebhookEventType[]
  status: WebhookStatus
  /** 自定义 headers (覆盖默认) */
  headers?: Record<string, string>
  /** 最大重试次数 (默认 3) */
  maxRetries: number
  /** 描述 */
  description?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type WebhookDeliveryStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'retrying'
  | 'dead_letter'

export interface WebhookDelivery {
  id: string
  endpointId: string
  tenantId: string
  eventType: WebhookEventType
  payload: Record<string, unknown>
  /** 实际发送的 body (含签名头) */
  body: string
  /** HTTP 响应状态码 */
  responseStatus?: number
  /** HTTP 响应 body (截断 4KB) */
  responseBody?: string
  status: WebhookStatus
  attempt: number
  maxAttempts: number
  /** contract 兼容: 错误消息 */
  errorMessage?: string
  /** contract 兼容: 投递尝试时间 */
  attemptedAt: Date
  /** contract 兼容: HTTP 状态码 */
  statusCode?: number
  /** 下次重试时间 */
  nextRetryAt?: string
  /** 最后错误 */
  error?: string
  createdAt: string
  completedAt?: string
  /** 投递耗时 (ms) */
  durationMs?: number
}

/**
 * 事件 payload 基类
 */
export interface WebhookEventPayload {
  eventType: WebhookEventType
  eventId: string
  timestamp: string
  tenantId: string
  storeId?: string
  data: Record<string, unknown>
}

/**
 * 平台默认 headers
 */
export function defaultHeaders(platform: WebhookPlatform): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent': `shenjiying88-webhook/1.0 (${platform})`,
  }
}
