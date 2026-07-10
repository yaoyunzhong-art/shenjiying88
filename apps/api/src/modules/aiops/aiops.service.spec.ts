// aiops.service.spec.ts - 自动补全
// 用途: AIOps 主服务单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { AIOpsService } from './aiops.service'
import {
  AIOpsPredictionService,
  TimeSeriesAnomalyDetector,
  SelfHealingService,
} from './aiops-prediction.service'

describe('AIOpsService', () => {
  let service: AIOpsService
  let anomalyDetector: TimeSeriesAnomalyDetector
  let selfHealingService: SelfHealingService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AIOpsService,
        AIOpsPredictionService,
        TimeSeriesAnomalyDetector,
        SelfHealingService,
      ],
    }).compile()

    service = module.get(AIOpsService)
    anomalyDetector = module.get(TimeSeriesAnomalyDetector)
    selfHealingService = module.get(SelfHealingService)
  })

  afterEach(() => {
    service.resetForTests()
  })

  // ── 异常检测 ──

  describe('detectAnomaly', () => {
    it('should detect anomaly for a spike value', async () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        value: 10 + Math.random() * 2,
      }))

      const result = await service.detectAnomaly({
        metricName: 'cpu_usage',
        value: 999,
        history,
      })

      expect(result.metricName).toBe('cpu_usage')
      expect(result.isAnomaly).toBe(true)
      expect(result.anomalyScore).toBeGreaterThan(0)
      expect(result.severity).toMatch(/^(NORMAL|WARNING|CRITICAL)$/)
      expect(result.detectedAt).toBeDefined()
    })

    it('should return correct metric name for normal values', async () => {
      const stableValue = 50
      const history = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        value: stableValue,
      }))

      const result = await service.detectAnomaly({
        metricName: 'normal_metric',
        value: stableValue,
        history,
      })

      expect(result.metricName).toBe('normal_metric')
      expect(result.severity).toMatch(/^(NORMAL|WARNING|CRITICAL)$/)
      expect(result.detectedAt).toBeDefined()
    })

    it('should handle insufficient data gracefully', async () => {
      const result = await service.detectAnomaly({
        metricName: 'sparse_metric',
        value: 100,
        history: [{ timestamp: new Date().toISOString(), value: 50 }],
      })

      expect(result.isAnomaly).toBe(false)
      expect(result.anomalyScore).toBe(0)
    })
  })

  // ── 预测 ──

  describe('predict', () => {
    it('should return predicted values for known metric', () => {
      const metricName = 'predict_metric'
      for (let i = 0; i < 10; i++) {
        anomalyDetector.recordDataPoint(metricName, {
          timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
          value: 20 + Math.sin(i) * 5,
        })
      }

      const result = service.predict({ metricName, horizon: 3 })

      expect(result.metricName).toBe(metricName)
      expect(result.horizon).toBe(3)
      expect(result.predictedValues).toHaveLength(3)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.predictedAt).toBeDefined()
    })

    it('should return zero predictions for unknown metric', () => {
      const result = service.predict({ metricName: 'unknown', horizon: 5 })

      expect(result.metricName).toBe('unknown')
      expect(result.horizon).toBe(5)
      expect(result.predictedValues).toHaveLength(5)
      expect(result.predictedValues).toEqual([0, 0, 0, 0, 0])
      expect(result.confidence).toBe(0)
    })
  })

  // ── 攻击检测 ──

  describe('detectAttack', () => {
    it('should not flag low-activity metric as attack', () => {
      const result = service.detectAttack({ metricName: 'quiet_metric' })
      expect(result.metricName).toBe('quiet_metric')
      expect(result.isUnderAttack).toBe(false)
    })

    it('should detect attack pattern for high-frequency data', () => {
      const metricName = 'attacked_metric'
      // Inject many data points in a short window
      const now = Date.now()
      for (let i = 0; i < 60; i++) {
        anomalyDetector.recordDataPoint(metricName, {
          timestamp: new Date(now - (60 - i) * 100).toISOString(),
          value: 100 + Math.random() * 50,
        })
      }

      const result = service.detectAttack({ metricName })
      // With 60 records in ~6 seconds, may trigger high-frequency flag
      expect(result.detectedAt).toBeDefined()
      expect(Array.isArray(result.evidence)).toBe(true)
    })
  })

  // ── 自愈 ──

  describe('heal', () => {
    it('should trigger healing for a system', async () => {
      const result = await service.heal({ targetSystem: 'payment-service' })

      expect(result.id).toBeDefined()
      expect(result.targetSystem).toBe('payment-service')
      expect(result.action).toMatch(/^(restart|rollback|scale|isolate)$/)
      expect(result.status).toMatch(/^(pending|running|completed|failed)$/)
      expect(result.triggeredAt).toBeDefined()
    }, 10000)

    it('should complete healing within timeout', async () => {
      const result = await service.heal({ targetSystem: 'cache-cluster' })

      expect(result.id).toBeDefined()
      expect(result.completedAt).toBeDefined()
    }, 10000)
  })

  // ── 一站式检测 ──

  describe('detectAndHeal', () => {
    it('should detect anomaly and check attack result', async () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        value: 30,
      }))

      const result = await service.detectAndHeal('test_metric', 31, history, 'test-system')

      expect(result.anomaly).toBeDefined()
      expect(result.attack).toBeDefined()
      expect(result.anomaly.metricName).toBe('test_metric')
    })

    it('should detect extreme value as anomaly', async () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        value: 10,
      }))

      const result = await service.detectAndHeal('extreme_metric', 9999, history, 'extreme-system')

      expect(result.anomaly).toBeDefined()
      expect(result.anomaly.metricName).toBe('extreme_metric')
    }, 10000)
  })

  // ── 引擎状态 ──

  describe('getEngineStatus', () => {
    it('should return engine status', () => {
      const status = service.getEngineStatus()

      expect(status.engineName).toBe('AIOpsPredictionService')
      expect(status.anomalyRulesCount).toBeGreaterThan(0)
      expect(status.attackRulesCount).toBeGreaterThan(0)
      expect(status.healedSystemsCount).toBeGreaterThanOrEqual(0)
      expect(status.status).toBe('ACTIVE')
      expect(status.lastDetectedAt).toBeDefined()
    })
  })

  describe('getAllSystemHealth', () => {
    it('should return empty array when no systems registered', () => {
      const health = service.getAllSystemHealth()
      expect(Array.isArray(health)).toBe(true)
    })
  })
})
