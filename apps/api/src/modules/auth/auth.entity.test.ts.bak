// auth.entity.test.ts · 统一认证实体测试
// Phase-FP P0 · 2026-07-05

import { describe, it, expect } from 'vitest'
import { AuthUser, AuthSession, AuthTokenBlacklist } from './auth.entity'

describe('AuthUser Entity', () => {
  it('should create an AuthUser with all required fields', () => {
    const user = new AuthUser()
    user.userId = 'user_001'
    user.tenantId = 'tenant-demo'
    user.nickname = 'TestUser'
    user.roles = ['MEMBER']
    user.permissions = ['member:read']
    user.isActive = true
    user.failedAttempts = 0

    expect(user.userId).toBe('user_001')
    expect(user.tenantId).toBe('tenant-demo')
    expect(user.nickname).toBe('TestUser')
    expect(user.roles).toEqual(['MEMBER'])
    expect(user.permissions).toEqual(['member:read'])
    expect(user.isActive).toBe(true)
    expect(user.failedAttempts).toBe(0)
  })

  it('should support optional fields like mobile, email, avatar', () => {
    const user = new AuthUser()
    user.userId = 'user_002'
    user.tenantId = 'tenant-demo'
    user.nickname = 'FullUser'
    user.mobile = '13800138002'
    user.email = 'user@example.com'
    user.avatar = 'https://example.com/avatar.png'
    user.roles = ['MEMBER']
    user.permissions = ['member:read']

    expect(user.mobile).toBe('13800138002')
    expect(user.email).toBe('user@example.com')
    expect(user.avatar).toBe('https://example.com/avatar.png')
  })

  it('should handle account lock state', () => {
    const user = new AuthUser()
    user.userId = 'user_003'
    user.tenantId = 'tenant-demo'
    user.nickname = 'LockedUser'
    user.roles = ['MEMBER']
    user.permissions = ['member:read']
    user.isActive = false
    user.failedAttempts = 5
    user.lockedUntil = new Date(Date.now() + 3600000)

    expect(user.isActive).toBe(false)
    expect(user.failedAttempts).toBe(5)
    expect(user.lockedUntil).toBeDefined()
    expect(user.lockedUntil!.getTime()).toBeGreaterThan(Date.now())
  })

  it('should track last login timestamp', () => {
    const now = new Date()
    const user = new AuthUser()
    user.userId = 'user_004'
    user.tenantId = 'tenant-demo'
    user.nickname = 'ActiveUser'
    user.roles = ['PLATFORM_ADMIN']
    user.permissions = ['*']
    user.lastLoginAt = now

    expect(user.lastLoginAt).toEqual(now)
  })
})

describe('AuthSession Entity', () => {
  it('should create an AuthSession with required fields', () => {
    const session = new AuthSession()
    session.sessionId = 'sess_001'
    session.userId = 'user_001'
    session.tenantId = 'tenant-demo'
    session.status = 'active'
    session.createdAt = Date.now()
    session.lastActiveAt = Date.now()
    session.expiresAt = Date.now() + 7200000

    expect(session.sessionId).toBe('sess_001')
    expect(session.userId).toBe('user_001')
    expect(session.status).toBe('active')
    expect(session.expiresAt).toBeGreaterThan(session.createdAt)
  })

  it('should support device info fields', () => {
    const session = new AuthSession()
    session.sessionId = 'sess_002'
    session.userId = 'user_001'
    session.tenantId = 'tenant-demo'
    session.deviceType = 'mobile'
    session.browser = 'Chrome'
    session.os = 'iOS'
    session.ip = '192.168.1.1'
    session.loginType = 'mobile_sms'
    session.status = 'active'
    session.createdAt = Date.now()
    session.lastActiveAt = Date.now()
    session.expiresAt = Date.now() + 7200000

    expect(session.deviceType).toBe('mobile')
    expect(session.browser).toBe('Chrome')
    expect(session.os).toBe('iOS')
    expect(session.loginType).toBe('mobile_sms')
  })

  it('should support expired and revoked states', () => {
    const expired = new AuthSession()
    expired.sessionId = 'sess_expired'
    expired.userId = 'user_001'
    expired.tenantId = 'tenant-demo'
    expired.status = 'expired'
    expired.createdAt = Date.now() - 86400000
    expired.lastActiveAt = Date.now() - 86400000
    expired.expiresAt = Date.now() - 3600000

    expect(expired.status).toBe('expired')
    expect(expired.expiresAt).toBeLessThan(Date.now())

    const revoked = new AuthSession()
    revoked.sessionId = 'sess_revoked'
    revoked.userId = 'user_001'
    revoked.tenantId = 'tenant-demo'
    revoked.status = 'revoked'
    revoked.createdAt = Date.now()
    revoked.lastActiveAt = Date.now()
    revoked.expiresAt = Date.now() + 7200000

    expect(revoked.status).toBe('revoked')
  })
})

describe('AuthTokenBlacklist Entity', () => {
  it('should create a blacklist entry', () => {
    const entry = new AuthTokenBlacklist()
    entry.jti = 'token_jti_001'
    entry.userId = 'user_001'
    entry.tokenType = 'refresh'
    entry.revokedAt = Date.now()
    entry.expiresAt = Date.now() + 2592000000 // 30 days

    expect(entry.jti).toBe('token_jti_001')
    expect(entry.userId).toBe('user_001')
    expect(entry.tokenType).toBe('refresh')
    expect(entry.expiresAt).toBeGreaterThan(entry.revokedAt)
  })

  it('should support both access and refresh token types', () => {
    const access = new AuthTokenBlacklist()
    access.jti = 'access_jti'
    access.userId = 'user_001'
    access.tokenType = 'access'
    access.revokedAt = Date.now()
    access.expiresAt = Date.now() + 3600000

    expect(access.tokenType).toBe('access')

    const refresh = new AuthTokenBlacklist()
    refresh.jti = 'refresh_jti'
    refresh.userId = 'user_001'
    refresh.tokenType = 'refresh'
    refresh.revokedAt = Date.now()
    refresh.expiresAt = Date.now() + 2592000000

    expect(refresh.tokenType).toBe('refresh')
  })

  it('should have unique jti', () => {
    const entry1 = new AuthTokenBlacklist()
    entry1.jti = 'unique_jti'
    entry1.userId = 'user_001'
    entry1.tokenType = 'refresh'
    entry1.revokedAt = Date.now()
    entry1.expiresAt = Date.now() + 2592000000

    const entry2 = new AuthTokenBlacklist()
    entry2.jti = 'different_jti'
    entry2.userId = 'user_002'
    entry2.tokenType = 'access'
    entry2.revokedAt = Date.now()
    entry2.expiresAt = Date.now() + 3600000

    expect(entry1.jti).not.toBe(entry2.jti)
  })
})
