import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ReportQueryService } from './report-query.service'

describe('ReportQueryService - DSL 解析 + 白名单', () => {
  const q = new ReportQueryService()

  describe('QUERY-1: 解析空 DSL', () => {
    it('null 返回空 group', () => {
      const r = q.parse('order', null)
      assert.deepEqual(r, { op: 'AND', conditions: [] })
    })

    it('undefined 返回空 group', () => {
      const r = q.parse('order', undefined)
      assert.deepEqual(r, { op: 'AND', conditions: [] })
    })

    it('空对象返回空 group', () => {
      const r = q.parse('order', {})
      assert.deepEqual(r, { op: 'AND', conditions: [] })
    })

    it('非对象返回空 group', () => {
      const r = q.parse('order', 'string' as any)
      assert.deepEqual(r, { op: 'AND', conditions: [] })
    })
  })

  describe('QUERY-2: 顶层 AND/OR 解析', () => {
    it('顶层 AND 数组', () => {
      const r = q.parse('order', {
        AND: [
          { field: 'status', op: '=', value: 'PAID' },
          { field: 'totalCents', op: '>=', value: 1000 }
        ]
      })
      assert.equal(r.op, 'AND')
      assert.equal(r.conditions.length, 2)
    })

    it('顶层 OR 数组', () => {
      const r = q.parse('order', {
        OR: [
          { field: 'source', op: '=', value: 'wechat' },
          { field: 'source', op: '=', value: 'alipay' }
        ]
      })
      assert.equal(r.op, 'OR')
      assert.equal(r.conditions.length, 2)
    })

    it('AND 必须为数组', () => {
      assert.throws(() => q.parse('order', { AND: 'not array' as any }), /AND must be array/)
    })
  })

  describe('QUERY-3: 嵌套 AND/OR', () => {
    it('AND 内嵌套 OR', () => {
      const r = q.parse('order', {
        AND: [
          { field: 'status', op: '=', value: 'PAID' },
          {
            OR: [
              { field: 'source', op: '=', value: 'wechat' },
              { field: 'source', op: '=', value: 'alipay' }
            ]
          }
        ]
      })
      assert.equal(r.op, 'AND')
      assert.equal(r.conditions.length, 2)
      const nested = r.conditions[1] as any
      assert.equal(nested.op, 'OR')
      assert.equal(nested.conditions.length, 2)
    })

    it('3 层嵌套', () => {
      const r = q.parse('order', {
        AND: [
          {
            OR: [
              {
                AND: [
                  { field: 'status', op: '=', value: 'PAID' },
                  { field: 'totalCents', op: '>', value: 100 }
                ]
              },
              { field: 'status', op: '=', value: 'COMPLETED' }
            ]
          }
        ]
      })
      assert.equal(r.op, 'AND')
      const or1 = r.conditions[0] as any
      assert.equal(or1.op, 'OR')
      const and1 = or1.conditions[0] as any
      assert.equal(and1.op, 'AND')
      assert.equal(and1.conditions.length, 2)
    })
  })

  describe('QUERY-4: 字段白名单 (反模式 v4 input-validation)', () => {
    it('order 允许 status', () => {
      const r = q.parse('order', { status: { op: '=', value: 'PAID' } })
      assert.equal(r.conditions.length, 1)
    })

    it('order 拒绝 evil 字段', () => {
      assert.throws(
        () => q.parse('order', { evil: { op: '=', value: 'x' } }),
        /field evil not allowed/
      )
    })

    it('payment 允许 method', () => {
      const r = q.parse('payment', { method: { op: '=', value: 'wechat' } })
      assert.equal(r.conditions.length, 1)
    })

    it('payment 拒绝 order.source (跨表字段)', () => {
      // payment 白名单不含 source
      assert.throws(
        () => q.parse('payment', { source: { op: '=', value: 'wechat' } }),
        /not allowed/
      )
    })

    it('refund 允许 reason', () => {
      const r = q.parse('refund', { reason: { op: '=', value: 'damaged' } })
      assert.equal(r.conditions.length, 1)
    })

    it('member 允许 lifecycleStage', () => {
      const r = q.parse('member', { lifecycleStage: { op: '=', value: 'ACTIVE' } })
      assert.equal(r.conditions.length, 1)
    })

    it('inventory 允许 availableQty', () => {
      const r = q.parse('inventory', { availableQty: { op: '>=', value: 10 } })
      assert.equal(r.conditions.length, 1)
    })

    it('未知 source 抛错', () => {
      assert.throws(
        () => q.parse('unknown' as any, { x: { op: '=', value: 1 } })
      )
    })
  })

  describe('QUERY-5: 操作符白名单 (10 个)', () => {
    it('10 个操作符全部支持', () => {
      const ops = ['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like']
      for (const op of ops) {
        const r = q.parse('order', { status: { op, value: 'PAID' } })
        assert.equal(r.conditions.length, 1, `op ${op} should be allowed`)
        assert.equal((r.conditions[0] as any).op, op)
      }
    })

    it('未知操作符抛错', () => {
      assert.throws(
        () => q.parse('order', { status: { op: 'regex', value: '.*' } }),
        /op regex not allowed/
      )
    })

    it('SQL 注入风格操作符防御', () => {
      assert.throws(
        () => q.parse('order', { status: { op: 'OR 1=1', value: 'x' } }),
        /not allowed/
      )
    })

    it('DROP TABLE 风格防御', () => {
      assert.throws(
        () => q.parse('order', { status: { op: 'DROP TABLE', value: 'x' } }),
        /not allowed/
      )
    })
  })

  describe('QUERY-6: 多字段隐式 AND', () => {
    it('顶层多字段默认 AND', () => {
      const r = q.parse('order', {
        status: { op: '=', value: 'PAID' },
        source: { op: '=', value: 'wechat' }
      })
      assert.equal(r.op, 'AND')
      assert.equal(r.conditions.length, 2)
    })
  })

  describe('QUERY-7: 错误输入', () => {
    it('条件值非对象抛错', () => {
      assert.throws(
        () => q.parse('order', { status: 'PAID' as any }),
        /invalid filter/
      )
    })

    it('AND 数组内非对象抛错', () => {
      assert.throws(
        () => q.parse('order', { AND: [null] }),
        /invalid condition/
      )
    })
  })

  describe('QUERY-8: 多租户隔离 (反模式 v4)', () => {
    it('tenantId 不在白名单 (避免 SQL: tenantId)', () => {
      // 字段白名单不包含 tenantId,强制 service 层注入
      assert.throws(
        () => q.parse('order', { tenantId: { op: '=', value: 'evil' } }),
        /not allowed/
      )
    })
  })
})