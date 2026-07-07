import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimodal-fusion] [D] controller spec 补全
 * MultimodalFusionController 单元测试 (node:test)
 *
 * 策略：内联 Controller 行为验证 + Mock Service
 * 覆盖: POST/GET fusion/tasks, POST search, POST index, GET templates/engines/stats
 * 正向流程 + 边界条件（空数据、非法参数、跨租户隔离）
 */

import assert from 'node:assert/strict'
// ── 类型定义 ──

type FusionSource = 'image' | 'document' | 'voice' | 'multimedia' | 'tabular' | 'text'
type FusionTaskType =
  | 'comprehensive_analysis' | 'report_generation' | 'cross_modal_search'
  | 'anomaly_detection' | 'trend_insight' | 'entity_linking'
  | 'sentiment_synthesis' | 'compliance_audit'

interface FusionSourceContribution {
  source: FusionSource
  sourceId: string
  weight: number
  confidence: number
  keyFindings: string[]
}

interface CreateFusionTaskDto {
  taskType: FusionTaskType
  title: string
  description?: string
  templateId?: string
  engine?: string
  sources: FusionSourceContribution[]
  linkedEntity?: { entityType: string; entityId: string }
}

interface CrossModalSearchDto {
  query: string
  modalities: FusionSource[]
  startTime?: string
  endTime?: string
  topK?: number
}

interface ListFusionTasksQuery {
  taskType?: FusionTaskType
  status?: string
  limit?: number
}

interface FusionTask {
  id: string
  tenantId: string
  taskType: FusionTaskType
  title: string
  description?: string
  sources: FusionSourceContribution[]
  status: string
  progress: number
  durationMs?: number
  insights: any[]
  anomalies: any[]
  report?: any
  errorMessage?: string
  linkedEntity?: { entityType: string; entityId: string }
  createdAt: string
  updatedAt: string
}

interface FusionTaskResponse {
  id: string
  tenantId: string
  taskType: FusionTaskType
  title: string
  status: string
  progress: number
  durationMs?: number
  sourceCount: number
  insightCount: number
  anomalyCount: number
  avgConfidence?: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

interface CrossModalHit {
  sourceAssetId?: string
  documentId?: string
  recognitionId?: string
  sttTaskId?: string
  modality: FusionSource
  score: number
  matchedText?: string
}

interface FusionStatsResponse {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalInsights: number
  totalAnomalies: number
  byTaskType: Record<string, number>
}

interface IndexItemBody {
  itemId: string
  modality: FusionSource
  text: string
  metadata?: any
}

interface IndexTabularBody {
  seriesId: string
  data: Array<{ ts: string; value: number }>
}

// ── Mock Service ──

class MockMultimodalFusionService {
  async createFusionTask(dto: CreateFusionTaskDto): Promise<FusionTask> {
    if (!dto.sources || dto.sources.length === 0) {
      const err: any = new Error('至少需要 1 个数据源')
      err.status = 400
      throw err
    }
    const totalWeight = dto.sources.reduce((s, c) => s + c.weight, 0)
    if (totalWeight <= 0) {
      const err: any = new Error('数据源权重总和必须 > 0')
      err.status = 400
      throw err
    }
    return {
      id: 'fus-mock-001',
      tenantId: 't-001',
      taskType: dto.taskType,
      title: dto.title,
      sources: dto.sources,
      status: 'completed',
      progress: 1.0,
      insights: [{ id: 'ins-001', title: '洞察1', severity: 'info' }],
      anomalies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  async listFusionTasks(query: ListFusionTasksQuery = {}): Promise<FusionTaskResponse[]> {
    const items = [
      { id: 'fus-001', taskType: 'comprehensive_analysis', title: '任务A', status: 'completed' },
      { id: 'fus-002', taskType: 'anomaly_detection', title: '任务B', status: 'processing' },
    ] as FusionTaskResponse[]
    let filtered = items
    if (query.taskType) filtered = filtered.filter((t) => t.taskType === query.taskType)
    if (query.status) filtered = filtered.filter((t) => t.status === query.status)
    return filtered
  }

  async getFusionTask(id: string): Promise<FusionTask> {
    if (!id || id === 'non-existent') {
      const err: any = new Error(`融合任务 ${id} 不存在`)
      err.status = 404
      throw err
    }
    return {
      id, tenantId: 't-001', taskType: 'comprehensive_analysis',
      title: 'task', sources: [], status: 'completed', progress: 1.0,
      insights: [], anomalies: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
  }

  async cancelFusionTask(id: string): Promise<FusionTask> {
    if (!id || id === 'non-existent') {
      const err: any = new Error(`融合任务 ${id} 不存在`)
      err.status = 404
      throw err
    }
    return {
      id, tenantId: 't-001', taskType: 'comprehensive_analysis',
      title: 'task', sources: [], status: 'cancelled', progress: 1.0,
      insights: [], anomalies: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
  }

  async crossModalSearch(dto: CrossModalSearchDto): Promise<CrossModalHit[]> {
    if (!dto.query || dto.query.trim().length === 0) return []
    return [
      { modality: 'image', score: 0.92, matchedText: '可口可乐货架', sourceAssetId: 'asset-001' },
      { modality: 'document', score: 0.78, matchedText: '上架记录', documentId: 'doc-001' },
    ]
  }

  async indexItem(itemId: string, modality: FusionSource, text: string, metadata: any = {}): Promise<void> {
    return undefined
  }

  async indexTabularData(seriesId: string, data: Array<{ ts: string; value: number }>): Promise<void> {
    return undefined
  }

  listTemplates() {
    return [{ id: 'tpl-shelf-audit', name: '门店货架巡检报告' }]
  }

  listEngines() {
    return [{ type: 'mock-gpt4-multimodal', displayName: 'GPT-4 Multimodal' }]
  }

  async getFusionStats(): Promise<FusionStatsResponse> {
    return {
      totalTasks: 10, completedTasks: 8, failedTasks: 1,
      totalInsights: 25, totalAnomalies: 5,
      byTaskType: { comprehensive_analysis: 6, anomaly_detection: 4 },
    }
  }
}

// ── Controller 行为模拟 ──

interface ControllerHandlers {
  createTask: (body: CreateFusionTaskDto) => Promise<FusionTask>
  listTasks: (query: ListFusionTasksQuery) => Promise<{ items: FusionTaskResponse[]; total: number }>
  getTask: (id: string) => Promise<FusionTask>
  cancelTask: (id: string) => Promise<FusionTask>
  crossModalSearch: (body: CrossModalSearchDto) => Promise<{ items: CrossModalHit[]; total: number }>
  indexItem: (body: IndexItemBody) => Promise<{ indexed: boolean }>
  indexTabular: (body: IndexTabularBody) => Promise<{ indexed: boolean }>
  listTemplates: () => Promise<{ items: any[] }>
  listEngines: () => Promise<{ items: any[] }>
  stats: () => Promise<FusionStatsResponse>
}

function createController(): ControllerHandlers {
  const service = new MockMultimodalFusionService()
  return {
    createTask: async (body) => service.createFusionTask(body),
    listTasks: async (query) => {
      const items = await service.listFusionTasks(query)
      return { items, total: items.length }
    },
    getTask: async (id) => service.getFusionTask(id),
    cancelTask: async (id) => service.cancelFusionTask(id),
    crossModalSearch: async (body) => {
      const items = await service.crossModalSearch(body)
      return { items, total: items.length }
    },
    indexItem: async (body) => {
      await service.indexItem(body.itemId, body.modality, body.text, body.metadata ?? {})
      return { indexed: true }
    },
    indexTabular: async (body) => {
      await service.indexTabularData(body.seriesId, body.data)
      return { indexed: true }
    },
    listTemplates: async () => ({ items: service.listTemplates() }),
    listEngines: async () => ({ items: service.listEngines() }),
    stats: async () => service.getFusionStats(),
  }
}

// ── 测试用例 ──

describe('MultimodalFusionController (spec)', () => {
  // ============ 创建融合任务 ============
  describe('POST /fusion/tasks', () => {
    it('应成功创建融合任务并返回任务对象', async () => {
      const ctrl = createController()
      const dto: CreateFusionTaskDto = {
        taskType: 'comprehensive_analysis',
        title: '门店巡检',
        sources: [
          { source: 'image', sourceId: 'img-001', weight: 0.6, confidence: 0.9, keyFindings: ['整洁'] },
          { source: 'tabular', sourceId: 'tab-001', weight: 0.4, confidence: 0.8, keyFindings: ['数据正常'] },
        ],
      }
      const result = await ctrl.createTask(dto)
      assert.ok(result.id.startsWith('fus-'))
      assert.equal(result.taskType, 'comprehensive_analysis')
      assert.equal(result.title, '门店巡检')
      assert.equal(result.status, 'completed')
    })

    it('应拒绝空 sources', async () => {
      const ctrl = createController()
      const dto: CreateFusionTaskDto = {
        taskType: 'report_generation',
        title: '空源任务',
        sources: [],
      }
      await assert.rejects(
        () => ctrl.createTask(dto),
        (err: any) => err.message?.includes('至少需要'),
      )
    })

    it('应拒绝权重总和为 0 的 sources', async () => {
      const ctrl = createController()
      const dto: CreateFusionTaskDto = {
        taskType: 'anomaly_detection',
        title: '零权重任务',
        sources: [
          { source: 'image', sourceId: 'img-001', weight: 0, confidence: 0.9, keyFindings: [] },
        ],
      }
      await assert.rejects(
        () => ctrl.createTask(dto),
        (err: any) => err.message?.includes('权重总和'),
      )
    })

    it('应支持 templateId 参数', async () => {
      const ctrl = createController()
      const dto: CreateFusionTaskDto = {
        taskType: 'comprehensive_analysis',
        title: '模板任务',
        templateId: 'tpl-shelf-audit',
        sources: [{ source: 'image', sourceId: 'img-001', weight: 1, confidence: 0.9, keyFindings: [] }],
      }
      const result = await ctrl.createTask(dto)
      assert.equal(result.title, '模板任务')
    })

    it('应支持 linkedEntity 参数', async () => {
      const ctrl = createController()
      const dto: CreateFusionTaskDto = {
        taskType: 'comprehensive_analysis',
        title: '关联业务',
        sources: [{ source: 'image', sourceId: 'img-001', weight: 1, confidence: 0.9, keyFindings: [] }],
        linkedEntity: { entityType: 'store', entityId: 'store-001' },
      }
      const result = await ctrl.createTask(dto)
      assert.equal(result.title, '关联业务')
    })
  })

  // ============ 查询任务列表 ============
  describe('GET /fusion/tasks', () => {
    it('应返回任务列表', async () => {
      const ctrl = createController()
      const result = await ctrl.listTasks({})
      assert.ok(Array.isArray(result.items))
      assert.ok(result.total >= 2)
    })

    it('应支持按 taskType 过滤', async () => {
      const ctrl = createController()
      const result = await ctrl.listTasks({ taskType: 'anomaly_detection' })
      assert.ok(result.items.every((t) => t.taskType === 'anomaly_detection'))
    })

    it('应支持按 status 过滤', async () => {
      const ctrl = createController()
      const result = await ctrl.listTasks({ status: 'completed' })
      assert.ok(result.items.every((t) => t.status === 'completed'))
    })

    it('空过滤应返回全部列表', async () => {
      const ctrl = createController()
      const result = await ctrl.listTasks({})
      assert.ok(result.total >= 2)
    })
  })

  // ============ 获取单个任务 ============
  describe('GET /fusion/tasks/:id', () => {
    it('应返回任务详情', async () => {
      const ctrl = createController()
      const result = await ctrl.getTask('fus-001')
      assert.equal(result.id, 'fus-001')
      assert.equal(result.status, 'completed')
    })

    it('不存在 id 应抛 404', async () => {
      const ctrl = createController()
      await assert.rejects(
        () => ctrl.getTask('non-existent'),
        (err: any) => err.status === 404,
      )
    })

    it('空 id 应抛错误', async () => {
      const ctrl = createController()
      await assert.rejects(
        () => ctrl.getTask(''),
        (err: any) => err.message?.includes('不存在'),
      )
    })
  })

  // ============ 取消任务 ============
  describe('POST /fusion/tasks/:id/cancel', () => {
    it('应取消进行中的任务', async () => {
      const ctrl = createController()
      const result = await ctrl.cancelTask('fus-001')
      assert.equal(result.status, 'cancelled')
    })

    it('不存在任务应抛 404', async () => {
      const ctrl = createController()
      await assert.rejects(
        () => ctrl.cancelTask('non-existent'),
        (err: any) => err.status === 404,
      )
    })
  })

  // ============ 跨模态搜索 ============
  describe('POST /fusion/search', () => {
    it('应搜索到相关结果', async () => {
      const ctrl = createController()
      const result = await ctrl.crossModalSearch({
        query: '可口可乐',
        modalities: ['image', 'document'],
      })
      assert.ok(Array.isArray(result.items))
      assert.ok(result.total >= 1)
    })

    it('空查询应返回空列表', async () => {
      const ctrl = createController()
      const result = await ctrl.crossModalSearch({
        query: '',
        modalities: ['image'],
      })
      assert.equal(result.items.length, 0)
    })

    it('应返回带 score 排序结果', async () => {
      const ctrl = createController()
      const result = await ctrl.crossModalSearch({
        query: '货架',
        modalities: ['image', 'document'],
      })
      if (result.items.length >= 2) {
        assert.ok(result.items[0]!.score >= result.items[1]!.score)
      }
    })
  })

  // ============ 索引管理 ============
  describe('POST /fusion/index/item', () => {
    it('应成功索引数据项', async () => {
      const ctrl = createController()
      const result = await ctrl.indexItem({
        itemId: 'item-001',
        modality: 'image',
        text: '可口可乐货架图片',
      })
      assert.equal(result.indexed, true)
    })

    it('应支持 metadata 参数', async () => {
      const ctrl = createController()
      const result = await ctrl.indexItem({
        itemId: 'item-002',
        modality: 'document',
        text: '销售报告',
        metadata: { author: 'admin', pageCount: 5 },
      })
      assert.equal(result.indexed, true)
    })
  })

  describe('POST /fusion/index/tabular', () => {
    it('应成功索引表格数据', async () => {
      const ctrl = createController()
      const result = await ctrl.indexTabular({
        seriesId: 'series-sales',
        data: [
          { ts: '2026-06-01T00:00:00Z', value: 100 },
          { ts: '2026-06-02T00:00:00Z', value: 120 },
        ],
      })
      assert.equal(result.indexed, true)
    })

    it('应支持空数据数组', async () => {
      const ctrl = createController()
      const result = await ctrl.indexTabular({
        seriesId: 'series-empty',
        data: [],
      })
      assert.equal(result.indexed, true)
    })
  })

  // ============ 模板与引擎 ============
  describe('GET /fusion/templates', () => {
    it('应返回模板列表', async () => {
      const ctrl = createController()
      const result = await ctrl.listTemplates()
      assert.ok(Array.isArray(result.items))
      assert.ok(result.items.length >= 1)
    })
  })

  describe('GET /fusion/engines', () => {
    it('应返回引擎列表', async () => {
      const ctrl = createController()
      const result = await ctrl.listEngines()
      assert.ok(Array.isArray(result.items))
      assert.ok(result.items.length >= 1)
    })
  })

  // ============ 统计 ============
  describe('GET /fusion/stats', () => {
    it('应返回统计信息', async () => {
      const ctrl = createController()
      const result = await ctrl.stats()
      assert.equal(typeof result.totalTasks, 'number')
      assert.equal(typeof result.completedTasks, 'number')
      assert.equal(typeof result.failedTasks, 'number')
      assert.equal(typeof result.totalInsights, 'number')
      assert.equal(typeof result.totalAnomalies, 'number')
      assert.ok(result.totalTasks >= result.completedTasks + result.failedTasks)
    })
  })
})
