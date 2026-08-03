import { Module } from '@nestjs/common'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'
import { OrderAdapter } from './datasources/order.adapter'
import { PaymentAdapter } from './datasources/payment.adapter'
import { RefundAdapter } from './datasources/refund.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { InventoryAdapter } from './datasources/inventory.adapter'
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
import { GovernanceApprovalModule } from '../foundation/governance-approval/governance-approval.module'

/**
 * Phase-39 T169: ReportModule - BI 多维分析
 *
 * 依赖 18 个 provider:
 *  - 4 核心: Aggregation / Cache / Export / Query
 *  - 5 Adapter: Order / Payment / Refund / Member / Inventory
 *  - 10 Report: 营收/库存/会员/退款/订单/商品/支付/时段/渠道/预警
 *
 * 路由前缀: /api/reports/* (与 /api/analytics/* 不冲突)
 */

@Module({
  imports: [GovernanceApprovalModule],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportAggregationService,
    ReportCacheService,
    ReportExportService,
    ReportQueryService,
    OrderAdapter,
    PaymentAdapter,
    RefundAdapter,
    MemberAdapter,
    InventoryAdapter,
    RevenueReportService,
    InventoryTurnoverService,
    MemberGrowthService,
    RefundRateService,
    OrderConversionService,
    ProductRankingService,
    PaymentMixService,
    HourlyHeatmapService,
    ChannelFunnelService,
    InventoryAlertService
  ],
  exports: [
    ReportService,
    ReportAggregationService,
    ReportCacheService,
    ReportExportService,
    ReportQueryService
  ]
})
export class ReportModule {}
