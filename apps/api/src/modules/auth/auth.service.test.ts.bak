import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * auth.service.test.ts - Phase-FP P0
 * 用途: AuthService 统一认证服务 单元测试
 * 覆盖: 4种登录方式 + Token刷新 + 登出 + Token验证
 */
import { AuthService } from './auth.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { LoginType, AuthErrorCode } from './auth.types'

describe('AuthService', () => {
  let authService: AuthService
  let tokenService: TokenService
  let sessionService: SessionService

  beforeEach(() => {
    tokenService = new TokenService()
    sessionService = new SessionService()
    authService = new AuthService(tokenService, sessionService)
  })

  // ─── SMS登录 ─────────────────────────────────────────────────────────

  describe('loginBySms', () => {
    it('should login successfully with valid SMS code', async () => {
      const result = await authService.loginBySms('13800138000', '123456', {
        deviceId: 'test-device',
        deviceType: 'web',
        userAgent: 'vitest',
      })
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user!.userId).toBe('admin_001')
      expect(result.tokens).toBeDefined()
      expect(result.tokens!.accessToken).toBeTruthy()
      expect(result.tokens!.refreshToken).toBeTruthy()
      expect(result.tokens!.tokenType).toBe('Bearer')
    })

    it('should fail with invalid SMS code', async () => {
      const result = await authService.loginBySms('13800138000', '000000', {
        deviceId: 'test-device',
        deviceType: 'web',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error!.code).toBe(AuthErrorCode.SMS_CODE_ERROR)
      expect(result.user).toBeUndefined()
    })
  })

  // ─── 密码登录 ────────────────────────────────────────────────────────

  describe('loginByPassword', () => {
    it('should login successfully via mobile+password', async () => {
      const result = await authService.loginByPassword(
        '13800138000', undefined, 'password123',
        LoginType.MOBILE_PASSWORD,
        { deviceId: 'dev-1', deviceType: 'mobile' },
      )
      expect(result.success).toBe(true)
      expect(result.user!.userId).toBe('admin_001')
    })

    it('should login successfully via email+password', async () => {
      const result = await authService.loginByPassword(
        undefined, 'admin@shenjiying.com', 'password123',
        LoginType.EMAIL_PASSWORD,
        { deviceId: 'dev-2', deviceType: 'web' },
      )
      expect(result.success).toBe(true)
      expect(result.user!.email).toBe('admin@shenjiying.com')
    })

    it('should fail with wrong password', async () => {
      const result = await authService.loginByPassword(
        '13800138000', undefined, 'wrong-password',
        LoginType.MOBILE_PASSWORD,
        { deviceId: 'dev-3', deviceType: 'web' },
      )
      expect(result.success).toBe(false)
      expect(result.error!.code).toBe(AuthErrorCode.INVALID_CREDENTIALS)
    })

    it('should fail for non-existent user', async () => {
      const result = await authService.loginByPassword(
        '13900000000', undefined, 'password123',
        LoginType.MOBILE_PASSWORD,
        { deviceId: 'dev-4', deviceType: 'web' },
      )
      expect(result.success).toBe(false)
      expect(result.error!.code).toBe(AuthErrorCode.INVALID_CREDENTIALS)
    })
  })

  // ─── 微信登录 ────────────────────────────────────────────────────────

  describe('loginByWechat', () => {
    it('should login successfully with valid wechat code', async () => {
      const result = await authService.loginByWechat('valid-wechat-code', {
        deviceId: 'wx-dev',
        deviceType: 'mobile',
      })
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()
    })

    it('should fail with invalid wechat code', async () => {
      const result = await authService.loginByWechat('invalid-wechat-code', {
        deviceId: 'wx-dev',
        deviceType: 'mobile',
      })
      expect(result.success).toBe(false)
      expect(result.error!.code).toBe(AuthErrorCode.WECHAT_LOGIN_FAILED)
    })
  })

  // ─── Token刷新 ───────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      // 先登录获取 token
      const loginResult = await authService.loginBySms(
        '13800138000', '123456',
        { deviceId: 'dev-refresh', deviceType: 'web' },
      )
      expect(loginResult.success).toBe(true)

      // 用 refreshToken 刷新
      const refreshResult = await authService.refreshTokens(
        loginResult.tokens!.refreshToken,
      )
      expect(refreshResult.success).toBe(true)
      expect(refreshResult.tokens!.accessToken).not.toBe(loginResult.tokens!.accessToken)
      expect(refreshResult.tokens!.refreshToken).not.toBe(loginResult.tokens!.refreshToken)
    })

    it('should fail with expired/invalid refresh token', async () => {
      const result = await authService.refreshTokens('invalid-token-value')
      expect(result.success).toBe(false)
      expect(result.error!.code).toBe(AuthErrorCode.REFRESH_TOKEN_EXPIRED)
    })
  })

  // ─── 登出 ────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should logout single session', async () => {
      const loginResult = await authService.loginBySms(
        '13800138000', '123456',
        { deviceId: 'dev-logout', deviceType: 'web' },
      )
      expect(loginResult.success).toBe(true)

      // 登出后 token 应失效
      await authService.logout(loginResult.user!.userId, 'dummy-session')
      // 不报异常即可
    })

    it('should logout all sessions without errors', async () => {
      const loginResult = await authService.loginBySms(
        '13800138000', '123456',
        { deviceId: 'dev-all-logout', deviceType: 'web' },
      )
      expect(loginResult.success).toBe(true)

      // logout all sessions: should not throw
      await expect(
        authService.logout(loginResult.user!.userId, undefined, true),
      ).resolves.toBeUndefined()
    })
  })

  // ─── Token验证 ───────────────────────────────────────────────────────

  describe('validateToken', () => {
    it('should return user info for valid token', async () => {
      const loginResult = await authService.loginBySms(
        '13800138000', '123456',
        { deviceId: 'dev-validate', deviceType: 'web' },
      )
      const userInfo = await authService.validateToken(
        loginResult.tokens!.accessToken,
      )
      expect(userInfo).not.toBeNull()
      expect(userInfo!.userId).toBe('admin_001')
      expect(userInfo!.roles).toContain('PLATFORM_ADMIN')
    })

    it('should return null for invalid token', async () => {
      const userInfo = await authService.validateToken('fake-invalid-token')
      expect(userInfo).toBeNull()
    })
  })

  // ─── 边界场景 ───────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should create new user on first SMS login for unknown mobile', async () => {
      const result = await authService.loginBySms('19900000001', '123456', {
        deviceId: 'dev-new',
        deviceType: 'mobile',
      })
      expect(result.success).toBe(true)
      expect(result.user!.userId).toMatch(/^user_/)
    })

    it('should assign MEMBER role to new users', async () => {
      const result = await authService.loginBySms('19900000002', '123456', {
        deviceId: 'dev-new-role',
        deviceType: 'mobile',
      })
      expect(result.user!.roles).toContain('MEMBER')
      expect(result.user!.roles).not.toContain('PLATFORM_ADMIN')
    })

    it('should generate different tokens for different logins by same user', async () => {
      const r1 = await authService.loginBySms('13800138000', '123456', {
        deviceId: 'dev-same-1',
        deviceType: 'web',
      })
      const r2 = await authService.loginBySms('13800138000', '123456', {
        deviceId: 'dev-same-2',
        deviceType: 'mobile',
      })
      expect(r1.tokens!.accessToken).not.toBe(r2.tokens!.accessToken)
      expect(r1.tokens!.refreshToken).not.toBe(r2.tokens!.refreshToken)
    })
  })
})
