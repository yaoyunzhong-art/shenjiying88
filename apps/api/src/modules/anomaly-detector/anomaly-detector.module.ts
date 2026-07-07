// anomaly-detector.module.ts - Phase-19 T26
import { Module } from '@nestjs/common'
import { AnomalyDetectorController } from './anomaly-detector.controller'
import { AnomalyDetectorService } from './anomaly-detector.service'

@Module({
  controllers: [AnomalyDetectorController],
  providers: [AnomalyDetectorService],
  exports: [AnomalyDetectorService],
})
export class AnomalyDetectorModule {}
