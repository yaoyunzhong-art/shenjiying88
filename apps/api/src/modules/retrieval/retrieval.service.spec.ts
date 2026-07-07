import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * retrieval.service.spec.ts · RetrievalService 单元测试 (Phase-19 脚手架)
 *
 * 当前仅定义测试骨架,验证:
 *   - service 可被实例化 (依赖注入正常)
 *   - retrieveCode 返回结构化空响应 (TODO 未实现)
 *   - getComponentHealth 返回初始 unavailable 状态
 *
 * 完整测试待 Pulse-71 实现后补充:
 *   - cache 命中 vs 未命中
 *   - hybrid search 排序正确性
 *   - rerank topK 截断
 *   - 异常路径 (qdrant 不可用 / embedder 超时)
 */

import { RetrievalService } from './retrieval.service';
import assert from 'node:assert/strict'
import type { RetrievalQuery } from './retrieval.types'

/**
 * ⚠️  由于 RetrievalService 依赖 QdrantClientWrapper + EmbeddingService + ConfigType,
 * 当前 spec 用 require + mock 方式避免触发 import 链,等 Pulse-71 接入 Nest testing
 * 后改为 Test.createTestingModule 风格。
 */

describe('RetrievalService (skeleton)', () => {

  function buildService() {
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

    return new RetrievalService(mockConfig, mockQdrant, mockEmbedder)
  }

  it('retrieveCode returns structured empty response (skeleton)', async () => {
    const service = buildService()
    const query: RetrievalQuery = { query: 'how does lyt quota work', topK: 10 }
    const response = await service.retrieveCode(query)

    assert.equal(response.results.length, 0)
    assert.equal(response.totalHits, 0)
    assert.equal(response.latencyMs, 0)
    assert.equal(response.cacheHit, false)
    assert.deepStrictEqual(response.collections, ['code_chunks'])
  })

  it('retrieveKnowledge returns structured empty response', async () => {
    const service = buildService()
    const query: RetrievalQuery = { query: 'lessons learned about quota' }
    const response = await service.retrieveKnowledge(query)

    assert.equal(response.results.length, 0)
    assert.deepStrictEqual(response.collections, ['knowledge_docs'])
  })

  it('buildRAGContext returns empty context in skeleton mode', async () => {
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

  it('getComponentHealth returns unavailable initially', async () => {
    const service = buildService()
    const health = await service.getComponentHealth()

    assert.equal(health.qdrant, 'unavailable')
    assert.equal(health.embedder, 'unavailable')
    assert.equal(health.lastIndexAt, null)
  })

  it('getLastIndexAt returns null initially', () => {
    const service = buildService()
    assert.equal(service.getLastIndexAt(), null)
  })

  it('indexChunks returns zero written (skeleton)', async () => {
    const service = buildService()
    const result = await service.indexChunks('code_chunks', [])

    assert.equal(result.written, 0)
    assert.equal(result.failed, 0)
  })
})