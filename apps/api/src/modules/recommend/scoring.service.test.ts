import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { ScoringService } from './scoring.service'
import type { Candidate, StrategyType, ScoringContext, MemberPreference } from './recommend.entity'

describe('ScoringService', () => {
  let service: ScoringService

  const makeCandidate = (
    itemId: string,
    score: number,
    strategy: StrategyType = 'item-cf',
    reasoning = 'test',
  ): Candidate => ({
    itemId,
    score,
    reasoning,
    strategy,
  })

  beforeEach(() => {
    service = new ScoringService()
  })

  describe('normalize', () => {
    it('should normalize to [0,1] range', () => {
      expect(service.normalize(50, 0, 100)).toBe(0.5)
      expect(service.normalize(0, 0, 100)).toBe(0)
      expect(service.normalize(100, 0, 100)).toBe(1)
    })

    it('should clamp values outside range', () => {
      expect(service.normalize(-10, 0, 100)).toBe(0)
      expect(service.normalize(150, 0, 100)).toBe(1)
    })

    it('should return 1.0 when max equals min', () => {
      expect(service.normalize(50, 50, 50)).toBe(1.0)
      expect(service.normalize(0, 0, 0)).toBe(1.0)
    })
  })

  describe('fuse', () => {
    it('should fuse multiple strategies with weighted sum', () => {
      const candidatesByStrategy: Record<StrategyType, Candidate[]> = {
        'item-cf': [makeCandidate('a', 0.8), makeCandidate('b', 0.6)],
        'popular': [makeCandidate('a', 0.5, 'popular'), makeCandidate('c', 0.7, 'popular')],
        'user-cf': [],
        'recently-viewed': [],
        'personalized': [],
      }

      const result = service.fuse(candidatesByStrategy)

      expect(result.length).toBeGreaterThan(0)
      // item 'a' should have high composite score
      const itemA = result.find(c => c.itemId === 'a')
      expect(itemA).toBeDefined()
      expect(itemA!.score).toBeGreaterThan(0)
      expect(itemA!.reasoning).toContain('test')
    })

    it('should handle empty candidate map', () => {
      const candidatesByStrategy: Record<StrategyType, Candidate[]> = {
        'item-cf': [],
        'popular': [],
        'user-cf': [],
        'recently-viewed': [],
        'personalized': [],
      }

      const result = service.fuse(candidatesByStrategy)
      expect(result).toEqual([])
    })

    it('should sort results by score descending', () => {
      const candidatesByStrategy: Record<StrategyType, Candidate[]> = {
        'item-cf': [makeCandidate('a', 1.0), makeCandidate('b', 0.5)],
        'popular': [makeCandidate('c', 0.9, 'popular')],
        'user-cf': [],
        'recently-viewed': [],
        'personalized': [],
      }

      const result = service.fuse(candidatesByStrategy)

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score)
      }
    })

    it('should break ties by reasoning length', () => {
      const candidatesByStrategy: Record<StrategyType, Candidate[]> = {
        'item-cf': [makeCandidate('a', 0.5, 'item-cf', 'short'), makeCandidate('b', 0.5, 'popular', 'very long reasoning here')],
        'popular': [],
        'user-cf': [],
        'recently-viewed': [],
        'personalized': [],
      }

      const result = service.fuse(candidatesByStrategy)

      // When scores tie, longer reasoning should come first
      expect(result[0].itemId).toBe('b')
    })

    it('should include strategy metadata per candidate', () => {
      const candidatesByStrategy: Record<StrategyType, Candidate[]> = {
        'item-cf': [makeCandidate('a', 0.8)],
        'popular': [makeCandidate('a', 0.5, 'popular')],
        'user-cf': [],
        'recently-viewed': [],
        'personalized': [],
      }

      const result = service.fuse(candidatesByStrategy)
      const itemA = result.find(c => c.itemId === 'a')
      expect(itemA?.metadata).toBeDefined()
      expect(itemA!.metadata!['item-cf']).toBeDefined()
      expect(itemA!.metadata!['popular']).toBeDefined()
    })
  })

  describe('computeWeights', () => {
    const strategies: StrategyType[] = ['item-cf', 'user-cf', 'popular', 'recently-viewed', 'personalized']

    it('should return default weights without context', () => {
      const weights = service.computeWeights(strategies)
      expect(Object.keys(weights)).toEqual(strategies)
      const sum = Object.values(weights).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1, 2)
    })

    it('should boost popular weights for NEW lifecycle stage', () => {
      const context: ScoringContext = {
        baseScore: 0,
        strategyWeights: ScoringService.DEFAULT_WEIGHTS,
        memberPreferences: {
          memberId: 'm1',
          tenantId: 't1',
          favoriteCategories: [],
          favoriteTags: [],
          lifecycleStage: 'NEW',
          totalSpendCents: 0,
          orderCount: 0,
        },
      }

      const weights = service.computeWeights(strategies, context)
      expect(weights['popular']).toBeGreaterThan(0.3)
      expect(weights['item-cf']).toBeLessThan(0.2)
      expect(weights['user-cf']).toBeLessThan(0.1)
    })

    it('should boost personalized for ACTIVE lifecycle stage', () => {
      const context: ScoringContext = {
        baseScore: 0,
        strategyWeights: ScoringService.DEFAULT_WEIGHTS,
        memberPreferences: {
          memberId: 'm1',
          tenantId: 't1',
          favoriteCategories: ['games'],
          favoriteTags: ['action'],
          lifecycleStage: 'ACTIVE',
          totalSpendCents: 50000,
          orderCount: 15,
        },
      }

      const weights = service.computeWeights(strategies, context)
      expect(weights['personalized']).toBeGreaterThanOrEqual(0.35)
      expect(weights['item-cf']).toBeGreaterThanOrEqual(0.25)
    })

    it('should boost popular for DORMANT lifecycle stage', () => {
      const context: ScoringContext = {
        baseScore: 0,
        strategyWeights: ScoringService.DEFAULT_WEIGHTS,
        memberPreferences: {
          memberId: 'm1',
          tenantId: 't1',
          favoriteCategories: [],
          favoriteTags: [],
          lifecycleStage: 'DORMANT',
          totalSpendCents: 20000,
          orderCount: 3,
        },
      }

      const weights = service.computeWeights(strategies, context)
      expect(weights['popular']).toBeGreaterThan(0.35)
    })

    it('should filter to only specified strategies', () => {
      const subset: StrategyType[] = ['popular', 'item-cf']
      const weights = service.computeWeights(subset)
      expect(Object.keys(weights)).toEqual(subset)
    })

    it('should normalize weights to sum to 1', () => {
      const weights = service.computeWeights(strategies)
      const sum = Object.values(weights).reduce((a, b) => a + b, 0)
      expect(Math.abs(sum - 1)).toBeLessThan(0.01)
    })
  })
})
