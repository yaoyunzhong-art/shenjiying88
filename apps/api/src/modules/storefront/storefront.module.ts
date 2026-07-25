// storefront.module.ts · 门店 C 端模块
// Phase 2A 交易闭环硬化 · 2026-07-26

import { Module } from '@nestjs/common'
import { StoreFrontController } from './storefront.controller'
import { StoreFrontService } from './storefront.service'
import { CouponService } from './coupon.service'
import { NotificationService } from './notification.service'

@Module({
  controllers: [StoreFrontController],
  providers: [StoreFrontService, CouponService, NotificationService],
  exports: [StoreFrontService, CouponService, NotificationService],
})
export class StoreFrontModule {}
