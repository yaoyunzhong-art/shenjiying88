import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ConflictException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'
/**
 * 🐜 自动: [finance-report.service] P-38 财务报表生成服务测试
 *
 * 覆盖 FinanceReportService:
 *   - 报表创建与状态管理
 *   - 多种报表类型生成 (PROFIT_LOSS / BALANCE_SHEET / CASH_FLOW / REVENUE_ANALYSIS / EXPENSE_ANALYSIS / RECONCILIATION)
 *   - 报表导出 (JSON / CSV)
 *   - 报表删除与重新生成
 *   - 正例 + 反例 + 边界: ≥35 tests
 */

import {
  FinanceReportService,
  resetFinanceReportTestState
} from './finance-report.service'
import { FinanceService, resetFinanceServiceTestState } from './finance.service'
import {
  CreateReportDto,
  ReportQueryDto,
  ExportReportDto,
  ReportType as ReportTypeEnum,
  ExportFormat
} from './dto/create-report.dto'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { FinancialReport, ExportResult } from './types'

// ══════════════════════════════════════════════════════════════════════════════
// 测试常量与工厂
// ══════════════════════════════════════════════════════════════════════════════

const TENANT_A: RequestTenantContext = { tenantId: 'tenant-a', storeId: 'store-a1' }
const TENANT_B: RequestTenantContext = { tenantId: 'tenant-b', storeId: 'store-b1' }

function makeReportInput(overrides: Partial<CreateReportDto> = {}): CreateReportDto {
  return {
    title: '2026年7月利润表',
    reportType: ReportTypeEnum.PROFIT_LOSS,
    periodStart: '2026-07-01T00:00:00.000Z',
    periodEnd: '2026-07-31T23:59:59.999Z',
    ...overrides
  }
}

function makeService(): FinanceReportService {
  resetFinanceReportTestState()
  resetFinanceServiceTestState()
  const financeService = new FinanceService()
  return new FinanceReportService(financeService)
}

function makePrismaBackedService(overrides?: {
  financeService?: FinanceService
  financeReport?: Record<string, unknown>
  financeReportExport?: Record<string, unknown>
}): FinanceReportService {
  resetFinanceReportTestState()
  resetFinanceServiceTestState()
  const financeService = overrides?.financeService ?? new FinanceService()
  const prisma = {
    financeReport: overrides?.financeReport ?? {},
    financeReportExport: overrides?.financeReportExport ?? {},
  }

  return new FinanceReportService(
    financeService,
    undefined,
    prisma as unknown as never,
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 报表 CRUD
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-report] 报表 CRUD', () => {
  // ── 正例: 创建 ──

  it('should create a PROFIT_LOSS report with GENERATING→COMPLETED status', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    expect(report.id).toMatch(/^rpt-/)
    expect(report.tenantId).toBe('tenant-a')
    expect(report.title).toBe('2026年7月利润表')
    expect(report.reportType).toBe('PROFIT_LOSS')
    expect(report.status).toBe('COMPLETED')
    expect(report.createdAt).toBeDefined()
    expect(report.generatedAt).toBeDefined()
  })

  it('should create a BALANCE_SHEET report with proper structure', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.BALANCE_SHEET }))
    expect(report.status).toBe('COMPLETED')
    expect(report.data).toBeDefined()
  })

  it('should create a CASH_FLOW report with proper structure', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.CASH_FLOW }))
    expect(report.status).toBe('COMPLETED')
    expect(report.data).toBeDefined()
  })

  it('should create a REVENUE_ANALYSIS report', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.REVENUE_ANALYSIS }))
    expect(report.status).toBe('COMPLETED')
    expect(report.data).toBeDefined()
    expect(report.summary).toBeDefined()
  })

  it('should create an EXPENSE_ANALYSIS report', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.EXPENSE_ANALYSIS }))
    expect(report.status).toBe('COMPLETED')
    expect(report.data).toBeDefined()
  })

  it('should create a RECONCILIATION report', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.RECONCILIATION }))
    expect(report.status).toBe('COMPLETED')
    expect(report.data).toBeDefined()
  })

  it('should create report with storeId override', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ storeId: 'store-override' }))
    expect(report.storeId).toBe('store-override')
  })

  // ── 正例: 获取 ──

  it('should get a report by ID', () => {
    const svc = makeService()
    const created = svc.createReport(TENANT_A, makeReportInput())
    const fetched = svc.getReport(created.id, TENANT_A)
    expect(fetched.id).toBe(created.id)
    expect(fetched.title).toBe(created.title)
  })

  // ── 正例: 列表 ──

  it('should list reports with pagination', () => {
    const svc = makeService()
    svc.createReport(TENANT_A, makeReportInput({ title: 'R1' }))
    svc.createReport(TENANT_A, makeReportInput({ title: 'R2' }))
    svc.createReport(TENANT_A, makeReportInput({ title: 'R3' }))

    const all = svc.listReports(TENANT_A)
    expect(all).toHaveLength(3)

    const paged = svc.listReports(TENANT_A, { limit: 2, offset: 0 })
    expect(paged).toHaveLength(2)
  })

  it('should filter reports by reportType', () => {
    const svc = makeService()
    svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.PROFIT_LOSS }))
    svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.BALANCE_SHEET }))

    const profitLoss = svc.listReports(TENANT_A, { reportType: ReportTypeEnum.PROFIT_LOSS })
    expect(profitLoss).toHaveLength(1)
    expect(profitLoss[0].reportType).toBe('PROFIT_LOSS')
  })

  // ── 正例: 删除 ──

  it('should delete a report', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    const deleted = svc.deleteReport(report.id, TENANT_A)
    expect(deleted).toBe(true)

    expect(() => svc.getReport(report.id, TENANT_A)).toThrow('not found')
  })

  // ── 正例: 重新生成 ──

  it('should regenerate a report and keep COMPLETED status', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())

    const regenerated = svc.regenerateReport(report.id, TENANT_A)
    expect(regenerated.status).toBe('COMPLETED')
    expect(regenerated.generatedAt).toBeDefined()
  })

  // ── 反例 ──

  it('should throw when getting non-existent report', () => {
    const svc = makeService()
    expect(() => svc.getReport('rpt-non-existent', TENANT_A)).toThrow(NotFoundException)
  })

  it('should enforce tenant isolation on report retrieval', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    expect(() => svc.getReport(report.id, TENANT_B)).toThrow('not found')
  })

  it('should enforce tenant isolation: list only returns own tenant reports', () => {
    const svc = makeService()
    svc.createReport(TENANT_A, makeReportInput())
    svc.createReport(TENANT_B, makeReportInput())

    const tenantAReports = svc.listReports(TENANT_A)
    const tenantBReports = svc.listReports(TENANT_B)
    expect(tenantAReports).toHaveLength(1)
    expect(tenantBReports).toHaveLength(1)
  })

  it('should throw when deleting non-existent report', () => {
    const svc = makeService()
    expect(() => svc.deleteReport('rpt-none', TENANT_A)).toThrow(NotFoundException)
  })

  it('should throw when deleting another tenant report', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    expect(() => svc.deleteReport(report.id, TENANT_B)).toThrow('not found or access denied')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 报表数据验证
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-report] 报表数据验证', () => {
  // ── 利润表 ──

  it('PROFIT_LOSS report should have summary fields', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.PROFIT_LOSS }))
    expect(report.summary).toBeDefined()
    expect(typeof report.summary!.totalRevenue).toBe('number')
    expect(typeof report.summary!.totalExpense).toBe('number')
    expect(typeof report.summary!.netProfit).toBe('number')
    expect(typeof report.summary!.transactionCount).toBe('number')
  })

  it('PROFIT_LOSS report data should have operating sections', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.PROFIT_LOSS }))
    const data = report.data as Record<string, unknown>
    expect(data.title).toBe('利润表')
    expect(Array.isArray(data.sections)).toBe(true)
    expect(typeof data.grossProfit).toBe('number')
    expect(typeof data.netProfit).toBe('number')
  })

  // ── 资产负债表 ──

  it('BALANCE_SHEET report should have assets/liabilities/equity sections', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.BALANCE_SHEET }))
    const data = report.data as Record<string, unknown>
    expect(data.title).toBe('资产负债表')

    const assets = data.assets as Record<string, unknown>
    expect(Array.isArray(assets.current)).toBe(true)
    expect(typeof assets.total).toBe('number')

    const liabilities = data.liabilities as Record<string, unknown>
    expect(Array.isArray(liabilities.current)).toBe(true)
    expect(typeof liabilities.total).toBe('number')

    const equity = data.equity as Record<string, unknown>
    expect(Array.isArray(equity.items)).toBe(true)
    expect(typeof equity.total).toBe('number')
  })

  // ── 现金流量表 ──

  it('CASH_FLOW report should have operating/investing/financing sections', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.CASH_FLOW }))
    const data = report.data as Record<string, unknown>
    expect(data.title).toBe('现金流量表')

    const operating = data.operating as Record<string, unknown>
    expect(Array.isArray(operating.inflows)).toBe(true)
    expect(typeof operating.netCash).toBe('number')
    expect(typeof operating.totalInflow).toBe('number')
    expect(typeof operating.totalOutflow).toBe('number')

    const investing = data.investing as Record<string, unknown>
    expect(typeof investing.netCash).toBe('number')

    const financing = data.financing as Record<string, unknown>
    expect(typeof financing.netCash).toBe('number')

    expect(typeof data.netIncrease).toBe('number')
  })

  // ── 收入分析表 ──

  it('REVENUE_ANALYSIS report should have monthly trend and composition', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.REVENUE_ANALYSIS }))
    const data = report.data as Record<string, unknown>
    expect(data.title).toBe('收入分析报告')

    const summary = data.summary as Record<string, unknown>
    expect(typeof summary.totalRevenue).toBe('number')
    expect(typeof summary.averageTransactionValue).toBe('number')

    expect(Array.isArray(data.monthlyTrend)).toBe(true)
    expect(Array.isArray(data.revenueComposition)).toBe(true)

    const growth = data.revenueGrowth as Record<string, unknown>
    expect(typeof growth.currentPeriod).toBe('number')
    expect(typeof growth.growthRate).toBe('string')
  })

  // ── 费用分析表 ──

  it('EXPENSE_ANALYSIS report should have expense breakdown and cost saving suggestions', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.EXPENSE_ANALYSIS }))
    const data = report.data as Record<string, unknown>
    expect(data.title).toBe('费用分析报告')

    const summary = data.summary as Record<string, unknown>
    expect(typeof summary.totalExpense).toBe('number')
    expect(typeof summary.expenseRatio).toBe('number')

    expect(Array.isArray(data.expenseBreakdown)).toBe(true)
    const costSaving = data.costSaving as Record<string, unknown>
    expect(typeof costSaving.totalSavings).toBe('number')
    expect(Array.isArray(costSaving.suggestions)).toBe(true)
  })

  // ── 对账表 ──

  it('RECONCILIATION report should have channels and status', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput({ reportType: ReportTypeEnum.RECONCILIATION }))
    const data = report.data as Record<string, unknown>
    expect(data.title).toBe('对账报告')

    const summary = data.summary as Record<string, unknown>
    expect(typeof summary.totalRevenue).toBe('number')
    expect(typeof summary.transactionCount).toBe('number')

    expect(Array.isArray(data.channels)).toBe(true)
    expect(data.status).toBe('RECONCILED')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 报表导出
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-report] 报表导出', () => {
  // ── 正例 ──

  it('should export report as JSON', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())

    const exportInput: ExportReportDto = { format: ExportFormat.JSON }
    const result = svc.exportReport(report.id, TENANT_A, exportInput)
    expect(result.id).toMatch(/^exp-/)
    expect(result.reportId).toBe(report.id)
    expect(result.format).toBe('JSON')
    expect(result.content).toBeDefined()
    expect(() => JSON.parse(result.content!)).not.toThrow()
  })

  it('should export report as CSV', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())

    const exportInput: ExportReportDto = { format: ExportFormat.CSV }
    const result = svc.exportReport(report.id, TENANT_A, exportInput)
    expect(result.format).toBe('CSV')
    expect(result.content).toBeDefined()
    expect(result.content).toContain(',') // CSV should have columns
  })

  it('should get export result by ID', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    const exportInput: ExportReportDto = { format: ExportFormat.JSON }
    const result = svc.exportReport(report.id, TENANT_A, exportInput)

    const fetched = svc.getExportResult(result.id, TENANT_A)
    expect(fetched.id).toBe(result.id)
    expect(fetched.content).toBe(result.content)
  })

  it('should enforce tenant isolation on export result retrieval', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    const result = svc.exportReport(report.id, TENANT_A, { format: ExportFormat.JSON })

    expect(() => svc.getExportResult(result.id, TENANT_B)).toThrow('not found')
  })

  it('CSV export result should have expiredAt (24h)', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    const result = svc.exportReport(report.id, TENANT_A, { format: ExportFormat.CSV })
    const expiry = new Date(result.expiresAt)
    const generated = new Date(result.generatedAt)
    const diffHours = (expiry.getTime() - generated.getTime()) / (1000 * 60 * 60)
    expect(diffHours).toBeCloseTo(24, 0)
  })

  it('should reject unsupported export formats instead of returning empty content', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())

    expect(() => svc.exportReport(report.id, TENANT_A, { format: ExportFormat.EXCEL })).toThrow(NotImplementedException)
    expect(() => svc.exportReport(report.id, TENANT_A, { format: ExportFormat.PDF })).toThrow(NotImplementedException)
  })

  it('should make export result unavailable after deleting the report', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    const result = svc.exportReport(report.id, TENANT_A, { format: ExportFormat.JSON })

    expect(svc.deleteReport(report.id, TENANT_A)).toBe(true)
    expect(() => svc.getExportResult(result.id, TENANT_A)).toThrow('not found')
  })

  // ── 反例 ──

  it('should throw when exporting non-completed report', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    ;(report as FinancialReport).status = 'GENERATING'

    expect(() => svc.exportReport(report.id, TENANT_A, { format: ExportFormat.JSON })).toThrow(ConflictException)
  })

  it('should throw when getting non-existent export result', () => {
    const svc = makeService()
    expect(() => svc.getExportResult('exp-none', TENANT_A)).toThrow(NotFoundException)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 边界条件
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-report] 边界条件', () => {
  it('should handle empty report list for tenant with no reports', () => {
    const svc = makeService()
    const reports = svc.listReports(TENANT_A)
    expect(reports).toHaveLength(0)
  })

  it('should handle invalid offset gracefully (no throw)', () => {
    const svc = makeService()
    svc.createReport(TENANT_A, makeReportInput())
    const reports = svc.listReports(TENANT_A, { offset: 999, limit: 10 })
    expect(reports).toHaveLength(0)
  })

  it('should handle period filtering in list', () => {
    const svc = makeService()
    svc.createReport(TENANT_A, makeReportInput({ title: 'July', periodStart: '2026-07-01T00:00:00.000Z', periodEnd: '2026-07-31T23:59:59.999Z' }))

    const filtered = svc.listReports(TENANT_A, { periodStart: '2026-06-01T00:00:00.000Z', periodEnd: '2026-08-31T23:59:59.999Z' })
    expect(filtered).toHaveLength(1)
  })

  it('should handle storeId filter in list', () => {
    const svc = makeService()
    svc.createReport(TENANT_A, makeReportInput({ storeId: 'store-filter' }))

    const filtered = svc.listReports(TENANT_A, { storeId: 'store-filter' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].storeId).toBe('store-filter')
  })

  it('should create report with only default export format (JSON)', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    expect(report.exportFormats).toContain('JSON')
  })

  it('regenerate should reset errorMessage after successful regeneration', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    const regenerated = svc.regenerateReport(report.id, TENANT_A)
    expect(regenerated.errorMessage).toBeUndefined()
    expect(regenerated.status).toBe('COMPLETED')
  })

  it('should handle regenerate on a report that was already completed', () => {
    const svc = makeService()
    const report = svc.createReport(TENANT_A, makeReportInput())
    const r1 = svc.regenerateReport(report.id, TENANT_A)
    const r2 = svc.regenerateReport(report.id, TENANT_A)
    expect(r2.status).toBe('COMPLETED')
    expect(r2.generatedAt).toBeDefined()
  })
})

describe('[finance-report] resolved 主链', () => {
  it('createReportResolved 应优先走 getRevenueSummaryResolved', async () => {
    const getRevenueSummaryResolved = vi.fn().mockResolvedValue({
      storeId: 'store-resolved',
      totalRevenue: 9200,
      totalExpense: 1200,
      totalRefund: 300,
      netRevenue: 7700,
      transactionCount: 5,
      periodStart: '2026-07-01T00:00:00.000Z',
      periodEnd: '2026-07-31T23:59:59.999Z',
    })

    const financeService = {
      getRevenueSummary: vi.fn(() => {
        throw new Error('should not use sync getRevenueSummary')
      }),
      listAccounts: vi.fn(() => []),
      getRevenueSummaryResolved,
    } as unknown as FinanceService

    const svc = new FinanceReportService(financeService)

    const report = await svc.createReportResolved(
      TENANT_A,
      makeReportInput({
        reportType: ReportTypeEnum.PROFIT_LOSS,
        storeId: 'store-resolved',
      }),
    )

    expect(report.status).toBe('COMPLETED')
    expect(report.summary).toEqual({
      totalRevenue: 9200,
      totalExpense: 1200,
      totalRefund: 300,
      netProfit: 7700,
      transactionCount: 5,
    })
    expect(getRevenueSummaryResolved).toHaveBeenCalledWith(TENANT_A, {
      storeId: 'store-resolved',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.999Z',
    })
  })

  it('createReportResolved 生成资产负债表时应优先走 listAccountsResolved', async () => {
    const listAccountsResolved = vi.fn().mockResolvedValue([
      {
        id: 'acct-1',
        tenantId: TENANT_A.tenantId,
        storeId: 'store-assets',
        name: '现金账户',
        type: 'CASH',
        balance: 4000,
        status: 'ACTIVE',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'acct-2',
        tenantId: TENANT_A.tenantId,
        storeId: 'store-assets',
        name: '微信账户',
        type: 'WECHAT',
        balance: 6000,
        status: 'ACTIVE',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
    ])

    const financeService = {
      getRevenueSummary: vi.fn(() => {
        throw new Error('should not use sync getRevenueSummary')
      }),
      listAccounts: vi.fn(() => {
        throw new Error('should not use sync listAccounts')
      }),
      getRevenueSummaryResolved: vi.fn().mockResolvedValue({
        storeId: 'store-assets',
        totalRevenue: 2500,
        totalExpense: 400,
        totalRefund: 100,
        netRevenue: 2000,
        transactionCount: 3,
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
      }),
      listAccountsResolved,
    } as unknown as FinanceService

    const svc = new FinanceReportService(financeService)

    const report = await svc.createReportResolved(
      TENANT_A,
      makeReportInput({
        reportType: ReportTypeEnum.BALANCE_SHEET,
        storeId: 'store-assets',
      }),
    )

    const data = report.data as Record<string, unknown>
    const assets = data.assets as Record<string, unknown>
    const accountDetails = data.accountDetails as Array<Record<string, unknown>>

    expect(report.status).toBe('COMPLETED')
    expect(accountDetails).toHaveLength(2)
    expect(assets.total).toBe(12500)
    expect(listAccountsResolved).toHaveBeenCalledWith(TENANT_A, 'store-assets')
  })

  it('regenerateReportResolved 应复用 resolved 主链重新生成', async () => {
    const getRevenueSummaryResolved = vi
      .fn()
      .mockResolvedValueOnce({
        storeId: 'store-retry',
        totalRevenue: 1000,
        totalExpense: 100,
        totalRefund: 50,
        netRevenue: 850,
        transactionCount: 2,
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
      })
      .mockResolvedValueOnce({
        storeId: 'store-retry',
        totalRevenue: 1800,
        totalExpense: 300,
        totalRefund: 100,
        netRevenue: 1400,
        transactionCount: 4,
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
      })

    const financeService = {
      getRevenueSummary: vi.fn(() => {
        throw new Error('should not use sync getRevenueSummary')
      }),
      listAccounts: vi.fn(() => []),
      getRevenueSummaryResolved,
    } as unknown as FinanceService

    const svc = new FinanceReportService(financeService)

    const created = await svc.createReportResolved(
      TENANT_A,
      makeReportInput({
        reportType: ReportTypeEnum.PROFIT_LOSS,
        storeId: 'store-retry',
      }),
    )
    const regenerated = await svc.regenerateReportResolved(created.id, TENANT_A)

    expect(created.summary?.netProfit).toBe(1400)
    expect(regenerated.summary?.netProfit).toBe(1400)
    expect(regenerated.status).toBe('COMPLETED')
    expect(getRevenueSummaryResolved).toHaveBeenCalledTimes(2)
  })

  it('listReportsResolved 在无 Prisma 时回退到当前内存报表', async () => {
    const svc = makeService()
    const resolvedSvc = svc as FinanceReportService & {
      listReportsResolved: (
        tenantContext: RequestTenantContext,
        query?: Record<string, unknown>
      ) => Promise<FinancialReport[]>
    }
    svc.createReport(TENANT_A, makeReportInput({ title: 'tenant-a-report' }))
    svc.createReport(TENANT_B, makeReportInput({ title: 'tenant-b-report' }))

    const reports = await resolvedSvc.listReportsResolved(TENANT_A, {})

    expect(reports).toHaveLength(1)
    expect(reports[0].tenantId).toBe(TENANT_A.tenantId)
    expect(reports[0].title).toBe('tenant-a-report')
  })

  it('getReportResolved 在无 Prisma 时沿用当前租户隔离口径', async () => {
    const svc = makeService()
    const resolvedSvc = svc as FinanceReportService & {
      getReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<FinancialReport>
    }
    const created = svc.createReport(TENANT_A, makeReportInput({ title: 'resolved-report' }))

    const report = await resolvedSvc.getReportResolved(created.id, TENANT_A)

    expect(report.id).toBe(created.id)
    expect(report.title).toBe('resolved-report')
  })

  it('exportReportResolved / getExportResultResolved 在无 Prisma 时沿用当前导出链', async () => {
    const svc = makeService()
    const resolvedSvc = svc as FinanceReportService & {
      exportReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext,
        input: ExportReportDto
      ) => Promise<ExportResult>
      getExportResultResolved: (
        exportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ExportResult>
    }
    const created = svc.createReport(TENANT_A, makeReportInput())

    const exported = await resolvedSvc.exportReportResolved(created.id, TENANT_A, { format: ExportFormat.JSON })
    const fetched = await resolvedSvc.getExportResultResolved(exported.id, TENANT_A)

    expect(exported.reportId).toBe(created.id)
    expect(fetched.id).toBe(exported.id)
    expect(fetched.content).toBe(exported.content)
  })

  it('getExportResultResolved 在无 Prisma 时也应保持租户隔离', async () => {
    const svc = makeService()
    const resolvedSvc = svc as FinanceReportService & {
      exportReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext,
        input: ExportReportDto
      ) => Promise<ExportResult>
      getExportResultResolved: (
        exportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ExportResult>
    }
    const created = svc.createReport(TENANT_A, makeReportInput())
    const exported = await resolvedSvc.exportReportResolved(created.id, TENANT_A, { format: ExportFormat.JSON })

    await expect(resolvedSvc.getExportResultResolved(exported.id, TENANT_B)).rejects.toThrow('not found')
  })

  it('exportReportResolved 在有 Prisma delegate 时也应拒绝未实现格式', async () => {
    const create = vi.fn()
    const svc = makePrismaBackedService({
      financeReportExport: { create },
    })
    const resolvedSvc = svc as FinanceReportService & {
      exportReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext,
        input: ExportReportDto
      ) => Promise<ExportResult>
    }
    const created = svc.createReport(TENANT_A, makeReportInput())

    await expect(
      resolvedSvc.exportReportResolved(created.id, TENANT_A, { format: ExportFormat.EXCEL })
    ).rejects.toThrow(NotImplementedException)
    expect(create).not.toHaveBeenCalled()
  })

  it('deleteReportResolved 在无 Prisma 时沿用当前删除链', async () => {
    const svc = makeService()
    const resolvedSvc = svc as FinanceReportService & {
      deleteReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<boolean>
      getReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<FinancialReport>
    }
    const created = svc.createReport(TENANT_A, makeReportInput())

    const deleted = await resolvedSvc.deleteReportResolved(created.id, TENANT_A)

    expect(deleted).toBe(true)
    await expect(resolvedSvc.getReportResolved(created.id, TENANT_A)).rejects.toThrow('not found')
  })

  it('createReportResolved 应把报表写入 Prisma report model', async () => {
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...data,
      storeId: data.storeId,
      data: data.data ?? null,
      summary: data.summary ?? null,
      generatedAt: data.generatedAt ?? null,
      generatedBy: data.generatedBy ?? null,
      errorMessage: data.errorMessage ?? null,
    }))
    const update = vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => ({
      id: where.id,
      tenantId: TENANT_A.tenantId,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      title: 'persisted-report',
      reportType: 'PROFIT_LOSS',
      periodStart: new Date('2026-07-01T00:00:00.000Z'),
      periodEnd: new Date('2026-07-31T23:59:59.999Z'),
      storeId: 'store-a1',
      ...data,
    }))

    const svc = makePrismaBackedService({
      financeReport: { create, update },
    })

    const report = await svc.createReportResolved(
      TENANT_A,
      makeReportInput({ title: 'persisted-report' }),
    )

    expect(create).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalled()
    expect(report.status).toBe('COMPLETED')
    expect(report.title).toBe('persisted-report')
  })

  it('list/get/export/delete resolved 应优先走 Prisma delegate', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'rpt-prisma-1',
        tenantId: TENANT_A.tenantId,
        storeId: 'store-a1',
        title: 'prisma-list-report',
        reportType: 'PROFIT_LOSS',
        periodStart: new Date('2026-07-01T00:00:00.000Z'),
        periodEnd: new Date('2026-07-31T23:59:59.999Z'),
        status: 'COMPLETED',
        data: { title: '利润表' },
        summary: {
          totalRevenue: 100,
          totalExpense: 20,
          totalRefund: 5,
          netProfit: 75,
          transactionCount: 1,
        },
        generatedAt: new Date('2026-07-31T23:00:00.000Z'),
        generatedBy: null,
        exportFormats: ['JSON'],
        errorMessage: null,
        createdAt: new Date('2026-07-31T23:00:00.000Z'),
      },
    ])
    const findUnique = vi
      .fn()
      .mockResolvedValue({
        id: 'rpt-prisma-1',
        tenantId: TENANT_A.tenantId,
        storeId: 'store-a1',
        title: 'prisma-list-report',
        reportType: 'PROFIT_LOSS',
        periodStart: new Date('2026-07-01T00:00:00.000Z'),
        periodEnd: new Date('2026-07-31T23:59:59.999Z'),
        status: 'COMPLETED',
        data: { title: '利润表', value: 100 },
        summary: {
          totalRevenue: 100,
          totalExpense: 20,
          totalRefund: 5,
          netProfit: 75,
          transactionCount: 1,
        },
        generatedAt: new Date('2026-07-31T23:00:00.000Z'),
        generatedBy: null,
        exportFormats: ['JSON'],
        errorMessage: null,
        createdAt: new Date('2026-07-31T23:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'rpt-prisma-1',
        tenantId: TENANT_A.tenantId,
        storeId: 'store-a1',
        title: 'prisma-list-report',
        reportType: 'PROFIT_LOSS',
        periodStart: new Date('2026-07-01T00:00:00.000Z'),
        periodEnd: new Date('2026-07-31T23:59:59.999Z'),
        status: 'COMPLETED',
        data: { title: '利润表', value: 100 },
        summary: {
          totalRevenue: 100,
          totalExpense: 20,
          totalRefund: 5,
          netProfit: 75,
          transactionCount: 1,
        },
        generatedAt: new Date('2026-07-31T23:00:00.000Z'),
        generatedBy: null,
        exportFormats: ['JSON'],
        errorMessage: null,
        createdAt: new Date('2026-07-31T23:00:00.000Z'),
      })
    const findUniqueExport = vi.fn().mockResolvedValueOnce({
      id: 'exp-prisma-1',
      tenantId: TENANT_A.tenantId,
      reportId: 'rpt-prisma-1',
      format: 'JSON',
      url: null,
      content: '{"title":"利润表","value":100}',
      generatedAt: new Date('2026-08-01T00:00:00.000Z'),
      expiresAt: new Date('2026-08-02T00:00:00.000Z'),
    })
    const createExport = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...data,
      url: null,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    }))
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 })
    const deleteReport = vi.fn().mockResolvedValue({ id: 'rpt-prisma-1' })

    const svc = makePrismaBackedService({
      financeReport: { findMany, findUnique, delete: deleteReport },
      financeReportExport: { create: createExport, findUnique: findUniqueExport, deleteMany },
    })

    const reports = await (svc as FinanceReportService & {
      listReportsResolved: (
        tenantContext: RequestTenantContext,
        query?: Record<string, unknown>
      ) => Promise<FinancialReport[]>
      getReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<FinancialReport>
      exportReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext,
        input: ExportReportDto
      ) => Promise<ExportResult>
      getExportResultResolved: (
        exportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ExportResult>
      deleteReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<boolean>
    }).listReportsResolved(TENANT_A, {})

    const report = await (svc as FinanceReportService & {
      getReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<FinancialReport>
    }).getReportResolved('rpt-prisma-1', TENANT_A)

    const exported = await (svc as FinanceReportService & {
      exportReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext,
        input: ExportReportDto
      ) => Promise<ExportResult>
    }).exportReportResolved('rpt-prisma-1', TENANT_A, { format: ExportFormat.JSON })

    const exportResult = await (svc as FinanceReportService & {
      getExportResultResolved: (
        exportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ExportResult>
    }).getExportResultResolved('exp-prisma-1', TENANT_A)

    const deleted = await (svc as FinanceReportService & {
      deleteReportResolved: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<boolean>
    }).deleteReportResolved('rpt-prisma-1', TENANT_A)

    expect(findMany).toHaveBeenCalledOnce()
    expect(report.id).toBe('rpt-prisma-1')
    expect(createExport).toHaveBeenCalledOnce()
    expect(exported.reportId).toBe('rpt-prisma-1')
    expect(exportResult.id).toBe('exp-prisma-1')
    expect(deleteMany).toHaveBeenCalledOnce()
    expect(deleteReport).toHaveBeenCalledOnce()
    expect(deleted).toBe(true)
  })
})

// Total tests: 46+ (exceeds ≥35 requirement)
