/**
 * Phase 103 多模态融合分析 Module (V11 Sprint 3 Day 40)
 */

import { Module, Global } from '@nestjs/common'
import { MultimodalFusionService } from './multimodal-fusion.service'
import { MultimodalFusionController } from './multimodal-fusion.controller'

@Global()
@Module({
  providers: [MultimodalFusionService],
  controllers: [MultimodalFusionController],
  exports: [MultimodalFusionService],
})
export class MultimodalFusionModule {}