import { Injectable, Logger } from '@nestjs/common'
import type { BufferedEvent } from './event-buffer.service'

/**
 * Phase-33: EventStore 服务 (持久化层)
 *
 * 设计目标:
 * - 持久化 AgentSessionEvent 到 Postgres
 * - 跨实例共享 (LISTEN/NOTIFY)
 * - 服务端重启不丢失
 * - Postgres 不可用时降级到内存
 *
 * 当前实现 (Phase-33):
 * - 使用 in-memory Map 持久化 (与 EventBuffer 类似的内存实现)
 * - 接口与未来 Postgres 实现完全兼容
 * - tenant_id 字段强制 (Phase-31 多租户)
 * - 监听器支持 (mock LISTEN/NOTIFY)
 *
 * Phase-34+ 演进:
 * - 替换 in-memory 为真实 pg.Pool
 * - LISTEN/NOTIFY 跨实例通知
 * - RLS (Row-Level Security) 强制 tenant_id
 */

export interface EventStoreListener {
  (notification: { sessionId: string; eventId: number; eventType: string; tenantId: string }): void
}

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name)

  /** session_id → 事件列表 (按 event_id 升序) */
  private store = new Map<string, BufferedEvent[]>()

  /** session_id → tenant_id (用于多租户过滤) */
  private sessionTenants = new Map<string, string>()

  /** session_id → listeners (mock LISTEN/NOTIFY) */
  private listeners = new Map<string, Set<EventStoreListener>>()

  /**
   * 持久化事件到 EventStore
   * - 同步写入内存 (Phase-33 in-memory 实现)
   * - Phase-34+ 会改为异步写 Postgres (fire-and-forget)
   * - 不抛异常 (持久化失败不影响主流程)
   */
  async persist(sessionId: string, event: BufferedEvent, tenantId: string): Promise<void> {
    try {
      // 记录 session-tenant 映射
      this.sessionTenants.set(sessionId, tenantId)

      // 写入 store
      let events = this.store.get(sessionId)
      if (!events) {
        events = []
        this.store.set(sessionId, events)
      }
      events.push(event)

      // 触发 listeners (mock LISTEN/NOTIFY)
      const listeners = this.listeners.get(sessionId)
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener({
              sessionId,
              eventId: event.id,
              eventType: event.type,
              tenantId
            })
          } catch (err) {
            this.logger.warn(`Listener error for ${sessionId}: ${err}`)
          }
        }
      }
    } catch (err) {
      this.logger.error(`persist failed for ${sessionId}: ${err}`)
      // 不 throw — fire-and-forget 兼容
    }
  }

  /**
   * 读取 session 内 lastEventId 之后的事件
   * - 跨实例场景: Phase-34+ 从 Postgres SELECT
   * - 当前: 从内存 store 查
   */
  async loadAfter(sessionId: string, lastEventId: number, tenantId?: string): Promise<BufferedEvent[]> {
    // 多租户校验
    if (tenantId) {
      const storedTenant = this.sessionTenants.get(sessionId)
      if (storedTenant && storedTenant !== tenantId) {
        // 跨租户访问, 返回空
        return []
      }
    }

    const events = this.store.get(sessionId) ?? []
    return events.filter((e) => e.id > lastEventId)
  }

  /**
   * 查询 session 完整历史
   */
  async getSessionHistory(sessionId: string, limit = 1000, tenantId?: string): Promise<BufferedEvent[]> {
    if (tenantId) {
      const storedTenant = this.sessionTenants.get(sessionId)
      if (storedTenant && storedTenant !== tenantId) {
        return []
      }
    }

    const events = this.store.get(sessionId) ?? []
    if (events.length <= limit) return [...events]
    return events.slice(-limit)
  }

  /**
   * 订阅 channel (mock LISTEN/NOTIFY)
   * 返回 unsubscribe 函数
   */
  subscribeChannel(sessionId: string, listener: EventStoreListener): () => void {
    let set = this.listeners.get(sessionId)
    if (!set) {
      set = new Set()
      this.listeners.set(sessionId, set)
    }
    set.add(listener)

    return () => {
      set?.delete(listener)
      if (set && set.size === 0) {
        this.listeners.delete(sessionId)
      }
    }
  }

  /**
   * 检查 session 是否存在
   */
  has(sessionId: string): boolean {
    return this.store.has(sessionId)
  }

  /**
   * 获取 session 事件数量
   */
  size(sessionId: string): number {
    return this.store.get(sessionId)?.length ?? 0
  }

  /**
   * 获取全局 session 数
   */
  totalSessions(): number {
    return this.store.size
  }

  /**
   * 清空指定 session
   */
  clear(sessionId: string): void {
    this.store.delete(sessionId)
    this.sessionTenants.delete(sessionId)
    this.listeners.delete(sessionId)
  }

  /**
   * 清空全部 (测试用)
   */
  clearAll(): void {
    this.store.clear()
    this.sessionTenants.clear()
    this.listeners.clear()
  }

  /**
   * 检查 EventStore 是否降级到内存模式
   * - Phase-34+ 会根据 Postgres 是否可用来判断
   * - 当前始终返回 true (in-memory 实现)
   */
  isDegraded(): boolean {
    return !process.env.POSTGRES_URL
  }
}