// referral.module.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral 模块

import { Module } from '@nestjs/common';
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

@Module({
  imports: [MarketingMetricsModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
