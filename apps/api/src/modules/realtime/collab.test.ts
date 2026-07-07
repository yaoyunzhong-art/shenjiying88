import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { CollaborativeEditor, PresenceService, ConflictResolver } from './collab.service'

describe('CollaborativeEditor', () => {
  let editor: CollaborativeEditor

  beforeEach(() => {
    editor = new CollaborativeEditor()
  })

  it('should create a new document', () => {
    const doc = editor.createDocument('Test Doc', 'user-1')
    assert.ok(doc.id)
    assert.equal(doc.title, 'Test Doc')
    assert.equal(doc.ownerId, 'user-1')
    assert.equal(doc.content, '')
    assert.equal(doc.version, 0)
    assert.ok(doc.editors.includes('user-1'))
  })

  it('should invite editors to a document', () => {
    const doc = editor.createDocument('Test Doc', 'user-1')
    const updated = editor.inviteEditors(doc.id, ['user-2', 'user-3'])

    assert.ok(updated)
    assert.ok(updated!.editors.includes('user-2'))
    assert.ok(updated!.editors.includes('user-3'))
    assert.equal(updated!.editors.length, 3)
  })

  it('should update document content', () => {
    const doc = editor.createDocument('Test Doc', 'user-1')
    const result = editor.updateContent(doc.id, '+Hello', 'user-1')

    assert.ok(result)
    assert.equal(result!.version, 1)
    assert.equal(editor.getDocument(doc.id)!.content, 'Hello')
  })

  it('should not allow non-editor to update content', () => {
    const doc = editor.createDocument('Test Doc', 'user-1')
    const result = editor.updateContent(doc.id, '+Hello', 'user-2')

    assert.equal(result, undefined)
  })

  it('should track document version correctly', () => {
    const doc = editor.createDocument('Test Doc', 'user-1')
    editor.updateContent(doc.id, '+Hello', 'user-1')
    editor.updateContent(doc.id, '+ World', 'user-1')

    assert.equal(editor.getVersion(doc.id), 2)
    assert.equal(editor.getDocument(doc.id)!.content, 'Hello World')
  })

  it('should merge concurrent edits from multiple users', () => {
    const doc = editor.createDocument('Test Doc', 'user-1')
    editor.inviteEditors(doc.id, ['user-2'])

    editor.updateContent(doc.id, '+Hello', 'user-1')
    editor.updateContent(doc.id, '+World', 'user-2')

    assert.equal(editor.getVersion(doc.id), 2)
  })
})

describe('PresenceService', () => {
  let presence: PresenceService

  beforeEach(() => {
    presence = new PresenceService()
  })

  it('should register user heartbeat', () => {
    presence.heartbeat('user-1', 'doc-1')
    const online = presence.getOnlineUsers('doc-1')

    assert.ok(online.length > 0)
    assert.equal(online[0].userId, 'user-1')
    assert.equal(online[0].status, 'online')
  })

  it('should show user as online after heartbeat', () => {
    presence.heartbeat('user-1', 'doc-1')
    const lastActive = presence.getLastActive('user-1')

    assert.ok(lastActive > 0)
    assert.ok(Date.now() - lastActive < 1000)
  })

  it('should detect online users in a document', () => {
    presence.heartbeat('user-1', 'doc-1')
    presence.heartbeat('user-2', 'doc-1')
    presence.heartbeat('user-3', 'doc-2')

    const doc1Online = presence.getOnlineUsers('doc-1')
    const doc2Online = presence.getOnlineUsers('doc-2')

    assert.equal(doc1Online.length, 2)
    assert.equal(doc2Online.length, 1)
  })

  it('should set user status', () => {
    presence.heartbeat('user-1', 'doc-1')
    presence.setUserStatus('user-1', 'busy')

    const online = presence.getOnlineUsers('doc-1')
    assert.equal(online[0].status, 'busy')
  })

  it('should remove user presence', () => {
    presence.heartbeat('user-1', 'doc-1')
    presence.heartbeat('user-1', 'doc-2')
    presence.removeUser('user-1')

    assert.equal(presence.getLastActive('user-1'), 0)
  })

  it('should track cursor position', () => {
    presence.heartbeat('user-1', 'doc-1')
    presence.setCursor('user-1', 'doc-1', { line: 5, column: 10 })

    const online = presence.getOnlineUsers('doc-1')
    assert.equal(online[0].cursor!.line, 5)
    assert.equal(online[0].cursor!.column, 10)
  })
})

describe('ConflictResolver', () => {
  let resolver: ConflictResolver

  beforeEach(() => {
    resolver = new ConflictResolver()
  })

  it('should detect concurrent conflict', () => {
    const localOp = {
      id: 'op-1',
      docId: 'doc-1',
      userId: 'user-1',
      delta: '+Hello@10',
      version: 1,
      timestamp: Date.now(),
      type: 'insert' as const
    }
    const remoteOp = {
      id: 'op-2',
      docId: 'doc-1',
      userId: 'user-2',
      delta: '+World@10',
      version: 1,
      timestamp: Date.now() + 100,
      type: 'insert' as const
    }

    assert.ok(resolver.detectConflict(localOp, remoteOp))
  })

  it('should resolve by last write wins', () => {
    const ops = [
      {
        id: 'op-1',
        docId: 'doc-1',
        userId: 'user-1',
        delta: '+Hello',
        version: 1,
        timestamp: Date.now(),
        type: 'insert' as const
      },
      {
        id: 'op-2',
        docId: 'doc-1',
        userId: 'user-2',
        delta: '+World',
        version: 1,
        timestamp: Date.now() + 100,
        type: 'insert' as const
      }
    ]

    const winner = resolver.resolveByLastWriteWins(ops)
    assert.equal(winner.id, 'op-2')
    assert.equal(winner.delta, '+World')
  })

  it('should merge changes from both operations', () => {
    const ops = [
      {
        id: 'op-1',
        docId: 'doc-1',
        userId: 'user-1',
        delta: '+Hello',
        version: 1,
        timestamp: Date.now(),
        type: 'insert' as const
      },
      {
        id: 'op-2',
        docId: 'doc-1',
        userId: 'user-2',
        delta: '+World',
        version: 2,
        timestamp: Date.now() + 100,
        type: 'insert' as const
      }
    ]

    const merged = resolver.resolveByMerge(ops)
    assert.equal(merged, 'HelloWorld')
  })

  it('should generate conflict report', () => {
    const report = resolver.getConflictReport('doc-1')

    assert.ok(report)
    assert.equal(report.total, 0)
    assert.equal(report.resolved, 0)
    assert.equal(report.unresolved, 0)
  })

  it('should clear conflicts', () => {
    const ops = [
      {
        id: 'op-1',
        docId: 'doc-1',
        userId: 'user-1',
        delta: '+Hello',
        version: 1,
        timestamp: Date.now(),
        type: 'insert' as const
      },
      {
        id: 'op-2',
        docId: 'doc-1',
        userId: 'user-2',
        delta: '+World',
        version: 1,
        timestamp: Date.now() + 100,
        type: 'insert' as const
      }
    ]

    resolver.resolveByLastWriteWins(ops)
    resolver.clearConflicts('doc-1')

    const report = resolver.getConflictReport('doc-1')
    assert.equal(report.total, 0)
  })

  it('should not detect conflict for different documents', () => {
    const localOp = {
      id: 'op-1',
      docId: 'doc-1',
      userId: 'user-1',
      delta: '+Hello',
      version: 1,
      timestamp: Date.now(),
      type: 'insert' as const
    }
    const remoteOp = {
      id: 'op-2',
      docId: 'doc-2',
      userId: 'user-2',
      delta: '+World',
      version: 1,
      timestamp: Date.now(),
      type: 'insert' as const
    }

    assert.equal(resolver.detectConflict(localOp, remoteOp), false)
  })

  it('should not detect conflict for same user', () => {
    const localOp = {
      id: 'op-1',
      docId: 'doc-1',
      userId: 'user-1',
      delta: '+Hello',
      version: 1,
      timestamp: Date.now(),
      type: 'insert' as const
    }
    const remoteOp = {
      id: 'op-2',
      docId: 'doc-1',
      userId: 'user-1',
      delta: '+World',
      version: 1,
      timestamp: Date.now() + 100,
      type: 'insert' as const
    }

    assert.equal(resolver.detectConflict(localOp, remoteOp), false)
  })
})
