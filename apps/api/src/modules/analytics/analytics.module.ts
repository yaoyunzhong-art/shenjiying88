import { Module } from '@nestjs/common'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'

@Module({
  imports: [LoyaltyModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
