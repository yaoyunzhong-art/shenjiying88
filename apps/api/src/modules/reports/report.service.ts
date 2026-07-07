import { Injectable, Logger } from '@nestjs/common'
import {
  type ReportType,
  type ReportResult,
  type ReportDefinition,
  type QueryReportInput,
  type CreateReportDefinitionInput,
  type UpdateReportDefinitionInput,
  type ReportRow,
  type ReportDimension,
  type ReportMetric,
  type AggregationFn
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
import { randomUUID } from 'node:crypto'

/**
 * Phase-39 T169: ReportService - 报表业务编排
 *
 * 职责:
 *  - 根据 QueryReportInput 调度对应报表服务
 *  - 内置报表定义的 CRUD 管理（替代 controller 中的 Map）
 *  - 缓存穿透逻辑
 *  - 多租户数据隔离
 */
@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name)
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

  /**
   * 执行报表查询 - 按 type 路由到对应具体服务
   */
  async query(input: QueryReportInput): Promise<ReportResult> {
    const { tenantId, type, from, to, noCache } = input

    // 优先走缓存
    if (!noCache) {
      const cacheKey = this.cache.fingerprint({ tenantId, type, from, to })
      const cached = this.cache.get(cacheKey)
      if (cached) return cached
    }

    let result: ReportResult
    switch (type) {
      case 'revenue':
        result = await this.revenue.generate(tenantId, from, to)
        break
      case 'inventory':
        result = await this.inventoryTurnover.generate(tenantId, from, to)
        break
      case 'member':
        result = await this.memberGrowth.generate(tenantId, from, to)
        break
      case 'refund':
        result = await this.refundRate.generate(tenantId, from, to)
        break
      case 'order':
        result = await this.orderConversion.generate(tenantId, from, to)
        break
      case 'product-ranking':
        result = await this.productRanking.generate(tenantId, from, to, 10)
        break
      case 'payment-mix':
        result = await this.paymentMix.generate(tenantId, from, to)
        break
      case 'hourly-heatmap':
        result = await this.hourlyHeatmap.generate(tenantId, from, to)
        break
      case 'channel-funnel':
        result = await this.channelFunnel.generate(tenantId, from, to)
        break
      case 'inventory-alert':
        result = await this.inventoryAlert.generate(tenantId)
        break
      default: {
        // 如果未命中内置类型, 尝试按自定义定义查询
        const def = Array.from(this.definitions.values()).find(d => d.type === type && d.tenantId === tenantId)
        if (!def) {
          throw new Error(`unknown report type: ${type}`)
        }
        result = await this.queryByDefinition(tenantId, def, from, to)
      }
    }

    // 写入缓存 (非告警类报表)
    if (type !== 'inventory-alert') {
      const cacheKey = this.cache.fingerprint({ tenantId, type, from, to })
      this.cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * 根据自定义报表定义查询
   */
  private async queryByDefinition(
    tenantId: string,
    def: ReportDefinition,
    from: string,
    to: string
  ): Promise<ReportResult> {
    this.logger.debug(`queryByDefinition: ${def.id} tenant=${tenantId}`)
    // 实际实现应从数据源按 dimensions + metrics + filters 聚合
    // 此处简化为调用聚合服务占位
    const rows: ReportRow[] = []
    const columns = [
      ...def.dimensions.map(d => ({ field: d.field, alias: d.alias ?? d.field, type: 'dimension' as const })),
      ...def.metrics.map(m => ({ field: m.field, alias: m.alias, type: 'metric' as const }))
    ]
    return {
      type: def.type,
      tenantId,
      period: { from, to },
      columns,
      rows,
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }

  // ─── 报表定义 CRUD ──────────────────────────────────────

  createDefinition(input: CreateReportDefinitionInput): ReportDefinition {
    const now = new Date().toISOString()
    const def: ReportDefinition = {
      id: `rdef-${randomUUID()}`,
      ...input,
      version: 1,
      createdAt: now,
      updatedAt: now
    }
    this.definitions.set(def.id, def)
    this.logger.log(`created report definition: ${def.id} type=${def.type}`)
    return def
  }

  listDefinitions(tenantId: string) {
    const all = Array.from(this.definitions.values()).filter(d => d.tenantId === tenantId)
    return { total: all.length, items: all }
  }

  getDefinition(id: string, tenantId: string): ReportDefinition | null {
    const def = this.definitions.get(id)
    if (!def || def.tenantId !== tenantId) return null
    return def
  }

  updateDefinition(id: string, tenantId: string, version: number, patch: UpdateReportDefinitionInput): ReportDefinition {
    const def = this.definitions.get(id)
    if (!def || def.tenantId !== tenantId) {
      throw new Error('definition not found')
    }
    if (def.version !== version) {
      throw new Error('version mismatch')
    }
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

  deleteDefinition(id: string, tenantId: string): boolean {
    const def = this.definitions.get(id)
    if (!def || def.tenantId !== tenantId) return false
    this.definitions.delete(id)
    return true
  }

  // ─── 导出 ──────────────────────────────────────────────

  async export(input: {
    tenantId: string
    type: ReportType
    format: 'csv' | 'json' | 'html'
    from: string
    to: string
    topN?: string
  }) {
    const { tenantId, type, format, from, to } = input
    const result = await this.query({ tenantId, type, from, to })
    const content = format === 'csv'
      ? this.exportSvc.toCSV(result)
      : format === 'json'
        ? this.exportSvc.toJSON(result)
        : this.exportSvc.toHTML(result)
    return {
      filename: this.exportSvc.filename(result, format),
      format,
      size: content.length,
      content
    }
  }

  // ─── 缓存管理 ──────────────────────────────────────────

  invalidateCache(tenantId: string, type?: ReportType) {
    return this.cache.invalidate(tenantId, type)
  }

  cacheStats() {
    return this.cache.stats()
  }
}
