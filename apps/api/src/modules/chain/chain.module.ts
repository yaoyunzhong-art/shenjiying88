/**
 * chain.module.ts — 智能合约模块
 *
 * 注册 PointsSettlementContract, RevenueShareContract, ContractExecutor,
 * SmartContractService, 以及门面服务 ChainService
 */

import { Module } from '@nestjs/common'
import { ChainController } from './chain.controller'
import { ChainService } from './chain.service'
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
    ChainService,
  ],
  exports: [
    PointsSettlementContract,
    RevenueShareContract,
    ContractExecutor,
    SmartContractService,
    ChainService,
  ],
})
export class ChainModule {}
