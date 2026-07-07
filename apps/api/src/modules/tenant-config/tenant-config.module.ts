/**
 * 三级独立配置 - Module (V9 需求 4 · V10 Day 6 Phase 90)
 */

import { Module, Global } from '@nestjs/common'
import { TenantConfigController } from './tenant-config.controller'
import { TenantConfigService } from './tenant-config.service'

@Global()
@Module({
  controllers: [TenantConfigController],
  providers: [TenantConfigService],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
