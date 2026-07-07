/**
 * Phase 97 联邦学习 DTO (V10 Sprint 2 Day 26)
 */

import type { AggregationMethod } from './federated.entity'

export interface CreateFederatedTaskDto {
  name: string
  modelArch: string
  participantTenantIds: string[]
  aggregationMethod?: AggregationMethod
  totalRounds?: number
  privacyBudgetEpsilon?: number
  privacyBudgetDelta?: number
  minParticipants?: number
  noiseMultiplier?: number
  maxGradientNorm?: number
}

export interface StartRoundDto {
  /** 收集截止时间 (毫秒) */
  collectionDeadlineMs?: number
}

export interface SubmitGradientDto {
  roundId: string
  /** 加密梯度 (base64) */
  encryptedGradients: string
  /** 客户端样本数 */
  sampleCount: number
  /** 客户端计算的损失 */
  loss?: number
}

export interface FederatedTaskResponse {
  id: string
  name: string
  modelArch: string
  coordinatorTenantId: string
  participantTenantIds: string[]
  aggregationMethod: AggregationMethod
  totalRounds: number
  currentRound: number
  status: string
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

export interface RoundResponse {
  id: string
  taskId: string
  roundNumber: number
  status: string
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

export interface AggregationResponse {
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