import { describe, it, expect } from 'vitest'
import { Test } from '@nestjs/testing'
import { PerformanceModule } from './performance.module'
import { PerformanceService } from './performance.service'
import { PerformanceController } from './performance.controller'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'

describe('PerformanceModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [PerformanceModule],
    }).compile()

    expect(module).toBeDefined()
  })

  it('should provide PerformanceService', async () => {
    const module = await Test.createTestingModule({
      imports: [PerformanceModule],
    }).compile()

    const service = module.get<PerformanceService>(PerformanceService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(PerformanceService)
  })

  it('should provide PerformanceController', async () => {
    const module = await Test.createTestingModule({
      imports: [PerformanceModule],
    }).compile()

    const controller = module.get<PerformanceController>(PerformanceController)
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(PerformanceController)
  })

  it('should provide all sub-services', async () => {
    const module = await Test.createTestingModule({
      imports: [PerformanceModule],
    }).compile()

    expect(module.get(CacheTierService)).toBeDefined()
    expect(module.get(DBOptimizeService)).toBeDefined()
    expect(module.get(K6RunnerService)).toBeDefined()
    expect(module.get(K8sScaleService)).toBeDefined()
  })

  it('should export PerformanceService', async () => {
    const module = await Test.createTestingModule({
      imports: [PerformanceModule],
    }).compile()

    const service = module.get<PerformanceService>(PerformanceService)
    expect(service).toBeInstanceOf(PerformanceService)
  })
})
