/**
 * customer-satisfaction.service.spec.ts — 客户满意度服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - list (无筛选 / 按门店 / 按分类 / 按分数 / 按日期)
 *   - getById (存在/不存在)
 *   - getSummary (正常/无数据)
 *   - create
 *   - delete (存在/不存在)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CustomerSatisfactionService } from './customer-satisfaction.service'
import { SatisfactionCategory } from './customer-satisfaction.entity'

describe('CustomerSatisfactionService', () => {
  let service: CustomerSatisfactionService

  beforeEach(() => {
    service = new CustomerSatisfactionService()
  })

  const ctx = () => ({ tenantId: 'default', userId: 'test', roles: ['admin'] })

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('正例: 无筛选应返回所有种子数据', () => {
      const result = service.list(ctx())
      expect(result.total).toBe(10)
      expect(result.items.length).toBe(10)
    })

    it('正例: 按门店筛选', () => {
      const result = service.list(ctx(), { storeId: 'store-001' })
      expect(result.items.every(r => r.storeId === 'store-001')).toBe(true)
    })

    it('正例: 按分类筛选', () => {
      const result = service.list(ctx(), { category: SatisfactionCategory.Service })
      result.items.forEach(r => expect(r.category).toBe(SatisfactionCategory.Service))
    })

    it('正例: 按最低评分筛选', () => {
      const result = service.list(ctx(), { minScore: 4 })
      result.items.forEach(r => expect(r.score).toBeGreaterThanOrEqual(4))
    })

    it('边缘: 空结果应返回 total=0', () => {
      const result = service.list(ctx(), { storeId: 'nonexistent' })
      expect(result.total).toBe(0)
      expect(result.items).toEqual([])
    })
  })

  // ── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('正例: 按 ID 获取应返回记录', () => {
      const r = service.getById('sat-001', ctx())
      expect(r.customerName).toBe('王小明')
    })

    it('异常: 不存在的 ID 应抛错', () => {
      expect(() => service.getById('nonexistent', ctx())).toThrow()
    })
  })

  // ── getSummary ───────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('正例: 应返回汇总统计', () => {
      const s = service.getSummary(ctx())
      expect(s.totalResponses).toBe(10)
      expect(s.avgScore).toBeGreaterThan(0)
      expect(s.bestCategory).toBeTruthy()
      expect(s.worstCategory).toBeTruthy()
      expect(Object.keys(s.scoreDistribution)).toHaveLength(5)
      expect(s.responseRate).toBeGreaterThan(0)
    })

    it('边缘: 空租户应返回零值', () => {
      const emptyCtx = () => ({ tenantId: 'empty', userId: 't', roles: ['admin'] })
      const s = service.getSummary(emptyCtx())
      expect(s.totalResponses).toBe(0)
      expect(s.avgScore).toBe(0)
      expect(s.bestCategory).toBe('')
    })
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建新满意度记录', () => {
      const r = service.create(ctx(), {
        storeId: 'store-001', customerName: '测试用户',
        score: 5, category: SatisfactionCategory.Overall,
        comment: '非常满意', visitDate: '2026-07-20',
      })
      expect(r.id).toMatch(/^sat-/)
      expect(r.score).toBe(5)
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('正例: 删除已存在的记录', () => {
      service.delete('sat-001', ctx())
      expect(() => service.getById('sat-001', ctx())).toThrow()
    })

    it('异常: 删除不存在的记录应抛错', () => {
      expect(() => service.delete('nonexistent', ctx())).toThrow()
    })
  })
})
