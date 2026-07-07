/**
 * Phase 101 图像识别 前台 Real Hooks (V11 Sprint 3 Day 43)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  RecognitionTask, RecognitionResult, RecognitionEngineMeta,
  RecognitionStats, VisualSearchHit, DuplicateMatch,
} from './types'

const API_BASE = '/api/image-recognition'

// ============ Mock 数据 ============

const MOCK_TASKS: RecognitionTask[] = [
  {
    id: 'rec-001', tenantId: 'tenant-A', taskType: 'product_recognition', engine: 'mock-efficientnet',
    sourceAssetId: 'asset-shelf-01', filename: 'shelf-morning.jpg', status: 'completed',
    progress: 1.0, durationMs: 420, objectCount: 5, avgConfidence: 0.92,
    createdAt: '2026-06-27T09:00:00Z', updatedAt: '2026-06-27T09:00:01Z',
  },
]

const MOCK_RESULT: RecognitionResult = {
  task: MOCK_TASKS[0]!,
  objects: [
    { id: 'obj-1', recognitionId: 'rec-001', label: '可口可乐 330ml', category: 'beverage',
      bbox: { x: 50, y: 80, width: 120, height: 180 }, confidence: 0.96,
      skuId: 'SKU-COKE-330', productName: '可口可乐 330ml', priceCny: 3.5, quantity: 6 },
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
    product_recognition: 38, shelf_analysis: 18, image_classification: 14,
    object_detection: 12, visual_search: 4, duplicate_detection: 3,
  },
  byEngine: {
    'mock-efficientnet': 38, 'mock-yolov8n-shelf': 18, 'mock-clip': 14,
    'mock-yolov8': 12, 'mock-pHash': 4, 'mock-dHash': 3,
  },
  avgConfidence: 0.89,
  avgDurationMs: 412,
  duplicatesDetected: 7,
}

async function fetchTasksApi(_opts: { taskType?: string; engine?: string; limit?: number }): Promise<RecognitionTask[]> {
  await new Promise((r) => setTimeout(r, 80))
  return MOCK_TASKS
}

async function fetchResultApi(_taskId: string): Promise<RecognitionResult> {
  await new Promise((r) => setTimeout(r, 60))
  return MOCK_RESULT
}

async function fetchEnginesApi(): Promise<RecognitionEngineMeta[]> {
  await new Promise((r) => setTimeout(r, 40))
  return MOCK_ENGINES
}

async function fetchStatsApi(): Promise<RecognitionStats> {
  await new Promise((r) => setTimeout(r, 30))
  return MOCK_STATS
}

async function visualSearchApi(_opts: { sourceAssetId: string; topK?: number }): Promise<{ items: VisualSearchHit[]; total: number }> {
  await new Promise((r) => setTimeout(r, 100))
  return {
    items: [
      { matchedAssetId: 'asset-shelf-02', similarity: 0.92 },
      { matchedAssetId: 'asset-shelf-03', similarity: 0.85 },
    ],
    total: 2,
  }
}

async function duplicateDetectionApi(_opts: { sourceAssetId: string; threshold?: number }): Promise<{ sourceAssetId: string; duplicates: DuplicateMatch[] }> {
  await new Promise((r) => setTimeout(r, 80))
  return {
    sourceAssetId: 'asset-shelf-01',
    duplicates: [{ duplicateAssetId: 'asset-shelf-02', similarity: 0.96 }],
  }
}

// ============ Hooks ============

export function useRecognitionTasks(opts: { taskType?: string; engine?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ['image-recognition', 'tasks', opts],
    queryFn: () => fetchTasksApi(opts),
    staleTime: 30 * 1000,
  })
}

export function useRecognitionResult(taskId: string | null) {
  return useQuery({
    queryKey: ['image-recognition', 'result', taskId],
    queryFn: () => fetchResultApi(taskId!),
    enabled: !!taskId,
    staleTime: 60 * 1000,
  })
}

export function useRecognitionEngines() {
  return useQuery({
    queryKey: ['image-recognition', 'engines'],
    queryFn: fetchEnginesApi,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecognitionStats() {
  return useQuery({
    queryKey: ['image-recognition', 'stats'],
    queryFn: fetchStatsApi,
    staleTime: 60 * 1000,
  })
}

export function useVisualSearch(opts: { sourceAssetId: string; topK?: number } | null) {
  return useQuery({
    queryKey: ['image-recognition', 'visual-search', opts],
    queryFn: () => visualSearchApi(opts!),
    enabled: !!opts,
    staleTime: 30 * 1000,
  })
}

export function useDuplicateDetection(opts: { sourceAssetId: string; threshold?: number } | null) {
  return useQuery({
    queryKey: ['image-recognition', 'duplicate', opts],
    queryFn: () => duplicateDetectionApi(opts!),
    enabled: !!opts,
    staleTime: 30 * 1000,
  })
}

export function useCreateRecognition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { taskType: string; engine?: string; sourceAssetId: string; filename?: string }) => {
      await new Promise((r) => setTimeout(r, 600))
      return { ...MOCK_RESULT, task: { ...MOCK_RESULT.task, id: `rec-${Date.now().toString(36)}` } }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['image-recognition', 'tasks'] })
      qc.invalidateQueries({ queryKey: ['image-recognition', 'stats'] })
    },
  })
}

export function useCancelRecognition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await new Promise((r) => setTimeout(r, 100))
      return { id: taskId, status: 'cancelled' }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['image-recognition', 'tasks'] })
    },
  })
}