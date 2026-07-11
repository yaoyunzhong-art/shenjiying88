/**
 * ai-sales-insight-plus.test.ts — 销售洞察额外测试
 */
import { describe, it, expect } from 'vitest'
import { SalesInsightService } from './ai-sales-insight.service'

describe('SalesInsightService (All Methods)', () => {
  const s = new SalesInsightService()

  it('analyzeConversation', () => {
    const r = s.analyzeConversation('c1', 'cust-1')
    expect(r.overallScore).toBeGreaterThan(0)
    expect(r.topicsDiscussed.length).toBeGreaterThan(0)
  })

  it('predictDeal', () => {
    const r = s.predictDeal('cust-1', 'prod-1')
    expect(r.probability).toBeGreaterThan(0)
    expect(r.keyFactors.length).toBeGreaterThan(0)
  })

  it('getProductAssociations', () => {
    const r = s.getProductAssociations('prod-001')
    expect(r.relatedProducts.length).toBe(4)
  })

  it('getSalesKPIDashboard', () => {
    const r = s.getSalesKPIDashboard('Q2')
    expect(Object.keys(r.kpis)).toHaveLength(10)
    expect(r.topPerformers).toHaveLength(3)
  })

  it('analyzeScriptPerformance', () => {
    const r = s.analyzeScriptPerformance('s1')
    expect(r.conversionRate).toBeGreaterThan(0)
  })

  it('scoreLead', () => {
    const r = s.scoreLead('lead-1')
    expect(['A', 'B', 'C', 'D']).toContain(r.grade)
  })

  it('generateSalesForecast', () => {
    const r = s.generateSalesForecast('Q3')
    expect(r.pipelineValue).toBeGreaterThan(0)
  })

  it('getCustomer360', () => {
    const r = s.getCustomer360('cust-1')
    expect(r.transactionHistory.length).toBe(5)
    expect(r.interactionHistory.length).toBe(3)
    expect(r.nextBestAction).toBeTruthy()
  })

  it('analyzeCompetitivePositioning', () => {
    const r = s.analyzeCompetitivePositioning('prod-001')
    expect(r.winRateBySegment).toBeDefined()
    expect(r.lossReasons.length).toBeGreaterThan(0)
  })
})

/**
 * ai-review-advanced-plus.test.ts — 审查高级额外测试
 */
import { AdvancedReviewService } from '../ai-review/ai-review-advanced.service'

describe('AdvancedReviewService (All Methods)', () => {
  const s = new AdvancedReviewService()

  it('assessTechnicalDebt', () => {
    const r = s.assessTechnicalDebt()
    expect(r.estimatedEffortToFix.hours).toBeGreaterThan(0)
    expect(r.hotspots.length).toBeGreaterThan(0)
  })

  it('scanSecurity', () => {
    const r = s.scanSecurity()
    expect(r.totalVulnerabilities).toBe(5)
    expect(['critical', 'high', 'medium', 'low']).toContain(r.overallRiskLevel)
  })

  it('analyzePerformance', () => {
    const r = s.analyzePerformance()
    expect(r.hotspots.length).toBe(3)
    expect(r.nPlusOneQuery).toBeGreaterThan(0)
  })

  it('getQualityTrend', () => {
    const r = s.getQualityTrend('Q2')
    expect(r.history.length).toBe(6)
    expect(['A', 'B', 'C', 'D', 'F']).toContain(r.rating)
  })

  it('analyzeTeamEfficiency', () => {
    const r = s.analyzeTeamEfficiency('Q2')
    expect(r.reviewerWorkload.length).toBeGreaterThan(0)
  })

  it('detectCodeSmells', () => {
    const r = s.detectCodeSmells()
    expect(r.totalSmells).toBe(6)
    expect(Object.keys(r.smellsByType).length).toBeGreaterThan(0)
  })

  it('reviewArchitecture', () => {
    const r = s.reviewArchitecture()
    expect(r.layers).toHaveLength(3)
    expect(r.modularityScore).toBeGreaterThan(0)
  })

  it('analyzeTestCoverage', () => {
    const r = s.analyzeTestCoverage()
    expect(r.overallCoverage).toBeGreaterThan(0)
    expect(r.untestedFiles.length).toBeGreaterThan(0)
  })
})
