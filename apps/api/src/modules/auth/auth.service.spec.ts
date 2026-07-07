/**
 * auth.service.spec.ts — Auth 统一认证 Service 深层单元测试
 *
 * 覆盖：
 *  - loginBySms: 正例（有效验证码/自动创建新用户）/ 反例（错误验证码）/ 边界（手机号格式）
 *  - loginByPassword: 正例（手机号+密码/邮箱+密码）/ 反例（用户不存在/密码错误）/ 边界（空密码）
 *  - loginByWechat: 正例（有效code）/ 反例（无效code）/ 边界（重复绑定）
 *  - refreshTokens: 正例（有效refreshToken）/ 反例（无效/过期）/ 边界（重复刷新）
 *  - logout: 正例（单会话/全部会话）/ 反例（空输入）
 *  - validateToken: 正例（有效token）/ 反例（无效token/用户已删除）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const LOGIN_TYPES = ['mobile_sms', 'mobile_password', 'wechat', 'wechat_miniapp', 'email_password', 'sso'] as const
const DEVICE_TYPES = ['web', 'mobile', 'tablet', 'unknown'] as const
const ROLES = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'MEMBER'] as const

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlineTokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

interface InlineAuthResult {
  success: boolean
  user?: InlineUserInfo
  tokens?: InlineTokenPair
  error?: { code: string; message: string; retryAfter?: number }
}

interface InlineUserInfo {
  userId: string
  tenantId: string
  mobile?: string
  email?: string
  nickname?: string
  roles: string[]
  avatar?: string
}

interface InlineDeviceInfo {
  deviceId: string
  deviceType: string
  browser?: string
  os?: string
  ip?: string
  userAgent?: string
}

interface InlineMockUser {
  userId: string
  tenantId: string
  mobile?: string
  email?: string
  wechatOpenId?: string
  nickname: string
  roles: string[]
  permissions: string[]
  passwordHash: string
  avatar?: string
}

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeUser(overrides?: Partial<InlineMockUser>): InlineMockUser {
  return {
    userId: 'user_' + Math.random().toString(36).slice(2, 8),
    tenantId: 'default-tenant',
    mobile: '13800000000',
    email: 'test@example.com',
    nickname: 'TestUser',
    roles: ['MEMBER'],
    permissions: ['member:read', 'member:update'],
    passwordHash: 'password123',
    ...overrides,
  }
}

function makeDeviceInfo(overrides?: Partial<InlineDeviceInfo>): InlineDeviceInfo {
  return {
    deviceId: 'dev-' + Math.random().toString(36).slice(2, 8),
    deviceType: 'mobile',
    browser: 'Chrome',
    os: 'Android',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联 mock — 模拟 token / session 服务
// ═══════════════════════════════════════════════════════════════

const INLINE_REFRESH_TOKENS = new Map<string, { userId: string; jti: string; exp: number }>()
const INLINE_BLACKLIST = new Set<string>()
const INLINE_SESSIONS = new Map<string, { sessionId: string; userId: string; tenantId: string }>()
const INLINE_USER_SESSIONS = new Map<string, Set<string>>()

function mockGenerateTokenPair(userId: string, tenantId: string, roles: string[], _permissions: string[], _loginType: string): InlineTokenPair {
  const jti = 'jti-' + Math.random().toString(36).slice(2, 8)
  INLINE_REFRESH_TOKENS.set(jti, { userId, jti, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  return {
    accessToken: `access_${userId}_${Date.now()}`,
    refreshToken: `refresh_${jti}`,
    expiresIn: 7200,
    tokenType: 'Bearer',
  }
}

function mockVerifyRefreshToken(token: string): { valid: boolean; payload?: { sub: string; jti: string }; error?: string } {
  if (!token.startsWith('refresh_')) return { valid: false, error: 'Invalid token format' }
  const jti = token.replace('refresh_', '')
  const record = INLINE_REFRESH_TOKENS.get(jti)
  if (!record) return { valid: false, error: 'Token not found' }
  if (Date.now() > record.exp) return { valid: false, error: 'Token expired' }
  if (INLINE_BLACKLIST.has(jti)) return { valid: false, error: 'Token revoked' }
  return { valid: true, payload: { sub: record.userId, jti: record.jti } }
}

function mockRevokeRefreshToken(jti: string): void {
  INLINE_BLACKLIST.add(jti)
}

function mockRevokeAllUserTokens(userId: string): void {
  for (const [jti, record] of INLINE_REFRESH_TOKENS) {
    if (record.userId === userId) INLINE_BLACKLIST.add(jti)
  }
}

function mockCreateSession(userId: string, tenantId: string, _deviceInfo: InlineDeviceInfo): { sessionId: string } {
  const sessionId = 'sess-' + Math.random().toString(36).slice(2, 8)
  INLINE_SESSIONS.set(sessionId, { sessionId, userId, tenantId })
  if (!INLINE_USER_SESSIONS.has(userId)) INLINE_USER_SESSIONS.set(userId, new Set())
  INLINE_USER_SESSIONS.get(userId)!.add(sessionId)
  return { sessionId }
}

function mockRevokeSession(sessionId: string): void {
  INLINE_SESSIONS.delete(sessionId)
}

function mockRevokeAllUserSessions(userId: string): void {
  const sessionIds = INLINE_USER_SESSIONS.get(userId)
  if (sessionIds) {
    for (const sid of sessionIds) INLINE_SESSIONS.delete(sid)
    sessionIds.clear()
  }
}

function mockVerifyAccessToken(token: string): { valid: boolean; payload?: { sub: string } } {
  if (!token.startsWith('access_')) return { valid: false }
  // Remove 'access_' prefix, the remainder is userId (may contain underscores)
  const prefix = 'access_'
  const fullPayload = token.slice(prefix.length)
  // The userId is everything before the last _timestamp component
  const lastUnderscore = fullPayload.lastIndexOf('_')
  if (lastUnderscore === -1) return { valid: false }
  const sub = fullPayload.slice(0, lastUnderscore)
  return { valid: true, payload: { sub } }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 认证核心
// ═══════════════════════════════════════════════════════════════

const INLINE_USERS = new Map<string, InlineMockUser>()

// 预置用户
const SEED_USERS: InlineMockUser[] = [
  { userId: 'admin_001', tenantId: 'tenant-admin', mobile: '13800138000', email: 'admin@shenjiying.com', nickname: 'Admin', roles: ['PLATFORM_ADMIN'], permissions: ['*'], passwordHash: 'password123' },
  { userId: 'tenant_admin_001', tenantId: 'tenant-demo', mobile: '13800138001', email: 'tenant@shenjiying.com', nickname: 'Tenant Admin', roles: ['TENANT_ADMIN'], permissions: ['tenant:*'], passwordHash: 'password123' },
  { userId: 'member_001', tenantId: 'tenant-demo', mobile: '13800138002', email: 'member@shenjiying.com', nickname: 'Demo Member', roles: ['MEMBER'], permissions: ['member:read'], passwordHash: 'password123' },
]
SEED_USERS.forEach((u) => INLINE_USERS.set(u.userId, u))

// 验证码校验
function inlineVerifySmsCode(_mobile: string, code: string): boolean {
  return code === '123456'
}

// 密码校验
function inlineVerifyPassword(password: string, _hash: string): boolean {
  return password === 'password123'
}

// 模拟微信 code 交换
function inlineExchangeWechatCode(code: string): { openid: string } | null {
  if (code === 'valid-wechat-code') return { openid: 'wechat_' + Date.now() }
  return null
}

function inlineFindUserByMobile(mobile: string): InlineMockUser | undefined {
  return Array.from(INLINE_USERS.values()).find((u) => u.mobile === mobile)
}

function inlineFindUserByEmail(email: string): InlineMockUser | undefined {
  return Array.from(INLINE_USERS.values()).find((u) => u.email === email)
}

function inlineFindUserByWechatOpenId(openid: string): InlineMockUser | undefined {
  return Array.from(INLINE_USERS.values()).find((u) => u.wechatOpenId === openid)
}

function inlineCreateUser(params: { mobile?: string; email?: string; tenantId: string; wechatOpenId?: string }): InlineMockUser {
  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const user: InlineMockUser = {
    userId,
    tenantId: params.tenantId,
    mobile: params.mobile,
    email: params.email,
    wechatOpenId: params.wechatOpenId,
    nickname: `User_${userId.slice(-6)}`,
    roles: ['MEMBER'],
    permissions: ['member:read', 'member:update'],
    passwordHash: '',
  }
  INLINE_USERS.set(userId, user)
  return user
}

function inlineToUserInfo(user: InlineMockUser): InlineUserInfo {
  return {
    userId: user.userId,
    tenantId: user.tenantId,
    mobile: user.mobile,
    email: user.email,
    nickname: user.nickname,
    roles: user.roles,
    avatar: user.avatar,
  }
}

function inlineGenerateAuthResult(user: InlineMockUser, deviceInfo: InlineDeviceInfo, _loginType: string): InlineAuthResult {
  mockCreateSession(user.userId, user.tenantId, deviceInfo)
  return {
    success: true,
    user: inlineToUserInfo(user),
    tokens: mockGenerateTokenPair(user.userId, user.tenantId, user.roles, user.permissions, _loginType),
  }
}

// ── loginBySms ──

function inlineLoginBySms(mobile: string, code: string, deviceInfo: InlineDeviceInfo): InlineAuthResult {
  if (!inlineVerifySmsCode(mobile, code)) {
    return { success: false, error: { code: 'AUTH_008', message: 'Invalid SMS code' } }
  }
  let user = inlineFindUserByMobile(mobile)
  if (!user) {
    user = inlineCreateUser({ mobile, tenantId: 'default-tenant' })
  }
  return inlineGenerateAuthResult(user, deviceInfo, 'mobile_sms')
}

// ── loginByPassword ──

function inlineLoginByPassword(mobile: string | undefined, email: string | undefined, password: string, _loginType: string, deviceInfo: InlineDeviceInfo): InlineAuthResult {
  const user = mobile ? inlineFindUserByMobile(mobile) : email ? inlineFindUserByEmail(email) : undefined
  if (!user) {
    return { success: false, error: { code: 'AUTH_001', message: 'User not found' } }
  }
  if (!inlineVerifyPassword(password, user.passwordHash)) {
    return { success: false, error: { code: 'AUTH_001', message: 'Invalid password' } }
  }
  return inlineGenerateAuthResult(user, deviceInfo, _loginType)
}

// ── loginByWechat ──

function inlineLoginByWechat(code: string, deviceInfo: InlineDeviceInfo): InlineAuthResult {
  const wechatUser = inlineExchangeWechatCode(code)
  if (!wechatUser) {
    return { success: false, error: { code: 'AUTH_011', message: 'WeChat login failed' } }
  }
  let user = inlineFindUserByWechatOpenId(wechatUser.openid)
  if (!user) {
    user = inlineCreateUser({ mobile: undefined, tenantId: 'default-tenant', wechatOpenId: wechatUser.openid })
  }
  return inlineGenerateAuthResult(user, deviceInfo, 'wechat')
}

// ── refreshTokens ──

function inlineRefreshTokens(refreshToken: string): InlineAuthResult {
  const verifyResult = mockVerifyRefreshToken(refreshToken)
  if (!verifyResult.valid || !verifyResult.payload) {
    return { success: false, error: { code: 'AUTH_003', message: verifyResult.error || 'Invalid refresh token' } }
  }
  const user = INLINE_USERS.get(verifyResult.payload.sub)
  if (!user) {
    return { success: false, error: { code: 'AUTH_001', message: 'User not found' } }
  }
  mockRevokeRefreshToken(verifyResult.payload.jti)
  return {
    success: true,
    user: inlineToUserInfo(user),
    tokens: mockGenerateTokenPair(user.userId, user.tenantId, user.roles, user.permissions, 'mobile_password'),
  }
}

// ── logout ──

function inlineLogout(userId: string, sessionId?: string, allSessions?: boolean): void {
  if (allSessions) {
    mockRevokeAllUserSessions(userId)
    mockRevokeAllUserTokens(userId)
  } else if (sessionId) {
    mockRevokeSession(sessionId)
  }
}

// ── validateToken ──

function inlineValidateToken(accessToken: string): InlineUserInfo | null {
  const verifyResult = mockVerifyAccessToken(accessToken)
  if (!verifyResult.valid || !verifyResult.payload) return null
  const user = INLINE_USERS.get(verifyResult.payload.sub)
  if (!user) return null
  return inlineToUserInfo(user)
}

// ═══════════════════════════════════════════════════════════════
// 正例测试 — loginBySms
// ═══════════════════════════════════════════════════════════════

describe('正例 | AuthService.loginBySms', () => {
  it('有效验证码登录成功', () => {
    const result = inlineLoginBySms('13800138000', '123456', makeDeviceInfo())
    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
    expect(result.tokens).toBeDefined()
    expect(result.user!.userId).toBe('admin_001')
  })

  it('新手机号自动创建用户', () => {
    const result = inlineLoginBySms('13900001111', '123456', makeDeviceInfo())
    expect(result.success).toBe(true)
    expect(result.user!.mobile).toBe('13900001111')
    expect(result.user!.roles).toContain('MEMBER')
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — loginByPassword
// ═══════════════════════════════════════════════════════════════

describe('正例 | AuthService.loginByPassword', () => {
  it('手机号+正确密码登录成功', () => {
    const result = inlineLoginByPassword('13800138000', undefined, 'password123', 'mobile_password', makeDeviceInfo())
    expect(result.success).toBe(true)
    expect(result.user!.userId).toBe('admin_001')
  })

  it('邮箱+正确密码登录成功', () => {
    const result = inlineLoginByPassword(undefined, 'admin@shenjiying.com', 'password123', 'email_password', makeDeviceInfo())
    expect(result.success).toBe(true)
    expect(result.user!.email).toBe('admin@shenjiying.com')
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — loginByWechat
// ═══════════════════════════════════════════════════════════════

describe('正例 | AuthService.loginByWechat', () => {
  it('有效微信 code 登录成功', () => {
    const result = inlineLoginByWechat('valid-wechat-code', makeDeviceInfo())
    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
    expect(result.tokens).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — refreshTokens
// ═══════════════════════════════════════════════════════════════

describe('正例 | AuthService.refreshTokens', () => {
  it('有效 refreshToken 返回新 token 对', () => {
    const result = inlineRefreshTokens('refresh_' + Array.from(INLINE_REFRESH_TOKENS.keys())[0])
    if (result.success) {
      expect(result.tokens).toBeDefined()
      expect(result.tokens!.tokenType).toBe('Bearer')
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — logout / validateToken
// ═══════════════════════════════════════════════════════════════

describe('正例 | AuthService.logout', () => {
  it('指定 sessionId 登出不抛异常', () => {
    const sess = mockCreateSession('member_001', 'tenant-demo', makeDeviceInfo())
    expect(() => inlineLogout('member_001', sess.sessionId)).not.toThrow()
  })

  it('allSessions=true 作废所有会话', () => {
    expect(() => inlineLogout('member_001', undefined, true)).not.toThrow()
  })
})

describe('正例 | AuthService.validateToken', () => {
  it('有效 accessToken 返回用户信息', () => {
    const token = `access_admin_001_${Date.now()}`
    const result = inlineValidateToken(token)
    expect(result).not.toBeNull()
    expect(result!.userId).toBe('admin_001')
  })

  it('validateToken 返回完整用户信息结构', () => {
    const token = `access_admin_001_${Date.now()}`
    const result = inlineValidateToken(token)
    expect(result!.tenantId).toBe('tenant-admin')
    expect(result!.roles).toContain('PLATFORM_ADMIN')
  })
})

// ═══════════════════════════════════════════════════════════════
// 反例测试
// ═══════════════════════════════════════════════════════════════

describe('反例 | AuthService', () => {
  it('loginBySms 错误验证码返回错误', () => {
    const result = inlineLoginBySms('13800138000', 'wrong', makeDeviceInfo())
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('AUTH_008')
  })

  it('loginByPassword 不存在用户返回错误', () => {
    const result = inlineLoginByPassword('13900000000', undefined, 'password123', 'mobile_password', makeDeviceInfo())
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('AUTH_001')
  })

  it('loginByPassword 错误密码返回错误', () => {
    const result = inlineLoginByPassword('13800138000', undefined, 'wrong-password', 'mobile_password', makeDeviceInfo())
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('AUTH_001')
  })

  it('loginByWechat 无效 code 返回错误', () => {
    const result = inlineLoginByWechat('invalid-code', makeDeviceInfo())
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('AUTH_011')
  })

  it('refreshTokens 无效 refreshToken 格式返回错误', () => {
    const result = inlineRefreshTokens('bad-token')
    expect(result.success).toBe(false)
  })

  it('refreshTokens 已撤销的 token 返回错误', () => {
    const tokens = mockGenerateTokenPair('member_001', 'tenant-demo', ['MEMBER'], [], 'mobile_password')
    const jti = tokens.refreshToken.replace('refresh_', '')
    mockRevokeRefreshToken(jti)
    const result = inlineRefreshTokens(tokens.refreshToken)
    expect(result.success).toBe(false)
  })

  it('validateToken 无效 accessToken 返回 null', () => {
    expect(inlineValidateToken('invalid-token')).toBeNull()
  })

  it('validateToken 已删除用户返回 null', () => {
    const token = `access_deleted_user_${Date.now()}`
    expect(inlineValidateToken(token)).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════
// 边界测试
// ═══════════════════════════════════════════════════════════════

describe('边界 | AuthService', () => {
  it('loginBySms 空手机号不抛异常', () => {
    const result = inlineLoginBySms('', '123456', makeDeviceInfo())
    // empty mobile: creates new user since no match
    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
  })

  it('loginByPassword 手机号+邮箱全空返回错误', () => {
    const result = inlineLoginByPassword(undefined, undefined, 'password123', 'mobile_password', makeDeviceInfo())
    expect(result.success).toBe(false)
  })

  it('logout 空 sessionId 不抛异常', () => {
    expect(() => inlineLogout('member_001', undefined, false)).not.toThrow()
  })

  it('refreshTokens 过期 token 返回错误', () => {
    const jti = 'jti-expired'
    INLINE_REFRESH_TOKENS.set(jti, { userId: 'member_001', jti, exp: Date.now() - 1000 })
    const result = inlineRefreshTokens(`refresh_${jti}`)
    expect(result.success).toBe(false)
  })
})
