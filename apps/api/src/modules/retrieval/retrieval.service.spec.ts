import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * retrieval.service.spec.ts · RetrievalService 单元测试 (Phase-19 脚手架)
 *
 * 覆盖策略:
 *   - retrieveCode: 正常路径 / query 参数 / cache 行为 / collection 名
 *   - retrieveKnowledge: 正常路径 / 参数边界
 *   - buildRAGContext: 空 / 参数传递
 *   - getComponentHealth: 初始 unavailable / 返回结构
 *   - indexChunks: 空 / 参数 / 耦合
 *   - 辅助方法: getLastIndexAt, buildCacheKey 效果
 *   - 错误路径: 传递异常入参
 */

import { RetrievalService } from './retrieval.service';
import assert from 'node:assert/strict'
import type { RetrievalQuery } from './retrieval.types'

describe('RetrievalService', () => {

  function buildService(cache?: any) {
    const mockQdrant: any = {
      healthz: async () => ({ status: 'ok' as const }),
      search: async () => [],
      hybridSearch: async () => [],
      upsert: async () => ({ written: 0, failed: 0 }),
      count: async () => 0,
      ensureCollection: async () => undefined,
      deleteByFilePath: async () => 0,
    }
    const mockEmbedder: any = {
      embed: async () => new Array(3072).fill(0),
      batchEmbed: async () => [],
      sparseEmbed: async () => ({}),
      healthcheck: async () => ({ ok: true, provider: 'mock', latencyMs: 0 }),
      provider: 'mock',
      dimension: 3072,
    }
    const mockConfig: any = {
      qdrant: { host: '127.0.0.1', port: 6333, vectorSize: 3072 },
      embedder: { provider: 'mock', batchSize: 32 },
      chunking: { codeChunkSize: 800, codeChunkOverlap: 200 },
      retrieval: { defaultTopK: 10, rerankTopK: 5 },
      cache: { ttlSeconds: 3600, keyPrefix: 'rag:' },
      llm: { provider: 'mock', model: 'gpt-4', maxTokens: 4096, temperature: 0.7 },
    }

    return new RetrievalService(mockConfig, mockQdrant, mockEmbedder, cache)
  }

  // ─── retrieveCode ─────────────────────────────────────────────────

  describe('retrieveCode', () => {
    it('returns structured empty response (skeleton)', async () => {
      const service = buildService()
      const query: RetrievalQuery = { query: 'how does lyt quota work', topK: 10 }
      const response = await service.retrieveCode(query)

      assert.equal(response.results.length, 0)
      assert.equal(response.totalHits, 0)
      assert.equal(response.latencyMs, 0)
      assert.equal(response.cacheHit, false)
      assert.deepStrictEqual(response.collections, ['code_chunks'])
    })

    it('works with empty query string', async () => {
      const service = buildService()
      const response = await service.retrieveCode({ query: '' })
      assert.equal(response.results.length, 0)
      assert.deepStrictEqual(response.collections, ['code_chunks'])
    })

    it('accepts all optional RetrievalQuery fields without error', async () => {
      const service = buildService()
      const query: RetrievalQuery = {
        query: 'token validation',
        topK: 20,
        threshold: 0.7,
        collections: ['code_chunks', 'knowledge_docs'],
        phaseFilter: ['phase-19'],
        pathPrefix: 'apps/api/src',
        hybrid: true,
        rerank: true,
      }
      const response = await service.retrieveCode(query)
      assert.equal(response.results.length, 0)
      // collections should follow default for retrieveCode
      assert.deepStrictEqual(response.collections, ['code_chunks'])
    })
  })

  // ─── retrieveKnowledge ────────────────────────────────────────────

  describe('retrieveKnowledge', () => {
    it('returns structured empty response', async () => {
      const service = buildService()
      const query: RetrievalQuery = { query: 'lessons learned about quota' }
      const response = await service.retrieveKnowledge(query)

      assert.equal(response.results.length, 0)
      assert.deepStrictEqual(response.collections, ['knowledge_docs'])
    })

    it('works with very long query string', async () => {
      const service = buildService()
      const longQuery = 'a'.repeat(10000)
      const response = await service.retrieveKnowledge({ query: longQuery })
      assert.equal(response.results.length, 0)
    })

    it('returns correct collection name', async () => {
      const service = buildService()
      const response = await service.retrieveKnowledge({ query: 'patterns' })
      assert.deepStrictEqual(response.collections, ['knowledge_docs'])
    })
  })

  // ─── buildRAGContext ──────────────────────────────────────────────

  describe('buildRAGContext', () => {
    it('returns empty context in skeleton mode', async () => {
      const service = buildService()
      const ctx = await service.buildRAGContext('test query', {
        phase: 'phase-19',
        pulse: 'pulse-68',
        intent: 'review',
      })

      assert.equal(ctx.codeContext.length, 0)
      assert.equal(ctx.knowledgeContext.length, 0)
      assert.deepStrictEqual(ctx.trigger, {
        phase: 'phase-19',
        pulse: 'pulse-68',
        intent: 'review',
      })
    })

    it('works without trigger argument', async () => {
      const service = buildService()
      const ctx = await service.buildRAGContext('test query')

      assert.equal(ctx.codeContext.length, 0)
      assert.equal(ctx.knowledgeContext.length, 0)
      assert.equal(ctx.trigger, undefined)
    })

    it('returns zero totalLatencyMs (skeleton)', async () => {
      const service = buildService()
      const ctx = await service.buildRAGContext('anything')
      assert.equal(ctx.totalLatencyMs, 0)
    })
  })

  // ─── indexChunks ──────────────────────────────────────────────────

  describe('indexChunks', () => {
    it('returns zero written for empty chunks (skeleton)', async () => {
      const service = buildService()
      const result = await service.indexChunks('code_chunks', [])
      assert.equal(result.written, 0)
      assert.equal(result.failed, 0)
    })

    it('treats all chunks as failed (skeleton)', async () => {
      const service = buildService()
      const result = await service.indexChunks('code_chunks', [
        { payload: { chunkId: 'c1', filePath: 'a.ts', language: 'ts', astType: 'file', symbolName: 'a', lineRange: [1, 10], phase: 'p1', pulse: 'pu1', gitSha: 'abc', tokens: 50, isPublic: true, isTest: false, content: 'code' }, vector: [0.1] },
      ])
      assert.equal(result.written, 0)
      assert.equal(result.failed, 1)
    })

    it('accepts knowledge_docs collection', async () => {
      const service = buildService()
      const result = await service.indexChunks('knowledge_docs', [])
      assert.equal(result.written, 0)
    })
  })

  // ─── getComponentHealth ───────────────────────────────────────────

  describe('getComponentHealth', () => {
    it('returns unavailable initially', async () => {
      const service = buildService()
      const health = await service.getComponentHealth()

      assert.equal(health.qdrant, 'unavailable')
      assert.equal(health.embedder, 'unavailable')
      assert.equal(health.lastIndexAt, null)
    })

    it('returns correct shape with all required keys', async () => {
      const service = buildService()
      const health = await service.getComponentHealth()

      assert.ok('qdrant' in health)
      assert.ok('embedder' in health)
      assert.ok('lastIndexAt' in health)
      assert.ok(['ok', 'degraded', 'unavailable'].includes(health.qdrant))
    })
  })

  // ─── getLastIndexAt ───────────────────────────────────────────────

  describe('getLastIndexAt', () => {
    it('returns null initially', () => {
      const service = buildService()
      assert.equal(service.getLastIndexAt(), null)
    })

    it('returns null even after indexChunks call (not implemented)', async () => {
      const service = buildService()
      await service.indexChunks('code_chunks', [])
      assert.equal(service.getLastIndexAt(), null)
    })
  })

  // ─── 构造函数与依赖注入 ──────────────────────────────────────────

  describe('constructor & dependencies', () => {
    it('can be instantiated without cache service (Optional)', () => {
      const service = buildService()
      assert.ok(service instanceof RetrievalService)
    })

    it('can be instantiated with a mock cache service', () => {
      const mockCache: any = {
        get: async () => null,
        set: async () => undefined,
      }
      const service = buildService(mockCache)
      assert.ok(service instanceof RetrievalService)
    })
  })
})
