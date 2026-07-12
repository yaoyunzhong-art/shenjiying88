// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * retrieval.service.test.ts · RetrievalService 单元测试
 *
 * 覆盖:
 *   - retrieveCode / retrieveKnowledge 骨架行为
 *   - buildRAGContext
 *   - indexChunks
 *   - getComponentHealth / getLastIndexAt
 *   - 边界与状态验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('RetrievalService', () => {
  const { RetrievalService } = require('./retrieval.service')

  let service: InstanceType<typeof RetrievalService>

  beforeEach(() => {
    service = new RetrievalService()
  })

  // ─── retrieveCode ─────────────────────────────────────────────────────

  describe('retrieveCode', () => {
    it('should return skeleton empty response', async () => {
      const response = await service.retrieveCode({ query: 'test query' })

      assert.ok(Array.isArray(response.results))
      assert.equal(response.results.length, 0)
      assert.equal(response.totalHits, 0)
      assert.equal(response.latencyMs, 0)
      assert.equal(response.cacheHit, false)
      assert.deepEqual(response.collections, ['code_chunks'])
    })

    it('should accept query with all options', async () => {
      const response = await service.retrieveCode({
        query: 'loyalty rules',
        topK: 20,
        threshold: 0.6,
        collections: ['code_chunks', 'rfc_history'],
        phaseFilter: ['phase-19'],
        pathPrefix: 'apps/api/src',
        hybrid: true,
        rerank: true,
      })

      assert.equal(response.results.length, 0)
    })

    it('should handle empty query', async () => {
      const response = await service.retrieveCode({ query: '' })

      assert.equal(response.totalHits, 0)
    })

    it('should handle extreme topK', async () => {
      const response = await service.retrieveCode({ query: 'test', topK: 100 })

      assert.equal(response.totalHits, 0)
    })
  })

  // ─── retrieveKnowledge ────────────────────────────────────────────────

  describe('retrieveKnowledge', () => {
    it('should return skeleton empty response for knowledge', async () => {
      const response = await service.retrieveKnowledge({ query: 'test knowledge' })

      assert.ok(Array.isArray(response.results))
      assert.equal(response.results.length, 0)
      assert.equal(response.totalHits, 0)
      assert.deepEqual(response.collections, ['knowledge_docs'])
    })

    it('should handle knowledge query with options', async () => {
      const response = await service.retrieveKnowledge({
        query: 'deploy guide',
        topK: 5,
        collections: ['knowledge_docs'],
      })

      assert.equal(response.totalHits, 0)
    })
  })

  // ─── buildRAGContext ──────────────────────────────────────────────────

  describe('buildRAGContext', () => {
    it('should return empty context with trigger', async () => {
      const ctx = await service.buildRAGContext('test query', {
        phase: 'phase-19',
        pulse: 'pulse-68',
        intent: 'review',
      })

      assert.ok(Array.isArray(ctx.codeContext))
      assert.equal(ctx.codeContext.length, 0)
      assert.ok(Array.isArray(ctx.knowledgeContext))
      assert.equal(ctx.knowledgeContext.length, 0)
      assert.equal(ctx.totalLatencyMs, 0)
      assert.deepEqual(ctx.trigger, { phase: 'phase-19', pulse: 'pulse-68', intent: 'review' })
    })

    it('should return context without trigger', async () => {
      const ctx = await service.buildRAGContext('test query')

      assert.equal(ctx.codeContext.length, 0)
      assert.equal(ctx.knowledgeContext.length, 0)
      assert.equal(ctx.trigger, undefined)
    })

    it('should handle empty query string', async () => {
      const ctx = await service.buildRAGContext('')

      assert.equal(ctx.codeContext.length, 0)
    })

    it('should handle very long query string', async () => {
      const ctx = await service.buildRAGContext('x'.repeat(5000))

      assert.equal(ctx.codeContext.length, 0)
    })
  })

  // ─── indexChunks ──────────────────────────────────────────────────────

  describe('indexChunks', () => {
    it('should return zero written and all failed (skeleton)', async () => {
      const result = await service.indexChunks('code_chunks', [
        {
          payload: {
            chunkId: 'abc123',
            filePath: 'apps/api/src/test.ts',
            language: 'typescript',
            astType: 'class',
            symbolName: 'TestClass',
            lineRange: [1, 50],
            phase: 'phase-19',
            pulse: 'pulse-68',
            gitSha: 'abc123def',
            tokens: 100,
            isPublic: true,
            isTest: false,
            content: 'export class TestClass {}',
          },
          vector: [0.1, 0.2, 0.3],
        },
      ])

      assert.equal(result.written, 0)
      assert.equal(result.failed, 1)
    })

    it('should handle empty chunks array', async () => {
      const result = await service.indexChunks('knowledge_docs', [])

      assert.equal(result.written, 0)
      assert.equal(result.failed, 0)
    })

    it('should handle multiple chunks', async () => {
      const result = await service.indexChunks('code_chunks', [
        {
          payload: {
            chunkId: 'chunk-1', filePath: 'a.ts', language: 'typescript',
            astType: 'method', symbolName: 'foo', lineRange: [1, 10],
            phase: 'p19', pulse: 'p68', gitSha: 'sha1', tokens: 50,
            isPublic: true, isTest: false, content: 'function foo() {}',
          },
          vector: [0.1],
        },
        {
          payload: {
            chunkId: 'chunk-2', filePath: 'b.ts', language: 'typescript',
            astType: 'method', symbolName: 'bar', lineRange: [1, 10],
            phase: 'p19', pulse: 'p68', gitSha: 'sha2', tokens: 30,
            isPublic: false, isTest: true, content: '// test',
          },
          vector: [0.2],
        },
      ])

      assert.equal(result.written, 0)
      assert.equal(result.failed, 2)
    })
  })

  // ─── getComponentHealth / getLastIndexAt ──────────────────────────────

  describe('health check', () => {
    it('getLastIndexAt should return null initially', () => {
      const result = service.getLastIndexAt()

      assert.equal(result, null)
    })

    it('getComponentHealth should return skeleton state', async () => {
      const health = await service.getComponentHealth()

      assert.equal(health.qdrant, 'unavailable')
      assert.equal(health.embedder, 'unavailable')
      assert.equal(health.lastIndexAt, null)
    })
  })
})
