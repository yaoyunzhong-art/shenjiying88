/**
 * employee-performance-review.service.spec.ts — 员工绩效评估服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - list (无筛选 / 按门店 / 按角色 / 按月份 / 排序)
 *   - getById (存在/不存在)
 *   - getSummary (正常/空数据)
 *   - create
 *   - delete (存在/不存在)
 *   - resetTestState / seedTestData
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EmployeePerformanceReviewService } from './employee-performance-review.service'
import { EmployeeRole } from './employee-performance-review.entity'

describe('EmployeePerformanceReviewService', () => {
  let service: EmployeePerformanceReviewService

  beforeEach(() => {
    EmployeePerformanceReviewService.resetTestState()
    EmployeePerformanceReviewService.seedTestData()
    service = new EmployeePerformanceReviewService()
  })

  const ctx = () => ({ tenantId: 'default', userId: 'test', roles: ['admin'] })

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('正例: 无筛选应返回所有种子数据', () => {
      const result = service.list(ctx())
      expect(result.total).toBe(8)
    })

    it('正例: 按门店筛选', () => {
      const result = service.list(ctx(), { storeId: 'store-001' })
      expect(result.items.every(r => r.storeId === 'store-001')).toBe(true)
    })

    it('正例: 按角色筛选', () => {
      const result = service.list(ctx(), { role: EmployeeRole.Manager })
      result.items.forEach(r => expect(r.role).toBe(EmployeeRole.Manager))
    })

    it('正例: 按月份筛选', () => {
      const result = service.list(ctx(), { month: '2026-07' })
      expect(result.total).toBe(8)
    })

    it('正例: 按 score 排序', () => {
      const result = service.list(ctx(), { sortBy: 'score' })
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].score).toBeGreaterThanOrEqual(result.items[i].score)
      }
    })

    it('正例: 按 revenueContribution 排序', () => {
      const result = service.list(ctx(), { sortBy: 'revenueContribution' })
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].revenueContribution).toBeGreaterThanOrEqual(result.items[i].revenueContribution)
      }
    })

    it('边缘: 无匹配应返回 0', () => {
      const result = service.list(ctx(), { storeId: 'nonexistent' })
      expect(result.total).toBe(0)
    })
  })

  // ── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('正例: 按 ID 获取应返回记录', () => {
      const r = service.getById('perf-001', ctx())
      expect(r.name).toBe('张伟')
    })

    it('异常: 不存在的 ID 应抛错', () => {
      expect(() => service.getById('nonexistent', ctx())).toThrow()
    })
  })

  // ── getSummary ───────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('正例: 应返回汇总统计', () => {
      const s = service.getSummary(ctx())
      expect(s.totalEmployees).toBe(8)
      expect(s.avgScore).toBeGreaterThan(0)
      expect(s.topPerformer).toBeTruthy()
      expect(s.lowestArea).toBeTruthy()
      expect(s.teamAverage).toBeGreaterThan(0)
    })

    it('边缘: 空租户应返回零值', () => {
      const emptyCtx = () => ({ tenantId: 'empty', userId: 't', roles: ['admin'] })
      const s = service.getSummary(emptyCtx())
      expect(s.totalEmployees).toBe(0)
      expect(s.avgScore).toBe(0)
    })
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建新绩效记录', () => {
      const r = service.create(ctx(), {
        employeeId: 'emp-009', name: '绩效新人', role: EmployeeRole.Staff,
        storeId: 'store-001', score: 80, completedTasks: 50,
        customerRating: 4.2, attendanceRate: 96.0, revenueContribution: 120000,
        month: '2026-07',
      })
      expect(r.id).toMatch(/^perf-/)
      expect(r.score).toBe(80)
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('正例: 删除已存在的记录', () => {
      service.delete('perf-001', ctx())
      expect(() => service.getById('perf-001', ctx())).toThrow()
    })

    it('异常: 删除不存在的记录应抛错', () => {
      expect(() => service.delete('nonexistent', ctx())).toThrow()
    })
  })

  // ── reset/seed ───────────────────────────────────────────────────────────

  describe('reset and seed', () => {
    it('正例: resetTestState 后 list 应为空', () => {
      EmployeePerformanceReviewService.resetTestState()
      // 需要重新构造才能反映 reset
      const s2 = new EmployeePerformanceReviewService()
      const result = s2.list(ctx())
      expect(result.total).toBe(0)
    })
  })
})
