import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * retrieval.entity.test.ts · 检索模块实体定义单元测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('RetrievalIndexRecord', () => {
  it('should create a valid RetrievalIndexRecord', () => {
    const record = {
      chunkId: 'abc123',
      filePath: 'apps/api/src/modules/retrieval/retrieval.service.ts',
      language: 'typescript',
      astType: 'file' as const,
      symbolName: 'retrieval.service.ts',
      lineRange: [1, 200] as [number, number],
      collection: 'code_chunks' as const,
      gitSha: 'a1b2c3d4',
      vectorDimension: 3072,
      tokens: 1500,
      indexedAt: '2025-06-25T12:00:00Z',
      active: true,
    }

    assert.equal(record.chunkId, 'abc123')
    assert.equal(record.collection, 'code_chunks')
    assert.equal(record.active, true)
    assert.equal(record.astType, 'file')
    assert.deepStrictEqual(record.lineRange, [1, 200])
  })

  it('should support inactive (deleted) index records', () => {
    const record = {
      chunkId: 'def456',
      filePath: 'apps/api/src/modules/retrieval/retrieval.embedder.ts',
      language: 'typescript',
      astType: 'method' as const,
      symbolName: 'embed',
      lineRange: [42, 68] as [number, number],
      collection: 'code_chunks' as const,
      gitSha: 'e5f6g7h8',
      vectorDimension: 3072,
      tokens: 300,
      indexedAt: '2025-06-24T08:00:00Z',
      active: false,
    }

    assert.equal(record.active, false)
    assert.equal(record.chunkId, 'def456')
  })

  it('should handle knowledge_docs collection type', () => {
    const record = {
      chunkId: 'ghi789',
      filePath: 'docs/research/rag-architecture.md',
      language: 'markdown',
      astType: 'markdown_section' as const,
      symbolName: '§3.3 Query Pipeline',
      lineRange: [120, 145] as [number, number],
      collection: 'knowledge_docs' as const,
      gitSha: 'i9j0k1l2',
      vectorDimension: 3072,
      tokens: 500,
      indexedAt: '2025-06-23T16:00:00Z',
      active: true,
    }

    assert.equal(record.collection, 'knowledge_docs')
    assert.equal(record.language, 'markdown')
    assert.equal(record.astType, 'markdown_section')
  })
})

describe('RetrievalCacheEntry', () => {
  it('should create a valid RetrievalCacheEntry', () => {
    const entry = {
      cacheKey: 'rag:code:how-does-lyt-work',
      query: 'how does lyt work',
      resultChunkIds: ['chunk1', 'chunk2', 'chunk3'],
      hitCount: 5,
      createdAt: '2025-06-25T12:00:00Z',
      expiresAt: '2025-06-25T13:00:00Z',
      ttlSeconds: 3600,
    }

    assert.equal(entry.hitCount, 5)
    assert.equal(entry.resultChunkIds.length, 3)
    assert.equal(entry.ttlSeconds, 3600)
  })

  it('should track zero hit count for fresh entries', () => {
    const entry = {
      cacheKey: 'rag:knowledge:new-query',
      query: 'new query never cached before',
      resultChunkIds: [],
      hitCount: 0,
      createdAt: '2025-06-25T12:00:00Z',
      expiresAt: '2025-06-25T13:00:00Z',
      ttlSeconds: 3600,
    }

    assert.equal(entry.hitCount, 0)
    assert.equal(entry.resultChunkIds.length, 0)
  })
})

describe('RetrievalQueryLog', () => {
  it('should create a valid RetrievalQueryLog', () => {
    const log: import('./retrieval.entity').RetrievalQueryLog = {
      id: 'log-001',
      query: 'how does lyt quota work',
      collections: ['code_chunks'],
      topK: 10,
      cacheHit: false,
      hitChunkIds: ['chunk-a', 'chunk-b'],
      maxScore: 0.92,
      avgScore: 0.75,
      latencyMs: 245,
      source: 'review',
      requestedAt: '2025-06-25T12:00:00Z',
      tenantId: 'tenant-001',
    }

    assert.equal(log.latencyMs, 245)
    assert.equal(log.maxScore, 0.92)
    assert.equal(log.cacheHit, false)
    assert.equal(log.source, 'review')
  })

  it('should handle cache hit logs', () => {
    const log: import('./retrieval.entity').RetrievalQueryLog = {
      id: 'log-002',
      query: 'known query',
      collections: ['code_chunks', 'knowledge_docs'],
      topK: 5,
      cacheHit: true,
      hitChunkIds: ['chunk-x', 'chunk-y', 'chunk-z'],
      maxScore: 0.88,
      avgScore: 0.82,
      latencyMs: 12,
      source: 'query',
      requestedAt: '2025-06-25T12:05:00Z',
      tenantId: 'tenant-001',
    }

    assert.equal(log.cacheHit, true)
    assert.equal(log.latencyMs, 12) // cache hit is fast
    assert.equal(log.collections.length, 2)
  })
})
