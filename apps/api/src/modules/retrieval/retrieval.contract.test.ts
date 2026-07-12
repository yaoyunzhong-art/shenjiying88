import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * retrieval.contract.test.ts · Retrieval 模块契约测试
 *
 * 验证控制器及服务的接口契约稳定,不因后续实现发生破坏性变更。
 * 契约: 入参/出参结构、错误类型、元数据。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RetrievalService } from './retrieval.service'

describe('Retrieval Contract', () => {

  describe('service method signatures', () => {
    let service: InstanceType<typeof RetrievalService>

    (() => {
      service = new RetrievalService()
    })

    it('retrieveCode returns RetrievalResponse shape', async () => {
      const res = await service.retrieveCode({ query: 'test' })

      assert.ok('results' in res)
      assert.ok('totalHits' in res)
      assert.ok('latencyMs' in res)
      assert.ok('cacheHit' in res)
      assert.ok('collections' in res)

      // 类型断言
      assert.equal(typeof res.totalHits, 'number')
      assert.equal(typeof res.latencyMs, 'number')
      assert.equal(typeof res.cacheHit, 'boolean')
      assert.ok(Array.isArray(res.results))
      assert.ok(Array.isArray(res.collections))
    })

    it('retrieveKnowledge returns RetrievalResponse shape', async () => {
      const res = await service.retrieveKnowledge({ query: 'test' })

      assert.ok('results' in res)
      assert.ok('totalHits' in res)
      assert.ok('latencyMs' in res)
      assert.ok('cacheHit' in res)
      assert.ok('collections' in res)
      assert.equal(typeof res.totalHits, 'number')
    })

    it('buildRAGContext returns RAGContext shape', async () => {
      const ctx = await service.buildRAGContext('test query')

      assert.ok('codeContext' in ctx)
      assert.ok('knowledgeContext' in ctx)
      assert.ok('totalLatencyMs' in ctx)
      assert.equal(typeof ctx.totalLatencyMs, 'number')
      assert.ok(Array.isArray(ctx.codeContext))
      assert.ok(Array.isArray(ctx.knowledgeContext))
    })

    it('indexChunks returns index result shape', async () => {
      const res = await service.indexChunks('code_chunks', [{
        payload: {
          chunkId: 'test', filePath: 'f.ts', language: 'ts', astType: 'file',
          symbolName: 'f', lineRange: [1, 1], phase: 'p19', pulse: 'p68',
          gitSha: 'sha', tokens: 0, isPublic: true, isTest: false, content: '',
        },
        vector: [0],
      }])

      assert.ok('written' in res)
      assert.ok('failed' in res)
      assert.equal(typeof res.written, 'number')
      assert.equal(typeof res.failed, 'number')
    })

    it('getComponentHealth returns health shape', async () => {
      const h = await service.getComponentHealth()

      assert.ok('qdrant' in h)
      assert.ok('embedder' in h)
      assert.ok('lastIndexAt' in h)
    })

    it('getLastIndexAt returns string or null', () => {
      const v = service.getLastIndexAt()

      assert.ok(v === null || typeof v === 'string')
    })
  })

  describe('RetrievalUnavailableError contract', () => {
    it('RetrievalUnavailableError should have reason property', async () => {
      const { RetrievalUnavailableError } = await import('./retrieval.types')

      const err = new RetrievalUnavailableError('Qdrant connection refused')

      assert.equal(err.name, 'RetrievalUnavailableError')
      assert.ok(err.message.includes('Qdrant'))
      assert.equal(err.reason, 'Qdrant connection refused')
    })
  })

  describe('EmbeddingQuotaExceededError contract', () => {
    it('should have provider property', async () => {
      const { EmbeddingQuotaExceededError } = await import('./retrieval.types')

      const err = new EmbeddingQuotaExceededError('text-embedding-3-large')

      assert.equal(err.name, 'EmbeddingQuotaExceededError')
      assert.ok(err.message.includes('text-embedding-3-large'))
      assert.equal(err.provider, 'text-embedding-3-large')
    })
  })
})
