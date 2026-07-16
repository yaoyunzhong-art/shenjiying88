import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { EquipmentFaultReportController } from './equipment-fault-report.controller'
import { EquipmentFaultReportService } from './equipment-fault-report.service'

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentFaultReportController],
  providers: [EquipmentFaultReportService],
  exports: [EquipmentFaultReportService],
})
export class EquipmentFaultReportModule {}
