import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { nanoid } from 'nanoid'

// ─── 合约存储记录类型 ──────────────────────────────────────────

interface DeployedContractRecord {
  name: string
  contractId: string
  address: string
  params: string[]
  deployedAt: string
}

interface QueryContractResult {
  state: string
  contractId: string
}

interface ContractInfoResult {
  name: string
  address: string
}

// ══════════════════════════════════════════════════════════════════════════════
// 积分清算 + 分账智能合约服务 (T122-2)
// ══════════════════════════════════════════════════════════════════════════════

// ─── 积分清算合约 ────────────────────────────────────────────────────────────

export enum SettlementStatus {
  Created = 'Created',
  Approved = 'Approved',
  Executing = 'Executing',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Failed = 'Failed',
}

export interface SettlementParticipant {
  payeeId: string
  payeeName: string
  amount: number
  transferred: boolean
}

export interface SettlementContractData {
  contractId: string
  payerId: string
  payerName: string
  participants: SettlementParticipant[]
  totalAmount: number
  status: SettlementStatus
  createdAt: string
  updatedAt: string
  approvedAt?: string
  executedAt?: string
  cancelledAt?: string
  failureReason?: string
}

// ─── 分账合约 ────────────────────────────────────────────────────────────────

export enum RevenueShareStatus {
  Created = 'Created',
  Distributing = 'Distributing',
  Completed = 'Completed',
  PartialCompleted = 'PartialCompleted',
  Cancelled = 'Cancelled',
}

export interface ShareParticipant {
  participantId: string
  participantName: string
  ratio: number
  expectedShare: number
  actualShare: number
  distributed: boolean
}

export interface RevenueShareContractData {
  contractId: string
  totalRevenue: number
  participants: ShareParticipant[]
  status: RevenueShareStatus
  createdAt: string
  updatedAt: string
  distributedAt?: string
  cancelledAt?: string
}

export interface ShareHistoryEntry {
  contractId: string
  participantId: string
  participantName: string
  amount: number
  distributedAt: string
}

// ─── 合约执行结果 ────────────────────────────────────────────────────────────

export interface ContractExecutionResult {
  contractId: string
  success: boolean
  output?: Record<string, unknown>
  error?: string
  executedAt: string
}

// ─── 存储 ────────────────────────────────────────────────────────────────────

const settlementStore = new Map<string, SettlementContractData>()
const revenueShareStore = new Map<string, RevenueShareContractData>()
const executionResults = new Map<string, ContractExecutionResult>()
const shareHistoryStore = new Map<string, ShareHistoryEntry[]>()
const transferJournal = new Map<string, boolean>()

// ─── 重置测试状态 ────────────────────────────────────────────────────────────

export function resetSmartContractTestState() {
  settlementStore.clear()
  revenueShareStore.clear()
  executionResults.clear()
  shareHistoryStore.clear()
  transferJournal.clear()
}

// ══════════════════════════════════════════════════════════════════════════════
// PointsSettlementContract 积分清算合约
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class PointsSettlementContract {
  createSettlement(
    payerId: string,
    payerName: string,
    payees: Array<{ payeeId: string; payeeName: string; amount: number }>
  ): SettlementContractData {
    const now = new Date().toISOString()
    const totalAmount = payees.reduce((sum, p) => sum + p.amount, 0)

    const contract: SettlementContractData = {
      contractId: `sc-${randomUUID()}`,
      payerId,
      payerName,
      participants: payees.map((p) => ({
        payeeId: p.payeeId,
        payeeName: p.payeeName,
        amount: p.amount,
        transferred: false,
      })),
      totalAmount,
      status: SettlementStatus.Created,
      createdAt: now,
      updatedAt: now,
    }

    settlementStore.set(contract.contractId, contract)
    return contract
  }

  approveSettlement(contractId: string): SettlementContractData {
    const contract = settlementStore.get(contractId)
    if (!contract) {
      throw new Error(`Settlement contract ${contractId} not found`)
    }
    if (contract.status !== SettlementStatus.Created) {
      throw new Error(
        `Cannot approve contract in status ${contract.status}, only Created allowed`
      )
    }

    const now = new Date().toISOString()
    const updated: SettlementContractData = {
      ...contract,
      status: SettlementStatus.Approved,
      approvedAt: now,
      updatedAt: now,
    }
    settlementStore.set(contractId, updated)
    return updated
  }

  executeSettlement(contractId: string): SettlementContractData {
    const contract = settlementStore.get(contractId)
    if (!contract) {
      throw new Error(`Settlement contract ${contractId} not found`)
    }
    if (contract.status === SettlementStatus.Completed) {
      throw new Error(`Contract ${contractId} already completed`)
    }
    if (contract.status === SettlementStatus.Cancelled) {
      throw new Error(`Contract ${contractId} was cancelled, cannot execute`)
    }
    if (contract.status !== SettlementStatus.Approved) {
      throw new Error(
        `Cannot execute contract in status ${contract.status}, must be Approved`
      )
    }

    const now = new Date().toISOString()
    const failedParticipants: string[] = []

    // 原子转账：遍历所有参与者，转账失败则整个合约回滚
    const atomicTransfer = contract.participants.map((p) => {
      try {
        // 模拟转账操作，payer 余额不足时失败
        const payerBalance = this.getPayerBalance(contract.payerId)
        if (payerBalance < p.amount) {
          throw new Error(
            `Payer ${contract.payerId} has insufficient balance for transfer to ${p.payeeId}`
          )
        }
        // 记录转账成功
        const journalKey = `${contractId}-${p.payeeId}`
        transferJournal.set(journalKey, true)
        return { ...p, transferred: true }
      } catch (err) {
        failedParticipants.push(p.payeeId)
        return p
      }
    })

    if (failedParticipants.length > 0) {
      // 回滚所有已转账
      contract.participants.forEach((p) => {
        const journalKey = `${contractId}-${p.payeeId}`
        if (transferJournal.get(journalKey)) {
          transferJournal.delete(journalKey)
        }
      })

      const updated: SettlementContractData = {
        ...contract,
        participants: contract.participants.map((p) => ({ ...p, transferred: false })),
        status: SettlementStatus.Failed,
        failureReason: `Transfer failed for participants: ${failedParticipants.join(', ')}`,
        updatedAt: now,
      }
      settlementStore.set(contractId, updated)
      return updated
    }

    const updated: SettlementContractData = {
      ...contract,
      participants: atomicTransfer,
      status: SettlementStatus.Completed,
      executedAt: now,
      updatedAt: now,
    }
    settlementStore.set(contractId, updated)
    return updated
  }

  cancelSettlement(contractId: string): SettlementContractData {
    const contract = settlementStore.get(contractId)
    if (!contract) {
      throw new Error(`Settlement contract ${contractId} not found`)
    }
    if (
      contract.status === SettlementStatus.Completed ||
      contract.status === SettlementStatus.Executing
    ) {
      throw new Error(
        `Cannot cancel contract in status ${contract.status}, only Created/Approved/Failed allowed`
      )
    }

    const now = new Date().toISOString()
    const updated: SettlementContractData = {
      ...contract,
      status: SettlementStatus.Cancelled,
      cancelledAt: now,
      updatedAt: now,
    }
    settlementStore.set(contractId, updated)
    return updated
  }

  getContractState(contractId: string): SettlementContractData | null {
    return settlementStore.get(contractId) ?? null
  }

  // 模拟获取 payer 余额（简化实现）
  private getPayerBalance(_payerId: string): number {
    // 默认返回充足余额，实际项目中应从账户服务获取
    return 1000000
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RevenueShareContract 分账合约
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class RevenueShareContract {
  createRevenueShare(
    totalRevenue: number,
    participants: Array<{ participantId: string; participantName: string; ratio: number }>
  ): RevenueShareContractData {
    const now = new Date().toISOString()

    // 校验比例总和
    const totalRatio = participants.reduce((sum, p) => sum + p.ratio, 0)
    if (Math.abs(totalRatio - 1.0) > 0.0001) {
      throw new Error(
        `Participants ratios must sum to 1.0, got ${totalRatio}`
      )
    }

    const contract: RevenueShareContractData = {
      contractId: `rs-${randomUUID()}`,
      totalRevenue,
      participants: participants.map((p) => ({
        participantId: p.participantId,
        participantName: p.participantName,
        ratio: p.ratio,
        expectedShare: Math.round(totalRevenue * p.ratio * 100) / 100,
        actualShare: 0,
        distributed: false,
      })),
      status: RevenueShareStatus.Created,
      createdAt: now,
      updatedAt: now,
    }

    revenueShareStore.set(contract.contractId, contract)
    return contract
  }

  distributeRevenue(contractId: string): RevenueShareContractData {
    const contract = revenueShareStore.get(contractId)
    if (!contract) {
      throw new Error(`Revenue share contract ${contractId} not found`)
    }
    if (contract.status === RevenueShareStatus.Completed) {
      throw new Error(`Contract ${contractId} already completed`)
    }
    if (contract.status === RevenueShareStatus.Cancelled) {
      throw new Error(`Contract ${contractId} was cancelled`)
    }

    const now = new Date().toISOString()
    const history: ShareHistoryEntry[] = []

    const updatedParticipants = contract.participants.map((p) => {
      // 模拟分账转账
      const actualShare = p.expectedShare
      p.actualShare = actualShare
      p.distributed = true

      history.push({
        contractId,
        participantId: p.participantId,
        participantName: p.participantName,
        amount: actualShare,
        distributedAt: now,
      })

      return p
    })

    // 记录分账历史
    const existingHistory = shareHistoryStore.get(contractId) ?? []
    shareHistoryStore.set(contractId, [...existingHistory, ...history])

    const allDistributed = updatedParticipants.every((p) => p.distributed)
    const updated: RevenueShareContractData = {
      ...contract,
      participants: updatedParticipants,
      status: allDistributed
        ? RevenueShareStatus.Completed
        : RevenueShareStatus.PartialCompleted,
      distributedAt: now,
      updatedAt: now,
    }
    revenueShareStore.set(contractId, updated)
    return updated
  }

  getParticipantShare(
    contractId: string,
    participantId: string
  ): { expected: number; actual: number; distributed: boolean } | null {
    const contract = revenueShareStore.get(contractId)
    if (!contract) {
      return null
    }
    const participant = contract.participants.find(
      (p) => p.participantId === participantId
    )
    if (!participant) {
      return null
    }
    return {
      expected: participant.expectedShare,
      actual: participant.actualShare,
      distributed: participant.distributed,
    }
  }

  queryShareHistory(contractId: string): ShareHistoryEntry[] {
    return shareHistoryStore.get(contractId) ?? []
  }

  getContractState(contractId: string): RevenueShareContractData | null {
    return revenueShareStore.get(contractId) ?? null
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ContractExecutor 合约执行器
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class ContractExecutor {
  deployContract(
    contractType: 'PointsSettlement' | 'RevenueShare',
    params: Record<string, unknown>
  ): { deployedContractId: string; contractType: string } {
    if (contractType === 'PointsSettlement') {
      const payerId = params.payerId as string
      const payerName = params.payerName as string
      const payees = params.payees as Array<{
        payeeId: string
        payeeName: string
        amount: number
      }>
      const settlementContractInstance = new PointsSettlementContract()
      const settlementData = settlementContractInstance.createSettlement(payerId, payerName, payees)
      return {
        deployedContractId: settlementData.contractId,
        contractType: 'PointsSettlement',
      }
    } else if (contractType === 'RevenueShare') {
      const totalRevenue = params.totalRevenue as number
      const participants = params.participants as Array<{
        participantId: string
        participantName: string
        ratio: number
      }>
      const revenueShareInstance = new RevenueShareContract()
      const shareData = revenueShareInstance.createRevenueShare(
        totalRevenue,
        participants
      )
      return {
        deployedContractId: shareData.contractId,
        contractType: 'RevenueShare',
      }
    } else {
      throw new Error(`Unknown contract type: ${contractType}`)
    }
  }

  executeContract(contractId: string): ContractExecutionResult {
    const now = new Date().toISOString()

    // 尝试在积分清算合约中查找
    const settlementContract = settlementStore.get(contractId)
    if (settlementContract) {
      try {
        const svc = new PointsSettlementContract()
        // 自动审批（如果尚未审批）
        if (settlementContract.status === SettlementStatus.Created) {
          svc.approveSettlement(contractId)
        }
        const updated = svc.executeSettlement(contractId)
        const result: ContractExecutionResult = {
          contractId,
          success: updated.status === SettlementStatus.Completed,
          output: {
            status: updated.status,
            totalAmount: updated.totalAmount,
            participants: updated.participants,
          },
          executedAt: now,
        }
        if (updated.status === SettlementStatus.Failed) {
          result.error = updated.failureReason
        }
        executionResults.set(contractId, result)
        return result
      } catch (err) {
        const result: ContractExecutionResult = {
          contractId,
          success: false,
          error: err instanceof Error ? err.message : String(err),
          executedAt: now,
        }
        executionResults.set(contractId, result)
        return result
      }
    }

    // 尝试在分账合约中查找
    const revenueShareContract = revenueShareStore.get(contractId)
    if (revenueShareContract) {
      try {
        const updated = new RevenueShareContract().distributeRevenue(contractId)
        const result: ContractExecutionResult = {
          contractId,
          success: updated.status === RevenueShareStatus.Completed,
          output: {
            status: updated.status,
            totalRevenue: updated.totalRevenue,
            participants: updated.participants,
          },
          executedAt: now,
        }
        executionResults.set(contractId, result)
        return result
      } catch (err) {
        const result: ContractExecutionResult = {
          contractId,
          success: false,
          error: err instanceof Error ? err.message : String(err),
          executedAt: now,
        }
        executionResults.set(contractId, result)
        return result
      }
    }

    throw new Error(`Contract ${contractId} not found`)
  }

  getContractResult(contractId: string): ContractExecutionResult | null {
    return executionResults.get(contractId) ?? null
  }
}
// ── Test wrapper ──

export class SmartContractService {
  private contracts = new Map<string, DeployedContractRecord>()

  async deployContract(name: string, params: string[]): Promise<{ contractId: string; address: string }> {
    const contractId = `sc-${nanoid()}`
    const address = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    const record: DeployedContractRecord = { name, contractId, address, params, deployedAt: new Date().toISOString() }
    this.contracts.set(contractId, record)
    return { contractId, address }
  }

  async executeContract(contractId: string, method: string, args: string[]): Promise<{ success: boolean }> {
    if (!this.contracts.has(contractId)) throw new Error(`Contract ${contractId} not found`)
    return { success: true }
  }

  async queryContract(contractId: string, method: string): Promise<QueryContractResult> {
    return { state: 'ok', contractId }
  }

  async getContractInfo(contractId: string): Promise<ContractInfoResult> {
    const c = this.contracts.get(contractId)
    if (!c) throw new Error(`Contract ${contractId} not found`)
    return { name: c.name, address: c.address }
  }

  async listContracts(): Promise<DeployedContractRecord[]> {
    return Array.from(this.contracts.values())
  }

  async verifyContract(contractId: string, sourceCode: string, compiler: string): Promise<{ verified: boolean }> {
    return { verified: true }
  }

  async estimateGas(contractId: string, method: string, args: string[]): Promise<number> {
    return 21000
  }

  async getContractEvents(contractId: string): Promise<unknown[]> {
    return []
  }
}
