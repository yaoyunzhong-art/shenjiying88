// session.service.test.ts · 会话管理服务测试
// Phase-FP P10 · 2026-07-08

import { describe, it, expect, beforeEach } from 'vitest'
import { SessionService } from './session.service'
import { DeviceInfo } from './session.entity'

describe('SessionService', () => {
  let service: SessionService
  const mockDevice: DeviceInfo = {
    deviceId: 'macbook-pro-001',
    deviceType: 'web',
    browser: 'Chrome',
    os: 'macOS',
    userAgent: 'Mozilla/5.0',
  }

  beforeEach(() => {
    service = new SessionService()
  })

  // ─── 创建会话 ───

  it('创建会话应返回有效会话', () => {
    const session = service.createSession('user-001', 'tenant-001', mockDevice)

    expect(session).toBeDefined()
    expect(session.sessionId).toBeTruthy()
    expect(session.userId).toBe('user-001')
    expect(session.tenantId).toBe('tenant-001')
    expect(session.status).toBe('active')
    expect(session.createdAt).toBeLessThanOrEqual(Date.now())
    expect(session.expiresAt).toBeGreaterThan(session.createdAt)
  })

  it('创建会话应记录设备信息', () => {
    const session = service.createSession('user-002', 'tenant-001', mockDevice)

    expect(session.deviceInfo.deviceId).toBe('macbook-pro-001')
    expect(session.deviceInfo.deviceType).toBe('web')
    expect(session.deviceInfo.browser).toBe('Chrome')
    expect(session.deviceInfo.os).toBe('macOS')
  })

  // ─── 验证会话 ───

  it('验证有效会话应返回 true', () => {
    const session = service.createSession('user-003', 'tenant-001', mockDevice)

    expect(service.isSessionValid(session.sessionId)).toBe(true)
  })

  it('验证不存在会话应返回 false', () => {
    expect(service.isSessionValid('non-existent-session')).toBe(false)
  })

  it('验证作废会话应返回 false', () => {
    const session = service.createSession('user-004', 'tenant-001', mockDevice)
    service.revokeSession(session.sessionId)

    expect(service.isSessionValid(session.sessionId)).toBe(false)
  })

  // ─── 作废会话 ───

  it('作废会话应成功', () => {
    const session = service.createSession('user-005', 'tenant-001', mockDevice)

    const result = service.revokeSession(session.sessionId)
    expect(result).toBe(true)
    expect(service.isSessionValid(session.sessionId)).toBe(false)
  })

  it('作废不存在会话应返回 false', () => {
    expect(service.revokeSession('non-existent')).toBe(false)
  })

  // ─── 用户会话列表 ───

  it('获取总用户会话数应正确', () => {
    service.createSession('user-006', 'tenant-001', mockDevice)
    service.createSession('user-006', 'tenant-001', {
      ...mockDevice,
      deviceId: 'macbook-pro-002',
    })

    const sessions = service.getUserSessions('user-006')
    expect(sessions.length).toBe(2)
  })

  it('无会话用户列表应为空数组', () => {
    expect(service.getUserSessions('nobody')).toEqual([])
  })

  // ─── 并发限制 ───

  it('超过最大并发应踢掉最旧会话', () => {
    const sessions: string[] = []
    for (let i = 0; i < 5; i++) {
      const s = service.createSession('user-007', 'tenant-001', {
        ...mockDevice,
        deviceId: `device-${i}`,
      })
      sessions.push(s.sessionId)
    }

    // 第 6 个会话应踢掉第 1 个
    const sixth = service.createSession('user-007', 'tenant-001', {
      ...mockDevice,
      deviceId: 'device-5',
    })
    expect(sixth).toBeDefined()
    expect(service.isSessionValid(sessions[0])).toBe(false)
    expect(service.isSessionValid(sessions[1])).toBe(true)
  })

  // ─── 续期 ───

  it('touchSession 应延长过期时间', () => {
    const session = service.createSession('user-008', 'tenant-001', mockDevice)
    const originalExpiresAt = session.expiresAt

    // 模拟时间流逝后 touch
    service.touchSession(session.sessionId)

    const refreshed = service.getSession(session.sessionId)
    expect(refreshed).not.toBeNull()
    expect(refreshed!.lastActiveAt).toBeGreaterThanOrEqual(session.createdAt)
    expect(refreshed!.expiresAt).toBeGreaterThanOrEqual(originalExpiresAt)
  })

  it('touchSession 对不存在会话应返回 false', () => {
    expect(service.touchSession('non-existent')).toBe(false)
  })

  // ─── 批量作废 ───

  it('revokeAllUserSessions 应清空用户所有会话', () => {
    for (let i = 0; i < 3; i++) {
      service.createSession('user-009', 'tenant-001', {
        ...mockDevice,
        deviceId: `device-${i}`,
      })
    }

    const count = service.revokeAllUserSessions('user-009')
    expect(count).toBe(3)
    expect(service.getUserSessionCount('user-009')).toBe(0)
  })

  it('revokeAllUserSessions 对不存在用户应返回 0', () => {
    expect(service.revokeAllUserSessions('nobody')).toBe(0)
  })
})
