// token.service.ts · JWT Token管理服务
// Phase-FP P0 · 2026-07-03

import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  AuthErrorCode,
  LoginType,
} from './auth.types'

// JWT配置
const TOKEN_CONFIG = {
  accessTokenExpiry: 2 * 60 * 60,        // 2小时 (秒)
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7天 (秒)
  algorithm: 'HS256',                   // 对称算法 (Phase-FP阶段使用，Phase-46切RS256)
  issuer: 'shenjiying-auth',
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name)

  // 内存存储 (生产环境应使用Redis)
  private readonly accessTokenBlacklist = new Set<string>()
  private readonly refreshTokens = new Map<string, RefreshTokenPayload>()

  /**
   * 生成Token对
   */
  generateTokenPair(
    userId: string,
    tenantId: string,
    roles: string[],
    permissions: string[],
    loginType: string,
    brandId?: string,
    storeId?: string,
  ): TokenPair {
    const now = Math.floor(Date.now() / 1000)

    // AccessToken
    const accessTokenId = randomUUID()
    const accessPayload: AccessTokenPayload = {
      sub: userId,
      tid: tenantId,
      bid: brandId,
      sid: storeId,
      roles,
      permissions,
      loginType: loginType as LoginType,
      exp: now + TOKEN_CONFIG.accessTokenExpiry,
      iat: now,
      iss: TOKEN_CONFIG.issuer,
      jti: accessTokenId,
    }

    // RefreshToken
    const refreshTokenId = randomUUID()
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      tid: tenantId,
      type: 'refresh',
      exp: now + TOKEN_CONFIG.refreshTokenExpiry,
      iat: now,
      jti: refreshTokenId,
    }

    // 生成JWT (简化版，生产应使用jsonwebtoken库)
    const accessToken = this.signToken(accessPayload)
    const refreshToken = this.signToken(refreshPayload)

    // 存储refreshToken用于验证
    this.refreshTokens.set(refreshTokenId, refreshPayload)

    this.logger.debug(`Generated tokens for user ${userId}, jti=${accessTokenId}`)

    return {
      accessToken,
      refreshToken,
      expiresIn: TOKEN_CONFIG.accessTokenExpiry,
      tokenType: 'Bearer',
    }
  }

  /**
   * 验证AccessToken
   */
  verifyAccessToken(token: string): { valid: boolean; payload?: AccessTokenPayload; error?: string } {
    try {
      const payload = this.parseToken(token) as AccessTokenPayload

      // 检查是否在黑名单
      if (this.accessTokenBlacklist.has(payload.jti)) {
        return { valid: false, error: 'Token has been revoked' }
      }

      // 检查是否过期
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        return { valid: false, error: 'Token has expired' }
      }

      // 检查issuer
      if (payload.iss !== TOKEN_CONFIG.issuer) {
        return { valid: false, error: 'Invalid token issuer' }
      }

      return { valid: true, payload }
    } catch (err) {
      return { valid: false, error: 'Invalid token format' }
    }
  }

  /**
   * 验证RefreshToken
   */
  verifyRefreshToken(token: string): { valid: boolean; payload?: RefreshTokenPayload; error?: string } {
    try {
      const payload = this.parseToken(token) as RefreshTokenPayload

      // 检查是否在有效期内
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        return { valid: false, error: 'Refresh token has expired' }
      }

      // 检查token是否存在
      if (!this.refreshTokens.has(payload.jti)) {
        return { valid: false, error: 'Refresh token not found' }
      }

      return { valid: true, payload }
    } catch (err) {
      return { valid: false, error: 'Invalid refresh token' }
    }
  }

  /**
   * 作废AccessToken (用于logout)
   */
  revokeAccessToken(jti: string): void {
    this.accessTokenBlacklist.add(jti)
    this.logger.debug(`Revoked access token: ${jti}`)
  }

  /**
   * 作废RefreshToken
   */
  revokeRefreshToken(jti: string): void {
    this.refreshTokens.delete(jti)
    this.logger.debug(`Revoked refresh token: ${jti}`)
  }

  /**
   * 作废用户所有Token
   */
  revokeAllUserTokens(userId: string): void {
    // 清除所有refreshToken
    for (const [jti, payload] of this.refreshTokens.entries()) {
      if (payload.sub === userId) {
        this.refreshTokens.delete(jti)
      }
    }
    this.logger.log(`Revoked all tokens for user ${userId}`)
  }

  /**
   * 获取Token剩余有效期
   */
  getTokenTTL(token: string): number {
    try {
      const payload = this.parseToken(token)
      const now = Math.floor(Date.now() / 1000)
      return Math.max(0, payload.exp - now)
    } catch {
      return 0
    }
  }

  // ─── 内部方法 ────────────────────────────────────────────────────────

  /**
   * 签名Token (简化版，生产应使用jsonwebtoken)
   */
  private signToken(payload: AccessTokenPayload | RefreshTokenPayload): string {
    // Base64URL编码
    const header = this.base64UrlEncode(JSON.stringify({ alg: TOKEN_CONFIG.algorithm, typ: 'JWT' }))
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(payload))
    const signature = this.base64UrlEncode(
      `${header}.${payloadEncoded}.shenjiying-secret-key`
    )
    return `${header}.${payloadEncoded}.${signature}`
  }

  /**
   * 解析Token
   */
  private parseToken(token: string): any {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }
    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8')
    return JSON.parse(payloadStr)
  }

  /**
   * Base64URL编码
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}
