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
  Logger
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FinanceReportService } from './finance-report.service'
import {
  CreateReportDto,
  ReportQueryDto,
  ExportReportDto
} from './dto/create-report.dto'

@Controller('finance/reports')
export class FinanceReportController {
  private readonly logger = new Logger(FinanceReportController.name)

  constructor(
    private readonly reportService: FinanceReportService
  ) {}

  /**
   * POST /api/finance/reports
   * 创建报表
   */
  @Post()
  createReport(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateReportDto
  ) {
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
    this.reportService.deleteReport(reportId, tenantContext)
    return { success: true, message: `Report ${reportId} deleted` }
  }
}
