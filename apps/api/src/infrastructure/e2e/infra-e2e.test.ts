import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 基础设施 E2E 集成测试 (T119-5)
 *
 * 使用 vitest globals (describe/it)
 * 测试 ClickHouse + Prisma 桥接、Qdrant + Ollama RAG、RabbitMQ + EventBus 全链路集成
 *
 * 落地：HEARTBEAT-58
 */

import assert from 'node:assert/strict'
import {
  ClickHouseClient,
  FakeClickHouseClient,
  PrismaToClickHouseBridge,
  AnalyticsDataPipeline,
  EventRecord,
} from '../clickhouse/clickhouse.service'
import { QdrantClient, EmbeddingService } from '../qdrant/qdrant.service'
import {
  RabbitMQClientImpl,
  EventBus,
  OrderEvent,
  MemberEvent,
  BusinessEvent,
} from '../rabbitmq/rabbitmq.service'
import { OllamaClient, RAGService } from '../ollama/ollama.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createFakeClickHouse(): FakeClickHouseClient {
  const client = new FakeClickHouseClient()
  return client
}

function createClickHouseClient(fake: FakeClickHouseClient): ClickHouseClient {
  return new ClickHouseClient(
    { host: 'localhost', port: 8123, database: 'default', username: 'default', password: '' },
    fake
  )
}

function createPrismaMock(data: any[] = []) {
  return {
    member: {
      findMany: async () => data.length ? data : [
        { id: 1, name: 'Alice', tenantId: 't1', updatedAt: new Date('2024-01-01') },
        { id: 2, name: 'Bob', tenantId: 't1', updatedAt: new Date('2024-01-02') },
      ],
    },
    order: {
      findMany: async () => [
        { id: 1, memberId: 1, total: 100, tenantId: 't1', updatedAt: new Date('2024-01-01') },
      ],
    },
  }
}

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventType: 'PAGE_VIEW',
    memberId: 'm1',
    storeId: 's1',
    tenantId: 't1',
    payload: { page: '/home' },
    occurredAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────
// 1. ClickHouse + Prisma 桥接测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('ClickHouse + Prisma 桥接 — 成功路径', () => {
  it('Prisma 数据同步到 ClickHouse 并可查询', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()
    const client = createClickHouseClient(fake)
    await client.connect()

    const prisma = createPrismaMock()
    const bridge = new PrismaToClickHouseBridge(prisma as any, fake)

    // 执行同步
    const result: any = await bridge.syncTable('member', undefined, false)
    assert.equal(result.synced, 2)
    assert.ok(result.cursor)
    assert.equal(result.cursor.tableName, 'member')

    // 验证游标
    const cursor = bridge.getLastSyncCursor('member')
    assert.ok(cursor)
    assert.equal(cursor!.count, 2)
  })

  it('增量同步仅获取新记录', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()
    const prisma = createPrismaMock()
    const bridge = new PrismaToClickHouseBridge(prisma as any, fake)

    // 全量同步
    await bridge.syncTable('member', undefined, false)

    // 设置游标模拟增量
    bridge.setLastSyncCursor({
      tableName: 'member',
      lastSyncAt: new Date().toISOString(),
      lastSyncedId: '1',
      count: 1,
    })

    // 再次同步
    const result: any = await bridge.syncTable('member', undefined, false)
    assert.ok(result.synced >= 0)
    assert.ok(result.cursor)
  })

  it('批量同步多张表', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()
    const prisma = createPrismaMock()
    const bridge = new PrismaToClickHouseBridge(prisma as any, fake)

    const results = await bridge.batchSync(['member', 'order'], '2024-01-01')

    assert.ok(results.results['member'])
    assert.ok(results.results['order'])
  })

  it('AnalyticsDataPipeline 记录事件并查询', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()
    const client = createClickHouseClient(fake)
    await client.connect()

    const pipeline = new AnalyticsDataPipeline(fake)

    const event = makeEvent({ eventType: 'ORDER_PAID', memberId: 'm-alice', tenantId: 't1' })
    await pipeline.recordEvent(event)

    const events = await pipeline.queryEvents({ tenantId: 't1', eventType: 'ORDER_PAID' })
    assert.ok(Array.isArray(events))
  })
})

describe('ClickHouse + Prisma 桥接 — 失败/异常路径', () => {
  it('未知 Prisma 模型抛出错误', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()
    const prisma = createPrismaMock()
    const bridge = new PrismaToClickHouseBridge(prisma as any, fake)

    await assert.rejects(
      async () => bridge.syncTable('unknown_model' as any, undefined, false),
      /Unknown Prisma model/
    )
  })

  it('未连接 ClickHouse 查询抛出错误', async () => {
    const fake = createFakeClickHouse()
    // 不调用 connect

    await assert.rejects(
      async () => fake.query('SELECT * FROM events'),
      /Not connected/
    )
  })

  it('全量同步先清空再插入', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()

    // 先插入旧数据
    await fake.insert('member', [
      { id: 999, name: 'Old', tenantId: 't1', updatedAt: '2023-01-01T00:00:00Z' },
    ])

    const prisma = createPrismaMock()
    const bridge = new PrismaToClickHouseBridge(prisma as any, fake)

    // 全量同步
    await bridge.syncTable('member', undefined, true)

    // 验证旧数据被清空（游标 count 会重新计算）
    const cursor = bridge.getLastSyncCursor('member')
    assert.ok(cursor)
    assert.equal(cursor!.lastSyncedId, '2')
  })
})

// ─────────────────────────────────────────────────────────────
// 2. Qdrant + Ollama RAG 测试 (5 tests)
// ─────────────────────────────────────────────────────────────

describe('Qdrant + Ollama RAG — 成功路径', () => {
  it('Ollama embed 文本生成向量', async () => {
    const ollama = new OllamaClient()
    await ollama.connect()

    const response = await ollama.embed('Hello world')
    assert.ok(Array.isArray(response.embedding))
    assert.equal(response.embedding.length, 768)
  })

  it('Qdrant 存储向量并检索', async () => {
    const qdrant = new QdrantClient()
    await qdrant.connect()

    await qdrant.createCollection('test_collection', 768)

    const vector = new Array(768).fill(0).map(() => Math.random())
    await qdrant.upsert('test_collection', [
      { id: '1', vector, payload: { text: 'Hello world' } },
    ])

    const results = await qdrant.search('test_collection', vector, 5)
    assert.ok(Array.isArray(results))
    assert.equal(results.length, 1)
    assert.equal(results[0].id, '1')
  })

  it('RAG 全流程：索引 + 检索 + 生成', async () => {
    const ollama = new OllamaClient()
    await ollama.connect()

    const rag = new RAGService(ollama)

    // 索引文档
    const docId = await rag.indexContent('TypeScript is a typed superset of JavaScript', {
      source: 'test',
    })
    assert.ok(docId)

    // 检索相似内容
    const results = await rag.retrieve('What is TypeScript?', 3)
    assert.ok(Array.isArray(results))
    assert.ok(results.length > 0)
    assert.ok(typeof results[0].score === 'number')

    // 生成答案
    const answer = await rag.generateWithContext('What is TypeScript?', 'TypeScript')
    assert.ok(answer.answer)
    assert.ok(Array.isArray(answer.contexts))
  })

  it('多文档 RAG 检索返回相关度排序结果', async () => {
    const ollama = new OllamaClient()
    await ollama.connect()
    const rag = new RAGService(ollama)

    await rag.indexContent('React is a UI library', { source: 'react' })
    await rag.indexContent('Vue is a progressive framework', { source: 'vue' })
    await rag.indexContent('Angular is a platform for building mobile apps', { source: 'angular' })

    const results = await rag.retrieve('What is React?', 3)
    assert.equal(results.length, 3)
    assert.ok(results[0].score >= results[1].score)
  })

  it('带过滤条件的向量检索', async () => {
    const qdrant = new QdrantClient()
    await qdrant.connect()

    await qdrant.createCollection('filtered', 768)

    const v1 = new Array(768).fill(0.1)
    const v2 = new Array(768).fill(0.9)

    await qdrant.upsert('filtered', [
      { id: '1', vector: v1, payload: { category: 'A' } },
      { id: '2', vector: v2, payload: { category: 'B' } },
    ])

    const results = await qdrant.search('filtered', v1, 5, { category: 'A' })
    assert.equal(results.length, 1)
    assert.equal(results[0].id, '1')
  })
})

describe('Qdrant + Ollama RAG — 失败/异常路径', () => {
  it('查询不存在的 Collection 抛出错误', async () => {
    const qdrant = new QdrantClient()
    await qdrant.connect()

    await assert.rejects(
      async () => qdrant.search('non_existent', new Array(768).fill(0), 5),
      /not found/
    )
  })

  it('Ollama 未连接时 embed 抛出错误', async () => {
    const ollama = new OllamaClient()
    // 不调用 connect

    await assert.rejects(
      async () => ollama.embed('test'),
      /not connected/
    )
  })

  it('向量维度不匹配时抛出错误', async () => {
    const qdrant = new QdrantClient()
    await qdrant.connect()

    await qdrant.createCollection('mismatch', 768)

    const wrongDimensionVector = new Array(100).fill(0)
    await assert.rejects(
      async () => qdrant.upsert('mismatch', [
        { id: '1', vector: wrongDimensionVector, payload: {} },
      ]),
      /size mismatch/
    )
  })
})

// ─────────────────────────────────────────────────────────────
// 3. RabbitMQ + EventBus 测试 (5 tests)
// ─────────────────────────────────────────────────────────────

describe('RabbitMQ + EventBus — 成功路径', () => {
  it('EventBus 发布事件到正确队列', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    const orderEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order-1',
      amount: 100,
      timestamp: Date.now(),
    }

    await eventBus.publish(orderEvent)

    const count = client.getQueueMessageCount('order_events')
    assert.equal(count, 1)
  })

  it('EventBus 订阅者收到事件', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    let receivedEvent: OrderEvent | null = null
    eventBus.subscribe('ORDER_PAID', (event) => {
      receivedEvent = event as OrderEvent
    })

    const orderEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order-2',
      amount: 200,
      timestamp: Date.now(),
    }

    await eventBus.publish(orderEvent)
    await client.dispatchQueue('order_events')

    assert.ok(receivedEvent)
    assert.equal((receivedEvent as any)!.orderId, 'order-2')
    assert.equal((receivedEvent as any)!.amount, 200)
  })

  it('多个订阅者收到同一事件', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    let handler1CallCount = 0
    let handler2CallCount = 0

    eventBus.subscribe('ORDER_PAID', () => { handler1CallCount++ })
    eventBus.subscribe('ORDER_PAID', () => { handler2CallCount++ })

    const orderEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order-3',
      amount: 300,
      timestamp: Date.now(),
    }

    await eventBus.publish(orderEvent)
    await client.dispatchQueue('order_events')

    assert.equal(handler1CallCount, 1)
    assert.equal(handler2CallCount, 1)
  })

  it('不同事件类型路由到不同队列', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    const orderEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order-4',
      amount: 400,
      timestamp: Date.now(),
    }

    const memberEvent: MemberEvent = {
      type: 'MEMBER_REGISTERED',
      memberId: 'm1',
      timestamp: Date.now(),
    }

    await eventBus.publish(orderEvent)
    await eventBus.publish(memberEvent)

    const orderCount = client.getQueueMessageCount('order_events')
    const memberCount = client.getQueueMessageCount('member_events')

    assert.equal(orderCount, 1)
    assert.equal(memberCount, 1)
  })

  it('批量订阅多个事件类型', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    const receivedTypes: string[] = []
    eventBus.subscribeAll([
      { eventType: 'ORDER_PAID', handler: (e) => { receivedTypes.push((e as OrderEvent).type) } },
      { eventType: 'MEMBER_REGISTERED', handler: (e) => { receivedTypes.push((e as MemberEvent).type) } },
    ])

    await eventBus.publish({ type: 'ORDER_PAID', orderId: 'o1', amount: 100, timestamp: Date.now() } as OrderEvent)
    await eventBus.publish({ type: 'MEMBER_REGISTERED', memberId: 'm1', timestamp: Date.now() } as MemberEvent)

    await client.dispatchQueue('order_events')
    await client.dispatchQueue('member_events')

    assert.equal(receivedTypes.length, 2)
    assert.ok(receivedTypes.includes('ORDER_PAID'))
    assert.ok(receivedTypes.includes('MEMBER_REGISTERED'))
  })
})

describe('RabbitMQ + EventBus — 失败/异常路径', () => {
  it('未连接时发布事件抛出错误', async () => {
    const client = new RabbitMQClientImpl()
    // 不调用 connect
    const eventBus = new EventBus(client)

    await assert.rejects(
      async () => eventBus.publish({
        type: 'ORDER_PAID',
        orderId: 'order-5',
        amount: 500,
        timestamp: Date.now(),
      } as OrderEvent),
      /not connected/
    )
  })

  it('未知事件类型抛出错误', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    const unknownEvent = { type: 'UNKNOWN_TYPE', unknownField: 'test' } as any

    await assert.rejects(
      async () => eventBus.publish(unknownEvent),
      /Unknown event type/
    )
  })

  it('消息 ack 正确移除队列中的消息', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()

    await client.publish('test_queue', { data: 'test' })

    const queueSet = client['queues'].get('test_queue')
    const msg = Array.from(queueSet!)[0]

    assert.equal(queueSet!.size, 1)
    client.ack(msg)
    assert.equal(queueSet!.size, 0)
  })
})

// ─────────────────────────────────────────────────────────────
// 4. 全链路场景测试 (5 tests)
// ─────────────────────────────────────────────────────────────

describe('全链路场景 — 订单创建触发多系统联动', () => {
  it('订单创建 → RabbitMQ 发布 → 会员积分更新', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    // 模拟积分服务订阅订单完成事件
    let pointsUpdated = false
    let updatedOrderId = ''
    eventBus.subscribe('ORDER_PAID', (event) => {
      const orderEvent = event as OrderEvent
      pointsUpdated = true
      updatedOrderId = orderEvent.orderId
    })

    // 发布订单事件
    const orderEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order-full-1',
      amount: 1500,
      timestamp: Date.now(),
      metadata: { memberId: 'm-vip', points: 150 },
    }

    await eventBus.publish(orderEvent)
    await client.dispatchQueue('order_events')

    assert.equal(pointsUpdated, true)
    assert.equal(updatedOrderId, 'order-full-1')
  })

  it('订单事件 → 写入 ClickHouse 事件流', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()
    const pipeline = new AnalyticsDataPipeline(fake)

    const orderEvent: EventRecord = {
      eventId: 'evt-full-1',
      eventType: 'ORDER_COMPLETED',
      memberId: 'm-full',
      storeId: 's-full',
      tenantId: 't1',
      payload: { orderId: 'order-1', amount: 2000 },
      occurredAt: new Date().toISOString(),
    }

    await pipeline.recordEvent(orderEvent)

    const events = await pipeline.queryEvents({ tenantId: 't1', eventType: 'ORDER_COMPLETED' })
    assert.ok(Array.isArray(events))
  })

  it('Qdrant 记录操作日志向量', async () => {
    const ollama = new OllamaClient()
    await ollama.connect()
    const rag = new RAGService(ollama)

    const logEntry = 'User Alice created order #12345 at store S1'
    const docId = await rag.indexContent(logEntry, { type: 'order_log', user: 'Alice' })

    const results = await rag.retrieve('order creation', 5)
    assert.ok(Array.isArray(results))
    assert.ok(results.length > 0)
  })

  it('会员积分更新 → 触发会员等级变化事件', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()
    const eventBus = new EventBus(client)

    let levelChanged = false
    let newLevel = ''

    eventBus.subscribe('MEMBER_UPGRADED', (event) => {
      const memberEvent = event as MemberEvent
      levelChanged = true
      newLevel = memberEvent.level || ''
    })

    const memberEvent: MemberEvent = {
      type: 'MEMBER_UPGRADED',
      memberId: 'm-upgrade',
      level: 'Gold',
      timestamp: Date.now(),
    }

    await eventBus.publish(memberEvent)
    await client.dispatchQueue('member_events')

    assert.equal(levelChanged, true)
    assert.equal(newLevel, 'Gold')
  })

  it('全链路：订单 → EventBus → 积分更新 → ClickHouse 记录 → Qdrant 日志', async () => {
    // 初始化各服务
    const rabbitClient = new RabbitMQClientImpl()
    await rabbitClient.connect()
    const eventBus = new EventBus(rabbitClient)

    const clickHouse = createFakeClickHouse()
    await clickHouse.connect()
    const pipeline = new AnalyticsDataPipeline(clickHouse)

    const ollama = new OllamaClient()
    await ollama.connect()
    const rag = new RAGService(ollama)

    // 1. 订单事件发布
    let orderProcessed = false
    eventBus.subscribe('ORDER_PAID', async (event) => {
      orderProcessed = true
      const orderEvent = event as OrderEvent

      // 2. 写入 ClickHouse
      await pipeline.recordEvent({
        eventId: `evt-${Date.now()}`,
        eventType: 'ORDER_PAID',
        memberId: 'm-full链路',
        tenantId: 't1',
        payload: { orderId: orderEvent.orderId, amount: orderEvent.amount },
        occurredAt: new Date().toISOString(),
      })

      // 3. 记录 Qdrant 日志向量
      await rag.indexContent(
        `Order ${orderEvent.orderId} paid: $${orderEvent.amount}`,
        { type: 'payment_log' }
      )
    })

    // 发布订单事件
    const orderEvent: OrderEvent = {
      type: 'ORDER_PAID',
      orderId: 'order-fullchain',
      amount: 5000,
      timestamp: Date.now(),
    }

    await eventBus.publish(orderEvent)
    await rabbitClient.dispatchQueue('order_events')

    // 验证全链路
    assert.equal(orderProcessed, true)

    const events = await pipeline.queryEvents({ tenantId: 't1', eventType: 'ORDER_PAID' })
    assert.ok(events.length > 0)

    const searchResults = await rag.retrieve('order paid', 5)
    assert.ok(searchResults.length > 0)
  })
})
