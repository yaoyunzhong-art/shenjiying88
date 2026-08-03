/**
 * store.module.ts · 门店管理模块
 *
 * Phase 1 商店管理模块 NestJS Module
 */

import { Module } from '@nestjs/common'
import { StoreController } from './store.controller'
import { StoreService } from './store.service'

@Module({
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
