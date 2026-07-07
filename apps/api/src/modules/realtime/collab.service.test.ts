import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { CollabService } from './collab.service'

describe('CollabService', () => {
  let service: CollabService

  beforeEach(() => {
    service = new CollabService()
  })

  describe('createSession', () => {
    it('should create a collaboration session', () => {
      const session = service.createSession('doc-1', 'user-1')
      expect(session.id).toBeDefined()
      expect(session.documentId).toBe('doc-1')
      expect(session.ownerId).toBe('user-1')
      expect(session.participants).toContain('user-1')
    })
  })

  describe('joinSession', () => {
    it('should add participant to session', () => {
      const session = service.createSession('doc-1', 'user-1')
      const joined = service.joinSession(session.id, 'user-2')
      expect(joined.participants).toContain('user-2')
    })

    it('should throw error for non-existent session', () => {
      expect(() => service.joinSession('nonexistent', 'user-2')).toThrow()
    })
  })

  describe('leaveSession', () => {
    it('should remove participant from session', () => {
      const session = service.createSession('doc-1', 'user-1')
      service.joinSession(session.id, 'user-2')
      const left = service.leaveSession(session.id, 'user-2')
      expect(left.participants).not.toContain('user-2')
    })
  })

  describe('broadcastChange', () => {
    it('should broadcast change to participants', () => {
      const session = service.createSession('doc-1', 'user-1')
      service.joinSession(session.id, 'user-2')
      const change = service.broadcastChange(session.id, 'user-1', {
        type: 'insert',
        position: 0,
        content: 'Hello',
      })
      expect(change.recipients).toHaveLength(2)
    })
  })

  describe('getSession', () => {
    it('should return session by id', () => {
      const session = service.createSession('doc-1', 'user-1')
      const found = service.getSession(session.id)
      expect(found?.documentId).toBe('doc-1')
    })
  })

  describe('listActiveSessions', () => {
    it('should list active sessions', () => {
      service.createSession('doc-1', 'user-1')
      service.createSession('doc-2', 'user-2')
      const sessions = service.listActiveSessions()
      expect(sessions.length).toBe(2)
    })
  })

  describe('getParticipants', () => {
    it('should return session participants', () => {
      const session = service.createSession('doc-1', 'user-1')
      service.joinSession(session.id, 'user-2')
      const participants = service.getParticipants(session.id)
      expect(participants).toHaveLength(2)
    })
  })

  describe('addCursor', () => {
    it('should add cursor for participant', () => {
      const session = service.createSession('doc-1', 'user-1')
      const cursor = service.addCursor(session.id, 'user-1', 10, 5)
      expect(cursor.userId).toBe('user-1')
      expect(cursor.position.line).toBe(10)
    })
  })

  describe('removeCursor', () => {
    it('should remove cursor', () => {
      const session = service.createSession('doc-1', 'user-1')
      service.addCursor(session.id, 'user-1', 10, 5)
      const removed = service.removeCursor(session.id, 'user-1')
      expect(removed).toBe(true)
    })
  })

  describe('listCursors', () => {
    it('should list all cursors in session', () => {
      const session = service.createSession('doc-1', 'user-1')
      service.addCursor(session.id, 'user-1', 10, 5)
      service.addCursor(session.id, 'user-2', 20, 10)
      const cursors = service.listCursors(session.id)
      expect(cursors.length).toBe(2)
    })
  })

  describe('getPresence', () => {
    it('should return presence information', () => {
      const session = service.createSession('doc-1', 'user-1')
      service.updatePresence(session.id, 'user-1', { status: 'active' })
      const presence = service.getPresence(session.id, 'user-1')
      expect(presence?.status).toBe('active')
    })
  })

  describe('updatePresence', () => {
    it('should update presence', () => {
      const session = service.createSession('doc-1', 'user-1')
      const updated = service.updatePresence(session.id, 'user-1', { status: 'away' })
      expect(updated.status).toBe('away')
    })
  })

  describe('addComment', () => {
    it('should add comment to session', () => {
      const session = service.createSession('doc-1', 'user-1')
      const comment = service.addComment(session.id, 'user-1', {
        content: 'Test comment',
        selection: { start: 0, end: 10 },
      })
      expect(comment.content).toBe('Test comment')
    })
  })

  describe('listComments', () => {
    it('should list comments', () => {
      const session = service.createSession('doc-1', 'user-1')
      service.addComment(session.id, 'user-1', {
        content: 'Comment 1',
        selection: { start: 0, end: 5 },
      })
      const comments = service.listComments(session.id)
      expect(comments.length).toBe(1)
    })
  })

  describe('resolveComment', () => {
    it('should resolve comment', () => {
      const session = service.createSession('doc-1', 'user-1')
      const comment = service.addComment(session.id, 'user-1', {
        content: 'Comment',
        selection: { start: 0, end: 5 },
      })
      const resolved = service.resolveComment(session.id, comment.id)
      expect(resolved.resolved).toBe(true)
    })
  })
})
