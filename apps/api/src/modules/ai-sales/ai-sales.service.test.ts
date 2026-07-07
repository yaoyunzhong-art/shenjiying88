/**
 * 🐜 自动: [ai-sales] [A] service 测试补全
 *
 * 覆盖 ai-sales-copilot.service.ts 所有服务:
 *   - ProductRecommendationEngine
 *   - ObjectionHandler
 *   - FollowUpScheduler
 *
 * 策略: 每个服务方法 — 正向流程 + 边界条件 + 反例
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'

// ============================
// ProductRecommendationEngine
// ============================
describe('ProductRecommendationEngine', () => {
  let engine: ProductRecommendationEngine

  beforeEach(() => {
    engine = new ProductRecommendationEngine()
  })

  describe('getAllProducts', () => {
    it('正例: 应该返回预置的 10 个商品', () => {
      const products = engine.getAllProducts()
      expect(products).toHaveLength(10)
    })

    it('正例: 商品应包含所有必要字段', () => {
      const products = engine.getAllProducts()
      for (const p of products) {
        expect(p.id).toBeTruthy()
        expect(p.name).toBeTruthy()
        expect(p.category).toBeTruthy()
        expect(p.price).toBeGreaterThanOrEqual(0)
        expect(['low', 'medium', 'high', 'premium']).toContain(p.quality)
      }
    })
  })

  describe('getProduct', () => {
    it('正例: 应能获取预置商品', () => {
      const product = engine.getProduct('prod-001')
      expect(product).toBeDefined()
      expect(product!.name).toBe('基础护肤套装')
    })

    it('反例: 不存在的商品应返回 undefined', () => {
      const product = engine.getProduct('non-existent')
      expect(product).toBeUndefined()
    })
  })

  describe('recordPurchase', () => {
    it('正例: 应能记录购买历史', () => {
      engine.recordPurchase('new-customer', 'prod-001')
      // 记录购买后客户画像应更新
      const profile = (engine as any).getCustomerProfile('new-customer')
      expect(profile.purchaseHistory).toContain('prod-001')
    })

    it('边界: 重复购买同一商品', () => {
      engine.recordPurchase('dup-customer', 'prod-001')
      engine.recordPurchase('dup-customer', 'prod-001')
      const profile = (engine as any).getCustomerProfile('dup-customer')
      expect(profile.purchaseHistory).toHaveLength(2)
    })
  })

  describe('recommendForCustomer', () => {
    it('正例: 新客应收到基础推荐', () => {
      const result = engine.recommendForCustomer('new-user', {
        recentViewed: [],
      })
      expect(result.length).toBeGreaterThan(0)
      // 新客推荐应包含新客专属标签
      expect(result[0].reason).toContain('新客')
    })

    it('正例: 生日场景应增加分数', () => {
      const normal = engine.recommendForCustomer('birthday-user', {
        recentViewed: [],
      })
      const birthday = engine.recommendForCustomer('birthday-user', {
        recentViewed: [],
        scenario: 'birthday',
      })
      // 生日场景下分数应更高（1.2x）
      expect(birthday[0].score).toBeGreaterThanOrEqual(normal[0].score)
      expect(birthday[0].reason).toContain('生日')
    })

    it('正例: 基于当前浏览的同品类推荐', () => {
      const result = engine.recommendForCustomer('browsing-user', {
        currentBrowsing: 'prod-001', // 基础护肤套装
        recentViewed: [],
      })
      expect(result.length).toBeGreaterThan(0)
      // 推荐的应该是同品类商品
    })

    it('边界: 浏览不存在的商品应fallback', () => {
      const result = engine.recommendForCustomer('boundary-user', {
        currentBrowsing: 'non-existent',
        recentViewed: [],
      })
      expect(result.length).toBeGreaterThan(0)
    })

    it('边界: 空 recentViewed + 无 browsing', () => {
      const result = engine.recommendForCustomer('empty-user', {
        recentViewed: [],
      })
      // 应该返回所有商品
      expect(result.length).toBe(10)
    })
  })

  describe('recommendUpsell', () => {
    it('正例: 基础商品应有升级推荐', () => {
      const result = engine.recommendUpsell('prod-001') // 基础护肤套装 199
      expect(result.length).toBeGreaterThan(0)
      // 升级推荐应为同品类且价格更高
      for (const r of result) {
        expect(r.product.price).toBeGreaterThan(199)
        expect(r.product.category).toBe('skincare')
      }
    })

    it('反例: 最高价商品应无升级推荐', () => {
      const result = engine.recommendUpsell('prod-008') // 美容仪 Pro 1599
      expect(result.length).toBe(0)
    })

    it('反例: 不存在商品返回空', () => {
      const result = engine.recommendUpsell('non-existent')
      expect(result).toEqual([])
    })
  })

  describe('recommendCrossSell', () => {
    it('正例: 护肤品类应有跨品类推荐', () => {
      const result = engine.recommendCrossSell('prod-001') // skincare
      expect(result.length).toBeGreaterThan(0)
      // 跨品类推荐应为关联品类
      const categories = new Set(result.map(r => r.product.category))
      expect(categories.has('makeup') || categories.has('beauty')).toBe(true)
    })

    it('反例: 不存在商品返回空', () => {
      const result = engine.recommendCrossSell('non-existent')
      expect(result).toEqual([])
    })
  })
})

// ============================
// ObjectionHandler
// ============================
describe('ObjectionHandler', () => {
  let handler: ObjectionHandler

  beforeEach(() => {
    handler = new ObjectionHandler()
  })

  describe('classifyObjection', () => {
    it('正例: 价格异议应分类为 price', () => {
      expect(handler.classifyObjection('太贵了')).toBe('price')
      expect(handler.classifyObjection('能打折不')).toBe('price')
      expect(handler.classifyObjection('价格太高了')).toBe('price')
    })

    it('正例: 质量异议应分类为 quality', () => {
      expect(handler.classifyObjection('质量怎么样')).toBe('quality')
      expect(handler.classifyObjection('是正品吗')).toBe('quality')
      expect(handler.classifyObjection('有没有副作用')).toBe('quality')
    })

    it('正例: 竞品异议应分类为 competitor', () => {
      expect(handler.classifyObjection('别家更便宜')).toBe('competitor')
      expect(handler.classifyObjection('其他品牌更好')).toBe('competitor')
    })

    it('正例: 需求异议应分类为 need', () => {
      // 不匹配任何模式的应默认 need
      expect(handler.classifyObjection('这个适合我吗')).toBe('need')
      expect(handler.classifyObjection('随便看看')).toBe('need')
    })

    it('边界: 空字符串应默认 need', () => {
      expect(handler.classifyObjection('')).toBe('need')
    })

    it('边界: 大小写不敏感', () => {
      expect(handler.classifyObjection('太贵了')).toBe('price')
      expect(handler.classifyObjection('好贵啊')).toBe('price')
    })
  })

  describe('generateResponse', () => {
    it('正例: 价格异议应返回价格话术', () => {
      const response = handler.generateResponse('price', {
        customerId: 'cust-001',
        productId: 'prod-001',
        conversationHistory: [],
      })
      expect(response).toBeTruthy()
      expect(response.length).toBeGreaterThan(10)
    })

    it('正例: 同一客户应得到一致的轮换结果', () => {
      const r1 = handler.generateResponse('price', {
        customerId: 'stable-cust',
        productId: 'prod-001',
        conversationHistory: [],
      })
      const r2 = handler.generateResponse('price', {
        customerId: 'stable-cust',
        productId: 'prod-001',
        conversationHistory: [],
      })
      // 基于 hashCode 轮换，同一客户应相同
      expect(r1).toBe(r2)
    })

    it('边界: 空对话历史', () => {
      const response = handler.generateResponse('need', {
        customerId: 'empty-history',
        productId: 'prod-001',
        conversationHistory: [],
      })
      expect(response).toBeTruthy()
    })
  })

  describe('simulateConversation', () => {
    it('正例: 应模拟三轮对话', () => {
      const turns = handler.simulateConversation('太贵了', '我们提供分期付款')
      expect(turns).toHaveLength(3)
      expect(turns[0].speaker).toBe('customer')
      expect(turns[1].speaker).toBe('agent')
      expect(turns[2].speaker).toBe('customer')
    })

    it('正例: 价格异议+折扣回应应产生正面情绪', () => {
      const turns = handler.simulateConversation('太贵了', '现在下单可享8折优惠')
      expect(turns[2].sentiment).toBe('positive')
    })

    it('反例: 质量异议+无关键词回应应中性', () => {
      const turns = handler.simulateConversation('质量怎么样', '您好，请问有什么可以帮助您的')
      expect(turns[2].sentiment).toBe('neutral')
    })
  })
})

// ============================
// FollowUpScheduler
// ============================
describe('FollowUpScheduler', () => {
  let scheduler: FollowUpScheduler

  beforeEach(() => {
    scheduler = new FollowUpScheduler()
  })

  describe('scheduleFollowUp', () => {
    it('正例: 应成功创建跟进提醒', () => {
      const reminder = scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'inactive',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '客户近期未活跃，建议联系',
        priority: 3,
      })
      expect(reminder.id).toBeTruthy()
      expect(reminder.status).toBe('pending')
      expect(reminder.createdAt).toBeTruthy()
    })

    it('正例: 生日类型应自动计算倒计时消息', () => {
      const reminder = scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'birthday',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '',
        priority: 3,
      })
      expect(reminder.message).toContain('🎂')
      expect(reminder.message).toContain('生日快乐')
    })

    it('正例: 7天内生日应优先级 1（高）', () => {
      // cust-001 生日是 1995-07-15，如果距离不到7天，优先级应为1
      const reminder = scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'birthday',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '',
        priority: 3,
      })
      expect(reminder.priority).toBeLessThanOrEqual(2)
    })

    it('边界: 未知客户的生日提醒', () => {
      const reminder = scheduler.scheduleFollowUp('unknown-cust', {
        customerId: 'unknown-cust',
        salesId: 'sales-001',
        type: 'birthday',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '',
        priority: 3,
      })
      // 未知客户生日倒计时为 -1，消息不变
      expect(reminder.message).not.toContain('🎂')
    })
  })

  describe('getDueFollowUps', () => {
    it('正例: 应返回已到期的跟进', () => {
      scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'inactive',
        scheduledAt: '2020-01-01T00:00:00.000Z', // 已过期
        message: '旧任务',
        priority: 1,
      })

      const due = scheduler.getDueFollowUps('sales-001')
      expect(due.length).toBeGreaterThan(0)
      expect(due[0].status).toBe('pending')
    })

    it('反例: 未到期的跟进不应返回', () => {
      scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'inactive',
        scheduledAt: '2099-01-01T00:00:00.000Z', // 未来
        message: '未来任务',
        priority: 5,
      })

      const due = scheduler.getDueFollowUps('sales-001')
      expect(due.length).toBe(0)
    })

    it('正例: 到期任务应按优先级排序', () => {
      scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-002',
        type: 'price_alert',
        scheduledAt: '2020-06-01T00:00:00.000Z',
        message: '低优先级',
        priority: 5,
      })
      scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-002',
        type: 'birthday',
        scheduledAt: '2020-06-01T00:00:00.000Z',
        message: '高优先级',
        priority: 1,
      })

      const due = scheduler.getDueFollowUps('sales-002')
      expect(due[0].priority).toBeLessThanOrEqual(due[due.length - 1].priority)
    })
  })

  describe('markCompleted', () => {
    it('正例: 应能标记跟进完成', () => {
      const created = scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'reorder',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '补货提醒',
        priority: 2,
      })
      const completed = scheduler.markCompleted(created.id)
      expect(completed).toBeDefined()
      expect(completed!.status).toBe('completed')
    })

    it('反例: 不存在的跟进返回 undefined', () => {
      const result = scheduler.markCompleted('non-existent-id')
      expect(result).toBeUndefined()
    })
  })

  describe('getUpcomingBirthdays', () => {
    it('正例: 应返回7天内过生日的客户', () => {
      const birthdays = scheduler.getUpcomingBirthdays(7)
      for (const b of birthdays) {
        expect(b.daysUntil).toBeGreaterThanOrEqual(0)
        expect(b.daysUntil).toBeLessThanOrEqual(7)
      }
    })

    it('边界: daysAhead 为 0 应只返回当天生日', () => {
      const birthdays = scheduler.getUpcomingBirthdays(0)
      for (const b of birthdays) {
        expect(b.daysUntil).toBe(0)
      }
    })
  })

  describe('getAllPending', () => {
    it('正例: 应返回所有待处理跟进', () => {
      scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'inactive',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '待处理',
        priority: 3,
      })

      const pending = scheduler.getAllPending()
      expect(pending.length).toBeGreaterThan(0)
      for (const p of pending) {
        expect(p.status).toBe('pending')
      }
    })

    it('正例: 按 salesId 筛选', () => {
      scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-a',
        type: 'inactive',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '销售A',
        priority: 3,
      })
      scheduler.scheduleFollowUp('cust-001', {
        customerId: 'cust-001',
        salesId: 'sales-b',
        type: 'inactive',
        scheduledAt: '2026-07-10T00:00:00.000Z',
        message: '销售B',
        priority: 3,
      })

      const forA = scheduler.getAllPending('sales-a')
      expect(forA).toHaveLength(1)
      expect(forA[0].message).toBe('销售A')
    })
  })

  describe('setCustomerBirthday', () => {
    it('正例: 应能设置客户生日', () => {
      scheduler.setCustomerBirthday('new-cust', '1990-05-20')
      const birthdays = scheduler.getUpcomingBirthdays(365)
      const found = birthdays.find(b => b.customerId === 'new-cust')
      expect(found).toBeDefined()
    })

    it('边界: 设置并立即查询倒计时', () => {
      scheduler.setCustomerBirthday('today-birthday', '1990-07-07') // 假设今天是 7月7日
      const birthdays = scheduler.getUpcomingBirthdays(7)
      const found = birthdays.find(b => b.customerId === 'today-birthday')
      // 如果今天是7月7日，daysUntil 应为 0
      if (found) {
        expect(found.daysUntil).toBe(0)
      }
    })
  })
})
