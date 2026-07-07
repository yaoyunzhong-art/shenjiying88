import type { RequestTenantContext } from '../tenant/tenant.types'

export enum NotificationChannelType {
  Email = 'EMAIL',
  Sms = 'SMS',
  Push = 'PUSH',
  InApp = 'IN_APP',
  Webhook = 'WEBHOOK',
  Social = 'SOCIAL'
}

export enum NotificationStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

export enum FoundationScopeType {
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Store = 'STORE'
}

export interface NotificationTemplate {
  id: string
  code: string
  channel: NotificationChannelType
  scopeType: FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  marketCode?: string
  locale: string
  titleTemplate?: string
  bodyTemplate: string
  variables: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationDispatch {
  id: string
  templateId?: string
  channel: NotificationChannelType
  scopeType: FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  recipient: string
  payload: Record<string, unknown>
  status: NotificationStatus
  scheduledAt?: string
  sentAt?: string
  providerResponse?: Record<string, unknown>
  retryCount: number
  createdAt: string
  updatedAt: string
}

// ── Entity factories ──

let templateIdCounter = 0
let dispatchIdCounter = 0

export function toNotificationTemplate(input: {
  code: string
  channel: NotificationChannelType
  scopeType: FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  marketCode?: string
  locale: string
  titleTemplate?: string
  bodyTemplate: string
  variables?: string[]
  enabled?: boolean
}): NotificationTemplate {
  const now = new Date().toISOString()
  return {
    id: `${input.code}-${Date.now()}-${++templateIdCounter}`,
    code: input.code,
    channel: input.channel,
    scopeType: input.scopeType,
    tenantId: input.tenantId,
    brandId: input.brandId,
    storeId: input.storeId,
    marketCode: input.marketCode,
    locale: input.locale,
    titleTemplate: input.titleTemplate,
    bodyTemplate: input.bodyTemplate,
    variables: input.variables ?? [],
    enabled: input.enabled ?? true,
    createdAt: now,
    updatedAt: now
  }
}

export function toNotificationDispatch(input: {
  templateId?: string
  channel: NotificationChannelType
  scopeType: FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  recipient: string
  payload: Record<string, unknown>
  scheduledAt?: string
  status?: NotificationStatus
}): NotificationDispatch {
  const now = new Date().toISOString()
  return {
    id: `dispatch-${Date.now()}-${++dispatchIdCounter}`,
    templateId: input.templateId,
    channel: input.channel,
    scopeType: input.scopeType,
    tenantId: input.tenantId,
    brandId: input.brandId,
    storeId: input.storeId,
    recipient: input.recipient,
    payload: input.payload,
    status: input.status ?? NotificationStatus.Pending,
    scheduledAt: input.scheduledAt ?? now,
    retryCount: 0,
    createdAt: now,
    updatedAt: now
  }
}
