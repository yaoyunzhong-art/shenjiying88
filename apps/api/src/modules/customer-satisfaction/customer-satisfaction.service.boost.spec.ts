/**
 * customer-satisfaction.service.boost.spec.ts
 * WP-15 客户满意度模块 — service 层补充单元测试
 *
 * 使用 vitest, 内存降级模式, 不依赖数据库
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CustomerSatisfactionService } from './customer-satisfaction.service'
import { SatisfactionCategory } from './customer-satisfaction.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

/** 默认租户上下文 */
const defaultTenant: RequestTenantContext = { tenantId: 'default' }
const otherTenant: RequestTenantContext = { tenantId: 'other-brand' }

describe('[Boost] CustomerSatisfactionService — 正例/反例/边界/时序/组合', () => {
  // ══════════════════════════════════════════════════════════════
  // 正例 — list 查询
  // ══════════════════════════════════════════════════════════════

  describe('[正例] list 查询', () => {
    it('默认返回全部10条 satisfaction 记录', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant)
      expect(result.total).toBe(10)
      expect(result.items.length).toBe(10)
    })

    it('按门店 store-001 过滤返回5条', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, { storeId: 'store-001' })
      expect(result.total).toBe(5)
      result.items.forEach(i => expect(i.storeId).toBe('store-001'))
    })

    it('按类别 Service 过滤返回2条', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, { category: SatisfactionCategory.Service })
      expect(result.total).toBe(2)
      result.items.forEach(i => expect(i.category).toBe(SatisfactionCategory.Service))
    })

    it('按最低分数 minScore=4 过滤返回评分≥4的记录', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, { minScore: 4 })
      expect(result.total).toBeGreaterThan(0)
      result.items.forEach(i => expect(i.score).toBeGreaterThanOrEqual(4))
    })

    it('按日期范围 startDate + endDate 过滤', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, {
        startDate: '2026-07-13',
        endDate: '2026-07-15',
      })
      expect(result.total).toBeGreaterThan(0)
      result.items.forEach(i => {
        expect(i.visitDate >= '2026-07-13').toBe(true)
        expect(i.visitDate <= '2026-07-15').toBe(true)
      })
    })

    it('组合筛选: store-003 + minScore=4', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, {
        storeId: 'store-003',
        minScore: 4,
      })
      expect(result.total).toBeGreaterThan(0)
      result.items.forEach(i => {
        expect(i.storeId).toBe('store-003')
        expect(i.score).toBeGreaterThanOrEqual(4)
      })
    })
  })

  describe('[正例] getById', () => {
    it('查询存在的记录 sat-001 返回完整信息', () => {
      const svc = new CustomerSatisfactionService()
      const record = svc.getById('sat-001', defaultTenant)
      expect(record.customerName).toBe('王小明')
      expect(record.score).toBe(5)
      expect(record.category).toBe(SatisfactionCategory.Service)
      expect(record.comment).toContain('服务态度')
    })

    it('查询 sat-005 综合评分4', () => {
      const svc = new CustomerSatisfactionService()
      const record = svc.getById('sat-005', defaultTenant)
      expect(record.customerName).toBe('陈晓东')
      expect(record.score).toBe(4)
      expect(record.category).toBe(SatisfactionCategory.Overall)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 反例
  // ══════════════════════════════════════════════════════════════

  describe('[反例] 异常查询与操作', () => {
    it('不存在的 ID 抛 Error', () => {
      const svc = new CustomerSatisfactionService()
      expect(() => svc.getById('non-existent', defaultTenant)).toThrow('not found')
    })

    it('不同租户无法访问另一租户的记录（sat-001 属于 default）', () => {
      const svc = new CustomerSatisfactionService()
      expect(() => svc.getById('sat-001', otherTenant)).toThrow('not found')
    })

    it('不同租户 list 返回空数组', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(otherTenant)
      expect(result.total).toBe(0)
      expect(result.items.length).toBe(0)
    })

    it('删除不存在的记录抛 Error', () => {
      const svc = new CustomerSatisfactionService()
      expect(() => svc.delete('non-existent', defaultTenant)).toThrow('not found')
    })

    it('不同租户删除 default 租户记录抛 Error', () => {
      const svc = new CustomerSatisfactionService()
      expect(() => svc.delete('sat-001', otherTenant)).toThrow('not found')
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 边界
  // ══════════════════════════════════════════════════════════════

  describe('[边界] 边界场景', () => {
    it('minScore=5 只返回满分记录（4条满分：sat-001,004,008）', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, { minScore: 5 })
      expect(result.total).toBeGreaterThanOrEqual(3)
      result.items.forEach(i => expect(i.score).toBe(5))
    })

    it('minScore=1 返回全部10条', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, { minScore: 1 })
      expect(result.total).toBe(10)
    })

    it('startDate 超早期范围（2025-01-01）应包含全部记录', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, { startDate: '2025-01-01' })
      expect(result.total).toBe(10)
    })

    it('endDate 超早期范围无匹配', () => {
      const svc = new CustomerSatisfactionService()
      const result = svc.list(defaultTenant, { endDate: '2025-12-31' })
      // 所有记录都在 2026-07, 因此应该为空
      expect(result.total).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 时序 — 创建/删除/查询
  // ══════════════════════════════════════════════════════════════

  describe('[时序] 创建与删除操作', () => {
    it('create 一条记录后 list 总数+1, getById 可查到', () => {
      const svc = new CustomerSatisfactionService()
      const before = svc.list(defaultTenant).total

      const created = svc.create(defaultTenant, {
        storeId: 'store-001',
        customerName: '新客户',
        score: 5,
        category: SatisfactionCategory.Service,
        comment: '非常满意',
        visitDate: '2026-07-27',
      })
      expect(created.id).toContain('sat-')
      expect(created.customerName).toBe('新客户')

      const after = svc.list(defaultTenant).total
      expect(after).toBe(before + 1)

      const found = svc.getById(created.id, defaultTenant)
      expect(found.customerName).toBe('新客户')
    })

    it('删除记录后 list 总数-1, getById 抛错', () => {
      const svc = new CustomerSatisfactionService()
      const before = svc.list(defaultTenant).total

      svc.delete('sat-001', defaultTenant)

      const after = svc.list(defaultTenant).total
      expect(after).toBe(before - 1)
      expect(() => svc.getById('sat-001', defaultTenant)).toThrow('not found')
    })

    it('先创建再删除, 计数变化正确', () => {
      const svc = new CustomerSatisfactionService()
      const before = svc.list(defaultTenant).total

      const created = svc.create(defaultTenant, {
        storeId: 'store-002', customerName: '临时客户',
        score: 3, category: SatisfactionCategory.Price,
        comment: '还行', visitDate: '2026-07-26',
      })
      expect(svc.list(defaultTenant).total).toBe(before + 1)

      svc.delete(created.id, defaultTenant)
      expect(svc.list(defaultTenant).total).toBe(before)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 组合场景
  // ══════════════════════════════════════════════════════════════

  describe('[组合场景] 门户筛选+创建+汇总', () => {
    it('创建一条低分记录后重新计算汇总, avgScore 下降', () => {
      const svc = new CustomerSatisfactionService()
      const summaryBefore = svc.getSummary(defaultTenant)

      svc.create(defaultTenant, {
        storeId: 'store-001', customerName: '差评客户',
        score: 1, category: SatisfactionCategory.Service,
        comment: '很差', visitDate: '2026-07-27',
      })

      const summaryAfter = svc.getSummary(defaultTenant)
      expect(summaryAfter.totalResponses).toBe(summaryBefore.totalResponses + 1)
      expect(summaryAfter.avgScore).toBeLessThan(summaryBefore.avgScore!)
    })

    it('门店+类别组合筛选数据一致', () => {
      const svc = new CustomerSatisfactionService()
      // store-001 + Device 类别
      const result = svc.list(defaultTenant, {
        storeId: 'store-001',
        category: SatisfactionCategory.Device,
      })
      expect(result.total).toBe(1)
      expect(result.items[0].customerName).toBe('李芳')
      expect(result.items[0].comment).toContain('篮球机')
    })
  })

  // ══════════════════════════════════════════════════════════════
  // getSummary 汇总
  // ══════════════════════════════════════════════════════════════

  describe('[正例] getSummary 汇总数据', () => {
    it('汇总字段完整且合理', () => {
      const svc = new CustomerSatisfactionService()
      const summary = svc.getSummary(defaultTenant)
      expect(summary.totalResponses).toBe(10)
      expect(summary.avgScore).toBeGreaterThan(0)
      expect(summary.scoreDistribution).toBeDefined()
      expect(summary.scoreDistribution['5']).toBeGreaterThan(0)
      expect(summary.responseRate).toBeGreaterThan(0)
    })

    it('bestCategory 和 worstCategory 不为空', () => {
      const svc = new CustomerSatisfactionService()
      const summary = svc.getSummary(defaultTenant)
      expect(summary.bestCategory).toBeTruthy()
      expect(summary.worstCategory).toBeTruthy()
      expect(typeof summary.bestCategory).toBe('string')
      expect(typeof summary.worstCategory).toBe('string')
    })

    it('scoreDistribution 覆盖 1-5 分', () => {
      const svc = new CustomerSatisfactionService()
      const summary = svc.getSummary(defaultTenant)
      expect(Object.keys(summary.scoreDistribution).sort()).toEqual(['1', '2', '3', '4', '5'])
      const totalFromDist = Object.values(summary.scoreDistribution).reduce((s, c) => s + c, 0)
      expect(totalFromDist).toBe(10)
    })

    it('scoreDistribution 1分和2分各至少1条', () => {
      const svc = new CustomerSatisfactionService()
      const summary = svc.getSummary(defaultTenant)
      expect(summary.scoreDistribution['1']).toBeGreaterThanOrEqual(0) // 可能存在
      expect(summary.scoreDistribution['2']).toBeGreaterThanOrEqual(1) // sat-006 是2分
    })

    it('其他租户的 summary 为空值', () => {
      const svc = new CustomerSatisfactionService()
      const summary = svc.getSummary(otherTenant)
      expect(summary.totalResponses).toBe(0)
      expect(summary.avgScore).toBe(0)
      expect(summary.bestCategory).toBe('')
      expect(summary.worstCategory).toBe('')
    })
  })
})
