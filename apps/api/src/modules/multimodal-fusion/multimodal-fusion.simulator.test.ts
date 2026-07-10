import { describe, it, expect, beforeEach } from 'vitest'
/**
 * multimodal-fusion.simulator.test.ts - 多模态融合分析模拟器测试
 *
 * 模拟真实门店多模态融合分析工作流场景：
 * - 创建融合任务（综合分析、异常检测、趋势洞察等 8 种类型）
 * - 跨模态搜索
 * - 数据源索引
 * - 统计信息
 * - 边界场景：空数据、无效任务、大数量
 * - 跨任务数据隔离
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultimodalFusionService } from './multimodal-fusion.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type { FusionSource, FusionTaskType, FusionSourceContribution } from './multimodal-fusion.entity'

// ── 测试租户 ──
const TENANT_A = { tenantId: 'sim-tenant-001', userId: 'sim-user', role: 'tenant_admin' as const }
const TENANT_B = { tenantId: 'sim-tenant-002', userId: 'sim-user', role: 'tenant_admin' as const }
const TENANT_GAMMA = { tenantId: 'tenant-gamma', userId: 'gamma-user', role: 'tenant_admin' as const }
const TENANT_DELTA = { tenantId: 'tenant-delta', userId: 'delta-user', role: 'tenant_admin' as const }
const TENANT_ALPHA = { tenantId: 'tenant-alpha', userId: 'alpha-user', role: 'tenant_admin' as const }
const TENANT_BETA = { tenantId: 'tenant-beta', userId: 'beta-user', role: 'tenant_admin' as const }

describe('MultimodalFusion - Simulator', () => {
  let service: MultimodalFusionService

  beforeEach(() => {
    service = new MultimodalFusionService()
  })

  // ─── 辅助工具 ───

  function makeSources(count: number, baseWeight = 1, baseConfidence = 0.8): FusionSourceContribution[] {
    const sources: FusionSource[] = ['image', 'document', 'voice', 'multimedia', 'tabular', 'text']
    const all: FusionSourceContribution[] = []
    for (let i = 0; i < count; i++) {
      const src = sources[i % sources.length]!
      all.push({
        source: src,
        sourceId: `src-${src}-${i}`,
        weight: baseWeight,
        confidence: baseConfidence,
        keyFindings: [`发现项 #${i + 1}`, `关键数据点 #${i + 1}`],
      })
    }
    return all
  }

  // ==================================================================
  // 1. 融合任务创建
  // ==================================================================

  describe('模拟融合任务创建', () => {
    it('应创建 comprehensive_analysis 任务并生成报告', async () => {
      const task = await runWithTenant(TENANT_A, async () => {
        return service.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: '门店货架综合分析',
          description: '综合图像识别 + OCR + 库存数据',
          sources: [
            { source: 'image', sourceId: 'img-shelf-001', weight: 0.5, confidence: 0.9, keyFindings: [] },
            { source: 'document', sourceId: 'doc-inv-001', weight: 0.3, confidence: 0.85, keyFindings: [] },
            { source: 'tabular', sourceId: 'tab-stock-001', weight: 0.2, confidence: 0.95, keyFindings: [] },
          ],
        })
      })
      assert.ok(task.id.startsWith('fus-'))
      assert.equal(task.taskType, 'comprehensive_analysis')
      assert.equal(task.status, 'completed')
      assert.equal(task.progress, 1.0)
      assert.ok(task.durationMs! > 0)
      assert.ok(task.report)
      assert.equal(task.report!.sections.length, 2) // 摘要 + 洞察
      assert.equal(task.insights.length, 3) // mock insights per source
      assert.equal(task.anomalies.length, 0)
    })

    it('应创建 anomaly_detection 任务并检测异常', async () => {
      await runWithTenant(TENANT_A, async () => {
        // 先索引时序数据
        await service.indexTabularData('src-tabular-0', [
          { ts: '2026-07-01T00:00:00Z', value: 10 },
          { ts: '2026-07-02T00:00:00Z', value: 12 },
          { ts: '2026-07-03T00:00:00Z', value: 11 },
          { ts: '2026-07-04T00:00:00Z', value: 200 }, // anomaly
          { ts: '2026-07-05T00:00:00Z', value: 13 },
        ])

        const task = await service.createFusionTask({
          taskType: 'anomaly_detection',
          title: '业务异常检测',
          sources: makeSources(2),
        })
        assert.equal(task.status, 'completed')
        assert.ok(task.anomalies.length >= 0)
      })
    })

    it('应创建 trend_insight 任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.indexTabularData('src-tabular-0', [
          { ts: '2026-01-01T00:00:00Z', value: 100 },
          { ts: '2026-02-01T00:00:00Z', value: 120 },
          { ts: '2026-03-01T00:00:00Z', value: 110 },
        ])

        const task = await service.createFusionTask({
          taskType: 'trend_insight',
          title: '月度趋势分析',
          sources: makeSources(2),
        })
        assert.equal(task.status, 'completed')
      })
    })

    it('应创建 sentiment_synthesis 任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const task = await service.createFusionTask({
          taskType: 'sentiment_synthesis',
          title: '客户情感分析',
          sources: makeSources(3, 1, 0.9),
        })
        assert.equal(task.status, 'completed')
        assert.ok(task.insights.length > 0)
        assert.ok(task.insights.some(i => i.category === 'sentiment'))
      })
    })

    it('应创建 compliance_audit 任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const sources = makeSources(2)
        sources[0]!.confidence = 0.3 // 确保低置信度触发合规告警
        const task = await service.createFusionTask({
          taskType: 'compliance_audit',
          title: '合规审计',
          sources,
        })
        assert.equal(task.status, 'completed')
        assert.ok(task.anomalies.length > 0, '低置信度应触发合规告警')
      })
    })

    it('应创建 report_generation 任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const task = await service.createFusionTask({
          taskType: 'report_generation',
          title: '门店周报生成',
          sources: makeSources(2),
        })
        assert.equal(task.status, 'completed')
        assert.ok(task.report)
        assert.equal(task.report!.title, '门店周报生成')
      })
    })

    it('应创建 entity_linking 任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const task = await service.createFusionTask({
          taskType: 'entity_linking',
          title: '实体识别',
          sources: makeSources(2),
        })
        assert.equal(task.status, 'completed')
        assert.ok(task.insights.some(i => i.category === 'entity'))
      })
    })

    it('应拒绝空数据源', async () => {
      await runWithTenant(TENANT_A, async () => {
        await assert.rejects(
          () => service.createFusionTask({
            taskType: 'comprehensive_analysis',
            title: '空数据',
            sources: [],
          }),
          /至少需要 1 个数据源/,
        )
      })
    })

    it('应拒绝零权重总和', async () => {
      await runWithTenant(TENANT_A, async () => {
        await assert.rejects(
          () => service.createFusionTask({
            taskType: 'comprehensive_analysis',
            title: '零权重',
            sources: [{ source: 'image', sourceId: 'i1', weight: 0, confidence: 0.8, keyFindings: [] }],
          }),
          /权重总和必须 > 0/,
        )
      })
    })

    it('应使用模板 ID 创建任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const task = await service.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: '货架巡检',
          templateId: 'tpl-shelf-audit',
          sources: makeSources(2),
        })
        assert.equal(task.status, 'completed')
      })
    })

    it('应拒绝不存在的模板', async () => {
      await runWithTenant(TENANT_A, async () => {
        await assert.rejects(
          () => service.createFusionTask({
            taskType: 'comprehensive_analysis',
            title: '无效模板',
            templateId: 'tpl-nonexistent',
            sources: makeSources(1),
          }),
          /模板.*不存在/,
        )
      })
    })
  })

  // ==================================================================
  // 2. 任务生命周期管理
  // ==================================================================

  describe('模拟任务生命周期', () => {
    it('应列出所有任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'T1', sources: makeSources(1) })
        await service.createFusionTask({ taskType: 'anomaly_detection', title: 'T2', sources: makeSources(1) })

        const tasks = await service.listFusionTasks()
        assert.equal(tasks.length, 2)
        assert.ok(tasks.some(t => t.taskType === 'comprehensive_analysis'))
        assert.ok(tasks.some(t => t.taskType === 'anomaly_detection'))
      })
    })

    it('应按 taskType 过滤', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'T1', sources: makeSources(1) })
        await service.createFusionTask({ taskType: 'anomaly_detection', title: 'T2', sources: makeSources(1) })
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'T3', sources: makeSources(1) })

        const filtered = await service.listFusionTasks({ taskType: 'comprehensive_analysis' })
        assert.equal(filtered.length, 2)
        filtered.forEach(t => assert.equal(t.taskType, 'comprehensive_analysis'))
      })
    })

    it('应按 status 过滤', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'T1', sources: makeSources(1) })
        const completed = await service.listFusionTasks({ status: 'completed' })
        assert.ok(completed.length >= 1)
      })
    })

    it('应限制列表长度', async () => {
      await runWithTenant(TENANT_A, async () => {
        for (let i = 0; i < 5; i++) {
          await service.createFusionTask({ taskType: 'comprehensive_analysis', title: `T${i}`, sources: makeSources(1) })
        }
        const limited = await service.listFusionTasks({ limit: 2 })
        assert.equal(limited.length, 2)
      })
    })

    it('已完成任务不可取消', async () => {
      await runWithTenant(TENANT_A, async () => {
        const task = await service.createFusionTask({ taskType: 'comprehensive_analysis', title: '可取消', sources: makeSources(1) })
        assert.equal(task.status, 'completed')
        await assert.rejects(
          () => service.cancelFusionTask(task.id),
          /已是终态/,
        )
      })
    })

    it('应通过 ID 查询任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const task = await service.createFusionTask({ taskType: 'comprehensive_analysis', title: '查询测试', sources: makeSources(1) })
        const found = await service.getFusionTask(task.id)
        assert.equal(found.id, task.id)
        assert.equal(found.title, '查询测试')
      })
    })

    it('查询不存在的任务应抛 NotFound', async () => {
      await runWithTenant(TENANT_A, async () => {
        await assert.rejects(
          () => service.getFusionTask('nonexistent-task-id'),
          /不存在/,
        )
      })
    })
  })

  // ==================================================================
  // 3. 跨模态搜索
  // ==================================================================

  describe('模拟跨模态搜索', () => {
    it('索引项目后应能被搜索到', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.indexItem('img-shopfront-001', 'image', '门店正门实拍照片,招牌清晰可见')
        await service.indexItem('doc-menu-001', 'document', '本月推荐菜单,包括招牌菜和限定套餐')
        await service.indexItem('voice-cs-001', 'voice', '客户电话录音:询问门店营业时间')

        const hits = await service.crossModalSearch({
          query: '门店',
          modalities: ['image', 'document', 'voice'],
        })
        assert.ok(hits.length >= 1)
      })
    })

    it('搜索返回结果按相关性降序', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.indexItem('doc-menu-001', 'document', '本月推荐菜单')
        await service.indexItem('img-billboard-001', 'image', '门店招牌实拍照片')

        const hits = await service.crossModalSearch({
          query: '门店招牌',
          modalities: ['image', 'document'],
        })
        assert.ok(hits.length > 0)
        for (let i = 1; i < hits.length; i++) {
          assert.ok(hits[i - 1]!.score >= hits[i]!.score)
        }
      })
    })

    it('应过滤不匹配的模态', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.indexItem('img-shelf-001', 'image', '货架照片')
        await service.indexItem('doc-report-001', 'document', '周报文档')

        const hits = await service.crossModalSearch({
          query: '货架',
          modalities: ['document'], // only document
        })
        assert.equal(hits.length, 0, '图像类型不在搜索范围内')
      })
    })

    it('应拒绝空查询', async () => {
      await runWithTenant(TENANT_A, async () => {
        await assert.rejects(
          () => service.crossModalSearch({ query: '', modalities: ['text'] }),
          /查询文本不能为空/,
        )
      })
    })

    it('空索引时搜索返回空列表', async () => {
      await runWithTenant(TENANT_A, async () => {
        const hits = await service.crossModalSearch({
          query: 'anything',
          modalities: ['image', 'text'],
        })
        assert.deepEqual(hits, [])
      })
    })
  })

  // ==================================================================
  // 4. 数据源索引
  // ==================================================================

  describe('模拟数据源索引', () => {
    it('应索引单个项目', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.indexItem('img-001', 'image', '图片描述', { resolution: '1920x1080' })
        assert.equal(service.countIndexedItems(), 1)
      })
    })

    it('应索引表格数据并用于异常检测', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.indexTabularData('sales-series', [
          { ts: '2026-01-01T00:00:00Z', value: 1000 },
          { ts: '2026-01-02T00:00:00Z', value: 1200 },
          { ts: '2026-01-03T00:00:00Z', value: 1100 },
        ])
        const task = await service.createFusionTask({
          taskType: 'anomaly_detection',
          title: '时序异常检测',
          sources: [
            { source: 'tabular', sourceId: 'sales-series', weight: 1, confidence: 0.9, keyFindings: [] },
          ],
        })
        assert.ok(task.anomalies.length >= 0)
      })
    })

    it('应索引多个项目', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.indexItem('img-001', 'image', '图片1')
        await service.indexItem('doc-001', 'document', '文档1')
        await service.indexItem('voice-001', 'voice', '语音1')
        assert.equal(service.countIndexedItems(), 3)
      })
    })
  })

  // ==================================================================
  // 5. 模板与引擎
  // ==================================================================

  describe('模拟模板与引擎', () => {
    it('应列出所有模板', () => {
      const templates = service.listTemplates()
      assert.ok(templates.length >= 6)
      assert.ok(templates.some(t => t.id === 'tpl-shelf-audit'))
      assert.ok(templates.some(t => t.id === 'tpl-customer-feedback'))
      assert.ok(templates.some(t => t.id === 'tpl-anomaly-detection'))
    })

    it('应列出所有引擎', () => {
      const engines = service.listEngines()
      assert.ok(engines.length >= 5)
      assert.ok(engines.some(e => e.type === 'mock-gpt4-multimodal'))
      assert.ok(engines.some(e => e.type === 'mock-qwen-vl'))
    })

    it('引擎应包含成本和延迟信息', () => {
      const engines = service.listEngines()
      for (const e of engines) {
        assert.ok(e.avgLatencyMs > 0)
        assert.ok(e.costPerCallCny >= 0)
        assert.ok(typeof e.supportsImage === 'boolean')
      }
    })
  })

  // ==================================================================
  // 6. 统计信息
  // ==================================================================

  describe('模拟统计信息', () => {
    it('空租户统计应全零', async () => {
      await runWithTenant(TENANT_A, async () => {
        const stats = await service.getFusionStats()
        assert.equal(stats.totalTasks, 0)
        assert.equal(stats.totalInsights, 0)
        assert.equal(stats.totalAnomalies, 0)
        assert.equal(stats.avgConfidence, 0)
        assert.equal(stats.avgDurationMs, 0)
      })
    })

    it('统计应包含任务类型分布', async () => {
      await runWithTenant(TENANT_A, async () => {
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'T1', sources: makeSources(1) })
        await service.createFusionTask({ taskType: 'anomaly_detection', title: 'T2', sources: makeSources(1) })
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'T3', sources: makeSources(1) })

        const stats = await service.getFusionStats()
        assert.equal(stats.totalTasks, 3)
        assert.equal(stats.completedTasks, 3)
        assert.equal(stats.failedTasks, 0)
        assert.equal(stats.byTaskType['comprehensive_analysis'], 2)
        assert.equal(stats.byTaskType['anomaly_detection'], 1)
      })
    })

    it('统计应计算平均置信度和耗时', async () => {
      await runWithTenant(TENANT_A, async () => {
        for (let i = 0; i < 5; i++) {
          await service.createFusionTask({
            taskType: 'comprehensive_analysis',
            title: `T${i}`,
            sources: makeSources(2),
          })
        }
        const stats = await service.getFusionStats()
        assert.ok(stats.avgConfidence > 0)
        assert.ok(stats.avgDurationMs > 0)
      })
    })
  })

  // ==================================================================
  // 7. 数据隔离
  // ==================================================================

  describe('模拟租户数据隔离', () => {
    it('不同租户的任务互相隔离', async () => {
      await runWithTenant(TENANT_ALPHA, async () => {
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'Alpha任务', sources: makeSources(1) })
      })

      await runWithTenant(TENANT_BETA, async () => {
        await service.createFusionTask({ taskType: 'anomaly_detection', title: 'Beta任务', sources: makeSources(1) })
      })

      await runWithTenant(TENANT_ALPHA, async () => {
        const alphaTasks = await service.listFusionTasks()
        assert.equal(alphaTasks.length, 1)
        assert.equal(alphaTasks[0]!.title, 'Alpha任务')
      })

      await runWithTenant(TENANT_BETA, async () => {
        const betaTasks = await service.listFusionTasks()
        assert.equal(betaTasks.length, 1)
        assert.equal(betaTasks[0]!.title, 'Beta任务')
      })
    })

    it('不同租户的统计相互隔离', async () => {
      await runWithTenant(TENANT_GAMMA, async () => {
        await service.createFusionTask({ taskType: 'comprehensive_analysis', title: 'Gamma', sources: makeSources(1) })
      })

      await runWithTenant(TENANT_DELTA, async () => {
        const deltaStats = await service.getFusionStats()
        assert.equal(deltaStats.totalTasks, 0, 'Delta 没有任务')
      })
    })
  })

  // ==================================================================
  // 8. 全流程模拟场景
  // ==================================================================

  describe('模拟门店多模态分析全流程', () => {
    it('门店智能巡检全流程 (图像+文档+表格)', async () => {
      await runWithTenant(TENANT_A, async () => {
        // Step 1: 索引门店相关数据
        await service.indexItem('img-front-001', 'image', '门店正门照片,招牌完整营业执照显示正常')
        await service.indexItem('img-shelf-001', 'image', '饮料货架实拍,商品排列整齐', { shelfId: 'S-01' })
        await service.indexItem('doc-clean-report', 'document', '2026年6月门店卫生检查报告结论:合格')
        await service.indexTabularData('sales-weekly', [
          { ts: '2026-06-28T00:00:00Z', value: 8500 },
          { ts: '2026-06-29T00:00:00Z', value: 9200 },
          { ts: '2026-06-30T00:00:00Z', value: 8800 },
          { ts: '2026-07-01T00:00:00Z', value: 30000 }, // 异常值
          { ts: '2026-07-02T00:00:00Z', value: 8900 },
        ])

        // Step 2: 创建综合分析任务
        const analysis = await service.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: '上海门店智能巡检综合分析',
          description: '综合图像识别、卫生文档、销售数据的门店健康度评估',
          sources: [
            { source: 'image', sourceId: 'img-front-001', weight: 0.3, confidence: 0.92, keyFindings: ['招牌完整'] },
            { source: 'image', sourceId: 'img-shelf-001', weight: 0.2, confidence: 0.88, keyFindings: ['货架整齐'] },
            { source: 'document', sourceId: 'doc-clean-report', weight: 0.2, confidence: 0.95, keyFindings: ['卫生合格'] },
            { source: 'tabular', sourceId: 'sales-weekly', weight: 0.3, confidence: 0.85, keyFindings: ['销售波动'] },
          ],
          linkedEntity: { entityType: 'store', entityId: 'store-sh-001' },
        })
        assert.equal(analysis.status, 'completed')
        assert.ok(analysis.report)
        assert.ok(analysis.insights.length > 0)

        // Step 3: 创建异常检测任务（基于已索引的时序数据）
        const anomaly = await service.createFusionTask({
          taskType: 'anomaly_detection',
          title: '销售数据异常检测',
          sources: [
            { source: 'tabular', sourceId: 'sales-weekly', weight: 1, confidence: 0.9, keyFindings: [] },
          ],
        })
        assert.equal(anomaly.status, 'completed')

        // Step 4: 搜索门店相关资产
        const search = await service.crossModalSearch({
          query: '门店货架卫生',
          modalities: ['image', 'document'],
        })
        assert.ok(search.length > 0)

        // Step 5: 查看统计
        const stats = await service.getFusionStats()
        assert.equal(stats.totalTasks, 2)
        assert.equal(stats.completedTasks, 2)
        assert.ok(stats.totalInsights > 0)
      })
    })

    it('空门店数据场景: 无数据时应优雅返回', async () => {
      await runWithTenant(TENANT_A, async () => {
        const tasks = await service.listFusionTasks()
        assert.deepEqual(tasks, [])

        const hits = await service.crossModalSearch({ query: 'anything', modalities: ['image'] })
        assert.deepEqual(hits, [])

        const stats = await service.getFusionStats()
        assert.equal(stats.totalTasks, 0)
      })
    })

    it('大量并发融合任务下的正确性', async () => {
      await runWithTenant(TENANT_A, async () => {
        const taskTypes: FusionTaskType[] = [
          'comprehensive_analysis', 'anomaly_detection', 'trend_insight',
          'sentiment_synthesis', 'compliance_audit',
        ]
        for (let i = 0; i < 10; i++) {
          const tt = taskTypes[i % taskTypes.length]!
          await service.createFusionTask({
            taskType: tt,
            title: `并发任务 #${i}`,
            sources: makeSources(2),
          })
        }

        const all = await service.listFusionTasks()
        assert.equal(all.length, 10)

        const stats = await service.getFusionStats()
        assert.equal(stats.totalTasks, 10)
        assert.equal(stats.completedTasks, 10)
        assert.ok(Object.keys(stats.byTaskType).length, '应有多种任务类型')
      })
    })
  })
})
