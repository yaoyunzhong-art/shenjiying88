/**
 * ai-rag-ingestion-plus.test.ts — RAG 完整测试补充
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'

describe('KnowledgeBaseManager Extension', () => {
  let kb: KnowledgeBaseManager
  beforeEach(() => { kb = new KnowledgeBaseManager() })

  it('addDocument 自动 ID', () => {
    expect(kb.addDocument('c', { content: 'x' }).id).toMatch(/^doc-/)
  })

  it('addDocument 指定 ID', () => {
    expect(kb.addDocument('c', { id: 'abc', content: 'x' }).id).toBe('abc')
  })

  it('getDocument 跨集合隔离', () => {
    kb.addDocument('a', { id: 'x', content: 'A' })
    kb.addDocument('b', { id: 'x', content: 'B' })
    expect(kb.getDocument('a', 'x')!.text).toBe('A')
    expect(kb.getDocument('b', 'x')!.text).toBe('B')
  })

  it('updateDocument 更新内容', () => {
    kb.addDocument('c', { id: 'd', content: 'old' })
    kb.updateDocument('c', 'd', 'new')
    expect(kb.getDocument('c', 'd')!.chunks[0].content).toBe('new')
  })

  it('deleteDocument 返回', () => {
    kb.addDocument('c', { id: 'd', content: 'x' })
    expect(kb.deleteDocument('c', 'd')).toBe(true)
    expect(kb.deleteDocument('c', 'd')).toBe(false)
  })

  it('listDocuments 过滤', () => {
    kb.addDocument('a', { id: '1', content: 'x' })
    kb.addDocument('b', { id: '2', content: 'y' })
    expect(kb.listDocuments('a')).toHaveLength(1)
  })

  it('getCollectionStats', () => {
    kb.addDocument('c', { id: 'd', content: 'hello world testing chunk length' })
    const s = kb.getCollectionStats('c')
    expect(s.documentCount).toBe(1)
    expect(s.chunkCount).toBeGreaterThan(0)
  })
})

describe('RAGPipeline Extension', () => {
  let kb: KnowledgeBaseManager
  let pl: RAGPipeline
  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    pl = new RAGPipeline(kb)
    kb.addDocument('faq', { id: 'd1', content: '密码重置方法。' })
  })

  it('retrieve 返回排序结果', () => {
    const r = pl.retrieve('密码', 'faq')
    expect(r.length).toBeGreaterThan(0)
  })

  it('retrieve 空集合空结果', () => {
    expect(pl.retrieve('x', 'empty')).toHaveLength(0)
  })

  it('query 生成回答', async () => {
    const r = await pl.query('密码重置', 'faq')
    expect(r.answer).toContain('[RAG]')
  })

  it('chat 多轮', async () => {
    const r = await pl.chat([{ role: 'user', content: '密码' }], 'faq')
    expect(r.reply).toBeTruthy()
  })

  it('chat 无用户消息', async () => {
    const r = await pl.chat([{ role: 'assistant', content: 'hi' }], 'faq')
    expect(r.reply).toContain('请问')
  })

  it('getStats', () => {
    expect(pl.getStats('faq').documents).toBe(1)
  })
})

describe('SalesScriptGenerator Extension', () => {
  const s = new SalesScriptGenerator()

  it('产品话术含品牌名', () => expect(s.generateProductScript('prod-001', 'professional')).toContain('智能营销'))
  it('3种语气不同', () => {
    const texts = ['professional', 'friendly', 'urgent'].map(t => s.generateProductScript('prod-001', t as any))
    expect(new Set(texts).size).toBe(3)
  })
  it('4种异议处理', () => {
    for (const t of ['price', 'quality', 'competitor', 'timing'] as const) {
      expect(s.generateObjectionScript('prod-001', t)).toBeTruthy()
    }
  })
  it('跟进话术', () => expect(s.generateFollowUpScript('cust-001')).toContain('张总'))
  it('未知客户默认称呼', () => expect(s.generateFollowUpScript('unknown')).toContain('尊敬的客户'))
  it('本地化替换', () => {
    const script = s.generateProductScript('prod-001', 'friendly')
    expect(s.localizeScript(script, 'zh-CN')).toBeTruthy()
  })
})
