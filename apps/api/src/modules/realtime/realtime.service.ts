/**
 * realtime.service.ts — Realtime Service (canonical name)
 *
 * 🐜 V17: 模块补齐 — 规范文件名
 *
 * 委托至 collab.service.ts 和 crdt.service.ts。
 */

export {
  CollaborativeEditor,
  PresenceService,
  ConflictResolver,
  CollabService,
} from './collab.service'
export {
  CRDTDocument,
  WebSocketSessionManager,
  MultiDeviceSyncService,
} from './crdt.service'
