import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * Phase 94 InsightController 单元测试 (node:test)
 *
 * 策略: 直接实例化 Controller + Mock Service
 * 覆盖: 5 个路由端点（正例 + 反例 + 边界）
 *
 * 路由:
 * - POST /insight/generate        生成洞察
 * - GET  /insight/list            列表查询
 * - GET  /insight/templates       模板列表
 * - GET  /insight/:id             按 ID 查询
 * - POST /insight/cache/prune     清理过期缓存
 */

import assert from 'node:assert/strict'
import { InsightController } from './insight.controller'
import type { InsightService } from './insight.service'
import type { InsightResponse } from './insight.dto'

// ── Mock InsightService ──────────────────────────────────────────
class MockInsightService {
  private readonly insights = new Map<string, InsightResponse>()
  private nextId = 0

  async generate(req: any): Promise<InsightResponse> {
    if (!req.sources || req.sources.length === 0) {
      throw new Error('At least one source is required')
    }
    if (req.sources.length > 10) {
      throw new Error('Max 10 sources per insight')
    }
    const id = `ins-mock-${++this.nextId}`
    const report: InsightResponse = {
      id,
      tenantId: 'tenant-001',
      templateType: req.templateType,
      status: 'completed',
      content: '## 关键发现\n- 模拟洞察内容\n',
      modelId: 'mock-model',
      tokenUsage: { prompt: 120, completion: 80, total: 200 },
      sources: req.sources.map((s: any) => ({
        type: s.type,
        refId: s.refId,
        period: s.period,
      })),
      createdAt: '2026-06-28T07:38:00.000Z',
      completedAt: '2026-06-28T07:38:02.000Z',
      createdBy: 'test-user',
      cached: false,
    }
    this.insights.set(id, report)
    return report
  }

  async list(req: any) {
    const items = Array.from(this.insights.values())
    const filtered = req.templateType
      ? items.filter((i) => i.templateType === req.templateType)
      : items
    const limit = Math.min(req.limit ?? 20, 100)
    const startIdx = req.cursor ? Number(req.cursor) : 0
    const paged = filtered.slice(startIdx, startIdx + limit)
    return {
      items: paged,
      total: filtered.length,
      nextCursor:
        startIdx + limit < filtered.length
          ? String(startIdx + limit)
          : undefined,
    }
  }

  async getById(id: string): Promise<InsightResponse> {
    const report = this.insights.get(id)
    if (!report) throw new Error(`Insight ${id} not found`)
    return report
  }

  getTemplates() {
    return {
      items: [
        { type: 'sales', name: '销售洞察', description: '销售数据分析' },
        { type: 'inventory', name: '库存洞察', description: '库存数据分析' },
        { type: 'finance', name: '财务洞察', description: '财务数据分析' },
        { type: 'marketing', name: '营销洞察', description: '营销数据分析' },
        { type: 'customer', name: '客户洞察', description: '客户数据分析' },
      ],
    }
  }

  pruneExpiredCache(): number {
    return 3
  }
}

function createController() {
  const mockService = new MockInsightService()
  // NestJS Controller 接收 service 注入,这里直接传 mock
  const controller = new InsightController(mockService as unknown as InsightService)
  return { controller, mockService }
}

describe('[D] InsightController 单元测试', () => {
  let ctx: ReturnType<typeof createController>

  beforeEach(() => {
    ctx = createController()
  })

  // ── POST /insight/generate ────────────────────────────────────
  describe('POST /insight/generate', () => {
    it('正向: 生成销售洞察成功', async () => {
      const { controller } = ctx
      const result = await controller.generate({
        templateType: 'sales',
        sources: [{
          type: 'report',
          refId: 'rpt-001',
          dataSnapshot: { revenue: 10000 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
      })
      assert.ok(result.id.startsWith('ins-mock-'))
      assert.equal(result.templateType, 'sales')
      assert.equal(result.status, 'completed')
      assert.ok(result.content!.includes('模拟洞察'))
      assert.equal(result.sources.length, 1)
    })

    it('正向: 支持 force 重新生成', async () => {
      const { controller } = ctx
      const result = await controller.generate({
        templateType: 'inventory',
        sources: [{
          type: 'report',
          refId: 'rpt-002',
          dataSnapshot: { items: 500 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
        force: true,
      })
      assert.equal(result.templateType, 'inventory')
      assert.ok(result.content)
    })

    it('正向: 支持自定义 maxTokens', async () => {
      const { controller } = ctx
      const result = await controller.generate({
        templateType: 'customer',
        sources: [{
          type: 'monitoring',
          refId: 'mon-001',
          dataSnapshot: { users: 1000 },
          period: { from: '2026-06-01', to: '2026-06-28' },
        }],
        maxTokens: 2048,
      })
      assert.equal(result.templateType, 'customer')
      assert.ok(result.tokenUsage)
    })

    it('反例: 空 sources 报错', async () => {
      const { controller } = ctx
      await assert.rejects(
        () => controller.generate({ templateType: 'sales', sources: [] }),
        { message: 'At least one source is required' },
      )
    })

    it('反例: 超过 10 个 sources 报错', async () => {
      const { controller } = ctx
      const sources = Array.from({ length: 11 }, (_, i) => ({
        type: 'report' as const,
        refId: `rpt-${i}`,
        dataSnapshot: {},
        period: { from: '2026-06-01', to: '2026-06-28' },
      }))
      await assert.rejects(
        () => controller.generate({ templateType: 'finance', sources }),
        { message: 'Max 10 sources per insight' },
      )
    })

    it('边界: sources 刚好 10 个通过', async () => {
      const { controller } = ctx
      const sources = Array.from({ length: 10 }, (_, i) => ({
        type: 'report',
        refId: `rpt-${i}`,
        dataSnapshot: { idx: i },
        period: { from: '2026-06-01', to: '2026-06-28' },
      }))
      const result = await controller.generate({ templateType: 'marketing', sources } as any)
      assert.equal(result.sources.length, 10)
    })

    it('边界: 各种 templateType 都支持', async () => {
      const { controller } = ctx
      for (const tt of ['sales', 'inventory', 'finance', 'marketing', 'customer'] as const) {
        const result = await controller.generate({
          templateType: tt,
          sources: [{
            type: 'report', refId: `rpt-${tt}`, dataSnapshot: {}, period: { from: 'a', to: 'b' },
          }],
        })
        assert.equal(result.templateType, tt)
      }
    })
  })

  // ── GET /insight/list ─────────────────────────────────────────
  describe('GET /insight/list', () => {
    it('正向: 空列表返回空数组', async () => {
      const { controller } = ctx
      const result = await controller.list()
      assert.deepEqual(result.items, [])
      assert.equal(result.total, 0)
    })

    it('正向: 有数据时正确返回', async () => {
      const { controller, mockService } = ctx
      await mockService.generate({ templateType: 'sales', sources: [{ type: 'report', refId: 'rpt-001', dataSnapshot: {}, period: { from: 'a', to: 'b' } }] })
      await mockService.generate({ templateType: 'inventory', sources: [{ type: 'report', refId: 'rpt-002', dataSnapshot: {}, period: { from: 'a', to: 'b' } }] })
      const result = await controller.list()
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('正向: 按 templateType 过滤', async () => {
      const { controller, mockService } = ctx
      await mockService.generate({ templateType: 'sales', sources: [{ type: 'report', refId: 'rpt-001', dataSnapshot: {}, period: { from: 'a', to: 'b' } }] })
      await mockService.generate({ templateType: 'finance', sources: [{ type: 'report', refId: 'rpt-002', dataSnapshot: {}, period: { from: 'a', to: 'b' } }] })
      const result = await controller.list('sales')
      assert.equal(result.total, 1)
      assert.equal(result.items[0].templateType, 'sales')
    })

    it('边界: 使用 cursor 分页', async () => {
      const { controller, mockService } = ctx
      for (let i = 0; i < 5; i++) {
        await mockService.generate({ templateType: 'sales', sources: [{ type: 'report', refId: `rpt-${i}`, dataSnapshot: { idx: i }, period: { from: 'a', to: 'b' } }] })
      }
      const page1 = await controller.list(undefined, undefined, '2')
      assert.equal(page1.items.length, 2)
      assert.ok(page1.nextCursor)

      const page2 = await controller.list(undefined, undefined, '2', page1.nextCursor)
      assert.equal(page2.items.length, 2)
      assert.ok(page2.nextCursor)
    })

    it('边界: limit 传空字符串时使用默认值', async () => {
      const { controller, mockService } = ctx
      await mockService.generate({ templateType: 'sales', sources: [{ type: 'report', refId: 'rpt-001', dataSnapshot: {}, period: { from: 'a', to: 'b' } }] })
      const result = await controller.list(undefined, undefined, '')
      assert.equal(result.total, 1)
    })
  })

  // ── GET /insight/templates ────────────────────────────────────
  describe('GET /insight/templates', () => {
    it('正向: 返回 5 个模板', async () => {
      const { controller } = ctx
      const result = await controller.getTemplates()
      assert.ok(result.items)
      assert.equal(result.items.length, 5)
      const types = result.items.map((t: any) => t.type)
      assert.ok(types.includes('sales'))
      assert.ok(types.includes('inventory'))
      assert.ok(types.includes('finance'))
      assert.ok(types.includes('marketing'))
      assert.ok(types.includes('customer'))
    })

    it('正向: 每个模板有 name 和 description', async () => {
      const { controller } = ctx
      const result = await controller.getTemplates()
      for (const t of result.items) {
        assert.ok(typeof t.name === 'string', `template ${t.type} 缺 name`)
        assert.ok(t.name.length > 0, `template ${t.type} name 为空`)
        assert.ok(typeof t.description === 'string', `template ${t.type} 缺 description`)
      }
    })
  })

  // ── GET /insight/:id ──────────────────────────────────────────
  describe('GET /insight/:id', () => {
    it('正向: 按 ID 查询已存在的洞察', async () => {
      const { controller, mockService } = ctx
      const created = await mockService.generate({ templateType: 'sales', sources: [{ type: 'report', refId: 'rpt-001', dataSnapshot: {}, period: { from: 'a', to: 'b' } }] })
      const result = await controller.getById(created.id)
      assert.equal(result.id, created.id)
      assert.equal(result.status, 'completed')
    })

    it('正向: 返回完整的 tokenUsage', async () => {
      const { controller, mockService } = ctx
      const created = await mockService.generate({ templateType: 'finance', sources: [{ type: 'report', refId: 'rpt-002', dataSnapshot: { cost: 5000 }, period: { from: 'a', to: 'b' } }] })
      const result = await controller.getById(created.id)
      assert.ok(result.tokenUsage)
      assert.equal(result.tokenUsage!.prompt + result.tokenUsage!.completion, result.tokenUsage!.total)
    })

    it('反例: 不存在的 ID 抛错', async () => {
      const { controller } = ctx
      await assert.rejects(
        () => controller.getById('non-existent-id'),
        { message: /not found/ },
      )
    })
  })

  // ── POST /insight/cache/prune ─────────────────────────────────
  describe('POST /insight/cache/prune', () => {
    it('正向: 清理过期缓存返回数量', async () => {
      const { controller } = ctx
      const result = await controller.pruneCache()
      assert.equal(result.pruned, 3)
      assert.ok(result.ts)
    })

    it('正向: 返回 ISO 时间戳', async () => {
      const { controller } = ctx
      const result = await controller.pruneCache()
      assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.ts),
        `ts 格式不对: ${result.ts}`)
    })

    it('边界: 多次调用返回相同格式', async () => {
      const { controller } = ctx
      const r1 = await controller.pruneCache()
      const r2 = await controller.pruneCache()
      assert.equal(r1.pruned, 3)
      assert.equal(r2.pruned, 3)
      assert.ok(typeof r1.ts === 'string')
    })
  })
})
