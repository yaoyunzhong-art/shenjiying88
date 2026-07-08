import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimodal-fusion] [D] e2e test 补全
 *
 * E2E: MultimodalFusion HTTP 链路
 *
 * 验证:
 *   - POST /fusion/tasks 创建融合任务 (6 种类型)
 *   - GET /fusion/tasks 列表查询 (过滤、分页)
 *   - GET /fusion/tasks/:id 获取单个任务
 *   - POST /fusion/tasks/:id/cancel 取消任务
 *   - POST /fusion/search 跨模态搜索
 *   - POST /fusion/index/item 索引
 *   - POST /fusion/index/tabular 表格索引
 *   - GET /fusion/templates 模板列表
 *   - GET /fusion/engines 引擎列表
 *   - GET /fusion/stats 统计
 *   - 异常输入 (缺少数据源、未知引擎、未知模板)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { MultimodalFusionService } from './multimodal-fusion.service'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT = { tenantId: 'e2e-tenant', storeId: 'store-e2e', userId: 'e2e-user', role: 'tenant_admin' as const }

@Controller('fusion')
class TestMultimodalFusionController {
  constructor(
    @Inject(MultimodalFusionService) private readonly service: MultimodalFusionService,
  ) {}

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() body: Record<string, unknown>) {
    return runWithTenant(TENANT, () => this.service.createFusionTask(body as any))
  }

  @Get('tasks')
  async listTasks(@Query() query: Record<string, unknown>) {
    const items = await runWithTenant(TENANT, () => this.service.listFusionTasks(query as any))
    return { items, total: items.length }
  }

  @Get('tasks/:id')
  getTask(@Param('id') id: string) {
    return runWithTenant(TENANT, () => this.service.getFusionTask(id))
  }

  @Post('tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelTask(@Param('id') id: string) {
    return runWithTenant(TENANT, () => this.service.cancelFusionTask(id))
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  crossModalSearch(@Body() body: Record<string, unknown>) {
    return runWithTenant(TENANT, () => this.service.crossModalSearch(body as any))
  }

  @Post('index/item')
  @HttpCode(HttpStatus.CREATED)
  indexItem(@Body() body: { itemId: string; modality: string; text: string; metadata?: any }) {
    return runWithTenant(TENANT, () => this.service.indexItem(body.itemId, body.modality as any, body.text, body.metadata ?? {}))
  }

  @Post('index/tabular')
  @HttpCode(HttpStatus.CREATED)
  indexTabular(@Body() body: { seriesId: string; data: Array<{ ts: string; value: number }> }) {
    return runWithTenant(TENANT, () => this.service.indexTabularData(body.seriesId, body.data))
  }

  @Get('templates')
  listTemplates() {
    return runWithTenant(TENANT, () => ({ items: this.service.listTemplates() }))
  }

  @Get('engines')
  listEngines() {
    return runWithTenant(TENANT, () => ({ items: this.service.listEngines() }))
  }

  @Get('stats')
  getStats() {
    return runWithTenant(TENANT, () => this.service.getFusionStats())
  }
}

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestMultimodalFusionController],
    providers: [MultimodalFusionService],
  }).compile()
  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return app
}

type E2eApp = Awaited<ReturnType<typeof buildApp>>

describe('MultimodalFusion E2E', () => {
  let app: E2eApp

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  /** 提取响应 data */
  function d(res: request.Response) {
    return res.body.data
  }

  // ============ 正例: 创建融合任务 ============
  describe('POST /fusion/tasks', () => {
    it('1a. comprehensive_analysis', async () => {
      const res = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({
          taskType: 'comprehensive_analysis',
          title: '门店巡检',
          sources: [
            { source: 'image', sourceId: 'img-001', weight: 0.6, confidence: 0.85, keyFindings: ['整洁度 92%'] },
            { source: 'document', sourceId: 'doc-001', weight: 0.4, confidence: 0.78, keyFindings: ['库存合规'] },
          ],
          linkedEntity: { entityType: 'store', entityId: 'store-001' },
        })
        .expect(HttpStatus.CREATED)

      const body = d(res)
      assert.ok(body.id, '有 task id')
      assert.equal(body.taskType, 'comprehensive_analysis')
      assert.equal(body.status, 'completed')
      assert.equal(body.progress, 1.0)
      assert.ok(body.durationMs! > 0, '有耗时')
      assert.ok(body.insights.length > 0, '有洞察')
      assert.ok(body.report, '有报告')
      assert.equal(body.report.title, '门店巡检')
    })

    it('1b. anomaly_detection', async () => {
      // 先索引表格数据
      // 用大量重复的正常值 + 一个极高异常值, 确保 z-score > 2
      const normalValues = Array.from({ length: 100 }, (_, i) => 10 + (i % 5))
      await request(app.getHttpServer())
        .post('/fusion/index/tabular')
        .send({ seriesId: 'e2e-ts-anomaly', data: [
          ...normalValues.map((v, i) => ({ ts: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`, value: v })),
          { ts: '2025-04-15T00:00:00Z', value: 9999 },
        ]})
        .expect(HttpStatus.CREATED)

      const res = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({
          taskType: 'anomaly_detection',
          title: '异常检测',
          sources: [{ source: 'tabular', sourceId: 'e2e-ts-anomaly', weight: 1.0, confidence: 0.9, keyFindings: [] }],
        })
        .expect(HttpStatus.CREATED)

      const body = d(res)
      assert.ok(body.id)
      assert.equal(body.status, 'completed')
      assert.ok(body.anomalies.length > 0, '检测到异常')
      assert.equal(body.anomalies[0].type, 'statistical')
    })

    it('1c. sentiment_synthesis', async () => {
      const res = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({
          taskType: 'sentiment_synthesis',
          title: '情感分析',
          sources: [
            { source: 'voice', sourceId: 'voice-001', weight: 0.5, confidence: 0.75, keyFindings: ['积极'] },
            { source: 'text', sourceId: 'text-001', weight: 0.5, confidence: 0.9, keyFindings: ['正面评价'] },
          ],
        })
        .expect(HttpStatus.CREATED)

      const body = d(res)
      assert.ok(body.id)
      assert.equal(body.taskType, 'sentiment_synthesis')
      assert.ok(body.insights.length > 0)
    })

    it('1d. compliance_audit', async () => {
      const res = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({
          taskType: 'compliance_audit',
          title: '合规审查',
          sources: [{ source: 'document', sourceId: 'doc-002', weight: 1.0, confidence: 0.95, keyFindings: [] }],
        })
        .expect(HttpStatus.CREATED)

      const body = d(res)
      assert.ok(body.id)
      assert.equal(body.taskType, 'compliance_audit')
    })

    it('1e. report_generation', async () => {
      const res = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({
          taskType: 'report_generation',
          title: '日报生成',
          sources: [{ source: 'text', sourceId: 'txt-001', weight: 1.0, confidence: 0.8, keyFindings: ['素材'] }],
        })
        .expect(HttpStatus.CREATED)

      const body = d(res)
      assert.ok(body.id)
      assert.equal(body.taskType, 'report_generation')
      assert.ok(body.report, '有报告')
    })

    it('1f. entity_linking', async () => {
      const res = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({
          taskType: 'entity_linking',
          title: '实体链接',
          sources: [
            { source: 'image', sourceId: 'img-entity', weight: 0.5, confidence: 0.88, keyFindings: ['商品A', '商品B'] },
            { source: 'text', sourceId: 'txt-entity', weight: 0.5, confidence: 0.76, keyFindings: ['商品C'] },
          ],
        })
        .expect(HttpStatus.CREATED)

      const body = d(res)
      assert.ok(body.id)
      assert.equal(body.taskType, 'entity_linking')
      assert.ok(body.insights.length > 0)
    })
  })

  // ============ 反例 ============
  describe('POST /fusion/tasks - error cases', () => {
    it('2a. 空数据源拒绝', async () => {
      await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({ taskType: 'comprehensive_analysis', title: '空', sources: [] })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('2b. 零权重拒绝', async () => {
      await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({ taskType: 'comprehensive_analysis', title: '零权重',
          sources: [{ source: 'image', sourceId: 'img-z', weight: 0, confidence: 0.8, keyFindings: [] }] })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('2c. 未知引擎拒绝', async () => {
      await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({ taskType: 'comprehensive_analysis', title: '未知引擎', engine: 'fake-engine',
          sources: [{ source: 'image', sourceId: 'img-ue', weight: 1.0, confidence: 0.8, keyFindings: [] }] })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('2d. 未知模板拒绝', async () => {
      await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({ taskType: 'comprehensive_analysis', title: '未知模板', templateId: 'fake-tpl',
          sources: [{ source: 'image', sourceId: 'img-ut', weight: 1.0, confidence: 0.8, keyFindings: [] }] })
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  // ============ GET /fusion/tasks ============
  describe('GET /fusion/tasks', () => {
    it('3a. 列表返回', async () => {
      const res = await request(app.getHttpServer())
        .get('/fusion/tasks')
        .expect(HttpStatus.OK)

      const body = d(res)
      assert.ok(Array.isArray(body.items))
      assert.equal(typeof body.total, 'number')
      assert.ok(body.items.length > 0, '有之前创建的任务')
    })

    it('3b. 按 taskType 过滤', async () => {
      const res = await request(app.getHttpServer())
        .get('/fusion/tasks')
        .query({ taskType: 'anomaly_detection' })
        .expect(HttpStatus.OK)

      for (const item of d(res).items) {
        assert.equal(item.taskType, 'anomaly_detection')
      }
    })

    it('3c. 按 status 过滤', async () => {
      const res = await request(app.getHttpServer())
        .get('/fusion/tasks')
        .query({ status: 'completed' })
        .expect(HttpStatus.OK)

      for (const item of d(res).items) {
        assert.equal(item.status, 'completed')
      }
    })

    it('3d. limit 限制', async () => {
      const res = await request(app.getHttpServer())
        .get('/fusion/tasks')
        .query({ limit: 2 })
        .expect(HttpStatus.OK)

      assert.ok(d(res).items.length <= 2)
    })
  })

  // ============ GET /fusion/tasks/:id ============
  describe('GET /fusion/tasks/:id', () => {
    it('4a. 按 id 获取任务', async () => {
      const created = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({ taskType: 'trend_insight', title: '趋势',
          sources: [{ source: 'tabular', sourceId: 'e2e-ts-anomaly', weight: 1.0, confidence: 0.85, keyFindings: [] }] })
        .expect(HttpStatus.CREATED)

      const taskId = d(created).id
      const res = await request(app.getHttpServer())
        .get(`/fusion/tasks/${taskId}`)
        .expect(HttpStatus.OK)

      assert.equal(d(res).id, taskId)
      assert.equal(d(res).taskType, 'trend_insight')
    })

    it('4b. 不存在返回 404', async () => {
      await request(app.getHttpServer())
        .get('/fusion/tasks/non-existent')
        .expect(HttpStatus.NOT_FOUND)
    })
  })

  // ============ POST /fusion/tasks/:id/cancel ============
  describe('POST /fusion/tasks/:id/cancel', () => {
    it('5a. 已完成任务不可取消 (BadRequest)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fusion/tasks')
        .send({ taskType: 'report_generation', title: '快速',
          sources: [{ source: 'text', sourceId: 'txt-cancel', weight: 1.0, confidence: 0.5, keyFindings: [] }] })
        .expect(HttpStatus.CREATED)

      const res = await request(app.getHttpServer())
        .post(`/fusion/tasks/${d(created).id}/cancel`)
        .expect(HttpStatus.BAD_REQUEST)

      assert.ok(res.body.message)
    })
  })

  // ============ 跨模态搜索 ============
  describe('POST /fusion/search', () => {
    const items = [
      { itemId: 'img-cat', modality: 'image', text: '橘猫在沙发上睡觉图片' },
      { itemId: 'doc-report', modality: 'document', text: '业绩大幅增长销售报告' },
      { itemId: 'stt-meeting', modality: 'voice', text: '商品营销策略推广方案会议讨论' },
    ]

    beforeAll(async () => {
      for (const item of items) {
        await request(app.getHttpServer())
          .post('/fusion/index/item')
          .send(item)
          .expect(HttpStatus.CREATED)
      }
    })

    it('6a. 搜索返回结果', async () => {
      const res = await request(app.getHttpServer())
        .post('/fusion/search')
        .send({ query: '橘猫', modalities: ['image', 'document', 'voice'], topK: 10 })
        .expect(HttpStatus.OK)

      const body = d(res)
      assert.ok(Array.isArray(body), 'crossModalSearch 返回数组')
      assert.ok(body.length > 0, '匹配到橘猫')
    })

    it('6b. 按 modality 过滤', async () => {
      const res = await request(app.getHttpServer())
        .post('/fusion/search')
        .send({ query: '销售', modalities: ['document'], topK: 5 })
        .expect(HttpStatus.OK)

      for (const hit of d(res)) {
        assert.equal(hit.modality, 'document')
      }
    })

    it('6c. 空查询拒绝', async () => {
      await request(app.getHttpServer())
        .post('/fusion/search')
        .send({ query: '', modalities: ['image'] })
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  // ============ 索引 ============
  describe('POST /fusion/index', () => {
    it('7a. 索引 item', async () => {
      await request(app.getHttpServer())
        .post('/fusion/index/item')
        .send({ itemId: 'e2e-final-img', modality: 'image', text: 'final', metadata: { test: true } })
        .expect(HttpStatus.CREATED)
    })

    it('7b. 索引表格', async () => {
      await request(app.getHttpServer())
        .post('/fusion/index/tabular')
        .send({ seriesId: 'e2e-final-ts', data: [{ ts: '2025-01-01T00:00:00Z', value: 100 }, { ts: '2025-01-02T00:00:00Z', value: 105 }] })
        .expect(HttpStatus.CREATED)
    })
  })

  // ============ GET /fusion/templates ============
  describe('GET /fusion/templates', () => {
    it('8. 返回模板列表', async () => {
      const res = await request(app.getHttpServer())
        .get('/fusion/templates')
        .expect(HttpStatus.OK)

      const body = d(res)
      assert.ok(Array.isArray(body.items))
      assert.ok(body.items.length > 0)
      for (const tpl of body.items) {
        assert.ok(tpl.id)
        assert.ok(tpl.name)
        assert.ok(tpl.taskType)
      }
    })
  })

  // ============ GET /fusion/engines ============
  describe('GET /fusion/engines', () => {
    it('9. 返回引擎列表', async () => {
      const res = await request(app.getHttpServer())
        .get('/fusion/engines')
        .expect(HttpStatus.OK)

      const body = d(res)
      assert.ok(Array.isArray(body.items))
      assert.ok(body.items.length > 0)
      for (const eng of body.items) {
        assert.ok(eng.type)
        assert.ok(eng.displayName)
      }
    })
  })

  // ============ GET /fusion/stats ============
  describe('GET /fusion/stats', () => {
    it('10. 返回统计数据', async () => {
      const res = await request(app.getHttpServer())
        .get('/fusion/stats')
        .expect(HttpStatus.OK)

      const body = d(res)
      assert.equal(typeof body.totalTasks, 'number')
      assert.equal(typeof body.completedTasks, 'number')
      assert.equal(typeof body.totalInsights, 'number')
      assert.equal(typeof body.totalAnomalies, 'number')
      assert.ok(body.byTaskType)
      assert.equal(typeof body.criticalAnomalies, 'number')
      assert.ok(body.totalTasks > 0, '有之前创建的任务')
    })
  })
})
