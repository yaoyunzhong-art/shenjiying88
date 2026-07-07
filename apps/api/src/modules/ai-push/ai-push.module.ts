import { Module } from '@nestjs/common'
import { AiPushController } from './ai-push.controller'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

@Module({
  controllers: [AiPushController],
  providers: [
    PushTaskService,
    MemberSegmentationService,
    OptimalTimingService,
    ABTestService,
  ],
  exports: [
    PushTaskService,
    MemberSegmentationService,
    OptimalTimingService,
    ABTestService,
  ],
})
export class AiPushModule {}
