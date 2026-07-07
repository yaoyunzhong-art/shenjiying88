import { describe, it, expect, beforeEach } from 'vitest'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler
} from './ai-sales-copilot.service'
import { AiSalesController } from './ai-sales.controller'

describe('AiSalesController', () => {
  let controller: AiSalesController
  let recommendationEngine: ProductRecommendationEngine
  let objectionHandler: ObjectionHandler
  let followUpScheduler: FollowUpScheduler

  beforeEach(() => {
    recommendationEngine = new ProductRecommendationEngine()
    objectionHandler = new ObjectionHandler()
    followUpScheduler = new FollowUpScheduler()
    controller = new AiSalesController(
      recommendationEngine,
      objectionHandler,
      followUpScheduler
    )
  })

  // ─── 推荐 ─────────────────────────────────────

  describe('POST /ai-sales/recommend', () => {
    it('应返回上下文感知推荐结果', () => {
      recommendationEngine.recordPurchase('cust-001', 'prod-001')
      const result = controller.recommend({
        customerId: 'cust-001',
        recentViewed: ['prod-001']
      })

      expect(result.type).toBe('context-aware')
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('生日场景应带场景上下文', () => {
      const result = controller.recommend({
        customerId: 'cust-002',
        recentViewed: [],
        scenario: 'birthday'
      })

      expect(result.context).toContain('birthday')
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('空客户ID应正常返回（ValidationPipe层拦截）', () => {
      const result = controller.recommend({ customerId: '', recentViewed: [] })
      // Controller本身不做验证，ValidationPipe在HTTP层拦截空字符串
      expect(result.type).toBe('context-aware')
    })
  })

  describe('POST /ai-sales/recommend/upsell', () => {
    it('应返回向上销售推荐', () => {
      const result = controller.recommendUpsell({ productId: 'prod-001' })

      expect(result.type).toBe('upsell')
      expect(result.recommendations.length).toBeGreaterThan(0)
      result.recommendations.forEach((r) => {
        expect(r.product.price).toBeGreaterThan(199) // prod-001 price=199
      })
    })

    it('不存在的商品返回空数组', () => {
      const result = controller.recommendUpsell({ productId: 'non-existent' })
      expect(result.recommendations.length).toBe(0)
    })

    it('空商品ID返回空数组（ValidationPipe层拦截空字符串）', () => {
      // Controller本身不做验证，空字符串被作为undefined传给服务
      // 服务层不做空字符串检查，找'产品'ID找不到返回空
      const result = controller.recommendUpsell({ productId: '' })
      expect(result.recommendations.length).toBe(0)
    })
  })

  describe('POST /ai-sales/recommend/cross-sell', () => {
    it('应返回交叉销售推荐', () => {
      const result = controller.recommendCrossSell({ productId: 'prod-001' })

      expect(result.type).toBe('cross-sell')
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('不存在的商品返回空数组', () => {
      const result = controller.recommendCrossSell({ productId: 'non-existent' })
      expect(result.recommendations.length).toBe(0)
    })
  })

  describe('GET /ai-sales/products', () => {
    it('应返回所有商品列表', () => {
      const products = controller.getAllProducts()
      expect(Array.isArray(products)).toBe(true)
      expect(products.length).toBeGreaterThan(0)
    })
  })

  describe('GET /ai-sales/products/:id', () => {
    it('应返回指定商品', () => {
      const product = controller.getProduct('prod-001')
      expect(product).toBeDefined()
      expect(product.id).toBe('prod-001')
    })

    it('不存在的商品应报错', () => {
      expect(() => controller.getProduct('non-existent')).toThrow()
    })
  })

  describe('POST /ai-sales/purchase', () => {
    it('应记录购买', () => {
      const result = controller.recordPurchase({
        customerId: 'cust-001',
        productId: 'prod-001'
      })
      expect(result.success).toBe(true)
    })

    it('空参数应返回成功（ValidationPipe层拦截）', () => {
      const result = controller.recordPurchase({ customerId: '', productId: '' })
      // Controller不验证，空字符串被记录
      expect(result.success).toBe(true)
    })
  })

  // ─── 异议处理 ─────────────────────────────────

  describe('POST /ai-sales/objection/classify', () => {
    it('价格异议应分类为price', () => {
      const result = controller.classifyObjection({ customerReply: '太贵了' })
      expect(result.type).toBe('price')
    })

    it('质量异议应分类为quality', () => {
      const result = controller.classifyObjection({ customerReply: '是正品吗' })
      expect(result.type).toBe('quality')
    })

    it('竞品异议应分类为competitor', () => {
      const result = controller.classifyObjection({ customerReply: '别家更便宜' })
      expect(result.type).toBe('competitor')
    })

    it('空字符串默认分类为need', () => {
      const result = controller.classifyObjection({ customerReply: '' })
      expect(result.type).toBe('need')
    })
  })

  describe('POST /ai-sales/objection/respond', () => {
    it('应返回应对话术', () => {
      const result = controller.generateResponse({
        customerId: 'cust-001',
        productId: 'prod-002',
        objectionType: 'price',
        conversationHistory: []
      })
      expect(result.type).toBe('price')
      expect(result.response.length).toBeGreaterThan(0)
    })

    it('quality类型应返回品质相关话术', () => {
      const result = controller.generateResponse({
        customerId: 'cust-002',
        productId: 'prod-001',
        objectionType: 'quality',
        conversationHistory: []
      })
      const resp = result.response
      expect(
        resp.includes('质量') || resp.includes('保证') || resp.includes('认证')
      ).toBe(true)
    })
  })

  describe('POST /ai-sales/objection/simulate', () => {
    it('应模拟3轮对话', () => {
      const result = controller.simulateConversation({
        objection: '太贵了',
        response: '现在购买可享8折'
      })

      expect(result.turns.length).toBe(3)
      expect(result.finalSentiment).toBeDefined()
    })

    it('有效回应后finalSentiment应为positive', () => {
      const result = controller.simulateConversation({
        objection: '太贵了',
        response: '现在购买可享8折优惠和赠品'
      })

      expect(result.finalSentiment).toBe('positive')
    })
  })

  // ─── 跟进提醒 ─────────────────────────────────

  describe('POST /ai-sales/follow-up', () => {
    it('安排跟进应返回提醒对象', () => {
      const result = controller.scheduleFollowUp({
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'birthday',
        scheduledAt: new Date().toISOString(),
        message: ''
      })

      expect(result.id).toBeDefined()
      expect(result.status).toBe('pending')
    })

    it('生日类型应包含生日消息', () => {
      const result = controller.scheduleFollowUp({
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'birthday',
        scheduledAt: new Date().toISOString(),
        message: ''
      })

      expect(result.message).toContain('生日')
    })
  })

  describe('GET /ai-sales/follow-up/due/:salesId', () => {
    it('应返回到期跟进', () => {
      const pastTime = new Date(Date.now() - 1000).toISOString()
      controller.scheduleFollowUp({
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'inactive',
        scheduledAt: pastTime,
        message: '测试提醒'
      })

      const due = controller.getDueFollowUps('sales-001')
      expect(due.length).toBeGreaterThan(0)
      expect(due[0].status).toBe('pending')
    })

    it('不同销售只能看到自己的到期跟进', () => {
      const pastTime = new Date(Date.now() - 1000).toISOString()
      controller.scheduleFollowUp({
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'inactive',
        scheduledAt: pastTime,
        message: ''
      })
      controller.scheduleFollowUp({
        customerId: 'cust-002',
        salesId: 'sales-002',
        type: 'inactive',
        scheduledAt: pastTime,
        message: ''
      })

      expect(controller.getDueFollowUps('sales-001').length).toBe(1)
      expect(controller.getDueFollowUps('sales-002').length).toBe(1)
    })
  })

  describe('GET /ai-sales/follow-up/pending', () => {
    it('应返回所有待处理跟进', () => {
      controller.scheduleFollowUp({
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'price_alert',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        message: '价格提醒'
      })

      const pending = controller.getPendingFollowUps()
      expect(pending.length).toBeGreaterThan(0)
    })

    it('可按salesId过滤', () => {
      const pending = controller.getPendingFollowUps('sales-001')
      pending.forEach((r) => expect(r.salesId).toBe('sales-001'))
    })
  })

  describe('POST /ai-sales/follow-up/complete', () => {
    it('标记完成应返回completed状态', () => {
      const created = controller.scheduleFollowUp({
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'reorder',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        message: '复购提醒'
      })

      const completed = controller.markCompleted({ followUpId: created.id })
      expect((completed as { status: string }).status).toBe('completed')
    })

    it('不存在的followUpId应返回错误', () => {
      const result = controller.markCompleted({ followUpId: 'non-existent' })
      expect('error' in result).toBe(true)
    })
  })

  describe('GET /ai-sales/follow-up/upcoming-birthdays', () => {
    it('应返回即将到来的生日列表', () => {
      const birthdays = controller.getUpcomingBirthdays('365') // 一年内
      expect(Array.isArray(birthdays)).toBe(true)
    })
  })

  describe('POST /ai-sales/follow-up/birthday', () => {
    it('应设置客户生日', () => {
      const result = controller.setBirthday({
        customerId: 'cust-new',
        birthday: '2000-01-01'
      })
      expect(result.success).toBe(true)
    })
  })
})
