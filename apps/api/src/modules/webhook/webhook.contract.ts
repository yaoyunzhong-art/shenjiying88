/**
 * 🐜 自动: [webhook] [A] contract 补全
 *
 * Webhook：跨模块合约类型
 * 定义 webhook 模块对外暴露的稳定合约接口。
 */
import type {
  WebhookConfig,
  WebhookEvent,
  WebhookDelivery,
  WebhookStatus,
  WebhookEventType,
} from './webhook.entity'

export interface WebhookConfigContract {
  id: string
  url: string
  events: WebhookEventType[]
  isActive: boolean
  secret?: string
}

export interface WebhookDeliveryContract {
  id: string
  eventType: WebhookEventType
  status: WebhookStatus
  attemptedAt: string
  statusCode?: number
  errorMessage?: string
}

export function toWebhookConfigContract(full: WebhookConfig): WebhookConfigContract {
  return {
    id: full.id,
    url: full.url,
    events: full.events,
    isActive: full.isActive,
    secret: full.secret,
  }
}

export function toWebhookDeliveryContract(full: WebhookDelivery): WebhookDeliveryContract {
  return {
    id: full.id,
    eventType: full.eventType,
    status: full.status,
    attemptedAt: full.attemptedAt.toISOString(),
    statusCode: full.statusCode,
    errorMessage: full.errorMessage,
  }
}

export type { WebhookConfig, WebhookEvent, WebhookDelivery, WebhookStatus, WebhookEventType }
