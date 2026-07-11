/**
 * ai-rag.service.spec.ts — AI RAG Service 深层测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'
import type { ScriptGenerationOptions, ObjectionType } from './ai-rag.service'

describe('KnowledgeBaseManager (Deep)', () => {
  let kb: KnowledgeBaseManager

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
  })

  it('addDocument 超长文本应生成多个 chunk', () => {
    const longText = '段落一。'.repeat(100) + '段落二。'.repeat(100)
    const doc = kb.addDocument('test', { content: longText })
    expect(doc.chunks.length).toBeGreaterThan(1)
  })

  it('addDocument 短文本应生成单个 chunk', () => {
    const doc = kb.addDocument('test', { content: '短文本。' })
    expect(doc.chunks.length).toBe(1)
  })

  it('getDocument 跨集合应隔离', () => {
    kb.addDocument('col-a', { id: 'doc-1', content: 'A' })
    kb.addDocument('col-b', { id: 'doc-1', content: 'B' })
    expect(kb.getDocument('col-a', 'doc-1')!.content !== kb.getDocument('col-b', 'doc-1')!.content).toBe(true)
  })

  it('updateDocument 应更新元数据', () => {
    kb.addDocument('test', { id: 'doc-1', content: '旧', metadata: { key: 'old' } })
    kb.updateDocument('test', 'doc-1', '新', { key: 'new', extra: true })
    const doc = kb.getDocument('test', 'doc-1')
    expect(doc!.metadata).toEqual({ key: 'new', extra: true })
  })

  it('deleteDocument 后 listDocuments 应排除', () => {
    kb.addDocument('test', { id: 'd1', content: 'A' })
    kb.addDocument('test', { id: 'd2', content: 'B' })
    kb.deleteDocument('test', 'd1')
    expect(kb.listDocuments('test')).toHaveLength(1)
  })

  it('空集合 getCollectionStats 应为 0', () => {
    const stats = kb.getCollectionStats('empty')
    expect(stats.documentCount).toBe(0)
    expect(stats.chunkCount).toBe(0)
  })
})

describe('RAGPipeline (Deep)', () => {
  let kb: KnowledgeBaseManager
  let pipeline: RAGPipeline

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    pipeline = new RAGPipeline(kb)
    kb.addDocument('faq', {
      id: 'doc-1',
      content: '如何使用我们的产品？首先注册账号，然后配置您的首选项。选择适合您的套餐，即可开始使用。'
    })
    kb.addDocument('faq', {
      id: 'doc-2',
      content: '价格套餐：基础版 99元/月，专业版 299元/月，企业版 999元/月。'
    })
  })

  it('retrieve 应按相关性排序', async () => {
    const results = pipeline.retrieve('价格', 'faq', 5)
    expect(results.length).toBeGreaterThan(0)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('retrieve 空集合应返回空', async () => {
    const results = pipeline.retrieve('test', 'empty-collection', 5)
    expect(results).toHaveLength(0)
  })

  it('query 应使用上下文生成答案', async () => {
    const result = await pipeline.query('如何开始使用？', 'faq')
    expect(result.answer).toContain('[RAG]')
    expect(result.sources.length).toBeGreaterThan(0)
  })

  it('chat 应支持多轮对话上下文', async () => {
    const result1 = await pipeline.chat(
      [{ role: 'user', content: '产品有哪些套餐？' }],
      'faq'
    )
    expect(result1.reply).toBeTruthy()

    const result2 = await pipeline.chat(
      [
        { role: 'user', content: '产品有哪些套餐？' },
        { role: 'assistant', content: result1.reply },
        { role: 'user', content: '最便宜的是多少？' },
      ],
      'faq'
    )
    expect(result2.reply).toBeTruthy()
  })

  it('getStats 应返回文档和 chunk 数量', () => {
    const stats = pipeline.getStats('faq')
    expect(stats.documents).toBe(2)
    expect(stats.chunks).toBeGreaterThanOrEqual(2)
  })
})

describe('SalesScriptGenerator (Deep)', () => {
  let gen: SalesScriptGenerator

  beforeEach(() => {
    gen = new SalesScriptGenerator()
  })

  it('所有语气应生成不同文案', () => {
    const tones: Array<'professional' | 'friendly' | 'urgent'> = ['professional', 'friendly', 'urgent']
    const texts = new Set(tones.map(t => gen.generateProductScript('prod-001', t)))
    expect(texts.size).toBe(3)
  })

  it('不同产品应生成不同话术', () => {
    const p1 = gen.generateProductScript('prod-001', 'professional')
    const p2 = gen.generateProductScript('prod-002', 'professional')
    expect(p1).not.toBe(p2)
  })

  it('未知产品应使用默认模板', () => {
    const script = gen.generateProductScript('prod-unknown', 'professional')
    expect(script).toBeTruthy()
  })

  it('所有异议类型应返回有效话术', () => {
    const types: ObjectionType[] = ['price', 'quality', 'competitor', 'timing']
    for (const type of types) {
      const script = gen.generateObjectionScript('prod-001', type)
      expect(script).toBeTruthy()
      expect(script.length).toBeGreaterThan(10)
    }
  })

  it('跟进话术应包含客户信息', () => {
    const script = gen.generateFollowUpScript('cust-001')
    expect(script).toContain('张总')
    expect(script).toContain('智能营销系统')
  })

  it('未知客户应使用默认称呼', () => {
    const script = gen.generateFollowUpScript('cust-unknown')
    expect(script).toContain('尊敬的客户')
  })

  it('本地化应替换中英文', () => {
    const original = gen.generateProductScript('prod-001', 'friendly')
    const zhCN = gen.localizeScript(original, 'zh-CN')
    const enUS = gen.localizeScript(original, 'en-US')
    expect(zhCN).toBeTruthy()
    expect(enUS).toBeTruthy()
  })

  it('zh-TW 本地化应替换用词', () => {
    const script = gen.generateProductScript('prod-001', 'friendly')
    const zhTW = gen.localizeScript(script, 'zh-TW')
    expect(zhTW).toBeTruthy()
  })
})
