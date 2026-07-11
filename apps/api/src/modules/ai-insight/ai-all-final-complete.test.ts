/**
 * ai-all-final-complete.test.ts — 全模块最终验证
 */
import { describe, it, expect } from 'vitest'
import { AiInsightController } from './ai-insight.controller'
import { AiInsightService } from './ai-insight.service'
import { AiSalesController } from '../ai-sales/ai-sales.controller'
import { AiSalesService } from '../ai-sales/ai-sales.service'
import { ProductRecommendationEngine, ObjectionHandler, FollowUpScheduler } from '../ai-sales/ai-sales-copilot.service'

describe('Final Validation', () => {
  it('AiInsightController path', () => expect(Reflect.getMetadata('path', AiInsightController)).toBe('ai-insight'))
  it('AiSalesController path', () => expect(Reflect.getMetadata('path', AiSalesController)).toBe('ai-sales'))
  it('AiInsightService generates forecast', () => {
    const s = new AiInsightService()
    expect(s.generateForecast('default', '日营收', '7d').forecast).toHaveLength(7)
  })
  it('AiSalesService handles objections', () => {
    const s = new AiSalesService(new ProductRecommendationEngine(), new ObjectionHandler(), new FollowUpScheduler())
    expect(s.generateResponse('price', { customerId: 'cust-001', productId: 'prod-001', conversationHistory: ['太贵'] })).toBeTruthy()
  })
  it('AiSalesService scheduleFollowUp', () => {
    const s = new AiSalesService(new ProductRecommendationEngine(), new ObjectionHandler(), new FollowUpScheduler())
    const r = s.scheduleFollowUp('c1', { salesId: 's1', type: 'birthday', scheduledAt: new Date().toISOString(), message: 'Happy' })
    expect(r.type).toBe('birthday')
  })
})
