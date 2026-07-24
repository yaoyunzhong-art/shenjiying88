import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { RetrievalController } from './retrieval.controller'
import { RetrievalService } from './retrieval.service'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import { retrievalConfig } from './config/retrieval.config'

function buildService() {
  const cfg = retrievalConfig()
  return new RetrievalService(cfg, new QdrantClientWrapper(cfg), new EmbeddingService(cfg))
}

describe('RetrievalController (Pulse-71)', () => {
  let controller: RetrievalController

  beforeEach(() => { controller = new RetrievalController(buildService()) })

  it('is defined', () => { expect(controller).toBeDefined() })
  it('has query method', () => { expect(typeof controller.query).toBe('function') })
  it('has queryKnowledge method', () => { expect(typeof controller.queryKnowledge).toBe('function') })

  describe('query', () => {
    it('returns RetrievalResponse', async () => {
      const res = await controller.query({ query: 'test', topK: 10 })
      expect(res).toHaveProperty('results')
      expect(res).toHaveProperty('totalHits')
    })

    it('handles empty query', async () => {
      const res = await controller.query({ query: '' })
      expect(res.totalHits).toBe(0)
    })
  })

  describe('queryKnowledge', () => {
    it('returns knowledge response', async () => {
      const res = await controller.queryKnowledge({ query: 'test' })
      expect(res.collections).toEqual(['knowledge_docs'])
    })
  })
})
