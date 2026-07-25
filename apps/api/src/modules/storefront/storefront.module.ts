// storefront.module.ts · 门店 C 端模块
// Phase 1 核心交易闭环 · 2026-07-26
//
// 职责: 向 C 端用户暴露门店前台 API（无需登录）

import { Module } from '@nestjs/common'
import { StoreFrontController } from './storefront.controller'
import { StoreFrontService } from './storefront.service'

@Module({
  controllers: [StoreFrontController],
  providers: [StoreFrontService],
  exports: [StoreFrontService],
})
export class StoreFrontModule {}
