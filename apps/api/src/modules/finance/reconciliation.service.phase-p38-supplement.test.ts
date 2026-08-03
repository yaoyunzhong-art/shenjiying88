/**
 * reconciliation.service.phase-p38-supplement.test.ts — P-38 对账 Service 深层补充测试
 *
 * 覆盖:
 *   - crossEntityReconcile 联表查询
 *   - loadPersistedReport / runAndPersist
 *   - migrateToDb
 *   - markDiffResolvedPersistent
 *   - getDailyReport 零数据
 *   - getOverallStats 空数据
 *   - 缓存过期/多重缓存
 *   - 多渠道综合匹配
 *   - 重复匹配标记
 *   - validateInput 拒绝
 *
 * ≥15 个新测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReconciliationService } from './reconciliation.service'
import type { TransactionInput, BankStatementInput, MatchKeyType } from './reconciliation.service'

// ─── 工厂函数 ──────────────────────────────────────────────

function makeInternal(overrides: Partial<TransactionInput> & { id: string }): TransactionInput {
  return {
    orderNo: `ORD-${overrides.id}`,
    channelTxnNo: `TXN-${overrides.id}`,
    amountCents: 1000,
    date: '2026-07-15',
    time: '2026-07-15T10:00:00Z',
    channel: 'wechat',
    status: 'success',
    ...overrides,
  }
}

function makeExternal(overrides: Partial<BankStatementInput> & { id: string }): BankStatementInput {
  return {
    orderNo: `ORD-${overrides.id}`,
    channelTxnNo: `TXN-${overrides.id}`,
    amountCents: 1000,
    date: '2026-07-15',
    time: '2026-07-15T10:00:00Z',
    channel: 'wechat',
    status: 'settled',
    ...overrides,
  }
}

describe('[P38] ReconciliationService — 补充覆盖', () => {
  let service: ReconciliationService

  beforeEach(() => {
    service = new ReconciliationService()
  })

  // ═══════════ crossEntityReconcile ═══════════

  describe('crossEntityReconcile — 联表查询', () => {
    it('无缓存报告时返回空汇总', async () => {
      const result = await service.crossEntityReconcile({
        tenantId: 't-1',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      })
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].totalRevenue).toBe(0)
      expect(result.rows[0].totalExpense).toBe(0)
      expect(result.rows[0].reconciliationMatched).toBe(0)
      expect(result.rows[0].reconciliationDiffs).toBe(0)
    })

    it('有缓存报告时聚合汇总', async () => {
      await service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'ce1', amountCents: 5000 })],
        externalTransactions: [makeExternal({ id: 'ce1', amountCents: 5000 })],
        matchKey: 'orderNo',
      })
      await service.run({
        date: '2026-07-16',
        internalTransactions: [makeInternal({ id: 'ce2', amountCents: 3000 })],
        externalTransactions: [makeExternal({ id: 'ce2', amountCents: 2900 })],
        matchKey: 'orderNo',
      })

      const result = await service.crossEntityReconcile({
        tenantId: 't-1',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      })
      // Revenue = (5000+3000)/100 = 80
      expect(result.rows).toHaveLength(1)
      // aggregatedRevenue = reports rendered as internalTotalCents/100
      expect(result.aggregatedRevenue).toBeGreaterThan(0)
      expect(result.aggregatedMatchedCount).toBe(2)
      expect(result.aggregatedDiffCount).toBe(1)
    })

    it('按 groupBy 参数传递', async () => {
      const result = await service.crossEntityReconcile({
        tenantId: 't-1',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        groupBy: 'week',
      })
      expect(result.rows).toHaveLength(1)
      expect(result.periodStart).toBe('2026-07-01')
    })

    it('跨多天数据汇总', async () => {
      for (let i = 1; i <= 5; i++) {
        await service.run({
          date: `2026-07-1${i}`,
          internalTransactions: [makeInternal({ id: `multi${i}`, amountCents: 1000 })],
          externalTransactions: [makeExternal({ id: `multi${i}`, amountCents: 1000 })],
          matchKey: 'orderNo',
        })
      }
      const result = await service.crossEntityReconcile({
        tenantId: 't-1',
        startDate: '2026-07-10',
        endDate: '2026-07-20',
      })
      expect(result.aggregatedMatchedCount).toBe(5)
      expect(result.aggregatedDiffCount).toBe(0)
    })
  })

  // ═══════════ loadPersistedReport / runAndPersist ═══════════

  describe('loadPersistedReport — 加载对账报告', () => {
    it('无 DB 时返回缓存报告', async () => {
      // run 会缓存报告
      await service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'p1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'p1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })
      const report = await service.loadPersistedReport('2026-07-15')
      expect(report).not.toBeNull()
      expect(report!.date).toBe('2026-07-15')
      expect(report!.matchedCount).toBe(1)
    })

    it('不存在的日期返回 null', async () => {
      const report = await service.loadPersistedReport('2099-01-01')
      expect(report).toBeNull()
    })
  })

  describe('runAndPersist — 运行并持久化', () => {
    it('无 DB 时正常执行并缓存', async () => {
      const report = await service.runAndPersist({
        date: '2026-07-20',
        internalTransactions: [makeInternal({ id: 'rp1', amountCents: 2000 })],
        externalTransactions: [makeExternal({ id: 'rp1', amountCents: 2000 })],
        matchKey: 'orderNo',
      })
      expect(report.date).toBe('2026-07-20')
      expect(report.exactMatchCount).toBe(1)

      // 验证已缓存
      const cached = service.getCachedReport('2026-07-20')
      expect(cached).not.toBeNull()
    })
  })

  // ═══════════ migrateToDb ═══════════

  describe('migrateToDb — 内存→DB 迁移', () => {
    it('无 dbService 时返回零', async () => {
      const result = await service.migrateToDb()
      expect(result.syncedReports).toBe(0)
      expect(result.syncedDiffs).toBe(0)
    })
  })

  // ═══════════ markDiffResolvedPersistent ═══════════

  describe('markDiffResolvedPersistent — 持久化差异解决', () => {
    it('无 DB 时等同于 markDiffResolved', async () => {
      await service.run({
        date: '2026-07-22',
        internalTransactions: [makeInternal({ id: 'mdr1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'mdr1', amountCents: 900 })],
        matchKey: 'orderNo',
      })
      const details = service.getDetails()
      expect(details).toHaveLength(1)

      const result = await service.markDiffResolvedPersistent(details[0].diffKey, {
        resolvedBy: 'admin',
        note: '人工核查允许差异',
      })
      expect(result).toBe(true)
      expect(service.isDiffResolved(details[0].diffKey)).toBe(true)
    })
  })

  // ═══════════ getDailyReport ═══════════

  describe('getDailyReport — 每日报告视图', () => {
    it('未运行对账返回 null', () => {
      const report = service.getDailyReport('2026-07-15')
      expect(report).toBeNull()
    })

    it('运行后返回完整视图', async () => {
      await service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'dr1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'dr1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })
      const report = service.getDailyReport('2026-07-15')
      expect(report).not.toBeNull()
      expect(report!.date).toBe('2026-07-15')
      expect(report!.summary.matchedCount).toBe(1)
      expect(report!.status.lastRunDate).toBe('2026-07-15')
    })
  })

  // ═══════════ getOverallStats ═══════════

  describe('getOverallStats — 综合统计', () => {
    it('空数据返回空趋势', () => {
      const stats = service.getOverallStats()
      expect(stats.totalRuns).toBe(0)
      expect(stats.reportDates).toHaveLength(0)
      expect(stats.matchRateTrend).toHaveLength(0)
      expect(stats.weeklySummary).toHaveLength(0)
      expect(stats.monthlySummary).toHaveLength(0)
    })

    it('多次运行后提供趋势数据', async () => {
      // Run 3 different days
      await service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'st1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'st1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })
      await service.run({
        date: '2026-07-16',
        internalTransactions: [makeInternal({ id: 'st2', amountCents: 2000 })],
        externalTransactions: [makeExternal({ id: 'st2', amountCents: 1900 })],
        matchKey: 'orderNo',
      })
      await service.run({
        date: '2026-07-17',
        internalTransactions: [makeInternal({ id: 'st3', amountCents: 3000 })],
        externalTransactions: [makeExternal({ id: 'st3', amountCents: 3000 })],
        matchKey: 'orderNo',
      })

      const stats = service.getOverallStats()
      expect(stats.totalRuns).toBe(3)
      expect(stats.reportDates).toHaveLength(3)
      expect(stats.matchRateTrend).toHaveLength(3)
      expect(stats.diffKindTrends['amount-mismatch']).toBe(1)
      expect(stats.dailyStatus).toHaveLength(3)
    })
  })

  // ═══════════ 缓存管理 ═══════════

  describe('缓存管理', () => {
    it('getCacheStats 跟踪命中次数', async () => {
      await service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'ca1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'ca1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })

      service.getCachedReport('2026-07-15')
      service.getCachedReport('2026-07-15')
      const stats = service.getCacheStats()
      expect(stats.entryCount).toBe(1)
      expect(stats.totalHits).toBe(2)
    })

    it('clearCache 清除所有缓存', async () => {
      await service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'cc1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'cc1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })
      expect(service.getCachedReport('2026-07-15')).not.toBeNull()
      service.clearCache()
      expect(service.getCachedReport('2026-07-15')).toBeNull()
    })
  })

  // ═══════════ 多渠道综合匹配 ═══════════

  describe('多渠道综合匹配', () => {
    it('同 orderNo 不同渠道可匹配金额', async () => {
      const report = await service.run({
        date: '2026-07-25',
        internalTransactions: [
          { id: 'mc1', orderNo: 'ORD-MC1', channelTxnNo: 'TXN-MC1', amountCents: 1500, date: '2026-07-25', channel: 'wechat' },
          { id: 'mc2', orderNo: 'ORD-MC2', channelTxnNo: 'TXN-MC2', amountCents: 2000, date: '2026-07-25', channel: 'alipay' },
        ],
        externalTransactions: [
          { id: 'emc1', orderNo: 'ORD-MC1', channelTxnNo: 'TXN-EMC1', amountCents: 1500, date: '2026-07-25', channel: 'wechat' },
          { id: 'emc2', orderNo: 'ORD-MC2', channelTxnNo: 'TXN-EMC2', amountCents: 2000, date: '2026-07-25', channel: 'alipay' },
        ],
        matchKey: 'orderNo',
      })
      expect(report.exactMatchCount).toBe(2)
      expect(report.diffs).toHaveLength(0)
    })
  })

  // ═══════════ validateInput 拒绝 ═══════════

  describe('validateInput — 输入校验', () => {
    it('内部交易缺少 id 抛出异常', async () => {
      await expect(service.run({
        date: '2026-07-15',
        internalTransactions: [{ id: '', orderNo: 'ORD', amountCents: 1000, date: '2026-07-15' }],
        externalTransactions: [makeExternal({ id: 'v1' })],
        matchKey: 'orderNo',
      })).rejects.toThrow('内部交易缺少 id')
    })

    it('外部流水缺少 id 抛出异常', async () => {
      await expect(service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'v2' })],
        externalTransactions: [{ id: '', orderNo: 'ORD', amountCents: 1000, date: '2026-07-15' }],
        matchKey: 'orderNo',
      })).rejects.toThrow('外部流水缺少 id')
    })

    it('内部交易金额无效抛出异常', async () => {
      await expect(service.run({
        date: '2026-07-15',
        internalTransactions: [{ id: 'v3', orderNo: 'ORD', amountCents: NaN, date: '2026-07-15' }],
        externalTransactions: [makeExternal({ id: 'v3' })],
        matchKey: 'orderNo',
      })).rejects.toThrow('金额无效')
    })
  })

  // ═══════════ 状态管理 ═══════════

  describe('状态管理', () => {
    it('getStatus 反映运行状态', async () => {
      const statusBefore = service.getStatus()
      expect(statusBefore.inProgress).toBe(false)
      expect(statusBefore.totalRuns).toBe(0)

      await service.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'st1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'st1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })

      const statusAfter = service.getStatus()
      expect(statusAfter.totalRuns).toBe(1)
      expect(statusAfter.lastRunDate).toBe('2026-07-15')
      expect(statusAfter.lastReportSummary).not.toBeNull()
      expect(statusAfter.lastReportSummary!.matchedCount).toBe(1)
    })
  })
})
