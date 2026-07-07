/**
 * 多系统对接 - Module (V9 需求 3 · V10 Day 5 Phase 89)
 */

import { Module, Global } from '@nestjs/common'
import { OpenApiService } from './open-api.service'
import { OpenApiController } from './open-api.controller'

@Global()
@Module({
  controllers: [OpenApiController],
  providers: [OpenApiService],
  exports: [OpenApiService],
})
export class OpenApiModule {}