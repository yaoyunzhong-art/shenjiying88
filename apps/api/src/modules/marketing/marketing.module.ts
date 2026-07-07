import { Module } from '@nestjs/common'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'
import { MarketingController } from './marketing.controller'
import { RFMCalculator } from './rfm-calculator'
import { ABTestEngine } from './ab-test'
import { CouponIssuer } from './coupon-issuer'
import { AttributionEngine } from './attribution'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import { RFMAdapter } from './datasources/rfm.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { ExperimentAdapter } from './datasources/experiment.adapter'
import { CouponAdapter } from './datasources/coupon.adapter'

/**
 * Phase-42 T172: MarketingModule (智能营销模块)
 *
 * 15 providers:
 *  - 5 adapters (rfm / member / order / experiment / coupon)
 *  - 4 engines (rfm-calc / ab-test / coupon-issuer / attribution)
 *  - 4 services (segment / freq-cap / roi / channel-router)
 *  - 1 controller
 */
@Module({
  imports: [MarketingMetricsModule],
  controllers: [MarketingController],
  providers: [
    // 5 adapters
    RFMAdapter,
    MemberAdapter,
    OrderAdapter,
    ExperimentAdapter,
    CouponAdapter,
    // 4 engines
    RFMCalculator,
    ABTestEngine,
    CouponIssuer,
    AttributionEngine,
    // 4 services
    SegmentService,
    FrequencyCapService,
    ROICalculator,
    ChannelRouter,
    MarketingController
  ],
  exports: [
    RFMCalculator,
    ABTestEngine,
    CouponIssuer,
    AttributionEngine,
    SegmentService,
    FrequencyCapService,
    ROICalculator,
    ChannelRouter
  ]
})
export class MarketingModule {}
