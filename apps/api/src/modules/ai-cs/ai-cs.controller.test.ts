import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { AiCsController } from './ai-cs.controller'
import { CSEngine } from './cs.engine'
import { SessionService } from './session.service'
import { IntentService } from './intent.service'
import { KnowledgeService } from './knowledge.service'
import { HandoffService } from './handoff.service'
import { FallbackService } from './fallback.service'
import { ConversationAdapter } from './datasources/conversation.adapter'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'
import { IntentAdapter } from './datasources/intent.adapter'
import { OpenAIProvider } from './providers/openai.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { MockProvider } from './providers/mock.provider'
import type { Conversation, Knowledge } from './ai-cs.entity'

function createController() {
  const conversationAdapter = new ConversationAdapter()
  const knowledgeAdapter = new KnowledgeAdapter()
  const intentAdapter = new IntentAdapter()
  const openAI = new OpenAIProvider()
  const deepseek = new DeepSeekProvider()
  const mock = new MockProvider()
  const sessionService = new SessionService()
  const intentService = new IntentService(intentAdapter)
  const knowledgeService = new KnowledgeService(knowledgeAdapter)
  const fallbackService = new FallbackService(openAI, deepseek, mock)
  const handoffService = new HandoffService(conversationAdapter)
  const engine = new CSEngine(
    sessionService,
    intentService,
    knowledgeService,
    fallbackService,
    handoffService,
    conversationAdapter,
    knowledgeAdapter
  )
  return new AiCsController(engine, sessionService, intentService, knowledgeService, handoffService, conversationAdapter, fallbackService)
}

describe('AiCsController', () => {
  let controller: AiCsController

  beforeEach(() => {
    controller = createController()
  })

  describe('sendMessage', () => {
    it('should send a message and return SendMessageResponse', async () => {
      const result = await controller.sendMessage({
        tenantId: 'tnt-001',
        memberId: 'mem-001',
        channel: 'web',
        content: '你好，我想咨询会员业务'
      })
      assert.ok(result.conversationId)
      assert.ok(result.message)
      assert.equal(result.message.role, 'ai')
      assert.ok(result.latencyMs >= 0)
      assert.ok(result.confidence >= 0)
    })

    it('should accept existing conversationId', async () => {
      // First message creates conversation
      const first = await controller.sendMessage({
        tenantId: 'tnt-001',
        channel: 'web',
        content: '第一轮提问'
      })
      // Second message uses existing conversation
      const second = await controller.sendMessage({
        tenantId: 'tnt-001',
        conversationId: first.conversationId,
        channel: 'web',
        content: '第二轮追问'
      })
      assert.equal(second.conversationId, first.conversationId)
    })
  })

  describe('handoff', () => {
    it('should throw for nonexistent conversation', async () => {
      const controller2 = createController()
      await assert.rejects(
        controller2.handoff({
          tenantId: 'tnt-001',
          conversationId: 'nonexistent',
          reason: 'user-request',
          priority: 'high'
        }),
        /not found/
      )
    })

    it('should handoff with all optional fields', async () => {
      // Create controller with seeded data
      const convAdapter = new ConversationAdapter()
      const conv: Conversation = {
        id: 'conv-handoff-001',
        tenantId: 'tnt-001',
        channel: 'web',
        status: 'ACTIVE',
        messages: [{
          id: 'msg-1',
          conversationId: 'conv-handoff-001',
          tenantId: 'tnt-001',
          role: 'user',
          content: '我要投诉',
          timestamp: new Date().toISOString()
        }],
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
      }
      convAdapter.seed([conv])

      const knowledgeAdapter = new KnowledgeAdapter()
      const intentAdapter = new IntentAdapter()
      const openAI = new OpenAIProvider()
      const deepseek = new DeepSeekProvider()
      const mock = new MockProvider()
      const sessionService = new SessionService()
      const intentService = new IntentService(intentAdapter)
      const knowledgeService = new KnowledgeService(knowledgeAdapter)
      const fallbackService = new FallbackService(openAI, deepseek, mock)
      const handoffService = new HandoffService(convAdapter)
      const engine = new CSEngine(
        sessionService, intentService, knowledgeService,
        fallbackService, handoffService, convAdapter, knowledgeAdapter
      )
      const ctrl = new AiCsController(engine, sessionService, intentService, knowledgeService, handoffService, convAdapter, fallbackService)

      const result = await ctrl.handoff({
        tenantId: 'tnt-001',
        conversationId: 'conv-handoff-001',
        reason: 'sentiment-negative',
        priority: 'urgent'
      })
      assert.ok(result.ticket)
      assert.equal(result.ticket.reason, 'sentiment-negative')
      assert.equal(result.ticket.priority, 'urgent')
      assert.ok(result.estimatedWaitMs >= 0)
      assert.ok(result.queuePosition >= 1)
    })
  })

  describe('health', () => {
    it('should return health status', async () => {
      const result = await controller.health()
      assert.equal(result.status, 'ok')
      assert.ok(Array.isArray(result.providers))
      assert.ok(result.timestamp)
    })
  })
})
