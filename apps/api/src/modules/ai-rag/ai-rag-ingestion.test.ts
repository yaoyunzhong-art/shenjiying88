/**
 * ai-rag-ingestion.test.ts — RAG 文档管理与检索集成测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeBaseManager, RAGPipeline } from './ai-rag.service'

describe('RAG Document Lifecycle', () => {
  let kb: KnowledgeBaseManager
  let pipeline: RAGPipeline

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    pipeline = new RAGPipeline(kb)
  })

  it('完整文档生命周期：添加 → 更新 → 检索 → 删除', async () => {
    const doc = kb.addDocument('faq', {
      id: 'lifecycle-test',
      content: '我们的产品支持三种部署方式：公有云SaaS、私有化部署和混合云架构。',
    })
    expect(doc.chunks.length).toBeGreaterThan(0)

    // 更新
    const updated = kb.updateDocument('faq', 'lifecycle-test', '新内容：只有公有云和私有化部署两种方式。')
    expect(updated).not.toBeNull()

    // 检索
    const results = pipeline.retrieve('部署方式', 'faq', 5)
    expect(results.length).toBeGreaterThan(0)

    // 删除
    const deleted = kb.deleteDocument('faq', 'lifecycle-test')
    expect(deleted).toBe(true)
    expect(kb.getDocument('faq', 'lifecycle-test')).toBeNull()
  })

  it('多集合隔离：一个集合的变更不影响其他', () => {
    kb.addDocument('coll-a', { id: 'shared-1', content: '集合A' })
    kb.addDocument('coll-b', { id: 'shared-1', content: '集合B' })
    expect(kb.getDocument('coll-a', 'shared-1')!.content).toBe('集合A')
    expect(kb.getDocument('coll-b', 'shared-1')!.content).toBe('集合B')

    kb.deleteDocument('coll-a', 'shared-1')
    expect(kb.getDocument('coll-a', 'shared-1')).toBeNull()
    expect(kb.getDocument('coll-b', 'shared-1')).not.toBeNull()
  })

  it('批量文档检索排序', async () => {
    // Add FAQ documents with varying relevance to "价格"
    kb.addDocument('faq', { id: 'd1', content: '价格方案：基础版99元/月，标准版199元/月，企业版399元/月。' })
    kb.addDocument('faq', { id: 'd2', content: '功能介绍：我们的系统提供用户管理、订单管理和数据分析功能。' })
    kb.addDocument('faq', { id: 'd3', content: '关于价格，我们有灵活的付费方案和年度折扣。' })
    kb.addDocument('faq', { id: 'd4', content: '技术支持：工作时间内提供7x24小时技术支持服务。' })
    kb.addDocument('faq', { id: 'd5', content: '如何续费：在到期前30天，系统会自动发送续费提醒和优惠信息。' })

    const results = pipeline.retrieve('价格方案', 'faq', 5)
    expect(results.length).toBeGreaterThan(0)
    // Most relevant should be at top
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score)
  })

  it('RAG query 应使用检索内容生成答案', async () => {
    kb.addDocument('faq', { id: 'd-qa', content: '退货政策：自签收之日起7天内可无理由退货。退货费用由平台承担。' })
    const result = await pipeline.query('退货政策是什么？', 'faq')
    expect(result.answer).toContain('[RAG]')
    expect(result.answer).toContain('退货')
    expect(result.sources.length).toBeGreaterThan(0)
  })

  it('大规模文档管理', () => {
    const docs = 50
    for (let i = 0; i < docs; i++) {
      kb.addDocument('large', { id: `doc-${i}`, content: `文档${i}的内容包含一些关键词示例。` })
    }
    const stats = kb.getCollectionStats('large')
    expect(stats.documentCount).toBe(docs)
    expect(stats.chunkCount).toBeGreaterThanOrEqual(docs)
  })

  it('文档元数据应保持', () => {
    kb.addDocument('test', {
      id: 'meta-test',
      content: '带元数据的文档',
      metadata: { author: '张三', date: '2026-07-11', tags: ['测试', '元数据'] },
    })
    const doc = kb.getDocument('test', 'meta-test')
    expect(doc!.metadata.author).toBe('张三')
    expect(doc!.metadata.tags).toContain('测试')
  })
})

describe('RAG Cross-collection Search', () => {
  let kb: KnowledgeBaseManager
  let pipeline: RAGPipeline

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    pipeline = new RAGPipeline(kb)
    kb.addDocument('faq', { id: 'f1', content: 'FAQ: 如何注册账号？访问注册页面填写信息即可。' })
    kb.addDocument('products', { id: 'p1', content: '产品介绍：智能营销系统，帮助企业实现精准营销。' })
  })

  it('不同集合应隔离查询', async () => {
    const faqResult = await pipeline.query('注册', 'faq')
    const prodResult = await pipeline.query('注册', 'products')
    expect(faqResult.sources.length).toBeGreaterThan(0)
    expect(prodResult.sources.length).toBe(0)
  })
})
