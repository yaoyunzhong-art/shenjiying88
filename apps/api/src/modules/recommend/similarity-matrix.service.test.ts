import { describe, it, expect, beforeEach } from 'vitest'
import { SimilarityMatrixService, type BatchComputeInput } from './similarity-matrix.service'

describe('SimilarityMatrixService', () => {
  let service: SimilarityMatrixService

  beforeEach(() => {
    service = new SimilarityMatrixService()
  })

  describe('computeItemSimilarities', () => {
    it('should compute cosine similarity matrix', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1', 'm2', 'm3']))
      itemMemberMap.set('B', new Set(['m1', 'm2'])) // 2/3 overlap with A
      itemMemberMap.set('C', new Set(['m4', 'm5'])) // no overlap with A

      const input: BatchComputeInput = {
        tenantId: 'T',
        itemMemberMap,
        method: 'cosine',
      }

      service.computeItemSimilarities(input)

      // A-B should have similarity
      const abSim = service.queryItemPair('T', 'A', 'B')
      expect(abSim).not.toBeNull()
      expect(abSim!).toBeGreaterThan(0)

      // A-C should have 0 similarity
      const acSim = service.queryItemPair('T', 'A', 'C')
      expect(acSim).not.toBeNull()
      expect(acSim!).toBe(0)
    })

    it('should compute jaccard similarity matrix', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1', 'm2', 'm3']))
      itemMemberMap.set('B', new Set(['m1', 'm2']))

      const input: BatchComputeInput = {
        tenantId: 'T',
        itemMemberMap,
        method: 'jaccard',
      }

      service.computeItemSimilarities(input)

      const sim = service.queryItemPair('T', 'A', 'B')
      expect(sim).not.toBeNull()
      // jaccard = 2 / 3 = 0.667
      expect(sim!).toBeCloseTo(2 / 3, 2)
    })

    it('should maintain tenant isolation', () => {
      const itemMemberMapT1 = new Map<string, Set<string>>()
      itemMemberMapT1.set('A', new Set(['m1']))

      service.computeItemSimilarities({
        tenantId: 'T1',
        itemMemberMap: itemMemberMapT1,
        method: 'cosine',
      })

      // T2 should have no matrix
      const t2Sim = service.queryItemPair('T2', 'A', 'B')
      expect(t2Sim).toBeNull()
    })
  })

  describe('computeUserSimilarities', () => {
    it('should compute user similarity matrix', () => {
      const memberItemMap = new Map<string, Set<string>>()
      memberItemMap.set('m1', new Set(['A', 'B', 'C']))
      memberItemMap.set('m2', new Set(['A', 'B'])) // 2/3 overlap

      service.computeUserSimilarities({
        tenantId: 'T',
        memberItemMap,
        method: 'cosine',
      })

      const similarUsers = service.getSimilarUsers('T', 'm1', 5)
      expect(similarUsers.length).toBe(1)
      expect(similarUsers[0].userB).toBe('m2')
      expect(similarUsers[0].similarity).toBeGreaterThan(0)
    })

    it('should return empty for unknown user', () => {
      const memberItemMap = new Map<string, Set<string>>()
      memberItemMap.set('m1', new Set(['A']))

      service.computeUserSimilarities({
        tenantId: 'T',
        memberItemMap,
        method: 'cosine',
      })

      const similarUsers = service.getSimilarUsers('T', 'unknown', 5)
      expect(similarUsers).toHaveLength(0)
    })
  })

  describe('getSimilarItems', () => {
    it('should return top N similar items sorted by similarity', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1', 'm2', 'm3']))
      itemMemberMap.set('B', new Set(['m1', 'm2']))     // 2/3 cos sim: 0.816
      itemMemberMap.set('C', new Set(['m1']))            // 1/3 cos sim: 0.577
      itemMemberMap.set('D', new Set(['m4']))            // 0

      service.computeItemSimilarities({
        tenantId: 'T',
        itemMemberMap,
        method: 'cosine',
      })

      const similarItems = service.getSimilarItems('T', 'A', 2)
      expect(similarItems.length).toBe(2)
      // B should be more similar than C
      expect(similarItems[0].itemB).toBe('B')
      expect(similarItems[0].similarity).toBeGreaterThan(similarItems[1].similarity)
    })

    it('should return empty for unknown item', () => {
      const result = service.getSimilarItems('T', 'UNKNOWN', 5)
      expect(result).toHaveLength(0)
    })
  })

  describe('updateItemSimilarity', () => {
    it('should incrementally update item similarity', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1', 'm2']))
      itemMemberMap.set('B', new Set(['m1']))

      service.computeItemSimilarities({
        tenantId: 'T',
        itemMemberMap,
        method: 'cosine',
      })

      // Add new item C with data
      itemMemberMap.set('C', new Set(['m1', 'm3']))
      service.updateItemSimilarity('T', 'C', itemMemberMap)

      const similarItems = service.getSimilarItems('T', 'C', 5)
      expect(similarItems.length).toBeGreaterThan(0)
    })
  })

  describe('updateUserSimilarity', () => {
    it('should incrementally update user similarity', () => {
      const memberItemMap = new Map<string, Set<string>>()
      memberItemMap.set('m1', new Set(['A', 'B']))
      memberItemMap.set('m2', new Set(['A']))

      service.computeUserSimilarities({
        tenantId: 'T',
        memberItemMap,
        method: 'cosine',
      })

      memberItemMap.set('m3', new Set(['A', 'B']))
      service.updateUserSimilarity('T', 'm3', memberItemMap)

      const similarUsers = service.getSimilarUsers('T', 'm3', 5)
      expect(similarUsers.length).toBeGreaterThan(0)
    })
  })

  describe('isStale', () => {
    it('should return true if no matrix exists', () => {
      expect(service.isStale('T', 'item')).toBe(true)
    })

    it('should return false for recently computed matrix', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1']))

      service.computeItemSimilarities({
        tenantId: 'T',
        itemMemberMap,
        method: 'cosine',
      })

      // Use very long staleness to make it not stale
      expect(service.isStale('T', 'item', 86400_000)).toBe(false)
    })
  })

  describe('invalidate', () => {
    it('should clear tenant matrices', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1']))

      service.computeItemSimilarities({
        tenantId: 'T',
        itemMemberMap,
        method: 'cosine',
      })

      service.invalidate('T')
      expect(service.queryItemPair('T', 'A', 'A')).toBeNull()
    })
  })

  describe('stats', () => {
    it('should return entry counts', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1', 'm2']))
      itemMemberMap.set('B', new Set(['m1']))

      service.computeItemSimilarities({
        tenantId: 'T',
        itemMemberMap,
        method: 'cosine',
      })

      const stats = service.stats('T')
      expect(stats.itemMatrixEntries).toBeGreaterThan(0)
      expect(stats.userMatrixEntries).toBe(0)
    })
  })

  describe('queryItemPair', () => {
    it('should handle non-existent pair between existing items', () => {
      const itemMemberMap = new Map<string, Set<string>>()
      itemMemberMap.set('A', new Set(['m1', 'm2']))
      itemMemberMap.set('B', new Set(['m3'])) // no overlap

      service.computeItemSimilarities({
        tenantId: 'T',
        itemMemberMap,
        method: 'cosine',
      })

      const sim = service.queryItemPair('T', 'A', 'B')
      expect(sim).toBe(0)
    })
  })
})
