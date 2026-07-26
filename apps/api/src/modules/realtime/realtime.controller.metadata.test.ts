import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { RealtimeController } from './realtime.controller'

describe('RealtimeController metadata', () => {
  it('controller should keep realtime path', () => {
    assert.equal(Reflect.getMetadata('path', RealtimeController), 'realtime')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [RealtimeController.prototype.health, 0, 'health'],
      [RealtimeController.prototype.createCollabDocument, 1, 'collab/document'],
      [RealtimeController.prototype.inviteEditors, 1, 'collab/invite'],
      [RealtimeController.prototype.updateContent, 1, 'collab/update'],
      [RealtimeController.prototype.getCollabDocument, 0, 'collab/document/:docId'],
      [RealtimeController.prototype.getCollabOperations, 0, 'collab/operations/:docId'],
      [RealtimeController.prototype.createCollabSession, 1, 'collab/session'],
      [RealtimeController.prototype.joinCollabSession, 1, 'collab/join'],
      [RealtimeController.prototype.leaveCollabSession, 1, 'collab/leave'],
      [RealtimeController.prototype.broadcastChange, 1, 'collab/broadcast'],
      [RealtimeController.prototype.getParticipants, 0, 'collab/participants/:sessionId'],
      [RealtimeController.prototype.createCRDTDocument, 1, 'crdt/create'],
      [RealtimeController.prototype.applyCRDTOperation, 1, 'crdt/apply'],
      [RealtimeController.prototype.getCRDTState, 0, 'crdt/state/:docId'],
      [RealtimeController.prototype.mergeCRDTDocument, 1, 'crdt/merge'],
      [RealtimeController.prototype.deleteCRDTDocument, 1, 'crdt/delete'],
      [RealtimeController.prototype.createWsSession, 1, 'session/create'],
      [RealtimeController.prototype.joinWsSession, 1, 'session/join'],
      [RealtimeController.prototype.leaveWsSession, 1, 'session/leave'],
      [RealtimeController.prototype.getWsSession, 0, 'session/:sessionId'],
      [RealtimeController.prototype.listActiveSessions, 0, 'session/list/:userId'],
      [RealtimeController.prototype.listAllSessions, 0, 'session/all'],
      [RealtimeController.prototype.heartbeat, 1, 'presence/heartbeat'],
      [RealtimeController.prototype.getOnlineUsers, 0, 'presence/online/:docId'],
      [RealtimeController.prototype.setUserStatus, 1, 'presence/status'],
      [RealtimeController.prototype.getLastActive, 0, 'presence/last-active/:userId'],
      [RealtimeController.prototype.setCursor, 1, 'presence/cursor'],
      [RealtimeController.prototype.removePresence, 1, 'presence/remove'],
      [RealtimeController.prototype.detectConflict, 1, 'conflict/detect'],
      [RealtimeController.prototype.resolveLWW, 1, 'conflict/resolve/lww'],
      [RealtimeController.prototype.resolveMerge, 1, 'conflict/resolve/merge'],
      [RealtimeController.prototype.getConflictReport, 0, 'conflict/report/:docId'],
      [RealtimeController.prototype.clearConflicts, 1, 'conflict/clear'],
      [RealtimeController.prototype.syncToDevice, 1, 'sync/to-device'],
      [RealtimeController.prototype.resolveDeviceConflict, 1, 'sync/resolve-conflict'],
      [RealtimeController.prototype.getSyncStatus, 0, 'sync/status/:userId'],
      [RealtimeController.prototype.getPendingOps, 0, 'sync/pending/:userId/:deviceId'],
      [RealtimeController.prototype.addPendingOp, 1, 'sync/add-pending'],
      [RealtimeController.prototype.addCursor, 1, 'collab/cursor/add'],
      [RealtimeController.prototype.removeCursor, 1, 'collab/cursor/remove'],
      [RealtimeController.prototype.listCursors, 0, 'collab/cursor/:sessionId'],
      [RealtimeController.prototype.addComment, 1, 'comment/add'],
      [RealtimeController.prototype.listComments, 0, 'comment/list/:sessionId'],
      [RealtimeController.prototype.resolveComment, 1, 'comment/resolve'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
