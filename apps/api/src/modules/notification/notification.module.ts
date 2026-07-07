import { Module } from '@nestjs/common'
import { MetricsModule } from '../observability/metrics.module'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'

@Module({
  imports: [MetricsModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {}
