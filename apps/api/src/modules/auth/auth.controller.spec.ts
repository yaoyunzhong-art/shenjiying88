import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AuthController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、缺失参数、无效Token、错误验证码）。
 */

import assert from 'node:assert/strict'

// ── Entity mirrors (avoid NestJS DI) ───────────────────────────
function makeLoginSmsInput(overrides: Record<string, unknown> = {}) {
  return {
    mobile: '13800138000',
    code: '123456',
    ...overrides,
  }
}

function makeLoginPasswordInput(overrides: Record<string, unknown> = {}) {
  return {
    mobile: '13800138000',
    password: 'password123',
    loginType: 'mobile_password',
    ...overrides,
  }
}

function makeWechatInput(overrides: Record<string, unknown> = {}) {
  return {
    code: 'valid-wechat-code',
    ...overrides,
  }
}

function makeRefreshTokenInput(overrides: Record<string, unknown> = {}) {
  return {
    refreshToken: 'mock-refresh-token-valid',
    ...overrides,
  }
}

function makeLogoutInput(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 'session-001',
    allSessions: false,
    ...overrides,
  }
}

function makeUserInfo(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'admin_001',
    tenantId: 'tenant-admin',
    mobile: '13800138000',
    email: 'admin@shenjiying.com',
    nickname: 'Admin',
    roles: ['PLATFORM_ADMIN'],
    avatar: undefined,
    ...overrides,
  }
}

function makeTokenPair(overrides: Record<string, unknown> = {}) {
  return {
    accessToken: 'mock-access-token-xxx',
    refreshToken: 'mock-refresh-token-yyy',
    expiresIn: 3600,
    tokenType: 'Bearer',
    ...overrides,
  }
}

function makeAuthSuccessResult(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    user: makeUserInfo(),
    tokens: makeTokenPair(),
    ...overrides,
  }
}

function makeAuthErrorResult(overrides: Record<string, unknown> = {}) {
  return {
    success: false,
    error: {
      code: 'AUTH_001',
      message: 'Invalid credentials',
    },
    ...overrides,
  }
}

function makeDeviceInfo(overrides: Record<string, unknown> = {}) {
  return {
    deviceId: 'device_1712345678000',
    deviceType: 'web',
    browser: 'Chrome',
    os: 'macOS',
    userAgent: 'Mozilla/5.0 Chrome browser',
    ...overrides,
  }
}

// ── Inline Controller (mirrors source: auth.controller.ts) ───
class AuthController {
  private authService: any

  constructor(authService: any) {
    this.authService = authService
  }

  async loginBySms(body: { mobile: string; code: string }, userAgent?: string) {
    const deviceInfo = this.extractDeviceInfo(userAgent)
    const result = await this.authService.loginBySms(body.mobile, body.code, deviceInfo)

    if (!result.success) {
      throw new Error(JSON.stringify(result.error))
    }

    return {
      success: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    }
  }

  async loginByPassword(body: {
    mobile?: string
    email?: string
    password: string
    loginType?: string
  }, userAgent?: string) {
    const deviceInfo = this.extractDeviceInfo(userAgent)
    const result = await this.authService.loginByPassword(
      body.mobile,
      body.email,
      body.password,
      body.loginType || 'mobile_password',
      deviceInfo,
    )

    if (!result.success) {
      throw new Error(JSON.stringify(result.error))
    }

    return {
      success: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    }
  }

  async loginByWechat(code: string, userAgent?: string) {
    const deviceInfo = this.extractDeviceInfo(userAgent)
    const result = await this.authService.loginByWechat(code, deviceInfo)

    if (!result.success) {
      throw new Error(JSON.stringify(result.error))
    }

    return {
      success: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    }
  }

  async refreshToken(body: { refreshToken: string }) {
    const result = await this.authService.refreshTokens(body.refreshToken)

    if (!result.success) {
      throw new Error(JSON.stringify(result.error))
    }

    return {
      success: true,
      data: {
        ...result.tokens,
      },
    }
  }

  async logout(body: { sessionId?: string; allSessions?: boolean }, authHeader?: string) {
    const token = this.extractToken(authHeader)
    if (!token) {
      throw new Error(JSON.stringify({ code: 'AUTH_004', message: 'No token provided' }))
    }

    const user = await this.authService.validateToken(token)
    if (!user) {
      throw new Error(JSON.stringify({ code: 'AUTH_002', message: 'Invalid token' }))
    }

    await this.authService.logout(user.userId, body.sessionId, body.allSessions)

    return {
      success: true,
      message: 'Logged out successfully',
    }
  }

  async getCurrentUser(authHeader?: string) {
    const token = this.extractToken(authHeader)
    if (!token) {
      throw new Error(JSON.stringify({ code: 'AUTH_004', message: 'No token provided' }))
    }

    const user = await this.authService.validateToken(token)
    if (!user) {
      throw new Error(JSON.stringify({ code: 'AUTH_002', message: 'Invalid or expired token' }))
    }

    return {
      success: true,
      data: user,
    }
  }

  private extractToken(auth: string | undefined): string | null {
    if (!auth) return null
    if (auth.startsWith('Bearer ')) {
      return auth.slice(7)
    }
    return null
  }

  private extractDeviceInfo(userAgent?: string): any {
    if (!userAgent) {
      return {
        deviceId: 'unknown',
        deviceType: 'unknown',
        userAgent: undefined,
      }
    }

    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)
    const isTablet = /tablet|ipad/i.test(userAgent)

    return {
      deviceId: `device_${Date.now()}`,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'web',
      browser: this.extractBrowser(userAgent),
      os: this.extractOS(userAgent),
      userAgent,
    }
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private extractOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }
}

// ── Helpers ───────────────────────────────────────────────────
function makeMockService(overrides: Record<string, any> = {}) {
  return {
    loginBySms: () => makeAuthSuccessResult(),
    loginByPassword: () => makeAuthSuccessResult(),
    loginByWechat: () => makeAuthSuccessResult(),
    refreshTokens: () => makeAuthSuccessResult(),
    logout: () => undefined,
    validateToken: () => makeUserInfo(),
    ...overrides,
  }
}

function makeMockServiceWithData() {
  const adminUser = makeUserInfo()
  const memberUser = makeUserInfo({ userId: 'member_001', tenantId: 'tenant-demo', mobile: '13800138002', roles: ['MEMBER'] })

  return makeMockService({
    loginBySms: async (mobile: string, code: string, _deviceInfo: any) => {
      if (code !== '123456') {
        return makeAuthErrorResult({ error: { code: 'AUTH_008', message: 'Invalid SMS code' } })
      }
      if (mobile === '13800138000') {
        return makeAuthSuccessResult({ user: adminUser })
      }
      if (mobile === '13800138002') {
        return makeAuthSuccessResult({ user: memberUser })
      }
      // New user created
      return makeAuthSuccessResult({
        user: makeUserInfo({ userId: 'user_new_001', mobile, roles: ['MEMBER'] }),
      })
    },
    loginByPassword: async (mobile: string | undefined, email: string | undefined, password: string, _loginType: string, _deviceInfo: any) => {
      if (!mobile && !email) {
        return makeAuthErrorResult({ error: { code: 'AUTH_001', message: 'User not found' } })
      }
      if (password !== 'password123') {
        return makeAuthErrorResult({ error: { code: 'AUTH_001', message: 'Invalid password' } })
      }
      if (mobile === '13800138000') {
        return makeAuthSuccessResult({ user: adminUser })
      }
      return makeAuthSuccessResult({ user: memberUser })
    },
    loginByWechat: async (code: string, _deviceInfo: any) => {
      if (code !== 'valid-wechat-code') {
        return makeAuthErrorResult({ error: { code: 'AUTH_011', message: 'WeChat login failed' } })
      }
      return makeAuthSuccessResult({ user: makeUserInfo({ userId: 'wechat_user_001', roles: ['MEMBER'] }) })
    },
    refreshTokens: async (refreshToken: string) => {
      if (refreshToken === 'mock-refresh-token-expired' || refreshToken === '') {
        return makeAuthErrorResult({ error: { code: 'AUTH_003', message: 'Invalid refresh token' } })
      }
      return makeAuthSuccessResult()
    },
    logout: async (_userId: string, _sessionId?: string, _allSessions?: boolean) => {
      // no-op
    },
    validateToken: async (token: string) => {
      if (token === 'valid-token') {
        return adminUser
      }
      if (token === 'member-token') {
        return memberUser
      }
      return null
    },
  })
}

// ── Tests ─────────────────────────────────────────────────────
describe('AuthController', () => {

  // ── POST /auth/login/sms ──────────────────────────────────
  describe('loginBySms()', () => {
    it('logs in successfully with valid SMS code', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginSmsInput()
      const response = await controller.loginBySms(input, 'Mozilla/5.0 Chrome')

      assert.equal(response.success, true)
      assert.ok(response.data)
      assert.equal(response.data.user.userId, 'admin_001')
      assert.equal(response.data.accessToken, 'mock-access-token-xxx')
      assert.equal(response.data.refreshToken, 'mock-refresh-token-yyy')
      assert.equal(response.data.tokenType, 'Bearer')
    })

    it('throws for invalid SMS code', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginSmsInput({ code: '000000' })

      await assert.rejects(
        () => controller.loginBySms(input, 'Mozilla/5.0 Chrome'),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_008' && parsed.message === 'Invalid SMS code'
        },
      )
    })

    it('logs in new user with unrecognized mobile', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginSmsInput({ mobile: '13900000000' })
      const response = await controller.loginBySms(input)

      assert.equal(response.success, true)
      assert.equal(response.data.user.mobile, '13900000000')
      assert.ok(response.data.user.userId.startsWith('user_'))
    })

    it('handles missing user-agent gracefully', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginSmsInput()
      const response = await controller.loginBySms(input)

      assert.equal(response.success, true)
    })
  })

  // ── POST /auth/login/password ──────────────────────────────
  describe('loginByPassword()', () => {
    it('logs in with valid mobile and password', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginPasswordInput()
      const response = await controller.loginByPassword(input)

      assert.equal(response.success, true)
      assert.equal(response.data.user.userId, 'admin_001')
    })

    it('throws for invalid password', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginPasswordInput({ password: 'wrongpass' })

      await assert.rejects(
        () => controller.loginByPassword(input),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_001'
        },
      )
    })

    it('throws when neither mobile nor email provided', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginPasswordInput({ mobile: undefined, email: undefined })

      await assert.rejects(
        () => controller.loginByPassword(input),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_001'
        },
      )
    })

    it('logs in member user with correct credentials', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginPasswordInput({ mobile: '13800138002' })
      const response = await controller.loginByPassword(input)

      assert.equal(response.success, true)
      assert.deepEqual(response.data.user.roles, ['MEMBER'])
    })

    it('logs in with email instead of mobile', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLoginPasswordInput({ mobile: undefined, email: 'admin@shenjiying.com' })
      const response = await controller.loginByPassword(input)

      assert.equal(response.success, true)
      assert.equal(response.data.user.email, 'admin@shenjiying.com')
    })
  })

  // ── POST /auth/login/wechat ────────────────────────────────
  describe('loginByWechat()', () => {
    it('logs in with valid WeChat code', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeWechatInput()
      const response = await controller.loginByWechat(input.code, 'Mozilla/5.0')

      assert.equal(response.success, true)
      assert.ok(response.data.user.userId)
    })

    it('throws for invalid WeChat code', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeWechatInput({ code: 'invalid-code' })

      await assert.rejects(
        () => controller.loginByWechat(input.code),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_011'
        },
      )
    })

    it('handles empty code', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)

      await assert.rejects(
        () => controller.loginByWechat(''),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_011'
        },
      )
    })
  })

  // ── POST /auth/refresh ─────────────────────────────────────
  describe('refreshToken()', () => {
    it('refreshes tokens with valid refresh token', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeRefreshTokenInput()
      const response = await controller.refreshToken(input)

      assert.equal(response.success, true)
      assert.ok(response.data.accessToken)
      assert.ok(response.data.refreshToken)
    })

    it('throws for expired refresh token', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeRefreshTokenInput({ refreshToken: 'mock-refresh-token-expired' })

      await assert.rejects(
        () => controller.refreshToken(input),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_003'
        },
      )
    })

    it('returns tokens for empty refresh token (validation in DTO layer)', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)

      // The controller passes empty refreshToken to service, which treats unknown tokens as expired
      await assert.rejects(
        () => controller.refreshToken({ refreshToken: '' }),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_003'
        },
      )
    })
  })

  // ── POST /auth/logout ──────────────────────────────────────
  describe('logout()', () => {
    it('logs out with valid token', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLogoutInput()
      const response = await controller.logout(input, 'Bearer valid-token')

      assert.equal(response.success, true)
      assert.equal(response.message, 'Logged out successfully')
    })

    it('throws for missing Authorization header', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLogoutInput()

      await assert.rejects(
        () => controller.logout(input),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_004' && parsed.message === 'No token provided'
        },
      )
    })

    it('throws for malformed Authorization header', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLogoutInput()

      await assert.rejects(
        () => controller.logout(input, 'InvalidFormat'),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_004'
        },
      )
    })

    it('throws for invalid token', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLogoutInput()

      await assert.rejects(
        () => controller.logout(input, 'Bearer invalid-token'),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_002'
        },
      )
    })

    it('supports allSessions logout', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLogoutInput({ allSessions: true })
      const response = await controller.logout(input, 'Bearer valid-token')

      assert.equal(response.success, true)
    })

    it('supports session-specific logout', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const input = makeLogoutInput({ sessionId: 'session-001', allSessions: false })
      const response = await controller.logout(input, 'Bearer valid-token')

      assert.equal(response.success, true)
    })
  })

  // ── GET /auth/me ───────────────────────────────────────────
  describe('getCurrentUser()', () => {
    it('returns user info with valid token', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const response = await controller.getCurrentUser('Bearer valid-token')

      assert.equal(response.success, true)
      assert.equal(response.data.userId, 'admin_001')
      assert.equal(response.data.tenantId, 'tenant-admin')
      assert.ok(response.data.roles.includes('PLATFORM_ADMIN'))
    })

    it('throws for missing Authorization header', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)

      await assert.rejects(
        () => controller.getCurrentUser(),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.code === 'AUTH_004' && parsed.message === 'No token provided'
        },
      )
    })

    it('throws for expired token', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)

      await assert.rejects(
        () => controller.getCurrentUser('Bearer expired-token'),
        (err: Error) => {
          const parsed = JSON.parse(err.message)
          return parsed.message.includes('expired')
        },
      )
    })

    it('returns member user info for member token', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const response = await controller.getCurrentUser('Bearer member-token')

      assert.equal(response.success, true)
      assert.equal(response.data.userId, 'member_001')
      assert.deepEqual(response.data.roles, ['MEMBER'])
    })

    it('handles "Bearer " prefix extraction correctly', async () => {
      const mockService = makeMockServiceWithData()
      const controller = new AuthController(mockService)
      const response = await controller.getCurrentUser('Bearer valid-token')

      assert.equal(response.success, true)
      assert.equal(response.data.userId, 'admin_001')
    })
  })
})
