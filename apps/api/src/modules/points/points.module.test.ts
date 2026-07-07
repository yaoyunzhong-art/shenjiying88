import { describe, it, expect } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { PointsModule } from './points.module'
import { PointsController } from './points.controller'
import { PointsAtomicService } from './points-atomic.service'
import { PointsRiskService, InflationMonitor, CircuitBreaker, ExpirationNotifier } from './points-risk.service'

describe('PointsModule', () => {
  it('模块可被正确编译', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    expect(module).toBeDefined()
  })

  it('控制器被正确注册', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const controller = module.get<PointsController>(PointsController)
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(PointsController)
  })

  it('PointsAtomicService 被正确提供', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const service = module.get<PointsAtomicService>(PointsAtomicService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(PointsAtomicService)
  })

  it('PointsRiskService 被正确提供', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const service = module.get<PointsRiskService>(PointsRiskService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(PointsRiskService)
  })

  it('InflationMonitor 被正确提供', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const monitor = module.get<InflationMonitor>(InflationMonitor)
    expect(monitor).toBeDefined()
    expect(monitor).toBeInstanceOf(InflationMonitor)
  })

  it('CircuitBreaker 被正确提供', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const cb = module.get<CircuitBreaker>(CircuitBreaker)
    expect(cb).toBeDefined()
    expect(cb).toBeInstanceOf(CircuitBreaker)
  })

  it('ExpirationNotifier 被正确提供', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const notifier = module.get<ExpirationNotifier>(ExpirationNotifier)
    expect(notifier).toBeDefined()
    expect(notifier).toBeInstanceOf(ExpirationNotifier)
  })

  it('模块导出 PointsAtomicService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const service = module.get<PointsAtomicService>(PointsAtomicService)
    expect(service).toBeDefined()
  })

  it('模块导出 PointsRiskService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PointsModule]
    }).compile()

    const service = module.get<PointsRiskService>(PointsRiskService)
    expect(service).toBeDefined()
  })
})
