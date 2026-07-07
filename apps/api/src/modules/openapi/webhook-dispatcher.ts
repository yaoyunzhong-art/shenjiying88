import type {
  WebhookSubscription,
  WebhookDelivery,
  WebhookEventType,
  TenantId
} from './openapi.entity'
import { WebhookAdapter } from './datasources/webhook.adapter'
import { SignValidator } from './sign-validator'

/**
 * Phase-44 T174: WebhookDispatcher (事件分发 + 指数退避重试)
 *
 * DR-44-C: 指数退避 = 1s/5s/30s/5m/30m (5 次), 失败入死信
 *
 * 反模式 v4 webhook-retry:
 *  - 指数退避 + jitter (防雪崩)
 *  - 死信队列 (DLQ) 手动重试
 *  - 幂等: 同一 eventId 不重复投递
 */

const MAX_ATTEMPTS = 5
const RETRY_DELAYS_MS = [
  1 * 1000,         // 第 1 次重试: 1s
  5 * 1000,         // 第 2 次: 5s
  30 * 1000,        // 第 3 次: 30s
  5 * 60 * 1000,    // 第 4 次: 5min
  30 * 60 * 1000    // 第 5 次: 30min
]

export type DeliveryAttemptResult = {
  success: boolean
  responseStatus?: number
  responseBody?: string
  errorMessage?: string
}

export class WebhookDispatcher {
  private signValidator: SignValidator
  /** 注入的 HTTP 投递器 (测试可 mock) */
  public httpPoster: (url: string, body: string, headers: Record<string, string>) => Promise<DeliveryAttemptResult>

  constructor(private readonly adapter: WebhookAdapter) {
    this.signValidator = new SignValidator()
    this.httpPoster = async (_url, _body, _headers) => {
      // 实际生产用 fetch 或 axios
      // 这里默认抛错, 需注入 httpPoster (E2E 会注入 mock)
      return {
        success: false,
        responseStatus: 0,
        errorMessage: 'no_http_poster_injected'
      }
    }
  }

  /**
   * 调度事件投递
   * 返回 delivery 对象, 状态 PENDING / SUCCESS / FAILED (重试中) / DEAD_LETTER
   */
  async dispatch(input: {
    tenantId: TenantId
    subscriptionId: string
    eventType: WebhookEventType
    payload: Record<string, any>
    now?: number
  }): Promise<WebhookDelivery> {
    const sub = this.adapter.querySubscription(input.tenantId, input.subscriptionId)
    if (!sub) throw new Error('subscription_not_found')
    if (sub.status !== 'ACTIVE') throw new Error('subscription_inactive')
    if (!sub.events.includes(input.eventType)) throw new Error('event_not_subscribed')

    // 幂等检查
    const eventId = input.payload?.id || `${input.eventType}_${Date.now()}`
    if (this.adapter.isAlreadyDelivered(input.tenantId, input.subscriptionId, eventId)) {
      throw new Error('duplicate_delivery')
    }

    const payloadStr = JSON.stringify(input.payload)
    const signature = this.signValidator.sign({
      secret: sub.secret,
      method: 'POST',
      url: sub.url,
      timestamp: Date.now(),
      nonce: eventId,
      body: payloadStr
    })

    const delivery: WebhookDelivery = {
      id: `del-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      eventType: input.eventType,
      payload: input.payload,
      attempts: 0,
      status: 'PENDING',
      signature,
      createdAt: new Date().toISOString()
    }
    this.adapter.saveDelivery(delivery)

    return this.attempt(delivery, sub, payloadStr)
  }

  /**
   * 重试一次 (从死信恢复)
   */
  async retry(tenantId: TenantId, deliveryId: string): Promise<WebhookDelivery> {
    const delivery = this.adapter.queryDelivery(tenantId, deliveryId)
    if (!delivery) throw new Error('delivery_not_found')
    if (delivery.status === 'SUCCESS') throw new Error('already_succeeded')

    const sub = this.adapter.querySubscription(tenantId, delivery.subscriptionId)
    if (!sub) throw new Error('subscription_not_found')

    const payloadStr = JSON.stringify(delivery.payload)
    return this.attempt(delivery, sub, payloadStr)
  }

  /**
   * 计算下次重试延迟
   */
  getNextRetryDelay(attempts: number): number {
    if (attempts < 0 || attempts >= MAX_ATTEMPTS) return -1  // 已达上限
    return RETRY_DELAYS_MS[attempts]
  }

  /**
   * 是否达到最大重试次数
   */
  isMaxAttemptsReached(attempts: number): boolean {
    return attempts >= MAX_ATTEMPTS
  }

  /**
   * 获取最大重试次数
   */
  getMaxAttempts(): number {
    return MAX_ATTEMPTS
  }

  /**
   * 从死信恢复重试
   */
  async recoverFromDeadLetter(tenantId: TenantId, deliveryId: string): Promise<WebhookDelivery> {
    const delivery = this.adapter.queryDelivery(tenantId, deliveryId)
    if (!delivery) throw new Error('delivery_not_found')
    if (delivery.status !== 'DEAD_LETTER') throw new Error('not_in_dead_letter')

    // 重置 attempts, 重新投递
    delivery.attempts = 0
    delivery.status = 'PENDING'
    this.adapter.saveDelivery(delivery)
    return this.retry(tenantId, deliveryId)
  }

  // ─── 内部: 单次尝试 ───

  private async attempt(delivery: WebhookDelivery, sub: WebhookSubscription, payloadStr: string): Promise<WebhookDelivery> {
    delivery.attempts++
    delivery.lastAttemptAt = new Date().toISOString()

    try {
      const result = await this.httpPoster(sub.url, payloadStr, {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': delivery.signature,
        'X-Webhook-Event': delivery.eventType,
        'X-Webhook-Delivery-Id': delivery.id
      })

      delivery.responseStatus = result.responseStatus
      delivery.responseBody = result.responseBody

      if (result.success) {
        delivery.status = 'SUCCESS'
        delivery.deliveredAt = new Date().toISOString()
      } else {
        delivery.errorMessage = result.errorMessage || `HTTP ${result.responseStatus}`
        if (this.isMaxAttemptsReached(delivery.attempts)) {
          delivery.status = 'DEAD_LETTER'
        } else {
          delivery.status = 'FAILED'
          delivery.nextRetryAt = new Date(Date.now() + this.getNextRetryDelay(delivery.attempts)).toISOString()
        }
      }
    } catch (err: any) {
      delivery.errorMessage = err.message || 'unknown_error'
      if (this.isMaxAttemptsReached(delivery.attempts)) {
        delivery.status = 'DEAD_LETTER'
      } else {
        delivery.status = 'FAILED'
        delivery.nextRetryAt = new Date(Date.now() + this.getNextRetryDelay(delivery.attempts)).toISOString()
      }
    }

    this.adapter.saveDelivery(delivery)
    return delivery
  }
}