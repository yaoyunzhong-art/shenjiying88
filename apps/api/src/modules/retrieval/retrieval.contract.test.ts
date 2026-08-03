// @ts-nocheck
import { describe, it, expect } from 'vitest'
import 'reflect-metadata'
import { RetrievalService } from './retrieval.service'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import { retrievalConfig } from './config/retrieval.config'
import { RetrievalUnavailableError, EmbeddingQuotaExceededError } from './retrieval.types'

function buildService() {
  const cfg = retrievalConfig()
  return new RetrievalService(cfg, new QdrantClientWrapper(cfg), new EmbeddingService(cfg))
}

describe('Retrieval Contract (Pulse-71)', () => {
  describe('service method signatures', () => {
    const service = buildService()

    it('retrieveCode exists and accepts query', () => {
      expect(typeof service.retrieveCode).toBe('function')
    })

    it('retrieveKnowledge exists', () => {
      expect(typeof service.retrieveKnowledge).toBe('function')
    })

    it('buildRAGContext exists', () => {
      expect(typeof service.buildRAGContext).toBe('function')
    })

    it('indexChunks exists', () => {
      expect(typeof service.indexChunks).toBe('function')
    })

    it('getComponentHealth exists', () => {
      expect(typeof service.getComponentHealth).toBe('function')
    })
  })

  describe('error types', () => {
    it('RetrievalUnavailableError is instantiable', () => {
      const err = new RetrievalUnavailableError('test')
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toContain('test')
    })

    it('EmbeddingQuotaExceededError is instantiable', () => {
      const err = new EmbeddingQuotaExceededError('quota exceeded')
      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('retrieveCode contract', () => {
    const service = buildService()

    it('returns expected shape', async () => {
      const r = await service.retrieveCode({ query: 'test' })
      expect(r).toHaveProperty('results')
      expect(r).toHaveProperty('totalHits')
      expect(r).toHaveProperty('latencyMs')
      expect(r).toHaveProperty('cacheHit')
      expect(r).toHaveProperty('collections')
      expect(Array.isArray(r.results)).toBe(true)
    })
  })

  describe('health contract', () => {
    const service = buildService()

    it('returns component status with correct shape', async () => {
      const h = await service.getComponentHealth()
      expect(['ok', 'degraded', 'unavailable']).toContain(h.qdrant)
      expect(['ok', 'degraded', 'unavailable']).toContain(h.embedder)
      expect(h).toHaveProperty('lastIndexAt')
    })
  })
})
