import { Module } from '@nestjs/common'
import { BrandAnalyticsController } from './brand-analytics.controller'
import { BrandAnalyticsService } from './brand-analytics.service'

@Module({
  controllers: [BrandAnalyticsController],
  providers: [BrandAnalyticsService],
  exports: [BrandAnalyticsService],
})
export class BrandAnalyticsModule {}
