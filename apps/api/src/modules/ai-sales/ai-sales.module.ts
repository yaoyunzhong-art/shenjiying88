import { Module } from '@nestjs/common'
import { AiSalesController } from './ai-sales.controller'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler
} from './ai-sales-copilot.service'
import { AiSalesService } from './ai-sales.service'

@Module({
  controllers: [AiSalesController],
  providers: [
    ProductRecommendationEngine,
    ObjectionHandler,
    FollowUpScheduler,
    AiSalesService,
  ],
  exports: [
    ProductRecommendationEngine,
    ObjectionHandler,
    FollowUpScheduler,
    AiSalesService,
  ]
})
export class AiSalesModule {}
