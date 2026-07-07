import { Module, Global } from '@nestjs/common'
import { CanaryController } from './canary.controller'
import { CanaryService } from './canary.service'

@Global()
@Module({
  controllers: [CanaryController],
  providers: [CanaryService],
  exports: [CanaryService],
})
export class CanaryModule {}
