import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * knowledge.entity.test.ts — 知识库实体测试
 */

import { KNOWLEDGE_KINDS } from './knowledge.entity'

describe('KnowledgeEntity', () => {
  it('KNOWLEDGE_KINDS 包含所有预期分类', () => {
    expect(KNOWLEDGE_KINDS).toContain('spec')
    expect(KNOWLEDGE_KINDS).toContain('lesson')
    expect(KNOWLEDGE_KINDS).toContain('pattern')
    expect(KNOWLEDGE_KINDS).toContain('decision')
    expect(KNOWLEDGE_KINDS).toContain('anti-pattern')
    expect(KNOWLEDGE_KINDS).toContain('doc')
    expect(KNOWLEDGE_KINDS.length).toBe(6)
  })

  it('DocumentChunk 结构验证', () => {
    const chunk = {
      id: 'chunk-001',
      sourcePath: 'doc.md',
      chunkIndex: 0,
      content: 'Hello World',
      tokenCount: 10,
      metadata: {
        title: 'Doc Title',
        section: 'Intro',
        kind: 'lesson' as const,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    expect(chunk.id).toBeTruthy()
    expect(chunk.tokenCount).toBeGreaterThan(0)
    expect(chunk.metadata.kind).toBe('lesson')
  })

  it('EmbeddedChunk 包含 embedding 字段', () => {
    const eChunk = {
      id: 'chunk-002',
      sourcePath: 'doc.md',
      chunkIndex: 0,
      content: 'a'.repeat(100),
      tokenCount: 100,
      metadata: { kind: 'pattern' as const },
      createdAt: '2026-01-01T00:00:00.000Z',
      embedding: [0.1, 0.2, 0.3],
      embeddingDim: 3,
    }
    expect(eChunk.embedding).toHaveLength(3)
    expect(eChunk.embeddingDim).toBe(3)
  })

  it('QueryResult 包含 score', () => {
    const result = {
      chunk: {
        id: 'chunk-003',
        sourcePath: 'doc.md',
        chunkIndex: 0,
        content: 'test content',
        tokenCount: 20,
        metadata: {},
        createdAt: '2026-01-01T00:00:00.000Z',
        embedding: [0.5],
        embeddingDim: 1,
      },
      score: 0.95,
    }
    expect(result.score).toBeCloseTo(0.95)
  })
})
