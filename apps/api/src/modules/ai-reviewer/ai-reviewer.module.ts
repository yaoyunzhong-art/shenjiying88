import { Module } from '@nestjs/common'
import { AIReviewerController } from './ai-reviewer.controller'
import { AIReviewerService } from './ai-reviewer.service'

@Module({
  controllers: [AIReviewerController],
  providers: [AIReviewerService],
  exports: [AIReviewerService],
})
export class AIReviewerModule {}
