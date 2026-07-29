// referral.module.ts · 2026-07-26 全端审计对齐 I-1
// 变更: 统一 Referral 体系 → 旧 controller 调用 storefront ReferralTrackingService (Prisma)
// 原因: 旧 ReferralService 使用 Map 内存存储，重启即丢失

import { Module } from '@nestjs/common';
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module';
import { StoreFrontModule } from '../storefront/storefront.module';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

@Module({
  imports: [MarketingMetricsModule, StoreFrontModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
