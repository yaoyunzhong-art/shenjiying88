import { Module } from '@nestjs/common'
import { AiRecommendController } from './ai-recommend.controller'
import { AiRecommendService } from './ai-recommend.service'

@Module({
  controllers: [AiRecommendController],
  providers: [AiRecommendService],
  exports: [AiRecommendService]
})
export class AiRecommendModule {}
