import { describe, it } from 'vitest'
import 'reflect-metadata'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuthModule } from './modules/auth/auth.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

describe('debug3', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AuthModule] }).compile()
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()
  })

  afterAll(async () => { await app.close() })

  it('test SMS response format', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login/sms')
      .set('x-tenant-id', 'tenant-001')
      .set('user-agent', 'Test')
      .send({ mobile: '13800138000', code: '123456' })
    
    console.log('Status:', res.status)
    console.log('Full body:', JSON.stringify(res.body, null, 2))
  })
  
  it('test No tenant id', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('authorization', 'Bearer test')
    console.log('No tenant GET /me:', res.status, JSON.stringify(res.body))
  })
  
  it('test No tenant id for SMS', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login/sms')
      .set('user-agent', 'Test')
      .send({ mobile: '13800138000', code: '123456' })
    console.log('No tenant SMS:', res.status, JSON.stringify(res.body))
  })
  
  it('test No tenant id for Logout', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('authorization', 'Bearer test')
      .send({ allSessions: false })
    console.log('No tenant Logout:', res.status, JSON.stringify(res.body))
  })
  
  it('test No tenant id for Refresh', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'test' })
    console.log('No tenant Refresh:', res.status, JSON.stringify(res.body))
  })
})
