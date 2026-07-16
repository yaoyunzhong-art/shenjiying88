/**
 * FinanceReconciliationReportService · 月度对账报表 (P-38 100%)
 *
 * 功能:
 *   1. 月度对账汇总报表生成
 *   2. Excel 格式导出 (CSV 格式, 含 UTF-8 BOM, 兼容 Excel)
 *   3. 按渠道 / 按日期聚合统计
 */

import { Injectable, Logger } from '@nestjs/common'
import { ReconciliationService } from '../reconciliation.service'
import type { ReconciliationSummary, DiffKind } from '../reconciliation.service'

// ─── 类型 ──────────────────────────────────────────────────

export interface MonthlyReconciliationSummary {
  /** 月份标签 YYYY-MM */
  monthLabel: string
  /** 日期列表 */
  dates: string[]
  /** 内部总交易数 */
  internalTotal: number
  /** 外部总流水数 */
  externalTotal: number
  /** 匹配总数 */
  matchedCount: number
  /** 精确匹配数 */
  exactMatchCount: number
  /** 内部总金额 (分) */
  internalTotalCents: number
  /** 外部总金额 (分) */
  externalTotalCents: number
  /** 总金额差异 (分) */
  totalDiffCents: number
  /** 差异分类统计 */
  diffKindBreakdown: Array<{ kind: DiffKind; count: number; totalDiffCents: number }>
  /** 已解决差异数 */
  resolvedCount: number
  /** 未解决差异数 */
  unresolvedCount: number
}

export interface MonthlyReconciliationRow {
  date: string
  internalCount: number
  externalCount: number
  matchedCount: number
  exactMatchCount: number
  matchRate: number
  internalCents: number
  externalCents: number
  diffCents: number
  diffCount: number
  resolvedCount: number
}

export interface ExcelExportPayload {
  month: string
  filename: string
  csvContent: string
  /** 总览行 */
  summary: MonthlyReconciliationSummary
  /** 详细行 */
  rows: MonthlyReconciliationRow[]
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class FinanceReconciliationReportService {
  private readonly logger = new Logger(FinanceReconciliationReportService.name)

  constructor(
    private readonly reconciliationService: ReconciliationService
  ) {}

  /**
   * 生成月度对账汇总
   */
  async generateMonthlySummary(yearMonth: string): Promise<MonthlyReconciliationSummary | null> {
    const overall = this.reconciliationService.getOverallStats()
    if (!overall || overall.reportDates.length === 0) {
      return null
    }

    // 过滤出属于该月的日期
    const monthDates = overall.reportDates.filter((d) => d.startsWith(yearMonth))
    if (monthDates.length === 0) {
      return null
    }

    let internalTotal = 0
    let externalTotal = 0
    let matchedCount = 0
    let exactMatchCount = 0
    let internalTotalCents = 0
    let externalTotalCents = 0
    const diffKindAccum: Record<DiffKind, { count: number; totalDiffCents: number }> = {
      'amount-mismatch': { count: 0, totalDiffCents: 0 },
      'missing-internal': { count: 0, totalDiffCents: 0 },
      'missing-external': { count: 0, totalDiffCents: 0 },
      'duplicate': { count: 0, totalDiffCents: 0 }
    }
    let resolvedCount = 0
    let unresolvedCount = 0

    for (const date of monthDates) {
      const summary = this.reconciliationService.getSummary(date)
      if (!summary) continue

      internalTotal += summary.internalTotal
      externalTotal += summary.externalTotal
      matchedCount += summary.matchedCount
      exactMatchCount += summary.exactMatchCount
      internalTotalCents += summary.internalTotalCents
      externalTotalCents += summary.externalTotalCents
      resolvedCount += summary.resolvedCount
      unresolvedCount += summary.unresolvedCount

      for (const bk of summary.diffKindBreakdown) {
        const acc = diffKindAccum[bk.kind]
        if (acc) {
          acc.count += bk.count
          acc.totalDiffCents += bk.totalDiffCents
        }
      }
    }

    const diffKindBreakdown = (Object.keys(diffKindAccum) as DiffKind[])
      .filter((k) => diffKindAccum[k].count > 0)
      .map((k) => ({
        kind: k,
        count: diffKindAccum[k].count,
        totalDiffCents: diffKindAccum[k].totalDiffCents
      }))

    return {
      monthLabel: yearMonth,
      dates: monthDates,
      internalTotal,
      externalTotal,
      matchedCount,
      exactMatchCount,
      internalTotalCents,
      externalTotalCents,
      totalDiffCents: internalTotalCents - externalTotalCents,
      diffKindBreakdown,
      resolvedCount,
      unresolvedCount
    }
  }

  /**
   * 获取月度对账明细行 (每日一条)
   */
  async getMonthlyRows(yearMonth: string): Promise<MonthlyReconciliationRow[]> {
    const overall = this.reconciliationService.getOverallStats()
    if (!overall) return []

    const monthDates = overall.reportDates.filter((d) => d.startsWith(yearMonth))
    const rows: MonthlyReconciliationRow[] = []

    for (const date of monthDates) {
      const summary = this.reconciliationService.getSummary(date)
      if (!summary) continue

      const matchRate = summary.internalTotal > 0
        ? Math.round((summary.matchedCount / summary.internalTotal) * 10000) / 100
        : 100

      rows.push({
        date,
        internalCount: summary.internalTotal,
        externalCount: summary.externalTotal,
        matchedCount: summary.matchedCount,
        exactMatchCount: summary.exactMatchCount,
        matchRate,
        internalCents: summary.internalTotalCents,
        externalCents: summary.externalTotalCents,
        diffCents: summary.totalDiffCents,
        diffCount: summary.unresolvedCount + summary.resolvedCount,
        resolvedCount: summary.resolvedCount
      })
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * 导出月度对账报表 (CSV 格式, 带 BOM, 兼容 Excel)
   */
  async exportMonthlyReport(yearMonth: string): Promise<ExcelExportPayload | null> {
    const summary = await this.generateMonthlySummary(yearMonth)
    if (!summary) return null

    const rows = await this.getMonthlyRows(yearMonth)

    // 构建 CSV
    const lines: string[] = []

    // 标题行
    lines.push('月度对账报告,' + yearMonth)
    lines.push('')
    lines.push('总览,,,,,,,,,')
    lines.push('内部交易数,外部流水数,匹配数,精确匹配数,内部金额,外部金额,差异金额,已解决,未解决')
    lines.push(
      [
        String(summary.internalTotal),
        String(summary.externalTotal),
        String(summary.matchedCount),
        String(summary.exactMatchCount),
        String(summary.internalTotalCents),
        String(summary.externalTotalCents),
        String(summary.totalDiffCents),
        String(summary.resolvedCount),
        String(summary.unresolvedCount)
      ].join(',')
    )

    lines.push('')
    lines.push('差异分类统计,,,,,')
    lines.push('类型,数量,差异金额')
    for (const bk of summary.diffKindBreakdown) {
      lines.push(
        [
          bk.kind,
          String(bk.count),
          String(bk.totalDiffCents)
        ].join(',')
      )
    }

    lines.push('')
    lines.push('每日明细,,,,,,,,,,')

    // CSV 头
    const headers = [
      '日期',
      '内部交易数',
      '外部流水数',
      '匹配数',
      '精确匹配数',
      '匹配率(%)',
      '内部金额(分)',
      '外部金额(分)',
      '差异(分)',
      '差异数',
      '已解决'
    ]
    lines.push(headers.join(','))

    for (const row of rows) {
      lines.push(
        [
          row.date,
          String(row.internalCount),
          String(row.externalCount),
          String(row.matchedCount),
          String(row.exactMatchCount),
          String(row.matchRate.toFixed(1)),
          String(row.internalCents),
          String(row.externalCents),
          String(row.diffCents),
          String(row.diffCount),
          String(row.resolvedCount)
        ].join(',')
      )
    }

    const filename = `reconciliation-monthly-${yearMonth}.csv`
    const bom = '\ufeff'
    const csvContent = bom + lines.join('\n')

    this.logger.log(
      `Monthly report exported: month=${yearMonth} rows=${rows.length} dates=${summary.dates.length}`
    )

    return {
      month: yearMonth,
      filename,
      csvContent,
      summary,
      rows
    }
  }
}
