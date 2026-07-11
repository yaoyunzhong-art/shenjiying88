/**
 * ai-rag-validate.test.ts — RAG 模块最终验证
 */
import { describe, it, expect } from 'vitest'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'

describe('RAG Final Validation', () => {
  it('KB lifecycle', () => {
    const kb = new KnowledgeBaseManager()
    kb.addDocument('c', { id: 'd', content: 'x' })
    expect(kb.getDocument('c', 'd')).toBeDefined()
    expect(kb.deleteDocument('c', 'd')).toBe(true)
    expect(kb.getDocument('c', 'd')).toBeNull()
  })

  it('Pipeline query with KB', async () => {
    const kb = new KnowledgeBaseManager()
    kb.addDocument('faq', { id: 'd', content: '答案是42' })
    const p = new RAGPipeline(kb)
    const r = await p.query('问题', 'faq')
    expect(r.answer).toContain('[RAG]')
  })

  it('ScriptGenerator covers all tones', () => {
    const s = new SalesScriptGenerator()
    for (const t of ['professional', 'friendly', 'urgent'] as const) {
      expect(s.generateProductScript('prod-001', t)).toBeTruthy()
    }
  })

  it('ScriptGenerator covers all objections', () => {
    const s = new SalesScriptGenerator()
    for (const t of ['price', 'quality', 'competitor', 'timing'] as const) {
      expect(s.generateObjectionScript('prod-001', t)).toBeTruthy()
    }
  })
})
