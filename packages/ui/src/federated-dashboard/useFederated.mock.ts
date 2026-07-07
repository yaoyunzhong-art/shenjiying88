/**
 * Phase 97 联邦学习 前台 Mock (V10 Sprint 2 Day 28 - SSR mock)
 */

import type { FederatedTask, FederatedRound, PrivacyAccount } from './types'

const MOCK_TASKS: FederatedTask[] = [
  {
    id: 'fed-task-sales',
    name: '销售预测联合训练',
    modelArch: 'lstm-v2',
    coordinatorTenantId: 'tenant-A',
    participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'],
    aggregationMethod: 'fedavg',
    totalRounds: 10,
    currentRound: 5,
    status: 'active',
    privacyBudgetEpsilon: 1.0,
    privacyBudgetDelta: 1e-5,
    consumedEpsilon: 0.45,
    consumedDelta: 5e-6,
    minParticipants: 2,
    noiseMultiplier: 1.1,
    maxGradientNorm: 1.0,
    createdAt: '2026-06-20',
    updatedAt: '2026-06-28',
  },
  {
    id: 'fed-task-inventory',
    name: '库存优化联邦学习',
    modelArch: 'mlp-v3',
    coordinatorTenantId: 'tenant-A',
    participantTenantIds: ['tenant-A', 'tenant-B'],
    aggregationMethod: 'scaffold',
    totalRounds: 5,
    currentRound: 5,
    status: 'completed',
    privacyBudgetEpsilon: 2.0,
    privacyBudgetDelta: 1e-5,
    consumedEpsilon: 1.8,
    consumedDelta: 5e-6,
    minParticipants: 2,
    noiseMultiplier: 1.5,
    maxGradientNorm: 0.5,
    createdAt: '2026-06-15',
    updatedAt: '2026-06-26',
  },
]

const MOCK_ROUNDS: Record<string, FederatedRound[]> = {
  'fed-task-sales': [
    { id: 'r1', taskId: 'fed-task-sales', roundNumber: 1, status: 'completed', globalModelVersion: 0, nextModelVersion: 1, expectedParticipants: 3, actualParticipants: 3, epsilonConsumed: 0.09, aggregatedLoss: 0.32, createdAt: '2026-06-25', updatedAt: '2026-06-25' },
    { id: 'r5', taskId: 'fed-task-sales', roundNumber: 5, status: 'collecting', globalModelVersion: 4, expectedParticipants: 3, actualParticipants: 2, epsilonConsumed: 0, createdAt: '2026-06-28', updatedAt: '2026-06-28' },
  ],
}

export function useFederatedTasks() { return { data: MOCK_TASKS, isLoading: false } }
export function useFederatedRounds(_taskId: string) { return { data: MOCK_ROUNDS[_taskId] ?? [], isLoading: false } }
export function useFederatedPrivacy(_taskId: string): { data: PrivacyAccount | undefined; isLoading: boolean } {
  const task = MOCK_TASKS.find((t) => t.id === _taskId)
  return {
    data: task ? {
      taskId: _taskId,
      totalEpsilon: task.privacyBudgetEpsilon,
      consumedEpsilon: task.consumedEpsilon,
      totalDelta: task.privacyBudgetDelta,
      consumedDelta: task.consumedDelta,
      compositionMethod: 'basic',
      updatedAt: task.updatedAt,
    } : undefined,
    isLoading: false,
  }
}
export function useActivateTask() { return { mutate: () => undefined, isPending: false } }
export function useStartRound() { return { mutate: () => undefined, isPending: false } }
export function useAggregateRound() { return { mutate: () => undefined, isPending: false } }