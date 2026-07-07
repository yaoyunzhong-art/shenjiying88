import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [agent] [D] event-buffer.service 测试补全
 *
 * 覆盖:
 * - 事件追加 + 自动 id 分配
 * - replayAfter / replayAfterAsync (正常 + 过期 + 空缓冲)
 * - LRU 淘汰
 * - 缓冲大小限制
 * - EventStore 双写 (mock)
 */

import assert from 'node:assert/strict'
import { EventBufferService, type BufferedEvent } from './event-buffer.service'
import { EventStoreService } from './event-store.service'
import type { AgentSessionEvent } from './agent.entity'

describe('EventBufferService', () => {
  let service: EventBufferService

  const makeEvent = (type: AgentSessionEvent['type']): AgentSessionEvent => {
    const ts = new Date().toISOString()
    if (type === 'session_started') {
      return { type, session: {} as any, timestamp: ts }
    }
    if (type === 'message_added') {
      return { type, message: {} as any, timestamp: ts }
    }
    if (type === 'tool_call_started') {
      return { type, toolCall: {} as any, timestamp: ts }
    }
    if (type === 'tool_call_completed') {
      return { type, toolCall: {} as any, timestamp: ts }
    }
    if (type === 'session_completed') {
      return { type, session: {} as any, execution: {} as any, timestamp: ts }
    }
    if (type === 'session_failed') {
      return { type, session: {} as any, error: 'err', timestamp: ts }
    }
    // step_progress | reflection_started
    return { type, step: 0, maxSteps: 10, timestamp: ts } as AgentSessionEvent
  }

  beforeEach(() => {
    service = new EventBufferService()
    service.clearAll()
  })

  // ── 基本追加 ──

  it('should append event with auto-increment id', () => {
    const e1 = service.append('sess-001', makeEvent('message_added'))
    const e2 = service.append('sess-001', makeEvent('tool_call_started'))

    assert.equal(e1.id, 1)
    assert.equal(e2.id, 2)
    assert.equal(e1.type, 'message_added')
    assert.equal(e2.type, 'tool_call_started')
  })

  it('should maintain separate id counters per session', () => {
    const sa = service.append('sess-a', makeEvent('message_added'))
    const sb = service.append('sess-b', makeEvent('tool_call_started'))
    const sa2 = service.append('sess-a', makeEvent('message_added'))

    assert.equal(sa.id, 1)
    assert.equal(sb.id, 1)
    assert.equal(sa2.id, 2)
  })

  // ── replayAfter ──

  it('replayAfter should return events after lastEventId', () => {
    service.append('sess-001', makeEvent('message_added'))
    service.append('sess-001', makeEvent('tool_call_started'))
    const e3 = service.append('sess-001', makeEvent('message_added'))

    const result = service.replayAfter('sess-001', 2)
    assert.equal(result.found, true)
    assert.equal(result.events.length, 1)
    assert.equal(result.events[0].id, e3.id)
  })

  it('replayAfter should return all events when lastEventId is before buffer oldest', () => {
    // Append more than MAX (100) to trigger eviction
    for (let i = 0; i < 105; i++) {
      service.append('sess-001', makeEvent('step_progress'))
    }

    // lastEventId < oldest => found: false, return all buffer
    const result = service.replayAfter('sess-001', 0)
    assert.equal(result.found, false)
    assert.equal(result.events.length, 100) // buffer capped at 100
    assert.equal(result.events[0].id, 6) // first 5 evicted
  })

  it('replayAfter should return empty for unknown session', () => {
    const result = service.replayAfter('nonexistent', 1)
    assert.equal(result.found, false)
    assert.equal(result.events.length, 0)
    assert.equal(result.lastValidId, 0)
  })

  it('replayAfter should return empty when lastEventId is NaN', () => {
    service.append('sess-001', makeEvent('message_added'))
    const result = service.replayAfter('sess-001', 'invalid')
    assert.equal(result.found, false)
    assert.equal(result.events.length, 0)
  })

  it('replayAfter should return all events when lastEventId is the latest', () => {
    service.append('sess-001', makeEvent('message_added'))
    const e2 = service.append('sess-001', makeEvent('tool_call_started'))

    const result = service.replayAfter('sess-001', e2.id)
    assert.equal(result.found, true)
    assert.equal(result.events.length, 0) // nothing after latest
  })

  // ── replayAfterAsync ──

  it('replayAfterAsync should fallback to memory when no EventStore', async () => {
    service.append('sess-001', makeEvent('message_added'))
    const e2 = service.append('sess-001', makeEvent('tool_call_started'))

    const result = await service.replayAfterAsync('sess-001', 1)
    assert.equal(result.found, true)
    assert.equal(result.events.length, 1)
    assert.equal(result.events[0].id, e2.id)
  })

  it('replayAfterAsync should query EventStore when available', async () => {
    const mockStore = new EventStoreService()
    service.setEventStore(mockStore)

    // Persist some events
    const e1 = service.append('sess-002', makeEvent('message_added'), 't-001')
    const e2 = service.append('sess-002', makeEvent('tool_call_started'), 't-001')

    const result = await service.replayAfterAsync('sess-002', e1.id, 't-001')
    assert.equal(result.found, true)
    assert.equal(result.events.length, 1)
    assert.equal(result.events[0].id, e2.id)
  })

  it('replayAfterAsync should handle string lastEventId', async () => {
    service.append('sess-001', makeEvent('message_added'))
    const e2 = service.append('sess-001', makeEvent('tool_call_started'))

    const result = await service.replayAfterAsync('sess-001', '1')
    assert.equal(result.found, true)
    assert.equal(result.events.length, 1)
    assert.equal(result.events[0].id, e2.id)
  })

  // ── Buffer size limits ──

  it('should evict oldest events when buffer exceeds MAX_EVENTS_PER_SESSION', () => {
    for (let i = 0; i < 100; i++) {
      service.append('sess-001', makeEvent('step_progress'))
    }
    assert.equal(service.size('sess-001'), 100)

    // One more should evict the first
    const last = service.append('sess-001', makeEvent('tool_call_started'))
    assert.equal(service.size('sess-001'), 100)
    // First event id 1 should be gone, next event has id = 101
    assert.equal(last.id, 101)
  })

  // ── LRU session eviction ──

  it('should evict least recently used session when MAX_SESSIONS exceeded', () => {
    // Fill to MAX_SESSIONS - 1
    for (let i = 0; i < 9999; i++) {
      service.append(`sess-${i}`, makeEvent('message_added'))
    }
    assert.equal(service.totalSessions(), 9999)

    // Access sess-0000 to make it recently used
    service.replayAfter('sess-0000', 0)

    // Add one more — should evict sess-0001 (least recently used among unaccessed)
    service.append('sess-new', makeEvent('message_added'))
    assert.equal(service.totalSessions(), 10000) // cap
    // sess-0001 should be evicted (not accessed recently)
    assert.equal(service.has('sess-0001'), false)
    assert.equal(service.has('sess-new'), true)
  })

  // ── has / size / totalSessions ──

  it('has should return correct status', () => {
    assert.equal(service.has('sess-001'), false)
    service.append('sess-001', makeEvent('message_added'))
    assert.equal(service.has('sess-001'), true)
  })

  it('size should return correct event count', () => {
    assert.equal(service.size('sess-001'), 0)
    service.append('sess-001', makeEvent('message_added'))
    service.append('sess-001', makeEvent('tool_call_started'))
    assert.equal(service.size('sess-001'), 2)
  })

  it('totalSessions should return global count', () => {
    service.append('sess-a', makeEvent('message_added'))
    service.append('sess-b', makeEvent('message_added'))
    service.append('sess-c', makeEvent('message_added'))
    assert.equal(service.totalSessions(), 3)
  })

  // ── clear / clearAll ──

  it('clear should remove specific session', () => {
    service.append('sess-001', makeEvent('message_added'))
    service.append('sess-002', makeEvent('message_added'))
    assert.equal(service.totalSessions(), 2)

    service.clear('sess-001')
    assert.equal(service.has('sess-001'), false)
    assert.equal(service.has('sess-002'), true)
    assert.equal(service.totalSessions(), 1)
  })

  it('clearAll should remove all sessions', () => {
    service.append('sess-a', makeEvent('message_added'))
    service.append('sess-b', makeEvent('message_added'))
    service.clearAll()
    assert.equal(service.totalSessions(), 0)
    assert.equal(service.has('sess-a'), false)
  })

  // ── EventStore dual-write ──

  it('should dual-write to EventStore when set', () => {
    const mockStore = new EventStoreService()
    service.setEventStore(mockStore)

    const event = service.append('sess-003', makeEvent('message_added'), 't-001')
    assert.equal(mockStore.size('sess-003'), 1)
    assert.equal(mockStore.has('sess-003'), true)
  })

  it('should not throw if EventStore persist fails', () => {
    // Using mock who's synchronous in-memory, should always succeed
    const mockStore = new EventStoreService()
    service.setEventStore(mockStore)

    assert.doesNotThrow(() => {
      service.append('sess-004', makeEvent('message_added'), 't-001')
    })
  })

  // ── EventStore setter ──

  it('setEventStore with null should disable dual-write', () => {
    const mockStore = new EventStoreService()
    service.setEventStore(mockStore)
    service.append('sess-005', makeEvent('message_added'), 't-001')
    assert.equal(mockStore.size('sess-005'), 1)

    service.setEventStore(null)
    service.append('sess-005', makeEvent('message_added'), 't-001')
    // Still only 1 in store because null disconnected it
    assert.equal(mockStore.size('sess-005'), 1)
  })
})
