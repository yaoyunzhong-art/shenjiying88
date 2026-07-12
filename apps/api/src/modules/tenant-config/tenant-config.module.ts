/**
 * 三级独立配置 - Module (V9 需求 4 · V10 Day 6 Phase 90)
 *
 * 修复历史:
 * - P0-A1: 接入 TenantConfigRepository (Prisma 持久化层)
 * - P0-A4: 去掉 @Global 装饰器 - 业务模块不应全局共享
 *   (内存 Map + 全局单例 → 多副本/多租户视图不一致)
 *   改为按需导入, 通过 TenantConfigService 显式注入使用
 */

import { Module } from '@nestjs/common'
import { TenantConfigController } from './tenant-config.controller'
import { TenantConfigCacheService } from './tenant-config-cache.service'
import { TenantConfigService } from './tenant-config.service'
import { TenantConfigRepository } from './tenant-config.repository'

@Module({
  controllers: [TenantConfigController],
  providers: [TenantConfigService, TenantConfigRepository, TenantConfigCacheService],
  exports: [TenantConfigService, TenantConfigRepository, TenantConfigCacheService],
})
export class TenantConfigModule {}
