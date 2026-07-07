/**
 * Phase 103 多模态融合 前台 Real Hooks (V11 Sprint 3 Day 46)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FusionTask, FusionTemplate, FusionEngine, FusionStats, CrossModalHit } from './types'

const MOCK_TASKS: FusionTask[] = [
  {
    id: 'task-001', taskType: 'comprehensive_analysis', title: '本周综合分析',
    description: '综合销售数据 + 客户反馈 + 货架审计',
    sources: [
      { source: 'tabular', sourceId: 'src-001', weight: 0.4, confidence: 0.95, keyFindings: ['销售增长 23%'] },
      { source: 'voice', sourceId: 'src-003', weight: 0.3, confidence: 0.88, keyFindings: ['12 条负面反馈'] },
    ],
    status: 'completed', progress: 1.0, insights: [], anomalies: [],
    durationMs: 1850, requestedBy: 'admin-A', createdAt: '2026-06-27T18:00:00Z',
  },
]
const MOCK_TEMPLATES: FusionTemplate[] = [
  { id: 'tpl-shelf-audit', title: '货架审计', description: '综合图像识别 + 文档 + 表格', taskType: 'comprehensive_analysis', defaultModalities: ['image', 'document', 'tabular'], icon: '🗄️' },
  { id: 'tpl-customer-feedback', title: '客户反馈汇总', description: '汇总语音 + 文本 + 文档', taskType: 'sentiment_synthesis', defaultModalities: ['voice', 'text', 'document'], icon: '💬' },
  { id: 'tpl-anomaly-detection', title: '异常检测', description: '多模态异常检测', taskType: 'anomaly_detection', defaultModalities: ['tabular', 'image', 'voice'], icon: '⚠️' },
]
const MOCK_ENGINES: FusionEngine[] = [
  { type: 'mock-gpt4-multimodal', displayName: 'GPT-4 Multimodal', avgLatencyMs: 1200, maxTokens: 8192, supportsTools: true, modality: ['image', 'document', 'voice', 'text'] },
  { type: 'mock-claude-sonnet-3.5', displayName: 'Claude 3.5 Sonnet', avgLatencyMs: 950, maxTokens: 8192, supportsTools: true, modality: ['image', 'document', 'text'] },
  { type: 'mock-qwen-vl', displayName: 'Qwen-VL', avgLatencyMs: 800, maxTokens: 4096, supportsTools: true, modality: ['image', 'document', 'text'] },
]
const MOCK_HITS: CrossModalHit[] = [
  { sourceAssetId: 'asset-shelf-01', modality: 'image', score: 0.92, matchedText: '可口可乐' },
  { documentId: 'doc-001', modality: 'document', score: 0.85, matchedText: '销量报表' },
]
const MOCK_STATS: FusionStats = {
  totalTasks: 78, completedTasks: 72, failedTasks: 3,
  totalInsights: 245, totalAnomalies: 18,
  byTaskType: {
    comprehensive_analysis: 28, anomaly_detection: 15, trend_insight: 12,
    report_generation: 10, sentiment_synthesis: 8, compliance_audit: 5,
  },
  avgConfidence: 0.89, avgDurationMs: 1240, criticalAnomalies: 4,
}

async function fetchTasksApi(_opts: any): Promise<FusionTask[]> { await new Promise((r) => setTimeout(r, 80)); return MOCK_TASKS }
async function fetchTaskApi(_id: string): Promise<FusionTask> { await new Promise((r) => setTimeout(r, 60)); return MOCK_TASKS[0]! }
async function fetchTemplatesApi(): Promise<FusionTemplate[]> { await new Promise((r) => setTimeout(r, 30)); return MOCK_TEMPLATES }
async function fetchEnginesApi(): Promise<FusionEngine[]> { await new Promise((r) => setTimeout(r, 30)); return MOCK_ENGINES }
async function fetchStatsApi(): Promise<FusionStats> { await new Promise((r) => setTimeout(r, 30)); return MOCK_STATS }
async function searchApi(_opts: any): Promise<CrossModalHit[]> { await new Promise((r) => setTimeout(r, 100)); return MOCK_HITS }

export function useFusionTasks(opts: { taskType?: string; status?: string; limit?: number } = {}) {
  return useQuery({ queryKey: ['fusion', 'tasks', opts], queryFn: () => fetchTasksApi(opts), staleTime: 30 * 1000 })
}
export function useFusionTask(taskId: string | null) {
  return useQuery({ queryKey: ['fusion', 'task', taskId], queryFn: () => fetchTaskApi(taskId!), enabled: !!taskId, staleTime: 60 * 1000 })
}
export function useFusionTemplates() {
  return useQuery({ queryKey: ['fusion', 'templates'], queryFn: fetchTemplatesApi, staleTime: 5 * 60 * 1000 })
}
export function useFusionEngines() {
  return useQuery({ queryKey: ['fusion', 'engines'], queryFn: fetchEnginesApi, staleTime: 5 * 60 * 1000 })
}
export function useFusionStats() {
  return useQuery({ queryKey: ['fusion', 'stats'], queryFn: fetchStatsApi, staleTime: 60 * 1000 })
}
export function useCrossModalSearch(opts: { query: string; modalities: string[]; topK?: number } | null) {
  return useQuery({ queryKey: ['fusion', 'search', opts], queryFn: () => searchApi(opts!), enabled: !!opts && !!opts.query, staleTime: 30 * 1000 })
}
export function useCreateFusionTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: any) => {
      await new Promise((r) => setTimeout(r, 800))
      return { ...MOCK_TASKS[0]!, id: `task-${Date.now().toString(36)}`, title: input.title }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fusion', 'tasks'] })
      qc.invalidateQueries({ queryKey: ['fusion', 'stats'] })
    },
  })
}
export function useCancelFusionTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => { await new Promise((r) => setTimeout(r, 100)); return { id: taskId, status: 'cancelled' } },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fusion', 'tasks'] }),
  })
}