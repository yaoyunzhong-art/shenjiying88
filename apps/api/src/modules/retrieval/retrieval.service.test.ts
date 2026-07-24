// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest'
import { RetrievalService } from './retrieval.service'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import { retrievalConfig } from './config/retrieval.config'

function makeCfg() {
  const raw = retrievalConfig()
  return raw
}

function makeQdrant() {
  return new QdrantClientWrapper(makeCfg())
}

function makeEmbedder() {
  return new EmbeddingService(makeCfg())
}

describe('RetrievalService (Pulse-71 Refactored)', () => {
  let service: RetrievalService

  beforeEach(() => {
    service = new RetrievalService(makeCfg(), makeQdrant(), makeEmbedder())
  })

  describe('retrieveCode', () => {
    it('returns empty results with no Qdrant data', async () => {
      const r = await service.retrieveCode({ query: 'test query' })
      expect(Array.isArray(r.results)).toBe(true)
      expect(r.totalHits).toBe(0)
      expect(r.cacheHit).toBe(false)
      expect(r.collections).toEqual(['code_chunks'])
    })

    it('accepts all query options without throwing', async () => {
      const r = await service.retrieveCode({
        query: 'loyalty rules', topK: 20, threshold: 0.6,
        collections: ['code_chunks', 'rfc_history'], phaseFilter: ['phase-19'],
        pathPrefix: 'apps/api/src', hybrid: true, rerank: true,
      })
      expect(r.totalHits).toBe(0)
    })

    it('handles empty query', async () => {
      const r = await service.retrieveCode({ query: '' })
      expect(r.totalHits).toBe(0)
    })

    it('handles extreme topK', async () => {
      const r = await service.retrieveCode({ query: 'test', topK: 100 })
      expect(r.totalHits).toBe(0)
    })
  })

  describe('retrieveKnowledge', () => {
    it('returns empty results for knowledge', async () => {
      const r = await service.retrieveKnowledge({ query: 'test knowledge' })
      expect(r.totalHits).toBe(0)
      expect(r.collections).toEqual(['knowledge_docs'])
    })

    it('handles knowledge query with options', async () => {
      const r = await service.retrieveKnowledge({ query: 'deploy guide', topK: 5, collections: ['knowledge_docs'] })
      expect(r.totalHits).toBe(0)
    })
  })

  describe('buildRAGContext', () => {
    it('returns empty context with trigger', async () => {
      const ctx = await service.buildRAGContext('test query', { phase: 'phase-19', pulse: 'pulse-68', intent: 'review' })
      expect(Array.isArray(ctx.codeContext)).toBe(true)
      expect(ctx.codeContext.length).toBe(0)
      expect(Array.isArray(ctx.knowledgeContext)).toBe(true)
      expect(ctx.knowledgeContext.length).toBe(0)
      expect(ctx.trigger).toEqual({ phase: 'phase-19', pulse: 'pulse-68', intent: 'review' })
    })

    it('returns context without trigger', async () => {
      const ctx = await service.buildRAGContext('test query')
      expect(ctx.codeContext.length).toBe(0)
      expect(ctx.knowledgeContext.length).toBe(0)
    })

    it('handles empty query', async () => {
      const ctx = await service.buildRAGContext('')
      expect(ctx.codeContext.length).toBe(0)
    })

    it('handles very long query', async () => {
      const ctx = await service.buildRAGContext('x'.repeat(5000))
      expect(ctx.codeContext.length).toBe(0)
    })
  })

  describe('indexChunks', () => {
    it('writes all chunks in noop mode', async () => {
      const r = await service.indexChunks('code_chunks', [
        { payload: { chunkId: 'abc', filePath: 'a.ts', language: 'ts', astType: 'class', symbolName: 'X', lineRange: [1,10], phase: 'p1', pulse: 'p1', gitSha: 's', tokens: 10, isPublic: true, isTest: false, content: 'x' }, vector: [0.1] },
      ])
      expect(r.written).toBe(1)
      expect(r.failed).toBe(0)
    })

    it('handles empty chunks', async () => {
      const r = await service.indexChunks('knowledge_docs', [])
      expect(r.written).toBe(0)
      expect(r.failed).toBe(0)
    })
  })

  describe('health', () => {
    it('getLastIndexAt returns null initially', () => {
      expect(service.getLastIndexAt()).toBeNull()
    })

    it('getComponentHealth returns degraded (no qdrant server)', async () => {
      const h = await service.getComponentHealth()
      expect(h.qdrant).toBe('degraded')
      expect(h.embedder).toBe('ok')
    })
  })
})
