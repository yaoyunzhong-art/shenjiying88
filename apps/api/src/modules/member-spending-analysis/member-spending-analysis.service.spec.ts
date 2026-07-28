/**
 * member-spending-analysis.service.spec.ts — 会员消费分析 Service 单元测试 (V23)
 *
 * 覆盖: query / getMemberSpending / getSummary / create / getAnalysis
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemberSpendingAnalysisService } from './member-spending-analysis.service'
import { SpendingPeriod } from './member-spending-analysis.entity'

describe('MemberSpendingAnalysisService', () => {
  let service: MemberSpendingAnalysisService

  beforeEach(() => {
    service = new MemberSpendingAnalysisService()
  })

  // ════════════════════════════════════════════
  // query
  // ════════════════════════════════════════════

  describe('query', () => {
    it('正例: 分页查询', async () => {
      const result = await service.query({ page: 1, pageSize: 5 })
      expect(result.items.length).toBeLessThanOrEqual(5)
      expect(result.total).toBeGreaterThanOrEqual(12)
      expect(result.summary).toBeDefined()
    })

    it('正例: 按维度筛选', async () => {
      const daily = await service.query({ page: 1, pageSize: 20, dimension: 'daily' })
      // 日维度去重后可能有重复memberId
      expect(daily.items.length).toBeLessThanOrEqual(8)
      expect(daily.items.length).toBeGreaterThanOrEqual(3)
    })

    it('正例: 按金额排序', async () => {
      const result = await service.query({ page: 1, pageSize: 20, sortBy: 'amount' })
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].totalAmount).toBeGreaterThanOrEqual(result.items[i].totalAmount)
      }
    })

    it('边界: 超大页码返回空items', async () => {
      const result = await service.query({ page: 999, pageSize: 20 })
      expect(result.items.length).toBe(0)
    })
  })

  // ════════════════════════════════════════════
  // getMemberSpending
  // ════════════════════════════════════════════

  describe('getMemberSpending', () => {
    it('正例: 查询已存在的会员', async () => {
      const result = await service.getMemberSpending('m001')
      expect(result.memberName).toBe('张三')
      expect(result.totalAmount).toBeGreaterThan(0)
    })

    it('反例: 不存在的会员抛异常', async () => {
      await expect(service.getMemberSpending('nonexist'))
        .rejects.toThrow('不存在')
    })
  })

  // ════════════════════════════════════════════
  // getSummary
  // ════════════════════════════════════════════

  describe('getSummary', () => {
    it('正例: 返回消费总览', () => {
      const summary = service.getSummary()
      expect(summary.totalAmount).toBeGreaterThan(0)
      expect(summary.totalOrders).toBeGreaterThan(0)
      expect(summary.activeMembers).toBeGreaterThan(0)
      expect(summary.avgOrderAmount).toBeGreaterThan(0)
      expect(summary.yearOverYearChange).toBeDefined()
      expect(summary.monthOverMonthChange).toBeDefined()
    })
  })

  // ════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建分析记录', async () => {
      const result = await service.create({
        memberId: 'm001',
        period: SpendingPeriod.WEEKLY,
        totalSpent: 5000,
        orderCount: 10,
        categoryBreakdown: { '酒水': 3000, '餐饮': 2000 },
        peakHours: [20, 21, 22],
        favoriteDays: ['星期五', '星期六'],
      })
      expect(result.createdAt).toBeTruthy()
    })
  })

  // ════════════════════════════════════════════
  // getAnalysis
  // ════════════════════════════════════════════

  describe('getAnalysis', () => {
    it('正例: 获取已有分析', async () => {
      const analysis = await service.getAnalysis('m001')
      expect(analysis).not.toBeNull()
      expect(analysis!.memberId).toBe('m001')
    })

    it('反例: 不存在抛异常', async () => {
      await expect(service.getAnalysis('nonexist'))
        .rejects.toThrow('不存在')
    })
  })
})
