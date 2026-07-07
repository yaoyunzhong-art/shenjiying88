/**
 * chain.entity.ts — 智能合约实体定义
 *
 * 定义积分清算合约、分账合约、合约执行器相关的数据结构
 */

// ─── 积分清算合约 ────────────────────────────────────────────

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

export interface SettlementContract {
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

// ─── 分账合约 ────────────────────────────────────────────────

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

export interface RevenueShareContract {
  contractId: string
  totalRevenue: number
  participants: ShareParticipant[]
  status: RevenueShareStatus
  createdAt: string
  updatedAt: string
  distributedAt?: string
  cancelledAt?: string
}

// ─── 合约执行 ────────────────────────────────────────────────

export interface ContractExecutionResult {
  contractId: string
  success: boolean
  output?: Record<string, unknown>
  error?: string
  executedAt: string
}

export interface ShareHistoryEntry {
  contractId: string
  participantId: string
  participantName: string
  amount: number
  distributedAt: string
}

// ─── 智能合约（链上） ────────────────────────────────────────

export interface SmartContract {
  contractId: string
  name: string
  address: string
  params: string[]
  deployedAt: string
}

export type ContractType = 'PointsSettlement' | 'RevenueShare'
