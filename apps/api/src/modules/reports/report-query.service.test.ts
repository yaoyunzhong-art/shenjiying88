/**
 * T15: ReportQueryService 单元测试
 *
 * 覆盖:
 *  - DSL 解析: 顶层 AND/OR / 单条件 / 多字段隐式 AND
 *  - 字段白名单验证 (5 数据源)
 *  - 操作符白名单验证
 *  - 嵌套 AND/OR 组
 *  - 错误输入: 非法字段、非法操作符、非对象输入、空数组
 *  - 空输入边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { ReportQueryService } from './report-query.service'

describe('ReportQueryService', () => {
  let service: ReportQueryService

  beforeEach(() => {
    service = new ReportQueryService()
  })

  // ─── 空输入 ─────────────────────────────────────────────

  describe('空输入 / 默认返回', () => {
    it('空对象 → 返回默认 AND 且 conditions 为空', () => {
      const result = service.parse('order', {})
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 0)
    })

    it('null → 返回默认', () => {
      const result = service.parse('order', null)
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 0)
    })

    it('undefined → 返回默认', () => {
      const result = service.parse('order', undefined)
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 0)
    })

    it('非对象类型 → 返回默认', () => {
      const result = service.parse('order', 'string-value')
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 0)
    })

    it('空 key 对象 → 返回默认', () => {
      const result = service.parse('order', {})
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 0)
    })
  })

  // ─── 顶层 AND ───────────────────────────────────────────

  describe('顶层 AND 条件组', () => {
    it('多个条件 AND', () => {
      const dsl = {
        AND: [
          { field: 'status', op: '=', value: 'COMPLETED' },
          { field: 'totalCents', op: '>=', value: 10000 },
        ]
      }
      const result = service.parse('order', dsl)
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 2)
      const c0 = result.conditions[0] as any
      const c1 = result.conditions[1] as any
      assert.equal(c0.field, 'status')
      assert.equal(c0.op, '=')
      assert.equal(c1.field, 'totalCents')
      assert.equal(c1.op, '>=')
    })

    it('AND 必须是数组 → 抛异常', () => {
      assert.throws(
        () => service.parse('order', { AND: 'not-array' }),
        /AND must be array/
      )
    })
  })

  // ─── 顶层 OR ────────────────────────────────────────────

  describe('顶层 OR 条件组', () => {
    it('OR 条件组', () => {
      const dsl = {
        OR: [
          { field: 'source', op: '=', value: 'wechat' },
          { field: 'source', op: '=', value: 'alipay' },
        ]
      }
      const result = service.parse('order', dsl)
      // OR 可在顶层
      assert.equal(result.op, 'OR')
      assert.equal(result.conditions.length, 2)
    })
  })

  // ─── 单条件 ─────────────────────────────────────────────

  describe('单条件解析', () => {
    it('{ status: { op: "=", value: "PAID" } } → 解析为单条件', () => {
      const result = service.parse('order', {
        status: { op: '=', value: 'PAID' }
      })
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 1)
      assert.equal((result.conditions[0] as any).field, 'status')
      assert.equal((result.conditions[0] as any).op, '=')
      assert.equal((result.conditions[0] as any).value, 'PAID')
    })
  })

  // ─── 多字段隐式 AND ─────────────────────────────────────

  describe('多字段隐式 AND', () => {
    it('两个字段条件自动 AND', () => {
      const result = service.parse('order', {
        status: { op: '=', value: 'COMPLETED' },
        totalCents: { op: '>=', value: 50000 },
      })
      assert.equal(result.op, 'AND')
      assert.equal(result.conditions.length, 2)
    })
  })

  // ─── 嵌套 AND/OR ────────────────────────────────────────

  describe('嵌套条件组', () => {
    it('AND 内嵌 OR', () => {
      const dsl = {
        AND: [
          { field: 'status', op: '=', value: 'COMPLETED' },
          {
            OR: [
              { field: 'source', op: '=', value: 'wechat' },
              { field: 'source', op: '=', value: 'alipay' },
            ]
          }
        ]
      }
      const result = service.parse('order', dsl)
      assert.equal(result.op, 'AND')
      // conditions: [ filter(status=COMPLETED), group(OR[wechat, alipay]) ]
      assert.equal(result.conditions.length, 2)
      assert.equal((result.conditions[0] as any).field, 'status')
      assert.equal((result.conditions[1] as any).op, 'OR')
    })

    it('OR 内嵌 AND', () => {
      const dsl = {
        OR: [
          { field: 'source', op: '=', value: 'wechat' },
          {
            AND: [
              { field: 'source', op: '=', value: 'alipay' },
              { field: 'status', op: '=', value: 'COMPLETED' },
            ]
          }
        ]
      }
      // 不抛出异常即通过
      const result = service.parse('order', dsl)
      assert.ok(result)
    })

    it('深层 3 层嵌套', () => {
      const dsl = {
        AND: [
          { field: 'status', op: '=', value: 'COMPLETED' },
          {
            OR: [
              { field: 'source', op: '=', value: 'wechat' },
              {
                AND: [
                  { field: 'source', op: '=', value: 'alipay' },
                  { field: 'totalCents', op: '>=', value: 100000 },
                ]
              }
            ]
          }
        ]
      }
      const result = service.parse('order', dsl)
      assert.ok(result)
      assert.equal(result.op, 'AND')
    })
  })

  // ─── 字段白名单 ─────────────────────────────────────────

  describe('字段白名单验证', () => {
    it('order 允许字段通过', () => {
      const result = service.parse('order', { status: { op: '=', value: 'COMPLETED' } })
      assert.equal(result.conditions.length, 1)
    })

    it('order 禁止非法字段', () => {
      assert.throws(
        () => service.parse('order' as any, { evilField: { op: '=', value: 'x' } }),
        /not allowed/
      )
    })

    it('payment 允许字段: method', () => {
      const result = service.parse('payment' as any, { method: { op: '=', value: 'WECHAT' } })
      assert.equal(result.conditions.length, 1)
    })

    it('payment 禁止非法字段', () => {
      assert.throws(
        () => service.parse('payment' as any, { hackField: { op: '=', value: 'x' } }),
        /not allowed/
      )
    })

    it('member 允许字段: level, lifecycleStage', () => {
      const result = service.parse('member' as any, {
        level: { op: '=', value: 'GOLD' },
      })
      assert.equal(result.conditions.length, 1)
    })

    it('member 禁止非法字段', () => {
      assert.throws(
        () => service.parse('member' as any, { evil: { op: '=', value: 'x' } }),
        /not allowed/
      )
    })

    it('refund 允许字段: reason', () => {
      const result = service.parse('refund' as any, { reason: { op: '=', value: '质量问题' } })
      assert.equal(result.conditions.length, 1)
    })

    it('inventory 允许字段: sku, category, status', () => {
      const result = service.parse('inventory' as any, {
        category: { op: '=', value: '设备' },
        status: { op: '=', value: 'ACTIVE' },
      })
      assert.equal(result.conditions.length, 2)
    })

    it('inventory 禁止非法字段', () => {
      assert.throws(
        () => service.parse('inventory' as any, { evil: { op: '=', value: 'x' } }),
        /not allowed/
      )
    })
  })

  // ─── 操作符白名单 ───────────────────────────────────────

  describe('操作符白名单验证', () => {
    it('所有合法操作符通过', () => {
      const legalOps = ['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like']
      for (const op of legalOps) {
        const result = service.parse('order', { status: { op, value: 'test' } })
        assert.equal(result.conditions.length, 1)
      }
    })

    it('非法操作符抛异常', () => {
      assert.throws(
        () => service.parse('order' as any, { status: { op: 'DROP_TABLE', value: 'x' } }),
        /not allowed/
      )
    })

    it('SQL 注入类操作符被拒绝', () => {
      assert.throws(
        () => service.parse('order' as any, { status: { op: '; DROP TABLE orders;', value: '' } }),
        /not allowed/
      )
    })
  })

  // ─── 错误输入 ───────────────────────────────────────────

  describe('错误输入', () => {
    it('无效条件项 (非对象) 抛异常', () => {
      assert.throws(
        () => service.parse('order' as any, { AND: ['string-value'] }),
        /invalid condition/
      )
    })

    it('无效条件项 (null) 抛异常', () => {
      assert.throws(
        () => service.parse('order' as any, { AND: [null] }),
        /invalid condition/
      )
    })

    it('条件缺少 op/value', () => {
      // 字段白名单会先验，通过后 validateOp 校验 undefined
      assert.throws(
        () => service.parse('order' as any, { status: { op: undefined, value: 'x' } }),
        /not allowed/
      )
    })
  })

  // ─── 单条件格式错误 ─────────────────────────────────────

  describe('单条件格式错误', () => {
    it('单字段但值非对象 → 抛异常', () => {
      assert.throws(
        () => service.parse('order' as any, { status: 'PAID' }),
        /invalid filter/
      )
    })
  })
})
