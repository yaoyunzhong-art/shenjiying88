import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { MemberSpendingAnalysisService } from './member-spending-analysis.service'
import { SpendingPeriod, type SpendingAnalysis } from './member-spending-analysis.entity'
import type { SpendingQueryDto, MemberSpendingDto, SpendingListDto, SpendingSummaryDto } from './member-spending-analysis.dto'

describe('MemberSpendingAnalysisService', () => {
  let service: MemberSpendingAnalysisService

  beforeEach(() => {
    service = new MemberSpendingAnalysisService()
  })

  // ── query / 列表查询 ──

  describe('query()', () => {
    it('should return paginated results with default parameters (page=1, pageSize=20)', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20 }
      const result = await service.query(query)
      assert.ok(result.items.length > 0)
      assert.ok(result.total > 0)
      assert.ok(result.summary.totalAmount > 0)
    })

    it('should respect pageSize to limit returned items', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 2 }
      const result = await service.query(query)
      assert.equal(result.items.length, 2)
      assert.ok(result.total > 2)
    })

    it('should return empty items for page beyond available data', async () => {
      const query: SpendingQueryDto = { page: 999, pageSize: 20 }
      const result = await service.query(query)
      assert.equal(result.items.length, 0)
      assert.ok(result.total > 0)
    })

    it('should respect dimension=daily filtering', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, dimension: 'daily' }
      const result = await service.query(query)
      // dimension=daily maps to m001,m002,m003,m004
      const ids = new Set(result.items.map(m => m.memberId))
      assert.ok(ids.has('m001'))
      assert.ok(ids.has('m002'))
      assert.ok(ids.has('m003'))
      assert.ok(ids.has('m004'))
      assert.equal(ids.has('m005'), false)
    })

    it('should respect dimension=weekly filtering', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, dimension: 'weekly' }
      const result = await service.query(query)
      const ids = new Set(result.items.map(m => m.memberId))
      assert.ok(ids.has('m005'))
      assert.ok(ids.has('m006'))
    })

    it('should respect dimension=monthly filtering', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, dimension: 'monthly' }
      const result = await service.query(query)
      const ids = new Set(result.items.map(m => m.memberId))
      assert.ok(ids.has('m007'))
      assert.ok(ids.has('m008'))
    })

    it('should handle unknown dimension gracefully by returning empty', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, dimension: 'nonexistent' }
      const result = await service.query(query)
      assert.equal(result.items.length, 0)
      assert.ok(result.summary.totalAmount > 0)
    })

    it('should sort by amount descending when sortBy=amount', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, sortBy: 'amount' }
      const result = await service.query(query)
      for (let i = 1; i < result.items.length; i++) {
        assert.ok(result.items[i - 1].totalAmount >= result.items[i].totalAmount)
      }
    })

    it('should sort by count descending when sortBy=count', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, sortBy: 'count' }
      const result = await service.query(query)
      for (let i = 1; i < result.items.length; i++) {
        assert.ok(result.items[i - 1].totalCount >= result.items[i].totalCount)
      }
    })

    it('should sort by frequency ascending when sortBy=frequency', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, sortBy: 'frequency' }
      const result = await service.query(query)
      for (let i = 1; i < result.items.length; i++) {
        assert.ok(result.items[i - 1].spendingFrequency <= result.items[i].spendingFrequency)
      }
    })

    it('should return valid summary with aggregated metrics', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20 }
      const result = await service.query(query)
      assert.ok(result.summary.totalAmount > 0)
      assert.ok(result.summary.totalOrders > 0)
      assert.ok(result.summary.activeMembers > 0)
      assert.ok(result.summary.avgOrderAmount > 0)
      assert.strictEqual(typeof result.summary.yearOverYearChange, 'number')
      assert.strictEqual(typeof result.summary.monthOverMonthChange, 'number')
    })
  })

  // ── getMemberSpending / 单个会员详情 ──

  describe('getMemberSpending()', () => {
    it('should return member details for an existing memberId', async () => {
      const member = await service.getMemberSpending('m001')
      assert.equal(member.memberId, 'm001')
      assert.equal(member.memberName, '张三')
      assert.ok(member.totalAmount > 0)
      assert.ok(member.preferredItems.length > 0)
    })

    it('should throw NotFoundException for a non-existent memberId', async () => {
      await assert.rejects(
        async () => service.getMemberSpending('nonexistent'),
        (err: Error) => err.message.includes('不存在')
      )
    })

    it('should throw NotFoundException for empty memberId', async () => {
      await assert.rejects(
        async () => service.getMemberSpending(''),
        (err: Error) => err.message.includes('不存在')
      )
    })

    it('should return a different member for a different valid memberId', async () => {
      const m1 = await service.getMemberSpending('m001')
      const m4 = await service.getMemberSpending('m004')
      assert.notEqual(m1.memberId, m4.memberId)
      assert.notEqual(m1.totalAmount, m4.totalAmount)
    })
  })

  // ── getSummary / 消费总览 ──

  describe('getSummary()', () => {
    it('should return summary with all required fields populated', () => {
      const summary = service.getSummary()
      assert.ok(summary.totalAmount > 0)
      assert.ok(summary.totalOrders > 0)
      assert.ok(summary.activeMembers > 0)
      assert.ok(summary.avgOrderAmount > 0)
    })

    it('should have correct activeMembers count (unique memberIds)', () => {
      const summary = service.getSummary()
      // Although MOCK_MEMBERS has 12 entries, there are 8 unique members (m001-m008)
      assert.equal(summary.activeMembers, 8)
    })

    it('should have avgOrderAmount matching totalAmount/totalOrders', () => {
      const summary = service.getSummary()
      const expectedAvg = Math.round(summary.totalAmount / summary.totalOrders * 100) / 100
      assert.equal(summary.avgOrderAmount, expectedAvg)
    })
  })

  // ── create / 创建分析记录 ──

  describe('create()', () => {
    it('should create a new spending analysis and return it with createdAt', async () => {
      const input: SpendingAnalysis = {
        memberId: 'm009',
        period: SpendingPeriod.DAILY,
        totalSpent: 5000,
        orderCount: 10,
        categoryBreakdown: { '酒水': 3000, '餐饮': 2000 },
        peakHours: [21, 22],
        favoriteDays: ['星期五'],
        createdAt: ''
      }
      const result = await service.create(input)
      assert.equal(result.memberId, 'm009')
      assert.equal(result.period, SpendingPeriod.DAILY)
      assert.equal(result.totalSpent, 5000)
      assert.ok(result.createdAt)
      assert.ok(new Date(result.createdAt).getTime() > 0)
    })

    it('should allow creation with empty categoryBreakdown', async () => {
      const input: SpendingAnalysis = {
        memberId: 'm010',
        period: SpendingPeriod.WEEKLY,
        totalSpent: 0,
        orderCount: 0,
        categoryBreakdown: {},
        peakHours: [],
        favoriteDays: [],
        createdAt: ''
      }
      const result = await service.create(input)
      assert.deepEqual(result.categoryBreakdown, {})
      assert.deepEqual(result.peakHours, [])
    })

    it('should allow creation with zero totalSpent and zero orderCount boundary', async () => {
      const input: SpendingAnalysis = {
        memberId: 'm011',
        period: SpendingPeriod.MONTHLY,
        totalSpent: 0,
        orderCount: 0,
        categoryBreakdown: {},
        peakHours: [],
        favoriteDays: [],
        createdAt: ''
      }
      const result = await service.create(input)
      assert.equal(result.totalSpent, 0)
      assert.equal(result.orderCount, 0)
    })

    it('should allow creation with very large values', async () => {
      const input: SpendingAnalysis = {
        memberId: 'm012',
        period: SpendingPeriod.DAILY,
        totalSpent: 9999999.99,
        orderCount: 10000,
        categoryBreakdown: { '服务': 9999999.99 },
        peakHours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        favoriteDays: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
        createdAt: ''
      }
      const result = await service.create(input)
      assert.equal(result.totalSpent, 9999999.99)
      assert.equal(result.orderCount, 10000)
    })
  })

  // ── getAnalysis / 获取分析记录 ──

  describe('getAnalysis()', () => {
    it('should return analysis for an existing memberId', async () => {
      const analysis = await service.getAnalysis('m001')
      assert.ok(analysis)
      assert.equal(analysis!.memberId, 'm001')
      assert.equal(analysis!.period, SpendingPeriod.DAILY)
    })

    it('should throw NotFoundException for a non-existent analysis memberId', async () => {
      await assert.rejects(
        async () => service.getAnalysis('nonexistent'),
        (err: Error) => err.message.includes('不存在')
      )
    })

    it('should return null for empty memberId analysis lookup', async () => {
      await assert.rejects(
        async () => service.getAnalysis(''),
        (err: Error) => err.message.includes('不存在')
      )
    })
  })

  // ── Entity / DTO 结构验证 ──

  describe('SpendingPeriod enum', () => {
    it('should have DAILY, WEEKLY, and MONTHLY values', () => {
      assert.equal(SpendingPeriod.DAILY, 'daily')
      assert.equal(SpendingPeriod.WEEKLY, 'weekly')
      assert.equal(SpendingPeriod.MONTHLY, 'monthly')
    })
  })

  describe('MemberSpendingDto shape', () => {
    it('should produce correct shape with all fields from service', async () => {
      const member: MemberSpendingDto = await service.getMemberSpending('m001')
      assert.strictEqual(typeof member.memberId, 'string')
      assert.strictEqual(typeof member.memberName, 'string')
      assert.strictEqual(typeof member.memberLevel, 'string')
      assert.strictEqual(typeof member.totalAmount, 'number')
      assert.strictEqual(typeof member.totalCount, 'number')
      assert.strictEqual(typeof member.avgOrderAmount, 'number')
      assert.strictEqual(typeof member.lastSpendDate, 'string')
      assert.strictEqual(typeof member.spendingFrequency, 'number')
      assert.ok(Array.isArray(member.preferredItems))
      assert.strictEqual(typeof member.spendingTrend, 'number')
    })
  })

  describe('SpendingAnalysis shape', () => {
    it('should produce correct shape from create', async () => {
      const input: SpendingAnalysis = {
        memberId: 'm013',
        period: SpendingPeriod.DAILY,
        totalSpent: 1000,
        orderCount: 5,
        categoryBreakdown: { '酒水': 1000 },
        peakHours: [21],
        favoriteDays: ['星期六'],
        createdAt: ''
      }
      const result = await service.create(input)
      assert.strictEqual(typeof result.memberId, 'string')
      assert.strictEqual(typeof result.period, 'string')
      assert.strictEqual(typeof result.totalSpent, 'number')
      assert.strictEqual(typeof result.orderCount, 'number')
      assert.ok(typeof result.categoryBreakdown === 'object')
      assert.ok(Array.isArray(result.peakHours))
      assert.ok(Array.isArray(result.favoriteDays))
      assert.strictEqual(typeof result.createdAt, 'string')
    })
  })

  // ── SpendingListDto shape ──

  describe('SpendingListDto shape', () => {
    it('should return correct structure from query', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 5 }
      const result: SpendingListDto = await service.query(query)
      assert.ok(Array.isArray(result.items))
      assert.strictEqual(typeof result.total, 'number')
      assert.ok(result.summary !== undefined)
      assert.strictEqual(typeof result.summary.totalAmount, 'number')
    })
  })

  // ── storeId filtering (edge case) ──

  describe('storeId edge cases', () => {
    it('should filter by storeId when provided (members starting with storeId)', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, storeId: 'm00' }
      const result = await service.query(query)
      assert.ok(result.items.length > 0)
      result.items.forEach(m => {
        assert.ok(m.memberId.startsWith('m00'))
      })
    })

    it('should return empty when storeId matches nothing', async () => {
      const query: SpendingQueryDto = { page: 1, pageSize: 20, storeId: 'no-match' }
      const result = await service.query(query)
      assert.equal(result.items.length, 0)
    })
  })
})
