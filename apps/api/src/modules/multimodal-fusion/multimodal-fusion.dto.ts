/**
 * Phase 103 多模态融合分析 DTO (V11 Sprint 3 Day 40)
 */

import type {
  FusionSource, FusionTaskType, FusionEngine,
  FusionSourceContribution, InsightSeverity,
} from './multimodal-fusion.entity'

export interface CreateFusionTaskDto {
  taskType: FusionTaskType
  title: string
  description?: string
  /** 模板 ID (可选, 预设 source 组合) */
  templateId?: string
  /** 引擎 */
  engine?: FusionEngine
  /** 输入数据源 */
  sources: FusionSourceContribution[]
  /** 关联业务实体 */
  linkedEntity?: {
    entityType: 'product' | 'store' | 'campaign' | 'order' | 'report' | 'audit' | 'other'
    entityId: string
  }
}

export interface CrossModalSearchDto {
  /** 查询文本 */
  query: string
  /** 搜索范围模态 */
  modalities: FusionSource[]
  /** 时间范围 (可选) */
  startTime?: string
  endTime?: string
  /** top-K */
  topK?: number
}

export interface ListFusionTasksQuery {
  taskType?: FusionTaskType
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  limit?: number
}

export interface FusionTaskResponse {
  id: string
  tenantId: string
  taskType: FusionTaskType
  title: string
  status: string
  progress: number
  durationMs?: number
  sourceCount: number
  insightCount: number
  anomalyCount: number
  avgConfidence?: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface FusionStatsResponse {
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