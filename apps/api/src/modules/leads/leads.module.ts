// leads.module.ts · Phase-17 T11
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads 模块

import { Module } from '@nestjs/common';
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [MarketingMetricsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
