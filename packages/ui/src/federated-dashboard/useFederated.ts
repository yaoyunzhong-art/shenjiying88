/**
 * Phase 97 联邦学习 前台 Hooks (V10 Sprint 2 Day 28)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    { id: 'r1', taskId: 'fed-task-sales', roundNumber: 1, status: 'completed', globalModelVersion: 0, nextModelVersion: 1, expectedParticipants: 3, actualParticipants: 3, collectionStartedAt: '2026-06-25T10:00:00Z', aggregatedAt: '2026-06-25T10:30:00Z', epsilonConsumed: 0.09, aggregatedLoss: 0.32, createdAt: '2026-06-25', updatedAt: '2026-06-25' },
    { id: 'r2', taskId: 'fed-task-sales', roundNumber: 2, status: 'completed', globalModelVersion: 1, nextModelVersion: 2, expectedParticipants: 3, actualParticipants: 3, collectionStartedAt: '2026-06-26T10:00:00Z', aggregatedAt: '2026-06-26T10:30:00Z', epsilonConsumed: 0.09, aggregatedLoss: 0.28, createdAt: '2026-06-26', updatedAt: '2026-06-26' },
    { id: 'r5', taskId: 'fed-task-sales', roundNumber: 5, status: 'collecting', globalModelVersion: 4, expectedParticipants: 3, actualParticipants: 2, collectionStartedAt: '2026-06-28T09:00:00Z', collectionDeadlineAt: '2026-06-28T13:00:00Z', epsilonConsumed: 0, createdAt: '2026-06-28', updatedAt: '2026-06-28' },
  ],
}

async function fetchTasksApi(): Promise<FederatedTask[]> {
  await new Promise((r) => setTimeout(r, 80))
  return MOCK_TASKS
}

async function fetchRoundsApi(taskId: string): Promise<FederatedRound[]> {
  await new Promise((r) => setTimeout(r, 60))
  return MOCK_ROUNDS[taskId] ?? []
}

async function fetchPrivacyApi(taskId: string): Promise<PrivacyAccount> {
  await new Promise((r) => setTimeout(r, 50))
  const task = MOCK_TASKS.find((t) => t.id === taskId)
  return {
    taskId,
    totalEpsilon: task?.privacyBudgetEpsilon ?? 1.0,
    consumedEpsilon: task?.consumedEpsilon ?? 0,
    totalDelta: task?.privacyBudgetDelta ?? 1e-5,
    consumedDelta: task?.consumedDelta ?? 0,
    compositionMethod: 'basic',
    updatedAt: task?.updatedAt ?? '2026-06-28',
  }
}

export function useFederatedTasks() {
  return useQuery({ queryKey: ['federated', 'tasks'], queryFn: fetchTasksApi, staleTime: 30 * 1000 })
}
export function useFederatedRounds(taskId: string) {
  return useQuery({
    queryKey: ['federated', 'rounds', taskId],
    queryFn: () => fetchRoundsApi(taskId),
    staleTime: 10 * 1000,
  })
}
export function useFederatedPrivacy(taskId: string) {
  return useQuery({
    queryKey: ['federated', 'privacy', taskId],
    queryFn: () => fetchPrivacyApi(taskId),
    staleTime: 30 * 1000,
  })
}

export function useActivateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await new Promise((r) => setTimeout(r, 100))
      return { id: taskId, status: 'active' }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['federated', 'tasks'] }),
  })
}

export function useStartRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await new Promise((r) => setTimeout(r, 150))
      return { taskId, roundId: `rnd-${Date.now().toString(36)}` }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['federated', 'rounds'] }),
  })
}

export function useAggregateRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roundId: string) => {
      await new Promise((r) => setTimeout(r, 300))
      return { roundId, globalModelVersion: 99 }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['federated', 'rounds'] })
      qc.invalidateQueries({ queryKey: ['federated', 'tasks'] })
    },
  })
}