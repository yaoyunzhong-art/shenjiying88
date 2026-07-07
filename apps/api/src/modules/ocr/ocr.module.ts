/**
 * Phase 100 OCR + 文档解析 Module (V11 Sprint 3 Day 33)
 */

import { Module, Global } from '@nestjs/common'
import { OcrService } from './ocr.service'
import { OcrController } from './ocr.controller'

@Global()
@Module({
  providers: [OcrService],
  controllers: [OcrController],
  exports: [OcrService],
})
export class OcrModule {}