/**
 * useInsight Mock (V10 Sprint 2 Day 18)
 *
 * 替代 @tanstack/react-query 的 useQuery/useMutation
 * 让 InsightPanel.test.tsx 在 node:test 环境下 SSR 渲染
 */

import type { InsightResponse, InsightTemplate, InsightTemplateType } from './types'

const MOCK_TEMPLATES: InsightTemplate[] = [
  { type: 'sales', name: '销售洞察', description: '识别销售趋势与机会', maxTokens: 1024, temperature: 0.3 },
  { type: 'inventory', name: '库存洞察', description: '识别滞销品与缺货风险', maxTokens: 1024, temperature: 0.3 },
  { type: 'finance', name: '财务洞察', description: '收入/成本/利润分析', maxTokens: 1024, temperature: 0.2 },
  { type: 'marketing', name: '营销洞察', description: '活动 ROI 与转化漏斗', maxTokens: 1024, temperature: 0.4 },
  { type: 'customer', name: '客户洞察', description: '复购率与流失预警', maxTokens: 1024, temperature: 0.3 },
]

const MOCK_INSIGHTS: InsightResponse[] = [
  {
    id: 'ins-mock-001',
    tenantId: 'tenant-A',
    templateType: 'sales',
    status: 'completed',
    content: '## 关键发现\n- 6 月销售额环比增长 12.5%\n- 客单价从 ¥85 提升至 ¥95\n\n## 行动建议\n- 持续投入热销品类的营销资源',
    modelId: 'preset-deepseek',
    tokenUsage: { prompt: 280, completion: 95, total: 375 },
    sources: [{ type: 'report', refId: 'rpt-001', period: { from: '2026-06-01', to: '2026-06-30' } }],
    createdAt: '2026-06-28T10:00:00Z',
    completedAt: '2026-06-28T10:00:03Z',
    createdBy: 'admin',
    cached: false,
  },
  {
    id: 'ins-mock-002',
    tenantId: 'tenant-A',
    templateType: 'inventory',
    status: 'generating',
    modelId: 'preset-deepseek',
    sources: [{ type: 'report', refId: 'rpt-002', period: { from: '2026-06-01', to: '2026-06-30' } }],
    createdAt: '2026-06-28T10:30:00Z',
    createdBy: 'admin',
    cached: false,
  },
]

export function useInsightTemplates() {
  return { data: MOCK_TEMPLATES, isPending: false, isLoading: false }
}

export function useInsightList() {
  return { data: MOCK_INSIGHTS, isPending: false, isLoading: false }
}

export function useGenerateInsight() {
  return {
    mutate: async (req: any) => ({
      id: `ins-mock-${Date.now()}`,
      ...req,
      status: 'completed',
    }),
    mutateAsync: async (req: any) => ({
      id: `ins-mock-${Date.now()}`,
      ...req,
      status: 'completed',
    }),
    isPending: false,
  }
}
