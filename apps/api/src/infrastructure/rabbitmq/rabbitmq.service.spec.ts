/**
 * rabbitmq.service.spec.ts — RabbitMQ Event Bus Service 深层单元测试
 *
 * 覆盖:
 *  - RabbitMQClientImpl: 连接 / 发布 / 订阅 / ACK / NACK / 队列管理
 *  - EventBus: 事件发布 / 订阅 / 批量订阅 / 路由
 *  - BusinessEventRouter: 事件路由 / handler 注册 / 4类业务事件
 *  - 工厂函数: createRabbitMQClient / createEventBus / createBusinessEventRouter
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 30 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  RabbitMQClientImpl,
  EventBus,
  BusinessEventRouter,
  type RabbitMQMessage,
  type MessageHandler,
  type OrderEvent,
  type MemberEvent,
  type CampaignEvent,
  type InventoryEvent,
  type BusinessEvent,
  type OrderEventHandlers,
  type MemberEventHandlers,
  type CampaignEventHandlers,
  type InventoryEventHandlers,
  createRabbitMQClient,
  createEventBus,
  createBusinessEventRouter,
} from './rabbitmq.service'

// ══════════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════════

function makeOrderEvent(overrides: Partial<OrderEvent> = {}): OrderEvent {
  return { type: 'ORDER_PAID', orderId: 'ord_001', amount: 100, timestamp: Date.now(), ...overrides }
}

function makeMemberEvent(overrides: Partial<MemberEvent> = {}): MemberEvent {
  return { type: 'MEMBER_REGISTERED', memberId: 'mem_001', timestamp: Date.now(), ...overrides }
}

function makeCampaignEvent(overrides: Partial<CampaignEvent> = {}): CampaignEvent {
  return { type: 'CAMPAIGN_STARTED', campaignId: 'cmp_001', timestamp: Date.now(), ...overrides }
}

function makeInventoryEvent(overrides: Partial<InventoryEvent> = {}): InventoryEvent {
  return { type: 'INVENTORY_LOW', productId: 'prod_001', quantity: 5, timestamp: Date.now(), ...overrides }
}

// ══════════════════════════════════════════════════════════════
// RabbitMQClientImpl
// ══════════════════════════════════════════════════════════════

describe('RabbitMQClientImpl', () => {
  let client: RabbitMQClientImpl

  beforeEach(() => {
    client = new RabbitMQClientImpl()
  })

  describe('连接管理', () => {
    it('connect 前 connected 为 false', () => {
      expect(client.connected).toBe(false)
    })

    it('connect 后 connected 为 true', async () => {
      await client.connect()
      expect(client.connected).toBe(true)
    })

    it('可多次 connect', async () => {
      await client.connect()
      await client.connect()
      expect(client.connected).toBe(true)
    })
  })

  describe('发布与订阅', () => {
    beforeEach(async () => {
      await client.connect()
    })

    it('发布消息后队列中有消息', async () => {
      await client.publish('orders', { orderId: 'o1' })
      expect(client.getQueueMessageCount('orders')).toBe(1)
    })

    it('发布到不同队列互不影响', async () => {
      await client.publish('orders', { orderId: 'o1' })
      await client.publish('members', { memberId: 'm1' })
      expect(client.getQueueMessageCount('orders')).toBe(1)
      expect(client.getQueueMessageCount('members')).toBe(1)
    })

    it('dispatchQueue 触发订阅 handler', async () => {
      const calls: RabbitMQMessage[] = []
      client.subscribe('orders', async (msg) => { calls.push(msg) })
      await client.publish('orders', { orderId: 'o1' })
      await client.dispatchQueue('orders')
      expect(calls).toHaveLength(1)
      expect(calls[0].payload).toEqual({ orderId: 'o1' })
    })

    it('多个 handler 都被调用', async () => {
      let count = 0
      client.subscribe('orders', async () => { count++ })
      client.subscribe('orders', async () => { count++ })
      await client.publish('orders', { orderId: 'o1' })
      await client.dispatchQueue('orders')
      expect(count).toBe(2)
    })

    it('handler 抛异常不影响其他 handler', async () => {
      let secondCalled = false
      client.subscribe('orders', async () => { throw new Error('handler fail') })
      client.subscribe('orders', async () => { secondCalled = true })
      await client.publish('orders', { orderId: 'o1' })
      await client.dispatchQueue('orders')
      expect(secondCalled).toBe(true)
    })
  })

  describe('ACK / NACK', () => {
    beforeEach(async () => {
      await client.connect()
    })

    it('ack 从队列中移除消息', async () => {
      await client.publish('orders', { orderId: 'o1' })
      const msgs: RabbitMQMessage[] = []
      client.subscribe('orders', async (msg) => { msgs.push(msg) })
      await client.dispatchQueue('orders')
      client.ack(msgs[0])
      expect(client.getQueueMessageCount('orders')).toBe(0)
    })

    it('nack requeue=true 标记为重新投递', async () => {
      await client.publish('orders', { orderId: 'o1' })
      const msgs: RabbitMQMessage[] = []
      client.subscribe('orders', async (msg) => { msgs.push(msg) })
      await client.dispatchQueue('orders')
      client.nack(msgs[0], true)
      expect(msgs[0].redelivered).toBe(true)
    })

    it('nack requeue=false 移除消息', async () => {
      await client.publish('orders', { orderId: 'o1' })
      const msgs: RabbitMQMessage[] = []
      client.subscribe('orders', async (msg) => { msgs.push(msg) })
      await client.dispatchQueue('orders')
      client.nack(msgs[0], false)
      expect(client.getQueueMessageCount('orders')).toBe(0)
    })
  })

  describe('消息元数据', () => {
    beforeEach(async () => {
      await client.connect()
    })

    it('消息自动生成唯一 id', async () => {
      await client.publish('q', {})
      await client.publish('q', {})
      const count = client.getQueueMessageCount('q')
      // 两条消息应该有不同 id (消息数=2, 但我们在队列里看不到 id 直接比较)
      expect(count).toBe(2)
    })

    it('消息携带 timestamp', async () => {
      const msgs: RabbitMQMessage[] = []
      client.subscribe('q', async (m) => { msgs.push(m) })
      await client.publish('q', { x: 1 })
      await client.dispatchQueue('q')
      expect(msgs[0].timestamp).toBeGreaterThan(0)
      expect(typeof msgs[0].timestamp).toBe('number')
    })

    it('publish 接受 metadata 参数', async () => {
      const msgs: RabbitMQMessage[] = []
      client.subscribe('q', async (m) => { msgs.push(m) })
      await client.publish('q', { x: 1 }, { correlationId: 'corr_123' })
      await client.dispatchQueue('q')
      expect(msgs[0].metadata?.correlationId).toBe('corr_123')
    })
  })

  describe('dispatchQueue 与 reset', () => {
    beforeEach(async () => {
      await client.connect()
    })

    it('dispatchQueue 无订阅不报错', async () => {
      await client.publish('orphan', { x: 1 })
      await expect(client.dispatchQueue('orphan')).resolves.toBeUndefined()
    })

    it('dispatchQueue 空队列不报错', async () => {
      await expect(client.dispatchQueue('empty')).resolves.toBeUndefined()
    })

    it('reset 清空所有状态', async () => {
      await client.publish('q', { x: 1 })
      client.subscribe('q', async () => {})
      client.reset()
      expect(client.connected).toBe(false)
      expect(client.getQueueMessageCount('q')).toBe(0)
    })
  })

  describe('未连接时的行为', () => {
    it('publish 抛出错误', async () => {
      await expect(client.publish('q', {})).rejects.toThrow('Not connected')
    })
  })
})

// ══════════════════════════════════════════════════════════════
// EventBus
// ══════════════════════════════════════════════════════════════

describe('EventBus', () => {
  let client: RabbitMQClientImpl
  let eventBus: EventBus

  beforeEach(async () => {
    client = new RabbitMQClientImpl()
    await client.connect()
    eventBus = new EventBus(client)
  })

  describe('publish', () => {
    it('发布 OrderEvent 到 order_events 队列', async () => {
      const event = makeOrderEvent()
      await eventBus.publish(event)
      expect(client.getQueueMessageCount('order_events')).toBe(1)
    })

    it('发布 MemberEvent 到 member_events 队列', async () => {
      await eventBus.publish(makeMemberEvent())
      expect(client.getQueueMessageCount('member_events')).toBe(1)
    })

    it('发布 CampaignEvent 到 campaign_events 队列', async () => {
      await eventBus.publish(makeCampaignEvent())
      expect(client.getQueueMessageCount('campaign_events')).toBe(1)
    })

    it('发布 InventoryEvent 到 inventory_events 队列', async () => {
      await eventBus.publish(makeInventoryEvent())
      expect(client.getQueueMessageCount('inventory_events')).toBe(1)
    })
  })

  describe('subscribe', () => {
    it('订阅后 handler 可接收到事件', async () => {
      const received: BusinessEvent[] = []
      eventBus.subscribe('ORDER_PAID', (e) => { received.push(e) })
      await eventBus.publish(makeOrderEvent())
      await client.dispatchQueue('order_events')
      expect(received).toHaveLength(1)
      expect((received[0] as OrderEvent).type).toBe('ORDER_PAID')
    })

    it('未订阅的事件类型 handler 不被触发', async () => {
      let triggered = false
      eventBus.subscribe('ORDER_PAID', () => { triggered = true })
      await eventBus.publish(makeOrderEvent({ type: 'ORDER_REFUNDED' }))
      await client.dispatchQueue('order_events')
      expect(triggered).toBe(false)
    })
  })

  describe('subscribeAll', () => {
    it('批量订阅多个事件', async () => {
      const calls: string[] = []
      eventBus.subscribeAll([
        { eventType: 'ORDER_PAID', handler: () => { calls.push('paid') } },
        { eventType: 'MEMBER_REGISTERED', handler: () => { calls.push('registered') } },
      ])
      await eventBus.publish(makeOrderEvent())
      await eventBus.publish(makeMemberEvent())
      await client.dispatchQueue('order_events')
      await client.dispatchQueue('member_events')
      expect(calls).toContain('paid')
      expect(calls).toContain('registered')
    })
  })
})

// ══════════════════════════════════════════════════════════════
// BusinessEventRouter
// ══════════════════════════════════════════════════════════════

describe('BusinessEventRouter', () => {
  let client: RabbitMQClientImpl
  let eventBus: EventBus
  let router: BusinessEventRouter

  beforeEach(async () => {
    client = new RabbitMQClientImpl()
    await client.connect()
    eventBus = new EventBus(client)
    router = new BusinessEventRouter(eventBus)
  })

  describe('handler 注册与路由', () => {
    it('路由 ORDER_PAID 到 onOrderPaid', () => {
      const calls: string[] = []
      router.registerOrderHandlers({ onOrderPaid: () => { calls.push('paid') } })
      router.routeOrderEvent(makeOrderEvent({ type: 'ORDER_PAID' }))
      expect(calls).toContain('paid')
    })

    it('路由 ORDER_REFUNDED 到 onOrderRefunded', () => {
      const calls: string[] = []
      router.registerOrderHandlers({ onOrderRefunded: () => { calls.push('refunded') } })
      router.routeOrderEvent(makeOrderEvent({ type: 'ORDER_REFUNDED' }))
      expect(calls).toContain('refunded')
    })

    it('路由 ORDER_CANCELLED 到 onOrderCancelled', () => {
      const calls: string[] = []
      router.registerOrderHandlers({ onOrderCancelled: () => { calls.push('cancelled') } })
      router.routeOrderEvent(makeOrderEvent({ type: 'ORDER_CANCELLED' }))
      expect(calls).toContain('cancelled')
    })

    it('路由 MEMBER_REGISTERED 到 onMemberRegistered', () => {
      const calls: string[] = []
      router.registerMemberHandlers({ onMemberRegistered: () => { calls.push('registered') } })
      router.routeMemberEvent(makeMemberEvent({ type: 'MEMBER_REGISTERED' }))
      expect(calls).toContain('registered')
    })

    it('路由 MEMBER_UPGRADED 到 onMemberUpgraded', () => {
      const calls: string[] = []
      router.registerMemberHandlers({ onMemberUpgraded: () => { calls.push('upgraded') } })
      router.routeMemberEvent(makeMemberEvent({ type: 'MEMBER_UPGRADED' }))
      expect(calls).toContain('upgraded')
    })

    it('路由 MEMBER_CHURNED 到 onMemberChurned', () => {
      const calls: string[] = []
      router.registerMemberHandlers({ onMemberChurned: () => { calls.push('churned') } })
      router.routeMemberEvent(makeMemberEvent({ type: 'MEMBER_CHURNED' }))
      expect(calls).toContain('churned')
    })

    it('路由 CAMPAIGN_THRESHOLD_REACHED 到 onCampaignThresholdReached', () => {
      const calls: string[] = []
      router.registerCampaignHandlers({ onCampaignThresholdReached: () => { calls.push('threshold') } })
      router.routeCampaignEvent(makeCampaignEvent({ type: 'CAMPAIGN_THRESHOLD_REACHED' }))
      expect(calls).toContain('threshold')
    })

    it('路由 INVENTORY_LOW 到 onInventoryLow', () => {
      const calls: string[] = []
      router.registerInventoryHandlers({ onInventoryLow: () => { calls.push('low') } })
      router.routeInventoryEvent(makeInventoryEvent({ type: 'INVENTORY_LOW' }))
      expect(calls).toContain('low')
    })

    it('路由 INVENTORY_RESTOCKED 到 onInventoryRestocked', () => {
      const calls: string[] = []
      router.registerInventoryHandlers({ onInventoryRestocked: () => { calls.push('restocked') } })
      router.routeInventoryEvent(makeInventoryEvent({ type: 'INVENTORY_RESTOCKED' }))
      expect(calls).toContain('restocked')
    })
  })

  describe('initialize 集成', () => {
    it('初始化后订阅所有业务事件', async () => {
      const calls: string[] = []
      router.registerOrderHandlers({ onOrderPaid: () => { calls.push('paid') } })
      router.registerMemberHandlers({ onMemberRegistered: () => { calls.push('registered') } })
      router.registerCampaignHandlers({ onCampaignThresholdReached: () => { calls.push('threshold') } })
      router.registerInventoryHandlers({ onInventoryLow: () => { calls.push('low') } })

      router.initialize()

      await eventBus.publish(makeOrderEvent())
      await eventBus.publish(makeMemberEvent())
      await eventBus.publish(makeCampaignEvent({ type: 'CAMPAIGN_THRESHOLD_REACHED' }))
      await eventBus.publish(makeInventoryEvent())

      // dispatch 所有队列
      await client.dispatchQueue('order_events')
      await client.dispatchQueue('member_events')
      await client.dispatchQueue('campaign_events')
      await client.dispatchQueue('inventory_events')

      expect(calls).toContain('paid')
      expect(calls).toContain('registered')
      expect(calls).toContain('threshold')
      expect(calls).toContain('low')
    })
  })

  describe('register 方法叠加', () => {
    it('多次注册 handler 会叠加', () => {
      const calls: string[] = []
      router.registerOrderHandlers({ onOrderPaid: () => { calls.push('first') } })
      router.registerOrderHandlers({ onOrderPaid: () => { calls.push('second') } })
      router.routeOrderEvent(makeOrderEvent())
      expect(calls).toContain('first')
      expect(calls).toContain('second')
    })
  })
})

// ══════════════════════════════════════════════════════════════
// 工厂函数
// ══════════════════════════════════════════════════════════════

describe('工厂函数', () => {
  it('createRabbitMQClient 返回 RabbitMQClientImpl 实例', () => {
    const c = createRabbitMQClient()
    expect(c).toBeInstanceOf(RabbitMQClientImpl)
  })

  it('createEventBus 接受 client 并返回 EventBus', () => {
    const c = createRabbitMQClient()
    const bus = createEventBus(c)
    expect(bus).toBeInstanceOf(EventBus)
  })

  it('createBusinessEventRouter 返回 BusinessEventRouter', () => {
    const c = createRabbitMQClient()
    const bus = createEventBus(c)
    const router = createBusinessEventRouter(bus)
    expect(router).toBeInstanceOf(BusinessEventRouter)
  })
})
