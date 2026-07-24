import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { MinorProtectionModule } from './minor-protection.module'
import { PrismaService } from '../../prisma/prisma.service'

const H = { 'x-tenant-id': 'test-tenant' }

describe('MinorProtection Integration (HTTP)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const m = await Test.createTestingModule({
      imports: [MinorProtectionModule],
    }).overrideProvider(PrismaService).useValue({
      minorIdentityVerification: { findMany: async () => [], upsert: async () => ({}), create: async () => ({}) },
      minorAccessLog: { findMany: async () => [], create: async () => ({}) },
      $connect: async () => {}, $disconnect: async () => {},
    } as any).compile()
    app = m.createNestApplication()
    await app.init()
  })

  afterAll(async () => { await app.close() })

  it('GET /config returns default config', async () => {
    const res = await request(app.getHttpServer())
      .get('/minor-protection/config').set(H).expect(200)
    expect(res.body.curfewStart).toBe('22:00')
  })

  it('POST /verify identifies minor', async () => {
    const res = await request(app.getHttpServer())
      .post('/minor-protection/verify').set(H).send({
        tenantId: 't1', memberId: 'm1', method: 'id_card',
        identityNumber: '110101200901011234', name: '小王', birthday: '2009-01-01',
      }).expect(201)
    expect(res.body.isMinor).toBe(true)
  })

  it('POST /verify masks identity', async () => {
    const res = await request(app.getHttpServer())
      .post('/minor-protection/verify').set(H).send({
        tenantId: 't2', memberId: 'm2', method: 'id_card',
        identityNumber: '110101200901015678', name: '小张', birthday: '2009-01-01',
      }).expect(201)
    expect(res.body.identityNumber).toContain('****')
  })

  it('GET /verifications lists records', async () => {
    await request(app.getHttpServer())
      .post('/minor-protection/verify').set(H).send({
        tenantId: 't3', memberId: 'm3', method: 'id_card',
        identityNumber: '110101200901019999', name: 'test', birthday: '2009-01-01',
      })
    const res = await request(app.getHttpServer())
      .get('/minor-protection/verifications?tenantId=t3').set(H).expect(200)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('POST /check-access returns review for unverified', async () => {
    const res = await request(app.getHttpServer())
      .post('/minor-protection/check-access').set(H).send({
        tenantId: 't4', memberId: 'm4', action: 'enter',
      }).expect(201)
    expect(res.body.result).toBe('review')
  })

  it('GET /access-logs returns logs', async () => {
    await request(app.getHttpServer())
      .post('/minor-protection/check-access').set(H).send({
        tenantId: 't5', memberId: 'm5', action: 'enter',
      })
    const res = await request(app.getHttpServer())
      .get('/minor-protection/access-logs?tenantId=t5').set(H).expect(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
