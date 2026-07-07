/**
 * Phase 103 多模态融合 前台 Mock (V11 Sprint 3 Day 46 - SSR mock)
 */

import type {
  FusionTask, FusionTemplate, FusionEngine, FusionStats, CrossModalHit, Insight, Anomaly, ComprehensiveReport,
} from './types'

const MOCK_TEMPLATES: FusionTemplate[] = [
  { id: 'tpl-shelf-audit', title: '货架审计', description: '综合图像识别 + 文档 + 表格数据审计门店货架合规性', taskType: 'comprehensive_analysis', defaultModalities: ['image', 'document', 'tabular'], icon: '🗄️' },
  { id: 'tpl-customer-feedback', title: '客户反馈汇总', description: '汇总语音转写 + 文本评论 + 文档报告', taskType: 'sentiment_synthesis', defaultModalities: ['voice', 'text', 'document'], icon: '💬' },
  { id: 'tpl-anomaly-detection', title: '异常检测', description: '基于表格时序 + 图像 + 语音 多模态异常', taskType: 'anomaly_detection', defaultModalities: ['tabular', 'image', 'voice'], icon: '⚠️' },
  { id: 'tpl-cross-modal-search', title: '跨模态搜索', description: '跨图像/语音/文档/多媒体统一搜索', taskType: 'cross_modal_search', defaultModalities: ['image', 'voice', 'document', 'multimedia'], icon: '🔍' },
  { id: 'tpl-trend-forecast', title: '趋势预测', description: '基于表格 + 文本的趋势预测', taskType: 'trend_insight', defaultModalities: ['tabular', 'text'], icon: '📈' },
  { id: 'tpl-compliance-audit', title: '合规审计', description: '合规多模态审计 (文档/图像/表格/文本)', taskType: 'compliance_audit', defaultModalities: ['document', 'image', 'tabular', 'text'], icon: '⚖️' },
]

const MOCK_ENGINES: FusionEngine[] = [
  { type: 'mock-gpt4-multimodal', displayName: 'GPT-4 Multimodal', avgLatencyMs: 1200, maxTokens: 8192, supportsTools: true, modality: ['image', 'document', 'voice', 'text'] },
  { type: 'mock-claude-sonnet-3.5', displayName: 'Claude 3.5 Sonnet', avgLatencyMs: 950, maxTokens: 8192, supportsTools: true, modality: ['image', 'document', 'text'] },
  { type: 'mock-qwen-vl', displayName: 'Qwen-VL', avgLatencyMs: 800, maxTokens: 4096, supportsTools: true, modality: ['image', 'document', 'text'] },
  { type: 'mock-glm-4v', displayName: 'GLM-4V', avgLatencyMs: 700, maxTokens: 4096, supportsTools: false, modality: ['image', 'document'] },
  { type: 'mock-minimax-vl', displayName: 'MiniMax-VL', avgLatencyMs: 600, maxTokens: 4096, supportsTools: true, modality: ['image', 'document', 'voice'] },
]

const MOCK_INSIGHTS: Insight[] = [
  { id: 'ins-001', title: '销售数据异常上涨', description: '本周销售对比上周增长 23%,远超历史均值', severity: 'success', category: 'trend', confidence: 0.92, evidenceSourceIds: ['src-001'], recommendation: '建议增加库存以应对持续增长' },
  { id: 'ins-002', title: '客户反馈情感偏负面', description: '近期 38 条客户语音反馈中,12 条呈现负面情绪', severity: 'warning', category: 'sentiment', confidence: 0.88, evidenceSourceIds: ['src-003'], recommendation: '建议优先处理负面反馈' },
  { id: 'ins-003', title: '货架合规审计通过', description: '所有门店货架图片审计通过,价格合规率 96%', severity: 'success', category: 'compliance', confidence: 0.95, evidenceSourceIds: ['src-004'] },
]

const MOCK_ANOMALIES: Anomaly[] = [
  { id: 'an-001', type: 'statistical', description: '6 月 25 日销售数据 Z-Score > 2.5,异常高于均值', severity: 'critical', confidence: 0.93, detectedAt: '2026-06-25T10:00:00Z', sourceIds: ['src-001'], context: { zScore: 2.7, value: 18500 } },
  { id: 'an-002', type: 'pattern', description: '工作日下午 3 点客流持续偏低,与历史模式不符', severity: 'warning', confidence: 0.85, detectedAt: '2026-06-27T15:00:00Z', sourceIds: ['src-005'], context: {} },
]

const MOCK_HITS: CrossModalHit[] = [
  { sourceAssetId: 'asset-shelf-01', modality: 'image', score: 0.92, matchedText: '可口可乐' },
  { documentId: 'doc-001', modality: 'document', score: 0.85, matchedText: '销量报表' },
  { sttTaskId: 'stt-001', modality: 'voice', score: 0.78, matchedText: '我想咨询订单' },
]

const MOCK_REPORT: ComprehensiveReport = {
  id: 'rpt-001', taskId: 'task-001', title: '本周综合分析报告',
  sections: [
    { heading: '执行摘要', content: '本周整体表现良好,销售增长 23%,但客户反馈出现负面倾向。' },
    { heading: '销售趋势', content: '日均销售额 ¥18,500,环比增长 23%。' },
    { heading: '客户反馈', content: '38 条反馈中 12 条负面,主要集中在配送时效。' },
    { heading: '建议', content: '1. 增加热销品库存\n2. 改进配送流程\n3. 主动联系负面反馈客户' },
  ],
  summary: '整体表现良好,需关注客户体验。',
  createdAt: '2026-06-27T18:00:00Z',
}

const MOCK_TASKS: FusionTask[] = [
  {
    id: 'task-001', taskType: 'comprehensive_analysis', title: '本周综合分析',
    description: '综合销售数据 + 客户反馈 + 货架审计',
    sources: [
      { source: 'tabular', sourceId: 'src-001', weight: 0.4, confidence: 0.95, keyFindings: ['销售增长 23%'] },
      { source: 'voice', sourceId: 'src-003', weight: 0.3, confidence: 0.88, keyFindings: ['12 条负面反馈'] },
      { source: 'image', sourceId: 'src-004', weight: 0.3, confidence: 0.93, keyFindings: ['价格合规 96%'] },
    ],
    status: 'completed', progress: 1.0,
    insights: MOCK_INSIGHTS, anomalies: MOCK_ANOMALIES, report: MOCK_REPORT,
    durationMs: 1850, requestedBy: 'admin-A', createdAt: '2026-06-27T18:00:00Z',
  },
  {
    id: 'task-002', taskType: 'anomaly_detection', title: '销售异常检测',
    sources: [
      { source: 'tabular', sourceId: 'src-001', weight: 0.7, confidence: 0.95, keyFindings: [] },
      { source: 'image', sourceId: 'src-006', weight: 0.3, confidence: 0.85, keyFindings: [] },
    ],
    status: 'completed', progress: 1.0,
    insights: [MOCK_INSIGHTS[0]!], anomalies: [MOCK_ANOMALIES[0]!],
    durationMs: 920, requestedBy: 'admin-A', createdAt: '2026-06-27T16:00:00Z',
  },
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

export function useFusionTasks(_opts: { taskType?: string; status?: string; limit?: number } = {}) {
  return { data: MOCK_TASKS, isLoading: false }
}
export function useFusionTask(_taskId: string | null) { return { data: MOCK_TASKS[0], isLoading: false } }
export function useFusionTemplates() { return { data: MOCK_TEMPLATES, isLoading: false } }
export function useFusionEngines() { return { data: MOCK_ENGINES, isLoading: false } }
export function useFusionStats() { return { data: MOCK_STATS, isLoading: false } }
export function useCrossModalSearch(_opts: { query: string; modalities: string[]; topK?: number } | null) {
  return { data: MOCK_HITS, isLoading: false }
}
export function useCreateFusionTask() {
  return { mutate: (_input: any) => undefined, isPending: false, data: MOCK_TASKS[0] }
}
export function useCancelFusionTask() {
  return { mutate: (_taskId: string) => undefined, isPending: false }
}