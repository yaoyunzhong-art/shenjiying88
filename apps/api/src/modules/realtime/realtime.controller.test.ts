import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RealtimeController } from './realtime.controller'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService } from './crdt.service'

describe('RealtimeController', () => {
  let controller: RealtimeController
  let collabEditor: CollaborativeEditor
  let presenceService: PresenceService
  let conflictResolver: ConflictResolver
  let collabService: CollabService
  let crdtDocument: CRDTDocument
  let wsManager: WebSocketSessionManager
  let syncService: MultiDeviceSyncService

  beforeEach(() => {
    crdtDocument = new CRDTDocument()
    wsManager = new WebSocketSessionManager()
    collabEditor = new CollaborativeEditor()
    presenceService = new PresenceService()
    conflictResolver = new ConflictResolver()
    collabService = new CollabService()
    syncService = new MultiDeviceSyncService(crdtDocument, wsManager)
    controller = new RealtimeController(
      collabEditor,
      presenceService,
      conflictResolver,
      collabService,
      crdtDocument,
      wsManager,
      syncService,
    )
  })

  // ─── Health ───────────────────────────────────────────────────────────────

  describe('GET /realtime/health', () => {
    it('should return health status', () => {
      const result = controller.health()
      expect(result.status).toBe('ok')
      expect(result.module).toBe('realtime')
    })
  })

  // ─── Collab Document ──────────────────────────────────────────────────────

  describe('POST /realtime/collab/document', () => {
    it('should create a collab document', () => {
      const result = controller.createCollabDocument({ title: 'Test Doc', ownerId: 'user-A' })
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('Test Doc')
      expect(result.data.ownerId).toBe('user-A')
      expect(result.data.editors).toContain('user-A')
    })

    it('should create document with empty content', () => {
      const result = controller.createCollabDocument({ title: 'Empty Doc', ownerId: 'user-B' })
      expect(result.success).toBe(true)
      expect(result.data.content).toBe('')
      expect(result.data.version).toBe(0)
    })
  })

  describe('POST /realtime/collab/invite', () => {
    it('should invite editors to existing document', () => {
      const doc = controller.createCollabDocument({ title: 'Test', ownerId: 'user-A' })
      const result = controller.inviteEditors({ docId: doc.data.id, userIds: ['user-B', 'user-C'] })
      expect(result.success).toBe(true)
      expect(result.data!.editors).toContain('user-B')
      expect(result.data!.editors).toContain('user-C')
    })

    it('should return error for non-existent document', () => {
      const result = controller.inviteEditors({ docId: 'non-existent', userIds: ['user-B'] })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Document not found')
    })
  })

  describe('POST /realtime/collab/update', () => {
    it('should update document content', () => {
      const doc = controller.createCollabDocument({ title: 'Doc', ownerId: 'user-A' })
      const result = controller.updateContent({ docId: doc.data.id, delta: '+Hello', userId: 'user-A' })
      expect(result.success).toBe(true)
      expect(result.data!.version).toBe(1)
    })

    it('should return error for non-editor user', () => {
      const doc = controller.createCollabDocument({ title: 'Private', ownerId: 'user-A' })
      const result = controller.updateContent({ docId: doc.data.id, delta: '+hack', userId: 'user-C' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('GET /realtime/collab/document/:docId', () => {
    it('should return existing document', () => {
      const doc = controller.createCollabDocument({ title: 'Doc', ownerId: 'user-A' })
      const result = controller.getCollabDocument(doc.data.id)
      expect(result.success).toBe(true)
      expect(result.data!.title).toBe('Doc')
    })

    it('should return error for non-existent document', () => {
      const result = controller.getCollabDocument('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Document not found')
    })
  })

  describe('GET /realtime/collab/operations/:docId', () => {
    it('should return empty operations for new document', () => {
      const doc = controller.createCollabDocument({ title: 'Doc', ownerId: 'user-A' })
      const result = controller.getCollabOperations(doc.data.id)
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should return operations after updates', () => {
      const doc = controller.createCollabDocument({ title: 'Doc', ownerId: 'user-A' })
      controller.updateContent({ docId: doc.data.id, delta: '+Hello', userId: 'user-A' })
      const result = controller.getCollabOperations(doc.data.id)
      expect(result.total).toBe(1)
      expect(result.data[0].delta).toBe('+Hello')
    })
  })

  // ─── Collab Session (CollabService) ───────────────────────────────────────

  describe('POST /realtime/collab/session', () => {
    it('should create a session', () => {
      const result = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      expect(result.success).toBe(true)
      expect(result.data.documentId).toBe('doc-1')
    })
  })

  describe('POST /realtime/collab/join', () => {
    it('should join an existing session', () => {
      const session = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      const result = controller.joinCollabSession({ sessionId: session.data.id, userId: 'user-B' })
      expect(result.success).toBe(true)
      expect(result.data.participants).toContain('user-B')
    })

    it('should return error for non-existent session', () => {
      const result = controller.joinCollabSession({ sessionId: 'non-existent', userId: 'user-B' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Session non-existent not found')
    })
  })

  describe('POST /realtime/collab/leave', () => {
    it('should leave a session', () => {
      const session = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      controller.joinCollabSession({ sessionId: session.data.id, userId: 'user-B' })
      const result = controller.leaveCollabSession({ sessionId: session.data.id, userId: 'user-B' })
      expect(result.success).toBe(true)
      expect(result.data.participants).not.toContain('user-B')
    })
  })

  describe('POST /realtime/collab/broadcast', () => {
    it('should broadcast change to participants', () => {
      const session = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      controller.joinCollabSession({ sessionId: session.data.id, userId: 'user-B' })
      const result = controller.broadcastChange({ sessionId: session.data.id, userId: 'user-A', change: { text: 'hello' } })
      expect(result.success).toBe(true)
      expect(result.data.recipients).toContain('user-B')
    })
  })

  describe('GET /realtime/collab/participants/:sessionId', () => {
    it('should list participants', () => {
      const session = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      const result = controller.getParticipants(session.data.id)
      expect(result.success).toBe(true)
      expect(result.data).toContain('user-A')
    })
  })

  // ─── CRDT ─────────────────────────────────────────────────────────────────

  describe('POST /realtime/crdt/create', () => {
    it('should create CRDT document', () => {
      const result = controller.createCRDTDocument({ docId: 'crdt-1' })
      expect(result.success).toBe(true)
      expect(result.data.docId).toBe('crdt-1')
      expect(result.data.content).toBe('')
      expect(result.data.version).toBe(0)
    })

    it('should return same document if already exists', () => {
      controller.createCRDTDocument({ docId: 'crdt-2' })
      const result = controller.createCRDTDocument({ docId: 'crdt-2' })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /realtime/crdt/apply', () => {
    it('should apply append operation', () => {
      controller.createCRDTDocument({ docId: 'crdt-3' })
      const result = controller.applyCRDTOperation({
        docId: 'crdt-3',
        operation: {
          id: 'op-1', type: 'append', content: 'Hello', timestamp: Date.now(),
          clientId: 'user-A', version: 1,
        },
      })
      expect(result.success).toBe(true)
      expect(result.data!.content).toBe('Hello')
      expect(result.data!.version).toBe(1)
    })

    it('should return error for non-existent doc', () => {
      const result = controller.applyCRDTOperation({
        docId: 'no-doc',
        operation: {
          id: 'op-x', type: 'append', content: 'x', timestamp: Date.now(),
          clientId: 'user-A', version: 1,
        },
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Document not found')
    })
  })

  describe('GET /realtime/crdt/state/:docId', () => {
    it('should return CRDT document state', () => {
      controller.createCRDTDocument({ docId: 'crdt-4' })
      const result = controller.getCRDTState('crdt-4')
      expect(result.success).toBe(true)
      expect(result.data!.docId).toBe('crdt-4')
    })

    it('should return error for non-existent doc', () => {
      const result = controller.getCRDTState('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Document not found')
    })
  })

  describe('POST /realtime/crdt/merge', () => {
    it('should merge remote document', () => {
      controller.createCRDTDocument({ docId: 'local-doc' })
      const result = controller.mergeCRDTDocument({
        remoteDoc: {
          docId: 'local-doc',
          content: 'Merged content',
          operations: [
            { id: 'op-m1', type: 'append', content: 'Merged content', timestamp: Date.now(), clientId: 'user-A', version: 1 },
          ],
          version: 1,
          lastModified: Date.now(),
        },
      })
      expect(result.success).toBe(true)
    })
  })

  // ─── WebSocket Session ────────────────────────────────────────────────────

  describe('POST /realtime/session/create', () => {
    it('should create WS session', () => {
      const result = controller.createWsSession({ docId: 'ws-doc', userId: 'user-A' })
      expect(result.success).toBe(true)
      expect(result.data!.docId).toBe('ws-doc')
    })
  })

  describe('POST /realtime/session/join', () => {
    it('should join WS session', () => {
      const session = controller.createWsSession({ docId: 'ws-doc', userId: 'user-A' })
      const result = controller.joinWsSession({ sessionId: session.data.sessionId, userId: 'user-B' })
      expect(result.success).toBe(true)
    })

    it('should return error for non-existent session', () => {
      const result = controller.joinWsSession({ sessionId: 'no-sess', userId: 'user-B' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
    })
  })

  describe('POST /realtime/session/leave', () => {
    it('should leave WS session', () => {
      const session = controller.createWsSession({ docId: 'ws-doc', userId: 'user-A' })
      const result = controller.leaveWsSession({ sessionId: session.data.sessionId, userId: 'user-A' })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /realtime/session/:sessionId', () => {
    it('should get WS session details', () => {
      const session = controller.createWsSession({ docId: 'ws-doc', userId: 'user-A' })
      const result = controller.getWsSession(session.data.sessionId)
      expect(result.success).toBe(true)
      expect(result.data!.docId).toBe('ws-doc')
    })
  })

  describe('GET /realtime/session/list/:userId', () => {
    it('should list active sessions for user', () => {
      controller.createWsSession({ docId: 'doc-1', userId: 'user-A' })
      const result = controller.listActiveSessions('user-A')
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── Presence ─────────────────────────────────────────────────────────────

  describe('POST /realtime/presence/heartbeat', () => {
    it('should register heartbeat', () => {
      const result = controller.heartbeat({ userId: 'user-A', docId: 'doc-1' })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /realtime/presence/online/:docId', () => {
    it('should return online users', () => {
      controller.heartbeat({ userId: 'user-A', docId: 'doc-1' })
      const result = controller.getOnlineUsers('doc-1')
      expect(result.success).toBe(true)
    })
  })

  describe('POST /realtime/presence/status', () => {
    it('should set user status', () => {
      const result = controller.setUserStatus({ userId: 'user-A', status: 'busy' })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /realtime/presence/cursor', () => {
    it('should set cursor position', () => {
      controller.heartbeat({ userId: 'user-A', docId: 'doc-1' })
      const result = controller.setCursor({ userId: 'user-A', docId: 'doc-1', cursor: { line: 10, column: 5 } })
      expect(result.success).toBe(true)
    })
  })

  // ─── Conflict ─────────────────────────────────────────────────────────────

  describe('POST /realtime/conflict/detect', () => {
    it('should detect conflict between concurrent operations', () => {
      const doc = controller.createCollabDocument({ title: 'Conflict Doc', ownerId: 'user-A' })
      controller.inviteEditors({ docId: doc.data.id, userIds: ['user-B'] })
      controller.updateContent({ docId: doc.data.id, delta: '+Hello', userId: 'user-A' })
      controller.updateContent({ docId: doc.data.id, delta: '+World', userId: 'user-B' })
      const ops = collabEditor.getOperations(doc.data.id)
      const result = controller.detectConflict({ localOp: ops[0], remoteOp: ops[1] })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /realtime/conflict/resolve/lww', () => {
    it('should resolve by last write wins', () => {
      const doc = controller.createCollabDocument({ title: 'LWW Doc', ownerId: 'user-A' })
      controller.inviteEditors({ docId: doc.data.id, userIds: ['user-B'] })
      controller.updateContent({ docId: doc.data.id, delta: '+First', userId: 'user-A' })
      controller.updateContent({ docId: doc.data.id, delta: '+Second', userId: 'user-B' })
      const ops = collabEditor.getOperations(doc.data.id)
      const result = controller.resolveLWW({ ops })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('POST /realtime/conflict/resolve/merge', () => {
    it('should resolve by merge', () => {
      const doc = controller.createCollabDocument({ title: 'Merge Doc', ownerId: 'user-A' })
      controller.inviteEditors({ docId: doc.data.id, userIds: ['user-B'] })
      controller.updateContent({ docId: doc.data.id, delta: '+From A', userId: 'user-A' })
      controller.updateContent({ docId: doc.data.id, delta: '+ and B', userId: 'user-B' })
      const ops = collabEditor.getOperations(doc.data.id)
      const result = controller.resolveMerge({ ops })
      expect(result.success).toBe(true)
      expect(result.data).toContain('From A')
    })
  })

  describe('GET /realtime/conflict/report/:docId', () => {
    it('should return empty conflict report for clean doc', () => {
      const result = controller.getConflictReport('clean-doc')
      expect(result.success).toBe(true)
      expect(result.data.total).toBe(0)
    })
  })

  // ─── Multi-Device Sync ────────────────────────────────────────────────────

  describe('POST /realtime/sync/to-device', () => {
    it('should sync state to device', () => {
      controller.createCRDTDocument({ docId: 'sync-doc' })
      const state = crdtDocument.getState('sync-doc')
      const result = controller.syncToDevice({ userId: 'user-A', deviceId: 'phone-1', state: state! })
      expect(result.success).toBe(true)
      expect(result.data.deviceId).toBe('phone-1')
    })
  })

  describe('GET /realtime/sync/status/:userId', () => {
    it('should return sync status', () => {
      controller.createCRDTDocument({ docId: 'sync-status-doc' })
      const state = crdtDocument.getState('sync-status-doc')
      controller.syncToDevice({ userId: 'user-A', deviceId: 'phone-1', state: state! })
      const result = controller.getSyncStatus('user-A')
      expect(result.success).toBe(true)
      expect(result.data!.devices.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── Comment ──────────────────────────────────────────────────────────────

  describe('POST /realtime/comment/add', () => {
    it('should add a comment', () => {
      const session = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      const result = controller.addComment({
        sessionId: session.data.id,
        userId: 'user-A',
        content: 'Great work!',
        selection: { start: 0, end: 5 },
      })
      expect(result.success).toBe(true)
      expect(result.data.content).toBe('Great work!')
    })
  })

  describe('GET /realtime/comment/list/:sessionId', () => {
    it('should list comments', () => {
      const session = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      controller.addComment({ sessionId: session.data.id, userId: 'user-A', content: 'Comment 1', selection: { start: 0, end: 5 } })
      const result = controller.listComments(session.data.id)
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
    })
  })

  describe('POST /realtime/comment/resolve', () => {
    it('should resolve a comment', () => {
      const session = controller.createCollabSession({ docId: 'doc-1', ownerId: 'user-A' })
      const comment = controller.addComment({ sessionId: session.data.id, userId: 'user-A', content: 'Fix this', selection: { start: 0, end: 3 } })
      const result = controller.resolveComment({ sessionId: session.data.id, commentId: comment.data.id })
      expect(result.success).toBe(true)
      expect(result.data.resolved).toBe(true)
    })
  })
})
