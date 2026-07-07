/**
 * Phase 101 图像识别 前台 Types (V11 Sprint 3 Day 43)
 */

export type RecognitionEngine =
  | 'mock-yolov8'
  | 'mock-yolov8n-shelf'
  | 'mock-resnet50'
  | 'mock-clip'
  | 'mock-efficientnet'
  | 'mock-pHash'
  | 'mock-dHash'

export type RecognitionTaskType =
  | 'product_recognition'
  | 'shelf_analysis'
  | 'image_classification'
  | 'visual_search'
  | 'duplicate_detection'
  | 'object_detection'

export type RecognitionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedObject {
  id: string
  recognitionId: string
  label: string
  category?: string
  bbox: BoundingBox
  confidence: number
  skuId?: string
  productName?: string
  priceCny?: number
  quantity?: number
}

export interface ShelfAnalysis {
  totalSlots: number
  occupiedSlots: number
  occupancyRate: number
  outOfStock: string[]
  priceCompliance: number
  restockSuggestions: string[]
}

export interface VisualSearchHit {
  matchedAssetId: string
  similarity: number
  matchedFingerprint?: string
}

export interface DuplicateMatch {
  duplicateAssetId: string
  similarity: number
  fingerprint?: string
}

export interface RecognitionTask {
  id: string
  tenantId: string
  taskType: RecognitionTaskType
  engine: RecognitionEngine
  sourceAssetId: string
  filename: string
  status: RecognitionStatus
  progress: number
  durationMs?: number
  objectCount: number
  avgConfidence?: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface RecognitionResult {
  task: RecognitionTask
  objects: DetectedObject[]
  shelfAnalysis?: ShelfAnalysis
}

export interface RecognitionEngineMeta {
  type: RecognitionEngine
  displayName: string
  taskTypes: RecognitionTaskType[]
  avgTimeMs: number
  accuracy: number
  modelVersion: string
  classesSupported: number
}

export interface RecognitionStats {
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

// ============ 显示标签 ============

export const RECOGNITION_ENGINE_LABELS: Record<RecognitionEngine, string> = {
  'mock-yolov8': 'YOLOv8',
  'mock-yolov8n-shelf': 'YOLOv8n-Shelf',
  'mock-resnet50': 'ResNet-50',
  'mock-clip': 'CLIP',
  'mock-efficientnet': 'EfficientNet-B0',
  'mock-pHash': 'pHash',
  'mock-dHash': 'dHash',
}

export const TASK_TYPE_LABELS: Record<RecognitionTaskType, string> = {
  product_recognition: '商品识别',
  shelf_analysis: '货架分析',
  image_classification: '图像分类',
  visual_search: '视觉搜索',
  duplicate_detection: '重复检测',
  object_detection: '对象检测',
}

export const TASK_TYPE_ICONS: Record<RecognitionTaskType, string> = {
  product_recognition: '🛒',
  shelf_analysis: '🗄️',
  image_classification: '🏷️',
  visual_search: '🔍',
  duplicate_detection: '🧬',
  object_detection: '🎯',
}

export const STATUS_LABELS: Record<RecognitionStatus, string> = {
  pending: '等待中',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

export const STATUS_COLORS: Record<RecognitionStatus, string> = {
  pending: '#bfbfbf',
  processing: '#1890ff',
  completed: '#52c41a',
  failed: '#ff4d4f',
  cancelled: '#faad14',
}

export const ENGINE_TASK_MAP: Record<RecognitionTaskType, RecognitionEngine> = {
  product_recognition: 'mock-efficientnet',
  shelf_analysis: 'mock-yolov8n-shelf',
  image_classification: 'mock-clip',
  visual_search: 'mock-pHash',
  duplicate_detection: 'mock-dHash',
  object_detection: 'mock-yolov8',
}

/**
 * 置信度百分数
 */
export function confidencePct(conf: number): string {
  return `${(conf * 100).toFixed(1)}%`
}

/**
 * 时长 (ms) → 友好显示
 */
export function formatDuration(ms?: number): string {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/**
 * 占用率百分数
 */
export function occupancyPct(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`
}