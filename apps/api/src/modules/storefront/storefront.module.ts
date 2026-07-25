// storefront.module.ts · 门店 C 端模块
// Phase 2B 社媒增长引擎 · 2026-07-26

import { Module } from '@nestjs/common'
import { StoreFrontController } from './storefront.controller'
import { StoreFrontService } from './storefront.service'
import { CouponService } from './coupon.service'
import { NotificationService } from './notification.service'
import { ReferralTrackingService } from './referral-tracking.service'

@Module({
  controllers: [StoreFrontController],
  providers: [StoreFrontService, CouponService, NotificationService, ReferralTrackingService],
  exports: [StoreFrontService, CouponService, NotificationService, ReferralTrackingService],
})
export class StoreFrontModule {}
