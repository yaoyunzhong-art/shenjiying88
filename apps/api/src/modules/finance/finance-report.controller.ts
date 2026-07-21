/**
 * finance-report.controller.ts — P-38 财务报表 REST API
 *
 * 端点:
 *   - 报表 CRUD
 *   - 报表导出
 *   - 重新生成
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FinanceReportService } from './finance-report.service'
import {
  CreateReportDto,
  ReportQueryDto,
  ExportReportDto
} from './dto/create-report.dto'

@UseGuards(TenantGuard)
@Controller('finance/reports')
export class FinanceReportController {
  private readonly logger = new Logger(FinanceReportController.name)

  constructor(
    private readonly reportService: FinanceReportService
  ) {}

  private get resolvedReportService() {
    return this.reportService as FinanceReportService & {
      createReportResolved?: (
        tenantContext: RequestTenantContext,
        body: CreateReportDto
      ) => Promise<ReturnType<FinanceReportService['createReport']>>
      listReportsResolved?: (
        tenantContext: RequestTenantContext,
        query?: ReportQueryDto
      ) => Promise<ReturnType<FinanceReportService['listReports']>>
      getReportResolved?: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceReportService['getReport']>>
      regenerateReportResolved?: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceReportService['regenerateReport']>>
      exportReportResolved?: (
        reportId: string,
        tenantContext: RequestTenantContext,
        body: ExportReportDto
      ) => Promise<ReturnType<FinanceReportService['exportReport']>>
      getExportResultResolved?: (
        exportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceReportService['getExportResult']>>
      deleteReportResolved?: (
        reportId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceReportService['deleteReport']>>
    }
  }

  /**
   * POST /api/finance/reports
   * 创建报表
   */
  @Post()
  createReport(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateReportDto
  ) {
    if (this.resolvedReportService.createReportResolved) {
      return this.resolvedReportService.createReportResolved(tenantContext, body)
    }
    return this.reportService.createReport(tenantContext, body)
  }

  /**
   * GET /api/finance/reports
   * 查询报表列表
   */
  @Get()
  listReports(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReportQueryDto = {} as ReportQueryDto
  ) {
    if (this.resolvedReportService.listReportsResolved) {
      return this.resolvedReportService.listReportsResolved(tenantContext, query)
    }
    return this.reportService.listReports(tenantContext, query)
  }

  /**
   * GET /api/finance/reports/:reportId
   * 获取报表详情
   */
  @Get(':reportId')
  getReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedReportService.getReportResolved) {
      return this.resolvedReportService.getReportResolved(reportId, tenantContext)
    }
    return this.reportService.getReport(reportId, tenantContext)
  }

  /**
   * POST /api/finance/reports/:reportId/regenerate
   * 重新生成报表
   */
  @Post(':reportId/regenerate')
  regenerateReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedReportService.regenerateReportResolved) {
      return this.resolvedReportService.regenerateReportResolved(reportId, tenantContext)
    }
    return this.reportService.regenerateReport(reportId, tenantContext)
  }

  /**
   * POST /api/finance/reports/:reportId/export
   * 导出现有报表
   */
  @Post(':reportId/export')
  exportReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ExportReportDto
  ) {
    if (this.resolvedReportService.exportReportResolved) {
      return this.resolvedReportService.exportReportResolved(reportId, tenantContext, body)
    }
    return this.reportService.exportReport(reportId, tenantContext, body)
  }

  /**
   * GET /api/finance/reports/exports/:exportId
   * 获取导出结果
   */
  @Get('exports/:exportId')
  getExportResult(
    @Param('exportId') exportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedReportService.getExportResultResolved) {
      return this.resolvedReportService.getExportResultResolved(exportId, tenantContext)
    }
    return this.reportService.getExportResult(exportId, tenantContext)
  }

  /**
   * DELETE /api/finance/reports/:reportId
   * 删除报表及关联导出
   */
  @Delete(':reportId')
  deleteReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedReportService.deleteReportResolved) {
      return this.resolvedReportService.deleteReportResolved(reportId, tenantContext).then(() => ({
        success: true,
        message: `Report ${reportId} deleted`
      }))
    }
    this.reportService.deleteReport(reportId, tenantContext)
    return { success: true, message: `Report ${reportId} deleted` }
  }
}
