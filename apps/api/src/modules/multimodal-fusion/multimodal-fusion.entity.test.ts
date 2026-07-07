import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 103 多模态融合分析 Entity Tests (V11 Sprint 3 Day 40)
 *
 * 覆盖:
 * - ID 生成器
 * - 工具函数: weightedConfidence / calcChangePercent / detectStatisticalAnomalies
 *              aggregateSentiment / textSimilarity
 * - FUSION_TEMPLATES 与 FUSION_ENGINES
 * - type 与 interface 类型定义 (编译检查)
 */

import assert from 'node:assert/strict'
import type {
  FusionSource, FusionTaskType, FusionStatus, InsightSeverity,
  FusionSourceContribution, Insight, Anomaly, CrossModalHit, TrendInsight,
  ComprehensiveReport, FusionTask, FusionTemplate, FusionEngine,
} from './multimodal-fusion.entity'
import {
  weightedConfidence, calcChangePercent, detectStatisticalAnomalies,
  aggregateSentiment, textSimilarity,
  generateFusionTaskId, generateInsightId, generateAnomalyId, generateReportId,
  FUSION_TEMPLATES, FUSION_ENGINES,
} from './multimodal-fusion.entity'

// ── 编译期检查: type 引用正确 ──
const _validateTypes: {
  _src: FusionSource
  _ttype: FusionTaskType
  _stat: FusionStatus
  _sev: InsightSeverity
  _contrib: FusionSourceContribution
  _ins: Insight
  _anm: Anomaly
  _hit: CrossModalHit
  _trend: TrendInsight
  _rpt: ComprehensiveReport
  _task: FusionTask
  _tpl: FusionTemplate
  _eng: FusionEngine
} = null!
void _validateTypes

describe('Phase 103 多模态融合 Entity & 工具函数', () => {
  // ============ ID 生成器 ============
  describe('ID 生成器', () => {
    it('generateFusionTaskId 前缀 fus- 且 36 位字符', () => {
      const id = generateFusionTaskId()
      assert.ok(id.startsWith('fus-'))
      assert.ok(id.length > 10)
    })

    it('generateInsightId 前缀 ins-', () => {
      const id = generateInsightId()
      assert.ok(id.startsWith('ins-'))
    })

    it('generateAnomalyId 前缀 anm-', () => {
      const id = generateAnomalyId()
      assert.ok(id.startsWith('anm-'))
    })

    it('generateReportId 前缀 rpt-', () => {
      const id = generateReportId()
      assert.ok(id.startsWith('rpt-'))
    })

    it('多次调用生成不同 ID', () => {
      const ids = new Set(Array.from({ length: 10 }, () => generateFusionTaskId()))
      assert.equal(ids.size, 10)
    })
  })

  // ============ weightedConfidence ============
  describe('weightedConfidence 加权置信度', () => {
    it('等权重 0.5+0.5 时取中间值', () => {
      const w = weightedConfidence([
        { source: 'image', sourceId: 'a', weight: 0.5, confidence: 0.8, keyFindings: [] },
        { source: 'document', sourceId: 'b', weight: 0.5, confidence: 0.6, keyFindings: [] },
      ])
      assert.equal(w, 0.7)
    })

    it('偏重权重取偏向值', () => {
      const w = weightedConfidence([
        { source: 'image', sourceId: 'a', weight: 0.9, confidence: 0.9, keyFindings: [] },
        { source: 'document', sourceId: 'b', weight: 0.1, confidence: 0.1, keyFindings: [] },
      ])
      assert.ok(Math.abs(w - 0.82) < 1e-10)
    })

    it('空数组返回 0', () => {
      assert.equal(weightedConfidence([]), 0)
    })

    it('权重均为 0 返回 0', () => {
      const w = weightedConfidence([
        { source: 'image', sourceId: 'a', weight: 0, confidence: 0.9, keyFindings: [] },
      ])
      assert.equal(w, 0)
    })
  })

  // ============ calcChangePercent ============
  describe('calcChangePercent 变化百分比', () => {
    it('增长 10%', () => {
      assert.equal(calcChangePercent(110, 100), 10)
    })

    it('下降 10%', () => {
      assert.equal(calcChangePercent(90, 100), -10)
    })

    it('从 0 到非零 => 100%', () => {
      assert.equal(calcChangePercent(100, 0), 100)
    })

    it('0→0 => 0', () => {
      assert.equal(calcChangePercent(0, 0), 0)
    })

    it('负值变化', () => {
      assert.equal(calcChangePercent(-80, -100), 20)
    })

    it('无变化', () => {
      assert.equal(calcChangePercent(50, 50), 0)
    })
  })

  // ============ detectStatisticalAnomalies ============
  describe('detectStatisticalAnomalies Z-Score 异常检测', () => {
    it('正常值中无异常', () => {
      const indices = detectStatisticalAnomalies([10, 11, 9, 10, 12, 11, 10], 2)
      assert.equal(indices.length, 0)
    })

    it('检出离群值位置', () => {
      const values = [10, 11, 9, 10, 12, 50, 11, 10]
      const indices = detectStatisticalAnomalies(values, 2)
      assert.ok(indices.includes(5)) // index 5 = 50
    })

    it('空数组返回空', () => {
      assert.deepEqual(detectStatisticalAnomalies([]), [])
    })

    it('全部相同值无异常', () => {
      const indices = detectStatisticalAnomalies([5, 5, 5, 5, 5], 2)
      assert.equal(indices.length, 0)
    })
  })

  // ============ aggregateSentiment ============
  describe('aggregateSentiment 情感聚合', () => {
    it('positive 平均 > 0.2', () => {
      assert.equal(aggregateSentiment([0.5, 0.6, 0.7]), 'positive')
    })

    it('neutral 在 -0.2 ~ 0.2 之间', () => {
      assert.equal(aggregateSentiment([0, 0, 0]), 'neutral')
      assert.equal(aggregateSentiment([0.1, -0.1, 0.2]), 'neutral')
    })

    it('negative 平均 < -0.2', () => {
      assert.equal(aggregateSentiment([-0.5, -0.6, -0.7]), 'negative')
    })

    it('空数组返回 neutral', () => {
      assert.equal(aggregateSentiment([]), 'neutral')
    })
  })

  // ============ textSimilarity ============
  describe('textSimilarity 文本相似度', () => {
    it('完全相同 => 1', () => {
      assert.equal(textSimilarity('hello', 'hello'), 1)
    })

    it('完全不同 => 按位置匹配比例', () => {
      assert.equal(textSimilarity('hello', 'world'), 0.2) // 1/5
    })

    it('短字符串为前缀', () => {
      assert.equal(textSimilarity('abc', 'abcdef'), 0.5) // 3/6
    })

    it('空字符串 => 0', () => {
      assert.equal(textSimilarity('', 'hello'), 0)
      assert.equal(textSimilarity('hello', ''), 0)
    })
  })

  // ============ FUSION_TEMPLATES ============
  describe('FUSION_TEMPLATES 融合模板', () => {
    it('共 6 个模板', () => {
      assert.equal(FUSION_TEMPLATES.length, 6)
    })

    it('包含完整模板 ID', () => {
      const ids = FUSION_TEMPLATES.map((t) => t.id)
      assert.ok(ids.includes('tpl-shelf-audit'))
      assert.ok(ids.includes('tpl-customer-feedback'))
      assert.ok(ids.includes('tpl-anomaly-detection'))
      assert.ok(ids.includes('tpl-cross-modal-search'))
      assert.ok(ids.includes('tpl-trend-forecast'))
      assert.ok(ids.includes('tpl-compliance-audit'))
    })

    it('每个模板有非空 name/description/defaultTitle', () => {
      for (const t of FUSION_TEMPLATES) {
        assert.ok(t.name.length > 0)
        assert.ok(t.description.length > 0)
        assert.ok(t.defaultTitle.length > 0)
        assert.ok(t.sources.length > 0)
        assert.ok(t.estimatedDurationMs > 0)
      }
    })
  })

  // ============ FUSION_ENGINES ============
  describe('FUSION_ENGINES 融合引擎', () => {
    it('共 5 个引擎', () => {
      assert.equal(FUSION_ENGINES.length, 5)
    })

    it('包含国产模型通义千问和智谱', () => {
      const types = FUSION_ENGINES.map((e) => e.type)
      assert.ok(types.includes('mock-qwen-vl'))
      assert.ok(types.includes('mock-glm-4v'))
      assert.ok(types.includes('mock-minimax-vl'))
    })

    it('GPT-4 支持 image+document', () => {
      const gpt4 = FUSION_ENGINES.find((e) => e.type === 'mock-gpt4-multimodal')
      assert.ok(gpt4)
      assert.equal(gpt4!.supportsImage, true)
      assert.equal(gpt4!.supportsDocument, true)
    })

    it('qwen-vl 支持全部模态', () => {
      const qwen = FUSION_ENGINES.find((e) => e.type === 'mock-qwen-vl')
      assert.ok(qwen)
      assert.equal(qwen!.supportsImage, true)
      assert.equal(qwen!.supportsDocument, true)
      assert.equal(qwen!.supportsAudio, true)
      assert.equal(qwen!.supportsVideo, true)
    })

    it('每个引擎有正数的 avgLatencyMs / costPerCallCny', () => {
      for (const e of FUSION_ENGINES) {
        assert.ok(e.avgLatencyMs > 0)
        assert.ok(e.costPerCallCny >= 0)
      }
    })
  })
})
