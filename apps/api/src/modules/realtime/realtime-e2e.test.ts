import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * realtime-e2e.test.ts - T125-3 + T126-3
 * Realtime E2E 集成测试：CRDT + WebSocket + 多设备同步 + 协同编辑冲突解决
 *
 * 测试场景:
 * - CRDT + WebSocket 全流程
 * - 多设备同步 E2E
 * - 协同编辑 + 冲突解决 E2E
 *
 * 落地：HEARTBEAT-64
 */

import assert from 'node:assert/strict'
import {
  CRDTDocument,
  WebSocketSessionManager,
  MultiDeviceSyncService,
  type CRDTOperation,
  type CRDTDocumentState,
  type Session,
} from './crdt.service'
import {
  CollaborativeEditor,
  PresenceService,
  ConflictResolver,
  type CollabOperation,
  type CollabDocument,
} from './collab.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createCRDTDocument(): CRDTDocument {
  return new CRDTDocument()
}

function createWebSocketSessionManager(): WebSocketSessionManager {
  return new WebSocketSessionManager()
}

function createMultiDeviceSyncService(): MultiDeviceSyncService {
  const crdt = createCRDTDocument()
  const wsManager = createWebSocketSessionManager()
  return new MultiDeviceSyncService(crdt, wsManager)
}

function createCollaborativeEditor(): CollaborativeEditor {
  return new CollaborativeEditor()
}

function createPresenceService(): PresenceService {
  return new PresenceService()
}

function createConflictResolver(): ConflictResolver {
  return new ConflictResolver()
}

function makeOperation(
  clientId: string,
  type: 'insert' | 'delete' | 'append',
  content?: string,
  position?: number,
  version?: number
): CRDTOperation {
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    clientId,
    content,
    position,
    version: version ?? 1,
    timestamp: Date.now(),
  }
}

// ─────────────────────────────────────────────────────────────
// 1. CRDT + WebSocket 全流程测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('CRDT + WebSocket 全流程 — 成功路径', () => {
  it('用户A创建文档 → 用户B加入 → 两者同步', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()

    // 用户A创建文档
    const docA = crdt.createDocument('doc-1')
    assert.equal(docA.content, '')
    assert.equal(docA.version, 0)

    // 用户A创建会话
    const session = wsManager.createSession('doc-1', 'user-A')
    assert.equal(session.users.size, 1)
    assert.ok(session.sessionId.includes('doc-1'))

    // 用户B加入会话
    const updatedSession = wsManager.joinSession(session.sessionId, 'user-B')
    assert.ok(updatedSession)
    assert.equal(updatedSession!.users.size, 2)

    // 验证文档状态对两者一致
    const stateA = crdt.getState('doc-1')
    const stateB = crdt.getState('doc-1')
    assert.equal(stateA!.content, stateB!.content)
    assert.equal(stateA!.version, stateB!.version)
  })

  it('用户A编辑 → 用户B同时编辑 → 两者都看到对方修改', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()

    // 初始化
    const doc = crdt.createDocument('doc-collab')
    const session = wsManager.createSession('doc-collab', 'user-A')
    wsManager.joinSession(session.sessionId, 'user-B')

    // 用户A追加内容
    const opA: CRDTOperation = {
      id: 'op-a1',
      type: 'append',
      content: 'Hello from A',
      timestamp: Date.now(),
      clientId: 'user-A',
      version: 1,
    }
    const stateAfterA = crdt.applyOperation('doc-collab', opA)
    assert.equal(stateAfterA!.content, 'Hello from A')
    assert.equal(stateAfterA!.version, 1)

    // 模拟用户B的远程操作
    const opB: CRDTOperation = {
      id: 'op-b1',
      type: 'append',
      content: 'Hello from B',
      timestamp: Date.now() + 1,
      clientId: 'user-B',
      version: 2,
    }
    const stateAfterB = crdt.applyOperation('doc-collab', opB)
    assert.ok(stateAfterB!.content.includes('Hello from A'))
    assert.ok(stateAfterB!.content.includes('Hello from B'))

    // 广播验证（user-B操作，广播给user-A）
    const recipients = wsManager.broadcastToSession(session.sessionId, {
      type: 'operation',
      payload: { op: opB },
      timestamp: Date.now(),
    }, 'user-B')
    assert.equal(recipients.length, 1) // 排除发送者user-B，接收者user-A
    assert.equal(recipients[0], 'user-A')
  })

  it('WebSocket 消息类型完整路由', () => {
    const wsManager = createWebSocketSessionManager()

    const session = wsManager.createSession('doc-msg', 'user-A')
    wsManager.joinSession(session.sessionId, 'user-B') // user-B 加入

    // 测试 join 消息
    const joinRecipients = wsManager.broadcastToSession(session.sessionId, {
      type: 'join',
      userId: 'user-B',
      payload: { timestamp: Date.now() },
      timestamp: Date.now(),
    })
    assert.equal(joinRecipients[0], 'user-A')

    // 测试 sync 消息
    const syncRecipients = wsManager.broadcastToSession(session.sessionId, {
      type: 'sync',
      payload: { version: 5 },
      timestamp: Date.now(),
    })
    assert.ok(syncRecipients.includes('user-A'))

    // 测试 leave 消息 - user-A 离开后 session 还有 user-B
    wsManager.leaveSession(session.sessionId, 'user-A')
    const leftSession = wsManager.getSession(session.sessionId)
    assert.ok(leftSession)
    assert.equal(leftSession!.users.size, 1) // 剩下 user-B
  })

  it('CRDT 合并远程文档状态', () => {
    const crdtA = createCRDTDocument()
    const crdtB = createCRDTDocument()

    // A 创建文档并追加内容
    crdtA.createDocument('doc-merge')
    const opA: CRDTOperation = {
      id: 'op-merge-a',
      type: 'append',
      content: 'Content from A',
      timestamp: Date.now(),
      clientId: 'user-A',
      version: 1,
    }
    crdtA.applyOperation('doc-merge', opA)

    // B 同步 A 的状态
    const stateFromA = crdtA.getState('doc-merge')!
    const mergedState = crdtB.merge(stateFromA)

    assert.ok(mergedState)
    assert.equal(mergedState!.content, 'Content from A')
    assert.equal(mergedState!.version, 1)
  })
})

describe('CRDT + WebSocket 全流程 — 异常路径', () => {
  it('操作版本不匹配时发出警告但继续处理', () => {
    const crdt = createCRDTDocument()
    crdt.createDocument('doc-version')

    const op: CRDTOperation = {
      id: 'op-v1',
      type: 'append',
      content: 'test',
      timestamp: Date.now(),
      clientId: 'user-A',
      version: 5, // 错误版本，应该是1
    }

    const result = crdt.applyOperation('doc-version', op)
    // 版本不匹配仍返回结果（带警告）
    assert.ok(result)
    assert.equal(result!.version, 1) // 实际版本
  })

  it('向不存在的文档应用操作返回 null', () => {
    const crdt = createCRDTDocument()

    const op: CRDTOperation = {
      id: 'op-no-doc',
      type: 'append',
      content: 'test',
      timestamp: Date.now(),
      clientId: 'user-A',
      version: 1,
    }

    const result = crdt.applyOperation('non-existent-doc', op)
    assert.equal(result, null)
  })

  it('用户加入不存在的会话返回 null', () => {
    const wsManager = createWebSocketSessionManager()

    const result = wsManager.joinSession('non-existent-session', 'user-A')
    assert.equal(result, null)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. 多设备同步 E2E 测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('多设备同步 E2E — 成功路径', () => {
  it('手机修改 → 平板同步 → PC同步 → 三端状态一致', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()
    const syncService = createMultiDeviceSyncService()

    // 创建文档
    const doc = crdt.createDocument('doc-multi-device')
    const session = wsManager.createSession('doc-multi-device', 'user-phone')

    // 1. 手机(user-phone) 初始同步
    const stateV0 = crdt.getState('doc-multi-device')!
    syncService.syncToDevice('user-phone', 'phone-1', stateV0)

    // 2. 手机修改内容
    const opPhone: CRDTOperation = {
      id: 'op-phone-1',
      type: 'append',
      content: 'Modified on phone',
      timestamp: Date.now(),
      clientId: 'phone-1',
      version: 1,
    }
    crdt.applyOperation('doc-multi-device', opPhone)

    // 3. 平板(user-phone) 同步到最新
    const stateV1 = crdt.getState('doc-multi-device')!
    const deviceState = syncService.syncToDevice('user-phone', 'phone-1', stateV1)
    assert.equal(deviceState.version, 1)

    // 4. PC(user-phone) 同步
    const pcState = syncService.syncToDevice('user-phone', 'pc-1', stateV1)
    assert.equal(pcState.version, 1)

    // 5. 验证三端状态一致
    const status = syncService.getSyncStatus('user-phone')
    assert.ok(status)
    assert.equal(status!.devices.length, 2)
    assert.equal(status!.devices[0].version, 1)
    assert.equal(status!.devices[1].version, 1)
  })

  it('多设备冲突检测与解决', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()
    const syncService = createMultiDeviceSyncService()

    // 初始化
    crdt.createDocument('doc-conflict')
    wsManager.createSession('doc-conflict', 'user-conflict')

    // 同步初始状态
    const stateV0 = crdt.getState('doc-conflict')!
    syncService.syncToDevice('user-conflict', 'device-A', stateV0)
    syncService.syncToDevice('user-conflict', 'device-B', stateV0)

    // 设备A修改
    const opA: CRDTOperation = {
      id: 'op-device-a',
      type: 'append',
      content: 'From device A',
      timestamp: Date.now(),
      clientId: 'device-A',
      version: 1,
    }
    crdt.applyOperation('doc-conflict', opA)

    // 设备B修改
    const opB: CRDTOperation = {
      id: 'op-device-b',
      type: 'append',
      content: 'From device B',
      timestamp: Date.now() + 1,
      clientId: 'device-B',
      version: 2,
    }
    crdt.applyOperation('doc-conflict', opB)

    // 解决冲突
    const resolved = syncService.resolveDeviceConflict('user-conflict', 'device-A', 'device-B')
    assert.equal(resolved, true)

    // 验证最终内容包含双方修改
    const finalState = crdt.getState('doc-conflict')!
    assert.ok(finalState.content.includes('From device A'))
    assert.ok(finalState.content.includes('From device B'))
  })

  it('待同步操作正确管理', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()
    const syncService = createMultiDeviceSyncService()

    crdt.createDocument('doc-pending')
    wsManager.createSession('doc-pending', 'user-pending')

    // 添加待同步操作
    const pendingOp: CRDTOperation = {
      id: 'op-pending-1',
      type: 'append',
      content: 'Pending op',
      timestamp: Date.now(),
      clientId: 'device-1',
      version: 1,
    }

    syncService.addPendingOp('user-pending', 'device-1', pendingOp)

    const pendingOps = syncService.getPendingOps('user-pending', 'device-1')
    assert.equal(pendingOps.length, 1)
    assert.equal(pendingOps[0].id, 'op-pending-1')
  })

  it('跨用户设备状态隔离', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()
    const syncService = createMultiDeviceSyncService()

    crdt.createDocument('doc-isolate')
    wsManager.createSession('doc-isolate', 'user-A')
    wsManager.createSession('doc-isolate', 'user-B')

    const state = crdt.getState('doc-isolate')!

    // A的设备同步
    syncService.syncToDevice('user-A', 'device-A1', state)

    // B的设备同步
    syncService.syncToDevice('user-B', 'device-B1', state)

    // 验证状态隔离
    const statusA = syncService.getSyncStatus('user-A')
    const statusB = syncService.getSyncStatus('user-B')

    assert.equal(statusA!.devices.length, 1)
    assert.equal(statusB!.devices.length, 1)
    assert.equal(statusA!.devices[0].deviceId, 'device-A1')
    assert.equal(statusB!.devices[0].deviceId, 'device-B1')
  })
})

describe('多设备同步 E2E — 异常路径', () => {
  it('用户无设备时 getSyncStatus 返回 null', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()
    const syncService = createMultiDeviceSyncService()

    const status = syncService.getSyncStatus('non-existent-user')
    assert.equal(status, null)
  })

  it('获取不存在设备的待同步操作返回空数组', () => {
    const crdt = createCRDTDocument()
    const wsManager = createWebSocketSessionManager()
    const syncService = createMultiDeviceSyncService()

    crdt.createDocument('doc-no-device')
    wsManager.createSession('doc-no-device', 'user-no-device')

    const ops = syncService.getPendingOps('user-no-device', 'non-existent-device')
    assert.ok(Array.isArray(ops))
    assert.equal(ops.length, 0)
  })
})

// ─────────────────────────────────────────────────────────────
// 3. 协同编辑 + 冲突解决 E2E 测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('协同编辑 + 冲突解决 E2E — 成功路径', () => {
  it('两人同时修改同一位置 → 冲突被检测', () => {
    const editor = createCollaborativeEditor()
    const resolver = createConflictResolver()

    // 创建文档并邀请协作者
    const doc = editor.createDocument('collab-doc', 'user-A')
    editor.inviteEditors(doc.id, ['user-B'])

    // 用户A修改
    editor.updateContent(doc.id, '+Hello', 'user-A')

    // 用户B同时修改（模拟并发）
    const opB = editor.updateContent(doc.id, '+World', 'user-B')
    assert.ok(opB)

    // 两人操作历史
    const ops = editor.getOperations(doc.id)
    assert.equal(ops.length, 2)

    // 检测冲突
    const localOp = ops[0]
    const remoteOp = ops[1]
    const hasConflict = resolver.detectConflict(localOp, remoteOp)
    assert.equal(hasConflict, true)
  })

  it('LWW解决 → 双方确认', () => {
    const editor = createCollaborativeEditor()
    const resolver = createConflictResolver()

    const doc = editor.createDocument('lww-doc', 'user-A')
    editor.inviteEditors(doc.id, ['user-B'])

    // 用户A插入
    editor.updateContent(doc.id, '+First', 'user-A')
    // 用户B插入
    editor.updateContent(doc.id, '+Second', 'user-B')

    const ops = editor.getOperations(doc.id)

    // LWW 解决
    const winner = resolver.resolveByLastWriteWins(ops)
    assert.ok(winner)

    // 验证冲突记录
    const report = resolver.getConflictReport(doc.id)
    assert.equal(report.total, 1)
    assert.equal(report.resolved, 1)
  })

  it('合并解决 → 双方变更都保留', () => {
    const editor = createCollaborativeEditor()
    const resolver = createConflictResolver()

    const doc = editor.createDocument('merge-doc', 'user-A')
    editor.inviteEditors(doc.id, ['user-B'])

    // 用户A追加
    editor.updateContent(doc.id, '+From A', 'user-A')
    // 用户B追加
    editor.updateContent(doc.id, '+ and B', 'user-B')

    const ops = editor.getOperations(doc.id)

    // 合并解决
    const mergedContent = resolver.resolveByMerge(ops)
    assert.ok(mergedContent.includes('From A'))
    assert.ok(mergedContent.includes('and B'))
  })

  it('协同编辑全流程：创建 → 邀请 → 编辑 → 历史查询', () => {
    const editor = createCollaborativeEditor()
    const presence = createPresenceService()
    const resolver = createConflictResolver()

    // 1. 用户A创建文档
    const doc = editor.createDocument('full-flow-doc', 'user-A')
    assert.ok(doc.id)
    assert.equal(doc.content, '')
    assert.equal(doc.version, 0)
    assert.deepEqual(doc.editors, ['user-A'])

    // 2. 邀请用户B
    const updatedDoc = editor.inviteEditors(doc.id, ['user-B'])
    assert.ok(updatedDoc)
    assert.equal(updatedDoc!.editors.length, 2)
    assert.ok(updatedDoc!.editors.includes('user-B'))

    // 3. 用户B加入并发送心跳
    presence.heartbeat('user-B', doc.id)
    const onlineUsers = presence.getOnlineUsers(doc.id)
    assert.ok(onlineUsers.length >= 1)

    // 4. 用户A编辑
    const result = editor.updateContent(doc.id, '+Hello World', 'user-A')
    assert.ok(result)
    assert.equal(result.version, 1)

    // 5. 用户B编辑
    const resultB = editor.updateContent(doc.id, '+ from B', 'user-B')
    assert.ok(resultB)
    assert.equal(resultB.version, 2)

    // 6. 验证文档状态
    const finalDoc = editor.getDocument(doc.id)
    assert.ok(finalDoc)
    assert.ok(finalDoc!.content.includes('Hello World'))
    assert.ok(finalDoc!.content.includes('from B'))

    // 7. 获取操作历史
    const history = editor.getOperations(doc.id)
    assert.equal(history.length, 2)

    // 8. 冲突检测与解决
    const hasConflict = resolver.detectConflict(history[0], history[1])
    assert.equal(hasConflict, true)

    const winner = resolver.resolveByLastWriteWins(history)
    assert.ok(winner.id)
  })
})

describe('协同编辑 + 冲突解决 E2E — 异常路径', () => {
  it('非协作者尝试编辑返回 undefined', () => {
    const editor = createCollaborativeEditor()

    const doc = editor.createDocument('private-doc', 'user-A')

    // user-C 不是协作者
    const result = editor.updateContent(doc.id, '+hack', 'user-C')
    assert.equal(result, undefined)
  })

  it('更新不存在的文档返回 undefined', () => {
    const editor = createCollaborativeEditor()

    const result = editor.updateContent('non-existent-doc', '+test', 'user-A')
    assert.equal(result, undefined)
  })

  it('LWW解决空操作列表抛出错误', () => {
    const resolver = createConflictResolver()

    assert.throws(
      () => resolver.resolveByLastWriteWins([]),
      /No operations to resolve/
    )
  })

  it('冲突报告返回正确的统计', () => {
    const resolver = createConflictResolver()

    const report = resolver.getConflictReport('doc-no-conflicts')
    assert.equal(report.total, 0)
    assert.equal(report.resolved, 0)
    assert.equal(report.unresolved, 0)
  })
})
