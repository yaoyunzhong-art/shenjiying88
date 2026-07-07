import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 94 智能分析 DTO 测试 (V10 Sprint 2 Day 28)
 *
 * 覆盖:
 * - GenerateInsightRequest 结构校验 (3)
 * - ListInsightRequest 结构校验 (2)
 * - InsightResponse 结构校验 (2)
 * - ListInsightResponse 结构校验 (1)
 * - TemplateInfo 结构校验 (1)
 * - toInsightResponse 转换函数 (3)
 */

import assert from 'node:assert/strict'
import {
  toInsightResponse,
} from './insight.dto'
import type {
  GenerateInsightRequest,
  ListInsightRequest,
  InsightResponse,
  ListInsightResponse,
  TemplateInfo,
} from './insight.dto'
import type { InsightReport } from './insight.entity'

// ─── 工具: 构造最小 report ──────────────────────────────────
function makeReport(overrides: Partial<InsightReport> = {}): InsightReport {
  return {
    id: 'insight-001',
    tenantId: 'tenant-A',
    storeId: 'store-001',
    templateType: 'sales',
    status: 'completed',
    prompt: 'test prompt',
    content: '## 关键发现\n- test',
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

function makeSourceSnapshot() {
  return [
    {
      type: 'report' as const,
      refId: 'r1',
      dataSnapshot: { revenue: 100 },
      period: { from: '2026-06-01', to: '2026-06-28' },
    },
  ]
}

describe('Phase 94 Insight DTO', () => {
  // ─── 1. GenerateInsightRequest ──────────────────────────
  describe('1. GenerateInsightRequest', () => {
    it('1.1 最小合法请求', () => {
      const req: GenerateInsightRequest = {
        templateType: 'sales',
        sources: [{
          type: 'report',
          refId: 'report-001',
          dataSnapshot: { revenue: 100000 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
      }
      assert.equal(req.templateType, 'sales')
      assert.equal(req.sources.length, 1)
      assert.equal(req.force, undefined)
    })

    it('1.2 带所有可选字段的请求', () => {
      const req: GenerateInsightRequest = {
        templateType: 'inventory',
        sources: makeSourceSnapshot(),
        force: true,
        maxTokens: 2048,
      }
      assert.equal(req.force, true)
      assert.equal(req.maxTokens, 2048)
    })

    it('1.3 多数据源请求', () => {
      const req: GenerateInsightRequest = {
        templateType: 'finance',
        sources: [
          { type: 'report', refId: 'r1', dataSnapshot: { rev: 100 }, period: { from: 'a', to: 'b' } },
          { type: 'canary', refId: 'r2', dataSnapshot: { rev: 200 }, period: { from: 'c', to: 'd' } },
          { type: 'monitoring', refId: 'r3', dataSnapshot: { rev: 300 }, period: { from: 'e', to: 'f' } },
        ],
      }
      assert.equal(req.sources.length, 3)
      assert.equal(req.sources[1].type, 'canary')
      assert.equal(req.sources[2].refId, 'r3')
    })
  })

  // ─── 2. ListInsightRequest ────────────────────────────
  describe('2. ListInsightRequest', () => {
    it('2.1 空过滤条件', () => {
      const req: ListInsightRequest = {}
      assert.equal(req.templateType, undefined)
      assert.equal(req.status, undefined)
    })

    it('2.2 全部过滤条件', () => {
      const req: ListInsightRequest = {
        templateType: 'sales',
        status: 'completed',
        limit: 10,
        cursor: '20',
      }
      assert.equal(req.limit, 10)
      assert.equal(req.cursor, '20')
    })
  })

  // ─── 3. InsightResponse ────────────────────────────────
  describe('3. InsightResponse', () => {
    it('3.1 完整响应结构', () => {
      const res: InsightResponse = {
        id: 'insight-001',
        tenantId: 'tenant-A',
        templateType: 'sales',
        status: 'completed',
        content: '## 发现',
        modelId: 'gpt-4o',
        tokenUsage: { prompt: 50, completion: 30, total: 80 },
        sources: [{ type: 'report', refId: 'r1', period: { from: 'a', to: 'b' } }],
        error: undefined,
        createdAt: '2026-06-28T00:00:00.000Z',
        completedAt: '2026-06-28T00:00:05.000Z',
        createdBy: 'admin',
        cached: false,
      }
      assert.equal(res.tenantId, 'tenant-A')
      assert.equal(res.cached, false)
      assert.equal(res.sources.length, 1)
    })

    it('3.2 completedAt 和 error 可选', () => {
      const pending: InsightResponse = {
        id: 'i002', tenantId: 't', templateType: 'sales', status: 'pending',
        content: undefined, modelId: 'gpt', sources: [],
        createdAt: 'now', createdBy: 'me', cached: false,
      }
      assert.equal(pending.completedAt, undefined)
      assert.equal(pending.error, undefined)
    })
  })

  // ─── 4. ListInsightResponse ────────────────────────────
  describe('4. ListInsightResponse', () => {
    it('4.1 带分页的响应', () => {
      const res: ListInsightResponse = {
        items: [
          { id: 'i1', tenantId: 't', templateType: 'sales', status: 'completed', modelId: 'gpt', sources: [], createdAt: 'now', createdBy: 'me', cached: false },
          { id: 'i2', tenantId: 't', templateType: 'inventory', status: 'completed', modelId: 'gpt', sources: [], createdAt: 'now', createdBy: 'me', cached: false },
        ],
        total: 10,
        nextCursor: '2',
      }
      assert.equal(res.items.length, 2)
      assert.equal(res.total, 10)
      assert.equal(res.nextCursor, '2')
    })
  })

  // ─── 5. TemplateInfo ──────────────────────────────────
  describe('5. TemplateInfo', () => {
    it('5.1 完整结构', () => {
      const info: TemplateInfo = {
        type: 'sales',
        name: '销售洞察',
        description: '分析销售数据',
        maxTokens: 1024,
        temperature: 0.3,
      }
      assert.equal(info.type, 'sales')
      assert.equal(info.temperature, 0.3)
    })
  })

  // ─── 6. toInsightResponse ──────────────────────────────
  describe('6. toInsightResponse 转换函数', () => {
    it('6.1 完成状态转换 (cached=false)', () => {
      const report = makeReport({
        sources: [
          { type: 'report', refId: 'r1', dataSnapshot: { k: 'v' }, period: { from: 'a', to: 'b' } },
        ],
      })
      const res = toInsightResponse(report, false)
      assert.equal(res.id, 'insight-001')
      assert.equal(res.status, 'completed')
      assert.equal(res.cached, false)
      assert.deepEqual(res.tokenUsage, { prompt: 50, completion: 30, total: 80 })
      // 确认 dataSnapshot 已脱敏 (sources 不包含 dataSnapshot)
      assert.equal((res.sources[0] as any).dataSnapshot, undefined)
    })

    it('6.2 缓存命中标记', () => {
      const report = makeReport()
      const res = toInsightResponse(report, true)
      assert.equal(res.cached, true)
    })

    it('6.3 pending 状态无 content/completedAt', () => {
      const report = makeReport({ status: 'pending', content: undefined, completedAt: undefined })
      const res = toInsightResponse(report, false)
      assert.equal(res.status, 'pending')
      assert.equal(res.content, undefined)
      assert.equal(res.completedAt, undefined)
    })
  })
})
