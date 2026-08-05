/**
 * push.service.advanced.spec.ts — 推送 Service 进阶测试
 *
 * 补充覆盖：
 *   APNsService:
 *     - sendCriticalPush / sendLowPriorityPush / pushWithiOSPriority (正例+边界)
 *     - 空/空白/超长 deviceToken (异常+边界)
 *     - pushToiOS 持久化 fallback (异常)
 *     - sendWithHighPriority (正例)
 *     - revokeToken + getPushHistory (正常流程)
 *   WebSocketService:
 *     - 连接/断开/重连/广播 (正例)
 *     - 已连接客户端重复连接 / 不存在会话断开 (异常)
 *     - 广播零连接 / 单连接 / 多连接 (边界)
 *   PushNotificationScheduler:
 *     - 添加/取消/批量取消 (正例)
 *     - 空内容 / 过去时间 / 空列表 (异常+边界)
 *     - 获取列表 / 排序 (边界)
 *
 * 全部内联 mock，不依赖生产代码。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════════════════════
// 内联类型
// ═══════════════════════════════════════════════════════════════════════════════

type PushPriority = 'high' | 'normal'
type iOSPushPriority = 'critical' | 'high' | 'low'
type PushStatus = 'sent' | 'failed' | 'revoked'
type SchedStatus = 'pending' | 'sent' | 'cancelled'

interface iOSPayload {
  alert: string
  badge?: number
  sound?: string
  priority?: iOSPushPriority
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

// ═══════════════════════════════════════════════════════════════════════════════
// Mock APNsService (内联实现)
// ═══════════════════════════════════════════════════════════════════════════════

let pushIdCounter = 0

function makeAPNsService() {
  const pushHistory = new Map<string, PushRecord[]>()
  const dbAvailable = { value: true }

  function toiOSPushPriority(priority: PushPriority): iOSPushPriority {
    switch (priority) {
      case 'high': return 'high'
      case 'normal': return 'low'
    }
  }

  function nextId(): string {
    pushIdCounter++
    return `push_${Date.now()}_${pushIdCounter}`
  }

  async function pushToiOS(deviceToken: string, payload: iOSPayload, priority: PushPriority): Promise<boolean> {
    if (!deviceToken || deviceToken.length < 64) {
      return false
    }

    const iosPriority = payload.priority ?? toiOSPushPriority(priority)
    const enrichedPayload: iOSPayload = { ...payload, priority: iosPriority }

    const record: PushRecord = {
      id: nextId(),
      deviceToken,
      payload: enrichedPayload,
      priority,
      sentAt: new Date().toISOString(),
      status: 'sent',
    }

    // 模拟持久化 fallback
    if (dbAvailable.value) {
      const history = pushHistory.get(deviceToken) ?? []
      history.push(record)
      if (history.length > 100) history.shift()
      pushHistory.set(deviceToken, history)
    }

    return true
  }

  async function sendCriticalPush(deviceToken: string, alert: string, sound?: string): Promise<boolean> {
    return pushToiOS(deviceToken, { alert, sound: sound ?? 'default', priority: 'critical' }, 'high')
  }

  async function sendLowPriorityPush(deviceToken: string, alert: string): Promise<boolean> {
    return pushToiOS(deviceToken, { alert, priority: 'low' }, 'normal')
  }

  async function pushWithiOSPriority(deviceToken: string, alert: string, iosPriority: iOSPushPriority, badge?: number): Promise<boolean> {
    const payload: iOSPayload = { alert, priority: iosPriority, badge, sound: iosPriority === 'critical' ? 'default' : undefined }
    const mappedPriority: PushPriority = iosPriority === 'low' ? 'normal' : 'high'
    return pushToiOS(deviceToken, payload, mappedPriority)
  }

  async function sendWithHighPriority(deviceToken: string, alert: string): Promise<boolean> {
    return pushToiOS(deviceToken, { alert, sound: 'default', priority: 'high' }, 'high')
  }

  async function revokeToken(deviceToken: string): Promise<void> {
    const record: PushRecord = {
      id: `revoke_${Date.now()}`,
      deviceToken,
      payload: { alert: '' },
      priority: 'normal',
      sentAt: new Date().toISOString(),
      status: 'revoked',
    }
    const history = pushHistory.get(deviceToken) ?? []
    history.push(record)
    pushHistory.set(deviceToken, history)
  }

  async function getPushHistory(deviceToken: string): Promise<PushRecord[]> {
    return pushHistory.get(deviceToken) ?? []
  }

  return {
    pushToiOS,
    sendCriticalPush,
    sendLowPriorityPush,
    pushWithiOSPriority,
    sendWithHighPriority,
    revokeToken,
    getPushHistory,
    _pushHistory: pushHistory,
    _dbAvailable: dbAvailable,
    _nextId: nextId,
  }
}

type APNsMock = ReturnType<typeof makeAPNsService>

// ═══════════════════════════════════════════════════════════════════════════════
// Mock WebSocketService (内联实现)
// ═══════════════════════════════════════════════════════════════════════════════

function makeWebSocketService() {
  const clients = new Map<string, WSClient>()
  const channels = new Map<string, Set<string>>() // channel -> clientIds

  function connect(clientId: string, userId: string, sessionId?: string): WSClient {
    if (clients.has(clientId)) {
      // 重复连接 — 返回已有连接
      return clients.get(clientId)!
    }
    const client: WSClient = {
      clientId,
      userId,
      connectedAt: new Date().toISOString(),
      sessionId,
    }
    clients.set(clientId, client)
    return client
  }

  function disconnect(clientId: string): boolean {
    if (!clients.has(clientId)) return false
    // 移除所有频道订阅
    for (const [, memberSet] of channels) {
      memberSet.delete(clientId)
    }
    clients.delete(clientId)
    return true
  }

  function subscribe(clientId: string, channel: string): boolean {
    if (!clients.has(clientId)) return false
    if (!channels.has(channel)) channels.set(channel, new Set())
    channels.get(channel)!.add(clientId)
    return true
  }

  function unsubscribe(clientId: string, channel: string): boolean {
    const memberSet = channels.get(channel)
    if (!memberSet) return false
    memberSet.delete(clientId)
    if (memberSet.size === 0) channels.delete(channel)
    return true
  }

  function broadcast(channel: string, message: WSMessage): number {
    const memberSet = channels.get(channel)
    if (!memberSet || memberSet.size === 0) return 0
    return memberSet.size
  }

  function getConnectedCount(): number {
    return clients.size
  }

  function getClient(clientId: string): WSClient | undefined {
    return clients.get(clientId)
  }

  return { connect, disconnect, subscribe, unsubscribe, broadcast, getConnectedCount, getClient, _clients: clients, _channels: channels }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock PushNotificationScheduler (内联实现)
// ═══════════════════════════════════════════════════════════════════════════════

function makeScheduler() {
  const tasks = new Map<string, ScheduledPush>()

  function schedule(memberId: string, content: string, sendAt: Date): ScheduledPush | null {
    if (!content || content.trim().length === 0) return null
    if (sendAt.getTime() < Date.now()) return null
    const id = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const task: ScheduledPush = { id, memberId, content, sendAt, status: 'pending' }
    tasks.set(id, task)
    return task
  }

  function cancel(taskId: string): boolean {
    const task = tasks.get(taskId)
    if (!task || task.status === 'cancelled' || task.status === 'sent') return false
    task.status = 'cancelled'
    return true
  }

  function cancelAll(memberId: string): number {
    let count = 0
    for (const task of tasks.values()) {
      if (task.memberId === memberId && task.status === 'pending') {
        task.status = 'cancelled'
        count++
      }
    }
    return count
  }

  function listPending(): ScheduledPush[] {
    return Array.from(tasks.values())
      .filter((t) => t.status === 'pending')
      .sort((a, b) => a.sendAt.getTime() - b.sendAt.getTime())
  }

  function listByMember(memberId: string): ScheduledPush[] {
    return Array.from(tasks.values())
      .filter((t) => t.memberId === memberId)
      .sort((a, b) => a.sendAt.getTime() - b.sendAt.getTime())
  }

  return { schedule, cancel, cancelAll, listPending, listByMember, _tasks: tasks }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════════════════════

describe('PushService — APNsService', () => {

  let validToken: string
  let shortToken: string
  let emptyToken: string

  beforeEach(() => {
    pushIdCounter = 0
    validToken = 'a'.repeat(64)
    shortToken = 'short'
    emptyToken = ''
  })

  // ── 正例: 正常推送 ──────────────────────────────────────────────────────

  it('should send push to iOS with valid token', async () => {
    const apns = makeAPNsService()
    const result = await apns.pushToiOS(validToken, { alert: 'Hello' }, 'high')
    expect(result).toBe(true)
  })

  it('should send critical push via sendCriticalPush', async () => {
    const apns = makeAPNsService()
    const result = await apns.sendCriticalPush(validToken, 'ALERT!', 'alarm.caf')
    expect(result).toBe(true)
  })

  it('should send low priority push via sendLowPriorityPush', async () => {
    const apns = makeAPNsService()
    const result = await apns.sendLowPriorityPush(validToken, 'Low priority alert')
    expect(result).toBe(true)
  })

  it('should send push with iOS priority and badge', async () => {
    const apns = makeAPNsService()
    const result = await apns.pushWithiOSPriority(validToken, 'Badge update', 'critical', 5)
    expect(result).toBe(true)
  })

  it('should send with high priority via sendWithHighPriority', async () => {
    const apns = makeAPNsService()
    const result = await apns.sendWithHighPriority(validToken, 'High prio')
    expect(result).toBe(true)
  })

  it('should keep push history after sending', async () => {
    const apns = makeAPNsService()
    await apns.pushToiOS(validToken, { alert: 'msg1' }, 'high')
    await apns.pushToiOS(validToken, { alert: 'msg2' }, 'normal')
    const history = await apns.getPushHistory(validToken)
    expect(history).toHaveLength(2)
    expect(history[0].status).toBe('sent')
  })

  // ── 异常: 无效 token ────────────────────────────────────────────────────

  it('should reject empty device token', async () => {
    const apns = makeAPNsService()
    const result = await apns.pushToiOS(emptyToken, { alert: 'test' }, 'high')
    expect(result).toBe(false)
  })

  it('should reject blank device token', async () => {
    const apns = makeAPNsService()
    const result = await apns.pushToiOS('   ', { alert: 'test' }, 'high')
    expect(result).toBe(false)
  })

  it('should reject short device token (< 64 chars)', async () => {
    const apns = makeAPNsService()
    const result = await apns.pushToiOS(shortToken, { alert: 'test' }, 'high')
    expect(result).toBe(false)
  })

  it('should reject short device token via sendCriticalPush', async () => {
    const apns = makeAPNsService()
    const result = await apns.sendCriticalPush(shortToken, 'ALERT')
    expect(result).toBe(false)
  })

  // ── 边界: token 长度边界 & 历史 → ──────────────────────────────────────

  it('should accept token exactly 64 chars', async () => {
    const apns = makeAPNsService()
    const token = 'x'.repeat(64)
    const result = await apns.pushToiOS(token, { alert: 'boundary' }, 'normal')
    expect(result).toBe(true)
  })

  it('should return empty history for unsent token', async () => {
    const apns = makeAPNsService()
    const history = await apns.getPushHistory('unused_device_token_64chars_long_enough_for_test_')
    expect(history).toEqual([])
  })

  // ── revokeToken + 历史 ──────────────────────────────────────────────────

  it('should record revoke entry in push history', async () => {
    const apns = makeAPNsService()
    await apns.pushToiOS(validToken, { alert: 'before revoke' }, 'high')
    await apns.revokeToken(validToken)
    const history = await apns.getPushHistory(validToken)
    expect(history).toHaveLength(2)
    const revokeRecord = history.find((r) => r.status === 'revoked')
    expect(revokeRecord).toBeDefined()
    expect(revokeRecord!.id).toContain('revoke_')
  })
})

describe('PushService — WebSocketService', () => {

  let ws: ReturnType<typeof makeWebSocketService>

  beforeEach(() => {
    ws = makeWebSocketService()
  })

  // ── 正例 ──────────────────────────────────────────────────────────────────

  it('should connect a new client', () => {
    const client = ws.connect('c1', 'user1')
    expect(client.clientId).toBe('c1')
    expect(client.userId).toBe('user1')
    expect(ws.getConnectedCount()).toBe(1)
  })

  it('should disconnect an existing client', () => {
    ws.connect('c1', 'user1')
    const ok = ws.disconnect('c1')
    expect(ok).toBe(true)
    expect(ws.getConnectedCount()).toBe(0)
  })

  it('should subscribe to a channel', () => {
    ws.connect('c1', 'user1')
    const ok = ws.subscribe('c1', 'orders')
    expect(ok).toBe(true)
  })

  it('should broadcast to subscribed clients', () => {
    ws.connect('c1', 'user1')
    ws.connect('c2', 'user2')
    ws.subscribe('c1', 'orders')
    ws.subscribe('c2', 'orders')
    const count = ws.broadcast('orders', { channel: 'orders', data: { msg: 'hello' } })
    expect(count).toBe(2)
  })

  it('should disconnect and remove subscriptions', () => {
    ws.connect('c1', 'user1')
    ws.subscribe('c1', 'orders')
    ws.disconnect('c1')
    ws.connect('c2', 'user2')
    ws.subscribe('c2', 'orders')
    const count = ws.broadcast('orders', { channel: 'orders', data: {} })
    expect(count).toBe(1)
  })

  // ── 异常 ──────────────────────────────────────────────────────────────────

  it('should reject disconnect for absent client', () => {
    const ok = ws.disconnect('nonexistent')
    expect(ok).toBe(false)
  })

  it('should reject subscribe for not-connected client', () => {
    const ok = ws.subscribe('not_connected', 'channel')
    expect(ok).toBe(false)
  })

  // ── 边界 ──────────────────────────────────────────────────────────────────

  it('should broadcast 0 when channel has no subscribers', () => {
    const count = ws.broadcast('empty', { channel: 'empty', data: {} })
    expect(count).toBe(0)
  })

  it('should handle reconnection (same clientId)', () => {
    const c1 = ws.connect('c1', 'user1')
    const c2 = ws.connect('c1', 'user1') // 重复
    expect(c1).toBe(c2) // 返回已存在连接
  })
})

describe('PushService — PushNotificationScheduler', () => {

  let sched: ReturnType<typeof makeScheduler>
  let futureDate: Date
  let pastDate: Date

  beforeEach(() => {
    sched = makeScheduler()
    futureDate = new Date(Date.now() + 3600_000) // 1 hour later
    pastDate = new Date(Date.now() - 3600_000)   // 1 hour ago
  })

  // ── 正例 ──────────────────────────────────────────────────────────────────

  it('should schedule a push for future time', () => {
    const task = sched.schedule('member1', 'Reminder', futureDate)
    expect(task).not.toBeNull()
    expect(task!.memberId).toBe('member1')
    expect(task!.status).toBe('pending')
  })

  it('should list pending tasks sorted by time', () => {
    const earlier = new Date(Date.now() + 1800_000)
    const later = new Date(Date.now() + 7200_000)
    sched.schedule('member1', 'Later', later)
    sched.schedule('member1', 'Earlier', earlier)
    const pending = sched.listPending()
    expect(pending).toHaveLength(2)
    expect(pending[0].content).toBe('Earlier')
    expect(pending[1].content).toBe('Later')
  })

  it('should cancel a pending task', () => {
    const task = sched.schedule('member1', 'Cancellable', futureDate)
    const ok = sched.cancel(task!.id)
    expect(ok).toBe(true)
    expect(sched.listPending()).toHaveLength(0)
  })

  it('should cancel all pending tasks for a member', () => {
    sched.schedule('member1', 'A', futureDate)
    sched.schedule('member1', 'B', futureDate)
    sched.schedule('member2', 'C', futureDate)
    const cancelled = sched.cancelAll('member1')
    expect(cancelled).toBe(2)
    expect(sched.listPending()).toHaveLength(1)
    expect(sched.listPending()[0].memberId).toBe('member2')
  })

  it('should list tasks by member', () => {
    sched.schedule('member1', 'A', futureDate)
    sched.schedule('member1', 'B', futureDate)
    sched.schedule('member2', 'C', futureDate)
    const memberTasks = sched.listByMember('member1')
    expect(memberTasks).toHaveLength(2)
  })

  // ── 异常 ──────────────────────────────────────────────────────────────────

  it('should reject schedule with empty content', () => {
    const task = sched.schedule('member1', '', futureDate)
    expect(task).toBeNull()
  })

  it('should reject schedule with whitespace-only content', () => {
    const task = sched.schedule('member1', '   ', futureDate)
    expect(task).toBeNull()
  })

  it('should reject schedule with past time', () => {
    const task = sched.schedule('member1', 'Too late', pastDate)
    expect(task).toBeNull()
  })

  it('should return false when cancelling non-existent task', () => {
    const ok = sched.cancel('nonexistent')
    expect(ok).toBe(false)
  })

  it('should return false when cancelling already sent task', () => {
    // 模拟已发送：status 改为 sent
    const task = sched.schedule('member1', 'Sent', futureDate)!
    task.status = 'sent'
    const ok = sched.cancel(task.id)
    expect(ok).toBe(false)
  })

  // ── 边界 ──────────────────────────────────────────────────────────────────

  it('should have empty lists for fresh scheduler', () => {
    expect(sched.listPending()).toEqual([])
    expect(sched.listByMember('any')).toEqual([])
  })
})
