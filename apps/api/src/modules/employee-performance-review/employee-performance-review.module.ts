import { Module } from '@nestjs/common'
import { EmployeePerformanceReviewController } from './employee-performance-review.controller'
import { EmployeePerformanceReviewService } from './employee-performance-review.service'

@Module({
  controllers: [EmployeePerformanceReviewController],
  providers: [EmployeePerformanceReviewService],
  exports: [EmployeePerformanceReviewService],
})
export class EmployeePerformanceReviewModule {}
