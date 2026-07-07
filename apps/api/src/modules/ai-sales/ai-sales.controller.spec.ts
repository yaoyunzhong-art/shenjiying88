/**
 * AiSalesController 单元测试 (D-controller spec 补全)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件 + 8 角色视角（👔 店长 🛒 前台 👥 HR 🔧 安监 🎮 导玩员 🎯 运行专员 🤝 团建 📢 营销）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AiSalesController } from './ai-sales.controller'
import type {
  SalesRecommendationResponse,
  ObjectionResponse,
  ConverseSimulationResponse,
  FollowUpCreatedResponse,
  ScoredProduct,
  UpcomingBirthday,
  FollowUpReminder,
  Product,
} from './ai-sales.entity'

// ─── Mock Services ───────────────────────────────────────────────────────────

function createMockServices() {
  const recommendationEngine = {
    recommendForCustomer: vi.fn(),
    recommendUpsell: vi.fn(),
    recommendCrossSell: vi.fn(),
    getAllProducts: vi.fn(),
    getProduct: vi.fn(),
    recordPurchase: vi.fn(),
  }
  const objectionHandler = {
    classifyObjection: vi.fn(),
    generateResponse: vi.fn(),
    simulateConversation: vi.fn(),
  }
  const followUpScheduler = {
    scheduleFollowUp: vi.fn(),
    getDueFollowUps: vi.fn(),
    getAllPending: vi.fn(),
    markCompleted: vi.fn(),
    getUpcomingBirthdays: vi.fn(),
    setCustomerBirthday: vi.fn(),
  }
  return { recommendationEngine, objectionHandler, followUpScheduler }
}

function createController(mocks: ReturnType<typeof createMockServices>): AiSalesController {
  return new AiSalesController(
    mocks.recommendationEngine as any,
    mocks.objectionHandler as any,
    mocks.followUpScheduler as any,
  )
}

const mockProduct: Product = {
  id: 'prod-001',
  name: '基础护肤套装',
  category: 'skincare',
  price: 199,
  quality: 'medium',
  tags: ['入门', '基础'],
  relatedCategories: ['skincare', 'makeup'],
}

const mockScoredProduct: ScoredProduct = {
  product: mockProduct,
  score: 95,
  reason: '高匹配度推荐',
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AiSalesController', () => {
  let mocks: ReturnType<typeof createMockServices>
  let controller: AiSalesController

  beforeEach(() => {
    mocks = createMockServices()
    controller = createController(mocks)
  })

  // ──────────────────────────────────────────────
  // 角色 👔 店长：查看整体商品推荐效果
  // ──────────────────────────────────────────────
  describe('👔 店长视角 - 商品推荐', () => {
    it('[正向] 店长可以获取上下文感知推荐，查看推荐效果', () => {
      mocks.recommendationEngine.recommendForCustomer.mockReturnValue([mockScoredProduct])
      const result = controller.recommend({
        customerId: 'cust-001',
        recentViewed: ['prod-001'],
      })
      expect(result.type).toBe('context-aware')
      expect(result.recommendations).toHaveLength(1)
      expect(result.recommendations[0].product.name).toBe('基础护肤套装')
    })

    it('[边界] 无浏览记录时返回空推荐', () => {
      mocks.recommendationEngine.recommendForCustomer.mockReturnValue([])
      const result = controller.recommend({ customerId: 'cust-empty', recentViewed: [] })
      expect(result.recommendations).toHaveLength(0)
    })
  })

  // ──────────────────────────────────────────────
  // 角色 🛒 前台：向上销售 / 交叉销售
  // ──────────────────────────────────────────────
  describe('🛒 前台视角 - 销售推荐', () => {
    it('[正向] 前台可以为顾客推荐升级款商品', () => {
      mocks.recommendationEngine.recommendUpsell.mockReturnValue([mockScoredProduct])
      const result = controller.recommendUpsell({ productId: 'prod-001' })
      expect(result.type).toBe('upsell')
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('[正向] 前台可以做交叉销售推荐', () => {
      mocks.recommendationEngine.recommendCrossSell.mockReturnValue([mockScoredProduct])
      const result = controller.recommendCrossSell({ productId: 'prod-001' })
      expect(result.type).toBe('cross-sell')
    })

    it('[边界] 不存在的商品向上销售返回空数组', () => {
      mocks.recommendationEngine.recommendUpsell.mockReturnValue([])
      const result = controller.recommendUpsell({ productId: 'non-existent' })
      expect(result.recommendations).toHaveLength(0)
    })
  })

  // ──────────────────────────────────────────────
  // 角色 👥 HR：查看商品目录
  // ──────────────────────────────────────────────
  describe('👥 HR视角 - 商品目录', () => {
    it('[正向] HR可以查看完整商品列表用于培训', () => {
      mocks.recommendationEngine.getAllProducts.mockReturnValue([mockProduct])
      const products = controller.getAllProducts()
      expect(Array.isArray(products)).toBe(true)
      expect(products).toHaveLength(1)
    })

    it('[正向] HR可以查询单个商品详情', () => {
      mocks.recommendationEngine.getProduct.mockReturnValue(mockProduct)
      const product = controller.getProduct('prod-001')
      expect(product).toBeDefined()
      expect(product!.id).toBe('prod-001')
    })

    it('[边界] 查询不存在的商品应抛出错误', () => {
      mocks.recommendationEngine.getProduct.mockReturnValue(undefined)
      expect(() => controller.getProduct('non-existent')).toThrow()
    })
  })

  // ──────────────────────────────────────────────
  // 角色 🔧 安监：监控购买记录
  // ──────────────────────────────────────────────
  describe('🔧 安监视角 - 购买记录', () => {
    it('[正向] 安监可以记录一笔购买，用于数据审计', () => {
      mocks.recommendationEngine.recordPurchase.mockImplementation(() => {})
      const result = controller.recordPurchase({ customerId: 'cust-001', productId: 'prod-001' })
      expect(result.success).toBe(true)
      expect(mocks.recommendationEngine.recordPurchase).toHaveBeenCalledWith('cust-001', 'prod-001')
    })

    it('[边界] 重复记录同一笔购买不报错', () => {
      mocks.recommendationEngine.recordPurchase.mockImplementation(() => {})
      controller.recordPurchase({ customerId: 'cust-001', productId: 'prod-001' })
      const result = controller.recordPurchase({ customerId: 'cust-001', productId: 'prod-001' })
      expect(result.success).toBe(true)
      expect(mocks.recommendationEngine.recordPurchase).toHaveBeenCalledTimes(2)
    })
  })

  // ──────────────────────────────────────────────
  // 角色 🎮 导玩员：异议处理
  // ──────────────────────────────────────────────
  describe('🎮 导玩员视角 - 异议处理', () => {
    it('[正向] 导玩员可以分类顾客的价格异议', () => {
      mocks.objectionHandler.classifyObjection.mockReturnValue('price')
      const result = controller.classifyObjection({ customerReply: '太贵了' })
      expect(result.type).toBe('price')
    })

    it('[正向] 导玩员可以生成应对话术', () => {
      mocks.objectionHandler.generateResponse.mockReturnValue('我们提供分期付款服务')
      const result = controller.generateResponse({
        customerId: 'cust-001',
        productId: 'prod-002',
        objectionType: 'price',
        conversationHistory: [],
      })
      expect(result.type).toBe('price')
      expect(result.response).toContain('分期')
    })

    it('[正向] 导玩员可以模拟对话，查看最终情绪', () => {
      const mockTurns = [
        { turn: 1, speaker: 'customer' as const, message: '太贵了', sentiment: 'negative' as const },
        { turn: 2, speaker: 'agent' as const, message: '有折扣', sentiment: 'neutral' as const },
        { turn: 3, speaker: 'customer' as const, message: '好的', sentiment: 'positive' as const },
      ]
      mocks.objectionHandler.simulateConversation.mockReturnValue(mockTurns as any)
      const result = controller.simulateConversation({ objection: '太贵了', response: '有折扣' })
      expect(result.turns).toHaveLength(3)
      expect(result.finalSentiment).toBe('positive')
    })

    it('[边界] 空字符串异议默认归类', () => {
      mocks.objectionHandler.classifyObjection.mockReturnValue('need')
      const result = controller.classifyObjection({ customerReply: '' })
      expect(result.type).toBe('need')
    })
  })

  // ──────────────────────────────────────────────
  // 角色 🎯 运行专员：跟进提醒调度
  // ──────────────────────────────────────────────
  describe('🎯 运行专员视角 - 跟进提醒', () => {
    it('[正向] 运行专员可以安排跟进提醒', () => {
      const mockReminder: FollowUpCreatedResponse = {
        id: 'fup-001',
        message: '跟进提醒',
        priority: 3,
        status: 'pending',
      }
      mocks.followUpScheduler.scheduleFollowUp.mockReturnValue(mockReminder)
      const result = controller.scheduleFollowUp({
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'inactive',
        scheduledAt: new Date().toISOString(),
        message: '',
      })
      expect(result.id).toBe('fup-001')
      expect(result.status).toBe('pending')
    })

    it('[正向] 运行专员可以查询到期的跟进任务', () => {
      const mockReminders: FollowUpReminder[] = [
        {
          id: 'fup-002',
          customerId: 'cust-001',
          salesId: 'sales-001',
          type: 'inactive',
          scheduledAt: new Date(Date.now() - 3600000).toISOString(),
          message: '已到期',
          priority: 1,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]
      mocks.followUpScheduler.getDueFollowUps.mockReturnValue(mockReminders)
      const due = controller.getDueFollowUps('sales-001')
      expect(due).toHaveLength(1)
      expect(due[0].salesId).toBe('sales-001')
    })

    it('[边界] 无到期任务返回空数组', () => {
      mocks.followUpScheduler.getDueFollowUps.mockReturnValue([])
      const due = controller.getDueFollowUps('sales-empty')
      expect(due).toHaveLength(0)
    })
  })

  // ──────────────────────────────────────────────
  // 角色 🤝 团建：生日提醒管理
  // ──────────────────────────────────────────────
  describe('🤝 团建视角 - 生日提醒', () => {
    it('[正向] 团建负责人可以获取即将到来的生日列表用于活动策划', () => {
      const mockBirthdays: UpcomingBirthday[] = [
        { customerId: 'cust-001', daysUntil: 3 },
        { customerId: 'cust-002', daysUntil: 5 },
      ]
      mocks.followUpScheduler.getUpcomingBirthdays.mockReturnValue(mockBirthdays)
      const birthdays = controller.getUpcomingBirthdays('7')
      expect(birthdays).toHaveLength(2)
    })

    it('[正向] 团建负责人可以设置客户生日', () => {
      mocks.followUpScheduler.setCustomerBirthday.mockImplementation(() => {})
      const result = controller.setBirthday({ customerId: 'cust-new', birthday: '2000-01-01' })
      expect(result.success).toBe(true)
      expect(mocks.followUpScheduler.setCustomerBirthday).toHaveBeenCalledWith('cust-new', '2000-01-01')
    })

    it('[边界] 默认查询未来7天生日', () => {
      mocks.followUpScheduler.getUpcomingBirthdays.mockReturnValue([])
      const birthdays = controller.getUpcomingBirthdays(undefined as any)
      expect(Array.isArray(birthdays)).toBe(true)
      expect(mocks.followUpScheduler.getUpcomingBirthdays).toHaveBeenCalledWith(7)
    })
  })

  // ──────────────────────────────────────────────
  // 角色 📢 营销：跟进完成管理
  // ──────────────────────────────────────────────
  describe('📢 营销视角 - 跟进管理', () => {
    it('[正向] 营销可以标记跟进为已完成', () => {
      const mockCompleted: FollowUpReminder = {
        id: 'fup-003',
        customerId: 'cust-001',
        salesId: 'sales-001',
        type: 'reorder',
        scheduledAt: new Date().toISOString(),
        message: '复购提醒',
        priority: 2,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }
      mocks.followUpScheduler.markCompleted.mockReturnValue(mockCompleted)
      const result = controller.markCompleted({ followUpId: 'fup-003' })
      expect((result as FollowUpReminder).status).toBe('completed')
    })

    it('[正向] 营销可以查看所有待处理跟进（按销售过滤）', () => {
      const mockPending: FollowUpReminder[] = [
        {
          id: 'fup-004',
          customerId: 'cust-002',
          salesId: 'sales-002',
          type: 'price_alert',
          scheduledAt: new Date().toISOString(),
          message: '价格提醒',
          priority: 1,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]
      mocks.followUpScheduler.getAllPending.mockReturnValue(mockPending)
      const pending = controller.getPendingFollowUps('sales-002')
      expect(pending).toHaveLength(1)
    })

    it('[边界] 标记不存在的跟进返回错误', () => {
      mocks.followUpScheduler.markCompleted.mockReturnValue(undefined)
      const result = controller.markCompleted({ followUpId: 'non-existent' })
      expect('error' in result).toBe(true)
      expect((result as { error: string }).error).toContain('not found')
    })

    it('[边界] 无待处理跟进返回空数组', () => {
      mocks.followUpScheduler.getAllPending.mockReturnValue([])
      const pending = controller.getPendingFollowUps()
      expect(pending).toHaveLength(0)
    })
  })

  // ──────────────────────────────────────────────
  // 全局边界情况
  // ──────────────────────────────────────────────
  describe('边界与错误处理', () => {
    it('生日场景推荐带上场景上下文', () => {
      mocks.recommendationEngine.recommendForCustomer.mockReturnValue([mockScoredProduct])
      const result = controller.recommend({
        customerId: 'cust-001',
        recentViewed: [],
        scenario: 'birthday',
      })
      expect(result.context).toContain('birthday')
    })

    it('模拟对话返回的三轮情绪应顺序变化', () => {
      const mockTurns = [
        { turn: 1, speaker: 'customer' as const, message: '太贵', sentiment: 'negative' as const },
        { turn: 2, speaker: 'agent' as const, message: '可优惠', sentiment: 'neutral' as const },
        { turn: 3, speaker: 'customer' as const, message: '好', sentiment: 'positive' as const },
      ]
      mocks.objectionHandler.simulateConversation.mockReturnValue(mockTurns as any)
      const result = controller.simulateConversation({ objection: '太贵', response: '可优惠' })
      const sentiments = result.turns.map((t) => t.sentiment)
      expect(sentiments[0]).toBe('negative')
      expect(sentiments[2]).toBe('positive')
    })
  })
})
