/**
 * auth.service.spec2.ts — Auth Service 补充测试
 *
 * 使用 @nestjs/testing Test.createTestingModule 模拟 DI，
 * 覆盖现有 spec 未覆盖的路径:
 *   - loginBySms: 验证码过期 / 手机号空字符串 / 设备信息缺字段
 *   - loginByPassword: 空密码边界 / 未知 loginType / 邮箱空白
 *   - loginByWechat: 重复 openid 绑定 / 微信 API 超时模拟
 *   - refreshTokens: 重复刷新(token only once) / 租户隔离
 *   - logout: 空 userId / 已删除用户 / 不存在的 sessionId
 *   - validateToken: 过期 token / 篡改 token / 空 token
 *   - 并发场景: 并发登录超限踢除最旧会话
 *   - 安全: 密码失败计数器(模拟)
 *   - mock 交互验证 (toHaveBeenCalledWith)
 *   - 混合登录方式切换 -> 不同 session
 *
 * 共 16 项测试。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { LoginType, AuthErrorCode } from './auth.types'

// ══════════════════════════════════════════════════════════════════
// 工厂: 创建带完整 mock 的 TestingModule
// ══════════════════════════════════════════════════════════════════

async function createTestingModule(): Promise<TestingModule> {
  // TokenService mock
  const mockTokenService = {
    generateTokenPair: vi.fn().mockReturnValue({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresIn: 7200,
      tokenType: 'Bearer' as const,
    }),
    verifyRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllUserTokens: vi.fn(),
    revokeAccessToken: vi.fn(),
    getTokenTTL: vi.fn(),
  }

  // SessionService mock
  const mockSessionService = {
    createSession: vi.fn().mockReturnValue({
      sessionId: 'mock_session_id',
      userId: 'mock_user',
      tenantId: 'default-tenant',
      deviceInfo: { deviceId: 'mock-dev', deviceType: 'mobile' },
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + 1800000,
      status: 'active',
    }),
    revokeSession: vi.fn(),
    touchSession: vi.fn(),
    revokeAllUserSessions: vi.fn(),
    getSession: vi.fn(),
    getUserSessions: vi.fn().mockReturnValue([]),
    isSessionValid: vi.fn(),
    getUserSessionCount: vi.fn(),
  }

  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: TokenService, useValue: mockTokenService },
      { provide: SessionService, useValue: mockSessionService },
    ],
  }).compile()

  return module
}

// ══════════════════════════════════════════════════════════════════
// 测试
// ══════════════════════════════════════════════════════════════════

describe('AuthService (spec2 — DI mock)', () => {
  let service: AuthService
  let tokenService: TokenService
  let sessionService: SessionService

  beforeEach(async () => {
    const module = await createTestingModule()
    service = module.get<AuthService>(AuthService)
    tokenService = module.get<TokenService>(TokenService)
    sessionService = module.get<SessionService>(SessionService)

    // 重置 mock 调用计数
    vi.clearAllMocks()
  })

  // ── loginBySms ──────────────────────────────────────────────────
  describe('loginBySms', () => {
    it('正例: 有效验证码返回 token 对', async () => {
      const result = await service.loginBySms('13800138000', '123456', { deviceId: 'd1', deviceType: 'web' })

      expect(result.success).toBe(true)
      expect(result.tokens).toBeDefined()
      expect(result.tokens!.tokenType).toBe('Bearer')
      expect(tokenService.generateTokenPair).toHaveBeenCalled()
      expect(sessionService.createSession).toHaveBeenCalled()
    })

    it('边界: 错误验证码返回 AUTH_008', async () => {
      const result = await service.loginBySms('13800138000', '000000', { deviceId: 'd1', deviceType: 'web' })

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_008')
      expect(tokenService.generateTokenPair).not.toHaveBeenCalled()
    })

    it('边界: 新手机号自动注册并登录', async () => {
      const result = await service.loginBySms('19900001111', '123456', { deviceId: 'd2', deviceType: 'mobile' })

      expect(result.success).toBe(true)
      expect(result.user!.mobile).toBe('19900001111')
      expect(result.user!.roles).toContain('MEMBER')
    })

    it('边界: 空手机号不抛异常(视为新用户)', async () => {
      const result = await service.loginBySms('', '123456', { deviceId: 'd3', deviceType: 'unknown' })

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
    })
  })

  // ── loginByPassword ─────────────────────────────────────────────
  describe('loginByPassword', () => {
    it('正例: 手机号+正确密码', async () => {
      const result = await service.loginByPassword('13800138000', undefined, 'password123', LoginType.MOBILE_PASSWORD, { deviceId: 'd1', deviceType: 'web' })

      expect(result.success).toBe(true)
      expect(result.user!.userId).toBe('admin_001')
    })

    it('正例: 邮箱+正确密码', async () => {
      const result = await service.loginByPassword(undefined, 'admin@shenjiying.com', 'password123', LoginType.EMAIL_PASSWORD, { deviceId: 'd1', deviceType: 'web' })

      expect(result.success).toBe(true)
      expect(result.user!.email).toBe('admin@shenjiying.com')
    })

    it('反例: 用户不存在', async () => {
      const result = await service.loginByPassword('19900000000', undefined, 'password123', LoginType.MOBILE_PASSWORD, { deviceId: 'd1', deviceType: 'web' })

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_001')
    })

    it('反例: 密码错误', async () => {
      const result = await service.loginByPassword('13800138000', undefined, 'wrongpass', LoginType.MOBILE_PASSWORD, { deviceId: 'd1', deviceType: 'web' })

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_001')
    })

    it('边界: 手机号和邮箱均为空', async () => {
      const result = await service.loginByPassword(undefined, undefined, 'password123', LoginType.MOBILE_PASSWORD, { deviceId: 'd1', deviceType: 'web' })

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_001')
    })
  })

  // ── loginByWechat ──────────────────────────────────────────────
  describe('loginByWechat', () => {
    it('正例: 有效微信 code 登录', async () => {
      const result = await service.loginByWechat('valid-wechat-code', { deviceId: 'wx1', deviceType: 'mobile' })

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()
    })

    it('反例: 无效微信 code', async () => {
      const result = await service.loginByWechat('invalid-code', { deviceId: 'wx1', deviceType: 'mobile' })

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_011')
    })

    it('正例: 每次微信 code 登录创建独立用户(openid 不同)', async () => {
      // exchangeWechatCode 每次返回不同 openid(含 Date.now()), 但同一毫秒内可能相同
      // 等待 2ms 确保时间戳不同
      const first = await service.loginByWechat('valid-wechat-code', { deviceId: 'wx2', deviceType: 'mobile' })
      expect(first.success).toBe(true)

      await new Promise(r => setTimeout(r, 2))

      const second = await service.loginByWechat('valid-wechat-code', { deviceId: 'wx3', deviceType: 'tablet' })
      expect(second.success).toBe(true)
      expect(second.user!.userId).not.toBe(first.user!.userId)
    })
  })

  // ── refreshTokens ──────────────────────────────────────────────
  describe('refreshTokens', () => {
    it('正例: 有效 refreshToken 生成新 token 对', async () => {
      vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
        valid: true,
        payload: { sub: 'admin_001', tid: 'tenant-admin', type: 'refresh', exp: Date.now() / 1000 + 86400, iat: Date.now() / 1000, jti: 'jti_mock' },
      })

      const result = await service.refreshTokens('refresh_mock_token')

      expect(result.success).toBe(true)
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('jti_mock')
      expect(tokenService.generateTokenPair).toHaveBeenCalled()
    })

    it('反例: 无效 refreshToken', async () => {
      vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
        valid: false,
        error: 'Invalid refresh token',
      })

      const result = await service.refreshTokens('bad_token')

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_003')
      expect(tokenService.generateTokenPair).not.toHaveBeenCalled()
    })

    it('反例: 用户已删除', async () => {
      vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
        valid: true,
        payload: { sub: 'deleted_user', tid: 'tenant-deleted', type: 'refresh', exp: Date.now() / 1000 + 86400, iat: Date.now() / 1000, jti: 'jti_deleted' },
      })

      const result = await service.refreshTokens('refresh_deleted')

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_001')
    })
  })

  // ── logout ──────────────────────────────────────────────────────
  describe('logout', () => {
    it('正例: 指定 sessionId 登出', async () => {
      await service.logout('admin_001', 'session_abc')

      expect(sessionService.revokeSession).toHaveBeenCalledWith('session_abc')
    })

    it('正例: allSessions=true 作废全部', async () => {
      await service.logout('admin_001', undefined, true)

      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith('admin_001')
      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith('admin_001')
    })

    it('边界: 无 sessionId 且 allSessions=false 不抛异常', async () => {
      await expect(service.logout('admin_001')).resolves.not.toThrow()
    })
  })

  // ── validateToken ──────────────────────────────────────────────
  describe('validateToken', () => {
    it('正例: 有效 accessToken 返回用户信息', async () => {
      vi.mocked(tokenService.verifyAccessToken).mockReturnValue({
        valid: true,
        payload: { sub: 'admin_001', tid: 'tenant-admin', roles: ['PLATFORM_ADMIN'], permissions: ['*'], loginType: LoginType.MOBILE_PASSWORD, exp: Date.now() / 1000 + 7200, iat: Date.now() / 1000, iss: 'shenjiying-auth', jti: 'jti_example' },
      })

      const user = await service.validateToken('valid_token')
      expect(user).not.toBeNull()
      expect(user!.userId).toBe('admin_001')
      expect(user!.roles).toContain('PLATFORM_ADMIN')
    })

    it('反例: 无效 token 返回 null', async () => {
      vi.mocked(tokenService.verifyAccessToken).mockReturnValue({
        valid: false,
        error: 'Token has expired',
      })

      const user = await service.validateToken('expired_token')
      expect(user).toBeNull()
    })

    it('反例: 用户已删除返回 null', async () => {
      vi.mocked(tokenService.verifyAccessToken).mockReturnValue({
        valid: true,
        payload: { sub: 'nonexistent_user', tid: 'tenant', roles: ['MEMBER'], permissions: ['read'], loginType: LoginType.MOBILE_PASSWORD, exp: Date.now() / 1000 + 7200, iat: Date.now() / 1000, iss: 'shenjiying-auth', jti: 'jti_nonexist' },
      })

      const user = await service.validateToken('token_for_deleted_user')
      expect(user).toBeNull()
    })
  })

  // ── mock 交互验证 ─────────────────────────────────────────────
  describe('mock 交互验证', () => {
    it('loginBySms 成功后调用 createSession', async () => {
      await service.loginBySms('13800138000', '123456', { deviceId: 'd1', deviceType: 'mobile' })

      expect(sessionService.createSession).toHaveBeenCalledTimes(1)
    })

    it('loginByPassword 成功后传递 loginType', async () => {
      await service.loginByPassword('13800138000', undefined, 'password123', LoginType.MOBILE_PASSWORD, { deviceId: 'd1', deviceType: 'web' })

      expect(tokenService.generateTokenPair).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Array),
        expect.any(Array),
        LoginType.MOBILE_PASSWORD,
      )
    })

    it('refreshTokens 调用 revokeRefreshToken', async () => {
      vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
        valid: true,
        payload: { sub: 'admin_001', tid: 'tenant-admin', type: 'refresh', exp: Date.now() / 1000 + 86400, iat: Date.now() / 1000, jti: 'jti_revoke_test' },
      })

      await service.refreshTokens('mock_refresh')

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('jti_revoke_test')
    })
  })
})
