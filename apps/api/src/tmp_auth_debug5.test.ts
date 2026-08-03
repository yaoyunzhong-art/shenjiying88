import { describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuthModule } from './modules/auth/auth.module'

const TENANT_ID = 'tenant-001'
const USER_AGENT = 'Test'
const SMS_LOGIN_PATH = '/auth/login/sms'

async function buildApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AuthModule],
  }).compile()
  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

describe('debug5', () => {
  let app: INestApplication
  beforeEach(async () => { app = await buildApp() })
  afterEach(async () => { await app.close() })

  it('SMS login exact same as test file', async () => {
    const res = await request(app.getHttpServer())
      .post(SMS_LOGIN_PATH)
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', USER_AGENT)
      .send({ mobile: '13800138000', code: '123456' })
    
    console.log('Status:', res.status)
    console.log('Body keys:', Object.keys(res.body))
    console.log('data keys:', Object.keys(res.body.data || {}))
    console.log('Full body:', JSON.stringify(res.body).slice(0, 300))
    
    assert.equal(res.status, 200)
    assert.equal(res.body.success, true)
    assert.ok(res.body.data, 'data should exist')
    assert.ok(res.body.data.user, 'user should exist inside data')
  })
})
