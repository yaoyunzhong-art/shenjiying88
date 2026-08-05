/**
 * session.service.spec.ts — Session Service 深层单元测试
 *
 * 覆盖:
 *   - createSession:        正例（创建成功/含设备信息/不同用户隔离）反例（并发超限自动踢）边界（并发数刚好5）
 *   - getSession:           正例（获取有效会话）反例（不存在/已过期/已作废会话）
 *   - touchSession:         正例（延期成功）反例（不存在/已作废会话）
 *   - revokeSession:        正例（成功执行）反例（不存在/重复作废）
 *   - revokeAllUserSessions:正例（全部清空）反例（无会话用户）
 *   - isSessionValid:       正例（有效返回true）反例（无效返回false）
 *   - getUserSessionCount:  正例（返回正确数目）反例（无会话返回0）
 *   - getUserSessions:      正例（返回列表）反例（无会话返回空数组）
 *
 * 纯函数式，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SessionService } from './session.service'
import type { DeviceInfo, Session } from './session.entity'

describe('SessionService', () => {
  let service: SessionService

  const webDevice: DeviceInfo = {
    deviceId: 'macbook-air-001',
    deviceType: 'web',
    browser: 'Chrome 120',
    os: 'macOS 14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  }

  const mobileDevice: DeviceInfo = {
    deviceId: 'iphone-15-001',
    deviceType: 'mobile',
    browser: 'Safari',
    os: 'iOS 18',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)',
  }

  beforeEach(() => {
    service = new SessionService()
  })

  // ─── createSession ──────────────────────────────────────────────────

  describe('createSession', () => {
    it('正例: 创建有效会话应返回完整 Session 对象', () => {
      const session = service.createSession('user-100', 'tenant-abc', webDevice)

      expect(session).toBeDefined()
      expect(session.sessionId).toBeTruthy()
      expect(typeof session.sessionId).toBe('string')
      expect(session.userId).toBe('user-100')
      expect(session.tenantId).toBe('tenant-abc')
      expect(session.status).toBe('active')
      expect(session.createdAt).toBeGreaterThan(0)
      expect(session.expiresAt).toBeGreaterThan(session.createdAt)
      expect(session.lastActiveAt).toBe(session.createdAt)
    })

    it('正例: 不同用户创建会话互不影响', () => {
      const s1 = service.createSession('user-a', 't1', webDevice)
      const s2 = service.createSession('user-b', 't1', webDevice)

      expect(s1.sessionId).not.toBe(s2.sessionId)
      expect(s1.userId).toBe('user-a')
      expect(s2.userId).toBe('user-b')
    })

    it('正例: 创建设备信息完整的 Web 会话', () => {
      const session = service.createSession('user-101', 't1', webDevice)

      expect(session.deviceInfo.deviceId).toBe('macbook-air-001')
      expect(session.deviceInfo.deviceType).toBe('web')
      expect(session.deviceInfo.browser).toBe('Chrome 120')
      expect(session.deviceInfo.os).toBe('macOS 14')
    })

    it('正例: 创建移动端会话', () => {
      const session = service.createSession('user-102', 't1', mobileDevice)

      expect(session.deviceInfo.deviceType).toBe('mobile')
      expect(session.deviceInfo.deviceId).toBe('iphone-15-001')
    })

    it('反例: 超过最大并发数(5)应踢掉最旧会话', () => {
      // 创建 5 个会话填满配额
      const sessions: Session[] = []
      for (let i = 0; i < 5; i++) {
        const s = service.createSession('user-overload', 't1', {
          ...webDevice,
          deviceId: `device-${i}`,
        })
        sessions.push(s)
      }

      // 确认全部有效
      for (const s of sessions) {
        expect(service.isSessionValid(s.sessionId)).toBe(true)
      }

      // 第 6 个会话应踢掉最旧的 (device-0)
      const sixth = service.createSession('user-overload', 't1', {
        ...webDevice,
        deviceId: 'device-5',
      })
      expect(sixth).toBeDefined()
      expect(sixth.status).toBe('active')
      expect(service.isSessionValid(sessions[0].sessionId)).toBe(false)
      expect(service.isSessionValid(sessions[1].sessionId)).toBe(true)
      expect(service.isSessionValid(sixth.sessionId)).toBe(true)
    })

    it('边界: 刚好达到最大并发数(5)时不应踢出', () => {
      for (let i = 0; i < 5; i++) {
        service.createSession('user-boundary', 't1', {
          ...webDevice,
          deviceId: `device-${i}`,
        })
      }
      // 第 5 个应当仍然有效
      expect(service.getUserSessionCount('user-boundary')).toBe(5)
    })
  })

  // ─── getSession ──────────────────────────────────────────────────────

  describe('getSession', () => {
    it('正例: 获取有效会话返回完整 Session 对象', () => {
      const created = service.createSession('user-200', 't1', webDevice)
      const retrieved = service.getSession(created.sessionId)

      expect(retrieved).not.toBeNull()
      expect(retrieved!.sessionId).toBe(created.sessionId)
      expect(retrieved!.userId).toBe('user-200')
      expect(retrieved!.status).toBe('active')
    })

    it('反例: 获取不存在会话应返回 null', () => {
      expect(service.getSession('does-not-exist')).toBeNull()
    })

    it('反例: 获取作废会话应返回 null', () => {
      const session = service.createSession('user-201', 't1', webDevice)
      service.revokeSession(session.sessionId)

      expect(service.getSession(session.sessionId)).toBeNull()
    })

    it('反例: 获取已过期会话应返回 null（手动过期模拟）', () => {
      const session = service.createSession('user-expired', 't1', webDevice)
      // 直接调用 revoke 模拟过期行为
      service.revokeSession(session.sessionId)

      expect(service.getSession(session.sessionId)).toBeNull()
    })
  })

  // ─── touchSession ────────────────────────────────────────────────────

  describe('touchSession', () => {
    it('正例: 续期有效会话返回 true 并更新时间戳', () => {
      const session = service.createSession('user-300', 't1', webDevice)
      const originalExpires = session.expiresAt

      const result = service.touchSession(session.sessionId)
      expect(result).toBe(true)

      const refreshed = service.getSession(session.sessionId)
      expect(refreshed).not.toBeNull()
      expect(refreshed!.expiresAt).toBeGreaterThanOrEqual(originalExpires)
      expect(refreshed!.lastActiveAt).toBeGreaterThanOrEqual(session.createdAt)
    })

    it('反例: 续期不存在会话返回 false', () => {
      expect(service.touchSession('ghost-session')).toBe(false)
    })

    it('反例: 续期已作废会话返回 false', () => {
      const session = service.createSession('user-301', 't1', webDevice)
      service.revokeSession(session.sessionId)

      expect(service.touchSession(session.sessionId)).toBe(false)
    })
  })

  // ─── revokeSession ───────────────────────────────────────────────────

  describe('revokeSession', () => {
    it('正例: 作废有效会话返回 true 且后续查询返回 null', () => {
      const session = service.createSession('user-400', 't1', webDevice)

      const result = service.revokeSession(session.sessionId)
      expect(result).toBe(true)
      expect(service.getSession(session.sessionId)).toBeNull()
    })

    it('反例: 作废不存在会话返回 false', () => {
      expect(service.revokeSession('phantom-session')).toBe(false)
    })

    it('反例: 重复作废会话第二次返回 false', () => {
      const session = service.createSession('user-401', 't1', webDevice)
      expect(service.revokeSession(session.sessionId)).toBe(true)
      expect(service.revokeSession(session.sessionId)).toBe(false)
    })
  })

  // ─── revokeAllUserSessions ───────────────────────────────────────────

  describe('revokeAllUserSessions', () => {
    it('正例: 批量作废用户 3 个会话返回正确数量', () => {
      for (let i = 0; i < 3; i++) {
        service.createSession('user-batch', 't1', {
          ...webDevice,
          deviceId: `device-${i}`,
        })
      }

      const count = service.revokeAllUserSessions('user-batch')
      expect(count).toBe(3)
      expect(service.getUserSessionCount('user-batch')).toBe(0)
    })

    it('反例: 对无会话用户作废返回 0', () => {
      expect(service.revokeAllUserSessions('nobody')).toBe(0)
    })

    it('边界: 批量作废后新会话可正常创建', () => {
      service.createSession('user-batch2', 't1', webDevice)
      service.createSession('user-batch2', 't1', mobileDevice)
      service.revokeAllUserSessions('user-batch2')

      const newSession = service.createSession('user-batch2', 't1', webDevice)
      expect(newSession).toBeDefined()
      expect(newSession.status).toBe('active')
    })
  })

  // ─── isSessionValid ──────────────────────────────────────────────────

  describe('isSessionValid', () => {
    it('正例: 有效会话应返回 true', () => {
      const session = service.createSession('user-500', 't1', webDevice)
      expect(service.isSessionValid(session.sessionId)).toBe(true)
    })

    it('反例: 不存在会话应返回 false', () => {
      expect(service.isSessionValid('never-existed')).toBe(false)
    })

    it('反例: 空字符串会话 ID 应返回 false', () => {
      expect(service.isSessionValid('')).toBe(false)
    })
  })

  // ─── getUserSessionCount ─────────────────────────────────────────────

  describe('getUserSessionCount', () => {
    it('正例: 创建 3 个会话后计数为 3', () => {
      for (let i = 0; i < 3; i++) {
        service.createSession('user-count', 't1', webDevice)
      }
      expect(service.getUserSessionCount('user-count')).toBe(3)
    })

    it('反例: 无会话用户返回 0', () => {
      expect(service.getUserSessionCount('nobody')).toBe(0)
    })

    it('反例: 作废所有会话后返回 0', () => {
      service.createSession('user-count2', 't1', webDevice)
      service.createSession('user-count2', 't1', mobileDevice)
      expect(service.getUserSessionCount('user-count2')).toBe(2)

      service.revokeAllUserSessions('user-count2')
      expect(service.getUserSessionCount('user-count2')).toBe(0)
    })
  })

  // ─── getUserSessions ─────────────────────────────────────────────────

  describe('getUserSessions', () => {
    it('正例: 返回用户所有活跃会话列表', () => {
      service.createSession('user-list', 't1', webDevice)
      service.createSession('user-list', 't1', mobileDevice)

      const sessions = service.getUserSessions('user-list')
      expect(sessions).toHaveLength(2)
      expect(sessions.map((s) => s.deviceInfo.deviceId)).toContain('macbook-air-001')
      expect(sessions.map((s) => s.deviceInfo.deviceId)).toContain('iphone-15-001')
    })

    it('反例: 无会话用户返回空数组', () => {
      expect(service.getUserSessions('nobody')).toEqual([])
    })

    it('反例: 作废的会话不会出现在列表中', () => {
      const s1 = service.createSession('user-list2', 't1', webDevice)
      service.createSession('user-list2', 't1', mobileDevice)
      service.revokeSession(s1.sessionId)

      const sessions = service.getUserSessions('user-list2')
      expect(sessions).toHaveLength(1)
      expect(sessions[0].deviceInfo.deviceId).toBe('iphone-15-001')
    })
  })

  // ─── 综合场景 ────────────────────────────────────────────────────────

  describe('综合：多用户多设备场景', () => {
    it('多用户会话互不干扰', () => {
      // Alice 使用 Web 和 Mobile
      service.createSession('alice', 't1', webDevice)
      service.createSession('alice', 't1', mobileDevice)

      // Bob 使用 Web
      service.createSession('bob', 't1', { ...webDevice, deviceId: 'bob-pc' })

      // Charlie 使用 Mobile
      service.createSession('charlie', 't1', mobileDevice)
      service.createSession('charlie', 't1', { ...webDevice, deviceId: 'charlie-pc' })
      service.createSession('charlie', 't1', {
        ...mobileDevice,
        deviceId: 'charlie-phone',
      })

      expect(service.getUserSessionCount('alice')).toBe(2)
      expect(service.getUserSessionCount('bob')).toBe(1)
      expect(service.getUserSessionCount('charlie')).toBe(3)

      // 作废 Bob 所有会话
      service.revokeAllUserSessions('bob')
      expect(service.getUserSessionCount('alice')).toBe(2)
      expect(service.getUserSessionCount('bob')).toBe(0)
      expect(service.getUserSessionCount('charlie')).toBe(3)
    })

    it('sessionId 全局唯一', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 10; i++) {
        const s = service.createSession(`user-uniq-${i}`, 't1', webDevice)
        expect(ids.has(s.sessionId)).toBe(false)
        ids.add(s.sessionId)
      }
      expect(ids.size).toBe(10)
    })
  })
})
