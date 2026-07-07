/**
 * Phase 98 CDN Cache Module (V10 Sprint 2 Day 29)
 */

import { Module, Global } from '@nestjs/common'
import { CdnCacheService } from './cdn.service'
import { CdnCacheController } from './cdn.controller'

@Global()
@Module({
  providers: [CdnCacheService],
  controllers: [CdnCacheController],
  exports: [CdnCacheService],
})
export class CdnCacheModule {}