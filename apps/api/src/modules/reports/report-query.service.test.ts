import { describe, it, expect } from 'vitest'
import { ReportQueryService } from './report-query.service'

describe('ReportQueryService', () => {
  const service = new ReportQueryService()

  describe('parse', () => {
    it('should parse simple AND condition', () => {
      const result = service.parse('order', {
        AND: [
          { field: 'status', op: '=', value: 'PAID' },
          { field: 'createdAt', op: '>=', value: '2026-07-01' },
        ],
      })
      expect(result.op).toBe('AND')
      expect(result.conditions).toHaveLength(2)
    })

    it('should parse OR condition', () => {
      const result = service.parse('payment', {
        OR: [
          { field: 'method', op: '=', value: 'WECHAT' },
          { field: 'method', op: '=', value: 'ALIPAY' },
        ],
      })
      expect(result.op).toBe('OR')
      expect(result.conditions).toHaveLength(2)
    })

    it('should parse nested AND/OR', () => {
      const result = service.parse('order', {
        AND: [
          { field: 'status', op: '=', value: 'COMPLETED' },
          {
            OR: [
              { field: 'source', op: '=', value: 'onsite' },
              { field: 'source', op: '=', value: 'online' },
            ],
          },
        ],
      })
      expect(result.op).toBe('AND')
      expect(result.conditions).toHaveLength(2)
    })

    it('should parse shorthand single field', () => {
      const result = service.parse('inventory', {
        status: { op: '=', value: 'ACTIVE' },
      })
      expect(result.op).toBe('AND')
      expect(result.conditions).toHaveLength(1)
    })

    it('should handle empty DSL gracefully', () => {
      const result = service.parse('order', {})
      expect(result.op).toBe('AND')
      expect(result.conditions).toHaveLength(0)
    })

    it('should handle null DSL', () => {
      const result = service.parse('order', null)
      expect(result.op).toBe('AND')
      expect(result.conditions).toHaveLength(0)
    })

    it('should reject unsupported field', () => {
      expect(() => service.parse('order', {
        AND: [{ field: 'hacker_field', op: '=', value: 'test' }],
      })).toThrow('not allowed')
    })

    it('should reject unsupported op', () => {
      expect(() => service.parse('order', {
        AND: [{ field: 'status', op: 'regex', value: 'test' }],
      })).toThrow('not allowed')
    })

    it('should support in operator', () => {
      const result = service.parse('payment', {
        AND: [{ field: 'method', op: 'in', value: ['WECHAT', 'ALIPAY'] }],
      })
      expect(result.conditions[0].op).toBe('in')
    })

    it('should support between operator', () => {
      const result = service.parse('order', {
        AND: [{ field: 'totalCents', op: 'between', value: [100, 500] }],
      })
      expect(result.conditions[0].op).toBe('between')
    })

    it('should support like operator', () => {
      const result = service.parse('member', {
        AND: [{ field: 'level', op: 'like', value: 'GOLD%' }],
      })
      expect(result.conditions[0].op).toBe('like')
    })

    it('should support notIn operator', () => {
      const result = service.parse('refund', {
        AND: [{ field: 'status', op: 'notIn', value: ['CANCELLED'] }],
      })
      expect(result.conditions[0].op).toBe('notIn')
    })

    it('should allow all whitelisted fields for order', () => {
      const allowed = ['id', 'orderId', 'status', 'totalCents', 'source', 'memberId', 'itemCount', 'createdAt']
      for (const field of allowed) {
        expect(() => service.parse('order', { AND: [{ field, op: '=', value: 'x' }] })).not.toThrow()
      }
    })

    it('should allow all whitelisted fields for member', () => {
      const allowed = ['id', 'level', 'source', 'status', 'lifecycleStage', 'createdAt', 'lastActiveAt']
      for (const field of allowed) {
        expect(() => service.parse('member', { AND: [{ field, op: '=', value: 'x' }] })).not.toThrow()
      }
    })

    it('should parse implicit AND for multiple fields', () => {
      const result = service.parse('inventory', {
        status: { op: '=', value: 'ACTIVE' },
        sku: { op: 'like', value: 'SKU%' },
      })
      expect(result.op).toBe('AND')
      expect(result.conditions).toHaveLength(2)
    })
  })
})
