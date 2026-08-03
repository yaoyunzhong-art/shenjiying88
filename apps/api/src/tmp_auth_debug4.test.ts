import { describe, it } from 'vitest'
import 'reflect-metadata'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuthModule } from './modules/auth/auth.module'
import { Reflector } from '@nestjs/core'

const TENANT_ID = 'tenant-001'

async function buildApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AuthModule] }).compile()
  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

describe('debug4', () => {
  let app: INestApplication
  beforeEach(async () => { app = await buildApp() })
  afterEach(async () => { await app.close() })

  it('SMS response format', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login/sms')
      .set('x-tenant-id', TENANT_ID)
      .set('user-agent', 'Test')
      .send({ mobile: '13800138000', code: '123456' })
    console.log('Status:', res.status)
    console.log('Body:', JSON.stringify(res.body, null, 2))
  })
  
  it('no tenant SMS', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login/sms')
      .set('user-agent', 'Test')
      .send({ mobile: '13800138000', code: '123456' })
    console.log('No tenant SMS:', res.status, JSON.stringify(res.body))
  })
  
  it('no tenant GET /me', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('authorization', 'Bearer test123')
    console.log('No tenant ME:', res.status, JSON.stringify(res.body))
  })
  
  it('no tenant Logout', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('authorization', 'Bearer test')
      .send({ allSessions: false })
    console.log('No tenant LOGOUT:', res.status, JSON.stringify(res.body))
  })
  
  it('no tenant Refresh', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'test' })
    console.log('No tenant REFRESH:', res.status, JSON.stringify(res.body))
  })
})
