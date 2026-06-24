import { Module } from '@nestjs/common'
import { AiInsightController } from './ai-insight.controller'
import { AiInsightService } from './ai-insight.service'

@Module({
  controllers: [AiInsightController],
  providers: [AiInsightService],
  exports: [AiInsightService]
})
export class AiInsightModule {}
