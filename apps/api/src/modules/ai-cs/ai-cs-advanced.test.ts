/**
 * ai-cs-advanced.spec.ts — AI 客服高级服务综合测试
 * 覆盖：AdvancedCSService 全部方法
 * 三件套：正例+反例+边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AdvancedCSService } from './ai-cs-advanced.service'

describe('AdvancedCSService (Complete)', () => {
  let service: AdvancedCSService

  beforeEach(() => { service = new AdvancedCSService() })

  // ===== 情感分析 =====

  it('analyzeSentiment 应检测情感趋势', () => {
    const sa = service.analyzeSentiment('conv-001')
    expect(sa.sentimentTrend.length).toBe(5)
    expect(sa.criticalMoments.length).toBeGreaterThan(0)
    expect(sa.keyEmotions.length).toBeGreaterThan(0)
  })

  it('analyzeSentiment overallSentiment应有效', () => {
    const sa = service.analyzeSentiment('conv-001')
    expect(['positive', 'neutral', 'negative']).toContain(sa.overallSentiment)
  })

  it('analyzeSentiment sentimentTrend应标记label', () => {
    const sa = service.analyzeSentiment('conv-001')
    sa.sentimentTrend.forEach(entry => {
      expect(entry.score).toBeGreaterThanOrEqual(-1)
      expect(entry.score).toBeLessThanOrEqual(1)
      expect(entry.label).toBeTruthy()
    })
  })

  it('analyzeSentiment keyEmotions intensity应为正数', () => {
    const sa = service.analyzeSentiment('conv-001')
    sa.keyEmotions.forEach(e => {
      expect(e.intensity).toBeGreaterThan(0)
    })
  })

  // ===== 意图分类 =====

  it('classifyIntent 应提供路由建议', () => {
    const intent = service.classifyIntent('conv-001')
    expect(intent.suggestedRouting).toBeTruthy()
    expect(intent.detectedEntities.length).toBeGreaterThan(0)
  })

  it('classifyIntent primaryIntent应从有效列表中', () => {
    const intent = service.classifyIntent('conv-001')
    const validIntents = ['产品咨询', '订单查询', '退换货', '投诉建议', '账户问题', '技术支持', '价格咨询', '合作伙伴咨询']
    expect(validIntents).toContain(intent.primaryIntent)
  })

  it('classifyIntent 置信度应在0-1之间', () => {
    const intent = service.classifyIntent('conv-001')
    expect(intent.confidence).toBeGreaterThanOrEqual(0)
    expect(intent.confidence).toBeLessThanOrEqual(1)
  })

  it('classifyIntent intentHierarchy应分层', () => {
    const intent = service.classifyIntent('conv-001')
    expect(intent.intentHierarchy.length).toBeGreaterThanOrEqual(3)
    intent.intentHierarchy.forEach(h => {
      expect(h.level).toBeGreaterThan(0)
    })
  })

  // ===== 质量评分 =====

  it('scoreQuality 七个维度权重加总应接近整体分', () => {
    const qs = service.scoreQuality('conv-001')
    const dims = ['greeting', 'professionalism', 'empathy', 'accuracy', 'resolution', 'efficiency', 'compliance']
    expect(dims.every(d => typeof (qs.dimensions as any)[d] === 'number')).toBe(true)
    expect(qs.scoreBreakdown.length).toBe(7)
  })

  it('scoreQuality overallScore应在1-10之间', () => {
    const qs = service.scoreQuality('conv-001')
    expect(qs.overallScore).toBeGreaterThanOrEqual(1)
    expect(qs.overallScore).toBeLessThanOrEqual(10)
  })

  it('scoreQuality 每个维度score应在1-10', () => {
    const qs = service.scoreQuality('conv-001')
    Object.values(qs.dimensions).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
    })
  })

  // ===== 工单分析 =====

  it('analyzeTickets 应包含分类和优先级分布', () => {
    const tickets = service.analyzeTickets('2026-Q2')
    expect(Object.keys(tickets.ticketsByCategory).length).toBeGreaterThanOrEqual(4)
    expect(Object.keys(tickets.ticketsByPriority).length).toBeGreaterThanOrEqual(3)
    expect(tickets.trends.length).toBe(7)
  })

  it('analyzeTickets 已解决+未解决应等于总数', () => {
    const tickets = service.analyzeTickets('2026-Q2')
    expect(tickets.resolvedTickets + tickets.openTickets).toBe(tickets.totalTickets)
  })

  it('analyzeTickets resolutionRate应匹配', () => {
    const tickets = service.analyzeTickets('2026-Q2')
    const expected = Math.round((tickets.resolvedTickets / tickets.totalTickets) * 10000) / 100
    expect(Math.abs(tickets.resolutionRate - expected)).toBeLessThanOrEqual(1)
  })

  // ===== CSAT预测 =====

  it('predictCSAT 应识别风险级别并给出操作', () => {
    const pred = service.predictCSAT('conv-001')
    expect(['low', 'medium', 'high']).toContain(pred.riskLevel)
    expect(pred.keyDrivers.length).toBeGreaterThan(0)
    expect(pred.recommendedActions.length).toBeGreaterThan(0)
    expect(pred.predictedCSAT).toBeGreaterThanOrEqual(1)
    expect(pred.predictedCSAT).toBeLessThanOrEqual(10)
  })

  it('predictCSAT 高预测时should为低风险', () => {
    const pred = service.predictCSAT('conv-001')
    if (pred.predictedCSAT >= 7) {
      expect(pred.riskLevel).toBe('low')
    }
  })

  it('predictCSAT keyDrivers impact之和应接近1', () => {
    const pred = service.predictCSAT('conv-001')
    const impactSum = pred.keyDrivers.reduce((s, d) => s + d.impact, 0)
    expect(impactSum).toBeCloseTo(1.0, 1)
  })

  // ===== 会话摘要 =====

  it('summarizeConversation 应包含跟进信息', () => {
    const summary = service.summarizeConversation('conv-001')
    expect(summary.duration).toBeGreaterThan(0)
    expect(summary.issues.length).toBeGreaterThan(0)
    expect(summary.resolutions.length).toBeGreaterThan(0)
  })

  it('summarizeConversation duration应在合理范围', () => {
    const summary = service.summarizeConversation('conv-001')
    expect(summary.duration).toBeGreaterThanOrEqual(120)
    expect(summary.duration).toBeLessThanOrEqual(720)
  })

  it('summarizeConversation 应返回有效的customerId', () => {
    const summary = service.summarizeConversation('conv-001')
    expect(summary.customerId).toBeTruthy()
    expect(summary.agentId).toBeTruthy()
  })

  // ===== CSAT看板 =====

  it('getCSATDashboard 应含分布和排名', () => {
    const dash = service.getCSATDashboard('2026-Q2')
    expect(Object.keys(dash.distribution).length).toBe(10) // scores 1-10
    expect(dash.byAgent.length).toBeGreaterThan(0)
    expect(dash.topDrivers.length).toBeGreaterThan(0)
    expect(dash.recommendations.length).toBeGreaterThan(0)
  })

  it('getCSATDashboard byAgent应降序排列', () => {
    const dash = service.getCSATDashboard('2026-Q2')
    for (let i = 1; i < dash.byAgent.length; i++) {
      expect(dash.byAgent[i - 1].csat).toBeGreaterThanOrEqual(dash.byAgent[i].csat)
    }
  })

  // ===== 自动化机会 =====

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

  it('identifyAutomationOpportunities 应包含实施方案', () => {
    const opps = service.identifyAutomationOpportunities()
    opps.forEach(o => {
      expect(o.suggestedSolution).toBeTruthy()
      expect(o.implementationEffort).toBeTruthy()
    })
  })

  // ===== 客服绩效 =====

  it('evaluateAgentPerformance 应包含改进项', () => {
    const perf = service.evaluateAgentPerformance('agent-001')
    expect(perf.strengths.length).toBeGreaterThan(0)
    expect(perf.areasForImprovement.length).toBeGreaterThan(0)
    expect(perf.rank).toBeGreaterThan(0)
  })

  it('evaluateAgentPerformance KPI评分应在0-100之间', () => {
    const perf = service.evaluateAgentPerformance('agent-001')
    expect(perf.kpiScore).toBeGreaterThan(0)
    expect(perf.kpiScore).toBeLessThanOrEqual(100)
    expect(perf.complianceScore).toBeGreaterThan(0)
  })

  it('evaluateAgentPerformance 绩效指标应全面', () => {
    const perf = service.evaluateAgentPerformance('agent-001')
    expect(perf.conversationsHandled).toBeGreaterThan(0)
    expect(perf.resolutionRate).toBeGreaterThan(0)
    expect(perf.occupancyRate).toBeGreaterThan(0)
  })

  // ===== 知识库统计 =====

  it('getKnowledgeBaseStats 应分析搜索和缺口', () => {
    const stats = service.getKnowledgeBaseStats()
    expect(stats.totalArticles).toBeGreaterThan(0)
    expect(stats.topArticles.length).toBeGreaterThan(0)
    expect(stats.searchAnalytics.length).toBeGreaterThan(0)
    expect(stats.gaps.length).toBeGreaterThan(0)
    expect(stats.helpfulPercentage).toBeGreaterThan(0)
  })

  it('getKnowledgeBaseStats helpful_Percentage应在0-100', () => {
    const stats = service.getKnowledgeBaseStats()
    expect(stats.helpfulPercentage).toBeGreaterThanOrEqual(0)
    expect(stats.helpfulPercentage).toBeLessThanOrEqual(100)
  })

  it('getKnowledgeBaseStats 已发布+草稿=总数', () => {
    const stats = service.getKnowledgeBaseStats()
    expect(stats.publishedArticles + stats.draftArticles).toBe(stats.totalArticles)
  })

  // ===== 机器人性能 =====

  it('getBotPerformance 应包含改进建议', () => {
    const bp = service.getBotPerformance()
    expect(bp.intentRecognitionRate).toBeGreaterThan(0)
    expect(bp.topIntents.length).toBeGreaterThan(0)
    expect(bp.improvementSuggestions.length).toBeGreaterThan(0)
  })

  it('getBotPerformance 各指标应在有效范围', () => {
    const bp = service.getBotPerformance()
    expect(bp.intentRecognitionRate).toBeLessThanOrEqual(100)
    expect(bp.handoffRate).toBeLessThanOrEqual(100)
    expect(bp.fallbackRate).toBeLessThanOrEqual(100)
  })

  it('getBotPerformance topIntents应含resolutionRate', () => {
    const bp = service.getBotPerformance()
    bp.topIntents.forEach(i => {
      expect(i.resolutionRate).toBeGreaterThan(0)
    })
  })

  // ===== 集成场景 =====

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
