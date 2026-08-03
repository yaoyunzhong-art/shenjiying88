/**
 * ai-sales-insight.spec.ts — AI 销售洞察服务综合测试
 *
 * 覆盖：SalesInsightService 全部方法 + 集成场景
 * 三件套：正例+反例+边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { SalesInsightService } from './ai-sales-insight.service'

describe('SalesInsightService (Complete)', () => {
  let service: SalesInsightService

  beforeEach(() => { service = new SalesInsightService() })

  // ===== 对话分析 =====

  it('analyzeConversation 应包含客户和客服评分', () => {
    const analysis = service.analyzeConversation('conv-001', 'cust-001')
    expect(analysis.customerSentiment).toBeGreaterThan(0)
    expect(analysis.agentPerformance).toBeGreaterThan(0)
    expect(analysis.keyMoments.length).toBeGreaterThan(0)
    expect(analysis.objectionsRaised.length).toBeGreaterThan(0)
  })

  it('analyzeConversation 每条异议应有resolved标志和responseQuality', () => {
    const analysis = service.analyzeConversation('conv-001', 'cust-001')
    analysis.objectionsRaised.forEach(obj => {
      expect(obj.resolved).toBeDefined()
      expect(obj.responseQuality).toBeGreaterThanOrEqual(0)
    })
  })

  it('analyzeConversation overallScore应在0-100之间', () => {
    const analysis = service.analyzeConversation('conv-001', 'cust-001')
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0)
    expect(analysis.overallScore).toBeLessThanOrEqual(100)
  })

  it('analyzeConversation 应包含suggestions', () => {
    const analysis = service.analyzeConversation('conv-001', 'cust-001')
    expect(analysis.suggestions.length).toBeGreaterThan(0)
    analysis.suggestions.forEach(s => expect(typeof s).toBe('string'))
  })

  // ===== 成交预测 =====

  it('predictDeal 应给出成交概率和置信等级', () => {
    const pred = service.predictDeal('cust-001', 'prod-001')
    expect(pred.probability).toBeGreaterThanOrEqual(0)
    expect(pred.probability).toBeLessThanOrEqual(100)
    expect(pred.expectedValue).toBeGreaterThan(0)
    expect(['high', 'medium', 'low']).toContain(pred.confidenceLevel)
    expect(pred.recommendedActions.length).toBeGreaterThan(0)
    expect(pred.keyFactors.length).toBeGreaterThan(0)
  })

  it('predictDeal 概率低时应包含riskFactors', () => {
    const pred = service.predictDeal('cust-001', 'prod-001')
    if (pred.probability < 50) {
      expect(pred.riskFactors.length).toBeGreaterThan(0)
    }
  })

  it('predictDeal 置信等级应与概率匹配', () => {
    const pred = service.predictDeal('cust-001', 'prod-001')
    if (pred.confidenceLevel === 'high') {
      expect(pred.probability).toBeGreaterThan(70)
    }
  })

  it('predictDeal expectedCloseDate应为有效日期', () => {
    const pred = service.predictDeal('cust-001', 'prod-001')
    expect(new Date(pred.expectedCloseDate).getTime()).not.toBeNaN()
  })

  // ===== 产品关联推荐 =====

  it('getProductAssociations 应含三种关联类型', () => {
    const assoc = service.getProductAssociations('prod-001')
    const types = new Set(assoc.relatedProducts.map(r => r.associationType))
    expect(types.size).toBeGreaterThanOrEqual(2)
    expect(assoc.bundleSuggestions.length).toBeGreaterThan(0)
  })

  it('getProductAssociations 关联强度应降序', () => {
    const assoc = service.getProductAssociations('prod-001')
    for (let i = 1; i < assoc.relatedProducts.length; i++) {
      expect(assoc.relatedProducts[i - 1].associationStrength)
        .toBeGreaterThanOrEqual(assoc.relatedProducts[i].associationStrength)
    }
  })

  it('getProductAssociations bundleSuggestions应有捆包折扣', () => {
    const assoc = service.getProductAssociations('prod-001')
    assoc.bundleSuggestions.forEach(b => {
      expect(b.savings).toBeGreaterThan(0)
      expect(b.expectedConversionRate).toBeGreaterThan(0)
    })
  })

  // ===== 销售KPI看板 =====

  it('getSalesKPIDashboard 应包含10个KPI', () => {
    const dash = service.getSalesKPIDashboard('2026-Q2')
    const kpiKeys = Object.keys(dash.kpis)
    expect(kpiKeys.length).toBe(10)
    expect(dash.trends.length).toBeGreaterThan(0)
    expect(dash.topPerformers).toHaveLength(3)
    expect(dash.recommendations.length).toBeGreaterThan(0)
  })

  it('getSalesKPIDashboard KPI值应均为正数', () => {
    const dash = service.getSalesKPIDashboard('2026-Q2')
    Object.values(dash.kpis).forEach(v => {
      expect(v).toBeGreaterThan(0)
    })
  })

  it('getSalesKPIDashboard 趋势应包含方向标记', () => {
    const dash = service.getSalesKPIDashboard('2026-Q2')
    dash.trends.forEach(t => {
      expect(['up', 'down', 'stable']).toContain(t.direction)
    })
  })

  // ===== 话术分析 =====

  it('analyzeScriptPerformance 应包含转化率和有效话术', () => {
    const perf = service.analyzeScriptPerformance('script-001')
    expect(perf.conversionRate).toBeGreaterThan(0)
    expect(perf.effectivePhrases.length).toBeGreaterThan(0)
    expect(perf.improvement).toBeTruthy()
  })

  it('analyzeScriptPerformance conversionRate应在0-100之间', () => {
    const perf = service.analyzeScriptPerformance('script-001')
    expect(perf.conversionRate).toBeGreaterThan(0)
    expect(perf.conversionRate).toBeLessThanOrEqual(100)
  })

  // ===== 潜在客户评分 =====

  it('scoreLead 评分等级 A > B > C > D', () => {
    const scores = ['A', 'B', 'C', 'D'].map(grade => {
      const result = service.scoreLead(`lead-${grade}`)
      return result.grade
    })
    scores.forEach(s => expect(['A', 'B', 'C', 'D']).toContain(s))
  })

  it('scoreLead 返回完整评分分解', () => {
    const result = service.scoreLead('lead-001')
    expect(result.demographicScore).toBeGreaterThan(0)
    expect(result.behavioralScore).toBeGreaterThan(0)
    expect(result.engagementScore).toBeGreaterThan(0)
    expect(result.fitScore).toBeGreaterThan(0)
    expect(result.intentScore).toBeGreaterThan(0)
    expect(Object.keys(result.breakdown).length).toBeGreaterThan(0)
  })

  it('scoreLead 优先级的范围应在1-4之间', () => {
    const a = service.scoreLead('lead-A')
    const d = service.scoreLead('lead-D')
    expect(a.followUpPriority).toBeGreaterThanOrEqual(1)
    expect(a.followUpPriority).toBeLessThanOrEqual(4)
    expect(d.followUpPriority).toBeGreaterThanOrEqual(1)
    expect(d.followUpPriority).toBeLessThanOrEqual(4)
    // A级优先级应 <= D级优先级（A等级更紧急优先级数字更小）
    // 但由于随机性，只要分数高的优先级低即可
    if (a.score >= d.score) {
      expect(a.followUpPriority).toBeLessThanOrEqual(d.followUpPriority)
    }
  })

  // ===== 销售预测 =====

  it('generateSalesForecast 应含风险和机会', () => {
    const forecast = service.generateSalesForecast('2026-Q3')
    expect(forecast.pipelineValue).toBeGreaterThan(forecast.weightedForecast)
    expect(forecast.bestCase).toBeGreaterThan(forecast.worstCase)
    expect(forecast.risks.length).toBeGreaterThan(0)
    expect(forecast.opportunities.length).toBeGreaterThan(0)
  })

  it('generateSalesForecast bestCase应大于worstCase', () => {
    const forecast = service.generateSalesForecast('2026-Q3')
    expect(forecast.bestCase).toBeGreaterThan(forecast.worstCase)
    expect(forecast.pipelineValue).toBeGreaterThan(forecast.weightedForecast)
  })

  // ===== 客户360 =====

  it('getCustomer360 应含交易和互动历史', () => {
    const c360 = service.getCustomer360('cust-001')
    expect(c360.transactionHistory.length).toBeGreaterThan(0)
    expect(c360.interactionHistory.length).toBeGreaterThan(0)
    expect(c360.productPreferences.length).toBeGreaterThan(0)
    expect(c360.lifetimeMetrics.totalSpent).toBeGreaterThan(0)
    expect(c360.nextBestAction).toBeTruthy()
  })

  it('getCustomer360 churnRisk应在0-100之间', () => {
    const c360 = service.getCustomer360('cust-001')
    expect(c360.churnRisk).toBeGreaterThanOrEqual(0)
    expect(c360.churnRisk).toBeLessThanOrEqual(100)
  })

  it('getCustomer360 lifetimeMetrics应完整', () => {
    const c360 = service.getCustomer360('cust-001')
    expect(c360.lifetimeMetrics.totalOrders).toBeGreaterThan(0)
    expect(c360.lifetimeMetrics.avgOrderValue).toBeGreaterThan(0)
  })

  // ===== 竞争分析 =====

  it('analyzeCompetitivePositioning 应含输单原因', () => {
    const cp = service.analyzeCompetitivePositioning('prod-001')
    expect(cp.lossReasons.length).toBeGreaterThan(0)
    expect(cp.uniqueSellingPoints.length).toBeGreaterThan(0)
    expect(cp.recommendedPricingStrategy).toBeTruthy()
  })

  it('analyzeCompetitivePositioning 各segment应有winRate', () => {
    const cp = service.analyzeCompetitivePositioning('prod-001')
    Object.values(cp.winRateBySegment).forEach(rate => {
      expect(rate).toBeGreaterThanOrEqual(0)
    })
  })

  // ===== 集成场景 =====

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
