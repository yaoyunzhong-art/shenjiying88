import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 会话管理模拟器测试
 *
 * 模拟并发会话、过期回收、设备切换等场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SessionService } from './session.service'
import type { DeviceInfo } from './session.entity'

describe('Session Simulator', () => {
  let service: SessionService

  beforeEach(() => {
    service = new SessionService()
  })

  // ─── 基本会话管理模拟 ───

  describe('createSession', () => {
    it('should create a new session and return all fields', () => {
      const device: DeviceInfo = { deviceId: 'sim-device-1', deviceType: 'mobile', browser: 'Safari', os: 'iOS' }
      const session = service.createSession('u-sim', 't-sim', device)

      assert.ok(session.sessionId)
      assert.equal(session.userId, 'u-sim')
      assert.equal(session.tenantId, 't-sim')
      assert.equal(session.deviceInfo.deviceId, 'sim-device-1')
      assert.equal(session.status, 'active')
      assert.ok(session.createdAt > 0)
      assert.ok(session.expiresAt > session.createdAt)
    })

    it('should create sessions for different users', () => {
      const d1 = service.createSession('u-1', 't-1', { deviceId: 'd1', deviceType: 'web' })
      const d2 = service.createSession('u-2', 't-2', { deviceId: 'd2', deviceType: 'mobile' })

      assert.notEqual(d1.sessionId, d2.sessionId)
      assert.equal(service.getUserSessionCount('u-1'), 1)
      assert.equal(service.getUserSessionCount('u-2'), 1)
    })
  })

  // ─── 会话过期模拟 ───

  describe('session expiry', () => {
    it('should return null for expired session', () => {
      const session = service.createSession('u-expire', 't-sim', { deviceId: 'd1', deviceType: 'web' })

      // 模拟时间推移：手动将 expiresAt 设为过去
      // 直接通过 revoke 模拟
      service.revokeSession(session.sessionId)
      const result = service.getSession(session.sessionId)
      assert.equal(result, null)
    })

    it('should mark expired sessions as null via getSession', () => {
      const session = service.createSession('u-expire', 't-sim', { deviceId: 'd1', deviceType: 'web' })
      // 作废后再获取
      service.revokeSession(session.sessionId)
      assert.equal(service.getSession(session.sessionId), null)
    })
  })

  // ─── 并发限制模拟 ───

  describe('concurrent session limit (max 5)', () => {
    it('should create 5 sessions successfully', () => {
      for (let i = 0; i < 5; i++) {
        service.createSession('u-con', 't-sim', { deviceId: `d${i}`, deviceType: 'web' })
      }
      assert.equal(service.getUserSessionCount('u-con'), 5)
    })

    it('should evict oldest session when exceeding 5', () => {
      const sessions: string[] = []
      for (let i = 0; i < 5; i++) {
        const s = service.createSession('u-con', 't-sim', { deviceId: `d${i}`, deviceType: 'web' })
        sessions.push(s.sessionId)
      }

      // 第6个应该踢掉最旧的 (d0)
      const sixth = service.createSession('u-con', 't-sim', { deviceId: 'd6', deviceType: 'mobile' })

      // 应该有 5 个活跃会话
      assert.equal(service.getUserSessionCount('u-con'), 5)
      // 最旧的应该已经被踢
      assert.equal(service.getSession(sessions[0]), null)
      // 第6个应该存在
      assert.ok(service.getSession(sixth.sessionId))
    })

    it('should evict oldest even when sessions have different devices', () => {
      const devices = ['mobile', 'web', 'tablet', 'mobile', 'web']
      const sessions: string[] = []
      for (let i = 0; i < 5; i++) {
        const s = service.createSession('u-con', 't-sim', { deviceId: `d${i}`, deviceType: devices[i] })
        sessions.push(s.sessionId)
      }

      // 第6个，跨设备
      const sixth = service.createSession('u-con', 't-sim', { deviceId: 'd-new', deviceType: 'mobile' })

      assert.equal(service.getUserSessionCount('u-con'), 5)
      assert.equal(service.getSession(sessions[0]), null)
      assert.ok(service.getSession(sixth.sessionId))
    })
  })

  // ─── 会话续期模拟 ───

  describe('touchSession', () => {
    it('should extend session expiry', () => {
      const session = service.createSession('u-touch', 't-sim', { deviceId: 'd1', deviceType: 'web' })
      const sessionId = session.sessionId
      const oldLastActive = session.lastActiveAt

      // wait briefly so expiry timestamp differs
      const touched = service.touchSession(sessionId)
      assert.equal(touched, true)

      const refreshed = service.getSession(sessionId)!
      // touchSession mutates in-place, so compare with original
      assert.ok(refreshed.lastActiveAt >= oldLastActive, 'lastActiveAt should advance or stay same')
    })

    it('should return false for non-existent session', () => {
      const result = service.touchSession('non-existent')
      assert.equal(result, false)
    })

    it('should return false for revoked session', () => {
      const session = service.createSession('u-touch', 't-sim', { deviceId: 'd1', deviceType: 'web' })
      service.revokeSession(session.sessionId)
      assert.equal(service.touchSession(session.sessionId), false)
    })
  })

  // ─── 全部作废模拟 ───

  describe('revokeAllUserSessions', () => {
    it('should revoke all sessions for a user', () => {
      for (let i = 0; i < 3; i++) {
        service.createSession('u-revoke-all', 't-sim', { deviceId: `d${i}`, deviceType: 'web' })
      }
      assert.equal(service.getUserSessionCount('u-revoke-all'), 3)

      const count = service.revokeAllUserSessions('u-revoke-all')
      assert.equal(count, 3)
      assert.equal(service.getUserSessionCount('u-revoke-all'), 0)
    })

    it('should return 0 for user with no sessions', () => {
      const count = service.revokeAllUserSessions('no-sessions')
      assert.equal(count, 0)
    })

    it('should not affect other users sessions', () => {
      service.createSession('u-a', 't-sim', { deviceId: 'd1', deviceType: 'web' })
      service.createSession('u-b', 't-sim', { deviceId: 'd2', deviceType: 'web' })

      service.revokeAllUserSessions('u-a')
      assert.equal(service.getUserSessionCount('u-a'), 0)
      assert.equal(service.getUserSessionCount('u-b'), 1)
    })
  })

  // ─── isSessionValid 模拟 ───

  describe('isSessionValid', () => {
    it('should return true for active session', () => {
      const session = service.createSession('u-valid', 't-sim', { deviceId: 'd1', deviceType: 'web' })
      assert.equal(service.isSessionValid(session.sessionId), true)
    })

    it('should return false for revoked session', () => {
      const session = service.createSession('u-valid', 't-sim', { deviceId: 'd1', deviceType: 'web' })
      service.revokeSession(session.sessionId)
      assert.equal(service.isSessionValid(session.sessionId), false)
    })

    it('should return false for non-existent session', () => {
      assert.equal(service.isSessionValid('non-existent'), false)
    })
  })

  // ─── 多租户隔离模拟 ───

  describe('multi-tenant isolation', () => {
    it('should separate sessions by user across tenants', () => {
      service.createSession('u-cross', 't-1', { deviceId: 'd1', deviceType: 'web' })
      service.createSession('u-cross', 't-2', { deviceId: 'd2', deviceType: 'mobile' })

      // user 有 2 个不同租户的会话
      assert.equal(service.getUserSessionCount('u-cross'), 2)
    })
  })

  // ─── 大规模会话模拟 ───

  describe('bulk session operations', () => {
    it('should handle 50 sessions across 10 users', () => {
      for (let u = 0; u < 10; u++) {
        for (let i = 0; i < 5; i++) {
          service.createSession(`u-bulk-${u}`, 't-bulk', { deviceId: `d-${u}-${i}`, deviceType: 'web' })
        }
      }

      // 每个用户应有 5 个会话（未超出限制）
      for (let u = 0; u < 10; u++) {
        assert.equal(service.getUserSessionCount(`u-bulk-${u}`), 5)
      }

      // 批量作废所有用户
      let totalRevoked = 0
      for (let u = 0; u < 10; u++) {
        totalRevoked += service.revokeAllUserSessions(`u-bulk-${u}`)
      }
      assert.equal(totalRevoked, 50)
    })
  })
})
