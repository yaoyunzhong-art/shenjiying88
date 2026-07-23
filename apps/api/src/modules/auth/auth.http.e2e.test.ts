import { afterEach, beforeEach, describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request, { type Response } from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AuthModule } from './auth.module'
import { AuthErrorCode, LoginType } from './auth.types'

const PASSWORD_LOGIN_PATH = '/auth/login/password'
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
