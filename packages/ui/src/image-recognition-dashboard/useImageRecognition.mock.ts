/**
 * Phase 101 图像识别 前台 Mock (V11 Sprint 3 Day 43 - SSR mock)
 */

import type {
  RecognitionTask, RecognitionResult, RecognitionEngineMeta,
  RecognitionStats, VisualSearchHit, DuplicateMatch,
} from './types'

const MOCK_TASKS: RecognitionTask[] = [
  {
    id: 'rec-001',
    tenantId: 'tenant-A',
    taskType: 'product_recognition',
    engine: 'mock-efficientnet',
    sourceAssetId: 'asset-shelf-01',
    filename: 'shelf-morning.jpg',
    status: 'completed',
    progress: 1.0,
    durationMs: 420,
    objectCount: 5,
    avgConfidence: 0.92,
    createdAt: '2026-06-27T09:00:00Z',
    updatedAt: '2026-06-27T09:00:01Z',
  },
  {
    id: 'rec-002',
    tenantId: 'tenant-A',
    taskType: 'shelf_analysis',
    engine: 'mock-yolov8n-shelf',
    sourceAssetId: 'asset-shelf-02',
    filename: 'shelf-evening.jpg',
    status: 'completed',
    progress: 1.0,
    durationMs: 680,
    objectCount: 24,
    avgConfidence: 0.87,
    createdAt: '2026-06-27T18:30:00Z',
    updatedAt: '2026-06-27T18:30:01Z',
  },
  {
    id: 'rec-003',
    tenantId: 'tenant-A',
    taskType: 'image_classification',
    engine: 'mock-clip',
    sourceAssetId: 'asset-team-photo',
    filename: 'team-building.jpg',
    status: 'completed',
    progress: 1.0,
    durationMs: 250,
    objectCount: 1,
    avgConfidence: 0.95,
    createdAt: '2026-06-26T14:00:00Z',
    updatedAt: '2026-06-26T14:00:01Z',
  },
]

const MOCK_RESULT_001: RecognitionResult = {
  task: MOCK_TASKS[0]!,
  objects: [
    { id: 'obj-1', recognitionId: 'rec-001', label: '可口可乐 330ml', category: 'beverage', bbox: { x: 50, y: 80, width: 120, height: 180 }, confidence: 0.96, skuId: 'SKU-COKE-330', productName: '可口可乐 330ml', priceCny: 3.5, quantity: 6 },
    { id: 'obj-2', recognitionId: 'rec-001', label: '雪碧 500ml', category: 'beverage', bbox: { x: 180, y: 80, width: 120, height: 180 }, confidence: 0.93, skuId: 'SKU-SPRITE-500', productName: '雪碧 500ml', priceCny: 4.0, quantity: 4 },
    { id: 'obj-3', recognitionId: 'rec-001', label: '农夫山泉 550ml', category: 'beverage', bbox: { x: 310, y: 80, width: 120, height: 180 }, confidence: 0.91, skuId: 'SKU-NSW-550', productName: '农夫山泉 550ml', priceCny: 2.0, quantity: 8 },
    { id: 'obj-4', recognitionId: 'rec-001', label: '百事可乐 500ml', category: 'beverage', bbox: { x: 50, y: 280, width: 120, height: 180 }, confidence: 0.89, skuId: 'SKU-PEPSI-500', productName: '百事可乐 500ml', priceCny: 3.5, quantity: 3 },
    { id: 'obj-5', recognitionId: 'rec-001', label: '芬达橙汁 330ml', category: 'beverage', bbox: { x: 180, y: 280, width: 120, height: 180 }, confidence: 0.88, skuId: 'SKU-FANTA-330', productName: '芬达橙汁 330ml', priceCny: 3.0, quantity: 5 },
  ],
}

const MOCK_RESULT_002: RecognitionResult = {
  task: MOCK_TASKS[1]!,
  objects: [],
  shelfAnalysis: {
    totalSlots: 24,
    occupiedSlots: 18,
    occupancyRate: 0.75,
    outOfStock: ['SKU-COKE-330', 'SKU-PEPSI-500'],
    priceCompliance: 0.96,
    restockSuggestions: [
      '建议补货 可口可乐 330ml (缺货)',
      '建议补货 百事可乐 500ml (缺货)',
      '建议检查 雪碧 500ml 价签',
    ],
  },
}

const MOCK_RESULT_003: RecognitionResult = {
  task: MOCK_TASKS[2]!,
  objects: [
    { id: 'obj-cls-1', recognitionId: 'rec-003', label: '团队建设活动', category: 'event', bbox: { x: 0, y: 0, width: 1920, height: 1080 }, confidence: 0.95 },
  ],
}

const MOCK_ENGINES: RecognitionEngineMeta[] = [
  { type: 'mock-yolov8', displayName: 'YOLOv8', taskTypes: ['object_detection'], avgTimeMs: 380, accuracy: 0.91, modelVersion: 'yolov8n-v8.2', classesSupported: 80 },
  { type: 'mock-yolov8n-shelf', displayName: 'YOLOv8n-Shelf', taskTypes: ['shelf_analysis'], avgTimeMs: 680, accuracy: 0.87, modelVersion: 'yolov8n-shelf-v1.4', classesSupported: 50 },
  { type: 'mock-resnet50', displayName: 'ResNet-50', taskTypes: ['image_classification'], avgTimeMs: 180, accuracy: 0.88, modelVersion: 'resnet50-v2', classesSupported: 1000 },
  { type: 'mock-clip', displayName: 'CLIP', taskTypes: ['image_classification', 'visual_search'], avgTimeMs: 250, accuracy: 0.93, modelVersion: 'clip-vit-l14', classesSupported: 50000 },
  { type: 'mock-efficientnet', displayName: 'EfficientNet-B0', taskTypes: ['product_recognition'], avgTimeMs: 420, accuracy: 0.92, modelVersion: 'efficientnet-b0-v3', classesSupported: 1200 },
  { type: 'mock-pHash', displayName: 'pHash', taskTypes: ['visual_search', 'duplicate_detection'], avgTimeMs: 30, accuracy: 0.85, modelVersion: 'phash-64bit', classesSupported: 0 },
  { type: 'mock-dHash', displayName: 'dHash', taskTypes: ['duplicate_detection'], avgTimeMs: 25, accuracy: 0.83, modelVersion: 'dhash-64bit', classesSupported: 0 },
]

const MOCK_STATS: RecognitionStats = {
  totalTasks: 89,
  completedTasks: 82,
  failedTasks: 4,
  totalObjectsDetected: 412,
  byTaskType: {
    product_recognition: 38,
    shelf_analysis: 18,
    image_classification: 14,
    object_detection: 12,
    visual_search: 4,
    duplicate_detection: 3,
  },
  byEngine: {
    'mock-efficientnet': 38,
    'mock-yolov8n-shelf': 18,
    'mock-clip': 14,
    'mock-yolov8': 12,
    'mock-pHash': 4,
    'mock-dHash': 3,
  },
  avgConfidence: 0.89,
  avgDurationMs: 412,
  duplicatesDetected: 7,
}

const MOCK_VISUAL_HITS: VisualSearchHit[] = [
  { matchedAssetId: 'asset-shelf-02', similarity: 0.92 },
  { matchedAssetId: 'asset-shelf-03', similarity: 0.85 },
  { matchedAssetId: 'asset-shelf-04', similarity: 0.78 },
]

const MOCK_DUPLICATES: DuplicateMatch[] = [
  { duplicateAssetId: 'asset-shelf-02', similarity: 0.96 },
  { duplicateAssetId: 'asset-shelf-03', similarity: 0.88 },
]

// ============ Hooks (SSR mock) ============

export function useRecognitionTasks(_opts: { taskType?: string; engine?: string; limit?: number } = {}) {
  return { data: MOCK_TASKS, isLoading: false }
}

export function useRecognitionResult(_taskId: string) {
  return {
    data: MOCK_RESULT_001,
    isLoading: false,
  }
}

export function useRecognitionEngines() {
  return { data: MOCK_ENGINES, isLoading: false }
}

export function useRecognitionStats() {
  return { data: MOCK_STATS, isLoading: false }
}

export function useVisualSearch(_opts: { sourceAssetId: string; topK?: number }) {
  return { data: { items: MOCK_VISUAL_HITS, total: MOCK_VISUAL_HITS.length }, isLoading: false }
}

export function useDuplicateDetection(_opts: { sourceAssetId: string; threshold?: number }) {
  return { data: { sourceAssetId: 'asset-shelf-01', duplicates: MOCK_DUPLICATES }, isLoading: false }
}

export function useCreateRecognition() {
  return {
    mutate: (_input: any) => undefined,
    isPending: false,
    data: MOCK_RESULT_001,
  }
}

export function useCancelRecognition() {
  return {
    mutate: (_taskId: string) => undefined,
    isPending: false,
  }
}