import type { NotificationDispatch, NotificationTemplate } from './notification.entity'

export interface NotificationTemplateContract {
  id: string
  code: string
  channel: string
  scopeType: string
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

export interface NotificationDispatchContract {
  id: string
  templateId?: string
  channel: string
  scopeType: string
  tenantId?: string
  brandId?: string
  storeId?: string
  recipient: string
  payload: Record<string, unknown>
  status: string
  scheduledAt?: string
  sentAt?: string
  providerResponse?: Record<string, unknown>
  retryCount: number
  createdAt: string
  updatedAt: string
}

export function toNotificationTemplateContract(
  template: NotificationTemplate
): NotificationTemplateContract {
  return {
    id: template.id,
    code: template.code,
    channel: template.channel,
    scopeType: template.scopeType,
    tenantId: template.tenantId,
    brandId: template.brandId,
    storeId: template.storeId,
    marketCode: template.marketCode,
    locale: template.locale,
    titleTemplate: template.titleTemplate,
    bodyTemplate: template.bodyTemplate,
    variables: template.variables,
    enabled: template.enabled,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  }
}

export function toNotificationDispatchContract(
  dispatch: NotificationDispatch
): NotificationDispatchContract {
  return {
    id: dispatch.id,
    templateId: dispatch.templateId,
    channel: dispatch.channel,
    scopeType: dispatch.scopeType,
    tenantId: dispatch.tenantId,
    brandId: dispatch.brandId,
    storeId: dispatch.storeId,
    recipient: dispatch.recipient,
    payload: dispatch.payload,
    status: dispatch.status,
    scheduledAt: dispatch.scheduledAt,
    sentAt: dispatch.sentAt,
    providerResponse: dispatch.providerResponse,
    retryCount: dispatch.retryCount,
    createdAt: dispatch.createdAt,
    updatedAt: dispatch.updatedAt
  }
}
