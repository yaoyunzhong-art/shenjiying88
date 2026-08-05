/**
 * member-spending-analysis.service.boost.spec.ts
 * WP-15 会员消费分析模块 — service 层补充单元测试
 *
 * 使用 vitest, 内存降级模式, 不依赖数据库
 */

import { describe, it, expect } from 'vitest'
import { MemberSpendingAnalysisService } from './member-spending-analysis.service'
import { SpendingPeriod } from './member-spending-analysis.entity'

describe('[Boost] MemberSpendingAnalysisService — 正例/反例/边界/时序/组合', () => {
  // ══════════════════════════════════════════════════════════════
  // 正例 — query 查询
  // ══════════════════════════════════════════════════════════════

  describe('[正例] query 消费查询', () => {
    it('默认分页 page=1 pageSize=20 返回全部不可去重记录', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20 })
      // MOCK_MEMBERS 包含12条（包括4条daily+4条weekly+4条monthly，部分memberId重复）
      expect(result.total).toBe(12)
      expect(result.items.length).toBe(12)
    })

    it('按 amount 降序排序, 第一条应该是 m007 (285000)', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'amount' })
      expect(result.items[0].memberId).toBe('m007')
      expect(result.items[0].totalAmount).toBe(285000)
    })

    it('按 count 降序排序, 第一条应该是 m007 (420次)', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'count' })
      expect(result.items[0].memberId).toBe('m007')
      expect(result.items[0].totalCount).toBe(420)
    })

    it('按 frequency 升序排序（最小频率在前）', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'frequency' })
      // frequency 升序: 0.9 (m007), 1.2 (m005), 1.8 (m004)...
      expect(result.items[0].spendingFrequency).toBe(0.9)
    })

    it('daily 维度过滤返回4条会员（m001,m002,m003,m004）', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, dimension: 'daily' })
      expect(result.total).toBe(4)
      const ids = result.items.map(i => i.memberId).sort()
      expect(ids).toEqual(['m001', 'm002', 'm003', 'm004'])
    })

    it('monthly 维度过滤返回4条会员（m001,m004,m007,m008）', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, dimension: 'monthly' })
      expect(result.total).toBe(4)
      const ids = result.items.map(i => i.memberId).sort()
      expect(ids).toEqual(['m001', 'm004', 'm007', 'm008'])
    })
  })

  describe('[正例] getMemberSpending', () => {
    it('查询 m004 (DIAMOND_L2) 返回完整信息', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.getMemberSpending('m004')
      expect(result.memberName).toBe('赵六')
      expect(result.memberLevel).toBe('DIAMOND_L2')
      expect(result.totalAmount).toBe(42500)
      expect(result.totalCount).toBe(98)
      expect(result.spendingTrend).toBe(0.21)
    })

    it('查询 m005 (LEGEND_L1) 返回高消费数据', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.getMemberSpending('m005')
      expect(result.memberName).toBe('孙七')
      expect(result.totalAmount).toBe(98600)
      expect(result.spendingFrequency).toBe(1.2)
    })
  })

  describe('[正例] getSummary 消费总览', () => {
    it('汇总包含必填字段且值合理', async () => {
      const svc = new MemberSpendingAnalysisService()
      const summary = svc.getSummary()
      expect(summary.totalAmount).toBeGreaterThan(0)
      expect(summary.totalOrders).toBeGreaterThan(0)
      expect(summary.activeMembers).toBeGreaterThan(0)
      expect(summary.avgOrderAmount).toBeGreaterThan(0)
      expect(summary.yearOverYearChange).toBe(0.15)
      expect(summary.monthOverMonthChange).toBe(0.08)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 反例
  // ══════════════════════════════════════════════════════════════

  describe('[反例] 异常查询', () => {
    it('不存在的会员 getMemberSpending 抛 NotFoundException', async () => {
      const svc = new MemberSpendingAnalysisService()
      await expect(svc.getMemberSpending('non-existent')).rejects.toThrow(`会员 non-existent 不存在`)
    })

    it('不存在的分析记录 getAnalysis 抛 NotFoundException', async () => {
      const svc = new MemberSpendingAnalysisService()
      await expect(svc.getAnalysis('non-existent')).rejects.toThrow('分析记录 non-existent 不存在')
    })

    it('不存在的维度名称返回空列表', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, dimension: 'unknown-dim' as any })
      expect(result.total).toBe(0)
      expect(result.items.length).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 边界
  // ══════════════════════════════════════════════════════════════

  describe('[边界] 分页与空结果', () => {
    it('page=1 pageSize=1 返回单条记录', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 1 })
      expect(result.items.length).toBe(1)
      expect(result.total).toBe(12)
    })

    it('page=100 pageSize=20 超大页码返回空数组', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 100, pageSize: 20 })
      expect(result.items.length).toBe(0)
      expect(result.total).toBe(12)
    })

    it('pageSize=0 边缘场景（返回第一页0条应该不抛错）', async () => {
      const svc = new MemberSpendingAnalysisService()
      // 注意 pageSize=0 会导致 slice(start, start) 返回空，但不抛错
      const result = await svc.query({ page: 1, pageSize: 0 })
      expect(result.items.length).toBe(0)
    })

    it('weekly 维度过滤返回4条（m001,m002,m005,m006）', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, dimension: 'weekly' })
      expect(result.total).toBe(4)
      const ids = result.items.map(i => i.memberId).sort()
      expect(ids).toEqual(['m001', 'm002', 'm005', 'm006'])
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 时序 / 业务流
  // ══════════════════════════════════════════════════════════════

  describe('[时序] 创建分析记录', () => {
    it('create 后分析记录可通过 getAnalysis 查询', async () => {
      const svc = new MemberSpendingAnalysisService()
      const created = await svc.create({
        memberId: 'm-anal-001',
        period: SpendingPeriod.DAILY,
        totalSpent: 3500,
        orderCount: 10,
        categoryBreakdown: { '酒水': 2000, '餐饮': 1500 },
        peakHours: [20, 21, 22],
        favoriteDays: ['星期五', '星期六'],
      })
      expect(created.memberId).toBe('m-anal-001')
      expect(created.createdAt).toBeTruthy()

      const found = await svc.getAnalysis('m-anal-001')
      expect(found).not.toBeNull()
      expect(found!.totalSpent).toBe(3500)
    })

    it('创建多条分析记录, 相互独立', async () => {
      const svc = new MemberSpendingAnalysisService()
      const a1 = await svc.create({
        memberId: 'm-seq-01', period: SpendingPeriod.DAILY,
        totalSpent: 1000, orderCount: 5,
        categoryBreakdown: { '酒水': 1000 }, peakHours: [20], favoriteDays: ['星期一'],
      })
      const a2 = await svc.create({
        memberId: 'm-seq-02', period: SpendingPeriod.WEEKLY,
        totalSpent: 5000, orderCount: 15,
        categoryBreakdown: { '酒水': 3000, '餐饮': 2000 }, peakHours: [21, 22], favoriteDays: ['星期六'],
      })
      expect(a1.memberId).toBe('m-seq-01')
      expect(a2.memberId).toBe('m-seq-02')
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 组合场景
  // ══════════════════════════════════════════════════════════════

  describe('[组合场景] query + getMemberSpending + getSummary 流程', () => {
    it('查询消费, 获取单个详情, 汇总金额一致', async () => {
      const svc = new MemberSpendingAnalysisService()
      // 1. 查询列表
      const list = await svc.query({ page: 1, pageSize: 20 })
      expect(list.total).toBeGreaterThan(0)

      // 2. 获取第一个会员的详情
      const firstMember = list.items[0]
      const detail = await svc.getMemberSpending(firstMember.memberId)
      expect(detail.totalAmount).toBe(firstMember.totalAmount)

      // 3. 汇总
      const summary = svc.getSummary()
      expect(summary.totalAmount).toBeGreaterThan(0)
      // summary 的 avgOrderAmount 应该 > 0
      expect(summary.avgOrderAmount).toBeGreaterThan(0)
    })
  })

  describe('[组合场景] 筛选+排序组合', () => {
    it('daily维度按amount排序, 第一条应该是 m004 (42500)', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, dimension: 'daily', sortBy: 'amount' })
      expect(result.items[0].memberId).toBe('m004')
      expect(result.items[0].totalAmount).toBe(42500)
    })

    it('monthly维度按count排序, 第一条应该是 m007 (420次)', async () => {
      const svc = new MemberSpendingAnalysisService()
      const result = await svc.query({ page: 1, pageSize: 20, dimension: 'monthly', sortBy: 'count' })
      expect(result.items[0].memberId).toBe('m007')
      expect(result.items[0].totalCount).toBe(420)
    })
  })
})
