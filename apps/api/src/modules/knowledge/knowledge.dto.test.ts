import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * knowledge.dto.test.ts — 知识库 DTO 测试
 */

import type {
  IndexDocumentDto,
  QueryKnowledgeDto,
  QueryKnowledgeResponseDto,
  KnowledgeStatsDto,
  KnowledgeDocumentDto,
} from './knowledge.dto'

describe('KnowledgeDTO', () => {
  it('IndexDocumentDto 结构正确', () => {
    const dto: IndexDocumentDto = {
      sourcePath: 'docs/pattern.md',
      content: '# Pattern\n\nContent here...',
      kind: 'pattern',
      tags: ['nestjs', 'architecture'],
    }
    expect(dto.sourcePath).toBe('docs/pattern.md')
    expect(dto.kind).toBe('pattern')
    expect(dto.tags).toHaveLength(2)
  })

  it('QueryKnowledgeDto 可选字段默认值', () => {
    const dto: QueryKnowledgeDto = { query: '会员积分' }
    expect(dto.topK).toBeUndefined()
    expect(dto.minScore).toBeUndefined()
    expect(dto.kindFilter).toBeUndefined()
  })

  it('QueryKnowledgeResponseDto 正例', () => {
    const resp: QueryKnowledgeResponseDto = {
      query: 'quota',
      results: [
        {
          id: 'chunk-abc',
          sourcePath: 'docs/spec.md',
          content: 'Quota management...',
          score: 0.92,
          kind: 'spec',
          section: 'Quota',
        },
      ],
      totalCandidates: 5,
      durationMs: 10,
    }
    expect(resp.results).toHaveLength(1)
    expect(resp.results[0].score).toBeGreaterThan(0.9)
  })

  it('KnowledgeStatsDto 统计字段', () => {
    const stats: KnowledgeStatsDto = {
      totalDocuments: 3,
      totalChunks: 15,
      averageChunkSize: 256,
      byKind: { lesson: 7, spec: 5, pattern: 3 },
    }
    expect(stats.totalDocuments).toBe(3)
    expect(Object.keys(stats.byKind)).toHaveLength(3)
  })

  it('KnowledgeDocumentDto 列表条目', () => {
    const doc: KnowledgeDocumentDto = {
      id: 'doc-001',
      title: 'Phase-17 Lessons',
      sourcePath: 'lessons/phase-17.md',
      kind: 'lesson',
      tags: ['nestjs', 'member'],
      chunkCount: 5,
      createdAt: '2026-06-20T00:00:00.000Z',
    }
    expect(doc.chunkCount).toBe(5)
    expect(doc.kind).toBe('lesson')
  })
})
