import { Module } from '@nestjs/common'
import { AiSalesController } from './ai-sales.controller'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler
} from './ai-sales-copilot.service'

@Module({
  controllers: [AiSalesController],
  providers: [
    ProductRecommendationEngine,
    ObjectionHandler,
    FollowUpScheduler
  ],
  exports: [
    ProductRecommendationEngine,
    ObjectionHandler,
    FollowUpScheduler
  ]
})
export class AiSalesModule {}
