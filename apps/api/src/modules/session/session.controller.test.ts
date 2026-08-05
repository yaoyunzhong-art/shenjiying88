/**
 * session.controller.spec.ts - 会话管理 Controller 单元测试
 * 策略: 内联 Controller + Mock Service (不使用 NestJS DI)
 * 覆盖所有路由端点: 正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'

// ── Mock SessionService ──────────────────────────────────────────────────
class MockSessionService {
  private sessions = new Map<string, any>()
  private userSessions = new Map<string, Set<string>>()
  private config = { maxConcurrentSessions: 5, sessionTimeoutMinutes: 30 }
  private sessionCounter = 0

  createSession(userId: string, tenantId: string, deviceInfo: any) {
    const existingIds = this.userSessions.get(userId)
    if (existingIds && existingIds.size >= this.config.maxConcurrentSessions) {
      const oldest = this.findOldestSession(existingIds)
      if (oldest) this.revokeSession(oldest)
    }

    this.sessionCounter++
    const now = Date.now()
    const session = {
      sessionId: `session_${userId}_${now}_${this.sessionCounter}`,
      userId,
      tenantId,
      deviceInfo,
      createdAt: now + this.sessionCounter,
      lastActiveAt: now + this.sessionCounter,
      expiresAt: now + this.config.sessionTimeoutMinutes * 60 * 1000 + this.sessionCounter,
      status: 'active' as const,
    }

    this.sessions.set(session.sessionId, session)
    if (!this.userSessions.has(userId)) this.userSessions.set(userId, new Set())
    this.userSessions.get(userId)!.add(session.sessionId)
    return { ...session }
  }

  getSession(sessionId: string) {
    const s = this.sessions.get(sessionId)
    if (!s) return null
    if (s.expiresAt < Date.now() || s.status !== 'active') {
      this.revokeSession(sessionId)
      return null
    }
    return { ...s }
  }

  getUserSessions(userId: string) {
    const ids = this.userSessions.get(userId)
    if (!ids) return []
    // Copy to avoid Set mutation during iteration (getSession calls revokeSession)
    const result: any[] = []
    for (const id of [...ids]) {
      const s = this.getSession(id)
      if (s) result.push(s)
    }
    return result
  }

  isSessionValid(sessionId: string) {
    return this.getSession(sessionId) !== null
  }

  getUserSessionCount(userId: string) {
    return this.getUserSessions(userId).length
  }

  touchSession(sessionId: string) {
    const s = this.sessions.get(sessionId)
    if (!s || s.status !== 'active') return false
    s.lastActiveAt = Date.now()
    s.expiresAt = Date.now() + this.config.sessionTimeoutMinutes * 60 * 1000
    return true
  }

  revokeSession(sessionId: string) {
    const s = this.sessions.get(sessionId)
    if (!s) return false
    s.status = 'revoked'
    this.sessions.delete(sessionId)
    const set = this.userSessions.get(s.userId)
    if (set) {
      set.delete(sessionId)
      if (set.size === 0) this.userSessions.delete(s.userId)
    }
    return true
  }

  revokeAllUserSessions(userId: string) {
    const ids = this.userSessions.get(userId)
    if (!ids) return 0
    let count = 0
    // Copy to avoid mutation during iteration
    for (const id of [...ids]) {
      const s = this.sessions.get(id)
      if (s) { s.status = 'revoked'; this.sessions.delete(id); count++ }
    }
    this.userSessions.delete(userId)
    return count
  }

  private findOldestSession(ids: Set<string>) {
    let oldest: string | null = null
    let oldestTime = Infinity
    for (const id of ids) {
      const s = this.sessions.get(id)
      if (s && s.lastActiveAt < oldestTime) { oldestTime = s.lastActiveAt; oldest = id }
    }
    return oldest
  }

  reset() {
    this.sessions.clear()
    this.userSessions.clear()
    this.sessionCounter = 0
  }
}

// ── Controller (inline, matching session.controller.ts) ──────────────────
function createController(service: MockSessionService) {
  return {
    createSession(body: any) {
      if (!body.userId || !body.tenantId) {
        throw Object.assign(new Error('Bad Request'), { status: 400 })
      }
      const deviceInfo = body.deviceInfo || { deviceId: 'unknown', deviceType: 'unknown' }
      const session = service.createSession(body.userId, body.tenantId, deviceInfo)
      return {
        sessionId: session.sessionId,
        userId: session.userId,
        tenantId: session.tenantId,
        deviceInfo: session.deviceInfo,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        status: session.status,
      }
    },

    validateSession(body: any) {
      if (!body.sessionId) {
        throw Object.assign(new Error('Bad Request'), { status: 400 })
      }
      const session = service.getSession(body.sessionId)
      const valid = session !== null
      return { valid, userId: session?.userId, tenantId: session?.tenantId }
    },

    revokeSession(body: any) {
      if (!body.sessionId) {
        throw Object.assign(new Error('Bad Request'), { status: 400 })
      }
      const success = service.revokeSession(body.sessionId)
      if (!success) {
        throw Object.assign(new Error(`Session ${body.sessionId} not found`), { status: 404 })
      }
      return { success: true, revokedAt: new Date().toISOString() }
    },

    revokeAllUserSessions(body: any) {
      if (!body.userId) {
        throw Object.assign(new Error('Bad Request'), { status: 400 })
      }
      const count = service.revokeAllUserSessions(body.userId)
      return { success: true, revokedCount: count }
    },

    getUserSessions(userId: string) {
      if (!userId) {
        throw Object.assign(new Error('Bad Request'), { status: 400 })
      }
      const sessions = service.getUserSessions(userId)
      const infoList = sessions.map((s: any) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        tenantId: s.tenantId,
        deviceType: s.deviceInfo.deviceType,
        deviceId: s.deviceInfo.deviceId,
        browser: s.deviceInfo.browser,
        os: s.deviceInfo.os,
        ip: (s.deviceInfo as any).ip,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        status: s.status,
      }))
      return { sessions: infoList, count: infoList.length }
    },

    getSession(sessionId: string) {
      if (!sessionId) {
        throw Object.assign(new Error('Bad Request'), { status: 400 })
      }
      const s = service.getSession(sessionId)
      if (!s) {
        throw Object.assign(new Error(`Session ${sessionId} not found or expired`), { status: 404 })
      }
      return {
        sessionId: s.sessionId,
        userId: s.userId,
        tenantId: s.tenantId,
        deviceType: s.deviceInfo.deviceType,
        deviceId: s.deviceInfo.deviceId,
        browser: s.deviceInfo.browser,
        os: s.deviceInfo.os,
        ip: (s.deviceInfo as any).ip,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        status: s.status,
      }
    },

    deleteSession(sessionId: string) {
      if (!sessionId) {
        throw Object.assign(new Error('Bad Request'), { status: 400 })
      }
      const success = service.revokeSession(sessionId)
      if (!success) {
        throw Object.assign(new Error(`Session ${sessionId} not found`), { status: 404 })
      }
      return { success: true, message: 'Session deleted' }
    },
  }
}

// ── Test Data ────────────────────────────────────────────────────────────
const makeDeviceInfo = (overrides: Record<string, any> = {}) => ({
  deviceId: 'dev-mac-001',
  deviceType: 'web',
  browser: 'Chrome',
  os: 'macOS',
  ...overrides,
})

const makeCreateSessionDto = (overrides: Record<string, any> = {}) => ({
  userId: 'user-001',
  tenantId: 'tenant-001',
  deviceInfo: makeDeviceInfo(),
  ...overrides,
})

// ── Test Suite ────────────────────────────────────────────────────────────
describe('SessionController (spec)', () => {
  let service: MockSessionService
  let controller: ReturnType<typeof createController>

  beforeEach(() => {
    service = new MockSessionService()
    controller = createController(service)
  })

  afterEach(() => {
    service.reset()
  })

  // ── POST /sessions ──────────────────────────────────────────────────
  describe('createSession()', () => {
    it('should create a session successfully', () => {
      const result = controller.createSession(makeCreateSessionDto())

      assert(result.sessionId, 'should have sessionId')
      assert.equal(result.userId, 'user-001')
      assert.equal(result.tenantId, 'tenant-001')
      assert.equal(result.status, 'active')
      assert.ok(result.createdAt > 0, 'createdAt should be set')
      assert.ok(result.expiresAt > result.createdAt, 'expiresAt should be in future')
    })

    it('should throw on missing userId', () => {
      assert.throws(
        () => controller.createSession(makeCreateSessionDto({ userId: undefined })),
        /Bad Request/,
      )
    })

    it('should throw on missing tenantId', () => {
      assert.throws(
        () => controller.createSession(makeCreateSessionDto({ tenantId: undefined })),
        /Bad Request/,
      )
    })

    it('should use default deviceInfo when not provided', () => {
      const result = controller.createSession(makeCreateSessionDto({ deviceInfo: undefined }))
      assert.equal(result.deviceInfo.deviceType, 'unknown')
      assert.equal(result.deviceInfo.deviceId, 'unknown')
    })
  })

  // ── POST /sessions/validate ─────────────────────────────────────────
  describe('validateSession()', () => {
    it('should return valid for an active session', () => {
      const created = controller.createSession(makeCreateSessionDto())
      const result = controller.validateSession({ sessionId: created.sessionId })
      assert(result.valid, 'session should be valid')
      assert.equal(result.userId, 'user-001')
    })

    it('should return invalid for non-existing session', () => {
      const result = controller.validateSession({ sessionId: 'no-such-session' })
      assert.equal(result.valid, false)
    })

    it('should throw on missing sessionId', () => {
      assert.throws(
        () => controller.validateSession({}),
        /Bad Request/,
      )
    })
  })

  // ── POST /sessions/revoke ───────────────────────────────────────────
  describe('revokeSession()', () => {
    it('should revoke an active session', () => {
      const created = controller.createSession(makeCreateSessionDto())
      const result = controller.revokeSession({ sessionId: created.sessionId })
      assert(result.success, 'revoke should succeed')
      assert.ok(result.revokedAt, 'should have timestamp')

      // Verify revoked
      const validate = controller.validateSession({ sessionId: created.sessionId })
      assert.equal(validate.valid, false)
    })

    it('should throw 404 for non-existing session', () => {
      assert.throws(
        () => controller.revokeSession({ sessionId: 'no-such' }),
        /not found/,
      )
    })

    it('should throw on missing sessionId', () => {
      assert.throws(
        () => controller.revokeSession({}),
        /Bad Request/,
      )
    })
  })

  // ── POST /sessions/revoke-all ───────────────────────────────────────
  describe('revokeAllUserSessions()', () => {
    it('should revoke all sessions for a user', () => {
      controller.createSession(makeCreateSessionDto({ deviceInfo: makeDeviceInfo({ deviceId: 'd1' }) }))
      controller.createSession(makeCreateSessionDto({ deviceInfo: makeDeviceInfo({ deviceId: 'd2' }) }))
      controller.createSession(makeCreateSessionDto({ deviceInfo: makeDeviceInfo({ deviceId: 'd3' }) }))

      const result = controller.revokeAllUserSessions({ userId: 'user-001' })
      assert(result.success, 'should succeed')
      assert.equal(result.revokedCount, 3, 'should revoke 3 sessions')

      // Verify all revoked
      const sessions = controller.getUserSessions('user-001')
      assert.equal(sessions.count, 0)
    })

    it('should return 0 for user with no sessions', () => {
      const result = controller.revokeAllUserSessions({ userId: 'no-such-user' })
      assert(result.success, 'should succeed')
      assert.equal(result.revokedCount, 0)
    })

    it('should throw on missing userId', () => {
      assert.throws(
        () => controller.revokeAllUserSessions({}),
        /Bad Request/,
      )
    })
  })

  // ── GET /sessions/user/:userId ──────────────────────────────────────
  describe('getUserSessions()', () => {
    it('should return sessions for user with multiple devices', () => {
      controller.createSession(makeCreateSessionDto({ deviceInfo: makeDeviceInfo({ deviceId: 'web1' }) }))
      controller.createSession(makeCreateSessionDto({
        userId: 'user-001',
        tenantId: 'tenant-001',
        deviceInfo: makeDeviceInfo({ deviceId: 'mobile1', deviceType: 'mobile' }),
      }))

      const result = controller.getUserSessions('user-001')
      assert.equal(result.count, 2)
      assert.equal(result.sessions.length, 2)
    })

    it('should return empty for user with no sessions', () => {
      const result = controller.getUserSessions('no-such-user')
      assert.equal(result.count, 0)
      assert.equal(result.sessions.length, 0)
    })

    it('should throw on empty userId', () => {
      assert.throws(
        () => controller.getUserSessions(''),
        /Bad Request/,
      )
    })
  })

  // ── GET /sessions/:sessionId ────────────────────────────────────────
  describe('getSession()', () => {
    it('should return session details by sessionId', () => {
      const created = controller.createSession(makeCreateSessionDto())
      const result = controller.getSession(created.sessionId)
      assert.equal(result.sessionId, created.sessionId)
      assert.equal(result.userId, 'user-001')
      assert.equal(result.deviceType, 'web')
      assert.equal(result.browser, 'Chrome')
    })

    it('should throw 404 for non-existing session', () => {
      assert.throws(
        () => controller.getSession('no-such-session'),
        /not found/,
      )
    })

    it('should throw on empty sessionId', () => {
      assert.throws(
        () => controller.getSession(''),
        /Bad Request/,
      )
    })
  })

  // ── DELETE /sessions/:sessionId ─────────────────────────────────────
  describe('deleteSession()', () => {
    it('should delete an active session', () => {
      const created = controller.createSession(makeCreateSessionDto())
      const result = controller.deleteSession(created.sessionId)
      assert(result.success, 'delete should succeed')
      assert.equal(result.message, 'Session deleted')

      // Verify deleted
      assert.throws(
        () => controller.getSession(created.sessionId),
        /not found/,
      )
    })

    it('should throw 404 for non-existing session', () => {
      assert.throws(
        () => controller.deleteSession('no-such'),
        /not found/,
      )
    })

    it('should throw on empty sessionId', () => {
      assert.throws(
        () => controller.deleteSession(''),
        /Bad Request/,
      )
    })
  })

  // ── 边界测试 ─────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('should handle max concurrent sessions by revoking oldest', () => {
      // Create 5 sessions (max)
      const sessions = []
      for (let i = 0; i < 5; i++) {
        sessions.push(controller.createSession(makeCreateSessionDto({
          deviceInfo: makeDeviceInfo({ deviceId: `d${i}` }),
        })))
      }

      // The 6th session should succeed (oldest gets revoked)
      const sixth = controller.createSession(makeCreateSessionDto({
        deviceInfo: makeDeviceInfo({ deviceId: 'd6' }),
      }))
      assert(sixth.sessionId, '6th session should be created')

      const userSessions = controller.getUserSessions('user-001')
      assert.equal(userSessions.count, 5, 'should have at most 5 active sessions')
    })
  })
})
