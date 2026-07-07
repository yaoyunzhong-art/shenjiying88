/**
 * Phase 95 第三方集成 Webhook UI Types (V10 Sprint 2 Day 21)
 */

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

export type WebhookDeliveryStatus =
  | 'pending' | 'success' | 'failed' | 'retrying' | 'dead_letter'

export interface WebhookEndpointView {
  id: string
  name: string
  platform: WebhookPlatform
  url: string
  events: WebhookEventType[]
  status: WebhookStatus
  maxRetries: number
  secretFingerprint: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface WebhookDeliveryView {
  id: string
  endpointId: string
  eventType: WebhookEventType
  status: WebhookDeliveryStatus
  attempt: number
  maxAttempts: number
  responseStatus?: number
  error?: string
  createdAt: string
  completedAt?: string
  durationMs?: number
}

export const PLATFORM_LABELS: Record<WebhookPlatform, string> = {
  feishu: '飞书',
  dingtalk: '钉钉',
  wecom: '企业微信',
  generic: '通用 Webhook',
}

export const STATUS_LABELS: Record<WebhookStatus, string> = {
  active: '已启用',
  paused: '已暂停',
  disabled: '已禁用',
}

export const STATUS_COLORS: Record<WebhookStatus, string> = {
  active: '#10b981',
  paused: '#f59e0b',
  disabled: '#94a3b8',
}

export const DELIVERY_STATUS_LABELS: Record<WebhookDeliveryStatus, string> = {
  pending: '等待中',
  success: '已成功',
  failed: '已失败',
  retrying: '重试中',
  dead_letter: '死信',
}

export const DELIVERY_STATUS_COLORS: Record<WebhookDeliveryStatus, string> = {
  pending: '#94a3b8',
  success: '#10b981',
  failed: '#ef4444',
  retrying: '#3b82f6',
  dead_letter: '#dc2626',
}

export const EVENT_LABELS: Record<WebhookEventType, string> = {
  'license.expired': 'License 过期',
  'canary.created': '灰度创建',
  'canary.promoted': '灰度晋级',
  'canary.rolled_back': '灰度回滚',
  'canary.completed': '灰度完成',
  'monitoring.alert.fired': '告警触发',
  'monitoring.alert.resolved': '告警恢复',
  'insight.generated': 'AI 洞察生成',
  'tenant.config.updated': '配置变更',
}

export const ALL_EVENTS: WebhookEventType[] = Object.keys(EVENT_LABELS) as WebhookEventType[]
