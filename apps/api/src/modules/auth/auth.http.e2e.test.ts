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
