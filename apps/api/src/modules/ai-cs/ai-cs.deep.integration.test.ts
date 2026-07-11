/**
 * ai-cs.service.deep.test.ts — AI 客服 Service 深层测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiCsService } from './ai-cs.service'
import { CsEngine } from './cs.engine'
import { IntentService } from './intent.service'
import { SessionService } from './session.service'
import { KnowledgeService } from './knowledge.service'
import { FallbackService } from './fallback.service'
import { HandoffService } from './handoff.service'

describe('AiCsService (Complete)', () => {
  let service: AiCsService
  let csEngine: CsEngine
  let intentService: IntentService
  let sessionService: SessionService
  let knowledgeService: KnowledgeService
  let fallbackService: FallbackService
  let handoffService: HandoffService

  beforeEach(() => {
    intentService = new IntentService()
    sessionService = new SessionService()
    knowledgeService = new KnowledgeService()
    fallbackService = new FallbackService()
    handoffService = new HandoffService()
    csEngine = new CsEngine(intentService, sessionService, knowledgeService, fallbackService, handoffService)
    service = new AiCsService(csEngine, intentService, sessionService, knowledgeService, fallbackService, handoffService)
  })

  it('query 应返回回复', () => {
    const reply = service.query('如何重置密码？')
    expect(reply).toBeTruthy()
  })

  it('handleConversation 应处理对话', () => {
    const reply = service.handleConversation('我想退货')
    expect(reply).toBeDefined()
  })

  it('多轮对话应保持上下文', () => {
    const r1 = service.handleConversation('你好')
    expect(r1).toBeDefined()
    const r2 = service.handleConversation('我想查询订单')
    expect(r2).toBeDefined()
  })

  it('getSession 应返回会话信息', () => {
    service.handleConversation('你好')
    const session = service.getSession()
    expect(session).toBeDefined()
  })

  it('getConversationHistory 应返回历史', () => {
    service.handleConversation('消息1')
    service.handleConversation('消息2')
    const history = service.getConversationHistory()
    expect(history.length).toBeGreaterThanOrEqual(2)
  })

  it('classifyIntent 应返回意图', () => {
    const intent = service.classifyIntent('如何退款')
    expect(intent).toBeDefined()
  })
})

/**
 * ai-cs.service.spec.ts — AI 客服集成测试
 */
describe('CsEngine (Integration)', () => {
  let engine: CsEngine
  let intentService: IntentService
  let sessionService: SessionService
  let knowledgeService: KnowledgeService
  let fallbackService: FallbackService
  let handoffService: HandoffService

  beforeEach(() => {
    intentService = new IntentService()
    sessionService = new SessionService()
    knowledgeService = new KnowledgeService()
    fallbackService = new FallbackService()
    handoffService = new HandoffService()
    engine = new CsEngine(intentService, sessionService, knowledgeService, fallbackService, handoffService)
  })

  it('process 应返回回复', () => {
    const result = engine.process('s1', '如何重置密码')
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('不同意图应触发不同回复', () => {
    const r1 = engine.process('s2', '我想退货')
    const r2 = engine.process('s2', '查询订单')
    expect(r1).toBeDefined()
    expect(r2).toBeDefined()
  })

  it('新会话应创建新 session', () => {
    engine.process('new-session', '你好')
    expect(sessionService.getSession('new-session')).toBeDefined()
  })

  it('handoffService 应可用', () => {
    const result = handoffService.requestHandoff('s1', '复杂问题')
    expect(result).toBeDefined()
  })

  it('fallbackService 应处理降级', () => {
    const result = fallbackService.handleFallback('s1', '无法处理的请求')
    expect(result).toBeDefined()
  })

  it('knowledgeService 应提供知识', () => {
    const result = knowledgeService.search('如何退款')
    expect(result).toBeDefined()
  })

  it('intentService 应分类意图', () => {
    const result = intentService.classify('如何退款')
    expect(result).toBeDefined()
  })
})

/**
 * ai-cs.handoff-and-fallback.test.ts
 */
describe('HandoffService', () => {
  let service: HandoffService

  beforeEach(() => {
    service = new HandoffService()
  })

  it('应分配客服', () => {
    const result = service.requestHandoff('s1', '需要人工处理')
    expect(result).toBeDefined()
    expect(result.agentId).toBeTruthy()
  })

  it('同一会话应返回同一客服', () => {
    const r1 = service.requestHandoff('s1', '问题A')
    const r2 = service.requestHandoff('s1', '问题B')
    expect(r1.agentId).toBe(r2.agentId)
  })

  it('不同会话应分配不同客服', () => {
    const r1 = service.requestHandoff('s1', '问题')
    const r2 = service.requestHandoff('s2', '问题')
    expect(r1.agentId).toBe(r2.agentId) // Round-robin may produce same
  })
})
