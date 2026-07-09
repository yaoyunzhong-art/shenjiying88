import { describe, it, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SessionService } from './session.service'
import type { Message } from './ai-cs.entity'

describe('AiCs SessionService', () => {
  let svc: SessionService

  beforeEach(() => {
    svc = new SessionService()
  })

  it('should create new session context via getOrCreate', () => {
    const ctx = svc.getOrCreate('conv-001')
    assert.ok(ctx)
    assert.equal(ctx.conversationId, 'conv-001')
    assert.deepEqual(ctx.messages, [])
    assert.ok(ctx.lastActivityAt > 0)
  })

  it('should return existing session context', () => {
    svc.getOrCreate('conv-001')
    const ctx = svc.get('conv-001')
    assert.ok(ctx)
    assert.equal(ctx!.conversationId, 'conv-001')
  })

  it('should return null for non-existent session', () => {
    const ctx = svc.get('conv-nonexistent')
    assert.equal(ctx, null)
  })

  it('should append messages and maintain round limit', () => {
    for (let i = 0; i < 12; i++) {
      svc.appendMessage('conv-002', 'user', `message-${i}`)
    }
    const ctx = svc.get('conv-002')!
    // maxRounds=5 => maxMessages=10
    assert.ok(ctx.messages.length <= 10)
  })

  it('should keep system messages during sliding window', () => {
    svc.appendMessage('conv-003', 'system', 'system-context')
    for (let i = 0; i < 15; i++) {
      svc.appendMessage('conv-003', 'user', `user-msg-${i}`)
      svc.appendMessage('conv-003', 'assistant', `ai-resp-${i}`)
    }
    const ctx = svc.get('conv-003')!
    const systemMsgs = ctx.messages.filter(m => m.role === 'system')
    assert.equal(systemMsgs.length, 1)
    assert.equal(systemMsgs[0].content, 'system-context')
  })

  it('should clear session context', () => {
    svc.getOrCreate('conv-004')
    const cleared = svc.clear('conv-004')
    assert.equal(cleared, true)
    const ctx = svc.get('conv-004')
    assert.equal(ctx, null)
  })

  it('should return false when clearing non-existent session', () => {
    const cleared = svc.clear('conv-nonexistent')
    assert.equal(cleared, false)
  })

  it('should replace context with given messages', () => {
    const newMessages: Array<{ role: 'user'; content: string }> = [
      { role: 'user', content: 'hello' },
      { role: 'user', content: 'world' },
    ]
    const ctx = svc.replaceContext('conv-005', newMessages)
    assert.equal(ctx.messages.length, 2)
    assert.equal(ctx.messages[0].content, 'hello')
  })

  it('should hydrate from Message[]', () => {
    const messages: Message[] = [
      { id: 'm1', conversationId: 'conv-006', tenantId: 't-001', role: 'user', content: 'hi', timestamp: '2025-01-01T00:00:00Z' },
      { id: 'm2', conversationId: 'conv-006', tenantId: 't-001', role: 'ai', content: 'hello!', timestamp: '2025-01-01T00:00:01Z' },
    ]
    const ctx = svc.hydrateFromMessages('conv-006', messages)
    assert.equal(ctx.messages.length, 2)
    assert.equal(ctx.messages[0].role, 'user')
    assert.equal(ctx.messages[0].content, 'hi')
    assert.equal(ctx.messages[1].role, 'assistant')
    assert.equal(ctx.messages[1].content, 'hello!')
  })

  it('should expire stale contexts after TTL', () => {
    svc = new SessionService()
    svc.configure({ ttlMs: -1 }) // 过期立即失效
    svc.getOrCreate('conv-expired')
    const ctx = svc.get('conv-expired')
    assert.equal(ctx, null)
  })

  it('should configure options', () => {
    svc.configure({ maxRounds: 10, maxSessions: 100, ttlMs: 60000 })
    const stats = svc.stats()
    assert.equal(stats.maxRounds, 10)
    assert.equal(stats.maxSessions, 100)
    assert.equal(stats.ttlMs, 60000)
  })

  it('should evict LRU when exceeding maxSessions', () => {
    svc.configure({ maxSessions: 2 })
    svc.getOrCreate('conv-lru-1')
    svc.getOrCreate('conv-lru-2')
    svc.getOrCreate('conv-lru-3') // triggers eviction
    const stats = svc.stats()
    assert.equal(stats.size, 2)
    // conv-lru-1 should be evicted (oldest)
    const ctx1 = svc.get('conv-lru-1')
    assert.equal(ctx1, null)
    const ctx3 = svc.get('conv-lru-3')
    assert.ok(ctx3)
  })
})
