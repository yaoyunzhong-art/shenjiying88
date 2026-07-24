// auth.service.ts · 统一认证服务
// Phase-FP P0 · 2026-07-03

import { Injectable, Logger, Optional } from '@nestjs/common'
import {
  AuthResult,
  UserInfo,
  LoginType,
  AuthErrorCode,
} from './auth.types'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { RedisService } from '../../infrastructure/redis/redis.module'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly PASSWORD_LOCK_THRESHOLD = 5
  private readonly PASSWORD_LOCK_SECONDS = 30 * 60

  // 模拟用户数据 (生产环境应查询数据库)
  private readonly mockUsers = new Map<string, MockUser>()
  private readonly passwordAttemptLedger = new Map<string, PasswordAttemptState>()

  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    @Optional() private readonly redisService?: RedisService,
    @Optional() private readonly auditService?: AuditService,
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
    const principal = this.resolvePasswordLoginPrincipal(mobile, email)
    const principalState = principal
      ? await this.getPasswordAttemptState(principal)
      : undefined

    if (principalState && this.isPasswordLoginLocked(principalState)) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.ACCOUNT_LOCKED,
          message: 'Account temporarily locked due to too many failed attempts',
          retryAfter: this.getPasswordLockRetryAfter(principalState),
        },
      }
    }

    // 1. 查找用户
    const user = mobile
      ? this.findUserByMobile(mobile)
      : email
        ? this.findUserByEmail(email)
        : null

    if (user) {
      this.syncPasswordAttemptStateToUser(user, principalState)
    }

    if (!user) {
      if (principal) {
        await this.recordPasswordFailure(principal, principalState)
      }
      return {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'User not found',
        },
      }
    }

    if (this.isUserPasswordLocked(user)) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.ACCOUNT_LOCKED,
          message: 'Account temporarily locked due to too many failed attempts',
          retryAfter: this.getUserLockRetryAfter(user),
        },
      }
    }

    // 2. 验证密码
    if (!this.verifyPassword(password, user.passwordHash)) {
      const failureState = await this.recordPasswordFailure(principal, principalState, user)
      if (failureState.locked) {
        this.logPasswordLockEvent(user, principal, failureState)
      }
      this.logger.warn(`Failed login attempt for user ${user.userId}`)
      return {
        success: false,
        error: {
          code: failureState.locked ? AuthErrorCode.ACCOUNT_LOCKED : AuthErrorCode.INVALID_CREDENTIALS,
          message: failureState.locked
            ? 'Account temporarily locked due to too many failed attempts'
            : 'Invalid password',
          retryAfter: failureState.locked
            ? this.getPasswordLockRetryAfter(failureState)
            : undefined,
        },
      }
    }

    if (principalState && (principalState.failedAttempts > 0 || principalState.lockedUntil)) {
      this.logPasswordUnlockEvent(user, principal, principalState)
    }
    await this.resetPasswordFailureState(principal, user)
    user.lastLoginAt = new Date()

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

  async unlockPasswordLogin(
    mobile: string | undefined,
    email: string | undefined,
    actorId?: string,
    reason?: string,
  ): Promise<{
    principal: string
    cleared: boolean
    userId?: string
    tenantId?: string
    clearedFailedAttempts: number
    previousLockedUntil?: string
  }> {
    const principal = this.resolvePasswordLoginPrincipal(mobile, email)

    if (!principal) {
      throw new Error('mobile or email is required to unlock password login state')
    }

    const user = mobile
      ? this.findUserByMobile(mobile)
      : email
        ? this.findUserByEmail(email)
        : undefined
    const principalState = await this.getPasswordAttemptState(principal)
    const fallbackState = user && (user.failedAttempts > 0 || user.lockedUntil)
      ? {
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
          locked: this.isUserPasswordLocked(user),
        }
      : undefined
    const previousState = principalState ?? fallbackState

    await this.resetPasswordFailureState(principal, user)

    if (previousState) {
      this.logPasswordUnlockOverrideEvent(user, principal, previousState, actorId, reason)
    }

    return {
      principal,
      cleared: Boolean(previousState),
      userId: user?.userId,
      tenantId: user?.tenantId,
      clearedFailedAttempts: previousState?.failedAttempts ?? 0,
      previousLockedUntil: previousState?.lockedUntil?.toISOString(),
    }
  }

  // ─── 私有方法 ────────────────────────────────────────────────────────

  private generateAuthResult(
    user: MockUser,
    deviceInfo: any,
    loginType: LoginType,
  ): AuthResult {
    // 1. 创建会话
    this.sessionService.createSession(user.userId, user.tenantId, deviceInfo)

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
      permissions: user.permissions,
      avatar: user.avatar,
    }
  }

  private verifySmsCode(_mobile: string, code: string): boolean {
    // 简化版验证 - 生产应验证Redis缓存的验证码
    // 这里假设 '123456' 是有效的验证码
    return code === '123456'
  }

  private verifyPassword(password: string, hash: string): boolean {
    // 简化版验证 - 生产应使用bcrypt
    // 这里假设 'password123' 是有效密码
    return password === 'password123' || password === hash
  }

  private resolvePasswordLoginPrincipal(mobile?: string, email?: string): string | null {
    if (mobile && mobile.trim() !== '') {
      return `mobile:${mobile.trim()}`
    }
    if (email && email.trim() !== '') {
      return `email:${email.trim().toLowerCase()}`
    }
    return null
  }

  private isPasswordLoginLocked(state: PasswordAttemptState): boolean {
    return Boolean(state.lockedUntil && state.lockedUntil.getTime() > Date.now())
  }

  private isUserPasswordLocked(user: MockUser): boolean {
    return Boolean(user.lockedUntil && user.lockedUntil.getTime() > Date.now())
  }

  private async recordPasswordFailure(
    principal: string | null,
    currentState?: PasswordAttemptState,
    user?: MockUser,
  ): Promise<PasswordAttemptState> {
    if (principal && this.redisService) {
      const nextState = await this.incrementPasswordFailureStateRedis(principal)

      if (user) {
        this.syncPasswordAttemptStateToUser(user, nextState)
      }

      return nextState
    }

    const nextAttempts = (currentState?.failedAttempts ?? user?.failedAttempts ?? 0) + 1
    const locked = nextAttempts >= this.PASSWORD_LOCK_THRESHOLD
    const lockedUntil = locked
      ? new Date(Date.now() + this.PASSWORD_LOCK_SECONDS * 1000)
      : undefined
    const nextState = {
      failedAttempts: nextAttempts,
      lockedUntil,
      locked,
    }

    if (principal) {
      await this.storePasswordAttemptState(principal, nextState)
    }

    if (user) {
      this.syncPasswordAttemptStateToUser(user, nextState)
    }

    return nextState
  }

  private async incrementPasswordFailureStateRedis(principal: string): Promise<PasswordAttemptState> {
    const attemptsKey = this.getPasswordAttemptsRedisKey(principal)
    const lockKey = this.getPasswordLockRedisKey(principal)

    try {
      const nextAttempts = await this.redisService!.client.incr(attemptsKey)
      await this.redisService!.client.expire(attemptsKey, this.PASSWORD_LOCK_SECONDS)

      const locked = nextAttempts >= this.PASSWORD_LOCK_THRESHOLD
      const lockedUntil = locked
        ? new Date(Date.now() + this.PASSWORD_LOCK_SECONDS * 1000)
        : undefined

      if (locked && lockedUntil) {
        await this.redisService!.client.set(
          lockKey,
          lockedUntil.toISOString(),
          'EX',
          this.PASSWORD_LOCK_SECONDS,
        )
      }

      const nextState = {
        failedAttempts: nextAttempts,
        lockedUntil,
        locked,
      }
      this.passwordAttemptLedger.set(principal, nextState)
      return nextState
    } catch (error) {
      this.logger.warn(`Failed to increment password attempt state in redis: ${(error as Error).message}`)
      const fallbackState = this.passwordAttemptLedger.get(principal)
      return this.recordPasswordFailureWithoutRedis(principal, fallbackState)
    }
  }

  private recordPasswordFailureWithoutRedis(
    principal: string,
    currentState?: PasswordAttemptState,
  ): PasswordAttemptState {
    const nextAttempts = (currentState?.failedAttempts ?? 0) + 1
    const locked = nextAttempts >= this.PASSWORD_LOCK_THRESHOLD
    const lockedUntil = locked
      ? new Date(Date.now() + this.PASSWORD_LOCK_SECONDS * 1000)
      : undefined
    const nextState = {
      failedAttempts: nextAttempts,
      lockedUntil,
      locked,
    }
    this.passwordAttemptLedger.set(principal, nextState)
    return nextState
  }

  private async resetPasswordFailureState(principal: string | null, user?: MockUser): Promise<void> {
    if (principal) {
      await this.clearPasswordAttemptState(principal)
    }

    if (user) {
      this.syncPasswordAttemptStateToUser(user)
    }
  }

  private getPasswordLockRetryAfter(
    state: Pick<PasswordAttemptState, 'lockedUntil'>,
  ): number {
    if (!state.lockedUntil) {
      return 0
    }
    return Math.max(1, Math.ceil((state.lockedUntil.getTime() - Date.now()) / 1000))
  }

  private getUserLockRetryAfter(user: MockUser): number {
    return this.getPasswordLockRetryAfter({ lockedUntil: user.lockedUntil })
  }

  private logPasswordLockEvent(
    user: MockUser,
    principal: string | null,
    state: PasswordAttemptState,
  ): void {
    if (!this.auditService) {
      return
    }

    void this.auditService.log({
      eventType: 'auth.login_locked',
      actorId: user.userId,
      actorType: 'user',
      tenantId: user.tenantId,
      resourceType: 'auth-user',
      resourceId: user.userId,
      riskLevel: 'high',
      metadata: {
        principal,
        failedAttempts: state.failedAttempts,
        retryAfter: this.getPasswordLockRetryAfter(state),
        lockSeconds: this.PASSWORD_LOCK_SECONDS,
      },
    }).catch((error: Error) => {
      this.logger.warn(`Failed to record password lock audit event: ${error.message}`)
    })
  }

  private logPasswordUnlockEvent(
    user: MockUser,
    principal: string | null,
    previousState: PasswordAttemptState,
  ): void {
    if (!this.auditService) {
      return
    }

    void this.auditService.log({
      eventType: 'auth.login_unlocked',
      actorId: user.userId,
      actorType: 'user',
      tenantId: user.tenantId,
      resourceType: 'auth-user',
      resourceId: user.userId,
      riskLevel: previousState.lockedUntil ? 'high' : 'medium',
      metadata: {
        principal,
        clearedFailedAttempts: previousState.failedAttempts,
        previousLockedUntil: previousState.lockedUntil?.toISOString() ?? null,
        resetReason: 'successful-login',
      },
    }).catch((error: Error) => {
      this.logger.warn(`Failed to record password unlock audit event: ${error.message}`)
    })
  }

  private logPasswordUnlockOverrideEvent(
    user: MockUser | undefined,
    principal: string,
    previousState: PasswordAttemptState,
    actorId?: string,
    reason?: string,
  ): void {
    if (!this.auditService) {
      return
    }

    void this.auditService.log({
      eventType: 'auth.login_unlock_override',
      actorId: actorId?.trim() || 'system',
      actorType: actorId ? 'admin' : 'system',
      tenantId: user?.tenantId,
      resourceType: 'auth-user',
      resourceId: user?.userId ?? principal,
      riskLevel: previousState.lockedUntil ? 'high' : 'medium',
      metadata: {
        principal,
        clearedFailedAttempts: previousState.failedAttempts,
        previousLockedUntil: previousState.lockedUntil?.toISOString() ?? null,
        resetReason: 'manual-unlock',
        unlockReason: reason?.trim() || null,
      },
    }).catch((error: Error) => {
      this.logger.warn(`Failed to record password unlock override audit event: ${error.message}`)
    })
  }

  private getPasswordAttemptsRedisKey(principal: string): string {
    return `auth:password-attempts:${principal}`
  }

  private getPasswordLockRedisKey(principal: string): string {
    return `auth:password-lock:${principal}`
  }

  private async getPasswordAttemptState(principal: string): Promise<PasswordAttemptState | undefined> {
    if (this.redisService) {
      try {
        const [attemptsRaw, lockedUntilRaw] = await Promise.all([
          this.redisService.client.get(this.getPasswordAttemptsRedisKey(principal)),
          this.redisService.client.get(this.getPasswordLockRedisKey(principal)),
        ])

        const failedAttempts = attemptsRaw ? Number.parseInt(attemptsRaw, 10) : 0
        const lockedUntil = lockedUntilRaw ? this.getDate(lockedUntilRaw) ?? undefined : undefined

        if (failedAttempts > 0 || lockedUntil) {
          return {
            failedAttempts,
            lockedUntil,
            locked: Boolean(lockedUntil && lockedUntil.getTime() > Date.now()),
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to read password attempt state from redis: ${(error as Error).message}`)
      }
    }

    return this.passwordAttemptLedger.get(principal)
  }

  private async storePasswordAttemptState(
    principal: string,
    state: PasswordAttemptState,
  ): Promise<void> {
    this.passwordAttemptLedger.set(principal, state)

    if (!this.redisService) {
      return
    }

    try {
      const attemptsKey = this.getPasswordAttemptsRedisKey(principal)
      const lockKey = this.getPasswordLockRedisKey(principal)

      await this.redisService.client.set(
        attemptsKey,
        String(state.failedAttempts),
        'EX',
        this.PASSWORD_LOCK_SECONDS,
      )

      if (state.lockedUntil) {
        const ttl = this.getPasswordLockRetryAfter(state)
        await this.redisService.client.set(lockKey, state.lockedUntil.toISOString(), 'EX', ttl)
      } else {
        await this.redisService.client.del(lockKey)
      }
    } catch (error) {
      this.logger.warn(`Failed to persist password attempt state to redis: ${(error as Error).message}`)
    }
  }

  private async clearPasswordAttemptState(principal: string): Promise<void> {
    this.passwordAttemptLedger.delete(principal)

    if (!this.redisService) {
      return
    }

    try {
      await this.redisService.client.del(
        this.getPasswordAttemptsRedisKey(principal),
        this.getPasswordLockRedisKey(principal),
      )
    } catch (error) {
      this.logger.warn(`Failed to clear password attempt state from redis: ${(error as Error).message}`)
    }
  }

  private syncPasswordAttemptStateToUser(
    user: MockUser,
    state?: Pick<PasswordAttemptState, 'failedAttempts' | 'lockedUntil'>,
  ): void {
    user.failedAttempts = state?.failedAttempts ?? 0
    user.lockedUntil = state?.lockedUntil
  }

  private getDate(value: string): Date | null {
    const ts = Date.parse(value)
    return Number.isFinite(ts) ? new Date(ts) : null
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
      failedAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: undefined,
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
        failedAttempts: 0,
        lockedUntil: undefined,
        lastLoginAt: undefined,
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
        failedAttempts: 0,
        lockedUntil: undefined,
        lastLoginAt: undefined,
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
        failedAttempts: 0,
        lockedUntil: undefined,
        lastLoginAt: undefined,
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
  failedAttempts: number
  lockedUntil?: Date
  lastLoginAt?: Date
  avatar?: string
}

interface PasswordAttemptState {
  failedAttempts: number
  lockedUntil?: Date
  locked?: boolean
}
