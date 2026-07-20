/**
 * 报表/看板 - Controller (V10 Day 7 Phase 91)
 */

import { Controller, Get, Post, Delete, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common'
import { ReportService } from './report.service'
import type {
  ReportDefinition, ReportQueryResponse, DashboardLayout, ReportPeriod,
} from './report.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('report')
@UseGuards(TenantGuard)
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Get('list')
  listReports(): { items: ReportDefinition[]; total: number } {
    const items = this.service.listReports()
    return { items, total: items.length }
  }

  @Get(':id')
  getReport(@Param('id') id: string): ReportDefinition {
    const r = this.service.getReport(id)
    if (!r) throw new BadRequestException(`Report ${id} not found`)
    return r
  }

  @Post('create')
  createReport(@Body() body: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt'>): ReportDefinition {
    return this.service.createReport(body)
  }

  @Post('query')
  query(@Body() body: { reportId: string; period: 'daily' | 'weekly' | 'monthly' | 'custom'; from?: string; to?: string }): Promise<ReportQueryResponse> {
    return this.service.query(body)
  }

  @Post('ingest')
  ingest(@Body() body: { points: any[] }): { ingested: number } {
    this.service.ingestDataPoints(body.points)
    return { ingested: body.points.length }
  }

  @Get('aggregate/:metric/:dimension')
  aggregate(
    @Param('metric') metric: string,
    @Param('dimension') dimension: string,
  ): { metric: string; dimension: string; totals: Record<string, number> } {
    const totals = this.service.aggregateBy(metric as any, dimension)
    return { metric, dimension, totals: Object.fromEntries(totals) }
  }

  @Get('dashboard/list')
  listDashboards(@Query('ownerId') ownerId: string): { items: DashboardLayout[]; total: number } {
    const items = this.service.listDashboards(ownerId ?? 'tenant-A')
    return { items, total: items.length }
  }

  @Get('dashboard/:id')
  getDashboard(@Param('id') id: string): DashboardLayout {
    const d = this.service.getDashboard(id)
    if (!d) throw new BadRequestException(`Dashboard ${id} not found`)
    return d
  }

  @Post('dashboard/create')
  createDashboard(@Body() body: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): DashboardLayout {
    return this.service.createDashboard(body)
  }

  @Delete(':id')
  deleteReport(@Param('id') id: string): { success: boolean; id: string } {
    const deleted = this.service.deleteReport(id)
    if (!deleted) throw new BadRequestException(`Report ${id} not found`)
    return { success: true, id }
  }

  @Post('dashboard/update/:id')
  updateDashboard(
    @Param('id') id: string,
    @Body() body: Partial<DashboardLayout>,
  ): DashboardLayout {
    const d = this.service.updateDashboard(id, body)
    if (!d) throw new BadRequestException(`Dashboard ${id} not found`)
    return d
  }

  // ══════════════════════════════════════════════════════════════
  // 营收 / 客流 / 转化 专用端点 (V23 管理层报表)
  // ══════════════════════════════════════════════════════════════

  /**
   * 营收报表: 按门店维度聚合销售额 (sales.amount)
   * 管理层查看各门店营收汇总
   */
  @Get('revenue')
  revenueReport(
    @Query('period') period: ReportPeriod,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): { period: ReportPeriod; from?: string; to?: string; totals: Record<string, number> } {
    const p = period ?? 'daily'
    const totals = this.service.aggregateBy('sales.amount', 'store')
    return { period: p, from, to, totals: Object.fromEntries(totals) }
  }

  /**
   * 客流报表: 按门店维度聚合客流量 (sales.traffic)
   * 管理层查看各门店客流走势
   */
  @Get('traffic')
  trafficReport(
    @Query('period') period: ReportPeriod,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): { period: ReportPeriod; from?: string; to?: string; totals: Record<string, number> } {
    const p = period ?? 'daily'
    const totals = this.service.aggregateBy('sales.traffic', 'store')
    return { period: p, from, to, totals: Object.fromEntries(totals) }
  }

  /**
   * 转化报表: 按门店维度聚合转化率 (sales.conversion)
   * 管理层评估各门店销售转化效率
   */
  @Get('conversion')
  conversionReport(
    @Query('period') period: ReportPeriod,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): { period: ReportPeriod; from?: string; to?: string; totals: Record<string, number> } {
    const p = period ?? 'daily'
    const totals = this.service.aggregateBy('sales.conversion', 'store')
    return { period: p, from, to, totals: Object.fromEntries(totals) }
  }
}
