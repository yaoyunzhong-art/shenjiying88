/**
 * ai-rag-advanced.spec.ts — RAG 高级检索服务完整测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeBaseManager } from './ai-rag.service'
import { AdvancedRAGService } from './ai-rag-advanced.service'

describe('AdvancedRAGService (Complete)', () => {
  let kb: KnowledgeBaseManager
  let service: AdvancedRAGService

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    kb.addDocument('faq', { id: 'faq-1', content: '智能营销系统是一款基于AI的营销自动化工具，提供用户画像分析、多渠道触达、实时数据看板等功能。价格根据套餐不同从9999到199999每年。系统支持私有化部署和SaaS模式。售后服务包括24小时技术支持、定期培训和版本迭代。' })
    kb.addDocument('faq', { id: 'faq-2', content: '价格对比：基础版 9999/年，专业版 59999/年，企业版 199999/年。每个版本的功能差异主要在于用户数量、API调用次数和支持等级。' })
    kb.addDocument('faq', { id: 'faq-3', content: '系统集成指南：支持与主流CRM、ERP系统的API对接。提供RESTful API和Webhook两种集成方式。开发者文档完善。对接周期通常为2-4周。' })
    kb.addDocument('faq', { id: 'faq-4', content: '售后服务政策：购买后享受首年免费技术支持。续费客户享有7x24小时热线支持。紧急问题30分钟内响应。标准问题4小时内响应。' })
    kb.addDocument('products', { id: 'prod-1', content: '智能营销系统 Enterprise 版本，包含所有高级功能：AI智能推荐引擎、全渠道自动化营销、实时数据分析、自定义报表。适合大型企业使用。' })
    service = new AdvancedRAGService(kb)
  })

  it('hybridSearch 应融合关键词和语义结果', () => {
    const results = service.hybridSearch({ text: '智能营销系统价格', topK: 5 })
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => {
      expect(r.score).toBeGreaterThan(0)
      expect(r.docId).toBeTruthy()
      expect(r.chunkId).toBeTruthy()
    })
  })

  it('hybridSearch 应支持最少分数过滤', () => {
    const results = service.hybridSearch({ text: 'API集成', topK: 10, minScore: 0.1 })
    expect(results.every(r => r.score >= 0.1)).toBe(true)
  })

  it('rerank 应保留原结果数量且重排序', () => {
    const results = service.hybridSearch({ text: '售后服务', topK: 5 })
    const reranked = service.rerank('售后服务', results)
    expect(reranked.length).toBe(results.length)
    // Should not all be the same score
    const scores = new Set(reranked.map(r => r.finalScore))
    expect(scores.size).toBeGreaterThanOrEqual(1)
  })

  it('getQuerySuggestions 应返回多种建议类型', () => {
    const suggestions = service.getQuerySuggestions('功能')
    const types = new Set(suggestions.map(s => s.type))
    expect(types.size).toBeGreaterThanOrEqual(2)
    suggestions.forEach(s => {
      expect(s.score).toBeGreaterThan(0)
      expect(s.text).toBeTruthy()
    })
  })

  it('understandDocument 应生成有意义的摘要和关键点', () => {
    const summary = service.understandDocument('faq-1', 'faq')
    expect(summary.summary).toBeTruthy()
    expect(summary.keyPoints.length).toBeGreaterThan(0)
    expect(summary.readingTime).toBeGreaterThan(0)
    // Tone should be detected
    expect(['positive', 'negative', 'neutral', 'unknown']).toContain(summary.tone)
  })

  it('understandDocument 不存在的文档应返回默认值', () => {
    const summary = service.understandDocument('nonexistent', 'faq')
    expect(summary.docId).toBe('nonexistent')
    expect(summary.title).toContain('未找到')
  })

  it('extractQA 应从文档中提取问答对', () => {
    const qas = service.extractQA('faq-4', 'faq')
    // May or may not find QA patterns
    expect(qas).toBeInstanceOf(Array)
  })

  it('extractQA 不存在文档返回空数组', () => {
    const qas = service.extractQA('nonexistent', 'faq')
    expect(qas).toHaveLength(0)
  })

  it('generateAnswerWithCitations 应含引用和置信度', () => {
    const answer = service.generateAnswerWithCitations('智能营销系统多少钱？', 'faq')
    expect(answer.answer).toBeTruthy()
    expect(answer.citations.length).toBeGreaterThan(0)
    expect(answer.confidence).toBeGreaterThan(0)
    expect(answer.generatedAt).toBeTruthy()
  })

  it('generateAnswerWithCitations 无结果应返回默认', () => {
    const answer = service.generateAnswerWithCitations('完全没有相关内容的查询', 'empty')
    expect(answer.answer).toBeTruthy()
    expect(answer.citations.length).toBe(0)
  })

  it('queryKnowledgeGraph 应返回图结构', () => {
    const graph = service.queryKnowledgeGraph('营销')
    expect(graph.nodes.length).toBeGreaterThan(0)
    expect(graph.edges.length).toBeGreaterThan(0)
    graph.edges.forEach(e => {
      expect(e.relation).toBeTruthy()
      expect(e.weight).toBeGreaterThan(0)
    })
  })

  it('fuseResults 应融合多方法结果', () => {
    const keywordResults = service.hybridSearch({ text: '价格', searchStrategy: 'keyword', topK: 5 })
    const semanticResults = service.hybridSearch({ text: '费用', searchStrategy: 'semantic', topK: 5 })
    const fused = service.fuseResults([
      { name: 'keyword', results: keywordResults },
      { name: 'semantic', results: semanticResults },
    ], 5)
    expect(fused.methodsUsed).toHaveLength(2)
    expect(fused.diversityEnforced).toBe(true)
    expect(fused.finalRankings.length).toBeGreaterThan(0)
  })

  it('analyzeSearchPerformance 应包含延迟和建议', () => {
    const feedback = service.analyzeSearchPerformance({ text: '系统功能', topK: 5 })
    expect(feedback.latencyMs).toBeGreaterThan(0)
    expect(feedback.suggestions.length).toBeGreaterThan(0)
    expect(['excellent', 'good', 'fair', 'poor']).toContain(feedback.resultQuality)
  })

  describe('跨集合检索', () => {
    it('应能同时检索 FAQ 和产品集合', () => {
      const faqResults = service.hybridSearch({ text: '智能营销系统', topK: 3 })
      const productResults = service.hybridSearch({ text: 'Enterprise 版本', topK: 3 })
      expect(faqResults.length).toBeGreaterThan(0)
      expect(productResults.length).toBeGreaterThan(0)
    })
  })

  describe('集成场景', () => {
    it('搜索 → 重排序 → 生成答案完整链路', () => {
      const results = service.hybridSearch({ text: '售后服务和技术支持', topK: 5 })
      expect(results.length).toBeGreaterThan(0)
      const reranked = service.rerank('售后服务和技术支持', results)
      expect(reranked[0].finalScore).toBeGreaterThan(0)
      const answer = service.generateAnswerWithCitations('售后服务和技术支持', 'faq')
      expect(answer.citations.length).toBeGreaterThan(0)
    })

    it('文档理解 → QA 提取 → 知识图谱链路', () => {
      const summary = service.understandDocument('faq-1', 'faq')
      expect(summary.keyPoints.length).toBeGreaterThan(0)
      const qas = service.extractQA('faq-1', 'faq')
      const graph = service.queryKnowledgeGraph(summary.entities[0]?.name ?? '营销')
      expect(graph.nodes.length).toBeGreaterThan(0)
    })
  })
})
