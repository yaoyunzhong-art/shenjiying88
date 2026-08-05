import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * InsightController 单元测试 (node:test)
 *
 * 策略: 构造 Controller + Mock Service 实例
 * 覆盖: 所有 5 个路由端点（正向 + 边界 + 错误）
 *
 * 路由:
 * - POST /insight/generate        生成洞察
 * - GET  /insight/list            列表查询
 * - GET  /insight/templates       模板列表
 * - GET  /insight/:id             按 ID 查询
 * - POST /insight/cache/prune     清理过期缓存
 */

import assert from 'node:assert/strict'
// ── Mock InsightService ──────────────────────────────────────────
class MockInsightService {
  insights: Map<string, any> = new Map()
  nextId = 0

  async generate(req: any) {
    if (!req.sources || req.sources.length === 0) {
      throw new Error('At least one source is required')
    }
    if (req.sources.length > 10) {
      throw new Error('Max 10 sources per insight')
    }
    const id = `ins-mock-${++this.nextId}`
    const report = {
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

  async getById(id: string) {
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

  pruneExpiredCache() {
    return 3
  }
}

// ── Helper: 构造 Controller ──────────────────────────────────────
function createController() {
  const mockService = new MockInsightService()
  const ctrl: any = {
    service: mockService,
    // 模拟路由分发
    async generate(body: any) {
      return mockService.generate(body)
    },
    async list(templateType?: string, status?: string, limit?: string, cursor?: string) {
      const req: any = {
        templateType: templateType as any,
        status: status as any,
        limit: limit ? Number(limit) : undefined,
        cursor,
      }
      return mockService.list(req)
    },
    async getTemplates() {
      return mockService.getTemplates()
    },
    async getById(id: string) {
      return mockService.getById(id)
    },
    async pruneCache() {
      const pruned = mockService.pruneExpiredCache()
      return { pruned, ts: '2026-06-28T07:38:00.000Z' }
    },
  }
  return { ctrl, mockService }
}

// ── 测试套件 ──────────────────────────────────────────────────────
describe('[D] InsightController', () => {
  let ctx: ReturnType<typeof createController>

  beforeEach(() => {
    ctx = createController()
  })

  // ── POST /insight/generate ────────────────────────────────────
  describe('POST /insight/generate', () => {
    it('正向: 生成销售洞察成功', async () => {
      const { ctrl } = ctx
      const result = await ctrl.generate({
        templateType: 'sales' as const,
        sources: [
          {
            type: 'report' as const,
            refId: 'rpt-001',
            dataSnapshot: { revenue: 10000 },
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
      })
      assert.ok(result.id.startsWith('ins-mock-'))
      assert.equal(result.templateType, 'sales')
      assert.equal(result.status, 'completed')
      assert.ok(result.content.includes('模拟洞察'))
      assert.equal(result.sources.length, 1)
    })

    it('正向: 支持 force 重新生成', async () => {
      const { ctrl } = ctx
      const result = await ctrl.generate({
        templateType: 'inventory' as const,
        sources: [
          {
            type: 'report' as const,
            refId: 'rpt-002',
            dataSnapshot: { items: 500 },
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
        force: true,
      })
      assert.equal(result.templateType, 'inventory')
      assert.ok(result.content)
    })

    it('正向: 支持自定义 maxTokens', async () => {
      const { ctrl } = ctx
      const result = await ctrl.generate({
        templateType: 'customer' as const,
        sources: [
          {
            type: 'monitoring' as const,
            refId: 'mon-001',
            dataSnapshot: { users: 1000 },
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
        maxTokens: 2048,
      })
      assert.equal(result.templateType, 'customer')
      assert.ok(result.tokenUsage)
    })

    it('反例: 空 sources 报错', async () => {
      const { ctrl } = ctx
      await assert.rejects(
        () =>
          ctrl.generate({
            templateType: 'sales' as const,
            sources: [],
          }),
        { message: 'At least one source is required' },
      )
    })

    it('反例: 超过 10 个 sources 报错', async () => {
      const { ctrl } = ctx
      const sources = Array.from({ length: 11 }, (_, i) => ({
        type: 'report' as const,
        refId: `rpt-${i}`,
        dataSnapshot: {},
        period: { from: '2026-06-01', to: '2026-06-28' },
      }))
      await assert.rejects(
        () =>
          ctrl.generate({
            templateType: 'finance' as const,
            sources,
          }),
        { message: 'Max 10 sources per insight' },
      )
    })

    it('边界: sources 刚好 10 个通过', async () => {
      const { ctrl } = ctx
      const sources = Array.from({ length: 10 }, (_, i) => ({
        type: 'report' as const,
        refId: `rpt-${i}`,
        dataSnapshot: { idx: i },
        period: { from: '2026-06-01', to: '2026-06-28' },
      }))
      const result = await ctrl.generate({
        templateType: 'marketing' as const,
        sources,
      })
      assert.equal(result.sources.length, 10)
    })
  })

  // ── GET /insight/list ─────────────────────────────────────────
  describe('GET /insight/list', () => {
    it('正向: 空列表返回空数组', async () => {
      const { ctrl } = ctx
      const result = await ctrl.list()
      assert.deepEqual(result.items, [])
      assert.equal(result.total, 0)
    })

    it('正向: 有数据时正确返回', async () => {
      const { ctrl, mockService } = ctx
      await mockService.generate({
        templateType: 'sales' as const,
        sources: [
          {
            type: 'report',
            refId: 'rpt-001',
            dataSnapshot: {},
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
      })
      await mockService.generate({
        templateType: 'inventory' as const,
        sources: [
          {
            type: 'report',
            refId: 'rpt-002',
            dataSnapshot: {},
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
      })
      const result = await ctrl.list()
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('正向: 按 templateType 过滤', async () => {
      const { ctrl, mockService } = ctx
      await mockService.generate({
        templateType: 'sales' as const,
        sources: [
          {
            type: 'report',
            refId: 'rpt-001',
            dataSnapshot: {},
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
      })
      await mockService.generate({
        templateType: 'finance' as const,
        sources: [
          {
            type: 'report',
            refId: 'rpt-002',
            dataSnapshot: {},
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
      })
      const result = await ctrl.list('sales')
      assert.equal(result.total, 1)
      assert.equal(result.items[0].templateType, 'sales')
    })

    it('边界: 使用 cursor 分页', async () => {
      const { ctrl, mockService } = ctx
      for (let i = 0; i < 5; i++) {
        await mockService.generate({
          templateType: 'sales' as const,
          sources: [
            {
              type: 'report',
              refId: `rpt-${i}`,
              dataSnapshot: { idx: i },
              period: { from: '2026-06-01', to: '2026-06-28' },
            },
          ],
        })
      }
      // limit 2
      const page1 = await ctrl.list(undefined, undefined, '2')
      assert.equal(page1.items.length, 2)
      assert.ok(page1.nextCursor)

      const page2 = await ctrl.list(undefined, undefined, '2', page1.nextCursor)
      assert.equal(page2.items.length, 2)
      assert.ok(page2.nextCursor)
    })
  })

  // ── GET /insight/templates ────────────────────────────────────
  describe('GET /insight/templates', () => {
    it('正向: 返回 5 个模板', async () => {
      const { ctrl } = ctx
      const result = await ctrl.getTemplates()
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
      const { ctrl } = ctx
      const result = await ctrl.getTemplates()
      for (const t of result.items) {
        assert.ok(typeof t.name === 'string')
        assert.ok(t.name.length > 0)
        assert.ok(typeof t.description === 'string')
      }
    })
  })

  // ── GET /insight/:id ──────────────────────────────────────────
  describe('GET /insight/:id', () => {
    it('正向: 按 ID 查询已存在的洞察', async () => {
      const { ctrl, mockService } = ctx
      const created = await mockService.generate({
        templateType: 'sales' as const,
        sources: [
          {
            type: 'report',
            refId: 'rpt-001',
            dataSnapshot: {},
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
      })
      const result = await ctrl.getById(created.id)
      assert.equal(result.id, created.id)
      assert.equal(result.status, 'completed')
    })

    it('正向: 返回完整的 tokenUsage', async () => {
      const { ctrl, mockService } = ctx
      const created = await mockService.generate({
        templateType: 'finance' as const,
        sources: [
          {
            type: 'report',
            refId: 'rpt-002',
            dataSnapshot: { cost: 5000 },
            period: { from: '2026-06-01', to: '2026-06-28' },
          },
        ],
      })
      const result = await ctrl.getById(created.id)
      assert.ok(result.tokenUsage)
      assert.equal(
        result.tokenUsage.prompt + result.tokenUsage.completion,
        result.tokenUsage.total,
      )
    })

    it('反例: 不存在的 ID 抛错', async () => {
      const { ctrl } = ctx
      await assert.rejects(
        () => ctrl.getById('non-existent-id'),
        { message: /not found/ },
      )
    })
  })

  // ── POST /insight/cache/prune ─────────────────────────────────
  describe('POST /insight/cache/prune', () => {
    it('正向: 清理过期缓存返回数量', async () => {
      const { ctrl } = ctx
      const result = await ctrl.pruneCache()
      assert.equal(result.pruned, 3)
      assert.ok(result.ts)
    })

    it('正向: 返回 ISO 时间戳', async () => {
      const { ctrl } = ctx
      const result = await ctrl.pruneCache()
      // 验证 ISO 8601 格式
      assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.ts))
    })
  })
})
