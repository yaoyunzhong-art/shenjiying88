import { describe, it, expect, beforeEach } from 'vitest'
import { RealTimeService } from './realtime.service'
import { CollabService } from './collab.service'

/**
 * 🐜 [realtime] 角色扩展测试
 * 覆盖实时通信、协同编辑边界场景
 */

function setup() {
  const collab = new CollabService()
  const rt = new RealTimeService(collab)
  return { rt, collab }
}

describe('👔店长 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建实时会话', () => {
    const session = svc.rt.createSession('store-1', { type: 'monitor' })
    expect(session.sessionId).toBeTruthy()
    expect(session.room).toBe('store-1')
  })

  it('加入实时会话', () => {
    const session = svc.rt.createSession('store-1', { type: 'monitor' })
    const joined = svc.rt.joinSession(session.sessionId, 'user-1')
    expect(joined).toBe(true)
  })
})

describe('🎮导玩员 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('协同编辑文档', () => {
    const doc = svc.collab.createDocument('doc-1', '游戏规则说明')
    expect(doc.docId).toBe('doc-1')
    expect(doc.content).toBe('游戏规则说明')
  })

  it('协同编辑应用操作', () => {
    const doc = svc.collab.createDocument('doc-2', 'Hello')
    const updated = svc.collab.applyOperation('doc-2', { type: 'insert', position: 5, text: ' World' })
    expect(updated.content).toBe('Hello World')
  })

  it('查询不存在文档返回 null', () => {
    const doc = svc.collab.getDocument('no-such')
    expect(doc).toBeNull()
  })
})

describe('🎯运行专员 realtime 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('广播消息到房间', () => {
    const session = svc.rt.createSession('ops-room', { type: 'alert' })
    svc.rt.joinSession(session.sessionId, 'user-ops')
    const sent = svc.rt.broadcast(session.sessionId, { type: 'alert', message: '设备离线' })
    expect(sent).toBeGreaterThanOrEqual(1)
  })

  it('离开会话', () => {
    const session = svc.rt.createSession('room-1', { type: 'chat' })
    svc.rt.joinSession(session.sessionId, 'user-a')
    svc.rt.leaveSession(session.sessionId, 'user-a')
    const count = svc.rt.getParticipantCount(session.sessionId)
    expect(count).toBe(0)
  })
})
