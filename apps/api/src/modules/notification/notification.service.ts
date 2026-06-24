import { Injectable } from '@nestjs/common'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
  toNotificationDispatch,
  toNotificationTemplate,
  type NotificationDispatch,
  type NotificationTemplate
} from './notification.entity'

const templateStore = new Map<string, NotificationTemplate>()
const dispatchStore = new Map<string, NotificationDispatch>()

export function resetNotificationServiceTestState() {
  templateStore.clear()
  dispatchStore.clear()
}

@Injectable()
export class NotificationService {
  // ── Template management ──

  registerTemplate(input: {
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
    const template = toNotificationTemplate(input)
    templateStore.set(template.id, template)
    return template
  }

  getTemplate(id: string): NotificationTemplate | undefined {
    return templateStore.get(id)
  }

  findTemplateByCode(code: string): NotificationTemplate | undefined {
    for (const t of templateStore.values()) {
      if (t.code === code && t.enabled) return t
    }
    return undefined
  }

  listTemplates(filters?: {
    channel?: NotificationChannelType
    scopeType?: FoundationScopeType
    tenantId?: string
    enabled?: boolean
  }): NotificationTemplate[] {
    let results = Array.from(templateStore.values())
    if (filters?.channel) results = results.filter(t => t.channel === filters.channel)
    if (filters?.scopeType) results = results.filter(t => t.scopeType === filters.scopeType)
    if (filters?.tenantId) results = results.filter(t => t.tenantId === filters.tenantId)
    if (filters?.enabled !== undefined) results = results.filter(t => t.enabled === filters.enabled)
    return results
  }

  updateTemplate(id: string, patch: {
    titleTemplate?: string
    bodyTemplate?: string
    variables?: string[]
    enabled?: boolean
  }): NotificationTemplate | undefined {
    const existing = templateStore.get(id)
    if (!existing) return undefined
    const updated: NotificationTemplate = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString()
    }
    templateStore.set(id, updated)
    return updated
  }

  // ── Dispatch management ──

  send(input: {
    templateCode?: string
    channel: NotificationChannelType
    scopeType: FoundationScopeType
    tenantId?: string
    brandId?: string
    storeId?: string
    recipient: string
    payload: Record<string, unknown>
    scheduledAt?: string
  }): NotificationDispatch {
    let templateId: string | undefined
    if (input.templateCode) {
      const tpl = this.findTemplateByCode(input.templateCode)
      templateId = tpl?.id
    }

    const dispatch = toNotificationDispatch({
      templateId,
      channel: input.channel,
      scopeType: input.scopeType,
      tenantId: input.tenantId,
      brandId: input.brandId,
      storeId: input.storeId,
      recipient: input.recipient,
      payload: input.payload,
      scheduledAt: input.scheduledAt
    })

    dispatchStore.set(dispatch.id, dispatch)
    this.simulateSend(dispatch)
    return dispatchStore.get(dispatch.id)!
  }

  getDispatch(id: string): NotificationDispatch | undefined {
    return dispatchStore.get(id)
  }

  listDispatches(filters?: {
    status?: NotificationStatus
    channel?: NotificationChannelType
    tenantId?: string
    recipient?: string
  }): NotificationDispatch[] {
    let results = Array.from(dispatchStore.values())
    if (filters?.status) results = results.filter(d => d.status === filters.status)
    if (filters?.channel) results = results.filter(d => d.channel === filters.channel)
    if (filters?.tenantId) results = results.filter(d => d.tenantId === filters.tenantId)
    if (filters?.recipient) results = results.filter(d => d.recipient === filters.recipient)
    return results
  }

  retryDispatch(id: string): NotificationDispatch | undefined {
    const dispatch = dispatchStore.get(id)
    if (!dispatch) return undefined
    if (dispatch.status !== NotificationStatus.Failed) return dispatch

    const updated: NotificationDispatch = {
      ...dispatch,
      status: NotificationStatus.Pending,
      retryCount: dispatch.retryCount + 1,
      updatedAt: new Date().toISOString()
    }
    dispatchStore.set(id, updated)
    this.simulateSend(updated)
    return dispatchStore.get(id)!
  }

  cancelDispatch(id: string): NotificationDispatch | undefined {
    const dispatch = dispatchStore.get(id)
    if (!dispatch) return undefined
    if (dispatch.status === NotificationStatus.Sent) return dispatch

    const updated: NotificationDispatch = {
      ...dispatch,
      status: NotificationStatus.Cancelled,
      updatedAt: new Date().toISOString()
    }
    dispatchStore.set(id, updated)
    return updated
  }

  // ── Internal ──

  private simulateSend(dispatch: NotificationDispatch): void {
    // Simulate async sending: mark as sent after small delay, or failed randomly
    const shouldFail = dispatch.recipient.includes('fail')
    const updated: NotificationDispatch = {
      ...dispatch,
      status: shouldFail ? NotificationStatus.Failed : NotificationStatus.Sent,
      sentAt: new Date().toISOString(),
      providerResponse: shouldFail
        ? { error: 'PROVIDER_REJECTED', message: 'Recipient rejected by provider' }
        : { providerId: `prov-${Date.now()}`, status: 'delivered' },
      updatedAt: new Date().toISOString()
    }
    dispatchStore.set(dispatch.id, updated)
  }
}
