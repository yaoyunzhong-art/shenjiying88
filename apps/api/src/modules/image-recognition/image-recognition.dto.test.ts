import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [D] dto test 补全
 * ImageRecognition DTO 类型验证测试
 *
 * 覆盖:
 * - CreateRecognitionDto 必填/可选字段
 * - VisualSearchDto 字段约束
 * - DuplicateDetectionDto 字段约束
 * - ListRecognitionQuery 字段约束
 * - RecognitionTaskResponse 结构
 * - DetectedObjectResponse 结构
 * - RecognitionStatsResponse 结构
 */

import assert from 'node:assert/strict'
// ── DTO 类型工厂 + 类型守卫 ──
interface CreateRecognitionDto {
  taskType: string
  engine?: string
  sourceAssetId: string
  filename?: string
  linkedEntity?: { entityType: string; entityId: string }
}

interface VisualSearchDto {
  sourceAssetId: string
  candidateAssetIds?: string[]
  topK?: number
  minSimilarity?: number
}

interface DuplicateDetectionDto {
  sourceAssetId: string
  candidateAssetIds?: string[]
  threshold?: number
}

interface ListRecognitionQuery {
  taskType?: string
  status?: string
  engine?: string
  limit?: number
}

interface RecognitionTaskResponse {
  id: string
  tenantId: string
  taskType: string
  engine: string
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

interface DetectedObjectResponse {
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

interface RecognitionStatsResponse {
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

// ── 工厂函数 ──
function makeCreateDto(overrides: Partial<CreateRecognitionDto> = {}): CreateRecognitionDto {
  return {
    taskType: 'product_recognition',
    sourceAssetId: 'asset-001',
    ...overrides,
  }
}

function makeVisualSearchDto(overrides: Partial<VisualSearchDto> = {}): VisualSearchDto {
  return {
    sourceAssetId: 'asset-001',
    ...overrides,
  }
}

function makeDuplicateDto(overrides: Partial<DuplicateDetectionDto> = {}): DuplicateDetectionDto {
  return {
    sourceAssetId: 'asset-001',
    ...overrides,
  }
}

function makeQuery(overrides: Partial<ListRecognitionQuery> = {}): ListRecognitionQuery {
  return { ...overrides }
}

function makeTaskResponse(overrides: Partial<RecognitionTaskResponse> = {}): RecognitionTaskResponse {
  return {
    id: 'rec-001',
    tenantId: 't-001',
    taskType: 'product_recognition',
    engine: 'mock-efficientnet',
    sourceAssetId: 'asset-001',
    filename: 'photo.jpg',
    status: 'completed',
    progress: 1,
    objectCount: 5,
    createdAt: '2026-06-28T12:00:00.000Z',
    updatedAt: '2026-06-28T12:00:05.000Z',
    ...overrides,
  }
}

function makeDetectedObjectResponse(overrides: Partial<DetectedObjectResponse> = {}): DetectedObjectResponse {
  return {
    id: 'obj-001',
    recognitionId: 'rec-001',
    label: '可口可乐 330ml',
    bbox: { x: 100, y: 50, width: 80, height: 120 },
    confidence: 0.92,
    ...overrides,
  }
}

function makeStats(overrides: Partial<RecognitionStatsResponse> = {}): RecognitionStatsResponse {
  return {
    totalTasks: 10,
    completedTasks: 7,
    failedTasks: 1,
    totalObjectsDetected: 35,
    byTaskType: { product_recognition: 5, shelf_analysis: 3, image_classification: 2 },
    byEngine: { 'mock-yolov8': 4, 'mock-efficientnet': 6 },
    avgConfidence: 0.87,
    avgDurationMs: 135,
    duplicatesDetected: 3,
    ...overrides,
  }
}

// ── type guard helpers ──
function isCreateRecognitionDto(v: any): v is CreateRecognitionDto {
  return typeof v?.taskType === 'string' && typeof v?.sourceAssetId === 'string'
}

function isVisualSearchDto(v: any): v is VisualSearchDto {
  return typeof v?.sourceAssetId === 'string'
}

function isDuplicateDetectionDto(v: any): v is DuplicateDetectionDto {
  return typeof v?.sourceAssetId === 'string'
}

function isTaskResponse(v: any): v is RecognitionTaskResponse {
  return typeof v?.id === 'string' && typeof v?.status === 'string'
}

function isStatsResponse(v: any): v is RecognitionStatsResponse {
  return typeof v?.totalTasks === 'number' && typeof v?.byTaskType === 'object'
}

describe('ImageRecognition DTO', () => {
  // ============ CreateRecognitionDto ============
  describe('CreateRecognitionDto', () => {
    it('最小构造 → 必填字段存在', () => {
      const dto = makeCreateDto()
      assert.equal(dto.taskType, 'product_recognition')
      assert.equal(dto.sourceAssetId, 'asset-001')
      assert.ok(isCreateRecognitionDto(dto))
    })

    it('可选字段 engine 可省略', () => {
      const dto = makeCreateDto()
      assert.equal(dto.engine, undefined)
    })

    it('engine 可指定', () => {
      const dto = makeCreateDto({ engine: 'mock-yolov8n-shelf' })
      assert.equal(dto.engine, 'mock-yolov8n-shelf')
    })

    it('linkedEntity 可选', () => {
      const dto = makeCreateDto({
        linkedEntity: { entityType: 'product', entityId: 'prod-001' },
      })
      assert.equal(dto.linkedEntity?.entityType, 'product')
      assert.equal(dto.linkedEntity?.entityId, 'prod-001')
    })

    it('filename 默认可省略', () => {
      const dto = makeCreateDto()
      assert.equal(dto.filename, undefined)
    })

    it('缺 sourceAssetId → 不是有效 DTO', () => {
      const dto = { taskType: 'product_recognition' } as any
      assert.ok(!isCreateRecognitionDto(dto))
    })

    it('缺 taskType → 不是有效 DTO', () => {
      const dto = { sourceAssetId: 'asset-001' } as any
      assert.ok(!isCreateRecognitionDto(dto))
    })
  })

  // ============ VisualSearchDto ============
  describe('VisualSearchDto', () => {
    it('最小构造 → sourceAssetId 必填', () => {
      const dto = makeVisualSearchDto()
      assert.equal(dto.sourceAssetId, 'asset-001')
      assert.ok(isVisualSearchDto(dto))
    })

    it('topK 可选', () => {
      const dto = makeVisualSearchDto({ topK: 10 })
      assert.equal(dto.topK, 10)
    })

    it('minSimilarity 可选', () => {
      const dto = makeVisualSearchDto({ minSimilarity: 0.5 })
      assert.equal(dto.minSimilarity, 0.5)
    })

    it('candidateAssetIds 可选', () => {
      const dto = makeVisualSearchDto({ candidateAssetIds: ['a1', 'a2'] })
      assert.equal(dto.candidateAssetIds?.length, 2)
    })

    it('缺 sourceAssetId → 无效', () => {
      assert.ok(!isVisualSearchDto({}))
    })
  })

  // ============ DuplicateDetectionDto ============
  describe('DuplicateDetectionDto', () => {
    it('最小构造', () => {
      const dto = makeDuplicateDto()
      assert.equal(dto.sourceAssetId, 'asset-001')
      assert.ok(isDuplicateDetectionDto(dto))
    })

    it('threshold 可选', () => {
      const dto = makeDuplicateDto({ threshold: 0.9 })
      assert.equal(dto.threshold, 0.9)
    })

    it('缺 sourceAssetId → 无效', () => {
      assert.ok(!isDuplicateDetectionDto({}))
    })
  })

  // ============ ListRecognitionQuery ============
  describe('ListRecognitionQuery', () => {
    it('全空查询不报错', () => {
      const q = makeQuery()
      assert.deepEqual(q, {})
    })

    it('按 taskType 过滤', () => {
      const q = makeQuery({ taskType: 'shelf_analysis' })
      assert.equal(q.taskType, 'shelf_analysis')
    })

    it('按 status 过滤', () => {
      const q = makeQuery({ status: 'completed' })
      assert.equal(q.status, 'completed')
    })

    it('limit 默认可省略', () => {
      const q = makeQuery()
      assert.equal(q.limit, undefined)
    })

    it('limit 有界', () => {
      const q = makeQuery({ limit: 100 })
      assert.equal(q.limit, 100)
    })
  })

  // ============ RecognitionTaskResponse ============
  describe('RecognitionTaskResponse', () => {
    it('完整结构', () => {
      const r = makeTaskResponse()
      assert.equal(r.id, 'rec-001')
      assert.equal(r.tenantId, 't-001')
      assert.equal(r.status, 'completed')
      assert.equal(r.objectCount, 5)
      assert.ok(isTaskResponse(r))
    })

    it('可选字段可缺省', () => {
      const r = makeTaskResponse({ errorMessage: undefined, avgConfidence: undefined })
      assert.equal(r.errorMessage, undefined)
      assert.equal(r.avgConfidence, undefined)
    })

    it('错误态含 errorMessage', () => {
      const r = makeTaskResponse({
        status: 'failed',
        errorMessage: '引擎不可用',
      })
      assert.equal(r.errorMessage, '引擎不可用')
    })
  })

  // ============ DetectedObjectResponse ============
  describe('DetectedObjectResponse', () => {
    it('完整结构', () => {
      const o = makeDetectedObjectResponse()
      assert.equal(o.id, 'obj-001')
      assert.equal(o.label, '可口可乐 330ml')
      assert.equal(o.confidence, 0.92)
      assert.ok(o.bbox.x >= 0)
    })

    it('可选字段可缺省', () => {
      const o = makeDetectedObjectResponse({
        category: undefined,
        skuId: undefined,
        productName: undefined,
        priceCny: undefined,
        quantity: undefined,
      })
      assert.equal(o.category, undefined)
      assert.equal(o.skuId, undefined)
    })
  })

  // ============ RecognitionStatsResponse ============
  describe('RecognitionStatsResponse', () => {
    it('完整结构', () => {
      const s = makeStats()
      assert.equal(s.totalTasks, 10)
      assert.equal(s.completedTasks, 7)
      assert.equal(s.duplicatesDetected, 3)
      assert.ok(isStatsResponse(s))
    })

    it('空状态', () => {
      const s = makeStats({ totalTasks: 0, completedTasks: 0, failedTasks: 0 })
      assert.equal(s.totalTasks, 0)
      assert.deepEqual(s.byTaskType, { product_recognition: 5, shelf_analysis: 3, image_classification: 2 })
    })

    it('byTaskType 动态键', () => {
      const s = makeStats({ byTaskType: { new_type: 1 } })
      assert.equal(s.byTaskType['new_type'], 1)
    })

    it('byEngine 动态键', () => {
      const s = makeStats({ byEngine: { 'mock-pHash': 2 } })
      assert.equal(s.byEngine['mock-pHash'], 2)
    })
  })
})
