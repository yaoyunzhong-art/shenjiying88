/**
 * 边缘计算 - Module
 *
 * 集成:
 * - 边缘节点管理 (EdgeNodeService)
 * - 离线排队服务 (OfflineTicketService)
 * - 时间同步服务 (TimeSyncService)
 * - 边缘 AI 推理 (EdgeInferenceService, OfflineRecognitionService)
 * - 模型缓存 (EdgeModelCache)
 */

import { Module } from '@nestjs/common'
import { EdgeController } from './edge.controller'
import {
  EdgeNodeService,
  EdgeInferenceService,
  OfflineRecognitionService,
  EdgeModelCache,
} from './edge-ai.service'
import {
  OfflineTicketService,
  TimeSyncService,
} from './edge-computing.service'

@Module({
  controllers: [EdgeController],
  providers: [
    EdgeNodeService,
    OfflineTicketService,
    TimeSyncService,
    EdgeInferenceService,
    OfflineRecognitionService,
    EdgeModelCache,
  ],
  exports: [
    EdgeNodeService,
    OfflineTicketService,
    TimeSyncService,
    EdgeInferenceService,
    EdgeModelCache,
  ],
})
export class EdgeModule {}
