import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { AnomalyDetectorModule } from './anomaly-detector.module'
import { AnomalyDetectorController } from './anomaly-detector.controller'
import { AnomalyDetectorService } from './anomaly-detector.service'

describe('AnomalyDetectorModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AnomalyDetectorModule],
    }).compile()

    expect(module).toBeDefined()
    expect(module.get(AnomalyDetectorController)).toBeInstanceOf(AnomalyDetectorController)
    expect(module.get(AnomalyDetectorService)).toBeInstanceOf(AnomalyDetectorService)
  })

  it('should export AnomalyDetectorService', async () => {
    const module = await Test.createTestingModule({
      imports: [AnomalyDetectorModule],
    }).compile()

    const service = module.get(AnomalyDetectorService)
    expect(service.detect).toBeTypeOf('function')
    expect(service.detectBatch).toBeTypeOf('function')
    expect(service.configure).toBeTypeOf('function')
  })

  it('should detect single metric anomaly via compiled module', async () => {
    const module = await Test.createTestingModule({
      imports: [AnomalyDetectorModule],
    }).compile()

    const controller = module.get(AnomalyDetectorController)
    const result = controller.detect({
      metricKey: 'test-metric',
      value: 999,
      history: [
        { timestamp: new Date().toISOString(), value: 10 },
        { timestamp: new Date().toISOString(), value: 11 },
        { timestamp: new Date().toISOString(), value: 9 },
        { timestamp: new Date().toISOString(), value: 10 },
        { timestamp: new Date().toISOString(), value: 11 },
      ],
    })

    expect(result.data.metricKey).toBe('test-metric')
    expect(result.data.severity).not.toBe('NORMAL')
    expect(result.data.score).toBeGreaterThan(0.5)
  })
})
