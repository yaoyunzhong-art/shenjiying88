import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { AIOpsModule } from './aiops.module'
import { AIOpsController } from './aiops.controller'
import { AIOpsService } from './aiops.service'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'

describe('AIOpsModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AIOpsModule],
    }).compile()

    expect(module).toBeDefined()
    expect(module.get(AIOpsController)).toBeInstanceOf(AIOpsController)
    expect(module.get(AIOpsService)).toBeInstanceOf(AIOpsService)
    expect(module.get(AIOpsPredictionService)).toBeInstanceOf(AIOpsPredictionService)
    expect(module.get(TimeSeriesAnomalyDetector)).toBeInstanceOf(TimeSeriesAnomalyDetector)
    expect(module.get(SelfHealingService)).toBeInstanceOf(SelfHealingService)
  })

  it('should export AIOpsService', async () => {
    const module = await Test.createTestingModule({
      imports: [AIOpsModule],
    }).compile()

    const service = module.get(AIOpsService)
    expect(service.detectAnomaly).toBeTypeOf('function')
    expect(service.predict).toBeTypeOf('function')
    expect(service.detectAttack).toBeTypeOf('function')
    expect(service.heal).toBeTypeOf('function')
    expect(service.detectAndHeal).toBeTypeOf('function')
    expect(service.getEngineStatus).toBeTypeOf('function')
  })

  it('should detect anomaly via compiled module controller', async () => {
    const module = await Test.createTestingModule({
      imports: [AIOpsModule],
    }).compile()

    const controller = module.get(AIOpsController)
    const history = [
      { timestamp: new Date(Date.now() - 60000).toISOString(), value: 10 },
      { timestamp: new Date(Date.now() - 50000).toISOString(), value: 11 },
      { timestamp: new Date(Date.now() - 40000).toISOString(), value: 9 },
      { timestamp: new Date(Date.now() - 30000).toISOString(), value: 10 },
      { timestamp: new Date(Date.now() - 20000).toISOString(), value: 11 },
    ]
    const result = await controller.detect({
      metricName: 'test-metric',
      value: 999,
      history,
    })

    expect(result.data.metricName).toBe('test-metric')
    expect(result.data.isAnomaly).toBe(true)
    expect(result.data.anomalyScore).toBeGreaterThan(0.5)
  })

  it('should perform attack detection via compiled module', async () => {
    const module = await Test.createTestingModule({
      imports: [AIOpsModule],
    }).compile()

    const controller = module.get(AIOpsController)
    const result = controller.detectAttack({ metricName: 'unknown-metric' })
    expect(result.data.metricName).toBe('unknown-metric')
    expect(result.data.isUnderAttack).toBe(false)
  })

  it('should return engine status via compiled module', async () => {
    const module = await Test.createTestingModule({
      imports: [AIOpsModule],
    }).compile()

    const controller = module.get(AIOpsController)
    const result = controller.getStatus()
    expect(result.data.engineName).toBe('AIOpsPredictionService')
    expect(result.data.status).toBe('ACTIVE')
    expect(result.data.anomalyRulesCount).toBeGreaterThan(0)
  })
})
