/**
 * Phase 97 联邦学习 前台 Types (V10 Sprint 2 Day 28)
 */

export type AggregationMethod = 'fedavg' | 'fedprox' | 'scaffold'
export type TaskStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
export type RoundStatus = 'draft' | 'collecting' | 'aggregating' | 'completed' | 'failed' | 'cancelled'

export interface FederatedTask {
  id: string
  name: string
  modelArch: string
  coordinatorTenantId: string
  participantTenantIds: string[]
  aggregationMethod: AggregationMethod
  totalRounds: number
  currentRound: number
  status: TaskStatus
  privacyBudgetEpsilon: number
  privacyBudgetDelta: number
  consumedEpsilon: number
  consumedDelta: number
  minParticipants: number
  noiseMultiplier: number
  maxGradientNorm: number
  createdAt: string
  updatedAt: string
}

export interface FederatedRound {
  id: string
  taskId: string
  roundNumber: number
  status: RoundStatus
  globalModelVersion: number
  nextModelVersion?: number
  expectedParticipants: number
  actualParticipants: number
  collectionStartedAt?: string
  collectionDeadlineAt?: string
  aggregatedAt?: string
  epsilonConsumed: number
  aggregatedLoss?: number
  failureReason?: string
  createdAt: string
  updatedAt: string
}

export interface PrivacyAccount {
  taskId: string
  totalEpsilon: number
  consumedEpsilon: number
  totalDelta: number
  consumedDelta: number
  compositionMethod: string
  updatedAt: string
}

export const AGGREGATION_LABELS: Record<AggregationMethod, string> = {
  fedavg: 'FedAvg',
  fedprox: 'FedProx',
  scaffold: 'SCAFFOLD',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  draft: '草稿',
  active: '运行中',
  paused: '已暂停',
  completed: '已完成',
  cancelled: '已取消',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  draft: '#bfbfbf',
  active: '#52c41a',
  paused: '#faad14',
  completed: '#1890ff',
  cancelled: '#ff4d4f',
}

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  draft: '草稿',
  collecting: '收集中',
  aggregating: '聚合中',
  completed: '已完成',
  failed: '失败',
  cancelled: '取消',
}

export const ROUND_STATUS_COLORS: Record<RoundStatus, string> = {
  draft: '#bfbfbf',
  collecting: '#1890ff',
  aggregating: '#13c2c2',
  completed: '#52c41a',
  failed: '#ff4d4f',
  cancelled: '#bfbfbf',
}