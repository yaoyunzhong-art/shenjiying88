/**
 * Phase 94 智能分析 Hooks (V10 Sprint 2 Day 18)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  InsightResponse,
  InsightTemplate,
  InsightTemplateType,
} from './types'

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
    content: '## 关键发现\n- 6 月销售额环比增长 12.5%\n- 客单价从 ¥85 提升至 ¥95\n\n## 行动建议\n- 持续投入热销品类的营销资源\n- 关注午后高峰时段的转化漏斗',
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

async function fetchTemplatesApi(): Promise<InsightTemplate[]> {
  await new Promise((r) => setTimeout(r, 30))
  return MOCK_TEMPLATES
}

async function fetchInsightsApi(): Promise<InsightResponse[]> {
  await new Promise((r) => setTimeout(r, 60))
  return MOCK_INSIGHTS
}

async function generateInsightApi(req: {
  templateType: InsightTemplateType
  sources: { type: string; refId: string; dataSnapshot: Record<string, unknown>; period: { from: string; to: string } }[]
  force?: boolean
}): Promise<InsightResponse> {
  await new Promise((r) => setTimeout(r, 1500))
  return {
    id: `ins-${Date.now().toString(36)}`,
    tenantId: 'tenant-A',
    templateType: req.templateType,
    status: 'completed',
    content: `## 关键发现 (${req.templateType})\n- 数据源: ${req.sources.length} 个\n- 已分析完成\n\n## 行动建议\n- 持续监控核心指标`,
    modelId: 'preset-deepseek',
    tokenUsage: { prompt: 250, completion: 80, total: 330 },
    sources: req.sources.map((s) => ({ type: s.type as any, refId: s.refId, period: s.period })),
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdBy: 'admin',
    cached: false,
  }
}

export function useInsightTemplates() {
  return useQuery({
    queryKey: ['insight-templates'],
    queryFn: fetchTemplatesApi,
    staleTime: 5 * 60 * 1000,
  })
}

export function useInsightList() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsightsApi,
    staleTime: 30 * 1000,
  })
}

export function useGenerateInsight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateInsightApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  })
}
