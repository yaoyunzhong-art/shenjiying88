import { Injectable, Logger } from '@nestjs/common'
import type { AgentSessionEvent } from './agent.entity'
import { EventStoreService } from './event-store.service'

/**
 * Phase-32: 事件缓冲服务 (服务端 SSE buffer for Last-Event-ID replay)
 *
 * 设计:
 * - 每个 session 独立维护一个 FIFO 缓冲,默认 100 条 (LRU 超出淘汰最早)
 * - 每 session 自增 id (单调递增整数),无时钟漂移
 * - 全局 session 数量上限 10000 (LRU 淘汰整 session 缓冲)
 * - replayAfter(sessionId, lastEventId) 返回 lastEventId 之后的所有事件
 *
 * 内存估算: 10000 sessions × 100 events × ~1KB ≈ 1GB (单实例, 可监控)
 *
 * Phase-33 演进: 替换为 Postgres 持久化 changefeed,本 service 接口保持兼容
 */

/** 带 id 的事件 */
export type BufferedEvent = AgentSessionEvent & { id: number }

interface SessionBuffer {
  events: BufferedEvent[]
  maxId: number
  createdAt: number
  lastAccessedAt: number
}

@Injectable()
export class EventBufferService {
  private readonly logger = new Logger(EventBufferService.name)

  /** sessionId → buffer */
  private buffers = new Map<string, SessionBuffer>()

  /** 单 session 最大事件数 (LRU 超出淘汰最早) */
  private readonly MAX_EVENTS_PER_SESSION = 100

  /** 全局 session 数量上限 (LRU 淘汰整个 session) */
  private readonly MAX_SESSIONS = 10000

  /** Phase-33: EventStore 可选依赖, 注入后可双写持久化 */
  private eventStore: EventStoreService | null = null

  /**
   * Phase-33: 注入 EventStore (可选, 失败不阻塞)
   * 通过 setter 注入避免循环依赖, 兼容未配置 Postgres 的场景
   */
  setEventStore(eventStore: EventStoreService | null): void {
    this.eventStore = eventStore
    this.logger.log(`EventStore ${eventStore ? 'enabled' : 'disabled'} for dual-write`)
  }

  /**
   * 追加一个事件到指定 session 的缓冲
   * 自动分配单调递增 id
   * Phase-33: 双写 - 同步写内存, 异步 fire-and-forget 写 EventStore
   */
  append(sessionId: string, event: AgentSessionEvent, tenantId?: string): BufferedEvent {
    let buffer = this.buffers.get(sessionId)
    if (!buffer) {
      // LRU 淘汰最久未访问的 session
      if (this.buffers.size >= this.MAX_SESSIONS) {
        this.evictLeastRecentlyUsed()
      }
      buffer = {
        events: [],
        maxId: 0,
        createdAt: Date.now(),
        lastAccessedAt: Date.now()
      }
      this.buffers.set(sessionId, buffer)
    }

    buffer.maxId += 1
    const bufferedEvent = { ...event, id: buffer.maxId } as BufferedEvent
    buffer.events.push(bufferedEvent)
    buffer.lastAccessedAt = Date.now()

    // 超过上限淘汰最早
    if (buffer.events.length > this.MAX_EVENTS_PER_SESSION) {
      buffer.events.shift()
    }

    // Phase-33: 异步 fire-and-forget 双写 EventStore
    if (this.eventStore) {
      void this.eventStore.persist(sessionId, bufferedEvent, tenantId ?? 'default').catch((err: unknown) => {
        this.logger.warn(`EventStore persist failed (degraded to memory only): ${err}`)
      })
    }

    return bufferedEvent
  }

  /**
   * 获取 lastEventId 之后的所有事件 (用于断连 replay)
   * Phase-33: 优先查 EventStore (跨实例 + 持久化), fallback 内存
   * @returns { events, lastValidId, found }
   *   - events: lastEventId 之后的事件数组 (不含 lastEventId 本身)
   *   - lastValidId: 当前 buffer 中最早的 id (用于告知客户端)
   *   - found: false 表示 lastEventId 已过期 (events 包含全部可 replay 的)
   */
  async replayAfterAsync(
    sessionId: string,
    lastEventId: number | string,
    tenantId?: string
  ): Promise<{ events: BufferedEvent[]; lastValidId: number; found: boolean }> {
    const lastIdNum = typeof lastEventId === 'string' ? parseInt(lastEventId, 10) : lastEventId
    if (isNaN(lastIdNum)) {
      return { events: [], lastValidId: 0, found: false }
    }

    // Phase-33: 优先查 EventStore
    if (this.eventStore && this.eventStore.has(sessionId)) {
      try {
        const storeEvents = await this.eventStore.loadAfter(sessionId, lastIdNum, tenantId)
        if (storeEvents.length > 0) {
          const oldestId = storeEvents[0].id
          return { events: storeEvents, lastValidId: oldestId, found: true }
        }
      } catch (err: unknown) {
        this.logger.warn(`EventStore loadAfter failed, fallback to memory: ${err}`)
      }
    }

    // Fallback: 内存 buffer
    return this.replayAfter(sessionId, lastIdNum)
  }

  /**
   * 同步版本 (向后兼容 Phase-32 API)
   * 仅查内存, 不查 EventStore
   */
  replayAfter(
    sessionId: string,
    lastEventId: number | string
  ): { events: BufferedEvent[]; lastValidId: number; found: boolean } {
    const buffer = this.buffers.get(sessionId)
    if (!buffer || buffer.events.length === 0) {
      return { events: [], lastValidId: 0, found: false }
    }

    const lastIdNum = typeof lastEventId === 'string' ? parseInt(lastEventId, 10) : lastEventId
    if (isNaN(lastIdNum)) {
      return { events: [], lastValidId: this.getOldestId(buffer), found: false }
    }

    // buffer 中最早的 id
    const oldestId = this.getOldestId(buffer)
    if (lastIdNum < oldestId - 1) {
      // 已过期 (早于 buffer 最旧)
      // 返回全部 buffer 内容
      return { events: [...buffer.events], lastValidId: oldestId, found: false }
    }

    // 找到 lastIdNum 之后的事件
    const after = buffer.events.filter((e) => e.id > lastIdNum)
    return { events: after, lastValidId: oldestId, found: true }
  }

  /** 判断 session 是否有缓冲 */
  has(sessionId: string): boolean {
    return this.buffers.has(sessionId)
  }

  /** 获取 session 当前缓冲大小 */
  size(sessionId: string): number {
    return this.buffers.get(sessionId)?.events.length ?? 0
  }

  /** 获取全局 session 数 */
  totalSessions(): number {
    return this.buffers.size
  }

  /** 清空指定 session 缓冲 (用于测试或主动清理) */
  clear(sessionId: string): void {
    this.buffers.delete(sessionId)
  }

  /** 清空全部 (用于测试) */
  clearAll(): void {
    this.buffers.clear()
  }

  // ── Private helpers ──

  private getOldestId(buffer: SessionBuffer): number {
    return buffer.events.length > 0 ? buffer.events[0].id : 0
  }

  /** LRU 淘汰最久未访问的 session */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, buf] of this.buffers.entries()) {
      if (buf.lastAccessedAt < oldestTime) {
        oldestTime = buf.lastAccessedAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.buffers.delete(oldestKey)
      this.logger.debug(`Evicted session buffer: ${oldestKey}`)
    }
  }
}