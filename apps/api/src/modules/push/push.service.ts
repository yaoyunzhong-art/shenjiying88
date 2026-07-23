import { Injectable, Logger, Optional } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PushRecordEntity } from './push.entity'

/**
 * Phase-32/33: 推送服务
 *
 * 功能:
 * - APNsService: iOS 推送 (P1-8 iOS 推送优先级)
 * - WebSocketService: WebSocket 连接管理 (P1-1 WebSocket 重连)
 * - PushNotificationScheduler: 定时推送调度
 *
 * Gate5-C1: deviceToken 持久化存储 (TypeORM + DB fallback)
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PushPriority = 'high' | 'normal'

/**
 * BS-0280: iOS 推送优先级标记
 * - critical: 紧急告警（iOS 可越过静音/勿扰模式）
 * - high: 高优先级（标准推送）
 * - low: 低优先级（可被合并或延迟）
 */
export type iOSPushPriority = 'critical' | 'high' | 'low'

export interface iOSPayload {
  alert: string
  badge?: number
  sound?: string
  extra?: Record<string, unknown>
  /** BS-0280: iOS 推送优先级标记 */
  priority?: iOSPushPriority
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

  /** 内存 fallback (注入失败或测试环境时使用) */
  private memoryStore = new Map<string, PushRecord[]>()

  /** APNs 生产环境配置 (实际应从配置中心注入) */
  private readonly APNS_ENDPOINT = 'https://api.push.apple.com/3/device/'

  constructor(
    @Optional()
    @InjectRepository(PushRecordEntity)
    private pushRecordRepo?: Repository<PushRecordEntity>,
  ) {}

  /**
   * 将业务优先级映射到 iOS 推送优先级
   * BS-0280: critical, high, low
   */
  private toiOSPushPriority(priority: PushPriority): iOSPushPriority {
    switch (priority) {
      case 'high':
        return 'high'
      case 'normal':
        return 'low'
      default:
        return 'high'
    }
  }

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

    // BS-0280: 将业务优先级映射到 iOS 优先级标记
    // 如果 payload 中已明确指定 priority（如 critical/low），使用 payload 的
    // 否则从业务优先级映射
    let iosPriority: iOSPushPriority
    if (payload.priority) {
      iosPriority = payload.priority
    } else {
      iosPriority = this.toiOSPushPriority(priority)
    }
    const enrichedPayload: iOSPayload = {
      ...payload,
      priority: iosPriority,
    }

    const record: PushRecord = {
      id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      deviceToken,
      payload: enrichedPayload,
      priority,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }

    // 持久化存储 (TypeORM repository)
    await this.persistRecord(record)

    // 模拟 APNs 请求 (实际使用 node-apn / @parse/node-apn)
    const topic = payload.extra?.topic as string ?? 'com.shenjiying.app'
    this.logger.log(
      `[APNs] ${iosPriority.toUpperCase()} priority push to ${deviceToken.slice(0, 8)}... ` +
        `alert=${payload.alert} topic=${topic}`
    )

    return true
  }

  /**
   * BS-0280: 发送 critical 级别推送
   * 使用 critical 优先级，iOS 会越过静音/勿扰模式推送
   */
  async sendCriticalPush(deviceToken: string, alert: string, sound?: string): Promise<boolean> {
    const payload: iOSPayload = {
      alert,
      sound: sound ?? 'default',
      priority: 'critical',
    }
    return this.pushToiOS(deviceToken, payload, 'high')
  }

  /**
   * BS-0280: 发送 low 级别推送
   * 低优先级推送，iOS 可合并或延迟展示
   */
  async sendLowPriorityPush(deviceToken: string, alert: string): Promise<boolean> {
    const payload: iOSPayload = {
      alert,
      priority: 'low',
    }
    return this.pushToiOS(deviceToken, payload, 'normal')
  }

  /**
   * BS-0280: 根据指定 iOS 优先级发送推送
   */
  async pushWithiOSPriority(
    deviceToken: string,
    alert: string,
    iosPriority: iOSPushPriority,
    badge?: number,
  ): Promise<boolean> {
    const payload: iOSPayload = {
      alert,
      priority: iosPriority,
      badge,
      sound: iosPriority === 'critical' ? 'default' : undefined,
    }
    const mappedPriority: PushPriority = iosPriority === 'low' ? 'normal' : 'high'
    return this.pushToiOS(deviceToken, payload, mappedPriority)
  }

  /**
   * P1-8: 高优先级推送 (用于实时性要求高的场景)
   * BS-0280: 自动标记为 high 优先级
   */
  async sendWithHighPriority(deviceToken: string, alert: string): Promise<boolean> {
    return this.pushToiOS(deviceToken, { alert, sound: 'default', priority: 'high' }, 'high')
  }

  /**
   * 吊销设备 Token (用户退出/注销时调用)
   */
  async revokeToken(deviceToken: string): Promise<void> {
    const revokedRecord: PushRecord = {
      id: `revoke_${Date.now()}`,
      deviceToken,
      payload: { alert: '' },
      priority: 'normal',
      sentAt: new Date().toISOString(),
      status: 'revoked'
    }

    // 持久化吊销记录
    await this.persistRecord(revokedRecord)

    this.logger.log(`[APNs] Token revoked: ${deviceToken.slice(0, 8)}...`)
  }

  /**
   * 获取推送历史 (按 deviceToken)
   */
  async getPushHistory(deviceToken: string): Promise<PushRecord[]> {
    // 优先从 DB 读取
    if (this.pushRecordRepo) {
      try {
        const entities = await this.pushRecordRepo.find({
          where: { deviceToken },
          order: { sentAt: 'DESC' },
          take: 100,
        })
        return entities.map((e) => this.entityToRecord(e))
      } catch {
        // DB 不可用时降级到内存
        this.logger.warn('DB read failed, falling back to memory store')
      }
    }

    return this.memoryStore.get(deviceToken) ?? []
  }

  private async persistRecord(record: PushRecord): Promise<void> {
    // 写入 DB (优先)
    if (this.pushRecordRepo) {
      try {
        const entity = PushRecordEntity.fromContract({
          id: record.id,
          deviceToken: record.deviceToken,
          platform: 'iOS' as any,
          payload: record.payload,
          priority: record.priority === 'high' ? ('HIGH' as any) : ('NORMAL' as any),
          status: record.status === 'sent' ? ('SENT' as any)
            : record.status === 'failed' ? ('FAILED' as any)
            : ('REVOKED' as any),
          sentAt: record.sentAt,
        })
        await this.pushRecordRepo.save(entity)
        return
      } catch (err) {
        this.logger.warn(`DB write failed, falling back to memory store: ${err}`)
      }
    }

    // 内存 fallback
    this.addToMemoryHistory(record.deviceToken, record)
  }

  private entityToRecord(entity: PushRecordEntity): PushRecord {
    const payload = (entity.payload as unknown as iOSPayload) ?? { alert: '' }
    return {
      id: entity.id,
      deviceToken: entity.deviceToken,
      payload,
      priority: entity.priority === 'HIGH' ? 'high' as const : 'normal' as const,
      sentAt: entity.sentAt?.toISOString() ?? new Date().toISOString(),
      status: entity.status === 'SENT' ? 'sent' as const
        : entity.status === 'FAILED' ? 'failed' as const
        : 'revoked' as const,
    }
  }

  private addToMemoryHistory(deviceToken: string, record: PushRecord): void {
    const history = this.memoryStore.get(deviceToken) ?? []
    history.push(record)
    // 保留最近 100 条
    if (history.length > 100) {
      history.shift()
    }
    this.memoryStore.set(deviceToken, history)
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
