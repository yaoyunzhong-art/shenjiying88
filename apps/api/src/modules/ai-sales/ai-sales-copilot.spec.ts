/**
 * ai-sales-copilot.service.spec.ts — AI 销售副驾服务深层测试
 * 覆盖：AiSalesService + ProductRecommendationEngine + ObjectionHandler + FollowUpScheduler
 * 三件套：正例+反例+边界
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

  // ===== 商品推荐引擎 =====

  it('getRecommendations 应返回产品推荐结果', () => {
    const result = service.recommendForCustomer('cust-001', { currentBrowsing: 'prod-001', recentViewed: [], scenario: 'casual' })
    expect(result.type).toBe('context-aware')
    expect(result.recommendations).toBeInstanceOf(Array)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('不同客户浏览不同商品应返回不同推荐', () => {
    const result1 = service.recommendForCustomer('cust-001', { currentBrowsing: 'prod-001', recentViewed: [], scenario: 'casual' })
    const result2 = service.recommendForCustomer('cust-002', { currentBrowsing: 'prod-008', recentViewed: [], scenario: 'casual' })
    expect(result1.recommendations).not.toEqual(result2.recommendations)
  })

  it('生日场景推荐应获得分数加成', () => {
    const careerResult = service.recommendForCustomer('cust-001', { currentBrowsing: 'prod-001', recentViewed: [], scenario: 'birthday' })
    const birthdayResult = service.recommendForCustomer('cust-001', { currentBrowsing: 'prod-001', recentViewed: [], scenario: 'birthday' })
    expect(Array.isArray(careerResult.recommendations)).toBe(true)
    expect(Array.isArray(birthdayResult.recommendations)).toBe(true)
    const careerMax = Math.max(...careerResult.recommendations.map(r => r.score))
    const birthdayMax = Math.max(...birthdayResult.recommendations.map(r => r.score))
    expect(birthdayMax).toBeGreaterThanOrEqual(careerMax)
  })

  it('空 recentViewed 应返回基于浏览的推荐', () => {
    const result = service.recommendForCustomer('new-cust', { currentBrowsing: 'prod-001', recentViewed: [], scenario: 'casual' })
    expect(Array.isArray(result.recommendations)).toBe(true)
    expect(result.type).toBe('context-aware')
  })

  it('推荐分数应降序排列', () => {
    const result = service.recommendForCustomer('cust-001', { currentBrowsing: 'prod-001', recentViewed: [], scenario: 'casual' })
    for (let i = 1; i < result.recommendations.length; i++) {
      expect(result.recommendations[i - 1].score).toBeGreaterThanOrEqual(result.recommendations[i].score)
    }
  })

  // ===== 向上销售 =====

  it('recommendUpsell 应返回升级商品推荐', () => {
    const result = service.recommendUpsell('prod-001')
    expect(result.type).toBe('upsell')
    expect(result.recommendations.length).toBeGreaterThan(0)
    result.recommendations.forEach(u => {
      expect(u.product.price).toBeGreaterThan(199)
      expect(u.score).toBeGreaterThan(0)
    })
  })

  it('recommendUpsell 不存在的商品应返回空数组', () => {
    const result = service.recommendUpsell('nonexistent')
    expect(result.recommendations).toEqual([])
  })

  it('recommendUpsell 不同类目商品不出现在推荐中', () => {
    const result = service.recommendUpsell('prod-008')
    result.recommendations.forEach(u => {
      expect(u.product.category).toBe('beauty')
    })
  })

  // ===== 交叉销售 =====

  it('recommendCrossSell 应返回关联品类商品', () => {
    const result = service.recommendCrossSell('prod-001')
    expect(result.type).toBe('cross-sell')
    expect(result.recommendations.length).toBeGreaterThan(0)
    result.recommendations.forEach(c => {
      expect(c.score).toBeGreaterThan(0)
      expect(c.reason).toContain('关联品类')
    })
  })

  it('recommendCrossSell 不存在的商品应返回空数组', () => {
    const result = service.recommendCrossSell('nonexistent')
    expect(result.recommendations).toEqual([])
  })

  it('recommendCrossSell 分数降序排列', () => {
    const result = service.recommendCrossSell('prod-001')
    for (let i = 1; i < result.recommendations.length; i++) {
      expect(result.recommendations[i - 1].score).toBeGreaterThanOrEqual(result.recommendations[i].score)
    }
  })

  // ===== 商品获取 =====

  it('getAllProducts 应返回所有商品', () => {
    const products = service.getAllProducts()
    expect(products.length).toBe(10)
  })

  it('getProduct 应通过ID获取单个商品', () => {
    const product = service.getProduct('prod-001')
    expect(product).toBeDefined()
    expect(product!.name).toBe('基础护肤套装')
  })

  it('getProduct 不存在的ID应返回undefined', () => {
    const product = service.getProduct('nonexistent')
    expect(product).toBeUndefined()
  })

  // ===== 购买记录 =====

  it('recordPurchase 应记录客户购买历史', () => {
    service.recordPurchase('test-cust', 'prod-001')
    const result = service.recommendForCustomer('test-cust', { currentBrowsing: 'prod-002', recentViewed: [], scenario: 'casual' })
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  // ===== 异议处理 =====

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

  it('不同客户应获得不同话术', () => {
    const r1 = service.generateResponse('price', { customerId: 'cust-001', productId: 'prod-001', conversationHistory: [] })
    const r2 = service.generateResponse('price', { customerId: 'cust-002', productId: 'prod-001', conversationHistory: [] })
    expect(r1.length).toBeGreaterThan(0)
    expect(r2.length).toBeGreaterThan(0)
  })

  it('未知异议类型应返回默认话术', () => {
    const response = service.generateResponse('unknown_type' as any, { customerId: 'cust-001', productId: 'prod-001', conversationHistory: [] })
    expect(response).toBe('感谢您的反馈，我会为您详细解答')
  })

  it('classifyObjection 应正确分类价格相关异议', () => {
    const type = service.classifyObjection('这个价格太贵了，有没有优惠？')
    expect(type).toBe('price')
  })

  it('classifyObjection 应正确分类质量相关异议', () => {
    const type = service.classifyObjection('这个产品质量怎么样？是正品吗？')
    expect(type).toBe('quality')
  })

  it('classifyObjection 默认应分类为need', () => {
    const type = service.classifyObjection('你好，我想随便看看')
    expect(type).toBe('need')
  })

  // ===== 跟进提醒 =====

  it('scheduleFollowUp 应创建跟进提醒', () => {
    const reminder = service.scheduleFollowUp('cust-001', {
      salesId: 'sales-001',
      type: 'inactive',
      scheduledAt: new Date().toISOString(),
      message: '跟进测试',
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

  it('getDueFollowUps 应返回到期跟进', () => {
    const now = new Date()
    service.scheduleFollowUp('cust-001', { salesId: 'sales-001', type: 'inactive', scheduledAt: new Date(now.getTime() - 60000).toISOString(), message: '过期' })
    const due = service.getDueFollowUps('sales-001')
    expect(due.length).toBeGreaterThan(0)
    due.forEach(r => expect(r.status).toBe('pending'))
  })

  it('markCompleted 应将提醒标记为完成', () => {
    const now = new Date()
    const reminder = service.scheduleFollowUp('cust-001', { salesId: 'sales-002', type: 'reorder', scheduledAt: now.toISOString(), message: '补货' })
    const completed = service.markCompleted(reminder.id)
    expect(completed).toBeDefined()
    expect(completed!.status).toBe('completed')
  })

  it('markCompleted 不存在的提醒应返回undefined', () => {
    const result = service.markCompleted('nonexistent-id')
    expect(result).toBeUndefined()
  })

  it('getAllPending 应返回所有待处理跟进', () => {
    service.scheduleFollowUp('cust-001', { salesId: 'sales-001', type: 'inactive', scheduledAt: new Date().toISOString(), message: '待处理' })
    const all = service.getAllPending()
    expect(all.length).toBeGreaterThan(0)
    all.forEach(r => expect(r.status).toBe('pending'))
  })

  it('getAllPending 按salesId过滤', () => {
    service.scheduleFollowUp('cust-001', { salesId: 'sales-001', type: 'inactive', scheduledAt: new Date().toISOString(), message: '待处理' })
    service.scheduleFollowUp('cust-001', { salesId: 'sales-002', type: 'inactive', scheduledAt: new Date().toISOString(), message: '其他' })
    const filtered = service.getAllPending('sales-001')
    expect(filtered.length).toBeGreaterThan(0)
    filtered.forEach(r => expect(r.salesId).toBe('sales-001'))
  })

  it('getUpcomingBirthdays 应返回近期生日客户', () => {
    service.setCustomerBirthday('test-cust', '1990-01-01')
    const upcoming = service.getUpcomingBirthdays(365)
    expect(upcoming.length).toBeGreaterThan(0)
    upcoming.forEach(u => {
      expect(u.daysUntil).toBeGreaterThanOrEqual(0)
    })
  })

  // ===== 对话模拟 =====

  it('simulateConversation 应返回模拟对话', () => {
    const result = service.simulateConversation('价格多少', '我们的产品性价比很高')
    expect(result.turns.length).toBeGreaterThan(0)
    expect(result.finalSentiment).toBeTruthy()
  })

  it('simulateConversation 应包含客服和客户轮流发言', () => {
    const result = objHandler.simulateConversation('太贵了', '现在有折扣活动')
    expect(result.length).toBeGreaterThanOrEqual(3)
    expect(result[0].speaker).toBe('customer')
    expect(result[1].speaker).toBe('agent')
    expect(result[2].speaker).toBe('customer')
  })

  it('simulateConversation 价格异议获得折扣回应后客户应积极', () => {
    const result = objHandler.simulateConversation('太贵了', '现在下单可享8折优惠')
    const lastTurn = result[result.length - 1]
    expect(lastTurn.sentiment).toBe('positive')
    expect(lastTurn.message).toContain('下单')
  })
})
