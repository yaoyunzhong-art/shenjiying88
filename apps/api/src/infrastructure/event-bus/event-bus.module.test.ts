import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { InMemoryEventBus } from './event-bus.module.js'

describe('InMemoryEventBus — publish / subscribe', () => {
  it('publish 触发 subscribe handler', async () => {
    const bus = new InMemoryEventBus()
    const received: { value: { payload: unknown; metadata?: Record<string, unknown> } | null } = {
      value: null,
    }
    bus.subscribe<{ id: string }>('OrderCreated', (payload, metadata) => {
      received.value = { payload, metadata }
    })

    await bus.publish('OrderCreated', { id: 'o-001' }, { tenantId: 't-1' })

    // microtask:等待 event loop
    await new Promise((r) => setImmediate(r))
    assert.ok(received.value)
    assert.deepEqual(received.value!.payload, { id: 'o-001' })
    assert.deepEqual(received.value!.metadata, { tenantId: 't-1' })
  })

  it('多个 subscriber 全部触发', async () => {
    const bus = new InMemoryEventBus()
    let calls1 = 0
    let calls2 = 0
    bus.subscribe('X', () => {
      calls1++
    })
    bus.subscribe('X', () => {
      calls2++
    })

    await bus.publish('X', {})
    await new Promise((r) => setImmediate(r))
    assert.equal(calls1, 1)
    assert.equal(calls2, 1)
  })

  it('subscribe 不同事件互不影响', async () => {
    const bus = new InMemoryEventBus()
    let aCalls = 0
    let bCalls = 0
    bus.subscribe('EventA', () => {
      aCalls++
    })
    bus.subscribe('EventB', () => {
      bCalls++
    })

    await bus.publish('EventA', {})
    await new Promise((r) => setImmediate(r))
    assert.equal(aCalls, 1)
    assert.equal(bCalls, 0)
  })

  it('subscribe handler 抛错不阻断其他 handler', async () => {
    const bus = new InMemoryEventBus()
    let secondCalled = false
    bus.subscribe('Crash', () => {
      throw new Error('boom')
    })
    bus.subscribe('Crash', () => {
      secondCalled = true
    })

    await bus.publish('Crash', {})
    await new Promise((r) => setImmediate(r))
    assert.equal(secondCalled, true, '第二个 handler 应被调用')
  })

  it('subscribe async handler 抛错也被吞掉', async () => {
    const bus = new InMemoryEventBus()
    let secondCalled = false
    bus.subscribe('CrashAsync', async () => {
      throw new Error('async boom')
    })
    bus.subscribe('CrashAsync', async () => {
      secondCalled = true
    })

    await bus.publish('CrashAsync', {})
    await new Promise((r) => setImmediate(r))
    assert.equal(secondCalled, true)
  })

  it('subscribe async handler 并发执行,快的先完成', async () => {
    const bus = new InMemoryEventBus()
    const order: string[] = []
    bus.subscribe('Order', async () => {
      await new Promise((r) => setTimeout(r, 30))
      order.push('slow')
    })
    bus.subscribe('Order', async () => {
      order.push('fast')
    })

    await bus.publish('Order', {})
    await new Promise((r) => setTimeout(r, 60))
    // EventEmitter.emit 同步触发,handler 各自 await;
    // fast handler 无 await 先 push,slow handler 等 30ms 后 push
    assert.deepEqual(order, ['fast', 'slow'])
  })

  it('payload 为复杂对象', async () => {
    const bus = new InMemoryEventBus()
    let received: unknown = null
    bus.subscribe('Complex', (payload) => {
      received = payload
    })

    const complex = {
      user: { id: 1, name: 'Alice', roles: ['admin', 'editor'] },
      meta: { timestamp: 1234567890, source: 'web' },
    }
    await bus.publish('Complex', complex)
    await new Promise((r) => setImmediate(r))
    assert.deepEqual(received, complex)
  })

  it('listenerCount 反映订阅数', () => {
    const bus = new InMemoryEventBus()
    assert.equal(bus.listenerCount('NoSubs'), 0)
    bus.subscribe('Foo', () => undefined)
    bus.subscribe('Foo', () => undefined)
    assert.equal(bus.listenerCount('Foo'), 2)
  })
})

describe('InMemoryEventBus — backend + lifecycle', () => {
  it('backend 标识为 memory', () => {
    const bus = new InMemoryEventBus()
    assert.equal(bus.backend, 'memory')
  })

  it('ping 永远 true', async () => {
    const bus = new InMemoryEventBus()
    assert.equal(await bus.ping(), true)
  })

  it('onModuleDestroy 清空所有 handlers', () => {
    const bus = new InMemoryEventBus()
    bus.subscribe('X', () => undefined)
    assert.equal(bus.listenerCount('X'), 1)
    bus.onModuleDestroy()
    assert.equal(bus.listenerCount('X'), 0)
  })

  it('re-subscribe 同一 handler 调用两次', async () => {
    const bus = new InMemoryEventBus()
    let count = 0
    const handler = () => {
      count++
    }
    bus.subscribe('Repeat', handler)
    bus.subscribe('Repeat', handler)

    await bus.publish('Repeat', {})
    await new Promise((r) => setImmediate(r))
    assert.equal(count, 2, '同 handler 注册两次 → 调用两次')
  })
})