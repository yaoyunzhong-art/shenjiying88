import { describe, it, expect } from 'vitest'
import { ReportAggregationService } from './report-aggregation.service'

describe('ReportAggregationService', () => {
  const service = new ReportAggregationService()

  describe('aggregate', () => {
    it('should return empty array for no rows', () => {
      const result = service.aggregate([], [], [])
      expect(result).toEqual([])
    })

    it('should compute sum metric for single dimension', () => {
      const rows = [
        { category: 'A', amount: 100 },
        { category: 'A', amount: 200 },
        { category: 'B', amount: 300 },
      ]
      const result = service.aggregate(
        rows,
        [{ field: 'category', alias: 'category' }],
        [{ field: 'amount', alias: 'total', fn: 'sum' }],
      )
      expect(result).toHaveLength(2)
      const catA = result.find((r) => r.category === 'A')
      expect(catA!.total).toBe(300)
    })

    it('should compute avg metric', () => {
      const rows = [
        { cat: 'X', val: 10 },
        { cat: 'X', val: 20 },
        { cat: 'X', val: 30 },
      ]
      const result = service.aggregate(
        rows,
        [{ field: 'cat', alias: 'cat' }],
        [{ field: 'val', alias: 'avg_val', fn: 'avg' }],
      )
      expect(result[0].avg_val).toBe(20)
    })

    it('should compute count metric', () => {
      const rows = [
        { status: 'active', id: 1 },
        { status: 'active', id: 2 },
        { status: 'inactive', id: 3 },
      ]
      const result = service.aggregate(
        rows,
        [{ field: 'status', alias: 'status' }],
        [{ field: 'id', alias: 'count', fn: 'count' }],
      )
      expect(result).toHaveLength(2)
      const active = result.find((r) => r.status === 'active')
      expect(active!.count).toBe(2)
    })

    it('should compute min and max metrics', () => {
      const rows = [
        { g: 'A', v: 5 },
        { g: 'A', v: 15 },
        { g: 'A', v: 10 },
      ]
      const result = service.aggregate(
        rows,
        [{ field: 'g', alias: 'g' }],
        [
          { field: 'v', alias: 'min_v', fn: 'min' },
          { field: 'v', alias: 'max_v', fn: 'max' },
        ],
      )
      expect(result[0].min_v).toBe(5)
      expect(result[0].max_v).toBe(15)
    })

    it('should compute distinct count', () => {
      const rows = [
        { cat: 'A', uid: 1 },
        { cat: 'A', uid: 1 },
        { cat: 'A', uid: 2 },
      ]
      const result = service.aggregate(
        rows,
        [{ field: 'cat', alias: 'cat' }],
        [{ field: 'uid', alias: 'distinct_uids', fn: 'distinct' }],
      )
      expect(result[0].distinct_uids).toBe(2)
    })

    it('should handle multiple dimensions', () => {
      const rows = [
        { dept: 'Sales', region: 'North', amount: 100 },
        { dept: 'Sales', region: 'South', amount: 200 },
        { dept: 'Eng', region: 'North', amount: 300 },
      ]
      const result = service.aggregate(
        rows,
        [
          { field: 'dept', alias: 'dept' },
          { field: 'region', alias: 'region' },
        ],
        [{ field: 'amount', alias: 'total', fn: 'sum' }],
      )
      expect(result).toHaveLength(3)
    })

    it('should handle no dimensions (single total row)', () => {
      const rows = [
        { amount: 10 },
        { amount: 20 },
        { amount: 30 },
      ]
      const result = service.aggregate(
        rows,
        [],
        [{ field: 'amount', alias: 'total', fn: 'sum' }],
      )
      expect(result).toHaveLength(1)
      expect(result[0].total).toBe(60)
    })

    it('should handle empty metrics gracefully', () => {
      const rows = [{ x: 1 }]
      const result = service.aggregate(rows, [{ field: 'x', alias: 'x' }], [])
      expect(result).toHaveLength(1)
    })
  })

  describe('timeBucket', () => {
    it('should bucket by day', () => {
      expect(service.timeBucket('2026-07-15T10:30:00Z', 'day')).toBe('2026-07-15')
    })

    it('should bucket by month', () => {
      expect(service.timeBucket('2026-07-15T10:30:00Z', 'month')).toBe('2026-07')
    })

    it('should bucket by year', () => {
      expect(service.timeBucket('2026-07-15T10:30:00Z', 'year')).toBe('2026')
    })

    it('should bucket by week (ISO format)', () => {
      const result = service.timeBucket('2026-07-15T10:30:00Z', 'week')
      expect(result).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('computeMetric', () => {
    it('should return 0 for empty rows', () => {
      expect(service.computeMetric([], 'val', 'sum')).toBe(0)
    })

    it('should return 0 for non-numeric values', () => {
      const rows = [{ val: 'abc' }, { val: null }]
      expect(service.computeMetric(rows, 'val', 'sum')).toBe(0)
    })
  })
})
