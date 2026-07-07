/**
 * chain.module.ts — 智能合约模块
 *
 * 注册 PointsSettlementContract, RevenueShareContract, ContractExecutor, SmartContractService
 */

import { Module } from '@nestjs/common'
import { ChainController } from './chain.controller'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
} from './smart-contract.service'

@Module({
  controllers: [ChainController],
  providers: [
    PointsSettlementContract,
    RevenueShareContract,
    ContractExecutor,
    SmartContractService,
  ],
  exports: [
    PointsSettlementContract,
    RevenueShareContract,
    ContractExecutor,
    SmartContractService,
  ],
})
export class ChainModule {}
