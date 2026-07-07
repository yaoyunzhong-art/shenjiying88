import { Module } from '@nestjs/common'
import { PushController } from './push.controller'
import {
  APNsService,
  PushNotificationScheduler,
  WebSocketService
} from './push.service'

@Module({
  controllers: [PushController],
  providers: [APNsService, WebSocketService, PushNotificationScheduler],
  exports: [APNsService, WebSocketService, PushNotificationScheduler]
})
export class PushModule {}
