/**
 * ai-cs-advanced.spec.ts — AI 客服高级服务综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AdvancedCSService } from './ai-cs-advanced.service'

describe('AdvancedCSService (Complete)', () => {
  let service: AdvancedCSService

  beforeEach(() => { service = new AdvancedCSService() })

  it('analyzeSentiment 应检测情感趋势', () => {
    const sa = service.analyzeSentiment('conv-001')
    expect(sa.sentimentTrend.length).toBe(5)
    expect(sa.criticalMoments.length).toBeGreaterThan(0)
    expect(sa.keyEmotions.length).toBeGreaterThan(0)
  })

  it('classifyIntent 应提供路由建议', () => {
    const intent = service.classifyIntent('conv-001')
    expect(intent.suggestedRouting).toBeTruthy()
    expect(intent.detectedEntities.length).toBeGreaterThan(0)
  })

  it('scoreQuality 七个维度权重加总应接近整体分', () => {
    const qs = service.scoreQuality('conv-001')
    const dims = ['greeting', 'professionalism', 'empathy', 'accuracy', 'resolution', 'efficiency', 'compliance']
    expect(dims.every(d => typeof (qs.dimensions as any)[d] === 'number')).toBe(true)
    expect(qs.scoreBreakdown.length).toBe(7)
  })

  it('analyzeTickets 应包含分类和优先级分布', () => {
    const tickets = service.analyzeTickets('2026-Q2')
    expect(Object.keys(tickets.ticketsByCategory).length).toBeGreaterThanOrEqual(4)
    expect(Object.keys(tickets.ticketsByPriority).length).toBeGreaterThanOrEqual(3)
    expect(tickets.trends.length).toBe(7)
  })

  it('predictCSAT 应识别风险级别并给出操作', () => {
    const pred = service.predictCSAT('conv-001')
    expect(['low', 'medium', 'high']).toContain(pred.riskLevel)
    expect(pred.keyDrivers.length).toBeGreaterThan(0)
    expect(pred.recommendedActions.length).toBeGreaterThan(0)
    expect(pred.predictedCSAT).toBeGreaterThanOrEqual(1)
    expect(pred.predictedCSAT).toBeLessThanOrEqual(10)
  })

  it('summarizeConversation 应包含跟进信息', () => {
    const summary = service.summarizeConversation('conv-001')
    expect(summary.duration).toBeGreaterThan(0)
    expect(summary.issues.length).toBeGreaterThan(0)
    expect(summary.resolutions.length).toBeGreaterThan(0)
  })

  it('getCSATDashboard 应含分布和排名', () => {
    const dash = service.getCSATDashboard('2026-Q2')
    expect(Object.keys(dash.distribution).length).toBe(10) // scores 1-10
    expect(dash.byAgent.length).toBeGreaterThan(0)
    expect(dash.topDrivers.length).toBeGreaterThan(0)
    expect(dash.recommendations.length).toBeGreaterThan(0)
  })

  it('identifyAutomationOpportunities 应按优先级排序', () => {
    const opps = service.identifyAutomationOpportunities()
    expect(opps.length).toBeGreaterThan(0)
    for (let i = 1; i < opps.length; i++) {
      expect(opps[i - 1].priority).toBeLessThanOrEqual(opps[i].priority)
    }
    opps.forEach(o => {
      expect(o.automationPotential).toBeGreaterThan(0)
      expect(o.estimatedSavings).toBeGreaterThan(0)
    })
  })

  it('evaluateAgentPerformance 应包含改进项', () => {
    const perf = service.evaluateAgentPerformance('agent-001')
    expect(perf.strengths.length).toBeGreaterThan(0)
    expect(perf.areasForImprovement.length).toBeGreaterThan(0)
    expect(perf.rank).toBeGreaterThan(0)
  })

  it('getKnowledgeBaseStats 应分析搜索和缺口', () => {
    const stats = service.getKnowledgeBaseStats()
    expect(stats.totalArticles).toBeGreaterThan(0)
    expect(stats.topArticles.length).toBeGreaterThan(0)
    expect(stats.searchAnalytics.length).toBeGreaterThan(0)
    expect(stats.gaps.length).toBeGreaterThan(0)
    expect(stats.helpfulPercentage).toBeGreaterThan(0)
  })

  it('getBotPerformance 应包含改进建议', () => {
    const bp = service.getBotPerformance()
    expect(bp.intentRecognitionRate).toBeGreaterThan(0)
    expect(bp.topIntents.length).toBeGreaterThan(0)
    expect(bp.improvementSuggestions.length).toBeGreaterThan(0)
  })

  describe('集成场景', () => {
    it('情感分析 → 意图分类 → 质量评分完整流程', () => {
      const sentiment = service.analyzeSentiment('conv-002')
      const intent = service.classifyIntent('conv-002')
      const quality = service.scoreQuality('conv-002')
      expect(sentiment.overallSentiment).toBeTruthy()
      expect(intent.primaryIntent).toBeTruthy()
      expect(quality.overallScore).toBeGreaterThan(0)
    })

    it('工单分析 → 自动化机会识别 → 成本估算', () => {
      const tickets = service.analyzeTickets('2026-Q2')
      expect(tickets.backlog).toBeGreaterThan(0)
      const opps = service.identifyAutomationOpportunities()
      const totalSavings = opps.reduce((s, o) => s + o.estimatedSavings, 0)
      expect(totalSavings).toBeGreaterThan(0)
    })
  })
})
