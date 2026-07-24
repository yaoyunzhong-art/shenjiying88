/**
 * 未成年保护集成测试 — HTTP请求全链验证
 * 
 * 覆盖6个端点: config / verify / verifications / verifications/:id / check-access / access-logs
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { MinorProtectionModule } from './minor-protection.module'

describe('MinorProtection Integration (HTTP)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [MinorProtectionModule],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  // ─── 1. GET /minor-protection/config ──────────────────────────────
  describe('GET /minor-protection/config', () => {
    it('returns default config with curfewStart=22:00', async () => {
      const res = await request(app.getHttpServer())
        .get('/minor-protection/config')
        .expect(200)
      expect(res.body.curfewStart).toBe('22:00')
      expect(res.body.maxSessionMinutes).toBeGreaterThan(0)
    })
  })

  // ─── 2. POST /minor-protection/verify ─────────────────────────────
  describe('POST /minor-protection/verify', () => {
    it('identifies minor (age < 18)', async () => {
      const res = await request(app.getHttpServer())
        .post('/minor-protection/verify')
        .send({
          tenantId: 't-int-1',
          memberId: 'm-kid-1',
          method: 'id_card',
          identityNumber: '110101200901011234',
          name: '小王',
          birthday: '2009-01-01',
        })
        .expect(201)
      expect(res.body.isMinor).toBe(true)
      expect(res.body.id).toBeDefined()
    })

    it('identifies adult (age >= 18)', async () => {
      const res = await request(app.getHttpServer())
        .post('/minor-protection/verify')
        .send({
          tenantId: 't-int-1',
          memberId: 'm-adult-1',
          method: 'id_card',
          identityNumber: '110101199501011234',
          name: '老王',
          birthday: '1995-01-01',
        })
        .expect(201)
      expect(res.body.isMinor).toBe(false)
    })

    it('masks identity number', async () => {
      const res = await request(app.getHttpServer())
        .post('/minor-protection/verify')
        .send({
          tenantId: 't-int-1',
          memberId: 'm-mask-1',
          method: 'id_card',
          identityNumber: '110101200901015678',
          name: '小张',
          birthday: '2009-01-01',
        })
        .expect(201)
      expect(res.body.identityNumber).toContain('****')
    })
  })

  // ─── 3. GET /minor-protection/verifications ───────────────────────
  describe('GET /minor-protection/verifications', () => {
    beforeAll(async () => {
      // Seed a verification record
      await request(app.getHttpServer())
        .post('/minor-protection/verify')
        .send({ tenantId: 't-int-2', memberId: 'm-list-1', method: 'id_card', identityNumber: '110101200901019999', name: '列表测试', birthday: '2009-01-01' })
    })

    it('lists verifications by tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/minor-protection/verifications?tenantId=t-int-2')
        .expect(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('returns empty for unknown tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/minor-protection/verifications?tenantId=t-nonexist')
        .expect(200)
      expect(res.body).toEqual([])
    })
  })

  // ─── 4. GET /minor-protection/verifications/:id ──────────────────
  describe('GET /minor-protection/verifications/:id', () => {
    let recordId: string

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/minor-protection/verify')
        .send({ tenantId: 't-int-3', memberId: 'm-get-1', method: 'id_card', identityNumber: '110101200901018888', name: '获取测试', birthday: '2009-01-01' })
      recordId = res.body.id
    })

    it('retrieves by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/minor-protection/verifications/${recordId}?tenantId=t-int-3`)
        .expect(200)
      expect(res.body.id).toBe(recordId)
      expect(res.body.name).toBe('获取测试')
    })

    it('returns 404 for unknown id', async () => {
      await request(app.getHttpServer())
        .get('/minor-protection/verifications/nonexistent-id?tenantId=t-int-3')
        .expect(404)
    })
  })

  // ─── 5. POST /minor-protection/check-access ──────────────────────
  describe('POST /minor-protection/check-access', () => {
    it('returns review for unverified user', async () => {
      const res = await request(app.getHttpServer())
        .post('/minor-protection/check-access')
        .send({ tenantId: 't-int-4', memberId: 'm-new', action: 'enter' })
        .expect(201)
      expect(res.body.result).toBe('review')
    })

    it('returns pass for verified adult', async () => {
      await request(app.getHttpServer())
        .post('/minor-protection/verify')
        .send({ tenantId: 't-int-4', memberId: 'm-adult-acc', method: 'id_card', identityNumber: '110101199501019999', name: '大人', birthday: '1995-01-01' })
      const res = await request(app.getHttpServer())
        .post('/minor-protection/check-access')
        .send({ tenantId: 't-int-4', memberId: 'm-adult-acc', action: 'enter' })
        .expect(201)
      expect(res.body.result).toBe('pass')
    })
  })

  // ─── 6. GET /minor-protection/access-logs ────────────────────────
  describe('GET /minor-protection/access-logs', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/minor-protection/check-access')
        .send({ tenantId: 't-int-5', memberId: 'm-log', action: 'enter' })
    })

    it('returns access logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/minor-protection/access-logs?tenantId=t-int-5')
        .expect(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('respects limit param', async () => {
      const res = await request(app.getHttpServer())
        .get('/minor-protection/access-logs?tenantId=t-int-5&limit=1')
        .expect(200)
      expect(res.body.length).toBeLessThanOrEqual(1)
    })
  })
})
