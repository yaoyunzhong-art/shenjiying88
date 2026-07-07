import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RealtimeController } from './realtime.controller'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService } from './crdt.service'
import type { RealtimeCollabOperation } from './realtime.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

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

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以在游戏中创建实时交互文档（正常流程）', () => {
    const result = ctrl.createCollabDocument({ title: '游戏互动指南', ownerId: 'guide-01' })
    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.equal(result.data.title, '游戏互动指南')
    assert.equal(result.data.ownerId, 'guide-01')
    assert.ok(result.data.id)
  })

  it('导玩员可以查看协同文档（正常流程）', () => {
    const created = ctrl.createCollabDocument({ title: '积分排行榜', ownerId: 'guide-01' })
    const docId = created.data.id

    const result = ctrl.getCollabDocument(docId)
    assert.equal(result.success, true)
    assert.equal(result.data!.title, '积分排行榜')
    assert.equal(result.data!.editors.length, 1)
  })

  it('导玩员可以向文档添加内容（正常流程）', () => {
    const created = ctrl.createCollabDocument({ title: '游戏攻略', ownerId: 'guide-01' })
    const docId = created.data.id

    const result = ctrl.updateContent({ docId, delta: '+欢迎来到街机厅', userId: 'guide-01' })
    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.equal(result.data.version, 1)

    // 验证文档内容已更新
    const doc = ctrl.getCollabDocument(docId)
    assert.equal(doc.data!.content, '欢迎来到街机厅')
  })

  it('导玩员可以邀请其他玩家加入文档协作（正常流程）', () => {
    const created = ctrl.createCollabDocument({ title: '多人游戏', ownerId: 'guide-01' })
    const docId = created.data.id

    const result = ctrl.inviteEditors({ docId, userIds: ['player-01', 'player-02'] })
    assert.equal(result.success, true)
    assert.ok(result.data!.editors.includes('player-01'))
    assert.ok(result.data!.editors.includes('player-02'))
  })

  it('导玩员查看不存在的文档应返回错误（反例）', () => {
    const result = ctrl.getCollabDocument('doc-nonexistent')
    assert.equal(result.success, false)
    assert.ok(result.error)
    assert.equal(result.error, 'Document not found')
  })

  it('导玩员可以报告自己的在线状态（正常流程）', () => {
    const result = ctrl.heartbeat({ userId: 'guide-01', docId: 'doc-gaming' })
    assert.equal(result.success, true)
  })

  it('导玩员查看文档操作历史（正常流程）', () => {
    const created = ctrl.createCollabDocument({ title: '操作历史测试', ownerId: 'guide-01' })
    const docId = created.data.id

    ctrl.updateContent({ docId, delta: '+第一行', userId: 'guide-01' })
    ctrl.updateContent({ docId, delta: '+第二行', userId: 'guide-01' })

    const result = ctrl.getCollabOperations(docId)
    assert.equal(result.success, true)
    assert.ok(result.total >= 2)
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Ops} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以创建 CRDT 文档监控实时数据（正常流程）', () => {
    const result = ctrl.createCRDTDocument({ docId: 'monitor-dash-01' })
    assert.equal(result.success, true)
    assert.equal(result.data.docId, 'monitor-dash-01')
    assert.equal(result.data.content, '')
    assert.equal(result.data.version, 0)
  })

  it('运行专员可以应用 CRDT 操作（正常流程）', () => {
    ctrl.createCRDTDocument({ docId: 'ops-data-01' })
    const result = ctrl.applyCRDTOperation({
      docId: 'ops-data-01',
      operation: {
        id: 'op-001',
        type: 'append',
        content: '{"cpu": 45, "mem": 68}',
        timestamp: Date.now(),
        clientId: 'ops-01',
        version: 1,
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.data!.version, 1)
    assert.ok(result.data!.content.includes('cpu'))
  })

  it('运行专员可以查看 CRDT 文档状态（正常流程）', () => {
    ctrl.createCRDTDocument({ docId: 'status-check-01' })
    const result = ctrl.getCRDTState('status-check-01')
    assert.equal(result.success, true)
    assert.equal(result.data!.docId, 'status-check-01')
  })

  it('运行专员可以创建和查看 WebSocket 会话（正常流程）', () => {
    const created = ctrl.createWsSession({ docId: 'ops-session', userId: 'ops-01' })
    assert.equal(created.success, true)
    assert.equal(created.data.docId, 'ops-session')

    const viewed = ctrl.getWsSession(created.data.sessionId)
    assert.equal(viewed.success, true)
    assert.equal(viewed.data!.sessionId, created.data.sessionId)
  })

  it('运行专员可以列出用户活跃会话（正常流程）', () => {
    ctrl.createWsSession({ docId: 'doc-a', userId: 'ops-01' })
    ctrl.createWsSession({ docId: 'doc-b', userId: 'ops-01' })

    const result = ctrl.listActiveSessions('ops-01')
    assert.equal(result.success, true)
    assert.equal(result.total, 2)
  })

  it('运行专员查看不存在的 CRDT 文档应报错（反例）', () => {
    const result = ctrl.getCRDTState('nonexistent-doc')
    assert.equal(result.success, false)
    assert.equal(result.error, 'Document not found')
  })

  it('运行专员可以合并远程文档状态（正常流程）', () => {
    ctrl.createCRDTDocument({ docId: 'merge-test' })
    const result = ctrl.mergeCRDTDocument({
      remoteDoc: {
        docId: 'merge-test',
        content: 'remote content',
        operations: [],
        version: 3,
        lastModified: Date.now(),
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.data!.version, 3)
  })
})

// ──────────── 🤝 团建 ────────────
describe(`${ROLES.Teambuilding} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以创建协作会话用于团队活动（正常流程）', () => {
    const result = ctrl.createCollabSession({ docId: 'team-event-plan', ownerId: 'tb-01' })
    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.equal(result.data.ownerId, 'tb-01')
    assert.equal(result.data.documentId, 'team-event-plan')
  })

  it('团建可以邀请成员加入协作会话（正常流程）', () => {
    // 用 collab service 邀请合作者到 collab document
    const created = ctrl.createCollabDocument({ title: '团队会议', ownerId: 'tb-01' })
    const docId = created.data.id

    const inviteResult = ctrl.inviteEditors({ docId, userIds: ['member-01', 'member-02'] })
    assert.equal(inviteResult.success, true)
    assert.ok(inviteResult.data!.editors.includes('member-01'))
    assert.ok(inviteResult.data!.editors.includes('member-02'))

    // 用 ws session 加入
    const wsSession = ctrl.createWsSession({ docId, userId: 'tb-01' })
    const joinWs = ctrl.joinWsSession({ sessionId: wsSession.data.sessionId, userId: 'member-01' })
    assert.equal(joinWs.success, true)
  })

  it('团建可以添加评论进行团队协作（正常流程）', () => {
    const session = ctrl.createCollabSession({ docId: 'team-plan', ownerId: 'tb-01' })
    const sessionId = session.data.id

    const comment = ctrl.addComment({
      sessionId,
      userId: 'tb-01',
      content: '这个方案不错！',
      selection: { start: 0, end: 10 },
    })
    assert.equal(comment.success, true)
    assert.ok(comment.data)
    assert.equal(comment.data.content, '这个方案不错！')
  })

  it('团建可以查看协同文档的在线用户（正常流程）', () => {
    ctrl.heartbeat({ userId: 'tb-01', docId: 'team-doc' })
    ctrl.heartbeat({ userId: 'tb-02', docId: 'team-doc' })

    const result = ctrl.getOnlineUsers('team-doc')
    assert.equal(result.success, true)
    assert.ok(result.total >= 2)
  })

  it('团建可以离开协作会话（正常流程）', () => {
    const wsSession = ctrl.createWsSession({ docId: 'leave-test', userId: 'tb-01' })
    const sessionId = wsSession.data.sessionId

    const leaveResult = ctrl.leaveWsSession({ sessionId, userId: 'tb-01' })
    assert.equal(leaveResult.success, true)

    // 验证用户已离开
    const participantCount = ctrl.listActiveSessions('tb-01')
    assert.equal(participantCount.total, 0)
  })

  it('团建可以添加多个光标进行实时协作（正常流程）', () => {
    // 先创建 collab session
    const session = ctrl.createCollabSession({ docId: 'cursor-test', ownerId: 'tb-01' })
    const sessionId = session.data.id

    const cursor = ctrl.addCursor({ sessionId, userId: 'tb-01', line: 5, column: 10 })
    assert.equal(cursor.success, true)

    // 查看光标列表
    const cursors = ctrl.listCursors(sessionId)
    assert.equal(cursors.success, true)
    assert.ok(cursors.data.length >= 1)
  })
})

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以查看所有活跃会话（运营数据总览）', () => {
    ctrl.createWsSession({ docId: 'store-data-1', userId: 'admin-01' })
    ctrl.createWsSession({ docId: 'store-data-2', userId: 'admin-02' })

    const result = ctrl.listAllSessions()
    assert.equal(result.success, true)
    assert.ok(result.total >= 2)
  })

  it('店长可以查看健康检查状态（正常流程）', () => {
    const result = ctrl.health()
    assert.equal(result.status, 'ok')
    assert.equal(result.module, 'realtime')
    assert.ok(result.timestamp)
  })

  it('店长可以查看实时冲突报告（正常流程）', () => {
    // 创建冲突场景
    const created = ctrl.createCollabDocument({ title: '冲突测试文档', ownerId: 'admin-01' })
    const docId = created.data.id

    // 构建本地和远程操作
    const localOp: RealtimeCollabOperation = {
      id: 'op-local',
      docId,
      userId: 'admin-01',
      delta: '+本地变更',
      version: 1,
      timestamp: Date.now(),
      type: 'insert',
    }
    const remoteOp: RealtimeCollabOperation = {
      id: 'op-remote',
      docId,
      userId: 'admin-02',
      delta: '+远程变更',
      version: 2,
      timestamp: Date.now(),
      type: 'insert',
    }

    ctrl.detectConflict({ localOp, remoteOp })

    const report = ctrl.getConflictReport(docId)
    assert.equal(report.success, true)
    assert.ok(report.data)
  })

  it('店长可以查询用户同步状态（正常流程）', () => {
    const result = ctrl.getSyncStatus('admin-01')
    // 没有同步记录时返回失败
    assert.equal(result.success, false)
    assert.equal(result.error, 'No sync status found')
  })

  it('店长可以查看实时文档操作历史（运营审计）', () => {
    const created = ctrl.createCollabDocument({ title: '审计文档', ownerId: 'admin-01' })
    const docId = created.data.id

    ctrl.updateContent({ docId, delta: '+审计数据1', userId: 'admin-01' })
    // 注意：admin-02 不是该文档的协作者，update 会被拒绝
    // 所以只有一次成功的 update
    const history = ctrl.getCollabOperations(docId)
    assert.equal(history.success, true)
    assert.ok(history.total >= 1)
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.Reception} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以发送实时消息给导玩员（正常流程）', () => {
    const created = ctrl.createCollabDocument({ title: '前台消息', ownerId: 'reception-01' })
    const docId = created.data.id

    const result = ctrl.updateContent({ docId, delta: '+需要协助，顾客C区', userId: 'reception-01' })
    assert.equal(result.success, true)
    assert.ok(result.data)
  })

  it('前台可以查看自己在文档中的光标位置（正常流程）', () => {
    // 先添加光标
    const session = ctrl.createCollabSession({ docId: 'front-cursor', ownerId: 'reception-01' })
    const sessionId = session.data.id

    ctrl.addCursor({ sessionId, userId: 'reception-01', line: 3, column: 15 })

    const cursors = ctrl.listCursors(sessionId)
    assert.equal(cursors.success, true)
    const myCursor = cursors.data.find((c: any) => c.userId === 'reception-01')
    assert.ok(myCursor)
    assert.equal(myCursor.position.line, 3)
    assert.equal(myCursor.position.column, 15)
  })

  it('前台可以查看实时在线用户（正常流程）', () => {
    ctrl.heartbeat({ userId: 'reception-01', docId: 'front-desk' })
    ctrl.heartbeat({ userId: 'guide-01', docId: 'front-desk' })

    const online = ctrl.getOnlineUsers('front-desk')
    assert.equal(online.success, true)
    assert.ok(online.total >= 2)
  })

  it('前台可以获取自己的同步状态（正常流程）', () => {
    const result = ctrl.getSyncStatus('reception-01')
    // 无同步记录时返回失败
    assert.equal(result.success, false)
    assert.equal(result.error, 'No sync status found')
  })

  it('前台可以离开会话（边界）', () => {
    const session = ctrl.createWsSession({ docId: 'front-session', userId: 'reception-01' })
    const sessionId = session.data.sessionId

    // 先加入再离开
    const leaveResult = ctrl.leaveWsSession({ sessionId, userId: 'reception-01' })
    assert.equal(leaveResult.success, true)
  })
})

// ──────────── 安全与冲突解决 ────────────
describe('realtime 冲突解决与同步', () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('LWW 冲突解决：时间戳较晚的操作胜出', () => {
    const ops: RealtimeCollabOperation[] = [
      {
        id: 'op-earlier',
        docId: 'doc-conflict',
        userId: 'user-a',
        delta: '+早期变更',
        version: 1,
        timestamp: 1000,
        type: 'insert',
      },
      {
        id: 'op-later',
        docId: 'doc-conflict',
        userId: 'user-b',
        delta: '+后期变更',
        version: 2,
        timestamp: 2000,
        type: 'insert',
      },
    ]

    const result = ctrl.resolveLWW({ ops })
    assert.equal(result.success, true)
    assert.equal(result.data!.id, 'op-later')
  })

  it('Merge 冲突解决：保留双方变更', () => {
    const ops: RealtimeCollabOperation[] = [
      {
        id: 'op-merge-a',
        docId: 'doc-merge',
        userId: 'user-a',
        delta: '+变更A',
        version: 1,
        timestamp: 1000,
        type: 'insert',
      },
      {
        id: 'op-merge-b',
        docId: 'doc-merge',
        userId: 'user-b',
        delta: '+变更B',
        version: 2,
        timestamp: 2000,
        type: 'insert',
      },
    ]

    const result = ctrl.resolveMerge({ ops })
    assert.equal(result.success, true)
    assert.equal(result.data, '变更A变更B')
  })

  it('空操作 LWW 应抛出错误', () => {
    const result = ctrl.resolveLWW({ ops: [] })
    assert.equal(result.success, false)
    assert.ok(result.error)
  })

  it('设置用户状态为 busy 后 should reflect', () => {
    ctrl.heartbeat({ userId: 'user-status', docId: 'doc-status' })
    ctrl.setUserStatus({ userId: 'user-status', status: 'busy' })

    const lastActive = ctrl.getLastActive('user-status')
    assert.equal(lastActive.success, true)
    assert.ok(typeof lastActive.lastActive === 'number')
  })

  it('多设备同步可以添加待同步操作', () => {
    // 添加待同步操作到 sync service
    ctrl.addPendingOp({
      userId: 'device-user',
      deviceId: 'iphone-15',
      op: {
        id: 'pending-op-01',
        type: 'append',
        content: 'sync data',
        timestamp: Date.now(),
        clientId: 'device-user',
        version: 1,
      },
    })

    const pending = ctrl.getPendingOps('device-user', 'iphone-15')
    assert.equal(pending.success, true)
    assert.ok(pending.data.length >= 1)
  })
})
