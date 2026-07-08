import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiMarketingController } from './ai-marketing.controller'
import { CampaignTypeEnum, ChannelEnum } from './ai-marketing.dto'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'

describe('AiMarketingController (spec)', () => {
  let controller: AiMarketingController
  let roiService: MarketingROIService
  let copywritingService: CopywritingAssistant
  let campaignPlanner: CampaignPlanner

  beforeEach(() => {
    roiService = new MarketingROIService()
    copywritingService = new CopywritingAssistant()
    campaignPlanner = new CampaignPlanner()
    const cmoService = new AIMarketingCMOService(roiService, copywritingService, campaignPlanner)
    controller = new AiMarketingController(roiService, copywritingService, campaignPlanner, cmoService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  // ===== 路由元数据验证 =====
  describe('路由元数据验证', () => {
    it('Controller path metadata = "ai-marketing"', () => {
      const path = Reflect.getMetadata('path', AiMarketingController)
      assert.equal(path, 'ai-marketing')
    })

    it('POST /ai-marketing/roi/calculate — method POST, path "roi/calculate"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.calculateROI)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.calculateROI)
      assert.equal(method, 1, 'should be POST')
      assert.equal(path, 'roi/calculate')
    })

    it('POST /ai-marketing/roi/compare — method POST, path "roi/compare"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.compareROI)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.compareROI)
      assert.equal(method, 1)
      assert.equal(path, 'roi/compare')
    })

    it('POST /ai-marketing/roi/project — method POST, path "roi/project"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.projectROI)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.projectROI)
      assert.equal(method, 1)
      assert.equal(path, 'roi/project')
    })

    it('POST /ai-marketing/roi/budget-allocation — method POST, path "roi/budget-allocation"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.getBudgetAllocation)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.getBudgetAllocation)
      assert.equal(method, 1)
      assert.equal(path, 'roi/budget-allocation')
    })

    it('POST /ai-marketing/copy/generate — method POST, path "copy/generate"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.generateCopy)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.generateCopy)
      assert.equal(method, 1)
      assert.equal(path, 'copy/generate')
    })

    it('POST /ai-marketing/copy/optimize-headline — method POST, path "copy/optimize-headline"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.optimizeHeadline)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.optimizeHeadline)
      assert.equal(method, 1)
      assert.equal(path, 'copy/optimize-headline')
    })

    it('POST /ai-marketing/copy/localize — method POST, path "copy/localize"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.localizeCopy)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.localizeCopy)
      assert.equal(method, 1)
      assert.equal(path, 'copy/localize')
    })

    it('POST /ai-marketing/copy/ab-test — method POST, path "copy/ab-test"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.generateABTest)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.generateABTest)
      assert.equal(method, 1)
      assert.equal(path, 'copy/ab-test')
    })

    it('POST /ai-marketing/copy/generate-batch — method POST, path "copy/generate-batch"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.batchGenerateCopy)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.batchGenerateCopy)
      assert.equal(method, 1)
      assert.equal(path, 'copy/generate-batch')
    })

    it('POST /ai-marketing/campaign/suggest — method POST, path "campaign/suggest"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.suggestCampaign)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.suggestCampaign)
      assert.equal(method, 1)
      assert.equal(path, 'campaign/suggest')
    })

    it('POST /ai-marketing/campaign/timeline — method POST, path "campaign/timeline"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.planTimeline)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.planTimeline)
      assert.equal(method, 1)
      assert.equal(path, 'campaign/timeline')
    })

    it('POST /ai-marketing/campaign/reach-estimate — method POST, path "campaign/reach-estimate"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.estimateReach)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.estimateReach)
      assert.equal(method, 1)
      assert.equal(path, 'campaign/reach-estimate')
    })

    it('POST /ai-marketing/analyze — method POST, path "analyze"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.analyzeMarketing)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.analyzeMarketing)
      assert.equal(method, 1)
      assert.equal(path, 'analyze')
    })

    it('GET /ai-marketing/stats — method GET, path "stats"', () => {
      const method = Reflect.getMetadata('method', AiMarketingController.prototype.getModuleStats)
      const path = Reflect.getMetadata('path', AiMarketingController.prototype.getModuleStats)
      assert.equal(method, 0, 'should be GET')
      assert.equal(path, 'stats')
    })
  })

  describe('POST /ai-marketing/roi/calculate', () => {
    it('should return ROI for existing campaign', () => {
      const result = controller.calculateROI({ campaignId: 'camp-001' })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.campaignId).toBe('camp-001')
    })

    it('should return not found for non-existing campaign', () => {
      const result = controller.calculateROI({ campaignId: 'non-existent' })
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found')
    })

    it('边界: 空字符串 campaignId 返回 not found', () => {
      const result = controller.calculateROI({ campaignId: '' })
      expect(result.success).toBe(false)
    })

    it('边界: 亏损活动返回 isPositive=false', () => {
      const result = controller.calculateROI({ campaignId: 'camp-005' })
      expect(result.success).toBe(true)
      expect(result.data!.isPositive).toBe(false)
      expect(result.data!.profit).toBeLessThan(0)
    })
  })

  describe('POST /ai-marketing/roi/compare', () => {
    it('should compare multiple campaigns sorted by ROI', () => {
      const result = controller.compareROI({ campaignIds: ['camp-001', 'camp-002', 'camp-003'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(3)
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i - 1].roi).toBeGreaterThanOrEqual(result.data[i].roi)
      }
    })

    it('边界: 空数组返回空结果', () => {
      const result = controller.compareROI({ campaignIds: [] })
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('边界: 混合存在与不存在的 campaignId 只返回存在的', () => {
      const result = controller.compareROI({ campaignIds: ['camp-001', 'nonexistent'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
    })

    it('边界: 重复 ID 多次返回 (服务层不做去重)', () => {
      const result = controller.compareROI({ campaignIds: ['camp-001', 'camp-001'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(2)
    })
  })

  describe('POST /ai-marketing/roi/project', () => {
    it('should project ROI with valid config', () => {
      const result = controller.projectROI({
        type: 'performance',
        budget: 10000,
        expectedCPM: 50,
        expectedCTR: 3.5,
        expectedConversionRate: 5,
        averageOrderValue: 200,
      })
      expect(result.success).toBe(true)
      expect(result.data.expectedROI).toBeDefined()
      expect(result.data.minROI).toBeLessThanOrEqual(result.data.maxROI)
    })

    it('边界: 零预算返回 min/max/expected', () => {
      const result = controller.projectROI({
        type: 'performance',
        budget: 0,
        expectedCPM: 50,
        expectedCTR: 3.5,
        expectedConversionRate: 5,
        averageOrderValue: 200,
      })
      expect(result.success).toBe(true)
      expect(typeof result.data.minROI).toBe('number')
      expect(typeof result.data.maxROI).toBe('number')
    })

    it('边界: 极低预算 ROI 预测', () => {
      const result = controller.projectROI({
        type: 'performance',
        budget: 1,
        expectedCPM: 50,
        expectedCTR: 3.5,
        expectedConversionRate: 5,
        averageOrderValue: 200,
      })
      expect(result.success).toBe(true)
      expect(typeof result.data.expectedROI).toBe('number')
    })
  })

  describe('POST /ai-marketing/roi/budget-allocation', () => {
    it('should return budget allocations for valid campaign type', () => {
      const result = controller.getBudgetAllocation({ campaignType: 'kOL', totalBudget: 50000 })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      const totalAllocated = result.data.reduce((s: number, a: { amount: number }) => s + a.amount, 0)
      expect(totalAllocated).toBeLessThanOrEqual(50000)
    })

    it('边界: 零预算分配返回金额为零的分配', () => {
      const result = controller.getBudgetAllocation({ campaignType: 'kOL', totalBudget: 0 })
      expect(result.success).toBe(true)
      // 渠道分配仍然返回，但每个金额为 0
      const total = result.data.reduce((s: number, a: { amount: number }) => s + a.amount, 0)
      expect(total).toBe(0)
    })
  })

  describe('POST /ai-marketing/copy/generate', () => {
    it('should generate copy for valid brief', () => {
      const result = controller.generateCopy({
        product: '盲盒惊喜系列',
        goal: 'conversion',
        audience: '18-35岁年轻人',
      })
      expect(result.success).toBe(true)
      expect(result.data.headline).toBeDefined()
      expect(result.data.body).toBeDefined()
      expect(result.data.cta).toBeDefined()
    })

    it('不同目标生成不同标题', () => {
      const awareness = controller.generateCopy({
        product: '新品', goal: 'awareness', audience: '大众',
      })
      const conversion = controller.generateCopy({
        product: '新品', goal: 'conversion', audience: '大众',
      })
      expect(awareness.data.headline).not.toBe(conversion.data.headline)
    })

    it('边界: 空产品名仍返回文案', () => {
      const result = controller.generateCopy({
        product: '', goal: 'awareness', audience: '大众',
      })
      expect(result.success).toBe(true)
      expect(result.data.headline).toBeDefined()
    })
  })

  describe('POST /ai-marketing/copy/optimize-headline', () => {
    it('should optimize a headline', () => {
      const result = controller.optimizeHeadline({ headline: '快来买我们的盲盒吧' })
      expect(result.success).toBe(true)
      expect(result.data.original).toBe('快来买我们的盲盒吧')
      expect(result.data.optimized.length).toBeGreaterThan(0)
      expect(result.data.optimized).not.toBe(result.data.original)
    })

    it('边界: 空字符串标题', () => {
      const result = controller.optimizeHeadline({ headline: '' })
      expect(result.success).toBe(true)
      expect(typeof result.data.optimized).toBe('string')
    })
  })

  describe('POST /ai-marketing/copy/localize', () => {
    it('should localize copy to en-US', () => {
      const result = controller.localizeCopy({
        headline: '限时优惠',
        body: '买一送一',
        cta: '立即购买',
        taglines: ['品质保证', '快速发货'],
        locale: 'en-US',
      })
      expect(result.success).toBe(true)
      // 'en-US' locale prepends 🇺🇸 to headline
      expect(result.data.headline).toContain('🇺🇸')
      expect(result.data.cta).toBe('Buy Now')
    })

    it('边界: 支持中文简体本地化', () => {
      const result = controller.localizeCopy({
        headline: 'Limited Offer',
        body: 'Buy One Get One',
        cta: 'Shop Now',
        taglines: ['Quality', 'Fast Delivery'],
        locale: 'zh-CN',
      })
      expect(result.success).toBe(true)
      expect(result.data.cta).toBe('立即购买')
    })
  })

  describe('POST /ai-marketing/copy/ab-test', () => {
    it('should generate requested number of variants', () => {
      const result = controller.generateABTest({ brief: '盲盒新品促销', count: 3 })
      expect(result.success).toBe(true)
      expect(result.data.variants).toHaveLength(3)
    })

    it('边界: count=1 返回单一变体', () => {
      const result = controller.generateABTest({ brief: '测试', count: 1 })
      expect(result.success).toBe(true)
      expect(result.data.variants).toHaveLength(1)
    })

    it('边界: count=0 返回空数组', () => {
      const result = controller.generateABTest({ brief: '测试', count: 0 })
      expect(result.success).toBe(true)
      expect(result.data.variants).toEqual([])
    })
  })

  describe('POST /ai-marketing/copy/generate-batch', () => {
    it('should generate copies for multiple items', () => {
      const result = controller.batchGenerateCopy({
        items: [
          { product: '盲盒A', goal: 'awareness', audience: '年轻人' },
          { product: '盲盒B', goal: 'conversion', audience: '家庭' },
        ],
      })
      expect(result.success).toBe(true)
      expect(result.data.items).toHaveLength(2)
      expect(result.data.totalGenerated).toBe(2)
    })

    it('边界: 空批次返回 totalGenerated=0', () => {
      const result = controller.batchGenerateCopy({ items: [] })
      expect(result.success).toBe(true)
      expect(result.data.items).toEqual([])
      expect(result.data.totalGenerated).toBe(0)
    })
  })

  describe('POST /ai-marketing/campaign/suggest', () => {
    it('should suggest campaigns for awareness goal', () => {
      const result = controller.suggestCampaign({
        goal: 'awareness',
        budget: 30000,
        audience: '18-30岁',
      })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0].channels.length).toBeGreaterThan(0)
    })

    it('边界: 不同目标返回不同建议', () => {
      const awareness = controller.suggestCampaign({ goal: 'awareness', budget: 10000, audience: 'all' })
      const retention = controller.suggestCampaign({ goal: 'retention', budget: 10000, audience: 'all' })
      expect(awareness.data[0].type).not.toEqual(retention.data[0].type)
    })
  })

  describe('POST /ai-marketing/campaign/timeline', () => {
    it('should return timeline with phases array for brand goal', () => {
      const result = controller.planTimeline({ goal: 'brand' })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0].phase).toBeDefined()
      expect(result.data[0].activities).toBeDefined()
    })

    it('不同目标返回不同阶段活动', () => {
      const brand = controller.planTimeline({ goal: 'brand' })
      const conversion = controller.planTimeline({ goal: 'conversion' })
      expect(brand.data[0].phase).not.toBe(conversion.data[0].phase)
    })
  })

  describe('POST /ai-marketing/campaign/reach-estimate', () => {
    it('should estimate reach for wechat', () => {
      const result = controller.estimateReach({ audience: 50000, channel: 'wechat' })
      expect(result.success).toBe(true)
      expect(result.data.reach).toBeGreaterThan(0)
      expect(result.data.channel).toBe('wechat')
    })

    it('不同渠道返回不同触达估算', () => {
      const wechat = controller.estimateReach({ audience: 50000, channel: 'wechat' })
      const douyin = controller.estimateReach({ audience: 50000, channel: 'douyin' })
      expect(wechat.data.cpm).not.toBe(douyin.data.cpm)
    })
  })

  describe('POST /ai-marketing/analyze', () => {
    it('should analyze campaign with ROI only', () => {
      const result = controller.analyzeMarketing({
        campaignId: 'camp-001',
        includeROI: true,
        includeTimeline: false,
        includeReach: false,
      })
      expect(result.success).toBe(true)
      expect(result.data.roi).toBeDefined()
      expect(result.data.timeline).toBeUndefined()
      expect(result.data.reach).toBeUndefined()
    })

    it('should include timeline and reach when requested', () => {
      const result = controller.analyzeMarketing({
        campaignId: 'camp-001',
        includeROI: true,
        includeTimeline: true,
        includeReach: true,
      })
      expect(result.success).toBe(true)
      expect(result.data.roi).toBeDefined()
      expect(Array.isArray(result.data.timeline)).toBe(true)
      expect(result.data.reach).toBeDefined()
      expect(result.data.reach!.length).toBe(2)
    })
  })

  describe('GET /ai-marketing/stats', () => {
    it('should return module stats', () => {
      const result = controller.getModuleStats()
      expect(result.success).toBe(true)
      expect(result.data.totalCampaigns).toBeGreaterThan(0)
      expect(result.data.totalRevenue).toBeGreaterThan(0)
      expect(result.data.averageROI).toBeDefined()
      expect(result.data.positiveCampaigns + result.data.negativeCampaigns).toBe(result.data.totalCampaigns)
    })
  })

  // ===== 👔 店长视角 =====
  describe('👔 店长 - 营销决策视角', () => {
    it('正例: 查看门店活动 ROI 辅助决策', () => {
      const result = controller.calculateROI({ campaignId: 'camp-001' })
      expect(result.success).toBe(true)
      expect(result.data!.roi).toBeGreaterThan(0)
      expect(result.data!.isPositive).toBeDefined()
    })

    it('正例: 获取预算分配概览', () => {
      const result = controller.getBudgetAllocation({ campaignType: 'kOL', totalBudget: 100000 })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      const total = result.data.reduce((s: number, a: { amount: number }) => s + a.amount, 0)
      expect(total).toBeLessThanOrEqual(100000)
    })
  })

  // ===== 🛒 前台视角 =====
  describe('🛒 前台 - 文案生成视角', () => {
    it('正例: 为日常推广生成文案', () => {
      const result = controller.generateCopy({
        product: '周末特惠套票',
        goal: 'conversion',
        audience: '到店顾客',
      })
      expect(result.success).toBe(true)
      expect(result.data.headline).toBeDefined()
      expect(result.data.body).toBeDefined()
    })

    it('正例: 优化标题吸引顾客', () => {
      const result = controller.optimizeHeadline({ headline: '优惠' })
      expect(result.success).toBe(true)
      expect(result.data.optimized.length).toBeGreaterThan(result.data.original.length)
    })
  })

  // ===== 👥 HR视角 =====
  describe('👥 HR - 预算视角', () => {
    it('正例: 查看活动 ROI 辅助招聘预算决策', () => {
      const result = controller.compareROI({ campaignIds: ['camp-001', 'camp-003'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(2)
    })

    it('正例: 查看模块统计了解整体营销投入', () => {
      const result = controller.getModuleStats()
      expect(result.success).toBe(true)
      expect(result.data.totalCost).toBeGreaterThan(0)
    })
  })

  // ===== 🔧 安监视角 =====
  describe('🔧 安监 - 数据一致性视角', () => {
    it('正例: 校验活动 ROI 数据一致性 (profit = revenue - cost)', () => {
      const result = controller.calculateROI({ campaignId: 'camp-002' })
      expect(result.success).toBe(true)
      const { revenue, cost, profit } = result.data!
      expect(profit).toBe(revenue - cost)
    })

    it('正例: 检查所有已知 campaign 审计', () => {
      const stats = controller.getModuleStats()
      const result = controller.compareROI({ campaignIds: ['camp-001', 'camp-002', 'camp-003', 'camp-004', 'camp-005'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(stats.data.totalCampaigns)
    })
  })

  // ===== 🎮 导玩员视角 =====
  describe('🎮 导玩员 - 活动文案视角', () => {
    it('正例: 生成盲盒活动推广文案', () => {
      const result = controller.generateCopy({
        product: '新年限定盲盒',
        goal: 'awareness',
        audience: '到店玩家',
        tone: 'humorous',
      })
      expect(result.success).toBe(true)
      expect(result.data.body).toBeDefined()
    })

    it('正例: A/B 测试不同活动文案', () => {
      const result = controller.generateABTest({ brief: '充值送盲盒', count: 2 })
      expect(result.success).toBe(true)
      expect(result.data.variants).toHaveLength(2)
      expect(result.data.variants[0].headline).not.toBe(result.data.variants[1].headline)
    })
  })

  // ===== 🎯 运行专员视角 =====
  describe('🎯 运行专员 - 活动规划视角', () => {
    it('正例: 预测新活动 ROI 辅助季度规划', () => {
      const result = controller.projectROI({
        type: 'performance',
        budget: 50000,
        expectedCPM: 60,
        expectedCTR: 4.0,
        expectedConversionRate: 6,
        averageOrderValue: 180,
      })
      expect(result.success).toBe(true)
      expect(result.data.expectedROI).toBeGreaterThan(0)
    })

    it('正例: 规划活动时间线', () => {
      const result = controller.planTimeline({ goal: 'conversion' })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ===== 🤝 团建视角 =====
  describe('🤝 团建 - 活动推广视角', () => {
    it('正例: 生成团建活动推广文案', () => {
      const result = controller.generateCopy({
        product: '公司团建套餐',
        goal: 'awareness',
        audience: '企业客户',
      })
      expect(result.success).toBe(true)
    })

    it('正例: 获取团建活动 ROI 评估', () => {
      const result = controller.calculateROI({ campaignId: 'camp-004' })
      expect(result.success).toBe(true)
      expect(result.data!.isPositive).toBe(true)
    })
  })

  // ===== 📢 营销视角 =====
  describe('📢 营销 - 多渠道视角', () => {
    it('正例: 预估多渠道触达', () => {
      const wechat = controller.estimateReach({ audience: 100000, channel: 'wechat' })
      const douyin = controller.estimateReach({ audience: 100000, channel: 'douyin' })
      expect(wechat.success).toBe(true)
      expect(douyin.success).toBe(true)
    })

    it('正例: 综合分析多个活动', () => {
      const result = controller.analyzeMarketing({
        campaignId: 'camp-001',
        includeROI: true,
        includeTimeline: true,
        includeReach: true,
      })
      expect(result.success).toBe(true)
      expect(result.data.campaignName).toBe('Campaign-camp-001')
    })
  })

  // ===== 异常/边界场景 =====
  describe('极端/边界场景', () => {
    it('大量 campaign 比较不超时', () => {
      const ids = Array.from({ length: 100 }, (_, i) => `camp-${String(i + 1).padStart(3, '0')}`)
      const result = controller.compareROI({ campaignIds: ids })
      expect(result.success).toBe(true)
      // 只有5个已知 campaign
      expect(result.data.length).toBeLessThanOrEqual(5)
    })

    it('跨多类型 ROI 预测返回合理范围', () => {
      const types = ['performance', 'brand', 'social', 'email', 'promotion', 'kOL'] as const
      for (const type of types) {
        const result = controller.projectROI({
          type,
          budget: 10000,
          expectedCPM: 50,
          expectedCTR: 3.5,
          expectedConversionRate: 5,
          averageOrderValue: 200,
        })
        expect(result.success).toBe(true)
        expect(result.data.minROI).toBeLessThanOrEqual(result.data.maxROI)
      }
    })
  })
})
