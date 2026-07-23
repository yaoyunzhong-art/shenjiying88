/**
 * realtime-polling-fallback.service.ts — WebSocket HTTP轮询降级
 *
 * BS-0263: 当 WebSocket 不可用时，降级到 HTTP 短轮询/长轮询模式。
 *
 * 使用场景:
 *   - WebSocket 连接失败或超时
 *   - 客户端环境不支持 WebSocket
 *   - 服务端 WebSocket 负荷过高时降级
 *
 * 降级策略:
 *   1. 短轮询 (ShortPoll): 客户端定时 GET /realtime/poll?since={lastId}
 *   2. 长轮询 (LongPoll): 客户端发起 超时等待型 GET，服务端有消息即返回
 *   3. 自动探测: 检测 WebSocket 不可用后自动降级
 */

import { Injectable, Logger } from '@nestjs/common'

// ── Types ───────────────────────────────────────────────────────────────────

export type PollingMode = 'short' | 'long' | 'none'

export interface PollingMessage {
  id: string
  roomId: string
  userId: string
  content: string
  type: 'text' | 'operation' | 'system'
  timestamp: number
}

export interface PollingResponse {
  mode: PollingMode
  messages: PollingMessage[]
  lastMessageId: string | null
  hasMore: boolean
  nextPollIntervalMs: number
}

export interface PollingFallbackConfig {
  /** 短轮询间隔 (ms) */
  shortPollIntervalMs: number
  /** 长轮询超时 (ms) */
  longPollTimeoutMs: number
  /** 自动降级阈值: 连续几次 WebSocket 连接失败后降级 */
  autoDegradeThreshold: number
  /** 恢复探测间隔 (ms): 降级后周期性探测 WebSocket 是否恢复 */
  wsRecoveryProbeIntervalMs: number
}

const DEFAULT_CONFIG: PollingFallbackConfig = {
  shortPollIntervalMs: 3000,
  longPollTimeoutMs: 30000,
  autoDegradeThreshold: 3,
  wsRecoveryProbeIntervalMs: 60000,
}

// ── PollingFallbackService ──────────────────────────────────────────────────

@Injectable()
export class PollingFallbackService {
  private readonly logger = new Logger(PollingFallbackService.name)

  /** 按房间存储的消息缓冲区 */
  private readonly messageBuffers = new Map<string, PollingMessage[]>()
  /** 按房间+用户记录的最后一个已拉取 message id */
  private readonly lastFetched = new Map<string, string>()
  /** WebSocket 连接失败计数器 */
  private readonly wsFailureCount = new Map<string, number>()

  private config: PollingFallbackConfig

  constructor(config?: Partial<PollingFallbackConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ── Config ────────────────────────────────────────────────────────────────

  getConfig(): PollingFallbackConfig {
    return { ...this.config }
  }

  updateConfig(patch: Partial<PollingFallbackConfig>): void {
    this.config = { ...this.config, ...patch }
    this.logger.log(`Polling fallback config updated: ${JSON.stringify(patch)}`)
  }

  // ── Message Buffer ────────────────────────────────────────────────────────

  /**
   * 向房间的消息缓冲区追加一条消息（供 realtime service 在 WebSocket 正常时同步写入）
   */
  appendMessage(roomId: string, message: PollingMessage): void {
    const buffer = this.messageBuffers.get(roomId) ?? []
    buffer.push(message)
    // 保留最近 500 条
    if (buffer.length > 500) {
      buffer.splice(0, buffer.length - 500)
    }
    this.messageBuffers.set(roomId, buffer)
  }

  /**
   * 短轮询: 获取自 since 之后的新消息
   */
  shortPoll(roomId: string, userId: string, since?: string): PollingResponse {
    const buffer = this.messageBuffers.get(roomId) ?? []
    const lastId = since ?? this.lastFetched.get(this.fetchKey(roomId, userId))

    const newMessages = lastId
      ? buffer.filter(m => m.id > lastId)
      : buffer.slice(-50) // 首次拉取最近 50 条

    const lastMessageId = newMessages.length > 0
      ? newMessages[newMessages.length - 1].id
      : (lastId ?? null)

    if (lastMessageId) {
      this.lastFetched.set(this.fetchKey(roomId, userId), lastMessageId)
    }

    this.logger.debug(`[ShortPoll] room=${roomId} user=${userId} new=${newMessages.length}`)

    return {
      mode: 'short',
      messages: newMessages,
      lastMessageId,
      hasMore: buffer.length > 0 && newMessages.length < buffer.length,
      nextPollIntervalMs: this.config.shortPollIntervalMs,
    }
  }

  /**
   * 长轮询: 等待新消息，超时返回空
   * 注意: 当前为同步简化实现，生产环境应使用异步挂起（如 Promise race + 事件推送）
   */
  async longPoll(roomId: string, userId: string, since?: string): Promise<PollingResponse> {
    const lastId = since ?? this.lastFetched.get(this.fetchKey(roomId, userId))

    // 简化实现: 先检查已有消息，有则直接返回
    const buffer = this.messageBuffers.get(roomId) ?? []
    const existingNew = lastId
      ? buffer.filter(m => m.id > lastId)
      : buffer.slice(-50)

    if (existingNew.length > 0) {
      const lastMessageId = existingNew[existingNew.length - 1].id
      this.lastFetched.set(this.fetchKey(roomId, userId), lastMessageId)

      return {
        mode: 'long',
        messages: existingNew,
        lastMessageId,
        hasMore: false,
        nextPollIntervalMs: this.config.longPollTimeoutMs,
      }
    }

    // 无可立即返回的消息时，等待超时
    await new Promise(resolve => setTimeout(resolve, this.config.longPollTimeoutMs))

    // 再次检查（等待期间可能有消息入队）
    const afterWait = lastId
      ? buffer.filter(m => m.id > lastId)
      : buffer.slice(-50)

    const lastMessageId = afterWait.length > 0
      ? afterWait[afterWait.length - 1].id
      : (lastId ?? null)

    if (lastMessageId) {
      this.lastFetched.set(this.fetchKey(roomId, userId), lastMessageId)
    }

    this.logger.debug(`[LongPoll] room=${roomId} user=${userId} afterWait=${afterWait.length}`)

    return {
      mode: 'long',
      messages: afterWait,
      lastMessageId,
      hasMore: false,
      nextPollIntervalMs: this.config.longPollTimeoutMs,
    }
  }

  // ── Auto-Degrade ──────────────────────────────────────────────────────────

  /**
   * 记录 WebSocket 连接失败
   * @returns true 表示需要降级到 polling
   */
  recordWsFailure(clientId: string): boolean {
    const count = (this.wsFailureCount.get(clientId) ?? 0) + 1
    this.wsFailureCount.set(clientId, count)

    if (count >= this.config.autoDegradeThreshold) {
      this.logger.warn(
        `[Degrade] Client ${clientId} WS failed ${count} times, triggering poll fallback`
      )
      return true
    }

    return false
  }

  /**
   * WebSocket 恢复成功，重置计数器
   */
  recordWsSuccess(clientId: string): void {
    this.wsFailureCount.set(clientId, 0)
    this.logger.log(`[Degrade] Client ${clientId} WS recovered`)
  }

  /**
   * 是否需要降级（当前失败计数是否达到阈值）
   */
  shouldDegrade(clientId: string): boolean {
    return (this.wsFailureCount.get(clientId) ?? 0) >= this.config.autoDegradeThreshold
  }

  /**
   * 获取 WebSocket 恢复探测器间隔
   */
  getRecoveryProbeIntervalMs(): number {
    return this.config.wsRecoveryProbeIntervalMs
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  /**
   * 清理客户端的降级状态
   */
  clearClientState(userId: string, roomId?: string): void {
    // 清理 lastFetched
    for (const [key] of this.lastFetched) {
      if (key.startsWith(`${roomId ?? ''}:${userId}`)) {
        this.lastFetched.delete(key)
      }
    }

    // 清理 WS 失败计数
    for (const [clientId] of this.wsFailureCount) {
      if (clientId === userId) {
        this.wsFailureCount.delete(clientId)
      }
    }
  }

  /**
   * 清理房间消息缓冲区
   */
  clearRoomBuffer(roomId: string): void {
    this.messageBuffers.delete(roomId)
  }

  /** 测试重置 */
  resetTestState(): void {
    this.messageBuffers.clear()
    this.lastFetched.clear()
    this.wsFailureCount.clear()
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private fetchKey(roomId: string, userId: string): string {
    return `${roomId}:${userId}`
  }
}
