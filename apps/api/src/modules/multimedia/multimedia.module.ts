/**
 * Phase 99 多模态 Module (V11 Sprint 3 Day 31-32)
 */

import { Module, Global } from '@nestjs/common'
import { MultimediaService } from './multimedia.service'
import { MultimediaController } from './multimedia.controller'

@Global()
@Module({
  providers: [MultimediaService],
  controllers: [MultimediaController],
  exports: [MultimediaService],
})
export class MultimediaModule {}