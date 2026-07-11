/**
 * ai-push-analytics.service.spec.ts — AI 推送分析服务完整测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { PushAnalyticsService } from './ai-push-analytics.service'
import { AdvancedRAGService } from './ai-rag-advanced.service'
import { KnowledgeBaseManager } from './ai-rag.service'

describe('PushAnalyticsService', () => {
  let service: PushAnalyticsService

  beforeEach(() => {
    service = new PushAnalyticsService()
  })

  it('getPerformanceSummary 应返回完整性能摘要', () => {
    const summary = service.getPerformanceSummary()
    expect(summary.totalPushes).toBeGreaterThan(0)
    expect(summary.totalDelivered).toBeGreaterThan(0)
    expect(summary.overallDeliveryRate).toBeGreaterThan(0)
    expect(summary.trends.deliveryByDay.length).toBe(7)
    expect(summary.trends.clickByDay.length).toBe(7)
  })

  it('compareChannels 应按评分降序排列', () => {
    const channels = service.compareChannels()
    expect(channels.length).toBeGreaterThan(0)
    for (let i = 1; i < channels.length; i++) {
      expect(channels[i - 1].score).toBeGreaterThanOrEqual(channels[i].score)
    }
  })

  it('analyzeSegmentResponse 应返回所有分群的分析', () => {
    const segments = service.analyzeSegmentResponse()
    expect(segments.length).toBeGreaterThan(0)
    segments.forEach(s => {
      expect(s.memberCount).toBeGreaterThan(0)
      expect(s.deliveryRate).toBeGreaterThan(0)
      expect(s.preferredChannel).toBeTruthy()
    })
  })

  it('getOptimalPushTimes 应返回推荐时段', () => {
    const times = service.getOptimalPushTimes()
    expect(times.length).toBeGreaterThan(0)
    expect(times.some(t => t.isRecommended)).toBe(true)
  })

  it('analyzeABTestResults 应包含实验结论', () => {
    const result = service.analyzeABTestResults('exp-001')
    expect(result.experimentId).toBe('exp-001')
    expect(result.winningVariant).toBeTruthy()
    expect(result.recommendation).toBeTruthy()
    expect(result.variants.length).toBeGreaterThanOrEqual(2)
  })

  it('getMultiChannelSequences 应返回预设序列', () => {
    const seqs = service.getMultiChannelSequences()
    expect(seqs.length).toBeGreaterThan(0)
    seqs.forEach(s => {
      expect(s.steps.length).toBeGreaterThan(0)
      expect(s.expectedRevenue).toBeGreaterThan(0)
    })
  })

  it('getHealthDashboard 应返回健康面板', () => {
    const dashboard = service.getHealthDashboard()
    expect(['good', 'fair', 'poor']).toContain(dashboard.overallHealth)
    expect(dashboard.recommendations.length).toBeGreaterThan(0)
    expect(dashboard.metrics.dailyPushCapacity).toBeGreaterThan(0)
  })

  it('getUserProfile 应返回带上下的用户标签', () => {
    const profile = service.getUserProfile('user-001')
    expect(profile.tags.length).toBeGreaterThan(0)
    expect(profile.preferredChannel).toBeTruthy()
    expect(profile.sensitivityScore).toBeGreaterThan(0)
  })

  it('attributionAnalysis 应返回通道转化归因', () => {
    const attr = service.attributionAnalysis('2026-07-01', '2026-07-11')
    expect(attr.totalConversions).toBeGreaterThan(0)
    expect(attr.channelContributions.length).toBeGreaterThan(0)
    attr.channelContributions.forEach(c => {
      expect(c.firstTouch).toBeGreaterThan(0)
      expect(c.lastTouch).toBeGreaterThan(0)
    })
  })
})

describe('AdvancedRAGService', () => {
  let kb: KnowledgeBaseManager
  let service: AdvancedRAGService

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    kb.addDocument('faq', {
      id: 'doc-1',
      content: '智能营销系统是一款基于AI的营销自动化工具，提供用户画像分析、多渠道触达、实时数据看板等功能。价格根据套餐不同从9999到199999每年。系统支持私有化部署和SaaS模式。售后服务包括24小时技术支持、定期培训和版本迭代。',
    })
    kb.addDocument('faq', {
      id: 'doc-2',
      content: '价格对比：基础版 9999/年，专业版 59999/年，企业版 199999/年。',
    })
    service = new AdvancedRAGService(kb)
  })

  it('hybridSearch 应返回有序的检索结果', () => {
    const results = service.hybridSearch({ text: '价格是多少', topK: 5 })
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r, idx) => {
      expect(r.rank).toBe(idx + 1)
      expect(r.score).toBeGreaterThan(0)
    })
  })

  it('rerank 应重新排序结果', () => {
    const results = service.hybridSearch({ text: '智能营销系统', topK: 5 })
    const reranked = service.rerank('智能营销系统功能', results)
    expect(reranked.length).toBe(results.length)
    reranked.forEach(r => {
      expect(r.finalScore).toBeGreaterThanOrEqual(0)
    })
  })

  it('getQuerySuggestions 应返回多种建议类型', () => {
    const suggestions = service.getQuerySuggestions('价格')
    const types = suggestions.map(s => s.type)
    expect(new Set(types).size).toBeGreaterThanOrEqual(2)
  })

  it('understandDocument 应返回文档摘要和理解', () => {
    const summary = service.understandDocument('doc-1', 'faq')
    expect(summary.docId).toBe('doc-1')
    expect(summary.summary).toBeTruthy()
    expect(summary.keyPoints.length).toBeGreaterThan(0)
    expect(summary.entities.length).toBeGreaterThanOrEqual(0)
    expect(summary.readingTime).toBeGreaterThan(0)
  })

  it('extractQA 应提取问答对', () => {
    const qas = service.extractQA('doc-1', 'faq')
    expect(qas).toBeInstanceOf(Array)
  })

  it('generateAnswerWithCitations 应返回带引用的答案', () => {
    const answer = service.generateAnswerWithCitations('智能营销系统有哪些功能？', 'faq')
    expect(answer.answer).toBeTruthy()
    expect(answer.citations.length).toBeGreaterThan(0)
    expect(answer.confidence).toBeGreaterThan(0)
  })

  it('queryKnowledgeGraph 应返回图结构', () => {
    const graph = service.queryKnowledgeGraph('智能营销')
    expect(graph.nodes.length).toBeGreaterThan(0)
    expect(graph.edges.length).toBeGreaterThan(0)
  })

  it('analyzeSearchPerformance 应包含性能指标和建议', () => {
    const feedback = service.analyzeSearchPerformance({ text: '价格', topK: 5 })
    expect(feedback.queryId).toBeTruthy()
    expect(feedback.latencyMs).toBeGreaterThan(0)
    expect(feedback.suggestions.length).toBeGreaterThan(0)
  })

  it('fuseResults 应融合多种检索方法', () => {
    const results = service.hybridSearch({ text: '智能营销', topK: 5 })
    const fused = service.fuseResults([
      { name: 'keyword', results },
      { name: 'semantic', results },
    ], 5)
    expect(fused.methodsUsed).toContain('keyword')
    expect(fused.finalRankings.length).toBeGreaterThan(0)
  })
})
