/**
 * edge.service.ts — Edge Service (canonical name)
 *
 * 🐜 V17: 模块补齐 — 规范文件名
 *
 * 委托至 edge-computing.service.ts 和 edge-ai.service.ts。
 */

export {
  EdgeNodeService,
  EdgeInferenceService,
  OfflineRecognitionService,
  EdgeModelCache,
} from './edge-ai.service'
export {
  OfflineTicketService,
  TimeSyncService,
} from './edge-computing.service'
