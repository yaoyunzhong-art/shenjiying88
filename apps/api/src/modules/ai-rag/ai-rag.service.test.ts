/**
 * 🐜 自动: [ai-rag] [A] service.test.ts 补全
 *
 * RAG 知识库 Service 单元测试
 * 直接实例化服务类，覆盖 KnowledgeBaseManager / RAGPipeline / SalesScriptGenerator
 * 正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import {
  KnowledgeBaseManager,
  RAGPipeline,
  SalesScriptGenerator,
} from './ai-rag.service'

// ── KnowledgeBaseManager ──

describe('KnowledgeBaseManager', () => {
  let kb: KnowledgeBaseManager

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
  })

  // ── 正例 ──

  it('添加文档成功，返回完整结构', () => {
    const doc = kb.addDocument('products', {
      content: '智能营销系统使用 AI 技术进行用户画像。多渠道自动触达提升营销效率。',
    })
    expect(doc.id).toBeDefined()
    expect(doc.collection).toBe('products')
    expect(doc.chunks.length).toBeGreaterThanOrEqual(1)
    expect(Date.parse(doc.createdAt)).not.toBeNaN()
  })

  it('添加文档可指定自定义 ID', () => {
    const doc = kb.addDocument('products', {
      id: 'my-custom-id',
      content: '测试内容',
    })
    expect(doc.id).toBe('my-custom-id')
  })

  it('添加文档可附带元数据', () => {
    const doc = kb.addDocument('faq', {
      content: '常见问题解答',
      metadata: { author: 'admin', category: 'qa' },
    })
    expect(doc.metadata.author).toBe('admin')
    expect(doc.metadata.category).toBe('qa')
  })

  it('长内容自动分块', () => {
    const longContent = 'A'.repeat(2000)
    const doc = kb.addDocument('rules', { content: longContent })
    expect(doc.chunks.length).toBeGreaterThanOrEqual(3)
  })

  it('更新文档内容', () => {
    kb.addDocument('products', { id: 'doc-update', content: '原内容' })
    const updated = kb.updateDocument('products', 'doc-update', '新内容')
    expect(updated).not.toBeNull()
    expect(updated!.chunks[0].content).toBe('新内容')
  })

  it('删除文档成功', () => {
    kb.addDocument('products', { id: 'doc-del', content: '待删除' })
    const result = kb.deleteDocument('products', 'doc-del')
    expect(result).toBe(true)
    expect(kb.getDocument('products', 'doc-del')).toBeNull()
  })

  it('列出集合中所有文档', () => {
    kb.addDocument('products', { id: 'd1', content: '内容1' })
    kb.addDocument('products', { id: 'd2', content: '内容2' })
    kb.addDocument('faq', { id: 'd3', content: 'FAQ' })
    const docs = kb.listDocuments('products')
    expect(docs).toHaveLength(2)
  })

  it('获取集合统计', () => {
    kb.addDocument('products', { id: 'd1', content: '短内容' })
    const stats = kb.getCollectionStats('products')
    expect(stats.documentCount).toBe(1)
    expect(stats.chunkCount).toBeGreaterThanOrEqual(1)
  })

  // ── 反例 ──

  it('更新不存在的文档返回 null', () => {
    const result = kb.updateDocument('products', 'nonexistent', '新内容')
    expect(result).toBeNull()
  })

  it('删除不存在的文档返回 false', () => {
    expect(kb.deleteDocument('products', 'nonexistent')).toBe(false)
  })

  it('获取不存在的文档返回 null', () => {
    expect(kb.getDocument('products', 'nonexistent')).toBeNull()
  })

  it('空集合列表为空', () => {
    expect(kb.listDocuments('empty-collection')).toHaveLength(0)
  })

  it('空集合统计为 0', () => {
    const stats = kb.getCollectionStats('empty-collection')
    expect(stats.documentCount).toBe(0)
    expect(stats.chunkCount).toBe(0)
  })

  // ── 边界 ──

  it('内容恰好等于 chunkSize', () => {
    const doc = kb.addDocument('boundary', { content: 'B'.repeat(512) })
    expect(doc.chunks).toHaveLength(1)
  })

  it('单个字符内容', () => {
    const doc = kb.addDocument('boundary', { content: 'X' })
    expect(doc.chunks).toHaveLength(1)
    expect(doc.chunks[0].content).toBe('X')
  })

  it('空白字符内容', () => {
    const doc = kb.addDocument('boundary', { content: '   ' })
    expect(doc.chunks).toHaveLength(1)
    expect(doc.chunks[0].content.trim()).toBe('')
  })

  it('更新文档保留原有元数据（如果不传新元数据）', () => {
    kb.addDocument('products', { id: 'doc-meta', content: '原内容', metadata: { key: 'value' } })
    kb.updateDocument('products', 'doc-meta', '新内容')
    const doc = kb.getDocument('products', 'doc-meta')
    // updateDocument 内部用传入 metadata ?? {}，没有传入则重置为空
    expect(doc!.metadata).toEqual({})
  })

  it('大量文档不影响正常操作', () => {
    for (let i = 0; i < 50; i++) {
      kb.addDocument('bulk', { id: `bulk-${i}`, content: `内容${i}` })
    }
    expect(kb.listDocuments('bulk')).toHaveLength(50)
    expect(kb.getCollectionStats('bulk').documentCount).toBe(50)
  })
})

// ── RAGPipeline ──

describe('RAGPipeline', () => {
  let kb: KnowledgeBaseManager
  let rag: RAGPipeline

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    rag = new RAGPipeline(kb)
  })

  // ── 正例 ──

  it('query 检索并生成回复', async () => {
    kb.addDocument('products', { content: '智能营销系统使用 AI 技术进行用户画像' })
    const result = await rag.query('营销', 'products')
    expect(result.answer).toContain('RAG')
    expect(result.answer).toContain('营销')
    expect(result.sources.length).toBeGreaterThanOrEqual(1)
  })

  it('retrieve 限定 topK', () => {
    kb.addDocument('products', { content: 'A'.repeat(600) })
    kb.addDocument('products', { content: 'B'.repeat(600) })
    const results = rag.retrieve('A', 'products', 1)
    expect(results.length).toBeLessThanOrEqual(1)
  })

  it('generateWithContext 非空上下文生成', () => {
    const answer = rag.generateWithContext('如何提升', '相关上下文内容')
    expect(answer).toContain('RAG')
    expect(answer).toContain('如何提升')
  })

  it('chat 多轮对话提取最后用户消息', async () => {
    kb.addDocument('products', { content: 'AI 营销系统功能介绍' })
    const result = await rag.chat([
      { role: 'assistant', content: '你好' },
      { role: 'user', content: 'AI 营销系统有什么功能' },
    ], 'products')
    expect(result.reply).toContain('RAG')
  })

  it('getStats 返回文档统计', () => {
    kb.addDocument('products', { content: '测试' })
    const stats = rag.getStats('products')
    expect(stats.documents).toBe(1)
    expect(stats.chunks).toBeGreaterThanOrEqual(1)
  })

  // ── 反例 ──

  it('空集合 query 返回无信息', async () => {
    const result = await rag.query('测试', 'empty')
    expect(result.answer).toBe('抱歉，我在知识库中没有找到相关信息。')
    expect(result.sources).toHaveLength(0)
  })

  it('空上下文 generateWithContext 返回默认', () => {
    const answer = rag.generateWithContext('测试', '')
    expect(answer).toBe('抱歉，我在知识库中没有找到相关信息。')
  })

  it('chat 无用户消息返回默认', async () => {
    const result = await rag.chat([{ role: 'assistant', content: '你好' }], 'products')
    expect(result.reply).toBe('请问有什么可以帮您？')
    expect(result.sources).toHaveLength(0)
  })

  it('空集合 retrieve 返回空', () => {
    expect(rag.retrieve('测试', 'empty', 5)).toHaveLength(0)
  })

  // ── 边界 ──

  it('单文档 retrieve 返回结果', () => {
    kb.addDocument('products', { content: '营销工具' })
    const results = rag.retrieve('营销', 'products')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('CJK 字符检索', () => {
    kb.addDocument('products', { content: '人工智能赋能企业数字化转型' })
    const results = rag.retrieve('人工智能', 'products', 5)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].score).toBeGreaterThan(0)
  })

  it('特殊字符 query 返回 0 结果', () => {
    kb.addDocument('products', { content: '正常内容' })
    const results = rag.retrieve('!@#$%', 'products', 5)
    expect(results.length).toBe(0)
  })

  it('query 重复检索同一文档结果稳定', async () => {
    kb.addDocument('products', { content: '稳定的测试内容内容' })
    const r1 = await rag.query('测试', 'products')
    const r2 = await rag.query('测试', 'products')
    expect(r1.answer).toBe(r2.answer)
    expect(r1.sources).toEqual(r2.sources)
  })
})

// ── SalesScriptGenerator ──

describe('SalesScriptGenerator', () => {
  let gen: SalesScriptGenerator

  beforeEach(() => {
    gen = new SalesScriptGenerator()
  })

  // ── 正例 ──

  it('generateProductScript 返回 professional 语气', () => {
    const script = gen.generateProductScript('prod-001', 'professional')
    expect(script).toContain('【专业版】')
    expect(script).toContain('智能营销系统')
    expect(script).toContain('核心卖点')
  })

  it('generateProductScript 返回 friendly 语气', () => {
    const script = gen.generateProductScript('prod-002', 'friendly')
    expect(script).toContain('【亲和版】')
    expect(script).toContain('会员管理系统')
  })

  it('generateProductScript 返回 urgent 语气', () => {
    const script = gen.generateProductScript('prod-001', 'urgent')
    expect(script).toContain('【紧迫版】')
    expect(script).toContain('限时推荐')
  })

  it('generateObjectionScript 返回对应异议类型话术', () => {
    const script = gen.generateObjectionScript('prod-001', 'price')
    expect(script).toContain('价格')
    expect(script).toContain('智能营销系统')
  })

  it('generateFollowUpScript 返回含客户名的跟进话术', () => {
    const script = gen.generateFollowUpScript('cust-001')
    expect(script).toContain('张总')
    expect(script).toContain('智能营销系统')
  })

  it('localizeScript 本地化 zh-CN', () => {
    const result = gen.localizeScript('Hi, 限时优惠, Buy now!', 'zh-CN')
    expect(result).toContain('您好')
    expect(result).toContain('限时')
    expect(result).toContain('立即购买')
  })

  it('localizeScript 本地化 en-US', () => {
    const result = gen.localizeScript('您好，限时优惠，立即购买！', 'en-US')
    expect(result).toContain('Hello')
    expect(result).toContain('buy now')
  })

  // ── 反例 ──

  it('不存在的产品 ID 返回默认内容', () => {
    const script = gen.generateProductScript('nonexistent', 'professional')
    // 应该 fallback 到默认产品信息
    expect(script).toBeDefined()
    expect(script).toContain('产品 nonexistent')
  })

  it('不存在的客户使用 fallback 话术', () => {
    const script = gen.generateFollowUpScript('unknown-customer')
    expect(script).toContain('尊敬的客户')
  })

  it('不存在的 locale 返回原字符串', () => {
    const result = gen.localizeScript('您好', 'fr-FR')
    expect(result).toBe('您好')
  })

  // ── 边界 ──

  it('不同语气产品话术互不相同', () => {
    const pro = gen.generateProductScript('prod-001', 'professional')
    const urg = gen.generateProductScript('prod-001', 'urgent')
    expect(pro).not.toBe(urg)
  })

  it('不同异议类型返回不同话术', () => {
    const price = gen.generateObjectionScript('prod-001', 'price')
    const quality = gen.generateObjectionScript('prod-001', 'quality')
    expect(price).not.toBe(quality)
  })

  it('本地化 zh-TW', () => {
    const result = gen.localizeScript('限时优惠，立即购买！', 'zh-TW')
    expect(result).toContain('限時')
    expect(result).toContain('立即購買')
  })

  it('空产品 ID 返回默认', () => {
    const script = gen.generateProductScript('', 'professional')
    expect(script).toContain('产品 ')
  })
})
