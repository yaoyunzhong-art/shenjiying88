// marketing-metrics.module.ts - Phase-17 T12
// 用途: 营销指标模块定义
import { Module } from '@nestjs/common';
import { MarketingMetricsController } from './marketing-metrics.controller';
import { MarketingMetricsService } from './marketing-metrics.service';

@Module({
  controllers: [MarketingMetricsController],
  providers: [MarketingMetricsService],
  exports: [MarketingMetricsService],
})
export class MarketingMetricsModule {}
