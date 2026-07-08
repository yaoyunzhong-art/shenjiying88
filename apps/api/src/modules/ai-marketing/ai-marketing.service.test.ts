/**
 * ai-marketing.service.test.ts — AI 营销 Service 单元测试
 *
 * 覆盖 AiMarketingService 主入口方法的正确性、异常处理和边界条件。
 * 使用真实子服务实例进行集成式验证。
 *
 * 测试项：11 项
 *  - calculateCampaignROI: 正例 + 反例（不存在活动）
 *  - compareCampaigns: 多活动比较
 *  - projectROI: 预测 + 边界（0预算）
 *  - getOptimalBudget: 预算分配
 *  - generateCopy: 文案生成
 *  - getModuleStats: 聚合统计
 *  - analyzeMarketing: 综合分析（含可选项）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'
import { AiMarketingService } from './ai-marketing.service'

describe('AiMarketingService', () => {
  let service: AiMarketingService
  let roiService: MarketingROIService
  let copyService: CopywritingAssistant
  let campaignPlanner: CampaignPlanner
  let cmoService: AIMarketingCMOService

  beforeEach(() => {
    roiService = new MarketingROIService()
    copyService = new CopywritingAssistant()
    campaignPlanner = new CampaignPlanner()
    cmoService = new AIMarketingCMOService()
    service = new AiMarketingService(roiService, copyService, campaignPlanner, cmoService)
  })

  // ─── ROI 计算 ────────────────────────────────────────────────

  describe('calculateCampaignROI', () => {
    it('应正确计算已知活动的 ROI（正例）', () => {
      const result = service.calculateCampaignROI('camp-001')
      expect(result).not.toBeNull()
      expect(result!.campaignId).toBe('camp-001')
      expect(result!.revenue).toBe(150000)
      expect(result!.cost).toBe(30000)
      expect(result!.profit).toBe(120000)
      expect(result!.roi).toBe(4)
      expect(result!.isPositive).toBe(true)
    })

    it('对于不存在的活动应返回 null（反例）', () => {
      const result = service.calculateCampaignROI('non-existent')
      expect(result).toBeNull()
    })

    it('应正确识别 ROI 为负的活动（亏损活动）', () => {
      const result = service.calculateCampaignROI('camp-005')
      expect(result).not.toBeNull()
      expect(result!.profit).toBeLessThan(0)
      expect(result!.isPositive).toBe(false)
    })
  })

  // ─── ROI 比较 ────────────────────────────────────────────────

  describe('compareCampaigns', () => {
    it('应比较多个活动并返回 ROI 结果数组', () => {
      const results = service.compareCampaigns(['camp-001', 'camp-002'])
      expect(results).toHaveLength(2)
      expect(results[0].campaignId).toBe('camp-001')
      expect(results[1].campaignId).toBe('camp-002')
    })

    it('应过滤掉不存在的活动 ID，只返回有效结果', () => {
      const results = service.compareCampaigns(['camp-001', 'unknown'])
      expect(results).toHaveLength(1)
      expect(results[0].campaignId).toBe('camp-001')
    })
  })

  // ─── ROI 预测 ────────────────────────────────────────────────

  describe('projectROI', () => {
    it('应根据预算和费率预测 ROI 范围', () => {
      const projection = service.projectROI({
        type: 'performance',
        budget: 100000,
        expectedCPM: 80,
        expectedCTR: 0.05,
        expectedConversionRate: 0.03,
        averageOrderValue: 200,
      })
      expect(projection).toBeDefined()
      expect(projection).toHaveProperty('minROI')
      expect(projection).toHaveProperty('maxROI')
      expect(projection).toHaveProperty('expectedROI')
      expect(projection.expectedROI).toBeGreaterThanOrEqual(0)
    })

    it('当预算为 0 时应返回合法预测（边界）', () => {
      const projection = service.projectROI({
        type: 'brand',
        budget: 0,
      })
      expect(projection).toBeDefined()
      expect(projection).toHaveProperty('minROI')
      expect(projection).toHaveProperty('maxROI')
      expect(projection).toHaveProperty('expectedROI')
    })
  })

  // ─── 预算分配 ────────────────────────────────────────────────

  describe('getOptimalBudget', () => {
    it('应返回渠道预算分配数组', () => {
      const allocations = service.getOptimalBudget('performance', 50000)
      expect(allocations).toBeInstanceOf(Array)
      expect(allocations.length).toBeGreaterThanOrEqual(1)
      const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0)
      expect(totalPercent).toBeCloseTo(100, 1)
    })
  })

  // ─── 文案生成 ────────────────────────────────────────────────

  describe('generateCopy', () => {
    it('应根据 brief 生成完整文案', () => {
      const copy = service.generateCopy({
        product: '智能手表 Pro',
        goal: 'conversion',
        audience: '25-40岁科技爱好者',
        tone: 'formal',
      })
      expect(copy).toBeDefined()
      expect(copy.headline).toBeTruthy()
      expect(copy.body).toBeTruthy()
      expect(copy.cta).toBeTruthy()
      expect(copy.taglines).toBeInstanceOf(Array)
      expect(copy.taglines.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── 模块统计 ────────────────────────────────────────────────

  describe('getModuleStats', () => {
    it('应返回统计聚合信息', () => {
      const stats = service.getModuleStats()
      expect(stats.totalCampaigns).toBe(5)
      expect(stats.totalRevenue).toBeGreaterThan(0)
      expect(stats.totalCost).toBeGreaterThan(0)
      expect(stats.averageROI).toBeDefined()
      expect(typeof stats.positiveCampaigns).toBe('number')
      expect(typeof stats.negativeCampaigns).toBe('number')
    })
  })

  // ─── 综合分析 ────────────────────────────────────────────────

  describe('analyzeMarketing', () => {
    it('应返回含 ROI 的综合分析结果（默认只含 ROI）', () => {
      const analysis = service.analyzeMarketing('camp-001')
      expect(analysis.campaignId).toBe('camp-001')
      expect(analysis.roi).toBeDefined()
      expect(analysis.roi!.campaignId).toBe('camp-001')
      expect(analysis.timeline).toBeUndefined()
      expect(analysis.reach).toBeUndefined()
    })

    it('当启用 includeTimeline 和 includeReach 时应包含对应数据', () => {
      const analysis = service.analyzeMarketing('camp-002', {
        includeROI: true,
        includeTimeline: true,
        includeReach: true,
      })
      expect(analysis.roi).toBeDefined()
      expect(analysis.timeline).toBeDefined()
      expect(analysis.reach).toBeDefined()
      expect(analysis.reach).toHaveLength(2)
    })

    it('当 includeROI 为 false 时应排除 ROI', () => {
      const analysis = service.analyzeMarketing('camp-003', {
        includeROI: false,
      })
      expect(analysis.roi).toBeUndefined()
    })
  })
})
