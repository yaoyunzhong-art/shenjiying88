import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * knowledge-indexer.service.test.ts — 知识库索引器单元测试
 */

import { KnowledgeIndexerService } from './knowledge-indexer.service'

describe('KnowledgeIndexerService', () => {
  let service: KnowledgeIndexerService

  beforeEach(() => {
    service = new KnowledgeIndexerService()
    service.resetForTests()
  })

  // ── chunkDocument ──

  it('应正确按 ## 标题切分文档', () => {
    const chunks = service.chunkDocument({
      sourcePath: 'test.md',
      content: `# Title
Intro paragraph.

## Section 1
Content for section 1.

## Section 2
Content for section 2.`,
      kind: 'spec',
    })
    expect(chunks.length).toBeGreaterThanOrEqual(3)
    expect(chunks[0].metadata.title).toBe('Title')
    const sections = chunks.map((c) => c.metadata.section).filter(Boolean)
    expect(sections).toContain('Section 1')
    expect(sections).toContain('Section 2')
  })

  it('短段落应与前一个 chunk 合并', () => {
    const chunks = service.chunkDocument({
      sourcePath: 'short.md',
      content: `# Summary
Short.

Another short.`,
      kind: 'doc',
    })
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    for (const c of chunks) {
      expect(c.tokenCount).toBeLessThanOrEqual(512)
    }
  })

  it('单 section 超过 512 tokens 时应按段落切分', () => {
    // 用多段文字,每段之间有双换行,触发段落切分
    const para1 = 'word '.repeat(300)
    const para2 = 'test '.repeat(300)
    const chunks = service.chunkDocument({
      sourcePath: 'long.md',
      content: `# Long Doc
## Long Section
${para1}

${para2}`,
      kind: 'doc',
    })
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    for (const c of chunks) {
      expect(c.tokenCount).toBeLessThanOrEqual(520)
    }
  })

  it('chunk tokenCount 准确性', () => {
    const text = 'Hello World'
    const chunks = service.chunkDocument({
      sourcePath: 'simple.md',
      content: `# Greeting
${text}`,
      kind: 'doc',
    })
    expect(chunks[0].tokenCount).toBeGreaterThan(0)
  })

  // ── embed ──

  it('embedding 应返回 256 维向量并归一化', () => {
    const vec = service.embed('test content')
    expect(vec).toHaveLength(256)
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0))
    expect(norm).toBeCloseTo(1, 1)
  })

  it('相同输入应产生相同 embedding', () => {
    const v1 = service.embed('hello world')
    const v2 = service.embed('hello world')
    expect(v1).toEqual(v2)
  })

  it('不同输入应产生不同 embedding', () => {
    const v1 = service.embed('cats')
    const v2 = service.embed('dogs')
    const diff = v1.some((x, i) => x !== v2[i])
    expect(diff).toBe(true)
  })

  // ── indexDocument ──

  it('indexDocument 应创建嵌入式 chunk', () => {
    const embedded = service.indexDocument({
      sourcePath: 'spec.md',
      content: '# Spec\n\nThis is a spec document.',
      kind: 'spec',
    })
    expect(embedded.length).toBeGreaterThan(0)
    expect(embedded[0].embedding).toHaveLength(256)
    expect(embedded[0].embeddingDim).toBe(256)
  })

  // ── query ──

  it('索引后查询应返回结果', () => {
    service.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nquota double increment bug in coupon service.',
      kind: 'lesson',
    })
    const resp = service.query({ query: 'quota double increment', topK: 5 })
    expect(resp.results.length).toBeGreaterThan(0)
    expect(resp.results[0].score).toBeGreaterThan(0)
  })

  it('kindFilter 只返回指定分类', () => {
    service.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nMember points management.',
      kind: 'spec',
    })
    service.indexDocument({
      sourcePath: 'b.md',
      content: '# B\n\nThree-level referral chain pattern.',
      kind: 'pattern',
    })
    const lessonsOnly = service.query({
      query: 'referral',
      topK: 5,
      kindFilter: 'pattern',
    })
    expect(lessonsOnly.results.every((r) => r.chunk.metadata.kind === 'pattern')).toBe(true)
  })

  it('minScore 过滤低分结果', () => {
    service.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nPython machine learning.',
      kind: 'lesson',
    })
    const highScore = service.query({ query: 'machine learning', topK: 5, minScore: 0.5 })
    const all = service.query({ query: 'machine learning', topK: 5, minScore: 0 })
    expect(highScore.results.length).toBeLessThanOrEqual(all.results.length)
  })

  // ── getStats ──

  it('getStats 返回正确统计', () => {
    service.indexDocument({
      sourcePath: 'a.md',
      content: '# Doc A\nContent A.',
      kind: 'lesson',
    })
    service.indexDocument({
      sourcePath: 'b.md',
      content: '# Doc B\nContent B.',
      kind: 'pattern',
    })
    const stats = service.getStats()
    expect(stats.totalDocuments).toBe(2)
    expect(stats.totalChunks).toBeGreaterThanOrEqual(2)
    expect(stats.byKind['lesson']).toBeGreaterThanOrEqual(1)
    expect(stats.byKind['pattern']).toBeGreaterThanOrEqual(1)
    expect(stats.averageChunkSize).toBeGreaterThan(0)
  })

  // ── resetForTests ──

  it('resetForTests 清除所有数据', () => {
    service.indexDocument({
      sourcePath: 'a.md',
      content: '# A\nContent.',
      kind: 'doc',
    })
    expect(service.getStats().totalDocuments).toBe(1)
    service.resetForTests()
    expect(service.getStats().totalDocuments).toBe(0)
    expect(service.getStats().totalChunks).toBe(0)
  })
})
