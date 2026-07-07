import type {
  WebhookSubscription,
  WebhookDelivery,
  WebhookEventType,
  TenantId
} from '../openapi.entity'

/**
 * Phase-44 T174: Webhook Adapter
 *
 * 职责:
 *  - 订阅管理 (CRUD + 暂停/恢复)
 *  - 投递记录 (pending/success/failed/dead_letter)
 *  - 死信队列 (DLQ)
 *
 * 反模式 v4 webhook-retry:
 *  - 投递状态机 PENDING → SUCCESS / FAILED (重试) / DEAD_LETTER
 *  - 重试次数 ≤ 5 (反模式: 无限重试)
 *  - 幂等: 同一 eventId 不重复投递
 */
export class WebhookAdapter {
  private subs = new Map<string, WebhookSubscription>()
  private deliveries = new Map<string, WebhookDelivery>()
  private tenantSubIndex = new Map<TenantId, Set<string>>()
  private tenantDelIndex = new Map<TenantId, Set<string>>()
  private idempotencyIndex = new Map<string, string>()  // eventId -> deliveryId

  saveSubscription(sub: WebhookSubscription): WebhookSubscription {
    this.subs.set(sub.id, { ...sub })
    if (!this.tenantSubIndex.has(sub.tenantId)) {
      this.tenantSubIndex.set(sub.tenantId, new Set())
    }
    this.tenantSubIndex.get(sub.tenantId)!.add(sub.id)
    return sub
  }

  querySubscription(tenantId: TenantId, subId: string): WebhookSubscription | null {
    const s = this.subs.get(subId)
    return s && s.tenantId === tenantId ? s : null
  }

  querySubscriptionsByTenant(tenantId: TenantId): WebhookSubscription[] {
    const ids = this.tenantSubIndex.get(tenantId) || new Set()
    const result: WebhookSubscription[] = []
    for (const id of ids) {
      const s = this.subs.get(id)
      if (s) result.push(s)
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  deleteSubscription(tenantId: TenantId, subId: string): boolean {
    const s = this.querySubscription(tenantId, subId)
    if (!s) return false
    this.subs.delete(subId)
    this.tenantSubIndex.get(tenantId)?.delete(subId)
    return true
  }

  saveDelivery(delivery: WebhookDelivery): WebhookDelivery {
    this.deliveries.set(delivery.id, { ...delivery })
    if (!this.tenantDelIndex.has(delivery.tenantId)) {
      this.tenantDelIndex.set(delivery.tenantId, new Set())
    }
    this.tenantDelIndex.get(delivery.tenantId)!.add(delivery.id)
    // 幂等索引
    const idempKey = `${delivery.tenantId}:${delivery.subscriptionId}:${delivery.payload?.id || delivery.eventType}`
    this.idempotencyIndex.set(idempKey, delivery.id)
    return delivery
  }

  queryDelivery(tenantId: TenantId, deliveryId: string): WebhookDelivery | null {
    const d = this.deliveries.get(deliveryId)
    return d && d.tenantId === tenantId ? d : null
  }

  queryDeliveriesByTenant(tenantId: TenantId, status?: WebhookDelivery['status'], limit?: number): WebhookDelivery[] {
    const ids = this.tenantDelIndex.get(tenantId) || new Set()
    const result: WebhookDelivery[] = []
    for (const id of ids) {
      const d = this.deliveries.get(id)
      if (d && (!status || d.status === status)) {
        result.push(d)
      }
    }
    const sorted = result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return limit ? sorted.slice(0, limit) : sorted
  }

  queryDeadLetter(tenantId: TenantId): WebhookDelivery[] {
    return this.queryDeliveriesByTenant(tenantId, 'DEAD_LETTER')
  }

  isAlreadyDelivered(tenantId: TenantId, subscriptionId: string, eventId: string): boolean {
    const key = `${tenantId}:${subscriptionId}:${eventId}`
    return this.idempotencyIndex.has(key)
  }

  /** 测试用 */
  seedSubs(subs: WebhookSubscription[]): void {
    for (const s of subs) this.saveSubscription(s)
  }
  seedDeliveries(deliveries: WebhookDelivery[]): void {
    for (const d of deliveries) this.saveDelivery(d)
  }
  reset(): void {
    this.subs.clear()
    this.deliveries.clear()
    this.tenantSubIndex.clear()
    this.tenantDelIndex.clear()
    this.idempotencyIndex.clear()
  }
}