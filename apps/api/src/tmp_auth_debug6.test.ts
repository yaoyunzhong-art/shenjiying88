import { describe, it, beforeEach, afterEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuthModule } from './modules/auth/auth.module'

const TENANT_ID = 'tenant-001'
const USER_AGENT = 'Test'
const SMS_LOGIN_PATH = '/auth/login/sms'
const PASSWORD_LOGIN_PATH = '/auth/login/password'
const REFRESH_PATH = '/auth/refresh'
const LOGOUT_PATH = '/auth/logout'
const WECHAT_LOGIN_PATH = '/auth/login/wechat'
const PASSWORD_UNLOCK_PATH = '/auth/locks/password/unlock'

async function buildApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AuthModule],
  }).compile()
  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

// Same structure as auth.http.e2e.test.ts to reproduce the issue
describe('Outer', () => {
  let app: INestApplication
  beforeEach(async () => { app = await buildApp() })
  afterEach(async () => { await app.close() })
  
  it('outer test', async () => {
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH).set('x-tenant-id', TENANT_ID).set('user-agent', USER_AGENT).send({ mobile: '13800138000', code: '123456' })
    
    console.log('OUTER: res.body.data.keys:', Object.keys(res.body.data))
    console.log('OUTER: has user:', !!res.body.data.user)
    
    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data.user)
    assert.equal(res.body.data.user.userId, 'admin_001')
  })
})

describe('Enhanced', () => {
  let app: INestApplication
  beforeEach(async () => { app = await buildApp() })
  afterEach(async () => { await app.close() })
  
  it('inner SMS test', async () => {
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH).set('x-tenant-id', TENANT_ID).set('user-agent', USER_AGENT).send({ mobile: '13800138000', code: '123456' })
    
    console.log('INNER: res.body.data.keys:', Object.keys(res.body.data))
    console.log('INNER: has user:', !!res.body.data.user)
    
    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data.user)
    assert.equal(res.body.data.user.userId, 'admin_001')
  })
})
