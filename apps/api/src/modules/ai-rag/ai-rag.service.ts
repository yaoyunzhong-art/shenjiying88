/**
 * ai-rag.service.ts - T114-2
 * RAG 知识库 + NLP 话术生成服务
 *
 * 包含三个核心类:
 * - KnowledgeBaseManager: 知识库文档管理 (CRUD + embedding)
 * - RAGPipeline: RAG 检索增强生成
 * - SalesScriptGenerator: 销售话术生成
 */

import { Injectable, Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentChunk {
  id: string
  content: string
  metadata: Record<string, unknown>
}

export interface StoredDocument {
  id: string
  collection: string
  title?: string
  chunks: DocumentChunk[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface RetrievedChunk {
  chunk: DocumentChunk
  score: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ScriptGenerationOptions {
  tone?: 'professional' | 'friendly' | 'urgent'
  locale?: string
}

// ── KnowledgeBaseManager ──────────────────────────────────────────────────────

@Injectable()
export class KnowledgeBaseManager {
  private readonly logger = new Logger(KnowledgeBaseManager.name)
  private readonly documents = new Map<string, StoredDocument>()
  private readonly embeddingDimension = 128

  /**
   * 添加文档到知识库 (自动分段 + embedding)
   */
  addDocument(collection: string, doc: { id?: string; content: string; metadata?: Record<string, unknown> }): StoredDocument {
    const docId = doc.id ?? `doc-${crypto.randomUUID().slice(0, 8)}`
    const chunks = this.chunkAndEmbed(doc.content, docId, collection, doc.metadata)

    const stored: StoredDocument = {
      id: docId,
      collection,
      chunks,
      metadata: doc.metadata ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.documents.set(`${collection}:${docId}`, stored)
    this.logger.log(`[KB] Added doc ${docId} to collection ${collection} (${chunks.length} chunks)`)
    return stored
  }

  /**
   * 更新文档内容 (重建 chunk)
   */
  updateDocument(collection: string, docId: string, content: string, metadata?: Record<string, unknown>): StoredDocument | null {
    const key = `${collection}:${docId}`
    const existing = this.documents.get(key)
    if (!existing) {
      this.logger.warn(`[KB] Document ${docId} not found in collection ${collection}`)
      return null
    }

    const chunks = this.chunkAndEmbed(content, docId, collection, metadata)
    const updated: StoredDocument = {
      ...existing,
      chunks,
      metadata: metadata ?? {},
      updatedAt: new Date().toISOString(),
    }

    this.documents.set(key, updated)
    this.logger.log(`[KB] Updated doc ${docId} in collection ${collection}`)
    return updated
  }

  /**
   * 删除文档
   */
  deleteDocument(collection: string, docId: string): boolean {
    const key = `${collection}:${docId}`
    const deleted = this.documents.delete(key)
    if (deleted) {
      this.logger.log(`[KB] Deleted doc ${docId} from collection ${collection}`)
    }
    return deleted
  }

  /**
   * 获取文档
   */
  getDocument(collection: string, docId: string): StoredDocument | null {
    return this.documents.get(`${collection}:${docId}`) ?? null
  }

  /**
   * 列出集合中所有文档
   */
  listDocuments(collection: string): StoredDocument[] {
    return Array.from(this.documents.values()).filter((d) => d.collection === collection)
  }

  /**
   * 获取集合统计
   */
  getCollectionStats(collection: string): { documentCount: number; chunkCount: number } {
    const docs = this.listDocuments(collection)
    return {
      documentCount: docs.length,
      chunkCount: docs.reduce((sum, d) => sum + d.chunks.length, 0),
    }
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private chunkAndEmbed(content: string, docId: string, collection: string, metadata?: Record<string, unknown>): DocumentChunk[] {
    const chunkSize = 512
    const overlap = 64
    const chunks: DocumentChunk[] = []
    const texts = this.splitText(content, chunkSize, overlap)

    for (let i = 0; i < texts.length; i++) {
      const chunkId = `${docId}:chunk:${i}`
      chunks.push({
        id: chunkId,
        content: texts[i],
        metadata: {
          docId,
          collection,
          chunkIndex: i,
          ...metadata,
        },
      })
    }

    return chunks
  }

  private splitText(text: string, chunkSize: number, overlap: number): string[] {
    if (text.length <= chunkSize) {
      return [text]
    }

    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.slice(start, end))
      // Reached end of text — we're done
      if (end === text.length) break
      start = end - overlap
      // Guard against infinite loop when overlap causes no progress
      if (start >= text.length || start <= 0) break
    }

    return chunks
  }

  private mockEmbed(text: string): number[] {
    // 模拟 embedding: 生成归一化随机向量
    const vec = Array.from({ length: this.embeddingDimension }, () => Math.random())
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
    return vec.map((v) => v / norm)
  }
}

// ── RAGPipeline ───────────────────────────────────────────────────────────────

@Injectable()
export class RAGPipeline {
  private readonly logger = new Logger(RAGPipeline.name)

  constructor(private readonly kb: KnowledgeBaseManager) {}

  /**
   * 完整 RAG 查询: 检索 → 生成
   */
  async query(question: string, collection: string): Promise<{ answer: string; sources: string[] }> {
    const retrieved = this.retrieve(question, collection, 5)
    const context = retrieved.map((r) => r.chunk.content).join('\n\n')

    const answer = this.generateWithContext(question, context)
    const sources = Array.from(new Set(retrieved.map((r) => r.chunk.metadata.docId as string)))

    return { answer, sources }
  }

  /**
   * 检索与问题相关的文档 chunks
   */
  retrieve(question: string, collection: string, topK = 5): RetrievedChunk[] {
    const docs = this.kb.listDocuments(collection)
    if (docs.length === 0) {
      this.logger.warn(`[RAG] No documents in collection ${collection}`)
      return []
    }

    // 简单关键词匹配模拟语义检索
    const questionWords = question.toLowerCase().split(/\s+/)
    // For CJK text, also split into individual characters for finer matching
    const cjkChars = question.replace(/[a-zA-Z0-9\s]/g, '').split('')
    const scored: RetrievedChunk[] = []

    for (const doc of docs) {
      for (const chunk of doc.chunks) {
        const chunkContent = chunk.content.toLowerCase()
        // Score based on space-separated words
        const wordMatches = questionWords.filter((w) => chunkContent.includes(w)).length
        // Score based on individual CJK character matches
        const charMatches = cjkChars.filter((c) => chunkContent.includes(c)).length
        const charScore = cjkChars.length > 0 ? charMatches / cjkChars.length : 0
        // Use the better of word-based and char-based score
        const score = Math.max(
          questionWords.length > 0 ? wordMatches / questionWords.length : 0,
          charScore
        )

        if (score > 0) {
          scored.push({ chunk, score })
        }
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  /**
   * 基于上下文生成答案
   */
  generateWithContext(question: string, context: string): string {
    if (!context.trim()) {
      return '抱歉，我在知识库中没有找到相关信息。'
    }

    // 模拟 LLM 生成
    const relevantExcerpt = context.slice(0, 300)
    return `[RAG] 根据知识库信息:\n"${relevantExcerpt}..."\n\n针对您的问题"${question}"，答案是：以上内容提供了相关信息。`
  }

  /**
   * 多轮对话 RAG
   */
  async chat(messages: ChatMessage[], collection: string): Promise<{ reply: string; sources: string[] }> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMessage) {
      return { reply: '请问有什么可以帮您？', sources: [] }
    }

    const { answer, sources } = await this.query(lastUserMessage.content, collection)
    return { reply: answer, sources }
  }

  /**
   * 获取集合的 RAG 统计
   */
  getStats(collection: string): { documents: number; chunks: number } {
    const stats = this.kb.getCollectionStats(collection)
    return { documents: stats.documentCount, chunks: stats.chunkCount }
  }
}

// ── SalesScriptGenerator ──────────────────────────────────────────────────────

export type ToneType = 'professional' | 'friendly' | 'urgent'
export type ObjectionType = 'price' | 'quality' | 'competitor' | 'timing'

@Injectable()
export class SalesScriptGenerator {
  private readonly logger = new Logger(SalesScriptGenerator.name)

  private readonly tonePrefixes: Record<ToneType, string> = {
    professional: '【专业版】',
    friendly: '【亲和版】',
    urgent: '【紧迫版】',
  }

  private readonly objectionResponses: Record<ObjectionType, Record<ToneType, string[]>> = {
    price: {
      professional: [
        '我们的价格基于成本和品质保障，包含完善的售后服务。',
        '从长期投资回报来看，我们的产品价格具有更高的性价比。',
      ],
      friendly: [
        '价格确实很重要，但您用得放心才是关键呀！',
        '我们可以根据您的预算帮您选最合适的价格方案～',
      ],
      urgent: [
        '今日签约可享限时折扣价格，错过就没有了！',
        '价格库存紧张，建议您尽快决定以确保及时交付。',
      ],
    },
    quality: {
      professional: [
        '我们的产品通过 ISO 质量认证，符合行业最高标准。',
        '提供 2 年质保服务，质量问题免费上门维修。',
      ],
      friendly: [
        '质量这块您放心，很多老客户都用了好多年呢！',
        '我们支持先体验再决定，您可以先试试样品～',
      ],
      urgent: [
        '本月库存充足，发货快人一步！',
        '质量认证即将到期，现在购买最划算！',
      ],
    },
    competitor: {
      professional: [
        '与竞品相比，我们在功能完整性和技术支持方面更具优势。',
        '我们的研发团队持续迭代，确保技术领先。',
      ],
      friendly: [
        '每家都有自己的特点，您可以对比看看哪款更适合～',
        '我们的服务响应更快，客户口碑一直很好哦！',
      ],
      urgent: [
        '竞品也在推和我们类似的方案，早选早享受！',
        '本月促销力度最大，过了这村就没这店了！',
      ],
    },
    timing: {
      professional: [
        '建议您现在评估，待需求明确后可以快速启动。',
        '我们提供分阶段部署，最快 2 周可上线。',
      ],
      friendly: [
        '不着急的，慢慢考虑，有任何问题随时问我～',
        '可以先了解一下，等您准备好了再说！',
      ],
      urgent: [
        '活动本月截止，建议尽快锁定优惠。',
        '产能有限，现在下单可以保证交期。',
      ],
    },
  }

  /**
   * 生成产品介绍话术
   */
  generateProductScript(productId: string, tone: ToneType = 'professional'): string {
    const prefix = this.tonePrefixes[tone]
    const productInfo = this.getMockProductInfo(productId)

    const templates: Record<ToneType, (p: Record<string, string>) => string> = {
      professional: (p) =>
        `${prefix}产品 "${p.name}" 核心卖点:\n` +
        `1. ${p.feature1}\n2. ${p.feature2}\n3. ${p.feature3}\n\n` +
        `适用场景: ${p.scenario}\n报价区间: ${p.priceRange}`,

      friendly: (p) =>
        `${prefix}Hi！给您推荐 "${p.name}"～\n` +
        `✨ ${p.feature1}\n✨ ${p.feature2}\n✨ ${p.feature3}\n\n` +
        `适合: ${p.scenario}，价格也很美丽哦！`,

      urgent: (p) =>
        `${prefix}限时推荐 "${p.name}"！\n` +
        `🔥 ${p.feature1}\n🔥 ${p.feature2}\n🔥 ${p.feature3}\n\n` +
        `本月特惠: ${p.priceRange}，名额有限，先到先得！`,
    }

    return templates[tone](productInfo)
  }

  /**
   * 生成异议处理话术
   */
  generateObjectionScript(productId: string, objectionType: ObjectionType): string {
    const responses = this.objectionResponses[objectionType]
    const toneOptions = Object.keys(responses) as ToneType[]

    // 随机选择一种语气
    const tone = toneOptions[Math.floor(Math.random() * toneOptions.length)]
    const options = responses[tone]
    const response = options[Math.floor(Math.random() * options.length)]

    const productInfo = this.getMockProductInfo(productId)
    return `${response}\n\n产品 "${productInfo.name}" 的相关优势: ${productInfo.feature1}`
  }

  /**
   * 生成客户跟进话术
   */
  generateFollowUpScript(customerId: string): string {
    const customer = this.getMockCustomerInfo(customerId)
    const hour = new Date().getHours()
    const greeting = hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好'

    const templates = [
      `${greeting} ${customer.name}！我是您的专属顾问，关于您上次了解的 ${customer.lastProduct}，有什么进展吗？`,
      `${customer.name}您好！关于 ${customer.lastProduct} 的方案，想跟您确认一下是否还有其他疑问？`,
      `Hi ${customer.name}，${customer.lastProduct} 的最新优惠已经出来了，要不要给您详细介绍一下？`,
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  /**
   * 话术本地化
   */
  localizeScript(script: string, locale: string): string {
    const locales: Record<string, Record<string, string>> = {
      'zh-CN': {
        'Hi': '您好',
        'Hello': '您好',
        'Thanks': '谢谢',
        'thank you': '谢谢',
        'Discount': '优惠',
        'Offer': '优惠',
        'offer': '优惠',
        'Limited time': '限时',
        'Buy now': '立即购买',
      },
      'en-US': {
        '您好': 'Hello',
        '谢谢': 'Thanks',
        '优惠': 'discount',
        '限时': 'limited time',
        '立即购买': 'buy now',
      },
      'zh-TW': {
        '您好': '您好',
        '谢谢': '感謝',
        '优惠': '優惠',
        '限时': '限時',
        '立即购买': '立即購買',
      },
    }

    const dict = locales[locale] ?? locales['zh-CN']
    let localized = script
    for (const [en, zh] of Object.entries(dict)) {
      localized = localized.replace(new RegExp(en, 'gi'), zh)
    }
    return localized
  }

  // ── Mock Data Helpers ───────────────────────────────────────────────────

  private getMockProductInfo(productId: string): Record<string, string> {
    const products: Record<string, Record<string, string>> = {
      'prod-001': {
        name: '智能营销系统',
        feature1: 'AI 驱动的精准用户画像',
        feature2: '多渠道自动触达',
        feature3: '实时数据分析看板',
        scenario: '电商、零售、金融等行业',
        priceRange: '¥99,999 - ¥199,999/年',
      },
      'prod-002': {
        name: '会员管理系统',
        feature1: '全渠道会员统一运营',
        feature2: '积分、等级、权益一体化',
        feature3: '智能标签分层运营',
        scenario: '连锁门店、会员制企业',
        priceRange: '¥59,999 - ¥99,999/年',
      },
    }

    return products[productId] ?? {
      name: `产品 ${productId}`,
      feature1: '功能完善',
      feature2: '性能优异',
      feature3: '服务到位',
      scenario: '各类企业',
      priceRange: '面议',
    }
  }

  private getMockCustomerInfo(customerId: string): { name: string; lastProduct: string } {
    const customers: Record<string, { name: string; lastProduct: string }> = {
      'cust-001': { name: '张总', lastProduct: '智能营销系统' },
      'cust-002': { name: '李经理', lastProduct: '会员管理系统' },
    }

    return customers[customerId] ?? { name: '尊敬的客户', lastProduct: '我们的产品' }
  }
}
