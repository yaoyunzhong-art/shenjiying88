/**
 * 报表/看板 - Controller (V10 Day 7 Phase 91)
 */

import {
  Controller, Get, Post, Body, Param, Query, BadRequestException,
} from '@nestjs/common'
import { ReportService } from './report.service'
import type {
  ReportDefinition, ReportQueryResponse, DashboardLayout,
} from './report.entity'

@Controller('report')
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

  @Post('dashboard/update/:id')
  updateDashboard(
    @Param('id') id: string,
    @Body() body: Partial<DashboardLayout>,
  ): DashboardLayout {
    const d = this.service.updateDashboard(id, body)
    if (!d) throw new BadRequestException(`Dashboard ${id} not found`)
    return d
  }
}
