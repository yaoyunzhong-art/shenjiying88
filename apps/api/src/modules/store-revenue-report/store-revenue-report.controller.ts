import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateRevenueReportDto,
  RevenueReportQueryDto,
} from './store-revenue-report.dto'
import { StoreRevenueReportService } from './store-revenue-report.service'
import { TenantGuard } from '../agent/tenant.guard';
import {
  RequirePermissions,
  RequireTenantScope,
} from '../foundation/identity-access/identity-access.decorator'

const STORE_REVENUE_REPORT_READ_PERMISSION = 'report:read'
const STORE_REVENUE_REPORT_WRITE_PERMISSION = 'report:export'

@Controller('revenue-reports')
@UseGuards(TenantGuard)
@RequireTenantScope()
@RequirePermissions(STORE_REVENUE_REPORT_READ_PERMISSION)
export class StoreRevenueReportController {
  constructor(private readonly reportService: StoreRevenueReportService) {}

  // ── CRUD ──

  @Post()
  @RequirePermissions(STORE_REVENUE_REPORT_WRITE_PERMISSION)
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
  @RequirePermissions(STORE_REVENUE_REPORT_WRITE_PERMISSION)
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
