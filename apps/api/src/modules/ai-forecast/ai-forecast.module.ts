import { Module } from '@nestjs/common'
import { AiForecastController } from './ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'

@Module({
  controllers: [AiForecastController],
  providers: [
    DemandForecastService,
    InventoryOptimizer,
    TransferRecommendationService
  ],
  exports: [
    DemandForecastService,
    InventoryOptimizer,
    TransferRecommendationService
  ]
})
export class AiForecastModule {}
