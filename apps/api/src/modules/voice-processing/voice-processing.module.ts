/**
 * Phase 102 语音处理 Module (V11 Sprint 3 Day 38)
 */

import { Module, Global } from '@nestjs/common'
import { VoiceProcessingService } from './voice-processing.service'
import { VoiceProcessingController } from './voice-processing.controller'

@Global()
@Module({
  providers: [VoiceProcessingService],
  controllers: [VoiceProcessingController],
  exports: [VoiceProcessingService],
})
export class VoiceProcessingModule {}