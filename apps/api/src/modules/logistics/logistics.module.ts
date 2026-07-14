import { Module } from '@nestjs/common'
import { NotificationModule } from '../notification/notification.module'
import { LogisticsController } from './logistics.controller'
import { LogisticsService } from './logistics.service'

@Module({
  imports: [NotificationModule],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService]
})
export class LogisticsModule {}
