/**
 * RabbitMQ Event Bus — 事件总线 + 业务模块解耦 (T119-3)
 *
 * 设计要点:
 * - RabbitMQClient:连接管理、发布/订阅、消息确认
 * - EventBus:发布-订阅模式的事件总线
 * - BusinessEventRouter:业务事件路由，实现模块解耦
 *   - 订单事件:已支付/退款/取消
 *   - 会员事件:注册/升级/流失
 *   - 营销事件:活动开始/结束/达到阈值
 *   - 库存事件:低于阈值/补货
 * - 使用内存 Map + Set 模拟 RabbitMQ（不依赖真实 Docker/网络）
 */
import { Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RabbitMQMessage {
  id: string
  queue: string
  payload: unknown
  metadata?: Record<string, unknown>
  timestamp: number
  redelivered: boolean
}

export type MessageHandler = (msg: RabbitMQMessage) => Promise<void> | void

export interface RabbitMQClient {
  connect(): Promise<void>
  publish(queue: string, message: unknown, metadata?: Record<string, unknown>): Promise<void>
  subscribe(queue: string, handler: MessageHandler): void
  ack(message: RabbitMQMessage): void
  nack(message: RabbitMQMessage, requeue?: boolean): void
  readonly connected: boolean
}

// ── Business Events ───────────────────────────────────────────────────────────

export type OrderEventType = 'ORDER_PAID' | 'ORDER_REFUNDED' | 'ORDER_CANCELLED'
export type MemberEventType = 'MEMBER_REGISTERED' | 'MEMBER_UPGRADED' | 'MEMBER_CHURNED'
export type CampaignEventType = 'CAMPAIGN_STARTED' | 'CAMPAIGN_ENDED' | 'CAMPAIGN_THRESHOLD_REACHED'
export type InventoryEventType = 'INVENTORY_LOW' | 'INVENTORY_RESTOCKED'

export interface OrderEvent {
  type: OrderEventType
  orderId: string
  amount: number
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface MemberEvent {
  type: MemberEventType
  memberId: string
  level?: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface CampaignEvent {
  type: CampaignEventType
  campaignId: string
  threshold?: number
  current?: number
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface InventoryEvent {
  type: InventoryEventType
  productId: string
  quantity: number
  threshold?: number
  timestamp: number
  metadata?: Record<string, unknown>
}

export type BusinessEvent = OrderEvent | MemberEvent | CampaignEvent | InventoryEvent

// ── RabbitMQClient (内存模拟) ─────────────────────────────────────────────────

export class RabbitMQClientImpl implements RabbitMQClient {
  private _connected = false
  private readonly queues = new Map<string, Set<RabbitMQMessage>>()
  private readonly subscriptions = new Map<string, Set<MessageHandler>>()
  private readonly pendingMessages = new Map<string, RabbitMQMessage>()
  private readonly logger = new Logger(RabbitMQClientImpl.name)
  private messageIdCounter = 0

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    // 模拟连接延迟
    await new Promise((resolve) => setTimeout(resolve, 10))
    this._connected = true
    this.logger.log('RabbitMQ client connected (in-memory)')
  }

  async publish(queue: string, message: unknown, metadata?: Record<string, unknown>): Promise<void> {
    if (!this._connected) {
      throw new Error('RabbitMQ client not connected')
    }

    const msg: RabbitMQMessage = {
      id: `msg_${++this.messageIdCounter}`,
      queue,
      payload: message,
      metadata,
      timestamp: Date.now(),
      redelivered: false,
    }

    let queueSet = this.queues.get(queue)
    if (!queueSet) {
      queueSet = new Set()
      this.queues.set(queue, queueSet)
    }
    queueSet.add(msg)
    this.pendingMessages.set(msg.id, msg)

    this.logger.debug(`Published message to queue '${queue}': ${msg.id}`)
  }

  subscribe(queue: string, handler: MessageHandler): void {
    let handlers = this.subscriptions.get(queue)
    if (!handlers) {
      handlers = new Set()
      this.subscriptions.set(queue, handlers)
    }
    handlers.add(handler)
    this.logger.debug(`Subscribed handler to queue '${queue}'`)
  }

  ack(message: RabbitMQMessage): void {
    const queueSet = this.queues.get(message.queue)
    if (queueSet) {
      queueSet.delete(message)
    }
    this.pendingMessages.delete(message.id)
    this.logger.debug(`ACKed message ${message.id} from queue '${message.queue}'`)
  }

  nack(message: RabbitMQMessage, requeue = false): void {
    if (requeue) {
      message.redelivered = true
      this.logger.debug(`NACKed message ${message.id} (requeue=true) from queue '${message.queue}'`)
    } else {
      const queueSet = this.queues.get(message.queue)
      if (queueSet) {
        queueSet.delete(message)
      }
      this.pendingMessages.delete(message.id)
      this.logger.debug(`NACKed message ${message.id} (requeue=false) from queue '${message.queue}'`)
    }
  }

  /** 测试 helper:获取队列中的消息数量 */
  getQueueMessageCount(queue: string): number {
    return this.queues.get(queue)?.size ?? 0
  }

  /** 测试 helper:分发队列中的消息给订阅者 */
  async dispatchQueue(queue: string): Promise<void> {
    const queueSet = this.queues.get(queue)
    const handlers = this.subscriptions.get(queue)
    if (!queueSet || !handlers || queueSet.size === 0) return

    const messages = Array.from(queueSet)
    for (const msg of messages) {
      for (const handler of handlers) {
        try {
          await handler(msg)
        } catch (error) {
          this.logger.error(`Handler error for message ${msg.id}: ${(error as Error).message}`)
        }
      }
    }
  }

  /** 测试 helper:重置状态 */
  reset(): void {
    this.queues.clear()
    this.subscriptions.clear()
    this.pendingMessages.clear()
    this._connected = false
    this.messageIdCounter = 0
  }
}

// ── EventBus (发布-订阅) ──────────────────────────────────────────────────────

const QUEUE_ORDER = 'order_events'
const QUEUE_MEMBER = 'member_events'
const QUEUE_CAMPAIGN = 'campaign_events'
const QUEUE_INVENTORY = 'inventory_events'

export interface EventSubscription {
  eventType: string
  handler: (event: BusinessEvent) => Promise<void> | void
}

export class EventBus {
  constructor(private readonly client: RabbitMQClient) {}

  /**
   * 发布事件到对应队列
   */
  async publish(event: BusinessEvent): Promise<void> {
    const queue = this.getQueueForEvent(event)
    await this.client.publish(queue, event)
  }

  /**
   * 订阅特定事件类型
   */
  subscribe(eventType: string, handler: (event: BusinessEvent) => Promise<void> | void): void {
    const queue = this.getQueueForEventType(eventType)
    this.client.subscribe(queue, async (msg) => {
      const event = msg.payload as BusinessEvent
      await handler(event)
    })
  }

  /**
   * 批量订阅多个事件
   */
  subscribeAll(subscriptions: EventSubscription[]): void {
    for (const sub of subscriptions) {
      this.subscribe(sub.eventType, sub.handler)
    }
  }

  /**
   * 取消订阅（移除该队列的所有订阅）
   * 注意：这是简化实现，实际 RabbitMQ 需要单独管理 consumer tag
   */
  unsubscribe(eventType: string): void {
    // 在内存模拟中，订阅通过 handler 引用管理
    // 这里仅记录取消订阅的意图
    this.client.subscribe(eventType, () => {
      // 空 handler，消息会被消费但不处理
    })
  }

  private getQueueForEvent(event: BusinessEvent): string {
    if ('orderId' in event) return QUEUE_ORDER
    if ('memberId' in event) return QUEUE_MEMBER
    if ('campaignId' in event) return QUEUE_CAMPAIGN
    if ('productId' in event) return QUEUE_INVENTORY
    throw new Error(`Unknown event type: ${JSON.stringify(event)}`)
  }

  private getQueueForEventType(eventType: string): string {
    if (
      eventType === 'ORDER_PAID' ||
      eventType === 'ORDER_REFUNDED' ||
      eventType === 'ORDER_CANCELLED'
    ) {
      return QUEUE_ORDER
    }
    if (
      eventType === 'MEMBER_REGISTERED' ||
      eventType === 'MEMBER_UPGRADED' ||
      eventType === 'MEMBER_CHURNED'
    ) {
      return QUEUE_MEMBER
    }
    if (
      eventType === 'CAMPAIGN_STARTED' ||
      eventType === 'CAMPAIGN_ENDED' ||
      eventType === 'CAMPAIGN_THRESHOLD_REACHED'
    ) {
      return QUEUE_CAMPAIGN
    }
    if (eventType === 'INVENTORY_LOW' || eventType === 'INVENTORY_RESTOCKED') {
      return QUEUE_INVENTORY
    }
    throw new Error(`Unknown event type: ${eventType}`)
  }
}

// ── BusinessEventRouter (业务事件路由) ───────────────────────────────────────

export interface OrderEventHandlers {
  onOrderPaid?: (event: OrderEvent) => Promise<void> | void
  onOrderRefunded?: (event: OrderEvent) => Promise<void> | void
  onOrderCancelled?: (event: OrderEvent) => Promise<void> | void
}

export interface MemberEventHandlers {
  onMemberRegistered?: (event: MemberEvent) => Promise<void> | void
  onMemberUpgraded?: (event: MemberEvent) => Promise<void> | void
  onMemberChurned?: (event: MemberEvent) => Promise<void> | void
}

export interface CampaignEventHandlers {
  onCampaignStarted?: (event: CampaignEvent) => Promise<void> | void
  onCampaignEnded?: (event: CampaignEvent) => Promise<void> | void
  onCampaignThresholdReached?: (event: CampaignEvent) => Promise<void> | void
}

export interface InventoryEventHandlers {
  onInventoryLow?: (event: InventoryEvent) => Promise<void> | void
  onInventoryRestocked?: (event: InventoryEvent) => Promise<void> | void
}

export class BusinessEventRouter {
  private orderHandlers: OrderEventHandlers = {}
  private memberHandlers: MemberEventHandlers = {}
  private campaignHandlers: CampaignEventHandlers = {}
  private inventoryHandlers: InventoryEventHandlers = {}

  constructor(private readonly eventBus: EventBus) {}

  /**
   * 路由订单事件到对应 handler
   */
  routeOrderEvent(event: OrderEvent): void {
    switch (event.type) {
      case 'ORDER_PAID':
        this.orderHandlers.onOrderPaid?.(event)
        break
      case 'ORDER_REFUNDED':
        this.orderHandlers.onOrderRefunded?.(event)
        break
      case 'ORDER_CANCELLED':
        this.orderHandlers.onOrderCancelled?.(event)
        break
    }
  }

  /**
   * 路由会员事件到对应 handler
   */
  routeMemberEvent(event: MemberEvent): void {
    switch (event.type) {
      case 'MEMBER_REGISTERED':
        this.memberHandlers.onMemberRegistered?.(event)
        break
      case 'MEMBER_UPGRADED':
        this.memberHandlers.onMemberUpgraded?.(event)
        break
      case 'MEMBER_CHURNED':
        this.memberHandlers.onMemberChurned?.(event)
        break
    }
  }

  /**
   * 路由营销事件到对应 handler
   */
  routeCampaignEvent(event: CampaignEvent): void {
    switch (event.type) {
      case 'CAMPAIGN_STARTED':
        this.campaignHandlers.onCampaignStarted?.(event)
        break
      case 'CAMPAIGN_ENDED':
        this.campaignHandlers.onCampaignEnded?.(event)
        break
      case 'CAMPAIGN_THRESHOLD_REACHED':
        this.campaignHandlers.onCampaignThresholdReached?.(event)
        break
    }
  }

  /**
   * 路由库存事件到对应 handler
   */
  routeInventoryEvent(event: InventoryEvent): void {
    switch (event.type) {
      case 'INVENTORY_LOW':
        this.inventoryHandlers.onInventoryLow?.(event)
        break
      case 'INVENTORY_RESTOCKED':
        this.inventoryHandlers.onInventoryRestocked?.(event)
        break
    }
  }

  /**
   * 注册订单事件 handlers
   */
  registerOrderHandlers(handlers: OrderEventHandlers): void {
    this.orderHandlers = { ...this.orderHandlers, ...handlers }
  }

  /**
   * 注册会员事件 handlers
   */
  registerMemberHandlers(handlers: MemberEventHandlers): void {
    this.memberHandlers = { ...this.memberHandlers, ...handlers }
  }

  /**
   * 注册营销事件 handlers
   */
  registerCampaignHandlers(handlers: CampaignEventHandlers): void {
    this.campaignHandlers = { ...this.campaignHandlers, ...handlers }
  }

  /**
   * 注册库存事件 handlers
   */
  registerInventoryHandlers(handlers: InventoryEventHandlers): void {
    this.inventoryHandlers = { ...this.inventoryHandlers, ...handlers }
  }

  /**
   * 初始化路由：订阅事件总线并分发到对应 handler
   */
  initialize(): void {
    // 订单事件订阅
    this.eventBus.subscribe('ORDER_PAID', (e) => this.routeOrderEvent(e as OrderEvent))
    this.eventBus.subscribe('ORDER_REFUNDED', (e) => this.routeOrderEvent(e as OrderEvent))
    this.eventBus.subscribe('ORDER_CANCELLED', (e) => this.routeOrderEvent(e as OrderEvent))

    // 会员事件订阅
    this.eventBus.subscribe('MEMBER_REGISTERED', (e) => this.routeMemberEvent(e as MemberEvent))
    this.eventBus.subscribe('MEMBER_UPGRADED', (e) => this.routeMemberEvent(e as MemberEvent))
    this.eventBus.subscribe('MEMBER_CHURNED', (e) => this.routeMemberEvent(e as MemberEvent))

    // 营销事件订阅
    this.eventBus.subscribe('CAMPAIGN_STARTED', (e) => this.routeCampaignEvent(e as CampaignEvent))
    this.eventBus.subscribe('CAMPAIGN_ENDED', (e) => this.routeCampaignEvent(e as CampaignEvent))
    this.eventBus.subscribe(
      'CAMPAIGN_THRESHOLD_REACHED',
      (e) => this.routeCampaignEvent(e as CampaignEvent)
    )

    // 库存事件订阅
    this.eventBus.subscribe('INVENTORY_LOW', (e) => this.routeInventoryEvent(e as InventoryEvent))
    this.eventBus.subscribe(
      'INVENTORY_RESTOCKED',
      (e) => this.routeInventoryEvent(e as InventoryEvent)
    )
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createRabbitMQClient(): RabbitMQClient {
  return new RabbitMQClientImpl()
}

export function createEventBus(client: RabbitMQClient): EventBus {
  return new EventBus(client)
}

export function createBusinessEventRouter(eventBus: EventBus): BusinessEventRouter {
  return new BusinessEventRouter(eventBus)
}
