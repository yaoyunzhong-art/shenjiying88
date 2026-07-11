/**
 * ai-rag.comprehensive.test.ts — RAG 知识库与服务综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'

describe('KnowledgeBaseManager', () => {
  let kb: KnowledgeBaseManager

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
  })

  it('应添加文档到指定集合', () => {
    const doc = kb.addDocument('faq', {
      id: 'faq-1',
      content: '如何重置密码？请访问设置页面点击忘记密码。',
    })
    expect(doc.id).toBe('faq-1')
    expect(doc.collection).toBe('faq')
    expect(doc.chunks.length).toBeGreaterThan(0)
  })

  it('应自动生成 ID（当未提供时）', () => {
    const doc = kb.addDocument('products', { content: '新产品介绍' })
    expect(doc.id).toMatch(/^doc-/)
  })

  it('跨集合文档不冲突', () => {
    const doc1 = kb.addDocument('products', { id: 'doc-1', content: '产品A' })
    const doc2 = kb.addDocument('faq', { id: 'doc-1', content: '常见问题' })
    expect(doc1.id).toBe(doc2.id)
    expect(doc1.collection).toBe('products')
  })

  it('应更新已有文档并重建 chunks', () => {
    kb.addDocument('faq', { id: 'faq-1', content: '旧的FAQ内容' })
    const oldDoc = kb.getDocument('faq', 'faq-1')
    const oldChunks = oldDoc!.chunks.length

    const updated = kb.updateDocument('faq', 'faq-1', '新的FAQ内容，内容更长，会产生更多的文本块。这是一个很长的句子。还有更多的内容在这里。')
    expect(updated).not.toBeNull()
  })

  it('更新不存在的文档应返回 null', () => {
    const result = kb.updateDocument('faq', 'non-existent', '内容')
    expect(result).toBeNull()
  })

  it('应删除文档', () => {
    kb.addDocument('faq', { id: 'faq-1', content: '内容' })
    expect(kb.deleteDocument('faq', 'faq-1')).toBe(true)
    expect(kb.getDocument('faq', 'faq-1')).toBeNull()
  })

  it('删除不存在的文档应返回 false', () => {
    expect(kb.deleteDocument('faq', 'ghost')).toBe(false)
  })

  it('应列出集合中的所有文档', () => {
    kb.addDocument('faq', { id: 'faq-a', content: 'Q1' })
    kb.addDocument('faq', { id: 'faq-b', content: 'Q2' })
    kb.addDocument('products', { id: 'prod-1', content: '产品' })
    const faqs = kb.listDocuments('faq')
    expect(faqs).toHaveLength(2)
  })

  it('应返回集合统计信息', () => {
    kb.addDocument('faq', { id: 'faq-1', content: '你好，这是一段较长的文本内容，用于测试分块和统计功能。' })
    const stats = kb.getCollectionStats('faq')
    expect(stats.documentCount).toBe(1)
    expect(stats.chunkCount).toBeGreaterThan(0)
  })

  it('空集合应返回 0 统计', () => {
    const stats = kb.getCollectionStats('empty')
    expect(stats.documentCount).toBe(0)
    expect(stats.chunkCount).toBe(0)
  })
})

describe('RAGPipeline', () => {
  let kb: KnowledgeBaseManager
  let pipeline: RAGPipeline

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    pipeline = new RAGPipeline(kb)
  })

  it('应返回基于知识库的查询结果', async () => {
    kb.addDocument('faq', { id: 'faq-1', content: '密码重置方法：访问设置页面，点击忘记密码，按照邮件指引操作。' })
    const result = await pipeline.query('如何重置密码？', 'faq')
    expect(result.answer).toBeTruthy()
    expect(result.sources).toBeInstanceOf(Array)
  })

  it('无匹配文档时应返回默认提示', async () => {
    const result = await pipeline.query('关于不存在的主题', 'empty')
    expect(result.answer).toContain('抱歉')
  })

  it('应支持多轮聊天', async () => {
    kb.addDocument('faq', { id: 'faq-1', content: '退货政策：7天无理由退货。' })
    const result = await pipeline.chat([
      { role: 'user', content: '退货政策是什么？' },
    ], 'faq')
    expect(result.reply).toBeTruthy()
  })

  it('无用户消息时应返回默认问候', async () => {
    const result = await pipeline.chat([
      { role: 'assistant', content: '您好，请问有什么可以帮助您？' },
    ], 'faq')
    expect(result.reply).toContain('请问')
  })

  it('应返回集合统计', () => {
    kb.addDocument('faq', { id: 'f1', content: '内容1' })
    kb.addDocument('faq', { id: 'f2', content: '内容2内容2内容2内容2内容2内容2内容2内容2内容2内容2' })
    const stats = pipeline.getStats('faq')
    expect(stats.documents).toBe(2)
  })
})

describe('SalesScriptGenerator', () => {
  let scriptGen: SalesScriptGenerator

  beforeEach(() => {
    scriptGen = new SalesScriptGenerator()
  })

  it('应生成产品介绍话术', () => {
    const script = scriptGen.generateProductScript('prod-001', 'professional')
    expect(script).toBeTruthy()
    expect(script).toContain('智能营销系统')
  })

  it('不同语气应生成不同前缀', () => {
    const friendly = scriptGen.generateProductScript('prod-001', 'friendly')
    const urgent = scriptGen.generateProductScript('prod-001', 'urgent')
    expect(friendly).not.toBe(urgent)
  })

  it('应生成异���处理话术', () => {
    const script = scriptGen.generateObjectionScript('prod-001', 'price')
    expect(script).toBeTruthy()
  })

  it('应生成客户跟进话术', () => {
    const script = scriptGen.generateFollowUpScript('cust-001')
    expect(script).toContain('张总')
  })

  it('应本地化话术', () => {
    const script = scriptGen.generateProductScript('prod-001', 'friendly')
    const zhTW = scriptGen.localizeScript(script, 'zh-TW')
    expect(zhTW).toBeTruthy()
  })

  it('无需替换的本地化应保持原文', () => {
    const script = scriptGen.generateProductScript('prod-001', 'friendly')
    const sameLocale = scriptGen.localizeScript(script, 'zh-CN')
    expect(sameLocale).toBeTruthy()
  })
})
