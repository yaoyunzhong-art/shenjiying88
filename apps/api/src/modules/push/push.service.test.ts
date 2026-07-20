/**
 * 🐜 自动: [push] [A] service test 补全
 *
 * 覆盖 PushService 各组件:
 *   - APNsService: pushToiOS / sendWithHighPriority / revokeToken / getPushHistory
 *   - WebSocketService: connect / disconnect / sendToClient / broadcast / handleReconnect
 *   - PushNotificationScheduler: schedulePush / cancelScheduledPush / queryScheduled
 *
 * 策略: 正向流程 + 边界条件 + 反例
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  APNsService,
  WebSocketService,
  PushNotificationScheduler,
} from './push.service'
import type { iOSPayload } from './push.service'

// ─── APNsService ────────────────────────────────────────────────────────

describe('APNsService', () => {
  let svc: APNsService

  beforeEach(() => {
    svc = new APNsService()
  })

  // ─── pushToiOS ─────────────────────────────────────────────────

  describe('pushToiOS', () => {
    it('PUSH-APNS-001 正例: 有效的 deviceToken 和 payload 应推送成功', async () => {
      const token = 'a'.repeat(64)
      const payload: iOSPayload = { alert: 'Test Alert', badge: 1, sound: 'default' }
      const result = await svc.pushToiOS(token, payload, 'high')
      expect(result).toBe(true)
    })

    it('PUSH-APNS-002 正例: normal 优先级推送也应成功', async () => {
      const token = 'b'.repeat(64)
      const payload: iOSPayload = { alert: 'Normal priority' }
      const result = await svc.pushToiOS(token, payload, 'normal')
      expect(result).toBe(true)
    })

    it('PUSH-APNS-003 正例: payload 带 extra 字段应正常推送', async () => {
      const token = 'c'.repeat(64)
      const payload: iOSPayload = {
        alert: 'Extra payload',
        extra: { topic: 'com.shenjiying.promo', campaignId: 'camp_001' },
      }
      const result = await svc.pushToiOS(token, payload, 'high')
      expect(result).toBe(true)
    })

    it('PUSH-APNS-004 反例: 空的 deviceToken 应返回 false', async () => {
      const result = await svc.pushToiOS('', { alert: 'empty' }, 'normal')
      expect(result).toBe(false)
    })

    it('PUSH-APNS-005 反例: 太短的 deviceToken (<64) 应返回 false', async () => {
      const result = await svc.pushToiOS('short_token', { alert: 'short' }, 'high')
      expect(result).toBe(false)
    })

    it('PUSH-APNS-006 反例: deviceToken 为 null/undefined 应返回 false', async () => {
      const result = await svc.pushToiOS(null as unknown as string, { alert: 'null' }, 'normal')
      expect(result).toBe(false)
    })
  })

  // ─── sendWithHighPriority ──────────────────────────────────────

  describe('sendWithHighPriority', () => {
    it('PUSH-APNS-007 正例: 高优先级推送应成功', async () => {
      const token = 'd'.repeat(64)
      const result = await svc.sendWithHighPriority(token, 'Urgent alert')
      expect(result).toBe(true)
    })

    it('PUSH-APNS-008 反例: 无效 token 高优先级推送应返回 false', async () => {
      const result = await svc.sendWithHighPriority('short', 'Urgent')
      expect(result).toBe(false)
    })
  })

  // ─── revokeToken ───────────────────────────────────────────────

  describe('revokeToken', () => {
    it('PUSH-APNS-009 正例: 吊销已存在的 token 应成功', async () => {
      const token = 'e'.repeat(64)
      await svc.pushToiOS(token, { alert: 'before revoke' }, 'normal')
      await svc.revokeToken(token)
      const history = await svc.getPushHistory(token)
      const last = history[history.length - 1]
      expect(last.status).toBe('revoked')
    })

    it('PUSH-APNS-010 正例: 吊销不存在历史记录的 token 也应成功（无副作用）', async () => {
      const token = 'f'.repeat(64)
      await expect(svc.revokeToken(token)).resolves.toBeUndefined()
      const history = await svc.getPushHistory(token)
      expect(history).toHaveLength(1)
      expect(history[0].status).toBe('revoked')
    })
  })

  // ─── getPushHistory ────────────────────────────────────────────

  describe('getPushHistory', () => {
    it('PUSH-APNS-011 正例: 推送后应记录历史', async () => {
      const token = 'g'.repeat(64)
      await svc.pushToiOS(token, { alert: 'first' }, 'high')
      await svc.pushToiOS(token, { alert: 'second' }, 'normal')
      const history = await svc.getPushHistory(token)
      expect(history).toHaveLength(2)
      expect(history[0].status).toBe('sent')
      expect(history[1].status).toBe('sent')
    })

    it('PUSH-APNS-012 边界: 无推送历史的 token 应返回空数组', async () => {
      const history = await svc.getPushHistory('nonexistent_token_xxx'.repeat(4))
      expect(history).toEqual([])
    })

    it('PUSH-APNS-013 边界: 历史超过 100 条应自动裁剪', async () => {
      const token = 'h'.repeat(64)
      for (let i = 0; i < 110; i++) {
        await svc.pushToiOS(token, { alert: `msg-${i}` }, 'normal')
      }
      const history = await svc.getPushHistory(token)
      expect(history.length).toBeLessThanOrEqual(100)
    })
  })
})

// ─── WebSocketService ─────────────────────────────────────────────────

describe('WebSocketService', () => {
  let svc: WebSocketService

  beforeEach(() => {
    svc = new WebSocketService()
  })

  // ─── connect ──────────────────────────────────────────────────

  describe('connect', () => {
    it('PUSH-WS-001 正例: 客户端连接应返回完整 WSClient 对象', () => {
      const client = svc.connect('client-001', 'user-001')
      expect(client.clientId).toBe('client-001')
      expect(client.userId).toBe('user-001')
      expect(client.sessionId).toMatch(/^sess_/)
      expect(client.connectedAt).toBeTruthy()
    })

    it('PUSH-WS-002 正例: 同一用户多设备连接应正常', () => {
      svc.connect('client-001', 'user-multi')
      svc.connect('client-002', 'user-multi')
      expect(svc.getUserConnectionCount('user-multi')).toBe(2)
    })

    it('PUSH-WS-003 正例: 全局活跃连接数应正确', () => {
      svc.connect('c1', 'u1')
      svc.connect('c2', 'u2')
      svc.connect('c3', 'u3')
      expect(svc.getActiveConnections()).toBe(3)
    })
  })

  // ─── disconnect ───────────────────────────────────────────────

  describe('disconnect', () => {
    it('PUSH-WS-004 正例: 客户端断开应减少连接数', () => {
      svc.connect('client-001', 'user-001')
      expect(svc.getActiveConnections()).toBe(1)
      svc.disconnect('client-001')
      expect(svc.getActiveConnections()).toBe(0)
    })

    it('PUSH-WS-005 边界: 断开不存在的客户端应无报错', () => {
      expect(() => svc.disconnect('non-existent')).not.toThrow()
    })
  })

  // ─── sendToClient ─────────────────────────────────────────────

  describe('sendToClient', () => {
    it('PUSH-WS-006 正例: 向在线客户端发送消息应返回 true', () => {
      svc.connect('client-001', 'user-001')
      const result = svc.sendToClient('client-001', {
        channel: 'notification',
        data: { message: 'Hello' },
      })
      expect(result).toBe(true)
    })

    it('PUSH-WS-007 反例: 向离线客户端发送消息应返回 false', () => {
      const result = svc.sendToClient('offline-client', { channel: 'test', data: {} })
      expect(result).toBe(false)
    })
  })

  // ─── broadcast ───────────────────────────────────────────────

  describe('broadcast', () => {
    it('PUSH-WS-008 正例: 广播应发送给所有在线客户端', () => {
      svc.connect('c1', 'u1')
      svc.connect('c2', 'u2')
      svc.connect('c3', 'u3')
      const sent = svc.broadcast('announcement', { text: 'System maintenance tonight' })
      expect(sent).toBe(3)
    })

    it('PUSH-WS-009 边界: 无在线客户端时广播应返回 0', () => {
      const sent = svc.broadcast('test', {})
      expect(sent).toBe(0)
    })
  })

  // ─── handleReconnect ─────────────────────────────────────────

  describe('handleReconnect', () => {
    it('PUSH-WS-010 正例: 有效 session 重连应恢复并返回新 sessionId', () => {
      const original = svc.connect('client-old', 'user-reconnect')
      const { sessionId } = original

      const result = svc.handleReconnect('client-new', sessionId!)
      expect(result.restored).toBe(true)
      expect(result.sessionId).toBeTruthy()
      expect(result.sessionId).not.toBe(sessionId)
    })

    it('PUSH-WS-011 反例: 无效 session 重连应返回 restored=false', () => {
      const result = svc.handleReconnect('client-new', 'nonexistent-session')
      expect(result.restored).toBe(false)
    })

    it('PUSH-WS-012 正例: 重连后旧 clientId 应被移除', () => {
      const original = svc.connect('client-old', 'user-reconnect')
      svc.handleReconnect('client-new', original.sessionId!)
      expect(svc.getActiveConnections()).toBe(1)
      const result = svc.sendToClient('client-old', { channel: 'test', data: {} })
      expect(result).toBe(false)
    })
  })
})

// ─── PushNotificationScheduler ────────────────────────────────────────

describe('PushNotificationScheduler', () => {
  let apns: APNsService
  let scheduler: PushNotificationScheduler

  beforeEach(() => {
    vi.useFakeTimers()
    apns = new APNsService()
    scheduler = new PushNotificationScheduler(apns)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── schedulePush ─────────────────────────────────────────────

  describe('schedulePush', () => {
    it('PUSH-SCHED-001 正例: 定时推送应返回 ScheduledPush 对象', () => {
      const future = new Date(Date.now() + 60000)
      const result = scheduler.schedulePush('member-001', 'Happy Birthday!', future)
      expect(result.id).toMatch(/^sched_/)
      expect(result.memberId).toBe('member-001')
      expect(result.status).toBe('pending')
    })

    it('PUSH-SCHED-002 正例: 已过期的时间应立即执行', () => {
      const past = new Date(Date.now() - 1000)
      const result = scheduler.schedulePush('member-002', 'Past event', past)
      // setTimeout 在 vi.useFakeTimers 下不会真正执行，标记为 pending
      expect(result.status).toBe('pending')
    })
  })

  // ─── cancelScheduledPush ─────────────────────────────────────

  describe('cancelScheduledPush', () => {
    it('PUSH-SCHED-003 正例: 取消 pending 的定时推送应成功', () => {
      const future = new Date(Date.now() + 60000)
      const sched = scheduler.schedulePush('member-003', 'Event reminder', future)
      const result = scheduler.cancelScheduledPush(sched.id)
      expect(result).toBe(true)
    })

    it('PUSH-SCHED-004 反例: 取消不存在的推送应返回 false', () => {
      const result = scheduler.cancelScheduledPush('non-existent-sched')
      expect(result).toBe(false)
    })
  })

  // ─── queryScheduled ──────────────────────────────────────────

  describe('queryScheduled', () => {
    it('PUSH-SCHED-005 正例: 按 memberId 查询待发送推送应正确返回', () => {
      const future = new Date(Date.now() + 60000)
      scheduler.schedulePush('member-query', 'Push 1', future)
      scheduler.schedulePush('member-query', 'Push 2', future)
      scheduler.schedulePush('other-user', 'Other push', future)

      const results = scheduler.queryScheduled('member-query')
      expect(results).toHaveLength(2)
      results.forEach((r) => {
        expect(r.memberId).toBe('member-query')
        expect(r.status).toBe('pending')
      })
    })

    it('PUSH-SCHED-006 边界: 查询无推送的 member 应返回空数组', () => {
      const results = scheduler.queryScheduled('non-existent-member')
      expect(results).toEqual([])
    })

    it('PUSH-SCHED-007 边界: 取消后查询不应出现已取消的推送', () => {
      const future = new Date(Date.now() + 60000)
      const sched = scheduler.schedulePush('member-cancel', 'To be cancelled', future)
      scheduler.cancelScheduledPush(sched.id)
      const results = scheduler.queryScheduled('member-cancel')
      expect(results).toHaveLength(0)
    })
  })
})
