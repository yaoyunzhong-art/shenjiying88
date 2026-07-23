import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common'
import { DualChannelRouter } from '../push/channels/dual-channel-router'
import { EmailPushChannel } from '../push/channels/email-channel'
import { SmsPushChannel } from '../push/channels/sms-channel'
import {
  CACHE_SERVICE,
  type CacheService
} from '../../infrastructure/cache/cache.module'
import {
  EVENT_BUS_SERVICE,
  type EventBusService
} from '../../infrastructure/event-bus/event-bus.module'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
  toNotificationDispatch,
  toNotificationTemplate,
  type NotificationDispatch,
  type NotificationTemplate
} from './notification.entity'
import { MetricsService } from '../observability/metrics.service'

const templateStore = new Map<string, NotificationTemplate>()
const dispatchStore = new Map<string, NotificationDispatch>()

/**
 * Cache 持久化 TTL — 30 天
 * 通知模板 + dispatch 记录,跨进程重启需要持久化
 */
const NOTIFICATION_CACHE_TTL_SECONDS = 30 * 24 * 3600

/** EventBus event name for async notification dispatch */
export const NOTIFICATION_REQUESTED_EVENT = 'NotificationRequested'
export const NOTIFICATION_COMPLETED_EVENT = 'NotificationCompleted'
export const NOTIFICATION_FAILED_EVENT = 'NotificationFailed'

export function resetNotificationServiceTestState() {
  templateStore.clear()
  dispatchStore.clear()
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private asyncSubscribed = false

  // BS-0265: 短信/邮件双通道路由器
  private readonly dualChannelRouter: DualChannelRouter

  constructor(
    @Optional() @Inject(CACHE_SERVICE) private readonly cache?: CacheService,
    @Optional() @Inject(EVENT_BUS_SERVICE) private readonly eventBus?: EventBusService,
    @Optional() @Inject(MetricsService) private readonly metrics?: MetricsService
  ) {
    this.registerMetrics()

    // BS-0265: 初始化双通道路由，注册 Email + SMS 通道
    // 当主通道发送失败时自动降级到备用通道
    this.dualChannelRouter = new DualChannelRouter()
    this.dualChannelRouter.register(new EmailPushChannel())
    this.dualChannelRouter.register(new SmsPushChannel())
  }

  onModuleInit(): void {
    if (this.eventBus && !this.asyncSubscribed) {
      this.eventBus.subscribe<{
        templateCode?: string
        channel: NotificationChannelType
        scopeType: FoundationScopeType
        tenantId?: string
        brandId?: string
        storeId?: string
        recipient: string
        payload: Record<string, unknown>
        scheduledAt?: string
      }>(NOTIFICATION_REQUESTED_EVENT, (payload) => {
        this.executeAsyncSend(payload)
      })
      this.asyncSubscribed = true
    }
  }

  private registerMetrics(): void {
    if (!this.metrics) return
    this.metrics.registerCounter(
      'notification_dispatches_total',
      'Total number of notification dispatch attempts, labeled by channel and status.'
    )
    this.metrics.registerCounter(
      'notification_enqueued_total',
      'Total number of notification dispatches enqueued, labeled by channel.'
    )
    this.metrics.registerHistogram(
      'notification_dispatch_duration_ms',
      'Notification dispatch latency in milliseconds, labeled by channel and status.'
    )
  }

  private recordDispatchMetrics(dispatch: NotificationDispatch, startedAt: number): void {
    if (!this.metrics) return
    const labels = {
      channel: dispatch.channel,
      status: dispatch.status,
      tenantId: dispatch.tenantId ?? 'unknown'
    }
    this.metrics.incrementCounter('notification_dispatches_total', labels)
    this.metrics.observeHistogram(
      'notification_dispatch_duration_ms',
      Math.max(Date.now() - startedAt, 0),
      labels
    )
  }

  /** 将 template 同步到 cache (write-through) */
  private async persistTemplateToCache(template: NotificationTemplate): Promise<void> {
    if (!this.cache) return
    try {
      await this.cache.set(`notification:template:${template.id}`, template, NOTIFICATION_CACHE_TTL_SECONDS)
    } catch {
      // 持久化失败不影响主流程
    }
  }

  /** 将 dispatch 同步到 cache (write-through) */
  private async persistDispatchToCache(dispatch: NotificationDispatch): Promise<void> {
    if (!this.cache) return
    try {
      await this.cache.set(`notification:dispatch:${dispatch.id}`, dispatch, NOTIFICATION_CACHE_TTL_SECONDS)
    } catch {
      // 持久化失败不影响主流程
    }
  }

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
    void this.persistTemplateToCache(template)
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
    void this.persistTemplateToCache(updated)
    return updated
  }

  // ── Dispatch management ──

  /**
   * 同步发送:立即触发 simulateSend
   */
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
    const startedAt = Date.now()
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
    const updated = dispatchStore.get(dispatch.id)!
    this.recordDispatchMetrics(updated, startedAt)
    void this.persistDispatchToCache(updated)
    return updated
  }

  /**
   * 异步发送 (Phase-13 task 10):publish 到 EventBus,handler 在后台调度。
   * - 有 EventBus 时:publish 后立即返回 Pending 状态,handler 异步触发 simulateSend
   * - 无 EventBus 时:fallback 到同步 send() (保持向后兼容)
   */
  enqueue(input: {
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
    if (!this.eventBus) {
      // 无 EventBus,fallback 同步 send
      return this.send(input)
    }

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
      scheduledAt: input.scheduledAt,
      status: NotificationStatus.Pending
    })

    dispatchStore.set(dispatch.id, dispatch)
    void this.persistDispatchToCache(dispatch)
    this.metrics?.incrementCounter('notification_enqueued_total', {
      channel: input.channel,
      tenantId: input.tenantId ?? 'unknown'
    })

    void this.eventBus.publish(NOTIFICATION_REQUESTED_EVENT, { ...input, dispatchId: dispatch.id }, {
      tenantId: input.tenantId
    })

    return dispatch
  }

  /**
   * EventBus handler:执行实际的发送逻辑 (复用 enqueue 时创建的 dispatch id)
   */
  private executeAsyncSend(input: {
    templateCode?: string
    channel: NotificationChannelType
    scopeType: FoundationScopeType
    tenantId?: string
    brandId?: string
    storeId?: string
    recipient: string
    payload: Record<string, unknown>
    scheduledAt?: string
    dispatchId?: string
  }): void {
    const startedAt = Date.now()
    const existingId = input.dispatchId
    let templateId: string | undefined
    if (input.templateCode) {
      const tpl = this.findTemplateByCode(input.templateCode)
      templateId = tpl?.id
    }

    let dispatch: NotificationDispatch
    if (existingId) {
      // 复用 enqueue 时创建的 Pending dispatch,直接更新
      const existing = dispatchStore.get(existingId)
      if (existing) {
        dispatch = { ...existing, updatedAt: new Date().toISOString() }
      } else {
        dispatch = toNotificationDispatch({
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
      }
    } else {
      dispatch = toNotificationDispatch({
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
    }

    dispatchStore.set(dispatch.id, dispatch)
    this.simulateSend(dispatch)
    const updated = dispatchStore.get(dispatch.id)!
    this.recordDispatchMetrics(updated, startedAt)
    void this.persistDispatchToCache(updated)

    const completedEvent = updated.status === NotificationStatus.Sent
      ? NOTIFICATION_COMPLETED_EVENT
      : NOTIFICATION_FAILED_EVENT
    void this.eventBus?.publish(completedEvent, updated, {
      tenantId: input.tenantId,
      dispatchId: dispatch.id
    })
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
    const startedAt = Date.now()
    this.simulateSend(updated)
    const finalDispatch = dispatchStore.get(id)!
    this.recordDispatchMetrics(finalDispatch, startedAt)
    void this.persistDispatchToCache(finalDispatch)
    return finalDispatch
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
    void this.persistDispatchToCache(updated)
    return updated
  }

  // ── Renewal Notifications ──

  sendRenewalSuccessNotification(input: {
    tenantId: string;
    licenseId: string;
    packageName: string;
    newExpireAt: Date;
  }): void {
    this.send({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: input.tenantId,
      recipient: `${input.tenantId}-admin`,
      payload: {
        type: 'renewal_success',
        licenseId: input.licenseId,
        packageName: input.packageName,
        newExpireAt: input.newExpireAt.toISOString(),
      },
    });
  }

  sendRenewalFailureNotification(input: {
    tenantId: string;
    licenseId: string;
    packageName: string;
    errorMessage: string;
  }): void {
    this.send({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: input.tenantId,
      recipient: `${input.tenantId}-admin`,
      payload: {
        type: 'renewal_failure',
        licenseId: input.licenseId,
        packageName: input.packageName,
        errorMessage: input.errorMessage,
      },
    });
  }

  sendRenewalReminderNotification(input: {
    tenantId: string;
    licenseId: string;
    daysBeforeExpiration: number;
    expireAt: Date;
  }): void {
    this.send({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: input.tenantId,
      recipient: `${input.tenantId}-admin`,
      payload: {
        type: 'renewal_reminder',
        licenseId: input.licenseId,
        daysBeforeExpiration: input.daysBeforeExpiration,
        expireAt: input.expireAt.toISOString(),
      },
    });
  }

  // ── Internal ──

  private simulateSend(dispatch: NotificationDispatch): void {
    const startedAt = Date.now()

    // BS-0265: 对 SMS/Email 通道使用双通道自动切换
    if (dispatch.channel === NotificationChannelType.Sms ||
        dispatch.channel === NotificationChannelType.Email) {
      void this.sendViaDualChannel(dispatch)
      return
    }

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
    void this.persistDispatchToCache(updated)
  }

  /**
   * BS-0265: 通过双通道路由发送 SMS/Email
   * 主通道失败时自动降级到备用通道
   */
  private async sendViaDualChannel(dispatch: NotificationDispatch): Promise<void> {
    const channelName = dispatch.channel === NotificationChannelType.Sms ? 'sms' : 'email'

    try {
      const result = await this.dualChannelRouter.send(
        {
          recipient: dispatch.recipient,
          body: typeof dispatch.payload.content === 'string'
            ? dispatch.payload.content
            : JSON.stringify(dispatch.payload),
          priority: dispatch.channel === NotificationChannelType.Sms ? 10 : 5,
          tenantId: dispatch.tenantId,
          subject: dispatch.payload.subject as string | undefined,
        } as any,
        dispatch.channel === NotificationChannelType.Sms
          ? { primary: 'sms', fallback: 'email' }
          : { primary: 'email', fallback: 'sms' }
      )

      const updated: NotificationDispatch = {
        ...dispatch,
        status: result.success ? NotificationStatus.Sent : NotificationStatus.Failed,
        sentAt: new Date().toISOString(),
        providerResponse: result.success
          ? { providerId: result.providerId, status: 'delivered_via_dual_channel', elapsedMs: result.elapsedMs }
          : { error: result.error, status: 'all_channels_failed' },
        updatedAt: new Date().toISOString()
      }
      dispatchStore.set(dispatch.id, updated)
      void this.persistDispatchToCache(updated)
    } catch (err) {
      const updated: NotificationDispatch = {
        ...dispatch,
        status: NotificationStatus.Failed,
        sentAt: new Date().toISOString(),
        providerResponse: { error: String(err), status: 'dual_channel_exception' },
        updatedAt: new Date().toISOString()
      }
      dispatchStore.set(dispatch.id, updated)
      void this.persistDispatchToCache(updated)
    }
  }

  /**
   * BS-0265: 双通道健康检查
   */
  async checkDualChannelHealth(): Promise<{ email: boolean; sms: boolean }> {
    const health = await this.dualChannelRouter.healthCheck()
    return {
      email: health['email'] ?? false,
      sms: health['sms'] ?? false,
    }
  }
}
