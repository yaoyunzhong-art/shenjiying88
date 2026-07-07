/**
 * 灰度控制 - Hooks (V10 Day 8)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CanaryExperiment, CanaryStatus } from './types'

const MOCK_EXPERIMENTS: CanaryExperiment[] = [
  {
    id: 'exp-ai-v2', name: 'AI 模型 V2 灰度',
    description: '新 AI 模型分阶段上线',
    flagKey: 'ai.model.v2_enabled',
    strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
    status: 'active',
    initialPercentage: 10, targetPercentage: 100, currentPercentage: 25,
    startedAt: '2026-06-25T00:00:00Z',
    createdBy: 'system',
    createdAt: '2026-06-25', updatedAt: '2026-06-28',
  },
  {
    id: 'exp-checkout', name: '新结算流程',
    description: '门店 store-001, store-002 优先体验',
    flagKey: 'checkout.new_flow',
    strategy: 'store', strategyConfig: { type: 'store', storeIds: ['store-001', 'store-002'] },
    status: 'active',
    initialPercentage: 100, targetPercentage: 100, currentPercentage: 100,
    startedAt: '2026-06-20',
    createdBy: 'system',
    createdAt: '2026-06-20', updatedAt: '2026-06-28',
  },
  {
    id: 'exp-recommend', name: '新推荐算法',
    description: '灰度测试中',
    flagKey: 'recommend.v3',
    strategy: 'tenant', strategyConfig: { type: 'tenant', tenantIds: ['t1'] },
    status: 'paused',
    initialPercentage: 5, targetPercentage: 50, currentPercentage: 5,
    createdBy: 'admin',
    createdAt: '2026-06-15', updatedAt: '2026-06-27',
  },
]

async function fetchExperimentsApi(): Promise<CanaryExperiment[]> {
  await new Promise((r) => setTimeout(r, 80))
  return MOCK_EXPERIMENTS
}

async function activateApi(id: string): Promise<CanaryExperiment> {
  await new Promise((r) => setTimeout(r, 50))
  return { ...MOCK_EXPERIMENTS.find((e) => e.id === id)!, status: 'active' as CanaryStatus, currentPercentage: 10 }
}

async function promoteApi(id: string, pct: number): Promise<CanaryExperiment> {
  await new Promise((r) => setTimeout(r, 50))
  const exp = MOCK_EXPERIMENTS.find((e) => e.id === id)!
  return { ...exp, currentPercentage: pct }
}

async function rollbackApi(id: string): Promise<CanaryExperiment> {
  await new Promise((r) => setTimeout(r, 50))
  return { ...MOCK_EXPERIMENTS.find((e) => e.id === id)!, status: 'rolled_back' as CanaryStatus, currentPercentage: 0 }
}

export function useCanaryExperiments() {
  return useQuery({
    queryKey: ['canary-experiments'],
    queryFn: fetchExperimentsApi,
    staleTime: 30 * 1000,
  })
}

export function useActivateExperiment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: activateApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canary-experiments'] }),
  })
}

export function usePromoteExperiment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, percentage }: { id: string; percentage: number }) => promoteApi(id, percentage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canary-experiments'] }),
  })
}

export function useRollbackExperiment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rollbackApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canary-experiments'] }),
  })
}
