import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 103 多模态融合分析 Controller Tests (V11 Sprint 3 Day 40)
 *
 * 覆盖:
 * - 路由元数据检查
 * - POST /fusion/tasks (正例 + 反例)
 * - GET /fusion/tasks (列表)
 * - GET /fusion/tasks/:id (单个任务)
 * - POST /fusion/tasks/:id/cancel (取消)
 * - POST /fusion/search (跨模态搜索)
 * - POST /fusion/index/item (索引)
 * - POST /fusion/index/tabular (表格索引)
 * - GET /fusion/templates, /fusion/engines, /fusion/stats (查询)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultimodalFusionController } from './multimodal-fusion.controller'
import { MultimodalFusionService } from './multimodal-fusion.service'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-ctrl-A',
  storeId: 'store-001',
  userId: 'ctrl-admin',
  role: 'tenant_admin' as const,
}

function createController(): { service: MultimodalFusionService; controller: MultimodalFusionController } {
  const service = new MultimodalFusionService()
  const controller = new MultimodalFusionController(service)
  return { service, controller }
}

describe('MultimodalFusionController', () => {
  // ============ Route Metadata ============
  describe('路由元数据', () => {
    it('controller path metadata should be "fusion"', () => {
      const path = Reflect.getMetadata('path', MultimodalFusionController)
      assert.equal(path, 'fusion')
    })

    it('createTask → POST /tasks + HttpCode CREATED', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.createTask)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.createTask)
      const statusCode = Reflect.getMetadata('__httpCode__', MultimodalFusionController.prototype.createTask)
      assert.equal(method, 1) // POST
      assert.equal(path, 'tasks')
      assert.equal(statusCode, 201)
    })

    it('listTasks → GET /tasks', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.listTasks)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.listTasks)
      assert.equal(method, 0) // GET
      assert.equal(path, 'tasks')
    })

    it('getTask → GET /tasks/:id', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.getTask)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.getTask)
      assert.equal(method, 0) // GET
      assert.equal(path, 'tasks/:id')
    })

    it('cancelTask → POST /tasks/:id/cancel + HttpCode OK', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.cancelTask)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.cancelTask)
      const statusCode = Reflect.getMetadata('__httpCode__', MultimodalFusionController.prototype.cancelTask)
      assert.equal(method, 1) // POST
      assert.equal(path, 'tasks/:id/cancel')
      assert.equal(statusCode, 200)
    })

    it('crossModalSearch → POST /search + HttpCode OK', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.crossModalSearch)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.crossModalSearch)
      assert.equal(method, 1) // POST
      assert.equal(path, 'search')
    })

    it('indexItem → POST /index/item + HttpCode CREATED', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.indexItem)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.indexItem)
      const statusCode = Reflect.getMetadata('__httpCode__', MultimodalFusionController.prototype.indexItem)
      assert.equal(method, 1) // POST
      assert.equal(path, 'index/item')
      assert.equal(statusCode, 201)
    })

    it('indexTabular → POST /index/tabular + HttpCode CREATED', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.indexTabular)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.indexTabular)
      assert.equal(method, 1) // POST
      assert.equal(path, 'index/tabular')
    })

    it('listTemplates → GET /templates', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.listTemplates)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.listTemplates)
      assert.equal(method, 0) // GET
      assert.equal(path, 'templates')
    })

    it('listEngines → GET /engines', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.listEngines)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.listEngines)
      assert.equal(method, 0) // GET
      assert.equal(path, 'engines')
    })

    it('stats → GET /stats', () => {
      const method = Reflect.getMetadata('method', MultimodalFusionController.prototype.stats)
      const path = Reflect.getMetadata('path', MultimodalFusionController.prototype.stats)
      assert.equal(method, 0) // GET
      assert.equal(path, 'stats')
    })
  })

  // ============ POST /fusion/tasks 创建融合任务 ============
  describe('POST /fusion/tasks 创建融合任务', () => {
    it('正例: comprehensive_analysis 返回 completed 任务', async () => {
      const { controller } = createController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.createTask({
          taskType: 'comprehensive_analysis',
          title: '门店综合分析',
          sources: [
            { source: 'image', sourceId: 'img-001', weight: 0.5, confidence: 0.9, keyFindings: [] },
            { source: 'tabular', sourceId: 'ts-001', weight: 0.5, confidence: 0.8, keyFindings: [] },
          ],
        }),
      )
      assert.equal(result.status, 'completed')
      assert.ok(result.insights.length >= 1)
      assert.ok(result.report)
    })

    it('反例: 空 sources 被拒', async () => {
      const { controller } = createController()
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.createTask({
            taskType: 'comprehensive_analysis',
            title: '空数据',
            sources: [],
          }),
        ),
        /至少需要/,
      )
    })

    it('反例: 权重和 <= 0 被拒', async () => {
      const { controller } = createController()
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.createTask({
            taskType: 'comprehensive_analysis',
            title: '零权重',
            sources: [{ source: 'image', sourceId: 'img', weight: 0, confidence: 0.9, keyFindings: [] }],
          }),
        ),
        /权重总和/,
      )
    })

    it('反例: 不存在的引擎被拒', async () => {
      const { controller } = createController()
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.createTask({
            taskType: 'comprehensive_analysis',
            title: '非法引擎',
            engine: 'non-existent-engine' as any,
            sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
          }),
        ),
        /不存在/,
      )
    })
  })

  // ============ GET /fusion/tasks 列表 ============
  describe('GET /fusion/tasks 列表', () => {
    it('正例: listTasks 返回任务列表', async () => {
      const { controller } = createController()
      // 先创建任务
      await runWithTenant(TENANT_A, () =>
        controller.createTask({
          taskType: 'report_generation',
          title: '日报',
          sources: [{ source: 'tabular', sourceId: 'ts-list', weight: 1, confidence: 0.9, keyFindings: [] }],
        }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.createTask({
          taskType: 'trend_insight',
          title: '趋势报表',
          sources: [{ source: 'tabular', sourceId: 'ts-list2', weight: 1, confidence: 0.9, keyFindings: [] }],
        }),
      )
      const result = await runWithTenant(TENANT_A, () =>
        controller.listTasks({ limit: 10 }),
      )
      assert.ok(result.items.length >= 2)
      assert.ok(result.total >= 2)
    })

    it('边界: limit=1 只返回一条', async () => {
      const { controller } = createController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.listTasks({ limit: 1 }),
      )
      assert.ok(result.items.length <= 1)
    })
  })

  // ============ GET /fusion/tasks/:id ============
  describe('GET /fusion/tasks/:id 查询单个任务', () => {
    it('正例: 返回完整任务详情', async () => {
      const { controller } = createController()
      const task = await runWithTenant(TENANT_A, () =>
        controller.createTask({
          taskType: 'comprehensive_analysis',
          title: '单任务查询',
          sources: [{ source: 'image', sourceId: 'img-get', weight: 1, confidence: 0.9, keyFindings: [] }],
        }),
      )
      const found = await runWithTenant(TENANT_A, () =>
        controller.getTask(task.id),
      )
      assert.equal(found.id, task.id)
      assert.equal(found.title, '单任务查询')
    })

    it('反例: 不存在的 ID 返回 404', async () => {
      const { controller } = createController()
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.getTask('non-existent-id'),
        ),
        /不存在/,
      )
    })
  })

  // ============ POST /fusion/tasks/:id/cancel ============
  describe('POST /fusion/tasks/:id/cancel 取消任务', () => {
    it('已完成的终态任务不可取消', async () => {
      const { controller } = createController()
      const task = await runWithTenant(TENANT_A, () =>
        controller.createTask({
          taskType: 'comprehensive_analysis',
          title: '将被取消',
          sources: [{ source: 'image', sourceId: 'img-cancel', weight: 1, confidence: 0.9, keyFindings: [] }],
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.cancelTask(task.id),
        ),
        /终态/,
      )
    })
  })

  // ============ POST /fusion/search 跨模态搜索 ============
  describe('POST /fusion/search 跨模态搜索', () => {
    it('正例: 搜索已索引内容得到匹配结果', async () => {
      const { controller } = createController()
      // 先索引数据
      await runWithTenant(TENANT_A, () =>
        controller.indexItem({ itemId: 'asset-search-A', modality: 'image', text: '可口可乐330ml' }),
      )
      await runWithTenant(TENANT_A, () =>
        controller.indexItem({ itemId: 'doc-search-B', modality: 'document', text: '可口可乐销售报表' }),
      )
      const result = await runWithTenant(TENANT_A, () =>
        controller.crossModalSearch({ query: '可口可乐', modalities: ['image', 'document'], topK: 5 }),
      )
      assert.ok(result.items.length >= 1)
    })

    it('反例: 空查询被拒', async () => {
      const { controller } = createController()
      await assert.rejects(
        () => runWithTenant(TENANT_A, () =>
          controller.crossModalSearch({ query: '   ', modalities: ['image'] }),
        ),
        /不能为空/,
      )
    })
  })

  // ============ POST /fusion/index/item 索引 ============
  describe('POST /fusion/index/item 索引', () => {
    it('正例: 索引项目成功', async () => {
      const { controller } = createController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.indexItem({ itemId: 'asset-test', modality: 'image', text: '测试图片' }),
      )
      assert.deepEqual(result, { indexed: true })
    })
  })

  // ============ POST /fusion/index/tabular 表格索引 ============
  describe('POST /fusion/index/tabular 表格索引', () => {
    it('正例: 索引表格数据成功', async () => {
      const { controller } = createController()
      const result = await runWithTenant(TENANT_A, () =>
        controller.indexTabular({
          seriesId: 'ts-test',
          data: [{ ts: '2026-01-01', value: 100 }],
        }),
      )
      assert.deepEqual(result, { indexed: true })
    })
  })

  // ============ GET /fusion/templates & /engines ============
  describe('GET /fusion/templates & /fusion/engines', () => {
    it('listTemplates 返回所有模板', async () => {
      const { controller } = createController()
      const result = await controller.listTemplates()
      assert.ok(result.items.length === 6)
    })

    it('listEngines 返回所有引擎', async () => {
      const { controller } = createController()
      const result = await controller.listEngines()
      assert.ok(result.items.length === 5)
    })
  })

  // ============ GET /fusion/stats 统计 ============
  describe('GET /fusion/stats 统计', () => {
    it('统计返回基础聚合数据', async () => {
      const { controller } = createController()
      const stats = await runWithTenant(TENANT_A, () => controller.stats())
      assert.ok(typeof stats.totalTasks === 'number')
      assert.ok(typeof stats.avgConfidence === 'number')
      assert.ok(typeof stats.byTaskType === 'object')
    })
  })
})
