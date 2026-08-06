import { Module } from '@nestjs/common'
import { QualityController } from './quality.controller'
import { QualityService } from './quality.service'
import { QualityInspectionService } from '../quality-inspection'

@Module({
  controllers: [QualityController],
  providers: [QualityService, QualityInspectionService],
  exports: [QualityService, QualityInspectionService],
})
export class QualityModule {}
