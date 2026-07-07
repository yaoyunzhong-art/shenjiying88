/**
 * 🐜 自动: [federated-learning] [A] contract 补全
 *
 * 联邦学习：跨模块合约类型
 * 定义 federated-learning 模块对外暴露的稳定合约接口，
 * 供其他模块（analytics, campaign, loyalty, member 等）消费。
 */
import type { AggregationMethod } from './federated.entity'
import type {
  FederatedTask,
  FederatedRound,
  GradientSubmission,
  PrivacyAccount,
  AggregationResult,
} from './federated.entity'

/**
 * 联邦任务合约（跨模块安全子集）
 */
export interface FederatedTaskContract {
  id: string
  name: string
  modelArch: string
  coordinatorTenantId: string
  participantTenantIds: string[]
  aggregationMethod: AggregationMethod
  totalRounds: number
  currentRound: number
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  privacyBudgetEpsilon: number
  consumedEpsilon: number
  consumedDelta: number
  minParticipants: number
  noiseMultiplier: number
  maxGradientNorm: number
  createdAt: string
  updatedAt: string
}

/**
 * 联邦轮次合约（跨模块安全子集）
 */
export interface FederatedRoundContract {
  id: string
  taskId: string
  roundNumber: number
  status: string
  globalModelVersion: number
  nextModelVersion?: number
  expectedParticipants: number
  actualParticipants: number
  epsilonConsumed: number
  aggregatedLoss?: number
  failureReason?: string
  createdAt: string
}

/**
 * 梯度提交合约（跨模块安全子集 - 不含加密梯度内容）
 */
export interface GradientSubmissionContract {
  id: string
  roundId: string
  taskId: string
  tenantId: string
  sampleCount: number
  status: string
  submittedAt?: string
  receivedAt?: string
  rejectionReason?: string
  createdAt: string
}

/**
 * 隐私预算合约（跨模块安全子集）
 */
export interface PrivacyAccountContract {
  taskId: string
  totalEpsilon: number
  consumedEpsilon: number
  totalDelta: number
  consumedDelta: number
  compositionMethod: string
  updatedAt: string
}

/**
 * 聚合结果合约（跨模块安全子集）
 */
export interface AggregationResultContract {
  roundId: string
  globalModelVersion: number
  participantCount: number
  totalSamples: number
  averageLoss: number
  epsilonConsumed: number
  deltaConsumed: number
  method: AggregationMethod
  durationMs: number
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toFederatedTaskContract(entity: FederatedTask): FederatedTaskContract {
  return {
    id: entity.id,
    name: entity.name,
    modelArch: entity.modelArch,
    coordinatorTenantId: entity.coordinatorTenantId,
    participantTenantIds: [...entity.participantTenantIds],
    aggregationMethod: entity.aggregationMethod,
    totalRounds: entity.totalRounds,
    currentRound: entity.currentRound,
    status: entity.status,
    privacyBudgetEpsilon: entity.privacyBudgetEpsilon,
    consumedEpsilon: entity.consumedEpsilon,
    consumedDelta: entity.consumedDelta,
    minParticipants: entity.minParticipants,
    noiseMultiplier: entity.noiseMultiplier,
    maxGradientNorm: entity.maxGradientNorm,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toFederatedRoundContract(entity: FederatedRound): FederatedRoundContract {
  return {
    id: entity.id,
    taskId: entity.taskId,
    roundNumber: entity.roundNumber,
    status: entity.status,
    globalModelVersion: entity.globalModelVersion,
    nextModelVersion: entity.nextModelVersion,
    expectedParticipants: entity.expectedParticipants,
    actualParticipants: entity.actualParticipants,
    epsilonConsumed: entity.epsilonConsumed,
    aggregatedLoss: entity.aggregatedLoss,
    failureReason: entity.failureReason,
    createdAt: entity.createdAt,
  }
}

/** 实体 -> 合约映射 */
export function toGradientSubmissionContract(entity: GradientSubmission): GradientSubmissionContract {
  return {
    id: entity.id,
    roundId: entity.roundId,
    taskId: entity.taskId,
    tenantId: entity.tenantId,
    sampleCount: entity.sampleCount,
    status: entity.status,
    submittedAt: entity.submittedAt,
    receivedAt: entity.receivedAt,
    rejectionReason: entity.rejectionReason,
    createdAt: entity.createdAt,
  }
}

/** 实体 -> 合约映射 */
export function toPrivacyAccountContract(entity: PrivacyAccount): PrivacyAccountContract {
  return {
    taskId: entity.taskId,
    totalEpsilon: entity.totalEpsilon,
    consumedEpsilon: entity.consumedEpsilon,
    totalDelta: entity.totalDelta,
    consumedDelta: entity.consumedDelta,
    compositionMethod: entity.compositionMethod,
    updatedAt: entity.updatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toAggregationResultContract(entity: AggregationResult): AggregationResultContract {
  return {
    roundId: entity.roundId,
    globalModelVersion: entity.globalModelVersion,
    participantCount: entity.participantCount,
    totalSamples: entity.totalSamples,
    averageLoss: entity.averageLoss,
    epsilonConsumed: entity.epsilonConsumed,
    deltaConsumed: entity.deltaConsumed,
    method: entity.method,
    durationMs: entity.durationMs,
  }
}

/** 批量映射 */
export function toFederatedTaskContracts(entities: FederatedTask[]): FederatedTaskContract[] {
  return entities.map(toFederatedTaskContract)
}

/** 批量映射 */
export function toFederatedRoundContracts(entities: FederatedRound[]): FederatedRoundContract[] {
  return entities.map(toFederatedRoundContract)
}
