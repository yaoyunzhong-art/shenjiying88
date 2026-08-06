/**
 * intelligence.service.spec.ts — 运营参谋 Service 核心单元测试 (V23)
 *
 * 覆盖: generateFeasibilityReport / sitingAssessment / storePlanning / calculateFinancePanorama
 *       generateOperationAdvice / monitorCompetitor / deviceRecommendation / renovationPlan
 *       pricingStrategy / marketingCampaign / generateOperationsPlan / syncKnowledge / getDataBaseSummary
 *
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { IntelligenceService } from './intelligence.service'
import { IntelligenceAiService } from './intelligence-ai.service'
import { MonitorCollectorService } from './monitor-collector.service'
import { VenueDataService } from './venue-data.service'
import { EmpowerCardService } from '../empower-card'

function createService(): IntelligenceService {
  const aiService = new IntelligenceAiService()
  const collector = new MonitorCollectorService()
  const venueData = new VenueDataService()
  const empowerCardService = new EmpowerCardService()
  return new IntelligenceService(aiService, collector, venueData, empowerCardService)
}

describe('IntelligenceService', () => {
  let svc: IntelligenceService

  beforeEach(() => {
    svc = createService()
  })

  // ════════════════════════════════════════════
  // 1. generateFeasibilityReport
  // ════════════════════════════════════════════

  describe('generateFeasibilityReport', () => {
    it('正例: 上海徐汇300万预算生成可行报告', () => {
      const report = svc.generateFeasibilityReport('上海', '徐汇', 300)
      expect(report.city).toBe('上海')
      expect(report.district).toBe('徐汇')
      expect(report.score).toBeGreaterThanOrEqual(0)
      expect(report.score).toBeLessThanOrEqual(100)
      expect(report.suggestedEquipment.length).toBeGreaterThan(0)
      expect(report.riskFactors.length).toBeGreaterThan(0)
    })

    it('正例: 低预算城市得分合理', () => {
      const report = svc.generateFeasibilityReport('南京', '鼓楼', 100)
      expect(report.score).toBeGreaterThanOrEqual(0)
      expect(report.estimatedMonthlyRevenue).toBeGreaterThan(0)
      expect(report.estimatedPaybackMonths).toBeGreaterThan(0)
    })

    it('边界: 未知城市使用默认竞品数据', () => {
      const report = svc.generateFeasibilityReport('拉萨', '城关', 200)
      expect(report.competitorCount).toBe(1)
      expect(report.avgPrice).toBe(60)
    })

    it('边界: budget为0仍返回有效报告', () => {
      const report = svc.generateFeasibilityReport('上海', '徐汇', 0)
      expect(report.score).toBeGreaterThanOrEqual(0)
    })
  })

  // ════════════════════════════════════════════
  // 2. sitingAssessment
  // ════════════════════════════════════════════

  describe('sitingAssessment', () => {
    it('正例: 返回完整评估结构', () => {
      const result = svc.sitingAssessment('上海', '徐汇')
      expect(result.city).toBe('上海')
      expect(result.overallScore).toBeGreaterThan(0)
      expect(result.confidenceInterval).toBeDefined()
      expect(result.grade).toBeDefined()
      expect(result.competition).toBeDefined()
      expect(result.riskFactors.length).toBeGreaterThan(0)
      expect(result.financialEstimate).toBeDefined()
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.dataSource).toBeDefined()
    })

    it('正例: 低密度区置信区间更宽', () => {
      const result = svc.sitingAssessment('南京', '鼓楼')
      expect(result.competition.densityLevel).toBe('低')
    })
  })

  // ════════════════════════════════════════════
  // 3. storePlanning
  // ════════════════════════════════════════════

  describe('storePlanning', () => {
    it('正例: 豪华档300万500㎡返回完整规划', () => {
      const result = svc.storePlanning({
        city: '上海', district: '徐汇', budget: 300, area: 500, tier: 'luxury',
      })
      expect(result.score).toBeGreaterThan(0)
      expect(result.grade).toBeDefined()
      expect(result.competition).toBeDefined()
      expect(result.financialOverview).toBeDefined()
      expect(result.equipmentSuggestions.length).toBeGreaterThan(0)
      expect(result.renovationEstimate).toBeDefined()
      expect(result.riskFactors.length).toBeGreaterThan(0)
      expect(result.aiSummary).toBeTruthy()
    })

    it('边界: 经济档最低参数', () => {
      const result = svc.storePlanning({
        city: '南京', district: '鼓楼', budget: 50, area: 100, tier: 'economy',
      })
      expect(result.score).toBeGreaterThanOrEqual(0)
    })
  })

  // ════════════════════════════════════════════
  // 4. calculateFinancePanorama
  // ════════════════════════════════════════════

  describe('calculateFinancePanorama', () => {
    it('正例: 标准档财务全景计算', () => {
      const result = svc.calculateFinancePanorama(300, 500, 'standard', '上海', '徐汇')
      expect(result.initialInvestment.total).toBeGreaterThan(0)
      expect(result.monthlyFixedCost.total).toBeGreaterThan(0)
      expect(result.revenueEstimate.estimatedMonthlyRevenue).toBeGreaterThan(0)
      expect(result.paybackMonths).toBeGreaterThan(0)
      expect(result.cityAvgComparison).toBeDefined()
    })

    it('边界: 面积参数清理', () => {
      const result = svc.calculateFinancePanorama(300, 0, 'standard', '上海', '徐汇')
      expect(result.area).toBe(300) // min value
    })

    it('边界: 超大面积的限制', () => {
      const result = svc.calculateFinancePanorama(300, 9999, 'standard', '上海', '徐汇')
      expect(result.area).toBe(5000) // max value
    })
  })

  // ════════════════════════════════════════════
  // 5. generateOperationAdvice
  // ════════════════════════════════════════════

  describe('generateOperationAdvice', () => {
    it('正例: 返回所有类别建议', () => {
      const choices = svc.generateOperationAdvice('store-001')
      expect(choices.length).toBe(7) // 7 categories
    })

    it('正例: 按category筛选', () => {
      const pricing = svc.generateOperationAdvice('store-001', 'pricing')
      expect(pricing.every(c => c.category === 'pricing')).toBe(true)
    })

    it('边界: 未知category返回空', () => {
      const result = svc.generateOperationAdvice('store-001', 'invalid_cat')
      expect(result.length).toBe(0)
    })
  })

  // ════════════════════════════════════════════
  // 6. monitorCompetitor
  // ════════════════════════════════════════════

  describe('monitorCompetitor', () => {
    it('正例: 增量扫描返回结果', async () => {
      const result = await svc.monitorCompetitor()
      expect(result.scanMode).toBe('incremental')
      expect(result.alerts).toBeDefined()
      expect(result.scanTimestamp).toBeTruthy()
    })

    it('正例: 全量扫描', async () => {
      const result = await svc.monitorCompetitor('上海', 'full')
      expect(result.scanMode).toBe('full')
    })
  })

  describe('getLatestScanResult', () => {
    it('正例: 无缓存时自动扫描', async () => {
      const result = await svc.getLatestScanResult()
      expect(result.freshnessMinutes).toBeGreaterThanOrEqual(0)
    })
  })

  // ════════════════════════════════════════════
  // 7. deviceRecommendation
  // ════════════════════════════════════════════

  describe('deviceRecommendation', () => {
    it('正例: 推荐设备清单', async () => {
      const result = await svc.deviceRecommendation({
        budget: 200, area: 400, city: '上海', storeType: 'arcade', tier: '标准',
      })
      expect(result.devices.length).toBeGreaterThan(0)
      expect(result.totalCost).toBeGreaterThan(0)
      expect(result.notes.length).toBeGreaterThan(0)
    })

    it('边界: 低预算经济档', async () => {
      const result = await svc.deviceRecommendation({
        budget: 50, area: 100, city: '南京', storeType: 'game', tier: '经济',
      })
      expect(result.totalCost).toBeGreaterThan(0)
    })
  })

  // ════════════════════════════════════════════
  // 8. renovationPlan
  // ════════════════════════════════════════════

  describe('renovationPlan', () => {
    it('正例: 精装档科技风装修方案', async () => {
      const result = await svc.renovationPlan({
        area: 500, tier: '精装', city: '上海', style: '科技',
      })
      expect(result.items.length).toBe(4)
      expect(result.subTotal).toBeGreaterThan(0)
      expect(result.renovationDuration).toBeTruthy()
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('边界: 经济档默认风格', async () => {
      const result = await svc.renovationPlan({
        area: 100, tier: '经济', city: '南京',
      })
      expect(result.style).toBe('现代')
    })
  })

  // ════════════════════════════════════════════
  // 9. pricingStrategy
  // ════════════════════════════════════════════

  describe('pricingStrategy', () => {
    it('正例: 新店定价策略', async () => {
      const result = await svc.pricingStrategy({
        city: '上海', district: '徐汇', scenario: 'new_store', budget: 300,
      })
      expect(result.priceItems.length).toBeGreaterThan(0)
      expect(result.marketContext).toBeDefined()
      expect(result.revenueImpact).toBeDefined()
      expect(result.strategyExplanation).toBeTruthy()
    })
  })

  // ════════════════════════════════════════════
  // 10. marketingCampaign
  // ════════════════════════════════════════════

  describe('marketingCampaign', () => {
    it('正例: 暑期营销活动方案', () => {
      const result = svc.marketingCampaign({
        city: '上海', district: '徐汇', season: 'summer', budget: 50000,
      })
      expect(result.campaigns.length).toBe(6)
      expect(result.recommendedCampaign).toBeDefined()
      expect(result.budget).toBe(50000)
    })

    it('边界: 不传budget使用默认值', () => {
      const result = svc.marketingCampaign({
        city: '上海', district: '徐汇',
      })
      expect(result.budget).toBe(30000)
    })
  })

  // ════════════════════════════════════════════
  // 11. generateOperationsPlan
  // ════════════════════════════════════════════

  describe('generateOperationsPlan', () => {
    it('正例: 开业初期运营方案', () => {
      const result = svc.generateOperationsPlan({
        storeId: 'store-001', stage: 'early',
      })
      expect(result.stage).toBe('early')
      expect(result.stageName).toBe('开业初期')
      expect(result.duration).toBe('1-3个月')
      expect(result.keyPoints.length).toBeGreaterThan(0)
      expect(result.activityRhythm.length).toBeGreaterThan(0)
      expect(result.competitorContingencies.length).toBeGreaterThan(0)
      expect(result.riskWarnings.length).toBeGreaterThan(0)
      expect(result.milestones.length).toBeGreaterThan(0)
    })

    it('正例: 焕新期运营方案', () => {
      const result = svc.generateOperationsPlan({
        storeId: 'store-001', stage: 'renewal',
      })
      expect(result.stage).toBe('renewal')
      expect(result.stageName).toBe('转型升级焕新期')
    })
  })

  // ════════════════════════════════════════════
  // 12. syncKnowledge / getDataBaseSummary
  // ════════════════════════════════════════════

  describe('syncKnowledge', () => {
    it('正例: 同步知识库', async () => {
      const result = await svc.syncKnowledge()
      expect(result.synced).toBe(true)
      expect(result.scoutDataCount).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeTruthy()
    })
  })

  describe('getDataBaseSummary', () => {
    it('正例: 数据底座概要', async () => {
      const result = await svc.getDataBaseSummary()
      expect(result.venueCount).toBeGreaterThan(0)
      expect(result.dimensionCoverage.length).toBeGreaterThan(0)
      expect(result.updateStatus).toBeDefined()
      expect(result.coverageByCity).toBeDefined()
    })
  })
})
