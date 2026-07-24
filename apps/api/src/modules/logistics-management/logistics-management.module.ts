import { Module } from '@nestjs/common'
import { LogisticsManagementController } from './logistics-management.controller'
import { LogisticsManagementService } from './logistics-management.service'

@Module({
  controllers: [LogisticsManagementController],
  providers: [LogisticsManagementService],
  exports: [LogisticsManagementService],
})
export class LogisticsManagementModule {}
