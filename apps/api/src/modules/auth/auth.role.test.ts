import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AuthService } from './auth.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { LoginType, AuthErrorCode } from './auth.types'

// ── 角色定义 ──
const ROLES = {
  TenantAdmin: 'SM', Reception: 'RC', HR: 'HR', Safety: 'SF',
  Guide: 'GD', Ops: 'OP', Teambuilding: 'TB', Marketing: 'MK'
}

function makeSvc() {
  const ts = new TokenService()
  const ss = new SessionService()
  const as = new AuthService(ts, ss)
  return { ts, ss, as }
}

// ──────────── 👔店长 SM ────────────
describe(`${ROLES.TenantAdmin} Auth`, () => {
  it('loginBySms with valid code success', async () => {
    const { as, ss } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 'd1', deviceType: 'mobile' })
    assert.ok(r.success)
    assert.ok(r.user)
    assert.ok(r.user!.userId)
    assert.ok(r.user!.roles.length > 0)
    assert.ok(r.tokens)
    assert.ok(r.tokens!.accessToken)
    assert.ok(r.tokens!.refreshToken)
    assert.equal(r.tokens!.tokenType, 'Bearer')
    assert.ok(r.tokens!.expiresIn > 0)
    // 验证会话已创建
    const sessions = ss.getUserSessions(r.user!.userId)
    assert.ok(sessions.length >= 1)
  })

  it('loginByPassword with valid password success', async () => {
    const { as } = makeSvc()
    const r = await as.loginByPassword('13800138001', undefined, 'password123', LoginType.MOBILE_PASSWORD, { deviceId: 'd2', deviceType: 'web' })
    assert.ok(r.success)
    assert.ok(r.user)
    assert.ok(r.tokens)
  })

  it('loginByPassword with wrong password rejected', async () => {
    const { as } = makeSvc()
    const r = await as.loginByPassword('13800138001', undefined, 'wrongpass', LoginType.MOBILE_PASSWORD, { deviceId: 'd3', deviceType: 'web' })
    assert.ok(!r.success)
    assert.equal(r.error!.code, AuthErrorCode.INVALID_CREDENTIALS)
  })

  it('multi device login creates separate sessions', async () => {
    const { as, ss } = makeSvc()
    const r1 = await as.loginBySms('13800138000', '123456', { deviceId: 'phone1', deviceType: 'mobile' })
    assert.ok(r1.success)
    const r2 = await as.loginBySms('13800138000', '123456', { deviceId: 'phone2', deviceType: 'mobile' })
    assert.ok(r2.success)
    const sessions = ss.getUserSessions(r1.user!.userId)
    assert.ok(sessions.length >= 2)
  })

  it('店长全设备登出后会话全部清除', async () => {
    const { as, ss } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 'sm-pc', deviceType: 'web' })
    assert.ok(r.success)
    await as.loginBySms('13800138000', '123456', { deviceId: 'sm-phone', deviceType: 'mobile' })
    await as.loginBySms('13800138000', '123456', { deviceId: 'sm-tablet', deviceType: 'tablet' })
    await as.logout(r.user!.userId, undefined, true)
    const remaining = ss.getUserSessions(r.user!.userId)
    assert.equal(remaining.length, 0)
  })
})

// ──────────── 🛒前台 RC ────────────
describe(`${ROLES.Reception} Auth`, () => {
  it('login ok', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138002', '123456', { deviceId: 'r1', deviceType: 'web' })
    assert.ok(r.success)
    assert.ok(r.user)
    assert.ok(r.tokens)
  })

  it('wrong sms code rejected', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138002', '000000', { deviceId: 'r2', deviceType: 'web' })
    assert.ok(!r.success)
    assert.equal(r.error!.code, AuthErrorCode.SMS_CODE_ERROR)
  })

  it('nonexistent mobile auto-creates new account', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('19900199000', '123456', { deviceId: 'r3', deviceType: 'web' })
    assert.ok(r.success)
    assert.equal(r.user!.mobile, '19900199000')
    // same mobile gets same userId
    const r2 = await as.loginBySms('19900199000', '123456', { deviceId: 'r4', deviceType: 'web' })
    assert.equal(r2.user!.userId, r.user!.userId)
  })

  it('前台换班交接后新设备可登录同一账号', async () => {
    const { as } = makeSvc()
    const r1 = await as.loginBySms('13800138002', '123456', { deviceId: 'rc-morning', deviceType: 'web' })
    assert.ok(r1.success)
    const r2 = await as.loginBySms('13800138002', '123456', { deviceId: 'rc-afternoon', deviceType: 'web' })
    assert.ok(r2.success)
    assert.equal(r2.user!.userId, r1.user!.userId)
  })
})

// ──────────── 👥HR ────────────
describe(`${ROLES.HR} Auth`, () => {
  it('login by email password ok', async () => {
    const { as } = makeSvc()
    const r = await as.loginByPassword(undefined, 'admin@shenjiying.com', 'password123', LoginType.EMAIL_PASSWORD, { deviceId: 'h1', deviceType: 'web' })
    assert.ok(r.success)
    assert.equal(r.user!.email, 'admin@shenjiying.com')
  })

  it('login by unknown email rejected', async () => {
    const { as } = makeSvc()
    const r = await as.loginByPassword(undefined, 'unknown@test.com', 'password123', LoginType.EMAIL_PASSWORD, { deviceId: 'h2', deviceType: 'web' })
    assert.ok(!r.success)
    assert.equal(r.error!.code, AuthErrorCode.INVALID_CREDENTIALS)
  })

  it('refresh after logout fails', async () => {
    const { as } = makeSvc()
    const login = await as.loginBySms('13800138000', '123456', { deviceId: 'h3', deviceType: 'web' })
    assert.ok(login.success)
    await as.logout(login.user!.userId, undefined, true)
    // refresh with consumed token should fail
    const refresh = await as.refreshTokens(login.tokens!.refreshToken)
    assert.ok(!refresh.success)
  })

  it('HR 人事系统专用邮箱登录后正确记录信息', async () => {
    const { as } = makeSvc()
    const r = await as.loginByPassword(undefined, 'admin@shenjiying.com', 'password123', LoginType.EMAIL_PASSWORD, { deviceId: 'hr-portal', deviceType: 'web' })
    assert.ok(r.success)
    assert.equal(r.user!.email, 'admin@shenjiying.com')
    assert.ok(r.user!.userId)
  })
})

// ──────────── 🔧安监 SF ────────────
describe(`${ROLES.Safety} Auth`, () => {
  it('can view session list for a user', async () => {
    const { as, ss } = makeSvc()
    const r = await as.loginBySms('13800138001', '123456', { deviceId: 's1', deviceType: 'mobile' })
    assert.ok(r.success)
    const sessions = ss.getUserSessions(r.user!.userId)
    assert.ok(sessions.length >= 1)
    sessions.forEach(s => {
      assert.ok(s.sessionId)
      assert.ok(s.userId)
      assert.ok(['active', 'expired', 'revoked'].includes(s.status))
    })
  })

  it('brute force detection: wrong pw 5 次后应触发锁定', async () => {
    const { as } = makeSvc()
    let last
    for (let i = 0; i < 5; i++) {
      last = await as.loginByPassword('13800138000', undefined, 'wrong'+i, LoginType.MOBILE_PASSWORD, { deviceId: 'a'+i, deviceType: 'mobile' })
    }
    assert.equal(last!.success, false)
    assert.equal(last!.error!.code, AuthErrorCode.ACCOUNT_LOCKED)

    const blocked = await as.loginByPassword('13800138000', undefined, 'password123', LoginType.MOBILE_PASSWORD, { deviceId: 'legit', deviceType: 'mobile' })
    assert.equal(blocked.success, false)
    assert.equal(blocked.error!.code, AuthErrorCode.ACCOUNT_LOCKED)
  })

  it('安监监控会话过期检测', async () => {
    const { as, ss } = makeSvc()
    const r = await as.loginBySms('13800138001', '123456', { deviceId: 'sf-monitor', deviceType: 'web' })
    assert.ok(r.success)
    const sessions = ss.getUserSessions(r.user!.userId)
    const active = sessions.filter(s => s.status === 'active')
    assert.ok(active.length >= 1)
  })
})

// ──────────── 🎮导玩员 GD ────────────
describe(`${ROLES.Guide} Auth`, () => {
  it('login ok', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138002', '123456', { deviceId: 'g1', deviceType: 'tablet' })
    assert.ok(r.success)
  })

  it('token refresh works', async () => {
    const { as } = makeSvc()
    const login = await as.loginBySms('13800138000', '123456', { deviceId: 'g2', deviceType: 'tablet' })
    assert.ok(login.success)
    const refresh = await as.refreshTokens(login.tokens!.refreshToken)
    assert.ok(refresh.success)
    assert.ok(refresh.tokens)
    assert.notEqual(refresh.tokens!.accessToken, login.tokens!.accessToken)
  })

  it('导玩员用错误验证码无法登录', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138002', '000000', { deviceId: 'gd-wrong', deviceType: 'tablet' })
    assert.ok(!r.success)
    assert.equal(r.error!.code, AuthErrorCode.SMS_CODE_ERROR)
  })

  it('导玩员多设备签到: 同一账号手机+平板同时在线', async () => {
    const { as, ss } = makeSvc()
    const r1 = await as.loginBySms('13800138002', '123456', { deviceId: 'gd-phone', deviceType: 'mobile' })
    assert.ok(r1.success)
    const r2 = await as.loginBySms('13800138002', '123456', { deviceId: 'gd-tablet', deviceType: 'tablet' })
    assert.ok(r2.success)
    const sessions = ss.getUserSessions(r1.user!.userId)
    assert.ok(sessions.length >= 2)
  })
})

// ──────────── 🎯运行专员 OP ────────────
describe(`${ROLES.Ops} Auth`, () => {
  it('login ok', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 'o1', deviceType: 'web' })
    assert.ok(r.success)
  })

  it('multi-session management: login from 3 devices', async () => {
    const { as, ss } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 'pc', deviceType: 'web' })
    const r2 = await as.loginBySms('13800138000', '123456', { deviceId: 'ph', deviceType: 'mobile' })
    const r3 = await as.loginBySms('13800138000', '123456', { deviceId: 'tb', deviceType: 'tablet' })
    assert.ok(r.success && r2.success && r3.success)
    const sessions = ss.getUserSessions(r.user!.userId)
    assert.ok(sessions.length >= 2)
    // partial logout
    await as.logout(r.user!.userId, sessions[0].sessionId)
    const remaining = ss.getUserSessions(r.user!.userId)
    assert.ok(remaining.length < sessions.length)
  })

  it('运行专员错误密码无法登录', async () => {
    const { as } = makeSvc()
    const r = await as.loginByPassword('13800138000', undefined, 'wrong-password-ops', LoginType.MOBILE_PASSWORD, { deviceId: 'ops-fail', deviceType: 'web' })
    assert.ok(!r.success)
    assert.equal(r.error!.code, AuthErrorCode.INVALID_CREDENTIALS)
  })
})

// ──────────── 🤝团建 TB ────────────
describe(`${ROLES.Teambuilding} Auth`, () => {
  it('login ok', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 't1', deviceType: 'web' })
    assert.ok(r.success)
  })

  it('new phone auto-creates account and reuses on second login', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('15000150000', '123456', { deviceId: 'n1', deviceType: 'mobile' })
    assert.ok(r.success)
    assert.equal(r.user!.mobile, '15000150000')
    const r2 = await as.loginBySms('15000150000', '123456', { deviceId: 'n2', deviceType: 'mobile' })
    assert.equal(r2.user!.userId, r.user!.userId)
  })

  it('团建带队人手机号不匹配时无法登录', async () => {
    const { as } = makeSvc()
    // 使用一个在 mock 中不存在的手机号 + 错误验证码
    const r = await as.loginBySms('19999999999', '000000', { deviceId: 'tb-invalid', deviceType: 'mobile' })
    assert.ok(!r.success)
    assert.equal(r.error!.code, AuthErrorCode.SMS_CODE_ERROR)
  })

  it('团建活动后会话正常过期不影响后续活动', async () => {
    const { as, ss } = makeSvc()
    const r = await as.loginBySms('15000150000', '123456', { deviceId: 'tb-event1', deviceType: 'mobile' })
    assert.ok(r.success)
    const sessionsBefore = ss.getUserSessions(r.user!.userId)
    assert.ok(sessionsBefore.length >= 1)
    await as.logout(r.user!.userId, undefined, true)
    const sessionsAfter = ss.getUserSessions(r.user!.userId)
    assert.equal(sessionsAfter.length, 0)
    // 再次登录，新会话
    const r2 = await as.loginBySms('15000150000', '123456', { deviceId: 'tb-event2', deviceType: 'mobile' })
    assert.ok(r2.success)
    const sessionsNew = ss.getUserSessions(r2.user!.userId)
    assert.ok(sessionsNew.length >= 1)
  })
})

// ──────────── 📢营销 MK ────────────
describe(`${ROLES.Marketing} Auth`, () => {
  it('login ok', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 'm1', deviceType: 'web' })
    assert.ok(r.success)
  })

  it('logout then re-login ok', async () => {
    const { as } = makeSvc()
    const login = await as.loginBySms('13800138000', '123456', { deviceId: 'm2', deviceType: 'web' })
    assert.ok(login.success)
    await as.logout(login.user!.userId, undefined, true)
    const relogin = await as.loginBySms('13800138000', '123456', { deviceId: 'm3', deviceType: 'web' })
    assert.ok(relogin.success)
  })

  it('营销账号刷新令牌后旧令牌失效', async () => {
    const { as } = makeSvc()
    const login = await as.loginBySms('13800138000', '123456', { deviceId: 'mk-refresh', deviceType: 'web' })
    assert.ok(login.success)
    const refresh1 = await as.refreshTokens(login.tokens!.refreshToken)
    assert.ok(refresh1.success)
    // 用已使用过的 refresh token 再次刷新应失败
    const refresh2 = await as.refreshTokens(login.tokens!.refreshToken)
    assert.ok(!refresh2.success)
  })

  it('营销活动期间多设备公告推送需要稳定Token', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 'mk-pc', deviceType: 'web' })
    assert.ok(r.success)
    // 同一token可重复刷新（新token替换）
    const refresh1 = await as.refreshTokens(r.tokens!.refreshToken)
    assert.ok(refresh1.success)
    assert.notEqual(refresh1.tokens!.accessToken, r.tokens!.accessToken)
  })
})

// ──────────── 租户隔离 ────────────
describe('Auth Isolation', () => {
  it('different users have different userIds', async () => {
    const { as } = makeSvc()
    // 13800138000 is admin_001
    // 13800138001 is tenant_admin_001
    const r1 = await as.loginBySms('13800138000', '123456', { deviceId: 'x1', deviceType: 'mobile' })
    const r2 = await as.loginBySms('13800138001', '123456', { deviceId: 'x2', deviceType: 'mobile' })
    assert.ok(r1.success && r2.success)
    assert.notEqual(r1.user!.userId, r2.user!.userId)
  })

  it('existing user has correct roles', async () => {
    const { as } = makeSvc()
    const r = await as.loginBySms('13800138000', '123456', { deviceId: 'y1', deviceType: 'web' })
    assert.ok(r.user!.roles.includes('PLATFORM_ADMIN'))
  })

  it('different tenant users isolated by mobile', async () => {
    const { as } = makeSvc()
    const r1 = await as.loginBySms('13800138000', '123456', { deviceId: 'z1', deviceType: 'mobile' })
    const r2 = await as.loginBySms('13800138002', '123456', { deviceId: 'z2', deviceType: 'mobile' })
    assert.ok(r1.success && r2.success)
    assert.notEqual(r1.user!.userId, r2.user!.userId)
    assert.notEqual(r1.user!.tenantId, r2.user!.tenantId)
  })
})
