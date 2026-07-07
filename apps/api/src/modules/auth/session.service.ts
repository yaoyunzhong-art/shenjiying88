// session.service.ts · 会话管理服务
// Phase-FP P0 · 2026-07-03

import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { Session, DeviceInfo } from './auth.types'

const SESSION_CONFIG = {
  maxConcurrentSessions: 5,        // 最大并发会话数
  sessionTimeoutMinutes: 30,      // 会话超时 (分钟)
  absoluteTimeoutDays: 30,         // 绝对超时 (天)
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  // 内存存储 (生产环境应使用Redis)
  private readonly sessions = new Map<string, Session>()
  private readonly userSessions = new Map<string, Set<string>>()

  /**
   * 创建会话
   */
  createSession(
    userId: string,
    tenantId: string,
    deviceInfo: DeviceInfo,
  ): Session {
    // 检查并发会话数限制
    const existingSessionIds = this.userSessions.get(userId)
    if (existingSessionIds && existingSessionIds.size >= SESSION_CONFIG.maxConcurrentSessions) {
      // 踢除最旧的会话
      const oldestSessionId = this.findOldestSession(existingSessionIds)
      if (oldestSessionId) {
        this.revokeSession(oldestSessionId)
        this.logger.warn(`Session ${oldestSessionId} revoked due to max concurrent limit for user ${userId}`)
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
   * 获取会话
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // 检查是否过期
    if (session.expiresAt < Date.now() || session.status !== 'active') {
      this.revokeSession(sessionId)
      return null
    }

    return session
  }

  /**
   * 更新会话活跃时间
   */
  touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActiveAt = Date.now()
      session.expiresAt = Date.now() + SESSION_CONFIG.sessionTimeoutMinutes * 60 * 1000
    }
  }

  /**
   * 获取用户所有会话
   */
  getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId)
    if (!sessionIds) return []

    const sessions: Session[] = []
    for (const sessionId of sessionIds) {
      const session = this.getSession(sessionId)
      if (session) {
        sessions.push(session)
      }
    }
    return sessions
  }

  /**
   * 作废会话
   */
  revokeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.status = 'revoked'
    this.sessions.delete(sessionId)

    const userSessionSet = this.userSessions.get(session.userId)
    if (userSessionSet) {
      userSessionSet.delete(sessionId)
      if (userSessionSet.size === 0) {
        this.userSessions.delete(session.userId)
      }
    }

    this.logger.log(`Session revoked: ${sessionId}`)
    return true
  }

  /**
   * 作废用户所有会话
   */
  revokeAllUserSessions(userId: string): number {
    const sessionIds = this.userSessions.get(userId)
    if (!sessionIds) return 0

    let count = 0
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId)
      if (session) {
        session.status = 'revoked'
        this.sessions.delete(sessionId)
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
    const session = this.getSession(sessionId)
    return session !== null
  }

  /**
   * 获取用户会话数
   */
  getUserSessionCount(userId: string): number {
    return this.getUserSessions(userId).length
  }

  // ─── 内部方法 ────────────────────────────────────────────────────────

  private findOldestSession(sessionIds: Set<string>): string | null {
    let oldest: string | null = null
    let oldestTime = Infinity

    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId)
      if (session && session.lastActiveAt < oldestTime) {
        oldestTime = session.lastActiveAt
        oldest = sessionId
      }
    }

    return oldest
  }
}
