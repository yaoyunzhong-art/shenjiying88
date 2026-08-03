import { Module } from '@nestjs/common'
import { LogisticsManagementController } from './logistics-management.controller'
import { LogisticsManagementService } from './logistics-management.service'
import { LogisticsManagementPrismaStore } from './logistics-management.prisma-store'


@Module({
  controllers: [LogisticsManagementController],
  providers: [LogisticsManagementService, LogisticsManagementPrismaStore],
  exports: [LogisticsManagementService, LogisticsManagementPrismaStore],
})
export class LogisticsManagementModule {}
