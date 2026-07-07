import { describe, it, expect, beforeEach } from 'vitest'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService } from './crdt.service'

/**
 * 🐜 [realtime] 角色扩展测试（修复版）
 * 覆盖实时通信、协同编辑、CRDT 及多设备同步边界场景
 */

function setupCollab() {
  const collab = new CollabService()
  return { collab }
}

function setupEditor() {
  const editor = new CollaborativeEditor()
  return { editor }
}

function setupPresence() {
  const presence = new PresenceService()
  return { presence }
}

function setupCRDT() {
  const crdt = new CRDTDocument()
  const wsManager = new WebSocketSessionManager()
  const sync = new MultiDeviceSyncService(crdt, wsManager)
  return { crdt, wsManager, sync }
}

// ─── 👔 店长 — 协同会话管理 ────────────────────────────────────────────────

describe('👔店长 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupCollab>
  beforeEach(() => { svc = setupCollab() })

  it('创建协同会话', () => {
    const session = svc.collab.createSession('doc-store', 'store-owner')
    expect(session.id).toBeTruthy()
    expect(session.documentId).toBe('doc-store')
    expect(session.ownerId).toBe('store-owner')
    expect(session.participants).toContain('store-owner')
  })

  it('通过广播变更通知所有参与者', () => {
    const session = svc.collab.createSession('doc-ops', 'manager')
    svc.collab.joinSession(session.id, 'staff-a')
    svc.collab.joinSession(session.id, 'staff-b')
    const result = svc.collab.broadcastChange(session.id, 'manager', { type: 'content-update' })
    expect(result.recipients.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── 🛒 前台 — 协作文档编辑 ────────────────────────────────────────────────

describe('🛒前台 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupEditor>
  beforeEach(() => { svc = setupEditor() })

  it('创建并编辑协作文档', () => {
    const doc = svc.editor.createDocument('排班表', 'front-desk')
    const result = svc.editor.updateContent(doc.id, '+新记录', 'front-desk')
    expect(result).toBeDefined()
    expect(result!.version).toBe(1)
  })

  it('非协作者无法更新文档内容', () => {
    const doc = svc.editor.createDocument('内部记录', 'owner')
    const result = svc.editor.updateContent(doc.id, '+敏感信息', 'outsider')
    expect(result).toBeUndefined()
  })
})

// ─── 👥 HR — 在线状态管理 ──────────────────────────────────────────────────

describe('👥HR realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupPresence>
  beforeEach(() => { svc = setupPresence() })

  it('用户心跳更新在线状态', () => {
    svc.presence.heartbeat('hr-user', 'doc-hr')
    const online = svc.presence.getOnlineUsers('doc-hr')
    expect(online.length).toBe(1)
    expect(online[0].userId).toBe('hr-user')
  })

  it('删除用户后所有状态被清理', () => {
    svc.presence.heartbeat('hr-user', 'doc-hr')
    svc.presence.removeUser('hr-user')
    const online = svc.presence.getOnlineUsers('doc-hr')
    expect(online.length).toBe(0)
  })
})

// ─── 🔧 安监 — 冲突检测与解决 ──────────────────────────────────────────────

describe('🔧安监 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupCRDT>
  beforeEach(() => { svc = setupCRDT() })

  it('CRDT 文档创建与操作应用', () => {
    const state = svc.crdt.createDocument('sec-doc')
    expect(state.content).toBe('')

    svc.crdt.applyOperation('sec-doc', {
      id: 'op-1',
      type: 'append',
      content: '安全日志',
      timestamp: Date.now(),
      clientId: 'camera-1',
      version: 1,
    })
    const updated = svc.crdt.getState('sec-doc')
    expect(updated!.content).toContain('安全日志')
    expect(updated!.version).toBe(1)
  })

  it('远程合并保持数据一致', () => {
    const local = svc.crdt.createDocument('merge-doc')
    svc.crdt.applyOperation('merge-doc', {
      id: 'op-local',
      type: 'append',
      content: '本地数据',
      timestamp: 100,
      clientId: 'local',
      version: 1,
    })

    const remoteState = svc.crdt.getState('merge-doc')!
    // 模拟远程有更高版本
    remoteState.version = 2
    remoteState.content = '本地数据+远程数据'

    const merged = svc.crdt.merge(remoteState)
    expect(merged).not.toBeNull()
    expect(merged!.version).toBeGreaterThanOrEqual(2)
  })
})

// ─── 🎮 导玩员 — 会话参与管理 ───────────────────────────────────────────────

describe('🎮导玩员 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupCRDT>
  beforeEach(() => { svc = setupCRDT() })

  it('创建并加入 WebSocket 会话', () => {
    const session = svc.wsManager.createSession('doc-game', 'player-1')
    const joined = svc.wsManager.joinSession(session.sessionId, 'player-2')
    expect(joined).not.toBeNull()
    expect(joined!.users.has('player-2')).toBe(true)
  })

  it('离开会话后用户不再在线', () => {
    const session = svc.wsManager.createSession('doc-game', 'player-1')
    svc.wsManager.joinSession(session.sessionId, 'player-2')
    svc.wsManager.leaveSession(session.sessionId, 'player-2')
    const sessions = svc.wsManager.getActiveSessions('player-2')
    expect(sessions.length).toBe(0)
  })
})

// ─── 🎯 运行专员 — 多设备同步 ──────────────────────────────────────────────

describe('🎯运行专员 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupCRDT>
  beforeEach(() => { svc = setupCRDT() })

  it('多设备同步状态正确', () => {
    const state = svc.crdt.createDocument('sync-doc')
    const deviceState = svc.sync.syncToDevice('ops-user', 'device-a', state)
    expect(deviceState.deviceId).toBe('device-a')
    expect(deviceState.userId).toBe('ops-user')
  })

  it('添加待同步操作可在 pending 中查到', () => {
    svc.sync.addPendingOp('ops-user', 'device-b', {
      id: 'op-pending',
      type: 'append',
      content: '待同步',
      timestamp: Date.now(),
      clientId: 'device-b',
      version: 1,
    })
    const pending = svc.sync.getPendingOps('ops-user', 'device-b')
    expect(pending.length).toBe(1)
    expect(pending[0].content).toBe('待同步')
  })
})

// ─── 🤝 团建 — 评论协作 ─────────────────────────────────────────────────────

describe('🤝团建 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupCollab>
  beforeEach(() => { svc = setupCollab() })

  it('添加评论并可在列表中查到', () => {
    const session = svc.collab.createSession('doc-team', 'organizer')
    svc.collab.addComment(session.id, 'organizer', {
      content: '建议周末团建',
      selection: { start: 0, end: 5 },
    })
    const comments = svc.collab.listComments(session.id)
    expect(comments.length).toBe(1)
    expect(comments[0].content).toBe('建议周末团建')
  })

  it('解决评论后 resolved 为 true', () => {
    const session = svc.collab.createSession('doc-team', 'organizer')
    const comment = svc.collab.addComment(session.id, 'organizer', {
      content: '需要确认',
      selection: { start: 0, end: 4 },
    })
    const resolved = svc.collab.resolveComment(session.id, comment.id)
    expect(resolved.resolved).toBe(true)
  })
})

// ─── 📢 营销 — 广播与 cursor ────────────────────────────────────────────────

describe('📢营销 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setupCollab>
  beforeEach(() => { svc = setupCollab() })

  it('添加光标并在列表中查到', () => {
    const session = svc.collab.createSession('doc-marketing', 'marketer')
    const cursor = svc.collab.addCursor(session.id, 'marketer', 3, 10)
    expect(cursor.position).toEqual({ line: 3, column: 10 })
    const cursors = svc.collab.listCursors(session.id)
    expect(cursors.length).toBe(1)
  })

  it('移除光标后列表清空', () => {
    const session = svc.collab.createSession('doc-marketing', 'marketer')
    svc.collab.addCursor(session.id, 'marketer', 1, 5)
    svc.collab.removeCursor(session.id, 'marketer')
    const cursors = svc.collab.listCursors(session.id)
    expect(cursors.length).toBe(0)
  })
})
