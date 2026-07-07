import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ai-rag.test.ts - T114-2
 * RAG 知识库 + 话术生成服务测试 (22 tests)
 */
import {
  KnowledgeBaseManager,
  RAGPipeline,
  SalesScriptGenerator,
  ToneType,
  ObjectionType,
} from './ai-rag.service'

// ── KnowledgeBaseManager Tests ─────────────────────────────────────────────────

describe('KnowledgeBaseManager', () => {
  let kb: KnowledgeBaseManager

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
  })

  describe('addDocument', () => {
    it('RAG-1 should add a document with auto-generated ID', () => {
      const doc = kb.addDocument('products', { content: '这是一段测试内容。' })
      expect(doc.id).toBeDefined()
      expect(doc.collection).toBe('products')
      expect(doc.chunks.length).toBeGreaterThan(0)
    })

    it('RAG-2 should add a document with custom ID', () => {
      const doc = kb.addDocument('products', { id: 'my-doc-001', content: '自定义ID的文档' })
      expect(doc.id).toBe('my-doc-001')
    })

    it('RAG-3 should split long content into chunks', () => {
      const longContent = 'A'.repeat(1000)
      const doc = kb.addDocument('products', { content: longContent })
      expect(doc.chunks.length).toBeGreaterThan(1)
    })

    it('RAG-4 should preserve metadata in chunks', () => {
      const doc = kb.addDocument('products', {
        content: '测试内容',
        metadata: { author: 'tester', version: 1 },
      })
      expect(doc.chunks[0].metadata.author).toBe('tester')
      expect(doc.chunks[0].metadata.version).toBe(1)
    })
  })

  describe('updateDocument', () => {
    it('RAG-5 should update existing document', () => {
      kb.addDocument('products', { id: 'doc-001', content: '原始内容' })
      const updated = kb.updateDocument('products', 'doc-001', '更新后的内容')
      expect(updated).not.toBeNull()
      expect(updated?.chunks[0].content).toContain('更新后的内容')
    })

    it('RAG-6 should return null for non-existent document', () => {
      const result = kb.updateDocument('products', 'nonexistent', 'content')
      expect(result).toBeNull()
    })

    it('RAG-7 should rebuild chunks after update', () => {
      kb.addDocument('products', { id: 'doc-002', content: '短内容' })
      const updated = kb.updateDocument('products', 'doc-002', 'A'.repeat(1000))
      expect(updated!.chunks.length).toBeGreaterThan(1)
    })
  })

  describe('deleteDocument', () => {
    it('RAG-8 should delete existing document', () => {
      kb.addDocument('products', { id: 'doc-003', content: '待删除' })
      const deleted = kb.deleteDocument('products', 'doc-003')
      expect(deleted).toBe(true)
      expect(kb.getDocument('products', 'doc-003')).toBeNull()
    })

    it('RAG-9 should return false for non-existent document', () => {
      const deleted = kb.deleteDocument('products', 'nonexistent')
      expect(deleted).toBe(false)
    })
  })

  describe('getDocument', () => {
    it('RAG-10 should retrieve added document', () => {
      kb.addDocument('products', { id: 'doc-004', content: '检索测试' })
      const doc = kb.getDocument('products', 'doc-004')
      expect(doc).not.toBeNull()
      expect(doc!.id).toBe('doc-004')
    })

    it('RAG-11 should return null for missing document', () => {
      const doc = kb.getDocument('products', 'missing')
      expect(doc).toBeNull()
    })
  })

  describe('listDocuments', () => {
    it('RAG-12 should list all documents in collection', () => {
      kb.addDocument('products', { id: 'doc-a', content: '内容A' })
      kb.addDocument('products', { id: 'doc-b', content: '内容B' })
      kb.addDocument('other', { id: 'doc-c', content: '内容C' })

      const docs = kb.listDocuments('products')
      expect(docs.length).toBe(2)
    })
  })

  describe('getCollectionStats', () => {
    it('RAG-13 should return correct document and chunk counts', () => {
      kb.addDocument('products', { id: 'doc-stat-1', content: 'A'.repeat(1000) })
      kb.addDocument('products', { id: 'doc-stat-2', content: 'B'.repeat(500) })

      const stats = kb.getCollectionStats('products')
      expect(stats.documentCount).toBe(2)
      expect(stats.chunkCount).toBeGreaterThan(0)
    })
  })
})

// ── RAGPipeline Tests ─────────────────────────────────────────────────────────

describe('RAGPipeline', () => {
  let kb: KnowledgeBaseManager
  let rag: RAGPipeline

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    rag = new RAGPipeline(kb)
  })

  describe('query', () => {
    it('RAG-14 should return answer with sources', async () => {
      kb.addDocument('products', { id: 'doc-q1', content: '人工智能是未来的核心技术。' })
      const result = await rag.query('人工智能', 'products')
      expect(result.answer).toBeDefined()
      expect(Array.isArray(result.sources)).toBe(true)
    })

    it('RAG-15 should include retrieved content in answer', async () => {
      kb.addDocument('faq', { id: 'faq-001', content: '如何重置密码？请访问设置页面。' })
      const result = await rag.query('重置密码', 'faq')
      expect(result.answer).toContain('知识库')
    })
  })

  describe('retrieve', () => {
    it('RAG-16 should find relevant chunks by keyword', () => {
      kb.addDocument('docs', { id: 'doc-r1', content: 'NestJS 是优秀的 Node.js 框架。' })
      kb.addDocument('docs', { id: 'doc-r2', content: 'React 是用于构建 UI 的库。' })

      const results = rag.retrieve('NestJS', 'docs', 5)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].chunk.content).toContain('NestJS')
    })

    it('RAG-17 should respect topK limit', () => {
      for (let i = 0; i < 10; i++) {
        kb.addDocument('docs', { id: `doc-topk-${i}`, content: `内容段落 ${i} 包含关键词` })
      }

      const results = rag.retrieve('关键词', 'docs', 3)
      expect(results.length).toBeLessThanOrEqual(3)
    })

    it('RAG-18 should return empty for empty collection', () => {
      const results = rag.retrieve('query', 'empty-collection', 5)
      expect(results).toEqual([])
    })
  })

  describe('chat', () => {
    it('RAG-19 should extract last user message for RAG query', async () => {
      kb.addDocument('support', { id: 'doc-chat-1', content: '退款政策：7天内可申请全额退款。' })
      const messages = [
        { role: 'user' as const, content: '你好' },
        { role: 'assistant' as const, content: '您好，有什么可以帮您？' },
        { role: 'user' as const, content: '退款政策是什么？' },
      ]

      const result = await rag.chat(messages, 'support')
      expect(result.reply).toContain('退款')
    })

    it('RAG-20 should handle empty messages', async () => {
      const result = await rag.chat([], 'support')
      expect(result.reply).toContain('帮您')
    })
  })
})

// ── SalesScriptGenerator Tests ────────────────────────────────────────────────

describe('SalesScriptGenerator', () => {
  let generator: SalesScriptGenerator

  beforeEach(() => {
    generator = new SalesScriptGenerator()
  })

  describe('generateProductScript', () => {
    it('RAG-21 should generate script with professional tone', () => {
      const script = generator.generateProductScript('prod-001', 'professional')
      expect(script).toContain('【专业版】')
      expect(script).toContain('核心卖点')
    })

    it('RAG-22 should generate script with friendly tone', () => {
      const script = generator.generateProductScript('prod-001', 'friendly')
      expect(script).toContain('【亲和版】')
      expect(script).toContain('推荐')
    })

    it('RAG-23 should generate script with urgent tone', () => {
      const script = generator.generateProductScript('prod-001', 'urgent')
      expect(script).toContain('【紧迫版】')
      expect(script).toContain('限时')
    })
  })

  describe('generateObjectionScript', () => {
    it('RAG-24 should generate price objection script', () => {
      const script = generator.generateObjectionScript('prod-001', 'price')
      expect(script.length).toBeGreaterThan(0)
      expect(script).toContain('价格')
    })

    it('RAG-25 should generate quality objection script', () => {
      const script = generator.generateObjectionScript('prod-001', 'quality')
      expect(script.length).toBeGreaterThan(0)
    })

    it('RAG-26 should generate competitor objection script', () => {
      const script = generator.generateObjectionScript('prod-001', 'competitor')
      expect(script.length).toBeGreaterThan(0)
    })

    it('RAG-27 should generate timing objection script', () => {
      const script = generator.generateObjectionScript('prod-001', 'timing')
      expect(script.length).toBeGreaterThan(0)
    })
  })

  describe('generateFollowUpScript', () => {
    it('RAG-28 should include customer name in follow-up script', () => {
      const script = generator.generateFollowUpScript('cust-001')
      expect(script).toContain('张总')
    })

    it('RAG-29 should include last product in follow-up script', () => {
      const script = generator.generateFollowUpScript('cust-001')
      expect(script).toContain('智能营销系统')
    })

    it('RAG-30 should handle unknown customer gracefully', () => {
      const script = generator.generateFollowUpScript('unknown')
      expect(script).toContain('尊敬的客户')
    })
  })

  describe('localizeScript', () => {
    it('RAG-31 should localize to zh-CN', () => {
      const script = 'Hello, thanks for your interest. Limited time offer!'
      const localized = generator.localizeScript(script, 'zh-CN')
      expect(localized).toContain('您好')
      expect(localized).toContain('优惠')
    })

    it('RAG-32 should localize to en-US', () => {
      const script = '您好，感谢您的兴趣。限时优惠！'
      const localized = generator.localizeScript(script, 'en-US')
      expect(localized).toContain('Hello')
      expect(localized).toContain('discount')
    })

    it('RAG-33 should default to zh-CN for unknown locale', () => {
      const script = 'Hello'
      const localized = generator.localizeScript(script, 'unknown-locale')
      expect(localized).toContain('您好')
    })
  })
})
