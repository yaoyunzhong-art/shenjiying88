/**
 * ai-sales.service.spec.ts — 扩展版 AI 销售 Service 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiSalesService } from './ai-sales.service'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'

describe('AiSalesService', () => {
  let service: AiSalesService
  let recEngine: ProductRecommendationEngine
  let objHandler: ObjectionHandler
  let fuScheduler: FollowUpScheduler

  beforeEach(() => {
    recEngine = new ProductRecommendationEngine()
    objHandler = new ObjectionHandler()
    fuScheduler = new FollowUpScheduler()
    service = new AiSalesService(recEngine, objHandler, fuScheduler)
  })

  describe('getRecommendations', () => {
    it('应基于客户画像返回产品推荐', () => {
      const recs = service.recommendForCustomer('cust-001', { currentBrowsing: '', recentViewed: [], scenario: 'casual' })
      expect(recs).toBeInstanceOf(Array)
    })
  })

  describe('handlePriceObjection', () => {
    it('应返回价格异议回复策略', () => {
      const response = service.generateResponse('price', {
        customerId: 'cust-001',
        productId: 'prod-001',
        conversationHistory: [],
      })
      expect(response).toBeDefined()
      expect(typeof response).toBe('string')
    })
  })

  describe('scheduleFollowUp', () => {
    it('应创建跟进提醒', () => {
      const reminder = service.scheduleFollowUp('cust-001', {
        salesId: 'sales-001',
        type: 'birthday',
        scheduledAt: new Date().toISOString(),
        message: '生日快乐！',
      })
      expect(reminder).toBeDefined()
      expect(reminder.id).toBeTruthy()
      expect(reminder.status).toBe('pending')
    })
  })
})
