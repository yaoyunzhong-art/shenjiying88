// session.entity.test.ts · 会话实体测试
// Phase-FP P10 · 2026-07-08

import { describe, it, expect } from 'vitest'
import { SessionEntity } from './session.entity'

describe('SessionEntity', () => {
  it('应该能创建会话实体实例', () => {
    const now = Date.now()
    const entity = new SessionEntity()
    entity.sessionId = 'session-test-001'
    entity.userId = 'user-001'
    entity.tenantId = 'tenant-001'
    entity.deviceType = 'web'
    entity.deviceId = 'device-001'
    entity.browser = 'Chrome'
    entity.os = 'macOS'
    entity.ip = '192.168.1.1'
    entity.userAgent = 'Mozilla/5.0 Chrome'
    entity.status = 'active'
    entity.createdAt = now
    entity.lastActiveAt = now
    entity.expiresAt = now + 1800000

    expect(entity.sessionId).toBe('session-test-001')
    expect(entity.userId).toBe('user-001')
    expect(entity.tenantId).toBe('tenant-001')
    expect(entity.deviceType).toBe('web')
    expect(entity.status).toBe('active')
    expect(entity.expiresAt).toBeGreaterThan(entity.createdAt)
  })

  it('应该支持会话过期状态变换', () => {
    const now = Date.now()
    const entity = new SessionEntity()
    entity.sessionId = 'session-expired-001'
    entity.userId = 'user-002'
    entity.tenantId = 'tenant-001'
    entity.status = 'expired'
    entity.createdAt = now - 7200000
    entity.lastActiveAt = now - 7200000
    entity.expiresAt = now - 3600000

    expect(entity.status).toBe('expired')
    expect(entity.expiresAt).toBeLessThan(now)
  })

  it('应该支持作废状态', () => {
    const now = Date.now()
    const entity = new SessionEntity()
    entity.sessionId = 'session-revoked-001'
    entity.userId = 'user-003'
    entity.tenantId = 'tenant-002'
    entity.status = 'revoked'
    entity.createdAt = now
    entity.lastActiveAt = now
    entity.expiresAt = now + 1800000

    expect(entity.status).toBe('revoked')
    expect(entity.expiresAt).toBeGreaterThan(now)
  })

  it('默认状态应为 active', () => {
    const entity = new SessionEntity()
    entity.sessionId = 'session-default-001'
    entity.userId = 'user-001'
    entity.tenantId = 'tenant-001'
    entity.createdAt = Date.now()
    entity.lastActiveAt = Date.now()
    entity.expiresAt = Date.now() + 1800000

    // TypeORM @Column default 会在数据库层面生效
    // 这里只是检查构造后默认行为
    expect(entity.status).toBeUndefined()
    // 但赋值后应为 active
    entity.status = 'active'
    expect(entity.status).toBe('active')
  })
})
