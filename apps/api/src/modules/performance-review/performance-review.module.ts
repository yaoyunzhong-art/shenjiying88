import { Module } from '@nestjs/common'
import { PerformanceReviewController } from './performance-review.controller'
import { PerformanceReviewService } from './performance-review.service'

@Module({
  controllers: [PerformanceReviewController],
  providers: [PerformanceReviewService],
  exports: [PerformanceReviewService],
})
export class PerformanceReviewModule {}
