/**
 * chain.controller.ts — 智能合约控制器
 *
 * 提供积分清算、分账合约、合约执行器、链上智能合约的 REST API
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
} from './smart-contract.service'
import { SettlementStatus, RevenueShareStatus } from './chain.entity'
import type { SettlementContract, RevenueShareContract as RevenueShareContractType, ContractExecutionResult } from './chain.entity'

// ─── 接口类型 ────────────────────────────────────────────────

interface ApiEnvelope<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

function ok<T>(data: T, message?: string): ApiEnvelope<T> {
  return { success: true, data, message }
}

function fail(error: string, message?: string): ApiEnvelope {
  return { success: false, error, message }
}

// ─── Controller ──────────────────────────────────────────────

@UseGuards(TenantGuard)
@Controller('chain')
export class ChainController {
  constructor(
    private readonly settlementContract: PointsSettlementContract,
    private readonly revenueShareContract: RevenueShareContract,
    private readonly contractExecutor: ContractExecutor,
    private readonly smartContractService: SmartContractService,
  ) {}

  // ════════════════════════════════════════════════════════════
  // 积分清算合约
  // ════════════════════════════════════════════════════════════

  @Post('settlements')
  createSettlement(
    @Body() body: { payerId: string; payerName: string; payees: Array<{ payeeId: string; payeeName: string; amount: number }> },
  ): ApiEnvelope<SettlementContract> {
    try {
      const contract = this.settlementContract.createSettlement(
        body.payerId,
        body.payerName,
        body.payees,
      )
      return ok(contract as unknown as SettlementContract, 'Settlement created')
    } catch (err) {
      throw new HttpException(
        fail('CREATE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('settlements/:id/approve')
  approveSettlement(@Param('id') id: string): ApiEnvelope<SettlementContract> {
    try {
      const contract = this.settlementContract.approveSettlement(id)
      return ok(contract as unknown as SettlementContract, 'Settlement approved')
    } catch (err) {
      throw new HttpException(
        fail('APPROVE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('settlements/:id/execute')
  executeSettlement(@Param('id') id: string): ApiEnvelope<SettlementContract> {
    try {
      const contract = this.settlementContract.executeSettlement(id)
      return ok(contract as unknown as SettlementContract, 'Settlement executed')
    } catch (err) {
      throw new HttpException(
        fail('EXECUTE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('settlements/:id/cancel')
  cancelSettlement(@Param('id') id: string): ApiEnvelope<SettlementContract> {
    try {
      const contract = this.settlementContract.cancelSettlement(id)
      return ok(contract as unknown as SettlementContract, 'Settlement cancelled')
    } catch (err) {
      throw new HttpException(
        fail('CANCEL_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('settlements/:id')
  getSettlement(@Param('id') id: string): ApiEnvelope<SettlementContract | null> {
    const contract = this.settlementContract.getContractState(id)
    if (!contract) {
      throw new HttpException(
        fail('NOT_FOUND', `Settlement ${id} not found`),
        HttpStatus.NOT_FOUND,
      )
    }
    return ok(contract as unknown as SettlementContract | null)
  }

  // ════════════════════════════════════════════════════════════
  // 分账合约
  // ════════════════════════════════════════════════════════════

  @Post('revenue-shares')
  createRevenueShare(
    @Body() body: { totalRevenue: number; participants: Array<{ participantId: string; participantName: string; ratio: number }> },
  ): ApiEnvelope<RevenueShareContractType> {
    try {
      const contract = this.revenueShareContract.createRevenueShare(
        body.totalRevenue,
        body.participants,
      )
      return ok(contract as unknown as RevenueShareContractType, 'Revenue share created')
    } catch (err) {
      throw new HttpException(
        fail('CREATE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('revenue-shares/:id/distribute')
  distributeRevenue(@Param('id') id: string): ApiEnvelope<RevenueShareContractType> {
    try {
      const contract = this.revenueShareContract.distributeRevenue(id)
      return ok(contract as unknown as RevenueShareContractType, 'Revenue distributed')
    } catch (err) {
      throw new HttpException(
        fail('DISTRIBUTE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('revenue-shares/:id')
  getRevenueShare(@Param('id') id: string): ApiEnvelope<RevenueShareContractType | null> {
    const contract = this.revenueShareContract.getContractState(id)
    if (!contract) {
      throw new HttpException(
        fail('NOT_FOUND', `Revenue share ${id} not found`),
        HttpStatus.NOT_FOUND,
      )
    }
    return ok(contract as unknown as RevenueShareContractType | null)
  }

  @Get('revenue-shares/:id/participant/:participantId')
  getParticipantShare(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ): ApiEnvelope<{ expected: number; actual: number; distributed: boolean } | null> {
    const share = this.revenueShareContract.getParticipantShare(id, participantId)
    if (!share) {
      throw new HttpException(
        fail('NOT_FOUND', 'Participant or contract not found'),
        HttpStatus.NOT_FOUND,
      )
    }
    return ok(share)
  }

  @Get('revenue-shares/:id/history')
  getShareHistory(@Param('id') id: string): ApiEnvelope {
    const history = this.revenueShareContract.queryShareHistory(id)
    return ok(history)
  }

  // ════════════════════════════════════════════════════════════
  // 合约执行器
  // ════════════════════════════════════════════════════════════

  @Post('executor/deploy')
  deployContract(
    @Body() body: { contractType: 'PointsSettlement' | 'RevenueShare'; params: Record<string, unknown> },
  ): ApiEnvelope {
    try {
      const result = this.contractExecutor.deployContract(body.contractType, body.params)
      return ok(result, 'Contract deployed')
    } catch (err) {
      throw new HttpException(
        fail('DEPLOY_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('executor/execute')
  executeContract(@Body() body: { contractId: string }): ApiEnvelope<ContractExecutionResult> {
    try {
      const result = this.contractExecutor.executeContract(body.contractId)
      return ok(result, result.success ? 'Contract executed' : 'Contract execution failed')
    } catch (err) {
      throw new HttpException(
        fail('EXECUTE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('executor/result/:contractId')
  getContractResult(@Param('contractId') contractId: string): ApiEnvelope<ContractExecutionResult | null> {
    const result = this.contractExecutor.getContractResult(contractId)
    if (!result) {
      throw new HttpException(
        fail('NOT_FOUND', `Execution result for ${contractId} not found`),
        HttpStatus.NOT_FOUND,
      )
    }
    return ok(result)
  }

  // ════════════════════════════════════════════════════════════
  // 链上智能合约
  // ════════════════════════════════════════════════════════════

  @Post('smart-contracts')
  async deploySmartContract(
    @Body() body: { name: string; params: string[] },
  ): Promise<ApiEnvelope> {
    try {
      const result = await this.smartContractService.deployContract(body.name, body.params)
      return ok(result, 'Smart contract deployed')
    } catch (err) {
      throw new HttpException(
        fail('DEPLOY_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('smart-contracts/execute')
  async executeSmartMethod(
    @Body() body: { contractId: string; method: string; args: string[] },
  ): Promise<ApiEnvelope> {
    try {
      const result = await this.smartContractService.executeContract(body.contractId, body.method, body.args)
      return ok(result, 'Method executed')
    } catch (err) {
      throw new HttpException(
        fail('EXECUTE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('smart-contracts/:id')
  async getSmartContract(@Param('id') id: string): Promise<ApiEnvelope> {
    try {
      const info = await this.smartContractService.getContractInfo(id)
      return ok(info)
    } catch (err) {
      throw new HttpException(
        fail('NOT_FOUND', err instanceof Error ? err.message : String(err)),
        HttpStatus.NOT_FOUND,
      )
    }
  }

  @Get('smart-contracts')
  async listSmartContracts(): Promise<ApiEnvelope> {
    const contracts = await this.smartContractService.listContracts()
    return ok(contracts)
  }

  @Post('smart-contracts/verify')
  async verifyContract(
    @Body() body: { contractId: string; sourceCode: string; compiler: string },
  ): Promise<ApiEnvelope> {
    try {
      const result = await this.smartContractService.verifyContract(body.contractId, body.sourceCode, body.compiler)
      return ok(result)
    } catch (err) {
      throw new HttpException(
        fail('VERIFY_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('smart-contracts/estimate-gas')
  async estimateGas(
    @Body() body: { contractId: string; method: string; args: string[] },
  ): Promise<ApiEnvelope> {
    try {
      const gas = await this.smartContractService.estimateGas(body.contractId, body.method, body.args)
      return ok({ gas })
    } catch (err) {
      throw new HttpException(
        fail('ESTIMATE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('smart-contracts/:id/events')
  async getContractEvents(@Param('id') id: string): Promise<ApiEnvelope> {
    const events = await this.smartContractService.getContractEvents(id)
    return ok(events)
  }

  @Post('smart-contracts/:id/query')
  async queryContract(
    @Param('id') id: string,
    @Body() body: { method: string },
  ): Promise<ApiEnvelope> {
    try {
      const state = await this.smartContractService.queryContract(id, body.method)
      return ok(state)
    } catch (err) {
      throw new HttpException(
        fail('QUERY_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
