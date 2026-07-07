import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * knowledge.controller.test.ts — 知识库控制器测试
 *
 * 覆盖: index / query / suggest / stats / documents / documents/by-kind / delete / reset
 * 正例 + 反例 + 边界
 */

import { KnowledgeController, resetKnowledgeControllerState } from './knowledge.controller'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeIndexerService } from './knowledge-indexer.service'

function freshController(): KnowledgeController {
  return new KnowledgeController(new KnowledgeService(new KnowledgeIndexerService()))
}

describe('KnowledgeController', () => {
  let controller: KnowledgeController

  beforeEach(() => {
    resetKnowledgeControllerState()
    controller = freshController()
  })

  // ── POST /knowledge/index ──

  it('POST index 应索引文档并返回 chunk 数', () => {
    const result = controller.indexDocument({
      sourcePath: 'test.md',
      content: '# Test Doc\n\nContent for indexing.',
      kind: 'lesson',
    })
    expect(result.chunks).toBeGreaterThanOrEqual(1)
    expect(result.documentId).toBeTruthy()
  })

  it('POST index 处理空内容应正确', () => {
    const result = controller.indexDocument({
      sourcePath: 'empty.md',
      content: '',
      kind: 'doc',
    })
    expect(result.chunks).toBeGreaterThanOrEqual(0)
  })

  it('POST index 处理大型文档应切分多 chunk', () => {
    const longContent = `# Big Doc\n\n${'word '.repeat(800)}\n\nMore content.`
    const result = controller.indexDocument({
      sourcePath: 'big.md',
      content: longContent,
      kind: 'spec',
    })
    expect(result.chunks).toBeGreaterThanOrEqual(2)
  })

  it('POST index 同路径更新应保持 documentId 一致', () => {
    const r1 = controller.indexDocument({
      sourcePath: 'doc.md',
      content: '# V1\n\nFirst.',
      kind: 'doc',
    })
    const r2 = controller.indexDocument({
      sourcePath: 'doc.md',
      content: '# V2\n\nUpdated.',
      kind: 'doc',
    })
    expect(r2.documentId).toBe(r1.documentId)
  })

  // ── POST /knowledge/query ──

  it('POST query 索引后查询应返回结果', () => {
    controller.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nquota double increment bug found.',
      kind: 'lesson',
    })
    controller.indexDocument({
      sourcePath: 'b.md',
      content: '# B\n\nMember referral chain pattern.',
      kind: 'pattern',
    })
    const resp = controller.query({
      query: 'quota double increment',
      topK: 5,
    })
    expect(resp.results.length).toBeGreaterThan(0)
    expect(resp.results[0].score).toBeGreaterThan(0)
  })

  it('POST query 无匹配时返回空列表', () => {
    controller.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nOnly cats.',
      kind: 'doc',
    })
    const resp = controller.query({
      query: 'quantum physics',
      topK: 3,
      minScore: 0.9,
    })
    expect(resp.results).toHaveLength(0)
  })

  it('POST query kindFilter 过滤正确', () => {
    controller.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nSpec content.',
      kind: 'spec',
    })
    controller.indexDocument({
      sourcePath: 'b.md',
      content: '# B\n\nLesson content.',
      kind: 'lesson',
    })
    const resp = controller.query({
      query: 'content',
      topK: 5,
      kindFilter: 'spec',
    })
    for (const r of resp.results) {
      expect(r.kind).toBe('spec')
    }
  })

  // ── POST /knowledge/suggest ──

  it('POST suggest 应返回补全建议', () => {
    controller.indexDocument({
      sourcePath: 'doc.md',
      content: '# Doc\n\nAbout membership tier upgrade rules for SVIP.',
      kind: 'doc',
    })
    const suggestions = controller.suggest({ query: 'membership tier', maxSuggestions: 2 })
    expect(Array.isArray(suggestions)).toBe(true)
    expect(suggestions.length).toBeLessThanOrEqual(2)
    if (suggestions.length > 0) {
      expect(suggestions[0].sourcePath).toBeDefined()
      expect(suggestions[0].title).toBeDefined()
      expect(suggestions[0].snippet).toBeDefined()
      expect(suggestions[0].score).toBeGreaterThan(0)
    }
  })

  it('POST suggest 空索引返回空列表', () => {
    const suggestions = controller.suggest({ query: 'anything' })
    expect(suggestions).toHaveLength(0)
  })

  // ── GET /knowledge/stats ──

  it('GET stats 索引文档后统计正确', () => {
    controller.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nContent.',
      kind: 'lesson',
    })
    const stats = controller.getStats()
    expect(stats.totalDocuments).toBe(1)
    expect(stats.totalChunks).toBeGreaterThanOrEqual(1)
    expect(stats.byKind['lesson']).toBeGreaterThanOrEqual(1)
  })

  it('GET stats 空索引返回零值', () => {
    const stats = controller.getStats()
    expect(stats.totalDocuments).toBe(0)
    expect(stats.totalChunks).toBe(0)
  })

  // ── GET /knowledge/documents ──

  it('GET documents 列出所有索引文档', () => {
    controller.indexDocument({
      sourcePath: 'a.md',
      content: '# A\nContent.',
      kind: 'lesson',
    })
    const docs = controller.listDocuments()
    expect(docs.length).toBeGreaterThanOrEqual(1)
    expect(docs[0].kind).toBe('lesson')
    expect(docs[0].title).toBe('A')
  })

  it('GET documents/:id 返回文档详情', () => {
    const result = controller.indexDocument({
      sourcePath: 'a.md',
      content: '# A\nContent.',
      kind: 'pattern',
    })
    const doc = controller.getDocument(result.documentId)
    expect(doc).not.toHaveProperty('error')
    expect((doc as { kind: string }).kind).toBe('pattern')
  })

  it('GET documents/:id 对不存在 ID 返回错误', () => {
    const doc = controller.getDocument('nonexistent')
    expect(doc).toHaveProperty('error')
    expect((doc as { error: string }).error).toContain('not found')
  })

  // ── GET /knowledge/documents/by-kind/:kind ──

  it('GET documents/by-kind/:kind 按 kind 过滤文档', () => {
    controller.indexDocument({ sourcePath: 's.md', content: '# S\nCont.', kind: 'spec' })
    controller.indexDocument({ sourcePath: 'l.md', content: '# L\nCont.', kind: 'lesson' })
    const docs = controller.listDocumentsByKind('spec')
    expect(Array.isArray(docs)).toBe(true)
    if (Array.isArray(docs)) {
      expect(docs.length).toBe(1)
      expect(docs[0].kind).toBe('spec')
    }
  })

  it('GET documents/by-kind/:kind 非法 kind 返回错误', () => {
    const result = controller.listDocumentsByKind('invalid')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('code')
  })

  // ── DELETE /knowledge/documents/:id ──

  it('DELETE documents/:id 删除存在文档返回 ok=true', () => {
    const { documentId } = controller.indexDocument({
      sourcePath: 'del.md', content: '# Del\nTo delete.', kind: 'doc',
    })
    const result = controller.deleteDocument(documentId)
    expect(result.ok).toBe(true)
  })

  it('DELETE documents/:id 删除不存在文档返回 ok=false', () => {
    const result = controller.deleteDocument('non-existent')
    expect(result.ok).toBe(false)
  })

  // ── POST /knowledge/reset ──

  it('POST reset 清空所有数据', () => {
    controller.indexDocument({
      sourcePath: 'a.md',
      content: '# A\nContent.',
      kind: 'doc',
    })
    controller.resetIndex()
    const stats = controller.getStats()
    expect(stats.totalDocuments).toBe(0)
    expect(stats.totalChunks).toBe(0)
  })
})
