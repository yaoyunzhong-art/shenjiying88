import { Injectable, Logger } from '@nestjs/common'

/**
 * Phase-32/33: 推送服务
 *
 * 功能:
 * - APNsService: iOS 推送 (P1-8 iOS 推送优先级)
 * - WebSocketService: WebSocket 连接管理 (P1-1 WebSocket 重连)
 * - PushNotificationScheduler: 定时推送调度
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PushPriority = 'high' | 'normal'

export interface iOSPayload {
  alert: string
  badge?: number
  sound?: string
  extra?: Record<string, unknown>
}

export interface PushRecord {
  id: string
  deviceToken: string
  payload: iOSPayload
  priority: PushPriority
  sentAt: string
  status: 'sent' | 'failed' | 'revoked'
}

export interface ScheduledPush {
  id: string
  memberId: string
  content: string
  sendAt: Date
  status: 'pending' | 'sent' | 'cancelled'
}

export interface WSClient {
  clientId: string
  userId: string
  connectedAt: string
  sessionId?: string
}

export interface WSMessage {
  channel: string
  data: unknown
}

// ── APNsService: iOS 推送 (P1-8) ──────────────────────────────────────────

@Injectable()
export class APNsService {
  private readonly logger = new Logger(APNsService.name)

  /** deviceToken → PushRecord[] */
  private pushHistory = new Map<string, PushRecord[]>()

  /** APNs 生产环境配置 (实际应从配置中心注入) */
  private readonly APNS_ENDPOINT = 'https://api.push.apple.com/3/device/'

  /**
   * 发送 iOS 推送
   * @param deviceToken 目标设备 token
   * @param payload 推送内容
   * @param priority high: P1-8 优先级, normal: 普通
   */
  async pushToiOS(deviceToken: string, payload: iOSPayload, priority: PushPriority): Promise<boolean> {
    if (!deviceToken || deviceToken.length < 64) {
      this.logger.warn(`Invalid deviceToken: ${deviceToken}`)
      return false
    }

    const record: PushRecord = {
      id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      deviceToken,
      payload,
      priority,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }

    // 记录历史
    this.addToHistory(deviceToken, record)

    // 模拟 APNs 请求 (实际使用 node-apn / @parse/node-apn)
    const topic = payload.extra?.topic as string ?? 'com.shenjiying.app'
    this.logger.log(
      `[APNs] ${priority.toUpperCase()} push to ${deviceToken.slice(0, 8)}... ` +
        `alert=${payload.alert} topic=${topic}`
    )

    return true
  }

  /**
   * P1-8: 高优先级推送 (用于实时性要求高的场景)
   */
  async sendWithHighPriority(deviceToken: string, alert: string): Promise<boolean> {
    return this.pushToiOS(deviceToken, { alert, sound: 'default' }, 'high')
  }

  /**
   * 吊销设备 Token (用户退出/注销时调用)
   */
  async revokeToken(deviceToken: string): Promise<void> {
    const history = this.pushHistory.get(deviceToken) ?? []
    const revokedRecord: PushRecord = {
      id: `revoke_${Date.now()}`,
      deviceToken,
      payload: { alert: '' },
      priority: 'normal',
      sentAt: new Date().toISOString(),
      status: 'revoked'
    }
    history.push(revokedRecord)
    this.pushHistory.set(deviceToken, history)
    this.logger.log(`[APNs] Token revoked: ${deviceToken.slice(0, 8)}...`)
  }

  /**
   * 获取推送历史
   */
  getPushHistory(deviceToken: string): PushRecord[] {
    return this.pushHistory.get(deviceToken) ?? []
  }

  private addToHistory(deviceToken: string, record: PushRecord): void {
    const history = this.pushHistory.get(deviceToken) ?? []
    history.push(record)
    // 保留最近 100 条
    if (history.length > 100) {
      history.shift()
    }
    this.pushHistory.set(deviceToken, history)
  }
}

// ── WebSocketService: WebSocket 管理 (P1-1) ───────────────────────────────

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name)

  /** clientId → WSClient */
  private clients = new Map<string, WSClient>()

  /** userId → Set<clientId> (一对多) */
  private userConnections = new Map<string, Set<string>>()

  /** sessionId → clientId (用于重连恢复) */
  private sessionToClient = new Map<string, string>()

  /**
   * 客户端连接
   */
  connect(clientId: string, userId: string): WSClient {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const client: WSClient = {
      clientId,
      userId,
      connectedAt: new Date().toISOString(),
      sessionId
    }

    this.clients.set(clientId, client)

    // 更新 user → connections 映射
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set())
    }
    this.userConnections.get(userId)!.add(clientId)

    // 维护 session → client 映射 (用于重连)
    this.sessionToClient.set(sessionId, clientId)

    this.logger.log(`[WS] Client connected: ${clientId} (user=${userId}, session=${sessionId})`)
    return client
  }

  /**
   * 客户端断开
   */
  disconnect(clientId: string): void {
    const client = this.clients.get(clientId)
    if (!client) return

    const { userId, sessionId } = client

    this.clients.delete(clientId)

    // 从 userConnections 移除
    const userConns = this.userConnections.get(userId)
    if (userConns) {
      userConns.delete(clientId)
      if (userConns.size === 0) {
        this.userConnections.delete(userId)
      }
    }

    // 保留 session 映射一段时间 (用于重连恢复)
    if (sessionId) {
      this.sessionToClient.delete(sessionId)
    }

    this.logger.log(`[WS] Client disconnected: ${clientId}`)
  }

  /**
   * 向指定客户端发送消息
   */
  sendToClient(clientId: string, message: WSMessage): boolean {
    const client = this.clients.get(clientId)
    if (!client) {
      this.logger.warn(`[WS] Client not found: ${clientId}`)
      return false
    }

    this.logger.log(
      `[WS] Send to ${clientId}: channel=${message.channel} data=${JSON.stringify(message.data)}`
    )
    // 实际通过 socket.io emit 发送
    return true
  }

  /**
   * 广播消息到频道
   */
  broadcast(channel: string, message: unknown): number {
    let sent = 0
    for (const [clientId] of this.clients) {
      const ok = this.sendToClient(clientId, { channel, data: message })
      if (ok) sent++
    }
    this.logger.log(`[WS] Broadcast to ${channel}: ${sent} clients`)
    return sent
  }

  /**
   * P1-1: 处理 WebSocket 重连
   * - 用户断线后新连接传入 oldSessionId
   * - 系统恢复旧 session 的上下文
   */
  handleReconnect(clientId: string, oldSessionId: string): { restored: boolean; sessionId?: string } {
    const oldClientId = this.sessionToClient.get(oldSessionId)

    if (!oldClientId) {
      this.logger.warn(`[WS] Reconnect failed: oldSession=${oldSessionId} not found`)
      return { restored: false }
    }

    // 获取旧 session 的用户信息
    const oldClient = this.clients.get(oldClientId)
    if (!oldClient) {
      return { restored: false }
    }

    const oldUserId = oldClient.userId

    // 直接清理旧连接（不调用 disconnect，避免删除 sessionToClient 映射）
    this.clients.delete(oldClientId)
    const userConns = this.userConnections.get(oldUserId)
    if (userConns) {
      userConns.delete(oldClientId)
      if (userConns.size === 0) {
        this.userConnections.delete(oldUserId)
      }
    }

    // 使用旧用户信息建立新连接
    const newClient = this.connect(clientId, oldUserId)

    this.logger.log(
      `[WS] Reconnect restored: oldSession=${oldSessionId} → newClient=${clientId} (user=${oldUserId})`
    )

    return { restored: true, sessionId: newClient.sessionId }
  }

  /**
   * 获取活跃连接数
   */
  getActiveConnections(): number {
    return this.clients.size
  }

  /**
   * 获取指定用户的连接数
   */
  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size ?? 0
  }
}

// ── PushNotificationScheduler: 定时推送 ─────────────────────────────────

@Injectable()
export class PushNotificationScheduler {
  private readonly logger = new Logger(PushNotificationScheduler.name)

  /** pushId → ScheduledPush */
  private scheduledPushes = new Map<string, ScheduledPush>()

  constructor(private readonly apnsService: APNsService) {}

  /**
   * 定时推送
   * @param memberId 会员 ID
   * @param content 推送内容
   * @param sendAt 发送时间
   */
  schedulePush(memberId: string, content: string, sendAt: Date): ScheduledPush {
    const pushId = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    const scheduled: ScheduledPush = {
      id: pushId,
      memberId,
      content,
      sendAt,
      status: 'pending'
    }

    this.scheduledPushes.set(pushId, scheduled)

    // 计算延迟 (ms)
    const delayMs = sendAt.getTime() - Date.now()
    if (delayMs > 0) {
      setTimeout(() => this.executeScheduledPush(pushId), delayMs)
      this.logger.log(`[Scheduler] Push scheduled: id=${pushId} delay=${delayMs}ms`)
    } else {
      // 立即执行 (时间已过)
      void this.executeScheduledPush(pushId)
    }

    return scheduled
  }

  /**
   * 取消定时推送
   */
  cancelScheduledPush(pushId: string): boolean {
    const push = this.scheduledPushes.get(pushId)
    if (!push) return false

    if (push.status !== 'pending') {
      this.logger.warn(`[Scheduler] Cannot cancel push ${pushId}: status=${push.status}`)
      return false
    }

    push.status = 'cancelled'
    this.logger.log(`[Scheduler] Push cancelled: ${pushId}`)
    return true
  }

  /**
   * 查询待发送推送
   */
  queryScheduled(memberId: string): ScheduledPush[] {
    return Array.from(this.scheduledPushes.values()).filter(
      (p) => p.memberId === memberId && p.status === 'pending'
    )
  }

  private async executeScheduledPush(pushId: string): Promise<void> {
    const push = this.scheduledPushes.get(pushId)
    if (!push || push.status !== 'pending') return

    this.logger.log(`[Scheduler] Executing push: ${pushId}`)

    // 模拟获取 deviceToken (实际从 memberId 查询)
    const deviceToken = `dev_${push.memberId}_token`
    await this.apnsService.sendWithHighPriority(deviceToken, push.content)

    push.status = 'sent'
  }
}
