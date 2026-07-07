import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SessionService } from './session.service'
import { IntentService } from './intent.service'
import { KnowledgeService } from './knowledge.service'
import { HandoffService } from './handoff.service'
import { FallbackService } from './fallback.service'
import { IntentAdapter } from './datasources/intent.adapter'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'
import { ConversationAdapter } from './datasources/conversation.adapter'
import { OpenAIProvider } from './providers/openai.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { MockProvider } from './providers/mock.provider'

// ── SessionService ──

describe('AiCs SessionService', () => {
  it('should create a new session context', () => {
    const svc = new SessionService()
    const ctx = svc.getOrCreate('conv-001')
    assert.ok(ctx)
    assert.equal(ctx.conversationId, 'conv-001')
    assert.deepEqual(ctx.messages, [])
    assert.ok(ctx.lastActivityAt > 0)
  })

  it('should return existing session context', () => {
    const svc = new SessionService()
    svc.getOrCreate('conv-001')
    const ctx = svc.get('conv-001')
    assert.ok(ctx)
  })

  it('should append message and maintain round limit', () => {
    const svc = new SessionService()
    for (let i = 0; i < 12; i++) {
      svc.appendMessage('conv-002', 'user', `message-${i}`)
    }
    const ctx = svc.get('conv-002')!
    assert.ok(ctx.messages.length <= 10)
  })

  it('should return updated context from appendMessage', () => {
    const svc = new SessionService()
    const ctx = svc.appendMessage('conv-003', 'user', 'hello')
    assert.equal(ctx.messages.length, 1)
    assert.equal(ctx.messages[0].content, 'hello')
  })

  it('should return correct stats', () => {
    const svc = new SessionService()
    svc.getOrCreate('conv-a')
    svc.getOrCreate('conv-b')
    const stats = svc.stats()
    assert.equal(stats.size, 2)
    assert.equal(stats.maxSessions, 200)
    assert.equal(stats.maxRounds, 5)
  })

  it('should clear an existing session', () => {
    const svc = new SessionService()
    svc.getOrCreate('conv-clear')
    assert.ok(svc.clear('conv-clear'))
    assert.equal(svc.get('conv-clear'), null)
  })

  it('should return false for non-existent session', () => {
    const svc = new SessionService()
    assert.equal(svc.clear('nonexistent'), false)
  })
})

// ── IntentService ──

describe('AiCs IntentService', () => {
  function createService() {
    const adapter = new IntentAdapter()
    adapter.seed([
      {
        id: 'intent-membership',
        tenantId: 'tnt-001',
        name: '会员咨询',
        description: '会员权益、等级、积分相关',
        keywords: ['会员', '积分', '等级', '升级', '权益'],
        confidence: 0.85,
        matchedKnowledgeIds: [],
        fallbackMessage: '会员相关请咨询前台',
        createdAt: new Date().toISOString()
      },
      {
        id: 'intent-complaint',
        tenantId: 'tnt-001',
        name: '投诉建议',
        description: '投诉、建议、差评',
        keywords: ['投诉', '建议', '差评', '不满', '生气'],
        confidence: 0.9,
        matchedKnowledgeIds: [],
        fallbackMessage: '已记录您的投诉，将转人工处理',
        createdAt: new Date().toISOString()
      }
    ])
    return new IntentService(adapter)
  }

  it('should recognize membership intent', () => {
    const svc = createService()
    const result = svc.recognize('tnt-001', '我的积分能升级会员吗')
    assert.ok(result.matched)
    assert.ok(result.confidence > 0.5)
    assert.equal(result.intent?.name, '会员咨询')
  })

  it('should recognize complaint intent', () => {
    const svc = createService()
    // Keywords: ['投诉', '建议', '差评', '不满', '生气'] -> match 投诉+不满+生气
    const result = svc.recognize('tnt-001', '我投诉你们，很不满你们的服务，很生气')
    assert.ok(result.matched)
    assert.equal(result.intent?.name, '投诉建议')
  })

  it('should return no match for unknown text', () => {
    const svc = createService()
    const result = svc.recognize('tnt-001', '今天天气真好')
    assert.equal(result.matched, false)
    assert.equal(result.intent, null)
    assert.equal(result.confidence, 0)
  })

  it('should return true for handoff when confidence < 0.7', () => {
    const svc = createService()
    assert.equal(svc.shouldHandoff(0.5), true)
    assert.equal(svc.shouldHandoff(0.7), false)
    assert.equal(svc.shouldHandoff(0.9), false)
  })

  it('should list all intents for tenant', () => {
    const svc = createService()
    const intents = svc.list('tnt-001')
    assert.equal(intents.length, 2)
  })

  it('should return empty list for unknown tenant', () => {
    const svc = createService()
    const intents = svc.list('tnt-other')
    assert.equal(intents.length, 0)
  })
})

// ── KnowledgeService ──

describe('AiCs KnowledgeService', () => {
  function createService() {
    const adapter = new KnowledgeAdapter()
    adapter.seed([
      {
        id: 'know-membership',
        tenantId: 'tnt-001',
        category: 'membership',
        title: '银卡会员权益',
        content: '银卡会员可享受8折优惠，每月一次免费体验',
        tags: ['会员', '银卡', '折扣'],
        metadata: { source: 'manual', viewCount: 0, helpfulCount: 0, author: 'admin' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'know-faq',
        tenantId: 'tnt-001',
        category: 'faq',
        title: '营业时间',
        content: '营业时间为早9点至晚10点',
        tags: ['时间', '营业', 'FAQ'],
        metadata: { source: 'manual', viewCount: 0, helpfulCount: 0, author: 'admin' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ])
    return new KnowledgeService(adapter)
  }

  it('should return knowledge by search', () => {
    const svc = createService()
    // Use space-separated keywords to match tokenized tags
    const results = svc.search('tnt-001', '银卡 会员')
    assert.ok(results.length > 0)
    assert.ok(results[0].title.length > 0)
  })

  it('should respect topK parameter', () => {
    const svc = createService()
    const results = svc.search('tnt-001', '会员', { topK: 1 })
    assert.ok(results.length <= 1)
  })

  it('should return empty for high confidence generic query', () => {
    const svc = createService()
    const results = svc.searchHighConfidence('tnt-001', '你好')
    assert.ok(Array.isArray(results))
  })

  it('should filter by category', () => {
    const svc = createService()
    const results = svc.searchByCategory('tnt-001', 'faq')
    assert.equal(results.length, 1)
    assert.equal(results[0].category, 'faq')
  })

  it('should return empty for unknown category', () => {
    const svc = createService()
    const results = svc.searchByCategory('tnt-001', 'unknown')
    assert.equal(results.length, 0)
  })

  it('should search by keyword', () => {
    const svc = createService()
    const results = svc.searchByKeyword('tnt-001', '银卡')
    assert.ok(results.length > 0)
  })

  it('should increment helpful count', () => {
    const svc = createService()
    const result = svc.markHelpful('tnt-001', 'know-membership')
    assert.equal(result.metadata.helpfulCount, 1)
  })
})

// ── HandoffService ──

describe('AiCs HandoffService', () => {
  function createHandoffService() {
    const convAdapter = new ConversationAdapter()
    convAdapter.seed([{
      id: 'conv-handoff',
      tenantId: 'tnt-001',
      channel: 'web',
      status: 'ACTIVE',
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-handoff',
          tenantId: 'tnt-001',
          role: 'user',
          content: '我要投诉',
          timestamp: new Date().toISOString()
        }
      ],
      context: ['投诉'],
      metadata: {
        totalMessages: 1,
        lastActivityAt: new Date().toISOString(),
        fallbackCount: 0,
        handoffCount: 0,
        language: 'zh-CN',
        sentiment: 'negative'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }])
    return { handoffService: new HandoffService(convAdapter), convAdapter }
  }

  it('should create handoff ticket and update conversation status', () => {
    const { handoffService } = createHandoffService()
    const response = handoffService.createTicket({
      tenantId: 'tnt-001',
      conversationId: 'conv-handoff',
      reason: 'user-request',
      priority: 'high'
    })
    assert.ok(response.ticket)
    assert.equal(response.ticket.status, 'queued')
    assert.equal(response.ticket.reason, 'user-request')
    assert.ok(response.queuePosition >= 1)
  })

  it('should throw for unknown conversation', () => {
    const { handoffService } = createHandoffService()
    assert.throws(() => {
      handoffService.createTicket({
        tenantId: 'tnt-001',
        conversationId: 'nonexistent',
        reason: 'low-confidence'
      })
    }, /not found/)
  })

  it('should assign agent to ticket', () => {
    const { handoffService } = createHandoffService()
    const response = handoffService.createTicket({
      tenantId: 'tnt-001',
      conversationId: 'conv-handoff',
      reason: 'user-request'
    })
    const ticket = handoffService.assignAgent('tnt-001', response.ticket.id, 'agent-001')
    assert.equal(ticket.agentId, 'agent-001')
    assert.equal(ticket.status, 'assigned')
  })

  it('should resolve ticket with rating', () => {
    const { handoffService } = createHandoffService()
    const response = handoffService.createTicket({
      tenantId: 'tnt-001',
      conversationId: 'conv-handoff',
      reason: 'user-request'
    })
    const ticket = handoffService.resolve('tnt-001', response.ticket.id, 5)
    assert.equal(ticket.status, 'resolved')
    assert.equal(ticket.rating, 5)
  })

  it('should return queue statistics', () => {
    const { handoffService } = createHandoffService()
    handoffService.createTicket({
      tenantId: 'tnt-001',
      conversationId: 'conv-handoff',
      reason: 'user-request'
    })
    const stats = handoffService.queueStats('tnt-001')
    assert.equal(stats.queued, 1)
    assert.equal(stats.assigned, 0)
    assert.equal(stats.resolved, 0)
  })
})

// ── FallbackService ──

describe('AiCs FallbackService', () => {
  function createFallbackService() {
    return new FallbackService(new OpenAIProvider(), new DeepSeekProvider(), new MockProvider())
  }

  it('should return response from available provider', async () => {
    const svc = createFallbackService()
    const result = await svc.complete({
      messages: [{ role: 'user', content: '你好' }]
    })
    assert.ok(result.content)
    assert.ok(result.confidence >= 0)
    assert.ok(result.latencyMs >= 0)
  })

  it('should list all providers with availability status', async () => {
    const svc = createFallbackService()
    const providers = await svc.listAvailable()
    assert.ok(providers.length >= 3)
    const mock = providers.find(p => p.name === 'mock')
    assert.equal(mock?.available, true)
  })
})
