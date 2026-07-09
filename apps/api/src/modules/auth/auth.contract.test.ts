// auth.contract.test.ts · 统一认证合约验证
// 验证: 合约接口与实体类型对齐 + 序列化/反序列化兼容性

import { describe, it, expect } from 'vitest'
import { LoginType } from './auth.types'
import type {
  LoginBySmsContract,
  LoginByPasswordContract,
  LoginByWechatContract,
  TokenRefreshContract,
  TokenPairContract,
  UserInfoContract,
  SessionContract,
  AuthResultContract,
  LogoutContract,
  PermissionCheckContract,
  PermissionCheckResultContract,
  RoleCheckContract,
  RoleCheckResultContract,
  TenantScopeContract,
} from './auth.contract'

describe('auth.contract.ts 合约定义验证', () => {

  // ─── 1. 登录合约 ─────────────────────────────────────────────────
  describe('LoginBySmsContract', () => {
    it('最小合约: 仅必填字段可通过', () => {
      const contract: LoginBySmsContract = {
        mobile: '13800138000',
        code: '123456',
      }
      expect(contract.mobile).toBe('13800138000')
      expect(contract.code).toBe('123456')
      expect(contract.deviceInfo).toBeUndefined()
    })

    it('完整合约: 包含设备信息', () => {
      const contract: LoginBySmsContract = {
        mobile: '13800138000',
        code: '123456',
        deviceInfo: {
          deviceId: 'dev-001',
          deviceType: 'mobile',
          browser: 'Chrome',
          os: 'iOS',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      }
      expect(contract.mobile).toBe('13800138000')
      expect(contract.deviceInfo?.deviceType).toBe('mobile')
      expect(contract.deviceInfo?.ip).toBe('192.168.1.1')
    })

    it('手机号长度认证: 11位标准手机号', () => {
      const contract: LoginBySmsContract = {
        mobile: '13800138000',
        code: '123456',
      }
      expect(contract.mobile.length).toBe(11)
      expect(/^1\d{10}$/.test(contract.mobile)).toBe(true)
    })

    it('验证码格式: 6位数字', () => {
      const contract: LoginBySmsContract = {
        mobile: '13900139000',
        code: '654321',
      }
      expect(contract.code.length).toBe(6)
      expect(/^\d{6}$/.test(contract.code)).toBe(true)
    })
  })

  describe('LoginByPasswordContract', () => {
    it('手机号+密码登录', () => {
      const contract: LoginByPasswordContract = {
        mobile: '13800138000',
        password: 'securePass123',
        loginType: LoginType.MOBILE_PASSWORD,
      }
      expect(contract.loginType).toBe(LoginType.MOBILE_PASSWORD)
      expect(contract.password.length).toBeGreaterThanOrEqual(6)
    })

    it('邮箱+密码登录', () => {
      const contract: LoginByPasswordContract = {
        email: 'user@example.com',
        password: 'emailPass456',
        loginType: LoginType.EMAIL_PASSWORD,
        deviceInfo: {
          deviceId: 'dev-002',
          deviceType: 'web',
        },
      }
      expect(contract.email).toBe('user@example.com')
      expect(contract.deviceInfo?.deviceType).toBe('web')
    })

    it('至少提供手机号或邮箱 (反例不应编译报错，由运行时校验)', () => {
      // 提供两者均无时 — 运行时应该校验
      const contract: LoginByPasswordContract = {
        password: 'pass123',
        loginType: LoginType.MOBILE_PASSWORD,
      }
      expect(contract.mobile).toBeUndefined()
      expect(contract.email).toBeUndefined()
      expect(contract.password).toBeDefined()
    })

    it('密码长度边界: 空密码', () => {
      const contract: LoginByPasswordContract = {
        mobile: '13800138000',
        password: '',
        loginType: LoginType.MOBILE_PASSWORD,
      }
      expect(contract.password).toBe('')
    })
  })

  describe('LoginByWechatContract', () => {
    it('仅code必填', () => {
      const contract: LoginByWechatContract = {
        code: 'wechat-auth-code-abc123',
      }
      expect(contract.code).toBe('wechat-auth-code-abc123')
    })

    it('附带设备信息', () => {
      const contract: LoginByWechatContract = {
        code: 'code-xyz',
        deviceInfo: {
          deviceId: 'dev-wechat-001',
          deviceType: 'tablet',
        },
      }
      expect(contract.deviceInfo?.deviceType).toBe('tablet')
    })
  })

  // ─── 2. Token 合约 ─────────────────────────────────────────────────
  describe('Token 合约', () => {
    it('TokenRefreshContract 字段完整性', () => {
      const contract: TokenRefreshContract = {
        refreshToken: 'rt_eyJhbGciOiJIUzI1NiJ9...',
      }
      expect(contract.refreshToken).toMatch(/^rt_/)
    })

    it('TokenPairContract 结构对齐', () => {
      const pair: TokenPairContract = {
        accessToken: 'at_eyJhbGci...',
        refreshToken: 'rt_eyJhbGci...',
        expiresIn: 7200,
        tokenType: 'Bearer',
      }
      expect(pair.tokenType).toBe('Bearer')
      expect(pair.expiresIn).toBeGreaterThan(0)
      expect(pair.accessToken).toMatch(/^at_/)
      expect(pair.refreshToken).toMatch(/^rt_/)
    })

    it('expiresIn 边界: 0 值', () => {
      const pair: TokenPairContract = {
        accessToken: 'at_test',
        refreshToken: 'rt_test',
        expiresIn: 0,
        tokenType: 'Bearer',
      }
      expect(pair.expiresIn).toBe(0)
    })

    it('expiresIn 边界: 大值 (30天)', () => {
      const pair: TokenPairContract = {
        accessToken: 'at_test',
        refreshToken: 'rt_test',
        expiresIn: 2592000,
        tokenType: 'Bearer',
      }
      expect(pair.expiresIn).toBe(2592000)
    })
  })

  // ─── 3. 用户合约 ─────────────────────────────────────────────────
  describe('UserInfoContract', () => {
    it('最小用户信息', () => {
      const user: UserInfoContract = {
        userId: 'u-001',
        tenantId: 't-default',
        roles: ['store_manager'],
      }
      expect(user.roles).toContain('store_manager')
      expect(user.nickname).toBeUndefined()
    })

    it('完整用户信息', () => {
      const user: UserInfoContract = {
        userId: 'u-002',
        tenantId: 't-store-a',
        mobile: '13900139000',
        email: 'manager@store.com',
        nickname: '张店长',
        roles: ['store_manager', 'operations'],
        avatar: 'https://cdn.example.com/avatars/u-002.png',
      }
      expect(user.nickname).toBe('张店长')
      expect(user.roles.length).toBe(2)
    })

    it('多角色场景', () => {
      const user: UserInfoContract = {
        userId: 'u-003',
        tenantId: 't-multi',
        roles: ['store_manager', 'marketing', 'hr'],
      }
      expect(user.roles.length).toBe(3)
      expect(user.roles.includes('marketing')).toBe(true)
    })

    it('空角色列表 (权限边界)', () => {
      const user: UserInfoContract = {
        userId: 'u-004',
        tenantId: 't-default',
        roles: [],
      }
      expect(user.roles).toEqual([])
    })
  })

  // ─── 4. 会话合约 ─────────────────────────────────────────────────
  describe('SessionContract', () => {
    it('活跃会话', () => {
      const now = Date.now()
      const session: SessionContract = {
        sessionId: 'sess-001',
        userId: 'u-001',
        tenantId: 't-default',
        deviceInfo: {
          deviceId: 'dev-001',
          deviceType: 'mobile',
          os: 'iOS',
        },
        createdAt: now - 3600000,
        lastActiveAt: now - 60000,
        expiresAt: now + 86340000,
        status: 'active',
      }
      expect(session.status).toBe('active')
      expect(session.expiresAt).toBeGreaterThan(session.createdAt)
    })

    it('过期会话', () => {
      const session: SessionContract = {
        sessionId: 'sess-expired',
        userId: 'u-001',
        tenantId: 't-default',
        deviceInfo: { deviceId: 'dev-old', deviceType: 'web' },
        createdAt: 1700000000000,
        lastActiveAt: 1700000000000,
        expiresAt: 1700086400000,
        status: 'expired',
      }
      expect(session.status).toBe('expired')
    })

    it('已撤销会话', () => {
      const session: SessionContract = {
        sessionId: 'sess-revoked',
        userId: 'u-001',
        tenantId: 't-default',
        deviceInfo: { deviceId: 'dev-hacked', deviceType: 'unknown' },
        createdAt: Date.now() - 7200000,
        lastActiveAt: Date.now() - 3600000,
        expiresAt: Date.now() + 3600000,
        status: 'revoked',
      }
      expect(session.status).toBe('revoked')
    })
  })

  // ─── 5. 认证结果合约 ─────────────────────────────────────────────
  describe('AuthResultContract', () => {
    it('认证成功结果', () => {
      const result: AuthResultContract = {
        success: true,
        user: {
          userId: 'u-001',
          tenantId: 't-default',
          roles: ['store_manager'],
        },
        tokens: {
          accessToken: 'at_test',
          refreshToken: 'rt_test',
          expiresIn: 7200,
          tokenType: 'Bearer',
        },
      }
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('认证失败结果', () => {
      const result: AuthResultContract = {
        success: false,
        error: {
          code: 'AUTH_008',
          message: 'Invalid SMS code',
          retryAfter: 60,
        },
      }
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('AUTH_008')
    })

    it('tokenType 必须为 Bearer (合约约束)', () => {
      const pair: TokenPairContract = {
        accessToken: 'at_bearer',
        refreshToken: 'rt_bearer',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }
      // 使用类型守卫模拟编译期约束
      const validTypes = ['Bearer'] as const
      expect(validTypes.includes(pair.tokenType)).toBe(true)
    })
  })

  // ─── 6. 登出合约 ─────────────────────────────────────────────────
  describe('LogoutContract', () => {
    it('登出指定会话', () => {
      const contract: LogoutContract = {
        sessionId: 'sess-001',
      }
      expect(contract.allSessions).toBeUndefined()
    })

    it('登出所有会话', () => {
      const contract: LogoutContract = {
        allSessions: true,
      }
      expect(contract.allSessions).toBe(true)
    })

    it('空操作: 无字段', () => {
      const contract: LogoutContract = {}
      expect(contract.sessionId).toBeUndefined()
      expect(contract.allSessions).toBeUndefined()
    })
  })

  // ─── 7. 权限/角色合约 ─────────────────────────────────────────────
  describe('权限与角色合约', () => {
    it('PermissionCheckContract 结构', () => {
      const check: PermissionCheckContract = {
        userId: 'u-001',
        tenantId: 't-default',
        permission: 'blindbox:purchase',
        resourceId: 'blindbox-001',
      }
      expect(check.permission).toMatch(/^[a-z]+:[a-z]+$/)
    })

    it('PermissionCheckResultContract: granted', () => {
      const result: PermissionCheckResultContract = {
        granted: true,
      }
      expect(result.granted).toBe(true)
    })

    it('PermissionCheckResultContract: denied', () => {
      const result: PermissionCheckResultContract = {
        granted: false,
        reason: 'Insufficient permissions',
      }
      expect(result.granted).toBe(false)
      expect(result.reason).toBeDefined()
    })

    it('RoleCheckContract 结构', () => {
      const check: RoleCheckContract = {
        userId: 'u-001',
        tenantId: 't-store-a',
        role: 'store_manager',
        storeId: 'store-001',
      }
      expect(check.role).toBe('store_manager')
    })

    it('RoleCheckResultContract: hasRole', () => {
      const result: RoleCheckResultContract = {
        hasRole: true,
        effectiveRoles: ['store_manager', 'operations'],
      }
      expect(result.effectiveRoles).toContain('store_manager')
    })
  })

  // ─── 8. 多租户隔离合约 ───────────────────────────────────────────
  describe('TenantScopeContract', () => {
    it('基本租户范围', () => {
      const scope: TenantScopeContract = {
        tenantId: 't-store-a',
        userId: 'u-001',
      }
      expect(scope.allowedStores).toBeUndefined()
    })

    it('限制门店范围', () => {
      const scope: TenantScopeContract = {
        tenantId: 't-chain-01',
        userId: 'u-002',
        allowedStores: ['store-001', 'store-002'],
        allowedModules: ['member', 'cashier', 'inventory'],
      }
      expect(scope.allowedStores?.length).toBe(2)
      expect(scope.allowedModules).toContain('member')
    })
  })

  // ─── 9. HTTP 合约对齐验证 ─────────────────────────────────────────
  describe('HTTP 合约序列化兼容性', () => {
    it('登录 SMS 请求可 JSON 序列化', () => {
      const req: LoginBySmsContract = {
        mobile: '13800138000',
        code: '123456',
        deviceInfo: { deviceId: 'd1', deviceType: 'web' },
      }
      const json = JSON.stringify(req)
      const parsed = JSON.parse(json)
      expect(parsed.mobile).toBe('13800138000')
      expect(parsed.deviceInfo.deviceId).toBe('d1')
    })

    it('认证结果可 JSON 序列化', () => {
      const result: AuthResultContract = {
        success: true,
        user: { userId: 'u1', tenantId: 't1', roles: ['admin'] },
        tokens: { accessToken: 'at', refreshToken: 'rt', expiresIn: 3600, tokenType: 'Bearer' },
      }
      const json = JSON.stringify(result)
      const parsed = JSON.parse(json)
      expect(parsed.success).toBe(true)
      expect(parsed.user.userId).toBe('u1')
    })

    it('错误结果可 JSON 序列化', () => {
      const result: AuthResultContract = {
        success: false,
        error: { code: 'AUTH_001', message: 'Invalid credentials' },
      }
      const parsed = JSON.parse(JSON.stringify(result))
      expect(parsed.error.code).toBe('AUTH_001')
    })

    it('会话日期为 number 类型 (时间戳)', () => {
      const session: SessionContract = {
        sessionId: 'sess-ts',
        userId: 'u1',
        tenantId: 't1',
        deviceInfo: { deviceId: 'd1', deviceType: 'mobile' },
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        status: 'active',
      }
      expect(typeof session.createdAt).toBe('number')
      expect(typeof session.expiresAt).toBe('number')
    })
  })
})
