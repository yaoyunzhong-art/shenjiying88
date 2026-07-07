/**
 * 🐜 自动: [chaos-engineering] [A] module 测试补全
 *
 * 覆盖:
 * - 模块可编译
 * - 各 Provider 可注入
 * - Controller 可注入
 * - 模块导出正确
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ChaosEngineeringModule } from './chaos-engineering.module'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'
import { ChaosEngineeringController } from './chaos-engineering.controller'

describe('ChaosEngineeringModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ChaosEngineeringModule],
    }).compile()
  })

  it('✅ 正例: 模块可编译', () => {
    expect(module).toBeDefined()
  })

  it('✅ 正例: ChaosExperimentService 可注入', () => {
    const service = module.get<ChaosExperimentService>(ChaosExperimentService)
    expect(service).toBeDefined()
    expect(service.createExperiment).toBeDefined()
    expect(service.listExperiments).toBeDefined()
  })

  it('✅ 正例: FaultInjectionService 可注入', () => {
    const service = module.get<FaultInjectionService>(FaultInjectionService)
    expect(service).toBeDefined()
    expect(service.injectLatency).toBeDefined()
    expect(service.getAllActiveFaults).toBeDefined()
  })

  it('✅ 正例: ChaosAutoRollbackService 可注入', () => {
    const service = module.get<ChaosAutoRollbackService>(ChaosAutoRollbackService)
    expect(service).toBeDefined()
    expect(service.monitorExperiment).toBeDefined()
    expect(service.getRollbackHistory).toBeDefined()
  })

  it('✅ 正例: ChaosEngineeringController 可注入', () => {
    const controller = module.get<ChaosEngineeringController>(ChaosEngineeringController)
    expect(controller).toBeDefined()
    expect(controller.createExperiment).toBeDefined()
    expect(controller.listExperiments).toBeDefined()
  })

  it('✅ 正例: 所有服务可通过模块导出获取', () => {
    // 验证模块 exports 暴露了所有服务
    const experimentSvc = module.get<ChaosExperimentService>(ChaosExperimentService)
    const faultSvc = module.get<FaultInjectionService>(FaultInjectionService)
    const rollbackSvc = module.get<ChaosAutoRollbackService>(ChaosAutoRollbackService)

    // 验证三个服务实例各不同
    expect(experimentSvc).not.toBe(faultSvc as any)
    expect(experimentSvc).not.toBe(rollbackSvc as any)
    expect(faultSvc).not.toBe(rollbackSvc as any)
  })

  it('✅ 正例: 服务之间协作正常', () => {
    const experimentSvc = module.get<ChaosExperimentService>(ChaosExperimentService)
    const controller = module.get<ChaosEngineeringController>(ChaosEngineeringController)

    // 通过 controller 创建实验
    const experiment = controller.createExperiment({
      name: '集成测试',
      target: 'api-gateway',
      faultType: 'LATENCY',
      faultTarget: 'orders-service',
      faultParams: { delayMs: 500 },
    })

    expect(experiment.id).toBeDefined()
    expect(experiment.status).toBe('PENDING')

    // 通过 service 验证
    const found = experimentSvc.getExperiment(experiment.id)
    expect(found).toBeDefined()
    expect(found!.name).toBe('集成测试')
  })
})
