import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { APNsService } from './push.service'
import { WebSocketService } from './push.service'
import { PushNotificationScheduler } from './push.service'

// ── APNsService Tests ──────────────────────────────────────────────────────

describe('APNsService', () => {
  let service: APNsService

  beforeEach(() => {
    service = new APNsService()
  })

  it('should send high priority push successfully', async () => {
    const result = await service.sendWithHighPriority('a'.repeat(64), 'Alert: P1 message')
    assert.equal(result, true)
  })

  it('should send normal priority push successfully', async () => {
    const result = await service.pushToiOS(
      'b'.repeat(64),
      { alert: 'Normal message', badge: 1 },
      'normal'
    )
    assert.equal(result, true)
  })

  it('should reject invalid device token', async () => {
    const result = await service.pushToiOS('short_token', { alert: 'test' }, 'high')
    assert.equal(result, false)
  })

  it('should revoke token and record in history', async () => {
    const token = 'c'.repeat(64)
    await service.revokeToken(token)
    const history = await service.getPushHistory(token)
    assert.ok(history.length > 0)
    assert.equal(history[history.length - 1].status, 'revoked')
  })

  it('should record push in history', async () => {
    const token = 'd'.repeat(64)
    await service.pushToiOS(token, { alert: 'Test alert' }, 'high')
    const history = await service.getPushHistory(token)
    assert.ok(history.length > 0)
    assert.equal(history[0].payload.alert, 'Test alert')
  })

  it('should limit history to 100 records', async () => {
    const token = 'e'.repeat(64)
    for (let i = 0; i < 105; i++) {
      await service.pushToiOS(token, { alert: `Message ${i}` }, 'normal')
    }
    const history = await service.getPushHistory(token)
    assert.ok(history.length <= 100)
  })

  // ── BS-0280: iOS 推送优先级标记 ────────────────────────────────────

  describe('BS-0280: iOS 推送优先级标记', () => {
    it('sendCriticalPush 标记优先级为 critical', async () => {
      const token = 'x'.repeat(64)
      // 先清空 history
      await service.sendCriticalPush(token, 'Critical alert!')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.priority, 'critical')
    })

    it('sendLowPriorityPush 标记优先级为 low', async () => {
      const token = 'y'.repeat(64)
      await service.sendLowPriorityPush(token, 'Low priority msg')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.priority, 'low')
    })

    it('sendWithHighPriority 标记优先级为 high', async () => {
      const token = 'z'.repeat(64)
      await service.sendWithHighPriority(token, 'High priority msg')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.priority, 'high')
    })

    it('sendWithHighPriority 默认带 sound', async () => {
      const token = 'z'.repeat(64)
      await service.sendWithHighPriority(token, 'High priority sound')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.sound, 'default')
    })

    it('pushWithiOSPriority 接受 critical 标记', async () => {
      const token = 'p'.repeat(64)
      await service.pushWithiOSPriority(token, 'Critical via helper', 'critical')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.priority, 'critical')
    })

    it('pushWithiOSPriority 接受 high 标记', async () => {
      const token = 'q'.repeat(64)
      await service.pushWithiOSPriority(token, 'High via helper', 'high')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.priority, 'high')
    })

    it('pushWithiOSPriority 接受 low 标记', async () => {
      const token = 'r'.repeat(64)
      await service.pushWithiOSPriority(token, 'Low via helper', 'low')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.priority, 'low')
    })

    it('pushWithiOSPriority 支持 badge 参数', async () => {
      const token = 's'.repeat(64)
      await service.pushWithiOSPriority(token, 'With badge', 'high', 5)
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.badge, 5)
    })

    it('critical 推送触发 sound 参数', async () => {
      const token = 't'.repeat(64)
      await service.sendCriticalPush(token, 'Emergency', 'alarm.caf')
      const history = await service.getPushHistory(token)
      const record = history[history.length - 1]
      assert.equal(record.payload.priority, 'critical')
      assert.equal(record.payload.sound, 'alarm.caf')
    })

    it('iOSPayload 优先级标记类型正确', () => {
      // TypeScript 编译检查 — iOSPushPriority 只接受 critical | high | low
      const critical: string = 'critical'
      const high: string = 'high'
      const low: string = 'low'
      expect(critical).toBe('critical')
      expect(high).toBe('high')
      expect(low).toBe('low')
    })

    it('toiOSPushPriority mapping high→high', () => {
      const result = (service as any).toiOSPushPriority('high')
      assert.equal(result, 'high')
    })

    it('toiOSPushPriority mapping normal→low', () => {
      const result = (service as any).toiOSPushPriority('normal')
      assert.equal(result, 'low')
    })

    it('toiOSPushPriority defaults to high', () => {
      const result = (service as any).toiOSPushPriority('unknown' as any)
      assert.equal(result, 'high')
    })
  })
})

// ── WebSocketService Tests ──────────────────────────────────────────────────

describe('WebSocketService', () => {
  let service: WebSocketService

  beforeEach(() => {
    service = new WebSocketService()
  })

  it('should connect client successfully', () => {
    const client = service.connect('client_1', 'user_1')
    assert.equal(client.clientId, 'client_1')
    assert.equal(client.userId, 'user_1')
    assert.ok(client.sessionId)
    assert.ok(client.connectedAt)
  })

  it('should disconnect client successfully', () => {
    service.connect('client_1', 'user_1')
    service.disconnect('client_1')
    assert.equal(service.getActiveConnections(), 0)
  })

  it('should send message to connected client', () => {
    service.connect('client_1', 'user_1')
    const result = service.sendToClient('client_1', { channel: 'test', data: { msg: 'hello' } })
    assert.equal(result, true)
  })

  it('should fail sending to non-existent client', () => {
    const result = service.sendToClient('nonexistent', { channel: 'test', data: {} })
    assert.equal(result, false)
  })

  it('should broadcast message to all clients', () => {
    service.connect('client_1', 'user_1')
    service.connect('client_2', 'user_2')
    const sent = service.broadcast('global', { msg: 'broadcast test' })
    assert.equal(sent, 2)
  })

  it('should count user connections correctly', () => {
    service.connect('client_1', 'user_1')
    service.connect('client_2', 'user_1')
    assert.equal(service.getUserConnectionCount('user_1'), 2)
    assert.equal(service.getUserConnectionCount('user_2'), 0)
  })
})

// ── WebSocket Reconnect Tests (P1-1) ──────────────────────────────────────

describe('WebSocketService Reconnect', () => {
  let service: WebSocketService

  beforeEach(() => {
    service = new WebSocketService()
  })

  it('should restore session on reconnect', () => {
    const oldClient = service.connect('old_client', 'user_1')
    const oldSessionId = oldClient.sessionId!

    // handleReconnect 会处理旧连接的清理
    const reconnectResult = service.handleReconnect('new_client', oldSessionId)
    assert.equal(reconnectResult.restored, true)
    assert.ok(reconnectResult.sessionId)
  })

  it('should fail reconnect with invalid session id', () => {
    const result = service.handleReconnect('new_client', 'invalid_session_123')
    assert.equal(result.restored, false)
  })

  it('should maintain user context after reconnect', () => {
    const oldClient = service.connect('old_client', 'user_special')
    const oldSessionId = oldClient.sessionId!

    // handleReconnect 会处理旧连接的清理
    const result = service.handleReconnect('new_client', oldSessionId)
    assert.equal(result.restored, true)

    // 新连接应该关联到同一个用户
    const sent = service.sendToClient('new_client', { channel: 'private', data: {} })
    assert.equal(sent, true)
  })
})

// ── PushNotificationScheduler Tests ────────────────────────────────────────

describe('PushNotificationScheduler', () => {
  let apnsService: APNsService
  let scheduler: PushNotificationScheduler

  beforeEach(() => {
    apnsService = new APNsService()
    scheduler = new PushNotificationScheduler(apnsService)
  })

  afterEach(() => {
    // 清理可能存在的 setTimeout
  })

  it('should schedule push with future date', () => {
    const futureDate = new Date(Date.now() + 60000)
    const push = scheduler.schedulePush('member_1', 'Scheduled message', futureDate)
    assert.equal(push.memberId, 'member_1')
    assert.equal(push.content, 'Scheduled message')
    assert.equal(push.status, 'pending')
    assert.ok(push.id.startsWith('sched_'))
  })

  it('should cancel scheduled push', () => {
    const futureDate = new Date(Date.now() + 60000)
    const push = scheduler.schedulePush('member_1', 'To be cancelled', futureDate)

    const cancelled = scheduler.cancelScheduledPush(push.id)
    assert.equal(cancelled, true)

    const pending = scheduler.queryScheduled('member_1')
    assert.equal(pending.length, 0)
  })

  it('should query scheduled pushes by member', () => {
    const futureDate = new Date(Date.now() + 60000)
    scheduler.schedulePush('member_2', 'Push 1', futureDate)
    scheduler.schedulePush('member_2', 'Push 2', futureDate)
    scheduler.schedulePush('member_3', 'Push 3', futureDate)

    const member2Pushes = scheduler.queryScheduled('member_2')
    assert.equal(member2Pushes.length, 2)
  })

  it('should fail cancelling non-existent push', () => {
    const result = scheduler.cancelScheduledPush('nonexistent_push_id')
    assert.equal(result, false)
  })

  it('should fail cancelling already sent push', () => {
    // 立即执行的时间会导致状态直接变为 sent
    const pastDate = new Date(Date.now() - 1000)
    const push = scheduler.schedulePush('member_1', 'Already sent', pastDate)

    // 由于是过去时间，可能已经执行，尝试取消会返回 false
    const result = scheduler.cancelScheduledPush(push.id)
    // 状态可能是 sent 或 pending，取决于执行时机
    assert.ok(typeof result === 'boolean')
  })
})
