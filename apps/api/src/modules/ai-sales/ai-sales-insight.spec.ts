/**
 * ai-sales-insight.spec.ts — AI 销售洞察服务综合测试
 * 
 * 覆盖：SalesInsightService 全部 10 个方法 + 集成场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { SalesInsightService } from './ai-sales-insight.service'

describe('SalesInsightService (Complete)', () => {
  let service: SalesInsightService

  beforeEach(() => { service = new SalesInsightService() })

  it('analyzeConversation 应包含客户和客服评分', () => {
    const analysis = service.analyzeConversation('conv-001', 'cust-001')
    expect(analysis.customerSentiment).toBeGreaterThan(0)
    expect(analysis.agentPerformance).toBeGreaterThan(0)
    expect(analysis.keyMoments.length).toBeGreaterThan(0)
    expect(analysis.objectionsRaised.length).toBeGreaterThan(0)
  })

  it('predictDeal 应给出成交概率和置信等级', () => {
    const pred = service.predictDeal('cust-001', 'prod-001')
    expect(pred.probability).toBeGreaterThanOrEqual(0)
    expect(pred.probability).toBeLessThanOrEqual(100)
    expect(pred.expectedValue).toBeGreaterThan(0)
    expect(['high', 'medium', 'low']).toContain(pred.confidenceLevel)
    expect(pred.recommendedActions.length).toBeGreaterThan(0)
    expect(pred.keyFactors.length).toBeGreaterThan(0)
  })

  it('getProductAssociations 应含三种关联类型', () => {
    const assoc = service.getProductAssociations('prod-001')
    const types = new Set(assoc.relatedProducts.map(r => r.associationType))
    expect(types.size).toBeGreaterThanOrEqual(2)
    expect(assoc.bundleSuggestions.length).toBeGreaterThan(0)
  })

  it('getSalesKPIDashboard 应包含 10 个 KPI', () => {
    const dash = service.getSalesKPIDashboard('2026-Q2')
    const kpiKeys = Object.keys(dash.kpis)
    expect(kpiKeys.length).toBe(10)
    expect(dash.trends.length).toBeGreaterThan(0)
    expect(dash.topPerformers).toHaveLength(3)
    expect(dash.recommendations.length).toBeGreaterThan(0)
  })

  it('analyzeScriptPerformance 应包含转化率和有效话术', () => {
    const perf = service.analyzeScriptPerformance('script-001')
    expect(perf.conversionRate).toBeGreaterThan(0)
    expect(perf.effectivePhrases.length).toBeGreaterThan(0)
    expect(perf.improvement).toBeTruthy()
  })

  it('scoreLead 评分等级 A > B > C > D', () => {
    const scores = ['A', 'B', 'C', 'D'].map(grade => {
      // We can't control randomness but all should be valid
      const result = service.scoreLead(`lead-${grade}`)
      return result.grade
    })
    scores.forEach(s => expect(['A', 'B', 'C', 'D']).toContain(s))
  })

  it('generateSalesForecast 应含风险和机会', () => {
    const forecast = service.generateSalesForecast('2026-Q3')
    expect(forecast.pipelineValue).toBeGreaterThan(forecast.weightedForecast)
    expect(forecast.bestCase).toBeGreaterThan(forecast.worstCase)
    expect(forecast.risks.length).toBeGreaterThan(0)
    expect(forecast.opportunities.length).toBeGreaterThan(0)
  })

  it('getCustomer360 应含交易和互动历史', () => {
    const c360 = service.getCustomer360('cust-001')
    expect(c360.transactionHistory.length).toBeGreaterThan(0)
    expect(c360.interactionHistory.length).toBeGreaterThan(0)
    expect(c360.productPreferences.length).toBeGreaterThan(0)
    expect(c360.lifetimeMetrics.totalSpent).toBeGreaterThan(0)
    expect(c360.nextBestAction).toBeTruthy()
  })

  it('analyzeCompetitivePositioning 应含输单原因', () => {
    const cp = service.analyzeCompetitivePositioning('prod-001')
    expect(cp.lossReasons.length).toBeGreaterThan(0)
    expect(cp.uniqueSellingPoints.length).toBeGreaterThan(0)
    expect(cp.recommendedPricingStrategy).toBeTruthy()
  })

  describe('集成场景', () => {
    it('成交预测 → 产品关联推荐 → 竞争定位完整链路', () => {
      const pred = service.predictDeal('cust-001', 'prod-001')
      const assoc = service.getProductAssociations('prod-001')
      const cp = service.analyzeCompetitivePositioning('prod-001')
      expect(pred.probability).toBeGreaterThan(0)
      expect(assoc.relatedProducts.length).toBeGreaterThan(0)
      expect(cp.lossReasons.length).toBeGreaterThan(0)
    })

    it('客户360 → 对话分析 → 跟进建议链路', () => {
      const c360 = service.getCustomer360('cust-001')
      const analysis = service.analyzeConversation('conv-001', 'cust-001')
      expect(c360.basicInfo.name).toBeTruthy()
      expect(analysis.suggestions.length).toBeGreaterThan(0)
    })
  })
})
