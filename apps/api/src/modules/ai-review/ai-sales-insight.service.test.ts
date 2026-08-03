import { describe, it, expect } from 'vitest'
import { SalesInsightService } from './ai-sales-insight.service'

describe('SalesInsightService', () => {
  const service = new SalesInsightService()

  describe('analyzeConversation', () => {
    it('should return conversation score with suggestions', () => {
      const result = service.analyzeConversation('conv-001', 'cust-001')
      expect(result.overallScore).toBeGreaterThan(0)
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(['high', 'medium', 'low']).toContain(result.engagementLevel)
    })

    it('should have objection handling and closing scores', () => {
      const result = service.analyzeConversation('conv-001', 'cust-001')
      expect(result.objectionHandlingScore).toBeGreaterThan(0)
      expect(result.closingTechniqueScore).toBeGreaterThan(0)
    })
  })

  describe('predictDeal', () => {
    it('should return deal prediction with key factors', () => {
      const result = service.predictDeal('cust-001', 'prod-001')
      expect(result.probability).toBeGreaterThan(0)
      expect(result.estimatedValue).toBeGreaterThan(0)
      expect(result.keyFactors.length).toBeGreaterThan(0)
    })

    it('should have factors with positive/negative impact', () => {
      const result = service.predictDeal('cust-001', 'prod-001')
      for (const f of result.keyFactors) {
        expect(['positive', 'negative']).toContain(f.impact)
      }
    })
  })

  describe('getProductAssociations', () => {
    it('should return related products', () => {
      const result = service.getProductAssociations('prod-001')
      expect(result.relatedProducts.length).toBeGreaterThan(0)
      for (const p of result.relatedProducts) {
        expect(p.correlationScore).toBeGreaterThan(0)
      }
    })

    it('should suggest bundles', () => {
      const result = service.getProductAssociations('prod-001')
      expect(result.bundleSuggestions.length).toBeGreaterThan(0)
    })
  })

  describe('getSalesKPIDashboard', () => {
    it('should return KPIs with trends', () => {
      const result = service.getSalesKPIDashboard('2026-07')
      expect(result.kpis.totalRevenue).toBeGreaterThan(0)
      expect(result.kpis.winRate).toBeGreaterThan(0)
      expect(result.trends.length).toBeGreaterThan(0)
    })

    it('should include top performers', () => {
      const result = service.getSalesKPIDashboard('2026-07')
      expect(result.topPerformers.length).toBeGreaterThan(0)
      for (const p of result.topPerformers) {
        expect(p).toHaveProperty('name')
        expect(p.revenue).toBeGreaterThan(0)
      }
    })
  })

  describe('analyzeScriptPerformance', () => {
    it('should return script metrics', () => {
      const result = service.analyzeScriptPerformance('script-001')
      expect(result.uses).toBeGreaterThan(0)
      expect(result.conversionRate).toBeGreaterThan(0)
      expect(result.topSellingPoints.length).toBeGreaterThan(0)
    })
  })

  describe('scoreLead', () => {
    it('should score lead with grade and priority', () => {
      const result = service.scoreLead('lead-001')
      expect(['A', 'B', 'C', 'D']).toContain(result.grade)
      expect(result.followUpPriority).toBeGreaterThan(0)
    })

    it('should have engagement history', () => {
      const result = service.scoreLead('lead-001')
      expect(result.engagementHistory.length).toBeGreaterThan(0)
    })
  })

  describe('generateSalesForecast', () => {
    it('should return pipeline and weighted forecast', () => {
      const result = service.generateSalesForecast('2026-07')
      expect(result.pipelineValue).toBeGreaterThan(0)
      expect(result.weightedForecast).toBeGreaterThan(0)
    })

    it('should have risks and opportunities', () => {
      const result = service.generateSalesForecast('2026-07')
      expect(result.risks.length).toBeGreaterThan(0)
      expect(result.opportunities.length).toBeGreaterThan(0)
    })
  })

  describe('getCustomer360', () => {
    it('should return customer profile', () => {
      const result = service.getCustomer360('cust-001')
      expect(result.basicInfo.name).toBeTruthy()
      expect(result.transactionHistory.length).toBeGreaterThan(0)
    })

    it('should include lifetime value metrics', () => {
      const result = service.getCustomer360('cust-001')
      expect(result.lifetimeMetrics.totalSpent).toBeGreaterThan(0)
      expect(result.lifetimeMetrics.churnRisk).toBeGreaterThan(0)
    })
  })

  describe('analyzeCompetitivePositioning', () => {
    it('should return market positioning', () => {
      const result = service.analyzeCompetitivePositioning('prod-001')
      expect(result.marketShare).toBeGreaterThan(0)
      expect(result.uniqueSellingPoints.length).toBeGreaterThan(0)
    })

    it('should identify competitor gaps', () => {
      const result = service.analyzeCompetitivePositioning('prod-001')
      expect(result.competitorStrengthGaps.length).toBeGreaterThan(0)
    })
  })
})
