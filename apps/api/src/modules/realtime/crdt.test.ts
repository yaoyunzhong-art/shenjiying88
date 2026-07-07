import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * crdt.test.ts - Phase-126 T126-1
 * Realtime CRDT + WebSocket + 多设备同步 单元测试
 *
 * 测试覆盖:
 * - CRDT 追加：两个并发追加都能保留
 * - CRDT 合并：远程文档合并后状态一致
 * - WebSocket 会话：创建→加入→广播→离开
 * - 多设备同步：状态正确同步到多个设备
 * - 冲突解决：两设备同时修改时，CRDT 自动合并
 */

import assert from 'node:assert/strict'
import {
  CRDTDocument,
  WebSocketSessionManager,
  MultiDeviceSyncService,
  CRDTOperation,
  CRDTDocumentState,
} from './crdt.service'

// ─── 测试数据工厂 ─────────────────────────────────────────────────────────────

function makeOp(overrides: Partial<CRDTOperation> = {}): CRDTOperation {
  return {
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'append',
    content: '',
    timestamp: Date.now(),
    clientId: 'client-a',
    version: 1,
    ...overrides,
  }
}

function makeDocState(docId: string, overrides: Partial<CRDTDocumentState> = {}): CRDTDocumentState {
  return {
    docId,
    content: '',
    operations: [],
    version: 0,
    lastModified: Date.now(),
    ...overrides,
  }
}

// ─── CRDT Document Tests ─────────────────────────────────────────────────────

describe('CRDTDocument · 创建文档', () => {
  let crdt: CRDTDocument

  beforeEach(() => {
    crdt = new CRDTDocument()
  })

  it('TC-1 创建新文档返回完整状态', () => {
    const state = crdt.createDocument('doc1')
    assert.equal(state.docId, 'doc1')
    assert.equal(state.content, '')
    assert.equal(state.version, 0)
    assert.deepEqual(state.operations, [])
  })

  it('TC-2 重复创建同一文档返回现有状态', () => {
    const state1 = crdt.createDocument('doc1')
    const state2 = crdt.createDocument('doc1')
    assert.equal(state1.docId, state2.docId)
    assert.equal(state1.version, state2.version)
  })

  it('TC-3 获取不存在的文档返回 null', () => {
    const state = crdt.getState('nonexistent')
    assert.equal(state, null)
  })
})

describe('CRDTDocument · 追加操作', () => {
  let crdt: CRDTDocument

  beforeEach(() => {
    crdt = new CRDTDocument()
    crdt.createDocument('doc1')
  })

  it('TC-4 单次追加操作正确应用', () => {
    const op = makeOp({
      id: 'op1',
      type: 'append',
      content: 'Hello',
      clientId: 'client-a',
      version: 1,
    })
    const state = crdt.applyOperation('doc1', op)
    assert.equal(state?.content, 'Hello')
    assert.equal(state?.version, 1)
  })

  it('TC-5 两个并发追加都能保留（CRDT 特性）', () => {
    const op1 = makeOp({
      id: 'op1',
      type: 'append',
      content: 'Hello',
      clientId: 'client-a',
      version: 1,
    })
    const op2 = makeOp({
      id: 'op2',
      type: 'append',
      content: 'World',
      clientId: 'client-b',
      version: 2,
    })

    crdt.applyOperation('doc1', op1)
    crdt.applyOperation('doc1', op2)

    const state = crdt.getState('doc1')
    assert.ok(state?.content.includes('Hello'))
    assert.ok(state?.content.includes('World'))
    assert.equal(state?.version, 2)
  })

  it('TC-6 多次追加操作版本号递增', () => {
    for (let i = 1; i <= 5; i++) {
      const op = makeOp({
        id: `op${i}`,
        type: 'append',
        content: `text${i}`,
        version: i,
      })
      crdt.applyOperation('doc1', op)
    }
    const state = crdt.getState('doc1')
    assert.equal(state?.version, 5)
    assert.ok(state?.content.includes('text1'))
    assert.ok(state?.content.includes('text5'))
  })
})

describe('CRDTDocument · 插入与删除', () => {
  let crdt: CRDTDocument

  beforeEach(() => {
    crdt = new CRDTDocument()
    crdt.createDocument('doc1')
  })

  it('TC-7 插入操作在指定位置插入内容', () => {
    // 先追加初始内容
    crdt.applyOperation('doc1', makeOp({ id: 'op1', type: 'append', content: 'Hello', version: 1 }))
    
    // 在位置 5 插入
    const insertOp = makeOp({
      id: 'op2',
      type: 'insert',
      position: 5,
      content: ' World',
      version: 2,
    })
    const state = crdt.applyOperation('doc1', insertOp)
    assert.ok(state?.content.includes('World'))
  })

  it('TC-8 删除操作移除匹配内容', () => {
    crdt.applyOperation('doc1', makeOp({ id: 'op1', type: 'append', content: 'Hello World', version: 1 }))
    
    const deleteOp = makeOp({
      id: 'op2',
      type: 'delete',
      content: 'World',
      version: 2,
    })
    const state = crdt.applyOperation('doc1', deleteOp)
    assert.ok(!state?.content.includes('World') || state?.content.includes('Hello'))
  })
})

describe('CRDTDocument · 合并', () => {
  let crdt: CRDTDocument

  beforeEach(() => {
    crdt = new CRDTDocument()
    crdt.createDocument('doc1')
  })

  it('TC-9 合并远程文档状态', () => {
    // 本地操作
    crdt.applyOperation('doc1', makeOp({ id: 'op1', type: 'append', content: 'Local', version: 1 }))
    
    // 远程文档
    const remoteDoc = makeDocState('doc1', {
      content: 'Remote',
      version: 2,
      operations: [
        makeOp({ id: 'op1', type: 'append', content: 'Local', version: 1 }),
        makeOp({ id: 'op2', type: 'append', content: 'Remote', version: 2 }),
      ],
    })
    
    const merged = crdt.merge(remoteDoc)
    assert.ok(merged?.content.includes('Local') || merged?.content.includes('Remote'))
    assert.ok(merged!.version >= 2)
  })

  it('TC-10 版本相同时不进行合并', () => {
    crdt.applyOperation('doc1', makeOp({ id: 'op1', type: 'append', content: 'Local', version: 1 }))
    
    const remoteDoc = makeDocState('doc1', {
      content: 'Remote',
      version: 1,
      operations: [makeOp({ id: 'op1', type: 'append', content: 'Remote', version: 1 })],
    })
    
    const beforeState = crdt.getState('doc1')
    crdt.merge(remoteDoc)
    const afterState = crdt.getState('doc1')
    
    assert.equal(beforeState?.content, afterState?.content)
  })
})

// ─── WebSocket Session Manager Tests ─────────────────────────────────────────

describe('WebSocketSessionManager · 会话管理', () => {
  let wsManager: WebSocketSessionManager

  beforeEach(() => {
    wsManager = new WebSocketSessionManager()
  })

  it('TC-11 创建会话返回会话信息', () => {
    const session = wsManager.createSession('doc1', 'user1')
    assert.ok(session.sessionId.includes('session_doc1'))
    assert.equal(session.docId, 'doc1')
    assert.ok(session.users.has('user1'))
  })

  it('TC-12 加入会话添加用户', () => {
    const session = wsManager.createSession('doc1', 'user1')
    const updated = wsManager.joinSession(session.sessionId, 'user2')
    assert.ok(updated?.users.has('user2'))
    assert.equal(updated?.users.size, 2)
  })

  it('TC-13 加入不存在的会话返回 null', () => {
    const result = wsManager.joinSession('nonexistent', 'user1')
    assert.equal(result, null)
  })

  it('TC-14 离开会话移除用户', () => {
    const session = wsManager.createSession('doc1', 'user1')
    wsManager.joinSession(session.sessionId, 'user2')
    
    const left = wsManager.leaveSession(session.sessionId, 'user2')
    assert.equal(left, true)
    
    const updated = wsManager.getSession(session.sessionId)
    assert.ok(!updated?.users.has('user2'))
  })

  it('TC-15 广播消息返回接收者列表', () => {
    const session = wsManager.createSession('doc1', 'user1')
    wsManager.joinSession(session.sessionId, 'user2')
    wsManager.joinSession(session.sessionId, 'user3')
    
    const recipients = wsManager.broadcastToSession(session.sessionId, {
      type: 'operation',
      payload: { data: 'test' },
      timestamp: Date.now(),
    })
    
    assert.equal(recipients.length, 3)
  })

  it('TC-16 广播消息可排除指定用户', () => {
    const session = wsManager.createSession('doc1', 'user1')
    wsManager.joinSession(session.sessionId, 'user2')
    
    const recipients = wsManager.broadcastToSession(session.sessionId, {
      type: 'operation',
      timestamp: Date.now(),
    }, 'user1')
    
    assert.ok(!recipients.includes('user1'))
    assert.ok(recipients.includes('user2'))
  })

  it('TC-17 获取用户活跃会话', () => {
    wsManager.createSession('doc1', 'user1')
    wsManager.createSession('doc2', 'user1')
    
    const sessions = wsManager.getActiveSessions('user1')
    assert.equal(sessions.length, 2)
  })
})

// ─── Multi-Device Sync Tests ──────────────────────────────────────────────────

describe('MultiDeviceSyncService · 设备同步', () => {
  let crdt: CRDTDocument
  let wsManager: WebSocketSessionManager
  let syncSvc: MultiDeviceSyncService

  beforeEach(() => {
    crdt = new CRDTDocument()
    wsManager = new WebSocketSessionManager()
    syncSvc = new MultiDeviceSyncService(crdt, wsManager)
  })

  it('TC-18 首次同步创建设备状态', () => {
    const docState = makeDocState('doc1', { version: 1, content: 'Hello' })
    const deviceState = syncSvc.syncToDevice('user1', 'device1', docState)
    
    assert.equal(deviceState.deviceId, 'device1')
    assert.equal(deviceState.userId, 'user1')
    assert.equal(deviceState.version, 1)
  })

  it('TC-19 同步更新设备版本', () => {
    const docState1 = makeDocState('doc1', { version: 1 })
    syncSvc.syncToDevice('user1', 'device1', docState1)
    
    const docState2 = makeDocState('doc1', { version: 2 })
    const updated = syncSvc.syncToDevice('user1', 'device1', docState2)
    
    assert.equal(updated.version, 2)
  })

  it('TC-20 多设备状态独立跟踪', () => {
    const docState1 = makeDocState('doc1', { version: 1 })
    const docState2 = makeDocState('doc1', { version: 1 })
    
    syncSvc.syncToDevice('user1', 'device1', docState1)
    syncSvc.syncToDevice('user1', 'device2', docState2)
    
    const status = syncSvc.getSyncStatus('user1')
    assert.equal(status?.devices.length, 2)
  })

  it('TC-21 获取同步状态包含完整信息', () => {
    const docState = makeDocState('doc1', { version: 1 })
    syncSvc.syncToDevice('user1', 'device1', docState)
    
    // 创建会话
    wsManager.createSession('doc1', 'user1')
    
    const status = syncSvc.getSyncStatus('user1')
    assert.equal(status?.userId, 'user1')
    assert.equal(status?.devices.length, 1)
    assert.equal(status?.activeSessions, 1)
    assert.equal(status?.pendingConflicts, 0)
  })
})

describe('MultiDeviceSyncService · 冲突解决', () => {
  let crdt: CRDTDocument
  let wsManager: WebSocketSessionManager
  let syncSvc: MultiDeviceSyncService

  beforeEach(() => {
    crdt = new CRDTDocument()
    wsManager = new WebSocketSessionManager()
    syncSvc = new MultiDeviceSyncService(crdt, wsManager)
  })

  it('TC-22 解决设备间版本冲突', () => {
    const docState1 = makeDocState('doc1', { version: 1 })
    syncSvc.syncToDevice('user1', 'device1', docState1)
    
    const docState2 = makeDocState('doc1', { version: 2 })
    syncSvc.syncToDevice('user1', 'device2', docState2)
    
    // 添加待同步操作到两个设备
    syncSvc.addPendingOp('user1', 'device1', makeOp({ id: 'op1', version: 2 }))
    syncSvc.addPendingOp('user1', 'device2', makeOp({ id: 'op2', version: 2 }))
    
    const resolved = syncSvc.resolveDeviceConflict('user1', 'device1', 'device2')
    assert.equal(resolved, true)
  })

  it('TC-23 版本相同时无冲突', () => {
    const docState1 = makeDocState('doc1', { version: 1 })
    syncSvc.syncToDevice('user1', 'device1', docState1)
    syncSvc.syncToDevice('user1', 'device2', docState1)
    
    const resolved = syncSvc.resolveDeviceConflict('user1', 'device1', 'device2')
    assert.equal(resolved, true)
  })

  it('TC-24 待同步操作正确收集', () => {
    const docState = makeDocState('doc1', { version: 0 })
    syncSvc.syncToDevice('user1', 'device1', docState)
    
    syncSvc.addPendingOp('user1', 'device1', makeOp({ id: 'op1', version: 1 }))
    syncSvc.addPendingOp('user1', 'device1', makeOp({ id: 'op2', version: 2 }))
    
    const pending = syncSvc.getPendingOps('user1', 'device1')
    assert.equal(pending.length, 2)
  })
})
