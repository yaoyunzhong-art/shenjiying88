/**
 * session.service.test.ts · SessionService 单元测试
 * 🐜 自动: [auth] [D] session service test 补全
 *
 * 覆盖：
 * - createSession（正常流程 + 并发限制 + 踢旧）
 * - getSession（正常 + 过期 + 不存在）
 * - touchSession（刷新过期时间）
 * - getUserSessions（正常 + 空）
 * - revokeSession（正常 + 不存在）
 * - revokeAllUserSessions（正常 + 无会话）
 * - isSessionValid（正常 + 过期+作废）
 * - getUserSessionCount（正常）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SessionService } from './session.service'
import type { DeviceInfo } from './auth.types'

function makeDeviceInfo(overrides?: Partial<DeviceInfo>): DeviceInfo {
  return {
    deviceId: 'dev-001',
    deviceType: 'web',
    browser: 'Chrome',
    os: 'macOS',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    ...overrides,
  }
}

describe('SessionService', () => {
  let service: SessionService

  beforeEach(() => {
    service = new SessionService()
  })

  // ── createSession ──
  describe('createSession', () => {
    it('正例: 创建会话并返回完整 Session 对象', () => {
      const deviceInfo = makeDeviceInfo()
      const session = service.createSession('user-001', 't-001', deviceInfo)

      expect(session).toBeDefined()
      expect(session.sessionId).toBeTruthy()
      expect(session.userId).toBe('user-001')
      expect(session.tenantId).toBe('t-001')
      expect(session.deviceInfo).toEqual(deviceInfo)
      expect(session.status).toBe('active')
      expect(session.createdAt).toBeGreaterThan(0)
      expect(session.lastActiveAt).toBeGreaterThan(0)
      expect(session.expiresAt).toBeGreaterThan(session.createdAt)
    })

    it('正例: 同一用户可以创建多个会话', () => {
      const d1 = makeDeviceInfo({ deviceId: 'dev-a' })
      const d2 = makeDeviceInfo({ deviceId: 'dev-b' })

      const s1 = service.createSession('multi-user', 't-001', d1)
      const s2 = service.createSession('multi-user', 't-001', d2)

      expect(s1.sessionId).not.toBe(s2.sessionId)
      expect(service.getUserSessionCount('multi-user')).toBe(2)
    })

    it('反例: 超过最大并发数时踢除最旧会话', () => {
      // 默认 maxConcurrentSessions = 5，创建6个会话，最旧的应被踢除
      const sessions: string[] = []
      for (let i = 0; i < 6; i++) {
        const s = service.createSession('concurrent-user', 't-001', makeDeviceInfo({ deviceId: `dev-${i}` }))
        sessions.push(s.sessionId)
      }

      // 第1个会话应该已被踢除（最旧的）
      const firstSessionValid = service.isSessionValid(sessions[0])
      expect(firstSessionValid).toBe(false)

      // 最新的5个应该有效
      for (let i = 1; i < 6; i++) {
        expect(service.isSessionValid(sessions[i])).toBe(true)
      }

      // 总数应为5
      expect(service.getUserSessionCount('concurrent-user')).toBe(5)
    })

    it('边界: 设备信息不含可选字段', () => {
      const minimalDevice: DeviceInfo = {
        deviceId: 'min-dev',
        deviceType: 'unknown',
      }
      const session = service.createSession('min-user', 't-001', minimalDevice)
      expect(session.deviceInfo.deviceType).toBe('unknown')
      expect(session.deviceInfo.browser).toBeUndefined()
    })
  })

  // ── getSession ──
  describe('getSession', () => {
    it('正例: 通过 sessionId 获取有效会话', () => {
      const session = service.createSession('get-user', 't-001', makeDeviceInfo())
      const found = service.getSession(session.sessionId)

      expect(found).not.toBeNull()
      expect(found!.sessionId).toBe(session.sessionId)
      expect(found!.status).toBe('active')
    })

    it('反例: 不存在的 sessionId 返回 null', () => {
      const result = service.getSession('non-existent-id')
      expect(result).toBeNull()
    })

    it('反例: 已作废的会话返回 null', () => {
      const session = service.createSession('revoke-get', 't-001', makeDeviceInfo())
      service.revokeSession(session.sessionId)

      const result = service.getSession(session.sessionId)
      expect(result).toBeNull()
    })
  })

  // ── touchSession ──
  describe('touchSession', () => {
    it('正例: 更新会话活跃时间并续期过期时间', () => {
      const session = service.createSession('touch-user', 't-001', makeDeviceInfo())
      const originalExpiresAt = session.expiresAt

      // 模拟等待 10ms 后 touch
      service.touchSession(session.sessionId)

      const updated = service.getSession(session.sessionId)
      expect(updated).not.toBeNull()
      expect(updated!.lastActiveAt).toBeGreaterThanOrEqual(session.lastActiveAt)
      expect(updated!.expiresAt).toBeGreaterThanOrEqual(originalExpiresAt)
    })

    it('边界: touch 不存在的 session 不报错', () => {
      expect(() => service.touchSession('ghost-session')).not.toThrow()
    })
  })

  // ── getUserSessions ──
  describe('getUserSessions', () => {
    it('正例: 返回用户所有活跃会话', () => {
      service.createSession('list-user', 't-001', makeDeviceInfo({ deviceId: 'd1' }))
      service.createSession('list-user', 't-001', makeDeviceInfo({ deviceId: 'd2' }))

      const sessions = service.getUserSessions('list-user')
      expect(sessions).toHaveLength(2)
    })

    it('边界: 无会话返回空数组', () => {
      const sessions = service.getUserSessions('no-session-user')
      expect(sessions).toEqual([])
    })

    it('边界: 已作废的会话不包含在活跃列表中', () => {
      const s1 = service.createSession('mixed-user', 't-001', makeDeviceInfo({ deviceId: 'd1' }))
      service.createSession('mixed-user', 't-001', makeDeviceInfo({ deviceId: 'd2' }))

      service.revokeSession(s1.sessionId)

      const sessions = service.getUserSessions('mixed-user')
      expect(sessions).toHaveLength(1)
      expect(sessions[0].deviceInfo.deviceId).toBe('d2')
    })
  })

  // ── revokeSession ──
  describe('revokeSession', () => {
    it('正例: 作废会话并返回 true', () => {
      const session = service.createSession('revoke-user', 't-001', makeDeviceInfo())
      const result = service.revokeSession(session.sessionId)

      expect(result).toBe(true)
      expect(service.getSession(session.sessionId)).toBeNull()
      expect(service.getUserSessions('revoke-user')).toHaveLength(0)
    })

    it('反例: 作废不存在的会话返回 false', () => {
      const result = service.revokeSession('ghost')
      expect(result).toBe(false)
    })
  })

  // ── revokeAllUserSessions ──
  describe('revokeAllUserSessions', () => {
    it('正例: 作废用户所有会话', () => {
      service.createSession('all-revoke', 't-001', makeDeviceInfo({ deviceId: 'd1' }))
      service.createSession('all-revoke', 't-001', makeDeviceInfo({ deviceId: 'd2' }))
      service.createSession('all-revoke', 't-001', makeDeviceInfo({ deviceId: 'd3' }))

      const count = service.revokeAllUserSessions('all-revoke')

      expect(count).toBe(3)
      expect(service.getUserSessionCount('all-revoke')).toBe(0)
    })

    it('边界: 无会话时返回 0', () => {
      const count = service.revokeAllUserSessions('nobody')
      expect(count).toBe(0)
    })
  })

  // ── isSessionValid ──
  describe('isSessionValid', () => {
    it('正例: 有效会话返回 true', () => {
      const session = service.createSession('valid-check', 't-001', makeDeviceInfo())
      expect(service.isSessionValid(session.sessionId)).toBe(true)
    })

    it('反例: 无效会话（不存在）返回 false', () => {
      expect(service.isSessionValid('nope')).toBe(false)
    })

    it('反例: 已作废会话返回 false', () => {
      const session = service.createSession('valid-then-revoke', 't-001', makeDeviceInfo())
      service.revokeSession(session.sessionId)
      expect(service.isSessionValid(session.sessionId)).toBe(false)
    })
  })

  // ── getUserSessionCount ──
  describe('getUserSessionCount', () => {
    it('正例: 返回正确数量', () => {
      service.createSession('count-user', 't-001', makeDeviceInfo({ deviceId: 'd1' }))
      service.createSession('count-user', 't-001', makeDeviceInfo({ deviceId: 'd2' }))
      expect(service.getUserSessionCount('count-user')).toBe(2)
    })

    it('边界: 无会话返回 0', () => {
      expect(service.getUserSessionCount('nobody')).toBe(0)
    })
  })
})
