/**
 * Phase 94 智能分析 Module (V10 Sprint 2 Day 16)
 */

import { Global, Module } from '@nestjs/common'
import { InsightService } from './insight.service'
import { InsightController } from './insight.controller'
import { AiModelConfigModule } from '../ai-model-config/ai-model-config.module'

@Global()
@Module({
  imports: [AiModelConfigModule],
  providers: [InsightService],
  controllers: [InsightController],
  exports: [InsightService],
})
export class InsightModule {}
