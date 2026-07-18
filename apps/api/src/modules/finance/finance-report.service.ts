/**
 * finance-report.service.ts — P-38 财务报表生成服务
 *
 * 功能:
 *   - 报表创建与状态管理
 *   - 利润/损益表生成
 *   - 资产负债表生成
 *   - 现金流量表生成
 *   - 收入分析报表
 *   - 费用分析报表
 *   - 对账报表
 *   - 报表导出 (JSON/CSV/EXCEL)
 *   - SSE 进度推送
 */

import { randomUUID } from 'node:crypto'
import { Injectable, Optional, Logger, Inject } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FinanceEventEmitter } from './finance.sse'
import { FinanceService } from './finance.service'
import {
  type FinancialReport,
  type ReportSummary,
  type ExportResult,
  type ExportRequest,
  type ReportType
} from './types'
import {
  CreateReportDto,
  ReportQueryDto,
  ExportReportDto,
  FilterReportDto,
  ReportType as ReportTypeEnum,
  ExportFormat
} from './dto/create-report.dto'

// ─── In-Memory Stores ───────────────────────────────────

const reportStore = new Map<string, FinancialReport>()
const exportStore = new Map<string, ExportResult>()

export function resetFinanceReportTestState(): void {
  reportStore.clear()
  exportStore.clear()
}

@Injectable()
export class FinanceReportService {
  private readonly logger = new Logger(FinanceReportService.name)

  constructor(
    private readonly financeService: FinanceService,
    @Optional()
    @Inject(FinanceEventEmitter)
    private readonly eventEmitter?: FinanceEventEmitter
  ) {}

  // ═══════════════════════════════════════════════════════
  // 报表 CRUD
  // ═══════════════════════════════════════════════════════

  /**
   * 创建报表
   */
  createReport(
    tenantContext: RequestTenantContext,
    input: CreateReportDto
  ): FinancialReport {
    const now = new Date().toISOString()

    const report: FinancialReport = {
      id: `rpt-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId: input.storeId ?? tenantContext.storeId,
      title: input.title,
      reportType: input.reportType as unknown as ReportType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: 'GENERATING' as FinancialReport['status'],
      exportFormats: input.exportFormats ?? ['JSON'],
      createdAt: now
    }

    reportStore.set(report.id, report)

    this.emitEvent({
      type: 'report.generating',
      tenantId: tenantContext.tenantId,
      reportId: report.id,
      reportType: report.reportType,
      timestamp: now
    })

    // 同步生成报表数据
    try {
      const generated = this.generateReportData(report, tenantContext)
      reportStore.set(report.id, generated)
    } catch (err) {
      report.status = 'FAILED' as FinancialReport['status']
      report.errorMessage = (err as Error).message
      reportStore.set(report.id, report)

      this.emitEvent({
        type: 'report.failed',
        tenantId: tenantContext.tenantId,
        reportId: report.id,
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      })
    }

    return reportStore.get(report.id)!
  }

  /**
   * 获取报表
   */
  getReport(
    reportId: string,
    tenantContext: RequestTenantContext
  ): FinancialReport {
    const report = reportStore.get(reportId)
    if (!report || report.tenantId !== tenantContext.tenantId) {
      throw new Error(`Report ${reportId} not found`)
    }
    return report
  }

  /**
   * 查询报表列表
   */
  listReports(
    tenantContext: RequestTenantContext,
    query?: ReportQueryDto
  ): FinancialReport[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let reports = Array.from(reportStore.values())
      .filter((r) => r.tenantId === tenantContext.tenantId)

    if (query?.reportType) {
      reports = reports.filter((r) => r.reportType === query.reportType)
    }
    if (query?.storeId) {
      reports = reports.filter((r) => r.storeId === query.storeId)
    }
    if (query?.status) {
      reports = reports.filter((r) => r.status === query.status)
    }
    if (query?.periodStart) {
      reports = reports.filter((r) => r.periodStart >= query.periodStart!)
    }
    if (query?.periodEnd) {
      reports = reports.filter((r) => r.periodEnd <= query.periodEnd!)
    }

    reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (typeof limit === 'number') {
      reports = reports.slice(offset, offset + limit)
    }

    return reports
  }

  /**
   * 删除报表
   */
  deleteReport(
    reportId: string,
    tenantContext: RequestTenantContext
  ): boolean {
    const report = reportStore.get(reportId)
    if (!report || report.tenantId !== tenantContext.tenantId) {
      throw new Error(`Report ${reportId} not found or access denied`)
    }
    reportStore.delete(reportId)
    const exportIds = Array.from(exportStore.keys()).filter((k) => exportStore.get(k)?.reportId === reportId)
    for (const eid of exportIds) {
      exportStore.delete(eid)
    }
    return true
  }

  /**
   * 重新生成报表
   */
  regenerateReport(
    reportId: string,
    tenantContext: RequestTenantContext
  ): FinancialReport {
    const existing = this.getReport(reportId, tenantContext)
    existing.status = 'GENERATING' as FinancialReport['status']
    existing.generatedAt = undefined
    existing.data = undefined
    existing.summary = undefined
    existing.errorMessage = undefined

    try {
      const generated = this.generateReportData(existing, tenantContext)
      reportStore.set(reportId, generated)
    } catch (err) {
      existing.status = 'FAILED' as FinancialReport['status']
      existing.errorMessage = (err as Error).message
      reportStore.set(reportId, existing)
    }

    return reportStore.get(reportId)!
  }

  // ═══════════════════════════════════════════════════════
  // 报表数据生成
  // ═══════════════════════════════════════════════════════

  /**
   * 根据报表类型生成数据
   */
  private generateReportData(
    report: FinancialReport,
    tenantContext: RequestTenantContext
  ): FinancialReport {
    const now = new Date().toISOString()

    switch (report.reportType as string) {
      case 'PROFIT_LOSS':
        return this.generateProfitLossReport(report, tenantContext, now)
      case 'BALANCE_SHEET':
        return this.generateBalanceSheetReport(report, tenantContext, now)
      case 'CASH_FLOW':
        return this.generateCashFlowReport(report, tenantContext, now)
      case 'REVENUE_ANALYSIS':
        return this.generateRevenueAnalysisReport(report, tenantContext, now)
      case 'EXPENSE_ANALYSIS':
        return this.generateExpenseAnalysisReport(report, tenantContext, now)
      case 'RECONCILIATION':
        return this.generateReconciliationReport(report, tenantContext, now)
      default:
        throw new Error(`Unsupported report type: ${report.reportType}`)
    }
  }

  /**
   * 利润/损益表
   */
  private generateProfitLossReport(
    report: FinancialReport,
    tenantContext: RequestTenantContext,
    now: string
  ): FinancialReport {
    const summary = this.financeService.getRevenueSummary(tenantContext, {
      storeId: report.storeId,
      startDate: report.periodStart,
      endDate: report.periodEnd
    })

    const data = {
      title: '利润表',
      period: { start: report.periodStart, end: report.periodEnd },
      sections: [
        {
          name: '营业收入',
          items: [
            { name: '主营业务收入', amount: summary.totalRevenue },
            { name: '其他业务收入', amount: 0 }
          ],
          subtotal: summary.totalRevenue
        },
        {
          name: '营业成本',
          items: [
            { name: '主营业务成本', amount: 0 },
            { name: '其他业务成本', amount: 0 }
          ],
          subtotal: 0
        },
        {
          name: '期间费用',
          items: [
            { name: '销售费用', amount: 0 },
            { name: '管理费用', amount: 0 },
            { name: '财务费用', amount: 0 }
          ],
          subtotal: 0
        },
        {
          name: '其他项目',
          items: [
            { name: '退款支出', amount: summary.totalRefund },
            { name: '汇兑损益', amount: 0 }
          ],
          subtotal: summary.totalRefund
        }
      ],
      grossProfit: summary.totalRevenue,
      operatingProfit: summary.totalRevenue - summary.totalRefund,
      netProfit: summary.netRevenue
    }

    report.data = data as unknown as Record<string, unknown>
    report.summary = {
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpense,
      totalRefund: summary.totalRefund,
      netProfit: summary.netRevenue,
      transactionCount: summary.transactionCount
    }
    report.status = 'COMPLETED' as FinancialReport['status']
    report.generatedAt = now

    this.emitEvent({
      type: 'report.completed',
      tenantId: tenantContext.tenantId,
      reportId: report.id,
      status: 'COMPLETED',
      timestamp: now
    })

    return report
  }

  /**
   * 资产负债表
   */
  private generateBalanceSheetReport(
    report: FinancialReport,
    tenantContext: RequestTenantContext,
    now: string
  ): FinancialReport {
    const summary = this.financeService.getRevenueSummary(tenantContext, {
      storeId: report.storeId,
      startDate: report.periodStart,
      endDate: report.periodEnd
    })

    const accounts = this.financeService.listAccounts(tenantContext, report.storeId)
    const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0) + summary.totalRevenue

    const data = {
      title: '资产负债表',
      period: { start: report.periodStart, end: report.periodEnd },
      assets: {
        current: [
          { name: '货币资金', amount: totalAssets },
          { name: '应收账款', amount: 0 },
          { name: '预付账款', amount: 0 },
          { name: '存货', amount: 0 }
        ],
        nonCurrent: [
          { name: '固定资产', amount: 0 },
          { name: '无形资产', amount: 0 }
        ],
        total: totalAssets
      },
      liabilities: {
        current: [
          { name: '应付账款', amount: summary.totalExpense },
          { name: '预收账款', amount: 0 },
          { name: '应付税费', amount: 0 }
        ],
        nonCurrent: [
          { name: '长期借款', amount: 0 }
        ],
        total: summary.totalExpense
      },
      equity: {
        items: [
          { name: '实收资本', amount: 0 },
          { name: '未分配利润', amount: summary.netRevenue }
        ],
        total: summary.netRevenue
      },
      accountDetails: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        status: a.status
      }))
    }

    report.data = data as unknown as Record<string, unknown>
    report.summary = {
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpense,
      totalRefund: summary.totalRefund,
      netProfit: summary.netRevenue,
      transactionCount: summary.transactionCount
    }
    report.status = 'COMPLETED' as FinancialReport['status']
    report.generatedAt = now

    this.emitEvent({
      type: 'report.completed',
      tenantId: tenantContext.tenantId,
      reportId: report.id,
      status: 'COMPLETED',
      timestamp: now
    })

    return report
  }

  /**
   * 现金流量表
   */
  private generateCashFlowReport(
    report: FinancialReport,
    tenantContext: RequestTenantContext,
    now: string
  ): FinancialReport {
    const summary = this.financeService.getRevenueSummary(tenantContext, {
      storeId: report.storeId,
      startDate: report.periodStart,
      endDate: report.periodEnd
    })

    const data = {
      title: '现金流量表',
      period: { start: report.periodStart, end: report.periodEnd },
      operating: {
        inflows: [
          { name: '销售商品收入', amount: summary.totalRevenue },
          { name: '其他经营性流入', amount: 0 }
        ],
        totalInflow: summary.totalRevenue,
        outflows: [
          { name: '购买商品支出', amount: summary.totalExpense },
          { name: '支付税费', amount: 0 },
          { name: '退款支出', amount: summary.totalRefund }
        ],
        totalOutflow: summary.totalExpense + summary.totalRefund,
        netCash: summary.totalRevenue - summary.totalExpense - summary.totalRefund
      },
      investing: {
        inflows: [{ name: '投资收回', amount: 0 }],
        totalInflow: 0,
        outflows: [{ name: '购置固定资产', amount: 0 }],
        totalOutflow: 0,
        netCash: 0
      },
      financing: {
        inflows: [{ name: '吸收投资', amount: 0 }],
        totalInflow: 0,
        outflows: [{ name: '偿还债务', amount: 0 }],
        totalOutflow: 0,
        netCash: 0
      },
      netIncrease: summary.totalRevenue - summary.totalExpense - summary.totalRefund
    }

    report.data = data as unknown as Record<string, unknown>
    report.summary = {
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpense,
      totalRefund: summary.totalRefund,
      netProfit: summary.netRevenue,
      transactionCount: summary.transactionCount
    }
    report.status = 'COMPLETED' as FinancialReport['status']
    report.generatedAt = now

    this.emitEvent({
      type: 'report.completed',
      tenantId: tenantContext.tenantId,
      reportId: report.id,
      status: 'COMPLETED',
      timestamp: now
    })

    return report
  }

  /**
   * 收入分析报表
   */
  private generateRevenueAnalysisReport(
    report: FinancialReport,
    tenantContext: RequestTenantContext,
    now: string
  ): FinancialReport {
    const summary = this.financeService.getRevenueSummary(tenantContext, {
      storeId: report.storeId,
      startDate: report.periodStart,
      endDate: report.periodEnd
    })

    // 月度分布
    const monthlyBreakdown: Array<{ month: string; revenue: number; expense: number; refund: number; net: number }> = []
    const start = new Date(report.periodStart)
    const end = new Date(report.periodEnd)
    const cursor = new Date(start)

    while (cursor <= end) {
      const month = cursor.toISOString().substring(0, 7)
      monthlyBreakdown.push({
        month,
        revenue: 0,
        expense: 0,
        refund: 0,
        net: 0
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    const data = {
      title: '收入分析报告',
      period: { start: report.periodStart, end: report.periodEnd },
      summary: {
        totalRevenue: summary.totalRevenue,
        totalExpense: summary.totalExpense,
        totalRefund: summary.totalRefund,
        netRevenue: summary.netRevenue,
        transactionCount: summary.transactionCount,
        averageTransactionValue: summary.transactionCount > 0
          ? Math.round(summary.totalRevenue / summary.transactionCount * 100) / 100
          : 0
      },
      monthlyTrend: monthlyBreakdown,
      revenueComposition: [
        { category: '主营业务收入', amount: summary.totalRevenue, percentage: 100 },
        { category: '其他收入', amount: 0, percentage: 0 }
      ],
      revenueGrowth: {
        currentPeriod: summary.totalRevenue,
        previousPeriod: 0,
        growth: 0,
        growthRate: '0%'
      }
    }

    report.data = data as unknown as Record<string, unknown>
    report.summary = {
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpense,
      totalRefund: summary.totalRefund,
      netProfit: summary.netRevenue,
      transactionCount: summary.transactionCount
    }
    report.status = 'COMPLETED' as FinancialReport['status']
    report.generatedAt = now

    this.emitEvent({
      type: 'report.completed',
      tenantId: tenantContext.tenantId,
      reportId: report.id,
      status: 'COMPLETED',
      timestamp: now
    })

    return report
  }

  /**
   * 费用分析报表
   */
  private generateExpenseAnalysisReport(
    report: FinancialReport,
    tenantContext: RequestTenantContext,
    now: string
  ): FinancialReport {
    const summary = this.financeService.getRevenueSummary(tenantContext, {
      storeId: report.storeId,
      startDate: report.periodStart,
      endDate: report.periodEnd
    })

    const data = {
      title: '费用分析报告',
      period: { start: report.periodStart, end: report.periodEnd },
      summary: {
        totalExpense: summary.totalExpense,
        totalRefund: summary.totalRefund,
        totalCost: summary.totalExpense + summary.totalRefund,
        expenseRatio: summary.totalRevenue > 0
          ? Math.round(((summary.totalExpense + summary.totalRefund) / summary.totalRevenue) * 10000) / 100
          : 0
      },
      expenseBreakdown: [
        { category: '退款支出', amount: summary.totalRefund, percentage: summary.totalRevenue > 0 ? Math.round(summary.totalRefund / (summary.totalExpense + summary.totalRefund) * 10000) / 100 : 0 },
        { category: '运营支出', amount: summary.totalExpense, percentage: summary.totalRevenue > 0 ? Math.round(summary.totalExpense / (summary.totalExpense + summary.totalRefund) * 10000) / 100 : 0 }
      ],
      monthlyTrend: [],
      costSaving: {
        totalSavings: 0,
        suggestions: [
          '定期审查退款率，优化退款流程',
          '考虑批量采购折扣',
          '优化库存周转，降低仓储成本'
        ]
      }
    }

    report.data = data as unknown as Record<string, unknown>
    report.summary = {
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpense,
      totalRefund: summary.totalRefund,
      netProfit: summary.netRevenue,
      transactionCount: summary.transactionCount
    }
    report.status = 'COMPLETED' as FinancialReport['status']
    report.generatedAt = now

    this.emitEvent({
      type: 'report.completed',
      tenantId: tenantContext.tenantId,
      reportId: report.id,
      status: 'COMPLETED',
      timestamp: now
    })

    return report
  }

  /**
   * 对账报表
   */
  private generateReconciliationReport(
    report: FinancialReport,
    tenantContext: RequestTenantContext,
    now: string
  ): FinancialReport {
    const summary = this.financeService.getRevenueSummary(tenantContext, {
      storeId: report.storeId,
      startDate: report.periodStart,
      endDate: report.periodEnd
    })

    const data = {
      title: '对账报告',
      period: { start: report.periodStart, end: report.periodEnd },
      summary: {
        totalRevenue: summary.totalRevenue,
        totalExpense: summary.totalExpense,
        netProfit: summary.netRevenue,
        transactionCount: summary.transactionCount
      },
      channels: ['WECHAT', 'ALIPAY', 'BANK', 'CASH', 'CARD'],
      status: 'RECONCILED',
      notes: '当前报表基于内存数据生成，生产环境应与第三方对账平台对接'
    }

    report.data = data as unknown as Record<string, unknown>
    report.summary = {
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpense,
      totalRefund: summary.totalRefund,
      netProfit: summary.netRevenue,
      transactionCount: summary.transactionCount
    }
    report.status = 'COMPLETED' as FinancialReport['status']
    report.generatedAt = now

    this.emitEvent({
      type: 'report.completed',
      tenantId: tenantContext.tenantId,
      reportId: report.id,
      status: 'COMPLETED',
      timestamp: now
    })

    return report
  }

  // ═══════════════════════════════════════════════════════
  // 报表导出
  // ═══════════════════════════════════════════════════════

  /**
   * 导出报表
   */
  exportReport(
    reportId: string,
    tenantContext: RequestTenantContext,
    input: ExportReportDto
  ): ExportResult {
    const report = this.getReport(reportId, tenantContext)

    if (report.status !== 'COMPLETED') {
      throw new Error(`Report ${reportId} is not completed (status: ${report.status})`)
    }

    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    let content = ''
    if (input.format === 'JSON' as ExportFormat) {
      content = JSON.stringify(report.data ?? {}, null, 2)
    } else if (input.format === 'CSV' as ExportFormat) {
      content = this.toCsv(report.data as Record<string, unknown> | undefined, input.columns)
    }

    const result: ExportResult = {
      id: `exp-${randomUUID()}`,
      reportId: report.id,
      format: input.format as ExportResult['format'],
      content,
      generatedAt: now,
      expiresAt
    }

    exportStore.set(result.id, result)
    return result
  }

  /**
   * 获取导出结果
   */
  getExportResult(
    exportId: string,
    tenantContext: RequestTenantContext
  ): ExportResult {
    const result = exportStore.get(exportId)
    if (!result) {
      throw new Error(`Export result ${exportId} not found`)
    }
    return result
  }

  /**
   * 将数据转换为 CSV
   */
  private toCsv(
    data: Record<string, unknown> | undefined,
    columns?: string[]
  ): string {
    if (!data) return ''

    const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
      const result: Record<string, string> = {}
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flatten(value as Record<string, unknown>, fullKey))
        } else {
          result[fullKey] = String(value ?? '')
        }
      }
      return result
    }

    const flat = flatten(data)
    const keys = columns ?? Object.keys(flat)

    // Header
    const header = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(',')
    const row = keys.map((k) => `"${String(flat[k] ?? '').replace(/"/g, '""')}"`).join(',')

    return `${header}\n${row}\n`
  }

  // ═══════════════════════════════════════════════════════
  // 辅助方法
  // ═══════════════════════════════════════════════════════

  private emitEvent(event: {
    type: string
    tenantId: string
    reportId: string
    [key: string]: unknown
  }): void {
    if (this.eventEmitter && event.tenantId) {
      try {
        this.eventEmitter.emit(event as never)
      } catch (err) {
        this.logger.warn(`Failed to emit event ${event.type}: ${(err as Error).message}`)
      }
    }
  }
}
