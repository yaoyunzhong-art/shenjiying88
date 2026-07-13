/**
 * auth-ringbeam.test.ts - V17#圈梁 Phase1 基础设施圈梁
 * 用途: PRD对齐测试 - 验证登录/注册/鉴权核心流程
 * 覆盖: 正例(成功短信登录) + 反例(无效凭证) + 边界(空mobile)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from './auth.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { LoginType, AuthErrorCode } from './auth.types'

describe('🔵 AuthRingBeam: 认证核心流程PRD对齐', () => {
  let authService: AuthService

  beforeEach(() => {
    const tokenService = new TokenService()
    const sessionService = new SessionService()
    authService = new AuthService(tokenService, sessionService)
  })

  // ─── 正例: 短信登录成功 ─────────────────────────────────────────────

  it('[P0] 通过有效短信验证码登录应返回token和用户信息', async () => {
    const result = await authService.loginBySms('13800138000', '123456', {
      deviceId: 'ringbeam-device',
      deviceType: 'mobile',
    })

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
    expect(result.user!.userId).toBe('admin_001')
    expect(result.user!.nickname).toBe('Admin')
    expect(result.tokens).toBeDefined()
    expect(result.tokens!.accessToken).toBeTruthy()
    expect(result.tokens!.refreshToken).toBeTruthy()
    expect(result.tokens!.tokenType).toBe('Bearer')
  })

  // ─── 反例: 无效凭证 ─────────────────────────────────────────────────

  it('[P0] 使用错误密码登录应返回失败且不暴露用户信息', async () => {
    const result = await authService.loginByPassword(
      '13800138000', undefined, 'wrong-password',
      LoginType.MOBILE_PASSWORD,
      { deviceId: 'ringbeam-dev', deviceType: 'web' },
    )

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error!.code).toBe(AuthErrorCode.INVALID_CREDENTIALS)
    expect(result.user).toBeUndefined()
    expect(result.tokens).toBeUndefined()
  })

  // ─── 边界: 空mobile + 空email → 用户不存在 ───────────────────────

  it('[P1] 提供空mobile和空email登录应返回用户不存在', async () => {
    const result = await authService.loginByPassword(
      undefined, undefined, 'password123',
      LoginType.MOBILE_PASSWORD,
      { deviceId: 'ringbeam-edge', deviceType: 'mobile' },
    )

    expect(result.success).toBe(false)
    expect(result.error!.code).toBe(AuthErrorCode.INVALID_CREDENTIALS)
    expect(result.error!.message).toBe('User not found')
  })

  // ─── 正例: 微信登录 ────────────────────────────────────────────────

  it('[P1] 通过有效微信code登录应成功创建新用户', async () => {
    const result = await authService.loginByWechat('valid-wechat-code', {
      deviceId: 'wechat-phone',
      deviceType: 'mobile',
    })

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
    expect(result.user!.userId).toMatch(/^user_/)
    expect(result.tokens!.accessToken).toBeTruthy()
  })

  // ─── 反例: 无效微信code ───────────────────────────────────────────

  it('[P1] 使用无效微信code登录应返回失败', async () => {
    const result = await authService.loginByWechat('invalid-code', {
      deviceId: 'wechat-fake',
      deviceType: 'mobile',
    })

    expect(result.success).toBe(false)
    expect(result.error!.code).toBe(AuthErrorCode.WECHAT_LOGIN_FAILED)
  })

  // ─── Token验证 ──────────────────────────────────────────────────────

  it('[P0] 成功登录后应可以通过accessToken验证用户身份', async () => {
    // 先登录
    const loginResult = await authService.loginBySms('13800138000', '123456', {
      deviceId: 'validate-token',
      deviceType: 'mobile',
    })
    expect(loginResult.success).toBe(true)

    // 验证token
    const userInfo = await authService.validateToken(loginResult.tokens!.accessToken)
    expect(userInfo).toBeDefined()
    expect(userInfo!.userId).toBe('admin_001')
  })
})
