import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PushController } from './push.controller'
import {
  APNsService,
  PushNotificationScheduler,
  WebSocketService
} from './push.service'
import { PushRecordEntity } from './push.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PushRecordEntity])],
  controllers: [PushController],
  providers: [APNsService, WebSocketService, PushNotificationScheduler],
  exports: [APNsService, WebSocketService, PushNotificationScheduler]
})
export class PushModule {}
