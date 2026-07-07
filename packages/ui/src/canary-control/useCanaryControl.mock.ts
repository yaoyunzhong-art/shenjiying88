/**
 * useCanaryControl Mock (V10 Day 8)
 */

import type { CanaryExperiment, CanaryStatus } from './types'

const MOCK: CanaryExperiment[] = [
  { id: 'exp-ai-v2', name: 'AI 模型 V2 灰度', description: '新 AI 模型分阶段上线', flagKey: 'ai.model.v2_enabled',
    strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
    status: 'active', initialPercentage: 10, targetPercentage: 100, currentPercentage: 25,
    startedAt: '2026-06-25', createdBy: 'system', createdAt: '2026-06-25', updatedAt: '2026-06-28' },
  { id: 'exp-checkout', name: '新结算流程', description: '门店 store-001, store-002 优先体验', flagKey: 'checkout.new_flow',
    strategy: 'store', strategyConfig: { type: 'store', storeIds: ['store-001', 'store-002'] },
    status: 'active', initialPercentage: 100, targetPercentage: 100, currentPercentage: 100,
    startedAt: '2026-06-20', createdBy: 'system', createdAt: '2026-06-20', updatedAt: '2026-06-28' },
  { id: 'exp-recommend', name: '新推荐算法', description: '灰度测试中', flagKey: 'recommend.v3',
    strategy: 'tenant', strategyConfig: { type: 'tenant', tenantIds: ['t1'] },
    status: 'paused', initialPercentage: 5, targetPercentage: 50, currentPercentage: 5,
    createdBy: 'admin', createdAt: '2026-06-15', updatedAt: '2026-06-27' },
]

export function useCanaryExperiments() {
  return { data: MOCK, isLoading: false }
}
export function useActivateExperiment() {
  return { mutate: () => undefined, isPending: false }
}
export function usePromoteExperiment() {
  return { mutate: () => undefined, isPending: false }
}
export function useRollbackExperiment() {
  return { mutate: () => undefined, isPending: false }
}
