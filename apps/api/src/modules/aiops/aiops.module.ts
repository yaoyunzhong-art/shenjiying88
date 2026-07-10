// aiops.module.ts - 自动补全
import { Module } from '@nestjs/common'
import { AIOpsController } from './aiops.controller'
import { AIOpsService } from './aiops.service'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'

@Module({
  controllers: [AIOpsController],
  providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
  exports: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
})
export class AIOpsModule {}
