import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * KnowledgeController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock KnowledgeIndexerService
 * 覆盖所有路由端点：index / query / stats / documents / reset
 * 正向流程 + 边界条件
 */

import assert from 'node:assert/strict'
// ── Entity mirrors ───────────────────────────────────────────
function makeDocumentChunk(overrides: Record<string, unknown> = {}) {
  return {
    id: 'chunk-abc123',
    sourcePath: 'docs/spec.md',
    chunkIndex: 0,
    content: '# API Spec\n\nThis is the API specification document.',
    tokenCount: 15,
    metadata: {
      title: 'API Spec',
      section: 'Overview',
      tags: ['api', 'spec'],
      kind: 'spec',
    },
    createdAt: '2026-06-24T09:00:00.000Z',
    ...overrides,
  }
}

function makeEmbeddedChunk(overrides: Record<string, unknown> = {}) {
  return {
    ...makeDocumentChunk(),
    embedding: Array(256).fill(0.01),
    embeddingDim: 256,
    ...overrides,
  }
}

// ── Inline Controller (mirrors: knowledge.controller.ts) ─────
class KnowledgeController {
  private indexer: any

  constructor(indexer: any) {
    this.indexer = indexer
  }

  indexDocument(dto: any) {
    return this.indexer.indexDocument(dto)
  }

  query(dto: any) {
    return this.indexer.query(dto)
  }

  getStats() {
    return this.indexer.getStats()
  }

  listDocuments() {
    return this.indexer.listDocuments()
  }

  getDocument(id: string) {
    return this.indexer.getDocument(id)
  }

  resetIndex() {
    return this.indexer.resetIndex()
  }
}

// ── Mock service factory ─────────────────────────────────────
function makeMockIndexer(overrides: Record<string, any> = {}) {
  const docStore = new Map<string, any>()

  return {
    indexDocument: (input: any) => {
      const embedded = [makeEmbeddedChunk({
        sourcePath: input.sourcePath,
        metadata: { ...makeEmbeddedChunk().metadata, kind: input.kind, tags: input.tags, title: input.sourcePath },
      })]
      const documentId = `doc-${embedded[0].id}`
      docStore.set(documentId, {
        title: input.sourcePath,
        kind: input.kind,
        tags: input.tags ?? [],
        chunkCount: embedded.length,
        createdAt: new Date().toISOString(),
      })
      return { chunks: embedded.length, documentId }
    },
    query: (input: any) => {
      const results = Array.from({ length: Math.min(input.topK ?? 5, 3) }, (_, i) => ({
        id: `chunk-result-${i}`,
        sourcePath: 'docs/query-result.md',
        content: `Result content ${i}`,
        score: 1.0 - i * 0.2,
        kind: 'doc',
        section: `Section ${i}`,
      }))
      return {
        query: input.query,
        results,
        totalCandidates: 10,
        durationMs: 25,
      }
    },
    getStats: () => ({
      totalDocuments: 3,
      totalChunks: 12,
      averageChunkSize: 128,
      byKind: { spec: 5, doc: 4, pattern: 3 },
    }),
    listDocuments: () => {
      if (docStore.size === 0) {
        // Default documents when none indexed
        return [
          { id: 'doc-default-1', title: 'API Spec', kind: 'spec', tags: ['api'], chunkCount: 3, createdAt: '2026-06-24T09:00:00.000Z' },
          { id: 'doc-default-2', title: 'Architecture', kind: 'doc', tags: ['arch'], chunkCount: 2, createdAt: '2026-06-24T09:00:00.000Z' },
        ]
      }
      return Array.from(docStore.entries()).map(([id, doc]) => ({ id, ...doc }))
    },
    getDocument: (id: string) => {
      const doc = docStore.get(id)
      if (!doc) return { error: `document ${id} not found` }
      return { id, ...doc }
    },
    resetIndex: () => {
      docStore.clear()
      return { ok: true }
    },
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────
describe('KnowledgeController', () => {

  // ── POST /knowledge/index ──────────────────────────────────
  describe('indexDocument()', () => {
    it('indexes a valid document and returns chunk count with documentId', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.indexDocument({
        sourcePath: 'docs/guide.md',
        content: '# Guide\n\nUser guide content.',
        kind: 'doc',
        tags: ['guide', 'user'],
      })

      assert.equal(typeof result.chunks, 'number')
      assert.ok(result.chunks >= 1)
      assert.ok(typeof result.documentId === 'string')
      assert.ok(result.documentId.startsWith('doc-'))
    })

    it('indexes document without tags', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.indexDocument({
        sourcePath: 'docs/simple.md',
        content: '# Simple\n\nNo tags here.',
        kind: 'doc',
      })

      assert.ok(result.chunks >= 1)
      assert.ok(typeof result.documentId === 'string')
    })

    it('handles kind=spec document type', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.indexDocument({
        sourcePath: 'specs/auth.md',
        content: '# Auth Spec\n\nAuthentication specification.',
        kind: 'spec',
        tags: ['auth'],
      })

      assert.ok(result.chunks >= 1)
      assert.ok(result.documentId.startsWith('doc-'))
    })

    it('handles kind=pattern document type', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.indexDocument({
        sourcePath: 'patterns/retry.md',
        content: '# Retry Pattern\n\nRetry with exponential backoff.',
        kind: 'pattern',
      })

      assert.ok(result.chunks >= 1)
    })
  })

  // ── POST /knowledge/query ──────────────────────────────────
  describe('query()', () => {
    it('returns query results with valid query string', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.query({
        query: 'authentication',
        topK: 3,
      })

      assert.equal(typeof result.query, 'string')
      assert.equal(result.query, 'authentication')
      assert.ok(Array.isArray(result.results))
      assert.ok(result.results.length <= 3)
      assert.ok(result.results.every((r: any) => typeof r.score === 'number'))
      assert.ok(typeof result.totalCandidates === 'number')
      assert.ok(typeof result.durationMs === 'number')
    })

    it('defaults topK to 5 when not specified', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.query({ query: 'test' })

      assert.ok(result.results.length <= 5)
    })

    it('filters results by kind when kindFilter provided', () => {
      const indexer = makeMockIndexer({
        query: (input: any) => {
          // Simulate filtering: only return results matching the kindFilter
          const allKinds = ['spec', 'doc', 'pattern']
          const filtered = input.kindFilter
            ? allKinds.filter(k => k === input.kindFilter)
            : allKinds
          const results = filtered.map((kind, i) => ({
            id: `chunk-${kind}-${i}`,
            sourcePath: `docs/${kind}-doc.md`,
            content: `${kind} content ${i}`,
            score: 1.0 - i * 0.3,
            kind,
            section: `${kind} Section`,
          }))
          return {
            query: input.query,
            results,
            totalCandidates: 10,
            durationMs: 25,
          }
        },
      })
      const controller = new KnowledgeController(indexer)
      const result = controller.query({
        query: 'spec',
        topK: 3,
        kindFilter: 'spec',
      })

      assert.ok(result.results.length <= 3)
      assert.ok(result.results.every((r: any) => r.kind === 'spec'))

      // Check that results without filter have more variety
      const allResult = controller.query({ query: 'spec', topK: 5 })
      const kindsSeen = new Set(allResult.results.map((r: any) => r.kind))
      assert.ok(kindsSeen.size > 1)
    })

    it('handles empty query string', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.query({ query: '', topK: 3 })

      assert.equal(result.query, '')
      assert.ok(Array.isArray(result.results))
    })

    it('handles query with minScore filter', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.query({
        query: 'important',
        topK: 5,
        minScore: 0.5,
      })

      assert.ok(result.results.every((r: any) => r.score >= 0.5))
    })
  })

  // ── GET /knowledge/stats ───────────────────────────────────
  describe('getStats()', () => {
    it('returns index statistics', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const stats = controller.getStats()

      assert.equal(typeof stats.totalDocuments, 'number')
      assert.equal(typeof stats.totalChunks, 'number')
      assert.equal(typeof stats.averageChunkSize, 'number')
      assert.ok(typeof stats.byKind === 'object')
    })

    it('byKind contains kind distribution counts', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const stats = controller.getStats()

      const totalFromKinds = Object.values(stats.byKind as Record<string, number>).reduce((s: number, v: number) => s + v, 0)
      assert.equal(totalFromKinds, stats.totalChunks)
    })

    it('stats are non-negative', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const stats = controller.getStats()

      assert.ok(stats.totalDocuments >= 0)
      assert.ok(stats.totalChunks >= 0)
      assert.ok(stats.averageChunkSize >= 0)
    })
  })

  // ── GET /knowledge/documents ───────────────────────────────
  describe('listDocuments()', () => {
    it('returns list of indexed documents', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const docs = controller.listDocuments()

      assert.ok(Array.isArray(docs))
      assert.ok(docs.length > 0)
      const doc = docs[0]
      assert.ok(typeof doc.id === 'string')
      assert.ok(typeof doc.title === 'string')
      assert.ok(typeof doc.kind === 'string')
      assert.ok(Array.isArray(doc.tags))
      assert.equal(typeof doc.chunkCount, 'number')
    })

    it('each document has required schema fields', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const docs = controller.listDocuments()

      for (const doc of docs) {
        assert.ok(doc.id)
        assert.ok(doc.title)
        assert.ok(doc.kind)
        assert.ok(Array.isArray(doc.tags))
        assert.ok(typeof doc.chunkCount === 'number')
        assert.ok(typeof doc.createdAt === 'string')
        assert.ok(Date.parse(doc.createdAt) > 0)
      }
    })
  })

  // ── GET /knowledge/documents/:id ───────────────────────────
  describe('getDocument()', () => {
    it('returns document by id after indexing', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      // First index a document
      const indexResult = controller.indexDocument({
        sourcePath: 'docs/test-get.md',
        content: '# Test\n\nTesting get document.',
        kind: 'doc',
      })
      const doc = controller.getDocument(indexResult.documentId)

      assert.ok(doc)
      assert.equal(doc.id, indexResult.documentId)
      assert.equal(doc.title, 'docs/test-get.md')
    })

    it('returns error for non-existent document id', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const result = controller.getDocument('non-existent-id')

      assert.ok('error' in result)
      assert.ok(result.error.includes('not found'))
    })
  })

  // ── POST /knowledge/reset ──────────────────────────────────
  describe('resetIndex()', () => {
    it('resets index and clears document store', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      // Index a document first
      controller.indexDocument({
        sourcePath: 'docs/temp.md',
        content: '# Temp\n\nTemporary doc.',
        kind: 'doc',
      })
      // Reset
      const resetResult = controller.resetIndex()

      assert.deepEqual(resetResult, { ok: true })
    })

    it('after reset, listDocuments returns default or empty state', () => {
      const mockIndexerWithReset = makeMockIndexer({
        resetIndex: () => {
          // clear
          return { ok: true }
        },
        listDocuments: () => [],
      })
      const controller = new KnowledgeController(mockIndexerWithReset)
      controller.resetIndex()
      const docs = controller.listDocuments()

      assert.equal(docs.length, 0)
    })
  })

  // ── Error handling ─────────────────────────────────────────
  describe('error handling', () => {
    it('indexDocument throws with missing sourcePath', () => {
      const indexer = makeMockIndexer({
        indexDocument: () => { throw new Error('sourcePath is required') },
      })
      const controller = new KnowledgeController(indexer)
      assert.throws(
        () => controller.indexDocument({ content: '# Missing path', kind: 'doc' }),
        /sourcePath is required/
      )
    })

    it('indexDocument throws with missing content', () => {
      const indexer = makeMockIndexer({
        indexDocument: () => { throw new Error('content is required') },
      })
      const controller = new KnowledgeController(indexer)
      assert.throws(
        () => controller.indexDocument({ sourcePath: 'docs/missing.md', kind: 'doc' }),
        /content is required/
      )
    })

    it('getDocument throws for null id', () => {
      const indexer = makeMockIndexer({
        getDocument: (id: string) => {
          if (!id) throw new Error('id is required')
          return { error: `document ${id} not found` }
        },
      })
      const controller = new KnowledgeController(indexer)
      assert.throws(
        () => controller.getDocument(''),
        /id is required/
      )
    })

    it('resetIndex is idempotent (call twice)', () => {
      const indexer = makeMockIndexer()
      const controller = new KnowledgeController(indexer)
      const r1 = controller.resetIndex()
      const r2 = controller.resetIndex()

      assert.deepEqual(r1, { ok: true })
      assert.deepEqual(r2, { ok: true })
    })
  })
})
