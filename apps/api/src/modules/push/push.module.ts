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
import { PushPreferenceService } from './push-preference.service'
import { PushStatsService } from './push-stats.service'

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
    // WP-13B 新增: C端便捷化 (BS-0164~BS-0167)
    PushPreferenceService,
    // WP-13B 新增: 效果回传 (BS-0185~BS-0188)
    PushStatsService,
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
    // WP-13B
    PushPreferenceService,
    PushStatsService,
  ]
})
export class PushModule {}
