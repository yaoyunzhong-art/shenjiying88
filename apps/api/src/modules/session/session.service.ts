// session.service.ts · 会话管理服务
// Phase-FP P10 · 2026-07-08

import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DeviceInfo, Session } from './session.entity'

const SESSION_CONFIG = {
  maxConcurrentSessions: 5,
  sessionTimeoutMinutes: 30,
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  // 内存存储（生产环境应使用 Redis）
  private readonly sessions = new Map<string, Session>()
  private readonly userSessions = new Map<string, Set<string>>()

  /**
   * 创建会话
   */
  createSession(userId: string, tenantId: string, deviceInfo: DeviceInfo): Session {
    // 检查并发限制
    const existingIds = this.userSessions.get(userId)
    if (existingIds && existingIds.size >= SESSION_CONFIG.maxConcurrentSessions) {
      const oldest = this.findOldestSession(existingIds)
      if (oldest) {
        this.revokeSession(oldest)
        this.logger.warn(`Session ${oldest} revoked (max concurrent for user ${userId})`)
      }
    }

    const now = Date.now()
    const session: Session = {
      sessionId: randomUUID(),
      userId,
      tenantId,
      deviceInfo,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + SESSION_CONFIG.sessionTimeoutMinutes * 60 * 1000,
      status: 'active',
    }

    this.sessions.set(session.sessionId, session)

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set())
    }
    this.userSessions.get(userId)!.add(session.sessionId)

    this.logger.log(`Session created: ${session.sessionId} for user ${userId}`)
    return session
  }

  /**
   * 获取会话（自动检查过期）
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    if (session.expiresAt < Date.now() || session.status !== 'active') {
      this.revokeSession(sessionId)
      return null
    }

    return session
  }

  /**
   * 续期会话
   */
  touchSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || session.status !== 'active') return false

    session.lastActiveAt = Date.now()
    session.expiresAt = Date.now() + SESSION_CONFIG.sessionTimeoutMinutes * 60 * 1000
    return true
  }

  /**
   * 获取用户所有活跃会话
   */
  getUserSessions(userId: string): Session[] {
    const ids = this.userSessions.get(userId)
    if (!ids) return []

    const result: Session[] = []
    for (const id of ids) {
      const s = this.getSession(id)
      if (s) result.push(s)
    }
    return result
  }

  /**
   * 作废单条会话
   */
  revokeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.status = 'revoked'
    this.sessions.delete(sessionId)

    const set = this.userSessions.get(session.userId)
    if (set) {
      set.delete(sessionId)
      if (set.size === 0) this.userSessions.delete(session.userId)
    }

    this.logger.log(`Session revoked: ${sessionId}`)
    return true
  }

  /**
   * 作废用户所有会话
   */
  revokeAllUserSessions(userId: string): number {
    const ids = this.userSessions.get(userId)
    if (!ids) return 0

    let count = 0
    for (const id of ids) {
      const s = this.sessions.get(id)
      if (s) {
        s.status = 'revoked'
        this.sessions.delete(id)
        count++
      }
    }
    this.userSessions.delete(userId)

    this.logger.log(`Revoked ${count} sessions for user ${userId}`)
    return count
  }

  /**
   * 验证会话是否有效
   */
  isSessionValid(sessionId: string): boolean {
    return this.getSession(sessionId) !== null
  }

  /**
   * 获取用户活跃会话数
   */
  getUserSessionCount(userId: string): number {
    return this.getUserSessions(userId).length
  }

  // ─── 内部方法 ────────────────────────────────────────────────────────

  private findOldestSession(ids: Set<string>): string | null {
    let oldest: string | null = null
    let oldestTime = Infinity

    for (const id of ids) {
      const s = this.sessions.get(id)
      if (s && s.lastActiveAt < oldestTime) {
        oldestTime = s.lastActiveAt
        oldest = id
      }
    }

    return oldest
  }
}
