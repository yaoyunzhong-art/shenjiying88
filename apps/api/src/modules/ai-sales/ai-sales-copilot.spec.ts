/**
 * ai-sales-copilot.service.spec.ts — AI 销售副驾服务深层测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiSalesService } from './ai-sales.service'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'

describe('AiSalesService (Complete)', () => {
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

  it('getRecommendations 应返回产品推荐列表', () => {
    const recs = service.recommendForCustomer('cust-001', { currentBrowsing: '', recentViewed: [], scenario: 'casual' })
    expect(recs).toBeInstanceOf(Array)
  })

  it('不同客户应返回不同推荐', () => {
    const recs1 = service.recommendForCustomer('cust-001', { currentBrowsing: '', recentViewed: [], scenario: 'casual' })
    const recs2 = service.recommendForCustomer('cust-002', { currentBrowsing: '', recentViewed: [], scenario: 'casual' })
    expect(recs1).not.toEqual(recs2)
  })

  it('handlePriceObjection 应返回说服话术', () => {
    const response = service.generateResponse('price', {
      customerId: 'cust-001',
      productId: 'prod-001',
      conversationHistory: [],
    })
    expect(response).toBeTruthy()
    expect(typeof response).toBe('string')
  })

  it('handleQualityObjection 应返回质量话术', () => {
    const response = service.generateResponse('quality', {
      customerId: 'cust-001',
      productId: 'prod-001',
      conversationHistory: [],
    })
    expect(response).toBeTruthy()
  })

  it('scheduleFollowUp 应创建跟进提醒', () => {
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

  it('scheduleFollowUp 不同类型的提醒应正确创建', () => {
    const types: Array<'birthday' | 'inactive' | 'price_alert' | 'reorder'> = ['birthday', 'inactive', 'price_alert', 'reorder']
    for (const type of types) {
      const reminder = service.scheduleFollowUp('cust-001', {
        salesId: 'sales-001',
        type,
        scheduledAt: new Date().toISOString(),
        message: `测试${type}`,
      })
      expect(reminder.type).toBe(type)
    }
  })

  it('getConversationSimulation 应返回模拟对话', () => {
    const sim = service.simulateConversation('价格多少', '我们的产品性价比很高')
    expect(sim.turns.length).toBeGreaterThan(0)
  })
})
