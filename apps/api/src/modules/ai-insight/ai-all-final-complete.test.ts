/**
 * ai-all-final-complete.test.ts — 全模块最终验证
 */
import { describe, it, expect } from 'vitest'
import { AiInsightController } from './ai-insight.controller'
import { AiInsightService } from './ai-insight.service'
import { AiSalesController } from './ai-sales.controller'
import { AiSalesService } from './ai-sales.service'

describe('Final Validation', () => {
  it('AiInsightController path', () => expect(Reflect.getMetadata('path', AiInsightController)).toBe('ai-insight'))
  it('AiSalesController path', () => expect(Reflect.getMetadata('path', AiSalesController)).toBe('ai-sales'))
  it('AiInsightService generates forecast', () => {
    const s = new AiInsightService()
    expect(s.generateForecast('default', '日营收', '7d').forecast).toHaveLength(7)
  })
  it('AiSalesService handles objections', () => {
    const s = new AiSalesService()
    expect(s.handlePriceObjection('prod-001', '太贵')).toBeTruthy()
  })
  it('AiSalesService scheduleFollowUp', () => {
    const s = new AiSalesService()
    const r = s.scheduleFollowUp({ customerId: 'c1', salesId: 's1', type: 'birthday', scheduledAt: new Date().toISOString(), message: 'Happy' })
    expect(r.type).toBe('birthday')
  })
})
