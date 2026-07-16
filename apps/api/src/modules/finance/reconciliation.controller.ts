/**
 * reconciliation.controller.ts — P-38 财务对账 Controller
 *
 * 基于 ReconciliationService 的 REST API
 *
 * 路由:
 *   GET    /api/finance/reconciliation/status        — 对账状态
 *   POST   /api/finance/reconciliation/run           — 执行对账
 *   GET    /api/finance/reconciliation/summary       — 对账汇总统计
 *   GET    /api/finance/reconciliation/details       — 差异明细
 *   GET    /api/finance/reconciliation/diffs         — 差异列表 (原始)
 *   POST   /api/finance/reconciliation/:id/resolve   — 标记已处理
 *   GET    /api/finance/reconciliation/monthly       — 月度对账报表
 *   GET    /api/finance/reconciliation/monthly/export— 月度对账报表导出CSV
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  Logger
} from '@nestjs/common'
import type { Response } from 'express'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  ReconciliationService,
  type ReconciliationRunOptions,
  type MatchKeyType,
  type DiffKind,
  type DiffDetailQuery
} from './reconciliation.service'
import { FinanceReconciliationReportService } from './reconciliation/finance-reconciliation-report.service'

// ─── DTO ──────────────────────────────────────────────────

export class RunReconciliationDto {
  declare date: string
  declare internalTransactions: Array<{
    id: string
    orderNo: string
    channelTxnNo?: string
    amountCents: number
    date: string
    time?: string
    channel?: string
    status?: string
  }>
  declare externalTransactions: Array<{
    id: string
    orderNo?: string
    channelTxnNo?: string
    amountCents: number
    date: string
    time?: string
    channel?: string
    status?: string
  }>
  declare matchKey?: 'orderNo' | 'channelTxnNo' | 'combined'
  declare channel?: string
  declare toleranceCents?: number
}

export class ResolveDiffDto {
  declare resolvedBy?: string
  declare note?: string
}

export class SummaryQueryDto {
  declare date?: string
}

export class DetailsQueryDto {
  declare kind?: DiffKind
  declare resolved?: string
  declare orderNo?: string
  declare offset?: string
  declare limit?: string
}

export class MonthlyReportQueryDto {
  declare month?: string
}

// ─── Controller ──────────────────────────────────────────

@Controller('finance/reconciliation')
export class ReconciliationController {
  private readonly logger = new Logger(ReconciliationController.name)

  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly reportService: FinanceReconciliationReportService
  ) {}

  /**
   * GET /api/finance/reconciliation/status
   * 对账状态
   */
  @Get('status')
  getStatus(@TenantContext() _tenantContext: RequestTenantContext) {
    const status = this.reconciliationService.getStatus()
    return {
      success: true,
      data: status,
      message: 'OK'
    }
  }

  /**
   * POST /api/finance/reconciliation/run
   * 执行对账
   */
  @Post('run')
  async run(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Body() body: RunReconciliationDto
  ) {
    const options: ReconciliationRunOptions = {
      date: body.date,
      internalTransactions: body.internalTransactions,
      externalTransactions: body.externalTransactions,
      matchKey: (body.matchKey ?? 'orderNo') as MatchKeyType,
      channel: body.channel,
      toleranceCents: body.toleranceCents
    }

    const report = await this.reconciliationService.run(options)

    return {
      success: true,
      data: report,
      message: `Reconciliation completed: ${report.matchedCount} matched, ${report.diffs.length} diffs`
    }
  }

  /**
   * GET /api/finance/reconciliation/summary
   * 对账汇总统计
   */
  @Get('summary')
  getSummary(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Query() query: SummaryQueryDto
  ) {
    const summary = this.reconciliationService.getSummary(query.date)

    if (!summary) {
      return {
        success: false,
        data: null,
        message: 'No reconciliation data available. Run reconciliation first.'
      }
    }

    return {
      success: true,
      data: summary,
      message: 'OK'
    }
  }

  /**
   * GET /api/finance/reconciliation/details
   * 差异明细（含解析状态），支持过滤
   */
  @Get('details')
  getDetails(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Query() query: DetailsQueryDto
  ) {
    const detailQuery: DiffDetailQuery = {}

    if (query.kind) {
      detailQuery.kind = query.kind as DiffKind
    }
    if (query.resolved !== undefined) {
      detailQuery.resolved = query.resolved === 'true'
    }
    if (query.orderNo) {
      detailQuery.orderNo = query.orderNo
    }
    if (query.offset !== undefined) {
      detailQuery.offset = parseInt(query.offset, 10) || 0
    }
    if (query.limit !== undefined) {
      detailQuery.limit = parseInt(query.limit, 10) || 10
    }

    const details = this.reconciliationService.getDetails(detailQuery)

    return {
      success: true,
      data: {
        details,
        totalCount: this.reconciliationService.getDiffs().length,
        filteredCount: details.length
      },
      message: 'OK'
    }
  }

  /**
   * GET /api/finance/reconciliation/diffs
   * 差异列表
   */
  @Get('diffs')
  getDiffs(@TenantContext() _tenantContext: RequestTenantContext) {
    const diffs = this.reconciliationService.getDiffs()
    const resolved = this.reconciliationService.getResolvedDiffs()

    return {
      success: true,
      data: {
        diffs,
        resolvedCount: resolved.length,
        totalCount: diffs.length,
        unresolvedCount: diffs.length - resolved.length
      },
      message: 'OK'
    }
  }

  /**
   * POST /api/finance/reconciliation/:id/resolve
   * 标记某差异已处理
   */
  @Post(':id/resolve')
  resolve(
    @Param('id') id: string,
    @TenantContext() _tenantContext: RequestTenantContext,
    @Body() body: ResolveDiffDto
  ) {
    const result = this.reconciliationService.markDiffResolved(id, {
      resolvedBy: body.resolvedBy,
      note: body.note
    })

    if (result) {
      return {
        success: true,
        data: { diffKey: id, resolved: true },
        message: `Diff ${id} marked as resolved`
      }
    }

    return {
      success: false,
      data: { diffKey: id, resolved: false },
      message: `Diff ${id} already resolved or not found`
    }
  }

  /**
   * GET /api/finance/reconciliation/monthly
   * 月度对账报表汇总
   */
  @Get('monthly')
  async getMonthlyReport(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Query() query: MonthlyReportQueryDto
  ) {
    const month = query.month ?? new Date().toISOString().slice(0, 7)
    const summary = await this.reportService.generateMonthlySummary(month)

    if (!summary) {
      return {
        success: false,
        data: null,
        message: `No reconciliation data for month ${month}`
      }
    }

    const rows = await this.reportService.getMonthlyRows(month)

    return {
      success: true,
      data: { summary, rows },
      message: 'OK'
    }
  }

  /**
   * GET /api/finance/reconciliation/monthly/export
   * 导出月度对账报表 CSV
   */
  @Get('monthly/export')
  async exportMonthlyReport(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Query() query: MonthlyReportQueryDto,
    @Res() res: Response
  ) {
    const month = query.month ?? new Date().toISOString().slice(0, 7)
    const payload = await this.reportService.exportMonthlyReport(month)

    if (!payload) {
      return {
        success: false,
        data: null,
        message: `No reconciliation data for month ${month}`
      }
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${payload.filename}"`
    )
    res.send(payload.csvContent)
  }
}
