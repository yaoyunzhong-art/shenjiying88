import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [realtime] [A] stress test — 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 高并发协同编辑 (多用户同时操作)
 * - 大量 CRDT 操作 (1000+ 连续操作)
 * - WebSocket 会话高并发加入/离开
 * - 在线状态快速闪变
 * - 多设备频繁同步
 * - 极端输入 (超大文本, 空/负值)
 */

import assert from 'node:assert/strict'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService } from './crdt.service'
import { RealtimeController } from './realtime.controller'
import type { CRDTOperation, CRDTDocumentState } from './crdt.service'
import type { RealtimeCollabOperation } from './realtime.entity'

// ─── 工厂: 构建完整的 controller ──────────────────────────────────────

function makeController(): RealtimeController {
  const collabEditor = new CollaborativeEditor()
  const presenceService = new PresenceService()
  const conflictResolver = new ConflictResolver()
  const collabService = new CollabService()
  const crdtDocument = new CRDTDocument()
  const wsManager = new WebSocketSessionManager()
  const syncService = new MultiDeviceSyncService(crdtDocument, wsManager)
  return new RealtimeController(
    collabEditor,
    presenceService,
    conflictResolver,
    collabService,
    crdtDocument,
    wsManager,
    syncService,
  )
}

// ─── 高并发协同编辑 ──────────────────────────────────────────────────

describe('高并发协同编辑', () => {
  it('100 个文档快速创建不崩溃', () => {
    const ctrl = makeController()
    const docIds: string[] = []
    for (let i = 0; i < 100; i++) {
      const res = ctrl.createCollabDocument({ title: `doc-${i}`, ownerId: `owner-${i}` })
      assert.equal(res.success, true)
      docIds.push((res.data as any).id)
    }
    // 验证第一个可检索
    const doc = ctrl.getCollabDocument(docIds[0])
    assert.equal(doc.success, true)
  })

  it('50 个用户同时编辑同一文档', () => {
    const ctrl = makeController()
    // 创建文档
    const doc = ctrl.createCollabDocument({ title: 'mass-edit', ownerId: 'alice' }).data as any
    // 50 次编辑（delta 必须以 + 开头）
    for (let i = 0; i < 50; i++) {
      const res = ctrl.updateContent({
        docId: doc.id,
        delta: `+edit-${i}`,
        userId: 'alice',
      })
      assert.equal(res.success, true)
    }
    // 验证版本
    const finalDoc = ctrl.getCollabDocument(doc.id).data as any
    assert.equal(finalDoc.version, 50)
    assert.ok(finalDoc.content.length > 0)
  })

  it('在 100 个用户文档上邀请 50 个编辑者', () => {
    const ctrl = makeController()
    const doc = ctrl.createCollabDocument({ title: 'big-team', ownerId: 'lead' })
    assert(doc.data)
    const docId = (doc.data as any).id
    const editors = Array.from({ length: 50 }, (_, i) => `editor-${i}`)
    const res = ctrl.inviteEditors({ docId, userIds: editors })
    assert.equal(res.success, true)
    assert(res.data)
    assert.equal((res.data as any).editors.length, 51) // owner + 50
  })

  it('不存在的文档 invite 返回 error', () => {
    const ctrl = makeController()
    const res = ctrl.inviteEditors({ docId: 'does-not-exist', userIds: ['user1'] })
    assert.equal(res.success, false)
  })

  it('不存在的文档 update 返回 error', () => {
    const ctrl = makeController()
    const res = ctrl.updateContent({ docId: 'ghost', delta: '+x', userId: 'u' })
    assert.equal(res.success, false)
  })
})

// ─── CRDT 压力 ─────────────────────────────────────────────────────────

describe('CRDT 压力', () => {
  it('1000 次连续 CRDT 追加操作', () => {
    const ctrl = makeController()
    const doc = ctrl.createCRDTDocument({ docId: 'crdt-stress-append' })
    assert.equal(doc.success, true)

    for (let i = 0; i < 1000; i++) {
      const op: CRDTOperation = {
        id: `op-${i}`,
        type: 'append',
        content: `chunk-${i}`,
        timestamp: Date.now() + i,
        clientId: 'stress-client',
        version: i, // 从0开始，因为CRDT内部递增 version
      }
      const res = ctrl.applyCRDTOperation({ docId: 'crdt-stress-append', operation: op })
      assert.equal(res.success, true)
    }

    const state = ctrl.getCRDTState('crdt-stress-append').data as CRDTDocumentState
    assert.equal(state.version, 1000)
    assert.equal(state.operations.length, 1000)
  })

  it('不存在的文档 apply 返回 error', () => {
    const ctrl = makeController()
    const op: CRDTOperation = { id: 'op-0', type: 'append', content: 'x', timestamp: 1, clientId: 'c', version: 0 }
    const res = ctrl.applyCRDTOperation({ docId: 'ghost', operation: op })
    assert.equal(res.success, false)
  })

  it('合并超大远程文档不崩溃', () => {
    const ctrl = makeController()
    const remoteDoc: CRDTDocumentState = {
      docId: 'huge-remote',
      content: 'x'.repeat(10000),
      version: 0,
      lastModified: Date.now(),
      operations: Array.from({ length: 100 }, (_, i) => ({
        id: `remote-op-${i}`,
        type: 'append' as const,
        content: 'data-'.repeat(20),
        timestamp: Date.now() + i,
        clientId: `remote-${i}`,
        version: i,
      })),
    }
    const res = ctrl.mergeCRDTDocument({ remoteDoc })
    assert.equal(res.success, true)
    const state = ctrl.getCRDTState('huge-remote').data as CRDTDocumentState
    assert.ok(state.content.length >= 10000)
  })

  it('重复应用相同操作（CRDT 不自动去重）', () => {
    const ctrl = makeController()
    ctrl.createCRDTDocument({ docId: 'crdt-no-dedup' })
    // CRDT 实现不会根据 id 去重, 因此相同操作被应用两次内容会重复
    const op: CRDTOperation = { id: 'dup-op', type: 'append', content: 'hello', timestamp: 100, clientId: 'c1', version: 0 }
    ctrl.applyCRDTOperation({ docId: 'crdt-no-dedup', operation: op })
    ctrl.applyCRDTOperation({ docId: 'crdt-no-dedup', operation: { ...op, version: 1 } })

    const state = ctrl.getCRDTState('crdt-no-dedup').data as CRDTDocumentState
    // CRDT 不自动去重同名操作, 内容会重复
    assert.equal(state.content, 'hellohello')
    assert.equal(state.version, 2)
  })

  it('超大文档获取状态不崩溃', () => {
    const ctrl = makeController()
    ctrl.createCRDTDocument({ docId: 'crdt-huge-state' })
    const op: CRDTOperation = {
      id: 'huge-op',
      type: 'append',
      content: 'ABCDEFGHIJ'.repeat(1000),
      timestamp: 1,
      clientId: 'c1',
      version: 0,
    }
    ctrl.applyCRDTOperation({ docId: 'crdt-huge-state', operation: op })
    const state = ctrl.getCRDTState('crdt-huge-state')
    assert.equal(state.success, true)
    const data = state.data as CRDTDocumentState
    assert.equal(data.content.length, 10000)
  })
})

// ─── WebSocket 会话高并发 ─────────────────────────────────────────────

describe('WebSocket 会话高并发', () => {
  it('同时创建 100 个会话不崩溃', () => {
    const ctrl = makeController()
    for (let i = 0; i < 100; i++) {
      const res = ctrl.createWsSession({ docId: `wsdoc-${i}`, userId: `user-${i}` })
      assert.equal(res.success, true)
    }
  })

  it('100 个用户加入同一会话', () => {
    const ctrl = makeController()
    const session = ctrl.createWsSession({ docId: 'mass-join-doc', userId: 'host' }).data as { sessionId: string }
    for (let i = 0; i < 100; i++) {
      const res = ctrl.joinWsSession({ sessionId: session.sessionId, userId: `joiner-${i}` })
      assert.equal(res.success, true)
    }
    const sessionData = ctrl.getWsSession(session.sessionId).data as { users: Set<string> }
    assert.equal(sessionData.users.size, 101)
  })

  it('100 个用户反复加入/离开不崩溃', () => {
    const ctrl = makeController()
    const session = ctrl.createWsSession({ docId: 'ping-pong-doc', userId: 'host' }).data as { sessionId: string }
    for (let i = 0; i < 100; i++) {
      ctrl.joinWsSession({ sessionId: session.sessionId, userId: `flaky-${i}` })
      ctrl.leaveWsSession({ sessionId: session.sessionId, userId: `flaky-${i}` })
    }
    const sessionData = ctrl.getWsSession(session.sessionId).data as { users: Set<string> }
    assert.equal(sessionData.users.size, 1) // only host remains
  })

  it('加入不存在的会话返回 error', () => {
    const ctrl = makeController()
    const res = ctrl.joinWsSession({ sessionId: 'ghost-session', userId: 'u' })
    assert.equal(res.success, false)
  })

  it('离开用户后用户活跃会话列表正确', () => {
    const ctrl = makeController()
    // u1 创建 d1 和 d2 两个会话, d1 额外加入 u2 以保持会话不删除
    const s1 = ctrl.createWsSession({ docId: 'd1', userId: 'u1' }).data as { sessionId: string }
    const s2 = ctrl.createWsSession({ docId: 'd2', userId: 'u1' }).data as { sessionId: string }
    ctrl.joinWsSession({ sessionId: s1.sessionId, userId: 'u2' })
    // u1 离开 d1 会话
    ctrl.leaveWsSession({ sessionId: s1.sessionId, userId: 'u1' })
    // 检查 session s2 仍然包含 u1
    const s2data = ctrl.getWsSession(s2.sessionId).data as { users: Set<string> }
    assert.equal(s2data.users.has('u1'), true)
    // 检查 session s1 不再包含 u1 (但 u2 还在, 所以会话不删除)
    const s1data = ctrl.getWsSession(s1.sessionId).data as { users: Set<string> }
    assert.equal(s1data.users.has('u1'), false)
    // listActiveSessions 返回 Session 对象数组
    const active = ctrl.listActiveSessions('u1').data as Array<{ sessionId: string }>
    assert.equal(active.length, 1)
    assert.equal(active[0].sessionId, s2.sessionId)
  })

  it('所有会话列表返回正确数量', () => {
    const ctrl = makeController()
    for (let i = 0; i < 50; i++) {
      ctrl.createWsSession({ docId: `all-${i}`, userId: `u${i % 10}` })
    }
    const all = ctrl.listAllSessions().data as unknown[]
    assert.equal(all.length, 50)
  })
})

// ─── 在线状态快速闪变 ──────────────────────────────────────────────

describe('在线状态快速闪变', () => {
  it('100 次心跳不崩溃', () => {
    const ctrl = makeController()
    for (let i = 0; i < 100; i++) {
      const res = ctrl.heartbeat({ userId: `hb-user`, docId: `hb-doc-${i % 10}` })
      assert.equal(res.success, true)
    }
  })

  it('50 次状态切换不崩溃', () => {
    const ctrl = makeController()
    const statuses: Array<'online' | 'away' | 'busy'> = ['online', 'away', 'busy']
    for (let i = 0; i < 50; i++) {
      const res = ctrl.setUserStatus({ userId: 'flip-user', status: statuses[i % 3] })
      assert.equal(res.success, true)
    }
  })

  it('大量用户在线后在线列表正确', () => {
    const ctrl = makeController()
    for (let i = 0; i < 100; i++) {
      ctrl.heartbeat({ userId: `online-${i}`, docId: 'big-doc' })
    }
    const online = ctrl.getOnlineUsers('big-doc').data as unknown[]
    assert.equal(online.length, 100)
  })

  it('光标频繁移动不崩溃', () => {
    const ctrl = makeController()
    for (let i = 0; i < 100; i++) {
      const res = ctrl.setCursor({
        userId: 'cursor-user',
        docId: 'cursor-doc',
        cursor: { line: i % 200, column: i % 80 },
      })
      assert.equal(res.success, true)
    }
  })

  it('移除不存在的用户不崩溃', () => {
    const ctrl = makeController()
    const res = ctrl.removePresence({ userId: 'no-such-user' })
    assert.equal(res.success, true)
  })
})

// ─── 冲突解决压力 ───────────────────────────────────────────────────

describe('冲突解决压力', () => {
  it('检测 100 对冲突不崩溃', () => {
    const ctrl = makeController()
    for (let i = 0; i < 100; i++) {
      const localOp: RealtimeCollabOperation = {
        id: `local-${i}`, docId: 'conflict-doc', userId: 'alice',
        delta: `a-${i}`, version: i, timestamp: 100 + i, type: 'insert',
      }
      const remoteOp: RealtimeCollabOperation = {
        id: `remote-${i}`, docId: 'conflict-doc', userId: 'bob',
        delta: `b-${i}`, version: i, timestamp: 100 + i, type: 'insert',
      }
      const res = ctrl.detectConflict({ localOp, remoteOp })
      assert.equal(res.success, true)
    }
  })

  it('LWW 解决 100 个并发操作不崩溃', () => {
    const ctrl = makeController()
    const ops = Array.from({ length: 100 }, (_, i) => ({
      id: `lww-${i}`, docId: 'lww-doc', userId: i % 2 === 0 ? 'alice' : 'bob',
      delta: `op-${i}`, version: i, timestamp: 1000 + i * 10, type: 'insert' as const,
    }))
    const res = ctrl.resolveLWW({ ops })
    assert.equal(res.success, true)
  })

  it('Merge 解决 100 个并发操作不崩溃', () => {
    const ctrl = makeController()
    const ops = Array.from({ length: 100 }, (_, i) => ({
      id: `merge-${i}`, docId: 'merge-doc', userId: i % 2 === 0 ? 'alice' : 'bob',
      delta: `delta-${i}`, version: i, timestamp: 1000 + i * 10, type: 'insert' as const,
    }))
    const res = ctrl.resolveMerge({ ops })
    assert.equal(res.success, true)
  })

  it('冲突报告获取不崩溃', () => {
    const ctrl = makeController()
    // 先生成冲突
    const localOp: RealtimeCollabOperation = {
      id: 'l1', docId: 'report-doc', userId: 'alice',
      delta: 'a', version: 0, timestamp: 100, type: 'insert',
    }
    const remoteOp: RealtimeCollabOperation = {
      id: 'r1', docId: 'report-doc', userId: 'bob',
      delta: 'b', version: 0, timestamp: 100, type: 'insert',
    }
    ctrl.detectConflict({ localOp, remoteOp })
    const report = ctrl.getConflictReport('report-doc')
    assert.equal(report.success, true)
  })

  it('清除不存在的文档冲突不崩溃', () => {
    const ctrl = makeController()
    const res = ctrl.clearConflicts({ docId: 'ghost-doc' })
    assert.equal(res.success, true)
  })

  it('空数组 LWW 解决返回 error', () => {
    const ctrl = makeController()
    const res = ctrl.resolveLWW({ ops: [] })
    assert.equal(res.success, false)
  })
})

// ─── 多设备同步压力 ─────────────────────────────────────────────────

describe('多设备同步压力', () => {
  it('50 个用户同步到 3 个设备不崩溃', () => {
    const ctrl = makeController()
    for (let i = 0; i < 50; i++) {
      const state: CRDTDocumentState = {
        docId: `sync-doc-${i}`,
        content: `content-${i}`,
        version: 0,
        lastModified: Date.now(),
        operations: [],
      }
      for (let d = 0; d < 3; d++) {
        const res = ctrl.syncToDevice({ userId: `user-${i}`, deviceId: `dev-${d}`, state })
        assert.equal(res.success, true)
      }
    }
  })

  it('1000 次 pending 操作添加不崩溃', () => {
    const ctrl = makeController()
    for (let i = 0; i < 1000; i++) {
      const res = ctrl.addPendingOp({
        userId: 'pending-user',
        deviceId: `dev-${i % 5}`,
        op: { id: `op-${i}`, type: 'append', content: 'x', timestamp: Date.now() + i, clientId: 'c', version: i },
      })
      assert.equal(res.success, true)
    }
    const pending = ctrl.getPendingOps('pending-user', 'dev-0').data as unknown[]
    assert.ok(pending.length >= 100)
  })

  it('设备冲突解决不崩溃', () => {
    const ctrl = makeController()
    const state: CRDTDocumentState = {
      docId: 'conflict-resolve-doc', content: 'data', version: 1, lastModified: Date.now(), operations: [],
    }
    ctrl.syncToDevice({ userId: 'resolve-user', deviceId: 'dev-a', state })
    ctrl.syncToDevice({ userId: 'resolve-user', deviceId: 'dev-b', state })
    const res = ctrl.resolveDeviceConflict({ userId: 'resolve-user', deviceId1: 'dev-a', deviceId2: 'dev-b' })
    assert.equal(res.success, true)
  })

  it('同步状态查询为空时返回 error', () => {
    const ctrl = makeController()
    const res = ctrl.getSyncStatus('no-such-user')
    assert.equal(res.success, false)
  })
})

// ─── 协同会话压力 ──────────────────────────────────────────────────

describe('协同会话压力', () => {
  it('100 个协同会话创建不崩溃', () => {
    const ctrl = makeController()
    for (let i = 0; i < 100; i++) {
      const res = ctrl.createCollabSession({ docId: `colldoc-${i}`, ownerId: `owner-${i}` })
      assert.equal(res.success, true)
    }
  })

  it('50 个用户加入同一协同会话', () => {
    const ctrl = makeController()
    const session = ctrl.createCollabSession({ docId: 'collab-mass-join', ownerId: 'host' }).data as any
    for (let i = 0; i < 50; i++) {
      const res = ctrl.joinCollabSession({ sessionId: session.id, userId: `member-${i}` })
      assert.equal(res.success, true)
    }
    const participants = ctrl.getParticipants(session.id).data as unknown[]
    assert.equal(participants.length, 51)
  })

  it('100 次广播不崩溃', () => {
    const ctrl = makeController()
    const session = ctrl.createCollabSession({ docId: 'broadcast-test', ownerId: 'host' }).data as any
    for (let i = 0; i < 100; i++) {
      const res = ctrl.broadcastChange({ sessionId: session.id, userId: 'host', change: { seq: i, data: `change-${i}` } })
      assert.equal(res.success, true)
    }
  })

  it('离开协同会话后参与者列表更新', () => {
    const ctrl = makeController()
    const session = ctrl.createCollabSession({ docId: 'leave-test', ownerId: 'host' }).data as any
    ctrl.joinCollabSession({ sessionId: session.id, userId: 'joiner' })
    ctrl.leaveCollabSession({ sessionId: session.id, userId: 'host' })
    const participants = ctrl.getParticipants(session.id).data as unknown[]
    assert.equal(participants.length, 1) // only joiner
  })

  it('光标管理大量操作不崩溃', () => {
    const ctrl = makeController()
    const session = ctrl.createCollabSession({ docId: 'cursor-stress', ownerId: 'host' }).data as any
    for (let i = 0; i < 50; i++) {
      ctrl.addCursor({ sessionId: session.id, userId: `user-${i}`, line: i, column: i * 2 })
    }
    const cursors = ctrl.listCursors(session.id).data as unknown[]
    assert.equal(cursors.length, 50)

    // 移除部分
    for (let i = 0; i < 25; i++) {
      ctrl.removeCursor({ sessionId: session.id, userId: `user-${i}` })
    }
    const remaining = ctrl.listCursors(session.id).data as unknown[]
    assert.equal(remaining.length, 25)
  })
})

// ─── 评论压力 ─────────────────────────────────────────────────────────

describe('评论压力', () => {
  it('100 条评论添加不崩溃', () => {
    const ctrl = makeController()
    const session = ctrl.createCollabSession({ docId: 'comment-stress', ownerId: 'host' }).data as any
    for (let i = 0; i < 100; i++) {
      const res = ctrl.addComment({
        sessionId: session.id,
        userId: `commenter-${i % 10}`,
        content: `Comment #${i} - long text `.repeat(10),
        selection: { start: i * 5, end: i * 5 + 20 },
      })
      assert.equal(res.success, true)
    }
    const comments = ctrl.listComments(session.id).data as unknown[]
    assert.equal(comments.length, 100)
  })

  it('50 条评论解决后列表正确', () => {
    const ctrl = makeController()
    const session = ctrl.createCollabSession({ docId: 'resolve-stress', ownerId: 'host' }).data as any
    const commentIds: string[] = []
    for (let i = 0; i < 50; i++) {
      const res = ctrl.addComment({
        sessionId: session.id, userId: 'u', content: `comment-${i}`,
        selection: { start: 0, end: 1 },
      })
      const data = res.data as { id: string }
      commentIds.push(data.id)
    }
    // 解决前 25 条
    for (let i = 0; i < 25; i++) {
      const res = ctrl.resolveComment({ sessionId: session.id, commentId: commentIds[i] })
      assert.equal(res.success, true)
    }
    const comments = ctrl.listComments(session.id).data as Array<{ resolved: boolean }>
    const resolved = comments.filter((c) => c.resolved)
    const unresolved = comments.filter((c) => !c.resolved)
    assert.equal(resolved.length, 25)
    assert.equal(unresolved.length, 25)
  })

  it('空内容评论不崩溃', () => {
    const ctrl = makeController()
    const session = ctrl.createCollabSession({ docId: 'empty-comment', ownerId: 'host' }).data as any
    const res = ctrl.addComment({
      sessionId: session.id, userId: 'u', content: '',
      selection: { start: 0, end: 0 },
    })
    assert.equal(res.success, true)
  })
})

// ─── 极端输入与边界 ──────────────────────────────────────────────

describe('极端输入与边界', () => {
  it('空凭据文档创建正常', () => {
    const ctrl = makeController()
    const res = ctrl.createCollabDocument({ title: '', ownerId: '' })
    assert.equal(res.success, true)
  })

  it('超大 Delta 编辑不崩溃', () => {
    const ctrl = makeController()
    const doc = ctrl.createCollabDocument({ title: 'big-delta', ownerId: 'alice' }).data as any
    // delta 以 + 开头表示 insert
    const bigDelta = 'A'.repeat(50000)
    const res = ctrl.updateContent({ docId: doc.id, delta: `+${bigDelta}`, userId: 'alice' })
    assert.equal(res.success, true)
    const docData = ctrl.getCollabDocument(doc.id).data as any
    assert.equal(docData.content.length, 50000)
  })

  it('重复创建相同 docId 时 CRDT 返回已有文档', () => {
    const ctrl = makeController()
    ctrl.createCRDTDocument({ docId: 'dup-test' })
    const op: CRDTOperation = { id: '1', type: 'append', content: 'first', timestamp: 1, clientId: 'c', version: 0 }
    ctrl.applyCRDTOperation({ docId: 'dup-test', operation: op })
    // 创建相同 docId (CRDT 返回已有文档, 不覆盖)
    const result = ctrl.createCRDTDocument({ docId: 'dup-test' })
    assert.equal(result.success, true)
    const state = ctrl.getCRDTState('dup-test').data as CRDTDocumentState
    // CRDT createDocument 对已存在的文档直接返回已有状态, 不覆盖内容
    assert.equal(state.content, 'first')
    assert.equal(state.version, 1)
  })

  it('会话同名文档重复创建不冲突', () => {
    const ctrl = makeController()
    const s1 = ctrl.createWsSession({ docId: 'same-doc', userId: 'u1' })
    const s2 = ctrl.createWsSession({ docId: 'same-doc', userId: 'u2' })
    assert.equal(s1.success, true)
    assert.equal(s2.success, true)
    const d1 = s1.data as { sessionId: string }
    const d2 = s2.data as { sessionId: string }
    assert.notEqual(d1.sessionId, d2.sessionId)
  })

  it('健康检查返回模块标识', () => {
    const ctrl = makeController()
    const health = ctrl.health()
    assert.equal(health.status, 'ok')
    assert.equal(health.module, 'realtime')
  })

  it('CRDT delete 后文档不存在', () => {
    const ctrl = makeController()
    ctrl.createCRDTDocument({ docId: 'to-delete' })
    const deleted = ctrl.deleteCRDTDocument({ docId: 'to-delete' })
    assert.equal(deleted.success, true)
    const state = ctrl.getCRDTState('to-delete')
    assert.equal(state.success, false)
  })
})
