import { describe, it, expect, beforeEach } from 'vitest'
import { TimeDecayService } from './time-decay.service'
import type { TimeDecayConfig } from './time-decay.service'

describe('TimeDecayService', () => {
  let service: TimeDecayService

  beforeEach(() => {
    service = new TimeDecayService()
  })

  describe('computeWeight', () => {
    it('should return 1.0 for zero elapsed time', () => {
      const result = service.computeWeight(Date.now())
      expect(result).toBeCloseTo(1.0, 2)
    })

    it('should return 1.0 for future timestamp', () => {
      const result = service.computeWeight(Date.now() + 86400000)
      expect(result).toBeCloseTo(1.0, 2)
    })

    it('should decay exponentially with default halfLife 30 days', () => {
      const now = Date.now()
      const thirtyDaysAgo = now - 30 * 86400000
      const weight = service.computeWeight(thirtyDaysAgo, now)
      // 30 days / 30 halfLife => 2^(-1) = 0.5
      expect(weight).toBeCloseTo(0.5, 1)
    })

    it('should return near-zero for very old data beyond maxDays', () => {
      const now = Date.now()
      const twoYearsAgo = now - 730 * 86400000
      const weight = service.computeWeight(twoYearsAgo, now)
      expect(weight).toBe(0)
    })

    it('should support linear decay', () => {
      const config: TimeDecayConfig = {
        mode: 'linear',
        halfLifeDays: 30,
        maxDays: 100,
      }
      const now = Date.now()
      const fiftyDaysAgo = now - 50 * 86400000
      const weight = service.computeWeight(fiftyDaysAgo, now, config)
      // linear: 1 - 50/100 = 0.5
      expect(weight).toBeCloseTo(0.5, 1)
    })

    it('should return higher weight for recent events vs old ones', () => {
      const now = Date.now()
      const recentWeight = service.computeWeight(now - 86400000, now)
      const oldWeight = service.computeWeight(now - 90 * 86400000, now)
      expect(recentWeight).toBeGreaterThan(oldWeight)
    })
  })

  describe('applyDecay', () => {
    it('should apply decay to all items', () => {
      const now = Date.now()
      const items = [
        { itemId: 'A', score: 1.0, timestamp: now - 86400000 },
        { itemId: 'B', score: 1.0, timestamp: now - 30 * 86400000 },
      ]

      const result = service.applyDecay(items, now)

      expect(result).toHaveLength(2)
      const itemA = result.find(r => r.itemId === 'A')!
      const itemB = result.find(r => r.itemId === 'B')!
      // A is more recent => higher weight
      expect(itemA.weight).toBeGreaterThan(itemB.weight)
      expect(itemA.weight).toBeGreaterThan(0.9)
    })

    it('should preserve original scores', () => {
      const now = Date.now()
      const items = [
        { itemId: 'A', score: 0.8, timestamp: now },
        { itemId: 'B', score: 0.5, timestamp: now },
      ]

      const result = service.applyDecay(items, now)

      expect(result[0].score).toBe(0.8)
      expect(result[1].score).toBe(0.5)
    })
  })

  describe('aggregateScores', () => {
    it('should sum weighted scores grouped by itemId', () => {
      const now = Date.now()
      const items = [
        { itemId: 'A', score: 1.0, timestamp: now - 86400000 },
        { itemId: 'A', score: 1.0, timestamp: now - 2 * 86400000 },
        { itemId: 'B', score: 1.0, timestamp: now - 86400000 },
      ]

      const aggregated = service.aggregateScores(items, now)

      expect(aggregated.has('A')).toBe(true)
      expect(aggregated.has('B')).toBe(true)
      expect(aggregated.get('A')!).toBeGreaterThan(aggregated.get('B')!)
    })

    it('should return empty map for empty input', () => {
      const result = service.aggregateScores([])
      expect(result.size).toBe(0)
    })
  })

  describe('parseTimestamp', () => {
    it('should parse ISO date string', () => {
      const ts = service.parseTimestamp('2024-06-01')
      expect(ts).toBeGreaterThan(0)
    })

    it('should parse full ISO datetime', () => {
      const ts = service.parseTimestamp('2024-06-01T12:30:00.000Z')
      expect(ts).toBeGreaterThan(0)
    })
  })
})
