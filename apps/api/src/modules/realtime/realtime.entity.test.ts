import { describe, it, expect } from 'vitest'
import type {
  RealtimeCRDTOperation,
  RealtimeCRDTDocumentState,
  RealtimeCollabOperation,
  RealtimeCollabDocument,
  RealtimePresence,
  RealtimeSession,
  RealtimeDeviceState,
  RealtimeSyncStatus,
  RealtimeConflictInfo,
  RealtimeComment,
} from './realtime.entity'

describe('Realtime Entity Types', () => {
  describe('RealtimeCRDTOperation', () => {
    it('should create a valid CRDT operation', () => {
      const op: RealtimeCRDTOperation = {
        id: 'op-1',
        type: 'append',
        content: 'hello',
        timestamp: Date.now(),
        clientId: 'user-A',
        version: 1,
      }
      expect(op.id).toBe('op-1')
      expect(op.type).toBe('append')
      expect(op.content).toBe('hello')
      expect(op.version).toBe(1)
    })

    it('should support insert operation with position', () => {
      const op: RealtimeCRDTOperation = {
        id: 'op-2',
        type: 'insert',
        content: 'world',
        position: 5,
        timestamp: Date.now(),
        clientId: 'user-B',
        version: 2,
      }
      expect(op.type).toBe('insert')
      expect(op.position).toBe(5)
    })

    it('should support delete operation', () => {
      const op: RealtimeCRDTOperation = {
        id: 'op-3',
        type: 'delete',
        content: 'old text',
        timestamp: Date.now(),
        clientId: 'user-C',
        version: 3,
      }
      expect(op.type).toBe('delete')
    })

    it('should handle missing optional fields', () => {
      const op: RealtimeCRDTOperation = {
        id: 'op-4',
        type: 'append',
        timestamp: Date.now(),
        clientId: 'user-D',
        version: 4,
      }
      expect(op.position).toBeUndefined()
      expect(op.content).toBeUndefined()
    })
  })

  describe('RealtimeCRDTDocumentState', () => {
    it('should create a valid document state', () => {
      const state: RealtimeCRDTDocumentState = {
        docId: 'doc-1',
        content: 'hello world',
        operations: [],
        version: 5,
        lastModified: Date.now(),
      }
      expect(state.docId).toBe('doc-1')
      expect(state.content).toBe('hello world')
      expect(state.version).toBe(5)
      expect(state.operations).toEqual([])
    })
  })

  describe('RealtimeCollabOperation', () => {
    it('should create a valid collab operation', () => {
      const op: RealtimeCollabOperation = {
        id: 'co-1',
        docId: 'doc-1',
        userId: 'user-A',
        delta: '+Hello',
        version: 1,
        timestamp: Date.now(),
        type: 'insert',
      }
      expect(op.userId).toBe('user-A')
      expect(op.delta).toBe('+Hello')
      expect(op.type).toBe('insert')
    })
  })

  describe('RealtimeCollabDocument', () => {
    it('should create a valid collab document', () => {
      const doc: RealtimeCollabDocument = {
        id: 'doc-1',
        title: 'Test Doc',
        ownerId: 'user-A',
        content: '',
        version: 0,
        editors: ['user-A'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(doc.title).toBe('Test Doc')
      expect(doc.editors).toContain('user-A')
      expect(doc.version).toBe(0)
    })
  })

  describe('RealtimePresence', () => {
    it('should create a valid presence entry', () => {
      const presence: RealtimePresence = {
        userId: 'user-A',
        docId: 'doc-1',
        status: 'online',
        lastActive: Date.now(),
      }
      expect(presence.status).toBe('online')
    })

    it('should support optional cursor field', () => {
      const presence: RealtimePresence = {
        userId: 'user-B',
        docId: 'doc-2',
        status: 'busy',
        lastActive: Date.now(),
        cursor: { line: 10, column: 5 },
      }
      expect(presence.cursor).toEqual({ line: 10, column: 5 })
    })
  })

  describe('RealtimeSession', () => {
    it('should create a valid session', () => {
      const session: RealtimeSession = {
        sessionId: 'sess-1',
        docId: 'doc-1',
        users: ['user-A', 'user-B'],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      }
      expect(session.users.length).toBe(2)
      expect(session.sessionId).toBe('sess-1')
    })
  })

  describe('RealtimeDeviceState', () => {
    it('should create a valid device state', () => {
      const state: RealtimeDeviceState = {
        deviceId: 'phone-1',
        userId: 'user-A',
        lastSyncAt: Date.now(),
        version: 3,
        pendingOps: [],
      }
      expect(state.deviceId).toBe('phone-1')
      expect(state.version).toBe(3)
    })
  })

  describe('RealtimeSyncStatus', () => {
    it('should create a valid sync status', () => {
      const status: RealtimeSyncStatus = {
        userId: 'user-A',
        devices: [],
        activeSessions: 0,
        pendingConflicts: 0,
      }
      expect(status.userId).toBe('user-A')
      expect(status.devices).toEqual([])
    })
  })

  describe('RealtimeConflictInfo', () => {
    it('should create a valid conflict info', () => {
      const localOp: RealtimeCollabOperation = {
        id: 'co-1', docId: 'doc-1', userId: 'user-A',
        delta: '+Hello', version: 1, timestamp: 1000, type: 'insert',
      }
      const remoteOp: RealtimeCollabOperation = {
        id: 'co-2', docId: 'doc-1', userId: 'user-B',
        delta: '+World', version: 1, timestamp: 1001, type: 'insert',
      }
      const conflict: RealtimeConflictInfo = {
        docId: 'doc-1',
        localOp,
        remoteOp,
        type: 'concurrent',
        resolved: true,
        resolution: 'local',
        timestamp: Date.now(),
      }
      expect(conflict.type).toBe('concurrent')
      expect(conflict.resolved).toBe(true)
      expect(conflict.resolution).toBe('local')
    })
  })

  describe('RealtimeComment', () => {
    it('should create a valid comment', () => {
      const comment: RealtimeComment = {
        id: 'cmt-1',
        userId: 'user-A',
        sessionId: 'sess-1',
        content: 'Great work!',
        selection: { start: 0, end: 5 },
        resolved: false,
        createdAt: new Date().toISOString(),
      }
      expect(comment.content).toBe('Great work!')
      expect(comment.resolved).toBe(false)
    })
  })
})
