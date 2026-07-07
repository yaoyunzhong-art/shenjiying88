import { Module } from '@nestjs/common'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'

@Module({
  imports: [LoyaltyModule, MarketingMetricsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
