/**
 * 🐜 自动: [ai-sales] [A] entity 测试补全
 *
 * 覆盖 ai-sales 模块所有实体类型:
 * - CustomerProfile / Product / RecommendationContext
 * - ScoredProduct / ObjectionContext / ConversationSimulation
 * - FollowUpReminder / UpcomingBirthday
 * - 各种请求/响应 DTO 类型
 *
 * 策略: 验证类型结构完整性 + 边界条件
 */
import { describe, it, expect } from 'vitest'
import type {
  CustomerProfile,
  Product,
  RecommendationContext,
  ScoredProduct,
  ObjectionContext,
  ConversationSimulation,
  FollowUpReminder,
  UpcomingBirthday,
  ObjectionType,
  SalesRecommendationResponse,
  ObjectionResponse,
  ConverseSimulationResponse,
  FollowUpCreatedResponse,
} from './ai-sales.entity'

describe('ai-sales 实体类型定义', () => {
  describe('CustomerProfile', () => {
    it('应该正确构建一个完整的客户画像', () => {
      const profile: CustomerProfile = {
        memberId: 'member-001',
        purchaseHistory: ['prod-001', 'prod-002'],
        avgSpend: 350,
        preferences: ['美白', '抗衰'],
        lifecycleStage: 'active',
      }

      expect(profile.memberId).toBe('member-001')
      expect(profile.purchaseHistory).toHaveLength(2)
      expect(profile.avgSpend).toBe(350)
      expect(profile.preferences).toContain('美白')
      expect(profile.lifecycleStage).toBe('active')
    })

    it('should support all lifecycle stages', () => {
      const stages: CustomerProfile['lifecycleStage'][] = ['new', 'active', 'dormant', 'churned']
      for (const stage of stages) {
        const profile: CustomerProfile = {
          memberId: 'test',
          purchaseHistory: [],
          avgSpend: 0,
          preferences: [],
          lifecycleStage: stage,
        }
        expect(profile.lifecycleStage).toBe(stage)
      }
    })

    it('边界: 空购买历史和偏好', () => {
      const profile: CustomerProfile = {
        memberId: 'empty',
        purchaseHistory: [],
        avgSpend: 0,
        preferences: [],
        lifecycleStage: 'new',
      }
      expect(profile.purchaseHistory).toEqual([])
      expect(profile.preferences).toEqual([])
      expect(profile.avgSpend).toBe(0)
    })
  })

  describe('Product', () => {
    it('应该正确构建一个商品', () => {
      const product: Product = {
        id: 'prod-001',
        name: '基础护肤套装',
        category: 'skincare',
        price: 199,
        quality: 'medium',
        tags: ['入门', '基础'],
        relatedCategories: ['skincare', 'makeup'],
      }

      expect(product.id).toBe('prod-001')
      expect(product.name).toBe('基础护肤套装')
      expect(product.price).toBeGreaterThan(0)
      expect(product.tags).toContain('入门')
    })

    it('should support all quality levels', () => {
      const qualities: Product['quality'][] = ['low', 'medium', 'high', 'premium']
      for (const quality of qualities) {
        const p: Product = {
          id: 'test',
          name: 'test',
          category: 'test',
          price: 100,
          quality,
          tags: [],
          relatedCategories: [],
        }
        expect(p.quality).toBe(quality)
      }
    })

    it('边界: 0 元商品和空标签', () => {
      const product: Product = {
        id: 'free',
        name: '免费样品',
        category: 'sample',
        price: 0,
        quality: 'low',
        tags: [],
        relatedCategories: [],
      }
      expect(product.price).toBe(0)
      expect(product.tags).toEqual([])
      expect(product.relatedCategories).toEqual([])
    })
  })

  describe('RecommendationContext', () => {
    it('应该正确构建推荐上下文（含场景）', () => {
      const ctx: RecommendationContext = {
        currentBrowsing: 'prod-001',
        recentViewed: ['prod-002', 'prod-003'],
        scenario: 'birthday',
      }
      expect(ctx.currentBrowsing).toBe('prod-001')
      expect(ctx.recentViewed).toHaveLength(2)
      expect(ctx.scenario).toBe('birthday')
    })

    it('边界: 可选字段为空', () => {
      const ctx: RecommendationContext = {
        recentViewed: [],
      }
      expect(ctx.currentBrowsing).toBeUndefined()
      expect(ctx.recentViewed).toEqual([])
      expect(ctx.scenario).toBeUndefined()
    })
  })

  describe('ScoredProduct', () => {
    it('应该正确构建评分商品', () => {
      const product: Product = {
        id: 'prod-001',
        name: '测试商品',
        category: 'test',
        price: 100,
        quality: 'medium',
        tags: [],
        relatedCategories: [],
      }
      const scored: ScoredProduct = {
        product,
        score: 85,
        reason: '符合消费水平；匹配偏好',
      }
      expect(scored.product.id).toBe('prod-001')
      expect(scored.score).toBe(85)
      expect(scored.reason).toContain('匹配偏好')
    })

    it('边界: 评分 0 和无推荐理由', () => {
      const product: Product = {
        id: 'p',
        name: 'p',
        category: 'c',
        price: 0,
        quality: 'low',
        tags: [],
        relatedCategories: [],
      }
      const scored: ScoredProduct = {
        product,
        score: 0,
        reason: '',
      }
      expect(scored.score).toBe(0)
      expect(scored.reason).toBe('')
    })

    it('边界: 极高评分', () => {
      const product: Product = {
        id: 'p',
        name: 'p',
        category: 'c',
        price: 99999,
        quality: 'premium',
        tags: [],
        relatedCategories: [],
      }
      const scored: ScoredProduct = {
        product,
        score: 9999.99,
        reason: '高分推荐',
      }
      expect(scored.score).toBe(9999.99)
    })
  })

  describe('ObjectionContext', () => {
    it('应该正确构建异议上下文', () => {
      const ctx: ObjectionContext = {
        customerId: 'cust-001',
        productId: 'prod-001',
        conversationHistory: ['你好', '这款产品怎么样？'],
      }
      expect(ctx.customerId).toBe('cust-001')
      expect(ctx.conversationHistory).toHaveLength(2)
    })

    it('边界: 空对话历史', () => {
      const ctx: ObjectionContext = {
        customerId: 'cust-001',
        productId: 'prod-001',
        conversationHistory: [],
      }
      expect(ctx.conversationHistory).toEqual([])
    })
  })

  describe('ConversationSimulation', () => {
    it('应该正确构建对话模拟', () => {
      const turn: ConversationSimulation = {
        turn: 1,
        speaker: 'customer',
        message: '太贵了',
        sentiment: 'negative',
      }
      expect(turn.turn).toBe(1)
      expect(turn.speaker).toBe('customer')
      expect(turn.sentiment).toBe('negative')
    })

    it('应该支持三种情绪状态', () => {
      const sentiments: ConversationSimulation['sentiment'][] = ['positive', 'neutral', 'negative']
      for (const sentiment of sentiments) {
        const t: ConversationSimulation = {
          turn: 1,
          speaker: 'agent',
          message: '您好',
          sentiment,
        }
        expect(t.sentiment).toBe(sentiment)
      }
    })

    it('边界: 空消息', () => {
      const turn: ConversationSimulation = {
        turn: 5,
        speaker: 'customer',
        message: '',
        sentiment: 'neutral',
      }
      expect(turn.message).toBe('')
    })
  })

  describe('FollowUpReminder', () => {
    it('should support all lifecycle states', () => {
      const statuses: FollowUpReminder['status'][] = ['pending', 'completed', 'missed']
      for (const status of statuses) {
        const r: FollowUpReminder = {
          id: 'test-id',
          customerId: 'cust-001',
          salesId: 'sales-001',
          type: 'birthday',
          scheduledAt: '2026-07-10T00:00:00.000Z',
          message: '测试提醒',
          priority: 1,
          status,
          createdAt: '2026-07-07T00:00:00.000Z',
        }
        expect(r.status).toBe(status)
      }
    })

    it('should support all reminder types', () => {
      const types: FollowUpReminder['type'][] = ['birthday', 'inactive', 'price_alert', 'reorder']
      for (const type of types) {
        const r: FollowUpReminder = {
          id: 'test-id',
          customerId: 'cust-001',
          salesId: 'sales-001',
          type,
          scheduledAt: '2026-07-10T00:00:00.000Z',
          message: 'test',
          priority: 1,
          status: 'pending',
          createdAt: '2026-07-07T00:00:00.000Z',
        }
        expect(r.type).toBe(type)
      }
    })

    it('边界: 高优先级和低优先级', () => {
      const high: FollowUpReminder = {
        id: 'high',
        customerId: 'c1',
        salesId: 's1',
        type: 'birthday',
        scheduledAt: '2026-07-07T00:00:00.000Z',
        message: '紧急',
        priority: 0,
        status: 'pending',
        createdAt: '2026-07-07T00:00:00.000Z',
      }
      const low: FollowUpReminder = {
        id: 'low',
        customerId: 'c1',
        salesId: 's1',
        type: 'inactive',
        scheduledAt: '2026-07-20T00:00:00.000Z',
        message: '普通',
        priority: 999,
        status: 'pending',
        createdAt: '2026-07-07T00:00:00.000Z',
      }
      expect(high.priority).toBeLessThan(low.priority)
    })
  })

  describe('UpcomingBirthday', () => {
    it('应该正确构建生日提醒', () => {
      const ub: UpcomingBirthday = {
        customerId: 'cust-001',
        daysUntil: 3,
      }
      expect(ub.customerId).toBe('cust-001')
      expect(ub.daysUntil).toBe(3)
    })

    it('边界: 当天生日', () => {
      const ub: UpcomingBirthday = {
        customerId: 'cust-birthday',
        daysUntil: 0,
      }
      expect(ub.daysUntil).toBe(0)
    })
  })

  describe('ObjectionType', () => {
    it('should support all objection types', () => {
      const types: ObjectionType[] = ['price', 'quality', 'competitor', 'need']
      expect(types).toHaveLength(4)
    })
  })

  describe('SalesRecommendationResponse', () => {
    it('应该正确构建推荐响应', () => {
      const resp: SalesRecommendationResponse = {
        type: 'context-aware',
        recommendations: [],
        context: '场景: birthday',
      }
      expect(resp.type).toBe('context-aware')
      expect(resp.recommendations).toEqual([])
      expect(resp.context).toBeDefined()
    })

    it('should support all recommendation types', () => {
      const types: SalesRecommendationResponse['type'][] = ['context-aware', 'upsell', 'cross-sell']
      for (const type of types) {
        const resp: SalesRecommendationResponse = {
          type,
          recommendations: [],
        }
        expect(resp.type).toBe(type)
      }
    })

    it('边界: context 可选', () => {
      const resp: SalesRecommendationResponse = {
        type: 'upsell',
        recommendations: [],
      }
      expect(resp.context).toBeUndefined()
    })
  })

  describe('ObjectionResponse & ConverseSimulationResponse', () => {
    it('ObjectionResponse 应包含类型和话术', () => {
      const resp: ObjectionResponse = {
        type: 'price',
        response: '我们提供分期付款服务',
      }
      expect(resp.type).toBe('price')
      expect(resp.response).toBeTruthy()
    })

    it('ConverseSimulationResponse 应包含对话轮次和最终情绪', () => {
      const resp: ConverseSimulationResponse = {
        turns: [],
        finalSentiment: 'positive',
      }
      expect(resp.turns).toEqual([])
      expect(resp.finalSentiment).toBe('positive')
    })
  })

  describe('FollowUpCreatedResponse', () => {
    it('应该正确构建跟进创建响应', () => {
      const resp: FollowUpCreatedResponse = {
        id: 'followup-xxx',
        message: '生日提醒',
        priority: 1,
        status: 'pending',
      }
      expect(resp.id).toBeTruthy()
      expect(resp.message).toBeTruthy()
      expect(resp.priority).toBeGreaterThanOrEqual(0)
      expect(resp.status).toBe('pending')
    })

    it('should support all status values', () => {
      const statuses: FollowUpCreatedResponse['status'][] = ['pending', 'completed', 'missed']
      for (const status of statuses) {
        const resp: FollowUpCreatedResponse = {
          id: 'id',
          message: 'msg',
          priority: 1,
          status,
        }
        expect(resp.status).toBe(status)
      }
    })
  })
})
