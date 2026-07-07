// session.controller.test.ts · 会话控制器测试
// Phase-FP P10 · 2026-07-08

import { describe, it, expect, beforeEach } from 'vitest'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'

describe('SessionController', () => {
  let controller: SessionController
  let service: SessionService

  beforeEach(() => {
    service = new SessionService()
    controller = new SessionController(service)
  })

  // ─── 正例：创建会话 ───

  it('POST /sessions 应创建新会话', () => {
    const result = controller.createSession({
      userId: 'user-001',
      tenantId: 'tenant-001',
      deviceInfo: {
        deviceId: 'macbook-001',
        deviceType: 'web',
        browser: 'Chrome',
        os: 'macOS',
      },
    })

    expect(result.sessionId).toBeTruthy()
    expect(result.userId).toBe('user-001')
    expect(result.tenantId).toBe('tenant-001')
    expect(result.status).toBe('active')
    expect(result.expiresAt).toBeGreaterThan(result.createdAt)
  })

  it('POST /sessions 创建会话时 deviceInfo 可选', () => {
    const result = controller.createSession({
      userId: 'user-002',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'unknown', deviceType: 'unknown' },
    })

    expect(result.sessionId).toBeTruthy()
    expect(result.status).toBe('active')
  })

  // ─── 反例：创建会话 ───

  it('POST /sessions 缺 userId 应抛错', () => {
    expect(() =>
      controller.createSession({
        userId: '',
        tenantId: 'tenant-001',
        deviceInfo: { deviceId: 'd1', deviceType: 'web' },
      }),
    ).toThrow('userId and tenantId are required')
  })

  it('POST /sessions 缺 tenantId 应抛错', () => {
    expect(() =>
      controller.createSession({
        userId: 'user-001',
        tenantId: '',
        deviceInfo: { deviceId: 'd1', deviceType: 'web' },
      }),
    ).toThrow('userId and tenantId are required')
  })

  // ─── 正例：验证会话 ───

  it('POST /sessions/validate 有效会话应返回 valid=true', () => {
    const session = controller.createSession({
      userId: 'user-003',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'd1', deviceType: 'web' },
    })

    const result = controller.validateSession({ sessionId: session.sessionId })
    expect(result.valid).toBe(true)
    expect(result.userId).toBe('user-003')
  })

  it('POST /sessions/validate 无效会话应返回 valid=false', () => {
    const result = controller.validateSession({ sessionId: 'nonexistent' })
    expect(result.valid).toBe(false)
    expect(result.userId).toBeUndefined()
  })

  // ─── 反例：验证会话 ───

  it('POST /sessions/validate 缺 sessionId 应抛错', () => {
    expect(() => controller.validateSession({ sessionId: '' })).toThrow('sessionId is required')
  })

  // ─── 正例：作废会话 ───

  it('POST /sessions/revoke 应成功作废', () => {
    const session = controller.createSession({
      userId: 'user-004',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'd1', deviceType: 'web' },
    })

    const result = controller.revokeSession({ sessionId: session.sessionId })
    expect(result.success).toBe(true)
    expect(result.revokedAt).toBeTruthy()
  })

  // ─── 反例：作废会话 ───

  it('POST /sessions/revoke 不存在会话应抛 NotFoundException', () => {
    expect(() => controller.revokeSession({ sessionId: 'nonexistent' })).toThrow(
      'Session nonexistent not found',
    )
  })

  it('POST /sessions/revoke 缺 sessionId 应抛错', () => {
    expect(() => controller.revokeSession({ sessionId: '' })).toThrow('sessionId is required')
  })

  // ─── 正例：批量作废 ───

  it('POST /sessions/revoke-all 应清空用户会话', () => {
    controller.createSession({
      userId: 'user-005',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'd1', deviceType: 'web' },
    })
    controller.createSession({
      userId: 'user-005',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'd2', deviceType: 'mobile' },
    })

    const result = controller.revokeAllUserSessions({ userId: 'user-005' })
    expect(result.success).toBe(true)
    expect(result.revokedCount).toBe(2)
  })

  // ─── 边界：获取用户会话 ───

  it('GET /sessions/user/:userId 无会话用户返回空列表', () => {
    const result = controller.getUserSessions('nobody')
    expect(result.count).toBe(0)
    expect(result.sessions).toEqual([])
  })

  it('GET /sessions/user/:userId 有会话用户返回正确数量', () => {
    controller.createSession({
      userId: 'user-006',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'd1', deviceType: 'web' },
    })

    const result = controller.getUserSessions('user-006')
    expect(result.count).toBe(1)
    expect(result.sessions[0].userId).toBe('user-006')
  })

  // ─── 边界：获取单条会话 ───

  it('GET /sessions/:sessionId 应返回会话详情', () => {
    const session = controller.createSession({
      userId: 'user-007',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'd1', deviceType: 'web' },
    })

    const result = controller.getSession(session.sessionId)
    expect(result.userId).toBe('user-007')
    expect(result.status).toBe('active')
  })

  it('GET /sessions/:sessionId 不存在会话应抛 NotFoundException', () => {
    expect(() => controller.getSession('nonexistent')).toThrow(
      'Session nonexistent not found or expired',
    )
  })

  // ─── 边界：删除会话 ───

  it('DELETE /sessions/:sessionId 应成功删除', () => {
    const session = controller.createSession({
      userId: 'user-008',
      tenantId: 'tenant-001',
      deviceInfo: { deviceId: 'd1', deviceType: 'web' },
    })

    const result = controller.deleteSession(session.sessionId)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Session deleted')
  })

  it('DELETE /sessions/:sessionId 不存在应抛 NotFoundException', () => {
    expect(() => controller.deleteSession('nonexistent')).toThrow(
      'Session nonexistent not found',
    )
  })
})
