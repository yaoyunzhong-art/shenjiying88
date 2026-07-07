import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AIOpsModule } from './aiops.module'

describe('AIOps E2E', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AIOpsModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /aiops/status', () => {
    it('should return 200 with engine status', async () => {
      const res = await request(app.getHttpServer()).get('/aiops/status')
      expect(res.status).toBe(200)
      expect(res.body.data.engineName).toBe('AIOpsPredictionService')
      expect(res.body.data.status).toBe('ACTIVE')
    })
  })

  describe('POST /aiops/detect', () => {
    it('should return 201 with anomaly detection result', async () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        value: 50,
      }))
      const res = await request(app.getHttpServer())
        .post('/aiops/detect')
        .send({ metricName: 'e2e-test', value: 60, history })
      expect(res.status).toBe(201)
      expect(res.body.data.metricName).toBe('e2e-test')
      expect(res.body.data.isAnomaly).toBeDefined()
    })

    it('should return 400 for missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/aiops/detect')
        .send({ metricName: 'test' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /aiops/predict', () => {
    it('should return 201 with predictions', async () => {
      const res = await request(app.getHttpServer())
        .post('/aiops/predict')
        .send({ metricName: 'e2e-predict', horizon: 3 })
      expect(res.status).toBe(201)
      expect(res.body.data.predictedValues).toHaveLength(3)
    })

    it('should return 400 for invalid horizon', async () => {
      const res = await request(app.getHttpServer())
        .post('/aiops/predict')
        .send({ metricName: 'test', horizon: 0 })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /aiops/attack', () => {
    it('should return 201 with attack detection', async () => {
      const res = await request(app.getHttpServer())
        .post('/aiops/attack')
        .send({ metricName: 'e2e-attack' })
      expect(res.status).toBe(201)
      expect(res.body.data.isUnderAttack).toBeDefined()
    })
  })

  describe('POST /aiops/heal', () => {
    it('should return 201 with healing result', async () => {
      const res = await request(app.getHttpServer())
        .post('/aiops/heal')
        .send({ targetSystem: 'e2e-system' })
      expect(res.status).toBe(201)
      expect(res.body.data.targetSystem).toBe('e2e-system')
    })

    it('should return 400 for missing targetSystem', async () => {
      const res = await request(app.getHttpServer())
        .post('/aiops/heal')
        .send({})
      expect(res.status).toBe(400)
    })
  })

  describe('GET /aiops/health', () => {
    it('should return 200 with health list', async () => {
      const res = await request(app.getHttpServer()).get('/aiops/health')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})
