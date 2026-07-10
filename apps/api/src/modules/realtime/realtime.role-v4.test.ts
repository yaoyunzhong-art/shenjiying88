import { describe, it, expect, beforeEach, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [realtime] [C] 角色测试增强
 * 
 * 8 角色视角的 realtime 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 测试范围：协作文档、CRDT、会话管理、在线状态、冲突解决、多设备同步、评论
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RealtimeController } from './realtime.controller'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService, type CRDTOperation, type CRDTDocumentState } from './crdt.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createController(): RealtimeController {
  const collabEditor = new CollaborativeEditor()
  const presenceService = new PresenceService()
  const conflictResolver = new ConflictResolver()
  const collabService = new CollabService()
  const crdtDoc = new CRDTDocument()
  const wsManager = new WebSocketSessionManager()
  const syncService = new MultiDeviceSyncService(crdtDoc, wsManager)
  return new RealtimeController(collabEditor, presenceService, conflictResolver, collabService, crdtDoc, wsManager, syncService)
}

// ── Type-safe helper for accessing possibly-null `.data` ──
function assertData<T>(result: { success: boolean; data?: T }): T {
  assert.ok(result.success, 'Expected success result')
  assert.ok(result.data !== undefined && result.data !== null, 'Expected data to be defined')
  return result.data!
}

// ── 👔 店长 ──
describe(`${ROLES.StoreManager} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('店长可创建协作文档并邀请多人协作', () => {
    const doc = ctrl.createCollabDocument({ title: '门店运营日报', ownerId: 'store-mgr-01' })
    const docData = assertData(doc)
    assert.equal(docData.title, '门店运营日报')
    assert.equal(docData.ownerId, 'store-mgr-01')

    const invite = ctrl.inviteEditors({ docId: docData.id, userIds: ['cashier-01', 'guide-01', 'ops-01'] })
    assert.ok(invite.success)
    assert.ok(invite.data)
    assert.equal(invite.data!.editors.length, 4)
  })

  it('店长可查看所有活跃会话', () => {
    ctrl.createWsSession({ docId: 'doc-all-sessions', userId: 'store-mgr-02' })
    ctrl.createWsSession({ docId: 'doc-ops', userId: 'ops-01' })

    const allSessions = ctrl.listAllSessions()
    assert.ok(allSessions.success)
    assert.equal(allSessions.total, 2)
  })

  it('店长邀请不存在文档应返回错误', () => {
    const invite = ctrl.inviteEditors({ docId: 'nonexistent-doc', userIds: ['user-01'] })
    assert.equal(invite.success, false)
    assert.ok(invite.error?.includes('not found'))
  })
})

// ── 🛒 前台 ──
describe(`${ROLES.FrontDesk} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('前台可创建临时协作会话并加入/离开', () => {
    const doc = ctrl.createCollabDocument({ title: '会员接待记录', ownerId: 'front-desk-01' })
    const docData = assertData(doc)
    const session = ctrl.createWsSession({ docId: docData.id, userId: 'front-desk-01' })
    const sessionData = assertData(session)

    const join = ctrl.joinWsSession({ sessionId: sessionData.sessionId, userId: 'guide-01' })
    assert.ok(join.success)

    const leave = ctrl.leaveWsSession({ sessionId: sessionData.sessionId, userId: 'guide-01' })
    assert.equal(leave.success, true)
  })

  it('前台加入不存在会话应处理边界', () => {
    const joinNonExist = ctrl.joinWsSession({ sessionId: 'no-session', userId: 'front-desk-02' })
    assert.equal(joinNonExist.success, false)
    assert.ok(joinNonExist.error?.includes('not found'))
  })

  it('前台可查看在线用户信息', () => {
    ctrl.heartbeat({ userId: 'front-desk-03', docId: 'doc-reception' })
    ctrl.heartbeat({ userId: 'guide-02', docId: 'doc-reception' })

    const online = ctrl.getOnlineUsers('doc-reception')
    assert.ok(online.success)
    assert.equal(online.total, 2)
  })
})

// ── 👥 HR ──
describe(`${ROLES.HR} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('HR可创建培训协作文档并添加评论', () => {
    const doc = ctrl.createCollabDocument({ title: '新员工培训手册', ownerId: 'hr-01' })
    const docData = assertData(doc)
    const session = ctrl.createCollabSession({ docId: docData.id, ownerId: 'hr-01' })
    const sessionData = assertData(session)

    const comment = ctrl.addComment({
      sessionId: sessionData.sessionId,
      userId: 'hr-01',
      content: '请补充第二章内容',
      selection: { start: 10, end: 50 },
    })
    assert.ok(comment.success)
    assert.equal(comment.data.content, '请补充第二章内容')
  })

  it('HR可查看会话评论列表', () => {
    const doc = ctrl.createCollabDocument({ title: '排班表', ownerId: 'hr-02' })
    const docData = assertData(doc)
    const session = ctrl.createCollabSession({ docId: docData.id, ownerId: 'hr-02' })
    const sessionData = assertData(session)

    ctrl.addComment({ sessionId: sessionData.sessionId, userId: 'hr-02', content: '值班调整', selection: { start: 1, end: 10 } })
    ctrl.addComment({ sessionId: sessionData.sessionId, userId: 'store-mgr-01', content: '同意', selection: { start: 1, end: 5 } })

    const comments = ctrl.listComments(sessionData.sessionId)
    assert.ok(comments.success)
    assert.equal(comments.data.length, 2)
  })

  it('HR可解决评论并看到返回', () => {
    const doc = ctrl.createCollabDocument({ title: '考勤记录', ownerId: 'hr-03' })
    const docData = assertData(doc)
    const session = ctrl.createCollabSession({ docId: docData.id, ownerId: 'hr-03' })
    const sessionData = assertData(session)

    ctrl.addComment({ sessionId: sessionData.sessionId, userId: 'hr-03', content: '已完成', selection: { start: 0, end: 5 } })

    const resolve = ctrl.resolveComment({ sessionId: sessionData.sessionId, commentId: 'c1' })
    assert.ok(resolve.success)
  })

  it('HR查询空评论列表返回空', () => {
    const doc = ctrl.createCollabDocument({ title: '空文档', ownerId: 'hr-04' })
    const docData = assertData(doc)
    const session = ctrl.createCollabSession({ docId: docData.id, ownerId: 'hr-04' })
    const sessionData = assertData(session)

    const result = ctrl.listComments(sessionData.sessionId)
    assert.equal(result.data.length, 0)
  })
})

// ── 🔧 安监 ──
describe(`${ROLES.Security} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('安监可检测并解决编辑冲突', () => {
    const localOp = { id: 'op-1', docId: 'doc-conflict-01', userId: 'security-01', delta: '+安全巡检', version: 1, timestamp: 1000, type: 'insert' as const }
    const remoteOp = { id: 'op-2', docId: 'doc-conflict-01', userId: 'ops-01', delta: '+运营日志', version: 1, timestamp: 1001, type: 'insert' as const }

    const conflict = ctrl.detectConflict({ localOp, remoteOp })
    assert.ok(conflict.success)
    assert.equal(conflict.hasConflict, true)

    const resolved = ctrl.resolveLWW({ ops: [localOp, remoteOp] })
    assert.ok(resolved.success)
  })

  it('安监可获取冲突报告', () => {
    const localOp = { id: 'op-s1', docId: 'doc-sec-01', userId: 'security-02', delta: '+A', version: 1, timestamp: 2000, type: 'insert' as const }
    const remoteOp = { id: 'op-s2', docId: 'doc-sec-01', userId: 'guide-01', delta: '+B', version: 1, timestamp: 2001, type: 'insert' as const }
    ctrl.detectConflict({ localOp, remoteOp })
    ctrl.resolveLWW({ ops: [localOp, remoteOp] })

    const report = ctrl.getConflictReport('doc-sec-01')
    assert.ok(report.success)
    assert.ok(Array.isArray(report.data.conflicts))
  })

  it('安监可清除冲突记录', () => {
    ctrl.clearConflicts({ docId: 'doc-clear' })
    const report = ctrl.getConflictReport('doc-clear')
    assert.equal(report.data.total, 0)
  })

  it('安监可合并操作', () => {
    const ops = [
      { id: 'op-m1', docId: 'doc-merge', userId: 'security-03', delta: '+安防更新', version: 1, timestamp: 3000, type: 'insert' as const },
      { id: 'op-m2', docId: 'doc-merge', userId: 'ops-02', delta: '+设备核查', version: 1, timestamp: 3001, type: 'insert' as const },
    ]
    const merged = ctrl.resolveMerge({ ops })
    assert.ok(merged.success)
  })
})

// ── 🎮 导玩员 ──
describe(`${ROLES.Guide} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('导玩员可加入游戏赛事编辑会话', () => {
    const doc = ctrl.createCollabDocument({ title: '周末赛事安排', ownerId: 'guide-01' })
    const docData = assertData(doc)
    const session = ctrl.createWsSession({ docId: docData.id, userId: 'guide-01' })
    const sessionData = assertData(session)

    ctrl.joinWsSession({ sessionId: sessionData.sessionId, userId: 'guide-02' })

    const sessions = ctrl.listActiveSessions('guide-02')
    assert.equal(sessions.total, 1)
  })

  it('导玩员可发送心跳保持在线并设置光标', () => {
    ctrl.heartbeat({ userId: 'guide-03', docId: 'doc-game' })
    ctrl.setCursor({ userId: 'guide-03', docId: 'doc-game', cursor: { line: 5, column: 10 } })

    const lastActive = ctrl.getLastActive('guide-03')
    assert.ok(lastActive.success)
    assert.ok(lastActive.lastActive !== null)
  })

  it('导玩员可设置忙碌状态', () => {
    ctrl.setUserStatus({ userId: 'guide-04', status: 'busy' })
    ctrl.heartbeat({ userId: 'guide-04', docId: 'doc-guide-status' })

    const online = ctrl.getOnlineUsers('doc-guide-status')
    const busyUser = online.data.find((u: { userId: string }) => u.userId === 'guide-04')
    assert.ok(busyUser)
  })

  it('导玩员移除后不在线列表', () => {
    ctrl.heartbeat({ userId: 'guide-05', docId: 'doc-guide-leave' })
    ctrl.heartbeat({ userId: 'guide-06', docId: 'doc-guide-leave' })
    ctrl.removePresence({ userId: 'guide-05' })

    const online = ctrl.getOnlineUsers('doc-guide-leave')
    assert.equal(online.total, 1)
  })
})

// ── 🎯 运行专员 ──
describe(`${ROLES.Operations} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('运行专员可同步文档到设备', () => {
    const doc1 = ctrl.createCollabDocument({ title: '设备巡检表', ownerId: 'ops-01' })
    const doc1Data = assertData(doc1)
    ctrl.createWsSession({ docId: doc1Data.id, userId: 'ops-01' })

    const crdt = ctrl.createCRDTDocument({ docId: doc1Data.id })
    assert.ok(crdt.success)
    const crdtData = assertData(crdt)

    const sync = ctrl.syncToDevice({ userId: 'ops-01', deviceId: 'device-pad-01', state: crdtData })
    assert.ok(sync.success)
  })

  it('运行专员可获取或处理同步状态', () => {
    const statusBefore = ctrl.getSyncStatus('ops-02')
    assert.equal(statusBefore.success, false)

    const doc2 = ctrl.createCollabDocument({ title: '运维记录', ownerId: 'ops-02' })
    const doc2Data = assertData(doc2)
    const crdt2 = ctrl.createCRDTDocument({ docId: doc2Data.id })
    const crdt2Data = assertData(crdt2)
    ctrl.syncToDevice({ userId: 'ops-02', deviceId: 'device-phone', state: crdt2Data })

    const statusAfter = ctrl.getSyncStatus('ops-02')
    assert.ok(statusAfter.success)
  })

  it('运行专员可添加待同步操作并查询', () => {
    const op: CRDTOperation = { id: 'op-p1', type: 'insert', position: 0, content: 'pending', timestamp: Date.now(), clientId: 'ops-03', version: 1 }
    const result = ctrl.addPendingOp({ userId: 'ops-03', deviceId: 'device-kiosk', op })
    assert.ok(result.success)

    const pending = ctrl.getPendingOps('ops-03', 'device-kiosk')
    assert.ok(pending.success)
    assert.equal(pending.data.length, 1)
  })

  it('运行专员可获取系统健康状态', () => {
    const health = ctrl.health()
    assert.equal(health.status, 'ok')
    assert.equal(health.module, 'realtime')
  })
})

// ── 🤝 团建 ──
describe(`${ROLES.Teambuilding} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('团建可创建活动策划协作文档并编辑', () => {
    const doc = ctrl.createCollabDocument({ title: '团建活动策划', ownerId: 'team-01' })
    assert.ok(doc.success)
    const docData = assertData(doc)

    // updateContent uses delta format: +content for append
    const update = ctrl.updateContent({ docId: docData.id, delta: '+射箭比赛 14:00-15:00', userId: 'team-01' })
    assert.ok(update.success)

    const retrieved = ctrl.getCollabDocument(docData.id)
    assert.ok(retrieved.success)
    assert.ok(retrieved.data)
    assert.ok(retrieved.data!.content.includes('射箭比赛'))
  })

  it('团建可跨部门协作分享', () => {
    const doc = ctrl.createCollabDocument({ title: '月聚餐计划', ownerId: 'team-02' })
    const docData = assertData(doc)
    ctrl.inviteEditors({ docId: docData.id, userIds: ['hr-01', 'marketing-01', 'front-desk-01'] })

    const inviteEmpty = ctrl.inviteEditors({ docId: 'no-such-doc', userIds: [] })
    assert.equal(inviteEmpty.success, false)
  })

  it('团建可查看编辑操作历史', () => {
    const doc = ctrl.createCollabDocument({ title: '团队会议纪要', ownerId: 'team-03' })
    const docData = assertData(doc)
    ctrl.updateContent({ docId: docData.id, delta: '+预算讨论', userId: 'team-03' })
    ctrl.updateContent({ docId: docData.id, delta: '+场地预订', userId: 'team-03' })

    const ops = ctrl.getCollabOperations(docData.id)
    assert.ok(ops.success)
    assert.equal(ops.total, 2)
  })

  it('团建查询不存在文档的历史返回空', () => {
    const ops = ctrl.getCollabOperations('nonexistent-doc')
    assert.equal(ops.data.length, 0)
  })
})

// ── 📢 营销 ──
describe(`${ROLES.Marketing} realtime 角色测试`, () => {
  let ctrl: RealtimeController

  beforeEach(() => {
    ctrl = createController()
  })

  it('营销可创建CRDT文档并应用操作', () => {
    const crdt = ctrl.createCRDTDocument({ docId: 'doc-crdt-mkt-01' })
    assert.ok(crdt.success)

    const apply = ctrl.applyCRDTOperation({
      docId: 'doc-crdt-mkt-01',
      operation: { id: 'op-mkt-1', type: 'append', content: '满减活动 满200减30', timestamp: Date.now(), clientId: 'mkt-01', version: 1 },
    })
    assert.ok(apply.success)
    assert.ok(apply.data)
    assert.ok(apply.data!.content.includes('满200减30'))
  })

  it('营销可合并两个CRDT文档', () => {
    ctrl.createCRDTDocument({ docId: 'doc-crdt-mkt-a' })
    ctrl.applyCRDTOperation({
      docId: 'doc-crdt-mkt-a',
      operation: { id: 'op-a1', type: 'append', content: '线上推广', timestamp: Date.now(), clientId: 'mkt-02', version: 1 },
    })
    const stateA = ctrl.getCRDTState('doc-crdt-mkt-a')
    assert.ok(stateA.success)

    ctrl.createCRDTDocument({ docId: 'doc-crdt-mkt-b' })
    ctrl.applyCRDTOperation({
      docId: 'doc-crdt-mkt-b',
      operation: { id: 'op-b1', type: 'append', content: '线下活动', timestamp: Date.now(), clientId: 'mkt-design', version: 1 },
    })
    const stateB = ctrl.getCRDTState('doc-crdt-mkt-b')
    assert.ok(stateB.success)
    assert.ok(stateB.data)

    // merge remote doc B into A: since version B > A (same docId simulation)
    const stateBFull: CRDTDocumentState = {
      docId: 'doc-crdt-mkt-a',
      content: stateB.data!.content,
      operations: stateB.data!.operations,
      version: stateB.data!.version,
      lastModified: stateB.data!.lastModified,
    }
    const merged = ctrl.mergeCRDTDocument({ remoteDoc: stateBFull })
    assert.ok(merged.success)
  })

  it('营销可删除废弃CRDT文档', () => {
    ctrl.createCRDTDocument({ docId: 'doc-crdt-mkt-delete' })
    const deleted = ctrl.deleteCRDTDocument({ docId: 'doc-crdt-mkt-delete' })
    assert.equal(deleted.success, true)

    const state = ctrl.getCRDTState('doc-crdt-mkt-delete')
    assert.equal(state.success, false)
  })

  it('营销可管理协作者光标', () => {
    const doc = ctrl.createCollabDocument({ title: '设计稿讨论', ownerId: 'mkt-04' })
    const docData = assertData(doc)
    const session = ctrl.createCollabSession({ docId: docData.id, ownerId: 'mkt-04' })
    const sessionData = assertData(session)

    ctrl.addCursor({ sessionId: sessionData.sessionId, userId: 'mkt-04', line: 3, column: 10 })
    ctrl.addCursor({ sessionId: sessionData.sessionId, userId: 'design-01', line: 5, column: 20 })

    const cursors = ctrl.listCursors(sessionData.sessionId)
    assert.ok(cursors.success)
    assert.equal(cursors.data.length, 2)

    ctrl.removeCursor({ sessionId: sessionData.sessionId, userId: 'design-01' })
    const afterRemove = ctrl.listCursors(sessionData.sessionId)
    assert.equal(afterRemove.data.length, 1)
  })

  it('营销在不存在的CRDT文档上应用操作返回错误', () => {
    const applyResult = ctrl.applyCRDTOperation({
      docId: 'no-doc',
      operation: { id: 'op-none', type: 'append', content: 'test', timestamp: Date.now(), clientId: 'mkt-05', version: 1 },
    })
    assert.equal(applyResult.success, false)
  })
})

// ── 跨角色边界测试 ──
describe('多角色 realtime 边界测试', () => {
  it('健康检查对所有角色通用', () => {
    const ctrl = createController()
    const health = ctrl.health()
    assert.equal(health.status, 'ok')
    assert.ok(health.timestamp)
  })

  it('操作历史空文档返回空列表', () => {
    const ctrl = createController()
    const ops = ctrl.getCollabOperations('doc-empty')
    assert.equal(ops.data.length, 0)
    assert.equal(ops.total, 0)
  })

  it('不存在会话的评论列表返回空', () => {
    const ctrl = createController()
    const result = ctrl.listComments('nonexistent-session')
    assert.equal(result.data.length, 0)
  })

  it('不存在的用户同步状态返回错误', () => {
    const ctrl = createController()
    const result = ctrl.getSyncStatus('unknown-user')
    assert.equal(result.success, false)
  })
})
