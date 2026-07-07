/**
 * Phase 101 图像识别 DTO (V11 Sprint 3 Day 36)
 */

import type { RecognitionEngine, RecognitionTaskType } from './image-recognition.entity'

export interface CreateRecognitionDto {
  taskType: RecognitionTaskType
  engine?: RecognitionEngine
  sourceAssetId: string
  filename?: string
  linkedEntity?: {
    entityType: 'product' | 'shelf' | 'order' | 'store' | 'campaign' | 'other'
    entityId: string
  }
}

export interface VisualSearchDto {
  /** 源资产 ID */
  sourceAssetId: string
  /** 候选资产 ID 列表 (限定搜索范围) */
  candidateAssetIds?: string[]
  /** top-K */
  topK?: number
  /** 最低相似度 */
  minSimilarity?: number
}

export interface DuplicateDetectionDto {
  sourceAssetId: string
  /** 候选资产 ID 列表 */
  candidateAssetIds?: string[]
  /** 相似度阈值 */
  threshold?: number
}

export interface ListRecognitionQuery {
  taskType?: RecognitionTaskType
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  engine?: RecognitionEngine
  limit?: number
}

export interface RecognitionTaskResponse {
  id: string
  tenantId: string
  taskType: RecognitionTaskType
  engine: RecognitionEngine
  sourceAssetId: string
  filename: string
  status: string
  progress: number
  durationMs?: number
  objectCount: number
  errorMessage?: string
  avgConfidence?: number
  createdAt: string
  updatedAt: string
}

export interface DetectedObjectResponse {
  id: string
  recognitionId: string
  label: string
  category?: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  skuId?: string
  productName?: string
  priceCny?: number
  quantity?: number
}

export interface RecognitionStatsResponse {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalObjectsDetected: number
  byTaskType: Record<string, number>
  byEngine: Record<string, number>
  avgConfidence: number
  avgDurationMs: number
  duplicatesDetected: number
}