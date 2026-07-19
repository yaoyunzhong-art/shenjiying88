/**
 * reports.service.ts — Reports Service (canonical name)
 *
 * 报表模块入口。
 * 统一导出报表查询 & 导出的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   ReportService            报表查询 & 主服务
 *   ReportAggregationService 聚合计算服务
 *   ReportCacheService       报表缓存服务 (Redis)
 *   ReportExportService      报表导出 (CSV/JSON/HTML)
 *   ReportQueryService       查询构建 & 筛选
 *
 * 实体类型 ─────────────────────
 *   ReportType              营收/库存/会员/退款/订单/排行/热力图/漏斗/预警
 *   ReportPeriod             日/周/月/年
 *   AggregationFn            聚合函数
 *   FilterOp                 筛选操作符
 *   ReportDimension          维度定义
 *   ReportMetric             度量定义
 *   ReportFilter             筛选条件
 *   ReportFilterGroup        嵌套 AND/OR 条件
 *   ReportDefinition         报表定义元数据
 *   ReportRow                结果行
 *   ReportResult             查询结果 (含 columns/rows/period)
 *
 * 输入类型 ─────────────────────
 *   CreateReportDefinitionInput 创建定义
 *   UpdateReportDefinitionInput 更新定义
 *   QueryReportInput             查询参数
 *   ReportExportInput            导出参数
 *
 * DTO 类型 ─────────────────────
 *   ReportFilterDto / ReportFilterGroupDto / ReportDimensionDto
 *   ReportMetricDto / QueryReportDto / CreateReportDefinitionDto
 *   UpdateReportDefinitionDto / ExportReportDto / InvalidateCacheDto
 *
 * 数据源适配器 ─────────────────
 *   OrderAdapter / PaymentAdapter / InventoryAdapter
 *   RefundAdapter / MemberAdapter
 *
 * 子报表服务 ──────────────────
 *   RevenueReportService / OrderConversionService
 *   RefundRateService / InventoryTurnoverService
 *   ProductRankingService / MemberGrowthService
 *   PaymentMixService / ChannelFunnelService
 *   HourlyHeatmapService / InventoryAlertService
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { ReportService, ReportResult, ReportType } from './reports.service'
 *   const svc = app.get(ReportService)
 *   const result = svc.queryReport(tenantId, 'revenue', { from, to })
 *
 * @module Reports
 */

export { ReportService } from './report.service'
export { ReportAggregationService } from './report-aggregation.service'
export { ReportCacheService } from './report-cache.service'
export { ReportExportService } from './report-export.service'
export { ReportQueryService } from './report-query.service'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  ReportType,
  ReportPeriod,
  AggregationFn,
  FilterOp,
  ReportDimension,
  ReportMetric,
  ReportFilter,
  ReportFilterGroup,
  ReportDefinition,
  ReportRow,
  ReportResult,
  CreateReportDefinitionInput,
  UpdateReportDefinitionInput,
  QueryReportInput,
  ReportExportInput,
} from './reports.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export type {
  FilterOp as DtoFilterOp,
  ReportType as DtoReportType,
  ReportPeriod as DtoReportPeriod,
  AggregationFn as DtoAggregationFn,
  ExportFormat,
} from './report.dto'
export {
  ReportFilterDto,
  ReportFilterGroupDto,
  ReportDimensionDto,
  ReportMetricDto,
  QueryReportDto,
  CreateReportDefinitionDto,
  UpdateReportDefinitionDto,
  ExportReportDto,
  InvalidateCacheDto,
} from './report.dto'

// ─── 数据源适配器 ──────────────────────────────────────────────────────────
import { OrderAdapter } from './datasources/order.adapter'
import { PaymentAdapter } from './datasources/payment.adapter'
import { InventoryAdapter } from './datasources/inventory.adapter'
import { RefundAdapter } from './datasources/refund.adapter'
import { MemberAdapter } from './datasources/member.adapter'
export { OrderAdapter, PaymentAdapter, InventoryAdapter, RefundAdapter, MemberAdapter }

// ─── 子报表服务 ────────────────────────────────────────────────────────────
export { RevenueReportService } from './reports/revenue-report.service'
export { OrderConversionService } from './reports/order-conversion.service'
export { RefundRateService } from './reports/refund-rate.service'
export { InventoryTurnoverService } from './reports/inventory-turnover.service'
export { ProductRankingService } from './reports/product-ranking.service'
export { MemberGrowthService } from './reports/member-growth.service'
export { PaymentMixService } from './reports/payment-mix.service'
export { ChannelFunnelService } from './reports/channel-funnel.service'
export { HourlyHeatmapService } from './reports/hourly-heatmap.service'
export { InventoryAlertService } from './reports/inventory-alert.service'

// ─── 报表常量 ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 1000
export const CACHE_TTL_MS = 300_000 // 5 min
