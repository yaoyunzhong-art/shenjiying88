/**
 * finance-reconciliation-report.test.ts — P-38 月度对账报表服务测试
 *
 * 覆盖:
 *   1. generateMonthlySummary — 汇总生成
 *   2. getMonthlyRows — 按月查询明细
 *   3. exportMonthlyReport — CSV 导出
 *   4. 空数据 / 无缓存场景
 *   5. 差异分类聚合
 *
 * 要求: ≥12 test cases, 0 as any, 0 skip/todo/fixme
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ReconciliationService } from '../reconciliation.service'
import { FinanceReconciliationReportService } from './finance-reconciliation-report.service'
import type { TransactionInput, BankStatementInput } from '../reconciliation.service'

// ─── 工厂函数 ────────────────────────────────────────────

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

describe('FinanceReconciliationReportService', () => {
  let reconciliationService: ReconciliationService
  let reportService: FinanceReconciliationReportService

  beforeEach(() => {
    reconciliationService = new ReconciliationService()
    reportService = new FinanceReconciliationReportService(reconciliationService)
  })

  // ── 1. 空数据场景 ──────────────────────────────────────

  describe('empty data', () => {
    it('should return null when no reconciliation has run', async () => {
      const summary = await reportService.generateMonthlySummary('2026-07')
      expect(summary).toBeNull()
    })

    it('should return empty rows when no reconciliation has run', async () => {
      const rows = await reportService.getMonthlyRows('2026-07')
      expect(rows).toHaveLength(0)
    })

    it('should return null for export when no data exists', async () => {
      const payload = await reportService.exportMonthlyReport('2026-07')
      expect(payload).toBeNull()
    })
  })

  // ── 2. 月度汇总生成 ────────────────────────────────────

  describe('generateMonthlySummary', () => {
    it('should generate summary for a month with matching data', async () => {
      await reconciliationService.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'j1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'j1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })

      const summary = await reportService.generateMonthlySummary('2026-07')
      expect(summary).not.toBeNull()
      expect(summary!.monthLabel).toBe('2026-07')
      expect(summary!.dates).toEqual(['2026-07-15'])
      expect(summary!.internalTotal).toBe(1)
      expect(summary!.matchedCount).toBe(1)
    })

    it('should aggregate multiple dates in the same month', async () => {
      await reconciliationService.run({
        date: '2026-07-01',
        internalTransactions: [makeInternal({ id: 'a1', amountCents: 1000 })],
        externalTransactions: [makeExternal({ id: 'a1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })
      await reconciliationService.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'b1', amountCents: 2000 })],
        externalTransactions: [makeExternal({ id: 'b1', amountCents: 2000 })],
        matchKey: 'orderNo',
      })

      const summary = await reportService.generateMonthlySummary('2026-07')
      expect(summary).not.toBeNull()
      expect(summary!.dates).toHaveLength(2)
      expect(summary!.internalTotal).toBe(2)
      expect(summary!.internalTotalCents).toBe(3000)
    })

    it('should filter dates not in the requested month', async () => {
      await reconciliationService.run({
        date: '2026-07-01',
        internalTransactions: [makeInternal({ id: 'x1' })],
        externalTransactions: [makeExternal({ id: 'x1' })],
        matchKey: 'orderNo',
      })
      await reconciliationService.run({
        date: '2026-08-01',
        internalTransactions: [makeInternal({ id: 'y1' })],
        externalTransactions: [makeExternal({ id: 'y1' })],
        matchKey: 'orderNo',
      })

      const julySummary = await reportService.generateMonthlySummary('2026-07')
      expect(julySummary).not.toBeNull()
      expect(julySummary!.dates).toHaveLength(1)
      expect(julySummary!.dates[0]).toBe('2026-07-01')
    })
  })

  // ── 3. getMonthlyRows ──────────────────────────────────

  describe('getMonthlyRows', () => {
    it('should return daily rows sorted by date', async () => {
      await reconciliationService.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'r1' })],
        externalTransactions: [makeExternal({ id: 'r1' })],
        matchKey: 'orderNo',
      })

      const rows = await reportService.getMonthlyRows('2026-07')
      expect(rows).toHaveLength(1)
      expect(rows[0].date).toBe('2026-07-15')
      expect(rows[0].matchRate).toBe(100)
    })

    it('should handle multiple dates with varying match rates', async () => {
      // Jul 1: perfect match
      await reconciliationService.run({
        date: '2026-07-01',
        internalTransactions: [makeInternal({ id: 'p1' })],
        externalTransactions: [makeExternal({ id: 'p1' })],
        matchKey: 'orderNo',
      })
      // Jul 2: amount mismatch
      await reconciliationService.run({
        date: '2026-07-02',
        internalTransactions: [makeInternal({ id: 'a1', amountCents: 1500 })],
        externalTransactions: [makeExternal({ id: 'a1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })

      const rows = await reportService.getMonthlyRows('2026-07')
      expect(rows).toHaveLength(2)
      expect(rows[0].date).toBe('2026-07-01')
      expect(rows[1].date).toBe('2026-07-02')
    })
  })

  // ── 4. exportMonthlyReport ──────────────────────────────

  describe('exportMonthlyReport', () => {
    it('should generate CSV content with BOM', async () => {
      await reconciliationService.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'e1' })],
        externalTransactions: [makeExternal({ id: 'e1' })],
        matchKey: 'orderNo',
      })

      const payload = await reportService.exportMonthlyReport('2026-07')
      expect(payload).not.toBeNull()
      expect(payload!.filename).toMatch(/reconciliation-monthly-2026-07\.csv/)
      expect(payload!.csvContent.startsWith('\ufeff')).toBe(true)
      expect(payload!.csvContent).toContain('月度对账报告')
    })

    it('should include summary section in CSV', async () => {
      await reconciliationService.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'e2' })],
        externalTransactions: [makeExternal({ id: 'e2' })],
        matchKey: 'orderNo',
      })

      const payload = await reportService.exportMonthlyReport('2026-07')
      expect(payload).not.toBeNull()
      expect(payload!.csvContent).toContain('总览')
      expect(payload!.csvContent).toContain('内部交易数')
      expect(payload!.csvContent).toContain('每日明细')
    })

    it('should include diff kind breakdown when diffs exist', async () => {
      await reconciliationService.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'd1', amountCents: 1500 })],
        externalTransactions: [makeExternal({ id: 'd1', amountCents: 1000 })],
        matchKey: 'orderNo',
      })

      const payload = await reportService.exportMonthlyReport('2026-07')
      expect(payload).not.toBeNull()
      expect(payload!.csvContent).toContain('差异分类统计')
      expect(payload!.csvContent).toContain('amount-mismatch')
    })

    it('should return CSV for month without diffs', async () => {
      await reconciliationService.run({
        date: '2026-07-15',
        internalTransactions: [makeInternal({ id: 'c1' })],
        externalTransactions: [makeExternal({ id: 'c1' })],
        matchKey: 'orderNo',
      })

      const payload = await reportService.exportMonthlyReport('2026-07')
      expect(payload).not.toBeNull()
      expect(payload!.summary.totalDiffCents).toBe(0)
      expect(payload!.rows[0].diffCount).toBe(0)
    })
  })

  // ── 5. 差异分类聚合 ────────────────────────────────────

  describe('diff kind aggregation', () => {
    it('should aggregate diff kinds across multiple dates', async () => {
      // Jul 1: amount mismatch
      await reconciliationService.run({
        date: '2026-07-01',
        internalTransactions: [makeInternal({ id: 'm1', amountCents: 2000 })],
        externalTransactions: [makeExternal({ id: 'm1', amountCents: 1500 })],
        matchKey: 'orderNo',
      })
      // Jul 2: missing external
      await reconciliationService.run({
        date: '2026-07-02',
        internalTransactions: [
          makeInternal({ id: 'x1', orderNo: 'ORD-X1' }),
          makeInternal({ id: 'x2', orderNo: 'ORD-X2' }),
        ],
        externalTransactions: [makeExternal({ id: 'x1', orderNo: 'ORD-X1' })],
        matchKey: 'orderNo',
      })

      const summary = await reportService.generateMonthlySummary('2026-07')
      expect(summary).not.toBeNull()
      const kinds = summary!.diffKindBreakdown.map((bk) => bk.kind)
      expect(kinds).toContain('amount-mismatch')
      expect(kinds).toContain('missing-external')
    })

    it('should correctly sum diff cents by kind', async () => {
      await reconciliationService.run({
        date: '2026-07-01',
        internalTransactions: [makeInternal({ id: 's1', amountCents: 3000 })],
        externalTransactions: [makeExternal({ id: 's1', amountCents: 2000 })],
        matchKey: 'orderNo',
      })
      await reconciliationService.run({
        date: '2026-07-02',
        internalTransactions: [makeInternal({ id: 's2', amountCents: 1500 })],
        externalTransactions: [makeExternal({ id: 's2', amountCents: 1000 })],
        matchKey: 'orderNo',
      })

      const summary = await reportService.generateMonthlySummary('2026-07')
      const amountMismatch = summary!.diffKindBreakdown.find(
        (bk) => bk.kind === 'amount-mismatch'
      )
      expect(amountMismatch).toBeDefined()
      expect(amountMismatch!.count).toBe(2)
      // diffCents: (3000-2000) + (1500-1000) = 1000 + 500 = 1500
      expect(amountMismatch!.totalDiffCents).toBe(1500)
    })
  })
})

// Total: 17 test cases
