/**
 * Phase 103 多模态融合 前台 Types (V11 Sprint 3 Day 46)
 */

export type FusionSource =
  | 'image'
  | 'document'
  | 'voice'
  | 'multimedia'
  | 'tabular'
  | 'text'

export type FusionTaskType =
  | 'comprehensive_analysis'
  | 'report_generation'
  | 'cross_modal_search'
  | 'anomaly_detection'
  | 'trend_insight'
  | 'entity_linking'
  | 'sentiment_synthesis'
  | 'compliance_audit'

export type FusionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success'

export interface FusionSourceContribution {
  source: FusionSource
  sourceId: string
  weight: number
  confidence: number
  keyFindings: string[]
}

export interface Insight {
  id: string
  title: string
  description: string
  severity: InsightSeverity
  category: string
  confidence: number
  evidenceSourceIds: string[]
  recommendation?: string
}

export interface Anomaly {
  id: string
  type: 'statistical' | 'pattern' | 'visual' | 'textual' | 'temporal'
  description: string
  severity: InsightSeverity
  confidence: number
  detectedAt: string
  sourceIds: string[]
  context: Record<string, any>
}

export interface CrossModalHit {
  sourceAssetId?: string
  documentId?: string
  recognitionId?: string
  sttTaskId?: string
  modality: FusionSource
  score: number
  matchedText?: string
}

export interface ComprehensiveReport {
  id: string
  taskId: string
  title: string
  sections: Array<{ heading: string; content: string }>
  summary: string
  createdAt: string
}

export interface FusionTask {
  id: string
  taskType: FusionTaskType
  title: string
  description?: string
  sources: FusionSourceContribution[]
  status: FusionStatus
  progress: number
  insights: Insight[]
  anomalies: Anomaly[]
  report?: ComprehensiveReport
  searchHits?: CrossModalHit[]
  durationMs?: number
  requestedBy: string
  createdAt: string
}

export interface FusionTemplate {
  id: string
  title: string
  description: string
  taskType: FusionTaskType
  defaultModalities: FusionSource[]
  icon: string
}

export interface FusionEngine {
  type: string
  displayName: string
  avgLatencyMs: number
  maxTokens: number
  supportsTools: boolean
  modality: FusionSource[]
}

export interface FusionStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalInsights: number
  totalAnomalies: number
  byTaskType: Record<string, number>
  avgConfidence: number
  avgDurationMs: number
  criticalAnomalies: number
}

// ============ Labels ============

export const FUSION_SOURCE_LABELS: Record<FusionSource, string> = {
  image: '图像', document: '文档', voice: '语音',
  multimedia: '多媒体', tabular: '表格', text: '文本',
}
export const FUSION_SOURCE_ICONS: Record<FusionSource, string> = {
  image: '🖼️', document: '📄', voice: '🎙️',
  multimedia: '🎬', tabular: '📊', text: '📝',
}
export const FUSION_SOURCE_COLORS: Record<FusionSource, string> = {
  image: '#1890ff', document: '#722ed1', voice: '#13c2c2',
  multimedia: '#f759ab', tabular: '#52c41a', text: '#fa8c16',
}
export const TASK_TYPE_LABELS: Record<FusionTaskType, string> = {
  comprehensive_analysis: '综合分析', report_generation: '报告生成',
  cross_modal_search: '跨模态搜索', anomaly_detection: '异常检测',
  trend_insight: '趋势洞察', entity_linking: '实体链接',
  sentiment_synthesis: '情感合成', compliance_audit: '合规审计',
}
export const TASK_TYPE_ICONS: Record<FusionTaskType, string> = {
  comprehensive_analysis: '🔮', report_generation: '📋', cross_modal_search: '🔍',
  anomaly_detection: '⚠️', trend_insight: '📈', entity_linking: '🔗',
  sentiment_synthesis: '💭', compliance_audit: '⚖️',
}
export const SEVERITY_LABELS: Record<InsightSeverity, string> = {
  info: '信息', warning: '警告', critical: '严重', success: '成功',
}
export const SEVERITY_COLORS: Record<InsightSeverity, string> = {
  info: '#1890ff', warning: '#faad14', critical: '#ff4d4f', success: '#52c41a',
}
export const STATUS_LABELS: Record<FusionStatus, string> = {
  pending: '等待中', processing: '处理中', completed: '已完成', failed: '失败', cancelled: '已取消',
}
export const STATUS_COLORS: Record<FusionStatus, string> = {
  pending: '#bfbfbf', processing: '#1890ff', completed: '#52c41a', failed: '#ff4d4f', cancelled: '#faad14',
}
export const ANOMALY_TYPE_LABELS: Record<Anomaly['type'], string> = {
  statistical: '统计异常', pattern: '模式异常', visual: '视觉异常', textual: '文本异常', temporal: '时序异常',
}

export function formatChangePercent(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}
export function directionIcon(direction: 'up' | 'down' | 'stable'): string {
  return direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'
}
export function directionColor(direction: 'up' | 'down' | 'stable'): string {
  return direction === 'up' ? '#52c41a' : direction === 'down' ? '#ff4d4f' : '#8c8c8c'
}