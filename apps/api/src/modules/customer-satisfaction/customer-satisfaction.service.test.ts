/**
 * 🧪 CustomerSatisfactionService 单元测试
 * 覆盖: list / getById / getSummary / create / delete
 * 三件套：正例 + 反例 + 边界
 * 注意: 依赖 RequestTenantContext 进行多租户隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CustomerSatisfactionService } from './customer-satisfaction.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { SatisfactionQueryDto, CreateSatisfactionDto } from './customer-satisfaction.dto'
import { SatisfactionCategory } from './customer-satisfaction.entity'

// ════════════════════════════════════════════════════════════
// 辅助函数
// ════════════════════════════════════════════════════════════

const defaultTenant: RequestTenantContext = { tenantId: 'default' }
const tenantB: RequestTenantContext = { tenantId: 'tenant-b' }

function createFreshService(): CustomerSatisfactionService {
  return new CustomerSatisfactionService()
}

describe('CustomerSatisfactionService', () => {
  // ────────────────────────────────────────────────────────────
  // list 查询
  // ────────────────────────────────────────────────────────────

  describe('list', () => {
    it('[正例] 无筛选返回 default 租户全部 10 条评价', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant)
      expect(result.total).toBe(10)
      expect(result.items.length).toBe(10)
    })

    it('[正例] 按 storeId 筛选返回对应门店评价', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant, { storeId: 'store-001' })
      expect(result.total).toBe(4) // store-001 有 4 条
      for (const item of result.items) {
        expect(item.storeId).toBe('store-001')
      }
    })

    it('[正例] 按分类筛选返回对应分类评价', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant, { category: SatisfactionCategory.Service })
      expect(result.total).toBe(2) // Service 类别有 2 条
      for (const item of result.items) {
        expect(item.category).toBe(SatisfactionCategory.Service)
      }
    })

    it('[正例] 按最低评分筛选', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant, { minScore: 4 })
      expect(result.total).toBeGreaterThanOrEqual(5)
      for (const item of result.items) {
        expect(item.score).toBeGreaterThanOrEqual(4)
      }
    })

    it('[正例] 按日期范围筛选', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant, {
        startDate: '2026-07-13',
        endDate: '2026-07-15',
      })
      expect(result.total).toBeGreaterThanOrEqual(4)
      for (const item of result.items) {
        expect(item.visitDate >= '2026-07-13' && item.visitDate <= '2026-07-15').toBe(true)
      }
    })

    it('[正例] 组合多个筛选条件', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant, {
        storeId: 'store-003',
        category: SatisfactionCategory.Device,
      })
      expect(result.total).toBe(1)
      expect(result.items[0].customerName).toBe('孙大力')
    })

    it('[正例] 结果按 visitDate 倒序排列', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant)
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].visitDate >= result.items[i].visitDate).toBe(true)
      }
    })

    it('[反例] 不存在的门店返回空结果', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant, { storeId: 'store-nonexistent' })
      expect(result.total).toBe(0)
      expect(result.items).toEqual([])
    })

    it('[反例] 日期范围没有匹配记录', () => {
      const svc = createFreshService()
      const result = svc.list(defaultTenant, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      })
      expect(result.total).toBe(0)
    })

    it('[边界] 不同的 tenantId 返回空（租户隔离）', () => {
      const svc = createFreshService()
      const result = svc.list(tenantB)
      expect(result.total).toBe(0)
    })
  })

  // ────────────────────────────────────────────────────────────
  // getById
  // ────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('[正例] 获取存在的评价', () => {
      const svc = createFreshService()
      const record = svc.getById('sat-001', defaultTenant)
      expect(record.customerName).toBe('王小明')
      expect(record.score).toBe(5)
    })

    it('[反例] 不存在的 ID 抛出 Error', () => {
      const svc = createFreshService()
      expect(() => svc.getById('sat-999', defaultTenant)).toThrow('not found')
    })

    it('[反例] 跨租户访问抛出 Error', () => {
      const svc = createFreshService()
      expect(() => svc.getById('sat-001', tenantB)).toThrow('not found')
    })
  })

  // ────────────────────────────────────────────────────────────
  // getSummary
  // ────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('[正例] 返回完整汇总数据', () => {
      const svc = createFreshService()
      const summary = svc.getSummary(defaultTenant)
      expect(summary.totalResponses).toBe(10)
      expect(summary.avgScore).toBeGreaterThan(3)
      expect(summary.avgScore).toBeLessThanOrEqual(5)
    })

    it('[正例] 评分数分布包含 1~5', () => {
      const svc = createFreshService()
      const summary = svc.getSummary(defaultTenant)
      const keys = Object.keys(summary.scoreDistribution)
      expect(keys).toContain('1')
      expect(keys).toContain('2')
      expect(keys).toContain('3')
      expect(keys).toContain('4')
      expect(keys).toContain('5')
    })

    it('[正例] bestCategory 和 worstCategory 存在', () => {
      const svc = createFreshService()
      const summary = svc.getSummary(defaultTenant)
      expect(summary.bestCategory).toBeTruthy()
      expect(summary.worstCategory).toBeTruthy()
    })

    it('[反例] 无数据的租户返回零值汇总', () => {
      const svc = createFreshService()
      const summary = svc.getSummary(tenantB)
      expect(summary.totalResponses).toBe(0)
      expect(summary.avgScore).toBe(0)
      expect(summary.bestCategory).toBe('')
      expect(summary.worstCategory).toBe('')
      expect(summary.responseRate).toBe(0)
    })
  })

  // ────────────────────────────────────────────────────────────
  // create
  // ────────────────────────────────────────────────────────────

  describe('create', () => {
    it('[正例] 创建新评价并返回完整记录', () => {
      const svc = createFreshService()
      const input: CreateSatisfactionDto = {
        storeId: 'store-002',
        customerName: '测试用户',
        score: 5,
        category: SatisfactionCategory.Overall,
        comment: '非常满意',
        visitDate: '2026-07-20',
      }
      const created = svc.create(defaultTenant, input)
      expect(created.customerName).toBe('测试用户')
      expect(created.score).toBe(5)
      expect(created.id).toMatch(/^sat-/)
      expect(created.tenantId).toBe('default')
      expect(created.createdAt).toBeTruthy()
    })

    it('[正例] 创建后列表长度 +1', () => {
      const svc = createFreshService()
      const before = svc.list(defaultTenant).total
      const input: CreateSatisfactionDto = {
        storeId: 'store-001',
        customerName: '增量用户',
        score: 4,
        category: SatisfactionCategory.Device,
        comment: '新增',
        visitDate: '2026-07-21',
      }
      svc.create(defaultTenant, input)
      const after = svc.list(defaultTenant).total
      expect(after).toBe(before + 1)
    })

    it('[正例] 创建的记录可以通过 list 查询到', () => {
      const svc = createFreshService()
      svc.create(defaultTenant, {
        storeId: 'store-001',
        customerName: '新建用户',
        score: 3,
        category: SatisfactionCategory.Price,
        comment: '一般',
        visitDate: '2026-07-22',
      })
      const result = svc.list(defaultTenant, { storeId: 'store-001' })
      expect(result.items.some(r => r.customerName === '新建用户')).toBe(true)
    })
  })

  // ────────────────────────────────────────────────────────────
  // delete
  // ────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('[正例] 删除后列表长度 -1', () => {
      const svc = createFreshService()
      const before = svc.list(defaultTenant).total
      svc.delete('sat-001', defaultTenant)
      const after = svc.list(defaultTenant).total
      expect(after).toBe(before - 1)
    })

    it('[正例] 删除后 getById 抛出异常', () => {
      const svc = createFreshService()
      svc.delete('sat-001', defaultTenant)
      expect(() => svc.getById('sat-001', defaultTenant)).toThrow('not found')
    })

    it('[反例] 删除不存在的 ID 抛出 Error', () => {
      const svc = createFreshService()
      expect(() => svc.delete('sat-999', defaultTenant)).toThrow('not found')
    })

    it('[反例] 跨租户删除被拒绝', () => {
      const svc = createFreshService()
      expect(() => svc.delete('sat-001', tenantB)).toThrow('not found')
    })
  })

  // ────────────────────────────────────────────────────────────
  // 复合场景
  // ────────────────────────────────────────────────────────────

  describe('复合场景', () => {
    it('创建评价后汇总统计自动更新', () => {
      const svc = createFreshService()
      const before = svc.getSummary(defaultTenant)
      svc.create(defaultTenant, {
        storeId: 'store-001',
        customerName: '新用户',
        score: 5,
        category: SatisfactionCategory.Overall,
        comment: '完美',
        visitDate: '2026-07-25',
      })
      const after = svc.getSummary(defaultTenant)
      expect(after.totalResponses).toBe(before.totalResponses + 1)
    })

    it('删除评价后汇总统计更新', () => {
      const svc = createFreshService()
      const before = svc.getSummary(defaultTenant)
      svc.delete('sat-001', defaultTenant)
      const after = svc.getSummary(defaultTenant)
      expect(after.totalResponses).toBe(before.totalResponses - 1)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 边界 & 数据隔离
  // ────────────────────────────────────────────────────────────

  describe('隔离验证', () => {
    it('每次新实例创建独立的 seed 数据', () => {
      const svcA = createFreshService()
      const svcB = createFreshService()
      svcA.create(defaultTenant, {
        storeId: 'store-001',
        customerName: 'A创建的',
        score: 5,
        category: SatisfactionCategory.Overall,
        comment: 'ok',
        visitDate: '2026-07-25',
      })
      // svcB 是独立实例（内部 seed 重新执行），但共享静态 satisfactionStore
      // 所以 B 也能看到 A 创建的记录
      const listB = svcB.list(defaultTenant)
      expect(listB.items.some(r => r.customerName === 'A创建的')).toBe(false) // B 使用新实例，静态存储重新 seed
    })
  })
})
