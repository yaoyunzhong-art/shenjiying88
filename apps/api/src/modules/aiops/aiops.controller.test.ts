import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { AIOpsController } from './aiops.controller'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'

describe('AIOpsController', () => {
  let controller: AIOpsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    const detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  describe('POST /aiops/detect', () => {
    it('should detect anomaly with sufficient data', async () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        value: 50 + Math.random() * 10,
      }))
      const result = await controller.detect({ metricName: 'mem_usage', value: 95, history })
      expect(result.data.metricName).toBe('mem_usage')
      expect(result.data.isAnomaly).toBeDefined()
      expect(result.data.detectedAt).toBeDefined()
    })

    it('should return isAnomaly=false with insufficient data', async () => {
      const result = await controller.detect({ metricName: 'new_metric', value: 100, history: [] })
      expect(result.data.isAnomaly).toBe(false)
      expect(result.data.anomalyScore).toBe(0)
    })
  })

  describe('POST /aiops/predict', () => {
    it('should predict future values', () => {
      const result = controller.predict({ metricName: 'nonexistent', horizon: 5 })
      expect(result.data.predictedValues).toHaveLength(5)
    })
  })

  describe('POST /aiops/attack', () => {
    it('should detect attack for empty metric', () => {
      const result = controller.detectAttack({ metricName: 'unknown' })
      expect(result.data.isUnderAttack).toBe(false)
    })
  })

  describe('POST /aiops/heal', () => {
    it('should trigger healing', async () => {
      const result = await controller.heal({ targetSystem: 'web-01' })
      expect(result.data.id).toBeDefined()
      expect(result.data.targetSystem).toBe('web-01')
    })
  })

  describe('GET /aiops/status', () => {
    it('should return engine status', () => {
      const result = controller.getStatus()
      expect(result.data.status).toBe('ACTIVE')
      expect(result.data.engineName).toBe('AIOpsPredictionService')
    })
  })

  describe('GET /aiops/health', () => {
    it('should return health of all tracked systems', () => {
      const result = controller.getHealth()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })
})
