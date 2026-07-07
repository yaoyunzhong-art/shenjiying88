import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// time-series.module.test.ts - Phase-19 T27
// 用途: time-series Module 集成测试
import { Test, TestingModule } from '@nestjs/testing'
import { TimeSeriesModule } from './time-series.module'
import { TimeSeriesController } from './time-series.controller'
import { TimeSeriesCollectorService } from './time-series-collector.service'

describe('TimeSeriesModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TimeSeriesModule],
    }).compile()
  })

  it('should compile the module', () => {
    expect(module).toBeDefined()
  })

  it('should provide TimeSeriesController', () => {
    const controller = module.get<TimeSeriesController>(TimeSeriesController)
    expect(controller).toBeDefined()
  })

  it('should provide TimeSeriesCollectorService', () => {
    const service = module.get<TimeSeriesCollectorService>(TimeSeriesCollectorService)
    expect(service).toBeDefined()
  })

  it('should export TimeSeriesCollectorService', () => {
    const exported = module.get<TimeSeriesCollectorService>(TimeSeriesCollectorService)
    expect(exported).toBeInstanceOf(TimeSeriesCollectorService)
  })

  it('should wire controller with service', async () => {
    const controller = module.get<TimeSeriesController>(TimeSeriesController)
    // Record a metric through the controller
    controller.record({ metricName: 'integration_test', value: 100 })
    // Query it back
    const result = controller.query({ metricName: 'integration_test', window: '24h' as const })
    expect(result.data.points.length).toBe(1)
    expect(result.data.points[0].value).toBe(100)
  })
})
