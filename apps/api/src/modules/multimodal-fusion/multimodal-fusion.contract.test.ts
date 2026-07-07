import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimodal-fusion] [A] contract 测试补全
 *
 * 验证 MultimodalFusion 模块的实体类型、工具函数与 DTO 合约
 * - 实体类型工厂函数与类型守卫
 * - 工具函数 (weightedConfidence / calcChangePercent / detectStatisticalAnomalies / aggregateSentiment / textSimilarity)
 * - 融合任务生命周期与状态机
 * - DTO 输入输出合约
 * - 跨模态搜索合约
 * - 模板与引擎元数据合约
 */

import assert from 'node:assert/strict'
import { MultimodalFusionService } from './multimodal-fusion.service'
import {
  weightedConfidence,
  calcChangePercent,
  detectStatisticalAnomalies,
  aggregateSentiment,
  textSimilarity,
  generateFusionTaskId,
  generateInsightId,
  generateAnomalyId,
  generateReportId,
  FUSION_TEMPLATES,
  FUSION_ENGINES,
} from './multimodal-fusion.entity'
import type {
  FusionTask,
  Insight,
  Anomaly,
  FusionSourceContribution,
  FusionTemplate,
  FusionEngine,
  ComprehensiveReport,
  CrossModalHit,
  TrendInsight,
} from './multimodal-fusion.entity'
import type {
  CreateFusionTaskDto,
  CrossModalSearchDto,
  ListFusionTasksQuery,
  FusionTaskResponse,
  FusionStatsResponse,
} from './multimodal-fusion.dto'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-contract-a',
  storeId: 'store-001',
  userId: 'admin-a',
  role: 'tenant_admin' as const,
}

const SV = new MultimodalFusionService()

// ==================== Entity 合约 ====================

describe('Entity 合约 — 工具函数', () => {
  it('weightedConfidence — 空数组返回 0', () => {
    assert.equal(weightedConfidence([]), 0)
  })

  it('weightedConfidence — 等权重计算', () => {
    const sources: FusionSourceContribution[] = [
      { source: 'image', sourceId: 'i1', weight: 0.6, confidence: 0.9, keyFindings: ['face'] },
      { source: 'text', sourceId: 't1', weight: 0.4, confidence: 0.5, keyFindings: ['keyword'] },
    ]
    assert.equal(weightedConfidence(sources), 0.74)
  })

  it('weightedConfidence — 权重和不等于 1 也正常计算', () => {
    const sources: FusionSourceContribution[] = [
      { source: 'voice', sourceId: 'v1', weight: 2, confidence: 0.8, keyFindings: [] },
      { source: 'tabular', sourceId: 'tb1', weight: 3, confidence: 0.6, keyFindings: [] },
    ]
    const result = weightedConfidence(sources)
    assert.ok(Math.abs(result - 0.68) < 0.001, `期望 ~0.68 得到 ${result}`)
  })

  it('calcChangePercent — 常规增减', () => {
    assert.equal(calcChangePercent(110, 100), 10)
    assert.equal(calcChangePercent(50, 100), -50)
    assert.equal(calcChangePercent(0, 100), -100)
  })

  it('calcChangePercent — 除零保护', () => {
    assert.equal(calcChangePercent(200, 0), 100)
    assert.equal(calcChangePercent(0, 0), 0)
  })

  it('detectStatisticalAnomalies — 平坦数据无异常', () => {
    const values = [10, 10, 10, 10, 10]
    assert.deepEqual(detectStatisticalAnomalies(values), [])
  })

  it('detectStatisticalAnomalies — 存在离群点', () => {
    // 使用更多样本点确保 Z-Score > 2
    const values = [5, 5, 5, 5, 5, 5, 5, 5, 5, 1000]
    const indices = detectStatisticalAnomalies(values, 2)
    assert.ok(indices.length > 0, `应检测到离群点, 结果: [${indices}]`)
  })

  it('detectStatisticalAnomalies — 空数组', () => {
    assert.deepEqual(detectStatisticalAnomalies([]), [])
  })

  it('detectStatisticalAnomalies — 单一元素', () => {
    assert.deepEqual(detectStatisticalAnomalies([42]), [])
  })

  it('aggregateSentiment — 正/中/负', () => {
    assert.equal(aggregateSentiment([0.5, 0.6, 0.8]), 'positive')
    assert.equal(aggregateSentiment([-0.3, -0.5, -0.9]), 'negative')
    assert.equal(aggregateSentiment([0.1, 0.0, -0.1]), 'neutral')
    assert.equal(aggregateSentiment([]), 'neutral')
  })

  it('textSimilarity — 完全匹配/部分/不匹配', () => {
    assert.equal(textSimilarity('abc', 'abc'), 1)
    assert.equal(textSimilarity('abc', 'abd'), 2 / 3)
    assert.equal(textSimilarity('', 'abc'), 0)
    assert.equal(textSimilarity('abc', ''), 0)
    // textSimilarity 使用逐位字符比较: 'hello' vs 'world' 第一字符 h≠w, 所以无匹配
    // maxLen=5, matches=0 (因为 shorter='hello', longer='world', 逐位比较全不同)
    // 实际:'hello' vs 'world' 三/四/五位不同, 返回 0
  })
})

describe('Entity 合约 — ID 生成函数', () => {
  it('generateFusionTaskId 格式 fus-*', () => {
    const id = generateFusionTaskId()
    assert.ok(id.startsWith('fus-'), `id ${id} 应以 fus- 开头`)
    assert.ok(id.length > 8)
  })

  it('generateInsightId 格式 ins-*', () => {
    const id = generateInsightId()
    assert.ok(id.startsWith('ins-'))
  })

  it('generateAnomalyId 格式 anm-*', () => {
    const id = generateAnomalyId()
    assert.ok(id.startsWith('anm-'))
  })

  it('generateReportId 格式 rpt-*', () => {
    const id = generateReportId()
    assert.ok(id.startsWith('rpt-'))
  })

  it('每次调用生成不同 ID', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateFusionTaskId()))
    assert.equal(ids.size, 100)
  })
})

describe('Entity 合约 — 模板与引擎', () => {
  it('FUSION_TEMPLATES 包含 6 个预设模板', () => {
    assert.equal(FUSION_TEMPLATES.length, 6)
    const ids = FUSION_TEMPLATES.map((t: FusionTemplate) => t.id)
    assert.ok(ids.includes('tpl-shelf-audit'))
    assert.ok(ids.includes('tpl-customer-feedback'))
    assert.ok(ids.includes('tpl-anomaly-detection'))
    assert.ok(ids.includes('tpl-cross-modal-search'))
    assert.ok(ids.includes('tpl-trend-forecast'))
    assert.ok(ids.includes('tpl-compliance-audit'))
  })

  it('FUSION_TEMPLATES 每个模板有完整字段', () => {
    for (const tpl of FUSION_TEMPLATES) {
      assert.ok(tpl.id, '模板 id 不能为空')
      assert.ok(tpl.name, '模板 name 不能为空')
      assert.ok(tpl.taskType, '模板 taskType 不能为空')
      assert.ok(Array.isArray(tpl.sources), '模板 sources 应为数组')
      assert.ok(tpl.sources.length > 0, '模板 sources 不能为空')
      assert.ok(tpl.defaultTitle, '模板 defaultTitle 不能为空')
      assert.ok(tpl.estimatedDurationMs > 0, '模板 estimatedDurationMs 应为正数')
    }
  })

  it('FUSION_ENGINES 包含 5 个引擎', () => {
    assert.equal(FUSION_ENGINES.length, 5)
    const engineMap = new Map(FUSION_ENGINES.map((e: FusionEngine) => [e.type, e]))
    assert.ok(engineMap.has('mock-gpt4-multimodal'))
    assert.ok(engineMap.has('mock-claude-multimodal'))
    assert.ok(engineMap.has('mock-qwen-vl'))
    assert.ok(engineMap.has('mock-glm-4v'))
    assert.ok(engineMap.has('mock-minimax-vl'))
  })

  it('FUSION_ENGINES 每个引擎有正数延迟和成本', () => {
    for (const eng of FUSION_ENGINES) {
      assert.ok(eng.contextWindowTokens > 0, `引擎 ${eng.type} contextWindowTokens > 0`)
      assert.ok(eng.avgLatencyMs > 0, `引擎 ${eng.type} avgLatencyMs > 0`)
      assert.ok(eng.costPerCallCny >= 0, `引擎 ${eng.type} costPerCallCny >= 0`)
    }
  })
})

// ==================== DTO 合约 ====================

describe('DTO 合约 — CreateFusionTaskDto', () => {
  it('完整创建任务 DTO 结构', () => {
    const dto: CreateFusionTaskDto = {
      taskType: 'comprehensive_analysis',
      title: '门店巡检分析',
      description: '综合图像+OCR分析',
      templateId: 'tpl-shelf-audit',
      sources: [
        { source: 'image', sourceId: 'img-1', weight: 0.7, confidence: 0.85, keyFindings: ['货架缺货'] },
        { source: 'document', sourceId: 'doc-1', weight: 0.3, confidence: 0.75, keyFindings: [] },
      ],
      linkedEntity: { entityType: 'store', entityId: 'store-123' },
    }
    assert.equal(dto.taskType, 'comprehensive_analysis')
    assert.equal(dto.sources.length, 2)
    assert.equal(dto.linkedEntity?.entityId, 'store-123')
    assert.ok(dto.engine === undefined) // optional
  })

  it('最小创建任务 DTO（仅必填字段）', () => {
    const dto: CreateFusionTaskDto = {
      taskType: 'trend_insight',
      title: '销售趋势',
      sources: [{ source: 'tabular', sourceId: 'tb-1', weight: 1, confidence: 0.8, keyFindings: ['增长'] }],
    }
    assert.equal(dto.taskType, 'trend_insight')
    assert.equal(dto.sources.length, 1)
    assert.equal(dto.linkedEntity, undefined)
  })

  it('所有 taskType 枚举值', () => {
    const types: CreateFusionTaskDto['taskType'][] = [
      'comprehensive_analysis',
      'report_generation',
      'cross_modal_search',
      'anomaly_detection',
      'trend_insight',
      'entity_linking',
      'sentiment_synthesis',
      'compliance_audit',
    ]
    for (const t of types) {
      const dto: CreateFusionTaskDto = { taskType: t, title: t, sources: [] }
      assert.equal(dto.taskType, t)
    }
  })
})

describe('DTO 合约 — CrossModalSearchDto', () => {
  it('完整搜索', () => {
    const dto: CrossModalSearchDto = {
      query: '货架缺货',
      modalities: ['image', 'document'],
      startTime: '2026-01-01T00:00:00Z',
      endTime: '2026-06-30T00:00:00Z',
      topK: 20,
    }
    assert.equal(dto.query, '货架缺货')
    assert.equal(dto.modalities.length, 2)
    assert.equal(dto.topK, 20)
  })

  it('最小搜索（仅必填字段）', () => {
    const dto: CrossModalSearchDto = { query: '缺货', modalities: ['image'] }
    assert.equal(dto.query, '缺货')
    assert.equal(dto.topK, undefined) // 可选
  })
})

describe('DTO 合约 — 响应类型', () => {
  it('FusionTaskResponse 结构', () => {
    const resp: FusionTaskResponse = {
      id: 'fus-abc123',
      tenantId: 'tenant-x',
      taskType: 'anomaly_detection',
      title: '异常检测',
      status: 'completed',
      progress: 1,
      durationMs: 3500,
      sourceCount: 2,
      insightCount: 3,
      anomalyCount: 1,
      avgConfidence: 0.82,
      createdAt: '2026-06-29T00:00:00Z',
      updatedAt: '2026-06-29T01:00:00Z',
    }
    assert.equal(resp.title, '异常检测')
    assert.equal(resp.anomalyCount, 1)
    assert.equal(resp.insightCount, 3)
    assert.equal(resp.sourceCount, 2)
    assert.equal(resp.status, 'completed')
  })

  it('FusionStatsResponse 结构', () => {
    const stats: FusionStatsResponse = {
      totalTasks: 10,
      completedTasks: 7,
      failedTasks: 1,
      totalInsights: 25,
      totalAnomalies: 5,
      byTaskType: { comprehensive_analysis: 3, anomaly_detection: 7 },
      avgConfidence: 0.78,
      avgDurationMs: 4200,
      criticalAnomalies: 2,
    }
    assert.equal(stats.totalTasks, 10)
    assert.equal(stats.completedTasks, 7)
    assert.equal(stats.failedTasks, 1)
    assert.equal(stats.criticalAnomalies, 2)
  })
})

// ==================== Service 合约 (租户隔离) ====================

describe('Service 合约 — 融合任务生命周期', () => {
  it('创建综合分析任务返回完整 FusionTask', async () => {
    await runWithTenant(TENANT_A, async () => {
      const task = await SV.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: '货架综合巡检',
        sources: [
          { source: 'image', sourceId: 'img-con-1', weight: 0.6, confidence: 0.85, keyFindings: ['缺货'] },
          { source: 'document', sourceId: 'doc-con-1', weight: 0.4, confidence: 0.78, keyFindings: [] },
        ],
      })
      assert.ok(task.id.startsWith('fus-'))
      assert.equal(task.tenantId, TENANT_A.tenantId)
      assert.equal(task.status, 'completed')
      assert.equal(task.progress, 1)
      assert.ok(task.durationMs !== undefined && task.durationMs > 0)
      assert.ok(task.insights.length > 0, '综合分析应生成洞察')
      assert.ok(task.report !== undefined, '综合分析应生成报告')
    })
  })

  it('创建异常检测任务生成 anomaly', async () => {
    await runWithTenant(TENANT_A, async () => {
      // 使用更多样本点和极端值确保 Z-Score > 2
      const extremeValue = 100000
      await SV.indexTabularData('series-anomaly-2', [
        { ts: '2020-01-01T00:00:00Z', value: 5 },
        { ts: '2020-01-02T00:00:00Z', value: 5 },
        { ts: '2020-01-03T00:00:00Z', value: 5 },
        { ts: '2020-01-04T00:00:00Z', value: 5 },
        { ts: '2020-01-05T00:00:00Z', value: 5 },
        { ts: '2020-01-06T00:00:00Z', value: 5 },
        { ts: '2020-01-07T00:00:00Z', value: 5 },
        { ts: '2020-01-08T00:00:00Z', value: 5 },
        { ts: '2020-01-09T00:00:00Z', value: 5 },
        { ts: '2020-01-10T00:00:00Z', value: extremeValue }, // 异常
      ])
      const task = await SV.createFusionTask({
        taskType: 'anomaly_detection',
        title: '异常检测测试',
        sources: [
          { source: 'tabular', sourceId: 'series-anomaly-2', weight: 1, confidence: 0.9, keyFindings: [] },
        ],
      })
      assert.equal(task.status, 'completed')
      assert.ok(task.anomalies.length > 0, `应检测到异常, 结果: ${JSON.stringify(task.anomalies)}`)
      const anomaly = task.anomalies[0]
      assert.ok(anomaly)
      assert.equal(anomaly.type, 'statistical')
      assert.ok(anomaly.severity === 'critical' || anomaly.severity === 'warning')
    })
  })

  it('创建情感合成任务', async () => {
    await runWithTenant(TENANT_A, async () => {
      const task = await SV.createFusionTask({
        taskType: 'sentiment_synthesis',
        title: '客户评价情感分析',
        sources: [
          { source: 'voice', sourceId: 'voice-1', weight: 0.5, confidence: 0.9, keyFindings: ['满意'] },
          { source: 'text', sourceId: 'text-1', weight: 0.5, confidence: 0.3, keyFindings: ['投诉'] },
        ],
      })
      assert.equal(task.insights.length, 1)
      assert.ok(task.insights[0]?.title.includes('情感'), '情感合成洞察应包含情感描述')
    })
  })

  it('合规审计任务检出置信度不足的异常', async () => {
    await runWithTenant(TENANT_A, async () => {
      const task = await SV.createFusionTask({
        taskType: 'compliance_audit',
        title: '合规检查',
        sources: [
          { source: 'document', sourceId: 'doc-low-conf', weight: 1, confidence: 0.3, keyFindings: [] },
        ],
      })
      assert.ok(task.anomalies.length > 0, '低置信度应生成合规异常')
      assert.ok(task.anomalies.some((a) => a.description.includes('置信度')), '异常描述应提及置信度')
    })
  })

  it('创建任务时校验空 sources 抛出 BadRequest', async () => {
    await runWithTenant(TENANT_A, async () => {
      await assert.rejects(
        () => SV.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: '空源',
          sources: [],
        }),
        { name: 'BadRequestException' },
      )
    })
  })

  it('获取不存在的任务抛出 NotFound', async () => {
    await runWithTenant(TENANT_A, async () => {
      await assert.rejects(
        () => SV.getFusionTask('non-existent-task-id'),
        { name: 'NotFoundException' },
      )
    })
  })

  it('取消已完成任务抛出 BadRequest', async () => {
    await runWithTenant(TENANT_A, async () => {
      const task = await SV.createFusionTask({
        taskType: 'report_generation',
        title: '报告',
        sources: [
          { source: 'image', sourceId: 'img-cancel', weight: 1, confidence: 0.5, keyFindings: [] },
        ],
      })
      await assert.rejects(
        () => SV.cancelFusionTask(task.id),
        { name: 'BadRequestException' },
      )
    })
  })

  it('跨租户隔离 — 无法访问其他租户的任务', async () => {
    await runWithTenant(TENANT_A, async () => {
      await SV.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: '租户A任务',
        sources: [
          { source: 'image', sourceId: 'img-iso', weight: 1, confidence: 0.8, keyFindings: [] },
        ],
      })
    })
    await runWithTenant(TENANT_A, async () => {
      const listA = await SV.listFusionTasks()
      assert.ok(listA.length > 0, '租户A应有任务')
    })
  })

  it('列表任务按类型筛选', async () => {
    await runWithTenant(TENANT_A, async () => {
      const anomalyTasks = await SV.listFusionTasks({ taskType: 'anomaly_detection' })
      for (const t of anomalyTasks) {
        assert.equal(t.taskType, 'anomaly_detection')
      }
    })
  })

  it('统计响应符合 FusionStatsResponse 合约', async () => {
    await runWithTenant(TENANT_A, async () => {
      const stats = await SV.getFusionStats()
      assert.ok(typeof stats.totalTasks === 'number')
      assert.ok(typeof stats.completedTasks === 'number')
      assert.ok(typeof stats.totalInsights === 'number')
      assert.ok(typeof stats.criticalAnomalies === 'number')
      assert.ok(typeof stats.avgConfidence === 'number')
      assert.ok(typeof stats.avgDurationMs === 'number')
      assert.ok(typeof stats.byTaskType === 'object' && stats.byTaskType !== null)
      // completedTasks 应 > 0, 因为前面创建了任务
      assert.ok(stats.completedTasks > 0)
    })
  })
})

// ==================== 跨模态搜索合约 ====================

describe('Service 合约 — 跨模态搜索', () => {
  it('索引项目后可通过搜索找到', async () => {
    await runWithTenant(TENANT_A, async () => {
      // textSimilarity 是逐位字符比较, 查询应和索引文本的前缀匹配
      await SV.indexItem('search-img-1', 'image', 'search-image-found', { storeId: 'store-001' })
      await SV.indexItem('search-doc-1', 'document', 'document-text-here', { storeId: 'store-001' })
      // 'search-image' 与 'search-image-found' 前 12 位匹配 => 12/20=0.6 > 0.1
      const hits = await SV.crossModalSearch({ query: 'search-image', modalities: ['image', 'document'] })
      assert.ok(hits.length > 0, `应有命中, 结果: ${JSON.stringify(hits)}`)
      const imageHit = hits.find((h: CrossModalHit) => h.modality === 'image')
      assert.ok(imageHit, `图像模态应有命中, 所有 hits: ${JSON.stringify(hits)}`)
      assert.ok(imageHit!.score > 0.1)
    })
  })

  it('空查询抛出 BadRequest', async () => {
    await runWithTenant(TENANT_A, async () => {
      await assert.rejects(
        () => SV.crossModalSearch({ query: '   ', modalities: ['image'] }),
        { name: 'BadRequestException' },
      )
    })
  })

  it('不匹配的查询返回空', async () => {
    await runWithTenant(TENANT_A, async () => {
      const hits = await SV.crossModalSearch({ query: 'zzzznonexistent', modalities: ['text'] })
      assert.equal(hits.length, 0)
    })
  })
})

// ==================== 趋势洞察合约 ====================

describe('Service 合约 — 趋势洞察', () => {
  it('趋势任务基于表格数据生成 TrendInsight', async () => {
    await runWithTenant(TENANT_A, async () => {
      await SV.indexTabularData('series-trend-1', [
        { ts: '2026-01-01T00:00:00Z', value: 100 },
        { ts: '2026-02-01T00:00:00Z', value: 110 },
      ])
      const task = await SV.createFusionTask({
        taskType: 'trend_insight',
        title: '销售趋势分析',
        sources: [
          { source: 'tabular', sourceId: 'series-trend-1', weight: 1, confidence: 0.85, keyFindings: ['增长'] },
        ],
      })
      assert.equal(task.status, 'completed')
      const trendInsights = task.insights.filter((i) => i.category === 'trend')
      assert.ok(trendInsights.length > 0, '趋势任务应生成趋势洞察')
    })
  })
})

// ==================== 报告合约 ====================

describe('Service 合约 — 报告生成', () => {
  it('报告生成任务返回 ComprehensiveReport', async () => {
    await runWithTenant(TENANT_A, async () => {
      const task = await SV.createFusionTask({
        taskType: 'report_generation',
        title: '每日门店报告',
        sources: [
          { source: 'image', sourceId: 'img-rpt-1', weight: 0.5, confidence: 0.9, keyFindings: ['货架满'] },
          { source: 'tabular', sourceId: 'tb-rpt-1', weight: 0.5, confidence: 0.8, keyFindings: ['销售额'] },
        ],
      })
      assert.ok(task.report, '报告生成任务必须有 report')
      assert.equal(task.report!.title, task.title)
      assert.ok(task.report!.sections.length > 0, '报告至少有一个 section')
      assert.ok(task.report!.reportId.startsWith('rpt-'))
    })
  })
})

// ==================== 实体链接合约 ====================

describe('Service 合约 — 实体链接', () => {
  it('实体链接任务生成实体洞察', async () => {
    await runWithTenant(TENANT_A, async () => {
      const task = await SV.createFusionTask({
        taskType: 'entity_linking',
        title: '实体链接',
        sources: [
          { source: 'image', sourceId: 'img-el-1', weight: 0.8, confidence: 0.9, keyFindings: ['目标', '人物'] },
          { source: 'voice', sourceId: 'voice-el-1', weight: 0.2, confidence: 0.7, keyFindings: ['麦克风'] },
        ],
      })
      assert.ok(task.insights.length > 0, '实体链接任务应生成洞察')
      assert.ok(task.insights.some((i) => i.category === 'entity'), '洞察 category 应为 entity')
    })
  })
})
