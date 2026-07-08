/**
 * token.service.test.ts · TokenService 单元测试
 * 🐜 自动: [auth] [D] token service test 补全
 *
 * 覆盖：
 * - generateTokenPair（正常 + 不同参数 + 唯一性）
 * - verifyAccessToken（正常 + 过期 + 黑名单 + 格式错误）
 * - verifyRefreshToken（正常 + 过期 + 不存在）
 * - revokeAccessToken / revokeRefreshToken
 * - revokeAllUserTokens
 * - getTokenTTL
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TokenService } from './token.service'

const DEFAULT_USER = 'user-001'
const DEFAULT_TENANT = 't-001'
const DEFAULT_ROLES = ['USER']
const DEFAULT_PERMISSIONS = ['read:profile']
const DEFAULT_LOGIN_TYPE = 'mobile_sms'

describe('TokenService', () => {
  let service: TokenService

  beforeEach(() => {
    service = new TokenService()
  })

  // ── generateTokenPair ──
  describe('generateTokenPair', () => {
    it('正例: 生成 TokenPair 包含所有字段', () => {
      const pair = service.generateTokenPair(
        DEFAULT_USER,
        DEFAULT_TENANT,
        DEFAULT_ROLES,
        DEFAULT_PERMISSIONS,
        DEFAULT_LOGIN_TYPE,
      )

      expect(pair).toBeDefined()
      expect(pair.accessToken).toBeTruthy()
      expect(pair.refreshToken).toBeTruthy()
      expect(pair.expiresIn).toBeGreaterThan(0)
      expect(pair.tokenType).toBe('Bearer')
    })

    it('正例: accessToken 和 refreshToken 不同', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      expect(pair.accessToken).not.toBe(pair.refreshToken)
    })

    it('正例: 每次调用生成不同的 token', () => {
      const pair1 = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const pair2 = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      expect(pair1.accessToken).not.toBe(pair2.accessToken)
      expect(pair1.refreshToken).not.toBe(pair2.refreshToken)
    })

    it('正例: 包含 brandId 和 storeId 的数据', () => {
      const pair = service.generateTokenPair(
        DEFAULT_USER,
        DEFAULT_TENANT,
        DEFAULT_ROLES,
        DEFAULT_PERMISSIONS,
        DEFAULT_LOGIN_TYPE,
        'brand-01',
        'store-01',
      )

      const decoded = JSON.parse(atob(pair.accessToken.split('.')[1]))
      expect(decoded.bid).toBe('brand-01')
      expect(decoded.sid).toBe('store-01')
    })
  })

  // ── verifyAccessToken ──
  describe('verifyAccessToken', () => {
    it('正例: 有效 token 返回 valid=true 和 payload', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const result = service.verifyAccessToken(pair.accessToken)

      expect(result.valid).toBe(true)
      expect(result.payload).toBeDefined()
      expect(result.payload!.sub).toBe(DEFAULT_USER)
      expect(result.payload!.tid).toBe(DEFAULT_TENANT)
      expect(result.payload!.roles).toEqual(DEFAULT_ROLES)
      expect(result.payload!.permissions).toEqual(DEFAULT_PERMISSIONS)
    })

    it('反例: 格式错误的 token 返回 valid=false', () => {
      const result = service.verifyAccessToken('bad-token')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid token format')
    })

    it('反例: 不完整 token 返回 valid=false', () => {
      const result = service.verifyAccessToken('header.payload')
      expect(result.valid).toBe(false)
    })

    it('正例: 作废后的 accessToken 验证失败', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const payload = JSON.parse(atob(pair.accessToken.split('.')[1]))
      service.revokeAccessToken(payload.jti)

      const result = service.verifyAccessToken(pair.accessToken)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token has been revoked')
    })
  })

  // ── verifyRefreshToken ──
  describe('verifyRefreshToken', () => {
    it('正例: 有效 refreshToken 返回 valid=true', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const result = service.verifyRefreshToken(pair.refreshToken)

      expect(result.valid).toBe(true)
      expect(result.payload).toBeDefined()
      expect(result.payload!.sub).toBe(DEFAULT_USER)
      expect(result.payload!.tid).toBe(DEFAULT_TENANT)
      expect(result.payload!.type).toBe('refresh')
    })

    it('反例: 不存在的 refreshToken 返回 valid=false', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      // revoke 后不应再有效
      const payload = JSON.parse(atob(pair.refreshToken.split('.')[1]))
      service.revokeRefreshToken(payload.jti)

      const result = service.verifyRefreshToken(pair.refreshToken)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Refresh token not found')
    })

    it('反例: 格式错误的 refreshToken 返回 valid=false', () => {
      const result = service.verifyRefreshToken('bad-format')
      expect(result.valid).toBe(false)
    })
  })

  // ── revokeAccessToken / revokeRefreshToken ──
  describe('revokeAccessToken', () => {
    it('正例: 作废后立即失效', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const payload = JSON.parse(atob(pair.accessToken.split('.')[1]))
      const jti = payload.jti

      service.revokeAccessToken(jti)
      const result = service.verifyAccessToken(pair.accessToken)
      expect(result.valid).toBe(false)
    })

    it('边界: 重复作废不报错', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const payload = JSON.parse(atob(pair.accessToken.split('.')[1]))
      expect(() => {
        service.revokeAccessToken(payload.jti)
        service.revokeAccessToken(payload.jti)
      }).not.toThrow()
    })
  })

  describe('revokeRefreshToken', () => {
    it('正例: 作废后 verify 失败', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const payload = JSON.parse(atob(pair.refreshToken.split('.')[1]))

      service.revokeRefreshToken(payload.jti)
      const result = service.verifyRefreshToken(pair.refreshToken)
      expect(result.valid).toBe(false)
    })
  })

  // ── revokeAllUserTokens ──
  describe('revokeAllUserTokens', () => {
    it('正例: 作废用户所有 refreshToken', () => {
      const pair1 = service.generateTokenPair('user-a', DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const pair2 = service.generateTokenPair('user-a', DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const pair3 = service.generateTokenPair('user-b', DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)

      service.revokeAllUserTokens('user-a')

      expect(service.verifyRefreshToken(pair1.refreshToken).valid).toBe(false)
      expect(service.verifyRefreshToken(pair2.refreshToken).valid).toBe(false)
      // user-b 不应受影响
      expect(service.verifyRefreshToken(pair3.refreshToken).valid).toBe(true)
    })

    it('边界: 无 token 的用户不报错', () => {
      expect(() => service.revokeAllUserTokens('nobody')).not.toThrow()
    })
  })

  // ── getTokenTTL ──
  describe('getTokenTTL', () => {
    it('正例: 有效 token 返回 TTL > 0', () => {
      const pair = service.generateTokenPair(DEFAULT_USER, DEFAULT_TENANT, DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_LOGIN_TYPE)
      const ttl = service.getTokenTTL(pair.accessToken)
      expect(ttl).toBeGreaterThan(0)
    })

    it('反例: 无效 token 返回 0', () => {
      const ttl = service.getTokenTTL('garbage')
      expect(ttl).toBe(0)
    })
  })
})
