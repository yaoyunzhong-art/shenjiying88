import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [D] entity test 补全
 * ImageRecognition Entity 类型 + 工具函数验证
 *
 * 覆盖:
 * - 所有 Entity 接口结构验证
 * - 引擎元数据 STRUCTURE
 * - 工具函数: computePerceptualHash, computeDifferenceHash,
 *   hammingDistance, distanceToSimilarity, cosineSimilarity, iou
 * - mockEmbedding, mockBbox, getModelVersion, ID 生成器
 */

import assert from 'node:assert/strict'
import {
  ENGINE_META,
  getModelVersion,
  mockEmbedding,
  mockBbox,
  generateRecognitionId,
  generateObjectId,
  generateFingerprintId,
  computePerceptualHash,
  computeDifferenceHash,
  hammingDistance,
  distanceToSimilarity,
  cosineSimilarity,
  iou,
} from './image-recognition.entity'

// ── Entity 类型工厂 ──

interface DetectedObject {
  id: string
  recognitionId: string
  tenantId: string
  label: string
  category?: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  skuId?: string
  productName?: string
  priceCny?: number
  quantity?: number
  createdAt: string
}

interface ShelfAnalysis {
  totalSlots: number
  occupiedSlots: number
  emptySlots: number
  occupancyRate: number
  outOfStock: Array<{ skuId: string; productName: string; quantity: number }>
  priceCompliance: {
    correctCount: number
    incorrectCount: number
    issues: Array<{ skuId: string; expectedPrice: number; detectedPrice: number }>
  }
  tidiness: number
  restockSuggestions: Array<{ skuId: string; productName: string; suggestedQuantity: number }>
}

interface RecognitionTask {
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
  linkedEntity?: { entityType: string; entityId: string }
  requestedBy: string
  createdAt: string
  updatedAt: string
}

interface VisualFingerprint {
  assetId: string
  tenantId: string
  pHash: string
  dHash: string
  colorHistogram: { r: number; g: number; b: number }
  embedding: number[]
  thumbnailSize: number
  createdAt: string
}

interface VisualSearchResult {
  sourceAssetId: string
  matchedAssetId: string
  similarity: number
  distance: number
  thumbnailUrl?: string
  matchedAt: string
}

interface DuplicateDetection {
  sourceAssetId: string
  duplicates: Array<{ assetId: string; pHash: string; distance: number; similarity: number }>
}

// ── 工厂 ──
function makeDetectedObject(overrides: Partial<DetectedObject> = {}): DetectedObject {
  return {
    id: 'obj-001',
    recognitionId: 'rec-001',
    tenantId: 't-001',
    label: '可口可乐 330ml',
    bbox: { x: 100, y: 50, width: 80, height: 120 },
    confidence: 0.92,
    createdAt: '2026-06-28T12:00:00.000Z',
    ...overrides,
  }
}

function makeShelfAnalysis(overrides: Partial<ShelfAnalysis> = {}): ShelfAnalysis {
  return {
    totalSlots: 24,
    occupiedSlots: 18,
    emptySlots: 6,
    occupancyRate: 0.75,
    outOfStock: [{ skuId: 'SKU-A1', productName: '可口可乐', quantity: 0 }],
    priceCompliance: { correctCount: 17, incorrectCount: 1, issues: [] },
    tidiness: 0.9,
    restockSuggestions: [],
    ...overrides,
  }
}

function makeTask(overrides: Partial<RecognitionTask> = {}): RecognitionTask {
  return {
    id: 'rec-001',
    tenantId: 't-001',
    taskType: 'product_recognition',
    engine: 'mock-efficientnet',
    sourceAssetId: 'asset-001',
    filename: 'photo.jpg',
    status: 'completed',
    progress: 1,
    objectCount: 3,
    requestedBy: 'user-001',
    createdAt: '2026-06-28T12:00:00.000Z',
    updatedAt: '2026-06-28T12:00:05.000Z',
    ...overrides,
  }
}

function makeFingerprint(overrides: Partial<VisualFingerprint> = {}): VisualFingerprint {
  return {
    assetId: 'asset-001',
    tenantId: 't-001',
    pHash: 'a1b2c3d4e5f6g7h8',
    dHash: 'h8g7f6e5d4c3b2a1',
    colorHistogram: { r: 128, g: 100, b: 80 },
    embedding: [0.1, 0.2, 0.3],
    thumbnailSize: 256,
    createdAt: '2026-06-28T12:00:00.000Z',
    ...overrides,
  }
}

function makeVisualSearchResult(overrides: Partial<VisualSearchResult> = {}): VisualSearchResult {
  return {
    sourceAssetId: 'asset-001',
    matchedAssetId: 'asset-002',
    similarity: 0.92,
    distance: 3,
    matchedAt: '2026-06-28T12:00:00.000Z',
    ...overrides,
  }
}

function makeDuplicateDetection(overrides: Partial<DuplicateDetection> = {}): DuplicateDetection {
  return {
    sourceAssetId: 'asset-001',
    duplicates: [
      { assetId: 'asset-003', pHash: 'abcd1234', distance: 2, similarity: 0.95 },
    ],
    ...overrides,
  }
}

describe('ImageRecognition Entity', () => {
  // ============ 1. DetectedObject ============
  describe('1. DetectedObject', () => {
    it('最小构造', () => {
      const obj = makeDetectedObject()
      assert.equal(obj.id, 'obj-001')
      assert.equal(obj.label, '可口可乐 330ml')
      assert.ok(obj.confidence > 0)
    })

    it('skuId 可选', () => {
      const obj = makeDetectedObject({ skuId: 'SKU-001' })
      assert.equal(obj.skuId, 'SKU-001')
    })

    it('priceCny 可选', () => {
      const obj = makeDetectedObject({ priceCny: 5.5 })
      assert.equal(obj.priceCny, 5.5)
    })

    it('bbox 含完整坐标', () => {
      const obj = makeDetectedObject({ bbox: { x: 0, y: 0, width: 100, height: 200 } })
      assert.equal(obj.bbox.width, 100)
      assert.equal(obj.bbox.height, 200)
    })

    it('空字符串 label 合理但不禁止', () => {
      const obj = makeDetectedObject({ label: '' })
      assert.equal(obj.label, '')
    })
  })

  // ============ 2. ShelfAnalysis ============
  describe('2. ShelfAnalysis', () => {
    it('完整结构', () => {
      const sa = makeShelfAnalysis()
      assert.equal(sa.totalSlots, 24)
      assert.equal(sa.occupiedSlots, 18)
      assert.ok(sa.occupancyRate > 0 && sa.occupancyRate <= 1)
    })

    it('全空货架', () => {
      const sa = makeShelfAnalysis({ occupiedSlots: 0, emptySlots: 24, occupancyRate: 0 })
      assert.equal(sa.occupiedSlots, 0)
      assert.equal(sa.occupancyRate, 0)
    })

    it('全满货架', () => {
      const sa = makeShelfAnalysis({ occupiedSlots: 24, emptySlots: 0, occupancyRate: 1 })
      assert.equal(sa.occupiedSlots, 24)
      assert.equal(sa.occupancyRate, 1)
    })

    it('tidiness 0..1', () => {
      const sa = makeShelfAnalysis()
      assert.ok(sa.tidiness >= 0 && sa.tidiness <= 1)
    })
  })

  // ============ 3. RecognitionTask ============
  describe('3. RecognitionTask', () => {
    it('完整结构', () => {
      const t = makeTask()
      assert.equal(t.id, 'rec-001')
      assert.equal(t.status, 'completed')
      assert.equal(t.progress, 1)
    })

    it('错误态含 errorMessage', () => {
      const t = makeTask({ status: 'failed', errorMessage: '模型崩溃' })
      assert.equal(t.errorMessage, '模型崩溃')
    })

    it('linkedEntity 可选', () => {
      const t = makeTask({ linkedEntity: { entityType: 'product', entityId: 'p-1' } })
      assert.equal(t.linkedEntity?.entityId, 'p-1')
    })
  })

  // ============ 4. VisualFingerprint ============
  describe('4. VisualFingerprint', () => {
    it('完整结构', () => {
      const fp = makeFingerprint()
      assert.equal(fp.assetId, 'asset-001')
      assert.equal(fp.pHash.length, 16)
      assert.ok(Array.isArray(fp.embedding))
    })

    it('embedding 非空', () => {
      const fp = makeFingerprint()
      assert.ok(fp.embedding.length > 0)
    })

    it('colorHistogram 含 R/G/B', () => {
      const fp = makeFingerprint()
      assert.ok(fp.colorHistogram.r >= 0 && fp.colorHistogram.r <= 255)
      assert.ok(fp.colorHistogram.g >= 0 && fp.colorHistogram.g <= 255)
      assert.ok(fp.colorHistogram.b >= 0 && fp.colorHistogram.b <= 255)
    })
  })

  // ============ 5. VisualSearchResult ============
  describe('5. VisualSearchResult', () => {
    it('完整结构', () => {
      const vs = makeVisualSearchResult()
      assert.equal(vs.sourceAssetId, 'asset-001')
      assert.equal(vs.matchedAssetId, 'asset-002')
      assert.ok(vs.similarity >= 0 && vs.similarity <= 1)
    })

    it('similarity 边界 0', () => {
      const vs = makeVisualSearchResult({ similarity: 0 })
      assert.equal(vs.similarity, 0)
    })

    it('similarity 边界 1', () => {
      const vs = makeVisualSearchResult({ similarity: 1 })
      assert.equal(vs.similarity, 1)
    })
  })

  // ============ 6. DuplicateDetection ============
  describe('6. DuplicateDetection', () => {
    it('完整结构', () => {
      const dd = makeDuplicateDetection()
      assert.equal(dd.sourceAssetId, 'asset-001')
      assert.ok(dd.duplicates.length > 0)
    })

    it('空结果', () => {
      const dd = makeDuplicateDetection({ duplicates: [] })
      assert.equal(dd.duplicates.length, 0)
    })
  })

  // ============ 7. ENGINE_META 结构 ============
  describe('7. ENGINE_META', () => {
    it('7 个引擎', () => {
      assert.equal(Object.keys(ENGINE_META).length, 7)
    })

    it('每个引擎有完整元数据', () => {
      for (const [type, meta] of Object.entries(ENGINE_META)) {
        assert.ok(typeof meta.displayName === 'string', `${type}.displayName`)
        assert.ok(['detection', 'classification', 'embedding'].includes(meta.category), `${type}.category`)
        assert.ok(Array.isArray(meta.taskTypes), `${type}.taskTypes`)
        assert.ok(meta.taskTypes.length > 0, `${type}.taskTypes non-empty`)
        assert.ok(typeof meta.classesSupported === 'number', `${type}.classesSupported`)
        assert.ok(typeof meta.avgTimeMs === 'number', `${type}.avgTimeMs`)
        assert.ok(typeof meta.accuracy === 'number', `${type}.accuracy`)
      }
    })

    it('mock-yolov8 支持 object_detection', () => {
      assert.ok(ENGINE_META['mock-yolov8'].taskTypes.includes('object_detection'))
    })

    it('mock-clip 支持 visual_search', () => {
      assert.ok(ENGINE_META['mock-clip'].taskTypes.includes('visual_search'))
    })
  })

  // ============ 8. 工具函数 ============
  describe('8. 工具函数', () => {
    it('computePerceptualHash 64-bit hex', () => {
      const pixels = new Uint8Array(64)
      for (let i = 0; i < 64; i++) pixels[i] = i
      const hash = computePerceptualHash(pixels)
      assert.equal(hash.length, 16)
      // 幂等
      assert.equal(computePerceptualHash(pixels), hash)
    })

    it('computePerceptualHash 空输入', () => {
      const hash = computePerceptualHash(new Uint8Array(0))
      assert.equal(hash, '0'.repeat(16))
    })

    it('computeDifferenceHash 短输入', () => {
      const pixels = new Uint8Array([10, 20, 5, 30, 15, 25, 100, 50, 80])
      const hash = computeDifferenceHash(pixels)
      // 8 个比较 → 8 bits → 2 hex chars
      assert.equal(hash.length, 2)
    })

    it('computeDifferenceHash 64输入 → 16 hex chars', () => {
      const pixels = new Uint8Array(65).fill(42)
      const hash = computeDifferenceHash(pixels)
      assert.equal(hash.length, 16)
    })

    it('hammingDistance 相同 = 0', () => {
      assert.equal(hammingDistance('abc123', 'abc123'), 0)
    })

    it('hammingDistance 全不同', () => {
      assert.equal(hammingDistance('aaaa', 'bbbb'), 4)
    })

    it('hammingDistance 不同长度', () => {
      assert.equal(hammingDistance('abc', 'abcdef'), 3)
    })

    it('distanceToSimilarity 距离 0 → 1', () => {
      assert.equal(distanceToSimilarity(0), 1)
    })

    it('distanceToSimilarity 距离 16 → 0', () => {
      assert.equal(distanceToSimilarity(16), 0)
    })

    it('distanceToSimilarity 距离 8 → 0.5', () => {
      assert.equal(distanceToSimilarity(8), 0.5)
    })

    it('cosineSimilarity 相同向量 → 1', () => {
      assert.ok(Math.abs(cosineSimilarity([1, 0, 0], [1, 0, 0]) - 1) < 1e-10)
    })

    it('cosineSimilarity 正交 → 0', () => {
      assert.ok(Math.abs(cosineSimilarity([1, 0, 0], [0, 1, 0]) - 0) < 1e-10)
    })

    it('cosineSimilarity 空数组 → 0', () => {
      assert.equal(cosineSimilarity([], []), 0)
    })

    it('iou 完全重叠 → 1', () => {
      assert.equal(
        iou({ x: 0, y: 0, width: 100, height: 100 }, { x: 0, y: 0, width: 100, height: 100 }),
        1,
      )
    })

    it('iou 不重叠 → 0', () => {
      assert.equal(
        iou({ x: 0, y: 0, width: 100, height: 100 }, { x: 200, y: 200, width: 100, height: 100 }),
        0,
      )
    })

    it('iou 部分重叠', () => {
      const partial = iou({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 })
      assert.ok(partial > 0 && partial < 1)
    })
  })

  // ============ 9. mock 工具 ============
  describe('9. mock 工具', () => {
    it('mockEmbedding L2 归一化', () => {
      const v = mockEmbedding('test-seed')
      assert.equal(v.length, 256)
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
      assert.ok(Math.abs(norm - 1) < 1e-6)
    })

    it('mockEmbedding 同 seed 幂等', () => {
      const v1 = mockEmbedding('seed-123')
      const v2 = mockEmbedding('seed-123')
      assert.deepEqual(v1, v2)
    })

    it('mockEmbedding 不同 seed 不同', () => {
      const v1 = mockEmbedding('seed-a')
      const v2 = mockEmbedding('seed-b')
      assert.notDeepEqual(v1, v2)
    })

    it('mockBbox 返回合法值', () => {
      const b = mockBbox(12345)
      assert.ok(b.x >= 0 && b.x < 800)
      assert.ok(b.y >= 0 && b.y < 600)
      assert.ok(b.width >= 50 && b.width < 250)
      assert.ok(b.height >= 50 && b.height < 250)
    })

    it('mockBbox 同 seed 幂等', () => {
      const b1 = mockBbox(42)
      const b2 = mockBbox(42)
      assert.deepEqual(b1, b2)
    })

    it('getModelVersion 7 个引擎', () => {
      const engines = Object.keys(ENGINE_META) as Array<keyof typeof ENGINE_META>
      for (const e of engines) {
        const v = getModelVersion(e)
        assert.ok(v.length > 0, `${e} should have a version`)
      }
    })

    it('ID 生成器格式', () => {
      assert.ok(generateRecognitionId().startsWith('rec-'))
      assert.ok(generateObjectId().startsWith('obj-'))
      assert.ok(generateFingerprintId().startsWith('fp-'))
    })

    it('ID 生成器不重复', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateRecognitionId()))
      assert.equal(ids.size, 100)
    })
  })
})
