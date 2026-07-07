/**
 * ai-rag.controller.test.ts - RAG 知识库 Controller 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AiRagController } from './ai-rag.controller'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'

describe('AiRagController', () => {
  let controller: AiRagController
  let kb: KnowledgeBaseManager
  let rag: RAGPipeline
  let scriptGen: SalesScriptGenerator

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    rag = new RAGPipeline(kb)
    scriptGen = new SalesScriptGenerator()
    controller = new AiRagController(kb, rag, scriptGen)
  })

  // ─── 文档 CRUD ─────────────────────────────────────────────

  describe('createDocument', () => {
    it('RAG-CTRL-1 should create a document and return success', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.createDocument({ collection: 'faq', content: '测试内容', id: 'doc-1', title: '测试' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('doc-1')
      expect(result.data.collection).toBe('faq')
    })

    it('RAG-CTRL-2 should handle document creation error gracefully', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.createDocument({ collection: 'faq', content: '' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true) // addDocument handles empty content
      expect(result.data).toBeDefined()
    })
  })

  describe('listDocuments', () => {
    it('RAG-CTRL-3 should list documents by collection', async () => {
      kb.addDocument('faq', { id: 'doc-a', content: '内容A' })
      kb.addDocument('faq', { id: 'doc-b', content: '内容B' })
      kb.addDocument('products', { id: 'doc-c', content: '内容C' })

      const result = await new Promise<any>((resolve) => {
        controller.listDocuments('faq').subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('RAG-CTRL-4 should return empty array for unknown collection', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.listDocuments('nonexistent').subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('getDocument', () => {
    it('RAG-CTRL-5 should get existing document by id', async () => {
      kb.addDocument('faq', { id: 'doc-1', content: '查找我' })
      const result = await new Promise<any>((resolve) => {
        controller.getDocument('faq', 'doc-1').subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('doc-1')
    })

    it('RAG-CTRL-6 should return error for non-existent document', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.getDocument('faq', 'no-such-doc').subscribe(resolve)
      })
      expect(result.success).toBe(false)
      expect(result.message).toBe('文档不存在')
    })
  })

  describe('updateDocument', () => {
    it('RAG-CTRL-7 should update existing document', async () => {
      kb.addDocument('faq', { id: 'doc-u1', content: '原始内容' })
      const result = await new Promise<any>((resolve) => {
        controller.updateDocument('faq', 'doc-u1', { content: '更新内容' }).subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data.chunks[0].content).toContain('更新内容')
    })

    it('RAG-CTRL-8 should return error for non-existent document update', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.updateDocument('faq', 'nonexistent', { content: '内容' }).subscribe(resolve)
      })
      expect(result.success).toBe(false)
      expect(result.message).toBe('文档不存在')
    })
  })

  describe('deleteDocument', () => {
    it('RAG-CTRL-9 should delete existing document', async () => {
      kb.addDocument('faq', { id: 'doc-del', content: '待删除' })
      const result = await new Promise<any>((resolve) => {
        controller.deleteDocument('faq', 'doc-del').subscribe(resolve)
      })
      expect(result.success).toBe(true)
      // Verify deletion
      expect(kb.getDocument('faq', 'doc-del')).toBeNull()
    })

    it('RAG-CTRL-10 should return error for non-existent document', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.deleteDocument('faq', 'nonexistent').subscribe(resolve)
      })
      expect(result.success).toBe(false)
      expect(result.message).toBe('文档不存在')
    })
  })

  describe('getCollectionStats', () => {
    it('RAG-CTRL-11 should return collection stats', async () => {
      kb.addDocument('faq', { id: 'doc-s1', content: 'A'.repeat(1000) })
      kb.addDocument('faq', { id: 'doc-s2', content: '短内容' })

      const result = await new Promise<any>((resolve) => {
        controller.getCollectionStats('faq').subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data.documentCount).toBe(2)
      expect(result.data.chunkCount).toBeGreaterThan(0)
    })
  })

  // ─── RAG 查询 ──────────────────────────────────────────────

  describe('query', () => {
    it('RAG-CTRL-12 should perform RAG query and return answer', async () => {
      kb.addDocument('faq', { id: 'doc-q1', content: '重置密码：请访问设置页面。' })
      const result = await controller.query({ question: '重置密码', collection: 'faq' })
      expect(result.success).toBe(true)
      expect(result.data?.answer).toBeDefined()
      expect(result.data?.latencyMs).toBeGreaterThanOrEqual(0)
    })

    it('RAG-CTRL-13 should return empty answer for unknown content', async () => {
      const result = await controller.query({ question: 'unrelated question', collection: 'empty-collection' })
      expect(result.success).toBe(true)
      expect(result.data?.sources).toEqual([])
    })
  })

  describe('chat', () => {
    it('RAG-CTRL-14 should handle multi-turn chat', async () => {
      kb.addDocument('support', { id: 'doc-chat-1', content: '退款政策：7天内可申请退款。' })
      const result = await controller.chat({
        messages: [
          { role: 'user', content: '退款政策是什么？' },
        ],
        collection: 'support',
      })
      expect(result.success).toBe(true)
      expect(result.data?.reply).toContain('退款')
    })
  })

  describe('retrieve', () => {
    it('RAG-CTRL-15 should retrieve relevant chunks', async () => {
      kb.addDocument('docs', { id: 'doc-r1', content: 'NestJS 是 Node.js 框架。' })

      const result = await new Promise<any>((resolve) => {
        controller.retrieve({ question: 'NestJS', collection: 'docs', topK: 3 })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('RAG-CTRL-16 should respect topK limit', async () => {
      for (let i = 0; i < 5; i++) {
        kb.addDocument('docs', { id: `doc-topk-${i}`, content: `关键词段落 ${i}` })
      }
      const result = await new Promise<any>((resolve) => {
        controller.retrieve({ question: '关键词', collection: 'docs', topK: 2 })
          .subscribe(resolve)
      })
      expect(result.data.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getRagStats', () => {
    it('RAG-CTRL-17 should return RAG stats for collection', async () => {
      kb.addDocument('faq', { id: 'doc-rs1', content: '内容1' })
      kb.addDocument('faq', { id: 'doc-rs2', content: '内容2' })

      const result = await new Promise<any>((resolve) => {
        controller.getRagStats('faq').subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data.documents).toBe(2)
    })
  })

  // ─── 话术生成 ──────────────────────────────────────────────

  describe('generateProductScript', () => {
    it('RAG-CTRL-18 should generate professional product script', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.generateProductScript({ productId: 'prod-001', tone: 'professional' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toContain('【专业版】')
      expect(result.data).toContain('核心卖点')
    })

    it('RAG-CTRL-19 should generate friendly product script', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.generateProductScript({ productId: 'prod-001', tone: 'friendly' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toContain('【亲和版】')
    })

    it('RAG-CTRL-20 should generate urgent product script', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.generateProductScript({ productId: 'prod-001', tone: 'urgent' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toContain('【紧迫版】')
    })
  })

  describe('generateObjectionScript', () => {
    it('RAG-CTRL-21 should generate price objection script', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.generateObjectionScript({ productId: 'prod-001', objectionType: 'price' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('RAG-CTRL-22 should generate quality objection script', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.generateObjectionScript({ productId: 'prod-001', objectionType: 'quality' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('generateFollowUp', () => {
    it('RAG-CTRL-23 should generate follow-up with customer name', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.generateFollowUp({ customerId: 'cust-001' }).subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toContain('张总')
    })

    it('RAG-CTRL-24 should handle unknown customer', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.generateFollowUp({ customerId: 'unknown-id' }).subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toContain('尊敬的客户')
    })
  })

  describe('localizeScript', () => {
    it('RAG-CTRL-25 should localize to zh-CN', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.localizeScript({ script: 'Hello, Discount!', locale: 'zh-CN' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toContain('优惠')
    })

    it('RAG-CTRL-26 should localize to en-US', async () => {
      const result = await new Promise<any>((resolve) => {
        controller.localizeScript({ script: '您好，优惠！', locale: 'en-US' })
          .subscribe(resolve)
      })
      expect(result.success).toBe(true)
      expect(result.data).toContain('Hello')
    })
  })
})
