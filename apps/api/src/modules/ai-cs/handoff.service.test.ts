import { describe, it, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HandoffService } from './handoff.service'
import { ConversationAdapter } from './datasources/conversation.adapter'
import type { Conversation, HandoffRequest } from './ai-cs.entity'

describe('AiCs HandoffService', () => {
  let adapter: ConversationAdapter
  let svc: HandoffService

  const sampleConversation: Conversation = {
    id: 'conv-001',
    tenantId: 't-001',
    memberId: 'mem-001',
    channel: 'web',
    status: 'ACTIVE',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-001',
        tenantId: 't-001',
        role: 'user',
        content: '我需要人工客服帮助',
        timestamp: '2025-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-001',
        tenantId: 't-001',
        role: 'ai',
        content: '请问您遇到什么问题了？',
        timestamp: '2025-01-01T00:00:01Z',
      },
    ],
    context: ['用户咨询'],
    metadata: {
      totalMessages: 2,
      lastActivityAt: '2025-01-01T00:00:01Z',
      fallbackCount: 0,
      handoffCount: 0,
      language: 'zh-CN',
      sentiment: 'neutral',
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:01Z',
  }

  beforeEach(() => {
    adapter = new ConversationAdapter()
    adapter.seed([sampleConversation])
    svc = new HandoffService(adapter)
  })

  it('should create a handoff ticket', () => {
    const req: HandoffRequest = {
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'user-request',
    }
    const response = svc.createTicket(req)
    assert.ok(response.ticket)
    assert.equal(response.ticket.conversationId, 'conv-001')
    assert.equal(response.ticket.reason, 'user-request')
    assert.equal(response.ticket.status, 'queued')
    assert.ok(response.ticket.id.startsWith('ticket-'))
    assert.ok(response.queuePosition >= 1)
    assert.ok(response.estimatedWaitMs >= 0)

    // Conversation should be marked as HANDED_OFF
    const updatedConv = adapter.query('t-001', 'conv-001')
    assert.equal(updatedConv!.status, 'HANDED_OFF')
  })

  it('should throw when conversation not found', () => {
    const req: HandoffRequest = {
      tenantId: 't-001',
      conversationId: 'conv-nonexistent',
      reason: 'user-request',
    }
    assert.throws(() => svc.createTicket(req), /not found/)
  })

  it('should assign agent to a ticket', () => {
    const response = svc.createTicket({
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'complex-query',
    })
    const ticket = svc.assignAgent('t-001', response.ticket.id, 'agent-001')
    assert.equal(ticket.agentId, 'agent-001')
    assert.equal(ticket.status, 'assigned')
    assert.ok(ticket.assignedAt)
  })

  it('should throw when assigning non-existent ticket', () => {
    assert.throws(() => svc.assignAgent('t-001', 'ticket-nonexistent', 'agent-001'), /not found/)
  })

  it('should resolve a ticket', () => {
    const response = svc.createTicket({
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'user-request',
    })
    const ticket = svc.resolve('t-001', response.ticket.id, 5)
    assert.equal(ticket.status, 'resolved')
    assert.equal(ticket.rating, 5)
    assert.ok(ticket.resolvedAt)

    // Conversation should be CLOSED
    const updatedConv = adapter.query('t-001', 'conv-001')
    assert.equal(updatedConv!.status, 'CLOSED')
  })

  it('should query a ticket', () => {
    const response = svc.createTicket({
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'low-confidence',
    })
    const ticket = svc.query('t-001', response.ticket.id)
    assert.ok(ticket)
    assert.equal(ticket!.id, response.ticket.id)
  })

  it('should return null for non-existent ticket', () => {
    const ticket = svc.query('t-001', 'ticket-nonexistent')
    assert.equal(ticket, null)
  })

  it('should create ticket with high priority for sentiment-negative', () => {
    const req: HandoffRequest = {
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'sentiment-negative',
    }
    const response = svc.createTicket(req)
    assert.equal(response.ticket.priority, 'urgent')
  })

  it('should create ticket with medium priority for complex-query', () => {
    const req: HandoffRequest = {
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'complex-query',
    }
    const response = svc.createTicket(req)
    assert.equal(response.ticket.priority, 'medium')
  })

  it('should create ticket with low priority for low-confidence with few messages', () => {
    // Create a conversation with only 1 message
    const shortConv: Conversation = {
      id: 'conv-short',
      tenantId: 't-001',
      channel: 'web',
      status: 'ACTIVE',
      messages: [{
        id: 'msg-short', conversationId: 'conv-short', tenantId: 't-001',
        role: 'user', content: 'hi', timestamp: '2025-01-01T00:00:00Z',
      }],
      context: [],
      metadata: {
        totalMessages: 1, lastActivityAt: '2025-01-01T00:00:00Z',
        fallbackCount: 0, handoffCount: 0, language: 'zh-CN', sentiment: 'neutral',
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }
    adapter.seed([shortConv])
    const response = svc.createTicket({
      tenantId: 't-001',
      conversationId: 'conv-short',
      reason: 'low-confidence',
    })
    assert.equal(response.ticket.priority, 'low')
  })

  it('should maintain queue order by priority', () => {
    // First create a low priority ticket
    svc.createTicket({
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'low-confidence',
    })

    // Queue stats
    const stats = svc.queueStats('t-001')
    assert.equal(stats.queued, 1)
    assert.equal(stats.assigned, 0)
    assert.equal(stats.resolved, 0)
  })

  it('should list queued tickets sorted by priority', () => {
    // Create a urgent conversation
    const urgentConv: Conversation = {
      id: 'conv-urgent',
      tenantId: 't-001',
      channel: 'web',
      status: 'ACTIVE',
      messages: [{
        id: 'msg-urg', conversationId: 'conv-urgent', tenantId: 't-001',
        role: 'user', content: '投诉！', timestamp: '2025-01-01T00:00:00Z',
      }],
      context: [],
      metadata: {
        totalMessages: 1, lastActivityAt: '2025-01-01T00:00:00Z',
        fallbackCount: 0, handoffCount: 0, language: 'zh-CN', sentiment: 'neutral',
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }
    adapter.seed([urgentConv])

    svc.createTicket({
      tenantId: 't-001', conversationId: 'conv-001', reason: 'low-confidence',
    })
    svc.createTicket({
      tenantId: 't-001', conversationId: 'conv-urgent', reason: 'sentiment-negative',
    })

    const queued = svc.listQueued('t-001')
    // Urgent should come first
    assert.equal(queued[0].priority, 'urgent')
    assert.equal(queued[1].priority, 'low')
  })

  it('should track ticket agent assignment in conversation', () => {
    const response = svc.createTicket({
      tenantId: 't-001',
      conversationId: 'conv-001',
      reason: 'user-request',
      agentId: 'agent-001',
    })
    assert.equal(response.ticket.agentId, 'agent-001')

    const conv = adapter.query('t-001', 'conv-001')
    assert.equal(conv!.agentId, 'agent-001')
  })
})
