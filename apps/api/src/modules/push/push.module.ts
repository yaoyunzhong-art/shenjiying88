import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PushController } from './push.controller'
import {
  APNsService,
  PushNotificationScheduler,
  WebSocketService
} from './push.service'
import { PushRecordEntity } from './push.entity'
import { DndConfigService, FrequencyCapService } from './dnd-config'
import { EmailPushChannel, SmsPushChannel, DualChannelRouter } from './channels'
import { PushPriorityGuard } from './push-priority.guard'

@Module({
  imports: [TypeOrmModule.forFeature([PushRecordEntity])],
  controllers: [PushController],
  providers: [
    // 原服务
    APNsService,
    WebSocketService,
    PushNotificationScheduler,
    // WP-13A 新增: 推送分级
    PushPriorityGuard,
    // WP-13A 新增: 免打扰 & 频控
    DndConfigService,
    FrequencyCapService,
    // WP-13A 新增: 双通道
    EmailPushChannel,
    SmsPushChannel,
    DualChannelRouter,
  ],
  exports: [
    APNsService,
    WebSocketService,
    PushNotificationScheduler,
    // WP-13A
    DndConfigService,
    FrequencyCapService,
    DualChannelRouter,
    EmailPushChannel,
    SmsPushChannel,
  ]
})
export class PushModule {}
