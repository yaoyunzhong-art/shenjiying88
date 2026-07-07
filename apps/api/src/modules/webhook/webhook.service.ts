import { randomUUID } from 'node:crypto'
import { createHmac, timingSafeEqual } from 'node:crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'order.created'
  | 'order.paid'
  | 'order.refunded'
  | 'points.earned'
  | 'points.redeemed'
  | 'points.adjusted'
  | 'coupon.issued'
  | 'coupon.used'
  | 'coupon.expired'
  | 'inventory.low'
  | 'inventory.out'
  | 'inventory.restock'
  | 'user.registered'
  | 'user.upgraded'

export interface WebhookEndpoint {
  id: string
  url: string
  secret: string
  events: WebhookEventType[]
  active: boolean
  retryPolicy: { maxRetries: number; backoffMs: number }
  createdAt: Date
}

export interface WebhookSubscription {
  id: string
  endpointId: string
  event: WebhookEventType
  filters?: Record<string, string>
  active: boolean
}

export interface DeliveryLog {
  id: string
  subscriptionId: string
  event: WebhookEventType
  payload: Record<string, unknown>
  attempt: number
  status: 'pending' | 'success' | 'failed'
  responseCode?: number
  responseBody?: string
  error?: string
  createdAt: Date
  deliveredAt?: Date
}

// ── HTTP Client Interface ─────────────────────────────────────────────────────

export interface HttpClient {
  post(url: string, body: string, headers: Record<string, string>): Promise<{
    status: number
    body: string
  }>
}

class DefaultHttpClient implements HttpClient {
  async post(url: string, body: string, headers: Record<string, string>) {
    const res = await fetch(url, { method: 'POST', headers, body })
    return { status: res.status, body: (await res.text()).slice(0, 4096) }
  }
}

// ── WebhookService ────────────────────────────────────────────────────────────

export class WebhookService {
  private readonly endpoints = new Map<string, WebhookEndpoint>()
  private readonly subscriptions = new Map<string, WebhookSubscription>()
  private readonly deliveryLogs = new Map<string, DeliveryLog>()
  private readonly deliveryLogsByEndpoint = new Map<string, string[]>()

  private httpClient: HttpClient = new DefaultHttpClient()

  // ── Endpoint Management ───────────────────────────────────────────────────

  async registerEndpoint(
    url: string,
    secret: string,
    events: WebhookEventType[],
  ): Promise<WebhookEndpoint> {
    const endpoint: WebhookEndpoint = {
      id: randomUUID(),
      url,
      secret,
      events: [...events],
      active: true,
      retryPolicy: { maxRetries: 5, backoffMs: 1000 },
      createdAt: new Date(),
    }
    this.endpoints.set(endpoint.id, endpoint)
    this.deliveryLogsByEndpoint.set(endpoint.id, [])
    return endpoint
  }

  async updateEndpoint(
    id: string,
    updates: Partial<WebhookEndpoint>,
  ): Promise<WebhookEndpoint> {
    const endpoint = this.endpoints.get(id)
    if (!endpoint) {
      throw new Error(`Endpoint ${id} not found`)
    }
    if (updates.url !== undefined) endpoint.url = updates.url
    if (updates.secret !== undefined) endpoint.secret = updates.secret
    if (updates.events !== undefined) endpoint.events = updates.events
    if (updates.active !== undefined) endpoint.active = updates.active
    if (updates.retryPolicy !== undefined) endpoint.retryPolicy = updates.retryPolicy
    return endpoint
  }

  async deleteEndpoint(id: string): Promise<void> {
    if (!this.endpoints.has(id)) {
      throw new Error(`Endpoint ${id} not found`)
    }
    this.endpoints.delete(id)
    // Clean up subscriptions for this endpoint
    for (const [subId, sub] of this.subscriptions) {
      if (sub.endpointId === id) {
        this.subscriptions.delete(subId)
      }
    }
    this.deliveryLogsByEndpoint.delete(id)
  }

  async listEndpoints(): Promise<WebhookEndpoint[]> {
    return Array.from(this.endpoints.values())
  }

  // ── Subscription Management ────────────────────────────────────────────────

  async subscribe(
    endpointId: string,
    event: WebhookEventType,
    filters?: Record<string, string>,
  ): Promise<WebhookSubscription> {
    if (!this.endpoints.has(endpointId)) {
      throw new Error(`Endpoint ${endpointId} not found`)
    }
    const subscription: WebhookSubscription = {
      id: randomUUID(),
      endpointId,
      event,
      filters,
      active: true,
    }
    this.subscriptions.set(subscription.id, subscription)
    return subscription
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    if (!this.subscriptions.has(subscriptionId)) {
      throw new Error(`Subscription ${subscriptionId} not found`)
    }
    this.subscriptions.delete(subscriptionId)
  }

  // ── Event Emission ─────────────────────────────────────────────────────────

  async emit(event: WebhookEventType, payload: Record<string, unknown>): Promise<void> {
    // Find all active subscriptions matching this event
    const matchingSubs = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.active && sub.event === event,
    )

    // For each matching subscription, deliver the event asynchronously
    for (const sub of matchingSubs) {
      const endpoint = this.endpoints.get(sub.endpointId)
      if (!endpoint || !endpoint.active) continue

      // Apply filters if present
      if (sub.filters && !this.matchFilters(payload, sub.filters)) continue

      // Deliver asynchronously (fire-and-forget)
      this.deliverAsync(sub, endpoint, event, payload).catch((err) => {
        console.error(`[Webhook] delivery failed: ${err.message}`)
      })
    }
  }

  private matchFilters(payload: Record<string, unknown>, filters: Record<string, string>): boolean {
    for (const [key, expectedValue] of Object.entries(filters)) {
      const actualValue = String(payload[key])
      if (actualValue !== expectedValue) return false
    }
    return true
  }

  private async deliverAsync(
    subscription: WebhookSubscription,
    endpoint: WebhookEndpoint,
    event: WebhookEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const maxRetries = endpoint.retryPolicy.maxRetries
    let attempt = 0

    while (attempt <= maxRetries) {
      const log = await this.doDeliver(subscription, endpoint, event, payload, attempt)

      if (log.status === 'success') {
        return
      }

      if (attempt >= maxRetries) {
        // Mark as failed after max retries
        log.status = 'failed'
        return
      }

      // Calculate exponential backoff: initial * 2^attempt, capped at 64s
      const delay = Math.min(
        endpoint.retryPolicy.backoffMs * Math.pow(2, attempt),
        64000,
      )
      await this.sleep(delay)
      attempt++
    }
  }

  private async doDeliver(
    subscription: WebhookSubscription,
    endpoint: WebhookEndpoint,
    event: WebhookEventType,
    payload: Record<string, unknown>,
    attempt: number,
  ): Promise<DeliveryLog> {
    const id = randomUUID()
    const body = JSON.stringify(payload)
    const signature = this.signPayload(body, endpoint.secret)

    const log: DeliveryLog = {
      id,
      subscriptionId: subscription.id,
      event,
      payload,
      attempt,
      status: 'pending',
      createdAt: new Date(),
    }

    this.storeDeliveryLog(endpoint.id, log)

    try {
      const res = await this.httpClient.post(
        endpoint.url,
        body,
        {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
      )

      log.responseCode = res.status
      log.responseBody = res.body
      log.status = res.status >= 200 && res.status < 300 ? 'success' : 'failed'
      if (log.status === 'success') {
        log.deliveredAt = new Date()
      } else {
        log.error = `HTTP ${res.status}`
      }
    } catch (err: unknown) {
      log.status = 'failed'
      log.error = err instanceof Error ? err.message : String(err)
    }

    this.storeDeliveryLog(endpoint.id, log)
    return log
  }

  private storeDeliveryLog(endpointId: string, log: DeliveryLog): void {
    this.deliveryLogs.set(log.id, log)
    const logs = this.deliveryLogsByEndpoint.get(endpointId) ?? []
    logs.unshift(log.id)
    // Keep only last 1000 logs per endpoint to prevent memory bloat
    if (logs.length > 1000) logs.splice(1000)
    this.deliveryLogsByEndpoint.set(endpointId, logs)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // ── Delivery Logs ──────────────────────────────────────────────────────────

  async getDeliveryLogs(endpointId: string, limit = 50): Promise<DeliveryLog[]> {
    const logIds = this.deliveryLogsByEndpoint.get(endpointId) ?? []
    const logs = logIds
      .map((id) => this.deliveryLogs.get(id))
      .filter((log): log is DeliveryLog => log !== undefined)
      .slice(0, limit)
    return logs
  }

  async retryDelivery(logId: string): Promise<void> {
    const log = this.deliveryLogs.get(logId)
    if (!log) {
      throw new Error(`Delivery log ${logId} not found`)
    }

    const subscription = this.subscriptions.get(log.subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription ${log.subscriptionId} not found`)
    }

    const endpoint = this.endpoints.get(subscription.endpointId)
    if (!endpoint) {
      throw new Error(`Endpoint ${subscription.endpointId} not found`)
    }

    // Retry delivery asynchronously
    this.deliverAsync(subscription, endpoint, log.event, log.payload).catch((err) => {
      console.error(`[Webhook] retry delivery failed: ${err.message}`)
    })
  }

  // ── Signature Verification ─────────────────────────────────────────────────

  signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex')
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.signPayload(payload, secret)
    try {
      return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
    } catch {
      return false
    }
  }

  // ── Test Helpers ───────────────────────────────────────────────────────────

  setHttpClient(client: HttpClient): void {
    this.httpClient = client
  }

  getEndpoints(): Map<string, WebhookEndpoint> {
    return this.endpoints
  }

  getSubscriptions(): Map<string, WebhookSubscription> {
    return this.subscriptions
  }

  getDeliveryLogsMap(): Map<string, DeliveryLog> {
    return this.deliveryLogs
  }

  // ── Legacy Adapter (backward compat for controller tests) ─────────────────

  /** @deprecated use registerEndpoint */
  async create(data: {
    url: string
    secret: string
    events: WebhookEventType[]
    active?: boolean
    retryPolicy?: { maxRetries: number; backoffMs: number }
  }): Promise<WebhookEndpoint> {
    return this.registerEndpoint(data.url, data.secret, data.events)
  }

  /** @deprecated use listEndpoints */
  async list(): Promise<WebhookEndpoint[]> {
    return this.listEndpoints()
  }

  /** @deprecated use listEndpoints + filter */
  async getById(id: string): Promise<WebhookEndpoint | null> {
    return this.endpoints.get(id) ?? null
  }

  /** @deprecated use updateEndpoint */
  async update(
    id: string,
    data: Partial<{ url: string; secret: string; events: WebhookEventType[]; active: boolean }>,
  ): Promise<WebhookEndpoint> {
    return this.updateEndpoint(id, data)
  }

  /** @deprecated use deleteEndpoint */
  async delete(id: string): Promise<void> {
    return this.deleteEndpoint(id)
  }
}
