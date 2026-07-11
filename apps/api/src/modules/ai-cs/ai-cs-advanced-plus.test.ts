/**
 * ai-cs-advanced-plus.test.ts — AI 客服高级额外测试
 */
import { describe, it, expect } from 'vitest'
import { AdvancedCSService } from './ai-cs-advanced.service'

describe('AdvancedCSService (All Methods)', () => {
  const s = new AdvancedCSService()

  it('analyzeSentiment', () => {
    const r = s.analyzeSentiment('c1')
    expect(['positive', 'neutral', 'negative']).toContain(r.overallSentiment)
  })

  it('classifyIntent', () => {
    const r = s.classifyIntent('c1')
    expect(r.primaryIntent).toBeTruthy()
    expect(r.suggestedRouting).toBeTruthy()
  })

  it('scoreQuality', () => {
    const r = s.scoreQuality('c1')
    expect(r.scoreBreakdown).toHaveLength(7)
  })

  it('analyzeTickets', () => {
    const r = s.analyzeTickets('Q2')
    expect(r.totalTickets).toBeGreaterThan(0)
    expect(r.trends).toHaveLength(7)
  })

  it('predictCSAT', () => {
    const r = s.predictCSAT('c1')
    expect(r.predictedCSAT).toBeGreaterThan(0)
  })

  it('summarizeConversation', () => {
    const r = s.summarizeConversation('c1')
    expect(r.duration).toBeGreaterThan(0)
  })

  it('getCSATDashboard', () => {
    const r = s.getCSATDashboard('Q2')
    expect(Object.keys(r.distribution)).toHaveLength(10)
  })

  it('identifyAutomationOpportunities', () => {
    const r = s.identifyAutomationOpportunities()
    expect(r.length).toBe(5)
  })

  it('evaluateAgentPerformance', () => {
    const r = s.evaluateAgentPerformance('a1')
    expect(r.kpiScore).toBeGreaterThan(0)
  })

  it('getKnowledgeBaseStats', () => {
    const r = s.getKnowledgeBaseStats()
    expect(r.totalArticles).toBeGreaterThan(0)
  })

  it('getBotPerformance', () => {
    const r = s.getBotPerformance()
    expect(r.intentRecognitionRate).toBeGreaterThan(0)
  })
})

/**
 * ai-diagnosis-advanced-plus.test.ts — 诊断高级额外测试
 */
import { AdvancedDiagnosisService } from './ai-diagnosis-advanced.service'

describe('AdvancedDiagnosisService (All Methods)', () => {
  const s = new AdvancedDiagnosisService()
  const d = {
    diagnosisId: 'd1', engineId: 'e1', scenarioId: 'critical-scenario',
    status: 'COMPLETED' as const, matchedRuleIds: ['r1'], matchedConditionIds: ['c1'],
    triggeredActionIds: ['a1'], riskLevel: 'critical' as const, recommendation: '紧急处理',
    promptSummary: '高风险', evaluationDurationMs: 300, inputSnapshot: {}, outputSnapshot: {},
    createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    tenantId: 't1', requestedBy: 'u1',
  }

  it('analyzeRootCause', () => {
    const r = s.analyzeRootCause(d)
    expect(r.rootCause).toBeTruthy()
  })

  it('buildCausalGraph', () => {
    const r = s.buildCausalGraph(d)
    expect(r.nodes.length).toBeGreaterThan(2)
  })

  it('detectRuleConflicts', () => {
    const r = s.detectRuleConflicts([d])
    expect(r.totalRulesAnalyzed).toBe(1)
  })

  it('generateSuggestions', () => {
    const r = s.generateSuggestions(d)
    expect(r.every(x => x.priority && x.category)).toBe(true)
  })

  it('compareModels', () => {
    const r = s.compareModels(['a', 'b'])
    expect(r.models).toHaveLength(2)
  })

  it('clusterAnomalies', () => {
    const r = s.clusterAnomalies([d])
    expect(r.length).toBeGreaterThan(0)
  })

  it('checkEngineHealth', () => {
    const r = s.checkEngineHealth('e1')
    expect(r.ruleCount).toBeGreaterThan(0)
  })

  it('analyzeTrend', () => {
    const r = s.analyzeTrend([d], 'risk', '7d')
    expect(r.dataPoints.length).toBe(1)
  })
})
