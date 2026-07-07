/**
 * Phase 103 多模态融合分析 Entity (V11 Sprint 3 Day 40)
 *
 * - 融合分析 (图像 + 文本 + 语音 + OCR + 货架)
 * - 智能报告生成
 * - 跨模态搜索
 * - 异常检测
 * - 趋势洞察
 */

export type FusionSource =
  | 'image'           // 图像识别 (Phase 101)
  | 'document'        // OCR + 文档 (Phase 100)
  | 'voice'           // STT 转写 (Phase 102)
  | 'multimedia'      // 多媒体资产 (Phase 99)
  | 'tabular'         // 表格数据
  | 'text'            // 自由文本

export type FusionTaskType =
  | 'comprehensive_analysis'  // 综合分析
  | 'report_generation'       // 报告生成
  | 'cross_modal_search'      // 跨模态搜索
  | 'anomaly_detection'       // 异常检测
  | 'trend_insight'           // 趋势洞察
  | 'entity_linking'          // 实体链接
  | 'sentiment_synthesis'     // 情感合成
  | 'compliance_audit'        // 合规审计

export type FusionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success'

/**
 * 单一数据源贡献
 */
export interface FusionSourceContribution {
  source: FusionSource
  sourceId: string
  weight: number
  confidence: number
  keyFindings: string[]
}

/**
 * 洞察 (Insight)
 */
export interface Insight {
  id: string
  title: string
  description: string
  severity: InsightSeverity
  category: string
  confidence: number
  /** 支撑数据源 */
  evidenceSourceIds: string[]
  /** 推荐行动 */
  recommendation?: string
}

/**
 * 异常 (Anomaly)
 */
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

/**
 * 跨模态搜索结果
 */
export interface CrossModalHit {
  sourceAssetId?: string
  documentId?: string
  recognitionId?: string
  sttTaskId?: string
  modality: FusionSource
  score: number
  matchedText?: string
  matchedRegion?: { x: number; y: number; width: number; height: number }
  matchedTimestampMs?: number
}

/**
 * 趋势洞察
 */
export interface TrendInsight {
  metric: string
  currentValue: number
  previousValue: number
  changePercent: number
  direction: 'up' | 'down' | 'stable'
  forecastNextPeriod?: number
  description: string
}

/**
 * 综合报告
 */
export interface ComprehensiveReport {
  reportId: string
  title: string
  summary: string
  sections: Array<{
    title: string
    content: string
    chartType?: 'bar' | 'line' | 'pie' | 'table'
    chartData?: any
  }>
  insights: Insight[]
  anomalies: Anomaly[]
  trends: TrendInsight[]
  confidence: number
  generatedAt: string
}

/**
 * 融合任务
 */
export interface FusionTask {
  id: string
  tenantId: string
  taskType: FusionTaskType
  title: string
  description?: string
  /** 输入数据源 */
  sources: FusionSourceContribution[]
  /** 状态 */
  status: FusionStatus
  /** 进度 */
  progress: number
  /** 耗时 (ms) */
  durationMs?: number
  /** 综合报告 */
  report?: ComprehensiveReport
  /** 洞察列表 */
  insights: Insight[]
  /** 异常列表 */
  anomalies: Anomaly[]
  /** 搜索结果 (跨模态搜索) */
  searchHits?: CrossModalHit[]
  /** 错误 */
  errorMessage?: string
  /** 调用方 */
  requestedBy: string
  /** 关联业务实体 */
  linkedEntity?: {
    entityType: 'product' | 'store' | 'campaign' | 'order' | 'report' | 'audit' | 'other'
    entityId: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * 融合模板 (预设的 source 组合)
 */
export interface FusionTemplate {
  id: string
  name: string
  description: string
  taskType: FusionTaskType
  sources: FusionSource[]
  defaultTitle: string
  estimatedDurationMs: number
}

/**
 * 引擎元信息
 */
export interface FusionEngine {
  type: 'mock-gpt4-multimodal' | 'mock-claude-multimodal' | 'mock-qwen-vl' | 'mock-glm-4v' | 'mock-minimax-vl'
  displayName: string
  supportsImage: boolean
  supportsDocument: boolean
  supportsAudio: boolean
  supportsVideo: boolean
  contextWindowTokens: number
  avgLatencyMs: number
  costPerCallCny: number
}

// ============ 工具函数 ============

export function generateFusionTaskId(): string {
  return `fus-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function generateInsightId(): string {
  return `ins-${Math.random().toString(36).slice(2, 10)}`
}

export function generateAnomalyId(): string {
  return `anm-${Math.random().toString(36).slice(2, 10)}`
}

export function generateReportId(): string {
  return `rpt-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

/**
 * 置信度加权平均
 */
export function weightedConfidence(contributions: FusionSourceContribution[]): number {
  if (contributions.length === 0) return 0
  let sumWeight = 0
  let sumConf = 0
  for (const c of contributions) {
    sumWeight += c.weight
    sumConf += c.confidence * c.weight
  }
  if (sumWeight === 0) return 0
  return sumConf / sumWeight
}

/**
 * 计算变化百分比
 */
export function calcChangePercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * 异常检测 (Z-Score)
 */
export function detectStatisticalAnomalies(values: number[], threshold = 2): number[] {
  if (values.length === 0) return []
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const std = Math.sqrt(variance)
  if (std === 0) return []
  const indices: number[] = []
  for (let i = 0; i < values.length; i++) {
    const z = Math.abs(((values[i] ?? 0) - mean) / std)
    if (z > threshold) indices.push(i)
  }
  return indices
}

/**
 * 情感聚合 (多模态情感)
 */
export function aggregateSentiment(scores: number[]): 'positive' | 'neutral' | 'negative' {
  if (scores.length === 0) return 'neutral'
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  if (avg > 0.2) return 'positive'
  if (avg < -0.2) return 'negative'
  return 'neutral'
}

/**
 * 文本相似度 (Levenshtein 简化版)
 */
export function textSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0
  const maxLen = Math.max(a.length, b.length)
  let matches = 0
  const shorter = a.length < b.length ? a : b
  const longer = a.length < b.length ? b : a
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] === longer[i]) matches++
  }
  return matches / maxLen
}

// ============ 模板与引擎 ============

export const FUSION_TEMPLATES: FusionTemplate[] = [
  {
    id: 'tpl-shelf-audit',
    name: '门店货架巡检报告',
    description: '综合图像识别 + OCR + 库存数据,生成货架合规审计',
    taskType: 'comprehensive_analysis',
    sources: ['image', 'document', 'tabular'],
    defaultTitle: '门店货架合规审计报告',
    estimatedDurationMs: 8000,
  },
  {
    id: 'tpl-customer-feedback',
    name: '客户反馈情感分析',
    description: '综合 STT 转写 + OCR 文本 + 评论数据,生成客户情感洞察',
    taskType: 'sentiment_synthesis',
    sources: ['voice', 'document', 'text'],
    defaultTitle: '客户反馈情感洞察报告',
    estimatedDurationMs: 6000,
  },
  {
    id: 'tpl-anomaly-detection',
    name: '业务异常检测',
    description: '综合表格数据 + 监控指标 + 文本告警,识别异常模式',
    taskType: 'anomaly_detection',
    sources: ['tabular', 'text', 'document'],
    defaultTitle: '业务异常检测报告',
    estimatedDurationMs: 4500,
  },
  {
    id: 'tpl-cross-modal-search',
    name: '跨模态内容检索',
    description: '跨图像 / 文档 / 语音的统一语义搜索',
    taskType: 'cross_modal_search',
    sources: ['image', 'document', 'voice'],
    defaultTitle: '跨模态检索结果',
    estimatedDurationMs: 3000,
  },
  {
    id: 'tpl-trend-forecast',
    name: '趋势预测',
    description: '综合历史数据 + 文档报告 + 语音会议,生成趋势预测',
    taskType: 'trend_insight',
    sources: ['tabular', 'document', 'voice'],
    defaultTitle: '业务趋势预测报告',
    estimatedDurationMs: 5000,
  },
  {
    id: 'tpl-compliance-audit',
    name: '合规审计',
    description: '跨文档/图像/语音的统一合规检查',
    taskType: 'compliance_audit',
    sources: ['document', 'image', 'voice', 'tabular'],
    defaultTitle: '合规审计综合报告',
    estimatedDurationMs: 10000,
  },
]

export const FUSION_ENGINES: FusionEngine[] = [
  {
    type: 'mock-gpt4-multimodal',
    displayName: 'GPT-4 Multimodal',
    supportsImage: true, supportsDocument: true, supportsAudio: false, supportsVideo: false,
    contextWindowTokens: 128000, avgLatencyMs: 3500, costPerCallCny: 0.3,
  },
  {
    type: 'mock-claude-multimodal',
    displayName: 'Claude 3.5 Sonnet',
    supportsImage: true, supportsDocument: true, supportsAudio: false, supportsVideo: false,
    contextWindowTokens: 200000, avgLatencyMs: 3000, costPerCallCny: 0.25,
  },
  {
    type: 'mock-qwen-vl',
    displayName: '通义千问 VL (国产)',
    supportsImage: true, supportsDocument: true, supportsAudio: true, supportsVideo: true,
    contextWindowTokens: 32000, avgLatencyMs: 2000, costPerCallCny: 0.05,
  },
  {
    type: 'mock-glm-4v',
    displayName: '智谱 GLM-4V (国产)',
    supportsImage: true, supportsDocument: true, supportsAudio: false, supportsVideo: false,
    contextWindowTokens: 32000, avgLatencyMs: 1800, costPerCallCny: 0.04,
  },
  {
    type: 'mock-minimax-vl',
    displayName: 'MiniMax-VL',
    supportsImage: true, supportsDocument: true, supportsAudio: true, supportsVideo: true,
    contextWindowTokens: 256000, avgLatencyMs: 2500, costPerCallCny: 0.1,
  },
]