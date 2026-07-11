/**
 * ai-push-analytics.service.spec.ts — 推送分析服务完整测试
 */
import { describe, it, expect } from 'vitest'
import { PushAnalyticsService } from './ai-push-analytics.service'

describe('PushAnalyticsService', () => {
  const service = new PushAnalyticsService()

  it('getPerformanceSummary 应返回完整摘要', () => {
    const s = service.getPerformanceSummary()
    expect(s.totalPushes).toBeGreaterThan(0)
    expect(s.trends.deliveryByDay).toHaveLength(7)
    expect(s.trends.clickByDay).toHaveLength(7)
  })

  it('compareChannels 应包含所有主要渠道', () => {
    const channels = service.compareChannels()
    const names = channels.map((c: { channel: string }) => c.channel)
    expect(names).toContain('push')
    expect(names).toContain('sms')
    expect(names).toContain('email')
  })

  it('analyzeSegmentResponse 应返回不同分群', () => {
    const segments = service.analyzeSegmentResponse()
    expect(segments.length).toBeGreaterThanOrEqual(4)
  })

  it('getOptimalPushTimes 应推荐最佳时段', () => {
    const times = service.getOptimalPushTimes()
    expect(times.some((t: { isRecommended: boolean }) => t.isRecommended)).toBe(true)
  })

  it('analyzeABTestResults 应包含获胜组', () => {
    const r = service.analyzeABTestResults('exp-001')
    expect(r.winningVariant).toBeTruthy()
    expect(r.liftOverControl).toBeDefined()
  })

  it('getMultiChannelSequences 应包含预设序列', () => {
    const seqs = service.getMultiChannelSequences()
    expect(seqs.length).toBe(3)
  })

  it('getHealthDashboard 应返回完整指标', () => {
    const h = service.getHealthDashboard()
    expect(['good', 'fair', 'poor']).toContain(h.overallHealth)
    expect(h.metrics.dailyPushCapacity).toBeGreaterThan(0)
  })

  it('getUserProfile 应包含标签', () => {
    const p = service.getUserProfile('user-123')
    expect(p.tags.length).toBeGreaterThan(5)
    expect(p.preferredChannel).toBeTruthy()
  })

  it('attributionAnalysis 应返回各渠道贡献', () => {
    const a = service.attributionAnalysis('2026-07-01', '2026-07-11')
    expect(a.totalConversions).toBeGreaterThan(0)
    expect(a.channelContributions.length).toBeGreaterThan(0)
  })
})

/**
 * ai-diagnosis-advanced.spec.ts — 诊断高级服务测试
 */
import { AdvancedDiagnosisService } from '../ai-diagnosis/ai-diagnosis-advanced.service'

describe('AdvancedDiagnosisService', () => {
  const service = new AdvancedDiagnosisService()
  const mockDiagnosis = {
    diagnosisId: 'diag-test', engineId: 'e1', scenarioId: 'critical-s1',
    status: 'COMPLETED' as const, matchedRuleIds: ['r1', 'r2'],
    matchedConditionIds: ['c1'], triggeredActionIds: ['a1'],
    riskLevel: 'high' as const, recommendation: '关注',
    promptSummary: '测试', evaluationDurationMs: 200,
    inputSnapshot: {}, outputSnapshot: {},
    createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    tenantId: 't1', requestedBy: 'u1',
  }

  it('analyzeRootCause 应返回根因', () => {
    const rca = service.analyzeRootCause(mockDiagnosis)
    expect(rca.rootCause).toBeTruthy()
    expect(rca.recommendedActions.length).toBeGreaterThan(0)
  })

  it('detectRuleConflicts 应检测冲突', () => {
    const r = service.detectRuleConflicts([mockDiagnosis])
    expect(r.totalRulesAnalyzed).toBe(2)
  })

  it('generateSuggestions 应返回建议', () => {
    const s = service.generateSuggestions(mockDiagnosis)
    expect(s.length).toBeGreaterThan(0)
    s.forEach((x: { category: string; priority: string }) => {
      expect(x.category).toBeTruthy()
      expect(x.priority).toBeTruthy()
    })
  })

  it('checkEngineHealth 应返回健康指标', () => {
    const h = service.checkEngineHealth('engine-1')
    expect(h.ruleCount).toBeGreaterThan(0)
    expect(h.uptime).toBeGreaterThan(90)
  })

  it('compareModels 应返回最佳', () => {
    const c = service.compareModels(['e1', 'e2'])
    expect(c.bestModel).toBeTruthy()
  })

  it('analyzeTrend 应检测趋势方向', () => {
    const t = service.analyzeTrend([mockDiagnosis], 'riskLevel', '7d')
    expect(['increasing', 'decreasing', 'stable', 'volatile']).toContain(t.trend)
  })
})
