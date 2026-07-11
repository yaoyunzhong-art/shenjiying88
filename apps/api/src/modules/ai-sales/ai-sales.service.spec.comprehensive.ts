/**
 * ai-sales.service.spec.ts — 扩展版 AI 销售 Service 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiSalesService } from './ai-sales.service'

describe('AiSalesService', () => {
  let service: AiSalesService

  beforeEach(() => {
    service = new AiSalesService()
  })

  describe('getRecommendations', () => {
    it('应基于客户画像返回产品推荐', () => {
      const recs = service.getRecommendations('cust-001')
      expect(recs).toBeInstanceOf(Array)
    })
  })

  describe('handlePriceObjection', () => {
    it('应返回价格异议回复策略', () => {
      const response = service.handlePriceObjection('prod-001', '价格太高')
      expect(response).toBeDefined()
      expect(typeof response).toBe('string')
    })
  })

  describe('scheduleFollowUp', () => {
    it('应创建跟进提醒', () => {
      const reminder = service.scheduleFollowUp({
        customerId: 'cust-001',
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
