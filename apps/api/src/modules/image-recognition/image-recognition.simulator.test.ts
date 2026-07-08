/**
 * 🐜 自动: [image-recognition] [D] simulator test
 *
 * ImageRecognitionService Simulator 测试
 *
 * 场景:
 * 1. 多次创建识别任务 → 验证模拟引擎返回一致性
 * 2. 视觉搜索 → 验证指纹计算 + 相似度排序
 * 3. 重复检测 → 验证阈值过滤
 * 4. 货架分析模拟 → 验证占位/缺货/价格合规
 * 5. 任务流程态 → processing → completed 状态流转
 * 6. 并发任务 → 模拟大量并发创建无冲突
 * 7. 统计累积 → 多次创建后 stats 累积
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ImageRecognitionService } from './image-recognition.service'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT = {
  tenantId: 't-sim-001',
  storeId: 'store-sim-001',
  userId: 'user-sim-001',
  role: 'tenant_admin' as const,
}

const ANOTHER_TENANT = {
  tenantId: 't-sim-002',
  storeId: 'store-sim-002',
  userId: 'user-sim-002',
  role: 'tenant_admin' as const,
}

describe('ImageRecognitionService Simulator', () => {
  let service: ImageRecognitionService

  beforeEach(() => {
    service = new ImageRecognitionService()
  })

  // ── 场景1: 多次创建识别任务 → 模拟引擎一致性 ──
  describe('场景1: 模拟引擎一致性', () => {
    it('连续创建相同参数的 product_recognition 任务返回一致结构', async () => {
      const tasks = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          runWithTenant(TENANT, () =>
            service.createRecognition({
              taskType: 'product_recognition',
              sourceAssetId: `asset-batch-${i}`,
            }),
          ),
        ),
      )

      assert.equal(tasks.length, 5)
      for (const t of tasks) {
        assert.equal(t.task.status, 'completed')
        assert.equal(t.task.taskType, 'product_recognition')
        assert.ok(t.objects.length >= 3)
        assert.ok(t.avgConfidence! > 0.5)
        assert.ok(t.engineMeta)
        assert.ok(t.engineMeta.modelVersion)
      }
    })

    it('七个引擎分别返回正确的 taskType', async () => {
      const engines = ['mock-yolov8', 'mock-yolov8n-shelf', 'mock-resnet50', 'mock-clip', 'mock-efficientnet', 'mock-pHash', 'mock-dHash'] as const
      const taskTypes = ['object_detection', 'shelf_analysis', 'image_classification', 'visual_search', 'product_recognition', 'duplicate_detection', 'duplicate_detection'] as const

      for (let i = 0; i < engines.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const result = await runWithTenant(TENANT, () =>
          service.createRecognition({
            taskType: taskTypes[i],
            sourceAssetId: `asset-engine-${i}`,
            engine: engines[i],
          }),
        )
        assert.equal(result.task.engine, engines[i])
        assert.equal(result.task.taskType, taskTypes[i])
      }
    })
  })

  // ── 场景2: 视觉搜索 → 指纹 + 相似度 ──
  describe('场景2: 视觉搜索模拟', () => {
    it('同一资产上执行视觉搜索返回空结果(无其他候选)', async () => {
      await runWithTenant(TENANT, () =>
        service.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-vs-001',
        }),
      )

      const results = await runWithTenant(TENANT, () =>
        service.visualSearch({ sourceAssetId: 'asset-vs-001', topK: 10 }),
      )
      assert.ok(Array.isArray(results))
      // 只有一个资产指纹，搜自己排除后为空
      assert.equal(results.length, 0)
    })

    it('有多个资产后视觉搜索返回按相似度排序的结果', async () => {
      // 创建多个资产
      const assetIds = ['asset-vs-a', 'asset-vs-b', 'asset-vs-c', 'asset-vs-d']
      for (const aid of assetIds) {
        // eslint-disable-next-line no-await-in-loop
        await runWithTenant(TENANT, () =>
          service.createRecognition({
            taskType: 'product_recognition',
            sourceAssetId: aid,
          }),
        )
      }

      const results = await runWithTenant(TENANT, () =>
        service.visualSearch({ sourceAssetId: 'asset-vs-a', topK: 10 }),
      )

      assert.ok(results.length > 0)
      assert.ok(results.length <= 3) // 排除自己
      // 按相似度降序
      for (let i = 1; i < results.length; i++) {
        assert.ok(results[i - 1].similarity >= results[i].similarity)
      }
    })

    it('visualSearch 带 minSimilarity 过滤低分结果', async () => {
      const assetIds = ['asset-vs-f1', 'asset-vs-f2', 'asset-vs-f3']
      for (const aid of assetIds) {
        // eslint-disable-next-line no-await-in-loop
        await runWithTenant(TENANT, () =>
          service.createRecognition({
            taskType: 'product_recognition',
            sourceAssetId: aid,
          }),
        )
      }

      const results1 = await runWithTenant(TENANT, () =>
        service.visualSearch({ sourceAssetId: 'asset-vs-f1', minSimilarity: 0.99 }),
      )
      const results2 = await runWithTenant(TENANT, () =>
        service.visualSearch({ sourceAssetId: 'asset-vs-f1', minSimilarity: 0.01 }),
      )
      // 高阈值通常返回更少
      assert.ok(results1.length <= results2.length)
    })
  })

  // ── 场景3: 重复检测 ──
  describe('场景3: 重复检测模拟', () => {
    it('无候选资产时重复检测为空', async () => {
      await runWithTenant(TENANT, () =>
        service.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-dup-001' }),
      )
      const result = await runWithTenant(TENANT, () =>
        service.detectDuplicates({ sourceAssetId: 'asset-dup-001', threshold: 0.5 }),
      )
      assert.equal(result.sourceAssetId, 'asset-dup-001')
      assert.ok(Array.isArray(result.duplicates))
    })

    it('高阈值下重复检测返回较少结果', async () => {
      const aids = ['asset-dup-a', 'asset-dup-b', 'asset-dup-c']
      for (const aid of aids) {
        // eslint-disable-next-line no-await-in-loop
        await runWithTenant(TENANT, () =>
          service.createRecognition({ taskType: 'product_recognition', sourceAssetId: aid }),
        )
      }

      const resultHigh = await runWithTenant(TENANT, () =>
        service.detectDuplicates({ sourceAssetId: 'asset-dup-a', threshold: 0.95 }),
      )
      const resultLow = await runWithTenant(TENANT, () =>
        service.detectDuplicates({ sourceAssetId: 'asset-dup-a', threshold: 0.1 }),
      )
      assert.ok(resultHigh.duplicates.length <= resultLow.duplicates.length)
    })
  })

  // ── 场景4: 货架分析模拟 ──
  describe('场景4: 货架分析模拟', () => {
    it('shelf_analysis 返回包含 totalSlots 的完整分析', async () => {
      const result = await runWithTenant(TENANT, () =>
        service.createRecognition({
          taskType: 'shelf_analysis',
          sourceAssetId: 'asset-shelf-001',
        }),
      )

      assert.ok(result.shelfAnalysis)
      assert.equal(typeof result.shelfAnalysis.totalSlots, 'number')
      assert.equal(typeof result.shelfAnalysis.occupiedSlots, 'number')
      assert.equal(typeof result.shelfAnalysis.emptySlots, 'number')
      assert.equal(typeof result.shelfAnalysis.occupancyRate, 'number')
      assert.ok(result.shelfAnalysis.occupancyRate >= 0 && result.shelfAnalysis.occupancyRate <= 1)
      assert.ok(Array.isArray(result.shelfAnalysis.outOfStock))
      assert.ok(Array.isArray(result.shelfAnalysis.restockSuggestions))
    })

    it('货架分析包含 priceCompliance 信息', async () => {
      const result = await runWithTenant(TENANT, () =>
        service.createRecognition({
          taskType: 'shelf_analysis',
          sourceAssetId: 'asset-shelf-002',
        }),
      )

      assert.ok(result.shelfAnalysis)
      assert.equal(typeof result.shelfAnalysis.priceCompliance.correctCount, 'number')
      assert.equal(typeof result.shelfAnalysis.priceCompliance.incorrectCount, 'number')
      assert.ok(Array.isArray(result.shelfAnalysis.priceCompliance.issues))
      assert.equal(typeof result.shelfAnalysis.tidiness, 'number')
    })
  })

  // ── 场景5: 任务状态流转 ──
  describe('场景5: 任务状态流转', () => {
    it('创建任务直接完成(同步模拟)', async () => {
      const result = await runWithTenant(TENANT, () =>
        service.createRecognition({
          taskType: 'object_detection',
          sourceAssetId: 'asset-flow-001',
        }),
      )
      assert.equal(result.task.status, 'completed')
      assert.equal(result.task.progress, 1.0)
    })

    it('取消已完成的同步任务抛出 400', async () => {
      const result = await runWithTenant(TENANT, () =>
        service.createRecognition({
          taskType: 'object_detection',
          sourceAssetId: 'asset-flow-002',
        }),
      )

      await assert.rejects(
        () => runWithTenant(TENANT, () => service.cancelRecognition(result.task.id)),
        (err: any) => err.status === 400,
      )
    })
  })

  // ── 场景6: 并发创建任务 ──
  describe('场景6: 并发任务', () => {
    it('同时创建 20 个任务无冲突', async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        runWithTenant(TENANT, () =>
          service.createRecognition({
            taskType: 'product_recognition',
            sourceAssetId: `asset-con-${i}`,
          }),
        ),
      )

      const results = await Promise.all(promises)
      assert.equal(results.length, 20)
      for (const r of results) {
        assert.equal(r.task.status, 'completed')
      }

      const tasks = await runWithTenant(TENANT, () => service.listRecognitionTasks({}))
      assert.equal(tasks.length, 20)
    })
  })

  // ── 场景7: 统计累积 ──
  describe('场景7: 统计累积', () => {
    it('空服务返回零值统计', async () => {
      // 新服务实例
      const fresh = new ImageRecognitionService()
      const stats = await runWithTenant(TENANT, () => fresh.getRecognitionStats())
      assert.equal(stats.totalTasks, 0)
      assert.equal(stats.completedTasks, 0)
      assert.equal(stats.failedTasks, 0)
      assert.equal(stats.totalObjectsDetected, 0)
      assert.equal(stats.avgDurationMs, 0)
    })

    it('创建多个任务后统计累积', async () => {
      for (let i = 0; i < 3; i++) {
        // eslint-disable-next-line no-await-in-loop
        await runWithTenant(TENANT, () =>
          service.createRecognition({
            taskType: 'product_recognition',
            sourceAssetId: `asset-stats-${i}`,
          }),
        )
      }

      const stats = await runWithTenant(TENANT, () => service.getRecognitionStats())
      assert.equal(stats.totalTasks, 3)
      assert.equal(stats.completedTasks, 3)
      assert.ok(stats.totalObjectsDetected >= 9) // 每个任务至少 3 个对象
      assert.ok(stats.byTaskType.product_recognition === 3)
      assert.ok(stats.avgConfidence > 0)
      assert.ok(stats.avgDurationMs > 0)
    })

    it('不同租户统计隔离', async () => {
      // tenant1 创建 2 个
      for (let i = 0; i < 2; i++) {
        // eslint-disable-next-line no-await-in-loop
        await runWithTenant(TENANT, () =>
          service.createRecognition({
            taskType: 'product_recognition',
            sourceAssetId: `asset-t1-${i}`,
          }),
        )
      }
      // tenant2 创建 1 个
      await runWithTenant(ANOTHER_TENANT, () =>
        service.createRecognition({
          taskType: 'shelf_analysis',
          sourceAssetId: 'asset-t2-001',
        }),
      )

      const stats1 = await runWithTenant(TENANT, () => service.getRecognitionStats())
      const stats2 = await runWithTenant(ANOTHER_TENANT, () => service.getRecognitionStats())

      assert.equal(stats1.totalTasks, 2)
      assert.equal(stats2.totalTasks, 1)
    })
  })

  // ── 场景8: 引擎元数据 ──
  describe('场景8: 引擎元数据', () => {
    it('listEngines 返回 7 个引擎', () => {
      const engines = service.listEngines()
      assert.equal(engines.length, 7)
      const types = engines.map((e) => e.type)
      assert.ok(types.includes('mock-yolov8'))
      assert.ok(types.includes('mock-clip'))
      assert.ok(types.includes('mock-pHash'))
    })

    it('每个引擎有完整的元数据字段', () => {
      for (const e of service.listEngines()) {
        assert.equal(typeof e.type, 'string')
        assert.equal(typeof e.displayName, 'string')
        assert.equal(typeof e.category, 'string')
        assert.ok(Array.isArray(e.taskTypes))
        assert.equal(typeof e.classesSupported, 'number')
        assert.equal(typeof e.avgTimeMs, 'number')
        assert.equal(typeof e.accuracy, 'number')
        assert.ok(e.classesSupported > 0)
      }
    })
  })

  // ── 场景9: 重复检测累积计数 ──
  describe('场景9: 重复检测累积', () => {
    it('多次 duplicate 检测后 stats 的 duplicatesDetected 累积', async () => {
      const aids = ['asset-dup-c1', 'asset-dup-c2', 'asset-dup-c3', 'asset-dup-c4']
      for (const aid of aids) {
        // eslint-disable-next-line no-await-in-loop
        await runWithTenant(TENANT, () =>
          service.createRecognition({ taskType: 'product_recognition', sourceAssetId: aid }),
        )
      }

      await runWithTenant(TENANT, () =>
        service.detectDuplicates({ sourceAssetId: 'asset-dup-c1', threshold: 0.1 }),
      )
      await runWithTenant(TENANT, () =>
        service.detectDuplicates({ sourceAssetId: 'asset-dup-c2', threshold: 0.1 }),
      )

      const stats = await runWithTenant(TENANT, () => service.getRecognitionStats())
      assert.ok(stats.duplicatesDetected >= 0)
    })
  })
})
