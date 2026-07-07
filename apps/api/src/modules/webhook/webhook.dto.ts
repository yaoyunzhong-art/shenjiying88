/**
 * Phase 95 Webhook DTO (V10 Sprint 2 Day 19)
 * 对齐 WebhookService.registerEndpoint / updateEndpoint 的简单参数.
 */

import type { WebhookEventType } from './webhook.service'

export interface CreateWebhookRequest {
  url: string
  secret: string
  events: WebhookEventType[]
  active?: boolean
  retryPolicy?: { maxRetries: number; backoffMs: number }
}

export interface UpdateWebhookRequest {
  url?: string
  secret?: string
  events?: WebhookEventType[]
  active?: boolean
  retryPolicy?: { maxRetries: number; backoffMs: number }
}

export interface TestWebhookRequest {
  eventType: WebhookEventType
  customPayload?: Record<string, unknown>
}
