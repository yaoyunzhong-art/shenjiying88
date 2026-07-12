/**
 * 三级独立配置 - Module (V9 需求 4 · V10 Day 6 Phase 90)
 *
 * P0-A1 零持久化修复: 新增 TenantConfigRepository 作为 provider
 * (Prisma 持久化层, 配置实例和审计日志双写 DB)
 */

import { Module, Global } from '@nestjs/common'
import { TenantConfigController } from './tenant-config.controller'
import { TenantConfigService } from './tenant-config.service'
import { TenantConfigRepository } from './tenant-config.repository'

@Global()
@Module({
  controllers: [TenantConfigController],
  providers: [TenantConfigService, TenantConfigRepository],
  exports: [TenantConfigService, TenantConfigRepository],
})
export class TenantConfigModule {}
