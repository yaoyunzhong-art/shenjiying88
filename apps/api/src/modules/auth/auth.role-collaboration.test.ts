import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [auth] [C] 角色协作场景测试
 *
 * 8 角色跨功能协作场景测试:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 场景覆盖:
 * - 各角色的登录/登出流程
 * - 角色特有的认证约束
 * - 权限边界 (越权访问/令牌过期)
 * - 多角色协作登录场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AuthService } from './auth.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { AuthErrorCode } from './auth.types'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 模拟设备工厂 ──
function device(deviceId: string, deviceType: 'web' | 'mobile' | 'tablet' | 'unknown' = 'mobile') {
  return { deviceId, deviceType }
}

// ── 测试辅助: 使用内置mock用户 ──
const ADMIN_PHONE = '13800138000'    // PLATFORM_ADMIN
const TENANT_ADMIN_PHONE = '13800138001'  // TENANT_ADMIN
const MEMBER_PHONE = '13800138002'    // MEMBER

function makeAuthEnv() {
  const tokenService = new TokenService()
  const sessionService = new SessionService()
  const authService = new AuthService(tokenService, sessionService)
  return { tokenService, sessionService, authService }
}

// ── 助手: 通用手机号密码登录 ──
async function loginByPassword(auth: AuthService, phone: string, password: string, dev?: any) {
  return auth.loginByPassword(phone, undefined, password, 'mobile_password' as any, dev ?? device('d-' + phone))
}

function loginBySms(auth: AuthService, phone: string, dev?: any) {
  return auth.loginBySms(phone, '123456', dev ?? device('d-sms-' + phone))
}

// ═══════════════════════════════════════════════════════════════
// 👔 店长 — 员工账号管理与门店权限总控
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} auth 协作测试`, () => {
  it('店长应能通过密码成功登录管理后台', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(authService, TENANT_ADMIN_PHONE, 'password123')
    assert.ok(result.success)
    assert.ok(result.user)
    assert.ok(result.tokens)
    assert.equal(result.tokens!.tokenType, 'Bearer')
    assert.ok(result.tokens!.expiresIn > 0)
  })

  it('店长登录后返回的用户信息包含角色', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(authService, TENANT_ADMIN_PHONE, 'password123')
    assert.ok(result.user)
    assert.ok(result.user!.roles.includes('TENANT_ADMIN'))
  })

  it('店长错误密码应被拒绝（权限边界）', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(authService, TENANT_ADMIN_PHONE, 'wrongpassword')
    assert.ok(!result.success)
    assert.equal(result.error!.code, AuthErrorCode.INVALID_CREDENTIALS)
  })

  it('店长应能通过短信验证码快捷登录', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginBySms(authService, TENANT_ADMIN_PHONE)
    assert.ok(result.success)
    assert.ok(result.tokens)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒 前台 — 收银系统快速登录
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} auth 协作测试`, () => {
  it('前台应通过密码登录收银终端', async () => {
    const { authService } = makeAuthEnv()
    // 使用 member 作为前台角色
    const result = await loginByPassword(authService, MEMBER_PHONE, 'password123')
    assert.ok(result.success)
    assert.ok(result.tokens)
  })

  it('前台从平板设备登录应能成功', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(
      authService, MEMBER_PHONE, 'password123',
      { deviceId: 'pos-tablet-01', deviceType: 'tablet' },
    )
    assert.ok(result.success)
  })

  it('前台连续输错密码应返回错误但不锁定（边界：服务端无硬锁定）', async () => {
    const { authService } = makeAuthEnv()
    for (let i = 0; i < 3; i++) {
      const r = await loginByPassword(authService, MEMBER_PHONE, 'wrongpwd')
      assert.ok(!r.success)
    }
    // 正确密码仍可登录
    const result = await loginByPassword(authService, MEMBER_PHONE, 'password123')
    assert.ok(result.success)
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥 HR — 员工入职认证与权限分配
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} auth 协作测试`, () => {
  it('HR 角色账户应可登录系统', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(authService, TENANT_ADMIN_PHONE, 'password123')
    assert.ok(result.success)
    assert.ok(result.user)
  })

  it('HR 应关注员工多设备登录行为', async () => {
    const { authService, sessionService } = makeAuthEnv()
    const r1 = await loginByPassword(
      authService, TENANT_ADMIN_PHONE, 'password123',
      { deviceId: 'hr-device-a', deviceType: 'web' },
    )
    assert.ok(r1.success)

    const r2 = await loginByPassword(
      authService, TENANT_ADMIN_PHONE, 'password123',
      { deviceId: 'hr-device-b', deviceType: 'mobile' },
    )
    assert.ok(r2.success)
  })

  it('HR 使用不存在的手机号应返回明确错误（边界）', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(authService, '19900000000', 'password123')
    assert.ok(!result.success)
    assert.equal(result.error!.code, AuthErrorCode.INVALID_CREDENTIALS)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧 安监 — 安全审计与异常检测
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Security} auth 协作测试`, () => {
  it('安监应能使用有效 SMS 验证码登录', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginBySms(authService, ADMIN_PHONE)
    assert.ok(result.success)
  })

  it('安监使用无效 SMS 验证码应被拒绝（边界：防暴力破解）', async () => {
    const { authService } = makeAuthEnv()
    const result = await authService.loginBySms(ADMIN_PHONE, '000000', device('sec-attack'))
    assert.ok(!result.success)
    assert.equal(result.error!.code, AuthErrorCode.SMS_CODE_ERROR)
  })

  it('安监应能刷新令牌维持长会话', async () => {
    const { authService } = makeAuthEnv()
    const login = await loginByPassword(authService, ADMIN_PHONE, 'password123')
    assert.ok(login.success)

    const refreshed = await authService.refreshTokens(login.tokens!.refreshToken)
    assert.ok(refreshed.success)
    assert.ok(refreshed.tokens)
    assert.notEqual(refreshed.tokens!.accessToken, login.tokens!.accessToken)
  })

  it('安监验证过期刷新令牌无法使用（安全边界）', async () => {
    const { authService } = makeAuthEnv()
    const result = await authService.refreshTokens('invalid-token-format')
    assert.ok(!result.success)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮 导玩员 — 移动端快速身份切换
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} auth 协作测试`, () => {
  it('导玩员应从移动端通过手机号密码登录', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(
      authService, MEMBER_PHONE, 'password123',
      { deviceId: 'guide-pad-01', deviceType: 'tablet' },
    )
    assert.ok(result.success)
    assert.ok(result.tokens)
  })

  it('导玩员应能通过短信验证码快速登录', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginBySms(authService, MEMBER_PHONE, device('guide-phone'))
    assert.ok(result.success)
  })

  it('导玩员登出后应清理会话（边界：设备交接）', async () => {
    const { authService, sessionService } = makeAuthEnv()
    const login = await loginBySms(authService, MEMBER_PHONE, device('guide-shift'))
    assert.ok(login.success)
    // 登出
    await authService.logout(login.user!.userId, undefined, true)
    const sessions = sessionService.getUserSessions(login.user!.userId)
    assert.equal(sessions.length, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运维监控与批量操作
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} auth 协作测试`, () => {
  it('运行专员应能从 Web 端密码登录', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(
      authService, ADMIN_PHONE, 'password123',
      { deviceId: 'ops-web-01', deviceType: 'web' },
    )
    assert.ok(result.success)
  })

  it('运行专员应支持微信扫码登录（备用通道）', async () => {
    const { authService } = makeAuthEnv()
    const result = await authService.loginByWechat('valid-wechat-code', device('ops-wechat'))
    assert.ok(result.success)
    assert.ok(result.tokens)
  })

  it('运行专员使用错误微信 code 应被拒绝（边界）', async () => {
    const { authService } = makeAuthEnv()
    const result = await authService.loginByWechat('invalid-code', device('ops-wechat-fail'))
    assert.ok(!result.success)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝 团建 — 活动临时账号与访客认证
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} auth 协作测试`, () => {
  it('团建协调员通过密码登录系统', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(authService, MEMBER_PHONE, 'password123')
    assert.ok(result.success)
  })

  it('团建应支持短信验证码登录（活动应急通道）', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginBySms(authService, MEMBER_PHONE, device('team-phone'))
    assert.ok(result.success)
  })

  it('团建协调员刷新令牌应正常工作', async () => {
    const { authService } = makeAuthEnv()
    const login = await loginByPassword(authService, MEMBER_PHONE, 'password123')
    assert.ok(login.success)
    const refreshed = await authService.refreshTokens(login.tokens!.refreshToken)
    assert.ok(refreshed.success)
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢 营销 — 营销活动账号管理
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} auth 协作测试`, () => {
  it('营销经理应通过密码登录', async () => {
    const { authService } = makeAuthEnv()
    const result = await loginByPassword(authService, ADMIN_PHONE, 'password123')
    assert.ok(result.success)
    assert.ok(result.tokens)
  })

  it('营销经理应能通过微信扫码登录', async () => {
    const { authService } = makeAuthEnv()
    const result = await authService.loginByWechat('valid-wechat-code', device('mkt-wechat'))
    assert.ok(result.success)
  })

  it('营销经理登出所有会话后会话列表应为空', async () => {
    const { authService, sessionService } = makeAuthEnv()
    const login = await loginByPassword(authService, ADMIN_PHONE, 'password123')
    assert.ok(login.success)
    await authService.logout(login.user!.userId, undefined, true)
    const sessions = sessionService.getUserSessions(login.user!.userId)
    assert.equal(sessions.length, 0)
  })

  it('营销经理使用空/无效令牌刷新应失败（边界）', async () => {
    const { authService } = makeAuthEnv()
    const result = await authService.refreshTokens('')
    assert.ok(!result.success)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🏛️ 跨角色协作 — 多角色同场景互操作
// ═══════════════════════════════════════════════════════════════
describe('auth 跨角色协作场景', () => {
  it('店长和普通会员可同时登录到不同设备（多角色并行会话）', async () => {
    const { authService } = makeAuthEnv()
    const mgrLogin = await loginByPassword(authService, TENANT_ADMIN_PHONE, 'password123')
    assert.ok(mgrLogin.success)
    const memberLogin = await loginByPassword(authService, MEMBER_PHONE, 'password123')
    assert.ok(memberLogin.success)
    assert.notEqual(mgrLogin.tokens!.accessToken, memberLogin.tokens!.accessToken)
  })

  it('同一用户从不同方式登录应生成不同令牌', async () => {
    const { authService } = makeAuthEnv()
    const r1 = await loginBySms(authService, ADMIN_PHONE, device('admin-phone'))
    assert.ok(r1.success)
    const r2 = await loginByPassword(authService, ADMIN_PHONE, 'password123', device('admin-web'))
    assert.ok(r2.success)
    assert.notEqual(r1.tokens!.accessToken, r2.tokens!.accessToken)
  })

  it('多角色登出后刷新令牌应全部失败', async () => {
    const { authService, sessionService } = makeAuthEnv()
    // 店长登录
    const mgr = await loginByPassword(authService, TENANT_ADMIN_PHONE, 'password123')
    assert.ok(mgr.success)
    const mgrRefreshToken = mgr.tokens!.refreshToken

    // 会员登录
    const member = await loginByPassword(authService, MEMBER_PHONE, 'password123')
    assert.ok(member.success)
    const memberRefreshToken = member.tokens!.refreshToken

    // 店长登出
    await authService.logout(mgr.user!.userId, undefined, true)

    // 店长刷新应失败
    const mgrRefresh = await authService.refreshTokens(mgrRefreshToken)
    assert.ok(!mgrRefresh.success)

    // 会员刷新仍应成功（各自独立）
    const memberRefresh = await authService.refreshTokens(memberRefreshToken)
    assert.ok(memberRefresh.success)
  })
})
