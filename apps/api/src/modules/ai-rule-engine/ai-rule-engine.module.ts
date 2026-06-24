import { Module } from '@nestjs/common'
import { AiRuleEngineController } from './ai-rule-engine.controller'
import { AiRuleEngineService } from './ai-rule-engine.service'

@Module({
  controllers: [AiRuleEngineController],
  providers: [AiRuleEngineService],
  exports: [AiRuleEngineService]
})
export class AiRuleEngineModule {}
