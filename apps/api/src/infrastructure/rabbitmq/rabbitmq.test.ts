import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * RabbitMQ Event Bus Tests (T119-3)
 *
 * 测试覆盖:
 * - 连接：连接成功/失败
 * - 发布订阅：发布消息后订阅者收到
 * - 事件路由：OrderEvent 路由到订单队列，MemberEvent 路由到会员队列
 * - 模块解耦：订单模块不需要直接调用会员模块，通过事件总线解耦
 * - 消息确认：ack 后消息被标记为已处理，nack 后决定重试或丢弃
 */
import {
  createRabbitMQClient,
  createEventBus,
  createBusinessEventRouter,
  RabbitMQClientImpl,
  EventBus,
  BusinessEventRouter,
  OrderEvent,
  MemberEvent,
  CampaignEvent,
  InventoryEvent,
  OrderEventType,
  MemberEventType,
  CampaignEventType,
  InventoryEventType,
} from './rabbitmq.service'

// ── Test Helpers ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Connection Tests ──────────────────────────────────────────────────────────

describe('RabbitMQ Client Connection', () => {
  let client: RabbitMQClientImpl

  beforeEach(() => {
    client = createRabbitMQClient() as RabbitMQClientImpl
  })

  afterEach(() => {
    client.reset()
  })

  it('should connect successfully', async () => {
    await client.connect()
    expect(client.connected).toBe(true)
  })

  it('should throw error when publishing without connection', async () => {
    await expect(client.publish('test_queue', { data: 'test' })).rejects.toThrow(
      'RabbitMQ client not connected'
    )
  })

  it('should connect and then publish successfully', async () => {
    await client.connect()
    await expect(client.publish('test_queue', { data: 'test' })).resolves.not.toThrow()
  })

  it('should support multiple connect calls (idempotent)', async () => {
    await client.connect()
    await client.connect()
    expect(client.connected).toBe(true)
  })
})

// ── Publish/Subscribe Tests ───────────────────────────────────────────────────

describe('RabbitMQ Publish/Subscribe', () => {
  let client: RabbitMQClientImpl

  beforeEach(async () => {
    client = createRabbitMQClient() as RabbitMQClientImpl
    await client.connect()
  })

  afterEach(() => {
    client.reset()
  })

  it('should deliver message to subscriber after publish', async () => {
    const received: unknown[] = []

    client.subscribe('test_queue', async (msg) => {
      received.push(msg.payload)
    })

    await client.publish('test_queue', { orderId: 'order_123', amount: 100 })
    await client.dispatchQueue('test_queue')

    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({ orderId: 'order_123', amount: 100 })
  })

  it('should deliver multiple messages to subscriber', async () => {
    const received: unknown[] = []

    client.subscribe('test_queue', async (msg) => {
      received.push(msg.payload)
    })

    await client.publish('test_queue', { id: 1 })
    await client.publish('test_queue', { id: 2 })
    await client.publish('test_queue', { id: 3 })
    await client.dispatchQueue('test_queue')

    expect(received).toHaveLength(3)
    expect(received).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
  })

  it('should support multiple subscribers on same queue', async () => {
    const received1: unknown[] = []
    const received2: unknown[] = []

    client.subscribe('test_queue', async (msg) => {
      received1.push(msg.payload)
    })
    client.subscribe('test_queue', async (msg) => {
      received2.push(msg.payload)
    })

    await client.publish('test_queue', { data: 'hello' })
    await client.dispatchQueue('test_queue')

    expect(received1).toHaveLength(1)
    expect(received2).toHaveLength(1)
    expect(received1[0]).toEqual({ data: 'hello' })
    expect(received2[0]).toEqual({ data: 'hello' })
  })

  it('should not deliver message to subscriber of different queue', async () => {
    const received: unknown[] = []

    client.subscribe('queue_a', async (msg) => {
      received.push(msg.payload)
    })

    await client.publish('queue_b', { data: 'should not receive' })
    await client.dispatchQueue('queue_a')

    expect(received).toHaveLength(0)
  })
})

// ── Event Routing Tests ───────────────────────────────────────────────────────

describe('Event Bus Routing', () => {
  let client: RabbitMQClientImpl
  let eventBus: EventBus

  beforeEach(async () => {
    client = createRabbitMQClient() as RabbitMQClientImpl
    await client.connect()
    eventBus = createEventBus(client)
  })

  afterEach(() => {
    client.reset()
  })

  it('should route OrderEvent to order queue', async () => {
    const orderEvents: OrderEvent[] = []

    // 只订阅 ORDER_PAID，不订阅其他事件类型
    eventBus.subscribe('ORDER_PAID', async (e) => {
      orderEvents.push(e as OrderEvent)
    })

    const orderEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order_001',
      amount: 500,
      timestamp: Date.now(),
    }

    await eventBus.publish(orderEvent)
    await client.dispatchQueue('order_events')

    expect(orderEvents).toHaveLength(1)
    expect(orderEvents[0].orderId).toBe('order_001')
    expect(orderEvents[0].type).toBe('ORDER_PAID')
  })

  it('should route MemberEvent to member queue', async () => {
    const memberEvents: MemberEvent[] = []

    // 只订阅 MEMBER_REGISTERED，不订阅其他事件类型
    eventBus.subscribe('MEMBER_REGISTERED', async (e) => {
      memberEvents.push(e as MemberEvent)
    })

    const memberEvent: MemberEvent = {
      type: 'MEMBER_REGISTERED',
      memberId: 'member_001',
      level: 'bronze',
      timestamp: Date.now(),
    }

    await eventBus.publish(memberEvent)
    await client.dispatchQueue('member_events')

    expect(memberEvents).toHaveLength(1)
    expect(memberEvents[0].memberId).toBe('member_001')
    expect(memberEvents[0].type).toBe('MEMBER_REGISTERED')
  })

  it('should route CampaignEvent to campaign queue', async () => {
    const campaignEvents: CampaignEvent[] = []

    eventBus.subscribe('CAMPAIGN_STARTED', async (e) => {
      campaignEvents.push(e as CampaignEvent)
    })

    const campaignEvent: CampaignEvent = {
      type: 'CAMPAIGN_STARTED',
      campaignId: 'campaign_001',
      timestamp: Date.now(),
    }

    await eventBus.publish(campaignEvent)
    await client.dispatchQueue('campaign_events')

    expect(campaignEvents).toHaveLength(1)
    expect(campaignEvents[0].campaignId).toBe('campaign_001')
  })

  it('should route InventoryEvent to inventory queue', async () => {
    const inventoryEvents: InventoryEvent[] = []

    eventBus.subscribe('INVENTORY_LOW', async (e) => {
      inventoryEvents.push(e as InventoryEvent)
    })

    const inventoryEvent: InventoryEvent = {
      type: 'INVENTORY_LOW',
      productId: 'product_001',
      quantity: 5,
      threshold: 10,
      timestamp: Date.now(),
    }

    await eventBus.publish(inventoryEvent)
    await client.dispatchQueue('inventory_events')

    expect(inventoryEvents).toHaveLength(1)
    expect(inventoryEvents[0].productId).toBe('product_001')
  })

  it('should separate different event types to different queues', async () => {
    const orderEvents: OrderEvent[] = []
    const memberEvents: MemberEvent[] = []

    eventBus.subscribe('ORDER_PAID', async (e) => {
      orderEvents.push(e as OrderEvent)
    })
    eventBus.subscribe('MEMBER_REGISTERED', async (e) => {
      memberEvents.push(e as MemberEvent)
    })

    await eventBus.publish({
      type: 'ORDER_PAID',
      orderId: 'order_001',
      amount: 100,
      timestamp: Date.now(),
    } as OrderEvent)

    await eventBus.publish({
      type: 'MEMBER_REGISTERED',
      memberId: 'member_001',
      timestamp: Date.now(),
    } as MemberEvent)

    await client.dispatchQueue('order_events')
    await client.dispatchQueue('member_events')

    expect(orderEvents).toHaveLength(1)
    expect(memberEvents).toHaveLength(1)
  })
})

// ── Module Decoupling Tests ────────────────────────────────────────────────────

describe('Module Decoupling via Event Bus', () => {
  let client: RabbitMQClientImpl
  let eventBus: EventBus
  let router: BusinessEventRouter

  beforeEach(async () => {
    client = createRabbitMQClient() as RabbitMQClientImpl
    await client.connect()
    eventBus = createEventBus(client)
    router = createBusinessEventRouter(eventBus)
  })

  afterEach(() => {
    client.reset()
  })

  it('order module should not need to call member module directly', async () => {
    // 模拟订单模块只需要发布事件，不需要知道会员模块的存在
    const orderModulePublished: OrderEvent[] = []

    eventBus.subscribe('ORDER_PAID', async (e) => {
      orderModulePublished.push(e as OrderEvent)
    })

    const orderPaidEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order_002',
      amount: 1000,
      timestamp: Date.now(),
      metadata: { tenantId: 'tenant_1' },
    }

    await eventBus.publish(orderPaidEvent)
    await client.dispatchQueue('order_events')

    // 订单模块只发布事件，不知道会员模块
    expect(orderModulePublished).toHaveLength(1)
    expect(orderModulePublished[0].orderId).toBe('order_002')
  })

  it('member module should react to order events without direct coupling', async () => {
    // 会员模块订阅订单事件，但订单模块不需要知道会员模块
    const memberReactions: string[] = []

    router.registerMemberHandlers({
      onMemberUpgraded: async (e) => {
        memberReactions.push(`upgraded member ${e.memberId} to ${e.level}`)
      },
    })

    // 会员模块监听订单完成事件（实际场景中可能通过其他事件触发）
    eventBus.subscribe('ORDER_PAID', async (e) => {
      const orderEvent = e as OrderEvent
      // 模拟：根据订单金额自动升级会员
      if (orderEvent.amount >= 1000) {
        const memberEvent: MemberEvent = {
          type: 'MEMBER_UPGRADED',
          memberId: 'member_from_order',
          level: 'gold',
          timestamp: Date.now(),
          metadata: { triggeredByOrder: orderEvent.orderId },
        }
        await eventBus.publish(memberEvent)
      }
    })

    eventBus.subscribe('MEMBER_UPGRADED', async (e) => {
      memberReactions.push(`member upgraded: ${(e as MemberEvent).memberId}`)
    })

    await eventBus.publish({
      type: 'ORDER_PAID',
      orderId: 'order_high_value',
      amount: 2000,
      timestamp: Date.now(),
    } as OrderEvent)

    await client.dispatchQueue('order_events')
    await client.dispatchQueue('member_events')

    // 会员模块响应了订单事件，但订单模块没有直接调用会员模块
    expect(memberReactions.some((r) => r.includes('upgraded'))).toBe(true)
  })

  it('should support batch subscription', async () => {
    const receivedEvents: string[] = []

    eventBus.subscribeAll([
      { eventType: 'ORDER_PAID', handler: (e) => { receivedEvents.push(`order:${(e as OrderEvent).orderId}`) } },
      { eventType: 'MEMBER_REGISTERED', handler: (e) => { receivedEvents.push(`member:${(e as MemberEvent).memberId}`) } },
    ])

    await eventBus.publish({
      type: 'ORDER_PAID',
      orderId: 'order_batch',
      amount: 100,
      timestamp: Date.now(),
    } as OrderEvent)

    await eventBus.publish({
      type: 'MEMBER_REGISTERED',
      memberId: 'member_batch',
      timestamp: Date.now(),
    } as MemberEvent)

    await client.dispatchQueue('order_events')
    await client.dispatchQueue('member_events')

    expect(receivedEvents).toContain('order:order_batch')
    expect(receivedEvents).toContain('member:member_batch')
  })
})

// ── Message Acknowledgment Tests ───────────────────────────────────────────────

describe('Message Acknowledgment', () => {
  let client: RabbitMQClientImpl

  beforeEach(async () => {
    client = createRabbitMQClient() as RabbitMQClientImpl
    await client.connect()
  })

  afterEach(() => {
    client.reset()
  })

  it('should remove message from queue after ack', async () => {
    let processedMessage: unknown = null

    client.subscribe('test_queue', async (msg) => {
      processedMessage = msg.payload
    })

    await client.publish('test_queue', { data: 'to be acked' })
    await client.dispatchQueue('test_queue')

    // 手动调用 ack（实际使用中会在 handler 成功后自动 ack）
    const queueMessages: any[] = Array.from((client as any).queues.get('test_queue') || [])
    for (const msg of queueMessages) {
      client.ack(msg as any)
    }

    expect(client.getQueueMessageCount('test_queue')).toBe(0)
  })

  it('should keep message in queue after nack with requeue=true', async () => {
    client.subscribe('test_queue', async () => {
      // 不处理，模拟失败
    })

    await client.publish('test_queue', { data: 'to be requeued' })
    await client.dispatchQueue('test_queue')

    const queueMessages: any[] = Array.from((client as any).queues.get('test_queue') || [])
    expect(queueMessages.length).toBe(1)

    for (const msg of queueMessages) {
      client.nack(msg as any, true)
    }

    expect(client.getQueueMessageCount('test_queue')).toBe(1)
    const remainingMsg: any = Array.from((client as any).queues.get('test_queue') || [])[0]
    expect(remainingMsg.redelivered).toBe(true)
  })

  it('should remove message from queue after nack with requeue=false', async () => {
    client.subscribe('test_queue', async () => {
      // 不处理，模拟失败
    })

    await client.publish('test_queue', { data: 'to be discarded' })
    await client.dispatchQueue('test_queue')

    const queueMessages: any[] = Array.from((client as any).queues.get('test_queue') || [])
    for (const msg of queueMessages) {
      client.nack(msg as any, false)
    }

    expect(client.getQueueMessageCount('test_queue')).toBe(0)
  })

  it('should track message metadata', async () => {
    const received: unknown[] = []

    client.subscribe('test_queue', async (msg) => {
      received.push({ payload: msg.payload, metadata: msg.metadata })
    })

    await client.publish(
      'test_queue',
      { orderId: 'order_meta' },
      { tenantId: 'tenant_1', actorId: 'user_1' }
    )
    await client.dispatchQueue('test_queue')

    expect(received).toHaveLength(1)
    expect((received[0] as any).metadata).toEqual({ tenantId: 'tenant_1', actorId: 'user_1' })
  })
})
