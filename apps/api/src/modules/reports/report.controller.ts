import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  type ReportDefinition,
  type CreateReportDefinitionInput,
  type UpdateReportDefinitionInput,
  type QueryReportInput,
  type ReportExportInput,
  type ReportType
} from './reports.entity'
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'
import { RevenueReportService } from './reports/revenue-report.service'
import { InventoryTurnoverService } from './reports/inventory-turnover.service'
import { MemberGrowthService } from './reports/member-growth.service'
import { RefundRateService } from './reports/refund-rate.service'
import { OrderConversionService } from './reports/order-conversion.service'
import { ProductRankingService } from './reports/product-ranking.service'
import { PaymentMixService } from './reports/payment-mix.service'
import { HourlyHeatmapService } from './reports/hourly-heatmap.service'
import { ChannelFunnelService } from './reports/channel-funnel.service'
import { InventoryAlertService } from './reports/inventory-alert.service'
import { TenantGuard } from '../agent/tenant.guard'

/**
 * Phase-39 T169: 报表中心 Controller
 *
 * 路由:
 *  - GET  /api/reports/revenue?tenantId&from&to
 *  - GET  /api/reports/inventory?tenantId&from&to
 *  - GET  /api/reports/member?tenantId&from&to
 *  - GET  /api/reports/refund?tenantId&from&to
 *  - GET  /api/reports/order?tenantId&from&to
 *  - GET  /api/reports/product-ranking?tenantId&from&to&topN
 *  - GET  /api/reports/payment-mix?tenantId&from&to
 *  - GET  /api/reports/hourly-heatmap?tenantId&from&to
 *  - GET  /api/reports/channel-funnel?tenantId&from&to
 *  - GET  /api/reports/inventory-alert?tenantId
 *  - GET  /api/reports/definitions?tenantId
 *  - POST /api/reports/definitions
 *  - GET  /api/reports/definitions/:id?tenantId
 *  - PUT  /api/reports/definitions/:id?tenantId
 *  - DELETE /api/reports/definitions/:id?tenantId
 *  - GET  /api/reports/export?type&format&tenantId&from&to
 *  - POST /api/reports/cache/invalidate
 */

interface QueryParams {
  tenantId?: string
  from?: string
  to?: string
  topN?: string
  offset?: string
  limit?: string
  format?: 'csv' | 'json' | 'html'
  type?: ReportType
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  noCache?: string
}

@Controller('api/reports')
@UseGuards(TenantGuard)
export class ReportController {
  private definitions = new Map<string, ReportDefinition>()

  constructor(
    private readonly agg: ReportAggregationService,
    private readonly cache: ReportCacheService,
    private readonly exportSvc: ReportExportService,
    private readonly querySvc: ReportQueryService,
    private readonly revenue: RevenueReportService,
    private readonly inventoryTurnover: InventoryTurnoverService,
    private readonly memberGrowth: MemberGrowthService,
    private readonly refundRate: RefundRateService,
    private readonly orderConversion: OrderConversionService,
    private readonly productRanking: ProductRankingService,
    private readonly paymentMix: PaymentMixService,
    private readonly hourlyHeatmap: HourlyHeatmapService,
    private readonly channelFunnel: ChannelFunnelService,
    private readonly inventoryAlert: InventoryAlertService
  ) {}

  // ─── 10 个内置报表 ──────────────────────────────────────

  @Get('revenue')
  revenueReport(@Query() q: QueryParams) {
    return this.revenue.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('inventory')
  inventoryReport(@Query() q: QueryParams) {
    return this.inventoryTurnover.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('member')
  memberReport(@Query() q: QueryParams) {
    return this.memberGrowth.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('refund')
  refundReport(@Query() q: QueryParams) {
    return this.refundRate.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('order')
  orderReport(@Query() q: QueryParams) {
    return this.orderConversion.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('product-ranking')
  productRankingReport(@Query() q: QueryParams) {
    return this.productRanking.generate(q.tenantId!, q.from!, q.to!, parseInt(q.topN ?? '10', 10))
  }

  @Get('payment-mix')
  paymentMixReport(@Query() q: QueryParams) {
    return this.paymentMix.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('hourly-heatmap')
  hourlyHeatmapReport(@Query() q: QueryParams) {
    return this.hourlyHeatmap.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('channel-funnel')
  channelFunnelReport(@Query() q: QueryParams) {
    return this.channelFunnel.generate(q.tenantId!, q.from!, q.to!)
  }

  @Get('inventory-alert')
  inventoryAlertReport(@Query() q: QueryParams) {
    return this.inventoryAlert.generate(q.tenantId!)
  }

  // ─── 报表定义 CRUD ──────────────────────────────────────

  @Post('definitions')
  @HttpCode(HttpStatus.CREATED)
  createDefinition(@Body() input: CreateReportDefinitionInput): ReportDefinition {
    const now = new Date().toISOString()
    const def: ReportDefinition = {
      id: `rdef-${randomUUID()}`,
      ...input,
      version: 1,
      createdAt: now,
      updatedAt: now
    }
    this.definitions.set(def.id, def)
    return def
  }

  @Get('definitions')
  listDefinitions(@Query() q: QueryParams) {
    const all = Array.from(this.definitions.values()).filter(d => d.tenantId === q.tenantId)
    return { total: all.length, items: all }
  }

  @Get('definitions/:id')
  getDefinition(@Param('id') id: string, @Query() q: QueryParams): ReportDefinition | null {
    const def = this.definitions.get(id)
    if (!def || def.tenantId !== q.tenantId) return null
    return def
  }

  @Put('definitions/:id')
  updateDefinition(
    @Param('id') id: string,
    @Query() q: QueryParams & { version?: string },
    @Body() patch: UpdateReportDefinitionInput
  ): ReportDefinition {
    const def = this.definitions.get(id)
    if (!def || def.tenantId !== q.tenantId) throw new Error('definition not found')
    const version = parseInt(q.version ?? '0', 10)
    if (def.version !== version) throw new Error('version mismatch')
    if (patch.name !== undefined) def.name = patch.name
    if (patch.dimensions !== undefined) def.dimensions = patch.dimensions
    if (patch.metrics !== undefined) def.metrics = patch.metrics
    if (patch.filters !== undefined) def.filters = patch.filters
    if (patch.schedule !== undefined) def.schedule = patch.schedule
    if (patch.subscribers !== undefined) def.subscribers = patch.subscribers
    def.version++
    def.updatedAt = new Date().toISOString()
    return def
  }

  @Delete('definitions/:id')
  deleteDefinition(@Param('id') id: string, @Query() q: QueryParams) {
    const def = this.definitions.get(id)
    if (!def || def.tenantId !== q.tenantId) return { deleted: false }
    this.definitions.delete(id)
    return { deleted: true }
  }

  // ─── 导出 ──────────────────────────────────────────────

  @Get('export')
  async exportReport(@Query() q: QueryParams) {
    const fmt = q.format ?? 'csv'
    const result = await this.generateReportResult(q)
    const content = fmt === 'csv' ? this.exportSvc.toCSV(result)
      : fmt === 'json' ? this.exportSvc.toJSON(result)
      : this.exportSvc.toHTML(result)
    return {
      filename: this.exportSvc.filename(result, fmt),
      format: fmt,
      size: content.length,
      content
    }
  }

  @Post('exports')
  @HttpCode(HttpStatus.ACCEPTED)
  async createBatchExportTask(@Body() body: QueryParams) {
    this.validateBatchExportRequest(body)
    const format = this.normalizeBatchExportFormat(body.format)
    const result = await this.generateReportResult(body)

    return this.exportSvc.createBatchExportTaskFromResult({
      tenantId: body.tenantId!,
      type: body.type!,
      period: {
        from: body.from!,
        to: body.to!,
      },
      format,
    }, result)
  }

  @Get('exports')
  listBatchExportTasks(@Query() q: QueryParams) {
    if (!q.tenantId) {
      return { total: 0, items: [], offset: 0, limit: 0 }
    }

    const offset = Math.max(parseInt(q.offset ?? '0', 10) || 0, 0)
    const limit = q.limit ? Math.min(Math.max(parseInt(q.limit, 10) || 0, 0), 100) : undefined
    const allItems = this.exportSvc.listExportTasks(q.tenantId, {
      status: q.status,
      type: q.type,
      format: q.format,
    })
    const items = limit !== undefined
      ? allItems.slice(offset, offset + limit)
      : allItems.slice(offset)

    return {
      total: allItems.length,
      items,
      offset,
      limit: limit ?? allItems.length,
    }
  }

  @Get('exports/:taskId')
  getBatchExportTask(@Param('taskId') taskId: string, @Query() q: QueryParams) {
    if (!q.tenantId) return null
    return this.exportSvc.getExportTask(taskId, q.tenantId) ?? null
  }

  @Delete('exports/:taskId')
  deleteBatchExportTask(@Param('taskId') taskId: string, @Query() q: QueryParams) {
    if (!q.tenantId) {
      return { deleted: false }
    }

    return { deleted: this.exportSvc.deleteExportTask(taskId, q.tenantId) }
  }

  @Get('exports/:taskId/download')
  downloadBatchExportTask(@Param('taskId') taskId: string, @Query() q: QueryParams) {
    if (!q.tenantId) return null
    return this.exportSvc.getDownloadPayload(taskId, q.tenantId) ?? null
  }

  // ─── 缓存管理 ──────────────────────────────────────────

  @Post('cache/invalidate')
  invalidateCache(@Body() body: { tenantId: string; type?: ReportType }) {
    const count = this.cache.invalidate(body.tenantId, body.type)
    return { invalidated: count }
  }

  @Get('cache/stats')
  cacheStats() {
    return this.cache.stats()
  }

  private async generateReportResult(q: QueryParams) {
    const tenantId = q.tenantId!
    const type = q.type!

    switch (type) {
      case 'revenue': return this.revenue.generate(tenantId, q.from!, q.to!)
      case 'inventory': return this.inventoryTurnover.generate(tenantId, q.from!, q.to!)
      case 'member': return this.memberGrowth.generate(tenantId, q.from!, q.to!)
      case 'refund': return this.refundRate.generate(tenantId, q.from!, q.to!)
      case 'order': return this.orderConversion.generate(tenantId, q.from!, q.to!)
      case 'product-ranking': return this.productRanking.generate(tenantId, q.from!, q.to!, parseInt(q.topN ?? '10', 10))
      case 'payment-mix': return this.paymentMix.generate(tenantId, q.from!, q.to!)
      case 'hourly-heatmap': return this.hourlyHeatmap.generate(tenantId, q.from!, q.to!)
      case 'channel-funnel': return this.channelFunnel.generate(tenantId, q.from!, q.to!)
      case 'inventory-alert': return this.inventoryAlert.generate(tenantId)
      default: throw new Error(`unknown report type ${type}`)
    }
  }

  private validateBatchExportRequest(q: QueryParams): void {
    if (!q.tenantId) {
      throw new BadRequestException('tenantId is required')
    }
    if (!q.type) {
      throw new BadRequestException('type is required')
    }
    if (!q.from) {
      throw new BadRequestException('from is required')
    }
    if (!q.to) {
      throw new BadRequestException('to is required')
    }
  }

  private normalizeBatchExportFormat(format?: string): 'csv' | 'json' | 'html' {
    const normalized = format ?? 'csv'
    if (normalized === 'csv' || normalized === 'json' || normalized === 'html') {
      return normalized
    }
    throw new BadRequestException(`Unsupported batch export format: ${normalized}`)
  }
}
