import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateRevenueReportDto,
  RevenueReportQueryDto,
} from './store-revenue-report.dto'
import { StoreRevenueReportService } from './store-revenue-report.service'

@Controller('revenue-reports')
export class StoreRevenueReportController {
  constructor(private readonly reportService: StoreRevenueReportService) {}

  // ── CRUD ──

  @Post()
  generateReport(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateRevenueReportDto
  ) {
    return this.reportService.generateReport({
      tenantId: tenantContext.tenantId,
      storeId: body.storeId,
      storeName: `门店-${body.storeId}`, // In a real app, fetch from store service
      startDate: body.startDate,
      endDate: body.endDate,
      reportType: body.reportType,
    })
  }

  @Get()
  listReports(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: RevenueReportQueryDto
  ) {
    return this.reportService.listReports(tenantContext.tenantId, {
      storeId: query.storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      reportType: query.reportType,
    })
  }

  @Get(':id')
  getReport(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string
  ) {
    const report = this.reportService.getReport(id, tenantContext.tenantId)
    if (!report) {
      throw new Error(`Revenue report not found: ${id}`)
    }
    return report
  }

  @Delete(':id')
  deleteReport(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string
  ) {
    this.reportService.deleteReport(id, tenantContext.tenantId)
    return { success: true }
  }

  // ── Query views ──

  @Get('views/store/:storeId/summary')
  getStoreSummary(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const summary = this.reportService.getStoreSummary(
      storeId,
      tenantContext.tenantId,
      startDate,
      endDate
    )
    if (!summary) {
      throw new Error(`No revenue report found for store: ${storeId}`)
    }
    return summary
  }

  @Get('views/overall/summary')
  getOverallSummary(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportService.getOverallSummary(
      tenantContext.tenantId,
      startDate,
      endDate
    )
  }
}
