/**
 * finance-report.controller.ts — P-38 财务报表 REST API
 *
 * 端点:
 *   - 报表 CRUD
 *   - 报表导出
 *   - 重新生成
 */

import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpException,
  Param,
  Query,
  Logger,
  NotFoundException,
  NotImplementedException,
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

  private mapDomainError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error
    }

    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('not found') || message.includes('access denied')) {
      throw new NotFoundException(message)
    }

    if (message.includes('not completed')) {
      throw new ConflictException(message)
    }

    if (message.includes('not implemented')) {
      throw new NotImplementedException(message)
    }

    if (message.includes('invalid') || message.includes('required')) {
      throw new BadRequestException(message)
    }

    throw error
  }

  private async runWithHttpErrorMapping<T>(operation: () => T | Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.mapDomainError(error)
    }
  }

  /**
   * POST /api/finance/reports
   * 创建报表
   */
  @Post()
  async createReport(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateReportDto
  ) {
    return this.runWithHttpErrorMapping(() => {
      if (this.resolvedReportService.createReportResolved) {
        return this.resolvedReportService.createReportResolved(tenantContext, body)
      }
      return this.reportService.createReport(tenantContext, body)
    })
  }

  /**
   * GET /api/finance/reports
   * 查询报表列表
   */
  @Get()
  async listReports(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReportQueryDto = {} as ReportQueryDto
  ) {
    return this.runWithHttpErrorMapping(() => {
      if (this.resolvedReportService.listReportsResolved) {
        return this.resolvedReportService.listReportsResolved(tenantContext, query)
      }
      return this.reportService.listReports(tenantContext, query)
    })
  }

  /**
   * GET /api/finance/reports/:reportId
   * 获取报表详情
   */
  @Get(':reportId')
  async getReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.runWithHttpErrorMapping(() => {
      if (this.resolvedReportService.getReportResolved) {
        return this.resolvedReportService.getReportResolved(reportId, tenantContext)
      }
      return this.reportService.getReport(reportId, tenantContext)
    })
  }

  /**
   * POST /api/finance/reports/:reportId/regenerate
   * 重新生成报表
   */
  @Post(':reportId/regenerate')
  async regenerateReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.runWithHttpErrorMapping(() => {
      if (this.resolvedReportService.regenerateReportResolved) {
        return this.resolvedReportService.regenerateReportResolved(reportId, tenantContext)
      }
      return this.reportService.regenerateReport(reportId, tenantContext)
    })
  }

  /**
   * POST /api/finance/reports/:reportId/export
   * 导出现有报表
   */
  @Post(':reportId/export')
  async exportReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ExportReportDto
  ) {
    return this.runWithHttpErrorMapping(() => {
      if (this.resolvedReportService.exportReportResolved) {
        return this.resolvedReportService.exportReportResolved(reportId, tenantContext, body)
      }
      return this.reportService.exportReport(reportId, tenantContext, body)
    })
  }

  /**
   * GET /api/finance/reports/exports/:exportId
   * 获取导出结果
   */
  @Get('exports/:exportId')
  async getExportResult(
    @Param('exportId') exportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.runWithHttpErrorMapping(() => {
      if (this.resolvedReportService.getExportResultResolved) {
        return this.resolvedReportService.getExportResultResolved(exportId, tenantContext)
      }
      return this.reportService.getExportResult(exportId, tenantContext)
    })
  }

  /**
   * DELETE /api/finance/reports/:reportId
   * 删除报表及关联导出
   */
  @Delete(':reportId')
  async deleteReport(
    @Param('reportId') reportId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.runWithHttpErrorMapping(async () => {
      if (this.resolvedReportService.deleteReportResolved) {
        await this.resolvedReportService.deleteReportResolved(reportId, tenantContext)
        return {
          success: true,
          message: `Report ${reportId} deleted`
        }
      }
      this.reportService.deleteReport(reportId, tenantContext)
      return { success: true, message: `Report ${reportId} deleted` }
    })
  }
}
