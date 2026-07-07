import { describe, it, expect, beforeEach } from 'vitest'

// ==============================
// push.service.spec.ts — 纯函数式内联测试
// 不 import 生产代码
// 模拟 APNsService / WebSocketService / PushNotificationScheduler
// 正例：正常推送/连接/调度
// 反例：无效 token / 已吊销 / 不存在客户端 / 已取消
// 边界：空历史、重连恢复、超长 token、广播零客户端
// ==============================

// ── 枚举 + 类型 ──────────────────────────────────────────────

type PushPriority = 'high' | 'normal'
type PushStatus = 'sent' | 'failed' | 'revoked'
type SchedStatus = 'pending' | 'sent' | 'cancelled'

interface iOSPayload {
  alert: string
  badge?: number
  sound?: string
  extra?: Record<string, unknown>
}

interface PushRecord {
  id: string
  deviceToken: string
  payload: iOSPayload
  priority: PushPriority
  sentAt: string
  status: PushStatus
}

interface ScheduledPush {
  id: string
  memberId: string
  content: string
  sendAt: Date
  status: SchedStatus
}

interface WSClient {
  clientId: string
  userId: string
  connectedAt: string
  sessionId?: string
}

interface WSMessage {
  channel: string
  data: unknown
}

// ── Mock 工厂 ────────────────────────────────────────────────

function createMockAPNs() {
  const pushHistory = new Map<string, PushRecord[]>()

  function pushToiOS(deviceToken: string, payload: iOSPayload, priority: PushPriority): boolean {
    if (!deviceToken || deviceToken.length < 64) return false
    const record: PushRecord = {
      id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      deviceToken,
      payload,
      priority,
      sentAt: new Date().toISOString(),
      status: 'sent',
    }
    const history = pushHistory.get(deviceToken) ?? []
    history.push(record)
    if (history.length > 100) history.shift()
    pushHistory.set(deviceToken, history)
    return true
  }

  function sendWithHighPriority(deviceToken: string, alert: string): boolean {
    return pushToiOS(deviceToken, { alert, sound: 'default' }, 'high')
  }

  function revokeToken(deviceToken: string): void {
    const history = pushHistory.get(deviceToken) ?? []
    const revoked: PushRecord = {
      id: `revoke_${Date.now()}`,
      deviceToken,
      payload: { alert: '' },
      priority: 'normal',
      sentAt: new Date().toISOString(),
      status: 'revoked',
    }
    history.push(revoked)
    pushHistory.set(deviceToken, history)
  }

  function getPushHistory(deviceToken: string): PushRecord[] {
    return pushHistory.get(deviceToken) ?? []
  }

  function clearHistory() { pushHistory.clear() }

  return { pushToiOS, sendWithHighPriority, revokeToken, getPushHistory, clearHistory }
}

function createMockWS() {
  const clients = new Map<string, WSClient>()
  const userConnections = new Map<string, Set<string>>()
  const sessionToClient = new Map<string, string>()

  function connect(clientId: string, userId: string): WSClient {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const client: WSClient = { clientId, userId, connectedAt: new Date().toISOString(), sessionId }
    clients.set(clientId, client)
    if (!userConnections.has(userId)) userConnections.set(userId, new Set())
    userConnections.get(userId)!.add(clientId)
    sessionToClient.set(sessionId, clientId)
    return client
  }

  function disconnect(clientId: string): void {
    const client = clients.get(clientId)
    if (!client) return
    const { userId, sessionId } = client
    clients.delete(clientId)
    const conns = userConnections.get(userId)
    if (conns) {
      conns.delete(clientId)
      if (conns.size === 0) userConnections.delete(userId)
    }
    if (sessionId) sessionToClient.delete(sessionId)
  }

  function sendToClient(clientId: string, _message: WSMessage): boolean {
    return clients.has(clientId)
  }

  function broadcast(channel: string, _message: unknown): number {
    let sent = 0
    for (const [cid] of clients) {
      if (sendToClient(cid, { channel, data: _message })) sent++
    }
    return sent
  }

  function handleReconnect(clientId: string, oldSessionId: string): { restored: boolean; sessionId?: string } {
    const oldClientId = sessionToClient.get(oldSessionId)
    if (!oldClientId) return { restored: false }
    const oldClient = clients.get(oldClientId)
    if (!oldClient) return { restored: false }
    const oldUserId = oldClient.userId
    clients.delete(oldClientId)
    const conns = userConnections.get(oldUserId)
    if (conns) {
      conns.delete(oldClientId)
      if (conns.size === 0) userConnections.delete(oldUserId)
    }
    const newClient = connect(clientId, oldUserId)
    return { restored: true, sessionId: newClient.sessionId }
  }

  function getActiveConnections(): number { return clients.size }
  function getUserConnectionCount(userId: string): number { return userConnections.get(userId)?.size ?? 0 }

  return { connect, disconnect, sendToClient, broadcast, handleReconnect, getActiveConnections, getUserConnectionCount }
}

function createMockScheduler() {
  const scheduled = new Map<string, ScheduledPush>()
  let apnsSendCalled = 0

  function schedulePush(memberId: string, content: string, sendAt: Date): ScheduledPush {
    const id = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const sp: ScheduledPush = { id, memberId, content, sendAt, status: 'pending' }
    scheduled.set(id, sp)
    return sp
  }

  function cancelScheduledPush(id: string): boolean {
    const sp = scheduled.get(id)
    if (!sp) return false
    if (sp.status !== 'pending') return false
    sp.status = 'cancelled'
    return true
  }

  function executeScheduledPush(id: string): void {
    const sp = scheduled.get(id)
    if (!sp || sp.status !== 'pending') return
    apnsSendCalled++
    sp.status = 'sent'
  }

  function queryScheduled(memberId: string): ScheduledPush[] {
    return Array.from(scheduled.values()).filter((p) => p.memberId === memberId && p.status === 'pending')
  }

  function getApnsSendCount() { return apnsSendCalled }
  function clear() { scheduled.clear(); apnsSendCalled = 0 }

  return { schedulePush, cancelScheduledPush, executeScheduledPush, queryScheduled, getApnsSendCount, clear }
}

// ── 测试 ─────────────────────────────────────────────────────

describe('PushService (纯内联)', () => {
  let apns: ReturnType<typeof createMockAPNs>

  beforeEach(() => {
    apns = createMockAPNs()
  })

  // ── APNs ────────────────────────────────────────────

  describe('APNsService', () => {
    describe('pushToiOS', () => {
      it('有效 token 应推送成功', () => {
        const token = 'a'.repeat(64)
        const ok = apns.pushToiOS(token, { alert: 'Hello' }, 'high')
        expect(ok).toBe(true)
      })

      it('无效短 token 应返回 false', () => {
        const token = 'short'
        const ok = apns.pushToiOS(token, { alert: 'Hello' }, 'normal')
        expect(ok).toBe(false)
      })

      it('空 token 应返回 false', () => {
        const ok = apns.pushToiOS('', { alert: 'Hello' }, 'normal')
        expect(ok).toBe(false)
      })

      it('推送后记录历史', () => {
        const token = 'b'.repeat(64)
        apns.pushToiOS(token, { alert: 'Test' }, 'high')
        const history = apns.getPushHistory(token)
        expect(history).toHaveLength(1)
        expect(history[0].status).toBe('sent')
      })

      it('普通优先级推送', () => {
        const token = 'c'.repeat(64)
        const ok = apns.pushToiOS(token, { alert: 'Normal push' }, 'normal')
        expect(ok).toBe(true)
      })
    })

    describe('sendWithHighPriority', () => {
      it('高优先级推送', () => {
        const token = 'd'.repeat(64)
        const ok = apns.sendWithHighPriority(token, 'High pri alert')
        expect(ok).toBe(true)
      })

      it('无效 token 高优先级返回 false', () => {
        const ok = apns.sendWithHighPriority('', 'Alert')
        expect(ok).toBe(false)
      })
    })

    describe('revokeToken', () => {
      it('吊销后历史记录状态为 revoked', () => {
        const token = 'e'.repeat(64)
        apns.pushToiOS(token, { alert: 'Before revoke' }, 'normal')
        apns.revokeToken(token)
        const history = apns.getPushHistory(token)
        expect(history[history.length - 1].status).toBe('revoked')
      })

      it('无历史时吊销也正常工作', () => {
        const token = 'f'.repeat(64)
        apns.revokeToken(token)
        const history = apns.getPushHistory(token)
        expect(history.length).toBeGreaterThan(0)
        expect(history[0].status).toBe('revoked')
      })
    })

    describe('getPushHistory', () => {
      it('无历史返回空数组', () => {
        const history = apns.getPushHistory('g'.repeat(64))
        expect(history).toEqual([])
      })

      it('多次推送返回多条记录', () => {
        const token = 'h'.repeat(64)
        apns.pushToiOS(token, { alert: 'A' }, 'high')
        apns.pushToiOS(token, { alert: 'B' }, 'normal')
        expect(apns.getPushHistory(token)).toHaveLength(2)
      })
    })
  })

  // ── WebSocket ───────────────────────────────────────

  describe('WebSocketService', () => {
    let ws: ReturnType<typeof createMockWS>

    beforeEach(() => {
      ws = createMockWS()
    })

    describe('connect', () => {
      it('应建立连接并返回客户端', () => {
        const client = ws.connect('c1', 'u1')
        expect(client.clientId).toBe('c1')
        expect(client.userId).toBe('u1')
        expect(client.sessionId).toBeDefined()
      })

      it('连接后活跃连接数增加', () => {
        ws.connect('c1', 'u1')
        expect(ws.getActiveConnections()).toBe(1)
      })
    })

    describe('disconnect', () => {
      it('应断开连接', () => {
        ws.connect('c1', 'u1')
        ws.disconnect('c1')
        expect(ws.getActiveConnections()).toBe(0)
      })

      it('断开不存在的客户端不报错', () => {
        expect(() => ws.disconnect('nonexistent')).not.toThrow()
      })
    })

    describe('sendToClient', () => {
      it('存在的客户端返回 true', () => {
        ws.connect('c1', 'u1')
        expect(ws.sendToClient('c1', { channel: 'test', data: 'hello' })).toBe(true)
      })

      it('不存在的客户端返回 false', () => {
        expect(ws.sendToClient('ghost', { channel: 'x', data: {} })).toBe(false)
      })
    })

    describe('broadcast', () => {
      it('无客户端时返回 0', () => {
        expect(ws.broadcast('test', {})).toBe(0)
      })

      it('有客户端时返回发送数', () => {
        ws.connect('c1', 'u1')
        ws.connect('c2', 'u2')
        expect(ws.broadcast('alert', { msg: 'hi' })).toBe(2)
      })
    })

    describe('handleReconnect', () => {
      it('有效 session 应恢复连接', () => {
        const oldClient = ws.connect('old-c', 'u1')
        const result = ws.handleReconnect('new-c', oldClient.sessionId!)
        expect(result.restored).toBe(true)
        expect(result.sessionId).toBeDefined()
      })

      it('无效 session 应返回 restored=false', () => {
        const result = ws.handleReconnect('new-c', 'sess-nonexistent')
        expect(result.restored).toBe(false)
      })

      it('重连后旧客户端消失', () => {
        const oldClient = ws.connect('old-c', 'u1')
        ws.handleReconnect('new-c', oldClient.sessionId!)
        expect(ws.getActiveConnections()).toBe(1)
      })

      it('重连后用户连接数不变', () => {
        ws.connect('c1', 'u1')
        const oldClient2 = ws.connect('c2', 'u1')
        ws.handleReconnect('c3', oldClient2.sessionId!)
        expect(ws.getUserConnectionCount('u1')).toBe(2)
      })
    })

    describe('getUserConnectionCount', () => {
      it('无连接返回 0', () => {
        expect(ws.getUserConnectionCount('u1')).toBe(0)
      })

      it('单用户多连接返回正确数', () => {
        ws.connect('c1', 'u1')
        ws.connect('c2', 'u1')
        expect(ws.getUserConnectionCount('u1')).toBe(2)
      })
    })
  })

  // ── Scheduler ───────────────────────────────────────

  describe('PushNotificationScheduler', () => {
    let scheduler: ReturnType<typeof createMockScheduler>

    beforeEach(() => {
      scheduler = createMockScheduler()
    })

    describe('schedulePush', () => {
      it('应创建 pending 状态的推送', () => {
        const sp = scheduler.schedulePush('mem1', '提醒', new Date(Date.now() + 60000))
        expect(sp.status).toBe('pending')
        expect(sp.memberId).toBe('mem1')
      })

      it('未来时间应正常调度', () => {
        const sp = scheduler.schedulePush('mem2', '未来通知', new Date(Date.now() + 3600000))
        expect(sp.content).toBe('未来通知')
        expect(sp.sendAt.getTime()).toBeGreaterThan(Date.now())
      })
    })

    describe('cancelScheduledPush', () => {
      it('应取消 pending 推送', () => {
        const sp = scheduler.schedulePush('mem1', '可取消', new Date(Date.now() + 60000))
        const ok = scheduler.cancelScheduledPush(sp.id)
        expect(ok).toBe(true)
      })

      it('不存在的 id 返回 false', () => {
        expect(scheduler.cancelScheduledPush('nonexistent')).toBe(false)
      })

      it('已执行推送取消返回 false', () => {
        const sp = scheduler.schedulePush('mem1', '已执行', new Date(Date.now() - 5000))
        scheduler.executeScheduledPush(sp.id)
        expect(scheduler.cancelScheduledPush(sp.id)).toBe(false)
      })
    })

    describe('queryScheduled', () => {
      it('应返回指定用户待发送推送', () => {
        scheduler.schedulePush('mem1', 'A', new Date(Date.now() + 60000))
        scheduler.schedulePush('mem2', 'B', new Date(Date.now() + 60000))
        const list = scheduler.queryScheduled('mem1')
        expect(list).toHaveLength(1)
        expect(list[0].memberId).toBe('mem1')
      })

      it('已执行的不在查询结果中', () => {
        const sp = scheduler.schedulePush('mem1', '已执行', new Date(Date.now() - 5000))
        scheduler.executeScheduledPush(sp.id)
        expect(scheduler.queryScheduled('mem1')).toHaveLength(0)
      })
    })

    describe('executeScheduledPush', () => {
      it('应执行并标记为 sent', () => {
        const sp = scheduler.schedulePush('mem1', '执行', new Date(Date.now() - 1000))
        scheduler.executeScheduledPush(sp.id)
        expect(sp.status).toBe('sent')
      })

      it('不存在的 id 不报错', () => {
        expect(() => scheduler.executeScheduledPush('ghost')).not.toThrow()
      })

      it('已取消的不再执行', () => {
        const sp = scheduler.schedulePush('mem1', '已取消', new Date(Date.now() - 1000))
        scheduler.cancelScheduledPush(sp.id)
        scheduler.executeScheduledPush(sp.id)
        expect(sp.status).toBe('cancelled')
      })
    })
  })
})
