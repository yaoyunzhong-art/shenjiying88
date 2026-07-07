// aiops.module.ts - 自动补全
import { Module } from '@nestjs/common'
import { AIOpsController } from './aiops.controller'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'

@Module({
  controllers: [AIOpsController],
  providers: [AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
  exports: [AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
})
export class AIOpsModule {}
