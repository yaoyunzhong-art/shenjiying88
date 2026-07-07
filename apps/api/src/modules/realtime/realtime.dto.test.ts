import { describe, it, expect } from 'vitest'
import {
  CreateDocumentDto,
  ApplyOperationDto,
  MergeDocumentDto,
  CreateCollabDocumentDto,
  InviteEditorsDto,
  UpdateContentDto,
  CreateSessionDto,
  JoinSessionDto,
  LeaveSessionDto,
  BroadcastMessageDto,
  HeartbeatDto,
  SetUserStatusDto,
  SetCursorDto,
  DetectConflictDto,
  SyncToDeviceDto,
  ResolveDeviceConflictDto,
  AddPendingOpDto,
  AddCommentDto,
  RealtimeDocumentResponse,
  RealtimeListResponse,
} from './realtime.dto'

describe('Realtime DTOs', () => {
  describe('CRDT DTOs', () => {
    it('CreateDocumentDto should hold docId', () => {
      const dto = new CreateDocumentDto()
      dto.docId = 'doc-1'
      expect(dto.docId).toBe('doc-1')
    })

    it('ApplyOperationDto should hold docId and operation', () => {
      const dto = new ApplyOperationDto()
      dto.docId = 'doc-1'
      dto.operation = { type: 'append', content: 'hello', clientId: 'user-A', version: 1, position: undefined }
      expect(dto.docId).toBe('doc-1')
      expect(dto.operation.type).toBe('append')
      expect(dto.operation.clientId).toBe('user-A')
    })

    it('MergeDocumentDto should hold remoteDoc', () => {
      const dto = new MergeDocumentDto()
      dto.remoteDoc = {
        docId: 'doc-1',
        content: 'hello',
        operations: [],
        version: 1,
        lastModified: Date.now(),
      }
      expect(dto.remoteDoc.docId).toBe('doc-1')
      expect(dto.remoteDoc.content).toBe('hello')
    })
  })

  describe('Collab DTOs', () => {
    it('CreateCollabDocumentDto should hold title and ownerId', () => {
      const dto = new CreateCollabDocumentDto()
      dto.title = 'Test Doc'
      dto.ownerId = 'user-A'
      expect(dto.title).toBe('Test Doc')
      expect(dto.ownerId).toBe('user-A')
    })

    it('InviteEditorsDto should hold docId and userIds', () => {
      const dto = new InviteEditorsDto()
      dto.docId = 'doc-1'
      dto.userIds = ['user-B', 'user-C']
      expect(dto.docId).toBe('doc-1')
      expect(dto.userIds).toContain('user-B')
    })

    it('UpdateContentDto should hold docId, delta, userId', () => {
      const dto = new UpdateContentDto()
      dto.docId = 'doc-1'
      dto.delta = '+Hello'
      dto.userId = 'user-A'
      expect(dto.delta).toBe('+Hello')
    })
  })

  describe('Session DTOs', () => {
    it('CreateSessionDto should hold docId and userId', () => {
      const dto = new CreateSessionDto()
      dto.docId = 'doc-1'
      dto.userId = 'user-A'
      expect(dto.docId).toBe('doc-1')
      expect(dto.userId).toBe('user-A')
    })

    it('JoinSessionDto should hold sessionId and userId', () => {
      const dto = new JoinSessionDto()
      dto.sessionId = 'sess-1'
      dto.userId = 'user-B'
      expect(dto.sessionId).toBe('sess-1')
    })

    it('LeaveSessionDto should hold sessionId and userId', () => {
      const dto = new LeaveSessionDto()
      dto.sessionId = 'sess-1'
      dto.userId = 'user-A'
      expect(dto.sessionId).toBe('sess-1')
    })

    it('BroadcastMessageDto should hold sessionId and message', () => {
      const dto = new BroadcastMessageDto()
      dto.sessionId = 'sess-1'
      dto.message = { type: 'operation', payload: { test: true } }
      dto.excludeUserId = 'user-A'
      expect(dto.message.type).toBe('operation')
      expect(dto.excludeUserId).toBe('user-A')
    })
  })

  describe('Presence DTOs', () => {
    it('HeartbeatDto should hold userId and docId', () => {
      const dto = new HeartbeatDto()
      dto.userId = 'user-A'
      dto.docId = 'doc-1'
      expect(dto.userId).toBe('user-A')
    })

    it('SetUserStatusDto should hold userId and status', () => {
      const dto = new SetUserStatusDto()
      dto.userId = 'user-A'
      dto.status = 'busy'
      expect(dto.status).toBe('busy')
    })

    it('SetCursorDto should hold userId, docId, and cursor', () => {
      const dto = new SetCursorDto()
      dto.userId = 'user-A'
      dto.docId = 'doc-1'
      dto.cursor = { line: 10, column: 5 }
      expect(dto.cursor).toEqual({ line: 10, column: 5 })
    })
  })

  describe('Conflict DTOs', () => {
    it('DetectConflictDto should hold localOp and remoteOp', () => {
      const dto = new DetectConflictDto()
      dto.localOp = { id: 'co-1', docId: 'doc-1', userId: 'user-A', delta: '+A', version: 1, timestamp: 100, type: 'insert' }
      dto.remoteOp = { id: 'co-2', docId: 'doc-1', userId: 'user-B', delta: '+B', version: 1, timestamp: 101, type: 'insert' }
      expect(dto.localOp.userId).toBe('user-A')
      expect(dto.remoteOp.userId).toBe('user-B')
    })
  })

  describe('Sync DTOs', () => {
    it('SyncToDeviceDto should hold userId, deviceId, state', () => {
      const dto = new SyncToDeviceDto()
      dto.userId = 'user-A'
      dto.deviceId = 'phone-1'
      dto.state = { docId: 'doc-1', content: 'hello', operations: [], version: 1, lastModified: Date.now() }
      expect(dto.deviceId).toBe('phone-1')
    })

    it('ResolveDeviceConflictDto should hold userId, deviceId1, deviceId2', () => {
      const dto = new ResolveDeviceConflictDto()
      dto.userId = 'user-A'
      dto.deviceId1 = 'phone-1'
      dto.deviceId2 = 'pc-1'
      expect(dto.deviceId1).toBe('phone-1')
    })

    it('AddPendingOpDto should hold userId, deviceId, op', () => {
      const dto = new AddPendingOpDto()
      dto.userId = 'user-A'
      dto.deviceId = 'phone-1'
      dto.op = { id: 'op-1', type: 'append', timestamp: Date.now(), clientId: 'user-A', version: 1 }
      expect(dto.op.id).toBe('op-1')
    })
  })

  describe('Comment DTOs', () => {
    it('AddCommentDto should hold sessionId, userId, comment', () => {
      const dto = new AddCommentDto()
      dto.sessionId = 'sess-1'
      dto.userId = 'user-A'
      dto.comment = { content: 'Nice!', selection: { start: 0, end: 4 } }
      expect(dto.comment.content).toBe('Nice!')
    })
  })

  describe('Response DTOs', () => {
    it('RealtimeDocumentResponse should support success response', () => {
      const resp = new RealtimeDocumentResponse()
      resp.success = true
      resp.data = { id: 'doc-1', title: 'Test' } as any
      expect(resp.success).toBe(true)
    })

    it('RealtimeDocumentResponse should support error response', () => {
      const resp = new RealtimeDocumentResponse()
      resp.success = false
      resp.error = 'Not found'
      expect(resp.error).toBe('Not found')
    })

    it('RealtimeListResponse should support list response', () => {
      const resp = new RealtimeListResponse()
      resp.success = true
      resp.data = [{ id: '1' }, { id: '2' }]
      resp.total = 2
      expect(resp.total).toBe(2)
    })
  })
})
