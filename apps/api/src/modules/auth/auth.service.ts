// auth.service.ts · 统一认证服务
// Phase-FP P0 · 2026-07-03

import { Injectable, Logger } from '@nestjs/common'
import {
  AuthResult,
  UserInfo,
  LoginType,
  AuthErrorCode,
} from './auth.types'
import { TokenService } from './token.service'
import { SessionService } from './session.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  // 模拟用户数据 (生产环境应查询数据库)
  private readonly mockUsers = new Map<string, MockUser>()

  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {
    // 初始化mock数据
    this.initMockUsers()
  }

  /**
   * 手机号+短信验证码登录
   */
  async loginBySms(mobile: string, code: string, deviceInfo: any): Promise<AuthResult> {
    // 1. 验证短信验证码 (简化版，生产应验证Redis缓存的验证码)
    if (!this.verifySmsCode(mobile, code)) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.SMS_CODE_ERROR,
          message: 'Invalid SMS code',
        },
      }
    }

    // 2. 查找或创建用户
    let user = this.findUserByMobile(mobile)
    if (!user) {
      user = this.createUser({ mobile, tenantId: 'default-tenant' })
    }

    // 3. 生成Token对
    return this.generateAuthResult(user, deviceInfo, LoginType.MOBILE_SMS)
  }

  /**
   * 密码登录
   */
  async loginByPassword(
    mobile: string | undefined,
    email: string | undefined,
    password: string,
    loginType: LoginType,
    deviceInfo: any,
  ): Promise<AuthResult> {
    // 1. 查找用户
    const user = mobile
      ? this.findUserByMobile(mobile)
      : email
        ? this.findUserByEmail(email)
        : null

    if (!user) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'User not found',
        },
      }
    }

    // 2. 验证密码
    if (!this.verifyPassword(password, user.passwordHash)) {
      this.logger.warn(`Failed login attempt for user ${user.userId}`)
      return {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid password',
        },
      }
    }

    // 3. 生成Token对
    return this.generateAuthResult(user, deviceInfo, loginType)
  }

  /**
   * 微信登录
   */
  async loginByWechat(code: string, deviceInfo: any): Promise<AuthResult> {
    // 1. 通过code换取微信用户信息 (简化版)
    const wechatUser = await this.exchangeWechatCode(code)
    if (!wechatUser) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.WECHAT_LOGIN_FAILED,
          message: 'WeChat login failed',
        },
      }
    }

    // 2. 查找或创建用户
    let user = this.findUserByWechatOpenId(wechatUser.openid)
    if (!user) {
      user = this.createUser({
        mobile: undefined,
        tenantId: 'default-tenant',
        wechatOpenId: wechatUser.openid,
      })
    }

    // 3. 生成Token对
    return this.generateAuthResult(user, deviceInfo, LoginType.WECHAT)
  }

  /**
   * 刷新Token
   */
  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    // 1. 验证refreshToken
    const verifyResult = this.tokenService.verifyRefreshToken(refreshToken)
    if (!verifyResult.valid || !verifyResult.payload) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.REFRESH_TOKEN_EXPIRED,
          message: verifyResult.error || 'Invalid refresh token',
        },
      }
    }

    // 2. 获取用户信息
    const user = this.mockUsers.get(verifyResult.payload.sub)
    if (!user) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'User not found',
        },
      }
    }

    // 3. 作废旧refreshToken
    const payload = verifyResult.payload
    this.tokenService.revokeRefreshToken(payload.jti)

    // 4. 生成新Token对
    const tokens = this.tokenService.generateTokenPair(
      user.userId,
      user.tenantId,
      user.roles,
      user.permissions,
      LoginType.MOBILE_PASSWORD,
    )

    return {
      success: true,
      user: this.toUserInfo(user),
      tokens,
    }
  }

  /**
   * 登出
   */
  async logout(userId: string, sessionId?: string, allSessions?: boolean): Promise<void> {
    if (allSessions) {
      // 作废所有会话
      this.sessionService.revokeAllUserSessions(userId)
      this.tokenService.revokeAllUserTokens(userId)
      this.logger.log(`User ${userId} logged out from all sessions`)
    } else if (sessionId) {
      // 作废指定会话
      this.sessionService.revokeSession(sessionId)
      this.logger.log(`User ${userId} logged out from session ${sessionId}`)
    }
  }

  /**
   * 验证Token并返回用户信息
   */
  async validateToken(accessToken: string): Promise<UserInfo | null> {
    const verifyResult = this.tokenService.verifyAccessToken(accessToken)
    if (!verifyResult.valid || !verifyResult.payload) {
      return null
    }

    const user = this.mockUsers.get(verifyResult.payload.sub)
    if (!user) {
      return null
    }

    // 更新会话活跃时间
    // this.sessionService.touchSession(sessionId)

    return this.toUserInfo(user)
  }

  // ─── 私有方法 ────────────────────────────────────────────────────────

  private generateAuthResult(
    user: MockUser,
    deviceInfo: any,
    loginType: LoginType,
  ): AuthResult {
    // 1. 创建会话
    const session = this.sessionService.createSession(user.userId, user.tenantId, deviceInfo)

    // 2. 生成Token对
    const tokens = this.tokenService.generateTokenPair(
      user.userId,
      user.tenantId,
      user.roles,
      user.permissions,
      loginType,
    )

    return {
      success: true,
      user: this.toUserInfo(user),
      tokens,
    }
  }

  private toUserInfo(user: MockUser): UserInfo {
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

  private verifySmsCode(mobile: string, code: string): boolean {
    // 简化版验证 - 生产应验证Redis缓存的验证码
    // 这里假设 '123456' 是有效的验证码
    return code === '123456'
  }

  private verifyPassword(password: string, hash: string): boolean {
    // 简化版验证 - 生产应使用bcrypt
    // 这里假设 'password123' 是有效密码
    return password === 'password123' || password === hash
  }

  private async exchangeWechatCode(code: string): Promise<{ openid: string } | null> {
    // 简化版 - 生产应调用微信API
    if (code === 'valid-wechat-code') {
      return { openid: `wechat_${Date.now()}` }
    }
    return null
  }

  private findUserByMobile(mobile: string): MockUser | undefined {
    for (const user of this.mockUsers.values()) {
      if (user.mobile === mobile) return user
    }
    return undefined
  }

  private findUserByEmail(email: string): MockUser | undefined {
    for (const user of this.mockUsers.values()) {
      if (user.email === email) return user
    }
    return undefined
  }

  private findUserByWechatOpenId(openid: string): MockUser | undefined {
    for (const user of this.mockUsers.values()) {
      if (user.wechatOpenId === openid) return user
    }
    return undefined
  }

  private createUser(params: {
    mobile?: string
    email?: string
    tenantId: string
    wechatOpenId?: string
  }): MockUser {
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const user: MockUser = {
      userId,
      tenantId: params.tenantId,
      mobile: params.mobile,
      email: params.email,
      wechatOpenId: params.wechatOpenId,
      nickname: `User_${userId.slice(-6)}`,
      roles: ['MEMBER'],
      permissions: ['member:read', 'member:update'],
      passwordHash: '',
      avatar: undefined,
    }
    this.mockUsers.set(userId, user)
    return user
  }

  private initMockUsers(): void {
    // 创建一些测试用户
    const testUsers: MockUser[] = [
      {
        userId: 'admin_001',
        tenantId: 'tenant-admin',
        mobile: '13800138000',
        email: 'admin@shenjiying.com',
        nickname: 'Admin',
        roles: ['PLATFORM_ADMIN'],
        permissions: ['*'],
        passwordHash: 'password123',
        avatar: undefined,
      },
      {
        userId: 'tenant_admin_001',
        tenantId: 'tenant-demo',
        mobile: '13800138001',
        email: 'tenant@shenjiying.com',
        nickname: 'Tenant Admin',
        roles: ['TENANT_ADMIN'],
        permissions: ['tenant:*', 'store:*', 'member:*'],
        passwordHash: 'password123',
        avatar: undefined,
      },
      {
        userId: 'member_001',
        tenantId: 'tenant-demo',
        mobile: '13800138002',
        email: 'member@shenjiying.com',
        nickname: 'Demo Member',
        roles: ['MEMBER'],
        permissions: ['member:read', 'member:update'],
        passwordHash: 'password123',
        avatar: undefined,
      },
    ]

    for (const user of testUsers) {
      this.mockUsers.set(user.userId, user)
    }
  }
}

// ─── Mock类型 ────────────────────────────────────────────────────────────

interface MockUser {
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
