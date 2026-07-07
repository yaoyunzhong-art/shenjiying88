import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [agent] [D] event-store.service 测试补全
 *
 * 覆盖:
 * - 事件持久化 (persist)
 * - loadAfter 查询 (跨租户隔离)
 * - getSessionHistory
 * - 订阅/取消订阅 (subscribeChannel / listener)
 * - clear / clearAll
 * - isDegraded
 */

import assert from 'node:assert/strict'
import { EventStoreService, type EventStoreListener } from './event-store.service'
import type { BufferedEvent } from './event-buffer.service'

describe('EventStoreService', () => {
  let store: EventStoreService

  const makeBufferedEvent = (id: number, type = 'message'): BufferedEvent => ({
    id,
    type: type as BufferedEvent['type'],
    data: { content: `event-${id}` },
    timestamp: String(Date.now() + id),
  } as unknown as BufferedEvent)

  beforeEach(() => {
    store = new EventStoreService()
    store.clearAll()
  })

  // ── persist ──

  it('should persist events and retrieve via has/size', async () => {
    await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    await store.persist('sess-001', makeBufferedEvent(2), 't-001')

    assert.equal(store.has('sess-001'), true)
    assert.equal(store.size('sess-001'), 2)
  })

  it('should maintain separate stores per session', async () => {
    await store.persist('sess-a', makeBufferedEvent(1), 't-001')
    await store.persist('sess-b', makeBufferedEvent(1), 't-002')

    assert.equal(store.size('sess-a'), 1)
    assert.equal(store.size('sess-b'), 1)
    assert.equal(store.totalSessions(), 2)
  })

  it('should not throw on persist error (fire-and-forget safe)', async () => {
    // Should not throw despite any internal issue
    await assert.doesNotReject(async () => {
      await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    })
  })

  // ── loadAfter ──

  it('loadAfter should return events after lastEventId', async () => {
    await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    await store.persist('sess-001', makeBufferedEvent(2), 't-001')
    await store.persist('sess-001', makeBufferedEvent(3), 't-001')

    const results = await store.loadAfter('sess-001', 1, 't-001')
    assert.equal(results.length, 2)
    assert.equal(results[0].id, 2)
    assert.equal(results[1].id, 3)
  })

  it('loadAfter should return empty when no match', async () => {
    await store.persist('sess-001', makeBufferedEvent(1), 't-001')

    const results = await store.loadAfter('sess-001', 5, 't-001')
    assert.equal(results.length, 0)
  })

  it('loadAfter should return empty for nonexistent session', async () => {
    const results = await store.loadAfter('nonexistent', 1)
    assert.equal(results.length, 0)
  })

  it('loadAfter should apply tenant isolation', async () => {
    await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    await store.persist('sess-001', makeBufferedEvent(2), 't-001')

    // Different tenant should see nothing
    const results = await store.loadAfter('sess-001', 0, 't-999')
    assert.equal(results.length, 0)
  })

  it('loadAfter should return all events when tenant matches', async () => {
    await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    await store.persist('sess-001', makeBufferedEvent(2), 't-001')

    const results = await store.loadAfter('sess-001', 0, 't-001')
    assert.equal(results.length, 2)
  })

  // ── getSessionHistory ──

  it('getSessionHistory should return all events up to limit', async () => {
    for (let i = 1; i <= 10; i++) {
      await store.persist('sess-001', makeBufferedEvent(i), 't-001')
    }

    const all = await store.getSessionHistory('sess-001', 100, 't-001')
    assert.equal(all.length, 10)
    assert.equal(all[0].id, 1)
    assert.equal(all[9].id, 10)
  })

  it('getSessionHistory should respect limit', async () => {
    for (let i = 1; i <= 10; i++) {
      await store.persist('sess-001', makeBufferedEvent(i), 't-001')
    }

    const limited = await store.getSessionHistory('sess-001', 3, 't-001')
    assert.equal(limited.length, 3)
    assert.equal(limited[0].id, 8) // last 3
    assert.equal(limited[2].id, 10)
  })

  it('getSessionHistory should enforce tenant isolation', async () => {
    await store.persist('sess-001', makeBufferedEvent(1), 't-001')

    const results = await store.getSessionHistory('sess-001', 100, 't-wrong')
    assert.equal(results.length, 0)
  })

  it('getSessionHistory should return empty for nonexistent session', async () => {
    const results = await store.getSessionHistory('nowhere', 10)
    assert.equal(results.length, 0)
  })

  // ── subscribeChannel / listener ──

  it('should notify listeners on persist', async () => {
    const notifications: Array<{ sessionId: string; eventId: number; eventType: string; tenantId: string }> = []

    const listener: EventStoreListener = (n) => {
      notifications.push(n)
    }
    const unsub = store.subscribeChannel('sess-001', listener)

    await store.persist('sess-001', makeBufferedEvent(1, 'message'), 't-001')
    await store.persist('sess-001', makeBufferedEvent(2, 'tool_call'), 't-001')

    assert.equal(notifications.length, 2)
    assert.equal(notifications[0].sessionId, 'sess-001')
    assert.equal(notifications[0].eventId, 1)
    assert.equal(notifications[0].eventType, 'message')
    assert.equal(notifications[0].tenantId, 't-001')
    assert.equal(notifications[1].eventType, 'tool_call')

    unsub()
  })

  it('should stop notifying after unsubscribe', async () => {
    const notifications: Array<{ sessionId: string; eventId: number; eventType: string; tenantId: string }> = []

    const listener: EventStoreListener = (n) => { notifications.push(n) }
    const unsub = store.subscribeChannel('sess-001', listener)

    await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    assert.equal(notifications.length, 1)

    unsub()
    await store.persist('sess-001', makeBufferedEvent(2), 't-001')
    assert.equal(notifications.length, 1) // no new notification
  })

  it('should not throw if listener throws', async () => {
    const failingListener: EventStoreListener = () => {
      throw new Error('listener error')
    }
    store.subscribeChannel('sess-001', failingListener)

    // Should not throw because persist catches listener errors
    await assert.doesNotReject(async () => {
      await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    })
  })

  it('multiple listeners for same session should all fire', async () => {
    let count = 0
    const l1: EventStoreListener = () => { count++ }
    const l2: EventStoreListener = () => { count++ }

    store.subscribeChannel('sess-001', l1)
    store.subscribeChannel('sess-001', l2)

    await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    assert.equal(count, 2)
  })

  // ── clear / clearAll / totalSessions ──

  it('clear should remove specific session data', async () => {
    await store.persist('sess-001', makeBufferedEvent(1), 't-001')
    await store.persist('sess-002', makeBufferedEvent(1), 't-002')

    store.clear('sess-001')
    assert.equal(store.has('sess-001'), false)
    assert.equal(store.has('sess-002'), true)
    assert.equal(store.totalSessions(), 1)
  })

  it('clearAll should remove all data', async () => {
    await store.persist('sess-a', makeBufferedEvent(1), 't-001')
    await store.persist('sess-b', makeBufferedEvent(1), 't-002')

    store.clearAll()
    assert.equal(store.totalSessions(), 0)
    assert.equal(store.has('sess-a'), false)
  })

  // ── isDegraded ──

  it('isDegraded should return true without POSTGRES_URL', () => {
    // Clear env to test default behavior
    const orig = process.env.POSTGRES_URL
    delete process.env.POSTGRES_URL

    assert.equal(store.isDegraded(), true)

    if (orig) process.env.POSTGRES_URL = orig
  })

  // ── Edge: empty session operations ──

  it('should handle operations on nonexistent session gracefully', async () => {
    assert.equal(store.size('ghost'), 0)
    assert.equal(store.has('ghost'), false)

    const after = await store.loadAfter('ghost', 1)
    assert.equal(after.length, 0)

    const history = await store.getSessionHistory('ghost', 10)
    assert.equal(history.length, 0)
  })
})
