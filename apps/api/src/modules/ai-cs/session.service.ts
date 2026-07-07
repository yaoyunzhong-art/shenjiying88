import { Injectable } from '@nestjs/common'
import { SessionContext, SessionCacheOptions, Message } from './ai-cs.entity'

/**
 * Phase-41 T171: SessionService (上下文窗口 LRU)
 *
 * DR-41-B: 5 轮窗口滑动 (LRU 淘汰最早)
 *  - maxRounds=5 (默认)
 *  - maxSessions=200 (LRU 缓存)
 *  - ttlMs=30min (过期自动清理)
 */

@Injectable()
export class SessionService {
  private readonly DEFAULT_OPTIONS: SessionCacheOptions = {
    maxRounds: 5,
    maxSessions: 200,
    ttlMs: 30 * 60 * 1000
  }

  private sessions = new Map<string, SessionContext>()
  private options: SessionCacheOptions

  constructor() {
    this.options = { ...this.DEFAULT_OPTIONS }
  }

  configure(options: Partial<SessionCacheOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * 获取会话上下文 (LRU 刷新)
   */
  get(conversationId: string): SessionContext | null {
    const ctx = this.sessions.get(conversationId)
    if (!ctx) return null
    if (Date.now() - ctx.lastActivityAt > this.options.ttlMs) {
      this.sessions.delete(conversationId)
      return null
    }
    ctx.lastActivityAt = Date.now()  // LRU 刷新
    return ctx
  }

  /**
   * 创建或获取会话上下文
   */
  getOrCreate(conversationId: string): SessionContext {
    let ctx = this.get(conversationId)
    if (!ctx) {
      ctx = {
        conversationId,
        messages: [],
        lastActivityAt: Date.now()
      }
      this.sessions.set(conversationId, ctx)
      this.evictIfNeeded()
    }
    return ctx
  }

  /**
   * 追加消息 (滑动窗口)
   */
  appendMessage(conversationId: string, role: 'system' | 'user' | 'assistant', content: string): SessionContext {
    const ctx = this.getOrCreate(conversationId)
    ctx.messages.push({ role, content })

    // 滑动窗口: 保留最后 maxRounds * 2 条 (user+assistant 各一轮)
    const maxMessages = this.options.maxRounds * 2
    if (ctx.messages.length > maxMessages) {
      // 保留 system + 最后 maxMessages
      const systemMsgs = ctx.messages.filter((m: SessionContext['messages'][number]) => m.role === 'system')
      const recentMsgs = ctx.messages.filter((m: SessionContext['messages'][number]) => m.role !== 'system').slice(-maxMessages)
      ctx.messages = [...systemMsgs, ...recentMsgs]
    }
    ctx.lastActivityAt = Date.now()
    return ctx
  }

  /**
   * 替换完整上下文 (用于会话恢复)
   */
  replaceContext(conversationId: string, messages: SessionContext['messages']): SessionContext {
    const ctx = this.getOrCreate(conversationId)
    ctx.messages = [...messages]
    ctx.lastActivityAt = Date.now()
    return ctx
  }

  /**
   * 清除会话上下文
   */
  clear(conversationId: string): boolean {
    return this.sessions.delete(conversationId)
  }

  /**
   * 统计
   */
  stats(): { size: number; maxSessions: number; maxRounds: number; ttlMs: number } {
    return {
      size: this.sessions.size,
      maxSessions: this.options.maxSessions,
      maxRounds: this.options.maxRounds,
      ttlMs: this.options.ttlMs
    }
  }

  /**
   * 从 Message[] 还原上下文 (按 timestamp 排序取最后 N 轮)
   */
  hydrateFromMessages(conversationId: string, messages: Message[]): SessionContext {
    const sorted = [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const recent = sorted.slice(-(this.options.maxRounds * 2))
    const ctxMsgs = recent.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : m.role === 'human-agent' ? 'assistant' : m.role === 'system' ? 'system' : 'user') as 'system' | 'user' | 'assistant',
      content: m.content
    }))
    return this.replaceContext(conversationId, ctxMsgs)
  }

  /**
   * LRU 淘汰
   */
  private evictIfNeeded(): void {
    if (this.sessions.size <= this.options.maxSessions) return
    // 找出最久未活动的会话
    let oldest: string | null = null
    let oldestTime = Infinity
    for (const [id, ctx] of this.sessions.entries()) {
      if (ctx.lastActivityAt < oldestTime) {
        oldestTime = ctx.lastActivityAt
        oldest = id
      }
    }
    if (oldest) this.sessions.delete(oldest)
  }
}