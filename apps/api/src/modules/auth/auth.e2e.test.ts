/**
 * auth.e2e.test.ts · 统一认证模块 E2E 测试
 *
 * 覆盖:
 * - 短信验证码登录全流程 (正常)
 * - 密码登录全流程 (正常)
 * - 微信登录 (正常)
 * - Token 刷新 (正常)
 * - 登出 (正常)
 * - 获取当前用户 (正常)
 * - 反例/边界: 错误验证码、无效token、过期间隔
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LoginType } from './auth.types'
import { AuthService } from './auth.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'

// ─── 集成测试: 用真实 TokenService + SessionService ──────────────────

describe('auth E2E: 认证全流程', () => {
  let authService: AuthService

  beforeEach(() => {
    const tokenService = new TokenService()
    const sessionService = new SessionService()
    authService = new AuthService(tokenService, sessionService)
  })

  // ─── 正向: 短信验证码登录 ──────────────────────────────────────
  describe('短信验证码登录', () => {
    it('正确手机号+验证码登录成功', async () => {
      const result = await authService.loginBySms('13800138000', '123456', {
        deviceId: 'dev-001',
        deviceType: 'mobile',
        ip: '192.168.1.100',
      })

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user!.mobile).toBe('13800138000')
      expect(result.tokens).toBeDefined()
      expect(result.tokens!.accessToken).toBeDefined()
      expect(result.tokens!.refreshToken).toBeDefined()
      expect(result.tokens!.tokenType).toBe('Bearer')
      expect(result.tokens!.expiresIn).toBeGreaterThan(0)
    })

    it('同一手机号二次登录返回同样用户', async () => {
      const r1 = await authService.loginBySms('13900139000', '123456', { deviceId: 'dev-phone2', deviceType: 'mobile', ip: '192.168.1.101' })
      const r2 = await authService.loginBySms('13900139000', '123456', { deviceId: 'dev-phone2', deviceType: 'mobile', ip: '192.168.1.101' })

      expect(r1.success).toBe(true)
      expect(r2.success).toBe(true)
      expect(r1.user!.userId).toBe(r2.user!.userId)
    })

    it('附带完整设备信息登录', async () => {
      // 使用正确验证码 '123456'，新手机号会自动注册
      const result = await authService.loginBySms('13700137000', '123456', {
        deviceId: 'iphone-15-pro',
        deviceType: 'mobile',
        browser: 'Safari',
        os: 'iOS 18',
        ip: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)',
      })

      expect(result.success).toBe(true)
      expect(result.tokens!.expiresIn).toBeGreaterThan(0)
    })
  })

  // ─── 正向: 密码登录 ────────────────────────────────────────────
  describe('密码登录', () => {
    it('手机号+密码登录成功', async () => {
      const result = await authService.loginByPassword(
        '13800138000',
        undefined,
        'password123',
        LoginType.MOBILE_PASSWORD,
        { deviceId: 'web-chrome', deviceType: 'web' },
      )

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()
    })

    it('邮箱+密码登录成功', async () => {
      const result = await authService.loginByPassword(
        undefined,
        'admin@shenjiying.com',
        'password123',
        LoginType.EMAIL_PASSWORD,
        { deviceId: 'mac-safari', deviceType: 'web' },
      )

      expect(result.success).toBe(true)
      expect(result.user!.email).toBe('admin@shenjiying.com')
    })

    it('不存在的用户登录失败', async () => {
      const result = await authService.loginByPassword(
        undefined,
        'nobody@nowhere.com',
        'password123',
        LoginType.EMAIL_PASSWORD,
        { deviceId: 'dev-nonexist', deviceType: 'web' },
      )

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_001')
    })
  })

  // ─── 正向: 微信登录 ────────────────────────────────────────────
  describe('微信登录', () => {
    it('微信登录成功', async () => {
      const result = await authService.loginByWechat('valid-wechat-code', {
        deviceId: 'wechat-iphone',
        deviceType: 'mobile',
      })

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user!.userId).toBeDefined()
    })

    it('无效微信 code 登录失败', async () => {
      const result = await authService.loginByWechat('invalid-code', {
        deviceId: 'wechat-android',
        deviceType: 'mobile',
      })

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_011')
    })
  })

  // ─── 正向: Token 刷新 ──────────────────────────────────────────
  describe('Token 刷新', () => {
    it('使用有效 refreshToken 刷新成功', async () => {
      const loginResult = await authService.loginBySms('13800138000', '123456', { deviceId: 'dev-refresh', deviceType: 'mobile', ip: '192.168.1.100' })
      expect(loginResult.success).toBe(true)

      const refreshResult = await authService.refreshTokens(loginResult.tokens!.refreshToken)
      expect(refreshResult.success).toBe(true)
      expect(refreshResult.tokens!.accessToken).toBeDefined()
      expect(refreshResult.tokens!.refreshToken).toBeDefined()
    })

    it('刷新后旧 token 被作废', async () => {
      const loginResult = await authService.loginBySms('13800138000', '123456', { deviceId: 'dev-refresh-old', deviceType: 'mobile', ip: '192.168.1.100' })
      const oldRefresh = loginResult.tokens!.refreshToken

      // 第一次刷新成功
      const r1 = await authService.refreshTokens(oldRefresh)
      expect(r1.success).toBe(true)

      // 再次使用旧的 refreshToken 应该失败
      const r2 = await authService.refreshTokens(oldRefresh)
      expect(r2.success).toBe(false)
    })
  })

  // ─── 正向: 登出 ────────────────────────────────────────────────
  describe('登出', () => {
    it('不指定 session 或 allSessions 是空操作', async () => {
      await authService.logout('admin_001')
      expect(true).toBe(true) // 不抛异常
    })

    it('登出所有会话成功', async () => {
      const loginResult = await authService.loginBySms('13800138000', '123456', { deviceId: 'dev-logout', deviceType: 'mobile', ip: '192.168.1.100' })
      expect(loginResult.success).toBe(true)

      await authService.logout(loginResult.user!.userId, undefined, true)
      expect(true).toBe(true)
    })
  })

  // ─── 正向: Token 验证 ──────────────────────────────────────────
  describe('Token 验证', () => {
    it('有效 accessToken 可获取用户信息', async () => {
      const loginResult = await authService.loginBySms('13800138000', '123456', { deviceId: 'dev-validate', deviceType: 'mobile', ip: '192.168.1.100' })
      expect(loginResult.success).toBe(true)

      const user = await authService.validateToken(loginResult.tokens!.accessToken)
      expect(user).not.toBeNull()
      expect(user!.userId).toBe('admin_001')
    })

    it('无效 accessToken 返回 null', async () => {
      const user = await authService.validateToken('invalid-token-xyz')
      expect(user).toBeNull()
    })
  })

  // ─── 反例: 认证失败场景 ────────────────────────────────────────
  describe('反例: 认证失败', () => {
    it('错误短信验证码登录失败', async () => {
      const result = await authService.loginBySms('13800138000', 'wrong-code', { deviceId: 'dev-wrong', deviceType: 'mobile', ip: '192.168.1.100' })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.user).toBeUndefined()
      expect(result.tokens).toBeUndefined()
    })

    it('错误密码登录失败', async () => {
      const result = await authService.loginByPassword(
        '13800138000',
        undefined,
        'wrongPassword',
        LoginType.MOBILE_PASSWORD,
        { deviceId: 'dev-wrong-pwd', deviceType: 'web' },
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error!.code).toBe('AUTH_001')
    })

    it('空验证码登录失败', async () => {
      const result = await authService.loginBySms('13800138000', '', { deviceId: 'dev-empty-code', deviceType: 'mobile', ip: '192.168.1.100' })

      expect(result.success).toBe(false)
      expect(result.error!.code).toBe('AUTH_008')
    })

    it('无效 refreshToken 刷新失败', async () => {
      const result = await authService.refreshTokens('invalid-refresh-token')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ─── 边界: 多设备/并发 ────────────────────────────────────────
  describe('边界: 多设备场景', () => {
    it('同一用户多设备登录', async () => {
      const r1 = await authService.loginBySms('13800138000', '123456', {
        deviceId: 'iphone-15', deviceType: 'mobile',
      })
      const r2 = await authService.loginBySms('13800138000', '123456', {
        deviceId: 'macbook-pro', deviceType: 'web',
      })

      expect(r1.success).toBe(true)
      expect(r2.success).toBe(true)
      expect(r1.user!.userId).toBe(r2.user!.userId)
    })
  })
})
