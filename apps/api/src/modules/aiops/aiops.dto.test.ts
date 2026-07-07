import 'reflect-metadata'
import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { validate } from 'class-validator'
import {
  AnomalyDetectRequestDto,
  PredictRequestDto,
  AttackDetectRequestDto,
  HealRequestDto,
  HistoryPointDto,
  AnomalyDetectResultDto,
  AttackDetectResultDto,
} from './aiops.dto'

function makeHistoryDto(): HistoryPointDto {
  const dto = new HistoryPointDto()
  dto.timestamp = new Date().toISOString()
  dto.value = 100
  return dto
}

describe('AIOps DTO Validation', () => {
  describe('HistoryPointDto', () => {
    it('should validate a valid history point', async () => {
      const dto = makeHistoryDto()
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject missing timestamp', async () => {
      const dto = new HistoryPointDto()
      dto.value = 100
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing value', async () => {
      const dto = new HistoryPointDto()
      dto.timestamp = new Date().toISOString()
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('AnomalyDetectRequestDto', () => {
    it('should validate a valid detect request', async () => {
      const dto = new AnomalyDetectRequestDto()
      dto.metricName = 'cpu'
      dto.value = 95
      dto.history = [makeHistoryDto()]
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject missing metricName', async () => {
      const dto = new AnomalyDetectRequestDto()
      dto.value = 95
      dto.history = [makeHistoryDto()]
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing value', async () => {
      const dto = new AnomalyDetectRequestDto()
      dto.metricName = 'cpu'
      dto.history = [makeHistoryDto()]
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing history', async () => {
      const dto = new AnomalyDetectRequestDto()
      dto.metricName = 'cpu'
      dto.value = 95
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept optional timestamp', async () => {
      const dto = new AnomalyDetectRequestDto()
      dto.metricName = 'cpu'
      dto.value = 95
      dto.history = [makeHistoryDto()]
      dto.timestamp = new Date().toISOString()
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('PredictRequestDto', () => {
    it('should validate valid predict request', async () => {
      const dto = new PredictRequestDto()
      dto.metricName = 'cpu'
      dto.horizon = 5
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject horizon < 1', async () => {
      const dto = new PredictRequestDto()
      dto.metricName = 'cpu'
      dto.horizon = 0
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject horizon > 100', async () => {
      const dto = new PredictRequestDto()
      dto.metricName = 'cpu'
      dto.horizon = 101
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing metricName', async () => {
      const dto = new PredictRequestDto()
      dto.horizon = 5
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('AttackDetectRequestDto', () => {
    it('should validate valid attack detect request', async () => {
      const dto = new AttackDetectRequestDto()
      dto.metricName = 'api_gateway'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject missing metricName', async () => {
      const dto = new AttackDetectRequestDto()
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('HealRequestDto', () => {
    it('should validate valid heal request', async () => {
      const dto = new HealRequestDto()
      dto.targetSystem = 'web-server-01'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject missing targetSystem', async () => {
      const dto = new HealRequestDto()
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('AnomalyDetectResultDto', () => {
    it('should create valid result DTO', () => {
      const dto = new AnomalyDetectResultDto()
      dto.metricName = 'cpu'
      dto.isAnomaly = true
      dto.anomalyScore = 0.9
      dto.severity = 'CRITICAL'
      dto.baseline = 50
      dto.deviation = 45
      dto.detectedAt = new Date().toISOString()
      expect(dto.metricName).toBe('cpu')
      expect(dto.severity).toBe('CRITICAL')
    })
  })

  describe('AttackDetectResultDto', () => {
    it('should create valid attack result DTO', () => {
      const dto = new AttackDetectResultDto()
      dto.metricName = 'api'
      dto.isUnderAttack = true
      dto.confidence = 0.85
      dto.attackType = 'ddos'
      dto.evidence = ['traffic spike']
      dto.detectedAt = new Date().toISOString()
      expect(dto.isUnderAttack).toBe(true)
      expect(dto.attackType).toBe('ddos')
      expect(dto.evidence).toHaveLength(1)
    })
  })
})
