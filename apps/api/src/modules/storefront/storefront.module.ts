// storefront.module.ts · TOC 单店聚合模块
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 【能力对齐原则】
// 不重复造轮子 —— TOC 的 storefront 模块是已有系统的 C 端聚合入口
// 
// 已有系统 → TOC 调用关系:
//   cashier/ → 收银台 (下单/支付/退款)
//   coupon/ → 优惠券 (创建/发放/核销) — 已有完整30文件
//   push/   → 推送通知 (多通道P0-P3) — 已有完整31文件
//   queue/  → 排队取号 (双模引擎)   — 已有完整21文件
//   member/ → 会员体系 (等级/积分/成长值) — 已有完整55文件
//   marketing/ → 营销归因/频控/AB测试  — 已有完整28文件
//
// TOC storefront 新增:
//   StoreFrontController — C端单店聚合 API (预约/改期/核销)
//   StoreFrontService     — 单店逻辑 (门店信息/项目/时段)
//   ReferralTrackingService — 全员营销推广追踪 (推广码/归因/佣金/KOL)
//
// 已删除的重叠代码:
//   ~~coupon.service.ts~~ → 改用 coupon/ 模块
//   ~~notification.service.ts~~ → 改用 push/ 模块

import { Module } from '@nestjs/common'
import { StoreFrontController } from './storefront.controller'
import { StoreFrontService } from './storefront.service'
import { ReferralTrackingService } from './referral-tracking.service'

// 已有系统模块 — TOC 聚合入口直接注入
import { PrismaModule } from '../../prisma/prisma.module'
import { CashierModule } from '../cashier/cashier.module'
import { CouponModule } from '../coupon/coupon.module'
import { PushModule } from '../push/push.module'
import { QueueModule } from '../queue/queue.module'
import { MemberModule } from '../member/member.module'
import { MarketingModule } from '../marketing/marketing.module'

@Module({
  imports: [
    PrismaModule,     // DB 持久化
    CashierModule,    // 收银支付 (createOrder/processPayment/refund)
    CouponModule,     // 优惠券   (create/redeem/validate)
    PushModule,       // 推送通知 (sendPush/schedule/WS)
    QueueModule,      // 排队取号 (join/getStatus/next)
    MemberModule,     // 会员体系 (points/tier/growth)
    MarketingModule,  // 营销归因 (attribution/RFM/coupon-issue)
  ],
  controllers: [StoreFrontController],
  providers: [StoreFrontService, ReferralTrackingService],
  exports: [StoreFrontService, ReferralTrackingService],
})
export class StoreFrontModule {}
