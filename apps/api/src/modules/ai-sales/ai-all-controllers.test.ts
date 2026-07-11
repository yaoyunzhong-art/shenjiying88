/**
 * ai-sales.controller.comprehensive.test.ts — AI 销售 Controller 完整测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { AiSalesController } from './ai-sales.controller'
import { AiSalesService } from './ai-sales.service'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'

function createMockRecommendationEngine(): ProductRecommendationEngine {
  return new ProductRecommendationEngine()
}

function createMockObjectionHandler(): ObjectionHandler {
  return new ObjectionHandler()
}

function createMockFollowUpScheduler(): FollowUpScheduler {
  return new FollowUpScheduler()
}

describe('AiSalesController (Complete)', () => {
  let controller: AiSalesController
  let service: AiSalesService
  let mockRecEngine: ProductRecommendationEngine
  let mockObjHandler: ObjectionHandler
  let mockFUScheduler: FollowUpScheduler

  beforeEach(() => {
    mockRecEngine = createMockRecommendationEngine()
    mockObjHandler = createMockObjectionHandler()
    mockFUScheduler = createMockFollowUpScheduler()
    service = new AiSalesService(mockRecEngine, mockObjHandler, mockFUScheduler)
    controller = new AiSalesController(mockRecEngine, mockObjHandler, mockFUScheduler)
  })

  it('should be defined', () => { expect(controller).toBeDefined() })
  it('path = "ai-sales"', () => {
    expect(Reflect.getMetadata('path', AiSalesController)).toBe('ai-sales')
  })

  it('POST /recommend should return recommendations', () => {
    const result = controller.recommend({ customerId: 'cust-001' })
    expect(result).toBeDefined()
    expect(result.recommendations).toBeDefined()
  })

  it('POST /objection/classify should handle objections', () => {
    const result = controller.classifyObjection({
      customerReply: '价格太贵了',
    })
    expect(result.type).toBeTruthy()
  })

  it('POST /objection/respond should handle objections', () => {
    const result = controller.generateResponse({
      customerId: 'cust-001',
      productId: 'prod-001',
      objectionType: 'price',
      conversationHistory: [],
    })
    expect(result.response).toBeTruthy()
  })

  it('POST /follow-up should create reminder', () => {
    const result = controller.scheduleFollowUp({
      customerId: 'cust-001',
      salesId: 's1', type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '生日快乐',
    })
    expect(result.id).toBeTruthy()
  })

  it('GET /products should return products', () => {
    const result = controller.getAllProducts()
    expect(result).toBeDefined()
  })
})

/**
 * ai-push.controller.comprehensive.test.ts — AI 推送 Controller 完整测试
 */
import { AiPushController } from '../ai-push/ai-push.controller'
import { PushTaskService } from '../ai-push/ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from '../ai-push/ai-push.service'

describe('AiPushController (Complete)', () => {
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

  describe('推送任务', () => {
    it('POST /tasks - 创建任务', () => {
      const task = controller.createTask({ title: '通知', content: '内容', channel: 'push' as any })
      expect(task.id).toBeTruthy()
    })

    it('GET /tasks - 获取列表', () => {
      controller.createTask({ title: 'T1', content: 'C1', channel: 'push' as any })
      const tasks = controller.getTasks({})
      expect(tasks.length).toBe(1)
    })

    it('GET /stats - 统计', () => {
      const stats = controller.getStats({})
      expect(stats.totalTasks).toBeGreaterThanOrEqual(0)
    })
  })

  describe('AB实验', () => {
    it('POST /experiments - 创建实验', () => {
      const exp = controller.createExperiment({
        name: '测试',
        variants: [{ name: 'A', weight: 50, config: { text: 'a' } }, { name: 'B', weight: 50, config: { text: 'b' } }],
      })
      expect(exp.variants).toHaveLength(2)
    })

    it('GET /experiments/result - 实验结果', () => {
      const exp = controller.createExperiment({
        name: '测试',
        variants: [{ name: 'A', weight: 100, config: {} }],
      })
      const result = controller.getExperimentResult(exp.id)
      expect(result).toBeDefined()
    })

    it('POST /conversion - 记录转化', () => {
      const exp = controller.createExperiment({
        name: 'T',
        variants: [{ name: 'A', weight: 100, config: {} }],
      })
      const result = controller.recordConversion({
        memberId: 'm1', experimentId: exp.id, variantName: 'A', event: 'click',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('智能推送', () => {
    it('GET /optimal-timing - 最佳时段', () => {
      const windows = controller.getOptimalTiming('push')
      expect(windows.length).toBeGreaterThan(0)
    })

    it('POST /segment-profile - 分群画像', () => {
      const profile = controller.getSegmentProfile({ type: 'behavior', id: 'active' })
      expect(profile.description).toBeTruthy()
    })
  })
})

/**
 * ai-insight.controller.comprehensive.test.ts — AI 洞察 Controller 完整测试
 */
import { AiInsightController } from '../ai-insight/ai-insight.controller'
import { AiInsightService } from '../ai-insight/ai-insight.service'

describe('AiInsightController', () => {
  let controller: AiInsightController
  let service: AiInsightService

  beforeEach(() => {
    service = new AiInsightService()
    controller = new AiInsightController(service)
  })

  it('should be defined', () => { expect(controller).toBeDefined() })
  it('path = "ai-insight"', () => {
    expect(Reflect.getMetadata('path', AiInsightController)).toBe('ai-insight')
  })

  it('GET /kpis should return KPIs', () => {
    const result = controller.getKPIs('default', {})
    expect(result.length).toBeGreaterThan(0)
  })

  it('GET /kpis/:id should return KPI detail', () => {
    const result = controller.getKPIDetail('kpi-0')
    expect(result).toBeDefined()
  })

  it('POST /reports should generate report', () => {
    const result = controller.generateReport('default', {
      type: 'revenue',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-11',
    })
    expect(result).toBeDefined()
    expect(result.id).toBeTruthy()
  })

  it('POST /anomalies/detect should detect', () => {
    const result = controller.detectAnomalies('default', {})
    expect(result).toBeInstanceOf(Array)
  })

  it('GET /dashboard should return summary', () => {
    const result = controller.getDashboardSummary('default', {})
    expect(result.tenantId).toBe('default')
  })

  it('POST /forecasts should generate trend', () => {
    const result = controller.generateForecast('default', { metric: '日营收', period: '7d' })
    expect(result.id).toBeTruthy()
  })
})
