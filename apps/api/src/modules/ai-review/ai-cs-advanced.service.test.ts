import { describe, it, expect, vi } from 'vitest'
import { AdvancedCSService } from './ai-cs-advanced.service'

describe('AdvancedCSService', () => {
  const service = new AdvancedCSService()

  describe('analyzeSentiment', () => {
    it('should return positive sentiment with score > 0.7 for valid convId', () => {
      const result = service.analyzeSentiment('conv-001')
      expect(result.overallSentiment).toBe('positive')
      expect(result.sentimentScore).toBeGreaterThan(0.7)
      expect(result.sentimentTrend).toHaveLength(7)
    })

    it('should return consistent sentiment for same convId', () => {
      const r1 = service.analyzeSentiment('conv-001')
      const r2 = service.analyzeSentiment('conv-001')
      expect(r1.sentimentScore).toBe(r2.sentimentScore)
    })

    it('should return sentiment trend array with correct shape', () => {
      const result = service.analyzeSentiment('conv-003')
      for (const point of result.sentimentTrend) {
        expect(point).toHaveProperty('timestamp')
        expect(point).toHaveProperty('score')
        expect(point).toHaveProperty('label')
        expect(typeof point.score).toBe('number')
      }
    })
  })

  describe('classifyIntent', () => {
    it('should return primaryIntent inquiry with high confidence', () => {
      const result = service.classifyIntent('conv-001')
      expect(result.primaryIntent).toBe('inquiry')
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('should include secondary intents array', () => {
      const result = service.classifyIntent('conv-002')
      expect(result.secondaryIntents.length).toBeGreaterThan(0)
      for (const si of result.secondaryIntents) {
        expect(si).toHaveProperty('intent')
        expect(si).toHaveProperty('confidence')
        expect(si.confidence).toBeGreaterThanOrEqual(0)
      }
    })

    it('should have total confidence approx 1 from all intents', () => {
      const result = service.classifyIntent('conv-001')
      const secondarySum = result.secondaryIntents.reduce((s, i) => s + i.confidence, 0)
      expect(result.confidence + secondarySum).toBeCloseTo(1.0, 1)
    })
  })

  describe('scoreQuality', () => {
    it('should return overall score >= 85 as reasonable quality', () => {
      const result = service.scoreQuality('conv-001')
      expect(result.overallScore).toBeGreaterThanOrEqual(85)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should have all dimension scores between 0 and 100', () => {
      const result = service.scoreQuality('conv-001')
      const dims = Object.values(result.dimensions)
      for (const d of dims) {
        expect(d).toBeGreaterThanOrEqual(0)
        expect(d).toBeLessThanOrEqual(100)
      }
    })

    it('should include all 5 dimension keys', () => {
      const result = service.scoreQuality('conv-001')
      expect(result.dimensions).toHaveProperty('firstResponseTime')
      expect(result.dimensions).toHaveProperty('resolutionTime')
      expect(result.dimensions).toHaveProperty('politeness')
      expect(result.dimensions).toHaveProperty('accuracy')
      expect(result.dimensions).toHaveProperty('empathy')
    })
  })

  describe('analyzeTickets', () => {
    it('should return total tickets for a given period', () => {
      const result = service.analyzeTickets('2026-07')
      expect(result.totalTickets).toBeGreaterThan(0)
      expect(result.avgResolutionTimeHours).toBeGreaterThan(0)
    })

    it('should categorize tickets correctly', () => {
      const result = service.analyzeTickets('2026-07')
      const categorySum = Object.values(result.ticketsByCategory).reduce((s, v) => s + v, 0)
      expect(categorySum).toBe(result.totalTickets)
    })

    it('should work for different period strings', () => {
      const weekly = service.analyzeTickets('weekly')
      const monthly = service.analyzeTickets('monthly')
      expect(weekly.totalTickets).toBe(100)
      expect(monthly.totalTickets).toBe(100)
    })
  })

  describe('predictCSAT', () => {
    it('should return CSAT prediction with recommendations', () => {
      const result = service.predictCSAT('conv-001')
      expect(result.predictedCSAT).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.recommendedActions.length).toBeGreaterThan(0)
    })

    it('should have confidence value <= 1', () => {
      const result = service.predictCSAT('conv-001')
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('summarizeConversation', () => {
    it('should return summary with key topics', () => {
      const result = service.summarizeConversation('conv-001')
      expect(result.summary).toBeTruthy()
      expect(result.keyTopics.length).toBeGreaterThan(0)
    })

    it('should indicate whether follow-up is required', () => {
      const result = service.summarizeConversation('conv-001')
      expect(typeof result.followUpRequired).toBe('boolean')
    })
  })

  describe('getCSATDashboard', () => {
    it('should return overall CSAT and agent breakdown', () => {
      const result = service.getCSATDashboard('2026-07')
      expect(result.overallCSAT).toBeGreaterThan(0)
      expect(result.byAgent.length).toBeGreaterThan(0)
    })

    it('should have trend data points', () => {
      const result = service.getCSATDashboard('2026-07')
      expect(result.trend.length).toBeGreaterThan(0)
      for (const point of result.trend) {
        expect(point).toHaveProperty('date')
        expect(point).toHaveProperty('csat')
      }
    })

    it('should return same number of agents as seed data', () => {
      const result = service.getCSATDashboard('2026-07')
      expect(result.byAgent).toHaveLength(3)
    })
  })

  describe('identifyAutomationOpportunities', () => {
    it('should return categorized opportunities with priorities', () => {
      const result = service.identifyAutomationOpportunities()
      expect(result.length).toBeGreaterThan(0)
      for (const opp of result) {
        expect(opp).toHaveProperty('category')
        expect(opp).toHaveProperty('potentialSavingsHours')
        expect(opp).toHaveProperty('priority')
        expect(opp.priority).toBeGreaterThan(0)
      }
    })

    it('should be sorted by priority ascending', () => {
      const result = service.identifyAutomationOpportunities()
      for (let i = 1; i < result.length; i++) {
        expect(result[i].priority).toBeGreaterThanOrEqual(result[i - 1].priority)
      }
    })
  })

  describe('evaluateAgentPerformance', () => {
    it('should return performance metrics for given agent', () => {
      const result = service.evaluateAgentPerformance('agent-001')
      expect(result.conversationsHandled).toBeGreaterThan(0)
      expect(result.kpiScore).toBeGreaterThan(0)
      expect(result.resolutionRate).toBeGreaterThan(0)
    })

    it('should have resolution rate <= 1', () => {
      const result = service.evaluateAgentPerformance('agent-001')
      expect(result.resolutionRate).toBeLessThanOrEqual(1)
    })

    it('should not throw for any agentId', () => {
      expect(() => service.evaluateAgentPerformance('nonexistent-agent')).not.toThrow()
    })
  })

  describe('getBotPerformance', () => {
    it('should return bot metrics with rates between 0 and 1', () => {
      const result = service.getBotPerformance()
      expect(result.intentRecognitionRate).toBeGreaterThan(0)
      expect(result.intentRecognitionRate).toBeLessThanOrEqual(1)
      expect(result.escalationRate).toBeGreaterThanOrEqual(0)
      expect(result.selfServiceRate).toBeGreaterThan(0)
    })

    it('should have non-negative average conversations', () => {
      const result = service.getBotPerformance()
      expect(result.averageConversationsPerDay).toBeGreaterThan(0)
    })
  })
})
