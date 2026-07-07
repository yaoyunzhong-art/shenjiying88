import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 103 多模态融合分析 Service Tests (V11 Sprint 3 Day 40)
 *
 * 22 tests 覆盖:
 * - 工具函数 (5) - weightedConfidence / calcChangePercent / detectStatisticalAnomalies
 *   / aggregateSentiment / textSimilarity
 * - 模板 + 引擎 (2)
 * - 综合分析任务 (2)
 * - 异常检测 + 表格索引 (2)
 * - 趋势洞察 (1)
 * - 情感合成 (1)
 * - 合规审计 (1)
 * - 报告生成 (1)
 * - 跨模态搜索 (2)
 * - 任务校验 (2)
 * - 取消 + 列表 (1)
 * - 跨租户隔离 (1)
 * - 统计 (1)
 */

import assert from 'node:assert/strict'
import { MultimodalFusionService } from './multimodal-fusion.service'
import {
  weightedConfidence, calcChangePercent, detectStatisticalAnomalies,
  aggregateSentiment, textSimilarity,
  FUSION_TEMPLATES, FUSION_ENGINES,
  generateFusionTaskId, generateInsightId, generateAnomalyId, generateReportId,
} from './multimodal-fusion.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B', storeId: 'store-002', userId: 'admin-B',
  role: 'tenant_admin' as const,
}

const SHARED_SERVICE = new MultimodalFusionService()

describe('Phase 103 多模态融合分析 (V11 Sprint 3 Day 40)', () => {
  // ============ 1. 工具函数 (5) ============
  describe('1. 工具函数', () => {
    it('weightedConfidence 加权平均', () => {
      const w = weightedConfidence([
        { source: 'image', sourceId: '1', weight: 0.5, confidence: 0.8, keyFindings: [] },
        { source: 'document', sourceId: '2', weight: 0.5, confidence: 0.6, keyFindings: [] },
      ])
      assert.equal(w, 0.7)
      assert.equal(weightedConfidence([]), 0)
    })

    it('calcChangePercent 变化百分比', () => {
      assert.equal(calcChangePercent(110, 100), 10)
      assert.equal(calcChangePercent(90, 100), -10)
      assert.equal(calcChangePercent(100, 0), 100)
      assert.equal(calcChangePercent(0, 0), 0)
    })

    it('detectStatisticalAnomalies Z-Score > 2', () => {
      // 正常值 + 1 个离群值
      const values = [10, 11, 9, 10, 12, 50, 11, 10]
      const indices = detectStatisticalAnomalies(values, 2)
      assert.ok(indices.includes(5)) // 50 是离群值
    })

    it('aggregateSentiment positive/neutral/negative', () => {
      assert.equal(aggregateSentiment([0.5, 0.6, 0.7]), 'positive')
      assert.equal(aggregateSentiment([0, 0, 0]), 'neutral')
      assert.equal(aggregateSentiment([-0.5, -0.6, -0.7]), 'negative')
      assert.equal(aggregateSentiment([]), 'neutral')
    })

    it('textSimilarity 字符串相似度', () => {
      assert.equal(textSimilarity('hello', 'hello'), 1)
      assert.equal(textSimilarity('hello', 'world'), 0.2) // 1/5
      assert.equal(textSimilarity('', 'x'), 0)
      assert.equal(textSimilarity('abc', 'abcdef'), 0.5)
    })

    it('ID 生成器', () => {
      assert.ok(generateFusionTaskId().startsWith('fus-'))
      assert.ok(generateInsightId().startsWith('ins-'))
      assert.ok(generateAnomalyId().startsWith('anm-'))
      assert.ok(generateReportId().startsWith('rpt-'))
    })
  })

  // ============ 2. 模板 + 引擎 (2) ============
  describe('2. 模板 + 引擎', () => {
    it('FUSION_TEMPLATES 6 个模板', () => {
      assert.equal(FUSION_TEMPLATES.length, 6)
      assert.ok(FUSION_TEMPLATES.some((t) => t.id === 'tpl-shelf-audit'))
      assert.ok(FUSION_TEMPLATES.some((t) => t.id === 'tpl-customer-feedback'))
    })

    it('FUSION_ENGINES 5 个融合引擎', () => {
      assert.equal(FUSION_ENGINES.length, 5)
      assert.ok(FUSION_ENGINES.some((e) => e.type === 'mock-gpt4-multimodal'))
      assert.ok(FUSION_ENGINES.some((e) => e.type === 'mock-qwen-vl'))
    })

    it('listTemplates + listEngines', () => {
      assert.equal(SHARED_SERVICE.listTemplates().length, 6)
      assert.equal(SHARED_SERVICE.listEngines().length, 5)
    })
  })

  // ============ 3. 综合分析任务 (2) ============
  describe('3. 综合分析任务', () => {
    it('comprehensive_analysis → 多 insight + report', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: '门店综合分析',
          sources: [
            { source: 'image', sourceId: 'rec-001', weight: 0.4, confidence: 0.9, keyFindings: ['3 类商品'] },
            { source: 'document', sourceId: 'doc-001', weight: 0.3, confidence: 0.85, keyFindings: ['财务数据'] },
            { source: 'tabular', sourceId: 'ts-001', weight: 0.3, confidence: 0.8, keyFindings: ['销售数据'] },
          ],
        }),
      )
      assert.equal(task.status, 'completed')
      assert.ok(task.insights.length >= 1)
      assert.ok(task.report)
      assert.ok(task.report!.sections.length >= 1)
      assert.ok(task.report!.confidence > 0)
    })

    it('report_generation → 只有 report', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'report_generation',
          title: '生成报表',
          sources: [
            { source: 'tabular', sourceId: 'ts-rpt', weight: 1.0, confidence: 0.9, keyFindings: [] },
          ],
        }),
      )
      assert.ok(task.report)
      assert.ok(task.report!.sections.length >= 1)
    })
  })

  // ============ 4. 异常检测 + 表格索引 (2) ============
  describe('4. 异常检测', () => {
    it('indexTabularData + detectAnomaliesFromSources', async () => {
      await runWithTenant(TENANT_A, async () => {
        await SHARED_SERVICE.indexTabularData('ts-anom', [
          { ts: '2026-06-01', value: 100 },
          { ts: '2026-06-02', value: 105 },
          { ts: '2026-06-03', value: 102 },
          { ts: '2026-06-04', value: 100 },
          { ts: '2026-06-05', value: 98 },
          { ts: '2026-06-06', value: 99 },
          { ts: '2026-06-07', value: 105 },
          { ts: '2026-06-08', value: 100 },
          { ts: '2026-06-09', value: 101 },
          { ts: '2026-06-10', value: 100 },
          { ts: '2026-06-11', value: 5000 }, // 离群
          { ts: '2026-06-12', value: 103 },
        ])
      })
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'anomaly_detection',
          title: '异常检测',
          sources: [
            { source: 'tabular', sourceId: 'ts-anom', weight: 1.0, confidence: 0.9, keyFindings: [] },
          ],
        }),
      )
      assert.equal(task.status, 'completed')
      assert.ok(task.anomalies.length >= 1)
      const insights = await runWithTenant(TENANT_A, async () => task.insights)
      assert.ok(insights.length >= 1)
    })

    it('没有 tabular 数据 → 0 异常', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'anomaly_detection',
          title: 'no data',
          sources: [
            { source: 'tabular', sourceId: 'ts-empty', weight: 1.0, confidence: 0.9, keyFindings: [] },
          ],
        }),
      )
      assert.equal(task.anomalies.length, 0)
    })
  })

  // ============ 5. 趋势洞察 (1) ============
  describe('5. 趋势洞察', () => {
    it('trend_insight → 变化百分比 + 预测', async () => {
      await runWithTenant(TENANT_A, async () => {
        await SHARED_SERVICE.indexTabularData('ts-trend', [
          { ts: '2026-05', value: 1000 },
          { ts: '2026-06', value: 1200 },
        ])
      })
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'trend_insight',
          title: '趋势',
          sources: [
            { source: 'tabular', sourceId: 'ts-trend', weight: 1.0, confidence: 0.9, keyFindings: [] },
          ],
        }),
      )
      assert.ok(task.report)
      assert.ok(task.report!.trends.length >= 1)
      const trend = task.report!.trends[0]
      assert.equal(trend.direction, 'up')
      assert.ok(Math.abs(trend.changePercent - 20) < 1e-6)
      assert.ok(trend.forecastNextPeriod! > 1200)
    })
  })

  // ============ 6. 情感合成 (1) ============
  describe('6. 情感合成', () => {
    it('positive 情感聚合', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'sentiment_synthesis',
          title: '客户情感',
          sources: [
            { source: 'voice', sourceId: 'voice-1', weight: 0.5, confidence: 0.9, keyFindings: [] },
            { source: 'text', sourceId: 'text-1', weight: 0.5, confidence: 0.8, keyFindings: [] },
          ],
        }),
      )
      const sentIns = task.insights.find((i) => i.category === 'sentiment')
      assert.ok(sentIns)
    })
  })

  // ============ 7. 合规审计 (1) ============
  describe('7. 合规审计', () => {
    it('低置信度 → 异常警告', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'compliance_audit',
          title: '合规审计',
          sources: [
            { source: 'document', sourceId: 'doc-low', weight: 1.0, confidence: 0.3, keyFindings: [] },
            { source: 'image', sourceId: 'img-ok', weight: 1.0, confidence: 0.9, keyFindings: [] },
          ],
        }),
      )
      assert.ok(task.anomalies.length >= 1)
      assert.equal(task.anomalies[0].severity, 'warning')
    })
  })

  // ============ 8. 报告生成 (1) ============
  describe('8. 报告生成', () => {
    it('report 含执行摘要 + 关键洞察 + 异常', async () => {
      await runWithTenant(TENANT_A, async () => {
        await SHARED_SERVICE.indexTabularData('ts-rpt-2', [
          { ts: '2026-06-01', value: 100 },
          { ts: '2026-06-02', value: 200 },
          { ts: '2026-06-03', value: 300 },
        ])
      })
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: '完整报告',
          sources: [
            { source: 'tabular', sourceId: 'ts-rpt-2', weight: 1.0, confidence: 0.9, keyFindings: [] },
          ],
        }),
      )
      assert.ok(task.report!.sections.some((s) => s.title === '执行摘要'))
      assert.ok(task.report!.sections.some((s) => s.title === '关键洞察'))
    })
  })

  // ============ 9. 跨模态搜索 (2) ============
  describe('9. 跨模态搜索', () => {
    it('crossModalSearch 索引 + 搜索', async () => {
      await runWithTenant(TENANT_A, async () => {
        await SHARED_SERVICE.indexItem('asset-1', 'image', '可口可乐330ml图片')
        await SHARED_SERVICE.indexItem('doc-1', 'document', '可口可乐销售报表')
      })
      const results = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.crossModalSearch({
          query: '可口可乐',
          modalities: ['image', 'document'],
          topK: 5,
        }),
      )
      assert.ok(results.length >= 2)
      assert.ok(results.some((h) => h.modality === 'image'))
      assert.ok(results.some((h) => h.modality === 'document'))
    })

    it('空查询被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.crossModalSearch({ query: '   ', modalities: ['image'] }),
        ),
        /不能为空/,
      )
    })
  })

  // ============ 10. 任务校验 (2) ============
  describe('10. 任务校验', () => {
    it('无数据源被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createFusionTask({
            taskType: 'comprehensive_analysis',
            title: 'empty',
            sources: [],
          }),
        ),
        /至少需要 1 个/,
      )
    })

    it('权重和 <= 0 被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_SERVICE.createFusionTask({
            taskType: 'comprehensive_analysis',
            title: 'zero weight',
            sources: [
              { source: 'image', sourceId: 'img', weight: 0, confidence: 0.9, keyFindings: [] },
            ],
          }),
        ),
        /权重总和/,
      )
    })
  })

  // ============ 11. 取消 + 列表 (1) ============
  describe('11. 取消 + 列表', () => {
    it('listFusionTasks + 取消终态被拒', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: 'list test',
          sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
        }),
      )
      const items = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listFusionTasks({ limit: 100 }),
      )
      assert.ok(items.length >= 1)
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.cancelFusionTask(task.id)),
        /终态/,
      )
    })
  })

  // ============ 12. 跨租户隔离 (1) ============
  describe('12. 跨租户隔离', () => {
    it('租户 B 不能访问租户 A 的任务', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createFusionTask({
          taskType: 'comprehensive_analysis',
          title: 'iso',
          sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_B, async () => SHARED_SERVICE.getFusionTask(task.id)),
        /不存在/,
      )
    })
  })

  // ============ 13. 统计 (1) ============
  describe('13. 统计', () => {
    it('getFusionStats 聚合 byTaskType + criticalAnomalies', async () => {
      const stats = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getFusionStats(),
      )
      assert.ok(stats.totalTasks > 0)
      assert.ok(typeof stats.byTaskType === 'object')
      assert.ok(stats.avgConfidence > 0)
      assert.ok(stats.criticalAnomalies >= 0)
    })
  })
})