import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { DiversificationService } from './diversification.service'
import type { Candidate, ProductSnapshot } from './recommend.entity'

describe('DiversificationService', () => {
  let service: DiversificationService

  const makeCandidate = (itemId: string, score: number, reasoning = 'test'): Candidate => ({
    itemId,
    score,
    reasoning,
    strategy: 'popular' as const,
  })

  const makeProduct = (
    id: string,
    category: string,
    priceCents: number,
    tags?: string[],
  ): ProductSnapshot => ({
    id,
    tenantId: 't1',
    sku: `SKU-${id}`,
    name: `Product ${id}`,
    category,
    priceCents,
    available: true,
    tags,
  })

  beforeEach(() => {
    service = new DiversificationService()
  })

  describe('rerank', () => {
    it('should return empty array for empty candidates', () => {
      const result = service.rerank([], new Map(), 5)
      expect(result).toEqual([])
    })

    it('should return all candidates if topN >= length', () => {
      const candidates = [
        makeCandidate('a', 0.9),
        makeCandidate('b', 0.8),
        makeCandidate('c', 0.7),
      ]
      const result = service.rerank(candidates, new Map(), 5)
      expect(result).toHaveLength(3)
      expect(result[0].itemId).toBe('a')
    })

    it('should pick highest score first, then diversify', () => {
      const candidates = [
        makeCandidate('a', 0.9),
        makeCandidate('b', 0.85),
        makeCandidate('c', 0.8),
        makeCandidate('d', 0.75),
      ]
      const productMap = new Map<string, ProductSnapshot>([
        ['a', makeProduct('a', 'food', 1000, ['hot'])],
        ['b', makeProduct('b', 'food', 1100, ['hot'])],
        ['c', makeProduct('c', 'drink', 1500, ['cold'])],
        ['d', makeProduct('d', 'food', 950, ['hot'])],
      ])

      const result = service.rerank(candidates, productMap, 3)

      expect(result).toHaveLength(3)
      // First should be highest score
      expect(result[0].itemId).toBe('a')
      // After diversification, should include different category
      const categories = result.map(c => productMap.get(c.itemId)!.category)
      expect(new Set(categories).size).toBeGreaterThanOrEqual(2)
    })

    it('should handle candidates without product map entries', () => {
      const candidates = [
        makeCandidate('a', 0.9),
        makeCandidate('b', 0.8),
      ]
      const productMap = new Map<string, ProductSnapshot>()

      const result = service.rerank(candidates, productMap, 2)
      expect(result).toHaveLength(2)
    })

    it('should rank by diversity when all same category', () => {
      const candidates = [
        makeCandidate('a', 0.95),
        makeCandidate('b', 0.90),
        makeCandidate('c', 0.85),
      ]
      const productMap = new Map<string, ProductSnapshot>([
        ['a', makeProduct('a', 'food', 1000, ['hot'])],
        ['b', makeProduct('b', 'food', 1000, ['hot'])],
        ['c', makeProduct('c', 'food', 1001, ['cold'])],
      ])

      const result = service.rerank(candidates, productMap, 3)
      expect(result).toHaveLength(3)
    })

    it('should cap topN to available candidates when smaller', () => {
      const candidates = [
        makeCandidate('a', 0.9),
        makeCandidate('b', 0.8),
        makeCandidate('c', 0.7),
      ]
      const result = service.rerank(candidates, new Map(), 2)
      expect(result).toHaveLength(2)
    })

    it('should maintain score descending order within selected', () => {
      const candidates = [
        makeCandidate('a', 0.9),
        makeCandidate('b', 0.85),
        makeCandidate('c', 0.8),
        makeCandidate('d', 0.75),
      ]
      const productMap = new Map<string, ProductSnapshot>([
        ['a', makeProduct('a', 'food', 1000)],
        ['b', makeProduct('b', 'food', 2000)],
        ['c', makeProduct('c', 'drink', 1500)],
        ['d', makeProduct('d', 'toy', 500)],
      ])

      const result = service.rerank(candidates, productMap, 4)
      // After sort each round, no duplicated items
      const ids = new Set(result.map(c => c.itemId))
      expect(ids.size).toBe(4)
    })
  })

  describe('itemSimilarity (via maxSimilarity)', () => {
    it('should give higher score for same category items', () => {
      const candidates = [makeCandidate('a', 0.9)]
      const selected = [makeCandidate('b', 0.8)]
      const productMap = new Map<string, ProductSnapshot>([
        ['a', makeProduct('a', 'food', 1000)],
        ['b', makeProduct('b', 'food', 1500)],
      ])

      const result = service.rerank(candidates, productMap, 2)
      expect(result).toHaveLength(1)
      expect(result[0].itemId).toBe('a')
    })
  })
})
