import { Injectable } from '@nestjs/common'
import { WebhookDispatcher } from '../webhook-dispatcher'
import { WebhookAdapter } from '../datasources/webhook.adapter'
import type {
  WebhookSubscription,
  WebhookDelivery,
  WebhookEventType,
  TenantId
} from '../openapi.entity'

/**
 * Phase-44 T174: WebhookService (Webhook 业务层)
 *
 * 业务职责:
 *  - 订阅管理 (CRUD + 暂停)
 *  - 事件投递 (包装 dispatcher)
 *  - 重试 + 死信恢复
 *  - 投递日志
 */
@Injectable()
export class WebhookService {
  constructor(
    private readonly dispatcher: WebhookDispatcher,
    private readonly adapter: WebhookAdapter
  ) {}

  /**
   * 创建订阅
   */
  createSubscription(input: {
    tenantId: TenantId
    url: string
    events: WebhookEventType[]
    description?: string
    createdBy: string
  }): WebhookSubscription {
    if (!input.url || !input.url.startsWith('https://')) {
      throw new Error('url_must_be_https')
    }
    if (!input.events || input.events.length === 0) {
      throw new Error('events_required')
    }
    // 简单 URL 校验
    try {
      new URL(input.url)
    } catch {
      throw new Error('invalid_url')
    }

    const sub: WebhookSubscription = {
      id: `whsub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: input.tenantId,
      url: input.url,
      events: input.events,
      secret: this.generateSecret(),
      description: input.description,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy
    }

    return this.adapter.saveSubscription(sub)
  }

  /**
   * 列出订阅
   */
  listSubscriptions(tenantId: TenantId): WebhookSubscription[] {
    return this.adapter.querySubscriptionsByTenant(tenantId)
  }

  /**
   * 暂停订阅
   */
  pauseSubscription(tenantId: TenantId, subId: string): WebhookSubscription | null {
    const sub = this.adapter.querySubscription(tenantId, subId)
    if (!sub) return null
    sub.status = 'PAUSED'
    return this.adapter.saveSubscription(sub)
  }

  /**
   * 恢复订阅
   */
  resumeSubscription(tenantId: TenantId, subId: string): WebhookSubscription | null {
    const sub = this.adapter.querySubscription(tenantId, subId)
    if (!sub) return null
    sub.status = 'ACTIVE'
    return this.adapter.saveSubscription(sub)
  }

  /**
   * 删除订阅
   */
  deleteSubscription(tenantId: TenantId, subId: string): boolean {
    return this.adapter.deleteSubscription(tenantId, subId)
  }

  /**
   * 投递事件
   */
  async dispatchEvent(input: {
    tenantId: TenantId
    subscriptionId: string
    eventType: WebhookEventType
    payload: Record<string, any>
  }): Promise<WebhookDelivery> {
    return this.dispatcher.dispatch(input)
  }

  /**
   * 手动重试
   */
  async retryDelivery(tenantId: TenantId, deliveryId: string): Promise<WebhookDelivery> {
    return this.dispatcher.retry(tenantId, deliveryId)
  }

  /**
   * 从死信恢复
   */
  async recoverFromDeadLetter(tenantId: TenantId, deliveryId: string): Promise<WebhookDelivery> {
    return this.dispatcher.recoverFromDeadLetter(tenantId, deliveryId)
  }

  /**
   * 查询死信
   */
  listDeadLetter(tenantId: TenantId): WebhookDelivery[] {
    return this.adapter.queryDeadLetter(tenantId)
  }

  /**
   * 投递日志
   */
  listDeliveries(tenantId: TenantId, status?: WebhookDelivery['status'], limit?: number): WebhookDelivery[] {
    return this.adapter.queryDeliveriesByTenant(tenantId, status, limit)
  }

  /**
   * 统计
   */
  stats(tenantId: TenantId): {
    subscriptions: { total: number; active: number; paused: number }
    deliveries: {
      total: number
      pending: number
      success: number
      failed: number
      deadLetter: number
    }
    retryQueueSize: number
  } {
    const subs = this.adapter.querySubscriptionsByTenant(tenantId)
    const allDeliveries = this.adapter.queryDeliveriesByTenant(tenantId)
    const stats = {
      subscriptions: {
        total: subs.length,
        active: subs.filter(s => s.status === 'ACTIVE').length,
        paused: subs.filter(s => s.status === 'PAUSED').length
      },
      deliveries: {
        total: allDeliveries.length,
        pending: allDeliveries.filter(d => d.status === 'PENDING').length,
        success: allDeliveries.filter(d => d.status === 'SUCCESS').length,
        failed: allDeliveries.filter(d => d.status === 'FAILED').length,
        deadLetter: allDeliveries.filter(d => d.status === 'DEAD_LETTER').length
      },
      retryQueueSize: allDeliveries.filter(d => d.status === 'FAILED' && d.nextRetryAt && new Date(d.nextRetryAt).getTime() > Date.now()).length
    }
    return stats
  }

  /**
   * 生成订阅密钥 (32 chars)
   */
  private generateSecret(): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let s = ''
    for (let i = 0; i < 32; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
    return s
  }
}