/**
 * chain.service.ts — 智能合约门面服务
 *
 * 统一封装 PointsSettlementContract、RevenueShareContract、ContractExecutor、
 * SmartContractService 等基础服务，对外提供简洁的业务接口。
 */

import { Injectable } from '@nestjs/common'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
  SettlementStatus,
  RevenueShareStatus,
  type SettlementContractData,
  type RevenueShareContractData,
  type ContractExecutionResult,
  type ShareHistoryEntry,
} from './smart-contract.service'

// ─── 通用响应包装 ────────────────────────────────────────────

export interface ChainServiceResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

function ok<T>(data: T): ChainServiceResponse<T> {
  return { success: true, data }
}

function fail(error: string): ChainServiceResponse<never> {
  return { success: false, error }
}

// ─── 结算 DTO ───────────────────────────────────────────────

export interface CreateSettlementDto {
  payerId: string
  payerName: string
  payees: Array<{ payeeId: string; payeeName: string; amount: number }>
}

export interface CreateRevenueShareDto {
  totalRevenue: number
  participants: Array<{
    participantId: string
    participantName: string
    ratio: number
  }>
}

// ─── Service ────────────────────────────────────────────────

@Injectable()
export class ChainService {
  constructor(
    private readonly settlementContract: PointsSettlementContract,
    private readonly revenueShareContract: RevenueShareContract,
    private readonly contractExecutor: ContractExecutor,
    private readonly smartContractService: SmartContractService,
  ) {}

  // ── 积分清算 ──

  createSettlement(dto: CreateSettlementDto): ChainServiceResponse<SettlementContractData> {
    try {
      const contract = this.settlementContract.createSettlement(
        dto.payerId,
        dto.payerName,
        dto.payees,
      )
      return ok(contract as unknown as SettlementContractData)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '创建合约失败')
    }
  }

  approveSettlement(contractId: string): ChainServiceResponse<SettlementContractData> {
    try {
      const contract = this.settlementContract.approveSettlement(contractId)
      return ok(contract as unknown as SettlementContractData)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '审批合约失败')
    }
  }

  executeSettlement(contractId: string): ChainServiceResponse<SettlementContractData> {
    try {
      const contract = this.settlementContract.executeSettlement(contractId)
      return ok(contract as unknown as SettlementContractData)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '执行合约失败')
    }
  }

  cancelSettlement(contractId: string): ChainServiceResponse<SettlementContractData> {
    try {
      const contract = this.settlementContract.cancelSettlement(contractId)
      return ok(contract as unknown as SettlementContractData)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '取消合约失败')
    }
  }

  getSettlement(contractId: string): ChainServiceResponse<SettlementContractData | null> {
    const contract = this.settlementContract.getContractState(contractId)
    return ok(contract as unknown as SettlementContractData | null)
  }

  // ── 分账 ──

  createRevenueShare(dto: CreateRevenueShareDto): ChainServiceResponse<RevenueShareContractData> {
    try {
      const contract = this.revenueShareContract.createRevenueShare(
        dto.totalRevenue,
        dto.participants,
      )
      return ok(contract as unknown as RevenueShareContractData)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '创建分账合约失败')
    }
  }

  distributeRevenue(contractId: string): ChainServiceResponse<RevenueShareContractData> {
    try {
      const contract = this.revenueShareContract.distributeRevenue(contractId)
      return ok(contract as unknown as RevenueShareContractData)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '分账执行失败')
    }
  }

  getParticipantShare(
    contractId: string,
    participantId: string,
  ): ChainServiceResponse<{ expected: number; actual: number; distributed: boolean } | null> {
    const result = this.revenueShareContract.getParticipantShare(contractId, participantId)
    return ok(result)
  }

  getShareHistory(contractId: string): ChainServiceResponse<ShareHistoryEntry[]> {
    const history = this.revenueShareContract.queryShareHistory(contractId)
    return ok(history)
  }

  // ── 合约执行 ──

  deployContract(
    contractType: 'PointsSettlement' | 'RevenueShare',
    params: Record<string, unknown>,
  ): ChainServiceResponse<{ deployedContractId: string; contractType: string }> {
    try {
      const result = this.contractExecutor.deployContract(contractType, params)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '部署合约失败')
    }
  }

  executeContract(contractId: string): ChainServiceResponse<ContractExecutionResult> {
    try {
      const result = this.contractExecutor.executeContract(contractId)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '执行合约失败')
    }
  }

  getExecutionResult(contractId: string): ChainServiceResponse<ContractExecutionResult | null> {
    const result = this.contractExecutor.getContractResult(contractId)
    return ok(result)
  }

  // ── 链上合约操作 ──

  async deploySmartContract(
    name: string,
    params: string[],
  ): Promise<ChainServiceResponse<{ contractId: string; address: string }>> {
    try {
      const result = await this.smartContractService.deployContract(name, params)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '部署智能合约失败')
    }
  }

  async executeSmartContract(
    contractId: string,
    method: string,
    args: string[],
  ): Promise<ChainServiceResponse<{ success: boolean }>> {
    try {
      const result = await this.smartContractService.executeContract(contractId, method, args)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '执行智能合约失败')
    }
  }

  async querySmartContract(
    contractId: string,
    method: string,
  ): Promise<ChainServiceResponse<any>> {
    try {
      const result = await this.smartContractService.queryContract(contractId, method)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '查询智能合约失败')
    }
  }

  async getSmartContractInfo(
    contractId: string,
  ): Promise<ChainServiceResponse<any>> {
    try {
      const result = await this.smartContractService.getContractInfo(contractId)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '获取合约信息失败')
    }
  }

  async listSmartContracts(): Promise<ChainServiceResponse<any[]>> {
    try {
      const result = await this.smartContractService.listContracts()
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '列举合约失败')
    }
  }

  async verifySmartContract(
    contractId: string,
    sourceCode: string,
    compiler: string,
  ): Promise<ChainServiceResponse<{ verified: boolean }>> {
    try {
      const result = await this.smartContractService.verifyContract(contractId, sourceCode, compiler)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '验证合约失败')
    }
  }

  async estimateGas(
    contractId: string,
    method: string,
    args: string[],
  ): Promise<ChainServiceResponse<number>> {
    try {
      const result = await this.smartContractService.estimateGas(contractId, method, args)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '估算 Gas 失败')
    }
  }

  async getContractEvents(contractId: string): Promise<ChainServiceResponse<any[]>> {
    try {
      const result = await this.smartContractService.getContractEvents(contractId)
      return ok(result)
    } catch (err) {
      return fail(err instanceof Error ? err.message : '获取合约事件失败')
    }
  }
}
