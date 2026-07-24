// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { RetrievalController } from './retrieval.controller'
import { RetrievalService } from './retrieval.service'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import { retrievalConfig } from './config/retrieval.config'
import assert from 'node:assert/strict'

function buildService() {
  const cfg = retrievalConfig()
  return new RetrievalService(cfg, new QdrantClientWrapper(cfg), new EmbeddingService(cfg))
}

describe('RetrievalController (Pulse-71)', () => {
  let controller: RetrievalController

  beforeEach(() => {
    controller = new RetrievalController(buildService())
  })

  describe('route metadata', () => {
    it('controller is defined', () => {
      expect(controller).toBeDefined()
    })

    it('has expected methods', () => {
      expect(typeof controller.query).toBe('function')
      expect(typeof controller.queryKnowledge).toBe('function')
      expect(typeof controller.health).toBe('function')
    })
  })

  describe('query', () => {
    it('returns RetrievalResponse with results', async () => {
      const res = await controller.query({ query: 'test', topK: 10 })
      expect(res).toHaveProperty('results')
      expect(res).toHaveProperty('totalHits')
      expect(res).toHaveProperty('cacheHit')
    })

    it('handles empty query', async () => {
      const res = await controller.query({ query: '' })
      expect(res.totalHits).toBe(0)
    })

    it('accepts hybrid/rerank options', async () => {
      const res = await controller.query({ query: 'test', hybrid: true, rerank: true, topK: 20 })
      expect(res.totalHits).toBe(0)
    })
  })

  describe('queryKnowledge', () => {
    it('returns knowledge response with expected collections', async () => {
      const res = await controller.queryKnowledge({ query: 'test' })
      expect(res.collections).toEqual(['knowledge_docs'])
      expect(res.totalHits).toBe(0)
    })
  })

  describe('health', () => {
    it('returns health status', async () => {
      const h = await controller.health()
      expect(h).toHaveProperty('qdrant')
      expect(h).toHaveProperty('embedder')
      expect(h).toHaveProperty('lastIndexAt')
      expect(['ok', 'degraded', 'unavailable']).toContain(h.qdrant)
    })

    it('health returns 200-like structure', async () => {
      const h = await controller.health()
      expect(h.qdrant).toBeDefined()
      expect(h.embedder).toBeDefined()
    })
  })
})
