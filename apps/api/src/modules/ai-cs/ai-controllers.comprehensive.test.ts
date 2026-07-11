/**
 * ai-cs.controller.test.ts — AI 客服 Controller 扩展测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { AiCsController } from './ai-cs.controller'
import { AiCsService } from './ai-cs.service'
import { CsEngine } from './cs.engine'
import { IntentService } from './intent.service'
import { SessionService } from './session.service'
import { KnowledgeService } from './knowledge.service'
import { FallbackService } from './fallback.service'
import { HandoffService } from './handoff.service'

describe('AiCsController', () => {
  let controller: AiCsController
  let csService: AiCsService

  beforeEach(() => {
    const intentService = new IntentService()
    const sessionService = new SessionService()
    const knowledgeService = new KnowledgeService()
    const fallbackService = new FallbackService()
    const handoffService = new HandoffService()
    const csEngine = new CsEngine(intentService, sessionService, knowledgeService, fallbackService, handoffService)
    csService = new AiCsService(csEngine, intentService, sessionService, knowledgeService, fallbackService, handoffService)
    controller = new AiCsController(csService)
  })

  it('should be defined', () => { expect(controller).toBeDefined() })
  it('path = "ai-cs"', () => {
    expect(Reflect.getMetadata('path', AiCsController)).toBe('ai-cs')
  })

  it('POST /message should return reply', () => {
    const result = controller.sendMessage({ sessionId: 's1', message: '你好' })
    expect(result).toBeDefined()
    expect(result.reply).toBeTruthy()
  })

  it('POST /handoff should return agent info', () => {
    const result = controller.requestHandoff({ sessionId: 's1', reason: '复杂问题' })
    expect(result).toBeDefined()
    expect(result.agentName).toBeTruthy()
  })

  it('GET /sessions/:id should return session', () => {
    controller.sendMessage({ sessionId: 's2', message: '测试' })
    const result = controller.getSession('s2')
    expect(result).toBeDefined()
    expect(result.sessionId).toBe('s2')
  })

  it('GET /intent should classify intent', () => {
    const result = controller.classifyIntent({} as any, '如何退货？' as any)
    expect(result).toBeDefined()
  })
})

/**
 * ai-sales.controller.test.ts — AI 销售 Controller 扩展测试
 */
import { AiSalesController } from './ai-sales.controller'
import { AiSalesService } from './ai-sales.service'
import { MarketingROIService, CopywritingAssistant, CampaignPlanner, AIMarketingCMOService } from './ai-marketing-cmo.service'

describe('AiSalesController', () => {
  let controller: AiSalesController
  let salesService: AiSalesService

  beforeEach(() => {
    salesService = new AiSalesService()
    controller = new AiSalesController(salesService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('POST /recommend should return product recommendations', () => {
    const result = controller.getRecommendations({ customerId: 'cust-001' })
    expect(result).toBeDefined()
    expect(result.recommendations).toBeDefined()
  })

  it('POST /objection-handler should handle price objection', () => {
    const result = controller.handleObjection({ customerId: 'cust-001', productId: 'prod-001', objectionType: 'price' })
    expect(result).toBeDefined()
    expect(result.response).toBeTruthy()
  })

  it('POST /follow-up should schedule reminder', () => {
    const result = controller.scheduleFollowUp({
      customerId: 'cust-001', salesId: 's1',
      type: 'birthday', scheduledAt: new Date().toISOString(),
      message: '生日快乐',
    })
    expect(result).toBeDefined()
    expect(result.reminderId).toBeTruthy()
  })

  it('GET /knowledge should return knowledge base', () => {
    const result = controller.getKnowledgeBase({} as any, { query: '价格' } as any)
    expect(result).toBeDefined()
  })
})

/**
 * ai-push.controller.test.ts — AI 推送 Controller 扩展测试
 */
import { AiPushController } from './ai-push.controller'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

describe('AiPushController', () => {
  let controller: AiPushController
  let pushTaskService: PushTaskService
  let segmentationService: MemberSegmentationService
  let timingService: OptimalTimingService
  let abTestService: ABTestService

  beforeEach(() => {
    pushTaskService = new PushTaskService()
    segmentationService = new MemberSegmentationService()
    timingService = new OptimalTimingService()
    abTestService = new ABTestService()
    controller = new AiPushController(pushTaskService, segmentationService, timingService, abTestService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('POST /tasks should create push task', () => {
    const result = controller.createTask({
      title: '促销通知', content: '大促来了',
      channel: 'push' as any,
    })
    expect(result).toBeDefined()
    expect(result.id).toBeTruthy()
    expect(result.title).toBe('促销通知')
  })

  it('GET /tasks should list tasks', () => {
    controller.createTask({ title: 'T1', content: 'C1', channel: 'push' as any })
    controller.createTask({ title: 'T2', content: 'C2', channel: 'sms' as any })
    const tasks = controller.getTasks({})
    expect(tasks.length).toBe(2)
  })

  it('GET /stats should return stats', () => {
    controller.createTask({ title: 'T', content: 'C', channel: 'push' as any })
    const stats = controller.getStats({})
    expect(stats.totalTasks).toBe(1)
  })

  it('POST /experiments should create experiment', () => {
    const result = controller.createExperiment({
      name: '测试实验',
      variants: [
        { name: 'A', weight: 50, config: {} },
        { name: 'B', weight: 50, config: {} },
      ],
    })
    expect(result.id).toBeTruthy()
    expect(result.variants).toHaveLength(2)
  })

  it('GET /experiments/result should return result', () => {
    const exp = controller.createExperiment({
      name: '测试', variants: [{ name: 'A', weight: 100, config: {} }],
    })
    const result = controller.getExperimentResult(exp.id)
    expect(result).toBeDefined()
  })

  it('POST /conversion should record conversion', () => {
    const exp = controller.createExperiment({
      name: '测试', variants: [{ name: 'A', weight: 100, config: {} }],
    })
    const result = controller.recordConversion({
      memberId: 'm1', experimentId: exp.id,
      variantName: 'A', event: 'conversion',
    })
    expect(result.success).toBe(true)
  })

  it('GET /optimal-timing should return windows', () => {
    const result = controller.getOptimalTiming('push')
    expect(result.length).toBeGreaterThan(0)
  })

  it('GET /segment-profile should return profile', () => {
    const result = controller.getSegmentProfile({ type: 'behavior', id: 'newcomer' })
    expect(result.description).toBeTruthy()
  })
})
