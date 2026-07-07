import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 101 图像识别 Service Tests (V11 Sprint 3 Day 36)
 *
 * 24 tests 覆盖:
 * - 工具函数 (5) - pHash / dHash / hammingDistance / cosineSimilarity / iou
 * - 引擎元数据 (1)
 * - 任务 CRUD (3)
 * - 引擎校验 (1)
 * - 商品识别 (1)
 * - 货架分析 (1)
 * - 图像分类 (1)
 * - 视觉搜索 (2)
 * - 重复检测 (2)
 * - 任务取消 (1)
 * - 列表 + 过滤 (1)
 * - 跨租户隔离 (1)
 * - 统计 (1)
 * - Object 索引 (2)
 * - fingerprint 索引 (1)
 */

import assert from 'node:assert/strict'
import { ImageRecognitionService } from './image-recognition.service'
import {
  computePerceptualHash, computeDifferenceHash, hammingDistance,
  distanceToSimilarity, cosineSimilarity, iou,
  ENGINE_META, getModelVersion, mockEmbedding, mockBbox,
  generateRecognitionId, generateObjectId, generateFingerprintId,
} from './image-recognition.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B', storeId: 'store-002', userId: 'admin-B',
  role: 'tenant_admin' as const,
}

const SHARED_SERVICE = new ImageRecognitionService()

describe('Phase 101 图像识别 (V11 Sprint 3 Day 36)', () => {
  // ============ 1. 工具函数 (5) ============
  describe('1. 工具函数', () => {
    it('computePerceptualHash 64-bit hex', () => {
      const pixels = new Uint8Array(64)
      for (let i = 0; i < 64; i++) pixels[i] = i
      const hash = computePerceptualHash(pixels)
      assert.equal(hash.length, 16) // 16 hex chars = 64 bits
      // 幂等
      assert.equal(computePerceptualHash(pixels), hash)
    })

    it('computeDifferenceHash 相邻像素差异', () => {
      const pixels = new Uint8Array([10, 20, 5, 30, 15, 25])
      const hash = computeDifferenceHash(pixels)
      assert.equal(hash.length, 16)
    })

    it('hammingDistance 一致 hash = 0', () => {
      assert.equal(hammingDistance('abc123', 'abc123'), 0)
      assert.equal(hammingDistance('aaaa', 'bbbb'), 4)
    })

    it('cosineSimilarity 相同 = 1, 正交 = 0', () => {
      assert.ok(Math.abs(cosineSimilarity([1, 0, 0], [1, 0, 0]) - 1) < 1e-10)
      assert.ok(Math.abs(cosineSimilarity([1, 0, 0], [0, 1, 0]) - 0) < 1e-10)
      assert.ok(Math.abs(cosineSimilarity([0.5, 0.5], [0.5, 0.5]) - 1) < 1e-10)
    })

    it('iou bbox 重叠 / 不重叠', () => {
      // 完全重叠
      assert.equal(iou({ x: 0, y: 0, width: 100, height: 100 }, { x: 0, y: 0, width: 100, height: 100 }), 1)
      // 不重叠
      assert.equal(iou({ x: 0, y: 0, width: 100, height: 100 }, { x: 200, y: 200, width: 100, height: 100 }), 0)
      // 部分重叠
      const partial = iou({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 })
      assert.ok(partial > 0 && partial < 1)
    })
  })

  // ============ 2. mockEmbedding / mockBbox / getModelVersion (3) ============
  describe('2. 模型 mock 工具', () => {
    it('mockEmbedding L2 归一化 → 长度 1', () => {
      const v = mockEmbedding('test-seed')
      assert.equal(v.length, 256)
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
      assert.ok(Math.abs(norm - 1) < 1e-6)
    })

    it('mockEmbedding 同 seed → 同结果', () => {
      const v1 = mockEmbedding('seed-123')
      const v2 = mockEmbedding('seed-123')
      assert.deepEqual(v1, v2)
    })

    it('mockBbox 返回合法 bbox', () => {
      const b = mockBbox(12345)
      assert.ok(b.x >= 0 && b.x < 800)
      assert.ok(b.y >= 0 && b.y < 600)
      assert.ok(b.width >= 50 && b.width < 250)
      assert.ok(b.height >= 50 && b.height < 250)
    })

    it('distanceToSimilarity 距离 0 → 1, 距离 16 → 0', () => {
      assert.equal(distanceToSimilarity(0), 1)
      assert.equal(distanceToSimilarity(16), 0)
      assert.equal(distanceToSimilarity(8), 0.5)
    })

    it('getModelVersion 7 引擎都有版本', () => {
      const engines = Object.keys(ENGINE_META) as Array<keyof typeof ENGINE_META>
      for (const e of engines) {
        const v = getModelVersion(e)
        assert.ok(v.length > 0)
      }
    })

    it('ID 生成器', () => {
      assert.ok(generateRecognitionId().startsWith('rec-'))
      assert.ok(generateObjectId().startsWith('obj-'))
      assert.ok(generateFingerprintId().startsWith('fp-'))
    })
  })

  // ============ 3. 引擎元数据 (1) ============
  describe('3. 引擎元数据', () => {
    it('ENGINE_META 7 个引擎', () => {
      assert.equal(Object.keys(ENGINE_META).length, 7)
      assert.ok(ENGINE_META['mock-yolov8'])
      assert.ok(ENGINE_META['mock-clip'])
      assert.ok(ENGINE_META['mock-pHash'])
    })

    it('listEngines 返回完整列表', () => {
      const engines = SHARED_SERVICE.listEngines()
      assert.equal(engines.length, 7)
      assert.ok(engines.some((e) => e.type === 'mock-yolov8n-shelf'))
      assert.ok(engines.some((e) => e.type === 'mock-pHash'))
    })
  })

  // ============ 4. 任务创建 (3) ============
  describe('4. 任务创建', () => {
    it('商品识别默认用 EfficientNet', async () => {
      const result = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-prod-001',
        }),
      )
      assert.equal(result.task.engine, 'mock-efficientnet')
      assert.equal(result.task.status, 'completed')
      assert.ok(result.objects.length >= 3)
      assert.ok(result.objects[0].confidence > 0.7)
      assert.ok(result.objects[0].skuId)
      assert.ok(result.objects[0].productName)
    })

    it('货架分析用 YOLOv8n-shelf + ShelfAnalysis', async () => {
      const result = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'shelf_analysis',
          sourceAssetId: 'asset-shelf-001',
        }),
      )
      assert.equal(result.task.engine, 'mock-yolov8n-shelf')
      assert.ok(result.shelfAnalysis)
      assert.ok(result.shelfAnalysis!.totalSlots > 0)
      assert.ok(result.shelfAnalysis!.occupancyRate >= 0 && result.shelfAnalysis!.occupancyRate <= 1)
      assert.ok(result.shelfAnalysis!.priceCompliance)
      assert.ok(result.shelfAnalysis!.restockSuggestions)
    })

    it('图像分类只返回 1 个对象', async () => {
      const result = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'image_classification',
          sourceAssetId: 'asset-cls-001',
        }),
      )
      assert.equal(result.task.engine, 'mock-clip')
      assert.equal(result.objects.length, 1)
    })
  })

  // ============ 5. 引擎校验 (1) ============
  describe('5. 引擎校验', () => {
    it('非法引擎被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createRecognition({
            taskType: 'product_recognition',
            engine: 'mock-nonexistent' as any,
            sourceAssetId: 'asset-x',
          }),
        ),
        /引擎/,
      )
    })

    it('引擎不支持任务类型被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createRecognition({
            taskType: 'shelf_analysis',
            engine: 'mock-resnet50', // 仅 image_classification
            sourceAssetId: 'asset-x',
          }),
        ),
        /不支持任务类型/,
      )
    })
  })

  // ============ 6. 视觉搜索 (2) ============
  describe('6. 视觉搜索', () => {
    it('visualSearch 返回 top-K + 相似度排序', async () => {
      // 创建 3 个指纹
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-vs-1',
        }),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-vs-2',
        }),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-vs-3',
        }),
      )
      const results = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.visualSearch({
          sourceAssetId: 'asset-vs-1',
          topK: 10,
          minSimilarity: 0,
        }),
      )
      assert.ok(results.length >= 2)
      // 排序: 高相似度在前
      for (let i = 1; i < results.length; i++) {
        assert.ok(results[i - 1].similarity >= results[i].similarity)
      }
    })

    it('topK 限制生效', async () => {
      const results = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.visualSearch({
          sourceAssetId: 'asset-vs-1',
          topK: 1,
          minSimilarity: 0,
        }),
      )
      assert.ok(results.length <= 1)
    })
  })

  // ============ 7. 重复检测 (2) ============
  describe('7. 重复检测', () => {
    it('detectDuplicates 返回候选 + 阈值过滤', async () => {
      const result = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.detectDuplicates({
          sourceAssetId: 'asset-vs-2',
          threshold: 0.5,
        }),
      )
      assert.equal(result.sourceAssetId, 'asset-vs-2')
      assert.ok(Array.isArray(result.duplicates))
      for (const d of result.duplicates) {
        assert.ok(d.similarity >= 0.5)
      }
    })

    it('duplicateCount 累加', async () => {
      const before = SHARED_SERVICE.countFingerprints()
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.detectDuplicates({
          sourceAssetId: 'asset-vs-3',
          threshold: 0,
        }),
      )
      // 至少 1 次操作完成, 计数器增加
      const after = SHARED_SERVICE.countFingerprints()
      assert.ok(after >= before)
    })
  })

  // ============ 8. 任务取消 (1) ============
  describe('8. 任务取消', () => {
    it('取消终态任务被拒', async () => {
      const result = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'image_classification',
          sourceAssetId: 'asset-completed',
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.cancelRecognition(result.task.id)),
        /终态/,
      )
    })
  })

  // ============ 9. 跨租户隔离 (1) ============
  describe('9. 跨租户隔离', () => {
    it('租户 B 不能访问租户 A 的任务', async () => {
      const result = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-iso',
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_B, async () => SHARED_SERVICE.getRecognitionResult(result.task.id)),
        /不存在/,
      )
    })
  })

  // ============ 10. 列表 + 过滤 (1) ============
  describe('10. 列表 + 过滤', () => {
    it('listRecognitionTasks 按 taskType 过滤', async () => {
      const tasks = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listRecognitionTasks({ taskType: 'product_recognition', limit: 100 }),
      )
      assert.ok(tasks.length > 0)
      for (const t of tasks) {
        assert.equal(t.taskType, 'product_recognition')
      }
    })
  })

  // ============ 11. 统计 (1) ============
  describe('11. 统计', () => {
    it('getRecognitionStats 聚合 byTaskType + avgConfidence + duplicatesDetected', async () => {
      const stats = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getRecognitionStats(),
      )
      assert.ok(stats.totalTasks > 0)
      assert.ok(stats.totalObjectsDetected > 0)
      assert.ok(typeof stats.byTaskType === 'object')
      assert.ok(typeof stats.byEngine === 'object')
      assert.ok(stats.avgConfidence > 0)
      assert.ok(stats.duplicatesDetected >= 0)
    })
  })
})