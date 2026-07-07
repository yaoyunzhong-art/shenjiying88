/**
 * Phase-T126: Realtime 模块
 *
 * 注册:
 *  - RealtimeController
 *  - CollaborativeEditor (带 @Injectable)
 *  - PresenceService (带 @Injectable)
 *  - ConflictResolver (带 @Injectable)
 *  - CollabService (带 @Injectable, 暴露在 collab.service 底部)
 *  - CRDTDocument (纯 class, 用 useValue 提供)
 *  - WebSocketSessionManager (纯 class, 用 useValue 提供)
 *  - MultiDeviceSyncService (依赖 CRDTDocument + WebSocketSessionManager, 用 useFactory 提供)
 */
import { Module } from '@nestjs/common'
import { RealtimeController } from './realtime.controller'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService } from './crdt.service'

@Module({
  controllers: [RealtimeController],
  providers: [
    // @Injectable 类可以直接注册
    CollaborativeEditor,
    PresenceService,
    ConflictResolver,
    CollabService,
    // CRDTDocument 没有 @Injectable, 用 useValue
    { provide: CRDTDocument, useValue: new CRDTDocument() },
    // WebSocketSessionManager 没有 @Injectable
    { provide: WebSocketSessionManager, useValue: new WebSocketSessionManager() },
    // MultiDeviceSyncService 需要 crdt + wsManager
    {
      provide: MultiDeviceSyncService,
      inject: [CRDTDocument, WebSocketSessionManager],
      useFactory: (crdt: CRDTDocument, ws: WebSocketSessionManager) => new MultiDeviceSyncService(crdt, ws),
    },
  ],
  exports: [
    CollaborativeEditor,
    PresenceService,
    ConflictResolver,
    CollabService,
    CRDTDocument,
    WebSocketSessionManager,
    MultiDeviceSyncService,
  ],
})
export class RealtimeModule {}
