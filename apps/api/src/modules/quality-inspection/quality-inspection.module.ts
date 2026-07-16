import { Module } from '@nestjs/common'
import { QualityInspectionController } from './quality-inspection.controller'
import { QualityInspectionService } from './quality-inspection.service'

@Module({
  controllers: [QualityInspectionController],
  providers: [QualityInspectionService],
  exports: [QualityInspectionService],
})
export class QualityInspectionModule {}
