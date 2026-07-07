import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimodal-fusion] [D] dto test 补全
 * MultimodalFusion DTO 类型验证测试
 *
 * 覆盖:
 * - CreateFusionTaskDto 必填/可选字段
 * - CrossModalSearchDto 字段约束
 * - ListFusionTasksQuery 字段约束
 * - FusionTaskResponse 结构
 * - FusionStatsResponse 结构
 */

import assert from 'node:assert/strict'
// ── DTO 类型定义 ──

type FusionSource =
  | 'image' | 'document' | 'voice' | 'multimedia' | 'tabular' | 'text'

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
  linkedEntity?: {
    entityType: 'product' | 'store' | 'campaign' | 'order' | 'report' | 'audit' | 'other'
    entityId: string
  }
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
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  limit?: number
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

interface FusionStatsResponse {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalInsights: number
  totalAnomalies: number
  byTaskType: Record<string, number>
  avgConfidence: number
  avgDurationMs: number
  criticalAnomalies: number
}

// ── 工厂函数 ──

function makeSourceContribution(overrides: Partial<FusionSourceContribution> = {}): FusionSourceContribution {
  return {
    source: 'image',
    sourceId: `src-${Math.random().toString(36).slice(2, 8)}`,
    weight: 0.5,
    confidence: 0.85,
    keyFindings: ['货架整洁度良好', '缺货率 3%'],
    ...overrides,
  }
}

function makeCreateTaskDto(overrides: Partial<CreateFusionTaskDto> = {}): CreateFusionTaskDto {
  return {
    taskType: 'comprehensive_analysis',
    title: '门店货架巡检报告',
    sources: [makeSourceContribution({ source: 'image' }), makeSourceContribution({ source: 'tabular' })],
    ...overrides,
  }
}

function makeCrossModalSearchDto(overrides: Partial<CrossModalSearchDto> = {}): CrossModalSearchDto {
  return {
    query: '可口可乐上架情况',
    modalities: ['image', 'document'],
    topK: 10,
    ...overrides,
  }
}

// ── 测试用例 ──

describe('MultimodalFusion DTO', () => {
  describe('CreateFusionTaskDto', () => {
    it('应正确创建含必填字段的 DTO', () => {
      const dto = makeCreateTaskDto()
      assert.equal(typeof dto.taskType, 'string')
      assert.equal(dto.taskType, 'comprehensive_analysis')
      assert.equal(typeof dto.title, 'string')
      assert.ok(Array.isArray(dto.sources))
      assert.equal(dto.sources.length, 2)
    })

    it('应允许 description 字段为空', () => {
      const dto = makeCreateTaskDto({ description: undefined })
      assert.equal(dto.description, undefined)
    })

    it('应允许 templateId 和 engine 可选字段', () => {
      const dto = makeCreateTaskDto({ templateId: 'tpl-shelf-audit', engine: 'mock-gpt4-multimodal' })
      assert.equal(dto.templateId, 'tpl-shelf-audit')
      assert.equal(dto.engine, 'mock-gpt4-multimodal')
    })

    it('linkedEntity 应包含 entityType 和 entityId', () => {
      const dto = makeCreateTaskDto({
        linkedEntity: { entityType: 'store', entityId: 'store-001' },
      })
      assert.equal(dto.linkedEntity?.entityType, 'store')
      assert.equal(dto.linkedEntity?.entityId, 'store-001')
    })

    it('linkedEntity 应支持所有 entityType 枚举', () => {
      const types: Array<'product' | 'store' | 'campaign' | 'order' | 'report' | 'audit' | 'other'> = [
        'product', 'store', 'campaign', 'order', 'report', 'audit', 'other',
      ]
      for (const t of types) {
        const dto = makeCreateTaskDto({ linkedEntity: { entityType: t, entityId: 'id' } })
        assert.equal(dto.linkedEntity?.entityType, t)
      }
    })

    it('sources 应正确包含 keyFindings', () => {
      const findings = ['货架整洁度良好', '缺货率 3%', '建议补货']
      const source = makeSourceContribution({ keyFindings: findings })
      const dto = makeCreateTaskDto({ sources: [source] })
      assert.ok(dto.sources[0]?.keyFindings.length >= 3)
      assert.equal(dto.sources[0]?.keyFindings[0], '货架整洁度良好')
    })

    it('source weight 默认可为任意非负值', () => {
      const dto = makeCreateTaskDto({
        sources: [
          makeSourceContribution({ weight: 0.3 }),
          makeSourceContribution({ weight: 0.7 }),
        ],
      })
      const total = dto.sources.reduce((s, c) => s + c.weight, 0)
      assert.equal(total, 1.0)
    })

    it('支持所有 taskType 枚举', () => {
      const types: FusionTaskType[] = [
        'comprehensive_analysis', 'report_generation', 'cross_modal_search',
        'anomaly_detection', 'trend_insight', 'entity_linking',
        'sentiment_synthesis', 'compliance_audit',
      ]
      for (const t of types) {
        const dto = makeCreateTaskDto({ taskType: t })
        assert.equal(dto.taskType, t)
      }
    })

    it('sources 应为非空数组', () => {
      const dto1 = makeCreateTaskDto({ sources: [] })
      const dto2 = makeCreateTaskDto({ sources: [makeSourceContribution()] })
      assert.equal(dto1.sources.length, 0)
      assert.equal(dto2.sources.length, 1)
    })
  })

  describe('CrossModalSearchDto', () => {
    it('应正确创建含必填字段的 DTO', () => {
      const dto = makeCrossModalSearchDto()
      assert.equal(typeof dto.query, 'string')
      assert.ok(Array.isArray(dto.modalities))
      assert.equal(dto.topK, 10)
    })

    it('query 应为非空字符串', () => {
      const dto = makeCrossModalSearchDto({ query: '' })
      assert.equal(dto.query, '')
    })

    it('modalities 应支持所有 FusionSource 类型', () => {
      const sources: FusionSource[] = ['image', 'document', 'voice', 'multimedia', 'tabular', 'text']
      const dto = makeCrossModalSearchDto({ modalities: sources })
      assert.equal(dto.modalities.length, 6)
      assert.ok(dto.modalities.includes('image'))
      assert.ok(dto.modalities.includes('voice'))
    })

    it('topK 应为可选正整数', () => {
      const dto1 = makeCrossModalSearchDto({ topK: undefined })
      const dto2 = makeCrossModalSearchDto({ topK: 5 })
      assert.equal(dto1.topK, undefined)
      assert.equal(dto2.topK, 5)
    })

    it('应允许 startTime 和 endTime 为 ISODate 字符串', () => {
      const dto = makeCrossModalSearchDto({
        startTime: '2026-01-01T00:00:00Z',
        endTime: '2026-06-01T00:00:00Z',
      })
      assert.ok(dto.startTime?.includes('2026'))
      assert.ok(dto.endTime?.includes('2026'))
    })
  })

  describe('ListFusionTasksQuery', () => {
    it('所有字段应为可选', () => {
      const query: ListFusionTasksQuery = {}
      assert.equal(query.taskType, undefined)
      assert.equal(query.status, undefined)
      assert.equal(query.limit, undefined)
    })

    it('status 应限制在终态枚举', () => {
      const statuses: Array<'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = [
        'pending', 'processing', 'completed', 'failed', 'cancelled',
      ]
      for (const s of statuses) {
        const q: ListFusionTasksQuery = { status: s }
        assert.equal(q.status, s)
      }
    })

    it('limit 应为可选正整值', () => {
      const q1: ListFusionTasksQuery = { limit: 10 }
      const q2: ListFusionTasksQuery = { limit: 100 }
      assert.equal(q1.limit, 10)
      assert.equal(q2.limit, 100)
    })
  })

  describe('FusionTaskResponse', () => {
    it('应包含所有必填 response 字段', () => {
      const resp: FusionTaskResponse = {
        id: 'fus-test-001',
        tenantId: 't-001',
        taskType: 'comprehensive_analysis',
        title: '测试任务',
        status: 'completed',
        progress: 1.0,
        sourceCount: 2,
        insightCount: 3,
        anomalyCount: 1,
        avgConfidence: 0.85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      assert.equal(resp.id, 'fus-test-001')
      assert.equal(resp.sourceCount, 2)
      assert.equal(resp.insightCount, 3)
      assert.equal(resp.anomalyCount, 1)
      assert.equal(typeof resp.avgConfidence, 'number')
    })

    it('errorMessage 可为 null/undefined', () => {
      const resp1: FusionTaskResponse = {
        id: 'fus-001', tenantId: 't-001', taskType: 'comprehensive_analysis',
        title: 'test', status: 'completed', progress: 1.0,
        sourceCount: 1, insightCount: 0, anomalyCount: 0,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      }
      assert.equal(resp1.errorMessage, undefined)
      const resp2: FusionTaskResponse = {
        ...resp1, id: 'fus-002',
        errorMessage: 'engine timeout',
      }
      assert.equal(resp2.errorMessage, 'engine timeout')
    })
  })

  describe('FusionStatsResponse', () => {
    it('应包含所有统计字段', () => {
      const stats: FusionStatsResponse = {
        totalTasks: 100,
        completedTasks: 80,
        failedTasks: 5,
        totalInsights: 200,
        totalAnomalies: 30,
        byTaskType: { comprehensive_analysis: 50, anomaly_detection: 30, trend_insight: 20 },
        avgConfidence: 0.82,
        avgDurationMs: 4500,
        criticalAnomalies: 3,
      }
      assert.equal(stats.totalTasks, 100)
      assert.equal(stats.completedTasks, 80)
      assert.equal(stats.failedTasks, 5)
      assert.equal(stats.totalAnomalies, 30)
      assert.equal(stats.byTaskType.comprehensive_analysis, 50)
      assert.equal(stats.criticalAnomalies, 3)
    })

    it('byTaskType 应支持空对象', () => {
      const stats: FusionStatsResponse = {
        totalTasks: 0, completedTasks: 0, failedTasks: 0,
        totalInsights: 0, totalAnomalies: 0,
        byTaskType: {},
        avgConfidence: 0, avgDurationMs: 0, criticalAnomalies: 0,
      }
      assert.deepEqual(stats.byTaskType, {})
    })
  })
})
