import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * Phase 94 智能分析 Entity 测试 (V10 Sprint 2 Day 28)
 *
 * 覆盖:
 * - InsightReport 结构 (1)
 * - InsightSource 结构 (1)
 * - InsightTemplate 结构 (1)
 * - BUILTIN_INSIGHT_TEMPLATES 完整性与一致性 (5)
 * - buildInsightCacheKey 归约 (2)
 * - hashSources 稳定性与排序无关性 (3)
 * - 边界: 空 sources、重复字段变异
 */

import assert from 'node:assert/strict'
import {
  BUILTIN_INSIGHT_TEMPLATES,
  buildInsightCacheKey,
  hashSources,
} from './insight.entity'
import type {
  InsightReport,
  InsightSource,
  InsightTemplate,
  InsightStatus,
  InsightTemplateType,
} from './insight.entity'

// ─── 工具: 构造最小 report ──────────────────────────────────
function makeReport(overrides: Partial<InsightReport> = {}): InsightReport {
  return {
    id: 'insight-001',
    tenantId: 'tenant-A',
    storeId: 'store-001',
    templateType: 'sales',
    status: 'completed',
    prompt: 'test prompt',
    content: '## 发现\n- test',
    tokenUsage: { prompt: 50, completion: 30, total: 80 },
    modelId: 'gpt-4o',
    sources: [],
    createdAt: '2026-06-28T00:00:00.000Z',
    completedAt: '2026-06-28T00:00:05.000Z',
    createdBy: 'admin',
    cacheTtlSec: 86400,
    ...overrides,
  }
}

function makeSource(overrides: Partial<InsightSource> = {}): InsightSource {
  return {
    type: 'report',
    refId: 'report-001',
    dataSnapshot: { revenue: 100000 },
    period: { from: '2026-06-01', to: '2026-06-28' },
    ...overrides,
  }
}

describe('Phase 94 Insight Entity', () => {
  // ─── 1. InsightReport 结构 ────────────────────────────────
  describe('1. InsightReport', () => {
    it('1.1 完整 report 包含所有必填字段', () => {
      const r = makeReport()
      assert.equal(r.id, 'insight-001')
      assert.equal(r.tenantId, 'tenant-A')
      assert.equal(r.templateType, 'sales')
      assert.equal(r.status, 'completed')
      assert.equal(typeof r.prompt, 'string')
      assert.equal(typeof r.content, 'string')
      assert.equal(typeof r.cacheTtlSec, 'number')
      assert.ok(r.createdAt)
      assert.ok(r.createdBy)
    })

    it('1.2 status 只能是合法枚举值', () => {
      const valid: InsightStatus[] = ['pending', 'generating', 'completed', 'failed']
      for (const s of valid) {
        const r = makeReport({ status: s })
        assert.equal(r.status, s)
      }
    })

    it('1.3 templateType 只能是合法枚举值', () => {
      const valid: InsightTemplateType[] = ['sales', 'inventory', 'finance', 'marketing', 'customer']
      for (const t of valid) {
        const r = makeReport({ templateType: t })
        assert.equal(r.templateType, t)
      }
    })
  })

  // ─── 2. InsightSource 结构 ────────────────────────────────
  describe('2. InsightSource', () => {
    it('2.1 完整 source 包含所有必填字段', () => {
      const s = makeSource()
      assert.equal(s.type, 'report')
      assert.equal(s.refId, 'report-001')
      assert.deepEqual(s.dataSnapshot, { revenue: 100000 })
      assert.equal(s.period.from, '2026-06-01')
      assert.equal(s.period.to, '2026-06-28')
    })

    it('2.2 type 支持所有数据源类型', () => {
      const types: InsightSource['type'][] = ['report', 'canary', 'monitoring']
      for (const t of types) {
        const s = makeSource({ type: t })
        assert.equal(s.type, t)
      }
    })
  })

  // ─── 3. InsightTemplate 结构 ──────────────────────────────
  describe('3. InsightTemplate', () => {
    it('3.1 完整 template 包含所有字段', () => {
      const t: InsightTemplate = {
        type: 'sales',
        name: '销售洞察',
        description: 'desc',
        systemPrompt: 'system',
        userPromptTemplate: '{data}',
        maxTokens: 1024,
        temperature: 0.3,
      }
      assert.equal(t.type, 'sales')
      assert.equal(t.maxTokens, 1024)
      assert.ok(t.temperature >= 0 && t.temperature <= 1)
    })
  })

  // ─── 4. BUILTIN_INSIGHT_TEMPLATES ──────────────────────────
  describe('4. 内置模板完整性', () => {
    it('4.1 刚好 5 个模板', () => {
      assert.equal(BUILTIN_INSIGHT_TEMPLATES.length, 5)
    })

    it('4.2 每个模板 type 唯一', () => {
      const types = BUILTIN_INSIGHT_TEMPLATES.map((t) => t.type)
      assert.equal(new Set(types).size, types.length)
    })

    it('4.3 每个模板包含 {data} 占位符', () => {
      for (const t of BUILTIN_INSIGHT_TEMPLATES) {
        assert.ok(
          t.userPromptTemplate.includes('{data}'),
          `Template ${t.type} missing {data} placeholder`,
        )
      }
    })

    it('4.4 每个模板 temperature 在 [0,1]', () => {
      for (const t of BUILTIN_INSIGHT_TEMPLATES) {
        assert.ok(t.temperature >= 0 && t.temperature <= 1)
      }
    })

    it('4.5 每个模板 maxTokens 为正整数', () => {
      for (const t of BUILTIN_INSIGHT_TEMPLATES) {
        assert.ok(Number.isInteger(t.maxTokens) && t.maxTokens > 0)
      }
    })
  })

  // ─── 5. buildInsightCacheKey ──────────────────────────────
  describe('5. buildInsightCacheKey', () => {
    it('5.1 相同参数产生相同 key', () => {
      const a = buildInsightCacheKey('tenant-A', 'sales', 'abc123')
      const b = buildInsightCacheKey('tenant-A', 'sales', 'abc123')
      assert.equal(a, b)
    })

    it('5.2 不同参数产生不同 key', () => {
      const a = buildInsightCacheKey('tenant-A', 'sales', 'abc')
      const b = buildInsightCacheKey('tenant-A', 'inventory', 'abc')
      assert.notEqual(a, b)
    })
  })

  // ─── 6. hashSources ─────────────────────────────────────
  describe('6. hashSources', () => {
    it('6.1 稳定哈希 (相同 sources 产生相同结果)', () => {
      const a = hashSources([makeSource()])
      const b = hashSources([makeSource()])
      assert.equal(a, b)
    })

    it('6.2 排序无关 (不同顺序 sources 产生相同 hash)', () => {
      const s1 = makeSource({ refId: 'r1' })
      const s2 = makeSource({ refId: 'r2' })
      const a = hashSources([s1, s2])
      const b = hashSources([s2, s1])
      assert.equal(a, b)
    })

    it('6.3 空 sources 返回有效 8 位 hex', () => {
      const h = hashSources([])
      assert.equal(typeof h, 'string')
      assert.equal(h.length, 8)
      assert.ok(/^[0-9a-f]{8}$/.test(h))
    })
  })
})
