// campaign-performance.module.ts — Phase3 活动效果评估模块

import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { CampaignPerformanceController } from './campaign-performance.controller'
import { CampaignPerformanceService } from './campaign-performance.service'

@Module({
  imports: [PrismaModule],
  controllers: [CampaignPerformanceController],
  providers: [CampaignPerformanceService],
  exports: [CampaignPerformanceService],
})
export class CampaignPerformanceModule {}
