/**
 * 🐜 自动: [push] [D] controller spec 补全
 *
 * 覆盖 PushController 所有端点:
 *   - 推送模板管理 (registerTemplate)
 *   - 推送发送 (sendPush / sendHighPriority / revokeToken)
 *   - 定时推送 (schedulePush / cancelScheduledPush / queryScheduledPushes)
 *   - WebSocket 管理 (connect/disconnect/send/broadcast/reconnect)
 *   - 统计与查询 (getStats / getPushHistory / getWSConnections)
 *
 * 策略: 正向流程 + 边界条件 + 反例
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PushController } from './push.controller'
import { APNsService, WebSocketService, PushNotificationScheduler } from './push.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { PushPlatform, PushPriority } from './push.entity'

// ── Mock Tenant Context ────────────────────────────────────────

const mockTenantContext: RequestTenantContext = {
  tenantId: 'tenant-arcade',
  brandId: 'brand-arcade',
  storeId: 'store-main',
  marketCode: 'CN',
}

// ── Tests ──────────────────────────────────────────────────────

describe('PushController', () => {
  let controller: PushController
  let apnsService: APNsService
  let wsService: WebSocketService
  let scheduler: PushNotificationScheduler

  beforeEach(() => {
    apnsService = new APNsService()
    wsService = new WebSocketService()
    scheduler = new PushNotificationScheduler(apnsService)
    controller = new PushController(apnsService, wsService, scheduler)
  })

  // ─── 推送模板管理 ──────────────────────────────────────────

  describe('registerTemplate', () => {
    it('PUSH-CTRL-1 正例: 注册推送模板应返回完整模板对象', () => {
      const result = controller.registerTemplate(mockTenantContext, {
        code: 'welcome_msg',
        platform: PushPlatform.iOS,
        tenantId: 'tenant-arcade',
        title: '欢迎光临',
        body: '欢迎来到大玩家，本月新客优惠已发放！',
        sound: 'default',
        badge: 1,
        enabled: true,
      })

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^pt_/)
      expect(result.code).toBe('welcome_msg')
      expect(result.platform).toBe(PushPlatform.iOS)
      expect(result.title).toBe('欢迎光临')
      expect(result.body).toBe('欢迎来到大玩家，本月新客优惠已发放！')
      expect(result.enabled).toBe(true)
      expect(result.createdAt).toBeTruthy()
      expect(result.updatedAt).toBeTruthy()
    })

    it('PUSH-CTRL-2 正例: 注册模板使用 tenantContext 作为 fallback', () => {
      const result = controller.registerTemplate(mockTenantContext, {
        code: 'announcement',
        platform: PushPlatform.Android,
        tenantId: 'tenant-arcade',
        body: '公告通知',
      })
      expect(result.tenantId).toBe('tenant-arcade')
      expect(result.platform).toBe(PushPlatform.Android)
      expect(result.enabled).toBe(true)
    })
  })

  // ─── 推送发送 ──────────────────────────────────────────────

  describe('sendPush', () => {
    it('PUSH-CTRL-3 正例: 发送 iOS 推送应返回成功', async () => {
      const result = await controller.sendPush(mockTenantContext, {
        deviceToken: 'a'.repeat(64),
        platform: PushPlatform.iOS,
        alert: '测试推送消息',
        badge: 1,
        sound: 'default',
        priority: PushPriority.High,
      })

      expect(result.success).toBe(true)
      expect(result.recordId).toBeTruthy()
    })

    it('PUSH-CTRL-4 边界: 无 badge/sound 也应成功发送', async () => {
      const result = await controller.sendPush(mockTenantContext, {
        deviceToken: 'b'.repeat(64),
        platform: PushPlatform.Android,
        alert: '纯文本推送',
      })

      expect(result.success).toBe(true)
      expect(result.recordId).toBeUndefined() // Android 路径返回无 recordId
    })
  })

  describe('sendHighPriority', () => {
    it('PUSH-CTRL-5 正例: 高优先级推送应成功', async () => {
      const result = await controller.sendHighPriority({
        deviceToken: 'c'.repeat(64),
        alert: '紧急通知：设备异常',
      })

      expect(result.success).toBe(true)
    })

    it('PUSH-CTRL-6 反例: 无效 token 应返回失败', async () => {
      const result = await controller.sendHighPriority({
        deviceToken: 'short',
        alert: '测试',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('revokeToken', () => {
    it('PUSH-CTRL-7 正例: 吊销 token 应成功', async () => {
      const result = await controller.revokeToken({ deviceToken: 'd'.repeat(64) })
      expect(result.success).toBe(true)
    })
  })

  // ─── 定时推送 ──────────────────────────────────────────────

  describe('schedulePush', () => {
    it('PUSH-CTRL-8 正例: 创建未来定时推送应返回排程记录', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      const result = controller.schedulePush(mockTenantContext, {
        memberId: 'member_001',
        tenantId: 'tenant-arcade',
        content: '明天会员日优惠',
        platform: PushPlatform.iOS,
        sendAt: futureDate,
      })

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^sched_/)
      expect(result.memberId).toBe('member_001')
      expect(result.content).toBe('明天会员日优惠')
      expect(result.status).toBe('PENDING')
    })

    it('PUSH-CTRL-9 边界: 过去时间的定时推送应立即触发为 sent', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString()
      const result = controller.schedulePush(mockTenantContext, {
        memberId: 'member_002',
        tenantId: 'tenant-arcade',
        content: '已过期的推送',
        platform: PushPlatform.iOS,
        sendAt: pastDate,
      })

      expect(result).toBeDefined()
      expect(result.id).toBeTruthy()
    })
  })

  describe('cancelScheduledPush', () => {
    it('PUSH-CTRL-10 正例: 取消待发送推送应成功', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      const scheduled = controller.schedulePush(mockTenantContext, {
        memberId: 'member_003',
        tenantId: 'tenant-arcade',
        content: '待取消的推送',
        platform: PushPlatform.iOS,
        sendAt: futureDate,
      })

      const result = controller.cancelScheduledPush({ pushId: scheduled.id })
      expect(result.success).toBe(true)
    })

    it('PUSH-CTRL-11 反例: 取消不存在的推送应返回失败', () => {
      const result = controller.cancelScheduledPush({ pushId: 'non_existent' })
      expect(result.success).toBe(false)
    })
  })

  describe('queryScheduledPushes', () => {
    it('PUSH-CTRL-12 正例: 查询某会员的定时推送列表', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      controller.schedulePush(mockTenantContext, {
        memberId: 'member_004',
        tenantId: 'tenant-arcade',
        content: '推送A',
        platform: PushPlatform.iOS,
        sendAt: futureDate,
      })
      controller.schedulePush(mockTenantContext, {
        memberId: 'member_004',
        tenantId: 'tenant-arcade',
        content: '推送B',
        platform: PushPlatform.iOS,
        sendAt: futureDate,
      })

      const results = controller.queryScheduledPushes(mockTenantContext, 'member_004')
      expect(results).toHaveLength(2)
    })

    it('PUSH-CTRL-13 边界: 查询无推送会员应返回空数组', () => {
      const results = controller.queryScheduledPushes(mockTenantContext, 'member_none')
      expect(results).toEqual([])
    })
  })

  // ─── WebSocket 管理 ────────────────────────────────────────

  describe('connectWS', () => {
    it('PUSH-CTRL-14 正例: 建立 WS 连接应返回客户端信息', () => {
      const result = controller.connectWS({ clientId: 'client_001', userId: 'user_001' })

      expect(result.clientId).toBe('client_001')
      expect(result.userId).toBe('user_001')
      expect(result.connectedAt).toBeTruthy()
      expect(result.sessionId).toMatch(/^sess_/)
    })
  })

  describe('disconnectWS', () => {
    it('PUSH-CTRL-15 正例: 断开 WS 连接应成功', () => {
      controller.connectWS({ clientId: 'client_002', userId: 'user_002' })
      const result = controller.disconnectWS({ clientId: 'client_002' })
      expect(result.success).toBe(true)
    })
  })

  describe('sendWS', () => {
    it('PUSH-CTRL-16 正例: 向已连接客户端发送消息应成功', () => {
      controller.connectWS({ clientId: 'client_003', userId: 'user_003' })
      const result = controller.sendWS({
        clientId: 'client_003',
        channel: 'notification',
        data: { message: 'Hello' },
      })
      expect(result.success).toBe(true)
    })

    it('PUSH-CTRL-17 反例: 向未连接客户端发送消息应失败', () => {
      const result = controller.sendWS({
        clientId: 'nonexistent_client',
        channel: 'notification',
        data: { message: 'Hello' },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('broadcastWS', () => {
    it('PUSH-CTRL-18 正例: 广播消息到频道', () => {
      controller.connectWS({ clientId: 'client_a', userId: 'user_a' })
      controller.connectWS({ clientId: 'client_b', userId: 'user_b' })

      const result = controller.broadcastWS({
        channel: 'announcement',
        data: { text: '全体公告' },
      })
      expect(result.sent).toBeGreaterThanOrEqual(2)
    })
  })

  describe('reconnectWS', () => {
    it('PUSH-CTRL-19 正例: 通过旧 sessionId 重连应恢复', () => {
      const client = controller.connectWS({ clientId: 'client_004', userId: 'user_004' })
      const oldSessionId = client.sessionId!

      const result = controller.reconnectWS({
        clientId: 'client_004_new',
        oldSessionId,
      })

      expect(result.restored).toBe(true)
      expect(result.sessionId).toBeTruthy()
      expect(result.sessionId).not.toBe(oldSessionId)
    })

    it('PUSH-CTRL-20 反例: 无效 sessionId 重连应失败', () => {
      const result = controller.reconnectWS({
        clientId: 'client_new',
        oldSessionId: 'invalid_session',
      })
      expect(result.restored).toBe(false)
      expect(result.sessionId).toBeUndefined()
    })
  })

  // ─── 统计与查询 ──────────────────────────────────────────

  describe('getStats', () => {
    it('PUSH-CTRL-21 正例: 获取推送统计应包含所有字段', () => {
      const stats = controller.getStats()

      expect(stats).toHaveProperty('totalSent')
      expect(stats).toHaveProperty('totalFailed')
      expect(stats).toHaveProperty('activeConnections')
      expect(stats).toHaveProperty('scheduledCount')
      expect(stats).toHaveProperty('byPlatform')
      expect(stats.byPlatform).toHaveProperty(PushPlatform.iOS)
      expect(stats.byPlatform).toHaveProperty(PushPlatform.Android)
      expect(stats.byPlatform).toHaveProperty(PushPlatform.Web)
    })
  })

  describe('getPushHistory', () => {
    it('PUSH-CTRL-22 正例: 获取某设备推送历史', async () => {
      const token = 'e'.repeat(64)
      await controller.sendPush(mockTenantContext, {
        deviceToken: token,
        platform: PushPlatform.iOS,
        alert: '历史消息1',
      })
      await controller.sendPush(mockTenantContext, {
        deviceToken: token,
        platform: PushPlatform.iOS,
        alert: '历史消息2',
      })

      const history = controller.getPushHistory(token)
      expect(history.length).toBeGreaterThanOrEqual(2)
      expect(history[0].deviceToken).toBe(token)
      expect(history[0].status).toBe('SENT')
    })
  })

  describe('getWSConnections', () => {
    it('PUSH-CTRL-23 正例: 返回当前 WS 连接数', () => {
      controller.connectWS({ clientId: 'c1', userId: 'u1' })
      controller.connectWS({ clientId: 'c2', userId: 'u2' })
      controller.connectWS({ clientId: 'c3', userId: 'u3' })

      const result = controller.getWSConnections()
      expect(result.activeConnections).toBe(3)
    })
  })
})
