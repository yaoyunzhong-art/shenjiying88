import { afterEach, beforeEach, describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import request, { type Response } from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AuthModule } from './auth.module'
import { AuthErrorCode, LoginType } from './auth.types'
import { IdentityAccessGuard } from '../foundation/identity-access/identity-access.guard'
import { IdentityAccessService } from '../foundation/identity-access/identity-access.service'
import type { TenantAwareRequest } from '../tenant/tenant.types'

const PASSWORD_LOGIN_PATH = '/auth/login/password'
const SMS_LOGIN_PATH = '/auth/login/sms'
const WECHAT_LOGIN_PATH = '/auth/login/wechat'
const REFRESH_PATH = '/auth/refresh'
const LOGOUT_PATH = '/auth/logout'
const PASSWORD_UNLOCK_PATH = '/auth/locks/password/unlock'
const TENANT_ID = 'tenant-001'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'

type AuthErrorEnvelope = {
  code?: string
  retryAfter?: number
}

async function buildApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AuthModule],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  return app
}

async function buildGuardedApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AuthModule],
    providers: [Reflector, IdentityAccessService],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use((req: unknown, _res: unknown, next: () => void) => {
    const request = req as TenantAwareRequest & {
      headers: Record<string, string | string[] | undefined>
    }
    const roleHeader = request.headers['x-roles']
    const permissionHeader = request.headers['x-permissions']
    request.actorContext = {
      actorId: String(request.headers['x-actor-id'] ?? ''),
      actorType: 'platform-user',
      roles: typeof roleHeader === 'string' ? roleHeader.split(',').map((item) => item.trim()).filter(Boolean) : [],
      permissions: typeof permissionHeader === 'string' ? permissionHeader.split(',').map((item) => item.trim()).filter(Boolean) : [],
      authenticated: Boolean(request.headers['x-actor-id']),
      source: 'headers',
      tenantId: typeof request.headers['x-tenant-id'] === 'string' ? request.headers['x-tenant-id'] : undefined,
    }
    next()
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalGuards(new IdentityAccessGuard(app.get(Reflector), app.get(IdentityAccessService)))
  await app.init()

  return app
}

async function postPasswordLogin(
  app: INestApplication,
  body: {
    mobile?: string
    email?: string
    password: string
    loginType: LoginType
  },
): Promise<Response> {
  return request(app.getHttpServer())
    .post(PASSWORD_LOGIN_PATH)
    .set('x-tenant-id', TENANT_ID)
    .set('user-agent', USER_AGENT)
    .send(body)
}

function extractAuthError(res: Response): AuthErrorEnvelope {
  const body = res.body ?? {}
  const message = body.message

  if (message && typeof message === 'object') {
    return message as AuthErrorEnvelope
  }

  if (body && typeof body === 'object') {
    return body as AuthErrorEnvelope
  }

  return {}
}

function unwrapBodyData<T>(res: Response): T {
  const body = res.body ?? {}
  return (body.data?.data ?? body.data ?? body) as T
}

describe('Auth HTTP E2E', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('POST /auth/login/password 成功返回 user permissions', async () => {
    const res = await postPasswordLogin(app, {
      mobile: '13800138000',
      password: 'password123',
      loginType: LoginType.MOBILE_PASSWORD,
    })

    assert.equal(res.status, 200)
    const payload = unwrapBodyData<{
      user?: {
        userId?: string
        roles?: string[]
        permissions?: string[]
      }
    }>(res)
    assert.equal(payload.user?.userId, 'admin_001')
    assert.deepEqual(payload.user?.roles, ['PLATFORM_ADMIN'])
    assert.deepEqual(payload.user?.permissions, ['*'])
  })

  it('POST /auth/login/password 第 5 次错误密码返回 AUTH_005 锁定', async () => {
    for (let i = 1; i <= 4; i++) {
      const res = await postPasswordLogin(app, {
        mobile: '13800138000',
        password: `wrong-password-${i}`,
        loginType: LoginType.MOBILE_PASSWORD,
      })

      assert.equal(res.status, 401)
      assert.equal(extractAuthError(res).code, AuthErrorCode.INVALID_CREDENTIALS)
    }

    const locked = await postPasswordLogin(app, {
      mobile: '13800138000',
      password: 'wrong-password-5',
      loginType: LoginType.MOBILE_PASSWORD,
    })

    assert.equal(locked.status, 401)
    const error = extractAuthError(locked)
    assert.equal(error.code, AuthErrorCode.ACCOUNT_LOCKED)
    assert.ok(typeof error.retryAfter === 'number' && error.retryAfter > 0)
  })

  it('POST /auth/login/password 锁定后即使正确密码也继续返回 AUTH_005', async () => {
    for (let i = 1; i <= 5; i++) {
      await postPasswordLogin(app, {
        mobile: '13800138000',
        password: `wrong-password-${i}`,
        loginType: LoginType.MOBILE_PASSWORD,
      })
    }

    const blocked = await postPasswordLogin(app, {
      mobile: '13800138000',
      password: 'password123',
      loginType: LoginType.MOBILE_PASSWORD,
    })

    assert.equal(blocked.status, 401)
    const error = extractAuthError(blocked)
    assert.equal(error.code, AuthErrorCode.ACCOUNT_LOCKED)
    assert.ok(typeof error.retryAfter === 'number' && error.retryAfter > 0)
  })

  it('POST /auth/login/password 无租户头仍可成功 (@TenantOptional)', async () => {
    const res = await request(app.getHttpServer())
      .post(PASSWORD_LOGIN_PATH)
      .set('user-agent', USER_AGENT)
      .send({
        mobile: '13800138000',
        password: 'password123',
        loginType: LoginType.MOBILE_PASSWORD,
      })

    // @TenantOptional() 使租户头可选, 登录仍然成功
    assert.equal(res.status, 200)
    const payload = unwrapBodyData<{ user?: { userId?: string } }>(res)
    assert.equal(payload.user?.userId, 'admin_001')
  })

  it('其余 @Public() auth 端点在无租户头时不返回 Missing x-tenant-id', async () => {
    // SMS login (optional tenant), WeChat (invalid code), Refresh (invalid token), Logout (no token)
    // 全部用 @TenantOptional(), 不会返回 "Missing x-tenant-id header"

    // SMS: 租户可选, 应成功
    const smsRes = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })
    assert.equal(smsRes.status, 200)

    // WeChat: 租户可选, 但 code 无效返回 401
    const wechatRes = await request(app.getHttpServer())
      .post(WECHAT_LOGIN_PATH)
      .set('user-agent', USER_AGENT)
      .send({ code: 'wechat-code-demo' })
    assert.equal(wechatRes.status, 401)

    // Refresh: 租户可选, 无效 token 返回 401
    const refreshRes = await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .send({ refreshToken: 'refresh-token-demo' })
    assert.equal(refreshRes.status, 401)

    // Logout: 租户可选, 无 token 返回 401
    const logoutRes = await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('authorization', 'Bearer token-demo')
      .send({ allSessions: false })
    assert.equal(logoutRes.status, 401)
  })
})

describe('Auth HTTP Management E2E', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await buildGuardedApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('POST /auth/locks/password/unlock 需要 foundation.runtime-governance.write 权限', async () => {
    const unauthorized = await request(app.getHttpServer())
      .post(PASSWORD_UNLOCK_PATH)
      .set('x-tenant-id', TENANT_ID)
      .send({ mobile: '13800138000', reason: 'ops-unlock' })
    assert.equal(unauthorized.status, 401)

    const forbidden = await request(app.getHttpServer())
      .post(PASSWORD_UNLOCK_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.runtime-governance.read')
      .send({ mobile: '13800138000', reason: 'ops-unlock' })
    assert.equal(forbidden.status, 403)
  })

  it('POST /auth/locks/password/unlock 解锁后正确密码可重新登录', async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post(PASSWORD_LOGIN_PATH)
        .set('x-tenant-id', TENANT_ID)
        .set('user-agent', USER_AGENT)
        .send({
          mobile: '13800138000',
          password: `wrong-password-${i}`,
          loginType: LoginType.MOBILE_PASSWORD,
        })
    }

    const unlock = await request(app.getHttpServer())
      .post(PASSWORD_UNLOCK_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.runtime-governance.write')
      .send({
        mobile: '13800138000',
        reason: 'helpdesk-verified',
      })

    assert.equal(unlock.status, 200)
    const unlockPayload = unwrapBodyData<{ cleared?: boolean; clearedFailedAttempts?: number }>(unlock)
    assert.equal(unlockPayload.cleared, true)
    assert.equal(unlockPayload.clearedFailedAttempts, 5)

    const relogin = await postPasswordLogin(app, {
      mobile: '13800138000',
      password: 'password123',
      loginType: LoginType.MOBILE_PASSWORD,
    })

    assert.equal(relogin.status, 200)
    assert.equal(relogin.body.success, true)
  })
})

describe('Auth HTTP E2E - Enhanced', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  // ── SMS 登录 ──

  it('SMS login 成功: POST /auth/login/sms 返回 user + tokens', async () => {
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    const data = unwrapBodyData<{ user: any; accessToken: string; refreshToken: string }>(res)
    assert.ok(data.user)
    assert.equal(data.user.userId, 'admin_001')
    assert.ok(data.accessToken)
    assert.ok(data.refreshToken)
  })

  it('SMS login 错误验证码: POST /auth/login/sms 返回 AUTH_008', async () => {
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: 'wrong-code' })

    assert.equal(res.status, 401)
    assert.equal(extractAuthError(res).code, AuthErrorCode.SMS_CODE_ERROR)
  })

  it('SMS login 未知手机号自动创建用户返回 200', async () => {
    // AuthService 对未知手机号自动创建用户, 返回 200 success
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '19900000001', code: '123456' })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    const data = unwrapBodyData<{ accessToken: string }>(res)
    assert.ok(data.accessToken)
  })

  // ── WeChat 登录 ──

  it('WeChat login 无效 code 返回 AUTH_011', async () => {
    const res = await request(app.getHttpServer())
      .post(WECHAT_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ code: 'bad-wechat-code' })

    assert.equal(res.status, 401)
    assert.equal(extractAuthError(res).code, AuthErrorCode.WECHAT_LOGIN_FAILED)
  })

  it('WeChat login demo code 返回 AUTH_011 (mock 未实现成功路径)', async () => {
    const res = await request(app.getHttpServer())
      .post(WECHAT_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ code: 'wechat-code-demo' })

    assert.equal(res.status, 401)
    assert.equal(extractAuthError(res).code, AuthErrorCode.WECHAT_LOGIN_FAILED)
  })

  // ── Refresh Token ──

  it('Refresh token 有效: 通过 SMS 登录获取 token 后刷新', async () => {
    // 使用 SMS 登录获取 refreshToken
    const login = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })

    assert.equal(login.status, 200)
    const loginData = unwrapBodyData<{ accessToken: string; refreshToken: string }>(login)
    assert.ok(loginData.refreshToken)

    const refreshToken = loginData.refreshToken
    const res = await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('x-tenant-id', TENANT_ID)
      .send({ refreshToken })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    const refreshData = unwrapBodyData<{ accessToken: string; refreshToken: string }>(res)
    assert.ok(refreshData.accessToken)
    assert.ok(refreshData.refreshToken)
    // 新 token 应与原 token 不同
    assert.notEqual(refreshData.accessToken, loginData.accessToken)
  })

  it('Refresh token 无效: POST /auth/refresh 返回 AUTH_003', async () => {
    const res = await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('x-tenant-id', TENANT_ID)
      .send({ refreshToken: 'invalid-refresh-token-xxx' })

    assert.equal(res.status, 401)
    assert.equal(extractAuthError(res).code, AuthErrorCode.REFRESH_TOKEN_EXPIRED)
  })

  it('Refresh token 空字符串返回 401', async () => {
    const res = await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('x-tenant-id', TENANT_ID)
      .send({ refreshToken: '' })

    assert.equal(res.status, 401)
  })

  // ── Logout ──

  it('Logout 成功: 先 SMS 登录再登出', async () => {
    const login = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })

    assert.equal(login.status, 200)
    const loginData = unwrapBodyData<{ accessToken: string }>(login)

    const res = await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('authorization', `Bearer ${loginData.accessToken}`)
      .send({ allSessions: false })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
  })

  it('Logout 无 token 返回 401', async () => {
    const res = await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('x-tenant-id', TENANT_ID)
      .send({ allSessions: false })

    assert.equal(res.status, 401)
    assert.equal(res.body.message, 'No token provided')
  })

  it('Logout allSessions: true 不抛错', async () => {
    const login = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })

    assert.equal(login.status, 200)
    const loginData = unwrapBodyData<{ accessToken: string }>(login)

    const res = await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('authorization', `Bearer ${loginData.accessToken}`)
      .send({ allSessions: true })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
  })

  // ── GET /auth/me ──

  it('GET /auth/me 有有效 token 返回用户信息', async () => {
    const login = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })

    assert.equal(login.status, 200)
    const loginData = unwrapBodyData<{ accessToken: string }>(login)

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('x-tenant-id', TENANT_ID)
      .set('authorization', `Bearer ${loginData.accessToken}`)

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    const meData = unwrapBodyData<{ userId: string; roles: string[]; permissions: string[] }>(res)
    assert.equal(meData.userId, 'admin_001')
    assert.ok(meData.roles)
    assert.ok(meData.permissions)
  })

  it('GET /auth/me 无 token 返回 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('x-tenant-id', TENANT_ID)

    assert.equal(res.status, 401)
    assert.equal(res.body.message, 'No token provided')
  })

  it('GET /auth/me 无效 token (乱码) 返回 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('x-tenant-id', TENANT_ID)
      .set('authorization', 'Bearer invalid-token-xxx')

    assert.equal(res.status, 401)
    assert.ok(res.body.message)
  })

  // ── Password Login 错误场景 ──

  it('Password login 不存在的手机号返回 AUTH_001 User not found', async () => {
    const res = await postPasswordLogin(app, {
      mobile: '11111111111',
      password: 'TestP@ss888',
      loginType: LoginType.MOBILE_PASSWORD,
    })

    assert.equal(res.status, 401)
    assert.equal(extractAuthError(res).code, AuthErrorCode.INVALID_CREDENTIALS)
  })

  it('Password login 空密码返回 AUTH_001 Invalid password', async () => {
    const res = await request(app.getHttpServer())
      .post(PASSWORD_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({
        mobile: '13800138000',
        password: '',
        loginType: LoginType.MOBILE_PASSWORD,
      })

    assert.equal(res.status, 401)
  })

  it('Password login 缺少 mobile 和 email 返回 AUTH_001 User not found', async () => {
    const res = await request(app.getHttpServer())
      .post(PASSWORD_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({
        password: 'TestP@ss888',
        loginType: LoginType.MOBILE_PASSWORD,
      })

    assert.equal(res.status, 401)
  })

  // ── 并发场景 ──

  it('并发 SMS 登录多个不同手机号不抛错', async () => {
    const results = await Promise.all([
      request(app.getHttpServer()).post(SMS_LOGIN_PATH).set('x-tenant-id', TENANT_ID).set('user-agent', USER_AGENT).send({ mobile: '13800138000', code: '123456' }),
      request(app.getHttpServer()).post(SMS_LOGIN_PATH).set('x-tenant-id', TENANT_ID).set('user-agent', USER_AGENT).send({ mobile: '13800138001', code: '123456' }),
      request(app.getHttpServer()).post(SMS_LOGIN_PATH).set('x-tenant-id', TENANT_ID).set('user-agent', USER_AGENT).send({ mobile: '13800138002', code: '123456' }),
    ])

    assert.equal(results.length, 3)
    assert.ok(results.every(r => r.status === 200))
    assert.ok(results.every(r => r.body.success === true))
  })

  it('并发 SMS + Refresh 组合操作不抛错', async () => {
    // 先登录拿到 token
    const login = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })
    assert.equal(login.status, 200)

    const loginData = unwrapBodyData<{ accessToken: string; refreshToken: string }>(login)

    const results = await Promise.all([
      request(app.getHttpServer()).get('/auth/me').set('x-tenant-id', TENANT_ID).set('authorization', `Bearer ${loginData.accessToken}`),
      request(app.getHttpServer()).post(REFRESH_PATH).set('x-tenant-id', TENANT_ID).send({ refreshToken: loginData.refreshToken }),
      request(app.getHttpServer()).post(SMS_LOGIN_PATH).set('x-tenant-id', TENANT_ID).set('user-agent', USER_AGENT).send({ mobile: '13800138000', code: '123456' }),
    ])

    assert.equal(results[0].status, 200) // get me
    assert.equal(results[1].status, 200) // refresh
    assert.equal(results[2].status, 200) // SMS login
  })

  // ── 完整场景 ──

  it('完整流程: SMS 登录 → Refresh → Logout 全链路成功', async () => {
    // Step 1: SMS login
    const login = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })
    assert.equal(login.status, 200)
    const loginData = unwrapBodyData<{ accessToken: string; refreshToken: string }>(login)
    const token1 = loginData.accessToken
    const refreshToken = loginData.refreshToken

    // Step 2: GET /me
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('x-tenant-id', TENANT_ID)
      .set('authorization', `Bearer ${token1}`)
    assert.equal(me.status, 200)

    // Step 3: Refresh
    const refresh = await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('x-tenant-id', TENANT_ID)
      .send({ refreshToken })
    assert.equal(refresh.status, 200)
    const refreshData = unwrapBodyData<{ accessToken: string }>(refresh)
    const token2 = refreshData.accessToken

    // Step 4: Logout (with refreshed token)
    const logout = await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('authorization', `Bearer ${token2}`)
      .send({ allSessions: false })
    assert.equal(logout.status, 200)
  })

  // ── 鉴权 Guard 场景 ──

  it('Locks/unlock 端点需要 write 权限 (在 guarded app 上测试)', async () => {
    const guardedApp = await buildGuardedApp()
    try {
      const unauthorized = await request(guardedApp.getHttpServer())
        .post(PASSWORD_UNLOCK_PATH)
        .set('x-tenant-id', TENANT_ID)
        .send({ mobile: '13800138000', reason: 'test' })
      assert.equal(unauthorized.status, 401)

      const forbidden = await request(guardedApp.getHttpServer())
        .post(PASSWORD_UNLOCK_PATH)
        .set('x-tenant-id', TENANT_ID)
        .set('x-actor-id', 'ops-admin')
        .set('x-roles', 'OPERATIONS')
        .set('x-permissions', 'foundation.runtime-governance.read')
        .send({ mobile: '13800138000', reason: 'test' })
      assert.equal(forbidden.status, 403)
    } finally {
      await guardedApp.close()
    }
  })

  it('Locks/unlock 有 write 权限返回成功', async () => {
    const guardedApp = await buildGuardedApp()
    try {
      // 先用 unguarded app 锁住用户
      const res = await request(guardedApp.getHttpServer())
        .post(PASSWORD_UNLOCK_PATH)
        .set('x-tenant-id', TENANT_ID)
        .set('x-actor-id', 'ops-admin')
        .set('x-roles', 'OPERATIONS')
        .set('x-permissions', 'foundation.runtime-governance.write')
        .send({ mobile: '13800138000', reason: 'test' })

      // 即使没有锁, unlock 仍应返回成功
      assert.equal(res.status, 200)
    } finally {
      await guardedApp.close()
    }
  })

  // ── 无 x-tenant-id (TenantOptional)场景 ──
  // AuthController 使用 @TenantOptional(), 因此 x-tenant-id 不是强制要求的

  it('无租户头: SMS login 仍然成功 (因 @TenantOptional)', async () => {
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })

    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
  })

  it('无租户头: Refresh 无效 token 返回 AUTH_003 (而非 Missing x-tenant-id)', async () => {
    const res = await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .send({ refreshToken: 'demo' })

    assert.equal(res.status, 401)
    // TenantOptional 不拦截, token 校验失败
    assert.ok(extractAuthError(res).code === AuthErrorCode.REFRESH_TOKEN_EXPIRED)
  })

  it('无租户头: Logout 无效 token 返回 Invalid token (而非 Missing x-tenant-id)', async () => {
    const res = await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('authorization', 'Bearer demo')
      .send({ allSessions: false })

    assert.equal(res.status, 401)
    assert.equal(res.body.message, 'Invalid token')
  })

  it('无租户头: GET /auth/me 无效 token 返回 Invalid or expired token', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('authorization', 'Bearer demo123')

    assert.equal(res.status, 401)
    assert.equal(res.body.message, 'Invalid or expired token')
  })

  // ── 响应结构 ──

  it('SMS 登录响应结构包含所有必要字段', async () => {
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })

    assert.equal(res.status, 200)
    const data = unwrapBodyData<{
      user: { userId: string; tenantId: string; roles: string[]; permissions: string[] }
      accessToken: string
      refreshToken: string
      expiresIn: number
      tokenType: string
    }>(res)
    assert.ok(data.user.userId)
    assert.ok(data.user.tenantId)
    assert.ok(data.user.roles)
    assert.ok(data.user.permissions)
    assert.ok(data.accessToken, 'accessToken 必填')
    assert.ok(data.refreshToken, 'refreshToken 必填')
    assert.ok(data.expiresIn > 0, 'expiresIn 必填')
    assert.equal(data.tokenType, 'Bearer', 'tokenType 应为 Bearer')
  })
})
