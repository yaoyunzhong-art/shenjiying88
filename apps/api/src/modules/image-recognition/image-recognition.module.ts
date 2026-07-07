/**
 * Phase 101 图像识别 Module (V11 Sprint 3 Day 36)
 */

import { Module, Global } from '@nestjs/common'
import { ImageRecognitionService } from './image-recognition.service'
import { ImageRecognitionController } from './image-recognition.controller'

@Global()
@Module({
  providers: [ImageRecognitionService],
  controllers: [ImageRecognitionController],
  exports: [ImageRecognitionService],
})
export class ImageRecognitionModule {}