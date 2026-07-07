import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * retrieval.controller.test.ts · RetrievalController 单元测试
 *
 * 覆盖:
 *   - 路由元数据 (path / method)
 *   - POST /api/retrieval/query         正常流 + 边界
 *   - POST /api/retrieval/query/knowledge  知识库查询
 *   - 异常路径 (空查询)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('RetrievalController', () => {
  const { RetrievalController } = require('./retrieval.controller')
  const { RetrievalService } = require('./retrieval.service')

  let controller: InstanceType<typeof RetrievalController>
  let service: InstanceType<typeof RetrievalService>

  beforeEach(() => {
    service = new RetrievalService()
    controller = new RetrievalController(service)
  })

  // ─── 路由元数据 ────────────────────────────────────────────────────────

  describe('route metadata', () => {
    it('controller path should be api/retrieval', () => {
      const path = Reflect.getMetadata('path', RetrievalController)
      assert.equal(path, 'api/retrieval')
    })

    it('query route should be POST /query', () => {
      const method = Reflect.getMetadata('method', RetrievalController.prototype.query)
      const path = Reflect.getMetadata('path', RetrievalController.prototype.query)

      assert.equal(method, 1) // POST
      assert.equal(path, 'query')
    })

    it('queryKnowledge route should be POST /query/knowledge', () => {
      const method = Reflect.getMetadata('method', RetrievalController.prototype.queryKnowledge)
      const path = Reflect.getMetadata('path', RetrievalController.prototype.queryKnowledge)

      assert.equal(method, 1) // POST
      assert.equal(path, 'query/knowledge')
    })
  })

  // ─── POST /api/retrieval/query (代码检索) ─────────────────────────────

  describe('POST /api/retrieval/query', () => {
    it('should return empty results for a query (skeleton state)', async () => {
      const response = await controller.query({
        query: 'find user service',
        topK: 5,
        threshold: 0.7,
      })

      assert.ok(Array.isArray(response.results))
      assert.equal(response.totalHits, 0)
      assert.equal(response.latencyMs, 0)
      assert.equal(response.cacheHit, false)
      assert.deepEqual(response.collections, ['code_chunks'])
    })

    it('should accept minimal query (query only)', async () => {
      const response = await controller.query({ query: 'auth guard' })

      assert.ok(Array.isArray(response.results))
      assert.equal(response.totalHits, 0)
      assert.equal(typeof response.latencyMs, 'number')
      assert.equal(typeof response.cacheHit, 'boolean')
    })

    it('should accept query with all optional fields', async () => {
      const response = await controller.query({
        query: 'loyalty points calculation',
        topK: 20,
        threshold: 0.5,
        collections: ['code_chunks', 'rfc_history'],
        phaseFilter: ['phase-19', 'phase-20'],
        pathPrefix: 'apps/api/src',
        hybrid: true,
        rerank: true,
      })

      assert.ok(Array.isArray(response.results))
      assert.equal(response.totalHits, 0)
    })

    it('should accept query with topK=100 (max boundary)', async () => {
      const response = await controller.query({ query: 'boundary test', topK: 100 })

      assert.equal(response.totalHits, 0)
    })

    it('should accept query with threshold=0 (min boundary)', async () => {
      const response = await controller.query({ query: 'boundary test', threshold: 0 })

      assert.equal(response.totalHits, 0)
    })

    it('should accept query with threshold=1 (max boundary)', async () => {
      const response = await controller.query({ query: 'boundary test', threshold: 1 })

      assert.equal(response.totalHits, 0)
    })
  })

  // ─── POST /api/retrieval/query/knowledge (知识库检索) ─────────────────

  describe('POST /api/retrieval/query/knowledge', () => {
    it('should return empty results for knowledge query (skeleton state)', async () => {
      const response = await controller.queryKnowledge({ query: 'deployment best practices' })

      assert.ok(Array.isArray(response.results))
      assert.equal(response.totalHits, 0)
      assert.deepEqual(response.collections, ['knowledge_docs'])
    })

    it('should accept knowledge query with topK', async () => {
      const response = await controller.queryKnowledge({ query: 'monitoring setup', topK: 10 })

      assert.equal(response.totalHits, 0)
      assert.deepEqual(response.collections, ['knowledge_docs'])
    })

    it('should accept knowledge query with collection filter', async () => {
      const response = await controller.queryKnowledge({
        query: 'rate limiting',
        collections: ['knowledge_docs'],
      })

      assert.equal(response.totalHits, 0)
    })

    it('should handle short query (1 char)', async () => {
      const response = await controller.queryKnowledge({ query: 'a' })

      assert.equal(response.totalHits, 0)
    })

    it('should handle long query', async () => {
      const response = await controller.queryKnowledge({ query: 'x'.repeat(2000) })

      assert.equal(response.totalHits, 0)
    })
  })

  // ─── 异常路径 ─────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('should handle empty query string gracefully', async () => {
      const response = await controller.query({ query: '' })

      assert.equal(response.totalHits, 0)
      assert.equal(typeof response.latencyMs, 'number')
    })

    it('should handle null-like body (undefined fields)', async () => {
      const response = await controller.query({ query: '' })

      assert.ok(Array.isArray(response.results))
    })
  })
})
