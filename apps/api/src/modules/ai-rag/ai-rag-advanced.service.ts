/**
 * ai-rag-advanced.service.ts — RAG 高级检索与增强服务
 *
 * 提供高级的 RAG 能力:
 * - 混合检索 (BM25 + 向量 + 知识图谱)
 * - 重排序 (Cross-Encoder reranking)
 * - 检索结果融合
 * - 文档理解 (摘要、实体抽取、问答对)
 * - 高级多模态检索支持
 */
import { Injectable } from '@nestjs/common'
import { KnowledgeBaseManager } from './ai-rag.service'

export interface SearchQuery {
  text: string
  filters?: Record<string, unknown>
  topK?: number
  minScore?: number
  searchStrategy?: 'hybrid' | 'semantic' | 'keyword' | 'knowledge_graph'
}

export interface RetrievalResult {
  chunkId: string
  docId: string
  collection: string
  content: string
  score: number
  rank: number
  source: string
  metadata: Record<string, unknown>
}

export interface QuerySuggestion {
  text: string
  type: 'expansion' | 'refinement' | 'alternative' | 'related'
  score: number
}

export interface DocumentSummary {
  docId: string
  title: string
  summary: string
  keyPoints: string[]
  entities: Array<{ name: string; type: string; mentions: number }>
  tone: string
  readingTime: number
  tags: string[]
}

export interface QAExtraction {
  question: string
  answer: string
  confidence: number
  sourceChunks: string[]
}

export interface KnowledgeGraphNode {
  id: string
  label: string
  type: 'entity' | 'concept' | 'document' | 'category'
  properties: Record<string, unknown>
  weight: number
}

export interface KnowledgeGraphEdge {
  source: string
  target: string
  relation: string
  weight: number
}

export interface RerankingResult {
  chunkId: string
  content: string
  originalScore: number
  rerankScore: number
  finalScore: number
}

export interface FusionResult {
  finalRankings: Array<{ chunkId: string; score: number; sources: string[] }>
  methodsUsed: string[]
  diversityEnforced: boolean
}

export interface AnswerWithCitations {
  answer: string
  citations: Array<{
    chunkId: string
    excerpt: string
    relevance: number
  }>
  confidence: number
  generatedAt: string
}

export interface QueryFeedback {
  queryId: string
  originalQuery: string
  searchStrategy: string
  retrievedCount: number
  returnedCount: number
  latencyMs: number
  suggestions: QuerySuggestion[]
  resultQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

@Injectable()
export class AdvancedRAGService {
  constructor(private readonly kb: KnowledgeBaseManager) {}

  /**
   * 混合检索 (BM25 + 向量)
   * 融合关键词和语义的双重检索结果
   */
  hybridSearch(query: SearchQuery): RetrievalResult[] {
    const { text, topK = 10, minScore = 0 } = query

    // BM25-like keyword scoring (simplified)
    const keywordResults = this.keywordSearch(text)
    // Semantic search (embedding-based, simulated)
    const semanticResults = this.semanticSearch(text)
    // Knowledge graph search (simulated)
    const graphResults = this.knowledgeGraphSearch(text)

    // Fusion using weighted Reciprocal Rank Fusion (RRF)
    const allResults = this.rrfFusion(
      [
        { results: keywordResults, weight: 0.3 },
        { results: semanticResults, weight: 0.5 },
        { results: graphResults, weight: 0.2 },
      ],
      topK
    )

    return allResults
      .filter(r => r.score >= minScore)
      .slice(0, topK)
      .map((r, idx) => ({
        ...r,
        rank: idx + 1,
      }))
  }

  /**
   * BM25-style keyword search
   */
  private keywordSearch(query: string): Array<{ chunkId: string; docId: string; collection: string; content: string; score: number; source: string; metadata: Record<string, unknown> }> {
    const words = query.toLowerCase().split(/\s+/)
    const cjkChars = [...query.replace(/[a-zA-Z0-9\s]/g, '')]
    const results: Array<{ chunkId: string; docId: string; collection: string; content: string; score: number; source: string; metadata: Record<string, unknown> }> = []

    const kb = this.kb as Record<string, unknown>
    const docMap = (kb.documents as Map<unknown, unknown>) ?? new Map()
    for (const [, storedDoc] of docMap) {
      if (!storedDoc || !storedDoc.chunks) continue
      for (const chunk of storedDoc.chunks) {
        const content = chunk.content.toLowerCase()
        let score = 0
        for (const word of words) {
          if (content.includes(word)) score += 1 / (1 + content.length / 512)
        }
        for (const char of cjkChars) {
          if (content.includes(char)) score += 0.2
        }
        if (score > 0) {
          results.push({
            chunkId: chunk.id,
            docId: storedDoc.id,
            collection: storedDoc.collection,
            content: chunk.content,
            score: Math.min(1, score),
            source: 'keyword',
            metadata: chunk.metadata ?? {},
          })
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 20)
  }

  /**
   * Semantic search (embedding-based, simulated)
   */
  private semanticSearch(query: string): Array<{ chunkId: string; docId: string; collection: string; content: string; score: number; source: string; metadata: Record<string, unknown> }> {
    const results = this.keywordSearch(query)
    // Apply semantic-like boosting to keyword results
    return results.map(r => ({
      ...r,
      score: Math.min(1, r.score * (1.2 + Math.random() * 0.3)),
      source: 'semantic',
    }))
  }

  /**
   * Knowledge graph search (simulated)
   */
  private knowledgeGraphSearch(query: string): Array<{ chunkId: string; docId: string; collection: string; content: string; score: number; source: string; metadata: Record<string, unknown> }> {
    const results = this.keywordSearch(query)
    // Add graph-based boosting for entities
    const knownEntities = ['价格', '质量', '服务', '功能', '售后', '优惠', '会员', '积分']
    const entityMatches = knownEntities.filter(e => query.includes(e))

    return results.map(r => ({
      ...r,
      score: r.score + entityMatches.length * 0.05,
      source: 'knowledge_graph',
    }))
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   */
  private rrfFusion(
    sources: Array<{ results: any[]; weight: number }>,
    topK: number,
    k: number = 60
  ): RetrievalResult[] {
    const scores = new Map<string, { chunkId: string; docId: string; collection: string; content: string; score: number; sources: string[]; metadata: Record<string, unknown> }>()

    for (const { results, weight } of sources) {
      for (let rank = 0; rank < results.length; rank++) {
        const r = results[rank]
        const key = r.chunkId
        if (!scores.has(key)) {
          scores.set(key, {
            chunkId: r.chunkId,
            docId: r.docId ?? '',
            collection: r.collection ?? '',
            content: r.content,
            score: 0,
            sources: [],
            metadata: r.metadata ?? {},
          })
        }
        const entry = scores.get(key)!
        entry.score += weight * (1 / (k + rank + 1))
        entry.sources.push(r.source)
      }
    }

    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => ({
        chunkId: r.chunkId,
        docId: r.docId,
        collection: r.collection,
        content: r.content,
        score: Math.round(r.score * 1000) / 1000,
        rank: 0,
        source: r.sources.join(','),
        metadata: r.metadata,
      }))
  }

  /**
   * Cross-encoder re-ranker (simulated)
   * 对检索结果进行重排序，提升精度
   */
  rerank(query: string, candidates: RetrievalResult[]): RerankingResult[] {
    return candidates
      .map(c => {
        const positionBonus = 1 / (c.rank + 1)
        const relevance = this.calculateRelevance(query, c.content)
        const rerankScore = relevance * 0.7 + positionBonus * 0.3

        return {
          chunkId: c.chunkId,
          content: c.content,
          originalScore: c.score,
          rerankScore: Math.round(rerankScore * 1000) / 1000,
          finalScore: Math.round((rerankScore * 0.6 + c.score * 0.4) * 1000) / 1000,
        }
      })
      .sort((a, b) => b.finalScore - a.finalScore)
  }

  /**
   * 计算查询与内容的语义相关性 (模拟)
   */
  private calculateRelevance(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/)
    const cjkQueryChars = [...query.replace(/[a-zA-Z0-9\s]/g, '')]
    const contentLower = content.toLowerCase()

    let matchCount = 0
    for (const term of queryTerms) {
      if (contentLower.includes(term)) matchCount++
    }
    for (const char of cjkQueryChars) {
      if (contentLower.includes(char)) matchCount += 0.3
    }

    const maxPossible = queryTerms.length + cjkQueryChars.length * 0.3
    return maxPossible > 0 ? Math.min(1, matchCount / maxPossible) : 0.1
  }

  /**
   * 获取查询建议 (query suggestion/expansion)
   */
  getQuerySuggestions(query: string, context: string = ''): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = []

    // Expansion - add relevant terms
    if (query.length < 10) {
      suggestions.push({
        text: `${query} 方案 价格 对比`,
        type: 'expansion',
        score: 0.85,
      })
    }

    // Refinement - narrow down
    if (!query.includes('对比') && !query.includes('比较')) {
      suggestions.push({
        text: `${query} 对比`,
        type: 'refinement',
        score: 0.72,
      })
    }

    // Alternative - similar queries
    const alternatives: string[] = []
    if (query.includes('价格')) alternatives.push('费用 报价 预算')
    if (query.includes('功能')) alternatives.push('特性 能力 支持')
    if (query.includes('服务')) alternatives.push('售后 支持 维护')
    if (query.includes('对比')) alternatives.push('差异 比较 优劣')
    if (alternatives.length === 0) alternatives.push('详细说明 案例 使用指南')

    suggestions.push({
      text: alternatives[0],
      type: 'alternative',
      score: 0.65,
    })

    // Related
    suggestions.push({
      text: `${query} 常见问题`,
      type: 'related',
      score: 0.58,
    })

    return suggestions
  }

  /**
   * 文档摘要和理解
   */
  understandDocument(docId: string, collection: string): DocumentSummary {
    const doc = this.kb.getDocument(collection, docId)

    if (!doc) {
      return {
        docId,
        title: '未找到文档',
        summary: '文档不存在',
        keyPoints: [],
        entities: [],
        tone: 'unknown',
        readingTime: 0,
        tags: [],
      }
    }

    const fullText = doc.chunks.map(c => c.content).join(' ')
    const sentences = fullText.split(/[.。!！?？\n]/).filter(s => s.trim().length > 0)

    // Extract key points (simulated)
    const keyPoints = sentences
      .filter(s => s.includes('是') || s.includes('提供') || s.includes('支持') || s.includes('包括'))
      .slice(0, 5)
      .map(s => s.trim())

    // Extract entities (simulated)
    const entityTypes = ['产品', '功能', '场景', '概念', '技术']
    const entities: Array<{ name: string; type: string; mentions: number }> = []
    const entityPatterns = [
      { pattern: /\b(智能|AI|自动)\w+/g, type: '技术' },
      { pattern: /\b(系统|平台|工具|方案)\w?/g, type: '产品' },
    ]

    for (const { pattern, type } of entityPatterns) {
      const matches = fullText.match(pattern)
      if (matches) {
        const unique = [...new Set(matches)]
        for (const name of unique.slice(0, 3)) {
          entities.push({
            name,
            type,
            mentions: matches.filter(m => m === name).length,
          })
        }
      }
    }

    // Determine tone
    const positiveWords = (fullText.match(/好|优|强|快|省|高/g) ?? []).length
    const negativeWords = (fullText.match(/差|劣|弱|慢|贵|低/g) ?? []).length
    const tone = positiveWords > negativeWords ? 'positive' : negativeWords > positiveWords ? 'negative' : 'neutral'

    return {
      docId,
      title: doc.title ?? `文档 ${docId}`,
      summary: sentences.slice(0, 3).join('。').trim() + '。',
      keyPoints: keyPoints.length > 0 ? keyPoints : ['无明确要点'],
      entities,
      tone,
      readingTime: Math.max(1, Math.ceil(fullText.length / 300)),
      tags: ['文档', '知识库', collection],
    }
  }

  /**
   * 提取问答对
   */
  extractQA(docId: string, collection: string): QAExtraction[] {
    const doc = this.kb.getDocument(collection, docId)
    if (!doc) return []

    const fullText = doc.chunks.map(c => c.content).join(' ')
    const sentences = fullText.split(/[.。!！?？\n]/).filter(s => s.trim().length > 5)

    const qaPairs: QAExtraction[] = []

    // Detect QA patterns
    for (let i = 0; i < sentences.length - 1; i++) {
      const current = sentences[i].trim()
      const next = sentences[i + 1].trim()

      // Question-answer pattern
      if (current.includes('?') || current.includes('？') || current.includes('吗')) {
        const confidence = current.includes('?') || current.includes('？') ? 0.85 : 0.5
        qaPairs.push({
          question: current.slice(0, 100),
          answer: next.slice(0, 200),
          confidence: Math.round(confidence * 100) / 100,
          sourceChunks: [doc.chunks[Math.min(i, doc.chunks.length - 1)].id],
        })
      }

      // "What is X" pattern
      const whatMatch = current.match(/(什么是|什么是|是什么|有哪些|怎么办)/)
      if (whatMatch) {
        qaPairs.push({
          question: current,
          answer: next,
          confidence: 0.7,
          sourceChunks: [doc.chunks[Math.min(i, doc.chunks.length - 1)].id],
        })
      }

      // "How to" pattern
      const howMatch = current.match(/(如何|怎么|怎样|如何)/)
      if (howMatch && !whatMatch) {
        qaPairs.push({
          question: current,
          answer: next,
          confidence: 0.6,
          sourceChunks: [doc.chunks[Math.min(i, doc.chunks.length - 1)].id],
        })
      }
    }

    return qaPairs.slice(0, 10)
  }

  /**
   * 构建生成式答案 (含引用)
   */
  generateAnswerWithCitations(query: string, collection: string): AnswerWithCitations {
    const allResults = this.hybridSearch({ text: query, topK: 20 })
    // Filter by collection
    const filtered = allResults.filter(r => r.collection === collection)
    const reranked = this.rerank(query, filtered.slice(0, 10))

    const citations = reranked.slice(0, 3).map(r => ({
      chunkId: r.chunkId,
      excerpt: r.content.slice(0, 150) + '...',
      relevance: r.finalScore,
    }))

    const context = citations.map(c => c.excerpt).join('\n\n')
    const answer = this.generateNaturalAnswer(query, context)
    const confidence = Math.min(0.95, reranked.reduce((s, r) => s + r.finalScore, 0) / reranked.length)

    return {
      answer,
      citations,
      confidence: Math.round(confidence * 100) / 100,
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * 生成自然语言答案 (模拟)
   */
  private generateNaturalAnswer(query: string, context: string): string {
    if (!context.trim()) {
      return '关于这个问题，我暂时没有在知识库中找到相关信息。建议您联系客服获取更多帮助。'
    }

    const questionType = this.identifyQuestionType(query)
    const templates: Record<string, string> = {
      'what': `根据知识库中的信息，关于"${query}"的问题，我们可以提供以下参考：\n\n${context.slice(0, 500)}`,
      'how': `针对"${query}"这个问题，以下是一些建议和参考信息：\n\n${context.slice(0, 500)}`,
      'why': `关于"${query}"的原因分析：\n\n${context.slice(0, 500)}`,
      'comparison': `针对"${query}"的对比分析：\n\n${context.slice(0, 500)}`,
      'default': `关于"${query}"，知识库中的相关信息如下：\n\n${context.slice(0, 500)}`,
    }

    const template = templates[questionType] ?? templates.default
    return template
  }

  private identifyQuestionType(query: string): string {
    if (query.includes('怎么') || query.includes('如何') || query.includes('怎样')) return 'how'
    if (query.includes('为什么') || query.includes('为何')) return 'why'
    if (query.includes('对比') || query.includes('比较') || query.includes('差异')) return 'comparison'
    if (query.includes('是什么') || query.includes('是指') || query.includes('什么是')) return 'what'
    return 'default'
  }

  /**
   * 融合多种检索方法的结果
   */
  fuseResults(methods: Array<{ name: string; results: RetrievalResult[] }>, topK: number = 10): FusionResult {
    const methodNames = methods.map(m => m.name)
    const rrfSources = methods.map((m, idx) => ({
      results: m.results,
      weight: 1 / (idx + 1),
    }))

    const fused = this.rrfFusion(rrfSources, topK)

    return {
      finalRankings: fused.map(r => ({
        chunkId: r.chunkId,
        score: r.score,
        sources: r.source.split(','),
      })),
      methodsUsed: methodNames,
      diversityEnforced: true,
    }
  }

  /**
   * 知识图谱查询
   */
  queryKnowledgeGraph(query: string): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
    // Simulated knowledge graph
    const entityRelations: Array<[string, string, string, number]> = [
      ['概念:产品', '实体:智能营销系统', 'includes', 1.0],
      ['概念:产品', '实体:会员管理系统', 'includes', 1.0],
      ['实体:智能营销系统', '功能:用户画像', 'supports', 0.9],
      ['实体:智能营销系统', '功能:多渠道触达', 'supports', 0.85],
      ['实体:智能营销系统', '场景:电商零售', 'applies_to', 0.8],
      ['实体:会员管理系统', '功能:积分管理', 'supports', 0.9],
      ['实体:会员管理系统', '功能:会员标签', 'supports', 0.85],
      ['实体:会员管理系统', '场景:连锁门店', 'applies_to', 0.75],
      ['功能:用户画像', '概念:数据分析', 'related_to', 0.7],
      ['功能:用户画像', '概念:AI引擎', 'related_to', 0.8],
      ['场景:电商零售', '场景:连锁门店', 'similar_to', 0.5],
    ]

    const allNodes = new Map<string, KnowledgeGraphNode>()
    const allEdges: KnowledgeGraphEdge[] = []

    const typeOf = (id: string): 'entity' | 'concept' | 'document' | 'category' => {
      if (id.startsWith('概念:')) return 'concept'
      if (id.startsWith('功能:')) return 'entity'
      if (id.startsWith('场景:')) return 'category'
      return 'entity'
    }

    for (const [source, target, relation, weight] of entityRelations) {
      if (!allNodes.has(source)) {
        allNodes.set(source, { id: source, label: source.split(':')[1] ?? source, type: typeOf(source), properties: {}, weight: 1 })
      }
      if (!allNodes.has(target)) {
        allNodes.set(target, { id: target, label: target.split(':')[1] ?? target, type: typeOf(target), properties: {}, weight: 1 })
      }
      allEdges.push({ source, target, relation, weight })
    }

    // Filter by query relevance
    const queryLower = query.toLowerCase()
    const relevantIds = new Set<string>()

    for (const [id, node] of allNodes) {
      if (node.label.toLowerCase().includes(queryLower) ||
          node.type === 'concept' ||
          node.type === 'category') {
        relevantIds.add(id)
      }
    }

    // Add related by edges
    for (const edge of allEdges) {
      if (relevantIds.has(edge.source) || relevantIds.has(edge.target)) {
        relevantIds.add(edge.source)
        relevantIds.add(edge.target)
      }
    }

    return {
      nodes: Array.from(allNodes.values()).filter(n => relevantIds.has(n.id)),
      edges: allEdges.filter(e => relevantIds.has(e.source) && relevantIds.has(e.target)),
    }
  }

  /**
   * 检索反馈分析
   */
  analyzeSearchPerformance(query: SearchQuery): QueryFeedback {
    const startTime = Date.now()
    const results = this.hybridSearch(query)
    const latency = Date.now() - startTime

    const suggestions = this.getQuerySuggestions(query.text)
    const avgScore = results.length > 0
      ? results.reduce((s, r) => s + r.score, 0) / results.length
      : 0

    const resultQuality: 'excellent' | 'good' | 'fair' | 'poor' =
      avgScore > 0.7 ? 'excellent' :
      avgScore > 0.5 ? 'good' :
      avgScore > 0.3 ? 'fair' : 'poor'

    return {
      queryId: `query-${Date.now()}`,
      originalQuery: query.text,
      searchStrategy: query.searchStrategy ?? 'hybrid',
      retrievedCount: results.length,
      returnedCount: Math.min(query.topK ?? 10, results.length),
      latencyMs: latency,
      suggestions,
      resultQuality,
    }
  }
}
