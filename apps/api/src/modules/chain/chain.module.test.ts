/**
 * chain.module.test.ts — 智能合约模块集成测试
 *
 * 验证模块可正确初始化并注入所有 provider
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ChainModule } from './chain.module'
import { ChainController } from './chain.controller'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
} from './smart-contract.service'

describe('ChainModule', () => {
  let moduleRef: TestingModule

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ChainModule],
    }).compile()
  })

  it('should compile the module', () => {
    expect(moduleRef).toBeDefined()
  })

  it('should provide PointsSettlementContract', () => {
    const provider = moduleRef.get<PointsSettlementContract>(PointsSettlementContract)
    expect(provider).toBeInstanceOf(PointsSettlementContract)
  })

  it('should provide RevenueShareContract', () => {
    const provider = moduleRef.get<RevenueShareContract>(RevenueShareContract)
    expect(provider).toBeInstanceOf(RevenueShareContract)
  })

  it('should provide ContractExecutor', () => {
    const provider = moduleRef.get<ContractExecutor>(ContractExecutor)
    expect(provider).toBeInstanceOf(ContractExecutor)
  })

  it('should provide SmartContractService', () => {
    const provider = moduleRef.get<SmartContractService>(SmartContractService)
    expect(provider).toBeInstanceOf(SmartContractService)
  })

  it('should instantiate ChainController', () => {
    const controller = moduleRef.get<ChainController>(ChainController)
    expect(controller).toBeInstanceOf(ChainController)
  })

  it('should have dependency injection in ChainController', () => {
    const controller = moduleRef.get<ChainController>(ChainController)
    // 验证 controller 的四个依赖都有注入
    expect((controller as any).settlementContract).toBeInstanceOf(PointsSettlementContract)
    expect((controller as any).revenueShareContract).toBeInstanceOf(RevenueShareContract)
    expect((controller as any).contractExecutor).toBeInstanceOf(ContractExecutor)
    expect((controller as any).smartContractService).toBeInstanceOf(SmartContractService)
  })
})
