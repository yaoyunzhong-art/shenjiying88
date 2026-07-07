import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert'
import type {
  Message,
  Conversation,
  Knowledge,
  Intent,
  HandoffTicket,
  SendMessageRequest,
  SendMessageResponse,
  HandoffRequest,
  HandoffResponse,
  AIProviderRequest,
  AIProviderResponse,
  SessionContext,
  SessionCacheOptions
} from './ai-cs.entity'

describe('AiCs entity types', () => {
  describe('Message', () => {
    it('should create a valid user message', () => {
      const msg: Message = {
        id: 'msg-001',
        conversationId: 'conv-001',
        tenantId: 'tnt-001',
        role: 'user',
        content: '你好',
        timestamp: '2026-06-28T03:00:00.000Z'
      }
      assert.equal(msg.role, 'user')
      assert.equal(msg.content, '你好')
    })

    it('should create a valid AI message with metadata', () => {
      const msg: Message = {
        id: 'msg-002',
        conversationId: 'conv-001',
        tenantId: 'tnt-001',
        role: 'ai',
        content: '您好，有什么可以帮您？',
        timestamp: '2026-06-28T03:00:01.000Z',
        metadata: {
          provider: 'mock',
          intent: 'greeting',
          confidence: 0.9,
          tokens: 15,
          latencyMs: 200
        }
      }
      assert.equal(msg.role, 'ai')
      assert.ok(msg.metadata)
      assert.equal(msg.metadata?.confidence, 0.9)
    })

    it('should support all message roles', () => {
      const roles: Array<Message['role']> = ['user', 'ai', 'human-agent', 'system']
      for (const role of roles) {
        const msg: Message = {
          id: `msg-${role}`,
          conversationId: 'conv-001',
          tenantId: 'tnt-001',
          role,
          content: 'test',
          timestamp: new Date().toISOString()
        }
        assert.equal(msg.role, role)
      }
    })
  })

  describe('Conversation', () => {
    it('should create a valid conversation', () => {
      const conv: Conversation = {
        id: 'conv-001',
        tenantId: 'tnt-001',
        memberId: 'mem-001',
        channel: 'web',
        status: 'ACTIVE',
        messages: [],
        context: [],
        metadata: {
          totalMessages: 0,
          lastActivityAt: new Date().toISOString(),
          fallbackCount: 0,
          handoffCount: 0,
          language: 'zh-CN',
          sentiment: 'neutral'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      assert.equal(conv.status, 'ACTIVE')
      assert.equal(conv.channel, 'web')
    })

    it('should support all conversation statuses', () => {
      const statuses: Array<Conversation['status']> = ['ACTIVE', 'PENDING', 'HANDED_OFF', 'CLOSED', 'ARCHIVED']
      for (const status of statuses) {
        const conv: Conversation = {
          id: `conv-${status}`,
          tenantId: 'tnt-001',
          channel: 'web',
          status,
          messages: [],
          context: [],
          metadata: {
            totalMessages: 0,
            lastActivityAt: new Date().toISOString(),
            fallbackCount: 0,
            handoffCount: 0,
            language: 'zh-CN',
            sentiment: 'neutral'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        assert.equal(conv.status, status)
      }
    })

    it('should support all conversation channels', () => {
      const channels: Array<Conversation['channel']> = ['web', 'mobile', 'wechat', 'email', 'phone']
      for (const channel of channels) {
        const conv: Conversation = {
          id: `conv-${channel}`,
          tenantId: 'tnt-001',
          channel,
          status: 'ACTIVE',
          messages: [],
          context: [],
          metadata: {
            totalMessages: 0,
            lastActivityAt: new Date().toISOString(),
            fallbackCount: 0,
            handoffCount: 0,
            language: 'zh-CN',
            sentiment: 'neutral'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        assert.equal(conv.channel, channel)
      }
    })
  })

  describe('Knowledge', () => {
    it('should create a valid knowledge entry', () => {
      const knowledge: Knowledge = {
        id: 'know-001',
        tenantId: 'tnt-001',
        category: 'membership',
        title: '银卡会员权益',
        content: '银卡会员可享受8折优惠',
        tags: ['会员', '银卡'],
        metadata: {
          source: 'manual',
          viewCount: 100,
          helpfulCount: 25
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      assert.equal(knowledge.category, 'membership')
      assert.ok(knowledge.tags.includes('会员'))
    })

    it('should support optional vector field', () => {
      const knowledge: Knowledge = {
        id: 'know-002',
        tenantId: 'tnt-001',
        category: 'faq',
        title: '营业时间',
        content: '9:00-22:00',
        tags: [],
        vector: [0.1, 0.2, 0.3],
        metadata: { viewCount: 0, helpfulCount: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      assert.ok(knowledge.vector)
      assert.equal(knowledge.vector!.length, 3)
    })
  })

  describe('Intent', () => {
    it('should create a valid intent', () => {
      const intent: Intent = {
        id: 'intent-001',
        tenantId: 'tnt-001',
        name: '会员咨询',
        description: '会员相关咨询',
        keywords: ['会员', '积分', '升级'],
        confidence: 0.85,
        matchedKnowledgeIds: ['know-001'],
        fallbackMessage: '请联系前台',
        createdAt: new Date().toISOString()
      }
      assert.equal(intent.name, '会员咨询')
      assert.equal(intent.confidence, 0.85)
    })
  })

  describe('HandoffTicket', () => {
    it('should create a valid handoff ticket', () => {
      const ticket: HandoffTicket = {
        id: 'ticket-001',
        tenantId: 'tnt-001',
        conversationId: 'conv-001',
        reason: 'user-request',
        priority: 'high',
        status: 'queued',
        summary: '用户主动要求转人工',
        lastUserMessage: '我要找人工客服',
        context: [],
        createdAt: new Date().toISOString()
      }
      assert.equal(ticket.status, 'queued')
      assert.equal(ticket.priority, 'high')
    })

    it('should support all handoff reasons', () => {
      const reasons: Array<HandoffTicket['reason']> = ['low-confidence', 'user-request', 'complex-query', 'sentiment-negative']
      for (const reason of reasons) {
        const ticket: HandoffTicket = {
          id: `ticket-${reason}`,
          tenantId: 'tnt-001',
          conversationId: 'conv-001',
          reason,
          priority: 'medium',
          status: 'resolved',
          summary: 'test',
          lastUserMessage: 'test',
          context: [],
          createdAt: new Date().toISOString(),
          resolvedAt: new Date().toISOString(),
          rating: 5
        }
        assert.equal(ticket.reason, reason)
      }
    })
  })

  describe('SendMessageRequest', () => {
    it('should create a valid send message request', () => {
      const req: SendMessageRequest = {
        tenantId: 'tnt-001',
        conversationId: 'conv-001',
        memberId: 'mem-001',
        channel: 'wechat',
        content: '你好',
        options: {
          forceHandoff: false,
          language: 'zh-CN'
        }
      }
      assert.equal(req.channel, 'wechat')
      assert.ok(req.options)
    })
  })

  describe('AIProviderResponse', () => {
    it('should create a valid provider response', () => {
      const resp: AIProviderResponse = {
        content: '您好',
        confidence: 0.9,
        provider: 'mock',
        tokensUsed: 10,
        latencyMs: 100,
        cached: false,
        finishReason: 'stop'
      }
      assert.equal(resp.finishReason, 'stop')
      assert.equal(resp.cached, false)
    })

    it('should support error finish reason', () => {
      const resp: AIProviderResponse = {
        content: '',
        confidence: 0,
        provider: 'deepseek',
        tokensUsed: 0,
        latencyMs: 5000,
        cached: false,
        finishReason: 'error'
      }
      assert.equal(resp.finishReason, 'error')
    })
  })

  describe('SessionContext and SessionCacheOptions', () => {
    it('should create session context', () => {
      const ctx: SessionContext = {
        conversationId: 'conv-001',
        messages: [{ role: 'user', content: '你好' }],
        lastActivityAt: Date.now()
      }
      assert.equal(ctx.messages.length, 1)
    })

    it('should create session cache options with defaults', () => {
      const opts: SessionCacheOptions = {
        maxRounds: 5,
        maxSessions: 200,
        ttlMs: 1800000
      }
      assert.equal(opts.ttlMs, 1800000) // 30min
    })
  })
})
