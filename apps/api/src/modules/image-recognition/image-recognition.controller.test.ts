import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [D] controller test 补全
 * ImageRecognitionController 直接注入测试 (node:test)
 *
 * 直接实例化 Controller + 真实 Service
 * 覆盖所有路由端点（正向 + 异常 + 边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ImageRecognitionController } from './image-recognition.controller'
import { ImageRecognitionService } from './image-recognition.service'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT = {
  tenantId: 't-001',
  storeId: 'store-001',
  userId: 'user-001',
  role: 'tenant_admin' as const,
}

describe('ImageRecognitionController (直接注入)', () => {
  let service: ImageRecognitionService
  let controller: ImageRecognitionController

  beforeEach(() => {
    service = new ImageRecognitionService()
    controller = new ImageRecognitionController(service)
  })

  // ── POST /tasks ──
  describe('POST /image-recognition/tasks', () => {
    it('创建商品识别任务 → 成功', async () => {
      const result = await runWithTenant(TENANT, () =>
        controller.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-001',
          filename: 'shelf.jpg',
        }),
      )
      assert.ok(result.task)
      assert.equal(result.task.taskType, 'product_recognition')
      assert.equal(result.task.status, 'completed')
      assert.ok(result.objects.length > 0)
    })

    it('创建货架分析任务', async () => {
      const result = await runWithTenant(TENANT, () =>
        controller.createRecognition({
          taskType: 'shelf_analysis',
          sourceAssetId: 'asset-002',
          engine: 'mock-yolov8n-shelf',
        }),
      )
      assert.ok(result.task)
      assert.equal(result.task.engine, 'mock-yolov8n-shelf')
    })

    it('非法引擎 → 400', async () => {
      await assert.rejects(
        () =>
          runWithTenant(TENANT, () =>
            (controller as any).createRecognition({
              taskType: 'product_recognition',
              sourceAssetId: 'asset-001',
              engine: 'non-existent-engine',
            }),
          ),
        (err: any) => err.status === 400,
      )
    })
  })

  // ── GET /tasks ──
  describe('GET /image-recognition/tasks', () => {
    it('空列表', async () => {
      const { items } = await runWithTenant(TENANT, () =>
        controller.listTasks({}),
      )
      assert.ok(Array.isArray(items))
      assert.equal(items.length, 0)
    })

    it('创建后列表有数据', async () => {
      await runWithTenant(TENANT, () =>
        controller.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'asset-001',
        }),
      )
      const { items } = await runWithTenant(TENANT, () =>
        controller.listTasks({}),
      )
      assert.equal(items.length, 1)
    })

    it('按 taskType 过滤', async () => {
      await runWithTenant(TENANT, () =>
        controller.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'a1' }),
      )
      await runWithTenant(TENANT, () =>
        controller.createRecognition({ taskType: 'shelf_analysis', sourceAssetId: 'a2' }),
      )
      const { items } = await runWithTenant(TENANT, () =>
        controller.listTasks({ taskType: 'product_recognition' }),
      )
      assert.equal(items.length, 1)
      assert.equal(items[0].taskType, 'product_recognition')
    })
  })

  // ── GET /tasks/:id ──
  describe('GET /image-recognition/tasks/:id', () => {
    it('获取已创建任务', async () => {
      const created = await runWithTenant(TENANT, () =>
        controller.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-001' }),
      )
      const result = await runWithTenant(TENANT, () =>
        controller.getTask(created.task.id),
      )
      assert.equal(result.task.id, created.task.id)
      assert.ok(result.engineMeta)
    })

    it('不存在任务 → 404', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT, () => controller.getTask('non-existent')),
        (err: any) => err.status === 404,
      )
    })
  })

  // ── POST /tasks/:id/cancel ──
  describe('POST /image-recognition/tasks/:id/cancel', () => {
    it('取消处理中任务', async () => {
      const created = await runWithTenant(TENANT, () =>
        controller.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-001' }),
      )
      const result = await runWithTenant(TENANT, () =>
        controller.cancelTask(created.task.id),
      )
      assert.equal(result.status, 'cancelled')
    })

    it('取消已完成任务 → 400', async () => {
      const created = await runWithTenant(TENANT, () =>
        controller.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-001' }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT, () => controller.cancelTask(created.task.id)),
        (err: any) => err.status === 400,
      )
    })
  })

  // ── POST /visual-search ──
  describe('POST /image-recognition/visual-search', () => {
    it('视觉搜索需要先有指纹', async () => {
      const result = await runWithTenant(TENANT, () =>
        controller.visualSearch({ sourceAssetId: 'asset-001', topK: 5 }),
      )
      assert.ok(Array.isArray(result))
    })
  })

  // ── POST /duplicates ──
  describe('POST /image-recognition/duplicates', () => {
    it('重复检测', async () => {
      const result = await runWithTenant(TENANT, () =>
        controller.detectDuplicates({ sourceAssetId: 'asset-001', threshold: 0.8 }),
      )
      assert.ok(result.duplicates !== undefined)
    })
  })

  // ── GET /engines ──
  describe('GET /image-recognition/engines', () => {
    it('返回 7 个引擎', async () => {
      const engines = await controller.listEngines()
      assert.equal(engines.items.length, 7)
    })
  })

  // ── GET /stats ──
  describe('GET /image-recognition/stats', () => {
    it('空状态 → 0 任务', async () => {
      const stats = await runWithTenant(TENANT, () => controller.stats())
      assert.equal(stats.totalTasks, 0)
    })

    it('有任务后有统计', async () => {
      await runWithTenant(TENANT, () =>
        controller.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'a1' }),
      )
      const stats = await runWithTenant(TENANT, () => controller.stats())
      assert.equal(stats.totalTasks, 1)
      assert.equal(stats.completedTasks, 1)
    })
  })
})
