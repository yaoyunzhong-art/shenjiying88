/**
 * auth.controller.test.ts - Phase-FP P0
 * 用途: AuthController 路由逻辑单元测试 (全路由覆盖)
 * 策略: 内联 Controller + Mock AuthService (不使用 NestJS DI)
 * 覆盖: 4种登录方式 + Token刷新 + 登出 + 获取当前用户
 * 正例 ✓ + 反例 ✗ + 边界 ⚠
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// ─── Mock AuthService ─────────────────────────────────────────────────────

class MockAuthResult {
  constructor(
    public success: boolean,
    public data?: any,
    public error?: any,
  ) {}
}

class MockAuthService {
  private validSmsCode = '123456'
  private validPassword = 'password123'
  private validRefreshToken = 'valid_refresh_token_abc'
  private validAccessToken = 'valid_access_token_xyz'
  private expiredToken = 'expired_token_999'

  private mockUsers: Record<string, any> = {}
  private sessions: Record<string, any> = {}
  private sessionCounter = 0
  private revokedTokens: Set<string> = new Set()

  constructor() {
    this.seedUsers()
  }

  private seedUsers() {
    this.mockUsers = {
      '13800138000': {
        userId: 'admin_001',
        tenantId: 'tenant-admin',
        mobile: '13800138000',
        email: 'admin@shenjiying.com',
        nickname: '超级管理员',
        roles: ['PLATFORM_ADMIN'],
        permissions: ['*'],
      },
      '13800138001': {
        userId: 'tenant_admin_001',
        tenantId: 'tenant-demo',
        mobile: '13800138001',
        email: 'tenant@shenjiying.com',
        nickname: '商户管理员',
        roles: ['TENANT_ADMIN'],
        permissions: ['tenant:*', 'store:*', 'member:*'],
      },
      '13800138002': {
        userId: 'member_001',
        tenantId: 'tenant-demo',
        mobile: '13800138002',
        email: 'member@shenjiying.com',
        nickname: '会员用户',
        roles: ['MEMBER'],
        permissions: ['member:read'],
      },
    }
    // Also allow lookup by ID and email
    this.mockUsers['admin_001'] = this.mockUsers['13800138000']
    this.mockUsers['tenant_admin_001'] = this.mockUsers['13800138001']
    this.mockUsers['member_001'] = this.mockUsers['13800138002']
    this.mockUsers['admin@shenjiying.com'] = this.mockUsers['13800138000']
    this.mockUsers['tenant@shenjiying.com'] = this.mockUsers['13800138001']
    this.mockUsers['member@shenjiying.com'] = this.mockUsers['13800138002']
  }

  async loginBySms(mobile: string, code: string, deviceInfo: any) {
    if (code !== this.validSmsCode) {
      return { success: false, error: { code: 'AUTH_008', message: 'Invalid SMS code' } }
    }
    const user = this.mockUsers[mobile]
    if (!user) {
      return { success: false, error: { code: 'AUTH_001', message: 'User not found' } }
    }
    return this.successResult(user)
  }

  async loginByPassword(mobile: string | undefined, email: string | undefined, password: string, loginType: string, deviceInfo: any) {
    if (password !== this.validPassword) {
      return { success: false, error: { code: 'AUTH_001', message: 'Invalid password' } }
    }
    const key = mobile || email
    if (!key) {
      return { success: false, error: { code: 'AUTH_001', message: 'No credentials provided' } }
    }
    const user = this.mockUsers[key]
    if (!user) {
      return { success: false, error: { code: 'AUTH_001', message: 'User not found' } }
    }
    return this.successResult(user)
  }

  async loginByWechat(code: string, deviceInfo: any) {
    if (code !== 'valid-wechat-code') {
      return { success: false, error: { code: 'AUTH_011', message: 'WeChat login failed' } }
    }
    // Create a mock wechat user
    const user = {
      userId: `wechat_${Date.now()}`,
      tenantId: 'default-tenant',
      nickname: '微信用户',
      roles: ['MEMBER'],
      permissions: ['member:read'],
    }
    return this.successResult(user)
  }

  async refreshTokens(refreshToken: string) {
    if (refreshToken !== this.validRefreshToken) {
      return { success: false, error: { code: 'AUTH_003', message: 'Invalid or expired refresh token' } }
    }
    const user = this.mockUsers['13800138000']
    return this.successResult(user)
  }

  async logout(userId: string, sessionId?: string, allSessions?: boolean) {
    if (allSessions) {
      // Revoke all
      for (const key of Object.keys(this.sessions)) {
        this.sessions[key].status = 'revoked'
      }
    } else if (sessionId && this.sessions[sessionId]) {
      this.sessions[sessionId].status = 'revoked'
    }
    this.revokedTokens.add(userId)
  }

  async validateToken(accessToken: string) {
    if (accessToken === this.expiredToken) {
      return null
    }
    if (accessToken === this.validAccessToken) {
      return this.mockUsers['13800138000']
    }
    return null
  }

  private successResult(user: any) {
    const tokens = {
      accessToken: this.validAccessToken,
      refreshToken: this.validRefreshToken,
      expiresIn: 7200,
      tokenType: 'Bearer',
    }
    return { success: true, user, tokens }
  }
}

// ─── Inline AuthController ────────────────────────────────────────────────

function createController(authService: MockAuthService) {
  function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null
    if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
    return null
  }

  function extractDeviceInfo(userAgent?: string): any {
    if (!userAgent) return { deviceId: 'unknown', deviceType: 'unknown', userAgent: undefined }
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)
    const isTablet = /tablet|ipad/i.test(userAgent)
    return {
      deviceId: `device_${Date.now()}`,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'web',
      userAgent,
    }
  }

  return {
    // POST /auth/login/sms
    async loginBySms(body: any, userAgent?: string) {
      const deviceInfo = extractDeviceInfo(userAgent)
      const result: any = await authService.loginBySms(body.mobile, body.code, deviceInfo)
      if (!result.success) {
        return { success: false, statusCode: 401, error: result.error }
      }
      return { success: true, data: { user: result.user, ...result.tokens } }
    },

    // POST /auth/login/password
    async loginByPassword(body: any, userAgent?: string) {
      const deviceInfo = extractDeviceInfo(userAgent)
      const result: any = await authService.loginByPassword(
        body.mobile, body.email, body.password, body.loginType || 'mobile_password', deviceInfo,
      )
      if (!result.success) {
        return { success: false, statusCode: 401, error: result.error }
      }
      return { success: true, data: { user: result.user, ...result.tokens } }
    },

    // POST /auth/login/wechat
    async loginByWechat(body: any, userAgent?: string) {
      const deviceInfo = extractDeviceInfo(userAgent)
      const result: any = await authService.loginByWechat(body.code, deviceInfo)
      if (!result.success) {
        return { success: false, statusCode: 401, error: result.error }
      }
      return { success: true, data: { user: result.user, ...result.tokens } }
    },

    // POST /auth/refresh
    async refreshToken(body: any) {
      const result: any = await authService.refreshTokens(body.refreshToken)
      if (!result.success) {
        return { success: false, statusCode: 401, error: result.error }
      }
      return { success: true, data: { ...result.tokens } }
    },

    // POST /auth/logout
    async logout(body: any, authHeader?: string) {
      const token = extractToken(authHeader)
      if (!token) {
        return { success: false, statusCode: 401, error: { code: 'AUTH_004', message: 'No token provided' } }
      }
      const user = await authService.validateToken(token)
      if (!user) {
        return { success: false, statusCode: 401, error: { code: 'AUTH_004', message: 'Invalid token' } }
      }
      await authService.logout(user.userId, body.sessionId, body.allSessions)
      return { success: true, message: 'Logged out successfully' }
    },

    // GET /auth/me
    async getCurrentUser(authHeader?: string) {
      const token = extractToken(authHeader)
      if (!token) {
        return { success: false, statusCode: 401, error: { code: 'AUTH_004', message: 'No token provided' } }
      }
      const user = await authService.validateToken(token)
      if (!user) {
        return { success: false, statusCode: 401, error: { code: 'AUTH_004', message: 'Invalid or expired token' } }
      }
      return { success: true, data: user }
    },
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────

describe('AuthController', () => {
  let authService: MockAuthService
  let controller: ReturnType<typeof createController>

  beforeEach(() => {
    authService = new MockAuthService()
    controller = createController(authService)
  })

  // ══════════════════════════════════════════════════════════════════════
  // POST /auth/login/sms
  // ══════════════════════════════════════════════════════════════════════

  describe('POST /auth/login/sms', () => {
    it('✓ 正例: 有效手机号+验证码登录成功', async () => {
      const result = await controller.loginBySms({ mobile: '13800138000', code: '123456' })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.user).toBeDefined()
      expect(result.data.user.userId).toBe('admin_001')
      expect(result.data.accessToken).toBeTruthy()
      expect(result.data.refreshToken).toBeTruthy()
      expect(result.data.tokenType).toBe('Bearer')
    })

    it('✗ 反例: 无效验证码返回 401', async () => {
      const result = await controller.loginBySms({ mobile: '13800138000', code: '000000' })
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.error.code).toBe('AUTH_008')
    })

    it('✗ 反例: 不存在的手机号返回 401', async () => {
      const result = await controller.loginBySms({ mobile: '19900000000', code: '123456' })
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
    })

    it('⚠ 边界: 携带设备信息登录', async () => {
      const result = await controller.loginBySms(
        { mobile: '13800138000', code: '123456' },
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari/604.1',
      )
      expect(result.success).toBe(true)
      expect(result.data.user).toBeDefined()
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // POST /auth/login/password
  // ══════════════════════════════════════════════════════════════════════

  describe('POST /auth/login/password', () => {
    it('✓ 正例: 手机号+密码登录成功', async () => {
      const result = await controller.loginByPassword({
        mobile: '13800138000',
        password: 'password123',
        loginType: 'mobile_password',
      })
      expect(result.success).toBe(true)
      expect(result.data.user.userId).toBe('admin_001')
      expect(result.data.user.permissions).toEqual(['*'])
    })

    it('✓ 正例: 邮箱+密码登录成功', async () => {
      const result = await controller.loginByPassword({
        email: 'admin@shenjiying.com',
        password: 'password123',
        loginType: 'email_password',
      })
      expect(result.success).toBe(true)
      expect(result.data.user.nickname).toBe('超级管理员')
    })

    it('✗ 反例: 错误密码返回 401', async () => {
      const result = await controller.loginByPassword({
        mobile: '13800138000',
        password: 'wrong-password',
        loginType: 'mobile_password',
      })
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.error.code).toBe('AUTH_001')
    })

    it('✗ 反例: 不存在的用户返回 401', async () => {
      const result = await controller.loginByPassword({
        mobile: '19999999999',
        password: 'password123',
        loginType: 'mobile_password',
      })
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
    })

    it('⚠ 边界: 无手机号和邮箱返回 401', async () => {
      const result = await controller.loginByPassword({
        password: 'password123',
        loginType: 'mobile_password',
      })
      expect(result.success).toBe(false)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // POST /auth/login/wechat
  // ══════════════════════════════════════════════════════════════════════

  describe('POST /auth/login/wechat', () => {
    it('✓ 正例: 有效微信 code 登录成功', async () => {
      const result = await controller.loginByWechat({ code: 'valid-wechat-code' })
      expect(result.success).toBe(true)
      expect(result.data.user.roles).toContain('MEMBER')
      expect(result.data.accessToken).toBeTruthy()
    })

    it('✗ 反例: 无效微信 code 返回 401', async () => {
      const result = await controller.loginByWechat({ code: 'invalid-code' })
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.error.code).toBe('AUTH_011')
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // POST /auth/refresh
  // ══════════════════════════════════════════════════════════════════════

  describe('POST /auth/refresh', () => {
    it('✓ 正例: 有效 refreshToken 刷新成功', async () => {
      const result = await controller.refreshToken({ refreshToken: 'valid_refresh_token_abc' })
      expect(result.success).toBe(true)
      expect(result.data.accessToken).toBeTruthy()
      expect(result.data.refreshToken).toBeTruthy()
    })

    it('✗ 反例: 无效 refreshToken 返回 401', async () => {
      const result = await controller.refreshToken({ refreshToken: 'invalid_token' })
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.error.code).toBe('AUTH_003')
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // POST /auth/logout
  // ══════════════════════════════════════════════════════════════════════

  describe('POST /auth/logout', () => {
    it('✓ 正例: 携带有效 Token 登出成功', async () => {
      const result = await controller.logout(
        { sessionId: 'session-1' },
        'Bearer valid_access_token_xyz',
      )
      expect(result.success).toBe(true)
      expect(result.message).toBe('Logged out successfully')
    })

    it('✓ 正例: 全局登出 (allSessions=true)', async () => {
      const result = await controller.logout(
        { sessionId: 'session-1', allSessions: true },
        'Bearer valid_access_token_xyz',
      )
      expect(result.success).toBe(true)
    })

    it('✗ 反例: 无 Authorization 头返回 401', async () => {
      const result = await controller.logout({ sessionId: 'session-1' })
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.error!.message).toBe('No token provided')
    })

    it('✗ 反例: 无效 Token 返回 401', async () => {
      const result: any = await controller.logout(
        { sessionId: 'session-1' },
        'Bearer invalid_token_xxx',
      )
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
    })

    it('⚠ 边界: 空 Bearer Token', async () => {
      const result = await controller.logout(
        { sessionId: 'session-1' },
        'Bearer ',
      )
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // GET /auth/me
  // ══════════════════════════════════════════════════════════════════════

  describe('GET /auth/me', () => {
    it('✓ 正例: 有效 Token 获取用户信息', async () => {
      const result: any = await controller.getCurrentUser('Bearer valid_access_token_xyz')
      expect(result.success).toBe(true)
      expect(result.data.userId).toBe('admin_001')
      expect(result.data.nickname).toBe('超级管理员')
      expect(result.data.roles).toContain('PLATFORM_ADMIN')
      expect(result.data.permissions).toEqual(['*'])
    })

    it('✗ 反例: 无 Token 返回 401', async () => {
      const result = await controller.getCurrentUser()
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.error!.message).toBe('No token provided')
    })

    it('✗ 反例: 过期 Token 返回 401', async () => {
      const result: any = await controller.getCurrentUser('Bearer expired_token_999')
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.error!.message).toContain('expired')
    })

    it('⚠ 边界: 非 Bearer 格式的 Authorization', async () => {
      const result = await controller.getCurrentUser('Token some-random-token')
      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(401)
    })

    it('⚠ 边界: 不同角色用户都能获取自己的信息', async () => {
      // 模拟 tenant_admin token 验证
      const mockTenantAdmin = {
        userId: 'tenant_admin_001',
        tenantId: 'tenant-demo',
        nickname: '商户管理员',
        roles: ['TENANT_ADMIN'],
        permissions: ['tenant:*'],
      }

      // Patch validateToken for this test
      const origValidate = authService.validateToken.bind(authService)
      authService.validateToken = async (token: string) => {
        if (token === 'tenant_admin_token') return mockTenantAdmin
        return origValidate(token)
      }

      const result = await controller.getCurrentUser('Bearer tenant_admin_token')
      expect(result.success).toBe(true)
      expect(result.data.roles).toContain('TENANT_ADMIN')
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 全路由覆盖检查
  // ══════════════════════════════════════════════════════════════════════

  describe('Route coverage verification', () => {
    it('应覆盖所有 6 个路由端点', () => {
      const routes = [
        'loginBySms',
        'loginByPassword',
        'loginByWechat',
        'refreshToken',
        'logout',
        'getCurrentUser',
      ]
      for (const route of routes) {
        expect(typeof controller[route as keyof typeof controller]).toBe('function')
      }
    })
  })
})
