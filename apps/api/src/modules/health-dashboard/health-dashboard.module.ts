// health-dashboard.module.ts - Phase-19 T35
// 用途: 健康度仪表板模块

import { Module } from '@nestjs/common';
import { HealthDashboardController } from './health-dashboard.controller';
import { HealthDashboardService } from './health-dashboard.service';
import { HealthScoreService } from './health-score.service';

@Module({
  controllers: [HealthDashboardController],
  providers: [HealthDashboardService, HealthScoreService],
  exports: [HealthDashboardService, HealthScoreService],
})
export class HealthDashboardModule {}
